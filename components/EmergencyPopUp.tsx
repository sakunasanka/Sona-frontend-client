import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { sendEmergencyAlert } from '../api/sessions';

// Define the data structure for the emergency contact form
export interface EmergencyContactData {
  contactNumber: string;
  description: string;
}

interface EmergencyPopupProps {
  visible: boolean;
  onClose: () => void;
  // Updated prop to receive form data
  onEmergencyContact: (data: EmergencyContactData) => void;
  onImFine: () => void;
  token: string;
}

const EmergencyPopup: React.FC<EmergencyPopupProps> = ({
  visible,
  onClose,
  onEmergencyContact,
  onImFine,
  token
}) => {
  const { width, height } = Dimensions.get('window');
  
  // State to manage delayed visibility
  const [internalVisible, setInternalVisible] = useState(false);
  
  // State to manage which view to show: 'initial' or 'form'
  const [view, setView] = useState<'initial' | 'form'>('initial');
  
  // State for the form inputs
  const [contactNumber, setContactNumber] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Effect to handle delayed visibility
  useEffect(() => {
    if (visible) {
      // Show with delay when visible becomes true
      const timer = setTimeout(() => {
        setInternalVisible(true);
      }, 300); // 300ms delay - adjust as needed

      return () => clearTimeout(timer);
    } else {
      // Hide immediately when visible becomes false
      setInternalVisible(false);
      // Add a small delay to prevent seeing the reset before fade-out
      setTimeout(() => {
        setView('initial');
        setContactNumber('');
        setDescription('');
        setError('');
        setIsSubmitting(false);
      }, 500);
    }
  }, [visible]);

  // Handle the final submission
  const handleSubmit = async () => {
    // Clear any previous errors
    setError('');
    
    // Validate inputs
    if (!contactNumber.trim()) {
      setError('Contact number is required');
      return;
    }

    // Validate contact number length (must be exactly 10 digits)
    const cleanedNumber = contactNumber.trim().replace(/\D/g, ''); // Remove non-digits
    if (cleanedNumber.length !== 10) {
      setError('Contact number must be exactly 10 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send emergency alert to API
      const response = await sendEmergencyAlert(token, {
        contactNumber: contactNumber.trim(),
        description: description.trim()
      });

      console.log('Emergency alert sent successfully:', response);

      // Call the parent component's callback with form data
      onEmergencyContact({
        contactNumber: contactNumber.trim(),
        description: description.trim()
      });

      // Close the modal after successful submission
      onClose();

    } catch (error) {
      console.error('Error sending emergency alert:', error);
      setError('Failed to send emergency alert. Please try again.');
      
      // Still call the parent callback so the user isn't stuck
      onEmergencyContact({
        contactNumber: contactNumber.trim(),
        description: description.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the initial "Are you okay?" view
  const renderInitialView = () => (
    <View className="px-6 py-6">
      <Text className="text-gray-800 text-lg text-center mb-6 leading-6">
        Are you okay? If you need help, emergency services will be contacted immediately.
      </Text>
      <View className="space-y-3">
        {/* This button now switches to the form view */}
        <TouchableOpacity
          onPress={() => setView('form')}
          className="bg-red-500 rounded-xl py-4 px-6"
        >
          <Text className="text-white text-lg font-semibold text-center">
            🚑 Contact Emergency Services
          </Text>
        </TouchableOpacity>
        <View className="h-4" />
        <TouchableOpacity
          onPress={onImFine}
          className="bg-green-500 rounded-xl py-4 px-6"
        >
          <Text className="text-white text-lg font-semibold text-center">
            ✅ No, I&apos;m Fine
          </Text>
        </TouchableOpacity>
      </View>
      <Text className="text-gray-500 text-sm text-center mt-4">
        Tap outside to dismiss
      </Text>
    </View>
  );

  // Render the new form view
  const renderFormView = () => (
    <View className="px-6 py-6">
      <Text className="text-gray-800 text-lg text-center mb-4 font-semibold">
        Emergency Details
      </Text>
      <Text className="text-gray-600 text-sm text-center mb-4">
        Please provide details for the support team.
      </Text>

      {/* Form Inputs */}
      <TextInput
        placeholder="Your Contact Number (10 digits)"
        value={contactNumber}
        onChangeText={(text) => {
          // Only allow digits and limit to 10 characters
          const cleaned = text.replace(/\D/g, '');
          if (cleaned.length <= 10) {
            setContactNumber(cleaned);
          }
        }}
        keyboardType="phone-pad"
        maxLength={10}
        className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-base mb-3"
        placeholderTextColor="#6B7280"
      />
      <TextInput
        placeholder="Briefly describe your situation..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-base mb-4 h-20"
        textAlignVertical="top"
        placeholderTextColor="#6B7280"
      />

      {/* Error Message */}
      {error ? (
        <View className="mb-3">
          <Text className="text-red-600 text-sm text-center font-medium">
            {error}
          </Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View className="space-y-3">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`rounded-xl py-4 px-6 ${isSubmitting ? 'bg-red-400' : 'bg-red-600'}`}
        >
          <Text className="text-white text-lg font-semibold text-center">
            {isSubmitting ? 'Sending...' : 'Confirm & Contact Support'}
          </Text>
        </TouchableOpacity>
        <View className="h-2" />
        <TouchableOpacity
          onPress={() => setView('initial')}
          className="bg-gray-500 rounded-xl py-3 px-6"
        >
          <Text className="text-white text-lg font-semibold text-center">
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={internalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center items-center"
        >
          {/* Backdrop blur effect */}
          <BlurView
            intensity={20}
            style={{
              position: 'absolute',
              width: width,
              height: height,
            }}
          />
          
          {/* Popup Content */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View className="bg-white mx-6 rounded-3xl shadow-2xl overflow-hidden w-[90%]">
              {/* Header with emergency icon (stays the same) */}
              <View className="bg-red-500 px-6 py-4 items-center">
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-2">
                  <Text className="text-3xl">🚨</Text>
                </View>
                <Text className="text-white text-xl font-bold text-center">
                  Emergency Situation Detected
                </Text>
              </View>

              {/* Conditionally rendered content */}
              {view === 'initial' ? renderInitialView() : renderFormView()}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default EmergencyPopup;