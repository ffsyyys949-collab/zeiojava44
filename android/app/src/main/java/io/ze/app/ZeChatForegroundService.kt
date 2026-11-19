package io.ze.app

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationCompat
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.json.JSONObject
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

/**
 * Persistent Foreground Service for ZE.io Chat Push Notifications.
 * Keeps listening to incoming messages even when user exits the app, plays MLBB,
 * locks the phone screen, or swipes the app away from Recent Apps.
 */
class ZeChatForegroundService : Service() {

    companion object {
        const val PREFS_NAME = "zeio_native_prefs"
        const val KEY_USER_ID = "user_id"
        const val KEY_USER_NAME = "user_name"
        const val KEY_SERVER_URL = "server_url"

        const val EXTRA_USER_ID = "user_id"
        const val EXTRA_SERVER_URL = "server_url"

        private const val CHANNEL_SERVICE_ID = "ze_chat_bg_service"
        private const val CHANNEL_CHAT_ALERT_ID = "ze_chat_messages_high"
        private const val SERVICE_NOTIFICATION_ID = 4001
        private const val TAG = "ZeChatBgService"

        fun showChatNotification(
            context: Context,
            chatId: String,
            senderName: String,
            messageText: String
        ) {
            createChannels(context)
            val openChatIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
                putExtra(MainActivity.EXTRA_OPEN_CHAT_ID, chatId)
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                chatId.hashCode(),
                openChatIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notificationTitle = "Chat baru dari $senderName"
            val notificationBody = "Chat baru dari $senderName: $messageText"

            val notification = NotificationCompat.Builder(context, CHANNEL_CHAT_ALERT_ID)
                .setSmallIcon(android.R.drawable.sym_action_chat)
                .setContentTitle(notificationTitle)
                .setContentText(notificationBody)
                .setStyle(NotificationCompat.BigTextStyle().bigText(notificationBody))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setContentIntent(pendingIntent)
                .build()

            val manager = context.getSystemService(NotificationManager::class.java)
            manager?.notify(chatId.hashCode(), notification)
        }

        private fun createChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val manager = context.getSystemService(NotificationManager::class.java) ?: return

                val serviceChannel = NotificationChannel(
                    CHANNEL_SERVICE_ID,
                    "ZE.io Background Sync",
                    NotificationManager.IMPORTANCE_MIN
                ).apply {
                    description = "Menjaga notifikasi chat ZE.io tetap aktif di background"
                    setShowBadge(false)
                }
                manager.createNotificationChannel(serviceChannel)

                val chatChannel = NotificationChannel(
                    CHANNEL_CHAT_ALERT_ID,
                    "Pesan Chat ZE.io",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifikasi pesan masuk seperti WhatsApp"
                    enableLights(true)
                    enableVibration(true)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
                manager.createNotificationChannel(chatChannel)
            }
        }
    }

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private var eventSource: EventSource? = null
    private var currentUserId: String = ""
    private var serverBaseUrl: String = BuildConfig.ZEIO_APP_URL

    override fun onCreate() {
        super.onCreate()
        createChannels(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val uid = intent?.getStringExtra(EXTRA_USER_ID) ?: prefs.getString(KEY_USER_ID, "") ?: ""
        val srvUrl = intent?.getStringExtra(EXTRA_SERVER_URL) ?: prefs.getString(KEY_SERVER_URL, BuildConfig.ZEIO_APP_URL) ?: BuildConfig.ZEIO_APP_URL

        startForeground(SERVICE_NOTIFICATION_ID, buildForegroundServiceNotification())

        if (uid.isNotBlank() && (uid != currentUserId || srvUrl != serverBaseUrl || eventSource == null)) {
            currentUserId = uid
            serverBaseUrl = srvUrl.trimEnd('/')
            connectSseStream()
        }

        return START_STICKY
    }

    private fun connectSseStream() {
        eventSource?.cancel()
        if (currentUserId.isBlank()) return

        val encodedUid = URLEncoder.encode(currentUserId, "UTF-8")
        val request = Request.Builder()
            .url("$serverBaseUrl/api/events?userId=$encodedUid")
            .header("Accept", "text/event-stream")
            .build()

        val factory = EventSources.createFactory(client)
        eventSource = factory.newEventSource(request, object : EventSourceListener() {
            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                if (type == "new-message") {
                    handleIncomingMessageEvent(data)
                }
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                Log.w(TAG, "SSE reconnect scheduled: ${t?.message}")
                android.os.Handler(mainLooper).postDelayed({
                    if (currentUserId.isNotBlank()) connectSseStream()
                }, 4000)
            }
        })
    }

    private fun handleIncomingMessageEvent(rawJson: String) {
        try {
            val root = JSONObject(rawJson)
            val chatId = root.optString("chatId", "")
            val msg = root.optJSONObject("message") ?: return
            val senderId = msg.optString("senderId", "")
            if (senderId.equals(currentUserId, ignoreCase = true)) return

            // Pastikan pesan memang ditujukan ke user ini
            val participantsArr = root.optJSONArray("participants")
            var isForMe = chatId.contains(currentUserId, ignoreCase = true)
            if (participantsArr != null) {
                for (i in 0 until participantsArr.length()) {
                    if (participantsArr.optString(i).equals(currentUserId, ignoreCase = true)) {
                        isForMe = true
                        break
                    }
                }
            }
            if (!isForMe) return

            val senderName = msg.optString("senderName", "").ifBlank {
                senderId.ifBlank { "Teman ZE.io" }
            }
            val msgText = msg.optString("text", "").ifBlank {
                if (msg.optString("mediaUrl", "").isNotBlank()) "[Media]" else "Pesan baru"
            }

            // Jika app sedang di-background atau layar mati, tampilkan notifikasi heads-up WA style
            if (!MainActivity.isAppInForeground) {
                showChatNotification(applicationContext, chatId, senderName, msgText)
            }
        } catch (e: Throwable) {
            Log.w(TAG, "Error parsing new-message SSE: ${e.message}")
        }
    }

    private fun buildForegroundServiceNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
        val pending = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_SERVICE_ID)
            .setSmallIcon(android.R.drawable.sym_action_chat)
            .setContentTitle("ZE.io Aktif")
            .setContentText("Siap menerima pesan chat real-time")
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setContentIntent(pending)
            .build()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Jadwalkan restart instan apabila user swipe app dari Recent Apps
        val restartIntent = Intent(applicationContext, ZeChatForegroundService::class.java).apply {
            putExtra(EXTRA_USER_ID, currentUserId)
            putExtra(EXTRA_SERVER_URL, serverBaseUrl)
        }
        val restartPending = PendingIntent.getService(
            applicationContext,
            4099,
            restartIntent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        val alarm = getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        alarm?.set(
            AlarmManager.ELAPSED_REALTIME,
            SystemClock.elapsedRealtime() + 1500,
            restartPending
        )
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        eventSource?.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
