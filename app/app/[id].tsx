import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, X, Cpu, Wifi, Shield, Clock, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { mockApps, formatBytes, formatTime } from '@/utils/mockData';

export default function AppDetails() {
  const { id } = useLocalSearchParams();
  const app = mockApps.find((a) => a.id === id);
  const [isRunning, setIsRunning] = useState(app?.isRunning || false);

  if (!app) {
    return (
      <View style={styles.container}>
        <Text>Application non trouvée</Text>
      </View>
    );
  }

  const handleStopApp = () => {
    setIsRunning(false);
  };

  const permissionColors: { [key: string]: string } = {
    Internet: '#3b82f6',
    Localisation: '#ef4444',
    Caméra: '#f59e0b',
    Microphone: '#f59e0b',
    Contacts: '#ef4444',
    Stockage: '#6b7280',
    Téléphone: '#ef4444',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de l'application</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.appHeader}>
          <View style={styles.appIconLarge}>
            <Text style={styles.appIconTextLarge}>{app.icon}</Text>
          </View>
          <Text style={styles.appName}>{app.name}</Text>
          <Text style={styles.appPackage}>{app.packageName}</Text>

          {app.isSuspicious && (
            <View style={styles.suspiciousAlert}>
              <AlertTriangle size={20} color="#ef4444" />
              <Text style={styles.suspiciousText}>
                Cette application a des permissions suspectes
              </Text>
            </View>
          )}

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isRunning ? '#d1fae5' : '#f3f4f6' },
              ]}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isRunning ? '#10b981' : '#9ca3af' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isRunning ? '#065f46' : '#6b7280' },
                ]}>
                {isRunning ? 'En cours d\'exécution' : 'Arrêtée'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consommation</Text>

          <View style={styles.consumptionCard}>
            <View style={styles.consumptionItem}>
              <View style={styles.consumptionIcon}>
                <Cpu size={24} color="#3b82f6" />
              </View>
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Mémoire RAM</Text>
                <Text style={styles.consumptionValue}>
                  {isRunning ? formatBytes(app.ramUsage) : '0 MB'}
                </Text>
              </View>
            </View>

            <View style={styles.consumptionItem}>
              <View style={styles.consumptionIcon}>
                <Wifi size={24} color="#10b981" />
              </View>
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Données mobiles</Text>
                <Text style={styles.consumptionValue}>
                  {formatBytes(app.dataUsage)}
                </Text>
              </View>
            </View>

            <View style={styles.consumptionItem}>
              <View style={styles.consumptionIcon}>
                <Clock size={24} color="#f59e0b" />
              </View>
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Dernière utilisation</Text>
                <Text style={styles.consumptionValue}>
                  {formatTime(app.lastUsed)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Permissions ({app.permissions.length})
          </Text>
          <Text style={styles.sectionSubtitle}>
            Accès accordés à cette application
          </Text>

          <View style={styles.permissionsGrid}>
            {app.permissions.map((permission, index) => (
              <View key={index} style={styles.permissionItem}>
                <Shield
                  size={16}
                  color={permissionColors[permission] || '#6b7280'}
                />
                <Text style={styles.permissionText}>{permission}</Text>
              </View>
            ))}
          </View>

          {app.isSuspicious && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Avertissement</Text>
              <Text style={styles.warningText}>
                Cette application demande un grand nombre de permissions
                sensibles incluant l'accès à votre localisation, contacts,
                caméra et microphone. Assurez-vous de faire confiance à cette
                application avant de continuer à l'utiliser.
              </Text>
            </View>
          )}
        </View>

        {isRunning && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopApp}>
            <X size={20} color="#ffffff" />
            <Text style={styles.stopButtonText}>Arrêter l'application</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Cette application utilise des données simulées. Pour une
            surveillance réelle des applications, des permissions système
            Android avancées sont nécessaires (USAGE_STATS,
            KILL_BACKGROUND_PROCESSES).
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  appHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  appIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appIconTextLarge: {
    fontSize: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  appPackage: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  suspiciousAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  suspiciousText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
    flex: 1,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  consumptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 16,
  },
  consumptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consumptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  consumptionInfo: {
    flex: 1,
  },
  consumptionLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  consumptionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  permissionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 20,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 20,
  },
});
