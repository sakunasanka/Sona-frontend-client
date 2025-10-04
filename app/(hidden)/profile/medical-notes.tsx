import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { PrimaryButton } from '../../components/Buttons';

interface MedicalNote {
  id: string;
  sessionId: string;
  clientId: string;
  clientName: string;
  date: string;
  sessionType: 'counseling' | 'psychiatrist';
  observations: string;
  recommendations: string;
  nextSteps: string;
  referToPsychiatrist: boolean;
  psychiatristReason?: string;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  status: 'completed' | 'scheduled';
  type: 'counseling' | 'psychiatrist';
}

export default function MedicalNotesScreen() {
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;
  const mode = params.mode as 'create' | 'edit' | 'view' | undefined;
  
  const [session, setSession] = useState<Session | null>(null);
  const [medicalNote, setMedicalNote] = useState<MedicalNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form fields
  const [observations, setObservations] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [referToPsychiatrist, setReferToPsychiatrist] = useState(false);
  const [psychiatristReason, setPsychiatristReason] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);

  // Mock data
  const mockSession: Session = {
    id: sessionId || '1',
    clientId: '123',
    clientName: 'John Doe',
    date: '2024-01-15',
    time: '10:00 AM',
    status: 'completed',
    type: 'counseling'
  };

  const mockMedicalNote: MedicalNote | null = mode === 'edit' || mode === 'view' ? {
    id: '1',
    sessionId: sessionId || '1',
    clientId: '123',
    clientName: 'John Doe',
    date: '2024-01-15',
    sessionType: 'counseling',
    observations: 'Client presented with symptoms of mild anxiety. Showed good engagement during the session and was receptive to coping strategies discussed.',
    recommendations: 'Continue with weekly sessions. Implement breathing exercises and mindfulness techniques. Monitor progress with anxiety levels.',
    nextSteps: 'Schedule follow-up session in one week. Client to practice breathing exercises daily and maintain mood journal.',
    referToPsychiatrist: true,
    psychiatristReason: 'Consider medication evaluation for anxiety management due to persistent symptoms over the past month.',
    isConfidential: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  } : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Replace with actual API calls
        // const sessionResponse = await getSession(sessionId);
        // const noteResponse = mode !== 'create' ? await getMedicalNote(sessionId) : null;
        
        // Simulate API delay
        setTimeout(() => {
          setSession(mockSession);
          
          if (mockMedicalNote) {
            setMedicalNote(mockMedicalNote);
            setObservations(mockMedicalNote.observations);
            setRecommendations(mockMedicalNote.recommendations);
            setNextSteps(mockMedicalNote.nextSteps);
            setReferToPsychiatrist(mockMedicalNote.referToPsychiatrist);
            setPsychiatristReason(mockMedicalNote.psychiatristReason || '');
            setIsConfidential(mockMedicalNote.isConfidential);
          }
          
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load session data. Please try again later.');
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    }
  }, [sessionId, mode]);

  const handleSave = async () => {
    // Validation
    if (!observations.trim()) {
      Alert.alert('Observations Required', 'Please provide your observations from the session.');
      return;
    }

    if (!recommendations.trim()) {
      Alert.alert('Recommendations Required', 'Please provide recommendations for the client.');
      return;
    }

    if (referToPsychiatrist && !psychiatristReason.trim()) {
      Alert.alert('Psychiatrist Referral Reason Required', 'Please provide a reason for referring to a psychiatrist.');
      return;
    }

    setIsSaving(true);

    try {
      const noteData = {
        sessionId,
        observations: observations.trim(),
        recommendations: recommendations.trim(),
        nextSteps: nextSteps.trim(),
        referToPsychiatrist,
        psychiatristReason: referToPsychiatrist ? psychiatristReason.trim() : undefined,
        isConfidential
      };

      // TODO: Replace with actual API call
      // if (mode === 'create') {
      //   await createMedicalNote(noteData);
      // } else {
      //   await updateMedicalNote(medicalNote.id, noteData);
      // }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Medical Note Saved',
        `Medical note has been ${mode === 'create' ? 'created' : 'updated'} successfully.${referToPsychiatrist ? '\n\nThe client will be notified about the psychiatrist referral.' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving medical note:', error);
      Alert.alert('Error', 'Failed to save medical note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600">Loading session data...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Session not found</Text>
        <TouchableOpacity 
          className="mt-4 px-6 py-2 bg-primary rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isViewMode = mode === 'view';
  const pageTitle = mode === 'create' ? 'Create Medical Note' : 
                   mode === 'edit' ? 'Edit Medical Note' : 'Medical Note';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-lg font-semibold">{pageTitle}</Text>
        {!isViewMode && (
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Save size={24} color={isSaving ? "#9CA3AF" : "#2563EB"} />
          </TouchableOpacity>
        )}
        {isViewMode && <View className="w-6" />}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Session Information */}
        <View className="bg-white mx-5 mt-5 p-5 rounded-2xl">
          <View className="flex-row items-center mb-3">
            <FileText size={20} color="#2563EB" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Session Information</Text>
          </View>
          
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Client:</Text>
              <Text className="text-gray-900 font-medium">{session.clientName}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Date:</Text>
              <Text className="text-gray-900 font-medium">
                {new Date(session.date).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Time:</Text>
              <Text className="text-gray-900 font-medium">{session.time}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Type:</Text>
              <Text className="text-gray-900 font-medium capitalize">{session.type}</Text>
            </View>
          </View>
        </View>

        {/* Observations */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Observations</Text>
          <Text className="text-gray-600 text-sm mb-3">
            Document your observations about the client's presentation, mood, and behavior during the session.
          </Text>
          
          <View className={`border border-gray-300 rounded-xl p-4 ${isViewMode ? 'bg-gray-50' : ''}`}>
            <TextInput
              value={observations}
              onChangeText={setObservations}
              placeholder="Describe the client's presentation, mood, engagement level, and any notable behaviors or statements..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="text-gray-900 min-h-[120px]"
              placeholderTextColor="#9CA3AF"
              editable={!isViewMode}
              maxLength={2000}
            />
          </View>
          
          {!isViewMode && (
            <Text className="text-gray-500 text-xs mt-2 text-right">
              {observations.length}/2000 characters
            </Text>
          )}
        </View>

        {/* Recommendations */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Recommendations</Text>
          <Text className="text-gray-600 text-sm mb-3">
            Provide therapeutic recommendations and interventions for the client.
          </Text>
          
          <View className={`border border-gray-300 rounded-xl p-4 ${isViewMode ? 'bg-gray-50' : ''}`}>
            <TextInput
              value={recommendations}
              onChangeText={setRecommendations}
              placeholder="List therapeutic interventions, coping strategies, exercises, or lifestyle recommendations..."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="text-gray-900 min-h-[100px]"
              placeholderTextColor="#9CA3AF"
              editable={!isViewMode}
              maxLength={1500}
            />
          </View>
          
          {!isViewMode && (
            <Text className="text-gray-500 text-xs mt-2 text-right">
              {recommendations.length}/1500 characters
            </Text>
          )}
        </View>

        {/* Next Steps */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Next Steps</Text>
          <Text className="text-gray-600 text-sm mb-3">
            Outline the plan for future sessions and client actions.
          </Text>
          
          <View className={`border border-gray-300 rounded-xl p-4 ${isViewMode ? 'bg-gray-50' : ''}`}>
            <TextInput
              value={nextSteps}
              onChangeText={setNextSteps}
              placeholder="Describe follow-up plans, homework assignments, goals for next session..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-gray-900 min-h-[80px]"
              placeholderTextColor="#9CA3AF"
              editable={!isViewMode}
              maxLength={1000}
            />
          </View>
          
          {!isViewMode && (
            <Text className="text-gray-500 text-xs mt-2 text-right">
              {nextSteps.length}/1000 characters
            </Text>
          )}
        </View>

        {/* Psychiatrist Referral */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Psychiatrist Referral</Text>
          
          <TouchableOpacity
            onPress={() => !isViewMode && setReferToPsychiatrist(!referToPsychiatrist)}
            className="flex-row items-center mb-4"
            disabled={isViewMode}
          >
            <View className={`w-5 h-5 rounded border-2 mr-3 ${referToPsychiatrist ? 'bg-primary border-primary' : 'border-gray-300'} ${isViewMode ? 'opacity-60' : ''}`}>
              {referToPsychiatrist && (
                <Text className="text-white text-xs text-center leading-4">✓</Text>
              )}
            </View>
            <Text className="text-gray-900 font-medium">Recommend psychiatrist consultation</Text>
          </TouchableOpacity>
          
          {referToPsychiatrist && (
            <View>
              <Text className="text-gray-600 text-sm mb-3">
                Please provide the reason for this referral:
              </Text>
              <View className={`border border-gray-300 rounded-xl p-4 ${isViewMode ? 'bg-gray-50' : ''}`}>
                <TextInput
                  value={psychiatristReason}
                  onChangeText={setPsychiatristReason}
                  placeholder="Explain why you recommend a psychiatrist consultation..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="text-gray-900 min-h-[60px]"
                  placeholderTextColor="#9CA3AF"
                  editable={!isViewMode}
                  maxLength={500}
                />
              </View>
              
              {!isViewMode && (
                <Text className="text-gray-500 text-xs mt-2 text-right">
                  {psychiatristReason.length}/500 characters
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Privacy Settings */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Privacy Settings</Text>
          
          <TouchableOpacity
            onPress={() => !isViewMode && setIsConfidential(!isConfidential)}
            className="flex-row items-center"
            disabled={isViewMode}
          >
            <View className={`w-5 h-5 rounded border-2 mr-3 ${isConfidential ? 'bg-red-500 border-red-500' : 'border-gray-300'} ${isViewMode ? 'opacity-60' : ''}`}>
              {isConfidential && (
                <Text className="text-white text-xs text-center leading-4">✓</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Mark as confidential</Text>
              <Text className="text-gray-600 text-sm mt-1">
                Confidential notes are only visible to you and will not be shared with psychiatrists
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Save Button for Create/Edit modes */}
        {!isViewMode && (
          <View className="p-5 pb-8">
            <PrimaryButton
              title={isSaving ? "Saving..." : mode === 'create' ? "Create Medical Note" : "Update Medical Note"}
              onPress={() => {
                if (!isSaving) {
                  handleSave();
                }
              }}
              icon={Save}
            />
            
            {isSaving && (
              <View className="flex-row items-center justify-center mt-2">
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text className="text-gray-600 ml-2">Saving medical note...</Text>
              </View>
            )}
          </View>
        )}

        {/* Additional spacing for scroll */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
