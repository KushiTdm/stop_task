import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Search, ListFilter as Filter, Cpu, Wifi, X, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { AppInfo } from '@/types/app';
import { mockApps, systemStats, formatBytes } from '@/utils/mockData';

export default function AppsMonitor() {
  const [apps, setApps] = useState<AppInfo[]>(mockApps);
  const [filteredApps, setFilteredApps] = useState<AppInfo[]>(mockApps);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'running' | 'suspicious'>(
    'all'
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    filterApps();
  }, [searchQuery, filterMode, apps]);

  const filterApps = () => {
    let filtered = [...apps];

    if (filterMode === 'running') {
      filtered = filtered.filter((app) => app.isRunning);
    } else if (filterMode === 'suspicious') {
      filtered = filtered.filter((app) => app.isSuspicious);
    }

    if (searchQuery) {
      filtered = filtered.filter((app) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApps(filtered);
  };

  const handleStopApp = (appId: string) => {
    setApps((prevApps) =>
      prevApps.map((app) =>
        app.id === appId ? { ...app, isRunning: false, ramUsage: 0 } : app
      )
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setApps([...mockApps]);
      setRefreshing(false);
    }, 1000);
  };

  const ramPercentage = (systemStats.usedRam / systemStats.totalRam) * 100;
  const dataPercentage = (systemStats.usedData / systemStats.totalData) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestionnaire d'Apps</Text>
        <Text style={styles.subtitle}>
          Surveillez et contrôlez vos applications
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Cpu size={20} color="#3b82f6" />
            <Text style={styles.statLabel}>RAM</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${ramPercentage}%` }]}
            />
          </View>
          <Text style={styles.statValue}>
            {formatBytes(systemStats.usedRam)} / {formatBytes(systemStats.totalRam)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Wifi size={20} color="#10b981" />
            <Text style={styles.statLabel}>Data</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${dataPercentage}%`, backgroundColor: '#10b981' },
              ]}
            />
          </View>
          <Text style={styles.statValue}>
            {formatBytes(systemStats.usedData)} / {formatBytes(systemStats.totalData)}
          </Text>
        </View>
      </View>

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

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterMode === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterMode('all')}>
          <Text
            style={[
              styles.filterText,
              filterMode === 'all' && styles.filterTextActive,
            ]}>
            Toutes ({apps.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterMode === 'running' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterMode('running')}>
          <Text
            style={[
              styles.filterText,
              filterMode === 'running' && styles.filterTextActive,
            ]}>
            Actives ({apps.filter((a) => a.isRunning).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterMode === 'suspicious' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterMode('suspicious')}>
          <Text
            style={[
              styles.filterText,
              filterMode === 'suspicious' && styles.filterTextActive,
            ]}>
            Suspectes ({apps.filter((a) => a.isSuspicious).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.appsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {filteredApps.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={styles.appCard}
            onPress={() => router.push(`/app/${app.id}`)}>
            <View style={styles.appHeader}>
              <View style={styles.appIcon}>
                <Text style={styles.appIconText}>{app.icon}</Text>
              </View>
              <View style={styles.appInfo}>
                <View style={styles.appNameRow}>
                  <Text style={styles.appName}>{app.name}</Text>
                  {app.isSuspicious && (
                    <View style={styles.suspiciousBadge}>
                      <AlertTriangle size={12} color="#ef4444" />
                    </View>
                  )}
                </View>
                <Text style={styles.appPackage}>{app.packageName}</Text>
              </View>
              {app.isRunning && (
                <View style={styles.runningIndicator}>
                  <View style={styles.runningDot} />
                </View>
              )}
            </View>

            <View style={styles.appStats}>
              <View style={styles.appStat}>
                <Text style={styles.appStatLabel}>RAM</Text>
                <Text style={styles.appStatValue}>
                  {formatBytes(app.ramUsage)}
                </Text>
              </View>
              <View style={styles.appStat}>
                <Text style={styles.appStatLabel}>Data</Text>
                <Text style={styles.appStatValue}>
                  {formatBytes(app.dataUsage)}
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
                  handleStopApp(app.id);
                }}>
                <X size={16} color="#ffffff" />
                <Text style={styles.stopButtonText}>Arrêter</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  statValue: {
    fontSize: 11,
    color: '#6b7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  appsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  appCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 24,
  },
  appInfo: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  appPackage: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  suspiciousBadge: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 3,
  },
  runningIndicator: {
    marginLeft: 8,
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  appStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  appStat: {
    flex: 1,
  },
  appStatLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  appStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
