import { getUserPrescriptions, type Prescription as ApiPrescription } from '@/api/prescriptions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ArrowLeft, Download, FileText, Search, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Types for prescription data - mapping API response to UI
type Prescription = {
  id: string;
  doctorName: string;
  doctorImage?: string;
  prescriptionDate: string;
  description: string;
  notes?: string;
  downloadUrl: string;
};

// Helper function to map API response to UI format
const mapApiPrescriptionToUI = (apiPrescription: ApiPrescription): Prescription => {
  return {
    id: apiPrescription.id.toString(),
    doctorName: apiPrescription.psychiatrist.name,
    doctorImage: apiPrescription.psychiatrist.avatar,
    prescriptionDate: apiPrescription.createdAt,
    description: apiPrescription.description,
    downloadUrl: apiPrescription.prescription,
    // You can add notes logic here if needed
    notes: undefined
  };
};

export default function PrescriptionHistory() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch prescriptions from API
  const fetchPrescriptions = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await getUserPrescriptions(token);
      
      if (response.success && response.data.prescriptions) {
        const mappedPrescriptions = response.data.prescriptions.map(mapApiPrescriptionToUI);
        setPrescriptions(mappedPrescriptions);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch prescriptions');
      }
    } catch (error: any) {
      console.log('Error fetching prescriptions:', error);
      setError(error.message || 'Failed to fetch prescriptions');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadPrescriptions = async () => {
      setLoading(true);
      await fetchPrescriptions();
      setLoading(false);
    };
    
    loadPrescriptions();
  }, [fetchPrescriptions]);

  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (searchTerm && !prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime());

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handlePrescriptionPress = (prescriptionId: string) => {
    router.push({
      pathname: '/(hidden)/profile/prescription_detail',
      params: { id: prescriptionId }
    } as any);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  };

  const handleDownloadPrescription = async (prescriptionId: string, downloadUrl: string) => {
    try {
      Alert.alert(
        'Download Prescription',
        'This will open the prescription PDF in your browser.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: async () => {
              try {
                const canOpen = await Linking.canOpenURL(downloadUrl);
                if (canOpen) {
                  await Linking.openURL(downloadUrl);
                } else {
                  Alert.alert('Error', 'Cannot open the prescription file. Please check your internet connection.');
                }
              } catch (error) {
                console.log('Error opening prescription URL:', error);
                Alert.alert('Error', 'Failed to open prescription file.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.log('Error downloading prescription:', error);
      Alert.alert('Error', 'Failed to download prescription. Please try again.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <View className="bg-white rounded-2xl p-8 shadow-lg items-center max-w-sm">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-700 text-lg font-medium mt-4">Loading prescriptions...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <View className="bg-white rounded-2xl p-8 shadow-lg items-center max-w-sm">
          <FileText size={48} color="#DC2626" />
          <Text className="text-gray-700 text-lg font-medium mt-4">Error Loading Prescriptions</Text>
          <Text className="text-gray-500 text-center mt-2">{error}</Text>
          <TouchableOpacity
            className="mt-4 bg-primary px-6 py-3 rounded-xl"
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchPrescriptions().finally(() => setLoading(false));
            }}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 mt-10 bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-gray-100 p-2 rounded-full"
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-900 text-2xl font-bold ml-1">Prescription History</Text>
        <Text className="text-gray-500 text-sm ml-1 mt-1">Manage your medical prescriptions</Text>
      </View>

      <ScrollView 
        className="flex-1 px-4 py-4" 
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl shadow-sm p-3 mb-4">
          <View className="mr-2 ml-1">
            <Search size={18} color="#2563EB" />
          </View>
          <TextInput
            placeholder="Search by doctor name"
            className="flex-1 text-gray-700 py-1"
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9CA3AF"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchTerm('')}
              className="bg-gray-100 px-2 py-1 rounded-md"
            >
              <Text className="text-primary font-medium">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Prescriptions List */}
        {filteredPrescriptions.length === 0 ? (
          <View className="items-center justify-center py-12">
            <View className="bg-gray-100 rounded-full p-6 mb-4">
              <FileText size={48} color="#2563EB" />
            </View>
            <Text className="text-gray-700 text-xl font-semibold mt-4">No prescriptions found</Text>
            <Text className="text-gray-500 text-center mt-2 px-8 leading-5">
              You don't have any prescriptions in your history yet.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredPrescriptions.map((prescription) => (
              <TouchableOpacity
                key={prescription.id}
                onPress={() => handlePrescriptionPress(prescription.id)}
                className="bg-white rounded-xl p-5 border border-gray-200 mb-4 shadow-sm"
                activeOpacity={0.7}
              >
                {/* Prescription Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-500 text-sm">
                    {formatDate(prescription.prescriptionDate)}
                  </Text>
                </View>

                {/* Doctor Info */}
                <View className="flex-row mb-4">
                  <View className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-3 border-2 border-gray-100">
                    {prescription.doctorImage ? (
                      <Image 
                        source={{ uri: prescription.doctorImage }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full bg-gray-300 justify-center items-center">
                        <User size={20} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      {prescription.doctorName}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Psychiatrist
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
                  {prescription.description}
                </Text>

                {/* Action Buttons */}
                <View className="flex-row justify-between pt-2 border-t border-gray-100">
                  <TouchableOpacity 
                    className="flex-1 mr-2 py-2 bg-gray-100 rounded-lg items-center justify-center flex-row"
                    onPress={() => handlePrescriptionPress(prescription.id)}
                  >
                    <FileText size={16} color="#4B5563" />
                    <Text className="text-gray-700 font-medium text-sm ml-2">View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="flex-1 ml-2 py-2 bg-primary rounded-lg items-center justify-center flex-row"
                    onPress={() => handleDownloadPrescription(prescription.id, prescription.downloadUrl)}
                  >
                    <Download size={16} color="#FFFFFF" />
                    <Text className="text-white font-medium text-sm ml-2">Download</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}