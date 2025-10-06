import { checkPlatformFeeStatus } from '@/api/payment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface PlatformFeeStatus {
  hasPaid: boolean;
  paymentDate?: string;
  expiryDate?: string;
  daysRemaining?: number;
}

interface PlatformFeeContextType {
  feeStatus: PlatformFeeStatus | null;
  isLoading: boolean;
  refreshFeeStatus: () => Promise<void>;
  checkAndShowPaymentAlert: () => Promise<boolean>; // Returns true if paid, false if needs payment
}

const PlatformFeeContext = createContext<PlatformFeeContextType | undefined>(undefined);

export const usePlatformFee = () => {
  const context = useContext(PlatformFeeContext);
  if (context === undefined) {
    throw new Error('usePlatformFee must be used within a PlatformFeeProvider');
  }
  return context;
};

interface PlatformFeeProviderProps {
  children: ReactNode;
}

export const PlatformFeeProvider: React.FC<PlatformFeeProviderProps> = ({ children }) => {
  const [feeStatus, setFeeStatus] = useState<PlatformFeeStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshFeeStatus = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await checkPlatformFeeStatus(token);
        if (response.success) {
          setFeeStatus(response.data);
        }
      }
    } catch (error) {
      console.error('Error refreshing platform fee status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndShowPaymentAlert = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return false;

      const response = await checkPlatformFeeStatus(token);
      if (response.success) {
        setFeeStatus(response.data);
        return response.data.hasPaid;
      }
      return false;
    } catch (error) {
      console.error('Error checking platform fee status:', error);
      return false;
    }
  };

  useEffect(() => {
    refreshFeeStatus();
  }, []);

  const value: PlatformFeeContextType = {
    feeStatus,
    isLoading,
    refreshFeeStatus,
    checkAndShowPaymentAlert,
  };

  return (
    <PlatformFeeContext.Provider value={value}>
      {children}
    </PlatformFeeContext.Provider>
  );
};