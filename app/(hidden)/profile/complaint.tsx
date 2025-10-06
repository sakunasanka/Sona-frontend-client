import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AlertTriangle, ArrowLeft, ChevronDown, FileText, Send, Upload, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { fetchComplaints, submitComplaint } from '../../../api/complaints';
import { Session, fetchUserSessions } from '../../../api/sessions';
import { uploadComplaintProofToCloudinary } from '../../../utils/cloudinary';
import { PrimaryButton } from '../../components/Buttons';

interface ComplaintReason {
  id: string;
  label: string;
  description: string;
}

interface UploadedFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  cloudinaryUrl?: string;
}

const complaintReasons: ComplaintReason[] = [
  {
    id: 'unprofessional_behavior',
    label: 'Unprofessional Behavior',
    description: 'Inappropriate conduct or behavior during the session'
  },
  {
    id: 'session_quality',
    label: 'Poor Session Quality',
    description: 'Session did not meet expected standards or was ineffective'
  },
  {
    id: 'technical_issues',
    label: 'Technical Issues',
    description: 'Problems with video/audio quality or platform functionality'
  },
  {
    id: 'cancellation_issue',
    label: 'Cancellation/Rescheduling',
    description: 'Issues with session cancellation or rescheduling policies'
  },
  {
    id: 'billing_issue',
    label: 'Billing Problem',
    description: 'Incorrect charges or payment-related issues'
  },
  {
    id: 'confidentiality',
    label: 'Confidentiality Concern',
    description: 'Breach of confidentiality or privacy concerns'
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other issues not listed above'
  }
];

export default function ComplaintScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFileOptionsModal, setShowFileOptionsModal] = useState(false);

  // Fallback mock sessions data for development/testing
  const mockSessions: Session[] = [
    {
      id: '1',
      date: '2024-01-15',
      duration: 50,
      fee: 100,
      counselorId: 'counselor1',
      counselor: {
        id: 'counselor1',
        name: 'Dr. Sarah Johnson',
      },
      timeSlot: '10:00 AM',
      status: 'completed',
      counselorType: 'counselor'
    },
    {
      id: '2',
      date: '2024-01-10',
      duration: 50,
      fee: 150,
      counselorId: 'psychiatrist1',
      counselor: {
        id: 'psychiatrist1',
        name: 'Dr. Michael Chen',
      },
      timeSlot: '2:00 PM',
      status: 'completed',
      counselorType: 'psychiatrist'
    },
    {
      id: '3',
      date: '2024-01-05',
      duration: 50,
      fee: 100,
      counselorId: 'counselor2',
      counselor: {
        id: 'counselor2',
        name: 'Dr. Lisa Wong',
      },
      timeSlot: '11:30 AM',
      status: 'completed',
      counselorType: 'counselor'
    }
  ];

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/signin')
              }
            ]
          );
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuthentication();
  }, []);

  useEffect(() => {
    const fetchRealSessions = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await fetchUserSessions(token);
          // Filter for completed sessions based on current time > scheduled time
          const completedSessions = response.data?.filter((session: Session) => {
            try {
              const sessionDateTime = new Date(`${session.date}T${session.timeSlot || '00:00'}:00`);
              const currentTime = new Date();
              return currentTime > sessionDateTime;
            } catch (error) {
              console.warn('Error parsing session date/time:', error);
              return false;
            }
          }) || [];
          setSessions(completedSessions);
        } else {
          // If no token, redirect to login
          router.replace('/(auth)/signin');
          return;
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        Alert.alert('Error', 'Failed to load your sessions. Please try again later.');
        // Fallback to mock data for development
        setSessions(mockSessions);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealSessions();
  }, []);

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadedFile({
          uri: asset.uri,
          name: `proof_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: asset.fileSize,
        });
        setShowFileOptionsModal(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/pdf',
          size: asset.size,
        });
        setShowFileOptionsModal(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const uploadFileToCloudinary = async (file: UploadedFile): Promise<string> => {
    try {
      setIsUploading(true);
      const result = await uploadComplaintProofToCloudinary(
        file.uri,
        file.name,
        file.mimeType
      );
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
  };

  const checkComplaintRateLimit = async (sessionId: string): Promise<{ allowed: boolean; message: string }> => {
    try {
      const complaintsResponse = await fetchComplaints();
      const userComplaints = complaintsResponse.data || [];
      const currentTime = new Date();
      const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(currentTime.getTime() - 48 * 60 * 60 * 1000);

      // Check if user has submitted any complaint in the last 24 hours
      const recentComplaints = userComplaints.filter(complaint => {
        const complaintTime = new Date(complaint.createdAt);
        return complaintTime > twentyFourHoursAgo;
      });

      if (recentComplaints.length > 0) {
        const lastComplaintTime = new Date(Math.max(...recentComplaints.map(c => new Date(c.createdAt).getTime())));
        const hoursUntilNextAllowed = Math.ceil((lastComplaintTime.getTime() + 24 * 60 * 60 * 1000 - currentTime.getTime()) / (60 * 60 * 1000));
        return {
          allowed: false,
          message: `You can only submit one complaint every 24 hours. Please try again in ${hoursUntilNextAllowed} hours.`
        };
      }

      // Check if user has already submitted a complaint for this specific session in the last 48 hours
      const sessionComplaints = userComplaints.filter(complaint => 
        complaint.session_id.toString() === sessionId
      );

      const recentSessionComplaints = sessionComplaints.filter(complaint => {
        const complaintTime = new Date(complaint.createdAt);
        return complaintTime > fortyEightHoursAgo;
      });

      if (recentSessionComplaints.length > 0) {
        const lastSessionComplaintTime = new Date(Math.max(...recentSessionComplaints.map(c => new Date(c.createdAt).getTime())));
        const hoursUntilNextAllowed = Math.ceil((lastSessionComplaintTime.getTime() + 48 * 60 * 60 * 1000 - currentTime.getTime()) / (60 * 60 * 1000));
        return {
          allowed: false,
          message: `You can only submit one complaint per session every 48 hours. Please try again in ${hoursUntilNextAllowed} hours.`
        };
      }

      return { allowed: true, message: '' };
    } catch (error) {
      console.error('Error checking complaint rate limit:', error);
      // If we can't check, allow the complaint to proceed (fail open)
      return { allowed: true, message: '' };
    }
  };

  const handleSubmitComplaint = async () => {
    // Validation
    if (!selectedSessionId) {
      Alert.alert('Session Required', 'Please select a session to file a complaint about.');
      return;
    }

    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a reason for your complaint.');
      return;
    }

    if (selectedReason === 'other' && additionalNotes.trim().length === 0) {
      Alert.alert('Details Required', 'Please provide details when selecting "Other" as the reason.');
      return;
    }

    const selectedSession = sessions.find(s => s.id === selectedSessionId);
    const selectedReasonDetails = complaintReasons.find(r => r.id === selectedReason);

    if (!selectedSession || !selectedReasonDetails) {
      Alert.alert('Error', 'Invalid selection. Please try again.');
      return;
    }

    // Check rate limiting rules
    const rateLimitCheck = await checkComplaintRateLimit(selectedSessionId);
    if (!rateLimitCheck.allowed) {
      Alert.alert('Rate Limit Exceeded', rateLimitCheck.message);
      return;
    }

    setIsSubmitting(true);

    try {
      let proofUrl: string | undefined = undefined;

      // Upload file if one is selected
      if (uploadedFile) {
        try {
          proofUrl = await uploadFileToCloudinary(uploadedFile);
          // console.log('File uploaded to Cloudinary:', proofUrl);
        } catch (uploadError) {
          Alert.alert('Upload Error', 'Failed to upload proof file. Please try again or remove the file to continue.');
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare complaint data
      const complaintData = {
        additional_details: additionalNotes,
        session_id: selectedSessionId, // Keep as string, don't parse to int
        reason: selectedReason,
        ...(proofUrl && { proof: proofUrl })
      };

      // Submit complaint
      await submitComplaint(complaintData);

      Alert.alert(
        'Complaint Submitted Successfully',
        `Your complaint about the session with ${selectedSession.counselor?.name} has been submitted. Our team will review it and contact you within 48 hours.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting complaint:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message && error.message.includes('authentication token')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/signin')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit your complaint. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSessionDisplayName = (session: Session) => {
    const professionalName = session.counselor?.name || 'Unknown Professional';
    // Since counselorType doesn't exist in the database, determine type from counselor name
    const isPsychiatrist = professionalName.toLowerCase().includes('dr.') ||
                          professionalName.toLowerCase().includes('psychiatrist');
    const sessionType = isPsychiatrist ? 'Psychiatrist Consultation' : 'Counseling';
    return `${sessionType} with ${professionalName}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600">Loading your sessions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-lg font-semibold">File a Complaint</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Information Banner */}
        <View className="bg-amber-50 mx-5 mt-5 p-4 rounded-2xl border border-amber-200">
          <View className="flex-row items-start">
            <AlertTriangle size={20} color="#D97706" className="mt-0.5" />
            <View className="ml-3 flex-1">
              <Text className="text-amber-900 font-semibold">Important Information</Text>
              <Text className="text-amber-800 text-sm mt-1 leading-5">
                We take all complaints seriously. Your feedback helps us improve our services and ensure the highest quality of care. All complaints are confidential and will be reviewed by our quality assurance team.
              </Text>
            </View>
          </View>
        </View>

        {/* Session Selection */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Select Session</Text>
          <Text className="text-gray-600 text-sm mb-4">Choose the session you want to file a complaint about:</Text>
          
          {sessions.length === 0 ? (
            <View className="items-center py-6">
              <Text className="text-gray-500">No past sessions found</Text>
              <Text className="text-gray-400 text-sm mt-1">You can only file complaints for sessions that have already taken place</Text>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowSessionModal(true)}
              className="border border-gray-300 rounded-xl p-4 flex-row justify-between items-center"
            >
              <Text className={selectedSessionId ? "text-gray-900" : "text-gray-500"}>
                {selectedSessionId 
                  ? (() => {
                      const session = sessions.find(s => s.id === selectedSessionId);
                      return session ? `${getSessionDisplayName(session)} - ${new Date(session.date).toLocaleDateString()} at ${session.timeSlot}` : 'Select a session...';
                    })()
                  : 'Select a session...'
                }
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Reason Selection */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Reason for Complaint</Text>
          <Text className="text-gray-600 text-sm mb-4">Please select the primary reason for your complaint:</Text>
          
          <TouchableOpacity 
            onPress={() => setShowReasonModal(true)}
            className="border border-gray-300 rounded-xl p-4 flex-row justify-between items-center"
          >
            <Text className={selectedReason ? "text-gray-900" : "text-gray-500"}>
              {selectedReason 
                ? complaintReasons.find(r => r.id === selectedReason)?.label || 'Select a reason...'
                : 'Select a reason...'
              }
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {/* Show description for selected reason */}
          {selectedReason && (
            <View className="mt-3 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm">
                {complaintReasons.find(r => r.id === selectedReason)?.description}
              </Text>
            </View>
          )}
        </View>

        {/* Additional Notes */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Additional Details</Text>
          <Text className="text-gray-600 text-sm mb-4">
            Please provide any additional details about your complaint {selectedReason === 'other' ? '(required for "Other" complaints)' : '(optional)'}:
          </Text>
          
          <View className="border border-gray-300 rounded-xl p-4">
            <TextInput
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Describe the issue in detail. Include specific incidents, dates, and any other relevant information..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="text-gray-900 min-h-[120px]"
              placeholderTextColor="#9CA3AF"
              maxLength={1000}
            />
          </View>
          
          <Text className="text-gray-500 text-xs mt-2 text-right">
            {additionalNotes.length}/1000 characters
          </Text>
        </View>

        {/* Upload Proof */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Upload Proof (Optional)</Text>
          <Text className="text-gray-600 text-sm mb-4">
            You can upload supporting evidence such as screenshots, images, or PDF documents to support your complaint.
          </Text>
          
          {!uploadedFile ? (
            <TouchableOpacity 
              onPress={() => setShowFileOptionsModal(true)}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
            >
              <Upload size={32} color="#9CA3AF" />
              <Text className="text-gray-600 text-sm mt-2">Tap to upload file</Text>
              <Text className="text-gray-400 text-xs mt-1">Images (JPG, PNG) or PDF files</Text>
            </TouchableOpacity>
          ) : (
            <View className="border border-gray-200 rounded-xl p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  {uploadedFile.mimeType.startsWith('image/') ? (
                    <Image 
                      source={{ uri: uploadedFile.uri }} 
                      className="w-12 h-12 rounded-lg mr-3"
                    />
                  ) : (
                    <View className="w-12 h-12 bg-red-100 rounded-lg items-center justify-center mr-3">
                      <FileText size={24} color="#DC2626" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium" numberOfLines={1}>
                      {uploadedFile.name}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {uploadedFile.size ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={removeUploadedFile}
                  className="p-2"
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              {isUploading && (
                <View className="flex-row items-center mt-3 p-2 bg-blue-50 rounded-lg">
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text className="text-blue-600 text-sm ml-2">Preparing file for upload...</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Privacy Notice */}
        <View className="bg-gray-100 mx-5 mt-4 p-4 rounded-2xl">
          <View className="flex-row items-start">
            <FileText size={16} color="#6B7280" className="mt-0.5" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-700 font-medium text-sm">Privacy & Confidentiality</Text>
              <Text className="text-gray-600 text-xs mt-1 leading-4">
                Your complaint will be handled confidentially. Only authorized personnel involved in the review process will have access to your complaint details. We may contact you for additional information if needed.
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View className="p-5 pb-8">
          <PrimaryButton
            title={isSubmitting ? "Submitting..." : "Submit Complaint"}
            onPress={() => {
              if (!isSubmitting) {
                handleSubmitComplaint();
              }
            }}
            icon={Send}
          />
          
          {isSubmitting && (
            <View className="flex-row items-center justify-center mt-2">
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text className="text-gray-600 ml-2">Processing your complaint...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Session Selection Modal */}
      <Modal
        visible={showSessionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowSessionModal(false)}>
              <Text className="text-primary font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Select Session</Text>
            <View className="w-12" />
          </View>
          
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedSessionId(item.id);
                  setShowSessionModal(false);
                }}
                className="px-5 py-4 border-b border-gray-100"
              >
                <Text className="font-semibold text-gray-900">
                  {getSessionDisplayName(item)}
                </Text>
                <Text className="text-gray-600 text-sm mt-1">
                  {new Date(item.date).toLocaleDateString()} at {item.timeSlot}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Reason Selection Modal */}
      <Modal
        visible={showReasonModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowReasonModal(false)}>
              <Text className="text-primary font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Select Reason</Text>
            <View className="w-12" />
          </View>
          
          <FlatList
            data={complaintReasons}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedReason(item.id);
                  setShowReasonModal(false);
                }}
                className="px-5 py-4 border-b border-gray-100"
              >
                <Text className="font-semibold text-gray-900">{item.label}</Text>
                <Text className="text-gray-600 text-sm mt-1">{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* File Upload Options Modal */}
      <Modal
        visible={showFileOptionsModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5">
            <Text className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Upload Proof
            </Text>
            
            <TouchableOpacity
              onPress={handleImagePicker}
              className="flex-row items-center py-4 px-4 border-b border-gray-100"
            >
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Upload size={20} color="#2563EB" />
              </View>
              <View>
                <Text className="text-gray-900 font-medium">Choose from Gallery</Text>
                <Text className="text-gray-500 text-sm">Select an image from your photo library</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleDocumentPicker}
              className="flex-row items-center py-4 px-4"
            >
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                <FileText size={20} color="#DC2626" />
              </View>
              <View>
                <Text className="text-gray-900 font-medium">Choose Document</Text>
                <Text className="text-gray-500 text-sm">Select a PDF or image file</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowFileOptionsModal(false)}
              className="mt-4 py-3 px-4 bg-gray-100 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
