// components/TouchableWithActivity.tsx
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { sessionManager } from '../utils/sessionManager';

interface TouchableWithActivityProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

export const TouchableWithActivity: React.FC<TouchableWithActivityProps> = ({
  onPress,
  onPressIn,
  children,
  ...props
}) => {
  const handlePress = (event: any) => {
    // Update activity timestamp
    sessionManager.updateActivity();

    // Call original onPress if provided
    if (onPress) {
      onPress(event);
    }
  };

  const handlePressIn = (event: any) => {
    // Update activity timestamp
    sessionManager.updateActivity();

    // Call original onPressIn if provided
    if (onPressIn) {
      onPressIn(event);
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
    >
      {children}
    </TouchableOpacity>
  );
};