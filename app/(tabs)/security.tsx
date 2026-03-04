import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Eye, Wifi, MapPin, Mic, Camera, RefreshCw } from 'lucide-react-native';
import { mockApps } from '@/utils/mockData';

interface SecurityIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  icon: string;
  appId?: string;
}

export default function SecurityCheck() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(true);

  const suspiciousApps = mockApps.filter((app) => app.isSuspicious);

  const securityIssues: SecurityIssue[] = [
    {
      id: '1',
      type: 'critical',
      title: 'Applications avec permissions excessives',
      description: `${suspiciousApps.length} applications ont accès à des données sensibles`,
      icon: '🔴',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Accès à la localisation en arrière-plan',
      description:
        '3 applications peuvent suivre votre position même fermées',
      icon: '⚠️',
    },
    {
      id: '3',
      type: 'warning',
      title: 'Accès microphone et caméra',
      description: '5 applications ont accès à votre caméra et microphone',
      icon: '🎤',
    },
    {
      id: '4',
      type: 'info',
      title: 'Connexions réseau actives',
      description: '8 applications communiquent actuellement avec des serveurs',
      icon: '📡',
    },
  ];

  const trackingIndicators = [
    {
      name: 'Localisation GPS',
      active: true,
      apps: ['Facebook', 'TikTok', 'Instagram'],
      icon: MapPin,
      color: '#ef4444',
    },
    {
      name: 'Microphone',
      active: false,
      apps: ['WhatsApp', 'Facebook'],
      icon: Mic,
      color: '#f59e0b',
    },
    {
      name: 'Caméra',
      active: false,
      apps: ['Instagram', 'TikTok'],
      icon: Camera,
      color: '#f59e0b',
    },
    {
      name: 'Réseau',
      active: true,
      apps: ['Chrome', 'YouTube', 'Spotify'],
      icon: Wifi,
      color: '#10b981',
    },
  ];

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2000);
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const securityScore = Math.max(
    0,
    100 - suspiciousApps.length * 15 - securityIssues.length * 5
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analyse de Sécurité</Text>
        <Text style={styles.subtitle}>
          Détectez les menaces et le tracking
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Shield
              size={32}
              color={securityScore > 70 ? '#10b981' : '#ef4444'}
            />
            <Text style={styles.scoreValue}>{securityScore}</Text>
            <Text style={styles.scoreLabel}>Score de sécurité</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>
              {securityScore > 70
                ? 'Sécurité correcte'
                : 'Attention requise'}
            </Text>
            <Text style={styles.scoreDescription}>
              {securityScore > 70
                ? 'Votre appareil est relativement sécurisé'
                : 'Des applications suspectes ont été détectées'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonScanning]}
          onPress={handleScan}
          disabled={scanning}>
          <RefreshCw
            size={20}
            color="#ffffff"
            style={scanning ? styles.spinning : undefined}
          />
          <Text style={styles.scanButtonText}>
            {scanning ? 'Analyse en cours...' : 'Lancer une analyse'}
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problèmes détectés</Text>

          {securityIssues.map((issue) => (
            <TouchableOpacity key={issue.id} style={styles.issueCard}>
              <View
                style={[
                  styles.issueIcon,
                  { backgroundColor: `${getIssueColor(issue.type)}20` },
                ]}>
                <Text style={styles.issueIconText}>{issue.icon}</Text>
              </View>
              <View style={styles.issueContent}>
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueDescription}>{issue.description}</Text>
              </View>
              <View
                style={[
                  styles.issueBadge,
                  { backgroundColor: getIssueColor(issue.type) },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs de tracking</Text>
          <Text style={styles.sectionSubtitle}>
            Surveillance des accès en temps réel
          </Text>

          {trackingIndicators.map((indicator, index) => (
            <View key={index} style={styles.indicatorCard}>
              <View style={styles.indicatorHeader}>
                <View
                  style={[
                    styles.indicatorIcon,
                    { backgroundColor: `${indicator.color}20` },
                  ]}>
                  <indicator.icon size={20} color={indicator.color} />
                </View>
                <View style={styles.indicatorInfo}>
                  <Text style={styles.indicatorName}>{indicator.name}</Text>
                  <Text style={styles.indicatorApps}>
                    {indicator.apps.join(', ')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.indicatorStatus,
                    {
                      backgroundColor: indicator.active
                        ? '#10b981'
                        : '#9ca3af',
                    },
                  ]}>
                  <View style={styles.indicatorDot} />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applications suspectes</Text>
          <Text style={styles.sectionSubtitle}>
            {suspiciousApps.length} application(s) nécessitant votre attention
          </Text>

          {suspiciousApps.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.appCard}
              onPress={() => router.push(`/app/${app.id}`)}>
              <View style={styles.appIcon}>
                <Text style={styles.appIconText}>{app.icon}</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appReason}>
                  {app.permissions.length} permissions sensibles
                </Text>
              </View>
              <AlertTriangle size={20} color="#ef4444" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Eye size={20} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Protection de la vie privée</Text>
            <Text style={styles.infoText}>
              Cette analyse utilise des données simulées. Pour une protection
              complète, des outils système Android natifs sont nécessaires pour
              surveiller les activités réseau, accès aux capteurs et
              comportements suspects en temps réel.
            </Text>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: '#fef3c7' }]}>
          <Text style={styles.warningText}>
            💡 Recommandations de sécurité:
            {'\n'}• Révoquez les permissions inutiles
            {'\n'}• Désinstallez les apps non utilisées
            {'\n'}• Vérifiez régulièrement les permissions
            {'\n'}• Utilisez un VPN pour les connexions sensibles
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
  content: {
    flex: 1,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonScanning: {
    backgroundColor: '#60a5fa',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spinning: {
    animation: 'spin 1s linear infinite',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
    marginBottom: 12,
  },
  issueCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  issueIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  issueIconText: {
    fontSize: 20,
  },
  issueContent: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  issueDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  issueBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  indicatorCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  indicatorInfo: {
    flex: 1,
  },
  indicatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  indicatorApps: {
    fontSize: 12,
    color: '#6b7280',
  },
  indicatorStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  appCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    alignItems: 'center',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 20,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  appReason: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  warningText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 22,
  },
});
