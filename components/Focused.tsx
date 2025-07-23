import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';


interface FocusAnimationProps {
  visible: boolean;
  onAnimationComplete: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FocusAnimation = ({ visible, onAnimationComplete }: FocusAnimationProps) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pulse = useSharedValue(1);
  const ripple = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      startFocusAnimation();
    } else {
      resetAnimation();
    }
  }, [visible]);

  const startFocusAnimation = () => {
    // Reset all animations
    scale.value = 0;
    opacity.value = 0;
    pulse.value = 1;
    ripple.value = 0;
    overlayOpacity.value = 0;

    // Phase 1: Quick overlay fade in
    overlayOpacity.value = withTiming(0.3, { duration: 200 });

    // Phase 2: Center focus element appears and scales
    scale.value = withTiming(1, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
    ripple.value = withTiming(1, { duration: 800 });

    // Phase 3: Pulsing effect for focus feeling (starts after scale animation)
    setTimeout(() => {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        2, // 2 complete cycles
        false,
        () => {
          // Phase 4: Fade out after pulsing
          opacity.value = withTiming(0, { duration: 400 });
          overlayOpacity.value = withTiming(0, { duration: 400 }, () => {
            if (onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          });
        }
      );
    }, 300);
  };

  const resetAnimation = () => {
    scale.value = 0;
    opacity.value = 0;
    pulse.value = 1;
    ripple.value = 0;
    overlayOpacity.value = 0;
  };

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const rippleStyle = useAnimatedStyle(() => {
    const rippleScale = interpolate(
      ripple.value,
      [0, 1],
      [0, 4],
      Extrapolate.CLAMP
    );
    const rippleOpacity = interpolate(
      ripple.value,
      [0, 0.3, 1],
      [0.8, 0.4, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale: rippleScale }],
      opacity: rippleOpacity,
    };
  });

  const focusCircleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value * pulse.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Background overlay for focus effect */}
      <Animated.View style={[styles.overlay, overlayStyle]} />
      
      {/* Center focus element */}
      <View style={styles.centerContainer}>
        {/* Ripple effects */}
        <Animated.View style={[styles.ripple, rippleStyle]} />
        
        {/* Main focus circle */}
        <Animated.View style={[styles.focusCircle, focusCircleStyle]}>
          {/* Inner glow effect */}
          <View style={styles.innerGlow} />
          
          {/* Focus indicator dots */}
          <View style={styles.focusDots}>
            <View style={[styles.dot, styles.dotTop]} />
            <View style={[styles.dot, styles.dotRight]} />
            <View style={[styles.dot, styles.dotBottom]} />
            <View style={[styles.dot, styles.dotLeft]} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute' as const,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A0E3E2',
  },
  focusCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(160, 227, 226, 0.2)',
    borderWidth: 3,
    borderColor: '#A0E3E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A0E3E2',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  innerGlow: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(160, 227, 226, 0.3)',
  },
  focusDots: {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  },
  dot: {
    position: 'absolute' as const,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A0E3E2',
  },
  dotTop: {
    top: 10,
    left: '50%',
    marginLeft: -4,
  },
  dotRight: {
    right: 10,
    top: '50%',
    marginTop: -4,
  },
  dotBottom: {
    bottom: 10,
    left: '50%',
    marginLeft: -4,
  },
  dotLeft: {
    left: 10,
    top: '50%',
    marginTop: -4,
  },
});

export default FocusAnimation;