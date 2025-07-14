//16
import { createPaymentLink } from "@/api/payment";
import { API_URL, PORT } from "@/config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ArrowLeft } from 'lucide-react-native';
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

interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

const MOCK_COUNSELOR = {
  id: '1',
  name: 'Dr. Ugo David',
  title: 'Licensed Clinical Psychologist',
  avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  specialties: ['Anxiety', 'Depression', 'Trauma'],
  rating: 4.9,
};

const fetchTimeSlots = async (counsellorId: string, date: Date): Promise<TimeSlot[]> => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();
  const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  try {
    const isCalendarCheck = !!(new Error()).stack?.includes('fetchMonthlyAvailability');
    const timeoutMs = isCalendarCheck ? 3000 : 10000; // 3s for calendar checks, 10s for direct user selection
    
    const apiUrl = `${API_BASE_URL}/sessions/timeslots/${counsellorId}/${formattedDate}`;
    console.log(`[API] Fetching timeslots for ${formattedDate}${isCalendarCheck ? ' (calendar check)' : ''}`);
    
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    const response = await Promise.race([
      fetch(apiUrl),
      timeoutPromise
    ]) as Response;
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    let slotsArray = data;
    
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      slotsArray = data.slots || data.timeSlots || data.data || data.timeslots || [];
    }
    
    if (!Array.isArray(slotsArray)) {
      console.warn(`API response for ${formattedDate} is not an array:`, slotsArray);
      return [];
    }
    
    const formattedSlots = slotsArray.map((slot: any) => ({
      id: slot.id || `time-${slot.time}`,
      time: slot.time,
      available: slot.isAvailable || slot.available || false,
      isBooked: slot.isBooked || false
    }));
    
    if (isCalendarCheck) {
      console.log(`[API] Found ${formattedSlots.length} slots for ${formattedDate}, ${formattedSlots.filter(s => s.available).length} available`);
    } else {
      console.log(`[API] Timeslots for ${formattedDate}:`, formattedSlots);
    }
    
    return formattedSlots;
  } catch (error) {
    const isCalendarCheck = !!(new Error()).stack?.includes('fetchMonthlyAvailability');
    
    if (isCalendarCheck) {
      console.warn(`[API] Error fetching time slots for ${formattedDate} (availability check):`, error);
      return []; 
    } else {
      console.error(`[API] Error fetching time slots for ${formattedDate}:`, error);
      throw error;
    }
  }
};

import { Platform } from 'react-native';

let API_BASE_URL = '';
if (Platform.OS === 'android') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else {
  API_BASE_URL = 'http://localhost:' + PORT + '/api';
}
const formatMonthKey = (year: number, month: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

// Helper function for formatting a date as YYYY-MM-DD consistently
const formatDateKey = (year: number, month: number, day: number): string => {
  // month is 0-indexed in JS Date but we want 1-indexed in our format
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Fetch monthly availability from backend API
// This function now checks each day of the month by fetching timeslots
// and only marks a day as unavailable if it has no available timeslots
const fetchMonthlyAvailability = async (counsellorId: string, year: number, month: number): Promise<{ [dateKey: string]: { isAvailable: boolean, hasImmediateSlot?: boolean } }> => {
  // Month is 0-indexed in JS Date, but we want 1-indexed for API
  const monthForApi = month + 1;
  const monthString = String(monthForApi).padStart(2, '0');
  
  console.log(`[API] Fetching counselor availability for ${year}-${monthString}`);
  
  try {
    // Get the number of days in the month
    const daysInMonth = new Date(year, monthForApi, 0).getDate();
    const formattedData: { [dateKey: string]: { isAvailable: boolean, hasImmediateSlot?: boolean } } = {};
    
    console.log(`[API] Checking availability for ${daysInMonth} days in ${year}-${monthString}`);
    
    // Create an array of promises for fetching timeslots for each day
    const dayPromises = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      
      // Format the date key (YYYY-MM-DD)
      const dateKey = formatDateKey(year, month, day);
      
      // Return a promise for fetching timeslots for this day
      return fetchTimeSlots(counsellorId, date)
        .then(slots => {
          // Check if any timeslot is available for this day
          const hasAvailableSlot = slots.some(slot => slot.available === true);
          
          // If there are any available slots, mark the day as available
          formattedData[dateKey] = {
            isAvailable: hasAvailableSlot,
            // Check if there's an immediate slot (within next few hours)
            hasImmediateSlot: slots.some(slot => {
              if (!slot.available) return false;
              // Extract hours from time string (assuming format like "09:00" or "9:00 AM")
              const timeStr = slot.time;
              const hour = parseInt(timeStr.split(':')[0], 10);
              const now = new Date();
              // Consider slots in the next 4 hours as immediate if today
              return date.setHours(0,0,0,0) === now.setHours(0,0,0,0) && 
                     hour >= now.getHours() && 
                     hour <= now.getHours() + 4;
            })
          };
          
          console.log(`[API] Day ${dateKey}: ${hasAvailableSlot ? 'Available' : 'Not Available'} (${slots.length} slots, ${slots.filter(s => s.available).length} available)`);
          
          return formattedData[dateKey];
        })
        .catch(error => {
          console.warn(`[API] Failed to fetch timeslots for ${dateKey}:`, error);
          // If we fail to fetch for a specific day, mark it as unavailable
          formattedData[dateKey] = { isAvailable: false };
          return formattedData[dateKey];
        });
    });
    
    // Wait for all day checks to complete
    await Promise.all(dayPromises);
    
    console.log(`[API] Successfully processed availability for ${Object.keys(formattedData).length} days in ${year}-${monthString}`);
    console.log(`[API] Available days: ${Object.keys(formattedData).filter(key => formattedData[key].isAvailable).join(', ') || 'None'}`);
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching monthly availability:', error);
    throw error;
  }
};

export default function BookSessionScreen() {
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

  // WebView states for payment processing
  const [showWebView, setShowWebView] = useState(false);
  const [paymentPageUrl, setPaymentPageUrl] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    timeSlot?: boolean;
  }>({});

  const handleBookSession = async () => {
    const errors: {timeSlot?: boolean} = {};
    
    if (!selectedTime) {
      errors.timeSlot = true;
      Alert.alert('Time Slot Required', 'Please select an available time slot to continue.');
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});

    const amount = 3000; // Default amount if not specified
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
            counselorId: MOCK_COUNSELOR.id
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

  // Load monthly availability when month changes
  const handleMonthChange = async (year: number, month: number) => {
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
      const availability = await fetchMonthlyAvailability(MOCK_COUNSELOR.id, year, month);
      console.log(`[Calendar] Loaded availability for ${Object.keys(availability).length} days in ${year}-${month+1}`);
      
      const availableDays = Object.values(availability).filter(day => day.isAvailable).length;
      console.log(`[Calendar] Found ${availableDays} available days in ${year}-${month+1}`);
      
      if (availableDays === 0) {
        console.log(`[Calendar] No availability found for ${year}-${month+1}`);
      }
      
      console.log(`[Calendar] Caching data for ${cacheKey} with ${Object.keys(availability).length} days and ${Object.values(availability).filter(day => day.isAvailable).length} available days`);
      
      setMonthCache(prevCache => {
        const newCache = {
          ...prevCache,
          [cacheKey]: availability
        };
        console.log(`[Calendar] Updated cache now has keys:`, Object.keys(newCache));
        return newCache;
      });
      
      setMonthlyAvailability(availability);
    } catch (error) {
      console.error('Failed to load monthly availability:', error);
      Alert.alert(
        'Error Loading Availability',
        'Could not load counselor availability. Please check your connection and try again.',
        [{ text: 'Retry', onPress: () => handleMonthChange(year, month) }]
      );
      setMonthlyAvailability({});
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const day = date.getDate();
    
    const dateKey = formatDateKey(year, month - 1, day); // Subtract 1 from month since we added 1 earlier
    
    console.log(`Selected date: ${date.toLocaleDateString()}, API date key: ${dateKey}`);
    
    setSelectedDate(date);
    
    const isAvailable = monthlyAvailability[dateKey]?.isAvailable === true;
  };

  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const initialMonthKey = formatMonthKey(currentYear, currentMonth);
    console.log(`[Calendar] Initial load for ${initialMonthKey}`);
    
    handleMonthChange(currentYear, currentMonth);
  }, []);
  
  useEffect(() => {
    const loadTimeSlots = async () => {
      console.log(`[Calendar] Loading time slots for date: ${selectedDate.toLocaleDateString()}`);
      console.log(`[Calendar] Current availability data has ${Object.keys(monthlyAvailability).length} days with ${Object.values(monthlyAvailability).filter(day => day.isAvailable).length} available`);
      
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const dateKey = formatDateKey(year, month, day);
      
      console.log(`[Calendar] Selected date key: ${dateKey}, isAvailable according to data: ${monthlyAvailability[dateKey]?.isAvailable}`);
      
      setIsLoadingSlots(true);
      setSelectedTime('');
      
      try {
        const slots = await fetchTimeSlots(MOCK_COUNSELOR.id, selectedDate);
        console.log(`[Calendar] Loaded ${slots.length} time slots for ${selectedDate.toDateString()}, ${slots.filter(s => s.available).length} available`);
        setTimeSlots(slots);
      } catch (error) {
        console.error('Failed to load time slots:', error);
        Alert.alert(
          'Error Loading Time Slots', 
          'Could not load available times for this date. Please try again.',
          [{ text: 'OK' }]
        );
        setTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadTimeSlots();
  }, [selectedDate]);

  // We're no longer using DateCard as we're using the BookingCalendar component

  const TimeSlot = ({ slot }: { slot: TimeSlot }) => {
    const isSelected = selectedTime === slot.time;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedTime(slot.time)}
        className={`mr-3 mb-3 px-4 py-3 rounded-xl ${
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
            counselorId: MOCK_COUNSELOR.id,
            date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
            timeSlot: selectedTime,
            duration: 50, // 50 minute session
            price: 3000 // Fixed price of 3000 LKR
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
            console.error('🚫 API Error Response:', errorText);
            throw new Error(`API error: ${bookingResponse.status}, ${errorText}`);
          }
          
          const bookingData = await bookingResponse.json();
          console.log('✅ Session booking successful:', bookingData);
          
          // Show success message
          Alert.alert(
            'Session Booked Successfully! 🎉',
            `Your session with ${MOCK_COUNSELOR.name} has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTime}.\n\nOrder ID: ${orderId}`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } catch (error) {
          console.error('❌ Error booking session:', error);
          
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Added extra padding at the top to avoid notch overlap */}
      <View className="pt-6"></View>

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
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-lg font-semibold text-gray-900">Available Times</Text>
          </View>
          <View className={`px-5`}>
            {isLoadingSlots ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="mt-2 text-gray-600">Loading available times...</Text>
              </View>
            ) : timeSlots.filter(slot => slot.available && !slot.isBooked).length > 0 ? (
              <View>
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
              </View>
            ) : (
              <View className="py-8 items-center">
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
              className="text-gray-900 text-base"
              placeholderTextColor="#9CA3AF"
            />
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
              <Text className="text-gray-600">Duration</Text>
              <Text className="text-gray-900 font-medium">50 min</Text>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between">
              <Text className="text-lg font-semibold text-gray-900">Total</Text>
              <Text className="text-lg font-semibold text-primary">Rs.3000</Text>
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
          <PrimaryButton
            title={
              isCreatingPayment 
                ? "Processing..." 
                : `Book Session - Rs.3000`
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
            source={paymentPageUrl ? { uri: paymentPageUrl } : { uri: "about:blank" }} 
            onNavigationStateChange={handleWebViewNavigationStateChange}
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
  );
}