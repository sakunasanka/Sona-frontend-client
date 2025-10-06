import { usePlatformFee } from '@/contexts/PlatformFeeContext';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export const usePlatformFeeGuard = () => {
  const { feeStatus, isLoading, checkAndShowPaymentAlert } = usePlatformFee();
  const alertShownRef = useRef(false);

  // Reset alert flag when fee status changes (user might have paid)
  useEffect(() => {
    if (feeStatus?.hasPaid) {
      alertShownRef.current = false;
    }
  }, [feeStatus?.hasPaid]);

  const checkPlatformFeeAccess = async (): Promise<boolean> => {
    if (isLoading) return false;

    // Prevent multiple simultaneous checks
    if (alertShownRef.current) return false;

    const hasPaid = await checkAndShowPaymentAlert();

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
                // Navigate to profile where they can pay
                router.push('/(hidden)/profile/view_profile');
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
  };

  return {
    checkPlatformFeeAccess,
    hasPaid: feeStatus?.hasPaid || false,
    isLoading,
  };
};