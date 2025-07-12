import { Stack } from "expo-router";

export default function HiddenLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="session" options={{ headerShown: false }} />
      <Stack.Screen name="meditation" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="question" options={{ headerShown: false }} />
    </Stack>
  );
}
