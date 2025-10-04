// api/Posts.ts
import { API_URL, PORT } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

let API_BASE_URL = '';
if (Platform.OS === 'android') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else if (Platform.OS === 'ios') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else {
  API_BASE_URL = 'http://localhost:' + PORT + '/api';
}

interface User {
  id: number;
  firebaseId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'Client' | 'Counselor' | 'Admin' | 'Psychiatrist' | 'MT-Team';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Post {
  id: string;
  author: User;
  timeAgo: string;
  content: string;
  hashtags: string[];
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  liked: boolean;
  image?: string; // Added for image support
  status?: 'pending' | 'approved' | 'rejected';
}

export interface CreatePostData {
  content: string;
  image?: string | null;
  location?: string;
  tags?: string[];
  backgroundColor?: string;
  hashtags?: string[]; // alias for tags
}

const authHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {} as Record<string, string>;
};

export const fetchPosts = async (): Promise<Post[]> => {
  try {
  const response = await axios.get(`${API_BASE_URL}/posts`, { headers: await authHeaders() });
    return response.data.data.posts.map((post: any) => ({
      id: post.id || post._id || Math.random().toString(36).substr(2, 9),
      author: {
        id: post.author?.id || 0,
        firebaseId: post.author?.firebaseId || '',
        name: post.author?.name || 'Anonymous',
        email: post.author?.email || 'user@example.com',
        avatar: post.author?.avatar || 'https://i.imgur.com/5fhM5oV.png',
        role: post.author?.role || 'Client'
      },
      timeAgo: post.timeAgo || 'Just now',
      content: post.content || '',
      hashtags: post.hashtags || [],
      stats: {
        views: post.stats?.views || 0,
        likes: post.stats?.likes || 0,
        comments: post.stats?.comments || 0
      },
      liked: post.liked || false,
      image: post.image || undefined,
      status: post.status || undefined
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return []; // Return empty array on error
  }
};

export const likePost = async (postId: string): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/posts/${postId}/like`, {}, { headers: await authHeaders() });
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const unlikePost = async (postId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/posts/${postId}/like`, { headers: await authHeaders() });
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

export const getPostLikeStatus = async (
  postId: string
): Promise<{ liked: boolean; likes: number; views: number }> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/posts/${postId}/like/status`, {
      headers: await authHeaders(),
    });
    const data = res.data?.data || {};
    return { liked: !!data.liked, likes: Number(data.likes ?? 0), views: Number(data.views ?? 0) };
  } catch (error) {
    console.error('Error fetching like status:', error);
    throw error;
  }
};

export const toggleLikePost = async (
  postId: string
): Promise<{ liked: boolean; likes: number; views?: number }> => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/posts/${postId}/like/toggle`,
      {},
      { headers: await authHeaders() }
    );
    const data = res.data?.data || {};
    if (typeof data.liked === 'boolean' && typeof data.likes !== 'undefined') {
      const result = { liked: !!data.liked, likes: Number(data.likes) } as { liked: boolean; likes: number; views?: number };
      if (typeof data.views !== 'undefined') {
        result.views = Number(data.views);
      }
      return result;
    }
    // Fallback: re-fetch status if response doesn’t include fields
    const status = await getPostLikeStatus(postId);
    return { liked: status.liked, likes: status.likes, views: status.views };
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

export const createPost = async (postData: CreatePostData): Promise<Post> => {
  try {
    // Create the payload for the API
    const normalizedHashtags = (postData.hashtags || postData.tags || []).map((t) =>
      typeof t === 'string' && t.startsWith('#') ? t.slice(1) : String(t)
    );
    const imageToSend = postData.image && /^https?:\/\//.test(postData.image) ? postData.image : undefined;
    const payload = {
      content: postData.content,
      hashtags: normalizedHashtags,
      backgroundColor: postData.backgroundColor ?? '#FFFFFF',
      image: imageToSend,
      location: postData.location || undefined
    };

    // Make the actual API call
    const response = await axios.post(`${API_BASE_URL}/posts`, payload, { headers: await authHeaders() });
    
    // Transform the response to match our Post interface
    const createdPost = response.data?.data?.post ?? response.data?.post ?? response.data;
    
    return {
      id: createdPost?.id || createdPost?._id || Date.now().toString(),
      author: {
        id: createdPost?.author?.id || 0,
        firebaseId: createdPost?.author?.firebaseId || '',
        name: createdPost?.author?.name || 'Anonymous',
        email: createdPost?.author?.email || 'user@example.com',
        avatar: createdPost?.author?.avatar || 'https://i.imgur.com/5fhM5oV.png',
        role: createdPost?.author?.role || 'Client',
      },
      timeAgo: createdPost?.timeAgo || 'Just now',
      content: createdPost?.content || '',
      hashtags: createdPost?.hashtags || [],
      stats: {
        views: createdPost?.stats?.views || 0,
        likes: createdPost?.stats?.likes || 0,
        comments: createdPost?.stats?.comments || 0
      },
      liked: createdPost?.liked || false,
      image: createdPost?.image || undefined
    };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const deletePost = async (postId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/posts/${postId}`, { headers: await authHeaders() });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const updatePost = async (postId: string, updates: Partial<CreatePostData>): Promise<Post> => {
  try {
    const payload = {
      content: updates.content,
      hashtags: updates.hashtags || updates.tags,
      backgroundColor: updates.backgroundColor,
      image: updates.image,
      location: updates.location
    };
    const response = await axios.put(`${API_BASE_URL}/posts/${postId}`, payload, { headers: await authHeaders() });
    const updatedPost = response.data?.data?.post ?? response.data?.post ?? response.data;
    
    return {
      id: updatedPost?.id || updatedPost?._id || String(postId),
      author: {
        id: updatedPost?.author?.id || 0,
        firebaseId: updatedPost?.author?.firebaseId || '',
        name: updatedPost?.author?.name || 'Anonymous',
        email: updatedPost?.author?.email || 'user@example.com',
        avatar: updatedPost?.author?.avatar || 'https://i.imgur.com/5fhM5oV.png',
        role: updatedPost?.author?.role || 'Client'
      },
      timeAgo: updatedPost?.timeAgo || 'Just now',
      content: updatedPost?.content || '',
      hashtags: updatedPost?.hashtags || [],
      stats: {
        views: updatedPost?.stats?.views || 0,
        likes: updatedPost?.stats?.likes || 0,
        comments: updatedPost?.stats?.comments || 0
      },
      liked: updatedPost?.liked || false,
      image: updatedPost?.image || undefined
    };
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const incrementPostView = async (
  postId: string
): Promise<number | undefined> => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/posts/${postId}/view`,
      {},
      { headers: await authHeaders() }
    );
    const data = res.data?.data || {};
    return typeof data.views !== 'undefined' ? Number(data.views) : undefined;
  } catch (error) {
    console.error('Error incrementing post view:', error);
    // Swallow error to avoid disrupting feed scrolling; caller can ignore
    return undefined;
  }
};