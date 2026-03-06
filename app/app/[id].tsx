import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, X, Cpu, Wifi, Shield, Clock, TriangleAlert as AlertTriangle,
} from 'lucide-react-native';
import AppMonitorAPI, { RealAppInfo } from '@/modules/AppMonitorAPI';

const SENSITIVE_PERMS = [
  'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
  'RECORD_AUDIO', 'CAMERA',
  'READ_CONTACTS', 'READ_CALL_LOG',
  'READ_SMS', 'READ_PHONE_STATE',
];

function permColor(perm: string): string {
  if (perm.includes('LOCATION')) return '#ef4444';
  if (perm.includes('AUDIO') || perm.includes('CAMERA')) return '#f59e0b';
  if (perm.includes('CONTACT') || perm.includes('CALL') || perm.includes('SMS')) return '#ef4444';
  if (perm.includes('INTERNET') || perm.includes('NETWORK')) return '#3b82f6';
  return '#6b7280';
}

function formatLastUsed(ts: number): string {
  if (!ts) return 'Jamais';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (min < 1) return 'À l\'instant';
  if (min < 60) return `Il y a ${min} min`;
  if (h < 24) return `Il y a ${h}h`;
  return new Date(ts).toLocaleDateString('fr-FR');
}

export default function AppDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const packageName = decodeURIComponent(id ?? '');

  const [app, setApp] = useState<RealAppInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [killing, setKilling] = useState(false);

  useEffect(() => {
    loadApp();
  }, [packageName]);

  const loadApp = async () => {
    try {
      setLoading(true);
      const apps = await AppMonitorAPI.getInstalledApps();
      const found = apps.find((a) => a.packageName === packageName) ?? null;
      setApp(found);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKill = async () => {
    if (!app) return;
    Alert.alert(
      'Arrêter l\'application',
      `Arrêter ${app.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: async () => {
            setKilling(true);
            await AppMonitorAPI.killApp(packageName);
            setApp((prev) => prev ? { ...prev, isRunning: false, ramUsage: 0 } : null);
            setKilling(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.notFound}>Application non trouvée</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* App identity */}
        <View style={styles.appHeader}>
          <View style={styles.appIconLarge}>
            <Text style={styles.appIconText}>{app.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.appName}>{app.name}</Text>
          <Text style={styles.appPackage}>{app.packageName}</Text>

          {app.isSuspicious && (
            <View style={styles.suspiciousAlert}>
              <AlertTriangle size={20} color="#ef4444" />
              <Text style={styles.suspiciousText}>Permissions suspectes détectées</Text>
            </View>
          )}

          <View style={[styles.statusBadge, { backgroundColor: app.isRunning ? '#d1fae5' : '#f3f4f6' }]}>
            <View style={[styles.statusDot, { backgroundColor: app.isRunning ? '#10b981' : '#9ca3af' }]} />
            <Text style={[styles.statusText, { color: app.isRunning ? '#065f46' : '#6b7280' }]}>
              {app.isRunning ? 'En cours d\'exécution' : 'Arrêtée'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consommation réelle</Text>
          <View style={styles.consumptionCard}>
            <View style={styles.consumptionItem}>
              <View style={styles.consumptionIcon}><Cpu size={24} color="#3b82f6" /></View>
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Mémoire RAM</Text>
                <Text style={styles.consumptionValue}>
                  {app.isRunning ? `${app.ramUsage.toFixed(0)} MB` : '0 MB'}
                </Text>
              </View>
            </View>
            <View style={styles.consumptionItem}>
              <View style={styles.consumptionIcon}><Wifi size={24} color="#10b981" /></View>
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Données réseau (UID)</Text>
                <Text style={styles.consumptionValue}>
                  {app.dataUsage > 1024
                    ? `${(app.dataUsage / 1024).toFixed(2)} GB`
                    : `${app.dataUsage.toFixed(0)} MB`}
                </Text>
              </View>
            </View>
            <View style={styles.consumptionItem}>
              <View style={styles.consumptionIcon}><Clock size={24} color="#f59e0b" /></View>
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Dernière utilisation</Text>
                <Text style={styles.consumptionValue}>{formatLastUsed(app.lastTimeUsed)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions ({app.permissions.length})</Text>
          <Text style={styles.sectionSubtitle}>
            {app.permissions.filter((p) => SENSITIVE_PERMS.includes(p)).length} permission(s) sensible(s)
          </Text>
          <View style={styles.permissionsGrid}>
            {app.permissions.slice(0, 30).map((perm, i) => (
              <View key={i} style={[styles.permissionItem, {
                borderColor: SENSITIVE_PERMS.includes(perm) ? '#fca5a5' : '#e5e7eb',
                backgroundColor: SENSITIVE_PERMS.includes(perm) ? '#fff5f5' : '#ffffff',
              }]}>
                <Shield size={14} color={permColor(perm)} />
                <Text style={styles.permissionText} numberOfLines={1}>{perm}</Text>
              </View>
            ))}
            {app.permissions.length > 30 && (
              <Text style={styles.morePerms}>+{app.permissions.length - 30} autres</Text>
            )}
          </View>
        </View>

        {/* Kill button */}
        {app.isRunning && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleKill}
            disabled={killing}>
            {killing
              ? <ActivityIndicator size="small" color="#fff" />
              : <X size={20} color="#ffffff" />}
            <Text style={styles.stopButtonText}>
              {killing ? 'Arrêt...' : 'Arrêter l\'application'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 18, color: '#6b7280', marginBottom: 12 },
  backLink: { color: '#3b82f6', fontSize: 15 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1 },
  appHeader: {
    alignItems: 'center', paddingVertical: 32,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  appIconLarge: {
    width: 80, height: 80, borderRadius: 20, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
  },
  appIconText: { fontSize: 36, fontWeight: '700', color: '#3b82f6' },
  appName: { fontSize: 24, fontWeight: '700', color: '#111827' },
  appPackage: { fontSize: 13, color: '#9ca3af' },
  suspiciousAlert: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8,
  },
  suspiciousText: { fontSize: 13, color: '#991b1b', fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '600' },
  section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  consumptionCard: {
    backgroundColor: '#ffffff', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 16,
  },
  consumptionItem: { flexDirection: 'row', alignItems: 'center' },
  consumptionIcon: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#f9fafb',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  consumptionInfo: { flex: 1 },
  consumptionLabel: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  consumptionValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  permissionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  permissionItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 5, maxWidth: '100%',
  },
  permissionText: { fontSize: 12, color: '#374151', fontWeight: '500', flexShrink: 1 },
  morePerms: { fontSize: 13, color: '#9ca3af', alignSelf: 'center' },
  stopButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ef4444', marginHorizontal: 20, marginTop: 24,
    paddingVertical: 16, borderRadius: 12, gap: 8,
  },
  stopButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});