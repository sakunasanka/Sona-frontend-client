import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { saveDailyMood } from '../../../api/mood';
import TopBar from '../../../components/TopBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 80;
const THUMB_SIZE = 32;

// Preset mood combinations for quick selection
const PRESET_MOODS = [
  { name: 'Happy', emoji: '😊', valence: 0.7, arousal: 0.3 },
  { name: 'Excited', emoji: '🤩', valence: 0.8, arousal: 0.8 },
  { name: 'Calm', emoji: '😌', valence: 0.5, arousal: -0.6 },
  { name: 'Sad', emoji: '😢', valence: -0.7, arousal: -0.4 },
  { name: 'Anxious', emoji: '😰', valence: -0.5, arousal: 0.7 },
  { name: 'Neutral', emoji: '😐', valence: 0, arousal: 0 },
];

// Valence-Arousal model mappings
const getMoodFromValues = (valence: number, arousal: number) => {
  // Map to mood categories based on quadrants
  if (valence > 0.3 && arousal > 0.3) return 'Excited';
  if (valence > 0.3 && arousal < -0.3) return 'Content';
  if (valence < -0.3 && arousal > 0.3) return 'Anxious';
  if (valence < -0.3 && arousal < -0.3) return 'Sad';
  if (valence > 0 && Math.abs(arousal) <= 0.3) return 'Pleasant';
  if (valence < 0 && Math.abs(arousal) <= 0.3) return 'Unpleasant';
  if (Math.abs(valence) <= 0.3 && arousal > 0) return 'Alert';
  if (Math.abs(valence) <= 0.3 && arousal < 0) return 'Calm';
  return 'Neutral';
};

const getIntensityFromValues = (valence: number, arousal: number) => {
  return Math.sqrt(valence * valence + arousal * arousal) / Math.sqrt(2);
};

export default function MoodTracker() {
  const [currentMood, setCurrentMood] = useState('Neutral');
  const [intensity, setIntensity] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [valence, setValence] = useState(0); // -1 (unpleasant) to 1 (pleasant)
  const [arousal, setArousal] = useState(0); // -1 (low energy) to 1 (high energy)
  
  // Shared values for sliders
  const valenceSlider = useSharedValue(SLIDER_WIDTH / 2);
  const arousalSlider = useSharedValue(SLIDER_WIDTH / 2);

  const updateMood = (newValence: number, newArousal: number) => {
    const mood = getMoodFromValues(newValence, newArousal);
    const intensityValue = getIntensityFromValues(newValence, newArousal);
    setCurrentMood(mood);
    setIntensity(intensityValue);
    setValence(newValence);
    setArousal(newArousal);
    setShowInstructions(false);
  };

  const selectPresetMood = (preset: typeof PRESET_MOODS[0]) => {
    // Convert valence/arousal to slider positions
    const valencePos = ((preset.valence + 1) / 2) * SLIDER_WIDTH;
    const arousalPos = ((preset.arousal + 1) / 2) * SLIDER_WIDTH;
    
    valenceSlider.value = valencePos;
    arousalSlider.value = arousalPos;
    
    updateMood(preset.valence, preset.arousal);
  };

  // Valence slider gesture handler
  const valenceGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, context: any) => {
      context.startX = valenceSlider.value;
    },
    onActive: (event, context: any) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, context.startX + event.translationX));
      valenceSlider.value = newX;
      
      const newValence = (newX / SLIDER_WIDTH) * 2 - 1;
      const currentArousal = (arousalSlider.value / SLIDER_WIDTH) * 2 - 1;
      runOnJS(updateMood)(newValence, currentArousal);
    },
  });

  // Arousal slider gesture handler
  const arousalGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, context: any) => {
      context.startX = arousalSlider.value;
    },
    onActive: (event, context: any) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, context.startX + event.translationX));
      arousalSlider.value = newX;
      
      const newArousal = (newX / SLIDER_WIDTH) * 2 - 1;
      const currentValence = (valenceSlider.value / SLIDER_WIDTH) * 2 - 1;
      runOnJS(updateMood)(currentValence, newArousal);
    },
  });

  const valenceThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: valenceSlider.value - THUMB_SIZE / 2 }],
    };
  });

  const arousalThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: arousalSlider.value - THUMB_SIZE / 2 }],
    };
  });

  const handleSaveMood = async () => {
    setIsLoading(true);
    try {
      await saveDailyMood({
        mood: currentMood,
        valence: Number(valence.toFixed(2)),
        arousal: Number(arousal.toFixed(2)),
        intensity: Number(intensity.toFixed(2)),
      });
      
      // Navigate back to home and trigger a refresh
      router.replace('/');
    } catch (error) {
      console.error('Failed to save mood:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GestureHandlerRootView className="flex-1 bg-white">
      <TopBar title="Daily Mood" />
      
      <View className="flex-1 px-8 py-6">
        <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
          Choose how you've felt overall today
        </Text>
        
        {showInstructions ? (
          <Text className="text-lg text-gray-600 text-center mb-4">
            Use the sliders to fine-tune your mood
          </Text>
        ) : (
          <Text className="text-lg text-gray-600 text-center mb-4">
            Use the sliders to fine-tune your mood
          </Text>
        )}

        {/* Quick Mood Selection Buttons */}
        <View className="mb-6">
          <Text className="text-base font-medium text-gray-700 mb-3 text-center">
            Quick Select
          </Text>
          <View className="flex-row flex-wrap justify-center gap-2">
            {PRESET_MOODS.map((preset, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-row items-center bg-white rounded-full px-4 py-2 shadow-sm border ${
                  currentMood === preset.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onPress={() => selectPresetMood(preset)}
              >
                <Text className="text-lg mr-1">{preset.emoji}</Text>
                <Text className={`text-sm font-medium ${
                  currentMood === preset.name ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mood Sliders */}
        <View className="mb-8">
          {/* How You Feel Slider */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-3 text-center">
              How do you feel? 😊
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-600">😔 Unpleasant</Text>
              <Text className="text-sm text-gray-600">Pleasant 😊</Text>
            </View>
            
            <View className="relative">
              {/* Slider Track */}
              <LinearGradient
                colors={['#EF4444', '#F97316', '#64748B', '#10B981', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ 
                  height: 8, 
                  borderRadius: 4,
                  width: SLIDER_WIDTH 
                }}
              />
              
              {/* Slider Thumb */}
              <PanGestureHandler onGestureEvent={valenceGestureHandler}>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: -12,
                      width: THUMB_SIZE,
                      height: THUMB_SIZE,
                      borderRadius: THUMB_SIZE / 2,
                      backgroundColor: 'white',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 5,
                      borderWidth: 3,
                      borderColor: '#3B82F6',
                    },
                    valenceThumbStyle,
                  ]}
                />
              </PanGestureHandler>
            </View>
          </View>

          {/* Energy Level Slider */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3 text-center">
              Energy Level ⚡
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-600">😴 Low Energy</Text>
              <Text className="text-sm text-gray-600">High Energy ⚡</Text>
            </View>
            
            <View className="relative">
              {/* Slider Track */}
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#64748B', '#F59E0B', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ 
                  height: 8, 
                  borderRadius: 4,
                  width: SLIDER_WIDTH 
                }}
              />
              
              {/* Slider Thumb */}
              <PanGestureHandler onGestureEvent={arousalGestureHandler}>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: -12,
                      width: THUMB_SIZE,
                      height: THUMB_SIZE,
                      borderRadius: THUMB_SIZE / 2,
                      backgroundColor: 'white',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 5,
                      borderWidth: 3,
                      borderColor: '#8B5CF6',
                    },
                    arousalThumbStyle,
                  ]}
                />
              </PanGestureHandler>
            </View>
          </View>
        </View>

        {/* Current Mood Display */}
        <View className="bg-gray-50 rounded-2xl p-6 mb-8">
          <View className="items-center mb-3">
            <Text className="text-3xl mb-2">
              {PRESET_MOODS.find(m => m.name === currentMood)?.emoji || '😐'}
            </Text>
            <Text className="text-xl font-semibold text-gray-800">
              {currentMood}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">Intensity:</Text>
              <View className="flex-row items-center">
                <View className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                  <View 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${intensity * 100}%` }}
                  />
                </View>
                <Text className="text-sm font-medium text-gray-700">
                  {Math.round(intensity * 100)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className={`rounded-2xl py-4 ${isLoading ? 'bg-gray-300' : 'bg-blue-500'}`}
          onPress={handleSaveMood}
          disabled={isLoading}
        >
          <Text className="text-white text-lg font-semibold text-center">
            {isLoading ? 'Saving...' : 'Save Mood'}
          </Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}