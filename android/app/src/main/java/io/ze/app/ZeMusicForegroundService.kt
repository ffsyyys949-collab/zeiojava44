package io.ze.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle
import androidx.media.session.MediaButtonReceiver
import java.net.URL
import java.util.concurrent.Executors

/**
 * Spotify-style Foreground Service + MediaSessionCompat for ZE.io Music.
 * Keeps music playing in the background / screen off, shows Cover, Title, Artist,
 * and working Prev / Pause-Play / Next buttons in notification bar & lockscreen.
 */
class ZeMusicForegroundService : Service() {

    companion object {
        const val ACTION_UPDATE = "io.ze.app.MUSIC_UPDATE"
        const val ACTION_TOGGLE = "io.ze.app.MUSIC_TOGGLE"
        const val ACTION_NEXT = "io.ze.app.MUSIC_NEXT"
        const val ACTION_PREV = "io.ze.app.MUSIC_PREV"
        const val ACTION_STOP = "io.ze.app.MUSIC_STOP"
        const val ACTION_CONTROL_BROADCAST = "io.ze.app.MUSIC_CONTROL_EVENT"

        const val EXTRA_TITLE = "title"
        const val EXTRA_ARTIST = "artist"
        const val EXTRA_COVER = "cover"
        const val EXTRA_AUDIO_URL = "audio_url"
        const val EXTRA_IS_PLAYING = "is_playing"

        private const val CHANNEL_ID = "ze_music_playback"
        private const val NOTIFICATION_ID = 5001
        private const val TAG = "ZeMusicService"
    }

    private lateinit var mediaSession: MediaSessionCompat
    private var mediaPlayer: MediaPlayer? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val imageExecutor = Executors.newSingleThreadExecutor()

    private var currentTitle: String = "ZE.io Music"
    private var currentArtist: String = "ZE.io Audio"
    private var currentCoverUrl: String = ""
    private var currentAudioUrl: String = ""
    private var currentCoverBitmap: Bitmap? = null
    private var isPlayingState: Boolean = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ZEio::MusicWakeLock")

        mediaSession = MediaSessionCompat(this, "ZEioMusicSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    dispatchControlToWeb("play")
                }

                override fun onPause() {
                    dispatchControlToWeb("pause")
                }

                override fun onSkipToNext() {
                    dispatchControlToWeb("next")
                }

                override fun onSkipToPrevious() {
                    dispatchControlToWeb("prev")
                }

                override fun onStop() {
                    stopPlaybackAndService()
                }
            })
            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        MediaButtonReceiver.handleIntent(mediaSession, intent)

        when (intent?.action) {
            ACTION_TOGGLE -> {
                dispatchControlToWeb(if (isPlayingState) "pause" else "play")
                return START_STICKY
            }
            ACTION_NEXT -> {
                dispatchControlToWeb("next")
                return START_STICKY
            }
            ACTION_PREV -> {
                dispatchControlToWeb("prev")
                return START_STICKY
            }
            ACTION_STOP -> {
                dispatchControlToWeb("stop")
                stopPlaybackAndService()
                return START_NOT_STICKY
            }
            ACTION_UPDATE -> {
                val title = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
                val artist = intent.getStringExtra(EXTRA_ARTIST) ?: currentArtist
                val cover = intent.getStringExtra(EXTRA_COVER) ?: ""
                val audioUrl = intent.getStringExtra(EXTRA_AUDIO_URL) ?: ""
                val playing = intent.getBooleanExtra(EXTRA_IS_PLAYING, true)

                currentTitle = title
                currentArtist = artist
                isPlayingState = playing

                if (audioUrl.isNotBlank() && audioUrl != currentAudioUrl) {
                    currentAudioUrl = audioUrl
                    prepareNativeMediaPlayer(audioUrl, playing)
                } else {
                    syncNativeMediaPlayerState(playing)
                }

                if (playing) {
                    if (wakeLock?.isHeld == false) wakeLock?.acquire(60 * 60 * 1000L)
                } else {
                    if (wakeLock?.isHeld == true) wakeLock?.release()
                }

                updateMediaSessionMetadata()
                startForeground(NOTIFICATION_ID, buildMediaNotification())

                if (cover.isNotBlank() && cover != currentCoverUrl) {
                    currentCoverUrl = cover
                    fetchCoverArt(cover)
                }
            }
        }
        return START_STICKY
    }

    private fun prepareNativeMediaPlayer(url: String, autoPlay: Boolean) {
        try {
            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                setWakeMode(applicationContext, PowerManager.PARTIAL_WAKE_LOCK)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                isLooping = true
                setDataSource(url)
                setOnPreparedListener { mp ->
                    if (autoPlay && isPlayingState) {
                        mp.start()
                    }
                }
                setOnErrorListener { _, _, _ ->
                    Log.w(TAG, "Native MediaPlayer fallback notice for $url")
                    true
                }
                prepareAsync()
            }
        } catch (e: Throwable) {
            Log.w(TAG, "MediaPlayer init notice: ${e.message}")
        }
    }

    private fun syncNativeMediaPlayerState(playing: Boolean) {
        try {
            mediaPlayer?.let { mp ->
                if (playing && !mp.isPlaying) {
                    mp.start()
                } else if (!playing && mp.isPlaying) {
                    mp.pause()
                }
            }
        } catch (_: Throwable) {}
    }

    private fun fetchCoverArt(urlStr: String) {
        imageExecutor.execute {
            try {
                val stream = URL(urlStr).openStream()
                val bmp = BitmapFactory.decodeStream(stream)
                if (bmp != null) {
                    currentCoverBitmap = bmp
                    updateMediaSessionMetadata()
                    val nm = getSystemService(NotificationManager::class.java)
                    nm?.notify(NOTIFICATION_ID, buildMediaNotification())
                }
            } catch (_: Throwable) {}
        }
    }

    private fun updateMediaSessionMetadata() {
        val stateCode = if (isPlayingState) {
            PlaybackStateCompat.STATE_PLAYING
        } else {
            PlaybackStateCompat.STATE_PAUSED
        }

        val playbackState = PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY or
                    PlaybackStateCompat.ACTION_PAUSE or
                    PlaybackStateCompat.ACTION_PLAY_PAUSE or
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                    PlaybackStateCompat.ACTION_STOP
            )
            .setState(stateCode, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, if (isPlayingState) 1f else 0f)
            .build()

        mediaSession.setPlaybackState(playbackState)

        val metaBuilder = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "ZE.io Music")

        currentCoverBitmap?.let {
            metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, it)
        }
        mediaSession.setMetadata(metaBuilder.build())
    }

    private fun buildMediaNotification(): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPending = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val prevPending = PendingIntent.getService(
            this, 10, Intent(this, ZeMusicForegroundService::class.java).setAction(ACTION_PREV),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val togglePending = PendingIntent.getService(
            this, 11, Intent(this, ZeMusicForegroundService::class.java).setAction(ACTION_TOGGLE),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val nextPending = PendingIntent.getService(
            this, 12, Intent(this, ZeMusicForegroundService::class.java).setAction(ACTION_NEXT),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val playPauseIcon = if (isPlayingState) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
        val playPauseTitle = if (isPlayingState) "Pause" else "Play"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setLargeIcon(currentCoverBitmap)
            .setContentIntent(contentPending)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isPlayingState)
            .setOnlyAlertOnce(true)
            .addAction(android.R.drawable.ic_media_previous, "Prev", prevPending)
            .addAction(playPauseIcon, playPauseTitle, togglePending)
            .addAction(android.R.drawable.ic_media_next, "Next", nextPending)
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )
            .build()
    }

    private fun dispatchControlToWeb(action: String) {
        if (action == "play") isPlayingState = true
        if (action == "pause" || action == "stop") isPlayingState = false
        syncNativeMediaPlayerState(isPlayingState)
        updateMediaSessionMetadata()

        val nm = getSystemService(NotificationManager::class.java)
        nm?.notify(NOTIFICATION_ID, buildMediaNotification())

        val broadcast = Intent(ACTION_CONTROL_BROADCAST).apply {
            setPackage(packageName)
            putExtra("action", action)
        }
        sendBroadcast(broadcast)
    }

    private fun stopPlaybackAndService() {
        isPlayingState = false
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (_: Throwable) {}
        if (wakeLock?.isHeld == true) wakeLock?.release()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ZE.io Music Player",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Kontrol pemutar musik ZE.io di notification bar & lockscreen"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        imageExecutor.shutdownNow()
        try {
            mediaPlayer?.release()
        } catch (_: Throwable) {}
        if (wakeLock?.isHeld == true) wakeLock?.release()
        mediaSession.release()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
