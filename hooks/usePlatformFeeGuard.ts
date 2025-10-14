import { usePlatformFee } from '@/contexts/PlatformFeeContext';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export const usePlatformFeeGuard = () => {
  const { feeStatus, isLoading, showPaymentModal } = usePlatformFee();
  const alertShownRef = useRef(false);
  const inPaymentProcessRef = useRef(false);

  // Reset alert flag when fee status changes (user might have paid)
  useEffect(() => {
    if (feeStatus?.hasPaid) {
      alertShownRef.current = false;
      inPaymentProcessRef.current = false;
    }
  }, [feeStatus?.hasPaid]);

  const checkPlatformFeeAccess = useCallback(async (): Promise<boolean> => {
    if (isLoading) return false;

    // Prevent multiple simultaneous checks
    if (alertShownRef.current || inPaymentProcessRef.current) return false;

    // Use the already fetched feeStatus instead of fetching again
    const hasPaid = feeStatus?.hasPaid || false;

    if (!hasPaid) {
      // Prevent showing multiple alerts
      if (!alertShownRef.current) {
        alertShownRef.current = true;

        Alert.alert(
          'Platform Fee Required',
          'You need to pay the monthly platform fee to access this feature.',
          [
            {
              text: 'Pay Now',
              onPress: () => {
                alertShownRef.current = false; // Reset flag
                inPaymentProcessRef.current = true; // Set flag to prevent multiple modals
                // Navigate to profile where they can pay
                showPaymentModal();

              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                alertShownRef.current = false; // Reset flag
              }
            }
          ]
        );
      }
      return false;
    }

    return true;
  }, [isLoading, feeStatus?.hasPaid, showPaymentModal]); // Use feeStatus instead of checkAndShowPaymentAlert

  return {
    checkPlatformFeeAccess,
    hasPaid: feeStatus?.hasPaid || false,
    isLoading,
  };
};