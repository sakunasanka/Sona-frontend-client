import { getPHQ9Result, PHQ9Result as PHQ9ResultType } from '@/api/questionnaire';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

function interpret(score: number) {
  if (score <= 4) return { 
    label: 'Minimal or none', 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    emoji: '😊'
  };
  if (score <= 9) return { 
    label: 'Mild', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50', 
    borderColor: 'border-amber-200',
    emoji: '🙂'
  };
  if (score <= 14) return { 
    label: 'Moderate', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200', 
    emoji: '😐'
  };
  if (score <= 19) return { 
    label: 'Moderately severe', 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    emoji: '😔'
  };
  return { 
    label: 'Severe', 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200', 
    emoji: '😢'
  };
}

export default function PHQ9Result() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [savedResult, setSavedResult] = useState<PHQ9ResultType | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get data from params (fallback)
  const score = Number(params.score ?? 0);
  const hadItem9Positive = params.hadItem9Positive === '1';
  const impact = String(params.impact ?? '');
  const severity = String(params.severity ?? '');
  const resultId = String(params.resultId ?? '');
  const isOffline = params.offline === 'true';
  const wasSaved = params.saved === 'true'; // New flag for successful submission
  
  const interp = interpret(score);

  // Only fetch saved result if we have an ID and it's not a fresh submission
  useEffect(() => {
    const fetchSavedResult = async () => {
      if (!resultId || isOffline || wasSaved) return; // Skip fetch if just saved
      
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        
        const result = await getPHQ9Result(resultId, token);
        setSavedResult(result);
      } catch (error) {
        console.log('Error fetching saved result:', error);
        // Continue with params data if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchSavedResult();
  }, [resultId, isOffline, wasSaved]); // Added wasSaved dependency

  // Use saved result data if available, otherwise use params
  const displayData = savedResult || {
    totalScore: score,
    hasItem9Positive: hadItem9Positive,
    impact: impact,
    severity: severity,
    completedAt: new Date()
  };

  const getRecommendations = () => {
    const currentScore = displayData.totalScore;
    if (currentScore <= 4) {
      return [
        'Continue with self-care practices',
        'Maintain regular sleep and exercise',
        'Stay connected with supportive people',
        'Consider retaking this assessment periodically'
      ];
    }
    if (currentScore <= 9) {
      return [
        'Focus on stress management techniques',
        'Establish consistent daily routines', 
        'Consider mindfulness or meditation',
        'Reach out to friends and family for support'
      ];
    }
    if (currentScore <= 14) {
      return [
        'Consider speaking with a counselor or therapist',
        'Explore stress reduction strategies',
        'Maintain social connections',
        'Monitor your symptoms regularly'
      ];
    }
    return [
      'Strongly consider professional mental health support',
      'Reach out to a counselor, therapist, or psychiatrist', 
      'Contact your healthcare provider',
      'Consider joining a support group'
    ];
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1 px-5 pt-16" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-alegreya font-bold text-gray-800">Your Results</Text>
          <Text className="text-gray-600 mt-2 font-alegreya font-medium">PHQ-9 Assessment Complete</Text>
          {wasSaved && (
            <View className="bg-green-50 rounded-xl p-3 mt-3 border border-green-200">
              <Text className="text-xs text-green-700 text-center font-alegreya font-medium">
                ✓ Assessment successfully saved to your account
              </Text>
            </View>
          )}
          {isOffline && (
            <View className="bg-amber-50 rounded-xl p-3 mt-3 border border-amber-200">
              <Text className="text-xs text-amber-700 text-center font-alegreya font-medium">
                ⚠️ Results not saved - Please check your connection
              </Text>
            </View>
          )}
        </View>

        {/* Score card with enhanced design */}
        <View className={`rounded-3xl border-2 p-8 mb-6 shadow-lg ${interp.bgColor} ${interp.borderColor}`}>
          <View className="items-center">
            <Text className="text-6xl mb-3">{interp.emoji}</Text>
            <Text className="text-6xl font-alegreya font-bold text-gray-900 mb-2">{displayData.totalScore}</Text>
            <Text className="text-lg text-gray-600 font-alegreya mb-3 font-medium">out of 27</Text>
            <View className={`px-5 py-3 rounded-full border-2 ${interp.borderColor} ${interp.bgColor}`}>
              <Text className={`text-xl font-alegreya font-bold ${interp.color}`}>{interp.label}</Text>
            </View>
          </View>
        </View>

        {/* What this means section */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg text-gray-800 font-alegreya font-bold mb-3">📊 Understanding Your Score</Text>
          <Text className="text-base text-gray-700 font-alegreya leading-6 mb-4 font-medium">
            The PHQ-9 measures depression symptom severity on a scale of 0-27. Your score indicates <Text className={`font-bold ${interp.color}`}>{interp.label.toLowerCase()}</Text> levels of depressive symptoms.
          </Text>
          <Text className="text-sm text-gray-500 font-alegreya font-medium">
            This is a screening tool, not a clinical diagnosis. Results should be discussed with a qualified healthcare professional.
          </Text>
        </View>

        {/* Impact section */}
        {!!displayData.impact && (
          <View className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-6">
            <Text className="text-lg text-blue-800 font-alegreya font-bold mb-2">💼 Life Impact</Text>
            <Text className="text-base text-blue-700 font-alegreya font-medium">
              You reported that these problems made things: <Text className="font-bold">{displayData.impact.toLowerCase()}</Text>
            </Text>
          </View>
        )}

        {/* Safety warning for item 9 */}
        {displayData.hasItem9Positive && (
          <View className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 mb-6">
            <Text className="text-lg text-red-800 font-alegreya font-bold mb-3">⚠️ Important Safety Notice</Text>
            <Text className="text-base text-red-700 font-alegreya leading-6 font-medium">
              You indicated thoughts of self-harm. Please reach out to a mental health professional, trusted person, or crisis hotline immediately. Your safety and well-being are important.
            </Text>
          </View>
        )}

        {/* Recommendations */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <Text className="text-lg text-gray-800 font-alegreya font-bold mb-4">💡 Recommended Next Steps</Text>
          {getRecommendations().map((rec, index) => (
            <View key={index} className="flex-row items-start mb-3">
              <View className="w-2 h-2 bg-primary rounded-full mr-3 mt-2" />
              <Text className="text-base text-gray-700 font-alegreya flex-1 leading-6 font-medium">{rec}</Text>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View className="mb-6">
          <TouchableOpacity
            className="py-4 rounded-2xl border-2 border-gray-200 bg-white shadow-sm"
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text className="text-center text-gray-700 font-alegreya font-bold text-lg">← Back to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Source and timestamp */}
        <View className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">

        </View>
      </ScrollView>
    </View>
  );
}
