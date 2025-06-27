import { router } from "expo-router";
import { ArrowLeft, CreditCard, MessageCircle, Phone, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PrimaryButton } from '../../components/Buttons';

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

  const dates = generateDates();
  const timeSlots = generateTimeSlots(selectedDate);
  const selectedSession = SESSION_TYPES.find(type => type.id === selectedSessionType);

  const handleBookSession = () => {
    if (!selectedTime) {
      Alert.alert('Time Required', 'Please select a time slot for your session.');
      return;
    }

    Alert.alert(
      'Booking Confirmed',
      `Your session with ${MOCK_COUNSELOR.name} has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
      [
        {
          text: 'OK',
          onPress: () => router.back()
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
            {/* Add Payment Method Button */}
            <TouchableOpacity
              onPress={() => Alert.alert('Add Payment Method', 'This feature is coming soon!')}
              className="mb-3 p-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex-row items-center"
            >
              <View className="p-2 rounded-lg mr-3 bg-gray-200">
                <CreditCard size={20} color="#6B7280" />
              </View>
              <Text className="flex-1 text-gray-700 font-medium">Add Payment Method</Text>
              <Text className="text-primary font-medium">+</Text>
            </TouchableOpacity>
            
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
            title={`Book Session - $${selectedSession?.price}`}
            onPress={handleBookSession}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}