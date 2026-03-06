import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Search, Cpu, Wifi, X, TriangleAlert as AlertTriangle, Zap } from 'lucide-react-native';
import { useAppMonitor } from '@/modules/useAppMonitor';
import AppMonitorAPI from '@/modules/AppMonitorAPI';

export default function AppsMonitor() {
  const {
    apps,
    systemRam,
    hasPermission,
    loading,
    error,
    refresh,
    killApp,
    openUsageSettings,
  } = useAppMonitor(30_000); // auto-refresh every 30s

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'running' | 'suspicious'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredApps = useMemo(() => {
    let list = [...apps];
    if (filterMode === 'running') list = list.filter((a) => a.isRunning);
    if (filterMode === 'suspicious') list = list.filter((a) => a.isSuspicious);
    if (searchQuery) {
      list = list.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [apps, filterMode, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleKillAll = () => {
    Alert.alert(
      'Libérer la RAM',
      'Arrêter toutes les applications non-système ? Cela libérera de la mémoire.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Libérer',
          style: 'destructive',
          onPress: async () => {
            try {
              const killed = await AppMonitorAPI.killAllNonSystemApps();
              await refresh();
              Alert.alert('RAM libérée', `${killed.length} application(s) arrêtée(s).`);
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  };

  const handleKill = (packageName: string, name: string) => {
    Alert.alert(
      'Arrêter l\'application',
      `Voulez-vous arrêter ${name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: () => killApp(packageName),
        },
      ]
    );
  };

  const ramPercentage = systemRam
    ? (systemRam.usedRam / systemRam.totalRam) * 100
    : 0;

  const totalData = apps.reduce((sum, a) => sum + a.dataUsage, 0);

  if (!hasPermission && !loading) {
    return (
      <View style={styles.permissionContainer}>
        <AlertTriangle size={48} color="#f59e0b" />
        <Text style={styles.permissionTitle}>Permission requise</Text>
        <Text style={styles.permissionText}>
          Pour afficher les statistiques réelles d'utilisation des apps, vous
          devez autoriser l'accès aux statistiques d'utilisation.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={openUsageSettings}>
          <Text style={styles.permissionButtonText}>Ouvrir les paramètres</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionButtonSecondary} onPress={refresh}>
          <Text style={styles.permissionButtonSecondaryText}>J'ai accordé la permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gestionnaire d'Apps</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Chargement...' : `${apps.length} applications • Données réelles`}
          </Text>
        </View>
        <TouchableOpacity style={styles.killAllBtn} onPress={handleKillAll}>
          <Zap size={16} color="#fff" />
          <Text style={styles.killAllBtnText}>Libérer RAM</Text>
        </TouchableOpacity>
      </View>

      {/* System stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Cpu size={20} color="#3b82f6" />
            <Text style={styles.statLabel}>RAM</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${ramPercentage}%` }]} />
          </View>
          <Text style={styles.statValue}>
            {systemRam
              ? `${systemRam.usedRam.toFixed(0)} MB / ${systemRam.totalRam.toFixed(0)} MB`
              : '—'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Wifi size={20} color="#10b981" />
            <Text style={styles.statLabel}>Data (total)</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: '60%', backgroundColor: '#10b981' }]}
            />
          </View>
          <Text style={styles.statValue}>{totalData.toFixed(0)} MB utilisés</Text>
        </View>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une application..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {(['all', 'running', 'suspicious'] as const).map((mode) => {
          const labels = {
            all: `Toutes (${apps.length})`,
            running: `Actives (${apps.filter((a) => a.isRunning).length})`,
            suspicious: `Suspectes (${apps.filter((a) => a.isSuspicious).length})`,
          };
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.filterButton, filterMode === mode && styles.filterButtonActive]}
              onPress={() => setFilterMode(mode)}>
              <Text style={[styles.filterText, filterMode === mode && styles.filterTextActive]}>
                {labels[mode]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* App list */}
      {loading && apps.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Lecture des applications...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.appsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {filteredApps.map((app) => (
            <TouchableOpacity
              key={app.packageName}
              style={styles.appCard}
              onPress={() => router.push(`/app/${encodeURIComponent(app.packageName)}`)}>
              <View style={styles.appHeader}>
                <View style={styles.appIcon}>
                  <Text style={styles.appIconText}>
                    {app.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.appInfo}>
                  <View style={styles.appNameRow}>
                    <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
                    {app.isSuspicious && (
                      <View style={styles.suspiciousBadge}>
                        <AlertTriangle size={12} color="#ef4444" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.appPackage} numberOfLines={1}>{app.packageName}</Text>
                </View>
                {app.isRunning && (
                  <View style={styles.runningDot} />
                )}
              </View>

              <View style={styles.appStats}>
                <View style={styles.appStat}>
                  <Text style={styles.appStatLabel}>RAM</Text>
                  <Text style={styles.appStatValue}>
                    {app.isRunning ? `${app.ramUsage.toFixed(0)} MB` : '0 MB'}
                  </Text>
                </View>
                <View style={styles.appStat}>
                  <Text style={styles.appStatLabel}>Data</Text>
                  <Text style={styles.appStatValue}>
                    {app.dataUsage > 1024
                      ? `${(app.dataUsage / 1024).toFixed(1)} GB`
                      : `${app.dataUsage.toFixed(0)} MB`}
                  </Text>
                </View>
                <View style={styles.appStat}>
                  <Text style={styles.appStatLabel}>Permissions</Text>
                  <Text style={styles.appStatValue}>{app.permissions.length}</Text>
                </View>
              </View>

              {app.isRunning && (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleKill(app.packageName, app.name);
                  }}>
                  <X size={16} color="#ffffff" />
                  <Text style={styles.stopButtonText}>Arrêter</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  killAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  killAllBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  statsContainer: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16,
    gap: 12, backgroundColor: '#ffffff',
  },
  statCard: {
    flex: 1, padding: 12, backgroundColor: '#f9fafb',
    borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  progressBar: {
    height: 6, backgroundColor: '#e5e7eb', borderRadius: 3,
    marginBottom: 6, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  statValue: { fontSize: 11, color: '#6b7280' },
  errorBanner: {
    backgroundColor: '#fee2e2', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#fca5a5',
  },
  errorText: { color: '#991b1b', fontSize: 13 },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#ffffff' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    gap: 8, borderWidth: 1, borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterContainer: {
    flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12,
    gap: 8, backgroundColor: '#ffffff',
  },
  filterButton: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
  },
  filterButtonActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#ffffff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#6b7280', fontSize: 15 },
  appsList: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  appCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb',
  },
  appHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  appIcon: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  appIconText: { fontSize: 20, fontWeight: '700', color: '#3b82f6' },
  appInfo: { flex: 1 },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  appPackage: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  suspiciousBadge: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 3 },
  runningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  appStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  appStat: { flex: 1 },
  appStatLabel: {
    fontSize: 11, color: '#9ca3af', marginBottom: 2,
    textTransform: 'uppercase', fontWeight: '600',
  },
  appStatValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  stopButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 10, gap: 6,
  },
  stopButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  permissionContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  permissionText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  permissionButton: {
    backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12, marginTop: 8,
  },
  permissionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  permissionButtonSecondary: { paddingVertical: 10 },
  permissionButtonSecondaryText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});