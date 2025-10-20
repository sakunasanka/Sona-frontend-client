import Homecard from '@/components/HomescreenCard';
import FallingLeaves from '@/components/LeafFalling';
import PinkOverlay from '@/components/Pinkoverlay'; // Import your overlay components
//import FallingLeaves from '@/components/PurpleLeaves';
import { hasCompletedPHQ9ThisPeriod } from '@/api/questionnaire';
import CloudFloatingAnimation from '@/components/Cloud';
import FocusAnimation from '@/components/Focused';
import { icons } from '@/constants/icons';
import { useShake } from '@/hooks/useShake';
import { getDisplayName } from '@/util/asyncName';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { hasSubmittedTodaysMood } from '../../api/mood';
import EmergencyPopup, { EmergencyContactData } from '../EmergencyPopUp';
import TopBar from '../TopBar';

const baseHomescreenCards = [
  {
    title: "Counseling Session",
    description: "Let's open up to the  thing that matters amoung the people",
    backgroundColor: 'bg-pink-100',
    textColor: 'text-pink-500',
    icon: icons.meetup,
    focusIcon: icons.play,
    focusText: "View My Sessions",
    onPress: () => router.push('../(hidden)/session/upcomingSessions'),
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
  },
]

const wellBeingCard = {
  title: 'Well-being Check (PHQ-9)',
  description: 'A quick, research-backed mood check. Takes ~2 minutes.',
  backgroundColor: 'bg-blue-100',
  textColor: 'text-blue-500',
  icon: icons.quiz,
  focusIcon: icons.play,
  focusText: 'Start',
  onPress: () => {
    // Trigger the questionnaire popup instead of navigating
    if ((global as any).triggerQuestionnairePopup) {
      (global as any).triggerQuestionnairePopup();
    }
  },
}

export default function RegularHome() {
  const name = getDisplayName() || "friend";
  const [showPinkOverlay, setShowPinkOverlay] = useState(false);
  const [showFallingLeaves, setShowFallingLeaves] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showRelaxedAnimation, setShowRelaxedAnimation] = useState(false);
  const [showWellBeingCard, setShowWellBeingCard] = useState(true);
  const [homescreenCards, setHomescreenCards] = useState(baseHomescreenCards);
  const [hasSubmittedMoodToday, setHasSubmittedMoodToday] = useState(false);
  const [isEmergencyPopupVisible, setEmergencyPopupVisible] = useState(false);
  const [token, setToken] = useState<string>('');
  
  // Fetch token on mount
  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
      }
    };

    fetchToken();
  }, []);

  //shake detection code. only work in this screen
  const handleShake = () => {
    // Show the popup *only if* it's not already visible
    console.log("Shake detected!");
    if (!isEmergencyPopupVisible) {
      setEmergencyPopupVisible(true);
    }
  };

  const [resetShake] = useShake(handleShake);

  const handleEmergencyContact = (data: EmergencyContactData) => {
    console.log('EMERGENCY DATA:', data);
    // TODO: Send this data to your API
    
    // Close the popup and reset shake detection
    setEmergencyPopupVisible(false);
    resetShake();
    
    Alert.alert("Support Notified", "Your emergency request has been sent.");
  };

  const handleImFine = () => {
    console.log("User is fine.");
    setEmergencyPopupVisible(false);
    resetShake();
  };

  const handleClose = () => {
    console.log("Popup closed without action.");
    setEmergencyPopupVisible(false);
    resetShake();
  };

  // Check if user has submitted today's mood
  useEffect(() => {
    const checkTodaysMood = async () => {
      try {
        const hasSubmitted = await hasSubmittedTodaysMood();
        setHasSubmittedMoodToday(hasSubmitted);
      } catch (error) {
        console.log('Error checking today\'s mood:', error);
        setHasSubmittedMoodToday(false); // Default to showing mood tracker on error
      }
    };

    checkTodaysMood();
  }, []);

  // Refresh mood status when screen comes back into focus (e.g., after submitting mood)
  useFocusEffect(
    useCallback(() => {
      const refreshMoodStatus = async () => {
        try {
          const hasSubmitted = await hasSubmittedTodaysMood();
          setHasSubmittedMoodToday(hasSubmitted);
        } catch (error) {
          console.log('Error refreshing mood status:', error);
        }
      };

      refreshMoodStatus();
    }, [])
  );

  // Refresh questionnaire status when screen comes back into focus (e.g., after submitting questionnaire)
  useFocusEffect(
    useCallback(() => {
      const refreshQuestionnaireStatus = async () => {
        try {
          const hasCompleted = await hasCompletedPHQ9ThisPeriod();
          setShowWellBeingCard(!hasCompleted); // Show card only if NOT completed this period
          
          // Update cards array based on whether to show well-being card
          if (!hasCompleted) {
            setHomescreenCards([...baseHomescreenCards, wellBeingCard]);
          } else {
            setHomescreenCards(baseHomescreenCards);
          }
        } catch (error) {
          console.log('Error refreshing questionnaire status:', error);
          // On error, show the card (fail safe)
          setShowWellBeingCard(true);
          setHomescreenCards([...baseHomescreenCards, wellBeingCard]);
        }
      };

      refreshQuestionnaireStatus();
    }, [])
  );

  

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
    <View className='flex-1'>
      <TopBar title='Home'/>

      {/* Single vertical FlatList with a header so the page scrolls */}
      <FlatList
        data={homescreenCards}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        renderItem={({ item }) => (
          <View className='px-4 pt-4'>
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
          </View>
        )}
        ListHeaderComponent={
          <View>
            <View className='px-4 pt-4 mt-5'>
              <Text className='text-gray-700 text-4xl font-alegreya'>
                Welcome Back,
                <Text className='font-bold font-alegreya'>{name}</Text>
              </Text>
              <View className='mt-2' />
              {/* <Text className='text-gray-500 text-lg mt-1'>How are you feeling today?</Text> */}
            </View>
            
            {/* Mood Tracker Card - Only show if user hasn't submitted today's mood */}
            {!hasSubmittedMoodToday && (
              <View className='px-4 pt-4'>
                <TouchableOpacity
                  className="rounded-2xl shadow-lg overflow-hidden"
                  onPress={() => router.push('/(hidden)/mood/sampleMood' as any)}
                >
                  <LinearGradient
                    colors={['#60A5FA', '#A78BFA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ padding: 24 }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white text-xl font-bold mb-2 font-alegreya">
                          Track Your Mood
                        </Text>
                        <Text className="text-blue-100 text-sm font-alegreya">
                          How are you feeling today? Express your emotions with our advanced mood tracker.
                        </Text>
                      </View>
                      <View className="ml-4">
                        <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                          <Text className="text-2xl">😊</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
            
            <Text className='text-gray-700 text-2xl font-alegreya px-4 pt-4 mt-5'>
              Today&apos;s Recommendations
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

        {  
        isEmergencyPopupVisible && (
          <EmergencyPopup
            visible={isEmergencyPopupVisible}
            onClose={handleClose}
            onEmergencyContact={handleEmergencyContact}
            onImFine={handleImFine}
            token={token}
          />
        )}

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