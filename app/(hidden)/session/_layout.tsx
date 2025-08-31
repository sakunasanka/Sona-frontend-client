import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack>
      <Stack.Screen name="sessionHistory" options={{ headerShown: false }} />
      <Stack.Screen name="BookSessions" options={{ headerShown: false }} />
      <Stack.Screen name="StudentPackageApply" options={{ headerShown: false }} />
      <Stack.Screen name="VideoCallPage" options={{ headerShown: false }} />
    </Stack>
  );
}