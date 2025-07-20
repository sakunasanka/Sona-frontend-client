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
    const response = await apiRequest({
      method: 'get',
      path: `/counselors/${counselorId}`
    });
    return response.data.counselor;
  } catch (error) {
    // console.error(`Error fetching counselor with ID ${counselorId}:`, error);
    throw error;
  }
};