// app/(tabs)/feed.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { fetchPosts, likePost, Post } from '../../api/Posts';
import TopBar from '../../components/TopBar';
import AddPostModal from '../components/AddPostModal';
import FeedCard from '../components/FeedCard';

export default function Feed() {
  const [activeTab, setActiveTab] = useState<'Recent' | 'Popular'>('Recent');
  const [shareText, setShareText] = useState('');
  const [currentNavTab, setCurrentNavTab] = useState<'home' | 'menu' | 'users' | 'settings'>('menu');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddPostModal, setShowAddPostModal] = useState(false);

  const fetchPostsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPosts();
      // Ensure we always have an array, even if empty
      setPosts(Array.isArray(data) ? data : []);
      
    } catch (err) {
      setError('Failed to load posts. Please try again.');
      console.error('Fetch error:', err);
      setPosts([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPostsData();
  }, [fetchPostsData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPostsData();
  }, [fetchPostsData]);

  const handleNavTabPress = useCallback((tab: 'home' | 'menu' | 'users' | 'settings') => {
    setCurrentNavTab(tab);
    console.log('Navigation tab pressed:', tab);
  }, []);

  const handleLikePost = useCallback(async (postId: string) => {
    try {
      // Optimistic UI update
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
      
      // Send request to backend
      await likePost(postId);
    } catch (error) {
      // Revert if error
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
      Alert.alert('Error', 'Failed to like post');
    }
  }, []);

  const handleCreatePost = useCallback(() => {
    setShowAddPostModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddPostModal(false);
  }, []);

  const handlePostSubmit = useCallback((newPost: Post) => {
    // Add the new post to the beginning of the posts array
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setShowAddPostModal(false);
    // Optionally show success message
    Alert.alert('Success', 'Post created successfully!');
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

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500 text-lg mb-4">{error}</Text>
        <TouchableOpacity 
          className="bg-blue-500 px-4 py-2 rounded"
          onPress={fetchPostsData}
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      {/* Top Bar */}
      <TopBar title="Feed" />

      {/* Tab Selector */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity 
          className={`flex-1 py-4 items-center ${activeTab === 'Recent' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setActiveTab('Recent')}
        >
          <Text className={`font-medium ${activeTab === 'Recent' ? 'text-blue-500' : 'text-gray-500'}`}>
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-4 items-center ${activeTab === 'Popular' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setActiveTab('Popular')}
        >
          <Text className={`font-medium ${activeTab === 'Popular' ? 'text-blue-500' : 'text-gray-500'}`}>
            Popular
          </Text>
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      {loading && posts.length === 0 ? (
        <View className="flex-1 justify-center items-center">
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
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center space-x-3 mb-3">
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg' }} 
                className="w-10 h-10 rounded-full"
              />
              <TouchableOpacity 
                className="flex-1 bg-gray-100 rounded-full px-4 py-2"
                onPress={handleCreatePost}
              >
                <Text className="text-gray-500">What&apos;s on your mind?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Posts List */}
          {filteredPosts.map(renderPost)}
        </ScrollView>
      )}

      {/* Add Post Modal */}
      <AddPostModal 
        visible={showAddPostModal}
        onClose={handleCloseModal}
        onSubmit={handlePostSubmit}
      />

      {/* Bottom Navigation */}
      {/* <BottomNavigation 
        activeTab={currentNavTab}
        onTabPress={handleNavTabPress}
      /> */}
    </View>
  );
}