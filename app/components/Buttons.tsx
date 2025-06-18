import { TouchableOpacity, Text } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export function PrimaryButton({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-blue-500 py-3 px-6 rounded-lg items-center"
      activeOpacity={0.8}
    >
      <Text className="text-white font-bold text-lg">{title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="border-2 border-blue-500 py-3 px-6 rounded-lg items-center"
      activeOpacity={0.8}
    >
      <Text className="text-blue-500 font-bold text-lg">{title}</Text>
    </TouchableOpacity>
  );
}