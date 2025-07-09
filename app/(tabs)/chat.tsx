import TopBar from "@/components/TopBar";
import { useChat } from "@/hooks/useChat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string; // Changed from number to string
  text: string;
  time: string;
  userId: number;
  userName?: string;
  avatar?: string;
  avatarColor?: string;
  timestamp: string; // Add timestamp field
  chatId: number; // Add chatId field
}

// const SAMPLE_MESSAGES: Message[] = [
//   {
//     id: '1',
//     text: 'Hello everyone! How are you all feeling today?',
//     time: '10:30 AM',
//     userId: 'user_dr_sarah',
//     userName: 'Dr. Sarah Wilson',
//     avatar: 'SW',
//     avatarColor: '#10B981', // Green,
//     timestamp: '2023-03-15T10:30:00Z',
//     chatId: 'global_chat'
//   },
//   // {
//   //   id: '2',
//   //   text: 'Hi Dr. Wilson, I\'ve been feeling a bit anxious lately.',
//   //   time: '10:31 AM',
//   //   userId: 'current_user',
//   //   avatar: 'CU',
//   //   avatarColor: '#FBBF24', // Amber
//   // },
//   {
//     id: '3',
//     text: 'I think I need some advice on managing it.',
//     time: '10:31 AM',
//     userId: 'current_user', // Consecutive current_user (should have small gap)
//   },
//   {
//     id: 4,
//     text: 'Hey everyone! I\'m doing better this week, thanks for asking 😊',
//     time: '10:32 AM',
//     userId: 'user_alex',
//     userName: 'Alex Chen',
//     avatar: 'AC',
//     avatarColor: '#3B82F6' // Blue
//   },
//   {
//     id: 5,
//     text: 'That\'s great to hear Alex! What helped you feel better?',
//     time: '10:33 AM',
//     userId: 'user_dr_sarah',
//     userName: 'Dr. Sarah Wilson',
//     avatar: 'SW',
//     avatarColor: '#10B981' // Green
//   },
//   {
//     id: 6,
//     text: 'I\'ve been practicing the breathing exercises we discussed',
//     time: '10:34 AM',
//     userId: 'user_alex',
//     userName: 'Alex Chen',
//     avatar: 'AC',
//     avatarColor: '#3B82F6' // Blue
//   },
//   {
//     id: 7,
//     text: 'And doing morning walks really helps my mood',
//     time: '10:34 AM',
//     userId: 'user_alex', // Consecutive Alex (should have small gap)
//     userName: 'Alex Chen',
//     avatar: 'AC',
//     avatarColor: '#3B82F6' // Blue
//   },
//   {
//     id: 8,
//     text: 'Thanks for sharing Alex. I should try those breathing exercises too',
//     time: '10:37 AM',
//     userId: 'current_user', // After Alex (should have large gap)
//   },
//   {
//     id: 9,
//     text: 'I think I\'ll start with 5 minutes a day',
//     time: '10:38 AM',
//     userId: 'current_user', // Consecutive current_user (should have small gap)
//   },
//   {
//     id: 10,
//     text: 'That sounds like a great plan!',
//     time: '10:38 AM',
//     userId: 'current_user', // Another consecutive current_user (should have small gap)
//   },
//   {
//     id: 11,
//     text: 'Joining the conversation! Has anyone tried meditation apps?',
//     time: '10:39 AM',
//     userId: 'user_jordan', // After current_user (should have large gap)
//     userName: 'Jordan Kim',
//     avatar: 'JK',
//     avatarColor: '#8B5CF6' // Purple
//   },
//   {
//     id: 12,
//     text: 'Yes! I use Headspace daily. Really helps with anxiety',
//     time: '10:40 AM',
//     userId: 'user_maya',
//     userName: 'Maya Patel',
//     avatar: 'MP',
//     avatarColor: '#F59E0B' // Amber
//   },
//   {
//     id: 13,
//     text: 'I prefer Calm app personally, but both are great options',
//     time: '10:41 AM',
//     userId: 'user_alex',
//     userName: 'Alex Chen',
//     avatar: 'AC',
//     avatarColor: '#3B82F6' // Blue
//   },
// ];

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

  const chatId = 2; // Example chat ID
  const currentUserId = 19; // Example current user ID
  const currentUserName = 'Current User'; // Example current user name
  const [token, setToken] = useState<string>('');
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        console.log('Token loaded from storage:', {
          exists: !!storedToken,
          length: storedToken?.length,
          preview: storedToken?.substring(0, 20) + '...'
        });

        if (!storedToken) {
          console.log('No token found, user not authenticated');
        }else{
           setToken(storedToken);
        }
       
        setIsTokenLoaded(true);
      } catch (error) {
        console.error('Error loading token:', error);
        setIsTokenLoaded(true); // Mark as loaded even if failed
      }
    };

    loadToken();
  }, []);

  const {
    messages,
    typingUsers,
    isConnected,
    isLoading,
    hasMoreMessages,
    isLoadingMore,
    sendMessage: sendChatMessage,
    loadOlderMessages,
    startTyping,
    stopTyping,
    reconnect
  } = useChat(
    chatId, 
    currentUserId, 
    currentUserName, 
    isTokenLoaded ? token : ''
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

  const handleSendMessage = () => {
    if (inputText.trim()) {
      sendChatMessage(inputText.trim()); // Use the hook's send function
      setInputText('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    
    // Load older messages when scrolled to top
    if (contentOffset.y <= 100 && hasMoreMessages && !isLoadingMore) {
      loadOlderMessages();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return ''; // Fallback for invalid timestamps
    }
  };

  if (!isTokenLoaded) {
    return (
      <>
        <TopBar title="Global Chat" />
        <View className="flex-1 justify-center items-center bg-gray-50">
          <Text className="text-gray-600">Loading authentication...</Text>
        </View>
      </>
    );
  }

  // ✅ Show error if no token after loading
  if (!token) {
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
            <Text className="text-white">Login</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <TopBar title={`Global Chat ${isConnected ? '🟢' : '🔴'}`} />
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
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isSameUser = prevMessage && prevMessage.userId === message.userId;
            const isCurrentUser = message.userId === currentUserId; // Use dynamic current user
            const marginTop = isSameUser ? 4 : 16;
            
            return (
              <View key={message.id} className={`${!isCurrentUser ? 'flex-row items-end' : 'items-end'}`}
                    style={{ marginTop }}>
                {/* Avatar for other users */}
                {!isCurrentUser && !isSameUser && message.avatar && (
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center mr-2 mb-1"
                    style={{ backgroundColor: message.avatarColor }}
                  >
                    <Text className="text-white font-bold text-xs">
                      {message.avatar}
                    </Text>
                  </View>
                )}
                
                {/* Spacer for avatar when same user */}
                {!isCurrentUser && isSameUser && (
                  <View className="w-8 mr-2" />
                )}
                
                {/* Message bubble */}
                <View className={`max-w-xs ${!isCurrentUser ? 'flex-1' : 'self-end'}`}>
                  <View className={`p-3 rounded-2xl ${
                    !isCurrentUser 
                      ? 'bg-white border border-gray-200 rounded-bl-sm' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 rounded-br-sm'
                  }`}
                  style={isCurrentUser ? { backgroundColor: '#8B5CF6' } : {}}
                  >
                    {/* User name for first message */}
                    {!isCurrentUser && !isSameUser && message.userName && (
                      <Text className="text-emerald-600 font-semibold text-xs mb-1">
                        {message.userName}
                      </Text>
                    )}
                    <Text className={!isCurrentUser ? 'text-gray-800' : 'text-white'}>
                      {message.text}
                    </Text>
                    <Text className={`text-xs mt-1 ${
                      !isCurrentUser ? 'text-gray-400' : 'text-purple-100'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </Text>
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
                  backgroundColor: inputText.trim() ? '#8B5CF6' : '#D1D5DB', // Visual feedback
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isKeyboardVisible ? 0.3 : 0.15,
                  shadowRadius: isKeyboardVisible ? 8 : 4,
                  elevation: isKeyboardVisible ? 5 : 2,
                }}
                disabled={!inputText.trim() || !isConnected} // Disable if disconnected
              >
                <Text className="text-white font-bold text-lg">→</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </>
  );
};

export default Chat;