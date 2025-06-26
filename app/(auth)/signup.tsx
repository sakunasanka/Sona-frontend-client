import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { PrimaryButton } from '../components/Buttons';
import { apiRequest } from '@/api/api';

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    // nickname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSignUp = async () => {
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);
    console.log('Sign up pressed', formData);

    try { 
    const result = await apiRequest({
      method: 'post',
      path: '/api/auth/signup',
      data: {
        displayName: formData.name,
        // nickname: formData.nickname,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      }
    });
    setIsLoading(false);
    setShowSuccessOverlay(true);
     console.log('Sign up success:', result);
  } catch (error) {
    setIsLoading(false);
    console.error('Sign up failed:', error);
    // Handle error (e.g., show error message)
    return;
  }
  };

  return (
    
    <View className="flex-1 bg-slate-50">
      {/* Background Decorative Elements */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute w-80 h-80 rounded-full bg-blue-300 opacity-60 -bottom-24 -left-24" />
        <View className="absolute w-80 h-80 rounded-full bg-red-300 opacity-60 top-48 -right-36" />
      </View>

      <ScrollView 
        className="flex-1 z-10"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Header */}
        <View className="items-center mb-8">
          <View className="mb-2">
            <Image
              source={require('../../assets/images/sona-long-logo.png')}
              className="w-52 h-16 opacity-75"
              resizeMode="contain"
            />
          </View>
          <Text className="text-sm text-gray-500 text-center">
            Wellness Starts With A Conversation
          </Text>
        </View>

        {/* Subtitle */}
        <Text className="text-base text-gray-500 text-center mb-8 leading-6">
          Let&apos;s get you started — just a few{' '}
          <Text className="text-purple-600 font-semibold">quick</Text> details.
        </Text>

        {/* Form */}
        <View className="mb-6">
          {/* <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Nickname</Text>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <User size={20} className='text-gray-400' className="mr-3" />
              <TextInput
                className="flex-1 text-base text-gray-900"
                placeholder="Enter your nickname"
                value={formData.nickname}
                onChangeText={(text) => setFormData({...formData, nickname: text})}
              />
            </View>
          </View> */}

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Name</Text>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <User size={20} className="mr-3 text-gray-400" />
              <TextInput
                className="flex-1 text-base text-gray-900"
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <Mail size={20} className="mr-3 text-gray-400" />
              <TextInput
                className="flex-1 text-base text-gray-900"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <Lock size={20} className="mr-3 text-gray-400" />
              <TextInput
                className="flex-1 text-base text-gray-900"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                secureTextEntry={!showPassword}
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

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password</Text>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <Lock size={20} className="mr-3 text-gray-400" />
              <TextInput
                className="flex-1 text-base text-gray-900"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} className='text-gray-400' />
                ) : (
                  <Eye size={20} className='text-gray-400' />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-2">
            <PrimaryButton title="Sign Up" onPress={handleSignUp} />
          </View>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-4 text-sm text-gray-400">Or continue with</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Google Sign Up */}
        <TouchableOpacity className="flex-row items-center justify-center bg-white border border-gray-300 py-3 rounded-lg mb-6">
          <Image
            source={require('../../assets/images/google-logo.png')}
            className="w-5 h-5 mr-2"
            resizeMode="contain"
          />
          <Text className="text-base text-gray-700 font-medium">Sign Up With Google</Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-sm text-gray-500">Already have an account </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm text-primary font-semibold">Sign in</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={isLoading} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="mt-4 text-white">Creating your account...</Text>
        </View>
      </Modal>
      <Modal visible={showSuccessOverlay} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 px-8">
          <View className="bg-white rounded-2xl p-6 items-center w-full">
            <Text className="text-xl font-semibold text-green-700 mb-4">Account Created!</Text>
            <Text className="text-center text-gray-600 mb-6">
              Your account has been successfully created. You can now sign in.
            </Text>

            <PrimaryButton
              title="Go to Sign In"
              onPress={() => {
                setShowSuccessOverlay(false);
                router.replace('/signin');
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}