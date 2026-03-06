import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AppMonitor: NativeAppMonitor } = NativeModules;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RealAppInfo {
  packageName: string;
  name: string;
  isSystem: boolean;
  isRunning: boolean;
  isSuspicious: boolean;
  ramUsage: number;       // MB
  dataUsage: number;      // MB
  permissions: string[];
  totalTimeInForeground: number; // seconds
  lastTimeUsed: number;          // timestamp ms
}

export interface SystemRam {
  totalRam: number;  // MB
  usedRam: number;   // MB
  availRam: number;  // MB
}

export interface RunningProcess {
  processName: string;
  pid: number;
  importance: number;
  ramUsage: number; // MB
}

// ─── Guard: Android only ─────────────────────────────────────────────────────

function assertAndroid() {
  if (Platform.OS !== 'android') {
    throw new Error('AppMonitor is Android-only');
  }
  if (!NativeAppMonitor) {
    throw new Error(
      'AppMonitor native module not found. ' +
      'Did you run `npx expo eject` and add AppMonitorPackage to MainApplication?'
    );
  }
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const AppMonitorAPI = {
  /**
   * Returns total / used / available RAM in MB.
   */
  getSystemRam(): Promise<SystemRam> {
    assertAndroid();
    return NativeAppMonitor.getSystemRam();
  },

  /**
   * Returns all user-visible installed apps with real RAM, data, permissions.
   * Requires PACKAGE_USAGE_STATS permission granted by user in Settings.
   */
  getInstalledApps(): Promise<RealAppInfo[]> {
    assertAndroid();
    return NativeAppMonitor.getInstalledApps();
  },

  /**
   * Returns currently running processes with RAM usage.
   */
  getRunningApps(): Promise<RunningProcess[]> {
    assertAndroid();
    return NativeAppMonitor.getRunningApps();
  },

  /**
   * Tue tous les processus non-système pour libérer la RAM.
   * Retourne la liste des packages tués.
   */
  killAllNonSystemApps(): Promise<string[]> {
    assertAndroid();
    return NativeAppMonitor.killAllNonSystemApps();
  },

  /** Démarre le service de surveillance en arrière-plan. */
  startBackgroundService(): Promise<boolean> {
    assertAndroid();
    return NativeAppMonitor.startBackgroundService();
  },

  /** Arrête le service de surveillance en arrière-plan. */
  stopBackgroundService(): Promise<boolean> {
    assertAndroid();
    return NativeAppMonitor.stopBackgroundService();
  },

  /**
   * Kills background process. Requires KILL_BACKGROUND_PROCESSES permission.
   */
  killApp(packageName: string): Promise<boolean> {
    assertAndroid();
    return NativeAppMonitor.killApp(packageName);
  },

  /**
   * Returns true if the user has granted PACKAGE_USAGE_STATS permission.
   * If false, redirect user to Settings > Apps > Special app access > Usage access.
   */
  hasUsageStatsPermission(): Promise<boolean> {
    assertAndroid();
    return NativeAppMonitor.hasUsageStatsPermission();
  },
};

export default AppMonitorAPI;