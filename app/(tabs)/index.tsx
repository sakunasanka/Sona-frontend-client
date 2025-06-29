import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import FirstTimeHome from '../components/subScreens/firstTimeHome';
import RegularHome from '../components/subScreens/regularHome';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        const firstLoginFlag = await AsyncStorage.getItem('hasVisitedHome');

        if (firstLoginFlag === null) {
          // First time visit
          setIsFirstLogin(true);
          await AsyncStorage.setItem('hasVisitedHome', 'true');
        } else {
          // Not first time
          setIsFirstLogin(false);
        }
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Error checking first login:', error);
        setIsFirstLogin(false); // fail-safe
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstLogin();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return isFirstLogin ? <FirstTimeHome /> : <RegularHome />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});