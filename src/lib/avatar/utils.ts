import { createClient } from '@/lib/supabase/client';

// Types
export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface AvatarDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<AvatarUploadResult> {
  try {
    const supabase = createClient();

    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please use JPEG, PNG, WebP, or GIF.',
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large. Maximum size is 5MB.',
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('playback-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || 'Failed to upload avatar',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('playback-avatars')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      return {
        success: false,
        error: 'Failed to get avatar URL',
      };
    }

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete existing avatar from storage
 */
export async function deleteAvatar(
  avatarUrl: string
): Promise<AvatarDeleteResult> {
  try {
    const supabase = createClient();

    // Extract file path from URL
    const url = new URL(avatarUrl);
    const pathMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/playback-avatars\/(.+)$/
    );

    if (!pathMatch) {
      return {
        success: false,
        error: 'Invalid avatar URL format',
      };
    }

    const filePath = pathMatch[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from('playback-avatars')
      .remove([filePath]);

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete avatar',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete avatar',
    };
  }
}

/**
 * Update user profile with new avatar URL
 */
export async function updateProfileAvatar(
  userId: string,
  avatarUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await (supabase.from('profiles') as any)
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

/**
 * Process image file before upload (resize and optimize)
 */
export function processImageFile(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'));
            return;
          }

          // Create new file with processed data
          const processedFile = new File([blob], file.name, {
            type: 'image/jpeg', // Convert to JPEG for better compression
            lastModified: Date.now(),
          });

          resolve(processedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate avatar placeholder URL based on user initials
 */
export function generateAvatarPlaceholder(
  fullName: string,
  size: number = 200
): string {
  const initials = fullName
    .split(' ')
    .map((name) => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  // Using DiceBear API for consistent avatar generation
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}&size=${size}&backgroundColor=00ff88&textColor=ffffff`;
}

/**
 * Get optimized avatar URL with size parameter
 */
export function getOptimizedAvatarUrl(
  avatarUrl: string | null | undefined,
  fullName: string,
  size: number = 200
): string {
  if (!avatarUrl) {
    return generateAvatarPlaceholder(fullName, size);
  }

  // If it's a Supabase storage URL, we could add transformation parameters
  // For now, return the original URL
  return avatarUrl;
}
