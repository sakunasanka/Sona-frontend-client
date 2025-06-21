import { Text, View } from "react-native";
import { PrimaryButton } from "../components/Buttons";
import "../global.css";
import { router } from "expo-router";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-3xl font-bold text-primary mb-6">
        Welcome to Sona!
      </Text>
      
      <View className="flex-row gap-3">
        <PrimaryButton 
          title="Sign In" 
          onPress={() => router.push("/signin")} 
        />
      </View>
    </View>
  );
}