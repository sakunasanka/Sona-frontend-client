import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/env';

const BASE_URL = API_URL;

const api = axios.create({
  baseURL: BASE_URL + ':5001/api',
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface SubmitComplaintRequest {
  additional_details: string;
  session_id: string | number;
  proof?: string;
  reason: string;
}

interface Complaint {
  complaintId: number;
  additional_details: string;
  status: string;
  proof?: string;
  reason: string;
  user_id: number;
  session_id: number;
  action_by: number | null;
  reasonID: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  session: {
    id: number;
    date: string;
    timeSlot: string;
    duration: number;
    status: string;
  };
}

export const fetchComplaints = async (): Promise<{ success: boolean; message: string; data: Complaint[] }> => {
  try {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const response = await api.get('/complaints', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

export const submitComplaint = async (complaintData: SubmitComplaintRequest): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // console.log('Submitting complaint with data:', JSON.stringify(complaintData, null, 2));
    console.log('API URL:', `${BASE_URL}:5001/api/complaints`);

    const response = await api.post(
      '/complaints',
      complaintData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error submitting complaint:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Server response status:', axiosError.response?.status);
      console.error('Server response data:', JSON.stringify(axiosError.response?.data, null, 2));
      console.error('Server response headers:', axiosError.response?.headers);
    }
    throw error;
  }
};