// ==============================================================================
// SAHAKARI SEVA — UNIVERSAL APP BACK-HANDLER HOOK
// Handles Android hardware back button, Web browser popstate events,
// and on-screen Header back navigation across Customer, Worker, and Admin.
// Retains visit history so pressing Back returns to the PREVIOUS page/tab
// instead of jumping blindly to home or quitting the application.
// ==============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface UseAppBackHandlerOptions {
  homeRouteName?: string;
  isHome?: boolean;
}

export function useAppBackHandler(options: UseAppBackHandlerOptions = {}) {
  const { homeRouteName = 'Home', isHome = false } = options;
  const navigation = useNavigation<any>();
  const lastBackPressTime = useRef<number>(0);

  const handleBack = useCallback(() => {
    // 1. If navigation has previous screens or tabs in history, navigate back to previous
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }

    // 2. If on a sub-screen with no prior history (e.g. direct load), navigate to home
    if (!isHome && homeRouteName) {
      navigation.navigate(homeRouteName);
      return true;
    }

    return false;
  }, [navigation, isHome, homeRouteName]);

  useEffect(() => {
    // 1. Android Hardware Back Button Handler
    const onHardwareBack = () => {
      if (handleBack()) {
        return true;
      }

      // If at root portal home screen, require double-back within 2s to exit
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
        if (!handleBack()) {
          // Keep user safely on root screen without quitting or loading blank/login
          window.history.pushState(null, '', window.location.href);
        }
      };

      // Push history entry so browser back button triggers popstate
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', onPopState);
    }

    return () => {
      sub.remove();
      if (onPopState && Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('popstate', onPopState);
      }
    };
  }, [handleBack]);

  return { handleBack };
}
