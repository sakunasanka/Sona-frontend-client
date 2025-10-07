// hooks/useSessionTimeout.ts
import { useNavigation } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { sessionManager } from '../utils/sessionManager';

export const useSessionTimeout = () => {
  const navigation = useNavigation();

  // Handle session expiry - navigate to login
  const handleSessionExpired = useCallback(() => {
    console.log('Session expired due to inactivity');
    // Navigate to signin screen
    // For expo-router, we need to use the router
    const { router } = require('expo-router');
    router.replace('/(auth)/signin');
  }, []);

  // Update activity on user interactions
  const updateActivity = useCallback(() => {
    sessionManager.updateActivity();
  }, []);

  useEffect(() => {
    // Set the session expired callback
    sessionManager.setSessionExpiredCallback(handleSessionExpired);

    // Initialize session when hook is mounted
    sessionManager.initializeSession();

    // Listen for navigation events to track activity
    const unsubscribe = navigation.addListener('state', () => {
      updateActivity();
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      sessionManager.cleanup();
    };
  }, [handleSessionExpired, navigation, updateActivity]);

  return { updateActivity };
};