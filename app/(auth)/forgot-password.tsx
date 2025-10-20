import { apiRequest } from '@/api/api'; // Adjust the import path as necessary
import { Link } from 'expo-router';
import { Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from '../components/Buttons';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
   const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    setIsLoading(true);
    if (!email) {
      console.log('Email is required');
      setIsLoading(false);
      return;
    }
    try {
      const result = await apiRequest({
        method: 'post',
        path: '/auth/reset-password',
        data: {
          email: email,
          },
        });

    console.log('Reset password for:', result);
    setSubmitted(true);
  } catch (error) {
    console.log('Error sending reset link:', error);
    setIsLoading(false);
  }
  setIsLoading(false);
}

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

        {/* Main Content */}
        {!submitted ? (
          <>
            <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
              Forgot Password
            </Text>
            <Text className="text-base text-gray-500 text-center mb-8 leading-6">
              Enter your email and we&apos;ll send you a link to reset your password
            </Text>

            {/* Email Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
              <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                <Mail size={20} className="mr-3 text-gray-400" />
                <TextInput
                  className="flex-1 text-base text-gray-900"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="mt-2 mb-6">
              <PrimaryButton 
                title="Send Reset Link" 
                onPress={handleResetPassword} 
              />
            </View>

            {/* Back to Sign In Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-sm text-gray-500">Remember your password? </Text>
              <Link href="/signin" asChild>
                <TouchableOpacity>
                  <Text className="text-sm text-primary font-semibold">Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </>
        ) : (
          <>
            <View className="items-center mb-6">
              <Image
                source={require('../../assets/images/email-sent.png')}
                className="w-40 h-40 mb-6"
                resizeMode="contain"
              />
              <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
                Check Your Email
              </Text>
              <Text className="text-base text-gray-500 text-center mb-4 leading-6">
                We&apos;ve sent a password reset link to{' '}
                <Text className="font-semibold">{email}</Text>
              </Text>
              <Text className="text-sm text-gray-400 text-center">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <Text 
                  className="text-primary font-medium"
                  onPress={() => setSubmitted(false)}
                >
                  try another email address
                </Text>
              </Text>
            </View>

            <View className="mt-6">
              <Link href="/signin" asChild>
                <PrimaryButton title="Back to Sign In" onPress={()=>{}} />
              </Link>
            </View>
          </>
          
        )}

        {isLoading && (
  <View style={{
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  }}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={{ marginTop: 12, color: '#666', fontSize: 16 }}>Loading...</Text>
  </View>
)}
      </ScrollView>
    </View>
  );
}