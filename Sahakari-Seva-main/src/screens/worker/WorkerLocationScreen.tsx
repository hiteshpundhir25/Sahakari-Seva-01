// ==============================================================================
// WORKER LOCATION & SERVICE RADIUS SCREEN
// Allows worker to sync current GPS coordinates, adjust radius, and set area.
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { ApiClient } from '../../services/apiClient';
import { MobileLocationService } from '../../services/locationService';
import { MapPin, Navigation, ShieldCheck, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';

export const WorkerLocationScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  useAppBackHandler({ homeRouteName: 'WorkerHome', isHome: false });
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [currentLat, setCurrentLat] = useState(28.6315);
  const [currentLng, setCurrentLng] = useState(77.2167);
  const [serviceRadius, setServiceRadius] = useState(12);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Today at 10:00 AM');

  const handleSyncGPS = async () => {
    setSyncing(true);
    try {
      const loc = await MobileLocationService.requestCurrentPosition();
      setCurrentLat(loc.coords.latitude);
      setCurrentLng(loc.coords.longitude);

      await ApiClient.updateWorkerLocation(
        'w0000000-0000-0000-0000-000000000001',
        loc.coords.latitude,
        loc.coords.longitude,
        serviceRadius
      );

      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      Alert.alert(
        t('workerLocation.gps_updated_title'),
        t('workerLocation.gps_updated_msg', {
          lat: loc.coords.latitude.toFixed(4),
          lng: loc.coords.longitude.toFixed(4),
          radius: serviceRadius
        })
      );
    } catch (err: any) {
      Alert.alert(t('workerLocation.sync_error_title'), err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRadiusSelect = async (radiusKm: number) => {
    setServiceRadius(radiusKm);
    try {
      await ApiClient.updateWorkerLocation(
        'w0000000-0000-0000-0000-000000000001',
        currentLat,
        currentLng,
        radiusKm
      );
    } catch (err: any) {
      console.warn('Radius update error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('workerLocation.title')}
        subtitle={t('workerLocation.subtitle')}
        showBack={true}
        onBack={() => {
          if (navigation?.canGoBack?.()) {
            navigation.goBack();
          } else if (navigation?.navigate) {
            navigation.navigate('WorkerHome');
          }
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Current Location Badge */}
        <View style={styles.locationCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <MapPin size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locTitle}>{t('workerLocation.dispatch_origin')}</Text>
              <Text style={styles.locCoords}>
                Lat: {currentLat.toFixed(4)} • Lng: {currentLng.toFixed(4)}
              </Text>
              <Text style={styles.syncTime}>{t('workerLocation.last_synced', { time: lastSyncTime })}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleSyncGPS}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Navigation size={16} color={colors.textInverse} />
                <Text style={styles.syncBtnText}>{t('workerLocation.sync_btn')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Service Radius Slider/Pill Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('workerLocation.radius_title')}</Text>
          <Text style={styles.sectionSub}>{t('workerLocation.radius_sub')}</Text>

          <View style={styles.radiusPillsRow}>
            {[5, 10, 15, 20, 25].map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.radiusPill, serviceRadius === km && styles.radiusPillActive]}
                onPress={() => handleRadiusSelect(km)}
              >
                <Text style={[styles.radiusText, serviceRadius === km && styles.radiusTextActive]}>
                  {km} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyCard}>
          <ShieldCheck size={18} color={colors.success} />
          <Text style={styles.privacyText}>
            {t('workerLocation.privacy_title')}: {t('workerLocation.privacy_text')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  locTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  locCoords: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  syncTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6
  },
  syncBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
    marginBottom: 14
  },
  radiusPillsRow: {
    flexDirection: 'row',
    gap: 8
  },
  radiusPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle
  },
  radiusPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  radiusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary
  },
  radiusTextActive: {
    color: colors.textInverse
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.successLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 10
  },
  privacyText: {
    fontSize: 12,
    color: colors.successDark,
    flex: 1,
    lineHeight: 17
  }
});