import React from 'react';
import { FlatList, TouchableOpacity, Text } from 'react-native';

const SPECIALTIES = ['All', 'Anxiety', 'Depression', 'Relationships', 'Trauma', 'ADHD', 'Stress'];

interface SpecialtyTabsProps {
  selected: string;
  onSelect: (specialty: string) => void;
}

const SpecialtyTabs = ({ selected, onSelect }: SpecialtyTabsProps) => {
  return (
    <FlatList
      data={SPECIALTIES}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      keyExtractor={(item) => item}
      renderItem={({ item }) => {
        const isActive = selected === item;
        return (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            className={`px-3 py-1 mr-2 rounded-full border ${
              isActive 
                ? 'bg-primary border-primary' 
                : 'bg-white border-gray-300'
            }`}
          >
            <Text 
              className={`text-xs font-medium ${
                isActive ? 'text-white' : 'text-gray-600'
              }`}
            >
              {item}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
};

export default SpecialtyTabs;