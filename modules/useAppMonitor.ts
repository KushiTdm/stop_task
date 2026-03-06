import { useState, useEffect, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import AppMonitorAPI, {
  RealAppInfo,
  SystemRam,
  RunningProcess,
} from './AppMonitorAPI';

interface UseAppMonitorReturn {
  apps: RealAppInfo[];
  systemRam: SystemRam | null;
  runningProcesses: RunningProcess[];
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  killApp: (packageName: string) => Promise<void>;
  openUsageSettings: () => void;
}

export function useAppMonitor(autoRefreshMs = 0): UseAppMonitorReturn {
  const [apps, setApps] = useState<RealAppInfo[]>([]);
  const [systemRam, setSystemRam] = useState<SystemRam | null>(null);
  const [runningProcesses, setRunningProcesses] = useState<RunningProcess[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setError('Android uniquement');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check usage stats permission
      const perm = await AppMonitorAPI.hasUsageStatsPermission();
      setHasPermission(perm);

      // Always fetch RAM (no special permission needed)
      const ram = await AppMonitorAPI.getSystemRam();
      setSystemRam(ram);

      // Running processes (no special permission)
      const procs = await AppMonitorAPI.getRunningApps();
      setRunningProcesses(procs);

      // Installed apps (better data with usage stats permission)
      const installedApps = await AppMonitorAPI.getInstalledApps();
      setApps(installedApps);
    } catch (e: any) {
      setError(e.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshMs <= 0) return;
    const interval = setInterval(refresh, autoRefreshMs);
    return () => clearInterval(interval);
  }, [autoRefreshMs, refresh]);

  const killApp = useCallback(async (packageName: string) => {
    await AppMonitorAPI.killApp(packageName);
    // Remove from running after kill
    setApps((prev) =>
      prev.map((app) =>
        app.packageName === packageName
          ? { ...app, isRunning: false, ramUsage: 0 }
          : app
      )
    );
  }, []);

  const openUsageSettings = useCallback(() => {
    Linking.openSettings(); // Opens app settings; user navigates to Usage access
    // For direct Usage access screen:
    // Linking.sendIntent('android.settings.USAGE_ACCESS_SETTINGS');
  }, []);

  return {
    apps,
    systemRam,
    runningProcesses,
    hasPermission,
    loading,
    error,
    refresh,
    killApp,
    openUsageSettings,
  };
}