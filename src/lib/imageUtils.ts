import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a data URL (base64 image) to Firebase Storage
 * @param dataUrl - The data URL from a file input or canvas
 * @param path - The storage path (e.g., 'list-covers/userId_timestamp.jpg')
 * @returns The download URL for the uploaded image
 */
export async function uploadImageToStorage(dataUrl: string, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    
    // Upload the data URL
    await uploadString(storageRef, dataUrl, 'data_url');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Generate a unique filename for an image
 * @param userId - The user's ID
 * @param prefix - Optional prefix (e.g., 'list-cover', 'book-cover')
 * @returns A unique filename
 */
export function generateImageFilename(userId: string, prefix: string = 'image'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}/${userId}_${timestamp}_${random}.jpg`;
}