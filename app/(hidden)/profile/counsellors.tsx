import { checkIsStudent } from '@/api/api';
import { Counselor, getAvailableCounselors } from '@/api/counselor';
import { usePlatformFee } from '@/contexts/PlatformFeeContext';
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

// Extended counselor interface that includes UI-specific properties
interface ExtendedCounselor extends Omit<Counselor, 'specialties'> {
  counselorType?: 'free' | 'paid_with_free_student' | 'paid_only';
  providesStudentSessions?: boolean;
  experience?: string;
  specialties?: string[];
}

const CounselorCard = ({ counselor, isUserStudent, freeSessionsRemaining }: { counselor: ExtendedCounselor, isUserStudent: boolean, freeSessionsRemaining: number }) => {
  const [imageError, setImageError] = useState(false);

  // Default values for UI display if not provided by API
  const counselorDisplay = {
    ...counselor,
    title: counselor.title || 'Counselor',
    specialties: counselor.specialties || ['General Counseling'],
    rating: counselor.rating || 4.5,
    experience: counselor.experience || '1+ years',
    price: counselor.sessionFee ? `Rs.${counselor.sessionFee}` : 'Free',
    isOnline: counselor.isAvailable || false,
    languages: counselor.languages || ['English', 'Sinhala'],
    counselorType: counselor.isVolunteer && counselor.sessionFee === 0 ? 'free' : 
                  counselor.isVolunteer && counselor.sessionFee > 0 ? 'paid_with_free_student' : 
                  'paid_only'
  };

  // Determine the pricing display based on counselor type and student status
  const getPriceDisplay = () => {
    if (counselorDisplay.counselorType === 'free') {
      return (
        <View>
          <Text className="text-green-600 font-semibold">Free session</Text>
          <Text className="text-xs text-gray-500">Volunteer Counselor</Text>
        </View>
      );
    } else if (counselorDisplay.counselorType === 'paid_with_free_student' && isUserStudent && freeSessionsRemaining > 0) {
      return (
        <View>
          <Text className="text-gray-500 line-through text-xs">{counselorDisplay.price}</Text>
          <Text className="text-green-600 font-semibold">Free for Students</Text>
        </View>
      );
    } else {
      return (
        <View>
          <Text className="text-green font-semibold">{counselorDisplay.price}</Text>
          <Text className="text-xs text-gray-500">Per session</Text>
        </View>
      );
    }
  };

  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow">
      <View className="flex-row mb-4">
        <TouchableOpacity 
          className="relative"
          onPress={() => {
            router.push({
              pathname: '/(hidden)/profile/counsellor_profile',
              params: { id: counselor.id }
            });
          }}
        >
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
          {counselorDisplay.isOnline && (
            <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 ml-4 mr-3"
          onPress={() => {
            router.push({
              pathname: '/(hidden)/profile/counsellor_profile',
              params: { id: counselor.id }
            });
          }}
        >
          <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
            {counselor.name}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {counselorDisplay.title}
          </Text>
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {counselorDisplay.experience} experience
          </Text>
          <View className="flex-row items-center mt-1">
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text className="ml-1 text-sm font-semibold text-gray-800">{counselorDisplay.rating}</Text>
          </View>
        </TouchableOpacity>
        <View className="items-end justify-start">
          {getPriceDisplay()}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-3">
        {counselorDisplay.specialties && counselorDisplay.specialties.map((specialty: string) => (
          <Text 
            key={specialty} 
            className="text-xs bg-blue-100 text-primary px-3 py-1 rounded-xl font-medium"
          >
            {specialty}
          </Text>
        ))}
        
        {/* Show appropriate counselor type badge */}
        {(counselorDisplay.counselorType === 'free') || (counselorDisplay.counselorType === 'paid_with_free_student' && isUserStudent) ? (
          <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-xl">
            <GraduationCap size={12} color="#059669" className="mr-1" />
            <Text className="text-xs text-green-700 font-medium ml-1">Volunteer Counselor</Text>
          </View>
        ): null}
      </View>

      <View className="flex-row items-center mb-2">
        <Clock size={16} color="#16a34a" />
        {counselorDisplay.isOnline && (
          <Text className="ml-2 text-sm text-green-600 font-medium">Available now</Text>
        )}
      </View>

      {counselor.description && (
        <View className="mb-4">
          <Text className="text-sm text-gray-700" numberOfLines={2}>{counselor.description}</Text>
        </View>
      )}

      {/* Show free session badge for students with remaining sessions */}
      {isUserStudent && freeSessionsRemaining > 0 ? (
        <View>
        {(counselorDisplay.counselorType === 'free' || counselorDisplay.counselorType === 'paid_with_free_student') && (
          <Text className="text-green-700 text-xs font-medium mb-3 bg-green-50 p-2 rounded-lg">
            ✓ {freeSessionsRemaining} free student sessions remaining this month
          </Text>
        )}
      </View>
      ) : isUserStudent && counselorDisplay.counselorType === 'paid_with_free_student' && freeSessionsRemaining === 0 ? (
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
  const [counselors, setCounselors] = useState<ExtendedCounselor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>(['All']);
  const { feeStatus, isLoading: feeLoading } = usePlatformFee();

  // Fetch counselors and check student status when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch counselors from API
        const response = await getAvailableCounselors();
        
        if (response.success && response.data.counselors) {
          // Process counselors from API response
          const extendedCounselors: ExtendedCounselor[] = response.data.counselors.map(counselor => {
            // Handle the specialities field from the API
            const apiCounselor = counselor as any;
            
            return {
              ...counselor,
              // Determine counselor type based on isVolunteer flag and sessionFee
              counselorType: counselor.isVolunteer && counselor.sessionFee === 0 ? 'free' : 
                            counselor.isVolunteer && counselor.sessionFee > 0 ? 'paid_with_free_student' : 
                            'paid_only',
              // Set providesStudentSessions based on counselor type
              providesStudentSessions: counselor.isVolunteer && counselor.sessionFee > 0,
              // Add any additional UI properties not provided by API
              experience: '5 years',
              // Map API's specialities to our interface's specialties
              specialties: apiCounselor.specialities || []
            };
          });
          
          setCounselors(extendedCounselors);
          
          // Extract unique specialties for filter tabs
          const allSpecialties = ['All'];
          extendedCounselors.forEach(counselor => {
            if (counselor.specialties) {
              counselor.specialties.forEach((specialty: string) => {
                if (!allSpecialties.includes(specialty)) {
                  allSpecialties.push(specialty);
                }
              });
            }
          });
          setAvailableSpecialties(allSpecialties);
        }

        // Check if user is a student and get free sessions data
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const studentStatus = await checkIsStudent(token);
          setIsStudent(studentStatus);
          
          // If student, get free sessions data (either from AsyncStorage or API)
          if (studentStatus) {
            // First try to get from AsyncStorage (prefetched in counsellor.tsx)
            const storedFreeSessionsRemaining = await AsyncStorage.getItem('freeSessionsRemaining');
            const lastFetchTime = await AsyncStorage.getItem('lastFreeSessionsFetch');
            
            // Check if we have recently fetched data (within the last hour)
            const useStoredData = storedFreeSessionsRemaining && lastFetchTime && 
              (new Date().getTime() - new Date(lastFetchTime).getTime() < 60 * 60 * 1000);
            
            if (useStoredData) {
              // Use the stored data
              setFreeSessionsRemaining(parseInt(storedFreeSessionsRemaining || '0'));
            } else {
              try {
                // Fetch from API if data is not available or outdated
                const freeSessionsResponse = await import('@/api/sessions').then(
                  module => module.getRemainingFreeSessions(token)
                );
                
                if (freeSessionsResponse && freeSessionsResponse.data) {
                  const sessionInfo = freeSessionsResponse.data;
                  setFreeSessionsRemaining(sessionInfo.remainingSessions);
                  
                  // Update the stored data
                  await AsyncStorage.setItem('freeSessionsRemaining', sessionInfo.remainingSessions.toString());
                  await AsyncStorage.setItem('nextResetDate', sessionInfo.nextResetDate);
                  await AsyncStorage.setItem('totalSessionsThisPeriod', sessionInfo.totalSessionsThisPeriod.toString());
                  await AsyncStorage.setItem('lastFreeSessionsFetch', new Date().toISOString());
                }
              } catch (error) {
                console.error('Error fetching free sessions data:', error);
                // Fallback to stored data if available
                if (storedFreeSessionsRemaining) {
                  setFreeSessionsRemaining(parseInt(storedFreeSessionsRemaining));
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load counselors. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Reset specialty filter if platform fee is not paid
  useEffect(() => {
    if (!feeStatus?.hasPaid && selectedSpecialty !== 'All') {
      setSelectedSpecialty('All');
    }
  }, [feeStatus?.hasPaid, selectedSpecialty]);

  // Simple filter tabs for Free and Paid counselors
  const tabFilters = [
    { id: 'all', label: 'All Counselors' },
    { id: 'free', label: 'Free Counselors' },
    { id: 'paid', label: 'Paid Counselors' }
  ];

  const filteredCounselors = useMemo(() => {
    let filtered = counselors;
    
    // Filter by specialty - only if platform fee is paid
    if (selectedSpecialty !== 'All' && feeStatus?.hasPaid) {
      filtered = filtered.filter((counselor) => 
        counselor.specialties?.includes(selectedSpecialty)
      );
    }
    
    // Filter by tab selection
    if (selectedTab !== 'all') {
      if (selectedTab === 'free') {
        // For free tab, only include counselors that are free for everyone (volunteers)
        filtered = filtered.filter((counselor) => counselor.isVolunteer);
      } else if (selectedTab === 'paid') {
        // For paid tab, only include paid counselors (non-volunteers)
        filtered = filtered.filter((counselor) => !counselor.isVolunteer);
      }
    }
    
    // Sort the filtered counselors
    return filtered.sort((a, b) => {
      // Prioritize online counselors
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      
      // Then by rating
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [selectedSpecialty, selectedTab, isStudent, freeSessionsRemaining, counselors, feeStatus?.hasPaid]);

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

      {/* Specialty tabs remain in the blue header - only show if platform fee is paid */}
      {feeStatus?.hasPaid ? (
        <View className="py-2 bg-primary">
          <SpecialtyTabs selected={selectedSpecialty} onSelect={setSelectedSpecialty} specialties={availableSpecialties} />
        </View>
      ) : (
        <View className="py-3 bg-primary px-5">
          <Text className="text-white/80 text-sm text-center">
            💡 Upgrade with platform fee to filter by specialties like anxiety, depression, stress, and more
          </Text>
        </View>
      )}
    
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
                    ? `You have ${freeSessionsRemaining} free sessions remaining this month` 
                    : "You've used all your free sessions this month"}
                </Text>
              </View>
            </View>
          )}
          
          {/* Counselor type filters in a ScrollView with fixed height to prevent overlap - only shown to students */}
          {isStudent && (
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
          )}
        </View>
      
        {/* Counselor list with proper width and padding */}
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 text-lg">Loading counselors...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center py-12 px-5">
            <Text className="text-red-500 text-lg font-medium">{error}</Text>
            <TouchableOpacity 
              className="mt-4 bg-primary px-4 py-2 rounded-lg"
              onPress={() => {
                setError(null);
                setIsLoading(true);
                // Retry fetching counselors
                getAvailableCounselors()
                  .then(response => {
                    if (response.success && response.data.counselors) {
                      // Process counselors from API response
                      const extendedCounselors: ExtendedCounselor[] = response.data.counselors.map(counselor => {
                        // Handle the specialities field from the API
                        const apiCounselor = counselor as any;
                        
                        return {
                          ...counselor,
                          // Determine counselor type based on isVolunteer flag and sessionFee
                          counselorType: counselor.isVolunteer && counselor.sessionFee === 0 ? 'free' : 
                                        counselor.isVolunteer && counselor.sessionFee > 0 ? 'paid_with_free_student' : 
                                        'paid_only',
                          // Set providesStudentSessions based on counselor type
                          providesStudentSessions: counselor.isVolunteer && counselor.sessionFee > 0,
                          // Add any additional UI properties not provided by API
                          experience: counselor.description ? 
                            `${counselor.description.split(' ').slice(-2)[0]} years` : 
                            '1+ years',
                          // Map API's specialities to our interface's specialties
                          specialties: apiCounselor.specialities || []
                        };
                      });
                      
                      setCounselors(extendedCounselors);
                    }
                  })
                  .catch(err => setError('Failed to load counselors. Please try again later.'))
                  .finally(() => setIsLoading(false));
              }}
            >
              <Text className="text-white font-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredCounselors}
            keyExtractor={(item) => item.id.toString()}
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
        )}
      </View>
    </SafeAreaView>
  );
}