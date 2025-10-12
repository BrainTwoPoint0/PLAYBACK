import { createClient } from '../supabase/client';

export interface VideoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface VideoMetadata {
  duration: number;
  size: number;
  format: string;
  thumbnail?: string;
}

/**
 * Upload video file to Supabase Storage
 */
export async function uploadVideo(
  file: File,
  userId: string
): Promise<VideoUploadResult> {
  const supabase = createClient();

  try {
    // Validate file
    const validationResult = validateVideoFile(file);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error,
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('playback-highlights')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('playback-highlights')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Validate video file
 */
export function validateVideoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo', // .avi
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        'Invalid file type. Please upload MP4, WebM, OGG, MOV, or AVI files.',
    };
  }

  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File is too large. Maximum size is 100MB.',
    };
  }

  return { valid: true };
}

/**
 * Extract video metadata
 */
export function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        size: file.size,
        format: file.type,
      });
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Generate video thumbnail and upload to storage
 */
export async function generateVideoThumbnail(
  file: File,
  userId: string,
  timeInSeconds = 1
): Promise<string | null> {
  try {
    console.log('Starting thumbnail generation for:', file.name);

    // Generate thumbnail as blob
    const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        console.log('Video metadata loaded:', {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(timeInSeconds, video.duration / 2);
      };

      video.onseeked = () => {
        console.log('Video seeked to:', video.currentTime);

        if (ctx) {
          ctx.drawImage(video, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log('Thumbnail blob created:', blob.size, 'bytes');
                resolve(blob);
              } else {
                console.error('Failed to create thumbnail blob');
                reject(new Error('Failed to create thumbnail blob'));
              }
            },
            'image/jpeg',
            0.8
          );
        } else {
          console.error('Failed to create canvas context');
          reject(new Error('Failed to create canvas context'));
        }
      };

      video.onerror = (e) => {
        console.error('Video error during thumbnail generation:', e);
        reject(new Error('Failed to load video for thumbnail'));
      };

      video.src = URL.createObjectURL(file);
      console.log('Video element created with src');
    });

    console.log('Uploading thumbnail to storage...');

    // Upload thumbnail to storage
    const supabase = createClient();
    const fileName = `${userId}/thumbnails/${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('playback-highlights')
      .upload(fileName, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Failed to upload thumbnail:', error);
      return null;
    }

    console.log('Thumbnail uploaded successfully:', fileName);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('playback-highlights')
      .getPublicUrl(fileName);

    console.log('Thumbnail public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return null;
  }
}

/**
 * Generate video thumbnail as data URL (for preview only)
 */
export function generateVideoThumbnailPreview(
  file: File,
  timeInSeconds = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = Math.min(timeInSeconds, video.duration / 2);
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      } else {
        reject(new Error('Failed to create canvas context'));
      }
    };

    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
