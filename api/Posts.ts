// api/Posts.ts
import axios from 'axios';
import { Platform } from 'react-native';

let API_BASE_URL = '';
let PORT = process.env.PORT || 5001;
if (Platform.OS === 'android') {
  API_BASE_URL = 'http://' + process.env.LOCAL_IP + ':' + PORT + '/api';
} else if (Platform.OS === 'ios') {
  API_BASE_URL = 'http://localhost:' + PORT + '/api';
} else {
  API_BASE_URL = 'http://localhost:' + PORT + '/api';
}

interface Author {
  name: string;
  avatar: string;
  role: 'Client' | 'Counsellor' | 'Psychiatrist' | 'Admin';
}

export interface Post {
  id: string;
  author: Author;
  timeAgo: string;
  content: string;
  hashtags: string[];
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  backgroundColor: string;
  liked: boolean;
  image?: string; // Added for image support
}

export interface CreatePostData {
  content: string;
  image?: string | null;
  location?: string;
  tags?: string[];
  backgroundColor?: string;
}

export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/posts`);
    return response.data.data.posts.map((post: any) => ({
      id: post.id || post._id || Math.random().toString(36).substr(2, 9),
      author: {
        name: post.author?.name || 'Anonymous',
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
      backgroundColor: post.backgroundColor || '#FFFFFF',
      liked: post.liked || false,
      image: post.image || undefined
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return []; // Return empty array on error
  }
};

export const likePost = async (postId: string): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/posts/${postId}/like`);
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const createPost = async (postData: CreatePostData): Promise<Post> => {
  try {
    // Create the payload for the API
    const payload = {
      content: postData.content,
      hashtags: postData.tags || [],
      backgroundColor: postData.backgroundColor || '#FFFFFF',
      image: postData.image || undefined,
      location: postData.location || undefined
    };

    // Make the actual API call
    const response = await axios.post(`${API_BASE_URL}/posts`, payload);
    
    // Transform the response to match our Post interface
    const createdPost = response.data.data.post;
    
    return {
      id: createdPost.id || createdPost._id || Date.now().toString(),
      author: {
        name: createdPost.author?.name || 'Anonymous',
        avatar: createdPost.author?.avatar || 'https://i.imgur.com/5fhM5oV.png',
        role: createdPost.author?.role || 'Client',
      },
      timeAgo: createdPost.timeAgo || 'Just now',
      content: createdPost.content || '',
      hashtags: createdPost.hashtags || [],
      stats: {
        views: createdPost.stats?.views || 0,
        likes: createdPost.stats?.likes || 0,
        comments: createdPost.stats?.comments || 0
      },
      backgroundColor: createdPost.backgroundColor || '#FFFFFF',
      liked: createdPost.liked || false,
      image: createdPost.image || undefined
    };
  } catch (error) {
    console.error('Error creating post:', error);
    
    // Fallback: create a mock post if API fails
    const mockPost: Post = {
      id: Date.now().toString(),
      author: {
        name: 'John Doe', // This would come from user context
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        role: 'Client'
      },
      timeAgo: 'Just now',
      content: postData.content,
      hashtags: postData.tags || [],
      stats: {
        views: 0,
        likes: 0,
        comments: 0
      },
      backgroundColor: postData.backgroundColor || '#FFFFFF',
      liked: false,
      image: postData.image || undefined
    };
    
    return mockPost;
  }
};

export const deletePost = async (postId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/posts/${postId}`);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const updatePost = async (postId: string, updates: Partial<CreatePostData>): Promise<Post> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/posts/${postId}`, updates);
    const updatedPost = response.data.data.post;
    
    return {
      id: updatedPost.id || updatedPost._id,
      author: {
        name: updatedPost.author?.name || 'Anonymous',
        avatar: updatedPost.author?.avatar || 'https://i.imgur.com/5fhM5oV.png',
        role: updatedPost.author?.role || 'Client',
      },
      timeAgo: updatedPost.timeAgo || 'Just now',
      content: updatedPost.content || '',
      hashtags: updatedPost.hashtags || [],
      stats: {
        views: updatedPost.stats?.views || 0,
        likes: updatedPost.stats?.likes || 0,
        comments: updatedPost.stats?.comments || 0
      },
      backgroundColor: updatedPost.backgroundColor || '#FFFFFF',
      liked: updatedPost.liked || false,
      image: updatedPost.image || undefined
    };
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};