// eslint-disable-next-line import/no-unresolved
import TopBar from "@/components/TopBar";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: number;
  text: string;
  time: string;
  userId: string;
  userName?: string;
  avatar?: string;
  avatarColor?: string;
}

const SAMPLE_MESSAGES: Message[] = [
  {
    id: 1,
    text: 'Hello everyone! How are you all feeling today?',
    time: '10:30 AM',
    userId: 'user_dr_sarah',
    userName: 'Dr. Sarah Wilson',
    avatar: 'SW',
    avatarColor: '#10B981' // Green
  },
  {
    id: 2,
    text: 'Hi Dr. Wilson, I\'ve been feeling a bit anxious lately.',
    time: '10:31 AM',
    userId: 'current_user',
  },
  {
    id: 3,
    text: 'I think I need some advice on managing it.',
    time: '10:31 AM',
    userId: 'current_user', // Consecutive current_user (should have small gap)
  },
  {
    id: 4,
    text: 'Hey everyone! I\'m doing better this week, thanks for asking 😊',
    time: '10:32 AM',
    userId: 'user_alex',
    userName: 'Alex Chen',
    avatar: 'AC',
    avatarColor: '#3B82F6' // Blue
  },
  {
    id: 5,
    text: 'That\'s great to hear Alex! What helped you feel better?',
    time: '10:33 AM',
    userId: 'user_dr_sarah',
    userName: 'Dr. Sarah Wilson',
    avatar: 'SW',
    avatarColor: '#10B981' // Green
  },
  {
    id: 6,
    text: 'I\'ve been practicing the breathing exercises we discussed',
    time: '10:34 AM',
    userId: 'user_alex',
    userName: 'Alex Chen',
    avatar: 'AC',
    avatarColor: '#3B82F6' // Blue
  },
  {
    id: 7,
    text: 'And doing morning walks really helps my mood',
    time: '10:34 AM',
    userId: 'user_alex', // Consecutive Alex (should have small gap)
    userName: 'Alex Chen',
    avatar: 'AC',
    avatarColor: '#3B82F6' // Blue
  },
  {
    id: 8,
    text: 'Thanks for sharing Alex. I should try those breathing exercises too',
    time: '10:37 AM',
    userId: 'current_user', // After Alex (should have large gap)
  },
  {
    id: 9,
    text: 'I think I\'ll start with 5 minutes a day',
    time: '10:38 AM',
    userId: 'current_user', // Consecutive current_user (should have small gap)
  },
  {
    id: 10,
    text: 'That sounds like a great plan!',
    time: '10:38 AM',
    userId: 'current_user', // Another consecutive current_user (should have small gap)
  },
  {
    id: 11,
    text: 'Joining the conversation! Has anyone tried meditation apps?',
    time: '10:39 AM',
    userId: 'user_jordan', // After current_user (should have large gap)
    userName: 'Jordan Kim',
    avatar: 'JK',
    avatarColor: '#8B5CF6' // Purple
  },
  {
    id: 12,
    text: 'Yes! I use Headspace daily. Really helps with anxiety',
    time: '10:40 AM',
    userId: 'user_maya',
    userName: 'Maya Patel',
    avatar: 'MP',
    avatarColor: '#F59E0B' // Amber
  },
  {
    id: 13,
    text: 'I prefer Calm app personally, but both are great options',
    time: '10:41 AM',
    userId: 'user_alex',
    userName: 'Alex Chen',
    avatar: 'AC',
    avatarColor: '#3B82F6' // Blue
  },
];

const useTabBarHeight = () => {
  const insets = useSafeAreaInsets();
  // Standard tab bar height is usually 49 on iOS and 56 on Android, plus safe area
  const tabBarHeight = Platform.OS === 'ios' ? 49 + insets.bottom : 56 + insets.bottom;
  return tabBarHeight;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabBarHeight = useTabBarHeight();

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
        
        // Scroll to bottom when keyboard opens
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? (event.duration || 250) : 250);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setIsKeyboardVisible(false);
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
  }, [keyboardHeight, tabBarHeight]);

  // Scroll to bottom on initial load
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: inputText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userId: 'current_user',
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <>
      <TopBar title="Group Chat" />
      <View className="flex-1 bg-gray-50">
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {messages.map((message, index) => {
            // Check if previous message is from the same user
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isSameUser = prevMessage && prevMessage.userId === message.userId;
            const isCurrentUser = message.userId === 'current_user';
            
            // Determine margin: small gap (4px) for consecutive messages from same user, 
            // large gap (16px) for first message or when user changes
            const marginTop = isSameUser ? 4 : 16;
            
            return (
            <View key={message.id} className={`${!isCurrentUser ? 'flex-row items-end' : 'items-end'}`}
                  style={{ marginTop }}>
              {/* Avatar for other users - only show if not same user or first message */}
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
                  {/* Only show name for first message from user or when user changes */}
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
                    {message.time}
                  </Text>
                </View>
              </View>
            </View>
            );
          })}
        </ScrollView>

        {/* Animated Input Container */}
        <Animated.View 
          className="bg-gray-100 border-t border-gray-200"
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
                onChangeText={setInputText}
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
                onPress={sendMessage}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ 
                  backgroundColor: '#8B5CF6',
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isKeyboardVisible ? 0.3 : 0.15,
                  shadowRadius: isKeyboardVisible ? 8 : 4,
                  elevation: isKeyboardVisible ? 5 : 2,
                }}
                disabled={!inputText.trim()}
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