import { getPsychiatristById, Psychiatrist as PsychiatristType } from '@/api/psychiatrist';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Award, Clock, Languages, MapPin, Star, Stethoscope } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';

export default function PsychiatristProfileScreen() {
  const params = useLocalSearchParams();
  const psychiatristId = params.id as string;
  
  const [psychiatrist, setPsychiatrist] = useState<PsychiatristType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchPsychiatrist = async () => {
      try {
        setIsLoading(true);
        const psychiatristData = await getPsychiatristById(parseInt(psychiatristId));
        setPsychiatrist(psychiatristData);
      } catch (error) {
        console.error('Error fetching psychiatrist:', error);
        Alert.alert('Error', 'Failed to load psychiatrist information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (psychiatristId) {
      fetchPsychiatrist();
    }
  }, [psychiatristId]);

  const handleBookSession = () => {
    if (psychiatrist) {
      router.push({
        pathname: '../session/bookPsychiatrist',
        params: { psychiatristId: psychiatrist.id }
      });
    }
  };

  const handleContactChat = () => {
    if (psychiatrist) {
      console.log('Start chat with psychiatrist', psychiatrist.id);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600">Loading psychiatrist profile...</Text>
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
        <Text className="text-gray-900 text-lg font-semibold">Psychiatrist Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white mx-5 mt-5 p-6 rounded-2xl">
          <View className="items-center">
            {!imageError ? (
              <Image
                source={{ uri: psychiatrist.avatar }}
                className="w-24 h-24 rounded-full bg-gray-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-gray-300 justify-center items-center">
                <Text className="text-gray-600 font-semibold text-xl">
                  {psychiatrist.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Text>
              </View>
            )}
            
            {psychiatrist.isAvailable && (
              <View className="absolute top-16 right-32 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
            )}
          </View>

          <View className="items-center mt-4">
            <Text className="text-xl font-bold text-gray-900">Dr. {psychiatrist.name}</Text>
            <Text className="text-gray-600 text-base mt-1">{psychiatrist.title}</Text>
            
            <View className="flex-row items-center mt-2">
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
              <Text className="ml-1 text-gray-800 font-semibold">{psychiatrist.rating}</Text>
              <Text className="ml-1 text-gray-500">• {psychiatrist.experience} experience</Text>
            </View>

            <View className="flex-row items-center mt-2">
              <Clock size={16} color="#16a34a" />
              <Text className="ml-2 text-green-600 font-medium">
                {psychiatrist.isAvailable ? 'Available for consultation' : 'Currently unavailable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Specialties */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Specializations</Text>
          <View className="flex-row flex-wrap gap-2">
            {(psychiatrist.specialities || []).map((specialty, index) => (
              <View key={index} className="bg-purple-100 px-3 py-1 rounded-full">
                <Text className="text-purple-700 text-sm font-medium">{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">About</Text>
          <Text className="text-gray-700 leading-6">{psychiatrist.description}</Text>
        </View>

        {/* Qualifications */}
        {psychiatrist.qualifications && (
          <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
            <View className="flex-row items-center mb-3">
              <Award size={20} color="#2563EB" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Qualifications</Text>
            </View>
            {psychiatrist.qualifications.map((qualification, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <View className="w-2 h-2 bg-primary rounded-full mr-3" />
                <Text className="text-gray-700 flex-1">{qualification}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Consultation Types */}
        {psychiatrist.consultationTypes && (
          <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
            <View className="flex-row items-center mb-3">
              <Stethoscope size={20} color="#2563EB" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Consultation Options</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {psychiatrist.consultationTypes.map((type, index) => (
                <View key={index} className="bg-blue-100 px-3 py-2 rounded-xl">
                  <Text className="text-blue-700 text-sm font-medium">{type}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages & Location */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <View className="flex-row items-center mb-3">
            <Languages size={20} color="#2563EB" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Languages & Location</Text>
          </View>
          
          <View className="mb-3">
            <Text className="text-gray-600 font-medium mb-1">Languages:</Text>
            <Text className="text-gray-700">{psychiatrist.languages.join(', ')}</Text>
          </View>
          
          {psychiatrist.address && (
            <View className="flex-row items-center">
              <MapPin size={16} color="#6B7280" />
              <Text className="text-gray-700 ml-2">{psychiatrist.address}</Text>
            </View>
          )}
        </View>

        {/* Session Fee */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Consultation Fee</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Per Session (50 minutes)</Text>
            <Text className="text-2xl font-bold text-primary">Rs.{psychiatrist.sessionFee}</Text>
          </View>
          <Text className="text-gray-500 text-sm mt-1">Fee may vary based on consultation type</Text>
        </View>

        {/* Action Buttons */}
        <View className="p-5 pb-8">
          <View className="flex-row gap-3 mb-3">
            <SecondaryButton 
              title="Message" 
              onPress={handleContactChat}
            />
            <PrimaryButton 
              title="Book Consultation" 
              onPress={handleBookSession}
              icon={Stethoscope}
            />
          </View>
          <Text className="text-center text-gray-500 text-sm">
            Professional medical consultation with prescription authority
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
