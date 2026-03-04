import { AppInfo, SystemStats } from '@/types/app';

export const mockApps: AppInfo[] = [
  {
    id: '1',
    name: 'Chrome',
    packageName: 'com.android.chrome',
    icon: '🌐',
    isRunning: true,
    ramUsage: 245,
    dataUsage: 1250,
    permissions: ['Internet', 'Stockage', 'Localisation', 'Caméra'],
    isSuspicious: false,
    lastUsed: new Date(),
  },
  {
    id: '2',
    name: 'Facebook',
    packageName: 'com.facebook.katana',
    icon: '📘',
    isRunning: true,
    ramUsage: 320,
    dataUsage: 2100,
    permissions: [
      'Internet',
      'Localisation',
      'Caméra',
      'Microphone',
      'Contacts',
      'Stockage',
      'Téléphone',
    ],
    isSuspicious: true,
    lastUsed: new Date(),
  },
  {
    id: '3',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    icon: '💬',
    isRunning: true,
    ramUsage: 180,
    dataUsage: 850,
    permissions: ['Internet', 'Contacts', 'Caméra', 'Microphone', 'Stockage'],
    isSuspicious: false,
    lastUsed: new Date(),
  },
  {
    id: '4',
    name: 'Instagram',
    packageName: 'com.instagram.android',
    icon: '📷',
    isRunning: false,
    ramUsage: 0,
    dataUsage: 1500,
    permissions: ['Internet', 'Caméra', 'Stockage', 'Localisation'],
    isSuspicious: false,
    lastUsed: new Date(Date.now() - 3600000),
  },
  {
    id: '5',
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    icon: '🎵',
    isRunning: true,
    ramUsage: 290,
    dataUsage: 3200,
    permissions: [
      'Internet',
      'Caméra',
      'Microphone',
      'Stockage',
      'Localisation',
      'Contacts',
    ],
    isSuspicious: true,
    lastUsed: new Date(),
  },
  {
    id: '6',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    icon: '▶️',
    isRunning: true,
    ramUsage: 215,
    dataUsage: 4500,
    permissions: ['Internet', 'Stockage', 'Caméra', 'Microphone'],
    isSuspicious: false,
    lastUsed: new Date(),
  },
  {
    id: '7',
    name: 'Spotify',
    packageName: 'com.spotify.music',
    icon: '🎧',
    isRunning: true,
    ramUsage: 150,
    dataUsage: 1800,
    permissions: ['Internet', 'Stockage', 'Localisation'],
    isSuspicious: false,
    lastUsed: new Date(),
  },
  {
    id: '8',
    name: 'Gmail',
    packageName: 'com.google.android.gm',
    icon: '📧',
    isRunning: false,
    ramUsage: 0,
    dataUsage: 450,
    permissions: ['Internet', 'Contacts', 'Stockage'],
    isSuspicious: false,
    lastUsed: new Date(Date.now() - 7200000),
  },
];

export const systemStats: SystemStats = {
  totalRam: 8192,
  usedRam: 5120,
  totalData: 10240,
  usedData: 6850,
  activeApps: 6,
};

export function formatBytes(mb: number): string {
  if (mb < 1024) {
    return `${mb.toFixed(0)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) {
    return 'À l\'instant';
  } else if (minutes < 60) {
    return `Il y a ${minutes} min`;
  } else if (hours < 24) {
    return `Il y a ${hours}h`;
  }
  return date.toLocaleDateString('fr-FR');
}
