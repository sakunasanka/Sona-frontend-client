import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Info, Mail, School, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { applyStudentPackage } from '../../../api/api';
import { uploadStudentIdToCloudinary } from '../../../utils/cloudinary';
import { PrimaryButton } from '../../components/Buttons';

// Student Package details
const STUDENT_PACKAGE = {
  id: 'student',
  name: 'Free Student Package',
  sessions: 4,
  price: 0,
  description: 'Free counseling sessions for verified university students',
  features: [
    '4 free sessions per month',
  ]
};

// University email domains
const UNIVERSITY_DOMAINS = [
  "accimt.ac.lk", "bbu.ac.lk", "bpu.ac.lk", "cmb.ac.lk", "esn.ac.lk", "jfn.ac.lk",
  "kdu.ac.lk", "kln.ac.lk", "mrt.ac.lk", "ou.ac.lk", "pdn.ac.lk", "pgia.ac.lk",
  "rjt.ac.lk", "ruh.ac.lk", "sab.ac.lk", "saitm.edu.lk", "seu.ac.lk", "sjp.ac.lk",
  "sliate.net", "sliit.lk", "uwu.ac.lk", "vpa.ac.lk", "wyb.ac.lk", "nsbm.lk",
  "nibm.lk", "iit.ac.lk"
];

export default function StudentPackageApply() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idCardFile, setIdCardFile] = useState<string | null>(null);
  const [additionalNotesInputFocused, setAdditionalNotesInputFocused] = useState(false);
  
  // Form validation state
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    university: false,
    idCardFile: false
  });

  // Helper function to check if email domain is valid (allows subdomains)
  const isValidUniversityEmail = (email: string) => {
    if (!email.includes('@')) return false;
    
    const domain = email.split('@')[1].toLowerCase();
    
    return UNIVERSITY_DOMAINS.some(uniDomain => {
      const lowerUniDomain = uniDomain.toLowerCase();
      // Allow exact match or subdomain match (e.g., subdomain.uni.ac.lk matches uni.ac.lk)
      return domain === lowerUniDomain || domain.endsWith('.' + lowerUniDomain);
    });
  };

  const validateForm = () => {
    const isValidEmail = isValidUniversityEmail(email);
    const newErrors = {
      name: !name,
      email: !email || !isValidEmail,
      university: !university,
      idCardFile: !idCardFile
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleUploadIdCard = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIdCardFile(result.assets[0].uri);
        setErrors(prev => ({ ...prev, idCardFile: false }));
      }
      setIsUploading(false);
    } catch (error) {
      console.log("Error uploading file:", error);
      setIsUploading(false);
      Alert.alert("Error", "Failed to upload file. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Missing Information', 'Please fill in all required fields and upload your student ID document.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get authentication token
      const authToken = await AsyncStorage.getItem('token') || '';
      
      // Upload file to Cloudinary
      const cloudinaryResult = await uploadStudentIdToCloudinary(idCardFile!, 'student_id_document');
      
      // Prepare request body
      const requestBody = {
        fullName: name,
        university,
        studentIDCopy: cloudinaryResult.secure_url,
        uniEmail: email
      };
      
      console.log('Submitting application:', requestBody);
      
      // Call API
      await applyStudentPackage(authToken, requestBody);
      
      // Show success message
      Alert.alert(
        'Application Submitted Successfully',
        'We will verify your university credentials and activate your free student package within 24 hours. You will receive an email confirmation once verified.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.log('Error submitting student package application:', error);
      
      // Handle specific error for already applied
      if (error?.error === 'ValidationError' && error?.message === 'Client already has a student application') {
        Alert.alert(
          'Application Already Exists',
          'You have already submitted a student package application. Please wait for verification or contact support if you have questions.'
        );
      } else {
        Alert.alert(
          'Submission Failed',
          error?.message || 'There was an error submitting your application. Please try again later.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a ref for the scroll view to control keyboard interactions
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Function to dismiss keyboard when tapping outside input fields
  const handleScreenPress = () => {
    Keyboard.dismiss();
  };
  
  // Handle keyboard events to prevent layout flashing
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        
        // When keyboard appears and additional notes is focused, ensure it's visible
        if (additionalNotesInputFocused && scrollViewRef.current) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    // Clean up event listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [additionalNotesInputFocused]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-lg font-semibold">Free Student Package</Text>
        <View className="w-6" />
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 30 }}
        onTouchStart={handleScreenPress}
      >
        {/* Introduction Card */}
        <View className="mx-5 mt-5 bg-indigo-50 rounded-2xl p-5">
          <Text className="text-lg font-bold text-indigo-900 mb-2">Student Support Program</Text>
          <Text className="text-indigo-800">
            We offer free counseling sessions for verified university students. This package is completely free of charge and requires university credential verification. Provide your credentials below to apply.
          </Text>
        </View>
        
        {/* Package Information */}
        <View className="mx-5 mt-5">
          <View className="bg-white border-2 border-indigo-500 rounded-xl p-5">
            <View className="bg-indigo-100 self-start rounded-lg px-3 py-1 mb-2">
              <Text className="text-indigo-700 font-semibold">FREE</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">{STUDENT_PACKAGE.name}</Text>
            <Text className="text-gray-600 mb-4">{STUDENT_PACKAGE.description}</Text>
            
            <Text className="font-bold text-gray-800 mb-2">Package Features:</Text>
            {STUDENT_PACKAGE.features.map((feature, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <View className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
                <Text className="text-gray-700">{feature}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Application Form */}
        <View className="mx-5 mt-5 mb-5 bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-xl font-bold text-gray-900 mb-4">University Student Verification</Text>
          
          <View className="bg-yellow-50 p-3 rounded-lg mb-5">
            <Text className="text-yellow-800 text-sm">
              <Text className="font-bold">Important:</Text> This free package is only available to current university students with valid credentials. Your university ID must clearly show your name, institution, and valid dates. Verification is required before access is granted.
            </Text>
          </View>
          
          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">Full Name *</Text>
            <View className={`flex-row items-center border rounded-lg px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}>
              <User size={20} color="#6B7280" />
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (text) setErrors(prev => ({ ...prev, name: false }));
                }}
                placeholder="Enter your full name"
                className="flex-1 ml-2 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.name && <Text className="text-red-500 text-xs mt-1">Name is required</Text>}
          </View>
          
          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">University Email Address *</Text>
            <View className={`flex-row items-center border rounded-lg px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}>
              <Mail size={20} color="#6B7280" />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  const isValid = isValidUniversityEmail(text);
                  if (isValid) setErrors(prev => ({ ...prev, email: false }));
                }}
                placeholder="Enter your university email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 ml-2 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.email && <Text className="text-red-500 text-xs mt-1">Valid university email is required</Text>}
          </View>
          
          {/* University Input */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-1 font-medium">University/Institution *</Text>
            <View className={`flex-row items-center border rounded-lg px-3 py-2 ${errors.university ? 'border-red-500' : 'border-gray-300'}`}>
              <School size={20} color="#6B7280" />
              <TextInput
                value={university}
                onChangeText={(text) => {
                  setUniversity(text);
                  if (text) setErrors(prev => ({ ...prev, university: false }));
                }}
                placeholder="Enter your university or institution"
                className="flex-1 ml-2 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.university && <Text className="text-red-500 text-xs mt-1">University/Institution is required</Text>}
          </View>
          

          {/* ID Card Upload */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-1 font-medium">Upload Student ID (PDF or Image) *</Text>
            <View className={`border rounded-lg p-4 ${errors.idCardFile ? 'border-red-500' : 'border-gray-300'}`}>
              {idCardFile ? (
                <View className="items-center">
                  <View className="bg-indigo-100 rounded-lg p-3 mb-2">
                    <CreditCard size={24} color="#6366F1" />
                  </View>
                  <Text className="text-indigo-600 font-medium">ID Document Uploaded</Text>
                  <TouchableOpacity 
                    className="mt-2 px-3 py-1 bg-gray-100 rounded-lg" 
                    onPress={handleUploadIdCard}
                  >
                    <Text className="text-gray-700 text-sm">Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  className="items-center" 
                  onPress={handleUploadIdCard}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#6366F1" />
                  ) : (
                    <>
                      <View className="bg-gray-100 rounded-lg p-3 mb-2">
                        <CreditCard size={24} color="#6B7280" />
                      </View>
                      <Text className="text-indigo-600 font-medium">Upload ID Document</Text>
                      <Text className="text-gray-500 text-xs text-center mt-1">
                        Please upload your student ID card as a PDF or image file
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {errors.idCardFile && <Text className="text-red-500 text-xs mt-1">Student ID document upload is required</Text>}
          </View>
          
          {/* Submit Button */}
          <PrimaryButton
            title={isSubmitting ? "Processing..." : "Submit Application"}
            onPress={handleSubmit}
          />
          
          {/* Additional info */}
          <View className="flex-row items-start mt-4">
            <Info size={16} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-2 flex-1">
              We&apos;ll verify your university credentials within 24 hours. This verification process is necessary to ensure only eligible students receive the free package.
            </Text>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}