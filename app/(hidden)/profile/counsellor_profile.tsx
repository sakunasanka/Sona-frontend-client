import { checkIsStudent } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Award, Calendar, Clock, Globe, GraduationCap, MapPin, MessageSquare, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';

export default function CounsellorProfile() {
  const params = useLocalSearchParams();
  const counselorId = params.id as string;
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Check if user is a student when component mounts
  useEffect(() => {
    const checkStudentStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const studentStatus = await checkIsStudent(token);
          setIsStudent(studentStatus);
        }
      } catch (error) {
        console.error('Error checking student status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStudentStatus();
  }, []);

  const counsellorData = {
    id: counselorId || '1',
    name: 'Dr. Sarah Johnson',
    title: 'Licensed Clinical Psychologist',
    specialization: 'Anxiety & Depression',
    rating: 4.9,
    reviews: 128,
    experience: '8 years',
    languages: ['English', 'Spanish'],
    bio: 'Specialized in cognitive behavioral therapy with a focus on anxiety disorders. Passionate about helping clients develop coping strategies.',
    availability: 'Mon-Fri, 9am-5pm',
    location: 'Virtual or 123 Therapy St, Boston',
    education: 'PhD in Clinical Psychology, Harvard University',
    price: 'Rs.4000 per session',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80',
    providesStudentSessions: true // Indicates if this counselor provides free sessions for students
  };

  const handleBookAppointment = () => {
    router.push({
      pathname: '/(hidden)/session/bookSessions',
      params: { counselorId: counsellorData.id }
    });
  };

  const handleBookSession = () => {
    router.push({
      pathname: '/(hidden)/session/bookSessions',
      params: { counselorId: counsellorData.id }
    });
  };

  const handleMessage = () => {
    router.push({
      pathname: '/(hidden)/profile/counsellor-chat',
      params: { counselorId: counsellorData.id }
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
              <Image
                source={{ uri: counsellorData.image }}
                className="w-28 h-28 rounded-2xl"
              />
              <View className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white items-center justify-center">
                <View className="w-3 h-3 bg-white rounded-full" />
              </View>
            </View>
            
            <Text className="text-2xl font-bold text-gray-900 mb-1 text-center">
              {counsellorData.name}
            </Text>
            <Text className="text-base font-medium text-primary mb-3">
              {counsellorData.title}
            </Text>
            
            <View className="flex-row items-center bg-white px-4 py-2 rounded-full shadow-sm mb-4">
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-amber-600 font-semibold ml-1 mr-2">
                {counsellorData.rating}
              </Text>
              <Text className="text-gray-500 text-sm">
                ({counsellorData.reviews} reviews)
              </Text>
            </View>
            
            {/* Student Session Badge */}
            {counsellorData.providesStudentSessions && (
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
            {counsellorData.bio}
          </Text>
        </View>

        {/* Student Benefits Section */}
        {isLoading ? (
          <View className="px-6 pb-6 items-center">
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text className="text-gray-500 mt-2">Checking student status...</Text>
          </View>
        ) : isStudent && counsellorData.providesStudentSessions ? (
          <View className="px-6 pb-6">
            <View className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
              <View className="flex-row items-center mb-3">
                <GraduationCap size={20} color="#4F46E5" />
                <Text className="text-lg font-bold text-indigo-900 ml-2">
                  Student Benefits
                </Text>
              </View>
              <Text className="text-indigo-800 mb-3">
                As a verified student, you are eligible for free counseling sessions with this counselor.
              </Text>
              <View className="bg-white p-3 rounded-lg">
                <Text className="text-indigo-700 font-medium">Benefits include:</Text>
                <View className="ml-2 mt-1">
                  <Text className="text-gray-700 mb-1">• Free sessions (limited per month)</Text>
                  <Text className="text-gray-700 mb-1">• Priority booking</Text>
                  <Text className="text-gray-700">• Same quality care as paid sessions</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View className="px-6 pb-6">
          <View className="flex-row gap-3">
            <SecondaryButton
              title="Chat"
              onPress={handleMessage}
              icon={MessageSquare}
            />
            
            <PrimaryButton
              title="Book Session"
              onPress={handleBookSession}
              icon={Calendar}
            />
          </View>
        </View>

        {/* Details Section */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-gray-900 mb-6">Professional Details</Text>
          
          <DetailItem
            icon={Award}
            label="Specialization"
            value={counsellorData.specialization}
            iconColor="#6366F1"
          />
          
          <DetailItem
            icon={Calendar}
            label="Experience"
            value={counsellorData.experience}
            iconColor="#059669"
          />
          
          <DetailItem
            icon={MapPin}
            label="Location"
            value={counsellorData.location}
            iconColor="#DC2626"
          />
          
          <DetailItem
            icon={Award}
            label="Education"
            value={counsellorData.education}
            iconColor="#7C3AED"
          />
          
          <DetailItem
            icon={Globe}
            label="Languages"
            value={counsellorData.languages.join(', ')}
            iconColor="#0891B2"
          />
        </View>

        {/* Availability & Pricing */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-gray-900 mb-6">Availability & Pricing</Text>
          
          <DetailItem
            icon={Clock}
            label="Schedule"
            value={counsellorData.availability}
            iconColor="#EA580C"
          />
          
          <View className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Session Price</Text>
                <Text className="text-3xl font-bold text-gray-900">{counsellorData.price}</Text>
                {isStudent && counsellorData.providesStudentSessions && (
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
            title={isStudent && counsellorData.providesStudentSessions ? "Book Session (Student Options Available)" : "Book Appointment"}
            onPress={handleBookAppointment}
            icon={Calendar}
            iconSize={20}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}