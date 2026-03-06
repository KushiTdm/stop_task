package com.tokami.boltexponativewind

import android.app.ActivityManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.TrafficStats
import android.os.Build
import com.facebook.react.bridge.*
import java.util.Calendar

class AppMonitorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AppMonitor"

    private val ctx get() = reactApplicationContext
    private val pm: PackageManager get() = ctx.packageManager
    private val am: ActivityManager get() =
        ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    private val usm: UsageStatsManager get() =
        ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    companion object {
        private val SENSITIVE_PERMS = setOf(
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.RECORD_AUDIO",
            "android.permission.CAMERA",
            "android.permission.READ_CONTACTS",
            "android.permission.READ_CALL_LOG",
            "android.permission.READ_SMS",
            "android.permission.PROCESS_OUTGOING_CALLS",
            "android.permission.READ_PHONE_STATE"
        )

        // Packages système à toujours exclure
        private val SYSTEM_PREFIXES = listOf(
            "com.android.systemui",
            "com.android.settings",
            "com.android.phone",
            "com.android.launcher",
            "android",
        )
    }

    // ─── RAM système ─────────────────────────────────────────────────────────

    @ReactMethod
    fun getSystemRam(promise: Promise) {
        try {
            val info = ActivityManager.MemoryInfo()
            am.getMemoryInfo(info)
            promise.resolve(Arguments.createMap().apply {
                putDouble("totalRam", info.totalMem / 1048576.0)
                putDouble("usedRam",  (info.totalMem - info.availMem) / 1048576.0)
                putDouble("availRam", info.availMem / 1048576.0)
            })
        } catch (e: Exception) {
            promise.reject("RAM_ERROR", e.message)
        }
    }

    // ─── Liste complète des apps installées ──────────────────────────────────
    // FIX 1 : on inclut TOUTES les apps (y compris sans launcher)
    // FIX 2 : on croise avec runningAppProcesses pour détecter les apps actives
    // FIX 3 : on utilise les noms complets de permissions pour la détection

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            // Toutes les apps installées avec leurs permissions
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)

            // UsageStats sur 7 jours
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -7)
            val usageMap: Map<String, UsageStats> = try {
                usm.queryAndAggregateUsageStats(cal.timeInMillis, System.currentTimeMillis())
            } catch (_: Exception) { emptyMap() }

            // Map processName → RAM (PSS en KB) via runningAppProcesses
            // FIX : on indexe par UID pour couvrir les apps multi-process
            val uidRamMap = mutableMapOf<Int, Long>()
            val runningProcs = am.runningAppProcesses ?: emptyList()
            for (proc in runningProcs) {
                // importance <= 400 = foreground/visible/service (actif)
                if (proc.importance > ActivityManager.RunningAppProcessInfo.IMPORTANCE_CACHED) continue
                try {
                    val memInfo = am.getProcessMemoryInfo(intArrayOf(proc.pid))
                    val pss = memInfo.firstOrNull()?.totalPss?.toLong() ?: 0L
                    // Associe la RAM à tous les UIDs de ce process
                    for (uid in proc.pkgList.orEmpty()) {
                        try {
                            val appUid = pm.getApplicationInfo(uid, 0).uid
                            uidRamMap[appUid] = (uidRamMap[appUid] ?: 0L) + pss
                        } catch (_: Exception) {}
                    }
                } catch (_: Exception) {}
            }

            val list = Arguments.createArray()

            for (pkg in packages) {
                // Exclure les processus purement système sans interface
                val isSystem = pkg.flags and ApplicationInfo.FLAG_SYSTEM != 0
                val isExcluded = SYSTEM_PREFIXES.any { pkg.packageName.startsWith(it) }
                if (isExcluded) continue

                // Inclure : apps utilisateur + apps système avec launcher
                val hasLauncher = pm.getLaunchIntentForPackage(pkg.packageName) != null
                if (isSystem && !hasLauncher) continue

                val appInfo = Arguments.createMap()
                appInfo.putString("packageName", pkg.packageName)
                appInfo.putString("name", pm.getApplicationLabel(pkg).toString())
                appInfo.putBoolean("isSystem", isSystem)

                // Permissions complètes (noms courts pour l'UI)
                val perms = Arguments.createArray()
                val fullPerms = mutableListOf<String>()
                try {
                    val pkgInfo = pm.getPackageInfo(
                        pkg.packageName,
                        PackageManager.GET_PERMISSIONS
                    )
                    pkgInfo.requestedPermissions?.forEach { fullPerm ->
                        fullPerms.add(fullPerm)
                        perms.pushString(fullPerm.substringAfterLast("."))
                    }
                } catch (_: Exception) {}
                appInfo.putArray("permissions", perms)

                // UsageStats
                val usage = usageMap[pkg.packageName]
                appInfo.putDouble("totalTimeInForeground",
                    (usage?.totalTimeInForeground ?: 0L) / 1000.0)
                appInfo.putDouble("lastTimeUsed",
                    (usage?.lastTimeUsed ?: 0L).toDouble())

                // RAM via UID (couvre toutes les apps actives, pas seulement process principal)
                val ramKb = uidRamMap[pkg.uid] ?: 0L
                appInfo.putDouble("ramUsage", ramKb / 1024.0)
                appInfo.putBoolean("isRunning", ramKb > 0)

                // Data réseau via TrafficStats (depuis dernier reboot)
                val rx = TrafficStats.getUidRxBytes(pkg.uid)
                val tx = TrafficStats.getUidTxBytes(pkg.uid)
                val dataMb = if (rx < 0 || tx < 0) 0.0 else (rx + tx) / 1048576.0
                appInfo.putDouble("dataUsage", dataMb)

                // Suspicious : compte les permissions sensibles (noms complets)
                val sensitiveCount = fullPerms.count { it in SENSITIVE_PERMS }
                appInfo.putBoolean("isSuspicious", sensitiveCount >= 3)

                list.pushMap(appInfo)
            }

            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("APPS_ERROR", e.message)
        }
    }

    // ─── Processus en cours ───────────────────────────────────────────────────

    @ReactMethod
    fun getRunningApps(promise: Promise) {
        try {
            val processes = am.runningAppProcesses ?: emptyList()
            val list = Arguments.createArray()

            for (proc in processes) {
                val map = Arguments.createMap()
                map.putString("processName", proc.processName)
                map.putInt("pid", proc.pid)
                map.putInt("importance", proc.importance)

                try {
                    val memInfo = am.getProcessMemoryInfo(intArrayOf(proc.pid))
                    map.putDouble("ramUsage", (memInfo.firstOrNull()?.totalPss ?: 0) / 1024.0)
                } catch (_: Exception) {
                    map.putDouble("ramUsage", 0.0)
                }

                list.pushMap(map)
            }
            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("RUNNING_ERROR", e.message)
        }
    }

    // ─── Kill une app ─────────────────────────────────────────────────────────

    @ReactMethod
    fun killApp(packageName: String, promise: Promise) {
        try {
            am.killBackgroundProcesses(packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("KILL_ERROR", e.message)
        }
    }

    // ─── Kill TOUTES les apps non-système ─────────────────────────────────────
    // FIX : nouvelle méthode pour libérer toute la RAM d'un coup

    @ReactMethod
    fun killAllNonSystemApps(promise: Promise) {
        try {
            val myPackage = ctx.packageName
            val packages = pm.getInstalledApplications(0)
            val killed = Arguments.createArray()

            for (pkg in packages) {
                if (pkg.packageName == myPackage) continue
                val isSystem = pkg.flags and ApplicationInfo.FLAG_SYSTEM != 0
                if (isSystem) continue
                try {
                    am.killBackgroundProcesses(pkg.packageName)
                    killed.pushString(pkg.packageName)
                } catch (_: Exception) {}
            }

            promise.resolve(killed)
        } catch (e: Exception) {
            promise.reject("KILL_ALL_ERROR", e.message)
        }
    }

    // ─── Permission UsageStats ────────────────────────────────────────────────

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -1)
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                cal.timeInMillis,
                System.currentTimeMillis()
            )
            promise.resolve(!stats.isNullOrEmpty())
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    // ─── Démarrer le service de surveillance en arrière-plan ─────────────────

    @ReactMethod
    fun startBackgroundService(promise: Promise) {
        try {
            val intent = Intent(ctx, AppMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(intent)
            } else {
                ctx.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopBackgroundService(promise: Promise) {
        try {
            val intent = Intent(ctx, AppMonitorService::class.java)
            ctx.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", e.message)
        }
    }
}