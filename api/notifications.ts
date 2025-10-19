// api/notifications.ts
import { API_URL, PORT } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

let API_BASE_URL = '';
if (Platform.OS === 'android') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else if (Platform.OS === 'ios') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else {
  API_BASE_URL = 'http://localhost:' + PORT + '/api';
}

// Notification types
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
  MESSAGE = 'message'
}

// Notification interface matching backend response
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    total: number;
    unreadCount: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export interface NotificationAPIResponse {
  success: boolean;
  data?: any;
  message?: string;
}

const authHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {} as Record<string, string>;
};

class NotificationAPI {
  /**
   * Get all user notifications
   */
  async getUserNotifications(): Promise<NotificationsResponse> {
    try {
      const response = await axios.get<NotificationsResponse>(
        `${API_BASE_URL}/notifications`,
        { headers: await authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await axios.get<UnreadCountResponse>(
        `${API_BASE_URL}/notifications/unread-count`,
        { headers: await authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number): Promise<NotificationAPIResponse> {
    try {
      const response = await axios.put<NotificationAPIResponse>(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { headers: await authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<NotificationAPIResponse> {
    try {
      const response = await axios.put<NotificationAPIResponse>(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {},
        { headers: await authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number): Promise<NotificationAPIResponse> {
    try {
      const response = await axios.delete<NotificationAPIResponse>(
        `${API_BASE_URL}/notifications/${notificationId}`,
        { headers: await authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Send a notification (admin only)
   */
  async sendNotification(payload: {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    relatedURL?: string;
  }): Promise<NotificationAPIResponse> {
    try {
      const response = await axios.post<NotificationAPIResponse>(
        `${API_BASE_URL}/notifications/send`,
        payload,
        { headers: await authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
}

export const notificationAPI = new NotificationAPI();
export default notificationAPI;
