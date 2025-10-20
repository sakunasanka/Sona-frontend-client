import { useCallback, useEffect, useRef, useState } from 'react';
import { getChatMessages, getOlderMessages, sendChatMessage } from '../api/chat';
import { chatWebSocketService } from '../api/websocket';

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  message: string;
  messageType?: 'text' | 'image' | 'file';
  userName?: string;
  avatar?: string;
  avatarColor?: string;
  createdAt: string;
}

interface TypingUser {
  userId: number;
  userName: string;
}

export const useChat = (
  chatId: number,
  currentUserId: number,
  currentUserName: string,
  token?: string,
  shouldInitialize: boolean = true
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedMessageIds = useRef<Set<number>>(new Set());

  const transformMessage = (backendMessage: any): ChatMessage => {
    console.log('🔧 Transforming message:', backendMessage); // Debug log
    
    const transformed = {
      id: Number(backendMessage.id),                   
      roomId: Number(backendMessage.roomId),           
      senderId: Number(backendMessage.senderId),        
      message: backendMessage.message || backendMessage.text, // Handle both 'message' and 'text' fields
      messageType: backendMessage.messageType || 'text',
      userName: backendMessage.userName || backendMessage.senderName,
      avatar: backendMessage.avatar,
      avatarColor: backendMessage.avatarColor,
      createdAt: backendMessage.createdAt || backendMessage.timeStamp, // Handle both 'createdAt' and 'timeStamp' fields
    };
    
    console.log('✅ Transformed message:', transformed); // Debug log
    return transformed;
  };

  // Initialize chat
  useEffect(() => {
    // Only initialize if we should and have a valid token
    if (!shouldInitialize || !token) {
      console.log('🚫 Skipping chat initialization:', { shouldInitialize, hasToken: !!token });
      return;
    }

    const initializeChat = async () => {
      console.log('🚀 Initializing chat with token...');
      setIsLoading(true);
      try {
        // Load initial messages
        const response = await getChatMessages(chatId, 1, 30, token);
        console.log('Raw API response:', response);
        console.log('Response type:', typeof response);
        
        // Handle different response structures
        let messages: ChatMessage[] = [];
        let hasMore = false;

        if (response && response.success && response.data && response.data.message && Array.isArray(response.data.message)) {
          
          messages = response.data.message.map(transformMessage);
          hasMore = response.data.pagination?.hasMore || false;
          console.log('✅ Successfully processed', messages.length, 'messages');
          
          // Track loaded message IDs to prevent duplicates from WebSocket
          loadedMessageIds.current.clear();
          messages.forEach(msg => loadedMessageIds.current.add(Number(msg.id)));
          console.log('📝 Tracked message IDs:', Array.from(loadedMessageIds.current));
        } else {
          console.warn('❌ Unexpected response structure:', response);
          messages = [];
          hasMore = false;
        }

        console.log('Processed messages:', {
          count: messages.length,
          hasMore,
          firstMessage: messages[0],
          lastMessage: messages[messages.length - 1],
          messageOrder: messages.map(m => ({ id: m.id, senderId: m.senderId, createdAt: m.createdAt }))
        });

        if (messages.length === 0) {
          console.warn('No messages found for chat:', chatId);
        }

        // Don't reverse messages - they should be displayed in the order received (ascending by time)
        setMessages(messages);
        setHasMoreMessages(hasMore);

        if (!token) {
          console.warn('No token provided, WebSocket connection may not be authenticated.');
        } else {
          console.log('WebSocket token:', token);
        }
        
        // Connect to WebSocket
        chatWebSocketService.connect(chatId, currentUserId, token);
      } catch (error) {
        console.log('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // WebSocket event listeners
    const unsubscribeMessage = chatWebSocketService.onMessage((message) => {
      setMessages(prev => {
        const messageId = Number(message.id);
        const transformed = transformMessage(message);
        
        console.log('🔍 WebSocket received message:', {
          id: messageId,
          senderId: transformed.senderId,
          currentUserId: currentUserId,
          isFromCurrentUser: transformed.senderId === currentUserId,
          message: transformed.message,
          alreadyTracked: loadedMessageIds.current.has(messageId)
        });
        
        // Skip messages from current user (they're handled by HTTP response)
        if (transformed.senderId === currentUserId) {
          console.log('⏭️ Skipping WebSocket message from current user (handled by HTTP):', messageId);
          return prev;
        }
        
        // Check if this message was already processed
        if (loadedMessageIds.current.has(messageId)) {
          console.log('⏭️ WebSocket message already processed, skipping:', messageId);
          return prev;
        }
        
        // Check for existing message by ID in current state
        const messageExists = prev.some(msg => Number(msg.id) === messageId);
        if (messageExists) {
          console.log('⏭️ WebSocket message already exists in state, skipping:', messageId);
          return prev;
        }
        
        // Add new message from other users
        loadedMessageIds.current.add(messageId);
        console.log('📨 Adding new WebSocket message from other user:', messageId);
        return [...prev, transformed];
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
  }, [chatId, currentUserId, token, shouldInitialize]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    // Validate prerequisites
    if (!hasMoreMessages || isLoadingMore || messages.length === 0) {
      console.log('🚫 Skip loading older messages:', { hasMoreMessages, isLoadingMore, messageCount: messages.length });
      return;
    }

    // Validate authentication
    if (!shouldInitialize || !token) {
      console.log('🚫 Cannot load older messages: authentication required', { shouldInitialize, hasToken: !!token });
      return;
    }

    setIsLoadingMore(true);
    try {
      const oldestMessageId = messages[0]?.id;
      console.log('📜 Loading older messages before:', oldestMessageId);
      
      const response = await getOlderMessages(chatId, oldestMessageId, 50, token);
      
      // Add older messages to the beginning of the array
      // Assuming older messages API returns them in ascending order (oldest first)
      setMessages(prev => [
        ...response.data.map(transformMessage),
        ...prev
      ]);
      setHasMoreMessages(response.pagination?.hasMore || false);
      
      console.log('✅ Loaded', response.data.length, 'older messages');
    } catch (error) {
      console.log('Error loading older messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, hasMoreMessages, isLoadingMore, messages, shouldInitialize, token]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return; // Don't send empty messages or while sending
    
    // Validate authentication
    if (!shouldInitialize || !token) {
      console.log('🚫 Cannot send message: authentication required', { shouldInitialize, hasToken: !!token });
      return;
    }
    
    setIsSending(true);
    
    // Create temporary message ID for optimistic update (use negative ID to distinguish from server IDs)
    const tempId = -(Date.now());
    
    // Create optimistic message to show immediately (user's text input)
    const optimisticMessage: ChatMessage = {
      id: tempId,
      roomId: chatId,
      senderId: currentUserId,
      message: text.trim(),
      messageType: 'text',
      userName: currentUserName,
      createdAt: new Date().toISOString(),
      avatar: undefined,
      avatarColor: undefined
    };
    
    // Add optimistic message immediately to UI
    setMessages(prev => [...prev, optimisticMessage]);
    console.log('📤 Added optimistic message:', tempId);
    
    try {
      // Send via HTTP request
      const response = await sendChatMessage({
        userId: currentUserId.toString(),
        roomId: chatId.toString(),
        message: text.trim(),
        messageType: 'text'
      }, token);
      
      console.log('✅ Message sent successfully via HTTP');
      
      // When server responds, remove optimistic message and add server message
      if (response && response.success && response.data) {
        const serverMessage = transformMessage(response.data);
        const messageId = Number(serverMessage.id);
        
        setMessages(prev => {
          // Remove optimistic message and add server message
          const filtered = prev.filter(msg => msg.id !== tempId);
          const updated = [...filtered, serverMessage];
          
          // Track server message ID to prevent WebSocket duplicates
          loadedMessageIds.current.add(messageId);
          console.log('🔄 Replaced optimistic message with server response:', {
            removedOptimistic: tempId,
            addedServer: messageId
          });
          
          return updated;
        });
      } else {
        // If no server response, remove optimistic message
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        console.log('❌ No server response, removed optimistic message:', tempId);
      }
      
      // Also send via WebSocket for real-time updates to other users
      const wsMessage = {
        message: text.trim(),
        senderId: currentUserId,
        userName: currentUserName,
        roomId: chatId,
      };
      chatWebSocketService.sendMessage(wsMessage);
      
    } catch (error) {
      console.log('❌ Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Optionally show error message
      // You can add error state and show a toast/alert here
      throw error;
    } finally {
      setIsSending(false);
    }
    
    // Stop typing when message is sent
    chatWebSocketService.sendTypingStatus(false, chatId, currentUserId, currentUserName);
  }, [chatId, currentUserId, currentUserName, token, isSending, shouldInitialize]);

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
    isSending,
    sendMessage,
    loadOlderMessages,
    startTyping,
    reconnect,
    stopTyping
  };
};
