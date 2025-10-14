import { API_URL, PORT } from '@/config/env';
import { Platform } from 'react-native';
import { apiRequest } from "./api";

let API_BASE_URL = '';
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  API_BASE_URL = 'http://localhost:' + PORT + '/api';
}

export interface Session {
  id: string;
  date: string;
  duration: number;
  fee: number | string;
  price?: number;
  notes?: string | null;
  counselorId: string;
  counselor?: {
    id: string;
    name: string;
    avatar?: string;
    specialties?: string[];
    rating?: number;
  };
  timeSlot?: string;
  status?: string;
  counselorType?: string;
}

/**
 * Fetch user's session history
 */
export const fetchUserSessions = async (token: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: 'sessions/my-sessions',
      token
    });
    return response;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

/**
 * Fetch available time slots for a counselor on a specific date
 */
export const fetchTimeSlots = async (counselorId: string, date: string, token?: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: `sessions/timeslots/${counselorId}/${date}`,
      token
    });
    return response;
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw error;
  }
};

/**
 * Book a session with a counselor
 */
export const bookSession = async (sessionData: {
  counselorId: string;
  date: string;
  timeSlot: string;
  duration: number;
  price: number;
}, token: string) => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'sessions/book',
      data: sessionData,
      token
    });
    return response;
  } catch (error) {
    console.error('Error booking session:', error);
    throw error;
  }
};

/**
 * Book a free session for students
 */
export const bookFreeStudentSession = async (sessionData: {
  counselorId: string;
  date: string;
  timeSlot: string;
  duration: number;
}, token: string) => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'sessions/book-free',
      data: sessionData,
      token
    });
    return response;
  } catch (error) {
    console.error('Error booking free student session:', error);
    throw error;
  }
};

/**
 * Cancel a booked session
 */
export const cancelSession = async (sessionId: string, token: string) => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: `sessions/cancel/${sessionId}`,
      token
    });
    return response;
  } catch (error) {
    console.error('Error cancelling session:', error);
    throw error;
  }
};

/**
 * Get remaining free sessions for students
 */
export const getRemainingFreeSessions = async (token: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: 'sessions/remaining',
      token
    });
    return response;
  } catch (error) {
    console.error('Error fetching remaining free sessions:', error);
    throw error;
  }
};

export interface StudentSessionInfo {
  remainingSessions: number;
  nextResetDate: string;
  totalSessionsThisPeriod: number;
  isStudent: boolean;
}

/**
 * Fetch available psychiatrists
 */
export const fetchPsychiatrists = async (token?: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: 'psychiatrists',
      token
    });
    return response;
  } catch (error) {
    console.error('Error fetching psychiatrists:', error);
    throw error;
  }
};

/**
 * Fetch psychiatrist by ID
 */
export const fetchPsychiatristById = async (psychiatristId: string, token?: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: `psychiatrists/${psychiatristId}`,
      token
    });
    return response;
  } catch (error) {
    console.error('Error fetching psychiatrist:', error);
    throw error;
  }
};

/**
 * Fetch available time slots for a psychiatrist on a specific date
 */
export const fetchPsychiatristTimeSlots = async (psychiatristId: string, date: string, token?: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: `psychiatrist-timeslots/${psychiatristId}/${date}`,
      token
    });
    return response;
  } catch (error) {
    console.error('Error fetching psychiatrist time slots:', error);
    throw error;
  }
};

/**
 * Book a session with a psychiatrist
 */
export const bookPsychiatristSession = async (sessionData: {
  psychiatristId: string;
  date: string;
  timeSlot: string;
  duration: number;
  price: number;
  concerns?: string;
}, token: string) => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'sessions/book',
      data: {
        ...sessionData,
        counselorId: sessionData.psychiatristId, // Map to counselorId for backend compatibility
        type: 'psychiatrist'
      },
      token
    });
    return response;
  } catch (error) {
    console.error('Error booking psychiatrist session:', error);
    throw error;
  }
};

/**
 * Book a free psychiatrist session for students
 */
export const bookFreePsychiatristSession = async (sessionData: {
  psychiatristId: string;
  date: string;
  timeSlot: string;
  duration: number;
}, token: string) => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'sessions/book-free',
      data: {
        ...sessionData,
        counselorId: sessionData.psychiatristId, // Map to counselorId for backend compatibility
        type: 'psychiatrist'
      },
      token
    });
    return response;
  } catch (error) {
    console.error('Error booking free psychiatrist session:', error);
    throw error;
  }
}; 

//get session link from backend
export const getSessionLink = async (sessionId: string, token: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: `sessions/getSessionLink/${sessionId}`,
      token
    })

    return response;
  }catch (error) {
    console.error('Error fetching session link:', error);
    throw error;
  }
}