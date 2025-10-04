import { router } from 'expo-router';
import { ArrowLeft, BookOpen, Calendar, Eye, EyeOff, Settings, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';

const { width: screenWidth } = Dimensions.get('window');

interface MoodEntry {
  id: string;
  date: string;
  mood: number; // 1-5 scale
  moodLabel: string;
  note?: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: number;
}

interface ClientProgress {
  moodEntries: MoodEntry[];
  diaryEntries: DiaryEntry[];
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  totalEntries: number;
  streakDays: number;
}

const MoodChart = ({ data }: { data: MoodEntry[] }) => {
  // Prepare data for the chart (last 7 days)
  const last7Days = data.slice(-7);
  
  if (last7Days.length === 0) {
    return (
      <View className="bg-white mx-5 mt-4 p-5 rounded-2xl items-center">
        <Text className="text-gray-500">No mood data available</Text>
        <Text className="text-gray-400 text-sm mt-1">Start tracking your mood to see trends</Text>
      </View>
    );
  }

  const maxMood = 5;
  const chartHeight = 120;

  return (
    <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
      <Text className="text-lg font-semibold text-gray-900 mb-3">Mood Trend (Last 7 Days)</Text>
      
      {/* Simple bar chart */}
      <View className="flex-row items-end justify-between h-32 mb-3">
        {last7Days.map((entry, index) => {
          const barHeight = (entry.mood / maxMood) * chartHeight;
          const date = new Date(entry.date);
          const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <View key={entry.id} className="items-center flex-1">
              <View 
                className="bg-primary rounded-t-md w-6 mb-2"
                style={{ height: barHeight }}
              />
              <Text className="text-xs text-gray-500">{dayLabel}</Text>
              <Text className="text-xs font-semibold text-gray-700">{entry.mood}</Text>
            </View>
          );
        })}
      </View>
      
      <View className="flex-row justify-between mt-3">
        <Text className="text-xs text-gray-500">1 = Very Low</Text>
        <Text className="text-xs text-gray-500">3 = Neutral</Text>
        <Text className="text-xs text-gray-500">5 = Very High</Text>
      </View>
    </View>
  );
};

const DiaryTimeline = ({ entries, onViewEntry }: { entries: DiaryEntry[], onViewEntry: (entry: DiaryEntry) => void }) => {
  const recentEntries = entries.slice(-5); // Show last 5 entries

  return (
    <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-gray-900">Recent Diary Entries</Text>
        <TouchableOpacity onPress={() => console.log('Navigate to diary calendar')}>
          <Text className="text-primary font-medium">View All</Text>
        </TouchableOpacity>
      </View>
      
      {recentEntries.length === 0 ? (
        <View className="items-center py-4">
          <Text className="text-gray-500">No diary entries yet</Text>
          <Text className="text-gray-400 text-sm mt-1">Start writing to track your thoughts</Text>
        </View>
      ) : (
        <View>
          {recentEntries.map((entry, index) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => onViewEntry(entry)}
              className={`flex-row items-start ${index !== recentEntries.length - 1 ? 'mb-4 pb-4 border-b border-gray-100' : ''}`}
            >
              <View className="w-3 h-3 bg-primary rounded-full mt-2 mr-3" />
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{entry.title}</Text>
                <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                  {entry.content}
                </Text>
                <Text className="text-gray-400 text-xs mt-2">
                  {new Date(entry.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function ClientAnalysisScreen() {
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [psychiatristAccessGranted, setPsychiatristAccessGranted] = useState(false);

  // Mock data for demonstration
  const mockProgress: ClientProgress = {
    moodEntries: [
      { id: '1', date: '2024-01-01', mood: 3, moodLabel: 'Neutral' },
      { id: '2', date: '2024-01-02', mood: 4, moodLabel: 'Good', note: 'Had a productive day' },
      { id: '3', date: '2024-01-03', mood: 2, moodLabel: 'Low', note: 'Feeling anxious' },
      { id: '4', date: '2024-01-04', mood: 3, moodLabel: 'Neutral' },
      { id: '5', date: '2024-01-05', mood: 4, moodLabel: 'Good' },
      { id: '6', date: '2024-01-06', mood: 5, moodLabel: 'Very Good', note: 'Great session with counselor' },
      { id: '7', date: '2024-01-07', mood: 4, moodLabel: 'Good' }
    ],
    diaryEntries: [
      {
        id: '1',
        date: '2024-01-07',
        title: 'Therapy Session Reflection',
        content: 'Today\'s session with my counselor was really helpful. We talked about managing anxiety and I learned some new coping strategies...',
        mood: 4
      },
      {
        id: '2',
        date: '2024-01-06',
        title: 'Weekend Plans',
        content: 'Feeling excited about the weekend. Planning to spend time with friends and try that new meditation technique my counselor suggested...',
        mood: 5
      },
      {
        id: '3',
        date: '2024-01-05',
        title: 'Work Stress',
        content: 'Work has been overwhelming lately. Need to practice the stress management techniques I learned. Maybe I should schedule another session soon...',
        mood: 3
      }
    ],
    averageMood: 3.6,
    moodTrend: 'improving',
    totalEntries: 7,
    streakDays: 7
  };

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setProgress(mockProgress);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleViewDiaryEntry = (entry: DiaryEntry) => {
    Alert.alert(
      entry.title,
      entry.content,
      [
        {
          text: 'Edit',
          onPress: () => console.log('Edit diary entry', entry.id)
        },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const handleTogglePsychiatristAccess = () => {
    Alert.alert(
      psychiatristAccessGranted ? 'Revoke Access' : 'Grant Access',
      psychiatristAccessGranted 
        ? 'Are you sure you want to revoke psychiatrist access to your diary entries? This will prevent psychiatrists from viewing your personal notes during consultations.'
        : 'Allow psychiatrists to view your diary entries during consultations? This can help them provide better treatment by understanding your thoughts and feelings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: psychiatristAccessGranted ? 'Revoke' : 'Grant Access',
          style: psychiatristAccessGranted ? 'destructive' : 'default',
          onPress: () => {
            setPsychiatristAccessGranted(!psychiatristAccessGranted);
            Alert.alert(
              'Success',
              psychiatristAccessGranted 
                ? 'Psychiatrist access to your diary has been revoked.'
                : 'Psychiatrists can now view your diary entries during consultations.'
            );
          }
        }
      ]
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={20} color="#16a34a" />;
      case 'declining':
        return <TrendingUp size={20} color="#dc2626" style={{ transform: [{ rotate: '180deg' }] }} />;
      default:
        return <TrendingUp size={20} color="#6b7280" style={{ transform: [{ rotate: '90deg' }] }} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600">Loading your progress...</Text>
      </SafeAreaView>
    );
  }

  if (!progress) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Unable to load progress data</Text>
        <TouchableOpacity 
          className="mt-4 px-6 py-2 bg-primary rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
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
        <Text className="text-gray-900 text-lg font-semibold">My Progress</Text>
        <TouchableOpacity onPress={() => console.log('Open settings')}>
          <Settings size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View className="flex-row mx-5 mt-5 gap-3">
          <View className="flex-1 bg-white p-4 rounded-2xl">
            <Text className="text-gray-600 text-sm">Average Mood</Text>
            <Text className="text-2xl font-bold text-primary">{progress.averageMood.toFixed(1)}</Text>
            <Text className="text-gray-500 text-xs">out of 5.0</Text>
          </View>
          
          <View className="flex-1 bg-white p-4 rounded-2xl">
            <Text className="text-gray-600 text-sm">Tracking Streak</Text>
            <Text className="text-2xl font-bold text-green-600">{progress.streakDays}</Text>
            <Text className="text-gray-500 text-xs">days</Text>
          </View>
          
          <View className="flex-1 bg-white p-4 rounded-2xl">
            <View className="flex-row items-center">
              {getTrendIcon(progress.moodTrend)}
              <View className="ml-2">
                <Text className="text-gray-600 text-sm">Trend</Text>
                <Text className={`text-sm font-semibold capitalize ${getTrendColor(progress.moodTrend)}`}>
                  {progress.moodTrend}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mood Chart */}
        <MoodChart data={progress.moodEntries} />

        {/* Diary Timeline */}
        <DiaryTimeline entries={progress.diaryEntries} onViewEntry={handleViewDiaryEntry} />

        {/* Privacy Settings */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Privacy Settings</Text>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="font-medium text-gray-900">Psychiatrist Access</Text>
              <Text className="text-gray-600 text-sm mt-1">
                Allow psychiatrists to view your diary entries during consultations
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleTogglePsychiatristAccess}
              className="flex-row items-center"
            >
              {psychiatristAccessGranted ? (
                <Eye size={24} color="#16a34a" />
              ) : (
                <EyeOff size={24} color="#dc2626" />
              )}
            </TouchableOpacity>
          </View>
          
          <Text className={`text-sm mt-2 ${psychiatristAccessGranted ? 'text-green-600' : 'text-red-600'}`}>
            {psychiatristAccessGranted ? 'Access granted' : 'Access denied'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="mx-5 mt-4 space-y-3">
          <PrimaryButton
            title="Log Today's Mood"
            onPress={() => console.log('Log mood')}
            icon={TrendingUp}
          />
          
          <View className="flex-row gap-3">
            <View className="flex-1">
              <SecondaryButton
                title="Write in Diary"
                onPress={() => console.log('Write diary')}
                icon={BookOpen}
              />
            </View>
            <View className="flex-1">
              <SecondaryButton
                title="View Calendar"
                onPress={() => console.log('View calendar')}
                icon={Calendar}
              />
            </View>
          </View>
        </View>

        {/* Additional spacing for scroll */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
