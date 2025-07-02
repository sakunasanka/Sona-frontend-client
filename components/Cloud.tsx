import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CloudFloatingAnimationProps = {
  visible?: boolean;
  onAnimationComplete?: () => void;
};

const CloudFloatingAnimation = ({ visible = true, onAnimationComplete }: CloudFloatingAnimationProps) => {
  // Simple shared values
  const opacity = useSharedValue(0);
  const translateX1 = useSharedValue(screenWidth + 200); // Start from right
  const translateX2 = useSharedValue(screenWidth + 150);
  const translateX3 = useSharedValue(screenWidth + 100);
  const floatY = useSharedValue(0);

  // State to track component visibility without reading shared value during render
  const [isVisible, setIsVisible] = useState(visible);

  // Pre-computed cloud image source to avoid require() calls in render
  const cloudSource = useMemo(() => require('../assets/images/cloud.png'), []);

  const handleComplete = useCallback(() => {
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  }, [onAnimationComplete]);

  // Sync visibility state with prop
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Start opacity animation
      opacity.value = withTiming(1, {
        duration: 1000,
      });

      // Start floating animation
      floatY.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-15, { duration: 4000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );

      // Front layer - fastest (optimized for speed)
      translateX1.value = withTiming(-200, {
        duration: 8000, // Further reduced for faster animation
        easing: Easing.linear,
      }, (finished) => {
        if (finished) {
          runOnJS(handleComplete)();
        }
      });

      // Middle layer - medium speed
      translateX2.value = withTiming(-150, {
        duration: 10000, // Reduced for faster animation
        easing: Easing.linear,
      });

      // Back layer - slowest
      translateX3.value = withTiming(-100, {
        duration: 12000, // Reduced for faster animation
        easing: Easing.linear,
      });

    } else {
      opacity.value = withTiming(0, { duration: 500 });
      
      // Reset positions
      translateX1.value = screenWidth + 200;
      translateX2.value = screenWidth + 150;
      translateX3.value = screenWidth + 100;
      floatY.value = 0;
    }
  }, [visible, opacity, floatY, translateX1, translateX2, translateX3, handleComplete]);

  // Ultra-optimized Cloud component with pre-computed styles
  const Cloud = React.memo(({ size, opacity: cloudOpacity = 1 }: { size: number; opacity?: number }) => {
    const cloudStyle = useMemo(() => ({
      width: size,
      height: size * 0.6,
      opacity: cloudOpacity,
      tintColor: `rgba(174, 175, 247, ${cloudOpacity})`,
    }), [size, cloudOpacity]);

    return (
      <Image
        source={cloudSource}
        style={cloudStyle}
        resizeMode="contain"
      />
    );
  });
  Cloud.displayName = 'Cloud';

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const frontLayerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX1.value },
      { translateY: floatY.value },
    ],
  }));

  const middleLayerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX2.value },
      { translateY: floatY.value * 0.7 },
    ],
  }));

  const backLayerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX3.value },
      { translateY: floatY.value * 0.5 },
    ],
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.View style={styles.animationContainer}>
        {/* Back layer - highest position, most transparent, slowest */}
        <Animated.View style={[styles.layer, backLayerStyle, { top: screenHeight * 0.4, zIndex: 1 }]}>
          <Cloud size={60} opacity={0.35} />
          <View style={{ width: 200 }} />
          <Cloud size={70} opacity={0.4} />
          <View style={{ width: 200 }} />
          <Cloud size={70} opacity={0.44} />
        </Animated.View>

        {/* Middle layer - medium position, medium transparency, medium speed */}
        <Animated.View style={[styles.layer, middleLayerStyle, { top: screenHeight * 0.42, zIndex: 2 }]}>
          <Cloud size={85} opacity={0.5} />
          <View style={{ width: 150 }} />
          <Cloud size={95} opacity={0.55} />
        </Animated.View>

        {/* Front layer - lowest position, most opaque, fastest */}
        <Animated.View style={[styles.layer, frontLayerStyle, { top: screenHeight * 0.45, zIndex: 3 }]}>
          <Cloud size={120} opacity={0.8} />
          <View style={{ width: 100 }} />
          <Cloud size={135} opacity={0.85} />
          <View style={{ width: 100 }} />
          <Cloud size={135} opacity={0.89} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(232, 233, 255, 0.5)', // Slightly more transparent for better blending
    zIndex: 1000,
  },
  animationContainer: {
    flex: 1,
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    width: screenWidth * 1.7, // Further reduced for performance
    paddingHorizontal: 15, // Reduced padding
  },
});

export default CloudFloatingAnimation;