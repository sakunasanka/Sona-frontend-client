import { apiRequest } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Keyboard, Modal, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { sessionManager } from '../../utils/sessionManager';
import { PrimaryButton } from '../components/Buttons';

const saveDisplayName = async (name: string) => {
  try {
    await AsyncStorage.setItem('displayName', name);
    console.log('Display name saved successfully');
  } catch (error) {
    console.log('Failed to save display name:', error);
  }
};

export default function SignIn() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSignIn = async () => {
    if (isLoading) return; // Prevent multiple submissions
    
    // Dismiss keyboard before processing
    Keyboard.dismiss();
    
    setIsLoading(true);
    console.log('Sign in pressed', formData);
    try {
    const result = await apiRequest({
      method: 'post',
      path: '/auth/signin',
      data: {
        email: formData.email,
        password: formData.password,
      },
    });

    
    const { displayName } = result.data;
    await AsyncStorage.setItem('token', result.data.token);
    if (displayName) {
      await saveDisplayName(displayName);
      
      
    }
    
    // Initialize session tracking after successful login
    await sessionManager.initializeSession();
    
    console.log('Token from the local storage', await AsyncStorage.getItem('token'));

    console.log('Login success:', result);
    setIsLoading(false);

    router.replace('/(tabs)');
  } catch (err) {
    console.log('Login failed:', err);
    setIsLoading(false);
  }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1 bg-slate-50">
        {/* Background Decorative Elements */}
        <View className="absolute inset-0 overflow-hidden">
          <View className="absolute w-144 h-144 rounded-full bg-blue-300 opacity-90 -bottom-4 -left-64" />
          <View className="absolute w-128 h-128 rounded-full bg-red-300 opacity-60 top-128 -right-52" />
        </View>

        <ScrollView 
          className="flex-1 z-10"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Logo and Header */}
        <View className="items-center mb-8 mt-20">
          <View className="mb-2">
            <Image
              source={require('../../assets/images/sona-long-logo.png')}
              className="w-80 h-20 opacity-75 mr-10"
              resizeMode="contain"
            />
          </View>
          <Text className=" text-gray-500 text-center font-alegreya text-lg">
            Wellness Starts With A Conversation
          </Text>
          <View className="mt-2" />
          <Image
            source={require('../../assets/images/homescreen-cloud.png')}
            className="w-28 h-28 opacity-75"
            resizeMode="contain"
          />
        </View>



        {/* Form */}
        <View className="mb-6">
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-300 px-4 py-3 opacity-90">
              <Mail size={20} className="mr-3 text-gray-400 opacity-50" />
              <View className="mr-4"/>
             <TextInput
              className="flex-1 text-base"
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => {
                // Focus next input or dismiss keyboard
                Keyboard.dismiss();
              }}
            />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-300 px-4 py-3 opacity-90">
              <Lock size={20} className="mr-3 text-gray-400 opacity-50" />
              <View className="mr-4"/>
              <TextInput
                  className="flex-1 text-base text-gray-900"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    if (formData.email && formData.password) {
                      handleSignIn();
                    }
                  }}
                />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="p-1"
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-gray-400" />
                ) : (
                  <Eye size={20} className="text-gray-400" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <View className="mb-6 items-end">
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="text-sm text-primary font-medium">Forgot Password?</Text>
              </TouchableOpacity>
          </View>

          <View className="mt-2">
            <PrimaryButton title="Sign In" onPress={handleSignIn} />
          </View>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-4 text-sm text-gray-400">Or continue with</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity className="flex-row items-center justify-center bg-white border border-gray-300 py-3 rounded-lg mb-6">
          <Image
            source={require('../../assets/images/google-logo.png')}
            className="w-5 h-5 mr-2"
            resizeMode="contain"
          />
          <Text className="text-base text-gray-700 font-medium">Sign In With Google</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-sm text-gray-500">Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text className="text-sm text-primary font-semibold">Sign up</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
        <Modal visible={isLoading} transparent animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/50">
            <ActivityIndicator size="large" color="#fff" />
            <Text className="mt-4 text-white">Sign in...</Text>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}