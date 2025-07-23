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
