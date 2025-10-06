// components/TopBar.tsx
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { getProfile, ProfileData } from '../api/auth';

const TopBar: React.FC<{ title?: string }> = ({title}) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack?.();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      setProfileData(profile);
    } catch (error) {
      console.error('Error loading profile for topbar:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Refresh profile data when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  return (
    <View className='mt-10'>
    <StatusBar style="dark" />
    <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
        <Text className="font-bold text-gray-900 font-alegreyaBold text-3xl">{title}</Text>
        <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.push('/(hidden)/profile/view_profile')} >
                {isLoading ? (
                  <View className="w-8 h-8 rounded-full bg-gray-200 justify-center items-center">
                    <ActivityIndicator size="small" color="#2563EB" />
                  </View>
                ) : (
                  <Image 
                    source={{ uri: profileData?.avatar || 'https://images.icon-icons.com/1378/PNG/512/avatardefault_92824.png' }} 
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                  />
                )}
            </TouchableOpacity>
        </View>
    </View>
    </View>
  );
};

export default TopBar;