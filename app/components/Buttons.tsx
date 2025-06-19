import { TouchableOpacity, Text } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export function PrimaryButton({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-primary py-3 px-6 rounded-lg items-center"
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
      className="border-2 border-primary py-3 px-6 rounded-lg items-center"
      activeOpacity={0.8}
    >
      <Text className="text-primary font-bold text-lg">{title}</Text>
    </TouchableOpacity>
  );
}