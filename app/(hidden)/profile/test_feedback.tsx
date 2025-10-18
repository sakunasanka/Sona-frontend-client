import { router } from 'expo-router';
import { ArrowLeft, Send, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Rating } from 'react-native-ratings';
import { PrimaryButton } from '../../components/Buttons';

export default function TestFeedback() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Rate your experience';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 py-4 bg-white border-b border-gray-200">
          <TouchableOpacity className="p-2" onPress={() => router.back()}>
            <ArrowLeft size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">Test Feedback</Text>
          <View className="w-10" />
        </View>

        <ScrollView 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content */}
          <View className="px-5 py-6">
            {/* Header Section */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-full bg-blue-50 justify-center items-center mb-4">
                <Star size={32} color="#2563EB" fill="#2563EB" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
                We'd love to hear about your session
              </Text>
              <Text className="text-base text-gray-500 text-center leading-6">
                Tell us what went well or what we can improve.
              </Text>
            </View>

            {/* Rating Section */}
            <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
              <Text className="text-lg font-semibold text-gray-900 mb-4 text-center">
                How was your experience?
              </Text>
              
              <View className="items-center mb-4">
                <Rating
                  type="star"
                  ratingCount={5}
                  imageSize={40}
                  startingValue={rating}
                  onFinishRating={setRating}
                  style={{ paddingVertical: 10 }}
                  tintColor="#F8F9FA"
                  ratingColor="#2563EB"
                  ratingBackgroundColor="#E5E7EB"
                />
              </View>
              
              <Text className="text-center text-lg font-medium text-primary mb-2">
                {getRatingText(rating)}
              </Text>
              
              {rating > 0 && (
                <Text className="text-center text-sm text-gray-500">
                  {rating} out of 5 stars
                </Text>
              )}
            </View>

            {/* Feedback Section */}
            <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Share your thoughts
              </Text>
              
              <View className="bg-gray-50 rounded-xl border border-gray-200">
                <TextInput
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Tell us more about your experience. What did you like? What could we improve?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  className="px-4 py-4 text-base text-gray-900 min-h-[120px]"
                  maxLength={500}
                />
              </View>
              
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-xs text-gray-400">
                  Optional - Share additional details
                </Text>
                <Text className="text-xs text-gray-400">
                  {feedback.length}/500
                </Text>
              </View>
            </View>

            {/* Quick Feedback Tags */}
            <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Quick feedback
              </Text>
              
              <View className="flex-row flex-wrap gap-2">
                {[
                  'Professional',
                  'Helpful',
                  'Easy to use',
                  'Good quality',
                  'Responsive',
                  'Clear communication',
                  'Timely',
                  'Knowledgeable'
                ].map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2"
                    onPress={() => {
                      if (feedback.includes(tag)) {
                        setFeedback(feedback.replace(tag, '').trim());
                      } else {
                        setFeedback(feedback ? `${feedback} ${tag}` : tag);
                      }
                    }}
                  >
                    <Text className="text-blue-700 text-sm font-medium">
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <View className="mt-4">
              <PrimaryButton
                title={isSubmitting ? "Submitting..." : "Submit Feedback"}
                onPress={handleSubmitFeedback}
                icon={Send}
                iconSize={18}
                iconColor="white"
              />
            </View>

            {/* Additional Info */}
            <View className="bg-blue-50 rounded-xl p-4 mt-6">
              <Text className="text-blue-800 text-sm text-center leading-5">
                Your feedback helps us improve our services and provide better experiences for all users.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}