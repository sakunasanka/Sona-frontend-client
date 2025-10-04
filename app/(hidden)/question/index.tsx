import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function QuestionIndex() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-white px-5 py-8">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 justify-center items-center">
        <Text className="text-3xl font-alegreya font-bold text-gray-800 text-center mb-4">PHQ-9 Questionnaire</Text>
        <Text className="text-gray-600 text-center font-alegreya font-medium mb-8">Redirecting to start...</Text>
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 px-8 shadow-lg border-2 border-primary"
          onPress={() => router.replace('/(hidden)/question/start')}
        >
          <Text className="text-white text-center font-alegreya font-bold text-lg">Go to Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
