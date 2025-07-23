import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

const SearchBar = ({ placeholder, value, onChangeText }: SearchBarProps) => {
  return (
    <View className="flex-row items-center bg-white mx-5 px-4 py-3 rounded-2xl mb-5 shadow">
      <Search size={20} color="#9CA3AF" />
      <TextInput
        className="flex-1 ml-3 text-base text-gray-700"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

export default SearchBar;