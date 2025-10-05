// utils/sessionManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

const SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const LAST_ACTIVITY_KEY = 'lastActivityTimestamp';
const TOKEN_KEY = 'token';

class SessionManager {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private appStateSubscription: any = null;
  private onSessionExpired: (() => void) | null = null;

  constructor() {
    this.setupAppStateListener();
    this.startSessionTimer();
  }

  /**
   * Set callback for when session expires
   */
  setSessionExpiredCallback(callback: () => void) {
    this.onSessionExpired = callback;
  }

  /**
   * Update last activity timestamp
   */
  updateActivity = async () => {
    try {
      const now = Date.now().toString();
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, now);
      this.resetTimer();
    } catch (error) {
      console.error('Error updating activity timestamp:', error);
    }
  };

  /**
   * Check if session is expired
   */
  isSessionExpired = async (): Promise<boolean> => {
    try {
      const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (!token) return true; // No token means not logged in

      if (!lastActivity) return true; // No activity timestamp

      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();

      return (now - lastActivityTime) > SESSION_TIMEOUT;
    } catch (error) {
      console.error('Error checking session expiry:', error);
      return true;
    }
  };

  /**
   * Clear session data
   */
  clearSession = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, LAST_ACTIVITY_KEY]);
      this.clearTimer();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  /**
   * Setup app state listener to handle background/foreground transitions
   */
  private setupAppStateListener = () => {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  };

  /**
   * Handle app state changes
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App became active, check if session expired
      const expired = await this.isSessionExpired();
      if (expired) {
        this.handleSessionExpiry();
      } else {
        // Reset timer since user is back
        this.resetTimer();
      }
    }
  };

  /**
   * Start the session timer
   */
  private startSessionTimer = () => {
    this.timeoutId = setTimeout(async () => {
      const expired = await this.isSessionExpired();
      if (expired) {
        this.handleSessionExpiry();
      } else {
        // Continue checking
        this.startSessionTimer();
      }
    }, 60000); // Check every minute
  };

  /**
   * Reset the session timer
   */
  private resetTimer = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.startSessionTimer();
  };

  /**
   * Clear the session timer
   */
  private clearTimer = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  };

  /**
   * Handle session expiry
   */
  private handleSessionExpiry = async () => {
    await this.clearSession();
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  };

  /**
   * Initialize session (call when user logs in)
   */
  initializeSession = async () => {
    await this.updateActivity();
  };

  /**
   * Cleanup (call when component unmounts)
   */
  cleanup = () => {
    this.clearTimer();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  };
}

// Create singleton instance
export const sessionManager = new SessionManager();