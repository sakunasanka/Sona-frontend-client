import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  ScrollView,
  ImageSourcePropType
} from 'react-native';
import { ArrowLeft, Check, Camera } from 'lucide-react-native';
import { router } from 'expo-router';
import {PrimaryButton} from '../../components/Buttons';

interface UserData {
  name: string;
  nickname: string;
  dob: string;
  email: string;
}

export default function EditProfile() {
  const [user, setUser] = useState<UserData>({
    name: 'hiruna',
    nickname: 'John',
    dob: '23/05/2003',
    email: 'john.s@example.com'
  });

  const handleSave = () => {
    console.log('Saved:', user);
    router.back();
  };

  const avatarSource: ImageSourcePropType = { 
    uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg' 
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="p-2"
          >
            <ArrowLeft size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Check size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Profile Picture */}
        <View className="items-center py-6 border-b border-gray-200">
          <View className="relative mb-4">
            <Image 
              source={avatarSource} 
              className="w-32 h-32 rounded-full border-4 border-gray-200"
            />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-primary rounded-full w-8 h-8 justify-center items-center">
              <Camera size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Form */}
        <View className="p-5">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Personal Information</Text>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-2">Full Name</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-200 text-sm"
              value={user.name}
              onChangeText={(text) => setUser({...user, name: text})}
              placeholder="Enter your full name"
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-2">Nickname</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-200 text-sm"
              value={user.nickname}
              onChangeText={(text) => setUser({...user, nickname: text})}
              placeholder="Enter your nickname"
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-2">Date of Birth</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-200 text-sm"
              value={user.dob}
              onChangeText={(text) => setUser({...user, dob: text})}
              placeholder="DD/MM/YYYY"
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-2">Email</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-200 text-sm"
              value={user.email}
              onChangeText={(text) => setUser({...user, email: text})}
              keyboardType="email-address"
              placeholder="Enter your email"
            />
          </View>
          <View className="flex-row gap-3 mt-3">
            <PrimaryButton 
            title="Save Changes" 
            onPress={() => {}} 
          />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}