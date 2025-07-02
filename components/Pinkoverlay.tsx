import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface PinkOverlayProps {
  visible: boolean;
  onAnimationComplete: () => void;
}

export default function PinkOverlay({ visible, onAnimationComplete }: PinkOverlayProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start animation sequence
      opacity.value = withTiming(0.7, { duration: 300 });
      scale.value = withSequence(
        withTiming(1.2, { duration: 400 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            opacity.value = withTiming(0, { duration: 200 }, (finished) => {
              if (finished) {
                runOnJS(onAnimationComplete)();
              }
            });
          }
        })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, animatedStyle]}>
        <View style={styles.circle} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.3)', // Pink background
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(236, 72, 153, 0.4)',
    position: 'absolute',
  },
  circle2: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
  },
  circle3: {
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
});