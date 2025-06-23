import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import CustomButton from '@/components/Iconbutton';
import {icons} from '../../../constants/icons';
import GradientText from '@/components/Gradient';
import { router } from 'expo-router';

const FirstTimeHome = () => {
  const navigation = useNavigation();
  const navigationState = useNavigationState((state) => state);

  const updateBottomTabState = (routeName: string) => {
    const bottomTabRoutes = ['Home', 'Profile', 'Settings', 'Notifications'];
    if (bottomTabRoutes.includes(routeName)) {
      console.log(`Navigating to bottom tab: ${routeName}`);
    }
  };

  const buttonData = [
    {
      icon: icons.quiz,
      text: 'Take a quick check-in',
      color: 'buttonPink-500 w-44 h-40',
      navigationPath: 'Quiz',
    },
    {
      icon: icons.coucelier,
      text: 'Health Check',
      color: '#4ECDC4',
      navigationPath: 'Checking',
    },
    {
      icon: icons.meditation,
      text: 'Meditation',
      color: '#45B7D1',
      navigationPath: 'Meditation',
    },
    {
      icon: icons.chatbot,
      text: 'Chat',
      color: '#96CEB4',
      navigationPath: 'Chat',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>

           <View style={styles.rowText}>
              <Text style={styles.welcomeText}>Welcome, </Text>
              <GradientText
                text="Friend"
                colors={['#F06969', '#62A5F9']}
                style={styles.gradientText}
                width={100} // Adjust width as needed
              />
            </View>
          <Text style={styles.subText}>
            You&apos;ve just joined a safe space built for people like you.
          </Text>

          <Text style={styles.subText2}>
            What would you like to do first?
          </Text>
        </View>

        <View className='flex-1 justify-center items-center mx-1'>
          <View style={styles.buttonRow}>
            <CustomButton
              icon={icons.quiz}
              text="Take a quick check-in"
              onPress={() => router.push('/(hidden)/question/start')}
              color='bg-buttonPink-500 w-44 h-40'
            />
            <CustomButton
              icon={icons.coucelier}
              text="Find a counsellor"
              onPress={() => console.log('Quiz pressed')}
              color='bg-buttonBlue-500 w-44 h-40'
            />
          </View>
          <View style={styles.buttonRow}>
            <CustomButton
              icon={icons.meditation}
              text="Try 2 min breathing session"
              onPress={() => router.push('/(hidden)/meditation/meditationAnimation')}
              color='bg-buttonOrange-500 w-44 h-40'
            />
            <CustomButton
              icon={icons.chatbot}
              text="Chat with AI chatbot"
              onPress={() => console.log('Quiz pressed')}
              color='bg-buttonGreen-500 w-44 h-40'
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: 'Alegreya-Bold',
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    marginTop: 20,
    fontFamily: 'Alegreya',
    fontSize: 24,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  gradientText: {
    fontFamily: 'Alegreya-Bold',
    fontSize: 32,
  },
  normalText: {
    fontFamily: 'Alegreya',
    fontSize: 24,
    color: '#2C3E50',
    textAlign: 'center',
  },
  rowText: {
    marginTop: 100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  subText2: {
    marginTop: 40,
    fontFamily: 'Alegreya',
    fontSize: 20,
    color: '#111',
    textAlign: 'center',
  }
});

export default FirstTimeHome;