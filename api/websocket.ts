import { API_URL, host, PORT, server_URL } from '@/config/env';
import { AppState } from 'react-native';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: number;
  message: string; // Change from 'text' to 'message' to match backend
  senderId: number; // Change from 'userId' to 'senderId' to match backend
  userName?: string;
  avatar?: string;
  avatarColor?: string;
  createdAt: string; // Change from 'timeStamp' to 'createdAt' to match backend
  roomId: number; // Change from 'chatId' to 'roomId' to match backend
}

interface TypingStatus {
  userId: number;
  userName: string;
  isTyping: boolean;
  roomId: number; // Change from 'chatId' to 'roomId' to match backend
}

class ChatWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageListeners: ((message: ChatMessage) => void)[] = [];
  private typingListeners: ((typing: TypingStatus) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private currentChatId: number | null = null;
  private currentUserId: number | null = null;

  constructor(private baseUrl: string) {
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && this.socket?.disconnected) {
        console.log('App became active, reconnecting...');
        this.reconnect();
      }
    });
  }

  connect(chatId: number, userId: number, token?: string) {
    console.log('🔄 Connecting to new room, disconnecting existing connection...');
    
    // Always disconnect existing connection when explicitly connecting
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentChatId = chatId;
    this.currentUserId = userId;

    try {
      // Determine WebSocket URL based on host configuration
      let socketUrl: string;
      
      if (host && server_URL) {
        // Use server_URL when host is configured
        socketUrl = server_URL;
        console.log('🌐 Using configured server URL:', socketUrl);
      } else {
        // Use default format: socketUrl:port
        const port = PORT ? PORT : '5001';
        socketUrl = `${API_URL}:${port}`;
        console.log('🏠 Using default socket URL format:', socketUrl);
      }

      console.log('🔗 Creating new Socket.IO connection:', {
        url: socketUrl,
        chatId,
        userId,
        hasToken: !!token,
        usingHostConfig: !!(host && server_URL)
      });

      this.socket = io(socketUrl, {
        auth: {
          token: token  
        },
        query: {
          token: token 
        },
        transports: ['polling'], 
        timeout: 10000,  
        forceNew: true, 
        upgrade: false,  
        rememberUpgrade: false
      });

      this.setupEventListeners();
    } catch (error) {
      // console.error('Error connecting to Socket.IO:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
    console.log('✅ Socket.IO connected successfully!');
    console.log('📊 Connection details:', {
      socketId: this.socket?.id,
      url: this.baseUrl,
      transport: this.socket?.io?.engine?.transport?.name,
      connected: this.socket?.connected,
      chatId: this.currentChatId,
      userId: this.currentUserId
    });
    this.reconnectAttempts = 0;
    this.notifyConnectionListeners(true);
    
    // Join the chat room after connecting
    if (this.currentChatId) {
      this.joinRoom(this.currentChatId);
    }
  });

    this.socket.on('disconnect', (reason, details) => {
    console.log('🔌 Socket.IO disconnected:');
    console.log('Reason:', reason);
    console.log('Details:', details);
    console.log('Socket state:', {
      connected: this.socket?.connected,
      disconnected: this.socket?.disconnected,
      id: this.socket?.id
    });
    this.notifyConnectionListeners(false);
  });

  // ✅ Enhanced error event logging
  this.socket.on('error', (error) => {
    // console.error('❌ SOCKET ERROR EVENT:');
    // console.error('Error:', error);
    // console.error('Error type:', typeof error);
    // console.error('Error constructor:', error?.constructor?.name);
    
    if (error instanceof Error) {
      // console.error('Error name:', error.name);
      // console.error('Error message:', error.message);
      // console.error('Error stack:', error.stack);
    }
    
    // console.error('Full error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  });

  // ✅ Add engine error listeners
  this.socket.on('connect_timeout', () => {
    // console.error('❌ Connection timeout after', this.socket?.io?.opts?.timeout, 'ms');
  });

  this.socket.on('reconnect_error', (error) => {
    // console.error('❌ Reconnection error:', error);
  });

  this.socket.on('reconnect_failed', () => {
    // console.error('❌ Reconnection failed after maximum attempts');
  });

  // ✅ Transport-level error logging
  if (this.socket.io?.engine) {
    this.socket.io.engine.on('error', (error) => {
      // console.error('❌ ENGINE ERROR:');
      // console.error('Engine error:', error);
      // console.error('Transport name:', this.socket?.io?.engine?.transport?.name);
    });

    this.socket.io.engine.on('close', (reason, description) => {
      // console.log('🔌 Engine closed:', { reason, description });
    });
  }

    // Message events (matching your backend)
    this.socket.on('new_message', (data) => {
      console.log('💬 New message received:', data);
      if (data.message) {
        const messageRoomId = data.message.roomId || this.currentChatId || 0;
        
        // Convert backend format to frontend format
        const message: ChatMessage = {
          id: data.message.id,
          message: data.message.message, // Backend uses 'message', keep as 'message'
          senderId: data.message.senderId,
          userName: data.message.senderName,
          createdAt: data.message.createdAt,
          roomId: messageRoomId,
          avatar: data.message.avatar,
          avatarColor: data.message.avatarColor
        };
        
        // Notify all listeners - let them filter by room if needed
        this.notifyMessageListeners(message);
      }
    });

    // Typing events (matching your backend)
    this.socket.on('user_typing', (data) => {
      console.log('✏️ User typing:', data);
      const typingRoomId = data.roomId || this.currentChatId || 0;
      
      this.notifyTypingListeners({
        userId: data.userId,
        userName: data.userName,
        isTyping: true,
        roomId: typingRoomId
      });
    });

    this.socket.on('user_stopped_typing', (data) => {
      console.log('✋ User stopped typing:', data);
      const typingRoomId = data.roomId || this.currentChatId || 0;
      
      this.notifyTypingListeners({
        userId: data.userId,
        userName: data.userName,
        isTyping: false,
        roomId: typingRoomId
      });
    });

    // Room events
    this.socket.on('joined_room', (data) => {
      console.log('🏠 Joined room:', data);
    });

    this.socket.on('user_joined_room', (data) => {
      console.log('👥 User joined room:', data);
    });

    this.socket.on('user_left_room', (data) => {
      console.log('👋 User left room:', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      // console.error('❌ Socket.IO error:', error);
    });

    // Test events
    this.socket.on('test_message', (data) => {
      console.log('🧪 Test broadcast:', data);
    });
  }

  // Join room (if your backend supports room-based chat)
  private joinRoom(chatId: number) {
    if (this.socket?.connected) {
      console.log('🏠 Joining chat room:', chatId);
      this.socket.emit('join_room', { roomId: chatId });
    }
  }

  sendMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>) {
    if (this.socket?.connected) {
      // Convert frontend format to backend format
      this.socket.emit('send_message', {
        roomId: message.roomId,
        content: message.message,
        type: 'text'
      });
    } else {
      // console.warn('Socket.IO not connected, cannot send message');
    }
  }

  sendTypingStatus(isTyping: boolean, chatId: number, userId: number, userName: string) {
    if (this.socket?.connected) {
      if (isTyping) {
        this.socket.emit('typing_start', { roomId: chatId });
      } else {
        this.socket.emit('typing_stop', { roomId: chatId });
      }
    }
  }

  private reconnect() {
    if (this.currentChatId && this.currentUserId) {
      this.connect(this.currentChatId, this.currentUserId);
    }
  }

  // Event listeners (same as before)
  onMessage(listener: (message: ChatMessage) => void) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  onTyping(listener: (typing: TypingStatus) => void) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter(l => l !== listener);
    };
  }

  onConnectionChange(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  private notifyMessageListeners(message: ChatMessage) {
    this.messageListeners.forEach(listener => listener(message));
  }

  private notifyTypingListeners(typing: TypingStatus) {
    this.typingListeners.forEach(listener => listener(typing));
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Initialize service
export const chatWebSocketService = new ChatWebSocketService('http://localhost:5001');