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
  token?: string
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const initializeChat = async () => {
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
          // ✅ Your actual structure: response.data.message contains the array
          messages = response.data.message.map(transformMessage);
          hasMore = response.data.pagination?.hasMore || false;
          console.log('✅ Successfully processed', messages.length, 'messages');
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
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // WebSocket event listeners
    const unsubscribeMessage = chatWebSocketService.onMessage((message) => {
      setMessages(prev => {
        const messageExists = prev.some(msg => Number(msg.id) === Number(message.id));
        if (messageExists) return prev;
        
        const transformed = transformMessage(message);
        
        // Check if this is a confirmation of an optimistic message
        // Look for optimistic messages with same content and sender
        const optimisticIndex = prev.findIndex(msg => 
          msg.senderId === transformed.senderId && 
          msg.message === transformed.message &&
          msg.id > Date.now() - 60000 // Temporary ID from last 60 seconds
        );
        
        if (optimisticIndex !== -1) {
          // Replace optimistic message with confirmed message
          const updated = [...prev];
          updated[optimisticIndex] = transformed;
          console.log('✅ Replaced optimistic message with confirmed message');
          return updated;
        }
        
        // Add new message if no optimistic match found
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
  }, [chatId, currentUserId, token]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestMessageId = messages[0]?.id;
      const response = await getOlderMessages(chatId, oldestMessageId);
      
      // Add older messages to the beginning of the array
      // Assuming older messages API returns them in ascending order (oldest first)
      setMessages(prev => [
        ...response.data.map(transformMessage),
        ...prev
      ]);
      setHasMoreMessages(response.pagination.hasMore);
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, hasMoreMessages, isLoadingMore, messages]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return; // Don't send empty messages or while sending
    
    setIsSending(true);
    
    // Create temporary message ID for optimistic update
    const tempId = Date.now();
    
    // Create optimistic message to show immediately
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
    
    // Add message immediately to UI (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      // Send via HTTP request
      const response = await sendChatMessage({
        userId: currentUserId.toString(),
        roomId: chatId.toString(),
        message: text.trim(),
        messageType: 'text'
      }, token);
      
      console.log('✅ Message sent successfully via HTTP');
      
      // If the HTTP response contains the message, replace the optimistic message
      if (response && response.success && response.data) {
        const confirmedMessage = transformMessage(response.data);
        setMessages(prev => {
          const optimisticIndex = prev.findIndex(msg => msg.id === tempId);
          if (optimisticIndex !== -1) {
            const updated = [...prev];
            updated[optimisticIndex] = confirmedMessage;
            console.log('✅ Replaced optimistic message with HTTP response');
            return updated;
          }
          return prev;
        });
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
      console.error('❌ Error sending message:', error);
      
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
  }, [chatId, currentUserId, currentUserName, token, isSending]);

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
