import TopBar from '@/components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function SessionHistory() {
    const router = useRouter();
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
    
    // Get current date for highlighting - using a more robust approach
    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const today = getCurrentDate();
    const [selectedDate, setSelectedDate] = useState(today);
    
    // Create fresh animated values - all using useNativeDriver: false
    const [calendarHeight] = useState(new Animated.Value(0));
    const [stripOpacity] = useState(new Animated.Value(1));
    const [stripHeight] = useState(new Animated.Value(96));

    // Generate calendar strip dates (7 days around current date)
    const generateCalendarStrip = () => {
        const dates = [];
        const currentDate = new Date();
        
        // Debug: Log current date info
        // console.log('Current date:', currentDate);
        // console.log('Today string:', today);
        // console.log('Current date getDate():', currentDate.getDate());
        
        // Generate 7 days: 3 before, today, 3 after
        for (let i = -3; i <= 3; i++) {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() + i);
            
            // Use the same date formatting as getCurrentDate() for consistency
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            // Debug: Log each date
            // console.log(`Index ${i}: date=${dateString}, day=${date.getDate()}, isToday=${dateString === today}`);
            
            dates.push({
                date: dateString,
                day: date.getDate(),
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                isToday: dateString === today
            });
        }
        
        return dates;
    };
    const toggleCalendar = () => {
        if (isCalendarExpanded) {
            // Closing calendar: First hide calendar, then show strip
            Animated.timing(calendarHeight, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start(() => {
                // After calendar is hidden, show the strip
                setIsCalendarExpanded(false);
                Animated.parallel([
                    Animated.timing(stripOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                    }),
                    Animated.timing(stripHeight, {
                        toValue: 96,
                        duration: 300,
                        useNativeDriver: false,
                    }),
                ]).start();
            });
        } else {
            // Opening calendar: First hide strip, then show calendar
            Animated.parallel([
                Animated.timing(stripOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(stripHeight, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start(() => {
                // After strip is hidden, show the calendar
                setIsCalendarExpanded(true);
                Animated.timing(calendarHeight, {
                    toValue: 350,
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            });
        }
    };

    // Dummy function for date selection
    const handleDateSelect = (date: string) => {
        console.log('Selected date:', date);
        setSelectedDate(date);
        
        // You can add your logic here for fetching sessions for the selected date
        // For example:
        // fetchSessionsForDate(date);
        
        // Optional: Close calendar after selection
        // toggleCalendar();
    };

    // Dummy function for calendar strip date click
    const handleCalendarStripDateClick = (date: string) => {
        console.log('Calendar strip date clicked:', date);
        setSelectedDate(date);
        
        // Add your logic here for handling calendar strip date selection
        // For example:
        // fetchSessionsForDate(date);
    };

    const calendarStripDates = generateCalendarStrip();

    // Calendar marking for selected and today
    const markedDates = {
        [today]: {
            selected: selectedDate === today,
            marked: true,
            selectedColor: selectedDate === today ? '#6366f1' : undefined,
            dotColor: '#6366f1',
        },
        ...(selectedDate !== today && {
            [selectedDate]: {
                selected: true,
                selectedColor: '#6366f1',
            }
        })
    };

    return (
        <View className="flex-1 bg-gray-50">
            <TopBar title="Session History" />
            
            <View className="flex-1 px-4 py-4">
                {/* Header with title and calendar toggle button */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-800">
                        Counselling Sessions
                    </Text>
                    <TouchableOpacity
                        onPress={toggleCalendar}
                        className="bg-purple-500 p-3 rounded-full shadow-lg"
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isCalendarExpanded ? "calendar" : "calendar-outline"}
                            size={24}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>

                {/* Calendar Strip - Animate opacity and height when toggling */}
                <Animated.View 
                    style={{ 
                        opacity: stripOpacity,
                        height: stripHeight,
                        overflow: 'hidden',
                    }}
                    pointerEvents={isCalendarExpanded ? 'none' : 'auto'}
                >
                    <View className="flex-row justify-between items-center bg-white rounded-lg p-3 shadow-sm mb-4">
                        {calendarStripDates.map((dateItem, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleCalendarStripDateClick(dateItem.date)}
                                className={`items-center justify-center p-2 rounded-lg min-w-[40px] ${
                                    dateItem.isToday
                                        ? 'bg-purple-500'
                                        : selectedDate === dateItem.date
                                        ? 'bg-purple-200'
                                        : 'bg-transparent'
                                }`}
                                activeOpacity={0.7}
                            >
                                <Text
                                    className={`text-xs font-medium ${
                                        dateItem.isToday
                                            ? 'text-white'
                                            : selectedDate === dateItem.date
                                            ? 'text-purple-700'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {dateItem.dayName}
                                </Text>
                                <Text
                                    className={`text-lg font-bold ${
                                        dateItem.isToday
                                            ? 'text-white'
                                            : selectedDate === dateItem.date
                                            ? 'text-purple-700'
                                            : 'text-gray-800'
                                    }`}
                                >
                                    {dateItem.day}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* Expandable Calendar - Control visibility with height animation */}
                <Animated.View 
                    style={{ 
                        height: calendarHeight,
                        overflow: 'hidden',
                        marginBottom: 16, // mb-4 equivalent for consistent spacing
                    }}
                    pointerEvents={isCalendarExpanded ? 'auto' : 'none'}
                >
                    <View className="bg-white rounded-lg shadow-sm">
                        <Calendar
                            current={today}
                            onDayPress={(day) => handleDateSelect(day.dateString)}
                            markedDates={markedDates}
                            theme={{
                                backgroundColor: '#ffffff',
                                calendarBackground: '#ffffff',
                                textSectionTitleColor: '#6366f1',
                                selectedDayBackgroundColor: '#6366f1',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#6366f1',
                                dayTextColor: '#2d4150',
                                textDisabledColor: '#d9e1e8',
                                dotColor: '#6366f1',
                                selectedDotColor: '#ffffff',
                                arrowColor: '#6366f1',
                                disabledArrowColor: '#d9e1e8',
                                monthTextColor: '#2d4150',
                                indicatorColor: '#6366f1',
                                textDayFontWeight: '500',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14
                            }}
                        />
                    </View>
                </Animated.View>

                {/* Sessions List - Placeholder */}
                <View className="flex-1 mt-4">
                    <Text className="text-lg font-semibold text-gray-700 mb-3">
                        Sessions for {selectedDate}
                    </Text>
                    
                    {/* Placeholder for sessions */}
                    <View className="bg-white rounded-lg p-4 shadow-sm">
                        <Text className="text-gray-500 text-center">
                            No sessions found for this date
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => router.replace('/(tabs)')}
                    className="bottom-10 p-2 h-16 bg-buttonBlue-500 rounded-lg"
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="arrow-back" size={26} color="#6366f1" />
                        <View className='ml-2'/>
                        <Text className='text-gray-50'>
                            Go back to home
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>     
        </View>
    );
}