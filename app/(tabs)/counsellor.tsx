import { router } from "expo-router";
import { ArrowLeft, Check, Clock, Filter, Star, Video, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PrimaryButton } from '../components/Buttons';
import SearchBar from '../components/SearchBar';
import SpecialtyTabs from '../components/SpecialtyTabs';

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
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    availableNow: false,
    availableToday: false,
    priceRange: 'all', // 'all', 'low', 'medium', 'high'
    highestRated: false,
    experiencedCounselors: false, // 5+ years
  });

  const applyFilters = (newFilters: React.SetStateAction<{
      availableNow: boolean; availableToday: boolean; priceRange: string; // 'all', 'low', 'medium', 'high'
      highestRated: boolean; experiencedCounselors: boolean;
    }>) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  const filteredCounselors = useMemo(() => {
    let filtered = COUNSELORS_DATA;
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (counselor) =>
          counselor.name.toLowerCase().includes(query) ||
          counselor.title.toLowerCase().includes(query) ||
          counselor.specialties.some((specialty) => specialty.toLowerCase().includes(query))
      );
    }
    
    // Apply specialty filter
    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter((counselor) => 
        counselor.specialties.includes(selectedSpecialty)
      );
    }
    
    // Apply additional filters
    if (filters.availableNow) {
      filtered = filtered.filter((counselor) => 
        counselor.isOnline && counselor.nextAvailable === 'Available now'
      );
    }
    
    if (filters.availableToday && !filters.availableNow) {
      filtered = filtered.filter((counselor) => 
        counselor.isOnline || counselor.nextAvailable.includes('Today') || 
        counselor.nextAvailable.includes('in')
      );
    }
    
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter((counselor) => {
        const price = parseInt(counselor.price.replace(/\D/g, ''));
        if (filters.priceRange === 'low') return price <= 70;
        if (filters.priceRange === 'medium') return price > 70 && price <= 85;
        if (filters.priceRange === 'high') return price > 85;
        return true;
      });
    }
    
    if (filters.experiencedCounselors) {
      filtered = filtered.filter((counselor) => {
        const years = parseInt(counselor.experience);
        return !isNaN(years) && years >= 5;
      });
    }
    
    // Sort results
    return filtered.sort((a, b) => {
      // If highest rated filter is on, prioritize rating
      if (filters.highestRated) {
        if (b.rating !== a.rating) return b.rating - a.rating;
      }
      
      // Otherwise use default sort (online first, then by rating)
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return b.rating - a.rating;
    });
  }, [searchQuery, selectedSpecialty, filters]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold">Find a Counselor</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} className="relative">
          <Filter size={24} color="white" />
          {(filters.availableNow || filters.availableToday || filters.priceRange !== 'all' || 
            filters.highestRated || filters.experiencedCounselors) && (
            <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></View>
          )}
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
    
        {filteredCounselors.length > 0 ? (
          <FlatList
            data={filteredCounselors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CounselorCard counselor={item} />}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-lg text-gray-600 text-center mb-2">No counselors found</Text>
            <Text className="text-sm text-gray-500 text-center mb-4">
              Try adjusting your filters or search criteria
            </Text>
            <TouchableOpacity
              onPress={() => {
                setFilters({
                  availableNow: false,
                  availableToday: false,
                  priceRange: 'all',
                  highestRated: false,
                  experiencedCounselors: false,
                });
                setSearchQuery('');
                setSelectedSpecialty('All');
              }}
              className="px-4 py-2 bg-primary rounded-lg"
            >
              <Text className="text-white font-semibold">Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-4/5">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Filters</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="p-2 rounded-full bg-gray-100"
              >
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Availability Section */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">Availability</Text>
                
                <TouchableOpacity 
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  onPress={() => setFilters({...filters, availableNow: !filters.availableNow})}
                >
                  <Text className="text-gray-700 text-base">Available now</Text>
                  <View className={`w-6 h-6 rounded-full border-2 ${
                    filters.availableNow ? 'border-primary bg-primary' : 'border-gray-300'
                  } items-center justify-center`}>
                    {filters.availableNow && <Check size={14} color="white" />}
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  onPress={() => setFilters({...filters, availableToday: !filters.availableToday})}
                >
                  <Text className="text-gray-700 text-base">Available today</Text>
                  <View className={`w-6 h-6 rounded-full border-2 ${
                    filters.availableToday ? 'border-primary bg-primary' : 'border-gray-300'
                  } items-center justify-center`}>
                    {filters.availableToday && <Check size={14} color="white" />}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Price Range */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">Price Range</Text>
                
                {['all', 'low', 'medium', 'high'].map((range) => {
                  const label = range === 'all' ? 'All prices' : 
                                range === 'low' ? '$70 or less' :
                                range === 'medium' ? '$71 - $85' : 'Above $85';
                  
                  return (
                    <TouchableOpacity 
                      key={range}
                      className="flex-row items-center justify-between py-3 border-b border-gray-100"
                      onPress={() => setFilters({...filters, priceRange: range})}
                    >
                      <Text className="text-gray-700 text-base">{label}</Text>
                      <View className={`w-6 h-6 rounded-full border-2 ${
                        filters.priceRange === range ? 'border-primary bg-primary' : 'border-gray-300'
                      } items-center justify-center`}>
                        {filters.priceRange === range && <Check size={14} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Other Filters */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">Other Filters</Text>
                
                <TouchableOpacity 
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  onPress={() => setFilters({...filters, highestRated: !filters.highestRated})}
                >
                  <Text className="text-gray-700 text-base">Highest rated first</Text>
                  <View className={`w-6 h-6 rounded-full border-2 ${
                    filters.highestRated ? 'border-primary bg-primary' : 'border-gray-300'
                  } items-center justify-center`}>
                    {filters.highestRated && <Check size={14} color="white" />}
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  onPress={() => setFilters({...filters, experiencedCounselors: !filters.experiencedCounselors})}
                >
                  <Text className="text-gray-700 text-base">5+ years experience</Text>
                  <View className={`w-6 h-6 rounded-full border-2 ${
                    filters.experiencedCounselors ? 'border-primary bg-primary' : 'border-gray-300'
                  } items-center justify-center`}>
                    {filters.experiencedCounselors && <Check size={14} color="white" />}
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Apply buttons */}
            <View className="flex-row gap-4 pt-4">
              <TouchableOpacity
                onPress={() => {
                  setFilters({
                    availableNow: false,
                    availableToday: false,
                    priceRange: 'all',
                    highestRated: false,
                    experiencedCounselors: false,
                  });
                  setShowFilterModal(false);
                }}
                className="flex-1 py-3 rounded-xl border border-gray-300"
              >
                <Text className="text-center font-semibold text-gray-700">Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="flex-1 py-3 rounded-xl bg-primary"
              >
                <Text className="text-center font-semibold text-white">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}