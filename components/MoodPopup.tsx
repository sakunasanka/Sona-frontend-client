import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { saveDailyMood } from '../api/mood';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 120;
const THUMB_SIZE = 28;

// Simplified preset moods for popup
const PRESET_MOODS = [
  { name: 'Happy', emoji: '😊', valence: 0.7, arousal: 0.3 },
  { name: 'Excited', emoji: '🤩', valence: 0.8, arousal: 0.8 },
  { name: 'Calm', emoji: '😌', valence: 0.5, arousal: -0.6 },
  { name: 'Sad', emoji: '😢', valence: -0.7, arousal: -0.4 },
  { name: 'Anxious', emoji: '😰', valence: -0.5, arousal: 0.7 },
  { name: 'Neutral', emoji: '😐', valence: 0, arousal: 0 },
];

const getMoodFromValues = (valence: number, arousal: number) => {
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

interface MoodPopupProps {
  visible: boolean;
  onClose: () => void;
  onMoodSubmitted: () => void;
}

export default function MoodPopup({ visible, onClose, onMoodSubmitted }: MoodPopupProps) {
  const [currentMood, setCurrentMood] = useState('Neutral');
  const [intensity, setIntensity] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [valence, setValence] = useState(0);
  const [arousal, setArousal] = useState(0);

  const valenceSlider = useSharedValue(SLIDER_WIDTH / 2);
  const arousalSlider = useSharedValue(SLIDER_WIDTH / 2);

  const updateMood = (newValence: number, newArousal: number) => {
    const mood = getMoodFromValues(newValence, newArousal);
    const intensityValue = getIntensityFromValues(newValence, newArousal);
    setCurrentMood(mood);
    setIntensity(intensityValue);
    setValence(newValence);
    setArousal(newArousal);
  };

  const selectPresetMood = (preset: typeof PRESET_MOODS[0]) => {
    const valencePos = ((preset.valence + 1) / 2) * SLIDER_WIDTH;
    const arousalPos = ((preset.arousal + 1) / 2) * SLIDER_WIDTH;

    valenceSlider.value = valencePos;
    arousalSlider.value = arousalPos;

    updateMood(preset.valence, preset.arousal);
  };

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

      onMoodSubmitted();
      onClose();
    } catch (error) {
      console.error('Failed to save mood:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <GestureHandlerRootView className="w-full max-w-sm">
          <View className="bg-white rounded-3xl p-6 max-h-[80%]">
            {/* Header */}
            <View className="items-center mb-4">
              <Text className="text-xl font-bold text-gray-800 mb-1">
                How are you feeling today?
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Take a moment to track your mood
              </Text>
            </View>

            {/* Quick Mood Selection */}
            <View className="mb-4">
              <View className="flex-row flex-wrap justify-center gap-2">
                {PRESET_MOODS.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`flex-row items-center bg-gray-50 rounded-full px-3 py-2 ${
                      currentMood === preset.name ? 'bg-blue-100 border border-blue-300' : ''
                    }`}
                    onPress={() => selectPresetMood(preset)}
                  >
                    <Text className="text-base mr-1">{preset.emoji}</Text>
                    <Text className={`text-xs font-medium ${
                      currentMood === preset.name ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mood Sliders */}
            <View className="mb-4">
              {/* Valence Slider */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-gray-600">😔 Unpleasant</Text>
                  <Text className="text-xs text-gray-600">Pleasant 😊</Text>
                </View>
                <View className="relative">
                  <LinearGradient
                    colors={['#EF4444', '#64748B', '#22C55E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: SLIDER_WIDTH
                    }}
                  />
                  <PanGestureHandler onGestureEvent={valenceGestureHandler}>
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          top: -11,
                          width: THUMB_SIZE,
                          height: THUMB_SIZE,
                          borderRadius: THUMB_SIZE / 2,
                          backgroundColor: 'white',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 3,
                          borderWidth: 2,
                          borderColor: '#3B82F6',
                        },
                        valenceThumbStyle,
                      ]}
                    />
                  </PanGestureHandler>
                </View>
              </View>

              {/* Arousal Slider */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-gray-600">😴 Low Energy</Text>
                  <Text className="text-xs text-gray-600">High Energy ⚡</Text>
                </View>
                <View className="relative">
                  <LinearGradient
                    colors={['#6366F1', '#64748B', '#EF4444']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: SLIDER_WIDTH
                    }}
                  />
                  <PanGestureHandler onGestureEvent={arousalGestureHandler}>
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          top: -11,
                          width: THUMB_SIZE,
                          height: THUMB_SIZE,
                          borderRadius: THUMB_SIZE / 2,
                          backgroundColor: 'white',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 3,
                          borderWidth: 2,
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
            <View className="bg-gray-50 rounded-xl p-3 mb-4">
              <View className="items-center">
                <Text className="text-2xl mb-1">
                  {PRESET_MOODS.find(m => m.name === currentMood)?.emoji || '😐'}
                </Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {currentMood}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">
                  Intensity: {Math.round(intensity * 100)}%
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl py-3"
                onPress={handleSkip}
                disabled={isLoading}
              >
                <Text className="text-gray-700 text-center font-medium">
                  Skip for now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 ${isLoading ? 'bg-gray-300' : 'bg-blue-500'}`}
                onPress={handleSaveMood}
                disabled={isLoading}
              >
                <Text className="text-white text-center font-medium">
                  {isLoading ? 'Saving...' : 'Save Mood'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </GestureHandlerRootView>
      </View>
    </Modal>
  );
}