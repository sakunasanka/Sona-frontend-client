import { apiRequest } from "./api";

// Types for prescription data matching the backend response
export interface Prescription {
  id: number;
  psychiatristId: number;
  clientId: number;
  description: string;
  prescription: string; // PDF URL
  createdAt: string;
  updatedAt: string;
  psychiatrist: {
    id: number;
    name: string;
    email: string;
    avatar: string;
  };
}

export interface PrescriptionsResponse {
  success: boolean;
  message: string;
  data: {
    prescriptions: Prescription[];
    count: number;
    clientId: number;
  };
}

// Get user's prescriptions from psychiatrists
export const getUserPrescriptions = async (token: string): Promise<PrescriptionsResponse> => {
  try {
    console.log('API call: Fetching user prescriptions');
    const response = await apiRequest({
      method: 'get',
      path: '/psychiatrists/my-prescriptions',
      token
    });
    
    console.log('Prescriptions API response:', response);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch prescriptions');
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching user prescriptions:', error);
    throw error;
  }
};

// Download prescription PDF
export const downloadPrescription = async (prescriptionUrl: string, token: string) => {
  try {
    console.log('API call: Downloading prescription from URL:', prescriptionUrl);
    
    // For now, we'll just return the URL since the backend provides direct download links
    // In a real app, you might want to handle the download differently
    return {
      success: true,
      downloadUrl: prescriptionUrl
    };
  } catch (error) {
    console.error('Error downloading prescription:', error);
    throw error;
  }
};