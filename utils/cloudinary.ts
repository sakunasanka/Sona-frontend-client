// utils/cloudinary.ts
import { VITE_CLOUDINARY_API_KEY, VITE_CLOUDINARY_CLOUD_NAME } from '../config/env';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload image to Cloudinary
 * @param imageUri - Local image URI from ImagePicker
 * @param folder - Cloudinary folder name (e.g., 'blog_posts', 'profile_pictures')
 * @returns Promise<CloudinaryUploadResult>
 */
export const uploadImageToCloudinary = async (
  imageUri: string, 
  folder: string = 'blog_posts'
): Promise<CloudinaryUploadResult> => {
  try {
    // Create FormData
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
    
    // Append image file
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    } as any);
    
    // Cloudinary upload parameters
    formData.append('upload_preset', 'ml_default'); // You may need to create this in Cloudinary
    formData.append('folder', folder);
    formData.append('api_key', VITE_CLOUDINARY_API_KEY);
    
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload error:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.secure_url) {
      throw new Error('Upload succeeded but no URL returned');
    }
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
    };
    
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

/**
 * Generate Cloudinary transformation URL
 * @param publicId - Cloudinary public_id
 * @param transformations - Transformation string (e.g., 'w_300,h_300,c_fill')
 * @returns Transformed image URL
 */
export const getCloudinaryUrl = (publicId: string, transformations?: string): string => {
  const baseUrl = `https://res.cloudinary.com/${VITE_CLOUDINARY_CLOUD_NAME}/image/upload/`;
  
  if (transformations) {
    return `${baseUrl}${transformations}/${publicId}`;
  }
  
  return `${baseUrl}${publicId}`;
};

/**
 * Delete image from Cloudinary
 * @param publicId - Cloudinary public_id to delete
 * @returns Promise<boolean>
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    // Note: Deletion typically requires server-side implementation due to API secret
    // This is a placeholder for future implementation
    console.warn('Image deletion should be handled server-side for security');
    return false;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};