// app/(tabs)/feed.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { fetchPosts, getPostLikeStatus, incrementPostView, Post, toggleLikePost } from '../../api/Posts';
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
  // Track which posts have already been counted for views during this session
  const viewedPostsRef = useRef<Set<string>>(new Set());
  const viewTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchPostsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPosts();
      // Only show approved posts
      const approved = (Array.isArray(data) ? data : []).filter(p => (p.status ?? 'approved') === 'approved');
      // Load like status for each post
      const withStatus: Post[] = await Promise.all(
        approved.map(async (p) => {
          try {
            const s = await getPostLikeStatus(p.id);
            return { ...p, liked: s.liked, stats: { ...p.stats, likes: s.likes, views: s.views } } as Post;
          } catch (e) {
            return p;
          }
        })
      );
      setPosts(withStatus);
      
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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(viewTimersRef.current).forEach((t) => clearTimeout(t));
      viewTimersRef.current = {} as Record<string, ReturnType<typeof setTimeout>>;
    };
  }, []);

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
      // Optimistic toggle
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        liked: !p.liked,
        stats: { ...p.stats, likes: p.liked ? Math.max(0, p.stats.likes - 1) : p.stats.likes + 1 }
      } : p));

      // Toggle on server and reconcile
      const result = await toggleLikePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        liked: result.liked,
        stats: { ...p.stats, likes: result.likes, ...(typeof result.views !== 'undefined' ? { views: result.views } : {}) }
      } : p));
    } catch (error) {
      // Revert if error
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        liked: !p.liked,
        stats: { ...p.stats, likes: p.liked ? Math.max(0, p.stats.likes - 1) : p.stats.likes + 1 }
      } : p));
      Alert.alert('Error', 'Failed to like post');
    }
  }, []);

  const handleCreatePost = useCallback(() => {
    setShowAddPostModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddPostModal(false);
  }, []);

  const handlePostSubmit = useCallback((_newPost: Post) => {
    // Don't display newly created posts (they go for admin approval)
    setShowAddPostModal(false);
    Alert.alert('Sent for Approval', 'Your post was sent for admin approval and will appear once approved.');
  }, []);

  const renderItem = useCallback(({ item }: { item: Post }) => (
    <FeedCard post={item} onLikePress={handleLikePost} />
  ), [handleLikePost]);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'Popular') {
      return [...posts]
        .filter(p => p.status === 'approved')
        .sort((a, b) => b.stats.likes - a.stats.likes);
    }
    return posts.filter(p => p.status === 'approved');
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

  // Viewability config and handler for 2-second view threshold
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    viewableItems.forEach((vi) => {
      const postId: string | undefined = vi?.item?.id;
      const isViewable: boolean = !!vi?.isViewable;
      if (!postId) return;
      if (isViewable && !viewedPostsRef.current.has(postId)) {
        // Start a 2s timer to count as a view
        if (viewTimersRef.current[postId]) {
          clearTimeout(viewTimersRef.current[postId]);
        }
        viewTimersRef.current[postId] = setTimeout(async () => {
          // Double-check still not counted
          if (viewedPostsRef.current.has(postId)) return;
          viewedPostsRef.current.add(postId);
          // Optimistically update UI
          setPosts(prev => prev.map(p => p.id === postId ? {
            ...p,
            stats: { ...p.stats, views: (p.stats?.views ?? 0) + 1 }
          } : p));
          // Call API; if it returns a views count, reconcile
          const newViews = await incrementPostView(postId);
          if (typeof newViews === 'number' && !Number.isNaN(newViews)) {
            setPosts(prev => prev.map(p => p.id === postId ? {
              ...p,
              stats: { ...p.stats, views: newViews }
            } : p));
          }
        }, 2000);
      } else if (!isViewable && viewTimersRef.current[postId]) {
        // Cancel timer if scrolled away before 2s
        clearTimeout(viewTimersRef.current[postId]);
        delete viewTimersRef.current[postId];
      }
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 0, // we'll handle 2s ourselves via timers
  }).current;

  return (
    <View className="flex-1 bg-white">
  <StatusBar barStyle="dark-content" />
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
        <FlatList
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
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
          }
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
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