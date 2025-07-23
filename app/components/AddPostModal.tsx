// app/components/AddPostModal.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createPost, Post } from '../../api/Posts';

interface AddPostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (post: Post) => void;
}

const AddPostModal: React.FC<AddPostModalProps> = ({ visible, onClose, onSubmit }) => {
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    if (!loading) {
      setPostText('');
      setSelectedImage(null);
      onClose();
    }
  }, [loading, onClose]);

  const handleImagePicker = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to add images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!postText.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    try {
      setLoading(true);
      
      // Create post data
      const postData = {
        content: postText.trim(),
        image: selectedImage,
      };

      // Call API to create post
      const newPost = await createPost(postData);
      
      // Call parent callback with new post
      onSubmit(newPost);
      
      // Reset form
      setPostText('');
      setSelectedImage(null);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
      console.error('Create post error:', error);
    } finally {
      setLoading(false);
    }
  }, [postText, selectedImage, onSubmit]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <TouchableOpacity 
            onPress={handleClose}
            disabled={loading}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold">Create Post</Text>
          
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading || (!postText.trim() && !selectedImage)}
            className={`px-4 py-2 rounded-full ${
              loading || (!postText.trim() && !selectedImage) 
                ? 'bg-gray-300' 
                : 'bg-blue-500'
            }`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className={`font-medium ${
                loading || (!postText.trim() && !selectedImage) 
                  ? 'text-gray-500' 
                  : 'text-white'
              }`}>
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View className="flex-row items-center p-4">
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg' }} 
              className="w-12 h-12 rounded-full mr-3"
            />
            <View>
              <Text className="font-semibold text-base">John Doe</Text>
            </View>
          </View>

          {/* Post Content Input */}
          <View className="px-4 relative">
            <TextInput
              className="text-base text-gray-800 min-h-[120px]"
              placeholder="What's on your mind?"
              placeholderTextColor="#999"
              multiline
              value={postText}
              onChangeText={setPostText}
              style={{ textAlignVertical: 'top', paddingRight: 40 }} // Added padding for the icon
              editable={!loading}
            />
            {/* Add image icon near cursor */}
            <TouchableOpacity 
              onPress={handleImagePicker}
              disabled={loading}
              className="absolute right-4 top-2 p-2"
            >
              <Ionicons name="image" size={24} color="#22C55E" />
            </TouchableOpacity>
          </View>

          {/* Selected Image */}
          {selectedImage && (
            <View className="mx-4 mt-4">
              <View className="relative">
                <Image 
                  source={{ uri: selectedImage }}
                  className="w-full h-64 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  onPress={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2"
                  disabled={loading}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddPostModal;