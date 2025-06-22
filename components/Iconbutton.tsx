import React from 'react';
import { Text, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { View } from 'react-native';

interface IconButtonProps {
  icon: ImageSourcePropType;
  text: string;
  color?: string; // optional Tailwind class override
  onPress?: () => void;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, text, color = 'bg-buttonPink-500', onPress }) => {
  return (
    <TouchableOpacity
      className={`flex-col items-center justify-center rounded-xl overflow-visible ${color}`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="w-16 h-16 mb-2 justify-center items-center overflow-visible">
        <Image
          source={icon}
          resizeMode="contain"
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <View className='px-5'>
        <Text className="text-white text-lg font-alegreyaBold text-center">{text}</Text>
      </View>       
    </TouchableOpacity>
  );
};

export default IconButton;