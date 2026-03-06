package com.tokami.boltexponativewind

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat

/**
 * Service de surveillance en arrière-plan.
 * Tourne en Foreground Service (obligatoire Android 8+) pour ne pas être tué.
 * Scanne toutes les 30 secondes et envoie des alertes si détecte des apps suspectes actives.
 */
class AppMonitorService : Service() {

    companion object {
        const val CHANNEL_ID     = "app_monitor_channel"
        const val NOTIF_ID       = 1001
        const val ALERT_NOTIF_ID = 1002
        const val SCAN_INTERVAL  = 30_000L // 30 secondes
    }

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var am: ActivityManager

    private val scanRunnable = object : Runnable {
        override fun run() {
            scan()
            handler.postDelayed(this, SCAN_INTERVAL)
        }
    }

    override fun onCreate() {
        super.onCreate()
        am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIF_ID, buildPersistentNotification("Surveillance active..."))
        handler.post(scanRunnable)
        return START_STICKY // redémarre automatiquement si tué
    }

    override fun onDestroy() {
        handler.removeCallbacks(scanRunnable)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ─── Scan périodique ──────────────────────────────────────────────────────

    private fun scan() {
        try {
            val pm = packageManager
            val runningProcs = am.runningAppProcesses ?: return

            val sensitivePerms = setOf(
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.RECORD_AUDIO",
                "android.permission.CAMERA",
                "android.permission.READ_CONTACTS",
                "android.permission.READ_CALL_LOG",
                "android.permission.READ_SMS",
                "android.permission.READ_PHONE_STATE"
            )

            val suspiciousRunning = mutableListOf<String>()

            for (proc in runningProcs) {
                if (proc.importance > ActivityManager.RunningAppProcessInfo.IMPORTANCE_SERVICE) continue
                if (proc.processName == packageName) continue

                for (pkg in proc.pkgList.orEmpty()) {
                    try {
                        val appInfo = pm.getApplicationInfo(pkg, 0)
                        val isSystem = appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM != 0
                        if (isSystem) continue

                        val pkgInfo = pm.getPackageInfo(pkg, android.content.pm.PackageManager.GET_PERMISSIONS)
                        val count = pkgInfo.requestedPermissions?.count { it in sensitivePerms } ?: 0
                        if (count >= 3) {
                            val label = pm.getApplicationLabel(appInfo).toString()
                            suspiciousRunning.add(label)
                        }
                    } catch (_: Exception) {}
                }
            }

            // Met à jour la notification persistente
            val summary = if (suspiciousRunning.isEmpty()) {
                "Aucune menace détectée"
            } else {
                "${suspiciousRunning.size} app(s) suspecte(s) active(s)"
            }
            updatePersistentNotification(summary)

            // Alerte si nouvelles apps suspectes
            if (suspiciousRunning.isNotEmpty()) {
                sendAlertNotification(
                    "⚠️ Apps suspectes actives",
                    suspiciousRunning.take(3).joinToString(", ")
                )
            }

        } catch (_: Exception) {}
    }

    // ─── Notifications ────────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Canal principal (persistant)
            nm.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    "Surveillance des applications",
                    NotificationManager.IMPORTANCE_LOW
                ).apply { description = "Surveillance en arrière-plan" }
            )

            // Canal alertes
            nm.createNotificationChannel(
                NotificationChannel(
                    "${CHANNEL_ID}_alerts",
                    "Alertes de sécurité",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply { description = "Alertes apps suspectes" }
            )
        }
    }

    private fun buildPersistentNotification(text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AppMonitor")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }

    private fun updatePersistentNotification(text: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID, buildPersistentNotification(text))
    }

    private fun sendAlertNotification(title: String, text: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notif = NotificationCompat.Builder(this, "${CHANNEL_ID}_alerts")
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        nm.notify(ALERT_NOTIF_ID, notif)
    }
}