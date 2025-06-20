import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Home, Menu, Users, Settings } from 'lucide-react-native';

interface BottomNavigationProps {
  activeTab?: 'home' | 'menu' | 'users' | 'settings';
  onTabPress?: (tab: 'home' | 'menu' | 'users' | 'settings') => void;
}

export default function BottomNavigation({ 
  activeTab = 'menu', 
  onTabPress 
}: BottomNavigationProps) {
  const handleTabPress = (tab: 'home' | 'menu' | 'users' | 'settings') => {
    if (onTabPress) {
      onTabPress(tab);
    }
  };

  const getIconColor = (tab: string) => {
    return activeTab === tab ? '#374151' : '#6B7280';
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 flex-row justify-around items-center bg-white py-4 px-6 border-t border-gray-200">
      <TouchableOpacity 
        className="p-2"
        onPress={() => handleTabPress('home')}
      >
        <Home size={24} color={getIconColor('home')} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        className="p-2"
        onPress={() => handleTabPress('menu')}
      >
        <Menu size={24} color={getIconColor('menu')} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        className="p-2"
        onPress={() => handleTabPress('users')}
      >
        <Users size={24} color={getIconColor('users')} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        className="p-2"
        onPress={() => handleTabPress('settings')}
      >
        <Settings size={24} color={getIconColor('settings')} />
      </TouchableOpacity>
    </View>
  );
}