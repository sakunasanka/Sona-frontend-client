import { saveDailyMood } from '@/api/mood';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    Circle,
    Defs,
    Path,
    RadialGradient,
    Stop
} from "react-native-svg";

//simple slider with gradient track and circular thumb

const SLIDER_WIDTH = 300;
const THUMB_SIZE = 30;

// Function to generate smooth curved path - can create star (negative), circle (0), or flower (positive)
const generateCurvedStarPath = (baseRadius: number, shapeValue: number) => {
    const centerX = 150;
    const centerY = 150;
    
    // Determine number of points based on shape value
    // Negative (star): 16 points for detailed star
    // Positive (flower): 10 points for 5 petals (5 peaks + 5 valleys)
    const totalPoints = shapeValue >= 0 ? 10 : 16;
    const points = [];
    
    // Generate all points first
    for (let i = 0; i < totalPoints; i++) {
        const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
        
        let currentRadius;
        
        // Use absolute threshold to handle floating point precision
        const threshold = 0.02;
        
        if (Math.abs(shapeValue) < threshold) {
            // Middle: Perfect circle (within threshold of 0)
            currentRadius = baseRadius;
        } else if (shapeValue < 0) {
            // Left side: Star shape with sharp points
            const pointiness = Math.abs(shapeValue); // 0 to 1
            if (i % 2 === 1) {
                // Odd points - extend outward as pointiness increases
                currentRadius = baseRadius + (baseRadius * pointiness * 0.35);
            } else {
                // Even points - pull inward as pointiness increases
                currentRadius = baseRadius - (baseRadius * pointiness * 0.2);
            }
        } else {
            // Right side: Flower shape with rounded petals (5 petals)
            const petalness = shapeValue; // 0 to 1
            if (i % 2 === 0) {
                // Even points - petal peaks (moderate bulge for rounded ends)
                currentRadius = baseRadius + (baseRadius * petalness * 0.3);
            } else {
                // Odd points - valleys between petals (gentle valleys)
                currentRadius = baseRadius - (baseRadius * petalness * 0.2);
            }
        }
        
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);
        points.push({ x, y });
    }
    
    // Create path with smooth curves
    let pathData = `M ${points[0].x},${points[0].y}`;
    
    // Magic number for circular Bezier curves
    // For flower: moderate value to create smooth rounded petal ends
    let magicNumber;
    const threshold = 0.07;
    
    if (Math.abs(shapeValue) < threshold) {
        // Circle: perfect circle magic number for 10 or 16 points
        magicNumber = totalPoints === 10 ? 0.2 : 0.1308;
    } else if (shapeValue > 0) {
        // Flower shape: moderate value for smooth rounded petal ends
        magicNumber = 0.15 + (Math.abs(shapeValue) * 0.1); // 0.25 to 0.35
    } else {
        // Star shape: standard value for 16 points
        magicNumber = 0.1308;
    }
    
    for (let i = 0; i < totalPoints; i++) {
        const current = points[i];
        const next = points[(i + 1) % totalPoints];
        
        // Calculate angles for tangent directions
        const currentAngle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
        const nextAngle = (Math.PI * 2 * ((i + 1) % totalPoints)) / totalPoints - Math.PI / 2;
        
        // Calculate distance from center for each point
        const currentDist = Math.sqrt((current.x - centerX) ** 2 + (current.y - centerY) ** 2);
        const nextDist = Math.sqrt((next.x - centerX) ** 2 + (next.y - centerY) ** 2);
        
        // For flower shape: different magic numbers for peaks vs valleys
        let controlDistance1, controlDistance2;
        
        if (shapeValue > threshold && totalPoints === 10) {
            // Flower shape: adjust control distances based on peak or valley
            // Even indices (i % 2 === 0) are petal peaks (outward) - use larger magic number for roundness
            // Odd indices (i % 2 === 1) are valleys (inward) - use smaller magic number for pointiness
            
            const peakMagicNumber = 0.25 + (Math.abs(shapeValue) * 0.15); // 0.25 to 0.4 for rounded peaks
            const valleyMagicNumber = 0.05 + (Math.abs(shapeValue) * 0.05); // 0.05 to 0.1 for sharp valleys
            
            // Current point
            if (i % 2 === 0) {
                // Peak - use larger control distance for roundness
                controlDistance1 = currentDist * peakMagicNumber;
            } else {
                // Valley - use smaller control distance for pointiness
                controlDistance1 = currentDist * valleyMagicNumber;
            }
            
            // Next point
            if ((i + 1) % 2 === 0) {
                // Peak - use larger control distance for roundness
                controlDistance2 = nextDist * peakMagicNumber;
            } else {
                // Valley - use smaller control distance for pointiness
                controlDistance2 = nextDist * valleyMagicNumber;
            }
        } else {
            // Circle or star: use standard magic number
            controlDistance1 = currentDist * magicNumber;
            controlDistance2 = nextDist * magicNumber;
        }
        
        // First control point: extends from current point tangent to the circle
        const cp1x = current.x - controlDistance1 * Math.sin(currentAngle);
        const cp1y = current.y + controlDistance1 * Math.cos(currentAngle);
        
        // Second control point: extends from next point tangent to the circle
        const cp2x = next.x + controlDistance2 * Math.sin(nextAngle);
        const cp2y = next.y - controlDistance2 * Math.cos(nextAngle);
        
        // Use cubic Bezier curve to next point
        pathData += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    
    // Close the path
    pathData += ' Z';
    
    return pathData;
};

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


export default function SampleMood() {
    const MAX_TRANSLATE_X = (SLIDER_WIDTH / 2) - (THUMB_SIZE / 2);
    const MIN_TRANSLATE_X = -(SLIDER_WIDTH / 2) + (THUMB_SIZE / 2);
    const translateX = useSharedValue(0); // Start at center (circle)
    const translateSpeed = useSharedValue(0); // Start at center speed
    const rotation = useSharedValue(0);
    const rotationDuration = useSharedValue(15000); // Store current duration
    const hasTriggeredHaptic = useSharedValue(false); // Track if haptic triggered in current drag
    const hasTriggeredSpeedHaptic = useSharedValue(false); // Track if haptic triggered for speed slider
    const shapeValue = useSharedValue(0); // -1 (star) to 0 (circle) to +1 (flower)
    const [shapePath, setShapePath] = useState(generateCurvedStarPath(100, 0));
    const [centerColorState, setCenterColorState] = useState('#90EE90'); // Light green
    const [edgeColorState, setEdgeColorState] = useState('#2D8B2D'); // Saturated green
    const [valenceValue, setValenceValue] = useState(0.00);
    const [arousalValue, setArousalValue] = useState(0.00);
    const [isLoading, setIsLoading] = useState(false);

    const getIntensityFromValues = (valence: number, arousal: number) => {
        return Math.sqrt(valence * valence + arousal * arousal) / Math.sqrt(2);
    };

    // Helper function to interpolate colors (moved outside to be pure)
    const interpolateColorValues = (color1: string, color2: string, factor: number) => {
        'worklet';
        // Convert hex to RGB
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substring(0, 2), 16);
        const g1 = parseInt(hex1.substring(2, 4), 16);
        const b1 = parseInt(hex1.substring(4, 6), 16);
        
        const r2 = parseInt(hex2.substring(0, 2), 16);
        const g2 = parseInt(hex2.substring(2, 4), 16);
        const b2 = parseInt(hex2.substring(4, 6), 16);
        
        // Interpolate
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
    // Derive colors from shapeValue - this runs on UI thread!
    const centerColor = useDerivedValue(() => {
        if (shapeValue.value < 0) {
            // Left side: green → orange (star)
            const factor = Math.abs(shapeValue.value);
            return interpolateColorValues('#90EE90', '#fc9935', factor);
        } else {
            // Right side: green → light blue (flower)
            const factor = shapeValue.value;
            return interpolateColorValues('#90EE90', '#ADD8E6', factor);
        }
    });
    
    const edgeColor = useDerivedValue(() => {
        if (shapeValue.value < 0) {
            // Left side: green → red (star)
            const factor = Math.abs(shapeValue.value);
            return interpolateColorValues('#2D8B2D', '#FF0000', factor);
        } else {
            // Right side: green → purple (flower)
            const factor = shapeValue.value;
            return interpolateColorValues('#2D8B2D', '#8B5A9F', factor);
        }
    });
    
    // Start continuous rotation animation
    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: rotationDuration.value,
                easing: Easing.linear,
            }),
            -1, // Repeat infinitely
            false
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const updateShape = (shapeVal: number) => {
        shapeValue.value = shapeVal; // Update shared value instead of state
        const baseRadius = 100;
        const newPath = generateCurvedStarPath(baseRadius, shapeVal);
        setShapePath(newPath);
        
                // Update state colors for SVG
        if (shapeVal < 0) {
            const factor = Math.abs(shapeVal);
            const newCenterColor = interpolateColorJS('#90EE90', '#fc9935', factor);
            setCenterColorState(newCenterColor);
            const newEdgeColor = interpolateColorJS('#2D8B2D', '#FF0000', factor);
            setEdgeColorState(newEdgeColor);
        } else {
            const factor = shapeVal;
            const newCenterColor = interpolateColorJS('#90EE90', '#ADD8E6', factor);
            setCenterColorState(newCenterColor);
            const newEdgeColor = interpolateColorJS('#2D8B2D', '#8B5A9F', factor);
            setEdgeColorState(newEdgeColor);
        }
    };
    
    // Helper function for JS thread color interpolation
    const interpolateColorJS = (color1: string, color2: string, factor: number) => {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substring(0, 2), 16);
        const g1 = parseInt(hex1.substring(2, 4), 16);
        const b1 = parseInt(hex1.substring(4, 6), 16);
        
        const r2 = parseInt(hex2.substring(0, 2), 16);
        const g2 = parseInt(hex2.substring(2, 4), 16);
        const b2 = parseInt(hex2.substring(4, 6), 16);
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    const updateRotationSpeed = (duration: number) => {
        // Update the stored duration
        rotationDuration.value = duration;
        
        // Smoothly transition: finish current cycle at new speed, then loop
        const currentAngle = rotation.value % 360;
        const remainingAngle = 360 - currentAngle;
        const remainingDuration = (remainingAngle / 360) * duration;
        
        // Finish current rotation smoothly
        rotation.value = withTiming(currentAngle + remainingAngle, {
            duration: remainingDuration,
            easing: Easing.linear,
        }, (finished) => {
            if (finished) {
                // Reset and start infinite loop at new speed
                rotation.value = 0;
                rotation.value = withRepeat(
                    withTiming(360, {
                        duration: duration,
                        easing: Easing.linear,
                    }),
                    -1,
                    false
                );
            }
        });
    };
    
    const drag = Gesture.Pan()
        .onBegin(() => {
            hasTriggeredHaptic.value = false; // Reset haptic flag at start of drag
        })
        .onChange((event) => {
            const newValue = translateX.value + event.changeX;
            const clampedValue = Math.max(MIN_TRANSLATE_X, Math.min(MAX_TRANSLATE_X, newValue));
            
            // Trigger haptic ONCE when trying to go beyond limits
            if (newValue !== clampedValue && !hasTriggeredHaptic.value) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                hasTriggeredHaptic.value = true;
            }
            
            translateX.value = clampedValue;
            
            // Calculate valence value and update state on JS thread
            const valenceVal = (clampedValue / 137).toFixed(2);
            runOnJS(setValenceValue)(parseFloat(valenceVal));
            
            // Calculate shape value based on slider position
            // Left = -1 (star), Middle = 0 (circle), Right = +1 (flower)
            const normalizedPosition = (translateX.value - MIN_TRANSLATE_X) / (MAX_TRANSLATE_X - MIN_TRANSLATE_X);
            const shapeVal = (normalizedPosition * 2) - 1; // Map from [0,1] to [-1,+1]
            
            runOnJS(updateShape)(shapeVal);
        })
        .onEnd(() => {
            translateX.value = withSpring(
                Math.max(MIN_TRANSLATE_X, Math.min(MAX_TRANSLATE_X, translateX.value)),
            );
        });

    const dragSpeed = Gesture.Pan()
        .onBegin(() => {
            hasTriggeredSpeedHaptic.value = false; // Reset haptic flag at start of drag
        })
        .onChange((event) => {
            const newValue = translateSpeed.value + event.changeX;
            const clampedValue = Math.max(MIN_TRANSLATE_X, Math.min(MAX_TRANSLATE_X, newValue));
            
            // Trigger haptic ONCE when trying to go beyond limits
            if (newValue !== clampedValue && !hasTriggeredSpeedHaptic.value) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                hasTriggeredSpeedHaptic.value = true;
            }
            
            translateSpeed.value = clampedValue;

            // Calculate arousal value and update state on JS thread
            const arousalValue = (clampedValue / 137).toFixed(2);
            runOnJS(setArousalValue)(parseFloat(arousalValue));
        })
        .onEnd(() => {
            // Update rotation speed based on final slider position
            const normalizedPosition = (translateSpeed.value - MIN_TRANSLATE_X) / (MAX_TRANSLATE_X - MIN_TRANSLATE_X);
            const duration = 5000 + (normalizedPosition * 20000); // Left=5s (fast), Right=25s (slow)
            
            runOnJS(updateRotationSpeed)(duration);
        });    const containerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }]
        }
    });

    const speedContainerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateSpeed.value }]
        }
    })
    
    // Animated rotation style for the SVG container
    const rotationStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }]
        };
    });

    return(
        <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
            {/* Radial gradient background from center */}
            <View style={{ 
                position: 'absolute',
                top: -50,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'flex-start',
            }}>
                <Svg width="600" height="600" viewBox="0 0 600 600">
                    <Defs>
                        <RadialGradient id="backgroundRadialGradient" cx="50%" cy="50%" r="50%">
                            <Stop offset="0%" stopColor={centerColorState} stopOpacity="0.4" />
                            <Stop offset="50%" stopColor={centerColorState} stopOpacity="0.2" />
                            <Stop offset="100%" stopColor={centerColorState} stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    <Circle 
                        cx="300" 
                        cy="300" 
                        r="300" 
                        fill="url(#backgroundRadialGradient)" 
                    />
                </Svg>
            </View>

            {/* Content Container */}
            <View style={{ alignItems: 'center', paddingTop: 56 }}>
                {/* Debug display */}
                {/* <Text className="text-lg font-bold mb-4">
                    Shape: {shapeValue < -0.1 ? 'Star' : shapeValue > 0.1 ? 'Flower' : 'Circle'} ({shapeValue.toFixed(2)})
                </Text> */}

                
                {/* Shape that changes based on slider */}
                <Animated.View style={[rotationStyle, { marginBottom: 40 }]}>
                    <Svg height="300" width="300" viewBox="0 0 300 300">
                        {/* Define gradients */}
                        <Defs>
                            {/* Radial gradient - from center (dynamically colored) */}
                            <RadialGradient id="shapeRadialGradient" cx="50%" cy="50%" r="50%">
                                <Stop offset="0%" stopColor={centerColorState} stopOpacity="1" />
                                <Stop offset="100%" stopColor={edgeColorState} stopOpacity="1" />
                            </RadialGradient>
                        </Defs>
                        
                        <Path
                            d={shapePath}
                            fill="url(#shapeRadialGradient)"
                            stroke={edgeColorState}
                            strokeWidth="3"
                        />
                    </Svg>
                </Animated.View>

                <View className="items-center mt-5">
                    <Text className="text-3xl font-bold text-white font-alegreya">How are you feeling now?</Text>
                    <Text className="text-gray-500 font-alegreyaSC">Drag the slider to adjust your mood</Text>
                </View>
            </View>

            <Text className='absolute bottom-72 w-full text-center text-white font-alegreya text-lg'>
                Do you feel more Positive or Negative?
            </Text>

            {/* Valence container */}
            <View className='absolute bottom-64 left-0 right-0 items-center justify-center'>
                {/* Gradient Track */}
                <LinearGradient 
                    colors={['#E7180B', '#698BF2']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ 
                        height: 20, 
                        width: SLIDER_WIDTH, 
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                />
                
                {/* Dragger on top of gradient */}
                <Animated.View style={[containerStyle, { 
                    height: THUMB_SIZE, 
                    width: SLIDER_WIDTH, 
                    position: 'absolute',
                    justifyContent: 'center',
                    alignItems: 'center'
                }]}>
                    <GestureDetector gesture={drag}>
                        <Animated.View
                            style={{
                                height: THUMB_SIZE,
                                width: THUMB_SIZE,
                                borderRadius: THUMB_SIZE / 2,
                                backgroundColor: 'white',
                                borderWidth: 2,
                                borderColor: '#ccc',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3,
                                elevation: 5,
                            }} 
                        />
                    </GestureDetector>
                </Animated.View>
            </View>

            <Text className='absolute bottom-52 w-full text-center text-white font-alegreya text-lg'>
                How Excited are you?
            </Text>

            {/* Arousal Container */}
            <View className='absolute bottom-44 left-0 right-0 items-center justify-center'>
                {/* Gradient Track */}
                <LinearGradient 
                    colors={['#FFD230', '#A2F4FD']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ 
                        height: 20, 
                        width: SLIDER_WIDTH, 
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                />
                
                {/* Dragger on top of gradient */}
                <Animated.View style={[speedContainerStyle, { 
                    height: THUMB_SIZE, 
                    width: SLIDER_WIDTH, 
                    position: 'absolute',
                    justifyContent: 'center',
                    alignItems: 'center'
                }]}>
                    <GestureDetector gesture={dragSpeed}>
                        <Animated.View
                            style={{
                                height: THUMB_SIZE,
                                width: THUMB_SIZE,
                                borderRadius: THUMB_SIZE / 2,
                                backgroundColor: 'white',
                                borderWidth: 2,
                                borderColor: '#ccc',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3,
                                elevation: 5,
                            }} 
                        />
                    </GestureDetector>
                </Animated.View>
            </View>

            <TouchableOpacity
                style={{
                    position: 'absolute',
                    bottom: 40,
                    left: 20,
                    right: 20,
                    backgroundColor: '#4CAF50',
                    paddingVertical: 12,
                    borderRadius: 25,
                    alignItems: 'center',
                }}
                onPress={async () => {
                    // Handle save action
                    console.log('Saved Mood - Valence:', valenceValue, 'Arousal:', arousalValue);
                    const intensity = getIntensityFromValues(valenceValue, arousalValue);

                    setIsLoading(true);
                    const mood = getMoodFromValues(valenceValue, arousalValue);
                    console.log('Determined Mood:', mood, 'Intensity:', intensity);
                    try{
                        await saveDailyMood({
                        mood,
                        valence: valenceValue,
                        arousal: arousalValue,
                        intensity,
                    });
                    setIsLoading(false);
                    }catch(e){
                        console.log('Error saving mood:', e);
                    }
                    finally{
                        setIsLoading(false);
                        router.back();
                    }
                }}
            >
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Save Mood</Text>
            </TouchableOpacity>
        </View>
    )
}