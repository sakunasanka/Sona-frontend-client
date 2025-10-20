import { getProfile } from "@/api/auth";
import NotificationIcon from '@/components/NotificationIcon';
import TopBar from "@/components/TopBar";
import { useChat } from "@/hooks/useChat";
import { useNotifications } from '@/hooks/useNotifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Wifi, WifiOff } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const useTabBarHeight = () => {
  const insets = useSafeAreaInsets();
  // Standard tab bar height is usually 49 on iOS and 56 on Android, plus safe area
  const tabBarHeight = Platform.OS === 'ios' ? 49 + insets.bottom : 56 + insets.bottom;
  return tabBarHeight;
};

const Chat = () => {
  //const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabBarHeight = useTabBarHeight();

  const chatId = 1; // Example chat ID
  const [currentUserId, setCurrentUserId] = useState<number>(19); // Will be loaded from API
  const currentUserName = 'Current User'; // Example current user name
  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Use notifications hook
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Load token and userId from profile API
  useEffect(() => {
    let isMounted = true;
    
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        
        console.log('Auth data loading:', {
          tokenExists: !!storedToken,
        });

        if (isMounted) {
          if (!storedToken) {
            console.log('No token found, user not authenticated');
            setToken(null);
            setIsTokenLoaded(true);
            return;
          }
          
          setToken(storedToken);
          
          // Fetch user profile to get the actual userId and profile data
          try {
            const profile = await getProfile();
            if (profile && profile.id) {
              console.log('✅ Got user ID from profile:', profile.id);
              setCurrentUserId(profile.id);
              setProfileData(profile);
              // Cache it for future use
              await AsyncStorage.setItem('userId', String(profile.id));
            }
          } catch (profileError) {
            console.log('Error fetching profile:', profileError);
            // Try to get from cache as fallback
            const cachedUserId = await AsyncStorage.getItem('userId');
            if (cachedUserId) {
              console.log('Using cached userId:', cachedUserId);
              setCurrentUserId(Number(cachedUserId));
            }
          }
          
          setIsTokenLoaded(true);
        }
      } catch (error) {
        console.log('Error loading auth data:', error);
        if (isMounted) {
          setToken(null);
          setIsTokenLoaded(true);
        }
      }
    };

    loadAuthData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Only initialize chat hook after token is loaded and available
  const shouldInitializeChat = isTokenLoaded && token;
  
  const {
    messages,
    typingUsers,
    isConnected,
    isLoading,
    hasMoreMessages,
    isLoadingMore,
    isSending,
    sendMessage: sendChatMessage,
    loadOlderMessages,
    startTyping,
    stopTyping,
    reconnect
  } = useChat(
    chatId, 
    currentUserId, 
    currentUserName, 
    shouldInitializeChat ? token : '',
    !!shouldInitializeChat // Pass this as a flag to control initialization
  );

  

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setIsKeyboardVisible(true);
        Animated.timing(keyboardHeight, {
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          toValue: event.endCoordinates.height - tabBarHeight,
          useNativeDriver: false,
        }).start();
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? (event.duration || 250) : 250);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setIsKeyboardVisible(false);
        // Stop typing when keyboard hides
        stopTyping();
        Animated.timing(keyboardHeight, {
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [keyboardHeight, tabBarHeight, stopTyping]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    
    if (text.trim()) {
      startTyping(); // Start typing indicator
    } else {
      stopTyping(); // Stop typing indicator
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      try {
        await sendChatMessage(inputText.trim()); // Use the hook's send function
        setInputText('');
        
        // Scroll to bottom after sending
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.log('Error sending message:', error);
        // You can add error handling here (show toast, etc.)
      }
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    
    // Load older messages when scrolled to top
    if (contentOffset.y <= 100 && hasMoreMessages && !isLoadingMore) {
      // loadOlderMessages();
    }
  };

  const formatMessageTime = (timestamp: string | undefined) => {
  try {
    if (!timestamp) {
      // console.warn('No timestamp provided');
      return '';
    }
    
    console.log('Formatting timestamp:', timestamp); // Debug log
    
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // console.warn('Invalid timestamp:', timestamp);
      return '';
    }
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    // console.log('Error formatting timestamp:', timestamp);
    return ''; // Fallback for invalid timestamps
  }
};

  // Show loading state until token is loaded
  if (!isTokenLoaded) {
    console.log('🔄 Chat: Waiting for token to load...');
    return (
      <>
        <TopBar title="Global Chat" />
        <View className="flex-1 justify-center items-center bg-gray-50">
          <Text className="text-gray-600">Loading authentication...</Text>
        </View>
      </>
    );
  }

  // Show error if no token after loading
  if (!token) {
    console.log('❌ Chat: No token found after loading');
    return (
      <>
        <TopBar title="Global Chat" />
        <View className="flex-1 justify-center items-center bg-gray-50">
          <Text className="text-red-600 mb-4">Authentication required</Text>
          <TouchableOpacity 
            onPress={() => {
              // Navigate to login or refresh token
              console.log('Navigate to login');
            }}
            className="bg-purple-500 px-4 py-2 rounded"
          >
            <Text className="text-white">Login</Text></TouchableOpacity>
        </View>
      </>
    );
  }

  console.log('✅ Chat: Token loaded, initializing chat...', {
    tokenExists: !!token,
    currentUserId,
    shouldInitializeChat
  });

  return (
    <>
      <View className='mt-10'>
        <StatusBar style="dark" />
        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <Text className="font-bold text-gray-900 font-alegreyaBold text-3xl mr-3">Global Chat</Text>
            {isConnected ? (
              <Wifi size={24} color="#10B981" />
            ) : (
              <WifiOff size={24} color="#EF4444" />
            )}
          </View>
          <View className="flex-row items-center">
            {/* Notification Icon */}
            <NotificationIcon
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notificationsLoading}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDeleteNotification={deleteNotification}
            />

            {/* Profile Image */}
            <TouchableOpacity onPress={() => router.push('/(hidden)/profile/view_profile')} >
              {profileData ? (
                <Image 
                  source={{ 
                    uri: profileData?.avatar || 'https://images.icon-icons.com/1378/PNG/512/avatardefault_92824.png' 
                  }} 
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-gray-200 justify-center items-center">
                  <ActivityIndicator size="small" color="#2563EB" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="flex-1 bg-gray-50">
        
        {/* Connection Status Banner */}
        {!isConnected && (
          <View className="bg-red-100 p-2 items-center border-b border-red-200">
            <Text className="text-red-800 text-sm">Disconnected from chat</Text>
            <TouchableOpacity onPress={reconnect}>
              <Text className="text-red-600 underline text-sm">Tap to reconnect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <Text className="text-gray-600">Loading chat...</Text>
          </View>
        )}

        {/* Fixed Background Image */}
        <Image 
          source={require('@/assets/images/chatBackground.png')}
          style={{
            backgroundColor: '#C3F4B6',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            opacity: 0.8,
            zIndex: 0,
          }}
          resizeMode="cover"
        />
        
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Load More Indicator */}
          {isLoadingMore && (
            <View className="py-4 items-center">
              <Text className="text-gray-500 text-sm">Loading older messages...</Text>
            </View>
          )}

          {messages.map((message, index) => {
            // Debug: Check if message has nested structure
            const actualMessage = (message as any).message?.message ? (message as any).message : message;
            
            // Debug logging
            if (index === messages.length - 1) {
              console.log('🔍 Last message comparison:', {
                'actualMessage.senderId': actualMessage.senderId,
                'actualMessage.senderId type': typeof actualMessage.senderId,
                'currentUserId': currentUserId,
                'currentUserId type': typeof currentUserId,
                'are they equal?': actualMessage.senderId == currentUserId,
                'loose equal?': actualMessage.senderId == currentUserId,
                'full message': actualMessage
              });
            }
            
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isSameUser = prevMessage && prevMessage.senderId == actualMessage.senderId;
            const isCurrentUser = actualMessage.senderId == currentUserId; // Use dynamic current user
            const marginTop = isSameUser ? 4 : 16;
            
            // Check if this is an optimistic message (temporary ID)
            // Optimistic messages have timestamp-based IDs and are from current user
            const isOptimistic = isCurrentUser && actualMessage.id > Date.now() - 60000 && actualMessage.id.toString().length >= 13;
            
            return (
              <View key={actualMessage.id} className={`${!isCurrentUser ? 'flex-row items-end' : 'items-end'}`}
                    style={{ marginTop }}>
                {/* Avatar for other users - only show for first message */}
                {!isCurrentUser && !isSameUser && (
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center mr-2 mb-1"
                    style={{ backgroundColor: actualMessage.avatarColor || '#6B7280' }}
                  >
                    <Text className="text-white font-bold text-xs">
                      {actualMessage.avatar || actualMessage.userName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                
                {/* Spacer for consecutive messages from same user - match avatar width + margin */}
                {!isCurrentUser && isSameUser && (
                  <View className="w-10" />
                )}
                
                {/* Message bubble */}
                <View className={`max-w-xs ${!isCurrentUser ? 'self-start' : 'self-end'}`}>
                  <View className={`p-3 rounded-2xl ${
                    !isCurrentUser 
                      ? 'bg-white border border-gray-200 rounded-bl-sm' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 rounded-br-sm'
                  }`}
                  style={{
                    backgroundColor: isCurrentUser ? '#8B5CF6' : '#FFFFFF', // Explicitly set white background for receiving messages
                    opacity: isOptimistic ? 0.7 : 1 // Slightly transparent for optimistic messages
                  }}
                  >
                    {/* User name for first message */}
                    {!isCurrentUser && !isSameUser && actualMessage.userName && (
                      <Text className="text-emerald-600 font-semibold text-xs mb-1">
                        {actualMessage.userName}
                      </Text>
                    )}
                    <Text className={!isCurrentUser ? 'text-gray-800' : 'text-white'}>
                      {typeof actualMessage.message === 'string' ? actualMessage.message : JSON.stringify(actualMessage.message)}
                    </Text>
                    <View className="flex-row items-center justify-between mt-1">
                      <Text className={`text-xs ${
                        !isCurrentUser ? 'text-gray-400' : 'text-purple-100'
                      }`}>
                        {formatMessageTime(actualMessage.createdAt ?? '')}
                      </Text>
                      {isOptimistic && isCurrentUser && (
                        <Text className="text-purple-200 text-xs ml-2">⏳</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <View className="flex-row items-center p-2 mt-2">
              <View className="flex-row space-x-1">
                <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              </View>
              <Text className="text-gray-500 text-sm ml-2">
                {typingUsers.map(user => user.userName).join(', ')} 
                {typingUsers.length === 1 ? ' is typing...' : ' are typing...'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Animated Input Container */}
        <Animated.View 
          className="bg-[C3F4B6] border-gray-200"
          style={{ 
            marginBottom: keyboardHeight,
          }}
        >
          <Animated.View 
            className="flex-row items-center p-4"
            style={{
              transform: [{
                translateY: Animated.multiply(0, -0.1)
              }]
            }}
          >
            <Animated.View
              className="flex-1 mr-3"
              style={{
                transform: [{
                  scale: keyboardHeight.interpolate({
                    inputRange: [0, 200, 300],
                    outputRange: [1, 1.02, 1.05],
                    extrapolate: 'clamp'
                  })
                }]
              }}
            >
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                placeholder="Type your message..."
                value={inputText}
                onChangeText={handleTextChange} // Use new handler with typing indicators
                onBlur={stopTyping} // Stop typing when input loses focus
                multiline
                maxLength={500}
                style={{ 
                  maxHeight: 100,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isKeyboardVisible ? 0.1 : 0.05,
                  shadowRadius: isKeyboardVisible ? 8 : 4,
                  elevation: isKeyboardVisible ? 3 : 1,
                }}
              />
            </Animated.View>
            
            <Animated.View
              style={{
                transform: [{
                  scale: keyboardHeight.interpolate({
                    inputRange: [0, 200, 300],
                    outputRange: [1, 1.1, 1.15],
                    extrapolate: 'clamp'
                  })
                }]
              }}
            >
              <TouchableOpacity
                onPress={handleSendMessage} // Use new handler
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ 
                  backgroundColor: (inputText.trim() && !isSending) ? '#8B5CF6' : '#D1D5DB', // Visual feedback
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isKeyboardVisible ? 0.3 : 0.15,
                  shadowRadius: isKeyboardVisible ? 8 : 4,
                  elevation: isKeyboardVisible ? 5 : 2,
                }}
                disabled={!inputText.trim() || !isConnected || isSending} // Disable if disconnected or sending
              >
                <Text className="text-white font-bold text-lg">
                  {isSending ? '⏳' : '→'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </>
  );
};

export default Chat;