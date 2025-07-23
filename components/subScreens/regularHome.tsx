import Homecard from '@/components/HomescreenCard';
import IconButton from '@/components/Iconbutton';
import FallingLeaves from '@/components/LeafFalling';
import PinkOverlay from '@/components/Pinkoverlay'; // Import your overlay components
//import FallingLeaves from '@/components/PurpleLeaves';
import CloudFloatingAnimation from '@/components/Cloud';
import FocusAnimation from '@/components/Focused';
import { icons } from '@/constants/icons';
import { getDisplayName } from '@/util/asyncName';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import TopBar from '../TopBar';

const moodData = [
  { icon: icons.happy, text: 'Happy', color: 'bg-buttonPink-100 w-32 h-32', mood: 'happy' },
  { icon: icons.calm2, text: 'Calm', color: 'bg-buttonOrange-500 w-32 h-32', mood: 'calm' },
  { icon: icons.focus, text: 'Focused', color: 'bg-buttonGreen-500 w-32 h-32', mood: 'focused' },
  { icon: icons.relax, text: 'Relaxed', color: 'bg-buttonBlue-500 w-32 h-32', mood: 'relaxed' },
]

const HomescreenCard = [
  {
    title: "Counseling Session",
    description: "Let’s open up to the  thing that matters amoung the people",
    backgroundColor: 'bg-pink-100',
    textColor: 'text-pink-500',
    icon: icons.meetup,
    focusIcon: icons.play,
    focusText: "Start Session",
    // onPress: () => router.push('/(hidden)/meditation/')
  },
  {
    title: "Meditation",
    description: "Aura is the most important thing that matters to you.join us on ",
    backgroundColor: 'bg-orange-100',
    textColor: 'text-orange-500',
    icon: icons.meditation1,
    focusIcon: icons.clock,
    focusText: "12.00 PM",
    onPress: () => router.push('/(hidden)/meditation/meditationAnimation')
  }
]

export default function RegularHome() {
  const name = getDisplayName() || "friend";
  const [showPinkOverlay, setShowPinkOverlay] = useState(false);
  const [showFallingLeaves, setShowFallingLeaves] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showRelaxedAnimation, setShowRelaxedAnimation] = useState(false);

  const handleMoodPress = (mood: string) => {
    switch (mood) {
      case 'happy':
        setShowPinkOverlay(true);
        break;
      case 'calm':
        setShowFallingLeaves(true);
        break;
      case 'focused':
        setFocused(true);
        break;
      case 'relaxed':
        setShowRelaxedAnimation(true);
        console.log("Relaxed mood selected");
        break;
      default:
        break;
    }
  };

  const handlePinkOverlayComplete = () => {
    setShowPinkOverlay(false);
  };

  const handleFallingLeavesComplete = () => {
    setShowFallingLeaves(false);
  };

  const handleFocusComplete = () => {
    setFocused(false)
  }

  const handleRelaxedComplete = () => {
    setShowRelaxedAnimation(false);
  };

  return (
    <View>
      <TopBar title='Home'/>

      <View className='px-4 pt-4 mt-5'>
        <Text className='text-gray-700 text-4xl font-alegreya'>
          Welcome Back,
          <Text className='font-bold font-alegreya'>{name}</Text>
        </Text>
        <View className='mt-2' />
        <Text className='text-gray-500 text-lg mt-1'>How are you feeling today?</Text>
      </View>
      <View className='px-4 pt-4'>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            data={moodData}
            keyExtractor={(item, index) => `${item.text}-${index}`}
            renderItem={({ item }) => (
              <View className="mr-4">
                <IconButton
                  icon={item.icon}
                  text={item.text}
                  color={item.color}
                  onPress={() => handleMoodPress(item.mood)}
                />
              </View>
            )}
          />
      </View>
      <Text className='text-gray-700 text-2xl font-alegreya px-4 pt-4 mt-5'>
        Today&apos;s Recommendations
      </Text>
      <View className='px-4 pt-4 h-full'>
        <FlatList
          data={HomescreenCard}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          renderItem={({ item }) => (
            <Homecard
              title={item.title}
              description={item.description}
              backgroundColor={item.backgroundColor}
              textColor={item.textColor}
              icon={item.icon}
              focusText={item.focusText}
              focusIcon={item.focusIcon}
              onPress={item.onPress}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <PinkOverlay
        visible={showPinkOverlay}
        onAnimationComplete={handlePinkOverlayComplete}
      />

      <FallingLeaves
        visible={showFallingLeaves}
        onAnimationComplete={handleFallingLeavesComplete}
      />

      <FocusAnimation 
      visible={focused} 
      onAnimationComplete={handleFocusComplete}
         />

        <CloudFloatingAnimation
          visible={showRelaxedAnimation}
          onAnimationComplete={handleRelaxedComplete}
        />
    </View>
  );
}