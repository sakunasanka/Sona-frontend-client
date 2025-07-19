import React from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';

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
            style={{ 
              height: 26, // Explicit height to match counselor filters
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginRight: 8,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: isActive ? '#2563EB' : '#D1D5DB',
              backgroundColor: isActive ? '#2563EB' : '#FFFFFF'
            }}
          >
            <Text 
              style={{ 
                fontSize: 12,
                fontWeight: '500',
                color: isActive ? '#FFFFFF' : '#4B5563'
              }}
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