package io.ze.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class ZeBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val prefs = context.getSharedPreferences(ZeChatForegroundService.PREFS_NAME, Context.MODE_PRIVATE)
        val uid = prefs.getString(ZeChatForegroundService.KEY_USER_ID, "") ?: ""
        if (uid.isBlank()) return

        val svcIntent = Intent(context, ZeChatForegroundService::class.java).apply {
            putExtra(ZeChatForegroundService.EXTRA_USER_ID, uid)
            putExtra(
                ZeChatForegroundService.EXTRA_SERVER_URL,
                prefs.getString(ZeChatForegroundService.KEY_SERVER_URL, BuildConfig.ZEIO_APP_URL)
            )
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(svcIntent)
        } else {
            context.startService(svcIntent)
        }
    }
}
