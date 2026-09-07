// ==============================================================================
// CUSTOMER HOME SCREEN — SERVICE CATEGORIES, EMERGENCY BANNER & NEARBY MATCHES
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/common/Header';
import { WorkerCard } from '../../components/common/WorkerCard';
import { Footer } from '../../components/common/Footer';
import { ApiClient } from '../../services/apiClient';
import { MobileLocationService } from '../../services/locationService';
import { ServiceCategory, NearbyWorkerResult } from '../../types';
import { FadeInView, PulseView, ScalePressable } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import {
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Sparkles,
  AirVent,
  Tv,
  Car,
  HeartPulse,
  Flower2,
  MapPin,
  Map,
  ShieldCheck
} from 'lucide-react-native';

const categoryIcons: Record<string, any> = {
  Electrical: Zap,
  Plumbing: Wrench,
  Carpentry: Hammer,
  Painting: Paintbrush,
  'Cleaning & Sanitization': Sparkles,
  'Gardening & Landscaping': Flower2,
  'Appliance Repair': Tv,
  'AC Repair & Servicing': AirVent,
  'Driver Services': Car,
  'Caregiving & Nursing': HeartPulse
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [nearbyWorkers, setNearbyWorkers] = useState<NearbyWorkerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 26.9017, longitude: 75.7925 });
  const [locationName, setLocationName] = useState('C-Scheme, Jaipur (302001)');

  const loadData = async () => {
    try {
      setLoading(true);
      const loc = await MobileLocationService.requestCurrentPosition();
      setUserLocation(loc.coords);
      if (loc.coords.areaName) setLocationName(loc.coords.areaName);

      const [cats, workers] = await Promise.all([
        ApiClient.getCategories(),
        ApiClient.getNearbyWorkers(loc.coords.latitude, loc.coords.longitude, 15)
      ]);
      setCategories(cats);
      setNearbyWorkers(workers);
    } catch (err) {
      console.log('Load notice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {/* GPS Location Bar */}
        <FadeInView delay={0} distance={10} duration={320}>
          <TouchableOpacity
            style={styles.locationBanner}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={styles.locationLeft}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationName}
              </Text>
            </View>
            <View style={styles.mapLink}>
              <Map size={14} color={colors.primary} />
              <Text style={styles.mapLinkText}>{t('home.view_map')}</Text>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Emergency Service Banner */}
        <FadeInView delay={80} distance={12} duration={340}>
          <PulseView scaleTo={1.015} duration={1800}>
            <View style={styles.emergencyCard}>
              <Text style={styles.emergencyTitle}>{t('home.emergency_banner_title')}</Text>
              <Text style={styles.emergencyDesc}>{t('home.emergency_banner_desc')}</Text>
              <ScalePressable onPress={() => navigation.navigate('Search', { emergencyOnly: true })}>
                <View style={styles.emergencyBtn}>
                  <Zap size={16} color={colors.danger} fill={colors.danger} />
                  <Text style={styles.emergencyBtnText}>{t('home.emergency_btn')}</Text>
                </View>
              </ScalePressable>
            </View>
          </PulseView>
        </FadeInView>

        {/* Categories Grid */}
        <FadeInView delay={160} distance={14} duration={360}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.categories_title')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.seeAllText}>{t('home.see_all')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryGrid}>
              {categories.slice(0, 8).map((cat, idx) => {
                const IconComp = categoryIcons[cat.name] || Zap;
                const title = translateTrade(cat.name);

                return (
                  <FadeInView key={cat.id} delay={200 + idx * 55} distance={10} duration={300} style={styles.categoryCardWrap}>
                    <ScalePressable onPress={() => navigation.navigate('Search', { selectedCategory: cat.name })}>
                      <View style={styles.categoryCard}>
                        <View style={styles.iconCircle}>
                          <IconComp size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.catTitle} numberOfLines={2}>
                          {title}
                        </Text>
                        <Text style={styles.catPrice}>₹{cat.base_price}</Text>
                      </View>
                    </ScalePressable>
                  </FadeInView>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Nearby Workers Section */}
        <FadeInView delay={280} distance={14} duration={360}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.nearby_title')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                <Text style={styles.seeAllText}>{t('home.view_map')}</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              nearbyWorkers.slice(0, 4).map((worker, idx) => (
                <WorkerCard
                  key={worker.workerId}
                  worker={worker}
                  index={idx}
                  onPress={() => navigation.navigate('WorkerDetail', { workerId: worker.workerId })}
                  onBook={() => navigation.navigate('BookingCreate', { worker })}
                />
              ))
            )}
          </View>
        </FadeInView>

        {/* Cooperative App Footer with Fair Wage Breakdown, Policies & Contacts */}
        <FadeInView delay={360} distance={14} duration={360}>
          <Footer />
        </FadeInView>
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
    padding: 16,
    paddingBottom: 32
  },
  locationBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  mapLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  emergencyCard: {
    backgroundColor: colors.dangerLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: 20
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dangerDark
  },
  emergencyDesc: {
    fontSize: 12,
    color: colors.dangerDark,
    marginTop: 4,
    lineHeight: 17
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.danger,
    gap: 6
  },
  emergencyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger
  },
  section: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  categoryCardWrap: {
    width: '22.8%',
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    minHeight: 28,
    lineHeight: 14,
    paddingHorizontal: 1,
  },
  catPrice: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  }
});
