// api/auth.ts
import { API_URL, PORT, host, server_URL } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

let API_BASE_URL = '';

if(host && server_URL){
  API_BASE_URL = server_URL + '/api';
  console.log("Using server_URL from config/env.ts as API_BASE_URL:", API_BASE_URL);
}else {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
}

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  nickName: string;
  isStudent: boolean;
}

export interface UpdateProfileData {
  name?: string;
  nickName?: string;
  avatar?: string;
}

export interface LoginStatsData {
  totalLogins: number;
  currentStreak: number;
}

const authHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {} as Record<string, string>;
};

export const getProfile = async (): Promise<ProfileData> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: await authHeaders()
    });
    return response.data.data;
  } catch (error) {
    console.log('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (profileData: UpdateProfileData): Promise<ProfileData> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/auth/profile`, profileData, {
      headers: await authHeaders()
    });
    return response.data.data;
  } catch (error) {
    console.log('Error updating profile:', error);
    throw error;
  }
};

export const getLoginStats = async (): Promise<LoginStatsData> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/login-stats`, {
      headers: await authHeaders()
    });
    return response.data.data;
  } catch (error) {
    console.log('Error fetching login stats:', error);
    throw error;
  }
};