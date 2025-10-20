import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { submitPHQ9 } from '../api/questionnaire';

interface QuestionnairePopupProps {
  visible: boolean;
  onClose: () => void;
  onQuestionnaireSubmitted: () => void;
}

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself"
];

const ANSWER_OPTIONS = [
  { value: 0, text: "Not at all" },
  { value: 1, text: "Several days" },
  { value: 2, text: "More than half the days" },
  { value: 3, text: "Nearly every day" }
];

const IMPACT_OPTIONS = [
  "Not difficult at all",
  "Somewhat difficult",
  "Very difficult",
  "Extremely difficult"
];

export default function QuestionnairePopup({ visible, onClose, onQuestionnaireSubmitted }: QuestionnairePopupProps) {
  const [responses, setResponses] = useState<number[]>(new Array(9).fill(-1));
  const [impact, setImpact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswerSelect = (questionIndex: number, answer: number) => {
    const newResponses = [...responses];
    newResponses[questionIndex] = answer;
    setResponses(newResponses);

    // Auto-advance to next question or impact question
    if (questionIndex < 8) {
      setCurrentQuestion(questionIndex + 1);
    }
  };

  const handleImpactSelect = (impactText: string) => {
    setImpact(impactText);
  };

  const calculateScore = () => {
    return responses.reduce((sum, score) => sum + (score > -1 ? score : 0), 0);
  };

  const getSeverity = (score: number) => {
    if (score <= 4) return 'Minimal or none';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Moderately severe';
    return 'Severe';
  };

  const handleSubmit = async () => {
    if (responses.includes(-1) || !impact) {
      alert('Please answer all questions and select an impact level.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const submissionData = {
        responses: responses.map((answer, index) => ({
          questionIndex: index,
          answer
        })),
        impact
      };

      await submitPHQ9(submissionData, token);

      onQuestionnaireSubmitted();
      onClose();

      // Reset form
      setResponses(new Array(9).fill(-1));
      setImpact('');
      setCurrentQuestion(0);
    } catch (error) {
      console.log('Failed to submit questionnaire:', error);
      alert('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
    // Reset form
    setResponses(new Array(9).fill(-1));
    setImpact('');
    setCurrentQuestion(0);
  };

  const allQuestionsAnswered = !responses.includes(-1);
  const score = calculateScore();
  const severity = getSeverity(score);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="w-full max-w-sm bg-white rounded-3xl max-h-[85%]">
          <View className="p-6">
            {/* Header */}
            <View className="items-center mb-4">
              <Text className="text-xl font-bold text-gray-800 mb-1">
                Weekly Mental Health Check
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                PHQ-9 Questionnaire
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Question {currentQuestion + 1} of {allQuestionsAnswered ? 10 : 9}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
              {/* Questions */}
              {!allQuestionsAnswered ? (
                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-800 mb-3">
                    {PHQ9_QUESTIONS[currentQuestion]}
                  </Text>
                  <View className="space-y-2">
                    {ANSWER_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className={`p-3 rounded-lg border ${
                          responses[currentQuestion] === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                        onPress={() => handleAnswerSelect(currentQuestion, option.value)}
                      >
                        <Text className={`text-sm ${
                          responses[currentQuestion] === option.value
                            ? 'text-blue-700 font-medium'
                            : 'text-gray-700'
                        }`}>
                          {option.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                /* Impact Question */
                <View className="mb-4">
                  <Text className="text-base font-medium text-gray-800 mb-3">
                    If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?
                  </Text>
                  <View className="space-y-2">
                    {IMPACT_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        className={`p-3 rounded-lg border ${
                          impact === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                        onPress={() => handleImpactSelect(option)}
                      >
                        <Text className={`text-sm ${
                          impact === option
                            ? 'text-blue-700 font-medium'
                            : 'text-gray-700'
                        }`}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Progress Indicator */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs text-gray-600">Progress</Text>
                  <Text className="text-xs text-gray-600">
                    {allQuestionsAnswered && impact ? 100 : Math.round(((currentQuestion + (impact ? 1 : 0)) / 10) * 100)}%
                  </Text>
                </View>
                <View className="w-full bg-gray-200 rounded-full h-2">
                  <View
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${allQuestionsAnswered && impact ? 100 : Math.round(((currentQuestion + (impact ? 1 : 0)) / 10) * 100)}%`
                    }}
                  />
                </View>
              </View>

              {/* Results Preview */}
              {allQuestionsAnswered && impact && (
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Text className="text-sm font-medium text-gray-800 mb-2">Assessment Summary</Text>
                  <View className="space-y-1">
                    <Text className="text-sm text-gray-600">Total Score: <Text className="font-medium">{score}/27</Text></Text>
                    <Text className="text-sm text-gray-600">Severity: <Text className="font-medium">{severity}</Text></Text>
                    <Text className="text-sm text-gray-600">Impact: <Text className="font-medium">{impact}</Text></Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Navigation */}
            {!allQuestionsAnswered && (
              <View className="flex-row gap-2 mb-4">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 rounded-xl py-2"
                  onPress={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  <Text className="text-gray-600 text-center text-sm font-medium">
                    Previous
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-blue-500 rounded-xl py-2"
                  onPress={() => setCurrentQuestion(Math.min(8, currentQuestion + 1))}
                  disabled={responses[currentQuestion] === -1}
                >
                  <Text className="text-white text-center text-sm font-medium">
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl py-3"
                onPress={handleSkip}
                disabled={isLoading}
              >
                <Text className="text-gray-700 text-center font-medium">
                  Skip for now
                </Text>
              </TouchableOpacity>

              {allQuestionsAnswered && impact && (
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-3 ${isLoading ? 'bg-gray-300' : 'bg-blue-500'}`}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  <Text className="text-white text-center font-medium">
                    {isLoading ? 'Submitting...' : 'Submit Assessment'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}