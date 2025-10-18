import { API_URL } from '@/config/env';
import axios from 'axios';

const BASE_URL = API_URL

const api = axios.create({
  baseURL: BASE_URL + ':5001/api',
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
  },  
})

export interface ApiRequest {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  data?: any;
  token?: string;
}

export const apiRequest = async ({ method, path, data, token }: ApiRequest) => {
  try {
    const response = await api.request({
      url: path,
      method,
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : undefined,
      ...(method === 'get' ? { token, params: data } : { data }),
    });

    return response.data;
  } catch (error: any) {
    console.error('API error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const checkIsStudent = async (token: string): Promise<boolean> => {
  try {
    const response = await api.get('/users/client/is-student', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.data.isStudent || false;
  } catch (error: any) {
    console.error('Error checking student status:', error.response?.data || error.message);
    return false;
  }
};

export const applyStudentPackage = async (token: string, data: {
  fullName: string;
  university: string;
  studentIDCopy: string;
  uniEmail: string;
}) => {
  return apiRequest({
    method: 'post',
    path: '/students/apply',
    data,
    token,
  });
};

export const checkSessionFeedback = async (token: string, sessionId: string) => {
  return apiRequest({
    method: 'get',
    path: `/users/reviews/session/${sessionId}`,
    token,
  });
};

export const getMostRecentSessionNeedingFeedback = async (token: string) => {
  return apiRequest({
    method: 'get',
    path: '/users/reviews/session/most-recent',
    token,
  });
};

export const submitReview = async (token: string, reviewData: {
  session_id: number;
  rating: number;
  comment: string;
}) => {
  return apiRequest({
    method: 'post',
    path: 'users/reviews',
    data: reviewData,
    token,
  });
};

