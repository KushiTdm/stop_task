import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  Bell,
  Shield,
  Smartphone,
  Info,
  ChevronRight,
  RefreshCw,
  Trash2,
  Eye,
} from 'lucide-react-native';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  onPress?: () => void;
}

export default function Settings() {
  const [autoScan, setAutoScan] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [dataMonitoring, setDataMonitoring] = useState(true);
  const [suspiciousAppAlert, setSuspiciousAppAlert] = useState(true);

  const settingsGroups = [
    {
      title: 'Surveillance',
      items: [
        {
          id: 'auto-scan',
          title: 'Analyse automatique',
          description: 'Scanner automatiquement les nouvelles applications',
          icon: RefreshCw,
          type: 'toggle',
          value: autoScan,
          onPress: () => setAutoScan(!autoScan),
        },
        {
          id: 'data-monitoring',
          title: 'Surveillance des données',
          description: 'Surveiller la consommation data en temps réel',
          icon: Smartphone,
          type: 'toggle',
          value: dataMonitoring,
          onPress: () => setDataMonitoring(!dataMonitoring),
        },
        {
          id: 'tracking-detection',
          title: 'Détection de tracking',
          description: 'Alerter des accès suspects aux capteurs',
          icon: Eye,
          type: 'toggle',
          value: true,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Activer les notifications',
          description: 'Recevoir des alertes de sécurité',
          icon: Bell,
          type: 'toggle',
          value: notifications,
          onPress: () => setNotifications(!notifications),
        },
        {
          id: 'suspicious-alert',
          title: 'Alertes applications suspectes',
          description: 'Notifier lors de la détection d\'apps suspectes',
          icon: Shield,
          type: 'toggle',
          value: suspiciousAppAlert,
          onPress: () => setSuspiciousAppAlert(!suspiciousAppAlert),
        },
      ],
    },
    {
      title: 'Données',
      items: [
        {
          id: 'clear-cache',
          title: 'Effacer le cache',
          description: 'Libérer de l\'espace de stockage',
          icon: Trash2,
          type: 'action',
          onPress: () => alert('Cache effacé'),
        },
        {
          id: 'reset-stats',
          title: 'Réinitialiser les statistiques',
          description: 'Effacer toutes les données de surveillance',
          icon: RefreshCw,
          type: 'action',
          onPress: () => alert('Statistiques réinitialisées'),
        },
      ],
    },
    {
      title: 'À propos',
      items: [
        {
          id: 'about',
          title: 'À propos de l\'application',
          description: 'Version 1.0.0',
          icon: Info,
          type: 'navigation',
          onPress: () => {},
        },
        {
          id: 'permissions',
          title: 'Permissions requises',
          description: 'Voir les permissions nécessaires',
          icon: Shield,
          type: 'navigation',
          onPress: () => {},
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.id} style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <item.icon size={20} color="#6b7280" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={item.value ? '#3b82f6' : '#f3f4f6'}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}>
        <View style={styles.settingIcon}>
          <item.icon size={20} color="#6b7280" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        {item.type === 'navigation' && <ChevronRight size={20} color="#9ca3af" />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <Text style={styles.subtitle}>
          Configurez votre expérience de surveillance
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.limitationsCard}>
          <Text style={styles.limitationsTitle}>
            ⚠️ Limitations de l'application
          </Text>
          <Text style={styles.limitationsText}>
            Cette application est une démonstration construite avec Expo. Pour
            une surveillance complète des applications Android, les
            fonctionnalités suivantes nécessitent:
            {'\n\n'}
            • Permission USAGE_STATS (accès aux statistiques d'utilisation)
            {'\n'}• Permission KILL_BACKGROUND_PROCESSES (arrêt d'apps)
            {'\n'}• API PackageManager native Android
            {'\n'}• Service Android en arrière-plan
            {'\n'}• Module natif personnalisé
            {'\n\n'}
            Ces permissions et API ne sont pas disponibles dans l'environnement
            Expo managé. Une implémentation complète nécessiterait:
            {'\n\n'}
            1. Export du projet Expo
            {'\n'}2. Développement de modules natifs Android en Java/Kotlin
            {'\n'}3. Configuration des permissions système dans AndroidManifest.xml
          </Text>
        </View>

        {settingsGroups.map((group, index) => (
          <View key={index} style={styles.settingGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupContent}>
              {group.items.map((item) => renderSettingItem(item))}
            </View>
          </View>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Pour une version complète fonctionnelle, vous devrez:
            {'\n\n'}
            • Utiliser React Native avec code natif Android
            {'\n'}• Implémenter UsageStatsManager pour lister les apps
            {'\n'}• Utiliser ActivityManager pour la RAM
            {'\n'}• TrafficStats pour la consommation data
            {'\n'}• PackageManager pour les permissions
            {'\n'}• Créer un service de surveillance en arrière-plan
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
  limitationsCard: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  limitationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  limitationsText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 22,
  },
  settingGroup: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  groupContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
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
    color: '#1e40af',
    lineHeight: 22,
  },
});
