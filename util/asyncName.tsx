import AsyncStorage from '@react-native-async-storage/async-storage';

export const getDisplayName = async () => {
  try {
    const name = await AsyncStorage.getItem('displayName');
    if (name !== null) {
      console.log('User display name:', name);
      return name;
    }
  } catch (error) {
    console.log('Failed to fetch display name:', error);
  }
};

