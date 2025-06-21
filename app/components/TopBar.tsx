// components/TopBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native'; // or any icon lib you use
import { StatusBar } from 'expo-status-bar';

const TopBar: React.FC<{ title?: string }> = ({title}) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack?.();

  return (
    <View className='mt-10'>
    <StatusBar style="dark" backgroundColor="#f8f9fa" />
    <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
        <View className="flex-row items-center">
            <TouchableOpacity >
                <Image 
                  source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100' }} 
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                />
            </TouchableOpacity>
        </View>
    </View>
    </View>
  );
};

export default TopBar;