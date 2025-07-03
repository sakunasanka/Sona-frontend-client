import { router } from 'expo-router';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

const handleSignOut = () => {
  // clear tokens or state
  router.replace('/signup'); // replaces history so user can't go back
};

const profile = () => {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        {/* Added padding to avoid notch overlap */}
        <View className='pt-6' />
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Profile</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={{ padding: 10, backgroundColor: '#EF5DA8', borderRadius: 5 }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }} >
                This is the profile page. You can add more features here
            </Text>
            <TouchableOpacity onPress={() => router.push('../(hidden)/profile/view_profile')} style={{ padding: 10, backgroundColor: '#EF5DA8', borderRadius: 5, marginTop: 10 }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>View Profile</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
}

export default profile;


