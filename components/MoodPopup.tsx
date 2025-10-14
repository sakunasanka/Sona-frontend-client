import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { saveDailyMood } from '../api/mood';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = Math.max(200, SCREEN_WIDTH - 120); // Ensure minimum width
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
  const intensity = Math.sqrt(valence * valence + arousal * arousal) / Math.sqrt(2);
  return isNaN(intensity) ? 0 : Math.max(0, Math.min(1, intensity));
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
  const valenceStart = useSharedValue(0);
  const arousalStart = useSharedValue(0);

  const updateMood = (newValence: number, newArousal: number) => {
    // Validate inputs to prevent NaN
    const validValence = isNaN(newValence) ? 0 : newValence;
    const validArousal = isNaN(newArousal) ? 0 : newArousal;
    
    console.log('updateMood called:', { 
      input: { newValence, newArousal }, 
      valid: { validValence, validArousal },
      sliderValues: { 
        valence: valenceSlider.value, 
        arousal: arousalSlider.value,
        SLIDER_WIDTH 
      }
    });
    
    const mood = getMoodFromValues(validValence, validArousal);
    const intensityValue = getIntensityFromValues(validValence, validArousal);
    const validIntensity = isNaN(intensityValue) ? 0 : intensityValue;
    
    console.log('Calculated mood:', { mood, intensityValue: validIntensity });
    
    setCurrentMood(mood);
    setIntensity(validIntensity);
    setValence(validValence);
    setArousal(validArousal);
  };

  // Initialize mood on popup open
  useEffect(() => {
    if (visible) {
      console.log('Initializing sliders - SLIDER_WIDTH:', SLIDER_WIDTH);
      // Reset to neutral position
      valenceSlider.value = SLIDER_WIDTH / 2;
      arousalSlider.value = SLIDER_WIDTH / 2;
      // Initialize mood state
      updateMood(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const selectPresetMood = (preset: typeof PRESET_MOODS[0]) => {
    const valencePos = ((preset.valence + 1) / 2) * SLIDER_WIDTH;
    const arousalPos = ((preset.arousal + 1) / 2) * SLIDER_WIDTH;

    valenceSlider.value = withSpring(valencePos);
    arousalSlider.value = withSpring(arousalPos);

    updateMood(preset.valence, preset.arousal);
  };

  // Modern Gesture API for valence slider
  const valenceGesture = Gesture.Pan()
    .onBegin((event) => {
      valenceStart.value = valenceSlider.value;
      console.log('Valence gesture begin:', { event, current: valenceSlider.value });
    })
    .onUpdate((event) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, valenceStart.value + event.translationX));
      valenceSlider.value = newX;
      console.log('Valence gesture update:', { newX, translation: event.translationX });
      
      // Update mood in real-time during drag
      const newValence = (newX / SLIDER_WIDTH) * 2 - 1;
      const currentArousal = (arousalSlider.value / SLIDER_WIDTH) * 2 - 1;
      
      if (!isNaN(newValence) && !isNaN(currentArousal)) {
        runOnJS(updateMood)(newValence, currentArousal);
      }
    })
    .onEnd(() => {
      const newValence = (valenceSlider.value / SLIDER_WIDTH) * 2 - 1;
      const currentArousal = (arousalSlider.value / SLIDER_WIDTH) * 2 - 1;
      
      console.log('Valence gesture end:', { final: valenceSlider.value });
      
      // Final update when gesture ends
      if (!isNaN(newValence) && !isNaN(currentArousal)) {
        runOnJS(updateMood)(newValence, currentArousal);
      }
    });

  // Modern Gesture API for arousal slider
  const arousalGesture = Gesture.Pan()
    .onBegin((event) => {
      arousalStart.value = arousalSlider.value;
      console.log('Arousal gesture begin:', { event, current: arousalSlider.value });
    })
    .onUpdate((event) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, arousalStart.value + event.translationX));
      arousalSlider.value = newX;
      console.log('Arousal gesture update:', { newX, translation: event.translationX });
      
      // Update mood in real-time during drag
      const newArousal = (newX / SLIDER_WIDTH) * 2 - 1;
      const currentValence = (valenceSlider.value / SLIDER_WIDTH) * 2 - 1;
      
      if (!isNaN(newArousal) && !isNaN(currentValence)) {
        runOnJS(updateMood)(currentValence, newArousal);
      }
    })
    .onEnd(() => {
      const newArousal = (arousalSlider.value / SLIDER_WIDTH) * 2 - 1;
      const currentValence = (valenceSlider.value / SLIDER_WIDTH) * 2 - 1;
      
      console.log('Arousal gesture end:', { final: arousalSlider.value });
      
      // Final update when gesture ends
      if (!isNaN(newArousal) && !isNaN(currentValence)) {
        runOnJS(updateMood)(currentValence, newArousal);
      }
    });

  const valenceThumbStyle = useAnimatedStyle(() => {
    const clampedValue = Math.max(0, Math.min(SLIDER_WIDTH, valenceSlider.value));
    return {
      left: clampedValue - THUMB_SIZE / 2,
    };
  });

  const arousalThumbStyle = useAnimatedStyle(() => {
    const clampedValue = Math.max(0, Math.min(SLIDER_WIDTH, arousalSlider.value));
    return {
      left: clampedValue - THUMB_SIZE / 2,
    };
  });

  const handleSaveMood = async () => {
    setIsLoading(true);
    try {
      const validIntensity = isNaN(intensity) ? 0 : intensity;
      const validValence = isNaN(valence) ? 0 : valence;
      const validArousal = isNaN(arousal) ? 0 : arousal;
      
      await saveDailyMood({
        mood: currentMood,
        valence: Number(validValence.toFixed(2)),
        arousal: Number(validArousal.toFixed(2)),
        intensity: Number(validIntensity.toFixed(2)),
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
                <GestureDetector gesture={valenceGesture}>
                  <Animated.View className="relative" style={{ height: 28, width: SLIDER_WIDTH }}>
                    <LinearGradient
                      colors={['#EF4444', '#64748B', '#22C55E']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: 6,
                        borderRadius: 3,
                        width: SLIDER_WIDTH,
                        marginTop: 11,
                      }}
                    />
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          top: 0,
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
                  </Animated.View>
                </GestureDetector>
              </View>

              {/* Arousal Slider */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-gray-600">😴 Low Energy</Text>
                  <Text className="text-xs text-gray-600">High Energy ⚡</Text>
                </View>
                <GestureDetector gesture={arousalGesture}>
                  <Animated.View className="relative" style={{ height: 28, width: SLIDER_WIDTH }}>
                    <LinearGradient
                      colors={['#6366F1', '#64748B', '#EF4444']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: 6,
                        borderRadius: 3,
                        width: SLIDER_WIDTH,
                        marginTop: 11,
                      }}
                    />
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          top: 0,
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
                  </Animated.View>
                </GestureDetector>
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
                  Intensity: {isNaN(intensity) ? 0 : Math.round(intensity * 100)}%
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