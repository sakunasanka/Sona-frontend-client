import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface Leaf {
  id: number;
  startX: number;
  delay: number;
}

interface FallingLeavesProps {
  visible: boolean;
  onAnimationComplete: () => void;
}

const LeafShape = ({ size = 20, color = '#8B5CF6' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9L15 12L21 15C21.6 15.3 22 15.9 22 16.5C22 17.3 21.3 18 20.5 18C20.1 18 19.7 17.8 19.5 17.5L12 12L4.5 17.5C4.3 17.8 3.9 18 3.5 18C2.7 18 2 17.3 2 16.5C2 15.9 2.4 15.3 3 15L9 12L3 9C2.4 8.7 2 8.1 2 7.5C2 6.7 2.7 6 3.5 6C3.9 6 4.3 6.2 4.5 6.5L12 12L19.5 6.5C19.7 6.2 20.1 6 20.5 6C21.3 6 22 6.7 22 7.5C22 8.1 21.6 8.7 21 9Z"
      fill={color}
    />
  </Svg>
);

const FallingLeaf = ({ leaf, visible, onComplete }: { leaf: Leaf; visible: boolean; onComplete: () => void }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(leaf.startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      const startAnimation = () => {
        // Falling animation
        translateY.value = withTiming(height + 50, {
          duration: 3000 + Math.random() * 2000,
          easing: Easing.out(Easing.quad),
        }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        });

        // Horizontal drift (right to left)
        translateX.value = withTiming(leaf.startX - 100 - Math.random() * 200, {
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.quad),
        });

        // Rotation animation
        rotation.value = withRepeat(
          withTiming(360, {
            duration: 2000 + Math.random() * 1000,
            easing: Easing.linear,
          }),
          -1,
          false
        );

        // Fade out near the end
        setTimeout(() => {
          opacity.value = withTiming(0, { duration: 500 });
        }, 2500 + Math.random() * 1500);
      };

      setTimeout(startAnimation, leaf.delay);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.leaf, animatedStyle]}>
      <LeafShape size={24} color="#8B5CF6" />
    </Animated.View>
  );
};

export default function FallingLeaves({ visible, onAnimationComplete }: FallingLeavesProps) {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (visible) {
      const newLeaves: Leaf[] = [];
      for (let i = 0; i < 15; i++) {
        newLeaves.push({
          id: i,
          startX: width - 50 + Math.random() * 100, // Start from right side
          delay: Math.random() * 2000, // Random delay up to 2 seconds
        });
      }
      setLeaves(newLeaves);
      setCompletedCount(0);
    }
  }, [visible]);

  const handleLeafComplete = () => {
    setCompletedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= leaves.length) {
        setTimeout(onAnimationComplete, 500); // Small delay before calling complete
      }
      return newCount;
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {leaves.map(leaf => (
        <FallingLeaf
          key={leaf.id}
          leaf={leaf}
          visible={visible}
          onComplete={handleLeafComplete}
        />
      ))}
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
  leaf: {
    position: 'absolute',
  },
});