import { Eye, Heart, MoreHorizontal, Share2 } from 'lucide-react-native';
import React from 'react';
import { Image, Share, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../../api/Posts';

interface FeedCardProps {
  post: Post;
  onLikePress: (postId: string) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ post, onLikePress }) => {
  const handleShare = async () => {
    try {
      const parts: string[] = [];
      if (post.content) parts.push(post.content);
      if (post.hashtags?.length) parts.push(post.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' '));
      if (post.image) parts.push(post.image);
      const message = parts.filter(Boolean).join('\n\n');
      await Share.share({ message });
    } catch (e) {
      // no-op on cancel/error
    }
  };
  return (
    <View 
      className="rounded-2xl p-5 mb-4 shadow-lg shadow-black/10 bg-white"
    >
      {/* Post Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center flex-1">
          {!post.isAnonymous && (
            <Image 
              source={{ uri: post.author.avatar }} 
              className="w-10 h-10 rounded-full mr-3"
              resizeMode="cover"
            />
          )}
          {post.isAnonymous && (
            <View className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center">
              <Text className="text-gray-600 font-bold text-lg">?</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-800">
              {post.isAnonymous ? 'Anonymous' : post.author.name}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">{post.timeAgo}</Text>
          </View>
        </View>
        {!post.isAnonymous && (
          <View
            className={`px-3 py-1.5 rounded-xl ${
              post.author.role === 'Counselor'
                ? 'bg-blue-400'
                : post.author.role === 'Psychiatrist'
                ? 'bg-purple-500'
                : post.author.role === 'Admin'
                ? 'bg-amber-500'
                : 'bg-gray-400'
            }`}
          >
            <Text className="text-xs font-semibold text-white">{post.author.role}</Text>
          </View>
        )}
        {/* <TouchableOpacity className="ml-2">
          <MoreHorizontal size={20} color="#6B7280" />
        </TouchableOpacity> */}
      </View>

      {/* Post Content */}
      <Text className="text-base leading-6 text-gray-800 mb-4">{post.content}</Text>

      {/* Post Image */}
      {post.image ? (
        <Image
          source={{ uri: post.image }}
          className="w-full h-52 rounded-xl mb-4"
          resizeMode="cover"
        />
      ) : null}

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
        <TouchableOpacity className="flex-row items-center flex-1" onPress={handleShare}>
          <Share2 size={18} color="#6B7280" />
        </TouchableOpacity>
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