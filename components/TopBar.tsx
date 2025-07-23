// components/TopBar.tsx
import { router, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const TopBar: React.FC<{ title?: string }> = ({title}) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack?.();

  return (
    <View className='mt-10'>
    <StatusBar style="dark" backgroundColor="#f8f9fa" />
    <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
        <Text className="font-bold text-gray-900 font-alegreyaBold text-3xl">{title}</Text>
        <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.push('/(hidden)/profile/view_profile')} >
                <Image 
                  source={{ uri: 'https://i.pinimg.com/736x/7a/a9/98/7aa998bc43b70132bc4ba177dcd2d40e.jpg' }} 
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                />
            </TouchableOpacity>
        </View>
    </View>
    </View>
  );
};

export default TopBar;