import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Paperclip, Phone, Send, Video } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromUser: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface Psychiatrist {
  id: string;
  name: string;
  avatar: string;
  title: string;
  isOnline: boolean;
}

export default function PsychiatristChatScreen() {
  const params = useLocalSearchParams();
  const psychiatristId = params.psychiatristId as string;
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [psychiatrist, setPsychiatrist] = useState<Psychiatrist | null>(null);
  const [imageError, setImageError] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Mock psychiatrist data
  const mockPsychiatrist: Psychiatrist = {
    id: psychiatristId,
    name: "Sarah Mitchell",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    title: "Child & Adolescent Psychiatrist",
    isOnline: true
  };

  // Mock initial messages
  const mockMessages: Message[] = [
    {
      id: '1',
      text: "Hello! I'm Dr. Sarah Mitchell. How can I help you today?",
      timestamp: new Date(Date.now() - 3600000),
      isFromUser: false,
      status: 'read'
    },
    {
      id: '2',
      text: "Hi Dr. Mitchell, I wanted to discuss some concerns about anxiety I've been experiencing.",
      timestamp: new Date(Date.now() - 3300000),
      isFromUser: true,
      status: 'read'
    },
    {
      id: '3',
      text: "I understand. Anxiety can be quite challenging. Can you tell me more about when these feelings typically occur?",
      timestamp: new Date(Date.now() - 3000000),
      isFromUser: false,
      status: 'read'
    }
  ];

  useEffect(() => {
    setPsychiatrist(mockPsychiatrist);
    setMessages(mockMessages);
  }, []);

  const sendMessage = () => {
    if (message.trim().length > 0) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        timestamp: new Date(),
        isFromUser: true,
        status: 'sent'
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Simulate doctor response (for demo purposes)
      setTimeout(() => {
        const doctorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "Thank you for sharing that with me. I'd like to schedule a proper consultation to discuss this further. Would you like me to send you some available times?",
          timestamp: new Date(),
          isFromUser: false,
          status: 'delivered'
        };
        setMessages(prev => [...prev, doctorResponse]);
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 2000);
    }
  };

  const handleCallPress = () => {
    Alert.alert(
      'Voice Call',
      `Call Dr. ${psychiatrist?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Voice call initiated') }
      ]
    );
  };

  const handleVideoCallPress = () => {
    Alert.alert(
      'Video Call',
      `Start video consultation with Dr. ${psychiatrist?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Call', onPress: () => console.log('Video call initiated') }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View className={`mb-4 mx-4 ${item.isFromUser ? 'items-end' : 'items-start'}`}>
        <View
          className={`max-w-[80%] p-3 rounded-2xl ${
            item.isFromUser
              ? 'bg-primary rounded-br-md'
              : 'bg-white rounded-bl-md border border-gray-100'
          }`}
        >
          <Text className={`${item.isFromUser ? 'text-white' : 'text-gray-900'} text-base`}>
            {item.text}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-1 px-1">
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {item.isFromUser && item.status && (
            <Text className={`ml-2 ${item.status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
              {item.status === 'read' ? '✓✓' : '✓'}
            </Text>
          )}
        </Text>
      </View>
    );
  };

  if (!psychiatrist) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Loading chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      {/* Header */}
      <View className="bg-primary px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-row items-center flex-1">
            {!imageError ? (
              <Image
                source={{ uri: psychiatrist.avatar }}
                className="w-10 h-10 rounded-full bg-gray-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-300 justify-center items-center">
                <Text className="text-gray-600 font-semibold text-sm">
                  {psychiatrist.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Text>
              </View>
            )}
            
            <View className="ml-3 flex-1">
              <Text className="text-white font-semibold text-lg">Dr. {psychiatrist.name}</Text>
              <Text className="text-blue-100 text-sm">
                {psychiatrist.isOnline ? 'Online' : 'Last seen recently'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Call buttons */}
        <View className="flex-row space-x-3">
          <TouchableOpacity onPress={handleCallPress} className="p-2">
            <Phone size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVideoCallPress} className="p-2">
            <Video size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Professional disclaimer */}
      <View className="bg-purple-50 border-b border-purple-100 px-4 py-2">
        <Text className="text-purple-800 text-xs font-medium text-center">
          🔒 Secure medical consultation • All messages are confidential
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 10 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input */}
      <View className="bg-white border-t border-gray-200 px-4 py-3">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="p-2">
            <Paperclip size={22} color="#6B7280" />
          </TouchableOpacity>
          
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-gray-900"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity
            onPress={sendMessage}
            className={`p-3 rounded-full ${message.trim().length > 0 ? 'bg-primary' : 'bg-gray-300'}`}
            disabled={message.trim().length === 0}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text className="text-xs text-gray-500 mt-2 text-center">
          For emergency situations, please call emergency services or visit the nearest hospital
        </Text>
      </View>
    </SafeAreaView>
  );
}
