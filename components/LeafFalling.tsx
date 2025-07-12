import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface MapleLeaf {
  id: number;
  startX: number;
  startY: number;
  delay: number;
  size: number;
  rotationSpeed: number;
  leafImage: any; // For different colored leaf PNGs
}

interface AutumnMapleLeavesProps {
  visible: boolean;
  onAnimationComplete: () => void;
}

// Using PNG images - add your maple leaf PNGs to assets/images/
interface MapleLeafPNGProps {
  size?: number;
  leafImage: any; // You can replace 'any' with ImageSourcePropType if you want stricter typing
  tintColor?: string;
}

const MapleLeafPNG: React.FC<MapleLeafPNGProps> = ({ size = 24, leafImage, tintColor }) => (
  <Image
    source={leafImage}
    style={{
      width: size,
      height: size,
      resizeMode: 'contain',
      tintColor: tintColor, // This will tint your PNG with autumn colors
    }}
  />
);

const FallingMapleLeaf = ({ leaf, visible, onComplete }: { leaf: MapleLeaf; visible: boolean; onComplete: () => void }) => {
  const translateY = useSharedValue(leaf.startY);
  const translateX = useSharedValue(leaf.startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Autumn color variants
  const autumnColors = [
    '#FF6B35', // Orange
    '#FFB347', // Light orange  
    '#FF8C42', // Orange yellow
    '#D2691E', // Saddle brown
    '#FF4500', // Red orange
    '#FFA500', // Pure orange
    '#DAA520', // Goldenrod
  ];

  const leafColor = autumnColors[leaf.id % autumnColors.length];

  useEffect(() => {
    if (visible) {
      const startAnimation = () => {
        // Realistic falling motion with wind effect
        translateY.value = withTiming(height + 100, {
          duration: 4000 + Math.random() * 3000,
          easing: Easing.out(Easing.quad),
        }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        });

        // Natural side-to-side drift with wind gusts
        const windDirection = Math.random() > 0.5 ? 1 : -1;
        translateX.value = withTiming(
          leaf.startX + windDirection * (50 + Math.random() * 150), 
          {
            duration: 4000 + Math.random() * 3000,
            easing: Easing.inOut(Easing.sin),
          }
        );

        // Natural leaf spinning
        rotation.value = withRepeat(
          withTiming(360, {
            duration: leaf.rotationSpeed,
            easing: Easing.linear,
          }),
          -1,
          false
        );

        // Gentle scaling for depth perception
        scale.value = withTiming(0.7 + Math.random() * 0.6, {
          duration: 2000 + Math.random() * 1000,
          easing: Easing.inOut(Easing.quad),
        });

        // Fade out naturally
        setTimeout(() => {
          opacity.value = withTiming(0, { 
            duration: 1500,
            easing: Easing.out(Easing.quad)
          });
        }, 2500 + Math.random() * 2000);
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
      <MapleLeafPNG 
        size={leaf.size} 
        leafImage={leaf.leafImage}
        tintColor={leafColor}
      />
    </Animated.View>
  );
};

export default function AutumnMapleLeaves({ visible, onAnimationComplete }: AutumnMapleLeavesProps) {
  const [leaves, setLeaves] = useState<MapleLeaf[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [showMascot, setShowMascot] = useState(false);

  // Mascot animation values
  const mascotOpacity = useSharedValue(0);
  const mascotScale = useSharedValue(0.5);

  // Add your maple leaf PNG files to assets/images/ folder
  const leafImages = useMemo(() => [
    require('@/assets/images/leaf1.png'), // Replace with your PNG files
    require('@/assets/images/leaf2.png'), // You can have multiple variations
    require('@/assets/images/leaf1.png'), // Or just use one image multiple times
    // If you only have one image, just repeat it:
    // require('@/assets/images/maple-leaf.png'),
    // require('@/assets/images/maple-leaf.png'),
    // require('@/assets/images/maple-leaf.png'),
  ], []);

  useEffect(() => {
    if (visible) {
      // Show mascot immediately when animation starts
      setShowMascot(true);
      
      // Animate mascot appearance right away
      mascotOpacity.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
      });
      mascotScale.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
      });

      const newLeaves: MapleLeaf[] = [];
      for (let i = 0; i < 50; i++) {
        newLeaves.push({
          id: i,
          startX: Math.random() * (width + 200) - 100, // Start across entire screen width
          startY: -100 - Math.random() * 300, // Stagger starting heights
          delay: Math.random() * 4000 + 1000, // Add 1 second delay so mascot appears first
          size: 25 + Math.random() * 30, // Size variation (25-55px)
          rotationSpeed: 2500 + Math.random() * 3500, // Natural rotation variation
          leafImage: leafImages[Math.floor(Math.random() * leafImages.length)], // Random leaf shape
        });
      }
      setLeaves(newLeaves);
      setCompletedCount(0);

    } else {
      setShowMascot(false);
      mascotOpacity.value = 0;
      mascotScale.value = 0.5;
    }
  }, [visible, leafImages, mascotOpacity, mascotScale]);

  const handleLeafComplete = () => {
    setCompletedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= leaves.length) {
        // Start mascot fade out when all leaves are done
        mascotOpacity.value = withTiming(0, {
          duration: 800,
          easing: Easing.in(Easing.quad),
        });
        mascotScale.value = withTiming(0.5, {
          duration: 800,
          easing: Easing.in(Easing.quad),
        });
        
        // Complete the animation after mascot fades out
        setTimeout(() => {
          setShowMascot(false);
          onAnimationComplete();
        }, 1000); // Wait for mascot fade out to complete
      }
      return newCount;
    });
  };

  // Mascot animated style
  const mascotAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: mascotOpacity.value,
      transform: [{ scale: mascotScale.value }],
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Warm autumn atmosphere overlay */}
      <View style={styles.autumnAtmosphere} />

      {/* Animated mascot - appears before leaves fall with your margins */}
      {showMascot && (
        <Animated.View style={[{
          position: 'absolute',
          marginLeft: 240,
          marginTop: 600,
          zIndex: 10,
        }, mascotAnimatedStyle]}>
          <Image
            source={require('@/assets/images/mascot/mascot-happy.png')}
            style={{
              width: 150,
              height: 150,
              resizeMode: 'contain',
            }}
          />
        </Animated.View>
      )}
      
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
  autumnAtmosphere: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 140, 66, 0.3)', // Warm autumn glow
  },
  leaf: {
    position: 'absolute',
  },
});