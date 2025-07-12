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
}

export const apiRequest = async ({ method, path, data }: ApiRequest) => {
  try {
    const response = await api.request({
      url: path,
      method,
      ...(method === 'get' ? { params: data } : { data }),
    });

    return response.data;
  } catch (error: any) {
    console.error('API error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

