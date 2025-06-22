import React from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
// import { icons } from "@/constants/icons"; 

interface HomecardProps {
  title: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  icon?: ImageSourcePropType;
  focusText: string;
  focusIcon: ImageSourcePropType;
  onPress?: () => void;
}

const Homecard: React.FC<HomecardProps> = ({ 
  title, 
  description, 
  backgroundColor, 
  textColor, 
  icon, 
  focusIcon, 
  focusText 
}) => {
  return (
    <View className={`flex-1 p-4 rounded-lg ${backgroundColor} mb-4 h-48`}>
        
      <Text className={`font-bold font-alegreya text-2xl`}>{title}</Text>
      <View className="flex-row">
        <Text className="text-gray-600 mt-2 text-lg font-alegreya w-64">
          {description}
        </Text>
        <View className="flex-1 justify-center items-end size-14">
        <Image source={icon} className="size-auto mt-5" resizeMode="contain"/>
        </View>
      </View> 
      {/* Bottom text and icon */}
      <View className={`flex-row items-center mt-5`}>
        <Text className={`font-alegreya font-bold text-2xl ${textColor}`}>{focusText}</Text>
        <View className="w-2" />
        <Image source={focusIcon} className="size-6 mr-2" />
      </View>
    </View>
  );
}
export default Homecard;