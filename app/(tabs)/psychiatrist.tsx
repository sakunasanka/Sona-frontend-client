import { checkIsStudent } from "@/api/api";
import { getRemainingPsychiatristSessions } from "@/api/psychiatrist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

const Psychiatrist = () => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirect = async () => {
      setIsRedirecting(true);
      
      try {
        // Get the authentication token
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          // Check if user is a student
          const isStudent = await checkIsStudent(token);
          
          // If student, prefetch psychiatrist session data
          if (isStudent) {
            try {
              // Fetch remaining psychiatrist sessions data
              const psychiatristSessionsResponse = await getRemainingPsychiatristSessions(token);
              
              // Store the data in AsyncStorage for quick access
              if (psychiatristSessionsResponse && psychiatristSessionsResponse.data) {
                const sessionInfo = psychiatristSessionsResponse.data;
                await AsyncStorage.setItem('psychiatristSessionsRemaining', sessionInfo.remainingSessions.toString());
                await AsyncStorage.setItem('psychiatristNextResetDate', sessionInfo.nextResetDate);
                await AsyncStorage.setItem('totalPsychiatristSessionsThisPeriod', sessionInfo.totalSessionsThisPeriod.toString());
                await AsyncStorage.setItem('lastPsychiatristSessionsFetch', new Date().toISOString());
              }
            } catch (error) {
              console.error('Error fetching psychiatrist sessions data:', error);
            }
          }
        }

        // Redirect to the psychiatrists page
        router.replace("/(hidden)/profile/psychiatrists");
      } catch (error) {
        console.error('Error during prefetch:', error);
        setIsRedirecting(false);
      } finally {
        setIsLoading(false);
      }
    };

    redirect();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ marginTop: 10, color: '#7C3AED' }}>Loading psychiatrists...</Text>
      </View>
    );
  }

  return null;
};

export default Psychiatrist;
