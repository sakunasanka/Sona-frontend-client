import { TouchableOpacity, Text, View } from "react-native";
import { LucideIcon, Video } from "lucide-react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  icon?: LucideIcon;
  iconSize?: number;
  iconColor?: string;
}

export function PrimaryButton({ 
  title, 
  onPress, 
  icon: Icon, 
  iconSize = 18, 
  iconColor = "white" 
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-primary"
      activeOpacity={0.8}
    >
      {Icon && <Icon size={iconSize} color={iconColor} />}
      <Text className={`text-white font-semibold ${Icon ? 'ml-2' : ''}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ 
  title, 
  onPress, 
  icon: Icon, 
  iconSize = 18, 
  iconColor = "#2563EB" // primary color
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center py-3 rounded-xl border border-primary bg-white"
      activeOpacity={0.8}
    >
      {Icon && <Icon size={iconSize} color={iconColor} />}
      <Text className={`ml-2 text-primary font-semibold ${Icon ? 'ml-2' : ''}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export function LogoutButton({ 
  title, 
  onPress, 
  icon: Icon, 
  iconSize = 20, 
  iconColor = "#EF4444" 
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-center p-4 mt-6 mx-5 rounded-xl border border-red-100 bg-red-50"
      activeOpacity={0.8}
    >
      {Icon && <Icon size={iconSize} color={iconColor} />}
      <Text className={`text-base font-semibold text-red-600 ml-2 ${Icon ? 'ml-2' : ''}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// Example usage component
export function ButtonExample() {
  return (
    <View className="flex-row gap-3">
      <PrimaryButton 
        title="Book Session" 
        onPress={() => console.log("Book Session pressed")} 
        icon={Video}
        iconSize={18}
        iconColor="white"
      />
    </View>
  );
}