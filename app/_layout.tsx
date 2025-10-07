import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import 'react-native-reanimated';
import { PlatformFeeProvider } from "../contexts/PlatformFeeContext";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Alegreya': require('../assets/fonts/Alegreya-Regular.ttf'),
    'Alegreya-Bold': require('../assets/fonts/Alegreya-Bold.otf'),
    'AlegreyaSCB' : require('../assets/fonts/AlegreyaSC-Black.otf'),
    'AlegreyaSC' : require('../assets/fonts/AlegreyaSC-Regular.otf'),
  });

  // Initialize session timeout tracking for the entire app
  const { updateActivity } = useSessionTimeout();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PlatformFeeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PlatformFeeProvider>
  );
}