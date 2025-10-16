import { checkIsStudent } from '@/api/api';
import { getChatRoom } from '@/api/chat';
import { getUpcomingSessions } from '@/api/sessions';
import { usePlatformFee } from '@/contexts/PlatformFeeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, ExternalLink, Filter, GraduationCap, MessageCircle, Star, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Define types
type SessionStatus = 'upcoming' | 'past' | 'all' | 'student' | 'free';
type FilterOption = {
    label: string;
    value: string;
};

// Extended session type for UI purposes
type UISession = {
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
    isStudentSession?: boolean;
    isFreeForAll?: boolean;
};

export default function UpcomingSessions() {
    const router = useRouter();
    const { feeStatus, isLoading: feeLoading } = usePlatformFee();
    const [sessions, setSessions] = useState<UISession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<SessionStatus>('all');
    const [selectedCounselor, setSelectedCounselor] = useState<string>('all');
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [showCounselorDropdown, setShowCounselorDropdown] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [dateSearchTerm, setDateSearchTerm] = useState<string>('');
    const [isStudent, setIsStudent] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [token, setToken] = useState<string>('');


    
    useEffect(() => {
        const getToken = async () => {
            const token = await AsyncStorage.getItem('token');
            setToken(token || '');
        };
        getToken();
    }, []);
    
    // Separate function to fetch student sessions data

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const authToken = await AsyncStorage.getItem('token') || '';
            
            if (!authToken) {
                throw new Error('Authentication token missing. Please login again.');
            }
            
            // Use the API function from our sessions.ts file
            const response = await getUpcomingSessions(authToken);
            
            // Get data from the response
            let sessionsArray = Array.isArray(response.data) ? response.data : response.sessions || [];
            
            // Process the sessions for UI display
            const processedSessions = sessionsArray.map((session: any) => {
                const counselor = session.counselor || {};
                // Student sessions are only free if the counselor is a volunteer (free for all)
                // In the future, some paid counselors might offer student benefits, but that's not implemented yet
                const isVolunteerCounselor = session.counselorType === 'free';
                const isFreeForAll = isVolunteerCounselor;
                const isStudentSession = isStudent && isFreeForAll;
                
                return {
                    id: session.id?.toString() || '',
                    date: `${session.date}T${session.timeSlot || '00:00'}:00`,
                    duration: session.duration || 0,
                    fee: session.price || session.fee || 0,
                    notes: session.notes,
                    counselorId: session.counselorId?.toString() || '',
                    counselorName: counselor.name || 'Unknown Counselor',
                    counselorImage: counselor.avatar || '',
                    specialties: counselor.specialties || ['Counseling'],
                    rating: counselor.rating || 5,
                    status: getSessionStatus(`${session.date}T${session.timeSlot || '00:00'}:00`),
                    timeSlot: session.timeSlot || '',
                    sessionStatus: session.status || 'scheduled',
                    isStudentSession,
                    isFreeForAll,
                    isVolunteerCounselor
                };
            });
            
            setSessions(processedSessions);
        } catch (err: any) {
            console.error('Failed to fetch sessions:', err);
            setError(err.message || 'Failed to load sessions. Please try again.');
            
            if (err.name === 'AbortError') {
                Alert.alert('Request Timeout', 'The server took too long to respond. Please try again.');
            } else if (err.message?.includes('Network') || err.message?.includes('Failed to fetch')) {
                Alert.alert('Network Error', 'Please check your internet connection and try again.');
            } else if (err.message?.includes('auth') || err.message?.includes('token')) {
                Alert.alert('Authentication Error', 'Please log in again to view your sessions.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    useEffect(() => {
        fetchSessions();
    }, []);

    const getTodayDate = (): Date => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };
    
    const today = getTodayDate();

    const getDatePart = (dateString: string): string => {
        const datePart = dateString.split('T')[0];
        console.log('Date part:', datePart);
        return datePart;
    }

    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    console.log('Today string:', todayString);

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
        { id: 'all', label: 'All' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'past', label: 'Past' }
    ];
    
    // Add free sessions filter if user is a student
    if (isStudent) {
        filterOptions.push({ id: 'student', label: 'Free' });
    }
    
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
    
    const formatSessionDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
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
    
    const formatSessionTime = (dateString: string, timeSlot?: string): string => {
        try {
            if (timeSlot) {
                const [hours, minutes] = timeSlot.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const hour12 = hours % 12 || 12;
                    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
                }
            }
            
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
    
    const getSessionStatus = (dateString: string): SessionStatus => {
        try {
            const sessionDate = new Date(dateString);
            sessionDate.setHours(0, 0, 0, 0);
            
            if (sessionDate < today) {
                return 'past';
            } else {
                return 'upcoming';
            }
        } catch (e) {
            console.warn('Invalid date string:', dateString);
            return 'past';
        }
    };
    
    const handleViewCounselorProfile = (counselorId: string): void => {
        router.push(`/(hidden)/profile/counsellor_profile?id=${counselorId}`);
    };
    
    const handleChatWithCounselor = async (counselorId: string): Promise<void> => {
        const chatId = await getChatRoom(parseInt(counselorId), token);
        router.push(`/(hidden)/session/messageWithCouncilor?id=${chatId}`);
    };

    // Show loading while context is still loading fee status
    if (feeLoading) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <View className="bg-white rounded-2xl p-8 shadow-lg items-center max-w-sm">
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text className="text-gray-700 text-lg font-medium mt-4">Checking access...</Text>
                </View>
            </View>
        );
    }
    
    // Show loading while fetching sessions
    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <View className="bg-white rounded-2xl p-8 shadow-lg items-center max-w-sm">
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text className="text-gray-700 text-lg font-medium mt-4">Loading your sessions...</Text>
                    <Text className="text-gray-500 text-sm text-center mt-2">
                        Please wait while we fetch your session history
                    </Text>
                </View>
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
            {/* Header */}
            <View className="px-5 pt-6 pb-4 mt-10 bg-white border-b border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="bg-gray-100 p-2 rounded-full"
                    >
                        <ArrowLeft size={20} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className="bg-gray-100 p-2 rounded-full"
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={20} color="#6366F1" />
                    </TouchableOpacity>
                </View>
                <Text className="text-gray-900 text-2xl font-bold ml-1">Upcoming Sessions</Text>
            </View>
            
            <ScrollView 
                className="flex-1 px-4 py-4" 
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={async () => {
                            setRefreshing(true);
                            // Fetch the auth token once
                            const authToken = await AsyncStorage.getItem('token');
                            if (authToken) {
                                // Check student status again in case it changed
                                const studentStatus = await checkIsStudent(authToken);
                                setIsStudent(studentStatus);
                                
                                // Fetch sessions data
                                fetchSessions();
                            } else {
                                setRefreshing(false);
                                Alert.alert('Authentication Error', 'Please log in again to view your sessions.');
                            }
                        }}
                        colors={['#6366F1']}
                        tintColor="#6366F1"
                    />
                }>
                
                
                {/* Sessions List */}
                {filteredSessions.length === 0 ? (
                    <View className="items-center justify-center py-12">
                        <View className="bg-gray-100 rounded-full p-6 mb-2">
                            <Calendar size={48} color="#6366F1" />
                        </View>
                        <Text className="text-gray-700 text-xl font-semibold mt-4">No sessions found</Text>
                        <Text className="text-gray-500 text-center mt-2 px-8 leading-5">
                            {activeFilter === 'upcoming' 
                                ? "You don't have any upcoming sessions scheduled."
                                : activeFilter === 'student'
                                ? "No free student sessions found in your history."
                                : "No sessions match your current filters."}
                        </Text>
                        {activeFilter === 'upcoming' && (
                            <TouchableOpacity
                                className="mt-8 bg-primary px-8 py-3 rounded-full shadow-md flex-row items-center"
                                onPress={() => router.push('/(hidden)/profile/counsellors')}
                            >
                                <Text className="text-white font-medium">Find a Counselor</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View className="space-y-3">
                        {sessions.map((session) => (
                            <View 
                                key={session.id} 
                                className="bg-white rounded-xl p-5 border border-gray-300 mb-5"
                                style={{ elevation: 2 }}
                            >
                                {/* Session Header */}
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center">
                                        <View className={`w-3 h-3 rounded-full mr-2 ${
                                            session.status === 'past' ? 'bg-gray-400' : 'bg-primary'
                                        }`} />
                                        <Text className={`text-sm font-medium ${
                                            session.status === 'past' ? 'text-gray-500' : 'text-primary'
                                        }`}>
                                            {session.status === 'past' ? 'Completed' : 'Upcoming'}
                                        </Text>
                                    </View>
                                    
                                    {session.isFreeForAll ? (
                                        <View className="flex-row">
                                            <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full mr-1">
                                                <GraduationCap size={12} color="#059669" />
                                                <Text className="text-xs text-green-700 font-medium ml-1">Free Counselor</Text>
                                            </View>
                                            {isStudent && (
                                                <View className="flex-row items-center bg-indigo-100 px-3 py-1 rounded-full">
                                                    <GraduationCap size={12} color="#4F46E5" />
                                                    <Text className="text-xs text-indigo-700 font-medium ml-1">Student Benefits</Text>
                                                </View>
                                            )}
                                        </View>
                                    ) : null}
                                </View>
                            
                                {/* Counselor Info */}
                                <View className="flex-row mb-4">
                                    <TouchableOpacity 
                                        className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden mr-3 border-2 border-gray-100"
                                        onPress={() => handleViewCounselorProfile(session.counselorId)}
                                    >
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
                                    </TouchableOpacity>
                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold text-gray-900">
                                            {session.counselorName}
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <Clock size={14} color="#6B7280" className="mr-1" />
                                            <Text className="text-gray-500 text-sm">
                                                {formatSessionDate(session.date)} • {formatSessionTime(session.date, session.timeSlot)}
                                            </Text>
                                        </View>
                                        
                                        {/* Rating */}
                                        {session.status === 'past' && (
                                            <View className="flex-row items-center mt-1">
                                                <Star size={14} color="#FBBF24" fill="#FBBF24" className="mr-1" />
                                                <Text className="text-gray-600 text-sm">{session.rating.toFixed(1)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View className="items-end">
                                        <Text className={`${session.isFreeForAll ? 'text-green-600' : 'text-gray-900'} font-bold text-lg`}>
                                            {session.isFreeForAll ? 'FREE' : `Rs.${session.fee}`}
                                        </Text>
                                        <Text className="text-gray-500 text-xs mt-1">{session.duration} min session</Text>
                                    </View>
                                </View>
                                
                                {/* Notes if available */}
                                {session.notes && (
                                    <View className="bg-gray-50 p-3 rounded-lg mb-4">
                                        <Text className="text-gray-500 text-sm italic">{session.notes}</Text>
                                    </View>
                                )}
                                
                                {/* Action Buttons */}
                                <View className="flex-row justify-between">
                                    <TouchableOpacity 
                                        className="flex-1 mr-2 py-3 bg-gray-100 rounded-lg items-center justify-center flex-row"
                                        onPress={() => handleChatWithCounselor(session.counselorId)}
                                    >
                                        <MessageCircle size={16} color="#4B5563" className="mr-1" />
                                        <Text className="text-gray-700 font-medium text-sm">Message</Text>
                                    </TouchableOpacity>

                                    {session.date && getDatePart(session.date) === todayString ? (
                                        <TouchableOpacity 
                                        className="flex-1 ml-2 py-3 bg-primary rounded-lg items-center justify-center flex-row"
                                        onPress={
                                            () => {
                                                router.push(`/(hidden)/session/VideoCallPage?sessionId=${session.id}`);
                                                console.log('Join session', session.id);
                                            }
                                        }
                                    >
                                        <ExternalLink size={16} color="#FFFFFF" className="mr-1" />
                                        <Text className="text-white font-medium text-sm">Join Session</Text>
                                    </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>     
        </View>
    );
}