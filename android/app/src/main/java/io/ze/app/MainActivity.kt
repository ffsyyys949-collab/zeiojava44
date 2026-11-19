package io.ze.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * MainActivity host for ZE.io APK.
 * Exposes window.ZeNative JS Bridge for:
 * 1. In-app WireGuard VPNService (no external Play Store VPN app) & launching Mobile Legends
 * 2. Auto-requesting POST_NOTIFICATIONS & running ZeChatForegroundService + opening exact chat on notification tap
 * 3. Background MediaSession music playback via ZeMusicForegroundService
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_OPEN_CHAT_ID = "open_chat_id"
        private const val REQ_POST_NOTIFICATIONS = 1001

        @Volatile
        var isAppInForeground: Boolean = false
            private set
    }

    private lateinit var webView: WebView
    private var pendingVpnServerCode: String = "SG"
    private var pendingVpnServerIp: String = "103.145.22.84"
    private var pendingVpnPort: Int = 51820
    private var pendingOpenChatId: String? = null

    private val vpnPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            startInAppVpnService(pendingVpnServerCode, pendingVpnServerIp, pendingVpnPort)
        } else {
            notifyWebVpnState(false, pendingVpnServerCode, "")
        }
    }

    private val vpnStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == VPNService.ACTION_STATE_CHANGED) {
                val connected = intent.getBooleanExtra("connected", false)
                val code = intent.getStringExtra("serverCode") ?: "SG"
                val vip = intent.getStringExtra("virtualIp") ?: ""
                notifyWebVpnState(connected, code, vip)
            }
        }
    }

    private val musicControlReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ZeMusicForegroundService.ACTION_CONTROL_BROADCAST) {
                val action = intent.getStringExtra("action") ?: return
                val js = "window.__zeMusicControl && window.__zeMusicControl('$action');"
                webView.post { webView.evaluateJavascript(js, null) }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Minta izin notifikasi otomatis pertama kali buka aplikasi (Android 13+)
        requestNotificationPermissionIfNeeded()

        pendingOpenChatId = intent?.getStringExtra(EXTRA_OPEN_CHAT_ID)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            userAgentString = "$userAgentString ZEioAPK/2.0"
        }

        webView.addJavascriptInterface(ZeNativeBridge(), "ZeNative")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: android.webkit.WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("intent://")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(intent)
                    } catch (_: Throwable) {
                        val fallbackUrl = try {
                            Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                                .getStringExtra("browser_fallback_url")
                        } catch (_: Throwable) {
                            null
                        }
                        if (!fallbackUrl.isNullOrBlank()) {
                            startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(fallbackUrl)))
                        }
                    }
                    return true
                }
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                pendingOpenChatId?.let { chatId ->
                    dispatchOpenChatToWeb(chatId)
                    pendingOpenChatId = null
                }
            }
        }

        val initialUrl = if (!pendingOpenChatId.isNullOrBlank()) {
            "${BuildConfig.ZEIO_APP_URL}/?openChatId=${android.net.Uri.encode(pendingOpenChatId)}"
        } else {
            BuildConfig.ZEIO_APP_URL
        }
        webView.loadUrl(initialUrl)

        val vpnFilter = IntentFilter(VPNService.ACTION_STATE_CHANGED)
        val musicFilter = IntentFilter(ZeMusicForegroundService.ACTION_CONTROL_BROADCAST)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(vpnStateReceiver, vpnFilter, Context.RECEIVER_NOT_EXPORTED)
            registerReceiver(musicControlReceiver, musicFilter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(vpnStateReceiver, vpnFilter)
            registerReceiver(musicControlReceiver, musicFilter)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val chatId = intent.getStringExtra(EXTRA_OPEN_CHAT_ID)
        if (!chatId.isNullOrBlank()) {
            dispatchOpenChatToWeb(chatId)
        }
    }

    override fun onResume() {
        super.onResume()
        isAppInForeground = true
    }

    override fun onPause() {
        isAppInForeground = false
        super.onPause()
    }

    override fun onDestroy() {
        try {
            unregisterReceiver(vpnStateReceiver)
            unregisterReceiver(musicControlReceiver)
        } catch (_: Throwable) {}
        super.onDestroy()
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    REQ_POST_NOTIFICATIONS
                )
            }
        }
    }

    private fun startInAppVpnService(serverCode: String, serverIp: String, port: Int) {
        val intent = Intent(this, VPNService::class.java).apply {
            action = VPNService.ACTION_CONNECT
            putExtra(VPNService.EXTRA_SERVER_CODE, serverCode)
            putExtra(VPNService.EXTRA_SERVER_IP, serverIp)
            putExtra(VPNService.EXTRA_SERVER_PORT, port)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun notifyWebVpnState(connected: Boolean, serverCode: String, virtualIp: String) {
        val safeCode = serverCode.replace("'", "")
        val safeIp = virtualIp.replace("'", "")
        val js = "window.dispatchEvent(new CustomEvent('ze-native-vpn-state',{detail:{connected:$connected,serverCode:'$safeCode',virtualIp:'$safeIp'}}));"
        webView.post { webView.evaluateJavascript(js, null) }
    }

    private fun dispatchOpenChatToWeb(chatId: String) {
        val safeId = chatId.replace("'", "\\'")
        val js = "window.__zeOpenChatById && window.__zeOpenChatById('$safeId');"
        webView.post { webView.evaluateJavascript(js, null) }
    }

    inner class ZeNativeBridge {
        @JavascriptInterface
        fun requestNotificationPermission() {
            runOnUiThread { requestNotificationPermissionIfNeeded() }
        }

        @JavascriptInterface
        fun connectVpn(serverCode: String, serverIp: String, port: Int, killSwitch: Boolean) {
            pendingVpnServerCode = serverCode.ifBlank { "SG" }
            pendingVpnServerIp = serverIp.ifBlank { "103.145.22.84" }
            pendingVpnPort = if (port > 0) port else 51820

            runOnUiThread {
                val prepareIntent = VpnService.prepare(this@MainActivity)
                if (prepareIntent != null) {
                    vpnPermissionLauncher.launch(prepareIntent)
                } else {
                    startInAppVpnService(pendingVpnServerCode, pendingVpnServerIp, pendingVpnPort)
                }
            }
        }

        @JavascriptInterface
        fun disconnectVpn() {
            val intent = Intent(this@MainActivity, VPNService::class.java).apply {
                action = VPNService.ACTION_DISCONNECT
            }
            startService(intent)
        }

        @JavascriptInterface
        fun openApp(packageNameStr: String): Boolean {
            val targetPkg = if (packageNameStr.isBlank()) "com.mobile.legends" else packageNameStr
            val launchIntent = packageManager.getLaunchIntentForPackage(targetPkg)
            if (launchIntent != null) {
                return try {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(launchIntent)
                    true
                } catch (_: Throwable) {
                    false
                }
            }
            return false
        }

        @JavascriptInterface
        fun setUserSession(userId: String, userName: String, serverOrigin: String) {
            val prefs = getSharedPreferences(ZeChatForegroundService.PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString(ZeChatForegroundService.KEY_USER_ID, userId)
                .putString(ZeChatForegroundService.KEY_USER_NAME, userName)
                .putString(ZeChatForegroundService.KEY_SERVER_URL, serverOrigin.ifBlank { BuildConfig.ZEIO_APP_URL })
                .apply()

            if (userId.isNotBlank()) {
                val svcIntent = Intent(this@MainActivity, ZeChatForegroundService::class.java).apply {
                    putExtra(ZeChatForegroundService.EXTRA_USER_ID, userId)
                    putExtra(ZeChatForegroundService.EXTRA_SERVER_URL, serverOrigin.ifBlank { BuildConfig.ZEIO_APP_URL })
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(svcIntent)
                } else {
                    startService(svcIntent)
                }
            }
        }

        @JavascriptInterface
        fun showChatNotification(chatId: String, senderName: String, messageText: String, senderPhoto: String) {
            ZeChatForegroundService.showChatNotification(
                applicationContext,
                chatId,
                senderName,
                messageText
            )
        }

        @JavascriptInterface
        fun updateMusicNotification(
            title: String,
            artist: String,
            coverUrl: String,
            audioUrl: String,
            isPlaying: Boolean
        ) {
            val svcIntent = Intent(this@MainActivity, ZeMusicForegroundService::class.java).apply {
                action = ZeMusicForegroundService.ACTION_UPDATE
                putExtra(ZeMusicForegroundService.EXTRA_TITLE, title)
                putExtra(ZeMusicForegroundService.EXTRA_ARTIST, artist)
                putExtra(ZeMusicForegroundService.EXTRA_COVER, coverUrl)
                putExtra(ZeMusicForegroundService.EXTRA_AUDIO_URL, audioUrl)
                putExtra(ZeMusicForegroundService.EXTRA_IS_PLAYING, isPlaying)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(svcIntent)
            } else {
                startService(svcIntent)
            }
        }

        @JavascriptInterface
        fun stopMusicNotification() {
            val svcIntent = Intent(this@MainActivity, ZeMusicForegroundService::class.java).apply {
                action = ZeMusicForegroundService.ACTION_STOP
            }
            startService(svcIntent)
        }
    }
}
