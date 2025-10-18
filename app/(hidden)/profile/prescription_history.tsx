import { router } from 'expo-router';
import { ArrowLeft, Download, FileText, Search, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Types for prescription data
type Prescription = {
  id: string;
  doctorName: string;
  doctorImage?: string;
  prescriptionDate: string;
  description: string;
  notes?: string;
  downloadUrl: string;
};

// Mock data for prescriptions
const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    doctorName: 'Dr. Sarath Perera',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    prescriptionDate: '2024-10-15T10:30:00',
    description: 'Prescription for anxiety and depression management. Continue with regular follow-ups.',
    notes: 'Please bring this prescription to any registered pharmacy.',
    downloadUrl: 'https://example.com/prescription1.pdf'
  },
  {
    id: '2',
    doctorName: 'Dr. Saman Rathnayake',
    doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
    prescriptionDate: '2024-09-28T14:15:00',
    description: 'Vitamin supplements to support mental health and overall wellness.',
    notes: 'Prescription has been used at City Pharmacy.',
    downloadUrl: 'https://example.com/prescription2.pdf'
  },
  {
    id: '3',
    doctorName: 'Dr. Suranga Thennakoon',
    doctorImage: 'https://images.unsplash.com/photo-1594824481882-0b2c9fedb2b3?w=150&h=150&fit=crop&crop=face',
    prescriptionDate: '2024-08-20T09:00:00',
    description: 'Sleep aid to help regulate sleep patterns and improve sleep quality.',
    notes: 'Prescription validity has expired. Please consult doctor for new prescription.',
    downloadUrl: 'https://example.com/prescription3.pdf'
  },
  {
    id: '4',
    doctorName: 'Dr. Namal Abeypussa',
    doctorImage: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
    prescriptionDate: '2024-07-10T11:45:00',
    description: 'Initial prescription for depression treatment. Monitor for any side effects.',
    notes: 'Follow-up consultation recommended.',
    downloadUrl: 'https://example.com/prescription4.pdf'
  }
];

export default function PrescriptionHistory() {
  const [prescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [loading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

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
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
                    onPress={() => console.log('Download prescription', prescription.id)}
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