import { Link, router } from 'expo-router';
import { ArrowLeft, Award, Calendar, Clock, DollarSign, Globe, MapPin, MessageSquare, Star } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';

export default function CounsellorProfile() {
  const counsellorData = {
    name: 'Dr. Sarah Johnson',
    title: 'Licensed Clinical Psychologist',
    specialization: 'Anxiety & Depression',
    rating: 4.9,
    reviews: 128,
    experience: '8 years',
    languages: ['English', 'Spanish'],
    bio: 'Specialized in cognitive behavioral therapy with a focus on anxiety disorders. Passionate about helping clients develop coping strategies.',
    availability: 'Mon-Fri, 9am-5pm',
    location: 'Virtual or 123 Therapy St, Boston',
    education: 'PhD in Clinical Psychology, Harvard University',
    price: '$120 per session',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80'
  };

  const handleBookAppointment = () => {
    router.push('/booking/select_date');
  };

  const handleCall = () => {
    Linking.openURL('tel:+11234567890');
  };

  const handleMessage = () => {
    router.push('/messages/new');
  };

  const DetailItem = ({ icon: Icon, label, value, iconColor = "#6366F1" }) => (
    <View className="flex-row items-start py-3 px-4 bg-gray-50 rounded-xl mb-3">
      <View className="w-10 h-10 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
        <Icon size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </Text>
        <Text className="text-sm font-semibold text-gray-900 leading-5">
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Added extra padding at the top to avoid notch overlap */}
      <View className="pt-6"></View>
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <Link href="/counsellors" asChild>
            <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-gray-50">
              <ArrowLeft size={20} color="#374151" />
            </TouchableOpacity>
          </Link>
          <Text className="text-lg font-bold text-gray-900">Counselor Profile</Text>
          <View className="w-10" />
        </View>

        {/* Profile Hero Section */}
        <View className="bg-gradient-to-b from-blue-50 to-white px-6 py-8">
          <View className="items-center">
            <View className="relative mb-6">
              <Image
                source={{ uri: counsellorData.image }}
                className="w-28 h-28 rounded-2xl"
              />
              <View className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white items-center justify-center">
                <View className="w-3 h-3 bg-white rounded-full" />
              </View>
            </View>
            
            <Text className="text-2xl font-bold text-gray-900 mb-1 text-center">
              {counsellorData.name}
            </Text>
            <Text className="text-base font-medium text-primary mb-3">
              {counsellorData.title}
            </Text>
            
            <View className="flex-row items-center bg-white px-4 py-2 rounded-full shadow-sm mb-4">
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-amber-600 font-semibold ml-1 mr-2">
                {counsellorData.rating}
              </Text>
              <Text className="text-gray-500 text-sm">
                ({counsellorData.reviews} reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View className="px-6 pb-6 bg-white">
          <Text className="text-gray-700 text-base leading-6 text-center">
            {counsellorData.bio}
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6 pb-6">
          <View className="flex-row gap-3">
            <SecondaryButton
              title="Message"
              onPress={handleMessage}
              icon={MessageSquare}
            />
            
            <PrimaryButton
              title="Book Session"
              onPress={() => router.push('/session/book_session')}
              icon={Calendar}
            />
          </View>
        </View>

        {/* Details Section */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-gray-900 mb-6">Professional Details</Text>
          
          <DetailItem
            icon={Award}
            label="Specialization"
            value={counsellorData.specialization}
            iconColor="#6366F1"
          />
          
          <DetailItem
            icon={Calendar}
            label="Experience"
            value={counsellorData.experience}
            iconColor="#059669"
          />
          
          <DetailItem
            icon={MapPin}
            label="Location"
            value={counsellorData.location}
            iconColor="#DC2626"
          />
          
          <DetailItem
            icon={Award}
            label="Education"
            value={counsellorData.education}
            iconColor="#7C3AED"
          />
          
          <DetailItem
            icon={Globe}
            label="Languages"
            value={counsellorData.languages.join(', ')}
            iconColor="#0891B2"
          />
        </View>

        {/* Availability & Pricing */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-gray-900 mb-6">Availability & Pricing</Text>
          
          <DetailItem
            icon={Clock}
            label="Schedule"
            value={counsellorData.availability}
            iconColor="#EA580C"
          />
          
          <View className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Session Price</Text>
                <Text className="text-3xl font-bold text-gray-900">{counsellorData.price}</Text>
              </View>
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                <DollarSign size={24} color="#6366F1" />
              </View>
            </View>
          </View>
        </View>

        {/* Book Appointment Button */}
        <View className="px-6">
          <PrimaryButton
            title="Book Appointment"
            onPress={handleBookAppointment}
            icon={Calendar}
            iconSize={20}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}