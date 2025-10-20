import { getProfile } from '@/api/auth';
import { DailyMood, getMoodAnalytics, MoodAnalysisResponse } from '@/api/mood';
import { router } from 'expo-router';
import { Activity, ArrowLeft, BarChart3, Calendar, Heart, RefreshCw, TrendingDown, TrendingUp, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  date: string;
  value: number;
  mood: string;
}

const MoodChart: React.FC<{
  data: ChartData[];
  title: string;
  color: string;
  minValue: number;
  maxValue: number;
  icon: React.ComponentType<any>;
}> = ({ data, title, color, minValue, maxValue, icon: Icon }) => {
  if (data.length === 0) {
    return (
      <View className="bg-white mx-5 mt-4 p-6 rounded-2xl">
        <View className="flex-row items-center mb-4">
          <Icon size={20} color="#2563EB" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">{title}</Text>
        </View>
        <View className="justify-center items-center h-48">
          <Text className="text-gray-500 text-sm italic">No data available</Text>
        </View>
      </View>
    );
  }

  // Prepare data for react-native-chart-kit
  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.map(item => item.value),
        color: () => color,
        strokeWidth: 3,
      }
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '3',
      stroke: color,
      fill: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', 
      stroke: '#F3F4F6',
      strokeWidth: 1,
    },
    yAxisInterval: 1,
    fromZero: false,
    yAxisSuffix: '',
    yAxisPrefix: '',
    formatYLabel: (value: string) => parseFloat(value).toFixed(1),
  };

  return (
    <View className="bg-white mx-5 mt-4 p-6 rounded-2xl shadow-sm">
      <View className="flex-row items-center mb-4">
        <Icon size={20} color="#2563EB" />
        <Text className="text-lg font-semibold text-gray-900 ml-2">{title}</Text>
      </View>
      <View className="relative">
        <LineChart
          data={chartData}
          width={screenWidth - 80}
          height={200}
          chartConfig={chartConfig}
          bezier={true}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          fromZero={minValue < 0}
          segments={4}
        />
        
        {/* Mood labels below chart */}
        <View className="flex-row justify-between mt-2 px-4">
          {data.map((point, index) => (
            <View key={index} className="flex-1 items-center">
              <Text className="text-xs text-gray-500 text-center font-medium">{point.mood}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const ViewMoodAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<MoodAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getProfile();
      if (profile?.id) {
        setUserId(profile.id);
      } else {
        setError('Unable to load user profile');
      }
    } catch (err) {
      console.log('Error loading profile:', err);
      setError('Failed to load user profile');
      setLoading(false);
    }
  };

  const loadMoodAnalytics = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getMoodAnalytics(userId);
      console.log('Mood analytics data:', data);
      console.log('Average valence:', data.averageValence);
      console.log('Average arousal:', data.averageArousal);
      setAnalytics(data);
    } catch (err) {
      console.log('Error loading mood analytics:', err);
      setError('Failed to load mood analytics');
      Alert.alert('Error', 'Failed to load mood analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadMoodAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const getRecentSevenDays = (moods: DailyMood[]): ChartData[] => {
    // Get last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Filter and sort moods for last 7 days
    const recentMoods = moods
        .filter(mood => {
          const dateString = mood.date || mood.local_date;
          if (!dateString) return false; // Skip items without dates
            
          const moodDate = new Date(dateString);
          return moodDate >= sevenDaysAgo;
        })
        .sort((a, b) => {
            const dateA = new Date((a.date || a.local_date)!);
            const dateB = new Date((b.date || b.local_date)!);
            return dateA.getTime() - dateB.getTime();
        });

    return recentMoods.map(mood => ({
          date: mood.date || mood.local_date || new Date().toISOString(), // Fallback to current date
          value: 0,
          mood: mood.mood || 'Unknown'
    }));
  };

  const prepareChartData = (type: 'arousal' | 'valence' | 'intensity'): ChartData[] => {
    if (!analytics?.moodTrends) return [];
    
    const baseData = getRecentSevenDays(analytics.moodTrends);
    return baseData.map(item => {
      const moodEntry = analytics.moodTrends.find(
        mood => (mood.date || mood.local_date) === item.date
      );
      
      return {
        ...item,
        value: moodEntry?.[type] || 0
      };
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-gray-600 text-base">Loading mood analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View className="flex-1 justify-center items-center p-5">
          <View className="bg-white p-8 rounded-2xl items-center max-w-sm w-full">
            <BarChart3 size={48} color="#EF4444" />
            <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">Unable to Load Analytics</Text>
            <Text className="text-gray-600 text-center mt-2 mb-6">{error}</Text>
            <TouchableOpacity
              className="bg-primary px-6 py-3 rounded-xl"
              onPress={loadMoodAnalytics}
            >
              <View className="flex-row items-center">
                <RefreshCw size={16} color="white" />
                <Text className="text-white font-semibold ml-2">Try Again</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const arousalData = prepareChartData('arousal');
  const valenceData = prepareChartData('valence');
  const intensityData = prepareChartData('intensity');

  // Calculate trend indicators
  const getTrendDirection = (data: ChartData[]) => {
    if (data.length < 2) return 'stable';
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const difference = lastValue - firstValue;
    
    if (difference > 0.1) return 'up';
    if (difference < -0.1) return 'down';
    return 'stable';
  };

  // Helper function to safely format numbers
  const safeFormatNumber = (value: number | undefined | null, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0';
    }
    return value.toFixed(decimals);
  };

  const moodTrend = getTrendDirection(valenceData);
  const energyTrend = getTrendDirection(arousalData);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-lg font-semibold">Mood Analytics</Text>
        <TouchableOpacity onPress={loadMoodAnalytics} className="p-1">
          <RefreshCw size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="bg-primary mx-5 mt-5 p-6 rounded-2xl">
          <View className="items-center">
            <BarChart3 size={32} color="white" />
            <Text className="text-white text-2xl font-bold mt-3">Your Mood Journey</Text>
            <Text className="text-blue-100 text-base text-center mt-1">
              Insights from your past 7 days
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        {analytics && (
          <View className="flex-row mx-5 mt-4 gap-3">
            <View className="flex-1 bg-white p-4 rounded-2xl">
              <View className="items-center">
                <Calendar size={20} color="#2563EB" />
                <Text className="text-2xl font-bold text-gray-900 mt-2">{analytics.totalEntries || 0}</Text>
                <Text className="text-gray-500 text-xs text-center">Total Entries</Text>
              </View>
            </View>
            
            <View className="flex-1 bg-white p-4 rounded-2xl">
              <View className="items-center">
                <View className="flex-row items-center">
                  <Heart size={20} color="#EF4444" />
                  {moodTrend === 'up' && <TrendingUp size={16} color="#10B981" />}
                  {moodTrend === 'down' && <TrendingDown size={16} color="#EF4444" />}
                </View>
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {safeFormatNumber(analytics.averageValence)}
                </Text>
                <Text className="text-gray-500 text-xs text-center">Avg Mood</Text>
              </View>
            </View>
            
            <View className="flex-1 bg-white p-4 rounded-2xl">
              <View className="items-center">
                <View className="flex-row items-center">
                  <Zap size={20} color="#F59E0B" />
                  {energyTrend === 'up' && <TrendingUp size={16} color="#10B981" />}
                  {energyTrend === 'down' && <TrendingDown size={16} color="#EF4444" />}
                </View>
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {safeFormatNumber(analytics.averageArousal)}
                </Text>
                <Text className="text-gray-500 text-xs text-center">Avg Energy</Text>
              </View>
            </View>
          </View>
        )}

        {/* Charts */}
        <MoodChart
          data={valenceData}
          title="Mood Balance"
          color="#10B981"
          minValue={-1}
          maxValue={1}
          icon={Heart}
        />

        <MoodChart
          data={arousalData}
          title="Energy Levels"
          color="#F59E0B"
          minValue={-1}
          maxValue={1}
          icon={Zap}
        />

        <MoodChart
          data={intensityData}
          title="Emotional Intensity"
          color="#8B5CF6"
          minValue={0}
          maxValue={1}
          icon={Activity}
        />

        {/* Insights Section */}
        <View className="bg-white mx-5 mt-4 p-6 rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Understanding Your Metrics</Text>
          
          <View className="space-y-4">
            <View className="flex-row items-start">
              <View className="w-4 h-4 bg-green-500 rounded-full mt-1 mr-3" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Mood Balance</Text>
                <Text className="text-gray-600 text-sm leading-5">
                  Measures how pleasant or unpleasant your emotions feel
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <View className="w-4 h-4 bg-amber-500 rounded-full mt-1 mr-3" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Energy Levels</Text>
                <Text className="text-gray-600 text-sm leading-5">
                  Tracks your emotional energy from calm to excited states
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <View className="w-4 h-4 bg-purple-500 rounded-full mt-1 mr-3" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Emotional Intensity</Text>
                <Text className="text-gray-600 text-sm leading-5">
                  Shows the strength and depth of your emotional experiences
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ViewMoodAnalytics;
