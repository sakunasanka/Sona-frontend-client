import { checkPlatformFeeStatus } from '@/api/payment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

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
  showPaymentModal: () => void;
  isPaymentModalVisible: boolean;
  hidePaymentModal: () => void;
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
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState<boolean>(false);
  const hasInitializedRef = React.useRef(false);
  const callCountRef = React.useRef(0); // Track number of calls

  const refreshFeeStatus = useCallback(async () => {
    callCountRef.current += 1;
    const callNumber = callCountRef.current;
    console.log(`[PlatformFeeContext ${new Date().toISOString()}] refreshFeeStatus called - Call #${callNumber}`);
    console.log(`[PlatformFeeContext] Stack trace:`, new Error().stack);
    
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (token) {
        console.log(`[PlatformFeeContext] Making API call #${callNumber} to checkPlatformFeeStatus`);
        const response = await checkPlatformFeeStatus(token);
        if (response.success) {
          console.log(`[PlatformFeeContext] API call #${callNumber} successful`);
          setFeeStatus(response.data);
        }
      }
    } catch (error) {
      console.error(`[PlatformFeeContext] Error in call #${callNumber}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkAndShowPaymentAlert = useCallback(async (): Promise<boolean> => {
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
      console.log('Error checking platform fee status:', error);
      return false;
    }
  }, []); // No dependencies needed

  const showPaymentModal = useCallback(() => {
    console.log('Showing payment modal');
    setIsPaymentModalVisible(true);
  }, []);
  
  const hidePaymentModal = useCallback(() => {
    console.log('Hiding payment modal');
    setIsPaymentModalVisible(false);
  }, []);

  useEffect(() => {
    console.log(`[PlatformFeeContext ${new Date().toISOString()}] useEffect triggered`);
    console.log(`[PlatformFeeContext] hasInitializedRef.current =`, hasInitializedRef.current);
    
    // Only fetch once on mount using ref guard
    if (!hasInitializedRef.current) {
      console.log(`[PlatformFeeContext] First time - calling refreshFeeStatus`);
      hasInitializedRef.current = true;
      refreshFeeStatus();
    } else {
      console.log(`[PlatformFeeContext] SKIPPING - already initialized`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // EMPTY ARRAY - only run on mount! refreshFeeStatus is stable (memoized with [])

  const value: PlatformFeeContextType = {
    feeStatus,
    isLoading,
    refreshFeeStatus,
    checkAndShowPaymentAlert,
    showPaymentModal,
    isPaymentModalVisible,
    hidePaymentModal
  };

  return (
    <PlatformFeeContext.Provider value={value}>
      {children}
    </PlatformFeeContext.Provider>
  );
};