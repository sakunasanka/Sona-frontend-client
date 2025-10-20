import { apiRequest } from "./api";

export interface Psychiatrist {
  id: number;
  firebaseId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  title: string;
  specialities: string[]; // Note: backend uses 'specialities' not 'specialties'
  address: string;
  contact_no: string;
  license_no: string;
  idCard: string;
  isAvailable: boolean;
  description: string;
  rating: number;
  sessionFee: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  languages: string[];
  qualifications?: string[];
  consultationTypes?: string[];
  experience?: string;
}

export interface PsychiatristResponse {
  success: boolean;
  message: string;
  data: any; // Make this flexible to handle different response formats
}

export interface SinglePsychiatristResponse {
  success: boolean;
  message: string;
  data: {
    psychiatrist: Psychiatrist;
  };
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  duration: number;
}

export interface AvailabilityResponse {
  success: boolean;
  message: string;
  data: any; // Make this flexible to handle different response formats
}

export interface MonthlyAvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    [dateKey: string]: {
      isAvailable: boolean;
      totalSlots: number;
      availableSlots: number;
    };
  };
}

// Get available psychiatrists
export const getAvailablePsychiatrists = async (): Promise<PsychiatristResponse> => {
  try {
    console.log('Making API request to /psychiatrists/available');
    const response = await apiRequest({
      method: 'get',
      path: '/psychiatrists/available'
    });
    console.log('Raw API response for psychiatrists:', response);
    return response;
  } catch (error) {
    console.log('Error fetching available psychiatrists:', error);
    throw error;
  }
};

// Get psychiatrist by ID
export const getPsychiatristById = async (psychiatristId: number): Promise<Psychiatrist> => {
  try {
    console.log(`API call: Fetching psychiatrist with ID ${psychiatristId}`);
    const response = await apiRequest({
      method: 'get',
      path: `/sessions/psychiatrists/${psychiatristId}`
    });
    
    console.log('API response:', response);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch psychiatrist data');
    }
    
    if (!response.data) {
      throw new Error('Invalid response format: missing psychiatrist data');
    }
    
    // Handle both possible response formats
    return response.data.psychiatrist || response.data;
  } catch (error) {
    console.error(`Error fetching psychiatrist with ID ${psychiatristId}:`, error);
    throw error;
  }
};

// Get psychiatrist availability for a specific date
export const getPsychiatristAvailability = async (
  psychiatristId: string, 
  date: string, 
  token?: string
): Promise<AvailabilityResponse> => {
  try {
    console.log(`API call: Fetching availability for psychiatrist ${psychiatristId} on ${date}`);
    const response = await apiRequest({
      method: 'get',
      path: `/psychiatrists/${psychiatristId}/availability/${date}`,
      token
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch availability data');
    }
    
    return response;
  } catch (error) {
    console.error(`Error fetching psychiatrist availability:`, error);
    throw error;
  }
};

// Get psychiatrist monthly availability overview
export const getPsychiatristMonthlyAvailability = async (
  psychiatristId: string, 
  year: number, 
  month: number, 
  token?: string
): Promise<MonthlyAvailabilityResponse> => {
  try {
    console.log(`API call: Fetching monthly availability for psychiatrist ${psychiatristId} for ${year}-${month}`);
    const response = await apiRequest({
      method: 'get',
      path: `/psychiatrists/${psychiatristId}/availability/${year}/${month}`,
      token
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch monthly availability data');
    }
    
    return response;
  } catch (error) {
    console.error(`Error fetching psychiatrist monthly availability:`, error);
    throw error;
  }
};

// Book a session with a psychiatrist
export const bookPsychiatristSession = async (sessionData: {
  psychiatristId: string;
  date: string;
  timeSlot: string;
  duration: number;
  price: number;
  concerns?: string;
}, token: string) => {
  try {
    console.log('API call: Booking psychiatrist session', sessionData);
    // For now, use the sessions endpoint which should handle psychiatrist bookings
    const response = await apiRequest({
      method: 'post',
      path: '/sessions/book',
      data: {
        ...sessionData,
        counselorId: sessionData.psychiatristId, // Map psychiatristId to counselorId for now
        type: 'psychiatrist' // Add type to distinguish
      },
      token
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to book session');
    }
    
    return response;
  } catch (error) {
    console.log('Error booking psychiatrist session:', error);
    throw error;
  }
};

// Get psychiatrist time slots for a specific date
export const getPsychiatristTimeSlots = async (
  psychiatristId: string, 
  date: string, 
  token?: string
): Promise<AvailabilityResponse> => {
  try {
    console.log(`API call: Fetching time slots for psychiatrist ${psychiatristId} on ${date}`);
    const response = await apiRequest({
      method: 'get',
      path: `/sessions/psychiatrist-timeslots/${psychiatristId}/${date}`,
      token
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch time slots');
    }
    
    return response;
  } catch (error) {
    console.log('Error fetching psychiatrist time slots:', error);
    throw error;
  }
};

// Get user's psychiatrist session history
export const fetchUserPsychiatristSessions = async (token: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: '/sessions/my-sessions',
      token
    });
    return response;
  } catch (error) {
    console.log('Error fetching psychiatrist sessions:', error);
    throw error;
  }
};

// Cancel a psychiatrist session
export const cancelPsychiatristSession = async (sessionId: string, token: string) => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: `/sessions/cancel/${sessionId}`,
      token
    });
    return response;
  } catch (error) {
    console.log('Error cancelling psychiatrist session:', error);
    throw error;
  }
};

// Get remaining psychiatrist sessions for students (if applicable)
export const getRemainingPsychiatristSessions = async (token: string) => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: '/sessions/remaining',
      token
    });
    return response;
  } catch (error) {
    console.log('Error fetching remaining psychiatrist sessions:', error);
    throw error;
  }
};
