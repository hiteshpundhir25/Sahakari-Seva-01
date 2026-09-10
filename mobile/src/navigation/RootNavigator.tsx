// ==============================================================================
// ROOT NAVIGATOR — MULTI-ROLE TAB & STACK NAVIGATION
// Supports Customer, Worker, and Admin views with native bottom tabs.
// All labels are localized and update simultaneously on language change.
// ==============================================================================

import React, { useState, createContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Search,
  MapPin,
  Calendar,
  Briefcase,
  Navigation as NavIcon,
  TrendingUp,
  ShieldCheck,
  LogOut,
  Users,
  Heart,
  UserCheck,
  User
} from 'lucide-react-native';

// Customer Screens
import { HomeScreen } from '../screens/customer/HomeScreen';
import { WorkerSearchScreen } from '../screens/customer/WorkerSearchScreen';
import { WorkerMapScreen } from '../screens/customer/WorkerMapScreen';
import { CustomerBookingsScreen } from '../screens/customer/CustomerBookingsScreen';
import { WorkerDetailScreen } from '../screens/customer/WorkerDetailScreen';
import { BookingCreateScreen } from '../screens/customer/BookingCreateScreen';
import { BookingDetailScreen } from '../screens/customer/BookingDetailScreen';
import { InvoiceScreen } from '../screens/customer/InvoiceScreen';

// Worker Screens
import { WorkerHomeScreen } from '../screens/worker/WorkerHomeScreen';
import { WorkerJobsScreen } from '../screens/worker/WorkerJobsScreen';
import { WorkerLocationScreen } from '../screens/worker/WorkerLocationScreen';
import { WorkerWelfareScreen } from '../screens/worker/WorkerWelfareScreen';
import { WorkerProfileScreen } from '../screens/worker/WorkerProfileScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminForecastScreen } from '../screens/admin/AdminForecastScreen';
import { AdminAllocationScreen } from '../screens/admin/AdminAllocationScreen';
import { AdminVerificationScreen } from '../screens/admin/AdminVerificationScreen';

// Auth Screen
import { LoginScreen } from '../screens/auth/LoginScreen';

// Theme
import { useTheme } from '../theme';
import type { Palette } from '../theme';

// Role context for role-aware UI (notification feeds, etc.)
import { RoleProvider } from '../context/RoleContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Context for Auth & Role Switching
export interface UserSession {
  role: 'customer' | 'worker' | 'admin' | null;
  user: any;
}

export const AuthContext = createContext<{
  session: UserSession;
  login: (role: 'customer' | 'worker' | 'admin', user?: any) => void;
  logout: () => void;
}>({
  session: { role: null, user: null },
  login: () => {},
  logout: () => {}
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const makeTabBarBase = (colors: Palette, isDark: boolean) => ({
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopWidth: 1.2,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
    height: 66,
    paddingBottom: 8,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
});

function TabIcon({
  icon: Icon,
  color,
  size,
  focused,
  colors,
}: {
  icon: any;
  color: string;
  size: number;
  focused: boolean;
  colors: Palette;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 2.5,
        borderRadius: 12,
        backgroundColor: focused ? colors.primaryLight : 'transparent',
      }}
    >
      <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

// Smooth cross-fade between stack screens — part of the app-wide motion system
const stackScreenOptions = {
  headerShown: false,
  animation: 'fade' as const,
};

// -----------------------------------------------------------------------------
// CUSTOMER TABS & STACK
// -----------------------------------------------------------------------------
function CustomerTabNavigator() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const tabBarBase = makeTabBarBase(colors, isDark);
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={{
        ...tabBarBase,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Home} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={WorkerSearchScreen}
        options={{
          tabBarLabel: t('tabs.services'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Search} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={WorkerMapScreen}
        options={{
          tabBarLabel: t('tabs.map'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={MapPin} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={CustomerBookingsScreen}
        options={{
          tabBarLabel: t('tabs.bookings'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Calendar} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function CustomerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
      <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
      <Stack.Screen name="BookingCreate" component={BookingCreateScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="Invoice" component={InvoiceScreen} />
    </Stack.Navigator>
  );
}

// -----------------------------------------------------------------------------
// WORKER TABS
// -----------------------------------------------------------------------------
function WorkerTabNavigator() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const tabBarBase = makeTabBarBase(colors, isDark);
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={{
        ...tabBarBase,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="WorkerHome"
        component={WorkerHomeScreen}
        options={{
          tabBarLabel: t('tabs.dashboard'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Home} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkerJobs"
        component={WorkerJobsScreen}
        options={{
          tabBarLabel: t('tabs.jobs'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Briefcase} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkerWelfare"
        component={WorkerWelfareScreen}
        options={{
          tabBarLabel: t('tabs.welfare'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Heart} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: t('tabs.credentials'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={User} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkerLocation"
        component={WorkerLocationScreen}
        options={{
          tabBarLabel: t('tabs.gps'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={NavIcon} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// -----------------------------------------------------------------------------
// ADMIN TABS
// -----------------------------------------------------------------------------
function AdminTabNavigator() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const tabBarBase = makeTabBarBase(colors, isDark);
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={{
        ...tabBarBase,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: t('tabs.federation'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Users} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminVerification"
        component={AdminVerificationScreen}
        options={{
          tabBarLabel: t('tabs.verify_kyc'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={UserCheck} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Forecast"
        component={AdminForecastScreen}
        options={{
          tabBarLabel: t('tabs.forecast'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={TrendingUp} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Allocation"
        component={AdminAllocationScreen}
        options={{
          tabBarLabel: t('tabs.allocation'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={ShieldCheck} color={color} size={size} focused={focused} colors={colors} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// -----------------------------------------------------------------------------
// MAIN ROOT NAVIGATOR
// -----------------------------------------------------------------------------
export const RootNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [session, setSession] = useState<UserSession>({
    role: null,
    user: null
  });

  const login = (role: 'customer' | 'worker' | 'admin', user?: any) => {
    setSession({ role, user: user || { role } });
  };

  const logout = () => {
    setSession({ role: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      <RoleProvider role={session.role}>
      <View style={styles.container}>
        {session.role && (
          <View style={[styles.sessionHeader, { paddingTop: insets.top + 8 }]}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionRoleText}>
                {t('auth.active_profile')}:{' '}
                <Text style={styles.sessionRoleHighlight}>
                  {t(`roles.${session.role}`)}
                </Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.switchRoleBtn} onPress={logout}>
              <LogOut size={13} color={colors.danger} />
              <Text style={styles.switchRoleText}>{t('auth.switch_role')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!session.role && <LoginScreen onSelectRole={login} />}
        {session.role === 'customer' && (
          <ErrorBoundary fallbackTitle="Customer Section">
            <CustomerStackNavigator />
          </ErrorBoundary>
        )}
        {session.role === 'worker' && (
          <ErrorBoundary fallbackTitle="Worker Section">
            <WorkerTabNavigator />
          </ErrorBoundary>
        )}
        {session.role === 'admin' && (
          <ErrorBoundary fallbackTitle="Admin Section">
            <AdminTabNavigator />
          </ErrorBoundary>
        )}
        </View>
      </RoleProvider>
    </AuthContext.Provider>
  );
};

const createStyles = (colors: Palette, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  sessionHeader: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: colors.topPanel,
    borderBottomWidth: 1,
    borderBottomColor: colors.topPanelBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sessionRoleText: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : colors.textSecondary,
    fontWeight: '600'
  },
  sessionRoleHighlight: {
    color: isDark ? colors.success : colors.successDark,
    fontWeight: '800'
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? '#1e293b' : colors.surfaceSubtle,
    borderWidth: isDark ? 0 : 1,
    borderColor: isDark ? 'transparent' : colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  switchRoleText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '700'
  }
});