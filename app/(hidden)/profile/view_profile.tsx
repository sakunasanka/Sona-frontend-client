import { checkIsStudent } from '@/api/api';
import { getLoginStats, getProfile, LoginStatsData, ProfileData } from '@/api/auth';
import { getDisplayName } from '@/util/asyncName';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { AlertTriangle, ArrowLeft, BadgeCheck, BarChart3, Edit, GraduationCap, HelpCircle, History, LogOut, Shield } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LogoutButton } from '../../components/Buttons';

export default function Profile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loginStats, setLoginStats] = useState<LoginStatsData | null>(null);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [displayName, setDisplayName] = useState<string>('');

  const initializeProfile = useCallback(async () => {
    try {
      // Get profile data
      const profile = await getProfile();
      setProfileData(profile);
      
      // Get login stats
      const stats = await getLoginStats();
      setLoginStats(stats);
      
      // Get display name
      const name = await getDisplayName();
      if (name) {
        setDisplayName(name);
      }
      
      // Check student status
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const studentStatus = await checkIsStudent(token);
        setIsStudent(studentStatus);
      }
    } catch (error) {
      console.error('Error initializing profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeProfile();
  }, [initializeProfile]);

  // Refresh profile data when screen comes back into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      initializeProfile();
    }, [initializeProfile])
  );


  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
            <TouchableOpacity className="p-2" onPress={() => router.navigate('/(tabs)')}>
              <ArrowLeft size={24} color="#2563EB" />
            </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">Profile</Text>
          <TouchableOpacity onPress={() => router.push('/profile/edit_profile')}>
            <Edit size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View className="items-center py-6 border-b border-gray-200">
          <View className="relative mb-4">
            {isLoading ? (
              <View className="w-32 h-32 rounded-full border-4 border-gray-200 bg-gray-100 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : (
              <Image 
                source={{ uri: profileData?.avatar || 'https://images.icon-icons.com/1378/PNG/512/avatardefault_92824.png' }} 
                className="w-32 h-32 rounded-full border-4 border-gray-200"
              />
            )}
            <TouchableOpacity 
              className="absolute bottom-0 right-0 bg-primary rounded-full w-8 h-8 justify-center items-center"
              onPress={() => router.push('/profile/edit_profile')}
            >
              <Edit size={16} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-1">{displayName || profileData?.name}</Text>
          <Text className="text-base text-gray-500 mb-4">@{profileData?.nickName}</Text>
          
          {/* Student Badge */}
          {isLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : isStudent && (
            <View className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full mb-4">
              <GraduationCap size={16} color="#2563EB" className="mr-1" />
              <Text className="text-blue-700 font-medium ml-1">Verified Student</Text>
            </View>
          )}
          
          <View className="flex-row justify-around w-full px-10 mt-4">
            <View className="items-center">
              <Text className="text-xl font-bold text-primary">{loginStats?.totalLogins || 0}</Text>
              <Text className="text-sm text-gray-500 mt-1">Check-ins</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-primary">{loginStats?.currentStreak || 0}</Text>
              <Text className="text-sm text-gray-500 mt-1">Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Personal Info Section */}
        <View className="p-5 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Personal Information</Text>
          
          <View className="flex-row justify-between mb-4">
            <Text className="text-sm text-gray-500">Full Name</Text>
            <Text className="text-sm font-medium text-gray-900">{profileData?.name}</Text>
          </View>
          
          <View className="flex-row justify-between mb-4">
            <Text className="text-sm text-gray-500">Nickname</Text>
            <Text className="text-sm font-medium text-gray-900">{profileData?.nickName}</Text>
          </View>
          
          <View className="flex-row justify-between mb-4">
            <Text className="text-sm text-gray-500">Email</Text>
            <Text className="text-sm font-medium text-gray-900">{profileData?.email}</Text>
          </View>
        </View>

        {/* Actions Section */}
        <View className="p-5">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Account</Text>
          <TouchableOpacity 
            className="flex-row items-center py-4 border-b border-gray-100"
            onPress={() => router.push('/session/sessionHistory')}
          >
            <View className="w-9 h-9 rounded-full bg-blue-50 justify-center items-center mr-4">
              <History size={20} color="#2563EB" />
            </View>
            <Text className="text-base text-gray-900">Counselling sessions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center py-4 border-b border-gray-100"
            onPress={() => router.push('/(hidden)/analysis')}
          >
            <View className="w-9 h-9 rounded-full bg-blue-50 justify-center items-center mr-4">
              <BarChart3 size={20} color="#2563EB" />
            </View>
            <Text className="text-base text-gray-900">My Progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center py-4 border-b border-gray-100"
            onPress={() => router.push('/(hidden)/profile/complaint')}
          >
            <View className="w-9 h-9 rounded-full bg-blue-50 justify-center items-center mr-4">
              <AlertTriangle size={20} color="#2563EB" />
            </View>
            <Text className="text-base text-gray-900">File a Complaint</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <View className="w-9 h-9 rounded-full bg-blue-50 justify-center items-center mr-4">
              <Bookmark size={20} color="#2563EB" />
            </View>
            <Text className="text-base text-gray-900">Saved Resources</Text>
          </TouchableOpacity> */}
          
          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <View className="w-9 h-9 rounded-full bg-blue-50 justify-center items-center mr-4">
              <Shield size={20} color="#2563EB" />
            </View>
            <Text className="text-base text-gray-900">Privacy Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <View className="w-9 h-9 rounded-full bg-blue-50 justify-center items-center mr-4">
              <HelpCircle size={20} color="#2563EB" />
            </View>
            <Text className="text-base text-gray-900">Help & Support</Text>
          </TouchableOpacity>
          
          {/* Only show "Apply for Free Student Package" if user is not already a student */}
          {!isStudent && (
            <TouchableOpacity 
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={() => router.push('/session/StudentPackageApply')}
            >
              <View className="w-9 h-9 rounded-full bg-blue-50 justify-center items-center mr-4">
                <BadgeCheck size={20} color="#2563EB" />
              </View>
              <Text className="text-base text-gray-900">Apply for Free Student Package</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <LogoutButton 
            title="Log Out" 
            onPress={() => router.replace('/(auth)/signin')} 
            icon={LogOut}
          />
      </ScrollView>
    </SafeAreaView>
  );
}