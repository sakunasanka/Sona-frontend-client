import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="signin" options={{ title: 'Sign In' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="feed" options={{ title: 'Feed' }} />
    </Stack>
  );
}
