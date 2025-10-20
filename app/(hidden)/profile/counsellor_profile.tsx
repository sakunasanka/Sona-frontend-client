import { checkIsStudent } from '@/api/api';
import { getCounselorById } from '@/api/counselor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Award, Calendar, Clock, Globe, GraduationCap, MapPin, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PrimaryButton } from '../../components/Buttons';

interface CounselorData {
  id: number;
  name: string;
  title: string;
  avatar: string;
  specialities?: string[]; // Note: API uses 'specialities' not 'specialties'
  rating?: number;
  reviews?: number;
  experience?: string;
  languages?: string[];
  description: string;
  availability?: string;
  address: string;
  education?: string;
  sessionFee: number;
  isVolunteer: boolean;
  isAvailable: boolean;
  contact_no?: string;
  license_no?: string;
  status?: string;
  email?: string;
}

export default function CounsellorProfile() {
  const params = useLocalSearchParams();
  // Get counselor ID from params - could be either 'id' or 'counselorId'
  const rawId = params.id || params.counselorId;
  const counselorId = rawId ? String(rawId) : null;
  
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [counselorData, setCounselorData] = useState<CounselorData | null>(null);
  const [loadingCounselor, setLoadingCounselor] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Log params for debugging
  useEffect(() => {
    console.log('Params received:', JSON.stringify(params));
    console.log('Raw ID:', rawId);
    console.log('Counselor ID:', counselorId);
  }, [params, counselorId, rawId]);
  
  // Fetch counselor data and check student status when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCounselor(true);
        
        // Fetch counselor data
        if (counselorId) {
          console.log('Fetching counselor with ID:', counselorId);
          try {
            const counselor = await getCounselorById(Number(counselorId));
            console.log('Counselor data received:', JSON.stringify(counselor));
            setCounselorData(counselor);
          } catch (apiError: any) {
            console.log('API error details:', apiError);
            Alert.alert('API Error', `Failed to fetch counselor: ${apiError.message || apiError}`);
            setError(`API error: ${apiError.message || apiError}`);
          }
        } else {
          console.log('No counselor ID provided');
          setError('No counselor ID provided');
        }
        
        // Check if user is a student
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const studentStatus = await checkIsStudent(token);
          setIsStudent(studentStatus);
        }
      } catch (error: any) {
        console.log('Error fetching data:', error);
        setError(`Failed to load counselor data: ${error.message || error}`);
      } finally {
        setLoadingCounselor(false);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [counselorId]);

  const handleBookAppointment = () => {
    router.push({
      pathname: '/(hidden)/session/bookSessions',
      params: { counselorId: counselorData?.id }
    });
  };

  const handleBookSession = () => {
    router.push({
      pathname: '/(hidden)/session/bookSessions',
      params: { counselorId: counselorData?.id }
    });
  };

  interface DetailItemProps {
    icon: React.ElementType;
    label: string;
    value: string;
    iconColor?: string;
  }
  
  const DetailItem = ({ icon: Icon, label, value, iconColor = "#6366F1" }: DetailItemProps) => (
    <View className="flex-row items-start py-3 px-4 bg-gray-50 rounded-xl mb-3">
      <View className="w-10 h-10 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
        <Icon size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </Text>
        <Text className="text-sm font-semibold text-gray-900 leading-5">
          {value}
        </Text>
      </View>
    </View>
  );

  // Show loading state if data is being fetched
  if (isLoading || loadingCounselor) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-gray-600 mt-4">Loading counselor profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if there was an error
  if (error || !counselorData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-50"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Counselor Profile</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-lg font-medium mb-4">{error || 'Could not load counselor data'}</Text>
          <TouchableOpacity 
            className="bg-primary px-4 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate years of experience from description if available
  const getExperienceFromDescription = () => {
    if (!counselorData.description) return '1+ years';
    
    // Try to extract years from description
    const yearsMatch = counselorData.description.match(/(\d+)\s*(?:years|year)/i);
    if (yearsMatch && yearsMatch[1]) {
      return `${yearsMatch[1]} years`;
    }
    
    return '1+ years';
  };

  // Process counselor data for display
  const counsellorDisplay = {
    ...counselorData,
    // Handle specialities field from API - join all specialities with commas
    specialization: counselorData.specialities && counselorData.specialities.length > 0 
      ? counselorData.specialities.join(', ') 
      : 'General Counseling',
    experience: counselorData.experience || getExperienceFromDescription(),
    reviews: counselorData.reviews || Math.floor(Math.random() * 50) + 10,
    availability: counselorData.availability || 'Mon-Fri, 9am-5pm',
    education: counselorData.education || 'Professional Counselor',
    price: `Rs.${counselorData.sessionFee}`,
    providesStudentSessions: !counselorData.isVolunteer,
    // Ensure languages is an array
    languages: Array.isArray(counselorData.languages) ? counselorData.languages : ['English']
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-50"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Counselor Profile</Text>
          <View className="w-10" />
        </View>

        {/* Profile Hero Section */}
        <View className="bg-gradient-to-b from-blue-50 to-white px-6 py-8">
          <View className="items-center">
            <View className="relative mb-6">
              {counsellorDisplay.avatar ? (
                <Image
                  source={{ uri: counsellorDisplay.avatar }}
                  className="w-28 h-28 rounded-2xl"
                  defaultSource={require('@/assets/images/mascot/mascot-happy.png')}
                  onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                />
              ) : (
                <View className="w-28 h-28 rounded-2xl bg-gray-300 items-center justify-center">
                  <Text className="text-gray-600 font-semibold text-2xl">
                    {counsellorDisplay.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </View>
              )}
              {counsellorDisplay.isAvailable && (
                <View className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white items-center justify-center">
                  <View className="w-3 h-3 bg-white rounded-full" />
                </View>
              )}
            </View>
            
            <Text className="text-2xl font-bold text-gray-900 mb-1 text-center">
              {counsellorDisplay.name}
            </Text>
            <Text className="text-base font-medium text-primary mb-3">
              {counsellorDisplay.title}
            </Text>
            
            {/* Specialties tags */}
            {counselorData.specialities && counselorData.specialities.length > 0 && (
              <View className="flex-row flex-wrap justify-center gap-2 mb-4">
                {counselorData.specialities.map((specialty, index) => (
                  <View key={index} className="bg-blue-100 px-3 py-1 rounded-xl">
                    <Text className="text-xs text-primary font-medium">{specialty}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <View className="flex-row items-center bg-white px-4 py-2 rounded-full shadow-sm mb-4">
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-amber-600 font-semibold ml-1 mr-2">
                {counsellorDisplay.rating || 4.5}
              </Text>
              <Text className="text-gray-500 text-sm">
                ({counsellorDisplay.reviews} reviews)
              </Text>
            </View>
            
            {/* Student Session Badge */}
            {counsellorDisplay.providesStudentSessions && (
              <View className="flex-row items-center bg-indigo-100 px-4 py-2 rounded-full mb-3">
                <GraduationCap size={16} color="#4F46E5" />
                <Text className="text-indigo-700 font-medium ml-2">
                  Provides Free Student Sessions
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio Section */}
        <View className="px-6 pb-6 bg-white">
          <Text className="text-gray-700 text-base leading-6 text-center">
            {counsellorDisplay.description || 'Professional counselor providing mental health support and guidance.'}
          </Text>
        </View>

        {/* Details Section */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-gray-900 mb-6">Professional Details</Text>
          
          <DetailItem
            icon={Award}
            label="Specialization"
            value={counsellorDisplay.specialization}
            iconColor="#6366F1"
          />
          
          <DetailItem
            icon={Calendar}
            label="Experience"
            value={counsellorDisplay.experience}
            iconColor="#059669"
          />
          
          <DetailItem
            icon={MapPin}
            label="Location"
            value={counsellorDisplay.address || 'Virtual Sessions'}
            iconColor="#DC2626"
          />
          
          {counsellorDisplay.education && (
            <DetailItem
              icon={Award}
              label="Education"
              value={counsellorDisplay.education}
              iconColor="#7C3AED"
            />
          )}
          
          <DetailItem
            icon={Globe}
            label="Languages"
            value={counsellorDisplay.languages.join(', ')}
            iconColor="#0891B2"
          />
        </View>

        {/* Availability & Pricing */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-gray-900 mb-6">Availability & Pricing</Text>
          
          <DetailItem
            icon={Clock}
            label="Schedule"
            value={counsellorDisplay.availability}
            iconColor="#EA580C"
          />
          
          <View className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Session Price</Text>
                <Text className="text-3xl font-bold text-gray-900">{counsellorDisplay.price}</Text>
                {isStudent && counsellorDisplay.providesStudentSessions && (
                  <Text className="text-sm font-medium text-green-600 mt-1">
                    Free sessions available with student package
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Book Appointment Button */}
        <View className="px-6">
          <PrimaryButton
            title={isStudent && counsellorDisplay.providesStudentSessions ? "Book Session (Student Options Available)" : "Book Appointment"}
            onPress={handleBookAppointment}
            icon={Calendar}
            iconSize={20}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}