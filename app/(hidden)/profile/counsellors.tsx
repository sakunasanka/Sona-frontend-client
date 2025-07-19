import { checkIsStudent } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ArrowLeft, Clock, GraduationCap, Star, Video } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PrimaryButton } from '../../components/Buttons';
import SpecialtyTabs from '../../components/SpecialtyTabs';

// Get screen dimensions for proper sizing
const { width: screenWidth } = Dimensions.get('window');

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
  counselorType: 'free' | 'paid_with_free_student' | 'paid_only'; // Type of counselor pricing model
  providesStudentSessions: boolean; // Indicates if this counselor provides free sessions for students
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
    price: 'Rs.3000/session',
    avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    isOnline: true,
    nextAvailable: 'Available now',
    languages: ['English', 'Spanish'],
    counselorType: 'paid_with_free_student',
    providesStudentSessions: true,
  },
  {
    id: '2',
    name: 'Dr. Sarah Chen',
    title: 'Marriage & Family Therapist',
    specialties: ['Relationships', 'Family Therapy', 'Communication'],
    rating: 4.8,
    reviews: 89,
    experience: '6 years',
    price: 'Rs.2500/session',
    avatar: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    isOnline: false,
    nextAvailable: 'Tomorrow 2:00 PM',
    languages: ['English', 'Mandarin'],
    counselorType: 'paid_only',
    providesStudentSessions: false,
  },
  {
    id: '3',
    name: 'Dr. Michael Johnson',
    title: 'Cognitive Behavioral Therapist',
    specialties: ['CBT', 'Stress Management', 'ADHD'],
    rating: 4.7,
    reviews: 156,
    experience: '10 years',
    price: 'Rs.4000/session',
    avatar: 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    isOnline: true,
    nextAvailable: 'Available in 30 min',
    languages: ['English'],
    counselorType: 'paid_with_free_student',
    providesStudentSessions: true,
  },
  {
    id: '4',
    name: 'Dr. Priya Kumar',
    title: 'Student Counselor',
    specialties: ['Academic Stress', 'Career Guidance', 'Student Wellbeing'],
    rating: 4.9,
    reviews: 112,
    experience: '5 years',
    price: 'Free',
    avatar: 'https://images.pexels.com/photos/3760583/pexels-photo-3760583.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    isOnline: true,
    nextAvailable: 'Available now',
    languages: ['English', 'Hindi', 'Tamil'],
    counselorType: 'free',
    providesStudentSessions: true,
  },
  {
    id: '5',
    name: 'Dr. James Wilson',
    title: 'University Mental Health Specialist',
    specialties: ['Exam Anxiety', 'Student Life', 'Stress Management'],
    rating: 4.8,
    reviews: 94,
    experience: '7 years',
    price: 'Free',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    isOnline: false,
    nextAvailable: 'Today 4:00 PM',
    languages: ['English'],
    counselorType: 'free',
    providesStudentSessions: true,
  }
];

const CounselorCard = ({ counselor, isUserStudent, freeSessionsRemaining }: { counselor: Counselor, isUserStudent: boolean, freeSessionsRemaining: number }) => {
  const [imageError, setImageError] = useState(false);

  // Determine the pricing display based on counselor type and student status
  const getPriceDisplay = () => {
    if (counselor.counselorType === 'free') {
      return (
        <View>
          <Text className="text-green-600 font-semibold">Free for All</Text>
          <Text className="text-xs text-gray-500">Volunteer Counselor</Text>
        </View>
      );
    } else if (counselor.counselorType === 'paid_with_free_student' && isUserStudent && freeSessionsRemaining > 0) {
      return (
        <View>
          <Text className="text-gray-500 line-through text-xs">{counselor.price}</Text>
          <Text className="text-green-600 font-semibold">Free for Students</Text>
        </View>
      );
    } else {
      return (
        <View>
          <Text className="text-green font-semibold">{counselor.price}</Text>
          <Text className="text-xs text-gray-500">{counselor.experience}</Text>
        </View>
      );
    }
  };

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
          {getPriceDisplay()}
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
        
        {/* Show appropriate counselor type badge */}
        {counselor.counselorType === 'free' ? (
          <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-xl">
            <GraduationCap size={12} color="#059669" className="mr-1" />
            <Text className="text-xs text-green-700 font-medium">Free Counselor</Text>
          </View>
        ) : counselor.providesStudentSessions && isUserStudent ? (
          <View className="flex-row items-center bg-indigo-100 px-3 py-1 rounded-xl">
            <GraduationCap size={12} color="#4F46E5" className="mr-1" />
            <Text className="text-xs text-indigo-700 font-medium">Student Sessions</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center mb-2">
        <Clock size={16} color="#16a34a" />
        <Text className="ml-2 text-sm text-green font-medium">{counselor.nextAvailable}</Text>
      </View>

      <View className="flex-row items-center mb-4">
        <Text className="text-sm font-medium text-gray-500">Languages: </Text>
        <Text className="text-sm text-gray-700">{counselor.languages.join(', ')}</Text>
      </View>

      {/* Show free session badge for students with remaining sessions */}
      {isUserStudent && counselor.providesStudentSessions && freeSessionsRemaining > 0 ? (
        <View className="mb-3 bg-green-50 p-2 rounded-lg">
          <Text className="text-green-700 text-xs font-medium">
            {counselor.counselorType === 'free' 
              ? "✓ Free sessions available for everyone" 
              : `✓ ${freeSessionsRemaining} free student sessions remaining this month`}
          </Text>
        </View>
      ) : isUserStudent && counselor.providesStudentSessions && freeSessionsRemaining === 0 ? (
        <View className="mb-3 bg-yellow-50 p-2 rounded-lg">
          <Text className="text-yellow-700 text-xs font-medium">
            ⓘ No free student sessions left this month
          </Text>
        </View>
      ) : null}

      <View className="flex-row gap-3">
        <PrimaryButton 
            title="Book Session" 
            onPress={() => {
              // Pass the counselor ID to the booking screen
              router.push({
                pathname: '../session/bookSessions',
                params: { counselorId: counselor.id }
              });
            }} 
            icon={Video}
          />
      </View>
    </View>
  );
};

export default function CounselorsScreen() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [freeSessionsRemaining, setFreeSessionsRemaining] = useState<number>(4); // Default to 4 free sessions per month

  // Check if user is a student when component mounts
  useEffect(() => {
    const checkStudentStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const studentStatus = await checkIsStudent(token);
          setIsStudent(studentStatus);
          
          // If student, fetch remaining free sessions
          if (studentStatus) {
            // In a real app, you would fetch this from an API
            // For now, we'll mock 4 free sessions per month for students
            setFreeSessionsRemaining(4);
          }
        }
      } catch (error) {
        console.error('Error checking student status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStudentStatus();
  }, []);

  // Simple filter tabs for Free and Paid counselors
  const tabFilters = [
    { id: 'all', label: 'All Counselors' },
    { id: 'free', label: 'Free Counselors' },
    { id: 'paid', label: 'Paid Counselors' }
  ];

  const filteredCounselors = useMemo(() => {
    let filtered = COUNSELORS_DATA;
    
    // Filter by specialty
    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter((counselor) => counselor.specialties.includes(selectedSpecialty));
    }
    
    // Filter by tab selection
    if (selectedTab !== 'all') {
      if (selectedTab === 'free') {
        // For free tab, include:
        // 1. Counselors that are free for everyone
        // 2. For students, also include counselors that offer free student sessions (if they have sessions remaining)
        filtered = filtered.filter((counselor) => 
          counselor.counselorType === 'free' || 
          (isStudent && counselor.providesStudentSessions && freeSessionsRemaining > 0)
        );
      } else if (selectedTab === 'paid') {
        // For paid tab, include:
        // 1. Paid-only counselors
        // 2. Paid counselors with student sessions, but only if:
        //    - User is not a student, OR
        //    - User is a student but has no free sessions remaining
        filtered = filtered.filter((counselor) => 
          counselor.counselorType === 'paid_only' || 
          (counselor.counselorType === 'paid_with_free_student' && 
            (!isStudent || (isStudent && freeSessionsRemaining === 0)))
        );
      }
    }
    
    // Sort the filtered counselors
    return filtered.sort((a, b) => {
      // Prioritize online counselors
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      
      // Then by rating
      return b.rating - a.rating;
    });
  }, [selectedSpecialty, selectedTab, isStudent, freeSessionsRemaining]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold">Find a Counselor</Text>
        <View className="w-6" />
      </View>

      {/* Specialty tabs remain in the blue header */}
      <View className="py-2 bg-primary">
        <SpecialtyTabs selected={selectedSpecialty} onSelect={setSelectedSpecialty} />
      </View>
    
      <View className="flex-1 bg-gray-50 rounded-t-3xl">
        {/* Added proper padding at the top */}
        <View className="pt-6">
          {/* Student badge at the top if user is a student */}
          {isStudent && (
            <View className="mx-5 mb-4 bg-indigo-50 p-3 rounded-xl flex-row items-center">
              <GraduationCap size={20} color="#4F46E5" />
              <View className="ml-3 flex-1">
                <Text className="text-indigo-900 font-semibold">Student Benefits Active</Text>
                <Text className="text-indigo-700 text-sm">
                  {freeSessionsRemaining > 0 
                    ? `You have ${freeSessionsRemaining} free counseling sessions remaining this month` 
                    : "You've used all your free sessions this month"}
                </Text>
              </View>
            </View>
          )}
          
          {/* Counselor type filters in a ScrollView with fixed height to prevent overlap */}
          <View className="h-10 mb-4">
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {tabFilters.map((filter) => {
                const isActive = selectedTab === filter.id;
                return (
                  <TouchableOpacity
                    key={filter.id}
                    onPress={() => setSelectedTab(filter.id)}
                    style={{ 
                      height: 26,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      marginRight: 8,
                      borderRadius: 9999,
                      borderWidth: 1,
                      borderColor: isActive ? '#2563EB' : '#D1D5DB',
                      backgroundColor: isActive ? '#2563EB' : '#FFFFFF'
                    }}
                  >
                    <Text 
                      style={{ 
                        fontSize: 12,
                        fontWeight: '500',
                        color: isActive ? '#FFFFFF' : '#4B5563'
                      }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      
        {/* Counselor list with proper width and padding */}
        <FlatList
          data={filteredCounselors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-5 w-full">
              <CounselorCard 
                counselor={item} 
                isUserStudent={isStudent} 
                freeSessionsRemaining={freeSessionsRemaining} 
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-12 px-5">
              <Text className="text-gray-500 text-lg font-medium">No counselors found</Text>
              <Text className="text-gray-400 text-center mt-2 px-8">
                Try adjusting your filters
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}