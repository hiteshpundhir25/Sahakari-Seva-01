// ==============================================================================
// CUSTOMER WORKER MAP SCREEN — FULLSCREEN OPENSTREETMAP GEO-MATCHING
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { MobileMapView } from '../../components/map/MobileMapView';
import { ApiClient } from '../../services/apiClient';
import { MobileLocationService } from '../../services/locationService';
import { NearbyWorkerResult } from '../../types';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

export const WorkerMapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [userLocation, setUserLocation] = useState({ latitude: 28.6315, longitude: 77.2167 });
  const [workers, setWorkers] = useState<NearbyWorkerResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const loc = await MobileLocationService.requestCurrentPosition();
      setUserLocation(loc.coords);

      const data = await ApiClient.getNearbyWorkers(
        loc.coords.latitude,
        loc.coords.longitude,
        20
      );
      setWorkers(data);
    } catch (err) {
      console.warn('Map fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title={t('map.title')}
        subtitle={t('map.subtitle')}
      />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <MobileMapView
          userLocation={userLocation}
          workers={workers}
          onSelectWorker={(w) => {
            // Marker selected
          }}
          onRequestBooking={(w) => {
            navigation.navigate('BookingCreate', { worker: w });
          }}
        />
      )}
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});