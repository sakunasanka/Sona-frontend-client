import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Ensure all session screens hide the native header and rely on in-page headers */}
      <Stack.Screen name="sessionHistory" />
      {/* Match the file-based route name exactly (bookSessions.tsx) */}
      <Stack.Screen name="bookSessions" />
      <Stack.Screen name="StudentPackageApply" />
      {/* Optional: include other session routes to inherit header behavior */}
      <Stack.Screen name="bookPsychiatrist" />
    </Stack>
  );
}