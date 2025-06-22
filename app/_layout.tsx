import { Stack, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Alegreya': require('../assets/fonts/Alegreya-Regular.ttf'),
    'Alegreya-Bold': require('../assets/fonts/Alegreya-Bold.otf'),
    'AlegreyaSCB' : require('../assets/fonts/AlegreyaSC-Black.otf'),
    'AlegreyaSC' : require('../assets/fonts/AlegreyaSC-Regular.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
