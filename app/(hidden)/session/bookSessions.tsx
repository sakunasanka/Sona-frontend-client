import { createPaymentLink } from "@/api/payment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ArrowLeft, CreditCard, MessageCircle, Phone, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { PrimaryButton } from '../../components/Buttons';
import { API_URL, PORT } from "@/config/env";

interface SessionType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  duration: string;
  price: number;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

const SESSION_TYPES: SessionType[] = [
  {
    id: 'video',
    name: 'Video Call',
    icon: Video,
    description: 'Secure video session from anywhere',
    duration: '50 min',
    price: 80
  },
  {
    id: 'phone',
    name: 'Phone Call',
    icon: Phone,
    description: 'Traditional phone consultation',
    duration: '50 min',
    price: 75
  },
  {
    id: 'chat',
    name: 'Text Chat',
    icon: MessageCircle,
    description: 'Secure messaging session',
    duration: '50 min',
    price: 65
  }
];

const MOCK_COUNSELOR = {
  id: '1',
  name: 'Dr. Ugo David',
  title: 'Licensed Clinical Psychologist',
  avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  specialties: ['Anxiety', 'Depression', 'Trauma'],
  rating: 4.9,
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'Credit Card',
    last4: '4242',
    brand: 'Visa',
    isDefault: true
  },
  {
    id: '2',
    type: 'Credit Card',
    last4: '5555',
    brand: 'Mastercard',
    isDefault: false
  }
];

const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const currentHour = today.getHours();

  for (let hour = 9; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 60) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const available = !isToday || hour > currentHour + 1;
      
      slots.push({
        id: `${hour}-${minute}`,
        time: timeString,
        available
      });
    }
  }
  
  return slots;
};

const generateDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

export default function BookSessionScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('video');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('1');
  const [concerns, setConcerns] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // WebView states for payment processing
  const [showWebView, setShowWebView] = useState(false);
  const [paymentPageUrl, setPaymentPageUrl] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

  // Add error boundary for data operations
  let dates: Date[], timeSlots: TimeSlot[], selectedSession: SessionType | undefined;
  try {
    dates = generateDates();
    timeSlots = generateTimeSlots(selectedDate);
    selectedSession = SESSION_TYPES.find(type => type.id === selectedSessionType);
  } catch (error) {
    console.error('Error generating UI data:', error);
    // Fallback values
    dates = [new Date()];
    timeSlots = [];
    selectedSession = SESSION_TYPES[0];
  }

  // Full payment handling with WebView integration
  const handleBookSession = async () => {
    if (!selectedTime) {
      Alert.alert('Time Required', 'Please select a time slot for your session.');
      return;
    }
    const amount = selectedSession?.price || 0;

    const authToken = await AsyncStorage.getItem('token') || '';

    const response = await createPaymentLink({
        amount: amount,
        currency: 'LKR',
        sessionType: selectedSessionType,
        sessionDetails: {
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime,
          counselorId: MOCK_COUNSELOR.id
        }
    }, authToken)

    setIsCreatingPayment(true);
    setPaymentPageUrl(API_URL + ':' + PORT + '/payment-loader');

    try {
        const hash = response.data.userhash;
        const orderId = response.data.orderId;

        console.log('Booking data being sent:', {
            amount,
            hash,
            orderId
        })

      setPaymentPageUrl(API_URL + ':' + PORT + `/payment-loader?hash=${hash}&orderId=${orderId}&amount=${amount}`);
      setShowWebView(true);


    } catch (error: any) {
      console.error('Payment initiation error:', error);
      
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
    console.log('WebView Navigation:', {
      url: navState.url,
      title: navState.title,
      loading: navState.loading,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward
    });

    if (navState.url.includes('/payment-success')) {
      console.log('✅ Payment success detected');
      setShowWebView(false);
      Alert.alert(
        'Payment Successful! 🎉',
        `Your session with ${MOCK_COUNSELOR.name} has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTime}.\n\nOrder ID: ${navState.url.split('orderId=')[1] || 'N/A'}`,
        [
          {
            text: 'View Booking',
            onPress: () => router.push('/(hidden)/session/sessionHistory')
          },
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } else if (navState.url.includes('/payment-cancel') || navState.url.includes('/payment-failed')) {
      console.log('❌ Payment failed/cancelled');
      setShowWebView(false);
      Alert.alert(
        'Payment Cancelled',
        'Your payment was not processed. You can try booking again.',
        [
          { text: 'Try Again', onPress: () => setCurrentOrderId('') },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  // Handle WebView errors with detailed logging
  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error Details:', {
      code: nativeEvent?.code,
      description: nativeEvent?.description,
      url: nativeEvent?.url,
      domain: nativeEvent?.domain,
      canGoBack: nativeEvent?.canGoBack,
      canGoForward: nativeEvent?.canGoForward,
      loading: nativeEvent?.loading,
      title: nativeEvent?.title,
      navigationType: nativeEvent?.navigationType,
      // On Android, sometimes `url` is null for crashes, but `description` has clues.
    });
    
    // Attempt to close WebView on error to prevent being stuck
    setShowWebView(false);
    
    let errorMessage = 'There was an error loading the payment page. Please try again.';
    
    if (nativeEvent?.description?.includes('network') || nativeEvent?.description?.includes('internet')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (nativeEvent?.description?.includes('data:') || nativeEvent?.code === -1002 /* Android: unsupported URL */) {
        // This might indicate an issue with the data URI itself
        errorMessage = 'Failed to load payment form due to invalid data. Please try again.';
    }
    
    Alert.alert(
      'Payment Page Error',
      errorMessage,
      [
        { text: 'Retry', onPress: () => handleBookSession() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Handle WebView close
  const handleCloseWebView = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel the payment process?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel Payment',
          style: 'destructive',
          onPress: () => {
            setShowWebView(false);
            setCurrentOrderId('');
          }
        }
      ]
    );
  };

  const DateCard = ({ date, isSelected }: { date: Date; isSelected: boolean }) => (
    <TouchableOpacity
      onPress={() => setSelectedDate(date)}
      className={`mr-3 p-3 rounded-2xl min-w-[70px] items-center ${
        isSelected ? 'bg-primary' : 'bg-white border border-gray-200'
      }`}
    >
      <Text className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-500'}`}>
        {date.toLocaleDateString('en', { weekday: 'short' })}
      </Text>
      <Text className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
        {date.getDate()}
      </Text>
    </TouchableOpacity>
  );

  const TimeSlot = ({ slot }: { slot: TimeSlot }) => {
    const isSelected = selectedTime === slot.time && slot.available;
    
    return (
      <TouchableOpacity
        onPress={() => slot.available && setSelectedTime(slot.time)}
        disabled={!slot.available}
        className={`mr-3 mb-3 px-4 py-3 rounded-xl ${
          isSelected 
            ? 'bg-primary' 
            : slot.available 
              ? 'bg-white border border-gray-200' 
              : 'bg-gray-100 border border-gray-100'
        }`}
      >
        <Text 
          className={`text-sm font-medium ${
            isSelected 
              ? 'text-white' 
              : slot.available 
                ? 'text-gray-900' 
                : 'text-gray-400'
          }`}
        >
          {slot.time}
        </Text>
      </TouchableOpacity>
    );
  };

  const SessionTypeCard = ({ sessionType, isSelected }: { sessionType: SessionType; isSelected: boolean }) => {
    const IconComponent = sessionType.icon;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedSessionType(sessionType.id)}
        className={`mb-3 p-4 rounded-2xl border ${
          isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
        }`}
      >
        <View className="flex-row items-center">
          <View className={`p-3 rounded-xl mr-4 ${isSelected ? 'bg-primary' : 'bg-gray-100'}`}>
            <IconComponent size={24} color={isSelected ? 'white' : '#6B7280'} />
          </View>
          <View className="flex-1">
            <Text className={`text-lg font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
              {sessionType.name}
            </Text>
            <Text className="text-sm text-gray-500 mb-1">{sessionType.description}</Text>
            <Text className="text-sm text-gray-600">{sessionType.duration} • ${sessionType.price}</Text>
          </View>
          <View className={`w-6 h-6 rounded-full border-2 ${
            isSelected ? 'border-primary bg-primary' : 'border-gray-300'
          } items-center justify-center`}>
            {isSelected && <View className="w-2 h-2 bg-white rounded-full" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-lg font-semibold">Book Session</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Counselor Info */}
        <View className="bg-white mx-5 mt-5 p-5 rounded-2xl">
          <View className="flex-row items-center">
            {!imageError ? (
              <Image
                source={{ uri: MOCK_COUNSELOR.avatar }}
                className="w-16 h-16 rounded-full bg-gray-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-gray-300 justify-center items-center">
                <Text className="text-gray-600 font-semibold">
                  {MOCK_COUNSELOR.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Text>
              </View>
            )}
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-900">{MOCK_COUNSELOR.name}</Text>
              <Text className="text-sm text-gray-500">{MOCK_COUNSELOR.title}</Text>
              <View className="flex-row flex-wrap gap-1 mt-2">
                {MOCK_COUNSELOR.specialties.map((specialty) => (
                  <Text key={specialty} className="text-xs bg-blue-100 text-primary px-2 py-1 rounded-lg">
                    {specialty}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">Select Date</Text>
          <FlatList
            data={dates}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.toISOString()}
            renderItem={({ item }) => (
              <DateCard date={item} isSelected={selectedDate.toDateString() === item.toDateString()} />
            )}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>

        {/* Time Selection */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">Available Times</Text>
          <View className="px-5">
            <View className="flex-row flex-wrap">
              {timeSlots.map((slot) => (
                <TimeSlot key={slot.id} slot={slot} />
              ))}
            </View>
          </View>
        </View>

        {/* Session Type */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">Session Type</Text>
          <View className="px-5">
            {SESSION_TYPES.map((sessionType) => (
              <SessionTypeCard
                key={sessionType.id}
                sessionType={sessionType}
                isSelected={selectedSessionType === sessionType.id}
              />
            ))}
          </View>
        </View>

        {/* Concerns/Notes */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">What would you like to discuss?</Text>
          <View className="mx-5 bg-white rounded-2xl p-4">
            <TextInput
              value={concerns}
              onChangeText={setConcerns}
              placeholder="Share what's on your mind or any specific concerns you'd like to address..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-gray-900 text-base"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Payment Method */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">Payment Method</Text>
          <View className="px-5">
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedPaymentMethod(method.id)}
                className={`mb-3 p-4 rounded-2xl border flex-row items-center ${
                  selectedPaymentMethod === method.id ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <View className={`p-2 rounded-lg mr-3 ${
                  selectedPaymentMethod === method.id ? 'bg-primary' : 'bg-gray-100'
                }`}>
                  <CreditCard size={20} color={selectedPaymentMethod === method.id ? 'white' : '#6B7280'} />
                </View>
                <View className="flex-1">
                  <Text className={`font-medium ${
                    selectedPaymentMethod === method.id ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {method.brand} •••• {method.last4}
                  </Text>
                  {method.isDefault && (
                    <Text className="text-xs text-gray-500">Default</Text>
                  )}
                </View>
                <View className={`w-6 h-6 rounded-full border-2 ${
                  selectedPaymentMethod === method.id ? 'border-primary bg-primary' : 'border-gray-300'
                } items-center justify-center`}>
                  {selectedPaymentMethod === method.id && <View className="w-2 h-2 bg-white rounded-full" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View className="mt-6 mx-5 bg-white rounded-2xl p-5">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Session Summary</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Date & Time</Text>
              <Text className="text-gray-900 font-medium">
                {selectedDate.toLocaleDateString()} {selectedTime && `at ${selectedTime}`}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Session Type</Text>
              <Text className="text-gray-900 font-medium">{selectedSession?.name}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Duration</Text>
              <Text className="text-gray-900 font-medium">{selectedSession?.duration}</Text>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between">
              <Text className="text-lg font-semibold text-gray-900">Total</Text>
              <Text className="text-lg font-semibold text-primary">${selectedSession?.price}</Text>
            </View>
          </View>
        </View>

        {/* Book Button */}
        <View className="p-5 pb-8">
          <PrimaryButton
            title={
              isCreatingPayment 
                ? "Processing..." 
                : `Book Session - $${selectedSession?.price}`
            }
            onPress={() => {
              if (!isCreatingPayment) {
                handleBookSession();
              }
            }}
          />
          {isCreatingPayment && (
            <View className="flex-row items-center justify-center mt-2">
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text className="text-gray-600 ml-2">Creating secure payment...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* WebView Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
            <TouchableOpacity onPress={handleCloseWebView}>
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
          <WebView
            source={paymentPageUrl ? { uri: paymentPageUrl } : { uri: "google.com" }} // Default to blank if no content
            onNavigationStateChange={handleWebViewNavigationStateChange}
            onError={handleWebViewError}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView HTTP Error:', nativeEvent.statusCode, nativeEvent.description);
            }}
            // Adjusted onLoadStart to log the source being used (html or uri)
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
            allowsProtectedMedia={false}
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
  );
}