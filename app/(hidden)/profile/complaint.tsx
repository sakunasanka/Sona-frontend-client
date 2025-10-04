import { router } from 'expo-router';
import { AlertTriangle, ArrowLeft, ChevronDown, FileText, Send } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { PrimaryButton } from '../../components/Buttons';

interface Session {
  id: string;
  date: string;
  time: string;
  counselorName?: string;
  psychiatristName?: string;
  type: 'counselor' | 'psychiatrist';
  status: 'completed' | 'cancelled' | 'upcoming';
}

interface ComplaintReason {
  id: string;
  label: string;
  description: string;
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

  // Mock sessions data - replace with actual API call
  const mockSessions: Session[] = [
    {
      id: '1',
      date: '2024-01-15',
      time: '10:00 AM',
      counselorName: 'Dr. Sarah Johnson',
      type: 'counselor',
      status: 'completed'
    },
    {
      id: '2',
      date: '2024-01-10',
      time: '2:00 PM',
      psychiatristName: 'Dr. Michael Chen',
      type: 'psychiatrist',
      status: 'completed'
    },
    {
      id: '3',
      date: '2024-01-05',
      time: '11:30 AM',
      counselorName: 'Dr. Lisa Wong',
      type: 'counselor',
      status: 'completed'
    }
  ];

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await getUserSessions();
        
        // Simulate API call delay
        setTimeout(() => {
          setSessions(mockSessions);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        Alert.alert('Error', 'Failed to load your sessions. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

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

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // await submitComplaint({
      //   sessionId: selectedSessionId,
      //   reason: selectedReason,
      //   notes: additionalNotes,
      //   sessionType: selectedSession.type
      // });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Complaint Submitted Successfully',
        `Your complaint about the ${selectedSession.type} session with ${selectedSession.counselorName || selectedSession.psychiatristName} has been submitted. Our team will review it and contact you within 48 hours.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert('Error', 'Failed to submit your complaint. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSessionDisplayName = (session: Session) => {
    const professionalName = session.counselorName || session.psychiatristName;
    const sessionType = session.type === 'counselor' ? 'Counseling' : 'Psychiatrist Consultation';
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
              <Text className="text-gray-500">No completed sessions found</Text>
              <Text className="text-gray-400 text-sm mt-1">You can only file complaints for completed sessions</Text>
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
                      return session ? `${getSessionDisplayName(session)} - ${new Date(session.date).toLocaleDateString()} at ${session.time}` : 'Select a session...';
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
                  {new Date(item.date).toLocaleDateString()} at {item.time}
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
    </SafeAreaView>
  );
}
