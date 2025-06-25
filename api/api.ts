import axios from 'axios';

const BASE_URL = 'http://192.168.1.83:5001'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
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

