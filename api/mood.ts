// api/mood.ts
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

export interface DailyMood {
  id?: string;
  userId?: string;
  date: string;
  mood: string;
  valence: number; // -1 to 1 (unpleasant to pleasant)
  arousal: number; // -1 to 1 (low energy to high energy)
  intensity: number; // 0 to 1 (strength of the emotion)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MoodStats {
  averageValence: number;
  averageArousal: number;
  commonMoods: { mood: string; count: number }[];
  weeklyTrend: { date: string; valence: number; arousal: number }[];
}

const authHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {} as Record<string, string>;
};

export const saveDailyMood = async (moodData: {
  mood: string;
  valence: number;
  arousal: number;
  intensity: number;
}): Promise<DailyMood> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const payload = {
      date: today,
      mood: moodData.mood,
      valence: moodData.valence,
      arousal: moodData.arousal,
      intensity: moodData.intensity,
    };

    const response = await axios.post(
      `${API_BASE_URL}/moods`,
      payload,
      { headers: await authHeaders() }
    );
    
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error saving mood:', error);
    throw error;
  }
};

export const getTodaysMood = async (): Promise<DailyMood | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(
      `${API_BASE_URL}/moods/today`,
      { headers: await authHeaders() }
    );
    
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching today\'s mood:', error);
    return null;
  }
};

export const getMoodHistory = async (days: number = 30): Promise<DailyMood[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/moods/history?days=${days}`,
      { headers: await authHeaders() }
    );
    
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching mood history:', error);
    return [];
  }
};

export const getMoodStats = async (): Promise<MoodStats> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/moods/stats`,
      { headers: await authHeaders() }
    );
    
    return response.data?.data || {
      averageValence: 0,
      averageArousal: 0,
      commonMoods: [],
      weeklyTrend: [],
    };
  } catch (error) {
    console.error('Error fetching mood stats:', error);
    return {
      averageValence: 0,
      averageArousal: 0,
      commonMoods: [],
      weeklyTrend: [],
    };
  }
};