import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Check, ChevronDown, Clock, ExternalLink, Filter, MessageCircle, Search, Star, User } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Mock data for all sessions - past, today, and upcoming
const MOCK_SESSIONS = [
    // Past sessions
    {
        id: '1',
        date: new Date(2025, 6, 1, 10, 0), // July 1, 2025 at 10:00 AM
        duration: 60, // minutes
        fee: '$120',
        counselorId: 'c1',
        counselorName: 'Dr. Sarah Johnson',
        counselorImage: 'https://images.pexels.com/photos/5327584/pexels-photo-5327584.jpeg?auto=compress&cs=tinysrgb&w=200',
        specialties: ['Anxiety', 'Depression'],
        rating: 4.9,
        notes: 'Discussed anxiety management techniques. Follow-up recommended in 2 weeks.',
        status: 'completed'
    },
    {
        id: '2',
        date: new Date(2025, 6, 5, 15, 30), // July 5, 2025 at 3:30 PM
        duration: 45, // minutes
        fee: '$100',
        counselorId: 'c2',
        counselorName: 'Dr. Michael Chen',
        counselorImage: 'https://images.pexels.com/photos/5490276/pexels-photo-5490276.jpeg?auto=compress&cs=tinysrgb&w=200',
        specialties: ['Stress Management', 'Work-Life Balance'],
        rating: 4.7,
        notes: 'Worked on stress reduction exercises. Progress noted with sleep improvement.',
        status: 'completed'
    },
    {
        id: '3',
        date: new Date(2025, 6, 10, 14, 0), // July 10, 2025 at 2:00 PM
        duration: 60, // minutes
        fee: '$130',
        counselorId: 'c3',
        counselorName: 'Dr. Lisa Patel',
        counselorImage: 'https://images.pexels.com/photos/7585607/pexels-photo-7585607.jpeg?auto=compress&cs=tinysrgb&w=200',
        specialties: ['Relationships', 'Family Therapy'],
        rating: 4.8,
        notes: 'Discussed communication strategies for family conflicts.',
        status: 'completed'
    },
    // Today's sessions (July 15, 2025)
    {
        id: '4',
        date: new Date(2025, 6, 15, 9, 0), // July 15, 2025 at 9:00 AM (Today)
        duration: 60, // minutes
        fee: '$120',
        counselorId: 'c1',
        counselorName: 'Dr. Sarah Johnson',
        counselorImage: 'https://images.pexels.com/photos/5327584/pexels-photo-5327584.jpeg?auto=compress&cs=tinysrgb&w=200',
        specialties: ['Anxiety', 'Depression'],
        rating: 4.9,
        notes: 'Follow-up session for anxiety management.',
        status: 'scheduled'
    },
    {
        id: '5',
        date: new Date(2025, 6, 15, 14, 30), // July 15, 2025 at 2:30 PM (Today)
        duration: 45, // minutes
        fee: '$130',
        counselorId: 'c3',
        counselorName: 'Dr. Lisa Patel',
        counselorImage: 'https://images.pexels.com/photos/7585607/pexels-photo-7585607.jpeg?auto=compress&cs=tinysrgb&w=200',
        specialties: ['Relationships', 'Family Therapy'],
        rating: 4.8,
        notes: 'Discussing progress with family communication strategies.',
        status: 'scheduled'
    },
    // Upcoming sessions
    {
        id: '6',
        date: new Date(2025, 6, 18, 11, 0), // July 18, 2025 at 11:00 AM
        duration: 60, // minutes
        fee: '$100',
        counselorId: 'c2',
        counselorName: 'Dr. Michael Chen',
        counselorImage: 'https://images.pexels.com/photos/5490276/pexels-photo-5490276.jpeg?auto=compress&cs=tinysrgb&w=200',
        specialties: ['Stress Management', 'Work-Life Balance'],
        rating: 4.7,
        notes: 'Initial session to discuss work-related stress.',
        status: 'scheduled'
    },
    {
        id: '7',
        date: new Date(2025, 6, 22, 16, 0), // July 22, 2025 at 4:00 PM
        duration: 60, // minutes
        fee: '$120',
        counselorId: 'c1',
        counselorName: 'Dr. Sarah Johnson',
        counselorImage: 'https://images.pexels.com/photos/5327584/pexels-photo-5327584.jpeg?auto=compress&cs=tinysrgb&w=200',
        specialties: ['Anxiety', 'Depression'],
        rating: 4.9,
        notes: 'Monthly checkup session.',
        status: 'scheduled'
    }
];

// Define types
type SessionStatus = 'upcoming' | 'today' | 'past' | 'all';
type FilterOption = {
    label: string;
    value: string;
};

export default function SessionHistory() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = React.useState<SessionStatus>('all');
    const [selectedCounselor, setSelectedCounselor] = React.useState<string>('all');
    
    // UI state
    const [showFilters, setShowFilters] = React.useState<boolean>(false);
    const [showCounselorDropdown, setShowCounselorDropdown] = React.useState<boolean>(false);
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [dateSearchTerm, setDateSearchTerm] = React.useState<string>('');
    const [showDatePicker, setShowDatePicker] = React.useState<boolean>(false);
    
    // Get today's date at midnight for comparison
    const getTodayDate = (): Date => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };
    
    const today = getTodayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Extract unique counselors for filtering
    const counselors: FilterOption[] = React.useMemo(() => {
        const uniqueCounselors = new Set(MOCK_SESSIONS.map(session => session.counselorId));
        return [
            { label: 'All Counselors', value: 'all' },
            ...Array.from(uniqueCounselors).map(id => {
                const counselor = MOCK_SESSIONS.find(s => s.counselorId === id);
                return { 
                    label: counselor?.counselorName || '', 
                    value: id as string 
                };
            })
        ];
    }, []);
    
    // Helper to format date for search comparison
    const formatDateForSearch = (date: Date): string => {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        }).toLowerCase();
    };
    
    // Filter sessions based on selected filters
    const filteredSessions = React.useMemo(() => {
        return MOCK_SESSIONS.filter(session => {
            // Filter by session status (past, today, upcoming)
            if (activeFilter !== 'all') {
                const sessionDate = new Date(session.date);
                sessionDate.setHours(0, 0, 0, 0);
                
                if (activeFilter === 'past' && sessionDate >= today) {
                    return false;
                }
                
                if (activeFilter === 'upcoming' && sessionDate <= today) {
                    return false;
                }
                
                if (activeFilter === 'today' && 
                    (sessionDate.getTime() !== today.getTime())) {
                    return false;
                }
            }
            
            // Filter by counselor ID
            if (selectedCounselor !== 'all' && session.counselorId !== selectedCounselor) {
                return false;
            }
            
            // Filter by search term (counselor name)
            if (searchTerm && !session.counselorName.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            
            // Filter by date search term
            if (dateSearchTerm) {
                const formattedSessionDate = formatDateForSearch(session.date);
                if (!formattedSessionDate.includes(dateSearchTerm.toLowerCase())) {
                    return false;
                }
            }
            
            return true;
        }).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [activeFilter, selectedCounselor, searchTerm, dateSearchTerm]);
    
    // Format date for display
    const formatSessionDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    // Format time for display
    const formatSessionTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Get session status for UI
    const getSessionStatus = (date: Date): SessionStatus => {
        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);
        
        if (sessionDate.getTime() === today.getTime()) {
            return 'today';
        } else if (sessionDate < today) {
            return 'past';
        } else {
            return 'upcoming';
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
    
    // Navigate to book a session with counselor
    const handleBookSession = (counselorId: string): void => {
        // Navigate to the booking page with the counselor ID
        // For now, show an alert since we don't have the booking page path
        alert(`Book a session with ${counselorId}`);
        // Once you have a booking page, use:
        // router.push({
        //     pathname: '/(hidden)/session/booking',
        //     params: { counselorId: counselorId }
        // });
    };
    
    // No session details functionality needed

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header with back button */}
            <View className="pt-6" />
            <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.push('/(hidden)/profile/view_profile')}>
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-semibold">Session History</Text>
                <View className="w-6" />
            </View>
            
            <ScrollView className="flex-1 px-4 py-4">
                {/* Header with title and filter button */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-800">
                        Sessions
                    </Text>
                    
                    {/* Filter button */}
                    <TouchableOpacity 
                        className="bg-primary/10 p-2 rounded-full"
                        onPress={() => {
                            // Open filter modal or expand filter options
                            setShowFilters(prev => !prev);
                        }}
                    >
                        <Filter size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>
                
                {/* Status filter tabs */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                >
                    {[
                        { id: 'all', label: 'All Sessions' },
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'today', label: 'Today' },
                        { id: 'past', label: 'Past' }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveFilter(tab.id as SessionStatus)}
                            className={`mr-3 px-4 py-2 rounded-full ${
                                activeFilter === tab.id ? 'bg-primary' : 'bg-gray-200'
                            }`}
                        >
                            <Text 
                                className={`font-medium ${
                                    activeFilter === tab.id ? 'text-white' : 'text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                
                {/* Search and filter options */}
                <View className="mb-4">
                    {/* Search bar */}
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
                    
                    {/* Counselor filter - only shown when filters are active */}
                    {showFilters && (
                        <View className="bg-white p-3 rounded-lg shadow-sm mb-3">
                            {/* Counselor filter */}
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
                            
                            {/* Date search */}
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
                
                {/* Session cards */}
                {filteredSessions.length === 0 ? (
                    <View className="bg-white rounded-lg p-6 shadow-sm items-center justify-center">
                        <Calendar size={40} color="#CBD5E0" />
                        <Text className="text-gray-500 text-center mt-3 text-base">
                            No sessions found with the current filters
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setActiveFilter('all');
                                setSelectedCounselor('all');
                                setSearchTerm('');
                                setDateSearchTerm('');
                            }}
                            className="mt-3 bg-primary px-4 py-2 rounded-md"
                        >
                            <Text className="text-white font-medium">Reset Filters</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    filteredSessions.map((session) => {
                        const sessionStatus = getSessionStatus(session.date);
                        return (
                    <View 
                        key={session.id} 
                        className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
                    >
                        {/* Session header with date and type */}
                        <View 
                            className={`px-4 py-2 flex-row justify-between items-center
                                ${sessionStatus === 'upcoming' ? 'bg-blue-600' : 
                                  sessionStatus === 'today' ? 'bg-green-600' : 'bg-primary'}
                            `}
                        >
                            <View className="flex-row items-center">
                                <Calendar size={16} color="white" />
                                <Text className="text-white font-medium ml-2">
                                    {formatSessionDate(session.date)}
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <View 
                                    className={`rounded-full px-3 py-1
                                        ${sessionStatus === 'upcoming' ? 'bg-blue-800' : 
                                          sessionStatus === 'today' ? 'bg-green-800' : 'bg-primary/80'}
                                    `}
                                >
                                    <Text className="text-white text-xs font-semibold">
                                        {sessionStatus === 'upcoming' ? 'Upcoming' : 
                                          sessionStatus === 'today' ? 'Today' : 'Past'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        
                        {/* Session content */}
                        <View className="p-4">
                            {/* Counselor info */}
                            <View className="flex-row items-center mb-3">
                                <Image 
                                    source={{ uri: session.counselorImage }}
                                    className="w-12 h-12 rounded-full"
                                />
                                <View className="ml-3 flex-1">
                                    <Text className="font-semibold text-gray-800">
                                        {session.counselorName}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Star size={14} color="#F59E0B" />
                                        <Text className="text-gray-600 text-sm ml-1">
                                            {session.rating} · {session.specialties.join(', ')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            
                            {/* Session details */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <Clock size={16} color="#4B5563" />
                                    <Text className="text-gray-600 ml-2">
                                        {formatSessionTime(session.date)} · {session.duration} minutes
                                    </Text>
                                </View>
                                
                                <View className="flex-row items-center mb-2">
                                    <View className="w-4 h-4 items-center justify-center mr-1">
                                        <Text className="font-bold text-green-600">Rs.</Text>
                                    </View>
                                    <Text className="text-gray-600 ml-1">
                                        Fee: {session.fee}
                                    </Text>
                                </View>
                                
                                {session.notes && (
                                    <Text className="text-gray-700 mt-2" numberOfLines={2}>
                                        {session.notes}
                                    </Text>
                                )}
                            </View>
                            
                            {/* Action buttons */}
                            <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
                                <TouchableOpacity 
                                    className="flex-row items-center justify-center py-2 px-2 bg-gray-100 rounded-lg flex-1 mr-2"
                                    onPress={() => handleViewCounselorProfile(session.counselorId)}
                                >
                                    <User size={16} color="#4B5563" />
                                    <Text className="text-gray-700 font-medium ml-1 text-sm">Profile</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    className="flex-row items-center justify-center py-2 px-2 bg-primary rounded-lg flex-1"
                                    onPress={() => handleChatWithCounselor(session.counselorId)}
                                >
                                    <MessageCircle size={16} color="white" />
                                    <Text className="text-white font-medium ml-1 text-sm">Chat</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                        );
                    })
                )}
                
                {/* Student Package Button */}
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