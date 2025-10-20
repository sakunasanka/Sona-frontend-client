// hooks/useNotifications.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Notification, notificationAPI } from '../api/notifications';

const POLLING_INTERVAL = 30000; // 30 seconds

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Fetch notifications from backend (for automatic polling - no loading state)
   */
  const fetchNotificationsSilent = useCallback(async () => {
    try {
      setError(null);
      const response = await notificationAPI.getUserNotifications();
      
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err: any) {
      // console.log('Error fetching notifications:', err);
      setError(err?.message || 'Failed to fetch notifications');
    }
  }, []);

  /**
   * Fetch notifications from backend
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getUserNotifications();
      
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err: any) {
      // console.log('Error fetching notifications:', err);
      setError(err?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch only unread count (lighter request)
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err: any) {
      console.log('Error fetching unread count:', err);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.log('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.log('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      await notificationAPI.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.log('Error deleting notification:', err);
      throw err;
    }
  }, [notifications]);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    try {
      // Delete all notifications one by one
      const deletePromises = notifications.map(n => 
        notificationAPI.deleteNotification(n.id)
      );
      
      await Promise.all(deletePromises);
      
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err: any) {
      console.log('Error clearing all notifications:', err);
      throw err;
    }
  }, [notifications]);

  /**
   * Start polling for new notifications
   */
  const startPolling = useCallback(() => {
    // Clear existing interval if any
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Initial fetch (with loading)
    fetchNotifications();

    // Set up polling interval (silent updates)
    pollingIntervalRef.current = setInterval(() => {
      fetchNotificationsSilent();
    }, POLLING_INTERVAL);
  }, [fetchNotifications, fetchNotificationsSilent]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Initialize polling on mount and cleanup on unmount
   */
  useEffect(() => {
    startPolling();

    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    startPolling,
    stopPolling,
  };
};

export default useNotifications;