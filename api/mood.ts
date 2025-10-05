// api/mood.ts
import { API_URL, PORT } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getProfile } from './auth';

// Always use configured host; avoid localhost fallbacks that break on web/device
const API_BASE_URL = `${API_URL}:${PORT}/api`;

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

// Try to get current user id (cache in AsyncStorage to avoid extra calls)
const getCurrentUserId = async (): Promise<number> => {
  try {
    const cached = await AsyncStorage.getItem('userId');
    if (cached) return Number(cached);

    const profile = await getProfile();
    if (profile?.id != null) {
      await AsyncStorage.setItem('userId', String(profile.id));
      return profile.id;
    }
  } catch (e) {
    console.warn('Unable to resolve current user id:', e);
  }
  throw new Error('User ID not available. Ensure the user is authenticated.');
};

export const saveDailyMood = async (moodData: {
  mood: string;
  valence: number;
  arousal: number;
  intensity: number;
}): Promise<DailyMood> => {
  try {
    const userId = await getCurrentUserId();
    const payload = {
      local_date: new Date().toISOString().split('T')[0],
      mood: moodData.mood,
      valence: moodData.valence,
      arousal: moodData.arousal,
      intensity: moodData.intensity,
    };

    // Attempt user-scoped endpoint first
    let response = await axios.post(
      `${API_BASE_URL}/users/${userId}/moods`,
      payload,
      { headers: await authHeaders(), validateStatus: () => true }
    );

    if (response.status === 404) {
      // Fallback: try unscoped users/moods (legacy)
      response = await axios.post(
        `${API_BASE_URL}/users/moods`,
        payload,
        { headers: await authHeaders(), validateStatus: () => true }
      );
    }

    if (response.status === 404) {
      // Fallback: try /moods root (older backend)
      response = await axios.post(
        `${API_BASE_URL}/moods`,
        payload,
        { headers: await authHeaders(), validateStatus: () => true }
      );
    }

    // If already submitted today, treat as success and return today's mood
    if (response.status === 409) {
      // Fetch today's mood and return
      const today = await getTodaysMood();
      if (today) return today;
      // If fetch failed, still return a reasonable object
      throw new Error('Mood already submitted today');
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to save mood. Status ${response.status}`);
    }

    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error saving mood:', error);
    throw error;
  }
};

export const hasSubmittedTodaysMood = async (): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get all moods for the user
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/moods`,
      { headers: await authHeaders(), validateStatus: () => true }
    );

    if (response.status === 200) {
      const moods = response.data?.data || response.data || [];
      // Check if any mood exists for today
      const todaysMood = moods.find((mood: any) =>
        mood.local_date === today || mood.date === today
      );
      return !!todaysMood;
    }

    if (response.status === 404) return false;
    // For other statuses, be conservative and assume not submitted
    console.warn('Unexpected status checking user moods:', response.status);
    return false;
  } catch (error: any) {
    console.error('Error checking today\'s mood:', error);
    // On errors, assume not submitted so popup can prompt user
    return false;
  }
};

export const getTodaysMood = async (): Promise<DailyMood | null> => {
  try {
    const userId = await getCurrentUserId();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get all moods for the user and find today's
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/moods`,
      { headers: await authHeaders(), validateStatus: () => true }
    );

    if (response.status === 200) {
      const moods = response.data?.data || response.data || [];
      // Find today's mood
      const todaysMood = moods.find((mood: any) =>
        mood.local_date === today || mood.date === today
      );
      return todaysMood || null;
    }

    return null;
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