import axios from 'axios';
import { Platform } from 'react-native';

let API_BASE_URL = '';

if (Platform.OS === 'android') {
  API_BASE_URL = 'http://'+process.env.LOCAL_IP+':'+process.env.PORT+'/api';
} else if (Platform.OS === 'ios') {
  API_BASE_URL = 'http://localhost:'+process.env.PORT+'/api';
} else {
  API_BASE_URL = 'http://localhost:'+process.env.PORT+'/api';
}

interface Author {
  name: string;
  avatar: string;
  badge: 'User' | 'Premium';
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
}

export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/posts`);
    
    return response.data.data.posts.map((post: any) => ({
      id: post.id || post._id || Math.random().toString(36).substr(2, 9),
      author: {
        name: post.author?.name || 'Anonymous',
        avatar: post.author?.avatar || 'https://i.imgur.com/5fhM5oV.png',
        badge: post.author?.badge === 'Premium' ? 'Premium' : 'User'
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
      liked: post.liked || false
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