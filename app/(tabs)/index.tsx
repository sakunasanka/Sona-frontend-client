import { Text, View } from "react-native";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import "../global.css";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-3xl font-bold text-blue-500 mb-6">
        Welcome to Nativewind, Sakuna!
      </Text>
      
      <View className="w-full max-w-sm space-y-4">
        <PrimaryButton 
          title="Get Started" 
          onPress={() => console.log("Pressed")} 
        />
        <SecondaryButton 
          title="Learn More" 
          onPress={() => console.log("Pressed")} 
        />
      </View>
    </View>
  );
}