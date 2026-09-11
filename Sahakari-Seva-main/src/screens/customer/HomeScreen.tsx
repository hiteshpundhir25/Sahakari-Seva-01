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
  RefreshControl,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../components/common/Header';
import { WorkerCard } from '../../components/common/WorkerCard';
import { Footer } from '../../components/common/Footer';
import { ApiClient } from '../../services/apiClient';
import { MobileLocationService } from '../../services/locationService';
import { ServiceCategory, NearbyWorkerResult } from '../../types';
import { FadeInView, PulseView, ScalePressable, PulseDot } from '../../animations';
import { translateTrade } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { getTradeTheme } from '../../theme/tradeThemes';
import { useAppBackHandler } from '../../hooks/useAppBackHandler';
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
  Clock,
  ChevronRight,
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
  'Caregiving & Nursing': HeartPulse,
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useAppBackHandler({ homeRouteName: 'Home', isHome: true });
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
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
        ApiClient.getNearbyWorkers(loc.coords.latitude, loc.coords.longitude, 15),
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

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {/* GPS Live Radar Location Bar */}
        <FadeInView delay={0} distance={10} duration={320}>
          <TouchableOpacity
            style={styles.locationBanner}
            onPress={() => navigation.navigate('Map')}
            activeOpacity={0.82}
          >
            <View style={styles.locationLeft}>
              <View style={styles.radarWrap}>
                <PulseDot color="#10b981" size={8} ringScale={2.4} duration={1600} />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationLabel}>{t('home.current_location', 'LIVE GPS COVERAGE')}</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationName}
                </Text>
              </View>
            </View>
            <View style={styles.mapLink}>
              <Map size={13} color={colors.primary} />
              <Text style={styles.mapLinkText}>{t('home.view_map')}</Text>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Dynamic Emergency Service Banner with LinearGradient & Pulsing Beacon */}
        <FadeInView delay={80} distance={12} duration={340}>
          <PulseView scaleTo={1.012} duration={2200}>
            <LinearGradient
              colors={isDark ? ['#3b0712', '#1f040a'] : ['#fff1f2', '#ffe4e6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emergencyCard}
            >
              <View style={styles.emergencyHeaderRow}>
                <View style={styles.emergencyTagRow}>
                  <PulseDot color={colors.danger} size={7} ringScale={2.4} duration={1200} />
                  <Text style={styles.emergencyTagText}>EMERGENCY 24/7</Text>
                </View>
                <View style={styles.emergencySlaBadge}>
                  <Clock size={11} color={colors.dangerDark} />
                  <Text style={styles.emergencySlaText}>&lt; 15 min response</Text>
                </View>
              </View>

              <Text style={styles.emergencyTitle}>{t('home.emergency_banner_title')}</Text>
              <Text style={styles.emergencyDesc}>{t('home.emergency_banner_desc')}</Text>

              <ScalePressable onPress={() => navigation.navigate('Search', { emergencyOnly: true })} scaleTo={0.97}>
                <LinearGradient
                  colors={['#e11d48', '#be123c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emergencyBtn}
                >
                  <Zap size={16} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.emergencyBtnText}>{t('home.emergency_btn')}</Text>
                  <ChevronRight size={14} color="#ffffff" />
                </LinearGradient>
              </ScalePressable>
            </LinearGradient>
          </PulseView>
        </FadeInView>

        {/* Categories Grid with Trade-Specific Vibrant Gradients */}
        <FadeInView delay={160} distance={14} duration={360}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionAccentBar, { backgroundColor: colors.primary }]} />
                <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                  {t('home.categories_title')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Search')}
                style={styles.seeAllBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>{t('home.see_all')}</Text>
                <ChevronRight size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryGrid}>
              {categories.slice(0, 8).map((cat, idx) => {
                const IconComp = categoryIcons[cat.name] || Zap;
                const title = translateTrade(cat.name);
                const tradeTheme = getTradeTheme(cat.name, isDark);

                return (
                  <FadeInView key={cat.id} delay={180 + idx * 50} distance={10} duration={280} style={styles.categoryCardWrap}>
                    <ScalePressable onPress={() => navigation.navigate('Search', { selectedCategory: cat.name })} scaleTo={0.92}>
                      <View style={[styles.categoryCard, { borderColor: tradeTheme.border }]}>
                        <LinearGradient
                          colors={tradeTheme.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.iconCircle}
                        >
                          <IconComp size={18} color="#ffffff" />
                        </LinearGradient>
                        <Text style={styles.catTitle} numberOfLines={2}>
                          {title}
                        </Text>
                        <View style={[styles.catPriceBadge, { backgroundColor: tradeTheme.badgeBg }]}>
                          <Text style={[styles.catPrice, { color: tradeTheme.badgeText }]}>
                            ₹{cat.base_price}
                          </Text>
                        </View>
                      </View>
                    </ScalePressable>
                  </FadeInView>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Nearby Workers Section with Lively Match Badges */}
        <FadeInView delay={280} distance={14} duration={360}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionAccentBar, { backgroundColor: colors.secondary }]} />
                <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                  {t('home.nearby_title')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Map')}
                style={styles.seeAllBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>{t('home.view_map')}</Text>
                <ChevronRight size={13} color={colors.primary} />
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

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  locationBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  radarWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#10b981',
    marginBottom: 1,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mapLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  emergencyCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: isDark ? '#7f1d1d' : '#fca5a5',
    marginBottom: 20,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emergencyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emergencyTagText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: colors.danger,
  },
  emergencySlaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  emergencySlaText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.dangerDark,
  },
  emergencyTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emergencyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
    paddingVertical: 10.5,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  emergencyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    marginRight: 10,
  },
  sectionAccentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 11,
  },
  categoryCardWrap: {
    width: '23%',
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
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
  catPriceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginTop: 4,
  },
  catPrice: {
    fontSize: 9.5,
    fontWeight: '800',
  },
});

