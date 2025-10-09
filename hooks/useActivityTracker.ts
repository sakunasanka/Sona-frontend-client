// hooks/useActivityTracker.ts
import { useCallback } from 'react';
import { sessionManager } from '../utils/sessionManager';

export const useActivityTracker = () => {
  const trackActivity = useCallback(() => {
    sessionManager.updateActivity();
  }, []);

  return { trackActivity };
};