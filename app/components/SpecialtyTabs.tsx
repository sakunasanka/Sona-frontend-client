import { usePlatformFeeGuard } from '@/hooks/usePlatformFeeGuard';
import React from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';

const DEFAULT_SPECIALTIES = ['All', 'Anxiety', 'Depression', 'Relationships', 'Trauma', 'ADHD', 'Stress'];

interface SpecialtyTabsProps {
  selected: string;
  onSelect: (specialty: string) => void;
  specialties?: string[];
}

const SpecialtyTabs = ({ selected, onSelect, specialties = DEFAULT_SPECIALTIES }: SpecialtyTabsProps) => {
  const { checkPlatformFeeAccess } = usePlatformFeeGuard();

  const handleSelect = async (specialty: string) => {
    // Allow "All" selection without platform fee check
    if (specialty === 'All') {
      onSelect(specialty);
      return;
    }

    // Check platform fee for specific specialty filtering
    const hasAccess = await checkPlatformFeeAccess();
    if (hasAccess) {
      onSelect(specialty);
    }
    // If no access, the alert is already shown by checkPlatformFeeAccess
  };

  return (
    <FlatList
      data={specialties}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      keyExtractor={(item) => item}
      renderItem={({ item }) => {
        const isActive = selected === item;
        return (
          <TouchableOpacity
            onPress={() => handleSelect(item)}
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