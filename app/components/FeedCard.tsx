import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Eye, Heart, MessageCircle, MoreHorizontal } from 'lucide-react-native';

interface FeedCardProps {
  post: {
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
  };
  onLikePress: (postId: string) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ post, onLikePress }) => {
  return (
    <View 
      className="rounded-2xl p-5 mb-4 shadow-lg shadow-black/10" 
      style={{ backgroundColor: post.backgroundColor }}
    >
      {/* Post Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center flex-1">
          <Image 
            source={{ uri: post.author.avatar }} 
            className="w-10 h-10 rounded-full mr-3"
            resizeMode="cover"
          />
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-800">{post.author.name}</Text>
            <Text className="text-sm text-gray-500 mt-0.5">{post.timeAgo}</Text>
          </View>
        </View>
        <View className={`px-3 py-1.5 rounded-xl ${post.author.badge === 'Premium' ? 'bg-amber-400' : 'bg-blue-400'}`}>
          <Text className="text-xs font-semibold text-white">{post.author.badge}</Text>
        </View>
        <TouchableOpacity className="ml-2">
          <MoreHorizontal size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text className="text-base leading-6 text-gray-800 mb-4">{post.content}</Text>

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <View className="flex-row flex-wrap mb-4">
          {post.hashtags.map((hashtag, index) => (
            <Text key={index} className="text-sm text-amber-600 mr-2 mb-1">{hashtag}</Text>
          ))}
        </View>
      )}

      {/* Post Stats */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <Eye size={18} color="#6B7280" />
          <Text className="text-sm text-gray-500 ml-2 font-medium">{formatNumber(post.stats.views)}</Text>
        </View>
        <TouchableOpacity 
          className="flex-row items-center flex-1"
          onPress={() => onLikePress(post.id)}
        >
          <Heart 
            size={18} 
            color={post.liked ? '#EF4444' : '#6B7280'} 
            fill={post.liked ? '#EF4444' : 'transparent'} 
          />
          <Text className={`text-sm ml-2 font-medium ${post.liked ? 'text-red-500' : 'text-gray-500'}`}>
            {formatNumber(post.stats.likes)}
          </Text>
        </TouchableOpacity>
        <View className="flex-row items-center flex-1">
          <MessageCircle size={18} color="#6B7280" />
          <Text className="text-sm text-gray-500 ml-2 font-medium">{formatNumber(post.stats.comments)}</Text>
        </View>
      </View>
    </View>
  );
};

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export default FeedCard;