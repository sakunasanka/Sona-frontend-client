import { Link } from 'expo-router';
import { ArrowLeft, Clock, Filter, MessageCircle, Star, Video } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import SpecialtyTabs from '../components/SpecialtyTabs';
import SearchBar from '../components/SearchBar';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { router } from "expo-router";

interface Counselor {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  reviews: number;
  experience: string;
  price: string;
  avatar: string;
  isOnline: boolean;
  nextAvailable: string;
  languages: string[];
}

const COUNSELORS_DATA: Counselor[] = [
  {
    id: '1',
    name: 'Dr. Ugo David',
    title: 'Licensed Clinical Psychologist',
    specialties: ['Anxiety', 'Depression', 'Trauma'],
    rating: 4.9,
    reviews: 127,
    experience: '8 years',
    price: '$80/session',
    avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    isOnline: true,
    nextAvailable: 'Available now',
    languages: ['English', 'Spanish'],
  },
  {
    id: '2',
    name: 'Dr. Sarah Chen',
    title: 'Marriage & Family Therapist',
    specialties: ['Relationships', 'Family Therapy', 'Communication'],
    rating: 4.8,
    reviews: 89,
    experience: '6 years',
    price: '$75/session',
    avatar: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    isOnline: false,
    nextAvailable: 'Tomorrow 2:00 PM',
    languages: ['English', 'Mandarin'],
  },
  {
    id: '3',
    name: 'Dr. Michael Johnson',
    title: 'Cognitive Behavioral Therapist',
    specialties: ['CBT', 'Stress Management', 'ADHD'],
    rating: 4.7,
    reviews: 156,
    experience: '10 years',
    price: '$90/session',
    avatar: 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    isOnline: true,
    nextAvailable: 'Available in 30 min',
    languages: ['English'],
  },
];

const CounselorCard = ({ counselor }: { counselor: Counselor }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow">
      <View className="flex-row mb-4">
        <View className="relative">
          {!imageError ? (
            <Image
              source={{ uri: counselor.avatar }}
              className="w-16 h-16 rounded-full bg-gray-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <View className="w-16 h-16 rounded-full bg-gray-300 justify-center items-center">
              <Text className="text-gray-600 font-semibold">
                {counselor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </Text>
            </View>
          )}
          {counselor.isOnline && (
            <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          )}
        </View>
        <View className="flex-1 ml-4 mr-3">
          <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
            {counselor.name}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={2}>
            {counselor.title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text className="ml-1 text-sm font-semibold text-gray-800">{counselor.rating}</Text>
            <Text className="ml-1 text-sm text-gray-500">({counselor.reviews} reviews)</Text>
          </View>
        </View>
        <View className="items-end justify-start">
          <Text className="text-green font-semibold">{counselor.price}</Text>
          <Text className="text-xs text-gray-500">{counselor.experience}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-3">
        {counselor.specialties.map((specialty) => (
          <Text 
            key={specialty} 
            className="text-xs bg-blue-100 text-primary px-3 py-1 rounded-xl font-medium"
          >
            {specialty}
          </Text>
        ))}
      </View>

      <View className="flex-row items-center mb-2">
        <Clock size={16} color="#16a34a" />
        <Text className="ml-2 text-sm text-green font-medium">{counselor.nextAvailable}</Text>
      </View>

      <View className="flex-row items-center mb-4">
        <Text className="text-sm font-medium text-gray-500">Languages: </Text>
        <Text className="text-sm text-gray-700">{counselor.languages.join(', ')}</Text>
      </View>

      <View className="flex-row gap-3">
        {/* <SecondaryButton 
            title="Message" 
            onPress={() => {}} 
            icon={MessageCircle}
          /> */}
        <PrimaryButton 
            title="Book Session" 
            onPress={() => {router.push('/session/book_session')}} 
            icon={Video}
          />
      </View>
    </View>
  );
};

export default function CounselorsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const filteredCounselors = useMemo(() => {
    let filtered = COUNSELORS_DATA;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (counselor) =>
          counselor.name.toLowerCase().includes(query) ||
          counselor.title.toLowerCase().includes(query) ||
          counselor.specialties.some((specialty) => specialty.toLowerCase().includes(query))
      );
    }
    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter((counselor) => counselor.specialties.includes(selectedSpecialty));
    }
    return filtered.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return b.rating - a.rating;
    });
  }, [searchQuery, selectedSpecialty]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold">Find a Counselor</Text>
        <TouchableOpacity>
          <Filter size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="py-2 bg-primary">
        <SpecialtyTabs selected={selectedSpecialty} onSelect={setSelectedSpecialty} />
      </View>
    
      <View className="flex-1 bg-gray-50 rounded-t-3xl pt-6">
        <SearchBar 
          placeholder="Search by name or specialty..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
    
        <FlatList
          data={filteredCounselors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CounselorCard counselor={item} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}