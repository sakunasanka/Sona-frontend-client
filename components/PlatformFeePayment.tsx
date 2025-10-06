import { createPlatformFeePaymentLink, processPlatformFeePayment } from '@/api/payment';
import { API_URL, PORT } from '@/config/env';
import { usePlatformFee } from '@/contexts/PlatformFeeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface PlatformFeePaymentProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

const PlatformFeePayment: React.FC<PlatformFeePaymentProps> = ({
  visible,
  onClose,
  onPaymentSuccess,
}) => {
  const [showWebView, setShowWebView] = useState(false);
  const [paymentPageUrl, setPaymentPageUrl] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [currentUserHash, setCurrentUserHash] = useState<string>('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const { refreshFeeStatus } = usePlatformFee();

  // Platform fee amount - you might want to make this configurable
  const PLATFORM_FEE_AMOUNT = 500; // Rs. 500 per month

  const handlePayment = async () => {
    setIsCreatingPayment(true);
    setPaymentPageUrl(`${API_URL}:${PORT}/payment-loader`);

    try {
      const authToken = await AsyncStorage.getItem('token') || '';

      // Get current month in YYYY-MM format
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const response = await createPlatformFeePaymentLink({
        amount: PLATFORM_FEE_AMOUNT,
        currency: 'LKR',
        sessionType: 'platform',
        sessionDetails: {
          amount: PLATFORM_FEE_AMOUNT,
          sessionType: 'platform',
          month: currentMonth
        }
      }, authToken);

      const hash = response.data.userhash;
      const orderId = response.data.orderId;

      console.log('Platform fee payment data being sent:', {
        amount: PLATFORM_FEE_AMOUNT,
        hash,
        orderId,
        month: currentMonth,
      });

      setPaymentPageUrl(`${API_URL}:${PORT}/payment-loader?hash=${hash}&orderId=${orderId}&amount=${PLATFORM_FEE_AMOUNT}`);
      setShowWebView(true);
      setCurrentOrderId(orderId);
      setCurrentUserHash(hash);

    } catch (error: any) {
      console.error('Platform fee payment initiation error:', error);

      if (error.message?.includes('Network')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else if (error.message?.includes('auth')) {
        Alert.alert('Authentication Error', 'Please log in again.');
      } else {
        Alert.alert('Error', error.message || 'Unable to process payment. Please try again.');
      }
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    console.log('🔄 Platform Fee WebView Navigation:', {
      url: navState.url,
      title: navState.title,
      loading: navState.loading,
    });

    if (navState.url.includes('/payment-success')) {
      console.log('✅ Platform fee payment success detected!');
      console.log('📍 Full success URL:', navState.url);
      console.log('📋 Navigation state:', navState);
      setShowWebView(false);

      // Extract the order ID from the URL
      const orderId = navState.url.split('orderId=')[1]?.split('&')[0] || currentOrderId || 'N/A';
      console.log('📝 Order ID extracted:', orderId);
      console.log('🔑 User hash available:', currentUserHash);

      // Validate that we have the required data
      if (!currentUserHash) {
        console.error('❌ Missing userhash for payment processing');
        throw new Error('Payment validation data is missing. Please try again.');
      }

      try {
        // Process the platform fee payment on the backend
        const authToken = await AsyncStorage.getItem('token') || '';
        await processPlatformFeePayment({
          orderId,
          userhash: currentUserHash, // Use the stored userhash from payment generation
          amount: PLATFORM_FEE_AMOUNT,
          description: 'Monthly platform access fee'
        }, authToken);

        // Refresh platform fee status
        await refreshFeeStatus();

        // Show success message first
        Alert.alert(
          'Platform Fee Paid Successfully! 🎉',
          `Your platform fee has been paid successfully.\n\nOrder ID: ${orderId}\n\nRedirecting to profile page in 5 seconds...`,
          [
            {
              text: 'Go to Profile Now',
              onPress: () => {
                console.log('User chose to go to profile immediately');
                onPaymentSuccess?.();
                onClose();
                setTimeout(() => {
                  router.push('/(hidden)/profile/view_profile');
                }, 100); // Small delay to ensure modal closes first
              }
            }
          ]
        );

        // Auto redirect to profile page after 5 seconds
        setTimeout(() => {
          console.log('Auto-redirecting to profile page after 5 seconds');
          onPaymentSuccess?.();
          onClose();
          setTimeout(() => {
            router.push('/(hidden)/profile/view_profile');
          }, 100); // Small delay to ensure modal closes first
        }, 5000);
      } catch (error: any) {
        console.error('Error processing platform fee payment:', error);

        Alert.alert(
          'Payment Processing Error',
          'Your payment was successful, but there was an issue updating your account. Please contact support.\n\nRedirecting to profile page in 5 seconds...',
          [
            {
              text: 'Go to Profile Now',
              onPress: () => {
                console.log('User chose to go to profile immediately (error case)');
                onPaymentSuccess?.();
                onClose();
                setTimeout(() => {
                  router.push('/(hidden)/profile/view_profile');
                }, 100); // Small delay to ensure modal closes first
              }
            }
          ]
        );

        // Auto redirect to profile page after 5 seconds even on error
        setTimeout(() => {
          console.log('Auto-redirecting to profile page after 5 seconds (error case)');
          onPaymentSuccess?.();
          onClose();
          setTimeout(() => {
            router.push('/(hidden)/profile/view_profile');
          }, 100); // Small delay to ensure modal closes first
        }, 5000);
      }
    } else if (navState.url.includes('/payment-cancel') || navState.url.includes('/payment-failed')) {
      console.log('❌ Platform fee payment failed/cancelled');
      setShowWebView(false);
      setCurrentOrderId(''); // Reset order ID
      setCurrentUserHash(''); // Reset user hash
      Alert.alert(
        'Payment Cancelled',
        'Your payment was not processed. You can try again.',
        [
          { text: 'Try Again', onPress: () => setCurrentOrderId('') },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const handleCloseWebView = () => {
    setShowWebView(false);
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('Platform Fee WebView error:', nativeEvent);
    Alert.alert(
      'Error',
      'There was a problem loading the payment page. Please try again.',
      [{ text: 'OK', onPress: () => setShowWebView(false) }]
    );
  };

  const formatCurrentMonth = () => {
    const now = new Date();
    const oneMonthFromNow = new Date(now);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const startDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const endDate = oneMonthFromNow.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return `${startDate} to ${endDate}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="p-1">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-gray-900 text-lg font-semibold">Platform Fee Payment</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 p-5">
          {/* Fee Information Card */}
          <View className="bg-white rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-blue-50 justify-center items-center mr-4">
                <CreditCard size={24} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">Platform Access Fee</Text>
                <Text className="text-sm text-gray-500">One month of premium features</Text>
              </View>
            </View>

            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Valid Period</Text>
                <Text className="text-gray-900 font-medium">{formatCurrentMonth()}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Amount</Text>
                <Text className="text-2xl font-bold text-primary">Rs.{PLATFORM_FEE_AMOUNT}</Text>
              </View>
            </View>

            <View className="bg-green-50 border border-green-200 rounded-lg p-4">
              <View className="flex-row items-start">
                <Shield size={20} color="#059669" className="mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-green-800 font-medium mb-1">What you get:</Text>
                  <Text className="text-green-700 text-sm leading-5">
                    • Access to search counselors and psychiatrists{'\n'}
                    • Choose specialization (depression, stress, etc.){'\n'}
                    • View session history{'\n'}
                    • Chat with counselors{'\n'}
                    • Full platform access for the month
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Button */}
          <View className="bg-white rounded-2xl p-6">
            <TouchableOpacity
              className={`w-full py-4 rounded-xl items-center ${
                isCreatingPayment ? 'bg-gray-300' : 'bg-primary'
              }`}
              onPress={handlePayment}
              disabled={isCreatingPayment}
            >
              {isCreatingPayment ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Processing...</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <CreditCard size={20} color="#FFFFFF" className="mr-2" />
                  <Text className="text-white font-semibold text-lg">Pay Rs.{PLATFORM_FEE_AMOUNT}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center justify-center mt-4">
              <Shield size={16} color="#059669" className="mr-2" />
              <Text className="text-green-700 text-sm">Secure payment powered by PayHere</Text>
            </View>
          </View>
        </View>

        {/* Payment WebView Modal */}
        <Modal
          visible={showWebView}
          animationType="slide"
          presentationStyle="formSheet"
        >
          <SafeAreaView className="flex-1 bg-white">
            {/* WebView Header */}
            <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
              <TouchableOpacity onPress={handleCloseWebView} className="p-1">
                <ArrowLeft size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-gray-900 text-lg font-semibold">Secure Payment</Text>
              <View className="w-6" />
            </View>

            {/* Security Notice */}
            <View className="bg-green-50 border-b border-green-100 px-5 py-3">
              <Text className="text-green-800 text-sm font-medium">🔒 Secure Payment</Text>
              <Text className="text-green-700 text-xs">Your payment is processed securely by PayHere</Text>
            </View>

            {/* WebView */}
            {/* WebView */}
            <WebView
              source={paymentPageUrl ? { uri: paymentPageUrl } : { uri: "about:blank" }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              onShouldStartLoadWithRequest={(request) => {
                console.log('WebView should start load with request:', request.url);
                
                // Handle payment result URLs
                if (request.url.includes('/payment-success') || request.url.includes('/payment-cancel') || request.url.includes('/payment-failed')) {
                  console.log('🔍 Detected payment result URL:', request.url);
                  // Manually trigger navigation state change for these URLs
                  setTimeout(() => {
                    handleWebViewNavigationStateChange({
                      url: request.url,
                      title: request.title || 'Payment Result',
                      loading: false
                    });
                  }, 100);
                  return false; // Prevent actual navigation but still trigger handler
                }
                return true;
              }}
              onError={handleWebViewError}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView HTTP Error:', nativeEvent.statusCode, nativeEvent.description);
              }}
              onLoadStart={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.log('WebView started loading:', nativeEvent.url);
                if (paymentPageUrl && nativeEvent.url === "about:blank") {
                  console.log('Loading HTML content from state...');
                }
              }}
              onLoadEnd={() => console.log('WebView finished loading')}
              onLoadProgress={({ nativeEvent }) => {
                console.log('WebView loading progress:', nativeEvent.progress);
              }}
              startInLoadingState={true}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              mixedContentMode="compatibility"
              renderLoading={() => (
                <View className="flex-1 justify-center items-center bg-gray-50">
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text className="text-gray-600 mt-4">Loading secure payment...</Text>
                  <Text className="text-gray-500 text-sm mt-1">Please wait while we redirect you to PayHere</Text>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

export default PlatformFeePayment;