import { checkIsStudent } from "@/api/api";
import { createPaymentLink } from "@/api/payment";
import {
    getPsychiatristById
} from "@/api/psychiatrist";
import { API_URL, PORT, host, server_URL } from "@/config/config.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Stethoscope } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import BookingCalendar from '../../../components/BookingCalendar';
import { PrimaryButton } from '../../components/Buttons';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  isBooked?: boolean;
  isAvailable?: boolean; 
}

interface Psychiatrist {
  id: number;
  name: string;
  email: string;
  avatar: string;
  title: string;
  specialities: string[]; // Backend uses 'specialities' not 'specialties'
  isAvailable: boolean;
  description: string;
  rating: number;
  sessionFee: number;
  experience?: string;
  languages?: string[];
}

interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

import { Platform } from 'react-native';

let API_BASE_URL = '';
if (host == "server"){
  API_BASE_URL = `${server_URL}/api`;
}

const fetchTimeSlots = async (psychiatristId: string, date: Date): Promise<TimeSlot[]> => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();
  const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  try {
    const isCalendarCheck = !!(new Error()).stack?.includes('fetchMonthlyAvailability');
    
    if (!isCalendarCheck) {
      console.log(`[API] Fetching psychiatrist timeslots for ${formattedDate} (psychiatrist ${psychiatristId})`);
    }
    
    const token = await AsyncStorage.getItem('token');
    
    // Try using the sessions endpoint like counselors
    const apiUrl = `${API_BASE_URL}/sessions/psychiatrist-timeslots/${psychiatristId}/${formattedDate}`;
    
    if (!isCalendarCheck) {
      console.log(`[API] Request URL: ${apiUrl}`);
      console.log(`[API] Token available: ${!!token}`);
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!isCalendarCheck) {
      console.log(`[API] Response status: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle response format similar to counselor endpoint
    let slotsArray = data;
    
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      slotsArray = data.slots || data.timeSlots || data.data || data.timeslots || [];
    }
    
    if (!Array.isArray(slotsArray)) {
      // console.warn(`API response for ${formattedDate} is not an array:`, slotsArray);
      return [];
    }
    
    const formattedSlots = slotsArray.map((slot: any) => ({
      id: slot.id || `time-${slot.time}`,
      time: slot.time,
      available: slot.isAvailable || slot.available || false,
      isBooked: slot.isBooked || false
    }));
    
    // if (isCalendarCheck) {
    //   console.log(`[API] Found ${formattedSlots.length} slots for ${formattedDate}, ${formattedSlots.filter(s => s.available).length} available`);
    // } else {
    //   console.log(`[API] Timeslots for ${formattedDate}:`, formattedSlots);
    // }
    
    return formattedSlots;
  } catch (error) {
    const isCalendarCheck = !!(new Error()).stack?.includes('fetchMonthlyAvailability');
    
    console.error(`[API] Error fetching time slots for ${formattedDate}:`, error);
    console.error(`[API] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      psychiatristId,
      formattedDate,
      apiUrl: `${API_BASE_URL}/sessions/psychiatrist-timeslots/${psychiatristId}/${formattedDate}`,
      isCalendarCheck
    });
    
    if (isCalendarCheck) {
      // For calendar checks, return empty array on error to avoid cluttering UI
      return []; 
    } else {
      // For user selections, provide some mock data for testing
      console.log(`[API] API call failed, providing mock time slots for development/testing purposes`);
      console.log(`[API] This helps test the UI when the backend endpoint is not available`);
      
      // Return mock time slots for testing (weekday availability)
      const date = new Date(formattedDate);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        return [
          { id: '1', time: '09:00', available: true, isBooked: false },
          { id: '2', time: '10:00', available: true, isBooked: false },
          { id: '3', time: '11:00', available: false, isBooked: true },
          { id: '4', time: '14:00', available: true, isBooked: false },
          { id: '5', time: '15:00', available: true, isBooked: false },
          { id: '6', time: '16:00', available: false, isBooked: true }
        ];
      } else {
        // Weekend - no availability
        return [];
      }
    }
  }
};



// Fetch monthly availability from backend API
// This function calls the new monthly availability endpoint
const fetchMonthlyAvailability = async (psychiatristId: string, year: number, month: number): Promise<{ [dateKey: string]: { isAvailable: boolean, hasImmediateSlot?: boolean } }> => {
  // Month is 0-indexed in JS Date, but we want 1-indexed for API
  const monthForApi = month + 1;
  const monthString = String(monthForApi).padStart(2, '0');
  
  console.log(`[API] Fetching psychiatrist availability for ${year}-${monthString} (psychiatrist ${psychiatristId})`);
  
  try {
    const token = await AsyncStorage.getItem('token');
    
    const apiUrl = `${API_BASE_URL}/sessions/counselors/${psychiatristId}/availability/${year}/${monthForApi}`;
    
    console.log(`[API] Request URL: ${apiUrl}`);
    console.log(`[API] Token available: ${!!token}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`[API] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[API] Monthly availability response:`, data);
    
    // Process the new response format
    const formattedData: { [dateKey: string]: { isAvailable: boolean, hasImmediateSlot?: boolean } } = {};
    
    if (data.success && data.data && data.data.availability) {
      data.data.availability.forEach((dayData: any) => {
        const dateKey = dayData.date; // Already in YYYY-MM-DD format
        const slots = dayData.slots || [];
        
        // Check if any slots are available for this day
        const hasAvailableSlot = slots.some((slot: any) => slot.isAvailable === true && slot.isBooked === false);
        
        // Check if there's an immediate slot (within next few hours)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const slotDate = new Date(dateKey);
        
        let hasImmediateSlot = false;
        if (slotDate.toDateString() === today.toDateString()) {
          // Today - check for slots in the next 4 hours
          hasImmediateSlot = slots.some((slot: any) => {
            if (!slot.isAvailable || slot.isBooked) return false;
            const hour = parseInt(slot.time.split(':')[0], 10);
            return hour >= now.getHours() && hour <= now.getHours() + 4;
          });
        }
        
        formattedData[dateKey] = {
          isAvailable: hasAvailableSlot,
          hasImmediateSlot
        };
      });
    }
    
    console.log(`[API] Successfully processed availability for ${Object.keys(formattedData).length} days in ${year}-${monthString}`);
    console.log(`[API] Available days: ${Object.keys(formattedData).filter(key => formattedData[key].isAvailable).join(', ') || 'None'}`);
    
    return formattedData;
  } catch (error) {
    console.error(`[API] Error fetching monthly availability for ${year}-${month + 1}:`, error);
    throw error;
  }
};

export default function BookPsychiatristScreen() {
  const params = useLocalSearchParams();
  const psychiatristId = params.psychiatristId as string;
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [concerns, setConcerns] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [monthlyAvailability, setMonthlyAvailability] = useState<{[dateKey: string]: {isAvailable: boolean, hasImmediateSlot?: boolean}}>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState<boolean>(false);
  const [monthCache, setMonthCache] = useState<{[key: string]: {[dateKey: string]: {isAvailable: boolean, hasImmediateSlot?: boolean}}}>({});
  
  // Time slot states
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);
  
  // Psychiatrist data state
  const [psychiatrist, setPsychiatrist] = useState<Psychiatrist | null>(null);
  const [isLoadingPsychiatrist, setIsLoadingPsychiatrist] = useState<boolean>(true);

  // Student-specific states
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isCheckingStudentStatus, setIsCheckingStudentStatus] = useState<boolean>(true);

  // Payment states
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentPageUrl, setPaymentPageUrl] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

  // Fetch psychiatrist data when component mounts
  useEffect(() => {
    const fetchPsychiatristData = async () => {
      try {
        setIsLoadingPsychiatrist(true);
        const psychiatristData = await getPsychiatristById(parseInt(psychiatristId));
        setPsychiatrist(psychiatristData);
      } catch (error) {
        console.log('Error fetching psychiatrist data:', error);
        Alert.alert('Error', 'Failed to load psychiatrist information. Please try again later.');
      } finally {
        setIsLoadingPsychiatrist(false);
      }
    };

    if (psychiatristId) {
      fetchPsychiatristData();
    }
  }, [psychiatristId]);

  // Load initial monthly availability for current month
  useEffect(() => {
    if (psychiatrist?.id) {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      handleMonthChange(currentYear, currentMonth);
    }
  }, [psychiatrist]);

  // Fetch time slots when selected date changes
  useEffect(() => {
    const fetchPsychiatristTimeSlots = async () => {
      if (!psychiatristId || !selectedDate) {
        console.log(`[Psychiatrist TimeSlots] Missing data - psychiatristId: ${psychiatristId}, selectedDate: ${selectedDate}`);
        return;
      }
      
      try {
        setIsLoadingTimeSlots(true);
        
        const timeSlots = await fetchTimeSlots(psychiatristId, selectedDate);
        
        console.log(`[Psychiatrist TimeSlots] Fetched ${timeSlots.length} time slots for ${selectedDate.toLocaleDateString()}:`, timeSlots);
        
        setTimeSlots(timeSlots);
        
        // Clear selected time slot if the date changes
        setSelectedTimeSlot('');
      } catch (error) {
        console.error(`[Psychiatrist TimeSlots] Error fetching time slots for ${selectedDate.toLocaleDateString()}:`, error);
        setTimeSlots([]);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };

    fetchPsychiatristTimeSlots();
  }, [psychiatristId, selectedDate]);

  useEffect(() => {
    const checkStudentStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const studentStatus = await checkIsStudent(token);
          setIsStudent(studentStatus);
        }
      } catch (error) {
        console.log('Error checking student status:', error);
      } finally {
        setIsCheckingStudentStatus(false);
      }
    };
    
    checkStudentStatus();
  }, []);

  // Function to handle booking
  const handleBookSession = async () => {
    if (!psychiatrist) return;
    
    const errors: {timeSlot?: boolean} = {};
    
    if (!selectedTimeSlot) {
      errors.timeSlot = true;
      Alert.alert('Time Slot Required', 'Please select an available time slot to continue.');
      return;
    }
    
    if (!selectedDate) {
      Alert.alert('Date Required', 'Please select a date for your consultation.');
      return;
    }

    const amount = psychiatrist.sessionFee;
    setIsCreatingPayment(true);

    try {
      const authToken = await AsyncStorage.getItem('token') || '';
      
      // Show confirmation dialog
      Alert.alert(
        'Confirm Psychiatrist Consultation',
        `You are about to book a consultation with Dr. ${psychiatrist.name} on ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot}.\n\nFee: Rs.${amount}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsCreatingPayment(false)
          },
          {
            text: 'Confirm & Pay',
            onPress: async () => {
              try {
                // Use the payment link creation for actual payment
                const paymentData = {
                  amount: amount,
                  currency: 'LKR',
                  sessionType: 'psychiatrist',
                  sessionDetails: {
                    date: selectedDate.toISOString().split('T')[0],
                    time: selectedTimeSlot,
                    counselorId: psychiatristId.toString()
                  }
                };

                console.log('Creating payment link for psychiatrist session:', paymentData);
                
                const paymentResponse = await createPaymentLink(paymentData, authToken);
                
                if (paymentResponse.success && paymentResponse.data) {
                  const hash = paymentResponse.data.userhash;
                  const orderId = paymentResponse.data.orderId;
                  
                  console.log('Booking data being sent:', {
                      amount,
                      hash,
                      orderId
                  });

                  setPaymentPageUrl(API_URL + ':' + PORT + `/payment-loader?hash=${hash}&orderId=${orderId}&amount=${amount}`);
                  setShowWebView(true);
                  setCurrentOrderId(orderId);
                } else {
                  Alert.alert('Error', 'Failed to create payment link. Please try again.');
                }
              } catch (error) {
                console.log('Error creating payment:', error);
                Alert.alert('Error', 'Failed to process payment. Please try again.');
              } finally {
                setIsCreatingPayment(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.log('Error handling consultation booking:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsCreatingPayment(false);
    }
  };

  // Handle WebView navigation state changes
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
      
      // Extract the order ID from the URL
      const orderId = navState.url.split('orderId=')[1]?.split('&')[0] || currentOrderId || 'N/A';
      console.log('📝 Order ID extracted:', orderId);
      
      // Make API call to book the session
      const bookSession = async () => {
        try {
          // Get the authentication token from AsyncStorage
          const authToken = await AsyncStorage.getItem('token') || '';
          console.log('🔑 Auth token present:', !!authToken);
          
          // Prepare the request body
          const bookingRequestBody = {
            counselorId: psychiatrist!.id, // Map psychiatristId to counselorId for API compatibility
            date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
            timeSlot: selectedTimeSlot,
            duration: 50, // 50 minute session
            price: psychiatrist!.sessionFee,
            concerns: concerns
          };
          
          console.log('📤 Sending psychiatrist booking request to API:', bookingRequestBody);
          console.log('🔗 API URL:', `${API_BASE_URL}/sessions/book`);
          
          // Set up a timeout for the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          // Call the session booking API
          const bookingResponse = await fetch(`${API_BASE_URL}/sessions/book`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(bookingRequestBody),
            signal: controller.signal
          });
          
          // Clear the timeout
          clearTimeout(timeoutId);
          
          console.log('📥 API Response Status:', bookingResponse.status);
          
          if (!bookingResponse.ok) {
            // Get more details about the error
            const errorText = await bookingResponse.text();
            // console.log('🚫 API Error Response:', errorText);
            throw new Error(`API error: ${bookingResponse.status}, ${errorText}`);
          }
          
          const bookingData = await bookingResponse.json();
          console.log('✅ Psychiatrist session booking successful:', bookingData);
          
          // Show success message
          Alert.alert(
            'Consultation Booked Successfully! 🎉',
            `Your consultation with Dr. ${psychiatrist?.name} has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot}.\n\nOrder ID: ${orderId}`,
            [
              {
                text: 'View My Sessions',
                onPress: () => router.push('/session/sessionHistory')
              },
              {
                text: 'OK',
                onPress: () => router.back()
              }
            ]
          );
        } catch (error) {
          console.log('❌ Error booking psychiatrist session:', error);
          
          // Even if booking API call fails, the payment was successful
          Alert.alert(
            'Payment Successful',
            `Your payment was successful, but there was an issue finalizing your booking. Our team will contact you to confirm your consultation.\n\nOrder ID: ${orderId}`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      };
      
      // Execute the booking function
      bookSession();
      
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

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView error:', nativeEvent);
    setShowWebView(false);
    Alert.alert(
      'Connection Error',
      'There was an error loading the payment page. Please check your internet connection and try again.',
      [{ text: 'OK', onPress: () => setShowWebView(false) }]
    );
  };



  // Function to format month key for caching
  const formatMonthKey = (year: number, month: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  };

  // Load monthly availability when month changes
  const handleMonthChange = async (year: number, month: number) => {
    if (!psychiatrist) {
      console.log(`[Psychiatrist Calendar] No psychiatrist data available for availability check`);
      return;
    }
    
    const monthKey = formatMonthKey(year, month);
    
    // Check if we already have cached data for this month
    if (monthCache[monthKey]) {
      console.log(`[Psychiatrist Calendar] Using cached data for ${monthKey}`);
      setMonthlyAvailability(monthCache[monthKey]);
      return;
    }
    
    setIsLoadingAvailability(true);
    
    try {
      console.log(`[Psychiatrist Calendar] Fetching availability for ${year}-${month + 1} (psychiatrist ${psychiatrist.id})`);
      
      const availability = await fetchMonthlyAvailability(psychiatrist.id.toString(), year, month);
      
      // Cache the result
      setMonthCache(prev => ({
        ...prev,
        [monthKey]: availability
      }));
      
      setMonthlyAvailability(availability);
      
      console.log(`[Psychiatrist Calendar] Successfully loaded availability for ${monthKey}:`, 
        `${Object.keys(availability).length} days total, ` +
        `${Object.values(availability).filter(day => day.isAvailable).length} available`);
      
    } catch (error) {
      console.error(`[Psychiatrist Calendar] Failed to load monthly availability for ${monthKey}:`, error);
      setMonthlyAvailability({});
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  if (isLoadingPsychiatrist) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600">Loading psychiatrist information...</Text>
      </SafeAreaView>
    );
  }

  if (!psychiatrist) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Psychiatrist not found</Text>
        <TouchableOpacity 
          className="mt-4 px-6 py-2 bg-primary rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-lg font-semibold">Book Consultation</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Psychiatrist Info */}
        <View className="bg-white mx-5 mt-5 p-5 rounded-2xl">
          <View className="flex-row items-center">
            {!imageError ? (
              <Image
                source={{ uri: psychiatrist.avatar }}
                className="w-16 h-16 rounded-full bg-gray-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-gray-300 justify-center items-center">
                <Text className="text-gray-600 font-semibold">
                  {psychiatrist.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </Text>
              </View>
            )}
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-900">Dr. {psychiatrist.name}</Text>
              <Text className="text-sm text-gray-500">{psychiatrist.title}</Text>
              <View className="flex-row flex-wrap mt-2">
                {(psychiatrist.specialities || []).map((specialty: string, index: number) => (
                  <Text 
                    key={specialty} 
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg mr-1 mb-1"
                  >
                    {specialty}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Medical Professional Info */}
        <View className="bg-purple-50 mx-5 mt-4 p-5 rounded-2xl">
          <View className="flex-row items-center mb-3">
            <Stethoscope size={20} color="#7C3AED" />
            <Text className="text-lg font-semibold text-purple-900 ml-2">Medical Consultation</Text>
          </View>
          <Text className="text-purple-800 text-sm leading-5">
            This is a medical consultation with a licensed psychiatrist. Dr. {psychiatrist.name} can prescribe medication and provide comprehensive mental health treatment.
          </Text>
        </View>

        {/* Date Selection */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">Select Date</Text>
          <View className="px-5">
            <BookingCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              availabilityData={monthlyAvailability}
              isLoading={isLoadingAvailability}
              onMonthChange={handleMonthChange}
              minDate={new Date()} // Set minimum date to today
            />
          </View>
          <Text className="text-gray-500 text-sm px-5 mt-2">
            Available Monday to Friday. Weekend consultations may be available upon request.
          </Text>
        </View>

        {/* Time Selection */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">Available Times</Text>
          <View className="px-5">
            {isLoadingTimeSlots ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text className="mt-2 text-gray-600">Loading available times...</Text>
              </View>
            ) : timeSlots.filter(slot => slot.available && !slot.isBooked).length > 0 ? (
              <View className="flex-row flex-wrap">
                {timeSlots
                  .filter(slot => slot.available && !slot.isBooked)
                  .sort((a, b) => {
                    // Sort by time in ascending order (earlier times first)
                    // Extract hours and minutes from time strings (assuming format like "09:00" or "9:00 AM")
                    const getTimeValue = (timeStr: string) => {
                      const [hourStr, minuteStr] = timeStr.split(':');
                      let hour = parseInt(hourStr, 10);
                      const isPM = timeStr.toLowerCase().includes('pm');
                      
                      // Convert to 24-hour format if AM/PM is specified
                      if (isPM && hour < 12) hour += 12;
                      if (!isPM && hour === 12) hour = 0;
                      
                      const minute = parseInt(minuteStr, 10) || 0;
                      return hour * 60 + minute;  // Convert to minutes for comparison
                    };
                    
                    return getTimeValue(a.time) - getTimeValue(b.time);
                  })
                  .map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => setSelectedTimeSlot(slot.time)}
                      className={`mr-2 mb-2 px-4 py-2 rounded-xl ${
                        selectedTimeSlot === slot.time 
                          ? 'bg-purple-600' 
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <Text 
                        className={`text-sm font-medium ${
                          selectedTimeSlot === slot.time 
                            ? 'text-white' 
                            : 'text-gray-900'
                        }`}
                      >
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  ))
                }
              </View>
            ) : (
              <View className="py-6 items-center">
                <Text className="text-gray-600 text-center">
                  {timeSlots.length === 0 
                    ? "No time slots available for this date."
                    : "All time slots are booked for this date."
                  }
                </Text>
                <Text className="text-gray-500 text-sm mt-1 text-center">
                  Please select another date or contact the psychiatrist directly.
                </Text>
                <Text className="text-xs text-gray-400 mt-2 text-center">
                  Note: Psychiatrist scheduling system is currently being integrated.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Concerns/Notes */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">What would you like to discuss?</Text>
          <View className="mx-5 bg-white rounded-2xl p-4">
            <TextInput
              value={concerns}
              onChangeText={setConcerns}
              placeholder="Please describe your symptoms, concerns, or the reason for seeking psychiatric consultation..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-gray-900 min-h-[100px]"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text className="text-gray-500 text-sm px-5 mt-2">
            This information will help the psychiatrist prepare for your consultation.
          </Text>
        </View>

        {/* Summary */}
        <View className="mt-6 mx-5 bg-white rounded-2xl p-5">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Consultation Summary</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Date & Time</Text>
              <Text className="text-gray-900 font-medium text-right">
                {selectedDate.toLocaleDateString()}
                {selectedTimeSlot && ` at ${selectedTimeSlot}`}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Type</Text>
              <Text className="text-gray-900 font-medium">Medical Consultation</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Duration</Text>
              <Text className="text-gray-900 font-medium">30-45 min</Text>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-gray-900">Consultation Fee</Text>
              <Text className="text-lg font-semibold text-primary">Rs.{psychiatrist.sessionFee}</Text>
            </View>
          </View>
        </View>

        {/* Book Button */}
        <View className="p-5 pb-8">
          {(!selectedDate || !selectedTimeSlot) && (
            <Text className="text-center text-orange-500 mb-2 text-sm">
              {!selectedDate 
                ? "Please select a date for your consultation"
                : "Please select an available time slot"
              }
            </Text>
          )}
          <PrimaryButton
            title={
              isCreatingPayment 
                ? "Processing..." 
                : `Book Consultation - Rs.${psychiatrist.sessionFee}`
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
              <Text className="text-gray-600 ml-2">Processing consultation booking...</Text>
            </View>
          )}
          <Text className="text-center text-gray-500 text-sm mt-3">
            Secure payment processing via PayHere
          </Text>
        </View>
      </ScrollView>

      {/* WebView Modal for Payment */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowWebView(false)} className="p-1">
                <ArrowLeft size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">Payment</Text>
              <View className="w-6" />
            </View>
          </View>
          
          <WebView
            style={{ flex: 1 }}
            source={paymentPageUrl ? { uri: paymentPageUrl } : { uri: "about:blank" }} 
            onNavigationStateChange={handleWebViewNavigationStateChange}
            onError={handleWebViewError}
            startInLoadingState={true}
            renderLoading={() => (
              <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text className="text-gray-600 mt-4">Loading payment page...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
