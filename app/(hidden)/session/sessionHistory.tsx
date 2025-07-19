import { checkIsStudent } from '@/api/api';
import { API_URL, PORT } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Check, ChevronDown, Clock, ExternalLink, Filter, GraduationCap, MessageCircle, Search, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Define types
type SessionStatus = 'upcoming' | 'today' | 'past' | 'all' | 'student' | 'free';
type FilterOption = {
    label: string;
    value: string;
};

type Session = {
    id: string;
    date: string;
    duration: number;
    fee: number | string;
    notes?: string | null;
    counselorId: string;
    counselorName: string;
    counselorImage?: string;
    specialties: string[];
    rating: number;
    status: SessionStatus;
    timeSlot?: string;
    sessionStatus?: string;
    isStudentSession?: boolean; // Indicates if this is a free student session
    isFreeForAll?: boolean; // Indicates if this session is free for everyone
};

let API_BASE_URL = '';
if (Platform.OS === 'android') {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
} else {
  API_BASE_URL = API_URL + ':' + PORT + '/api';
}

export default function SessionHistory() {
    console.log('Session History component initialized - [Updated with API format fix]');
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<SessionStatus>('all');
    const [selectedCounselor, setSelectedCounselor] = useState<string>('all');
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [showCounselorDropdown, setShowCounselorDropdown] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [dateSearchTerm, setDateSearchTerm] = useState<string>('');
    const [isStudent, setIsStudent] = useState<boolean>(false);

    // Check if user is a student
    useEffect(() => {
        const checkStudentStatus = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const studentStatus = await checkIsStudent(token);
                    setIsStudent(studentStatus);
                }
            } catch (error) {
                console.error('Error checking student status:', error);
            }
        };
        
        checkStudentStatus();
    }, []);

    // Extract fetchSessions to reuse it
    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const authToken = await AsyncStorage.getItem('token') || '';
            
            if (!authToken) {
                throw new Error('Authentication token missing. Please login again.');
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            console.log('Making API request to:', `${API_BASE_URL}/sessions/my-sessions`);
            
            const response = await fetch(`${API_BASE_URL}/sessions/my-sessions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('API response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
                console.error('API error response:', errorData);
                throw new Error(errorData.message || `Failed to fetch sessions: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Debug: log the full response structure
            console.log('API Response received:', JSON.stringify(data, null, 2));
            
            // Check if response is in the format shown in Postman
            if (!data || (!Array.isArray(data.data) && !Array.isArray(data.sessions))) {
                console.warn('Unexpected API response format:', data);
                throw new Error('Invalid data format received from server');
            }
            
            // Use data.data if available (new API format) or data.sessions as fallback
            let sessionsArray = Array.isArray(data.data) ? data.data : data.sessions || [];
            console.log('Sessions received:', sessionsArray.length);
            
            if (sessionsArray.length === 0) {
                console.warn('No sessions received from the API');
                
                // Check if we have received empty data or raw array in a different format
                if (data && Array.isArray(data) && data.length > 0) {
                    console.log('Detected array response format, trying to use it directly');
                    sessionsArray = data;
                }
            }
            
            const processedSessions = sessionsArray.map((session: any) => {
                try {
                    // Format according to the new API structure
                    const counselor = session.counselor || {};
                    
                    // Check if this is a student session (price is 0 and user is a student)
                    const isStudentSession = (session.price === 0 || session.fee === 0) && isStudent && session.counselorType === 'paid_with_free_student';
                    
                    // Check if this is a free for all session (counselor type is 'free')
                    const isFreeForAll = session.counselorType === 'free';
                    
                    return {
                        id: session.id?.toString() || '',
                        date: `${session.date}T${session.timeSlot || '00:00'}:00`, // Combine date and time
                        duration: session.duration || 0,
                        fee: session.price || session.fee || 0,
                        notes: session.notes,
                        counselorId: session.counselorId?.toString() || '',
                        counselorName: counselor.name || 'Unknown Counselor',
                        counselorImage: counselor.avatar || '',
                        specialties: ['Counseling'], // Default specialties if not provided
                        rating: 5, // Default rating if not provided
                        status: getSessionStatus(`${session.date}T${session.timeSlot || '00:00'}:00`),
                        timeSlot: session.timeSlot || '',
                        sessionStatus: session.status || 'scheduled',
                        isStudentSession: isStudentSession,
                        isFreeForAll: isFreeForAll
                    };
                } catch (err) {
                    console.error('Error processing session:', err, session);
                    // Return a minimal valid session object to prevent crashes
                    return {
                        id: session.id?.toString() || Math.random().toString(),
                        date: new Date().toISOString(),
                        duration: 0,
                        fee: 0,
                        counselorId: '',
                        counselorName: 'Unknown',
                        specialties: [],
                        rating: 0,
                        status: 'past' as SessionStatus
                    };
                }
            });
            
            setSessions(processedSessions);
        } catch (err: any) {
            console.error('Failed to fetch sessions:', err);
            setError(err.message || 'Failed to load sessions. Please try again.');
            
            if (err.name === 'AbortError') {
                Alert.alert(
                    'Request Timeout',
                    'The server took too long to respond. Please try again.',
                    [{ text: 'OK' }]
                );
            } else if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
                Alert.alert(
                    'Network Error',
                    'Please check your internet connection and try again.',
                    [{ text: 'Try Again', onPress: () => fetchSessions() }]
                );
            } else if (err.message.includes('auth') || err.message.includes('token')) {
                Alert.alert(
                    'Authentication Error',
                    'Please log in again to view your sessions.',
                    [{ text: 'OK', onPress: () => router.push('/(auth)/signin') }]
                );
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch sessions from API with proper error handling and auth
    useEffect(() => {
        fetchSessions();
    }, []);

    // Get today's date at midnight for comparison
    const getTodayDate = (): Date => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };
    
    const today = getTodayDate();
    
    // Extract unique counselors for filtering
    const counselors: FilterOption[] = React.useMemo(() => {
        const uniqueCounselors = new Set(sessions.map(session => session.counselorId));
        return [
            { label: 'All Counselors', value: 'all' },
            ...Array.from(uniqueCounselors).map(id => {
                const counselor = sessions.find(s => s.counselorId === id);
                return { 
                    label: counselor?.counselorName || 'Unknown Counselor', 
                    value: id as string 
                };
            })
        ];
    }, [sessions]);
    
    // Helper to format date for search comparison
    const formatDateForSearch = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            }).toLowerCase();
        } catch (e) {
            console.warn('Invalid date string:', dateString);
            return '';
        }
    };
    
    // Simplified filter options
    const filterOptions = [
        { id: 'all', label: 'All Sessions' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'past', label: 'Past' }
    ];
    
    // Add free sessions filter if user is a student
    if (isStudent) {
        filterOptions.push({ id: 'student', label: 'Student Free Sessions' });
    }
    
    // Add general free sessions filter
    filterOptions.push({ id: 'free', label: 'Free Sessions' });

    // Update the filtered sessions to include free session filter
    const filteredSessions = React.useMemo(() => {
        return sessions.filter(session => {
            if (!session.date || !session.counselorId) return false;
            
            if (activeFilter === 'student' && !session.isStudentSession) {
                return false;
            } else if (activeFilter === 'free' && !session.isFreeForAll) {
                return false;
            } else if (activeFilter !== 'all' && activeFilter !== 'student' && activeFilter !== 'free' && session.status !== activeFilter) {
                return false;
            }
            
            if (selectedCounselor !== 'all' && session.counselorId !== selectedCounselor) {
                return false;
            }
            
            if (searchTerm && !session.counselorName?.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            
            if (dateSearchTerm) {
                const formattedSessionDate = formatDateForSearch(session.date);
                if (!formattedSessionDate.includes(dateSearchTerm.toLowerCase())) {
                    return false;
                }
            }
            
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sessions, activeFilter, selectedCounselor, searchTerm, dateSearchTerm]);
    
    // Format date for display with error handling
    const formatSessionDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            
            // Get current date for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            // Check if date is today, tomorrow, or yesterday
            const sessionDate = new Date(date);
            sessionDate.setHours(0, 0, 0, 0);
            
            if (sessionDate.getTime() === today.getTime()) {
                return 'Today, ' + date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });
            } else if (sessionDate.getTime() === tomorrow.getTime()) {
                return 'Tomorrow, ' + date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });
            } else if (sessionDate.getTime() === yesterday.getTime()) {
                return 'Yesterday, ' + date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });
            }
            
            // Default format
            return date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            console.warn('Invalid date string:', dateString);
            return 'Invalid date';
        }
    };
    
    // Format time for display with error handling
    const formatSessionTime = (dateString: string, timeSlot?: string): string => {
        try {
            // If we have a separate timeSlot (like "09:00"), use that instead
            if (timeSlot) {
                // Format the time (e.g., "09:00" to "9:00 AM")
                const [hours, minutes] = timeSlot.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
                    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
                }
            }
            
            // Fallback to date string if timeSlot is not available or valid
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.warn('Invalid date/time:', e);
            return 'Invalid time';
        }
    };
    
    // Get session status for UI
    const getSessionStatus = (dateString: string): SessionStatus => {
        try {
            const sessionDate = new Date(dateString);
            sessionDate.setHours(0, 0, 0, 0);
            
            if (sessionDate.getTime() === today.getTime()) {
                return 'today';
            } else if (sessionDate < today) {
                return 'past';
            } else {
                return 'upcoming';
            }
        } catch (e) {
            console.warn('Invalid date string:', dateString);
            return 'past';
        }
    };
    
    // Navigate to counselor profile
    const handleViewCounselorProfile = (counselorId: string): void => {
        router.push({
            pathname: '/(hidden)/profile/counsellor_profile',
            params: { id: counselorId }
        });
    };
    
    // Navigate to chat with counselor
    const handleChatWithCounselor = (counselorId: string): void => {
        router.push({
            pathname: '/(hidden)/profile/counsellor-chat',
            params: { counselorId: counselorId }
        });
    };
    
    // Handle session booking
    const handleBookSession = (counselorId: string): void => {
        router.push({
            pathname: '/(hidden)/session/bookSessions',
            params: { counselorId }
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-gray-600 mt-4">Loading your sessions...</Text>
            </View>
        );
    }
    
    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-white px-6">
                <Text className="text-red-500 text-center mb-4">{error}</Text>
                <TouchableOpacity 
                    className="bg-primary px-6 py-3 rounded-lg"
                    onPress={fetchSessions}
                >
                    <Text className="text-white font-medium">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <View className="pt-6" />
            <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-semibold">Session History</Text>
                <View className="w-6" />
            </View>
            
            <ScrollView className="flex-1 px-4 py-4">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-800">Sessions</Text>
                    <TouchableOpacity 
                        className="bg-primary/10 p-2 rounded-full"
                        onPress={() => setShowFilters(prev => !prev)}
                    >
                        <Filter size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {filterOptions.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveFilter(tab.id as SessionStatus)}
                            className={`mr-3 px-4 py-2 rounded-full ${
                                activeFilter === tab.id ? 'bg-primary' : 'bg-gray-200'
                            }`}
                        >
                            <Text className={`font-medium ${
                                activeFilter === tab.id ? 'text-white' : 'text-gray-700'
                            }`}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                
                <View className="mb-4">
                    <View className="flex-row items-center bg-white rounded-lg shadow-sm p-2 mb-3">
                        <Search size={20} color="#9CA3AF" className="mr-2" />
                        <TextInput
                            placeholder="Search by counselor name"
                            className="flex-1 text-gray-700 py-1"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        {searchTerm.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchTerm('')}>
                                <Text className="text-primary font-medium">Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    {showFilters && (
                        <View className="bg-white p-3 rounded-lg shadow-sm mb-3">
                            <View>
                                <Text className="text-gray-600 mb-1 text-sm">Filter by Counselor</Text>
                                <TouchableOpacity
                                    className="flex-row justify-between items-center bg-gray-100 p-2 rounded-md"
                                    onPress={() => setShowCounselorDropdown(!showCounselorDropdown)}
                                >
                                    <Text className="text-gray-700">
                                        {counselors.find(c => c.value === selectedCounselor)?.label || 'All Counselors'}
                                    </Text>
                                    <ChevronDown size={18} color="#4B5563" />
                                </TouchableOpacity>
                                
                                {showCounselorDropdown && (
                                    <View className="bg-white mt-1 rounded-md shadow-md absolute top-10 left-0 right-0 z-10">
                                        {counselors.map((counselor) => (
                                            <TouchableOpacity
                                                key={counselor.value}
                                                className="p-3 border-b border-gray-100 flex-row justify-between items-center"
                                                onPress={() => {
                                                    setSelectedCounselor(counselor.value);
                                                    setShowCounselorDropdown(false);
                                                }}
                                            >
                                                <Text className="text-gray-700">{counselor.label}</Text>
                                                {selectedCounselor === counselor.value && (
                                                    <Check size={16} color="#2563EB" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                            
                            <View className="mt-3">
                                <Text className="text-gray-600 mb-1 text-sm">Search by Date</Text>
                                <View className="flex-row items-center bg-gray-100 rounded-md p-2">
                                    <Calendar size={18} color="#4B5563" className="mr-2" />
                                    <TextInput
                                        placeholder="Search by date (e.g., Jul 15, 2025)"
                                        className="flex-1 text-gray-700 py-1"
                                        value={dateSearchTerm}
                                        onChangeText={setDateSearchTerm}
                                    />
                                    {dateSearchTerm.length > 0 && (
                                        <TouchableOpacity onPress={() => setDateSearchTerm('')}>
                                            <Text className="text-primary font-medium">Clear</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}
                </View>
                
                {filteredSessions.length === 0 ? (
                    <View className="items-center justify-center py-12">
                        <Calendar size={48} color="#9CA3AF" />
                        <Text className="text-gray-500 text-lg font-medium mt-4">No sessions found</Text>
                        <Text className="text-gray-400 text-center mt-2 px-8">
                            {activeFilter === 'upcoming' 
                                ? "You don't have any upcoming sessions. Book a session with a counselor to get started."
                                : activeFilter === 'student'
                                ? "You don't have any free student sessions. Book a session with a counselor that offers free student sessions."
                                : activeFilter === 'free'
                                ? "You don't have any free sessions. Book a session with a free counselor."
                                : "No sessions match your current filters. Try adjusting your filters or search terms."}
                        </Text>
                        {activeFilter === 'upcoming' && (
                            <TouchableOpacity 
                                className="mt-6 bg-primary px-6 py-3 rounded-lg"
                                onPress={() => router.push('/(hidden)/profile/counsellors')}
                            >
                                <Text className="text-white font-medium">Find a Counselor</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View>
                        {filteredSessions.map((session) => (
                            <View 
                                key={session.id} 
                                className={`bg-white rounded-xl p-4 mb-4 shadow-sm ${
                                    session.status === 'today' ? 'border-l-4 border-primary' : ''
                                }`}
                            >
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full mr-2 bg-primary" />
                                        <Text className="text-primary font-medium">
                                            {session.status === 'past' ? 'Completed' : 'Scheduled'}
                                        </Text>
                                    </View>
                                    
                                    {/* Show appropriate session badge */}
                                    {session.isFreeForAll ? (
                                        <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-lg">
                                            <GraduationCap size={12} color="#059669" />
                                            <Text className="text-xs text-green-700 font-medium ml-1">Free Session</Text>
                                        </View>
                                    ) : session.isStudentSession ? (
                                        <View className="flex-row items-center bg-indigo-100 px-2 py-1 rounded-lg">
                                            <GraduationCap size={12} color="#4F46E5" />
                                            <Text className="text-xs text-indigo-700 font-medium ml-1">Free Student Session</Text>
                                        </View>
                                    ) : null}
                                </View>
                                
                                <View className="flex-row mb-4">
                                    <View className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-3">
                                        {session.counselorImage ? (
                                            <Image 
                                                source={{ uri: session.counselorImage }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="w-full h-full bg-gray-300 justify-center items-center">
                                                <User size={24} color="#9CA3AF" />
                                            </View>
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold text-gray-900">
                                            {session.counselorName}
                                        </Text>
                                        <View className="flex-row items-center">
                                            <Clock size={14} color="#6B7280" className="mr-1" />
                                            <Text className="text-gray-500">
                                                {formatSessionDate(session.date)} • {formatSessionTime(session.date, session.timeSlot)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-gray-900 font-semibold">
                                            {session.isFreeForAll || session.isStudentSession ? 'FREE' : `Rs.${session.fee}`}
                                        </Text>
                                        <Text className="text-gray-500 text-sm">{session.duration} min</Text>
                                    </View>
                                </View>
                                
                                <View className="flex-row justify-between mt-2">
                                    <TouchableOpacity
                                        className="flex-1 mr-2 py-2 bg-gray-100 rounded-lg items-center justify-center flex-row"
                                        onPress={() => handleChatWithCounselor(session.counselorId)}
                                    >
                                        <MessageCircle size={16} color="#4B5563" className="mr-1" />
                                        <Text className="text-gray-700 font-medium">Message</Text>
                                    </TouchableOpacity>
                                    
                                    {session.status !== 'past' ? (
                                        <TouchableOpacity
                                            className="flex-1 ml-2 py-2 bg-primary rounded-lg items-center justify-center flex-row"
                                            onPress={() => {
                                                // Navigate to join session screen (would be implemented in a real app)
                                                Alert.alert('Join Session', 'This would navigate to the video call screen in a real app.');
                                            }}
                                        >
                                            <ExternalLink size={16} color="#FFFFFF" className="mr-1" />
                                            <Text className="text-white font-medium">Join Session</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            className="flex-1 ml-2 py-2 bg-primary rounded-lg items-center justify-center flex-row"
                                            onPress={() => handleBookSession(session.counselorId)}
                                        >
                                            <Calendar size={16} color="#FFFFFF" className="mr-1" />
                                            <Text className="text-white font-medium">Book Again</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                
                {isStudent && (
                    <View className="mx-4 mt-4 mb-2 bg-indigo-50 p-3 rounded-xl">
                        <Text className="text-indigo-900 font-semibold">Student Benefits</Text>
                        <Text className="text-indigo-700 text-sm mt-1">
                            You get 4 free counseling sessions each month
                        </Text>
                    </View>
                )}
                
                <TouchableOpacity
                    onPress={() => router.push('/session/StudentPackageApply')}
                    className="mt-2 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200"
                >
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-blue-800 font-bold text-lg">Free Student Package</Text>
                            <Text className="text-blue-600 mt-1">Apply with your university credentials</Text>
                        </View>
                        <ExternalLink size={24} color="#2563EB" />
                    </View>
                </TouchableOpacity>
            </ScrollView>     
        </View>
    );
}