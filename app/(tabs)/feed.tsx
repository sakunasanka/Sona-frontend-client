import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StatusBar,
  TextInput,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import FeedCard from '../components/FeedCard';
import { Search, PlusCircle, MoreHorizontal } from 'lucide-react-native';

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    badge: 'User' | 'Premium';
  };
  timeAgo: string;
  content: string;
  hashtags: string[];
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  backgroundColor: string;
  liked: boolean;
}

export default function Feed() {
  const [activeTab, setActiveTab] = useState<'Recent' | 'Popular'>('Recent');
  const [currentNavTab, setCurrentNavTab] = useState<'home' | 'menu' | 'users' | 'settings'>('menu');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 800);
  }, []);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [fetchPosts]);

  const handleNavTabPress = useCallback((tab: 'home' | 'menu' | 'users' | 'settings') => {
    setCurrentNavTab(tab);
  }, []);

  const handleLikePost = useCallback((postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              liked: !post.liked,
              stats: {
                ...post.stats,
                likes: post.liked ? post.stats.likes - 1 : post.stats.likes + 1
              }
            } 
          : post
      )
    );
  }, []);

  const renderPost = useCallback((post: Post) => (
    <FeedCard 
      key={post.id}
      post={post}
      onLikePress={handleLikePost}
    />
  ), [handleLikePost]);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'Popular') {
      return [...posts].sort((a, b) => b.stats.likes - a.stats.likes);
    }
    return posts;
  }, [activeTab, posts]);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-semibold text-gray-900">Feed</Text>
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity>
            <Search size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity>
            <MoreHorizontal size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View className="flex-row bg-white border-b border-gray-100">
        <TouchableOpacity 
          className={`flex-1 py-3 items-center ${activeTab === 'Recent' ? 'border-b-2 border-primary' : ''}`}
          onPress={() => setActiveTab('Recent')}
        >
          <Text className={`text-sm font-medium ${activeTab === 'Recent' ? 'text-primary' : 'text-gray-500'}`}>
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center ${activeTab === 'Popular' ? 'border-b-2 border-primary' : ''}`}
          onPress={() => setActiveTab('Popular')}
        >
          <Text className={`text-sm font-medium ${activeTab === 'Popular' ? 'text-primary' : 'text-gray-500'}`}>
            Popular
          </Text>
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      {loading && posts.length === 0 ? (
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
        >
          {/* Create Post */}
          <View className="p-4 bg-white mb-2">
            <View className="flex-row items-center space-x-3">
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg' }} 
                className="w-10 h-10 rounded-full"
              />
              <TouchableOpacity 
                className="flex-1 bg-gray-100 rounded-full px-4 py-2"
                onPress={() => console.log('Create post pressed')}
              >
                <Text className="text-gray-500">Share your thoughts...</Text>
              </TouchableOpacity>
              <TouchableOpacity className="ml-2">
                <PlusCircle size={24} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Posts List */}
          <View className="space-y-2">
            {filteredPosts.map(renderPost)}
          </View>
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={currentNavTab}
        onTabPress={handleNavTabPress}
      />
    </View>
  );
}

// Mock data (same as before)
const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      name: 'Uzumaki Naruto',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      badge: 'User'
    },
    timeAgo: '2 hours ago',
    content: `Today i visited my favourite ramen shop which is "Ichiraku Ramen" Like always i forgot to bought money 😅😅

Old man Teuchi just laughed and said, "You again?" Luckily, he let me eat on credit—again 😅. I got my usual miso pork with extra toppings, and man, it hit the spot! 😋

Even when life gets rough or training wears me down, Ichiraku always feels like home. It's not just about the food—it's about that warmth, that small moment of peace.

Sometimes, little comforts like this help me keep going. 😊✨`,
    hashtags: ['#RamenTherapy', '#SmallJoys', '#BelieveIt'],
    stats: {
      views: 2345,
      likes: 1678,
      comments: 102
    },
    backgroundColor: '#FFE4E6',
    liked: false
  },
  {
    id: '2',
    author: {
      name: 'Sakura Haruno',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      badge: 'Premium'
    },
    timeAgo: '5 hours ago',
    content: `Just finished my medical training session with Lady Tsunade! 💪 Learned some amazing new healing techniques today. 

The human body is so complex, but understanding it helps me become a better medic ninja. Can't wait to put these skills to use! 

PS: Naruto, if you're reading this - please stop getting injured so much! 😤`,
    hashtags: ['#MedicNinja', '#Training', '#HealingHands'],
    stats: {
      views: 1890,
      likes: 1243,
      comments: 87
    },
    backgroundColor: '#E0F2FE',
    liked: true
  },
  {
    id: '3',
    author: {
      name: 'Kakashi Hatake',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
      badge: 'Premium'
    },
    timeAgo: '1 day ago',
    content: `Found a new spot to read my book today. Perfect shade, quiet, and no distractions. 

Though I might have to find a new place tomorrow... Naruto has a knack for finding me when I least expect it. 

*flips page*`,
    hashtags: ['#Reading', '#PeaceAndQuiet', '#MakeOutTactics'],
    stats: {
      views: 3210,
      likes: 2456,
      comments: 156
    },
    backgroundColor: '#ECFDF5',
    liked: false
  }
];