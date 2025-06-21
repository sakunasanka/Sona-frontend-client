import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="signin" options={{ title: 'Sign In' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="feed" options={{ title: 'Feed' }} />
      <Stack.Screen name="counsellor-chat" options={{ title: 'Chat with counsellor' }} />
      <Stack.Screen name="counsellors" options={{ title: 'Counsellors' }} />
      <Stack.Screen name="view_profile" options={{ title: 'View Profile' }} />
      <Stack.Screen name="edit_profile" options={{ title: 'Edit Profile' }} />
    </Stack>
  );
}
