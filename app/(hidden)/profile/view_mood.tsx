import { getProfile } from '@/api/auth';
import { DailyMood, getMoodAnalytics, MoodAnalysisResponse } from '@/api/mood';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
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
}> = ({ data, title, color, minValue, maxValue }) => {
  if (data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={[styles.chartBox, { justifyContent: 'center', alignItems: 'center', height: 200 }]}>
          <Text style={styles.noDataText}>No data available</Text>
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
        strokeWidth: 2,
      }
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid lines
      stroke: '#e3e3e3',
      strokeWidth: 1,
    },
    yAxisInterval: 1,
    fromZero: false,
    yAxisSuffix: '',
    yAxisPrefix: '',
    formatYLabel: (value: string) => parseFloat(value).toFixed(1),
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartBox}>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          bezier={false}
          style={{
            marginVertical: 8,
            borderRadius: 12,
          }}
          fromZero={minValue < 0}
          segments={4}
        />
        
        {/* Mood labels below chart */}
        <View style={styles.moodLabelsContainer}>
          {data.map((point, index) => (
            <View key={index} style={styles.moodLabelItem}>
              <Text style={styles.moodLabelText}>{point.mood}</Text>
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
      console.error('Error loading profile:', err);
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
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading mood analytics:', err);
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading mood analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMoodAnalytics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const arousalData = prepareChartData('arousal');
  const valenceData = prepareChartData('valence');
  const intensityData = prepareChartData('intensity');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mood Analytics</Text>
          <Text style={styles.subtitle}>Last 7 Days</Text>
        </View>

        {analytics && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{analytics.totalEntries}</Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{analytics.averageValence.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Avg Mood</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{analytics.averageArousal.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Avg Excitement</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{analytics.averageIntensity.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Avg Intensity</Text>
            </View>
          </View>
        )}

        <MoodChart
          data={valenceData}
          title="Mood (Pleasant ↔ Unpleasant)"
          color="#4CAF50"
          minValue={-1}
          maxValue={1}
        />

        <MoodChart
          data={arousalData}
          title="Excitement (High Energy ↔ Low Energy)"
          color="#FF9800"
          minValue={-1}
          maxValue={1}
        />

        <MoodChart
          data={intensityData}
          title="Intensity (Strength of Emotion)"
          color="#9C27B0"
          minValue={0}
          maxValue={1}
        />

        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Mood: How pleasant/unpleasant the emotion is</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Excitement: Energy level of the emotion</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#9C27B0' }]} />
            <Text style={styles.legendText}>Intensity: Strength of the emotional experience</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartBox: {
    position: 'relative',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  moodLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  moodLabelItem: {
    flex: 1,
    alignItems: 'center',
  },
  moodLabelText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  legendContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
});

export default ViewMoodAnalytics;
