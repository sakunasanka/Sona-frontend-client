import { checkIsStudent } from "@/api/api";
import { getRemainingFreeSessions } from "@/api/sessions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

const Counsellor = () => {
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

          // If student, prefetch the free sessions data
          if (isStudent) {
            try {
              // Fetch remaining free sessions data
              const freeSessionsResponse = await getRemainingFreeSessions(token);

              // Store the data in AsyncStorage for quick access
              if (freeSessionsResponse && freeSessionsResponse.data) {
                const sessionInfo = freeSessionsResponse.data;
                await AsyncStorage.setItem('freeSessionsRemaining', sessionInfo.remainingSessions.toString());
                await AsyncStorage.setItem('nextResetDate', sessionInfo.nextResetDate);
                await AsyncStorage.setItem('totalSessionsThisPeriod', sessionInfo.totalSessionsThisPeriod.toString());
                await AsyncStorage.setItem('lastFreeSessionsFetch', new Date().toISOString());
              }
            } catch (error) {
              console.log('Error fetching free sessions data:', error);
            }
          }
        }

        // Redirect to the counsellors page
        router.replace("/(hidden)/profile/counsellors");
      } catch (error) {
        console.log('Error during prefetch:', error);
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
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 10, color: '#4F46E5' }}>Loading counsellors...</Text>
      </View>
    );
  }

  return null;
};

export default Counsellor;