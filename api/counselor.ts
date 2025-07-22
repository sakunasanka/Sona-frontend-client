import { apiRequest } from "./api";

export interface Counselor {
  id: number;
  firebaseId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  title: string;
  specialties: string[];
  address: string;
  contact_no: string;
  license_no: string;
  idCard: string;
  isVolunteer: boolean;
  isAvailable: boolean;
  description: string;
  rating: number;
  sessionFee: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  languages: string[];
}

export interface CounselorResponse {
  success: boolean;
  message: string;
  data: {
    counselors: Counselor[];
    count: number;
  };
}

export interface SingleCounselorResponse {
  success: boolean;
  message: string;
  data: {
    counselor: Counselor;
  };
}

// Get available counselors
export const getAvailableCounselors = async (): Promise<CounselorResponse> => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: '/counselors/available'
    });
    return response;
  } catch (error) {
    // console.error('Error fetching available counselors:', error);
    throw error;
  }
};

// Get counselor by ID
export const getCounselorById = async (counselorId: number): Promise<Counselor> => {
  try {
    console.log(`API call: Fetching counselor with ID ${counselorId}`);
    const response = await apiRequest({
      method: 'get',
      path: `/counselors/${counselorId}`
    });
    
    console.log('API response:', response);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch counselor data');
    }
    
    if (!response.data || !response.data.counselor) {
      throw new Error('Invalid response format: missing counselor data');
    }
    
    return response.data.counselor;
  } catch (error) {
    console.error(`Error fetching counselor with ID ${counselorId}:`, error);
    throw error;
  }
};