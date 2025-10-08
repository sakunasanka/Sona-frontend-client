//16
import { checkIsStudent } from "@/api/api";
import { Counselor } from "@/api/counselor";
import { createPaymentLink } from "@/api/payment";
import { getRemainingFreeSessions } from "@/api/sessions";
import { API_URL, PORT } from "@/config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Calendar, GraduationCap } from 'lucide-react-native';
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

export const title = 'Book Session';

export const options = {
  title: 'Book Session',
  headerShown: false,
};

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  isBooked?: boolean;
  isAvailable?: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

// Note: per-day timeslot fetching has been removed; we now rely on the monthly availability API

import { Platform } from 'react-native';

let API_BASE_URL = '';
if (Platform.OS === 'android') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
}

// Use the getRemainingFreeSessions function from the API
const formatMonthKey = (year: number, month: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

// Helper function for formatting a date as YYYY-MM-DD consistently
const formatDateKey = (year: number, month: number, day: number): string => {
  // month is 0-indexed in JS Date but we want 1-indexed in our format
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const formatResetDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const resetDate = new Date(date);
    resetDate.setHours(0, 0, 0, 0);
    
    if (resetDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (resetDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    console.warn('Invalid date string:', dateString);
    return dateString;
  }
};

// Fetch monthly availability + slots from the backend API in one call
const fetchMonthlyAvailability = async (
  counsellorId: string,
  year: number,
  month: number // 0-indexed (JS)
): Promise<{
  availabilityMap: { [dateKey: string]: { isAvailable: boolean; hasImmediateSlot?: boolean } };
  slotsMap: { [dateKey: string]: TimeSlot[] };
}> => {
  try {
    const monthForApi = month + 1; // convert to 1-indexed
    const url = `${API_BASE_URL}/sessions/counselors/${counsellorId}/availability/${year}/${monthForApi}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();

    const availabilityArr: Array<{ date: string; slots: any[] }> = json?.data?.availability || [];

    const availabilityMap: { [dateKey: string]: { isAvailable: boolean; hasImmediateSlot?: boolean } } = {};
    const slotsMap: { [dateKey: string]: TimeSlot[] } = {};

    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    for (const item of availabilityArr) {
      const dateKey = item.date; // already in YYYY-MM-DD
      const slots: TimeSlot[] = (item.slots || []).map((slot: any) => ({
        id: String(slot.id ?? `time-${slot.time}`),
        time: slot.time,
        available: !!(slot.isAvailable ?? slot.available),
        isBooked: !!slot.isBooked,
        isAvailable: !!(slot.isAvailable ?? slot.available),
      }));

      const hasAvailable = slots.some((s) => s.available && !s.isBooked);

      // Optional: simple immediate slot check for today only
      let hasImmediateSlot = false;
      if (dateKey === todayKey) {
        const now = new Date();
        hasImmediateSlot = slots.some((s) => {
          if (!s.available || s.isBooked) return false;
          const [h, m] = s.time.split(":").map((v: string) => parseInt(v, 10));
          const minutes = h * 60 + (isNaN(m) ? 0 : m);
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          return minutes >= nowMinutes && minutes <= nowMinutes + 240; // next 4 hours
        });
      }

      availabilityMap[dateKey] = { isAvailable: hasAvailable, hasImmediateSlot };
      slotsMap[dateKey] = slots;
    }

    return { availabilityMap, slotsMap };
  } catch (err) {
    throw err;
  }
};

export default function BookSessionScreen() {
  const params = useLocalSearchParams();
  const counselorId = params.counselorId as string;
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('video');
  const [concerns, setConcerns] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [monthlyAvailability, setMonthlyAvailability] = useState<{[dateKey: string]: {isAvailable: boolean, hasImmediateSlot?: boolean}}>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState<boolean>(false);
  const [monthCache, setMonthCache] = useState<{[key: string]: {[dateKey: string]: {isAvailable: boolean, hasImmediateSlot?: boolean}}}>({});
  const [monthSlotsCache, setMonthSlotsCache] = useState<{[key: string]: {[dateKey: string]: TimeSlot[]}}>({});
  
  // Counselor data state
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [isLoadingCounselor, setIsLoadingCounselor] = useState<boolean>(true);

  // Student-specific states
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isCheckingStudentStatus, setIsCheckingStudentStatus] = useState<boolean>(true);
  const [freeSessionsRemaining, setFreeSessionsRemaining] = useState<number>(0);
  const [nextResetDate, setNextResetDate] = useState<string>('');
  const [totalSessionsThisPeriod, setTotalSessionsThisPeriod] = useState<number>(0);
  const [loadingStudentData, setLoadingStudentData] = useState<boolean>(false);

  // WebView states for payment processing
  const [showWebView, setShowWebView] = useState(false);
  const [paymentPageUrl, setPaymentPageUrl] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    timeSlot?: boolean;
  }>({});

  // Fetch counselor data when component mounts
  useEffect(() => {
    const fetchCounselorData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/counselors/${counselorId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch counselor data');
        }
        const data = await response.json();
        if (data.success && data.data.counselor) {
          setCounselor(data.data.counselor);
        } else {
          throw new Error('Invalid counselor data');
        }
      } catch (error) {
        console.error('Error fetching counselor data:', error);
        Alert.alert('Error', 'Failed to load counselor information. Please try again later.');
      } finally {
        setIsLoadingCounselor(false);
      }
    };

    fetchCounselorData();
  }, [counselorId]);

  // Check if user is a student when component mounts
  useEffect(() => {
    const checkStudentStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const studentStatus = await checkIsStudent(token);
          setIsStudent(studentStatus);
          
          // If student, fetch remaining free sessions
          if (studentStatus) {
            await fetchStudentSessionsData(token);
          }
        }
      } catch (error) {
        console.error('Error checking student status:', error);
      } finally {
        setIsCheckingStudentStatus(false);
      }
    };
    
    checkStudentStatus();
  }, []);
  
  // Separate function to fetch student sessions data
  const fetchStudentSessionsData = async (token: string) => {
    setLoadingStudentData(true);
    try {
      const freeSessionsResponse = await getRemainingFreeSessions(token);
      if (freeSessionsResponse && freeSessionsResponse.data) {
        const sessionInfo = freeSessionsResponse.data;
        setFreeSessionsRemaining(sessionInfo.remainingSessions);
        setNextResetDate(sessionInfo.nextResetDate);
        setTotalSessionsThisPeriod(sessionInfo.totalSessionsThisPeriod);
      }
    } catch (error) {
      console.error('Error fetching remaining free sessions:', error);
    } finally {
      setLoadingStudentData(false);
    }
  };

  // Function to determine if the session is free
  const isSessionFree = () => {
    if (!counselor) return false;
    
    // Free for everyone if counselor is volunteer with sessionFee = 0
    if (counselor.isVolunteer && counselor.sessionFee === 0) {
      return true;
    }
    
    // Free for students if counselor is volunteer with sessionFee > 0
    if (counselor.isVolunteer && counselor.sessionFee > 0 && isStudent) {
      return true;
    }
    
    // Paid for everyone else
    return false;
  };

  const handleBookSession = async () => {
    if (!counselor) return;
    
    const errors: {timeSlot?: boolean} = {};
    
    if (!selectedTime) {
      errors.timeSlot = true;
      Alert.alert('Time Slot Required', 'Please select an available time slot to continue.');
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});

    // If session is free (either for everyone or for student)
    if (isSessionFree()) {
      try {
        const authToken = await AsyncStorage.getItem('token') || '';
        
        // Determine the type of free session
        let sessionType = '';
        if (counselor.isVolunteer && counselor.sessionFee === 0) {
          sessionType = 'free for everyone';
        } else if (counselor.isVolunteer && counselor.sessionFee > 0 && isStudent) {
          sessionType = 'free student';
        }
        
        // Book free session directly without payment
        Alert.alert(
          'Free Session',
          `You are about to book a ${sessionType} session with ${counselor.name} on ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Confirm',
              onPress: async () => {
                try {
                  // Make API call to book the free session
                  const bookingRequestBody = {
                    counselorId: counselor.id,
                    date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
                    timeSlot: selectedTime,
                    duration: 50,
                    price: 0 // Free session
                  };

                  console.log('📤 Booking free session with payload:', bookingRequestBody);

                  const bookingResponse = await fetch(`${API_BASE_URL}/sessions/book`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${authToken}`,
                      'Accept': 'application/json'
                    },
                    body: JSON.stringify(bookingRequestBody)
                  });

                  if (!bookingResponse.ok) {
                    const errorText = await bookingResponse.text();
                    console.error('🚫 Free session booking failed:', errorText);
                    throw new Error(`Booking failed: ${bookingResponse.status}`);
                  }

                  const bookingData = await bookingResponse.json();
                  console.log('✅ Free session booked successfully:', bookingData);

                  // Update remaining free sessions if it's a student session with volunteer counselor
                  if (isStudent && counselor.isVolunteer && counselor.sessionFee > 0) {
                    setFreeSessionsRemaining(prev => Math.max(0, prev - 1));
                  }
                  
                  // Show success message
                  Alert.alert(
                    'Free Session Booked Successfully! 🎉',
                    `Your ${sessionType} session with ${counselor.name} has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
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
                  console.error('Error booking free session:', error);
                  Alert.alert('Error', 'Failed to book your free session. Please try again.');
                } finally {
                  setIsCreatingPayment(false);
                }
              }
            }
          ]
        );
        return;
      } catch (error) {
        console.error('Error handling free session booking:', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
        return;
      }
    }

    // Regular paid session flow
    const amount = counselor.sessionFee || 3000; // Use counselor's session fee or default to 3000
    setIsCreatingPayment(true);
    setPaymentPageUrl(API_URL + ':' + PORT + '/payment-loader');

    try {
      const authToken = await AsyncStorage.getItem('token') || '';
      
      const response = await createPaymentLink({
          amount: amount,
          currency: 'LKR',
          sessionType: selectedSessionType,
          sessionDetails: {
            date: selectedDate.toISOString().split('T')[0],
            time: selectedTime,
            counselorId: counselor.id.toString()
          }
      }, authToken);

      const hash = response.data.userhash;
      const orderId = response.data.orderId;
      
      console.log('Booking data being sent:', {
          amount,
          hash,
          orderId
      });

      setPaymentPageUrl(API_URL + ':' + PORT + `/payment-loader?hash=${hash}&orderId=${orderId}&amount=${amount}`);
      setShowWebView(true);
      setCurrentOrderId(orderId);

    } catch (error: any) {
      // console.error('Payment initiation error:', error);
      
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

  // Load monthly availability when month changes
  const handleMonthChange = async (year: number, month: number) => {
    if (!counselor) return;
    
    console.log(`[Calendar] Month changed to: ${year}-${month+1}`);
    setIsLoadingAvailability(true);
    
    // Clear previous data while loading
    setMonthlyAvailability({});
    
    // Check if we have cached data for this month - use the formatMonthKey helper
    const cacheKey = formatMonthKey(year, month);
    console.log(`[Calendar] Checking cache for key: ${cacheKey}`, Object.keys(monthCache));
    
    if (monthCache[cacheKey]) {
      console.log(`[Calendar] Using cached availability for ${cacheKey}`);
      console.log(`[Calendar] Cached data has ${Object.keys(monthCache[cacheKey]).length} days, with ${Object.values(monthCache[cacheKey]).filter(day => day.isAvailable).length} available`);
      setMonthlyAvailability(monthCache[cacheKey]);
      setIsLoadingAvailability(false);
      return;
    }
    
    try {
      const { availabilityMap, slotsMap } = await fetchMonthlyAvailability(counselor.id.toString(), year, month);
      console.log(`[Calendar] Loaded availability for ${Object.keys(availabilityMap).length} days in ${year}-${month+1}`);
      
      const availableDays = Object.values(availabilityMap).filter(day => day.isAvailable).length;
      console.log(`[Calendar] Found ${availableDays} available days in ${year}-${month+1}`);
      
      if (availableDays === 0) {
        console.log(`[Calendar] No availability found for ${year}-${month+1}`);
      }
      
      console.log(`[Calendar] Caching data for ${cacheKey} with ${Object.keys(availabilityMap).length} days and ${Object.values(availabilityMap).filter(day => day.isAvailable).length} available days`);
      
      setMonthCache(prevCache => {
        const newCache = {
          ...prevCache,
          [cacheKey]: availabilityMap
        };
        console.log(`[Calendar] Updated cache now has keys:`, Object.keys(newCache));
        return newCache;
      });
      setMonthSlotsCache(prev => ({ ...prev, [cacheKey]: slotsMap }));
      
      setMonthlyAvailability(availabilityMap);
    } catch (error) {
      // console.error('Failed to load monthly availability:', error);
      // Alert.alert(
      //   'Error Loading Availability',
      //   'Could not load counselor availability. Please check your connection and try again.',
      //   [{ text: 'Retry', onPress: () => handleMonthChange(year, month) }]
      // );
      setMonthlyAvailability({});
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    if (!counselor) return;
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const day = date.getDate();
    
    const dateKey = formatDateKey(year, month - 1, day); // Subtract 1 from month since we added 1 earlier
    
    console.log(`Selected date: ${date.toLocaleDateString()}, API date key: ${dateKey}`);
    
    setSelectedDate(date);
    
    const isAvailable = monthlyAvailability[dateKey]?.isAvailable === true;
    // Load time slots from cache immediately when available
    const cacheKey = formatMonthKey(year, date.getMonth());
    const monthSlots = monthSlotsCache[cacheKey];
    if (monthSlots && monthSlots[dateKey]) {
      setTimeSlots(monthSlots[dateKey]);
    } else {
      setTimeSlots([]);
    }
  };

  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const initialMonthKey = formatMonthKey(currentYear, currentMonth);
    console.log(`[Calendar] Initial load for ${initialMonthKey}`);
    
    handleMonthChange(currentYear, currentMonth);
  }, [counselor]);
  
  useEffect(() => {
    if (!counselor) return;
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    const dateKey = formatDateKey(year, month, day);
    const cacheKey = formatMonthKey(year, month);

    console.log(`[Calendar] Selected date key: ${dateKey}`);
    setIsLoadingSlots(true);
    setSelectedTime('');

    const monthSlots = monthSlotsCache[cacheKey];
    if (monthSlots && monthSlots[dateKey]) {
      const slots = monthSlots[dateKey];
      console.log(`[Calendar] Loaded ${slots.length} time slots from monthly cache for ${selectedDate.toDateString()}`);
      setTimeSlots(slots);
      setIsLoadingSlots(false);
    } else {
      // If the month isn't cached yet (e.g., direct navigation), fetch monthly and then update
      handleMonthChange(year, month)
        .finally(() => setIsLoadingSlots(false));
    }
  }, [selectedDate, counselor, monthSlotsCache]);

  const TimeSlot = ({ slot }: { slot: TimeSlot }) => {
    const isSelected = selectedTime === slot.time;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedTime(slot.time)}
        className={`mr-2 mb-2 px-4 py-2 rounded-xl ${
          isSelected 
            ? 'bg-primary' 
            : 'bg-white border border-gray-200'
        }`}
      >
        <Text 
          className={`text-sm font-medium ${
            isSelected 
              ? 'text-white' 
              : 'text-gray-900'
          }`}
        >
          {slot.time}
        </Text>
      </TouchableOpacity>
    );
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
            counselorId: counselor?.id,
            date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
            timeSlot: selectedTime,
            duration: 50, // 50 minute session
            price: counselor?.sessionFee || 3000 // Use counselor's fee or default to 3000
          };
          
          console.log('📤 Sending booking request to API:', bookingRequestBody);
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
            // console.error('🚫 API Error Response:', errorText);
            throw new Error(`API error: ${bookingResponse.status}, ${errorText}`);
          }
          
          const bookingData = await bookingResponse.json();
          console.log('✅ Session booking successful:', bookingData);
          
          // Show success message
          Alert.alert(
            'Session Booked Successfully! 🎉',
            `Your session with ${counselor?.name} has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTime}.\n\nOrder ID: ${orderId}`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } catch (error) {
          // console.error('❌ Error booking session:', error);
          
          // Even if booking API call fails, the payment was successful
          Alert.alert(
            'Payment Successful',
            `Your payment was successful, but there was an issue finalizing your booking. Our team will contact you to confirm your session.\n\nOrder ID: ${orderId}`,
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

  // Function to determine the session fee display
  const getSessionFeeDisplay = () => {
    if (!counselor) return null;
    
    // Free for everyone if counselor is volunteer with sessionFee = 0
    if (counselor.isVolunteer && counselor.sessionFee === 0) {
      return <Text className="text-lg font-semibold text-green-600">FREE</Text>;
    }
    
    // Free for students if counselor is volunteer with sessionFee > 0
    if (counselor.isVolunteer && counselor.sessionFee > 0 && isStudent) {
      return <Text className="text-lg font-semibold text-green-600">FREE</Text>;
    }
    
    // Paid for everyone else
    return <Text className="text-lg font-semibold text-primary">Rs.{counselor.sessionFee}</Text>;
  };

  // Define missing WebView handling functions
  const handleCloseWebView = () => {
    setShowWebView(false);
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    Alert.alert(
      'Error',
      'There was a problem loading the payment page. Please try again.',
      [{ text: 'OK', onPress: () => setShowWebView(false) }]
    );
  };

  if (isLoadingCounselor) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600">Loading counselor information...</Text>
      </SafeAreaView>
    );
  }

  if (!counselor) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Counselor not found</Text>
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

      {/* Remove extra padding at the top - it's causing inconsistent spacing */}
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
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
                source={{ uri: counselor.avatar }}
                className="w-16 h-16 rounded-full bg-gray-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-gray-300 justify-center items-center">
                <Text className="text-gray-600 font-semibold">
                  {counselor.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Text>
              </View>
            )}
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-900">{counselor.name}</Text>
              <Text className="text-sm text-gray-500">{counselor.title}</Text>
              <View className="flex-row flex-wrap mt-2">
                {counselor.specialties?.map((specialty: string, index: number) => (
                  <Text 
                    key={specialty} 
                    className="text-xs bg-blue-100 text-primary px-2 py-1 rounded-lg mr-1 mb-1"
                  >
                    {specialty}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Counselor Info Section */}
        {isCheckingStudentStatus ? (
          <View className="bg-white mx-5 mt-4 p-5 rounded-2xl items-center">
            <ActivityIndicator size="small" color="#2563EB" />
            <Text className="text-gray-500 mt-2">Checking student status...</Text>
          </View>
        ) : (counselor.isVolunteer && counselor.sessionFee === 0) ? (
          <View className="bg-green-50 mx-5 mt-4 p-5 rounded-2xl">
            <View className="flex-row items-center mb-3">
              <GraduationCap size={20} color="#059669" />
              <Text className="text-lg font-semibold text-green-900 ml-2">
                Free Counselor
              </Text>
            </View>
            <Text className="text-green-700 text-sm">
              This counselor provides free sessions for everyone.
            </Text>
          </View>
        ) : (counselor.isVolunteer && counselor.sessionFee > 0 && isStudent) ? (
          <View className="bg-green-50 mx-5 mt-4 p-5 rounded-2xl">
            <View className="flex-row items-center mb-3">
              <GraduationCap size={20} color="#059669" />
              <Text className="text-lg font-semibold text-green-900 ml-2">
                Volunteer Counselor
              </Text>
            </View>
            <View className="mt-3 bg-indigo-100/60 p-3 rounded-lg">
              <View className="flex-row items-center">
                <GraduationCap size={16} color="#4F46E5" className="mr-2" />
                <Text className="text-indigo-800 font-medium">Student Benefits Apply</Text>
              </View>
              <Text className="text-indigo-700 text-sm mt-1">
                As a verified student, you get free sessions with this volunteer counselor.
                {!loadingStudentData && ` Sessions count toward your ${freeSessionsRemaining} remaining free student sessions.`}
              </Text>
              {nextResetDate && (
                <View className="flex-row items-center mt-2">
                  <Calendar size={14} color="#4F46E5" className="mr-1" />
                  <Text className="text-indigo-800 text-xs font-medium">
                    Plan resets on {formatResetDate(nextResetDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : isStudent ? (
          <View className="bg-indigo-50 mx-5 mt-4 p-5 rounded-2xl">
            {loadingStudentData ? (
              <View className="items-center py-2">
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text className="text-indigo-700 text-sm mt-1">Loading your benefits...</Text>
              </View>
            ) : (
              <>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-semibold text-indigo-900">Student Benefits</Text>
                  <View className="bg-indigo-100 rounded-full px-3 py-1">
                    <Text className="text-indigo-700 font-medium">{freeSessionsRemaining} Free Sessions Left</Text>
                  </View>
                </View>
                
                <View>
                  {counselor.isVolunteer && counselor.sessionFee > 0 ? (
                    // This is a volunteer counselor that provides free sessions for students
                    freeSessionsRemaining > 0 ? (
                      <View>
                        <Text className="text-indigo-800">
                          As a verified student, you can book free sessions with volunteer counselors.
                        </Text>
                        {nextResetDate && (
                          <View className="flex-row items-center mt-2">
                            <Calendar size={14} color="#4F46E5" className="mr-1" />
                            <Text className="text-indigo-800 text-sm font-medium">
                              Plan resets on {formatResetDate(nextResetDate)}
                            </Text>
                          </View>
                        )}
                        <View className="bg-indigo-100/50 p-2 rounded-lg mt-2">
                          <Text className="text-indigo-700 text-xs text-center">
                            You've used {totalSessionsThisPeriod} of 4 free sessions this period
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <Text className="text-yellow-800">
                          You've used all your free student sessions this period. You can still book a paid session for Rs.{counselor.sessionFee}.
                        </Text>
                        {nextResetDate && (
                          <View className="flex-row items-center mt-2">
                            <Calendar size={14} color="#4F46E5" className="mr-1" />
                            <Text className="text-indigo-800 text-sm font-medium">
                              Free sessions reset on {formatResetDate(nextResetDate)}
                            </Text>
                          </View>
                        )}
                      </View>
                    )
                  ) : (
                    // This is a paid counselor
                    <View>
                      <Text className="text-indigo-800">
                        Student benefits apply only to volunteer counselors. This counselor charges Rs.{counselor.sessionFee} for sessions.
                      </Text>
                      <Text className="text-indigo-700 mt-1">
                        You have {freeSessionsRemaining} free sessions remaining with volunteer counselors.
                      </Text>
                      {nextResetDate && (
                        <View className="flex-row items-center mt-2">
                          <Calendar size={14} color="#4F46E5" className="mr-1" />
                          <Text className="text-indigo-800 text-sm font-medium">
                            Free sessions plan resets on {formatResetDate(nextResetDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        ) : null}

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
        </View>

        {/* Time Selection */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-5 mb-3">Available Times</Text>
          <View className="px-5">
            {isLoadingSlots ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="large" color="#6366F1" />
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
                    <TimeSlot key={slot.id} slot={slot} />
                  ))}
              </View>
            ) : (
              <View className="py-6 items-center">
                <Text className="text-gray-600">No available time slots for this date.</Text>
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
              placeholder="Share what's on your mind or any specific concerns you'd like to address..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-gray-900 min-h-[100px]"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Summary */}
        <View className="mt-6 mx-5 bg-white rounded-2xl p-5">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Session Summary</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Date & Time</Text>
              <Text className="text-gray-900 font-medium text-right">
                {selectedDate.toLocaleDateString()} {selectedTime && `at ${selectedTime}`}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Duration</Text>
              <Text className="text-gray-900 font-medium">50 min</Text>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-gray-900">Total</Text>
              {getSessionFeeDisplay()}
            </View>
          </View>
        </View>

        {/* Book Button */}
        <View className="p-5 pb-8">
          {/* Add specific helper message for missing time slot */}
          {!selectedTime && (
            <Text className="text-center text-orange-500 mb-2 text-sm">
              Please select a time slot
            </Text>
          )}
          {/* Show message if student has no free sessions left with volunteer counselors */}
          {isStudent && counselor.isVolunteer && counselor.sessionFee > 0 && freeSessionsRemaining === 0 && (
            <Text className="text-center text-yellow-500 mb-2 text-sm">
              You've used all your free sessions this month
            </Text>
          )}
          <PrimaryButton
            title={
              isCreatingPayment 
                ? "Processing..." 
                : isSessionFree()
                  ? "Book Free Session"
                  : `Book Session - Rs.${counselor.sessionFee}`
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
          <WebView
            source={paymentPageUrl ? { uri: paymentPageUrl } : { uri: "about:blank" }} 
            onNavigationStateChange={handleWebViewNavigationStateChange}
            onError={handleWebViewError}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              // console.warn('WebView HTTP Error:', nativeEvent.statusCode, nativeEvent.description);
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
  );
}