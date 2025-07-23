import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { icons } from '../../../constants/icons'; // Adjust the path as necessary

const MeditationApp = () => {
  const [isActive, setIsActive] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes default
  const [selectedTime, setSelectedTime] = useState(120);
  const intervalRef = useRef<any>(null);
  const breathIntervalRef = useRef<any>(null);

  // Animated values
  const backgroundOpacity = useSharedValue(0);
  const circle1Scale = useSharedValue(0.7);
  const circle2Scale = useSharedValue(0.7);
  const circle3Scale = useSharedValue(0.7);
  const circle1Rotation = useSharedValue(0);
  const circle2Rotation = useSharedValue(0);
  const circle3Rotation = useSharedValue(0);
  const circle1Opacity = useSharedValue(0);
  const circle2Opacity = useSharedValue(0);
  const circle3Opacity = useSharedValue(0);
  const setupOpacity = useSharedValue(1);
  const meditationOpacity = useSharedValue(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerHaptic = () => {
    // Android haptic feedback may not be as reliable, so we add a fallback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  };

  const startBreathingCycle = () => {
    const breathe = () => {
      setBreathPhase(prev => {
        const newPhase = prev === 'inhale' ? 'exhale' : 'inhale';
        
        // Haptic feedback on phase change
        runOnJS(triggerHaptic)();
        
        if (newPhase === 'inhale') {
          // Inhale - expand circles
          circle1Scale.value = withTiming(1.3, { 
            duration: 4000, 
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
          });
          circle2Scale.value = withTiming(1.1, { 
            duration: 4000, 
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
          });
          circle3Scale.value = withTiming(0.9, { 
            duration: 4000, 
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
          });
        } else {
          // Exhale - contract circles
          circle1Scale.value = withTiming(0.6, { 
            duration: 4000, 
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
          });
          circle2Scale.value = withTiming(0.7, { 
            duration: 4000, 
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
          });
          circle3Scale.value = withTiming(0.8, { 
            duration: 4000, 
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
          });
        }
        
        return newPhase;
      });
    };

    breathe(); // Initial call
    breathIntervalRef.current = setInterval(breathe, 4000);
  };

  const startMeditation = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
    
    setIsActive(true);
    
    // Fade out setup screen
    setupOpacity.value = withTiming(0, { duration: 500 });
    
    // Fade in dark background
    backgroundOpacity.value = withTiming(1, { duration: 1000 });
    
    // Initial chaos animation - circles rotating and moving
    circle1Rotation.value = withSequence(
      withTiming(360, { duration: 2000, easing: Easing.bezier(0.4, 0.0, 0.2, 1) }),
      withTiming(0, { duration: 1000, easing: Easing.bezier(0.4, 0.0, 0.2, 1) })
    );
    circle2Rotation.value = withSequence(
      withTiming(-240, { duration: 2000, easing: Easing.bezier(0.4, 0.0, 0.2, 1) }),
      withTiming(0, { duration: 1000, easing: Easing.bezier(0.4, 0.0, 0.2, 1) })
    );
    circle3Rotation.value = withSequence(
      withTiming(480, { duration: 2000, easing: Easing.bezier(0.4, 0.0, 0.2, 1) }),
      withTiming(0, { duration: 1000, easing: Easing.bezier(0.4, 0.0, 0.2, 1) })
    );
    
    // Fade in circles with stagger
    circle1Opacity.value = withTiming(0.3, { duration: 1000, easing: Easing.out(Easing.quad) });
    setTimeout(() => {
      circle2Opacity.value = withTiming(0.5, { duration: 1000, easing: Easing.out(Easing.quad) });
    }, 300);
    setTimeout(() => {
      circle3Opacity.value = withTiming(0.8, { duration: 1000, easing: Easing.out(Easing.quad) });
    }, 600);
    
    // Show meditation screen
    setTimeout(() => {
      meditationOpacity.value = withTiming(1, { duration: 1000 });
      setIsBreathing(true);
      startBreathingCycle();
    }, 2000);

    // Start timer
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopMeditation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseMeditation = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
    setIsBreathing(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
  };

  const stopMeditation = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
    
    setIsActive(false);
    setIsBreathing(false);
    setTimeLeft(selectedTime);
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    
    // Reset animations
    meditationOpacity.value = withTiming(0, { duration: 500 });
    backgroundOpacity.value = withTiming(0, { duration: 1000 });
    circle1Opacity.value = withTiming(0, { duration: 500 });
    circle2Opacity.value = withTiming(0, { duration: 500 });
    circle3Opacity.value = withTiming(0, { duration: 500 });
    
    setTimeout(() => {
      setupOpacity.value = withTiming(1, { duration: 500 });
    }, 500);
  };

  const setTimer = async (minutes: number) => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
    const seconds = minutes * 60;
    setSelectedTime(seconds);
    setTimeLeft(seconds);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    };
  }, []);

  // Animated styles
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const setupStyle = useAnimatedStyle(() => ({
    opacity: setupOpacity.value,
  }));

  const meditationStyle = useAnimatedStyle(() => ({
    opacity: meditationOpacity.value,
  }));

  const circle1Style = useAnimatedStyle(() => ({
    transform: [
      { scale: circle1Scale.value },
      { rotate: `${circle1Rotation.value}deg` }
    ],
    opacity: circle1Opacity.value,
  }));

  const circle2Style = useAnimatedStyle(() => ({
    transform: [
      { scale: circle2Scale.value },
      { rotate: `${circle2Rotation.value}deg` }
    ],
    opacity: circle2Opacity.value,
  }));

  const circle3Style = useAnimatedStyle(() => ({
    transform: [
      { scale: circle3Scale.value },
      { rotate: `${circle3Rotation.value}deg` }
    ],
    opacity: circle3Opacity.value,
  }));

  const timerOptions = [1, 2, 5, 10, 15, 20];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isActive ? "light-content" : "dark-content"} 
        backgroundColor={isActive ? "#000000" : "#ffffff"}
        translucent={false}
      />
      
      {/* Dark Background Overlay */}
      <Animated.View style={[styles.darkOverlay, backgroundStyle]} />
      
      {/* Setup Screen */}
      <Animated.View style={[styles.setupContainer, setupStyle]}>
          <Text style={styles.headerTitle}>Meditation</Text>
          <View style={styles.spacer} />

        <View style={styles.setupContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#F09E54', '#F09A59']}
              style={styles.iconGradient}
            >
              <View style={styles.iconInner}>
                <View style={styles.iconCenter} />
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.title}>Breathing Exercise</Text>
          <Text style={styles.subtitle}>Focus on your breath and find your inner peace</Text>

          <View style={styles.timerCard}>
            <Text style={styles.timerTitle}>Set Timer</Text>
            <View style={styles.timerGrid}>
              {timerOptions.map((minutes: number) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.timerButton,
                    selectedTime === minutes * 60 && styles.timerButtonActive
                  ]}
                  onPress={() => setTimer(minutes)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[
                    styles.timerButtonText,
                    selectedTime === minutes * 60 && styles.timerButtonTextActive
                  ]}>
                    {minutes}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.selectedTime}>{formatTime(timeLeft)}</Text>
          </View>

          <TouchableOpacity 
            style={styles.startButton} 
            onPress={startMeditation}
            activeOpacity={0.8}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <LinearGradient
              colors={['#F09E54', '#F09A59']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>▶ Start Meditation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Meditation Screen */}
      <Animated.View style={[styles.meditationContainer, meditationStyle]}>
        <View style={styles.circlesContainer}>
          {/* Circle 1 - Outermost */}
          <Animated.View style={[styles.circle1, circle1Style]}>
            <LinearGradient
              colors={['rgba(250, 168, 84, 0.5)', 'rgba(250, 164, 89, 0.4)']}
              style={styles.circleGradient}
            />
          </Animated.View>

          {/* Circle 2 - Middle */}
          <Animated.View style={[styles.circle2, circle2Style]}>
            <LinearGradient
              colors={['rgba(240, 158, 84, 0.5)', 'rgba(240, 154, 89, 0.4)']}
              style={styles.circleGradient}
            />
          </Animated.View>

          {/* Circle 3 - Innermost */}
          <Animated.View style={[styles.circle3, circle3Style]}>
            <LinearGradient
              colors={['rgba(240, 160, 84, 0.9)', 'rgba(240, 160, 89, 0.6)']}
              style={styles.circleGradient}
            />
          </Animated.View>
        </View>

        <View style={styles.breathInstructions}>
          <Text style={styles.breathText}>
            {breathPhase === 'inhale' ? 'Breathe In' : 'Breathe Out'}
          </Text>
          <Text style={styles.breathSubtext}>Follow the circle</Text>
        </View>

        <Text style={styles.timerDisplay}>{formatTime(timeLeft)}</Text>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={isBreathing ? pauseMeditation : startMeditation}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >     
            <Image source={isBreathing ? icons.pause : icons.play} style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={stopMeditation}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.controlButtonText}>⟲</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1,
    pointerEvents: 'none', // Allow touch events to pass through to underlying components
  },
  setupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 20,
  },
  headerTitle: {
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  spacer: {
    width: 60,
  },
  setupContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    // iOS shadows
    ...Platform.select({
      ios: {
        shadowColor: '#F09E54',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F09E54',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22, // Better text rendering on Android
  },
  timerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    // Platform-specific shadows
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  timerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    // Use margin instead of gap for better Android compatibility
    marginHorizontal: -6,
  },
  timerButton: {
    width: 60,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 6,
    marginVertical: 6,
    // Ensure minimum touch target for Android
    minHeight: 44,
    minWidth: 44,
  },
  timerButtonActive: {
    backgroundColor: '#F09E54',
    borderColor: '#F09E54',
  },
  timerButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center', // Better text alignment on Android
  },
  timerButtonTextActive: {
    color: '#ffffff',
    textAlign: 'center',
  },
  selectedTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F09E54',
    textAlign: 'center',
  },
  startButton: {
    borderRadius: 30,
    // Ensure minimum touch target
    minHeight: 48,
    minWidth: 200,
    // Platform-specific shadows
    ...Platform.select({
      ios: {
        shadowColor: '#F09E54',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  startButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  meditationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  circlesContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
  circle2: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
  circle3: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  breathInstructions: {
    alignItems: 'center',
    marginBottom: 32,
  },
  breathText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  breathSubtext: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
  },
  timerDisplay: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // Replace gap with margin for Android compatibility
    marginHorizontal: -8,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    // Ensure proper touch target
    minHeight: 60,
    minWidth: 60,
  },
  controlButtonText: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default MeditationApp;