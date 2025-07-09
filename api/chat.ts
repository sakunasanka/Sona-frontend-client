import { apiRequest } from "./api";

interface ChatMessage {
  id: string;
  text: string;
  userId: number;
  userName?: string;
  avatar?: string;
  avatarColor?: string;
  timestamp: string;
  chatId: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Get initial messages (latest)
export const getChatMessages = async (
  chatId: number, 
  page: number = 1, 
  limit: number = 50,
  token?: string
): Promise<PaginatedResponse<ChatMessage>> => {
  try {
    console.log('Fetch chat messages:', { chatId, page, limit, token });
    const response = await apiRequest({
      method: 'get',
      path: `chat/rooms/${chatId}/messages`,
      data: { page, limit},
      token
    });
    return response;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

// Get older messages for pagination
export const getOlderMessages = async (
  chatId: number, 
  beforeMessageId: string, 
  limit: number = 50
): Promise<PaginatedResponse<ChatMessage>> => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: `/chat/${chatId}/messages?before=${beforeMessageId}&limit=${limit}`
    });
    return response;
  } catch (error) {
    console.error('Error fetching older messages:', error);
    throw error;
  }
};

// Send message via REST (fallback)
export const sendMessage = async (
  chatId: number, 
  message: Omit<ChatMessage, 'id' | 'timestamp' | 'chatId'>
): Promise<ChatMessage> => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: `/chat/${chatId}/messages`,
      data: message
    });
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};