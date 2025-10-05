import { API_URL, PORT } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { apiRequest } from "./api";

let API_BASE_URL = '';
if (Platform.OS === 'android') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else if (Platform.OS === 'ios') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else {
  API_BASE_URL = 'http://localhost:' + PORT + '/api';
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

    // Import getProfile here to avoid circular dependency
    const { getProfile } = await import('./auth');
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

export interface PHQ9Response {
  questionIndex: number;
  answer: number; // 0-3
}

export interface PHQ9Submission {
  responses: PHQ9Response[];
  impact: string;
}

export interface PHQ9FullResponse {
  questionIndex: number;
  questionText: string;
  answer: number; // 0-3
  answerText: string;
}

export interface PHQ9Result {
  id: string;
  userId: string;
  responses: PHQ9FullResponse[];
  totalScore: number;
  severity: string;
  impact: string;
  hasItem9Positive: boolean;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PHQ9History {
  results: PHQ9Result[];
  totalAssessments: number;
  averageScore: number;
  lastAssessment?: PHQ9Result;
  trendDirection?: 'improving' | 'stable' | 'worsening';
}

/**
 * Submit PHQ-9 questionnaire responses
 */
export const submitPHQ9 = async (submissionData: PHQ9Submission, token: string): Promise<PHQ9Result> => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'questionnaire/phq9/submit',
      data: submissionData,
      token
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting PHQ-9:', error);
    throw error;
  }
};

/**
 * Get user's PHQ-9 assessment history
 */
export const getPHQ9History = async (token: string, limit?: number): Promise<PHQ9History> => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: 'questionnaire/phq9/history',
      data: limit ? { limit } : undefined,
      token
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PHQ-9 history:', error);
    throw error;
  }
};

/**
 * Get a specific PHQ-9 result by ID
 */
export const getPHQ9Result = async (resultId: string, token: string): Promise<PHQ9Result> => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: `questionnaire/phq9/result/${resultId}`,
      token
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PHQ-9 result:', error);
    throw error;
  }
};

/**
 * Get user's latest PHQ-9 result
 */
export const getLatestPHQ9Result = async (token: string): Promise<PHQ9Result | null> => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: 'questionnaire/phq9/latest',
      token
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching latest PHQ-9 result:', error);
    return null;
  }
};

/**
 * Delete a PHQ-9 result (for privacy)
 */
export const deletePHQ9Result = async (resultId: string, token: string): Promise<void> => {
  try {
    await apiRequest({
      method: 'delete',
      path: `questionnaire/phq9/result/${resultId}`,
      token
    });
  } catch (error) {
    console.error('Error deleting PHQ-9 result:', error);
    throw error;
  }
};

/**
 * Get PHQ-9 analytics for counselors (if user is a counselor)
 */
export const getPHQ9Analytics = async (token: string, filters?: {
  startDate?: string;
  endDate?: string;
  severityLevel?: string;
}): Promise<any> => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: 'questionnaire/phq9/analytics',
      data: filters,
      token
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PHQ-9 analytics:', error);
    throw error;
  }
};

/**
 * Check if user has completed PHQ-9 questionnaire in the current 2-week period
 */
export const hasCompletedPHQ9ThisPeriod = async (): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    const response = await axios.get(
      `${API_BASE_URL}/questionnaire/phq9/user/${userId}/history`,
      { headers: await authHeaders(), validateStatus: () => true }
    );

    if (response.status === 200) {
      const data = response.data?.data || [];
      const now = new Date();
      // Calculate start of current 2-week period
      const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
      const twoWeekPeriodStart = daysSinceEpoch - (daysSinceEpoch % 14);
      const startOfTwoWeeks = new Date(twoWeekPeriodStart * 1000 * 60 * 60 * 24);

      // Check if any submission is from this 2-week period
      const thisPeriodSubmission = data.find((submission: any) => {
        const completedAt = new Date(submission.completedAt || submission.createdAt);
        return completedAt >= startOfTwoWeeks;
      });

      return !!thisPeriodSubmission;
    }

    return false;
  } catch (error) {
    console.error('Error checking PHQ-9 completion this period:', error);
    return false; // Fail safely - show popup if there's an error
  }
};

// Helper functions for scoring and interpretation
export const calculatePHQ9Score = (responses: number[]): number => {
  return responses.reduce((sum, score) => sum + score, 0);
};

export const interpretPHQ9Score = (score: number): string => {
  if (score <= 4) return 'Minimal or none';
  if (score <= 9) return 'Mild';
  if (score <= 14) return 'Moderate';
  if (score <= 19) return 'Moderately severe';
  return 'Severe';
};

export const hasItem9Positive = (responses: number[]): boolean => {
  return responses.length >= 9 && responses[8] > 0;
};
