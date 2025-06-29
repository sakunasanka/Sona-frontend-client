import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface MapleLeaf {
  id: number;
  startX: number;
  startY: number;
  delay: number;
  size: number;
  colorVariant: number; // 0-4 for different autumn colors
  rotationSpeed: number;
}

interface AutumnMapleLeavesProps {
  visible: boolean;
  onAnimationComplete: () => void;
}

// Custom Maple Leaf SVG with autumn colors
const MapleLeafSVG = ({ size = 24, colorVariant = 0 }) => {
  const colors = [
    ['#FF6B35', '#FFB347'], // Orange to light orange
    ['#FF8C42', '#FFDE59'], // Orange to yellow
    ['#D2691E', '#DAA520'], // Saddle brown to goldenrod
    ['#FF4500', '#FFA500'], // Red orange to orange
    ['#B8860B', '#F0E68C'], // Dark goldenrod to khaki
  ];
  
  const [color1, color2] = colors[colorVariant % colors.length];
  
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`gradient-${colorVariant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color1} stopOpacity="1" />
          <Stop offset="100%" stopColor={color2} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Path
        d="M50 5 
           C52 8, 60 12, 65 20
           C70 25, 75 30, 80 40
           C85 50, 82 60, 75 65
           C70 70, 65 68, 60 65
           C55 62, 52 58, 50 55
           C48 58, 45 62, 40 65
           C35 68, 30 70, 25 65
           C18 60, 15 50, 20 40
           C25 30, 30 25, 35 20
           C40 12, 48 8, 50 5 Z
           M50 55
           L48 75
           C47 80, 48 85, 50 90
           C52 85, 53 80, 52 75
           L50 55 Z"
        fill={`url(#gradient-${colorVariant})`}
        stroke="#8B4513"
        strokeWidth="0.5"
      />
    </Svg>
  );
};

// Alternative: Using PNG image (uncomment and use this if you have a maple leaf PNG)
/*
const MapleLeafPNG = ({ size = 24, source }) => (
  <Image
    source={source} // Your PNG file: require('@/assets/images/maple-leaf.png')
    style={{
      width: size,
      height: size,
      resizeMode: 'contain',
    }}
  />
);
*/

const FallingMapleLeaf = ({ leaf, visible, onComplete }: { leaf: MapleLeaf; visible: boolean; onComplete: () => void }) => {
  const translateY = useSharedValue(leaf.startY);
  const translateX = useSharedValue(leaf.startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      const startAnimation = () => {
        // Falling animation with slight curve
        translateY.value = withTiming(height + 100, {
          duration: 4000 + Math.random() * 3000, // Slower fall for autumn feel
          easing: Easing.out(Easing.quad),
        }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        });

        // Gentle side-to-side drift (like real leaves)
        translateX.value = withTiming(leaf.startX + (Math.random() - 0.5) * 200, {
          duration: 4000 + Math.random() * 3000,
          easing: Easing.inOut(Easing.sin),
        });

        // Gentle rotation like real leaves
        rotation.value = withRepeat(
          withTiming(360, {
            duration: leaf.rotationSpeed,
            easing: Easing.linear,
          }),
          -1,
          false
        );

        // Subtle scale animation for depth
        scale.value = withTiming(0.8 + Math.random() * 0.4, {
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
        });

        // Fade out in the last portion
        setTimeout(() => {
          opacity.value = withTiming(0, { duration: 1000 });
        }, 3000 + Math.random() * 2000);
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
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.leaf, animatedStyle]}>
      <MapleLeafSVG size={leaf.size} colorVariant={leaf.colorVariant} />
      {/* If using PNG instead, uncomment below and comment above */}
      {/* <MapleLeafPNG size={leaf.size} source={require('@/assets/images/maple-leaf.png')} /> */}
    </Animated.View>
  );
};

export default function AutumnMapleLeaves({ visible, onAnimationComplete }: AutumnMapleLeavesProps) {
  const [leaves, setLeaves] = useState<MapleLeaf[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (visible) {
      const newLeaves: MapleLeaf[] = [];
      for (let i = 0; i < 20; i++) { // More leaves for autumn effect
        newLeaves.push({
          id: i,
          startX: Math.random() * (width + 100) - 50, // Random starting position across screen
          startY: -50 - Math.random() * 200, // Start from various heights above screen
          delay: Math.random() * 3000, // Staggered timing
          size: 20 + Math.random() * 25, // Varied sizes (20-45px)
          colorVariant: Math.floor(Math.random() * 5), // Random autumn color
          rotationSpeed: 3000 + Math.random() * 4000, // Varied rotation speeds
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
        setTimeout(onAnimationComplete, 1000); // Longer delay for autumn ambiance
      }
      return newCount;
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Subtle autumn background overlay */}
      <View style={styles.autumnOverlay} />
      
      {leaves.map(leaf => (
        <FallingMapleLeaf
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
  autumnOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 140, 66, 0.05)', // Very subtle warm autumn tint
  },
  leaf: {
    position: 'absolute',
  },
});