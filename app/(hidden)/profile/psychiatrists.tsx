import { checkIsStudent } from '@/api/api';
import { getAvailablePsychiatrists, Psychiatrist } from '@/api/psychiatrist';
import { usePlatformFee } from '@/contexts/PlatformFeeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ArrowLeft, Clock, Star, Stethoscope } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PrimaryButton } from '../../components/Buttons';
import SpecialtyTabs from '../../components/SpecialtyTabs';

// Get screen dimensions for proper sizing
const { width: screenWidth } = Dimensions.get('window');

// Extended type that includes processed specialties for UI
type PsychiatristType = Psychiatrist & {
  specialties?: string[]; // UI field processed from backend's 'specialities'
};

const PsychiatristCard = ({ psychiatrist, isUserStudent }: { psychiatrist: PsychiatristType, isUserStudent: boolean }) => {
  const [imageError, setImageError] = useState(false);

  // Default values for UI display
  const psychiatristDisplay = {
    ...psychiatrist,
    title: psychiatrist.title || 'Psychiatrist',
    specialties: psychiatrist.specialties || psychiatrist.specialities || ['General Psychiatry'],
    rating: psychiatrist.rating || 4.7,
    experience: psychiatrist.experience || '5+ years',
    price: `Rs.${psychiatrist.sessionFee}`,
    isOnline: psychiatrist.isAvailable || false,
    languages: psychiatrist.languages || ['English', 'Sinhala'],
  };

  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow">
      <View className="flex-row mb-4">
        <TouchableOpacity 
          className="relative"
          onPress={() => {
            router.push({
              pathname: '/(hidden)/profile/psychiatrist_profile',
              params: { id: psychiatrist.id }
            });
          }}
        >
          {!imageError ? (
            <Image
              source={{ uri: psychiatrist.avatar }}
              className="w-16 h-16 rounded-full bg-gray-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <View className="w-16 h-16 rounded-full bg-gray-300 justify-center items-center">
              <Text className="text-gray-600 font-semibold">
                {psychiatrist.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </Text>
            </View>
          )}
          {psychiatristDisplay.isOnline && (
            <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 ml-4 mr-3"
          onPress={() => {
            router.push({
              pathname: '/(hidden)/profile/psychiatrist_profile',
              params: { id: psychiatrist.id }
            });
          }}
        >
          <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
            Dr. {psychiatrist.name}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {psychiatristDisplay.title}
          </Text>
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {psychiatristDisplay.experience} experience
          </Text>
          <View className="flex-row items-center mt-1">
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text className="ml-1 text-sm font-semibold text-gray-800">{psychiatristDisplay.rating}</Text>
          </View>
        </TouchableOpacity>
        <View className="items-end justify-start">
          <Text className="text-primary font-semibold">{psychiatristDisplay.price}</Text>
          <Text className="text-xs text-gray-500">Per session</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-3">
        {psychiatristDisplay.specialties && psychiatristDisplay.specialties.map((specialty: string) => (
          <Text 
            key={specialty} 
            className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-xl font-medium"
          >
            {specialty}
          </Text>
        ))}
        
        {/* Medical Professional badge */}
        <View className="flex-row items-center bg-blue-100 px-3 py-1 rounded-xl">
          <Stethoscope size={12} color="#2563EB" className="mr-1" />
          <Text className="text-xs text-blue-700 font-medium ml-1">Medical Doctor</Text>
        </View>
      </View>

      <View className="flex-row items-center mb-2">
        <Clock size={16} color="#16a34a" />
        {psychiatristDisplay.isOnline && (
          <Text className="ml-2 text-sm text-green-600 font-medium">Available now</Text>
        )}
      </View>

      {psychiatrist.description && (
        <View className="mb-4">
          <Text className="text-sm text-gray-700" numberOfLines={2}>{psychiatrist.description}</Text>
        </View>
      )}

      <View className="flex-row gap-3">
        <PrimaryButton 
          title="Contact Psychiatrist" 
          onPress={() => {
            // Pass the psychiatrist ID to the booking screen
            router.push({
              pathname: '../session/bookPsychiatrist',
              params: { psychiatristId: psychiatrist.id }
            });
          }} 
          icon={Stethoscope}
        />
      </View>
    </View>
  );
};

export default function PsychiatristsScreen() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [psychiatrists, setPsychiatrists] = useState<PsychiatristType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>(['All']);
  const { feeStatus, isLoading: feeLoading } = usePlatformFee();

  // Fetch psychiatrists and check student status when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch psychiatrists from API
        const response = await getAvailablePsychiatrists();
        
        if (response.success && response.data.psychiatrists) {
          // Process psychiatrists from API response
          const processedPsychiatrists: PsychiatristType[] = response.data.psychiatrists.map((psychiatrist: any) => {
            // Handle the specialities field from the API
            const apiPsychiatrist = psychiatrist as any;
            
            return {
              ...psychiatrist,
              // Map API's specialities to our interface's specialties
              specialties: apiPsychiatrist.specialities || []
            };
          });
          
          setPsychiatrists(processedPsychiatrists);
          
          // Extract unique specialties for filter tabs
          const allSpecialties = ['All'];
          processedPsychiatrists.forEach(psychiatrist => {
            if (psychiatrist.specialties) {
              psychiatrist.specialties.forEach((specialty: string) => {
                if (!allSpecialties.includes(specialty)) {
                  allSpecialties.push(specialty);
                }
              });
            }
          });
          setAvailableSpecialties(allSpecialties);
        }

        // Check if user is a student
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const studentStatus = await checkIsStudent(token);
          setIsStudent(studentStatus);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load psychiatrists. Please try again later.');
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

  const filteredPsychiatrists = useMemo(() => {
    let filtered = psychiatrists;
    
    // Filter by specialty - only if platform fee is paid
    if (selectedSpecialty !== 'All' && feeStatus?.hasPaid) {
      filtered = filtered.filter((psychiatrist) => 
        psychiatrist.specialties?.includes(selectedSpecialty)
      );
    }
    
    // Sort the filtered psychiatrists
    return filtered.sort((a, b) => {
      // Prioritize online psychiatrists
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      
      // Then by rating
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [selectedSpecialty, psychiatrists, feeStatus?.hasPaid]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold">Find a Psychiatrist</Text>
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
          
          {/* Psychiatrist list with proper width and padding */}
          {isLoading ? (
            <View className="items-center justify-center py-12">
              <Text className="text-gray-500 text-lg">Loading psychiatrists...</Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-12 px-5">
              <Text className="text-red-500 text-lg font-medium">{error}</Text>
              <TouchableOpacity 
                className="mt-4 bg-primary px-4 py-2 rounded-lg"
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                  // Retry fetching psychiatrists
                  getAvailablePsychiatrists()
                    .then(response => {
                      if (response.success && response.data.psychiatrists) {
                        // Process psychiatrists from API response
                        const processedPsychiatrists: PsychiatristType[] = response.data.psychiatrists.map((psychiatrist: any) => {
                          // Handle the specialities field from the API
                          const apiPsychiatrist = psychiatrist as any;
                          
                          return {
                            ...psychiatrist,
                            // Map API's specialities to our interface's specialties
                            specialties: apiPsychiatrist.specialities || []
                          };
                        });
                        
                        setPsychiatrists(processedPsychiatrists);
                      }
                    })
                    .catch(err => setError('Failed to load psychiatrists. Please try again later.'))
                    .finally(() => setIsLoading(false));
                }}
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredPsychiatrists}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="px-5 w-full">
                  <PsychiatristCard 
                    psychiatrist={item} 
                    isUserStudent={isStudent} 
                  />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View className="items-center justify-center py-12 px-5">
                  <Text className="text-gray-500 text-lg font-medium">No psychiatrists found</Text>
                  <Text className="text-gray-400 text-center mt-2 px-8">
                    Try adjusting your filters
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}