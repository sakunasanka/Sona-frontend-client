import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Animated,
  StatusBar,
  Vibration,
  Keyboard,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Mic,
  Play,
  Pause,
  MoreVertical,
  Clock,
  Camera,
  ImageIcon,
  FileText,
  MapPin,
  Check
} from 'lucide-react-native';
import { router } from 'expo-router';

interface Message {
  id: string;
  type: 'text' | 'voice';
  content: string;
  sender: 'user' | 'counselor';
  timestamp: Date;
  duration?: number;
  isPlaying?: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'pending';
}

export default function CounselorChat() {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  
  // Action handlers
  const handleBackPress = () => {
    Alert.alert(
      "Leave Chat",
      "Are you sure you want to leave this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: () => console.log("Navigate back") }
      ]
    );
  };

  const handleMoreOptions = () => {
    const options = [
      'View Profile',
      'Clear Chat History',
      'Block Contact',
      'Report Issue',
      'Cancel'
    ];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: 2, // Block Contact
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              console.log("View Profile");
              break;
            case 1:
              Alert.alert("Clear Chat", "Are you sure you want to clear all messages?", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: () => setMessages([]) }
              ]);
              break;
            case 2:
              Alert.alert("Block Contact", "Are you sure you want to block this counselor?");
              break;
            case 3:
              console.log("Report Issue");
              break;
          }
        }
      );
    } else {
      // Android fallback
      Alert.alert(
        "Options",
        "Choose an action:",
        [
          { text: "View Profile", onPress: () => console.log("View Profile") },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const handleAttachment = () => {
    const options = [
      'Camera',
      'Photo Library',
      'Document',
      'Location',
      'Cancel'
    ];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              console.log("Open Camera");
              break;
            case 1:
              console.log("Open Photo Library");
              break;
            case 2:
              console.log("Open Document Picker");
              break;
            case 3:
              console.log("Share Location");
              break;
          }
        }
      );
    } else {
      // Android fallback
      Alert.alert(
        "Attach File",
        "Choose attachment type:",
        [
          { text: "Camera", onPress: () => console.log("Open Camera") },
          { text: "Gallery", onPress: () => console.log("Open Gallery") },
          { text: "Document", onPress: () => console.log("Open Documents") },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'text',
      content: 'Hi there! How are you feeling today? I\'m here to listen and support you.',
      sender: 'counselor',
      timestamp: new Date('2024-01-15T10:30:00'),
      status: 'read'
    },
    {
      id: '2',
      type: 'text',
      content: "Hello Dr. David. I've been feeling quite anxious lately, especially about work.",
      sender: 'user',
      timestamp: new Date('2024-01-15T10:32:00'),
      status: 'read'
    },
    {
      id: '3',
      type: 'text',
      content: 'I understand that work anxiety can be overwhelming. Can you tell me more about what specifically is making you feel anxious?',
      sender: 'counselor',
      timestamp: new Date('2024-01-15T10:33:00'),
      status: 'read'
    },
    {
      id: '4',
      type: 'voice',
      content: '',
      sender: 'user',
      timestamp: new Date('2024-01-15T10:35:00'),
      duration: 23,
      status: 'delivered'
    },
    {
      id: '5',
      type: 'text',
      content: 'Thank you for sharing that with me. It sounds like you\'re dealing with a lot of pressure.',
      sender: 'counselor',
      timestamp: new Date('2024-01-15T14:22:00'),
      status: 'read'
    },
    {
      id: '6',
      type: 'text',
      content: 'Yes, the workload has been really intense this month.',
      sender: 'user',
      timestamp: new Date('2024-01-15T14:25:00'),
      status: 'pending'
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;
  const recordingPulse = useRef(new Animated.Value(0)).current;
  const typingDots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(typingDots, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingDots.stopAnimation();
    }
  }, [isTyping]);

  const startRecording = () => {
    setIsRecording(true);
    Vibration.vibrate(50);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnimation, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(recordingPulse, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    Vibration.vibrate(30);
    recordingAnimation.stopAnimation();
    recordingPulse.stopAnimation();
    recordingAnimation.setValue(1);
    recordingPulse.setValue(0);
    
    const newVoiceMessage: Message = {
      id: Date.now().toString(),
      type: 'voice',
      content: '',
      sender: 'user',
      timestamp: new Date(),
      duration: Math.floor(Math.random() * 30) + 5,
      status: 'sent'
    };
    setMessages(prev => [...prev, newVoiceMessage]);
  };

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'text',
        content: message.trim(),
        sender: 'user',
        timestamp: new Date(),
        status: 'sent'
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      setTimeout(() => setIsTyping(true), 1000);
      setTimeout(() => {
        setIsTyping(false);
        const counselorResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'text',
          content: 'I hear you. These feelings are valid, and we can work through this together.',
          sender: 'counselor',
          timestamp: new Date(),
          status: 'sent'
        };
        setMessages(prev => [...prev, counselorResponse]);
      }, 3000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const shouldShowDate = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    return currentMessage.timestamp.toDateString() !== previousMessage.timestamp.toDateString();
  };

  const VoiceMessage = ({ message, isUser }: { message: Message; isUser: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressAnimation = useRef(new Animated.Value(0)).current;

    const togglePlayback = () => {
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        Animated.timing(progressAnimation, {
          toValue: 1,
          duration: (message.duration || 10) * 1000,
          useNativeDriver: false,
        }).start(() => {
          setIsPlaying(false);
          progressAnimation.setValue(0);
        });
      } else {
        progressAnimation.stopAnimation();
        progressAnimation.setValue(0);
      }
    };

    return (
      <View className="flex-row items-center min-w-48">
        <TouchableOpacity 
          onPress={togglePlayback} 
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            isUser ? 'bg-white/20' : 'bg-blue-200'
          }`}
        >
          {isPlaying ? (
            <Pause size={18} color={isUser ? "white" : "#4F46E5"} />
          ) : (
            <Play size={18} color={isUser ? "white" : "#4F46E5"} />
          )}
        </TouchableOpacity>
        
        <View className="flex-1">
          <View className="flex-row items-center h-8 gap-1">
            {Array.from({ length: 25 }).map((_, index) => {
              const height = Math.sin(index * 0.5) * 12 + 8;
              return (
                <Animated.View
                  key={index}
                  className={`w-0.5 rounded-full ${
                    isUser ? 'bg-white/60' : 'bg-gray-400'
                  }`}
                  style={{ 
                    height,
                    opacity: progressAnimation.interpolate({
                      inputRange: [0, index / 25, (index + 1) / 25, 1],
                      outputRange: [0.3, 0.3, 1, 0.3],
                      extrapolate: 'clamp'
                    })
                  }}
                />
              );
            })}
          </View>
          <Text className={`text-xs mt-1 ${isUser ? 'text-white/80' : 'text-gray-500'}`}>
            {Math.floor((message.duration || 0) / 60)}:{((message.duration || 0) % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>
    );
  };

  const MessageStatus = ({ status }: { status?: string }) => {
    if (!status) return null;
    
    const renderStatusIcon = () => {
      switch (status) {
        case 'pending':
          return <Clock size={12} color="#9CA3AF" />;
        case 'sent':
          return <Check size={12} color="#9CA3AF" />;
        case 'delivered':
          return (
            <View className="flex-row">
              <Check size={12} color="#9CA3AF" />
            </View>
          );
        case 'read':
          return (
            <View className="flex-row -space-x-1">
              <Check size={12} color="#3B82F6" />
              <Check size={12} color="#3B82F6" />
            </View>
          );
        default:
          return null;
      }
    };

    return (
      <View className="flex-row items-center">
        {renderStatusIcon()}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white shadow-sm border-b border-gray-100">
        <TouchableOpacity 
          className="p-2 -ml-2 mr-2"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View className="flex-row items-center flex-1">
          <View className="relative">
            <Image
              source={{ uri: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg' }}
              className="w-12 h-12 rounded-full"
            />
            <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-lg font-semibold text-gray-900">Dr. Ugo David</Text>
            <Text className="text-sm text-green font-medium">Available now</Text>
          </View>
        </View>
        
        <View className="flex-row items-center space-x-1">
          <TouchableOpacity 
            className="p-3 rounded-full hover:bg-gray-100"
            onPress={handleMoreOptions}
          >
            <MoreVertical size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-4 bg-gray-50" 
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View className="py-4">
          {messages.map((msg, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : undefined;
            const showDate = shouldShowDate(msg, previousMessage);
            const isUser = msg.sender === 'user';

            return (
              <View key={msg.id} className="mb-6">
                {showDate && (
                  <View className="items-center my-6">
                    <View className="bg-white px-4 py-2 rounded-full shadow-sm">
                      <Text className="text-sm font-medium text-gray-600">
                        {formatDate(msg.timestamp)}
                      </Text>
                    </View>
                  </View>
                )}
                
                <View className={`flex-row items-end ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                  {!isUser && (
                    <Image
                      source={{ uri: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg' }}
                      className="w-8 h-8 rounded-full mr-3 mb-1"
                    />
                  )}
                  
                  <View className={`max-w-[80%] rounded-3xl px-5 py-4 shadow-sm ${
                    isUser 
                      ? 'bg-primary rounded-br-lg' 
                      : 'bg-white rounded-bl-lg border border-gray-100'
                  }`}>
                    {msg.type === 'text' ? (
                      <Text className={`text-base leading-relaxed ${
                        isUser ? 'text-white' : 'text-gray-800'
                      }`}>
                        {msg.content}
                      </Text>
                    ) : (
                      <VoiceMessage message={msg} isUser={isUser} />
                    )}
                  </View>
                </View>
                
                {/* Status and timestamp row */}
                {isUser ? (
                  <View className="flex-row items-center justify-end mt-1 space-x-2">
                    <MessageStatus status={msg.status} />
                    <Text className="text-xs text-gray-400">
                      {formatTime(msg.timestamp)}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center mt-1 ml-14 space-x-2">
                    <Text className="text-xs text-gray-400">
                      {formatTime(msg.timestamp)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          
          {/* Typing Indicator */}
          {isTyping && (
            <View className="flex-row items-end justify-start mb-4">
              <Image
                source={{ uri: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg' }}
                className="w-8 h-8 rounded-full mr-3"
              />
              <View className="bg-white rounded-3xl rounded-bl-lg px-5 py-4 shadow-sm border border-gray-100">
                <Animated.View 
                  className="flex-row items-center space-x-1"
                  style={{ opacity: typingDots }}
                >
                  <View className="w-2 h-2 rounded-full bg-gray-400" />
                  <View className="w-2 h-2 rounded-full bg-gray-400" />
                  <View className="w-2 h-2 rounded-full bg-gray-400" />
                </Animated.View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input Area */}
      <View 
        className="px-4 py-4 bg-white border-t border-gray-100"
        style={{ paddingBottom: Math.max(keyboardHeight ? 4 : 20, 4) }}
      >
        <View className="flex-row items-end bg-gray-100 rounded-3xl px-4 py-3 min-h-14 shadow-sm">
          <TextInput
            className="flex-1 text-base text-gray-800 max-h-24 leading-relaxed"
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            style={{ paddingTop: 8, paddingBottom: 8 }}
          />
          
          <TouchableOpacity 
            className="p-2 ml-2"
            onPress={handleAttachment}
          >
            <Paperclip size={22} color="#6B7280" />
          </TouchableOpacity>
          
          {message.trim() ? (
            <TouchableOpacity 
              className="w-11 h-11 rounded-full bg-primary items-center justify-center ml-2 shadow-lg"
              onPress={sendMessage}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <View className="relative">
              {isRecording && (
                <Animated.View 
                  className="absolute inset-0 w-11 h-11 rounded-full bg-red-400"
                  style={{
                    opacity: recordingPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0]
                    }),
                    transform: [{
                      scale: recordingPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2]
                      })
                    }]
                  }}
                />
              )}
              <Animated.View style={{ transform: [{ scale: recordingAnimation }] }}>
                <TouchableOpacity
                  className={`w-11 h-11 rounded-full items-center justify-center ml-2 shadow-lg ${
                    isRecording ? 'bg-red-600' : 'bg-emerald-600'
                  }`}
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                >
                  <Mic size={20} color="white" />
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}