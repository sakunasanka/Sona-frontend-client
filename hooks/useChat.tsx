import { useCallback, useEffect, useRef, useState } from 'react';
import { getChatMessages, getOlderMessages } from '../api/chat';
import { chatWebSocketService } from '../api/websocket';

interface ChatMessage {
  id: number;
  text: string;
  userId: number;
  userName?: string;
  avatar?: string;
  avatarColor?: string;
  timestamp: string;
  chatId: number;
}

interface TypingUser {
  userId: number;
  userName: string;
}

export const useChat = (
  chatId: number,
  currentUserId: number,
  currentUserName: string,
  token?: string
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      try {
        // Load initial messages
      const response = await getChatMessages(chatId, 1, 30, token);
      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      // Handle different response structures
      let messages: ChatMessage[] = [];
      let hasMore = false;
      
      if (Array.isArray(response)) {
        // If response is directly an array: [{}, {}, {}]
        messages = response;
        hasMore = false;
        console.log('Response is array with', messages.length, 'messages');
      } else if (response && response.data && response.data.message && Array.isArray(response.data.message)) {
        // ✅ YOUR ACTUAL STRUCTURE: response.data.message contains the array
        messages = response.data.message;
        hasMore = response.data.pagination?.hasMore || false;
        console.log('Response has data.message property with', messages.length, 'messages');
      } else if (response && response.data && Array.isArray(response.data)) {
        // Alternative structure: { data: [{}, {}], pagination: {...} }
        messages = response.data;
        hasMore = response.pagination?.hasMore || false;
        console.log('Response has data property with', messages.length, 'messages');
      } else {
        console.warn('Unexpected response structure:', response);
        console.log('Available keys:', response ? Object.keys(response) : 'none');
        if (response?.data) {
          console.log('Data keys:', Object.keys(response.data));
        }
        messages = [];
        hasMore = false;
      }

      console.log('Processed messages:', {
        count: messages.length,
        hasMore,
        firstMessage: messages[0],
        lastMessage: messages[messages.length - 1]
      });

      if (messages.length === 0) {
        console.warn('No messages found for chat:', chatId);
      }

      // Reverse messages to show newest at bottom (only if we have messages)
      setMessages(messages.length > 0 ? [...messages].reverse() : []);
      setHasMoreMessages(hasMore);

      if (!token) {
        console.warn('No token provided, WebSocket connection may not be authenticated.');
      } else {
        console.log('WebSocket token:', token);
        }
        
        // Connect to WebSocket
        chatWebSocketService.connect(chatId, currentUserId, token);
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // WebSocket event listeners
    const unsubscribeMessage = chatWebSocketService.onMessage((message) => {
      // Avoid duplicate messages (check if message already exists)
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === message.id);
        if (messageExists) return prev;
        return [...prev, message];
      });
    });

    const unsubscribeTyping = chatWebSocketService.onTyping((typing) => {
      if (typing.userId === currentUserId) return; // Don't show own typing

      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== typing.userId);
        if (typing.isTyping) {
          return [...filtered, { userId: typing.userId, userName: typing.userName }];
        }
        return filtered;
      });
    });

   const unsubscribeConnection = chatWebSocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeConnection();
      
      // Clear typing timeout on cleanup
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      chatWebSocketService.disconnect();
    };
  }, [chatId, currentUserId, token]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestMessageId = messages[0]?.id;
      const response = await getOlderMessages(chatId, oldestMessageId);
      
      setMessages(prev => [...response.data.reverse(), ...prev]);
      setHasMoreMessages(response.pagination.hasMore);
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, hasMoreMessages, isLoadingMore, messages]);

  // Send message
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return; // Don't send empty messages
    
    const message = {
      text: text.trim(),
      userId: currentUserId,
      userName: currentUserName,
      chatId
    };

    // Send via WebSocket (real-time)
    chatWebSocketService.sendMessage(message);
    
    // Stop typing when message is sent
    stopTyping();
  }, [chatId, currentUserId, currentUserName]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!isConnected) return; // Don't send typing if not connected
    
    chatWebSocketService.sendTypingStatus(true, chatId, currentUserId, currentUserName);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      chatWebSocketService.sendTypingStatus(false, chatId, currentUserId, currentUserName);
    }, 3000);
  }, [chatId, currentUserId, currentUserName, isConnected]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    if (isConnected) {
      chatWebSocketService.sendTypingStatus(false, chatId, currentUserId, currentUserName);
    }
  }, [chatId, currentUserId, currentUserName, isConnected]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    chatWebSocketService.connect(chatId, currentUserId, token);
  }, [chatId, currentUserId, token]);

  return {
    messages,
    typingUsers,
    isConnected,
    isLoading,
    hasMoreMessages,
    isLoadingMore,
    sendMessage,
    loadOlderMessages,
    startTyping,
    reconnect,
    stopTyping
  };
};