import PlatformFeePayment from "@/components/PlatformFeePayment";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { PlatformFeeProvider, usePlatformFee } from "../contexts/PlatformFeeContext";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

function GlobalPaymentModal() {
  const { isPaymentModalVisible, hidePaymentModal } = usePlatformFee();

  return (
    <PlatformFeePayment
      visible={isPaymentModalVisible}
      onClose={hidePaymentModal}
      onPaymentSuccess={async () => {
        await new Promise((resolve) => setTimeout(resolve, 500)); // slight delay to ensure backend processes payment
        hidePaymentModal();
      }}
    />
  )
}

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
    <GestureHandlerRootView>
    <PlatformFeeProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalPaymentModal /> {/* Add this */}
    </PlatformFeeProvider>
    </GestureHandlerRootView>
  );
}