package com.tokami.boltexponativewind

import android.app.ActivityManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.TrafficStats
import com.facebook.react.bridge.*
import java.util.Calendar

class AppMonitorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AppMonitor"

    private val pm: PackageManager get() = reactApplicationContext.packageManager
    private val am: ActivityManager get() =
        reactApplicationContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    private val usm: UsageStatsManager get() =
        reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    @ReactMethod
    fun getSystemRam(promise: Promise) {
        try {
            val info = ActivityManager.MemoryInfo()
            am.getMemoryInfo(info)
            val map = Arguments.createMap().apply {
                putDouble("totalRam", (info.totalMem / 1048576.0))
                putDouble("usedRam",  ((info.totalMem - info.availMem) / 1048576.0))
                putDouble("availRam", (info.availMem / 1048576.0))
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("RAM_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val flags = PackageManager.GET_PERMISSIONS
            val packages = pm.getInstalledApplications(flags)

            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -7)
            val usageMap: Map<String, UsageStats> = try {
                usm.queryAndAggregateUsageStats(cal.timeInMillis, System.currentTimeMillis())
            } catch (e: Exception) { emptyMap() }

            val list = Arguments.createArray()

            for (pkg in packages) {
                val isSystem = pkg.flags and ApplicationInfo.FLAG_SYSTEM != 0
                val hasLauncher = pm.getLaunchIntentForPackage(pkg.packageName) != null
                if (isSystem && !hasLauncher) continue

                val appInfo = Arguments.createMap()
                appInfo.putString("packageName", pkg.packageName)
                appInfo.putString("name", pm.getApplicationLabel(pkg).toString())
                appInfo.putBoolean("isSystem", isSystem)

                val perms = Arguments.createArray()
                try {
                    val pkgInfo = pm.getPackageInfo(pkg.packageName, PackageManager.GET_PERMISSIONS)
                    pkgInfo.requestedPermissions?.forEach { perm ->
                        perms.pushString(perm.substringAfterLast("."))
                    }
                } catch (_: Exception) {}
                appInfo.putArray("permissions", perms)

                val usage = usageMap[pkg.packageName]
                appInfo.putDouble("totalTimeInForeground",
                    (usage?.totalTimeInForeground ?: 0L) / 1000.0)
                appInfo.putDouble("lastTimeUsed",
                    (usage?.lastTimeUsed ?: 0L).toDouble())

                val pids = am.runningAppProcesses
                    ?.filter { it.processName == pkg.packageName }
                    ?.map { it.pid }
                    ?: emptyList()

                var appRam = 0L
                if (pids.isNotEmpty()) {
                    val memInfos = am.getProcessMemoryInfo(pids.toIntArray())
                    memInfos.forEach { appRam += it.totalPss }
                }
                appInfo.putDouble("ramUsage", appRam / 1024.0)
                appInfo.putBoolean("isRunning", appRam > 0)

                val uid = pkg.uid
                val rxBytes = TrafficStats.getUidRxBytes(uid)
                val txBytes = TrafficStats.getUidTxBytes(uid)
                val totalData = if (rxBytes == TrafficStats.UNSUPPORTED.toLong()) 0.0
                               else (rxBytes + txBytes) / 1048576.0
                appInfo.putDouble("dataUsage", totalData)

                val sensitivePerms = listOf(
                    "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION",
                    "RECORD_AUDIO", "CAMERA",
                    "READ_CONTACTS", "READ_CALL_LOG",
                    "READ_SMS", "PROCESS_OUTGOING_CALLS",
                    "READ_PHONE_STATE"
                )
                val sensitiveCount = try {
                    val pkgInfo = pm.getPackageInfo(pkg.packageName, PackageManager.GET_PERMISSIONS)
                    pkgInfo.requestedPermissions?.count { it.substringAfterLast(".") in sensitivePerms } ?: 0
                } catch (_: Exception) { 0 }
                appInfo.putBoolean("isSuspicious", sensitiveCount >= 4)

                list.pushMap(appInfo)
            }

            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("APPS_ERROR", e.message)
        }
    }

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

                val memInfo = am.getProcessMemoryInfo(intArrayOf(proc.pid))
                val ramMb = (memInfo.firstOrNull()?.totalPss ?: 0) / 1024.0
                map.putDouble("ramUsage", ramMb)

                list.pushMap(map)
            }
            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("RUNNING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun killApp(packageName: String, promise: Promise) {
        try {
            am.killBackgroundProcesses(packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("KILL_ERROR", e.message)
        }
    }

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
            promise.resolve(stats != null && stats.isNotEmpty())
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}