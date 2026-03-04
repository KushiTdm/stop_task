export interface AppInfo {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  isRunning: boolean;
  ramUsage: number;
  dataUsage: number;
  permissions: string[];
  isSuspicious: boolean;
  lastUsed: Date;
}

export interface SystemStats {
  totalRam: number;
  usedRam: number;
  totalData: number;
  usedData: number;
  activeApps: number;
}
