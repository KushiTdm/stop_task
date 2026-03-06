import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Shield,
  TriangleAlert as AlertTriangle,
  Eye,
  Wifi,
  MapPin,
  Mic,
  Camera,
  RefreshCw,
  X,
  Zap,
  Lock,
  Radio,
} from 'lucide-react-native';
import { mockApps } from '@/utils/mockData';

// Apps considered "system" — excluded from suspicious tracking
const SYSTEM_PACKAGE_PREFIXES = [
  'com.android.',
  'com.google.android.gms',
  'com.google.android.gsf',
  'com.google.android.providers',
  'com.google.android.permissioncontroller',
  'com.google.android.networkstack',
  'android.',
  'com.samsung.android.',
  'com.miui.',
  'com.huawei.systemmanager',
  'com.sec.',
];

const isSystemApp = (packageName: string) =>
  SYSTEM_PACKAGE_PREFIXES.some((prefix) => packageName.startsWith(prefix));

interface SensorAccess {
  sensor: 'camera' | 'microphone' | 'location' | 'network' | 'bluetooth';
  label: string;
  icon: any;
  color: string;
  apps: string[];
  isActive: boolean;
  risk: 'critical' | 'high' | 'medium' | 'low';
}

export default function SecurityCheck() {
  const [scanning, setScanning] = useState(false);
  const [killedApps, setKilledApps] = useState<string[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  const userApps = mockApps.filter((app) => !isSystemApp(app.packageName));
  const suspiciousApps = userApps.filter((app) => app.isSuspicious && !killedApps.includes(app.id));
  const runningUserApps = userApps.filter((app) => app.isRunning && !killedApps.includes(app.id));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const sensorAccesses: SensorAccess[] = [
    {
      sensor: 'location',
      label: 'GPS / Localisation',
      icon: MapPin,
      color: '#ff4444',
      apps: runningUserApps
        .filter((a) => a.permissions.includes('Localisation'))
        .map((a) => a.name),
      isActive: runningUserApps.some((a) => a.permissions.includes('Localisation')),
      risk: 'critical',
    },
    {
      sensor: 'microphone',
      label: 'Microphone',
      icon: Mic,
      color: '#ff8c00',
      apps: runningUserApps
        .filter((a) => a.permissions.includes('Microphone'))
        .map((a) => a.name),
      isActive: runningUserApps.some((a) => a.permissions.includes('Microphone')),
      risk: 'critical',
    },
    {
      sensor: 'camera',
      label: 'Caméra',
      icon: Camera,
      color: '#ff8c00',
      apps: runningUserApps
        .filter((a) => a.permissions.includes('Caméra'))
        .map((a) => a.name),
      isActive: runningUserApps.some((a) => a.permissions.includes('Caméra')),
      risk: 'high',
    },
    {
      sensor: 'network',
      label: 'Réseau / Internet',
      icon: Wifi,
      color: '#00c896',
      apps: runningUserApps
        .filter((a) => a.permissions.includes('Internet'))
        .map((a) => a.name),
      isActive: runningUserApps.some((a) => a.permissions.includes('Internet')),
      risk: 'medium',
    },
    {
      sensor: 'bluetooth',
      label: 'Contacts & Téléphone',
      icon: Radio,
      color: '#a855f7',
      apps: runningUserApps
        .filter((a) => a.permissions.includes('Contacts') || a.permissions.includes('Téléphone'))
        .map((a) => a.name),
      isActive: runningUserApps.some(
        (a) => a.permissions.includes('Contacts') || a.permissions.includes('Téléphone')
      ),
      risk: 'high',
    },
  ];

  const handleScan = () => {
    setScanning(true);
    Animated.timing(scanAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      scanAnim.setValue(0);
      setScanning(false);
    });
  };

  const handleKillApp = (appId: string, appName: string) => {
    Alert.alert(
      'Terminer le processus',
      `Voulez-vous forcer l'arrêt de ${appName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: () => setKilledApps((prev) => [...prev, appId]),
        },
      ]
    );
  };

  const handleKillAll = () => {
    Alert.alert(
      'Arrêter toutes les apps suspectes',
      `Terminer ${suspiciousApps.length} application(s) suspecte(s) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout arrêter',
          style: 'destructive',
          onPress: () =>
            setKilledApps((prev) => [...prev, ...suspiciousApps.map((a) => a.id)]),
        },
      ]
    );
  };

  const criticalCount = sensorAccesses.filter(
    (s) => s.isActive && s.risk === 'critical'
  ).length;

  const threatLevel =
    criticalCount >= 2 ? 'CRITIQUE' : criticalCount === 1 ? 'ÉLEVÉ' : suspiciousApps.length > 0 ? 'MODÉRÉ' : 'FAIBLE';

  const threatColor =
    threatLevel === 'CRITIQUE' ? '#ff2d2d' :
    threatLevel === 'ÉLEVÉ' ? '#ff8c00' :
    threatLevel === 'MODÉRÉ' ? '#f5c518' : '#00c896';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>SURVEILLANCE</Text>
          <Text style={styles.subtitle}>Activités en arrière-plan</Text>
        </View>
        <View style={[styles.threatBadge, { borderColor: threatColor }]}>
          <Animated.View style={[styles.threatDot, { backgroundColor: threatColor, transform: [{ scale: pulseAnim }] }]} />
          <Text style={[styles.threatText, { color: threatColor }]}>{threatLevel}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Threat Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewNumber, { color: '#ff4444' }]}>{suspiciousApps.length}</Text>
              <Text style={styles.overviewLabel}>Suspectes</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewNumber, { color: '#ff8c00' }]}>{runningUserApps.length}</Text>
              <Text style={styles.overviewLabel}>En cours</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewNumber, { color: '#00c896' }]}>{killedApps.length}</Text>
              <Text style={styles.overviewLabel}>Stoppées</Text>
            </View>
          </View>
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonActive]}
          onPress={handleScan}
          disabled={scanning}>
          <RefreshCw size={18} color={scanning ? '#0a0a0a' : '#00c896'} />
          <Text style={[styles.scanButtonText, scanning && styles.scanButtonTextActive]}>
            {scanning ? 'ANALYSE EN COURS...' : 'LANCER UNE ANALYSE'}
          </Text>
        </TouchableOpacity>

        {/* Sensor Access Monitor */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={16} color="#888" />
            <Text style={styles.sectionTitle}>ACCÈS AUX CAPTEURS</Text>
          </View>
          <Text style={styles.sectionNote}>
            Apps utilisateurs uniquement — processus système exclus
          </Text>

          {sensorAccesses.map((sensor, index) => (
            <View
              key={index}
              style={[
                styles.sensorCard,
                sensor.isActive && { borderColor: sensor.color + '40' },
              ]}>
              <View style={styles.sensorLeft}>
                <View style={[styles.sensorIconWrap, { backgroundColor: sensor.color + '18' }]}>
                  <sensor.icon size={20} color={sensor.isActive ? sensor.color : '#444'} />
                </View>
                <View style={styles.sensorInfo}>
                  <Text style={[styles.sensorName, sensor.isActive && { color: '#f0f0f0' }]}>
                    {sensor.label}
                  </Text>
                  <Text style={styles.sensorApps}>
                    {sensor.apps.length > 0 ? sensor.apps.join(', ') : 'Aucune app active'}
                  </Text>
                </View>
              </View>
              <View style={[styles.sensorStatus, { backgroundColor: sensor.isActive ? sensor.color : '#2a2a2a' }]}>
                <View style={styles.statusDot} />
              </View>
            </View>
          ))}
        </View>

        {/* Suspicious Apps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={16} color="#ff4444" />
            <Text style={[styles.sectionTitle, { color: '#ff4444' }]}>APPLICATIONS SUSPECTES</Text>
          </View>

          {suspiciousApps.length === 0 ? (
            <View style={styles.emptyState}>
              <Lock size={32} color="#00c896" />
              <Text style={styles.emptyText}>Aucune menace détectée</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.killAllButton} onPress={handleKillAll}>
                <Zap size={16} color="#ff4444" />
                <Text style={styles.killAllText}>Tout arrêter ({suspiciousApps.length})</Text>
              </TouchableOpacity>

              {suspiciousApps.map((app) => (
                <View key={app.id} style={styles.suspiciousCard}>
                  <TouchableOpacity
                    style={styles.suspiciousMain}
                    onPress={() => router.push(`/app/${app.id}`)}>
                    <View style={styles.suspiciousIcon}>
                      <Text style={styles.suspiciousIconText}>{app.icon}</Text>
                    </View>
                    <View style={styles.suspiciousInfo}>
                      <View style={styles.suspiciousNameRow}>
                        <Text style={styles.suspiciousName}>{app.name}</Text>
                        {app.isRunning && (
                          <View style={styles.runningPill}>
                            <View style={styles.runningDot} />
                            <Text style={styles.runningText}>ACTIF</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.suspiciousPackage}>{app.packageName}</Text>
                      <View style={styles.permissionPills}>
                        {app.permissions
                          .filter((p) => ['Localisation', 'Microphone', 'Caméra', 'Contacts', 'Téléphone'].includes(p))
                          .map((perm, i) => (
                            <View key={i} style={styles.permPill}>
                              <Text style={styles.permPillText}>{perm}</Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {app.isRunning && (
                    <TouchableOpacity
                      style={styles.killButton}
                      onPress={() => handleKillApp(app.id, app.name)}>
                      <X size={16} color="#fff" />
                      <Text style={styles.killButtonText}>Stop</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </>
          )}
        </View>

        {/* All Running User Apps */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <Radio size={16} color="#888" />
            <Text style={styles.sectionTitle}>PROCESSUS EN ARRIÈRE-PLAN</Text>
          </View>
          <Text style={styles.sectionNote}>
            Toutes les apps utilisateur actives (hors système)
          </Text>

          {runningUserApps.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun processus actif</Text>
            </View>
          ) : (
            runningUserApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.processRow}
                onPress={() => router.push(`/app/${app.id}`)}>
                <Text style={styles.processIcon}>{app.icon}</Text>
                <View style={styles.processInfo}>
                  <Text style={styles.processName}>{app.name}</Text>
                  <Text style={styles.processData}>
                    RAM: {app.ramUsage}MB · Data: {(app.dataUsage / 1024).toFixed(1)}GB
                  </Text>
                </View>
                {app.isSuspicious && <AlertTriangle size={16} color="#ff4444" />}
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0f0f0f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  headerLeft: {},
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#f0f0f0',
    letterSpacing: 3,
  },
  subtitle: { fontSize: 12, color: '#555', marginTop: 2, letterSpacing: 1 },

  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  threatDot: { width: 8, height: 8, borderRadius: 4 },
  threatText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  content: { flex: 1 },

  overviewCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    padding: 20,
  },
  overviewRow: { flexDirection: 'row', alignItems: 'center' },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewNumber: { fontSize: 32, fontWeight: '900' },
  overviewLabel: { fontSize: 11, color: '#555', marginTop: 2, letterSpacing: 0.5 },
  overviewDivider: { width: 1, height: 40, backgroundColor: '#1e1e1e' },

  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00c896',
    gap: 8,
    backgroundColor: 'transparent',
  },
  scanButtonActive: { backgroundColor: '#00c896' },
  scanButtonText: { color: '#00c896', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  scanButtonTextActive: { color: '#0a0a0a' },

  section: { paddingHorizontal: 20, paddingTop: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 2,
  },
  sectionNote: { fontSize: 12, color: '#3a3a3a', marginBottom: 14, marginLeft: 24 },

  sensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    padding: 14,
    marginBottom: 8,
  },
  sensorLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sensorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sensorInfo: { flex: 1 },
  sensorName: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 2 },
  sensorApps: { fontSize: 11, color: '#3a3a3a' },
  sensorStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyText: { fontSize: 14, color: '#444' },

  killAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  killAllText: { color: '#ff4444', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  suspiciousCard: {
    backgroundColor: '#110808',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff444430',
    marginBottom: 10,
    overflow: 'hidden',
  },
  suspiciousMain: { flexDirection: 'row', padding: 14, alignItems: 'flex-start' },
  suspiciousIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suspiciousIconText: { fontSize: 22 },
  suspiciousInfo: { flex: 1 },
  suspiciousNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  suspiciousName: { fontSize: 15, fontWeight: '700', color: '#f0f0f0' },
  suspiciousPackage: { fontSize: 11, color: '#444', marginBottom: 8 },
  runningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00c89620',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  runningDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#00c896' },
  runningText: { fontSize: 9, fontWeight: '800', color: '#00c896', letterSpacing: 1 },
  permissionPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  permPill: {
    backgroundColor: '#ff44441a',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  permPillText: { fontSize: 10, color: '#ff8888', fontWeight: '600' },

  killButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3333',
    paddingVertical: 10,
    gap: 6,
  },
  killButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  processRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  processIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  processInfo: { flex: 1 },
  processName: { fontSize: 14, fontWeight: '600', color: '#ccc' },
  processData: { fontSize: 11, color: '#444', marginTop: 2 },
});