import { getUserPrescriptions, type Prescription as ApiPrescription } from '@/api/prescriptions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Download, FileText, Printer, Share, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Types for prescription data - extended from API types
type Prescription = {
  id: string;
  doctorName: string;
  doctorImage?: string;
  doctorLicense?: string;
  doctorContact?: string;
  prescriptionDate: string;
  description: string;
  notes?: string;
  diagnosis?: string;
  downloadUrl: string;
  prescriptionNumber?: string;
  psychiatristId: number;
  clientId: number;
  createdAt: string;
  updatedAt: string;
};

// Helper function to map API response to UI format
const mapApiPrescriptionToUI = (apiPrescription: ApiPrescription): Prescription => {
  return {
    id: apiPrescription.id.toString(),
    doctorName: apiPrescription.psychiatrist.name,
    doctorImage: apiPrescription.psychiatrist.avatar,
    doctorContact: apiPrescription.psychiatrist.email,
    prescriptionDate: apiPrescription.createdAt,
    createdAt: apiPrescription.createdAt,
    updatedAt: apiPrescription.updatedAt,
    description: apiPrescription.description,
    downloadUrl: apiPrescription.prescription,
    psychiatristId: apiPrescription.psychiatristId,
    clientId: apiPrescription.clientId,
    prescriptionNumber: `RX-${apiPrescription.id}`,
    // These could be extended if the backend provides more data
    doctorLicense: undefined,
    notes: undefined,
    diagnosis: undefined
  };
};

export default function PrescriptionDetail() {
  const { id } = useLocalSearchParams();
  const [prescription, setPrescription] = useState<Prescription | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch prescription details from API
  useEffect(() => {
    const fetchPrescriptionDetails = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          return;
        }

        const response = await getUserPrescriptions(token);
        
        if (response.success && response.data.prescriptions) {
          const apiPrescription = response.data.prescriptions.find(p => p.id.toString() === id);
          
          if (apiPrescription) {
            const mappedPrescription = mapApiPrescriptionToUI(apiPrescription);
            setPrescription(mappedPrescription);
            setError(null);
          } else {
            setError('Prescription not found');
          }
        } else {
          setError(response.message || 'Failed to fetch prescription details');
        }
      } catch (error: any) {
        console.log('Error fetching prescription details:', error);
        setError(error.message || 'Failed to fetch prescription details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPrescriptionDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <View className="bg-white rounded-2xl p-8 shadow-lg items-center max-w-sm">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-700 text-lg font-medium mt-4">Loading prescription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <View className="bg-white rounded-2xl p-8 shadow-lg items-center max-w-sm">
          <FileText size={48} color="#DC2626" />
          <Text className="text-gray-700 text-lg font-medium mt-4">Error Loading Prescription</Text>
          <Text className="text-gray-500 text-center mt-2">{error}</Text>
          <TouchableOpacity
            className="mt-4 bg-primary px-6 py-3 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!prescription) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <View className="bg-white rounded-2xl p-8 shadow-lg items-center max-w-sm">
          <FileText size={48} color="#DC2626" />
          <Text className="text-gray-700 text-lg font-medium mt-4">Prescription not found</Text>
          <TouchableOpacity
            className="mt-4 bg-primary px-6 py-3 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };



  const handleDownload = async () => {
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
                const canOpen = await Linking.canOpenURL(prescription.downloadUrl);
                if (canOpen) {
                  await Linking.openURL(prescription.downloadUrl);
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
      console.log('Error in download handler:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleShare = async () => {
    try {
      Alert.alert(
        'Share Prescription',
        'Choose how you would like to share this prescription.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Link', 
            onPress: async () => {
              try {
                const canOpen = await Linking.canOpenURL(prescription.downloadUrl);
                if (canOpen) {
                  await Linking.openURL(prescription.downloadUrl);
                } else {
                  Alert.alert('Error', 'Cannot open the prescription link.');
                }
              } catch (error) {
                console.log('Error opening prescription URL:', error);
                Alert.alert('Error', 'Failed to open prescription link.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.log('Error in share handler:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Print Prescription',
      'This will open the print dialog for this prescription.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Print', onPress: () => console.log('Printing prescription...') }
      ]
    );
  };



  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-gray-100 p-2 rounded-full"
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View className="flex-row">
            <TouchableOpacity 
              className="bg-gray-100 p-2 rounded-full mr-2"
              onPress={handleShare}
            >
              <Share size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-gray-100 p-2 rounded-full"
              onPress={handlePrint}
            >
              <Printer size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-gray-900 text-2xl font-bold ml-1">Prescription Details</Text>
        {prescription.prescriptionNumber && (
          <Text className="text-gray-500 text-sm ml-1 mt-1">
            {prescription.prescriptionNumber}
          </Text>
        )}
        <Text className="text-gray-500 text-sm ml-1 mt-1">
          Issued: {formatDate(prescription.prescriptionDate)}
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-4 py-4" 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Information */}
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Doctor Information</Text>
          
          <View className="flex-row mb-4">
            <View className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mr-4 border-2 border-gray-100">
              {prescription.doctorImage ? (
                <Image 
                  source={{ uri: prescription.doctorImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-gray-300 justify-center items-center">
                  <User size={28} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-gray-900">
                {prescription.doctorName}
              </Text>
              <Text className="text-gray-600 text-sm">
                Psychiatrist
              </Text>
              {prescription.doctorLicense && (
                <Text className="text-gray-500 text-sm">
                  License: {prescription.doctorLicense}
                </Text>
              )}
              {prescription.doctorContact && (
                <Text className="text-primary text-sm">
                  {prescription.doctorContact}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Diagnosis */}
        {prescription.diagnosis && (
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Diagnosis</Text>
            <Text className="text-gray-700 leading-5">
              {prescription.diagnosis}
            </Text>
          </View>
        )}

        {/* Description */}
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Description</Text>
          <Text className="text-gray-700 leading-5">
            {prescription.description}
          </Text>
        </View>

        {/* Notes */}
        {prescription.notes && (
          <View className="bg-amber-50 rounded-xl p-5 mb-4 border border-amber-200">
            <View className="flex-row items-center mb-2">
              <View className="bg-amber-100 p-2 rounded-full mr-3">
                <FileText size={16} color="#F59E0B" />
              </View>
              <Text className="text-amber-800 font-semibold">Important Notes</Text>
            </View>
            <Text className="text-amber-700 leading-5">
              {prescription.notes}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="mt-4">
          <TouchableOpacity 
            className="bg-primary py-4 rounded-xl items-center justify-center flex-row shadow-sm"
            onPress={handleDownload}
          >
            <Download size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold text-lg ml-3">Download Prescription</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View className="bg-gray-100 p-4 rounded-xl mt-6">
          <Text className="text-gray-600 text-xs text-center leading-4">
            This is a digital copy of your prescription. Please consult with your healthcare provider for any questions about your medication. 
            Do not modify the dosage without professional guidance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}