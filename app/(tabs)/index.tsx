import { Text, View } from "react-native";
import { Link } from "expo-router";
import { PrimaryButton } from "../components/Buttons";
import "../global.css";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-3xl font-bold text-primary mb-6">
        Welcome to Sona!
      </Text>
      
      <View className="w-full max-w-sm space-y-4">
        {/* This is your signup navigation button */}
        <Link href="/signup" asChild>
          <PrimaryButton 
            title="Go to Sign Up" 
            onPress={() => {}} // Empty because Link handles navigation
          />
        </Link>
      </View>
    </View>
  );
}