import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Download, FileText, Printer, Share, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Types for prescription data
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
};

// Mock data (same as in prescription_history.tsx but with more details)
const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    doctorName: 'Dr. Sarath Perera',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    doctorLicense: 'MD-12345',
    doctorContact: 'sarath.perera@healthcenter.com',
    prescriptionDate: '2024-10-15T10:30:00',
    prescriptionNumber: 'RX-2024-001',
    diagnosis: 'Generalized Anxiety Disorder, Major Depressive Disorder',
    description: 'Prescription for anxiety and depression management. Continue with regular follow-ups and monitor for side effects.',
    notes: 'Patient should avoid alcohol consumption. Schedule follow-up in 2 weeks. Monitor for suicidal ideation.',
    downloadUrl: 'https://example.com/prescription1.pdf'
  },
  {
    id: '2',
    doctorName: 'Dr. Saman Rathnayake',
    doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
    doctorLicense: 'MD-67890',
    doctorContact: 'saman.rathnayake@familymed.com',
    prescriptionDate: '2024-09-28T14:15:00',
    prescriptionNumber: 'RX-2024-002',
    diagnosis: 'Vitamin D Deficiency, Magnesium Deficiency',
    description: 'Vitamin supplements to support mental health and overall wellness. Recheck levels after 6 weeks.',
    notes: 'Patient reports fatigue and mood changes. Monitor energy levels and mood improvements.',
    downloadUrl: 'https://example.com/prescription2.pdf'
  },
  {
    id: '3',
    doctorName: 'Dr. Suranga Thennakoon',
    doctorImage: 'https://images.unsplash.com/photo-1594824481882-0b2c9fedb2b3?w=150&h=150&fit=crop&crop=face',
    doctorLicense: 'PSY-11111',
    doctorContact: 'suranga.thennakoon@mindhealth.com',
    prescriptionDate: '2024-08-20T09:00:00',
    prescriptionNumber: 'RX-2024-003',
    diagnosis: 'Insomnia, Sleep Disorder',
    description: 'Sleep aid to help regulate sleep patterns and improve sleep quality. Part of comprehensive sleep hygiene plan.',
    notes: 'Patient should maintain consistent sleep schedule. Avoid caffeine after 2 PM. Practice relaxation techniques.',
    downloadUrl: 'https://example.com/prescription3.pdf'
  },
  {
    id: '4',
    doctorName: 'Dr. Namal Abeypussa',
    doctorImage: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
    doctorLicense: 'MD-22222',
    doctorContact: 'namal.abeypussa@mentalhealth.org',
    prescriptionDate: '2024-07-10T11:45:00',
    prescriptionNumber: 'RX-2024-004',
    diagnosis: 'Major Depressive Disorder',
    description: 'Initial prescription for depression treatment. Start with low dose and monitor for side effects.',
    notes: 'First-time SSRI prescription. Patient should report any unusual symptoms. Schedule follow-up in 2 weeks.',
    downloadUrl: 'https://example.com/prescription4.pdf'
  }
];

export default function PrescriptionDetail() {
  const { id } = useLocalSearchParams();
  const [prescription] = useState<Prescription | undefined>(
    mockPrescriptions.find(p => p.id === id)
  );

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



  const handleDownload = () => {
    Alert.alert(
      'Download Prescription',
      'This will download the prescription as a PDF file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => console.log('Downloading prescription...') }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Prescription',
      'Choose how you would like to share this prescription.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => console.log('Sharing via email...') },
        { text: 'Message', onPress: () => console.log('Sharing via message...') }
      ]
    );
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