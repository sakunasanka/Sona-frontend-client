import React from "react";  
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const Counsellor = () => {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl font-bold mb-4">Counsellor</Text>
      <TouchableOpacity
        onPress={() => router.push("/(hidden)/profile/counsellors")}
        className="bg-blue-500 p-4 rounded-lg"
      >
        <Text className="text-white text-lg">Start Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

export default Counsellor;