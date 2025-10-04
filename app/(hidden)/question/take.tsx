import { calculatePHQ9Score, hasItem9Positive, interpretPHQ9Score, submitPHQ9 } from '@/api/questionnaire';
import TopBar from '@/components/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

const PHQ9_ITEMS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead or of hurting yourself in some way',
] as const;

const OPTIONS = [
  { label: 'Not at all', value: 0 as 0 },
  { label: 'Several days', value: 1 as 1 },
  { label: 'More than half the days', value: 2 as 2 },
  { label: 'Nearly every day', value: 3 as 3 },
] as const;

const IMPACT_OPTIONS = [
  'Not difficult at all',
  'Somewhat difficult',
  'Very difficult',
  'Extremely difficult',
] as const;

// Enhanced option button component for consistency
interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  severity: number; // 0-3 for color coding
}

const OptionButton: React.FC<OptionButtonProps> = ({ label, selected, onPress, severity }) => {
  const colors = [
    { bg: 'bg-emerald-50', border: 'border-emerald-200', selectedBg: 'bg-emerald-500', selectedBorder: 'border-emerald-500' },
    { bg: 'bg-amber-50', border: 'border-amber-200', selectedBg: 'bg-amber-500', selectedBorder: 'border-amber-500' },
    { bg: 'bg-orange-50', border: 'border-orange-200', selectedBg: 'bg-orange-500', selectedBorder: 'border-orange-500' },
    { bg: 'bg-red-50', border: 'border-red-200', selectedBg: 'bg-red-500', selectedBorder: 'border-red-500' },
  ];
  
  const colorScheme = colors[severity];
  
  return (
    <TouchableOpacity
      className={`mb-4 rounded-2xl border-2 px-5 py-4 flex-row items-center justify-between shadow-sm ${
        selected 
          ? `${colorScheme.selectedBg} ${colorScheme.selectedBorder}` 
          : `${colorScheme.bg} ${colorScheme.border} bg-white`
      }`}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text className={`text-base font-alegreya flex-1 ${
        selected ? 'text-white font-bold' : 'text-gray-800 font-medium'
      }`}>
        {label}
      </Text>
      <View className={`w-6 h-6 rounded-full border-2 ${
        selected 
          ? 'border-white bg-white' 
          : 'border-gray-400 bg-transparent'
      }`}>
        {selected && (
          <View className="w-2 h-2 bg-gray-600 rounded-full self-center mt-1" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function TakePHQ9() {
  const router = useRouter();
  const totalSteps = PHQ9_ITEMS.length + 1; // include impact item
  const [step, setStep] = useState(0); // 0..9 (last is impact)
  const [answers, setAnswers] = useState<Array<0 | 1 | 2 | 3 | null>>(Array(PHQ9_ITEMS.length).fill(null));
  const [impact, setImpact] = useState<typeof IMPACT_OPTIONS[number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isImpactStep = step === PHQ9_ITEMS.length;

  const progressPct = useMemo(() => ((step + 1) / totalSteps) * 100, [step, totalSteps]);

  const canProceed = isImpactStep ? impact !== null : answers[step] !== null;

  const setAnswer = (value: 0 | 1 | 2 | 3) => {
    const copy = [...answers];
    copy[step] = value;
    setAnswers(copy);
    
    // Debug: Log when answer is set
    console.log(`Answer set for step ${step}:`, value);
    console.log('Updated answers array:', copy);
  };

  const submitQuestionnaire = async () => {
    try {
      setIsSubmitting(true);
      
      // Get user token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in to save your results');
        return;
      }

      const numericAnswers = answers.map((v) => (v ?? 0));
      const score = calculatePHQ9Score(numericAnswers);
      const severity = interpretPHQ9Score(score);
      const hadItem9Positive = hasItem9Positive(numericAnswers);

      // Debug: Log the calculated values
      console.log('Submitting questionnaire:', { 
        answers, 
        numericAnswers, 
        score, 
        severity, 
        hadItem9Positive, 
        impact 
      });

      // Prepare responses array to match backend format
      const responses = answers.map((answer, index) => ({
        questionIndex: index,
        answer: answer ?? 0
      }));

      const submissionData = {
        responses,
        impact: impact || ''
      };

      // Submit to backend
      const result = await submitPHQ9(submissionData, token);
      
      // Debug: Log navigation params
      const navigationParams = {
        score: String(score),
        hadItem9Positive: hadItem9Positive ? '1' : '0',
        impact: impact ?? '',
        severity,
        saved: 'true' // Flag to indicate this was successfully saved
      };
      console.log('Navigating with params:', navigationParams);
      
      // Navigate to result page with local data (avoid fetching after submission)
      router.push({
        pathname: '/(hidden)/question/result' as any,
        params: navigationParams,
      });
    } catch (error) {
      console.error('Error submitting PHQ-9:', error);
      Alert.alert(
        'Submission Error', 
        'There was an error saving your results. Your answers will still be shown, but may not be saved to your history.',
        [
          {
            text: 'Continue to Results',
            onPress: () => {
              // Navigate to results anyway with local data
              const numericAnswers = answers.map((v) => (v ?? 0));
              const score = calculatePHQ9Score(numericAnswers);
              const hadItem9Positive = hasItem9Positive(numericAnswers);
              
              // Debug: Log error case navigation
              const errorNavigationParams = {
                score: String(score),
                hadItem9Positive: hadItem9Positive ? '1' : '0',
                impact: impact ?? '',
                severity: interpretPHQ9Score(score),
                offline: 'true' // Flag to indicate this wasn't saved
              };
              console.log('Error case - navigating with params:', errorNavigationParams);
              
              router.push({
                pathname: '/(hidden)/question/result' as any,
                params: errorNavigationParams,
              });
            }
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (!canProceed) return;
    if (isImpactStep) {
      submitQuestionnaire();
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const renderOptions = () => (
    <View className="mt-6">
      {OPTIONS.map((opt, index) => (
        <OptionButton
          key={opt.value}
          label={opt.label}
          selected={answers[step] === opt.value}
          onPress={() => setAnswer(opt.value)}
          severity={index}
        />
      ))}
    </View>
  );

  const renderImpact = () => (
    <View className="mt-6">
      <View className="bg-primary/10 rounded-2xl p-5 mb-6 border border-primary/20">
        <Text className="text-base text-primary font-alegreya font-bold leading-6">
          If you checked off any problems, how difficult have these problems made it for you at work, home, or with other people?
        </Text>
        <Text className="text-sm text-primary/70 mt-2 font-alegreya">This question helps us understand the impact on your daily life</Text>
      </View>
      {IMPACT_OPTIONS.map((label, index) => (
        <OptionButton
          key={label}
          label={label}
          selected={impact === label}
          onPress={() => setImpact(label)}
          severity={index}
        />
      ))}
      <View className="bg-blue-50 rounded-xl p-3 mt-4 border border-blue-200">
        <Text className="text-sm text-blue-700 text-center font-alegreya font-medium">💡 This question does not affect your total score</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <TopBar title="Well-being Check" />

      <View className="flex-1 px-5 pt-6">
        {/* Progress section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-600 font-alegreya font-medium">Question {step + 1} of {totalSteps}</Text>
            <Text className="text-sm text-primary font-alegreya font-bold">{Math.round(progressPct)}% complete</Text>
          </View>
          <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <View 
              style={{ width: `${progressPct}%` }} 
              className="h-full bg-primary rounded-full transition-all duration-300" 
            />
          </View>
        </View>

        {/* Question card */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6 shadow-sm">
          <Text className="text-xl font-alegreya font-bold text-gray-900 leading-7">
            {isImpactStep ? '💭 Overall Life Impact' : `${step + 1}. ${PHQ9_ITEMS[step]}`}
          </Text>
          {!isImpactStep && (
            <Text className="text-sm text-gray-600 mt-3 font-alegreya font-medium">Over the last 2 weeks, how often have you been bothered by this?</Text>
          )}
        </View>

        {isImpactStep ? renderImpact() : renderOptions()}

        {/* Navigation buttons */}
        <View className="mt-auto pt-6 pb-6">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={goBack}
              className="flex-1 py-4 rounded-2xl border-2 border-gray-200 bg-white shadow-sm"
              activeOpacity={0.7}
            >
              <Text className="text-center text-gray-700 font-alegreya font-bold text-lg">← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goNext}
              disabled={!canProceed || isSubmitting}
              className={`flex-1 py-4 rounded-2xl shadow-lg ${
                canProceed && !isSubmitting 
                  ? 'bg-primary border-2 border-primary' 
                  : 'bg-gray-200 border-2 border-gray-200'
              }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-alegreya font-bold text-lg ${
                canProceed && !isSubmitting ? 'text-white' : 'text-gray-500'
              }`}>
                {isSubmitting ? 'Saving...' : isImpactStep ? 'Save & See Results →' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-gray-50 rounded-xl p-4 mt-6 border border-gray-100">
            <Text className="text-xs text-gray-600 text-center font-alegreya leading-5 font-medium">
              🔒 Your responses are private and confidential{'\n'}
              If you're in crisis, seek immediate help from a mental health professional
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
