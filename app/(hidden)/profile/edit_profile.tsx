import { getProfile, ProfileData, updateProfile } from '@/api/auth';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Check, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface UserData {
  name: string;
  nickname: string;
  dob: string;
  email: string;
}

export default function EditProfile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cloudinaryImageUrl, setCloudinaryImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        setProfileData(profile);
        setCloudinaryImageUrl(profile.avatar);
      } catch (error) {
        console.log('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setSelectedImage(localUri);
        
        // Upload to Cloudinary
        setImageUploading(true);
        try {
          const uploadResult = await uploadImageToCloudinary(localUri, 'client_profile');
          setCloudinaryImageUrl(uploadResult.secure_url);
          console.log('Profile image uploaded to Cloudinary:', uploadResult.secure_url);
        } catch (uploadError) {
          console.log('Cloudinary upload failed:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
          setCloudinaryImageUrl(profileData?.avatar || null);
        } finally {
          setImageUploading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setSelectedImage(null);
            setCloudinaryImageUrl(null);
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!profileData) return;

    if (imageUploading) {
      Alert.alert('Please wait', 'Image is still uploading. Please wait for upload to complete.');
      return;
    }

    setSaving(true);
    
    try {
      // Determine avatar value: empty string if removed, cloudinary URL if uploaded, or existing avatar
      const avatarValue = cloudinaryImageUrl === null ? "" : (cloudinaryImageUrl || profileData.avatar || "");
      
      await updateProfile({
        name: profileData.name,
        nickName: profileData.nickName,
        avatar: avatarValue,
      });
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text>Failed to load profile</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="p-2"
          >
            <ArrowLeft size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Check size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Profile Picture */}
        <View className="items-center py-6 border-b border-gray-200">
          <View className="relative mb-4">
            <Image 
              source={{ uri: selectedImage || cloudinaryImageUrl || 'https://images.icon-icons.com/1378/PNG/512/avatardefault_92824.png' }} 
              className="w-32 h-32 rounded-full border-4 border-gray-200"
            />
            <View className="absolute bottom-0 right-0 flex-row gap-2">
              <TouchableOpacity 
                className="bg-primary rounded-full w-8 h-8 justify-center items-center"
                onPress={handleImagePicker}
                disabled={imageUploading}
              >
                <Camera size={16} color="white" />
              </TouchableOpacity>
              {(selectedImage || cloudinaryImageUrl) && (
                <TouchableOpacity 
                  className="bg-red-500 rounded-full w-8 h-8 justify-center items-center"
                  onPress={handleRemoveImage}
                  disabled={imageUploading}
                >
                  <Trash2 size={16} color="white" />
                </TouchableOpacity>
              )}
            </View>
            {imageUploading && (
              <View className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <Text className="text-white text-xs">Uploading...</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-500 text-center">
            Tap the camera to change your photo{cloudinaryImageUrl ? '\nTap the trash to remove your photo' : ''}
          </Text>
        </View>

        {/* Edit Form */}
        <View className="p-5">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Personal Information</Text>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-2">Full Name</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-200 text-sm"
              value={profileData.name}
              onChangeText={(text) => setProfileData({...profileData, name: text})}
              placeholder="Enter your full name"
              editable={!saving}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-2">Nickname</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-200 text-sm"
              value={profileData.nickName}
              onChangeText={(text) => setProfileData({...profileData, nickName: text})}
              placeholder="Enter your nickname"
              editable={!saving}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-2">Email</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-200 text-sm"
              value={profileData.email}
              editable={false}
              placeholder="Your email"
            />
          </View>
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || imageUploading}
              className={`flex-1 py-3 rounded-xl ${
                saving || imageUploading 
                  ? 'bg-gray-400' 
                  : 'bg-primary'
              }`}
            >
              <Text className="text-white font-semibold text-center">
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}