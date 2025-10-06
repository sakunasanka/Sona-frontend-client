// app/components/AddPostModal.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { createPost, Post } from '../../api/Posts';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

interface AddPostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (post: Post) => void;
}

const AddPostModal: React.FC<AddPostModalProps> = ({ visible, onClose, onSubmit }) => {
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cloudinaryImageUrl, setCloudinaryImageUrl] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleClose = useCallback(() => {
    if (!loading && !imageUploading) {
      setPostText('');
      setSelectedImage(null);
      setCloudinaryImageUrl(null);
      setHashtags('');
      setIsAnonymous(false);
      onClose();
    }
  }, [loading, imageUploading, onClose]);

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
        const localUri = result.assets[0].uri;
        setSelectedImage(localUri);
        
        // Upload to Cloudinary
        setImageUploading(true);
        try {
          const uploadResult = await uploadImageToCloudinary(localUri, 'blog_posts');
          setCloudinaryImageUrl(uploadResult.secure_url);
          console.log('Image uploaded to Cloudinary:', uploadResult.secure_url);
        } catch (uploadError) {
          console.error('Cloudinary upload failed:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload image. You can still post but the image won\'t be saved.');
          setCloudinaryImageUrl(null);
        } finally {
          setImageUploading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      setImageUploading(false);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setCloudinaryImageUrl(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    if (imageUploading) {
      Alert.alert('Please wait', 'Image is still uploading. Please wait for upload to complete.');
      return;
    }

    setLoading(true);
    
    try {
      const hashtagsArray = hashtags
        .split(' ')
        .filter((tag) => tag.trim().length > 0)
        .map((tag) => tag.startsWith('#') ? tag : `#${tag}`);

      const post = await createPost({
        content: postText.trim(),
        image: cloudinaryImageUrl, // Use Cloudinary URL instead of local URI
        hashtags: hashtagsArray,
        isAnonymous: isAnonymous,
      });
      
      onSubmit(post);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  }, [postText, cloudinaryImageUrl, hashtags, isAnonymous, handleClose, imageUploading, onSubmit]);  return (
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
            disabled={loading || imageUploading || (!postText.trim() && !selectedImage)}
            className={`px-4 py-2 rounded-full ${
              loading || imageUploading || (!postText.trim() && !selectedImage) 
                ? 'bg-gray-300' 
                : 'bg-blue-500'
            }`}
          >
            {loading || imageUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className={`font-medium ${
                loading || imageUploading || (!postText.trim() && !selectedImage) 
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
              style={{ textAlignVertical: 'top' }}
              editable={!loading}
            />
          </View>

          {/* Media Options */}
          <View className="px-4 mt-4">
            <View className="flex-row items-center space-x-4">
              <TouchableOpacity 
                onPress={handleImagePicker}
                disabled={loading || imageUploading}
                className={`p-3 rounded-lg ${
                  loading || imageUploading ? 'bg-gray-100' : 'bg-gray-50'
                }`}
              >
                <Ionicons 
                  name="image" 
                  size={24} 
                  color={loading || imageUploading ? "#9CA3AF" : "#22C55E"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hashtags input (optional) */}
          <View className="px-4 mt-2">
            <TextInput
              className="text-base text-gray-800"
              placeholder="Add hashtags (e.g., #wellness #mindfulness)"
              placeholderTextColor="#999"
              value={hashtags}
              onChangeText={setHashtags}
              editable={!loading}
            />
          </View>

          {/* Anonymous checkbox */}
          <View className="px-4 mt-4">
            <TouchableOpacity 
              onPress={() => setIsAnonymous(!isAnonymous)}
              disabled={loading}
              className="flex-row items-center"
            >
              <View className={`w-5 h-5 mr-3 rounded border-2 ${
                isAnonymous 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-gray-300'
              } flex items-center justify-center`}>
                {isAnonymous && (
                  <Ionicons name="checkmark" size={12} color="white" />
                )}
              </View>
              <Text className="text-base text-gray-700">Post anonymously</Text>
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
                
                {/* Upload overlay */}
                {imageUploading && (
                  <View className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <ActivityIndicator size="large" color="white" />
                    <Text className="text-white text-sm mt-2">Uploading image...</Text>
                  </View>
                )}
                
                {/* Success indicator */}
                {cloudinaryImageUrl && !imageUploading && (
                  <View className="absolute bottom-2 left-2 bg-green-500 rounded-full p-1">
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
                
                <TouchableOpacity 
                  onPress={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2"
                  disabled={loading || imageUploading}
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