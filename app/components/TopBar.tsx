// components/TopBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native'; // or any icon lib you use
import { StatusBar } from 'expo-status-bar';

const TopBar: React.FC<{ title?: string }> = ({title}) => {
  const navigation = useNavigation();

  const canGoBack = navigation.canGoBack?.();

  return (
    <>
    <StatusBar style="dark" backgroundColor="#f8f9fa" />
    <View className="flex-row items-center justify-start px-4 py-3 mt-10 h-20 bg-slate-50">
      {canGoBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
      ) : (
        <View className="w-6" /> 
      )}

      <Text className="text-lg font-alegreyaBold text-gray-800">
        {title}
      </Text>

      <View className="w-6" /> 
    </View>
    </>
  );
};

export default TopBar;