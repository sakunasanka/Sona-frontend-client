import { apiRequest } from "./api";

interface PaymentResponse {
  success: boolean;
  message?: string;
  data: {
    userhash: string;
    orderId: string;
  }
}

interface paymentRequestData {
    amount: number,
    currency: string,
    sessionType: string,
    sessionDetails?: {
      date: string,
      time: string,
      counselorId: string
    }
}

interface PlatformFeeStatusResponse {
  success: boolean;
  message: string;
  data: {
    hasPaid: boolean;
    paymentDate?: string;
    expiryDate?: string;
    daysRemaining?: number;
  };
}

interface PlatformFeePaymentData {
  amount: number;
  currency: string;
  sessionType: string; // 'platform' for platform fee
  sessionDetails?: {
    amount?: number;
    sessionType?: string;
    month: string; // YYYY-MM format
  };
}

interface SessionBookingPaymentData {
  orderId: string;
  userhash: string;
  sessionDetails: {
    counselorId: string;
    date: string;
    time: string;
    duration: number;
    amount: number;
  };
}

interface PaymentConfirmationData {
  orderId: string;
  userhash: string;
  amount: number;
  description?: string;
}

export const createPaymentLink = async (data: paymentRequestData, token?: string): Promise<PaymentResponse> => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'payments/generate-link',
      data,
      token
    });
    return response;
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw error;
  }
};

export const checkPlatformFeeStatus = async (token: string): Promise<PlatformFeeStatusResponse> => {
  try {
    const response = await apiRequest({
      method: 'get',
      path: 'payments/platform-fee-status',
      token
    });
    return response;
  } catch (error) {
    console.error('Error checking platform fee status:', error);
    throw error;
  }
};

export const createPlatformFeePaymentLink = async (data: PlatformFeePaymentData, token: string): Promise<PaymentResponse> => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'payments/generate-link',
      data,
      token
    });
    return response;
  } catch (error) {
    console.error('Error creating platform fee payment:', error);
    throw error;
  }
};

export const processPlatformFeePayment = async (data: PlatformFeePaymentData, token: string): Promise<PaymentResponse> => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'payments/initiate-platform-fee',
      data,
      token
    });
    return response;
  } catch (error) {
    console.error('Error processing platform fee payment:', error);
    throw error;
  }
};

export const confirmPlatformFeePayment = async (data: PaymentConfirmationData, token: string): Promise<PaymentResponse> => {
  try {
    const response = await apiRequest({
      method: 'post',
      path: 'payments/initiate-platform-fee',
      data,
      token
    });
    return response;
  } catch (error) {
    console.error('Error confirming platform fee payment:', error);
    throw error;
  }
};