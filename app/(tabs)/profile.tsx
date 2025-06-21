import { router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

const handleSignOut = () => {
  // clear tokens or state
  router.replace('/signup'); // replaces history so user can't go back
};

const profile = () => {
    return (
       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Profile</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={{ padding: 10, backgroundColor: '#EF5DA8', borderRadius: 5 }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

export default profile;


