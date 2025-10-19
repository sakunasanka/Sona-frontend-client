// api/mood.ts
import { API_URL, PORT, host, server_URL } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getProfile } from './auth';

// Helper function to get current date in Asia/Colombo timezone (YYYY-MM-DD format)
const getCurrentLocalDate = (): string => {
  // Asia/Colombo is UTC+5:30
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const colomboTime = new Date(utc + (5.5 * 3600000)); // Add 5.5 hours for Asia/Colombo

  const year = colomboTime.getFullYear();
  const month = String(colomboTime.getMonth() + 1).padStart(2, '0');
  const day = String(colomboTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Always use configured host; avoid localhost fallbacks that break on web/device
let API_BASE_URL = '';

if(host && server_URL){
  API_BASE_URL = server_URL + '/api';
  console.log("Using server_URL from config/env.ts as API_BASE_URL:", API_BASE_URL);
}else {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
}

export interface DailyMood {
  id?: string;
  userId?: string;
  user_id?: string;
  date?: string;
  local_date?: string;
  mood: string;
  valence: number; // -1 to 1 (unpleasant to pleasant)
  arousal: number; // -1 to 1 (low energy to high energy)
  intensity: number; // 0 to 1 (strength of the emotion)
  createdAt?: Date;
  created_at?: string;
  updatedAt?: Date;
  updated_at?: string;
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
      local_date: getCurrentLocalDate(), // Use Asia/Colombo timezone date
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
    const today = getCurrentLocalDate(); // Use Asia/Colombo timezone date

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
    const today = getCurrentLocalDate(); // Use Asia/Colombo timezone date

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

export interface MoodAnalysisResponse {
  totalEntries: number;
  moodDistribution: Record<string, number>;
  recentMoods: DailyMood[];
  moodTrends: DailyMood[];
  averageMoodScore: number;
  averageValence: number;
  averageArousal: number;
  averageIntensity: number;
  lastUpdated: string | null;
}

// Helper functions for mood analysis calculations
const calculateAverageMoodScore = (moods: DailyMood[]): number => {
  if (moods.length === 0) return 0;
  const total = moods.reduce((sum, mood) => sum + (mood.valence || 0), 0);
  return total / moods.length;
};

const calculateAverageValence = (moods: DailyMood[]): number => {
  if (moods.length === 0) return 0;
  const total = moods.reduce((sum, mood) => sum + (mood.valence || 0), 0);
  return total / moods.length;
};

const calculateAverageArousal = (moods: DailyMood[]): number => {
  if (moods.length === 0) return 0;
  const total = moods.reduce((sum, mood) => sum + (mood.arousal || 0), 0);
  return total / moods.length;
};

const calculateAverageIntensity = (moods: DailyMood[]): number => {
  if (moods.length === 0) return 0;
  const total = moods.reduce((sum, mood) => sum + (mood.intensity || 0), 0);
  return total / moods.length;
};

export const getMoodAnalytics = async (clientId: number, month?: number, year?: number): Promise<MoodAnalysisResponse> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${clientId}/moods`,
      { headers: await authHeaders() }
    );
    
    console.log('Get client mood analysis response:', response);
    console.log('Response data type:', typeof response.data);
    console.log('Response data structure:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data) {
      // Handle different response structures
      let moods: DailyMood[] = [];
      
      // The API might return data directly as an array or wrapped in an object
      if (Array.isArray(response.data)) {
        moods = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Check common response patterns
        if (Array.isArray(response.data.data)) {
          moods = response.data.data;
        } else if (Array.isArray(response.data.moods)) {
          moods = response.data.moods;
        } else if (Array.isArray(response.data.results)) {
          moods = response.data.results;
        } else {
          // Try to find any array in the response
          const keys = Object.keys(response.data);
          for (const key of keys) {
            if (Array.isArray(response.data[key])) {
              moods = response.data[key];
              break;
            }
          }
        }
      }
      
      console.log('Processed moods array:', moods);
      console.log('Moods array length:', moods ? moods.length : 0);
      console.log('Is array?', Array.isArray(moods));
      
      // If still no array found, create empty array to avoid errors
      if (!Array.isArray(moods)) {
        console.warn('Could not find mood array in response, using empty array');
        moods = [];
      }
      
      // Helper function to get date from mood entry
      const getMoodDate = (mood: DailyMood): string => {
        return mood.local_date || mood.date || '';
      };

      // Filter moods by month/year if specified
      let filteredMoods = moods;
      if (month !== undefined && year !== undefined) {
        filteredMoods = moods.filter(mood => {
          const dateStr = getMoodDate(mood);
          if (!dateStr) return false;
          
          const moodDate = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
          // Convert to Asia/Colombo timezone for comparison
          const colomboDate = new Date(moodDate.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
          return colomboDate.getMonth() === month && colomboDate.getFullYear() === year;
        });
      }
      
      // Process mood data for analysis
      const moodCounts = filteredMoods.length > 0 ? filteredMoods.reduce((acc, mood) => {
        const moodType = mood.mood || 'neutral';
        acc[moodType] = (acc[moodType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) : {};
      
      // Sort moods by date for trend analysis (only if we have moods)
      const sortedMoods = filteredMoods.length > 0 ? [...filteredMoods].sort((a, b) => {
        const dateA = getMoodDate(a);
        const dateB = getMoodDate(b);
        if (!dateA || !dateB) return 0;
        
        const timeA = new Date(dateA + (dateA.includes('T') ? '' : 'T00:00:00')).getTime();
        const timeB = new Date(dateB + (dateB.includes('T') ? '' : 'T00:00:00')).getTime();
        return timeA - timeB;
      }) : [];
      
      // Get recent mood trends (last 30 days or all entries for the selected month)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMoods = sortedMoods.filter(mood => {
        const dateStr = getMoodDate(mood);
        if (!dateStr) return false;
        
        const moodDate = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
        return moodDate >= thirtyDaysAgo;
      });
      
      return {
        totalEntries: filteredMoods.length,
        moodDistribution: moodCounts,
        recentMoods,
        moodTrends: sortedMoods,
        averageMoodScore: calculateAverageMoodScore(filteredMoods),
        averageValence: calculateAverageValence(filteredMoods),
        averageArousal: calculateAverageArousal(filteredMoods),
        averageIntensity: calculateAverageIntensity(filteredMoods),
        lastUpdated: sortedMoods.length > 0 ? getMoodDate(sortedMoods[sortedMoods.length - 1]) || null : null
      };
    }
    
    throw new Error('Failed to fetch mood analysis');
  } catch (error) {
    console.error('Error fetching mood analytics:', error);
    return {
      totalEntries: 0,
      moodDistribution: {},
      recentMoods: [],
      moodTrends: [],
      averageMoodScore: 0,
      averageValence: 0,
      averageArousal: 0,
      averageIntensity: 0,
      lastUpdated: null
    };
  }
}