// ==============================================================================
// SAHAKARI SEVA — UNIVERSAL APP BACK-HANDLER HOOK
// Handles Android hardware back button and Web browser popstate events.
// Ensures sub-pages return to the role's Home/Dashboard instead of logging out
// or quitting the application abruptly.
// ==============================================================================

import { useEffect, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface UseAppBackHandlerOptions {
  homeRouteName?: string;
  isHome?: boolean;
}

export function useAppBackHandler(options: UseAppBackHandlerOptions = {}) {
  const { homeRouteName = 'WorkerHome', isHome = false } = options;
  const navigation = useNavigation<any>();
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    // 1. Android Hardware Back Handler
    const onHardwareBack = () => {
      // If navigation stack has a screen to pop, pop it
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      // If we are on a sub-screen / sub-tab, route back to the role's Home screen
      if (!isHome && homeRouteName) {
        navigation.navigate(homeRouteName);
        return true;
      }

      // If already on Home screen, guard against accidental app quitting with double-press
      const now = Date.now();
      if (now - lastBackPressTime.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTime.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit Sahakari Seva', ToastAndroid.SHORT);
      }
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);

    // 2. Web Browser Back Button (popstate) Handler
    let onPopState: (() => void) | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      onPopState = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else if (!isHome && homeRouteName) {
          navigation.navigate(homeRouteName);
        } else {
          // Push state to keep the user safely inside the application
          window.history.pushState(null, '', window.location.href);
        }
      };

      // Push an entry so the first back click is captured inside the SPA
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', onPopState);
    }

    return () => {
      sub.remove();
      if (onPopState && Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('popstate', onPopState);
      }
    };
  }, [navigation, homeRouteName, isHome]);
}
