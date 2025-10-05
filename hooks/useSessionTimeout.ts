// hooks/useSessionTimeout.ts
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { sessionManager } from '../utils/sessionManager';

export const useSessionTimeout = () => {
  // Handle session expiry - navigate to login
  const handleSessionExpired = useCallback(() => {
    console.log('Session expired due to inactivity');
    // Navigate to signin screen
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

    // Cleanup on unmount
    return () => {
      sessionManager.cleanup();
    };
  }, [handleSessionExpired]);

  return { updateActivity };
};