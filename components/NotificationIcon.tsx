// components/NotificationIcon.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Notification, NotificationType } from '../api/notifications';

interface NotificationIconProps {
  notifications: Notification[];
  unreadCount: number;
  loading?: boolean;
  onMarkAsRead: (notificationId: number) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDeleteNotification: (notificationId: number) => Promise<void>;
}

// Color schemes for each notification type
const notificationColors: Record<NotificationType, {
  bg: string;
  border: string;
  icon: string;
  iconName: keyof typeof Ionicons.glyphMap;
}> = {
  [NotificationType.INFO]: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: '#2563EB',
    iconName: 'information-circle',
  },
  [NotificationType.SUCCESS]: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: '#16A34A',
    iconName: 'checkmark-circle',
  },
  [NotificationType.WARNING]: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: '#D97706',
    iconName: 'warning',
  },
  [NotificationType.DANGER]: {
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: '#DC2626',
    iconName: 'alert-circle',
  },
  [NotificationType.MESSAGE]: {
    bg: '#FAF5FF',
    border: '#E9D5FF',
    icon: '#9333EA',
    iconName: 'chatbox-ellipses',
  },
};

const NotificationIcon: React.FC<NotificationIconProps> = ({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'unread'>('newest');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set());

  const MESSAGE_CHAR_LIMIT = 100;

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(n => !showOnlyUnread || !n.isRead)
    .sort((a, b) => {
      if (sortOption === 'unread') {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // newest (default)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Get relative time string
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now.getTime() - then.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await onMarkAsRead(notification.id);
      }

      // Navigate to related URL if exists
      if (notification.relatedURL) {
        setIsDropdownOpen(false);
        router.push(notification.relatedURL as any);
      }
      // If relatedURL is null, don't do anything (don't show modal)
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (e: any, notificationId: number) => {
    e.stopPropagation();
    try {
      await onMarkAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle delete
  // const handleDelete = async (e: any, notificationId: number) => {
  //   e.stopPropagation();
  //   try {
  //     await onDeleteNotification(notificationId);
  //   } catch (error) {
  //     console.error('Error deleting notification:', error);
  //   }
  // };

  // Toggle expanded state for a notification
  const toggleExpanded = (e: any, notificationId: number) => {
    e.stopPropagation();
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // Check if message needs truncation
  const needsTruncation = (message: string) => message.length > MESSAGE_CHAR_LIMIT;

  // Get display message (truncated or full)
  const getDisplayMessage = (notification: Notification) => {
    const isExpanded = expandedNotifications.has(notification.id);
    if (!needsTruncation(notification.message) || isExpanded) {
      return notification.message;
    }
    return notification.message.substring(0, MESSAGE_CHAR_LIMIT) + '...';
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <TouchableOpacity
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative mr-3"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : (
          <>
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>

      {/* Notification Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <Pressable 
          className="flex-1" 
          onPress={() => setIsDropdownOpen(false)}
        >
          <View className="flex-1 bg-black/50">
            <Pressable 
              onPress={(e) => e.stopPropagation()}
              className="absolute top-20 right-4 w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <View className="flex-row items-center">
                  <Ionicons name="notifications" size={20} color="#1F2937" />
                  <Text className="text-lg font-bold text-gray-900 ml-2">Notifications</Text>
                  {unreadCount > 0 && (
                    <View className="ml-2 px-2 py-0.5 bg-red-500 rounded-full">
                      <Text className="text-xs font-bold text-white">{unreadCount}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Filters */}
              <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <TouchableOpacity 
                  className="flex-row items-center"
                  onPress={() => setShowOnlyUnread(!showOnlyUnread)}
                >
                  <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                    showOnlyUnread ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {showOnlyUnread && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text className="text-sm text-gray-700">Unread only</Text>
                </TouchableOpacity>

                <View className="flex-row items-center border border-gray-300 rounded-lg px-2 py-1">
                  <TouchableOpacity onPress={() => {
                    const options: ('newest' | 'oldest' | 'unread')[] = ['newest', 'oldest', 'unread'];
                    const currentIndex = options.indexOf(sortOption);
                    setSortOption(options[(currentIndex + 1) % options.length]);
                  }}>
                    <Text className="text-xs text-gray-700">
                      {sortOption === 'newest' ? 'Newest' : sortOption === 'oldest' ? 'Oldest' : 'Unread'}
                    </Text>
                  </TouchableOpacity>
                  <Ionicons name="chevron-down" size={14} color="#6B7280" className="ml-1" />
                </View>
              </View>

              {/* Notifications List */}
              <ScrollView className="max-h-96">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => {
                    const colorScheme = notificationColors[notification.type];
                    
                    return (
                      <TouchableOpacity
                        key={notification.id}
                        onPress={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-100 ${!notification.isRead ? 'border-l-4' : ''}`}
                        style={{
                          backgroundColor: notification.isRead ? '#FFFFFF' : colorScheme.bg,
                          borderLeftColor: !notification.isRead ? colorScheme.border : undefined,
                        }}
                      >
                        <View className="flex-row">
                          {/* Icon */}
                          <View className="mr-3 pt-1">
                            <Ionicons 
                              name={colorScheme.iconName} 
                              size={20} 
                              color={colorScheme.icon} 
                            />
                          </View>

                          {/* Content */}
                          <View className="flex-1">
                            <View className="flex-row items-start justify-between mb-1">
                              <Text className={`flex-1 font-semibold text-sm ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </Text>
                              {!notification.isRead && (
                                <View 
                                  className="w-2 h-2 rounded-full ml-2 mt-1.5"
                                  style={{ backgroundColor: colorScheme.icon }}
                                />
                              )}
                            </View>
                            
                            <Text className="text-xs text-gray-600 mb-2">
                              {getDisplayMessage(notification)}
                            </Text>

                            {needsTruncation(notification.message) && (
                              <TouchableOpacity onPress={(e) => toggleExpanded(e, notification.id)}>
                                <Text className="text-xs text-blue-600 font-medium mb-2">
                                  {expandedNotifications.has(notification.id) ? 'Show less' : 'Show more'}
                                </Text>
                              </TouchableOpacity>
                            )}

                            <View className="flex-row items-center justify-between">
                              <Text className="text-xs text-gray-400">
                                {getRelativeTime(notification.createdAt)}
                              </Text>
                              
                              {/* Actions */}
                              <View className="flex-row">
                                {!notification.isRead && (
                                  <TouchableOpacity 
                                    onPress={(e) => handleMarkAsRead(e, notification.id)}
                                    className="p-1.5 mr-1"
                                  >
                                    <Ionicons name="checkmark" size={16} color="#2563EB" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View className="flex items-center justify-center py-12">
                    <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
                    <Text className="text-sm font-medium text-gray-400 mt-3">No notifications</Text>
                    <Text className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer Actions */}
              {notifications.length > 0 && (
                <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={onMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="flex-row items-center"
                  >
                    <Ionicons 
                      name="checkmark-done" 
                      size={16} 
                      color={unreadCount === 0 ? '#D1D5DB' : '#2563EB'} 
                    />
                    <Text className={`text-sm ml-1 ${
                      unreadCount === 0 ? 'text-gray-400' : 'text-blue-600'
                    }`}>
                      Mark all read
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Notification Detail Modal */}
      <Modal
        visible={selectedNotification !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <Pressable 
          className="flex-1 bg-black/50 items-center justify-center" 
          onPress={() => setSelectedNotification(null)}
        >
          {selectedNotification && (
            <Pressable 
              onPress={(e) => e.stopPropagation()}
              className="bg-white w-11/12 max-w-md rounded-2xl p-6 m-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name={notificationColors[selectedNotification.type].iconName}
                    size={24} 
                    color={notificationColors[selectedNotification.type].icon} 
                  />
                  <Text className="text-lg font-bold text-gray-900 ml-2 flex-1">
                    {selectedNotification.title}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedNotification(null)}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-sm text-gray-700 mb-4">
                {selectedNotification.message}
              </Text>
              
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xs text-gray-500">
                  {getRelativeTime(selectedNotification.createdAt)}
                </Text>
                <Text className="text-xs text-gray-500 capitalize">
                  {selectedNotification.type}
                </Text>
              </View>

              {selectedNotification.relatedURL && (
                <TouchableOpacity
                  onPress={() => {
                    router.push(selectedNotification.relatedURL as any);
                    setSelectedNotification(null);
                    setIsDropdownOpen(false);
                  }}
                  className="bg-blue-600 py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Go to Details</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </>
  );
};

export default NotificationIcon;