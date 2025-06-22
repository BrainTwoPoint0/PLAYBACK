import { supabase } from './supabase';

export interface UploadConfig {
  maxSize: number; // in bytes
  allowedTypes: readonly string[];
  maxDuration?: number; // for videos, in seconds
  quality?: number; // for image compression
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
  duration?: number; // for videos
  width?: number; // for images/videos
  height?: number; // for images/videos
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate?: number;
  codec?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

// Upload configurations
export const UPLOAD_CONFIGS = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    quality: 0.8,
  },
  thumbnail: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    quality: 0.7,
  },
  highlight: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'] as const,
    maxDuration: 300, // 5 minutes
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'] as const,
  },
} as const;

export class UploadService {
  private bucket: string;

  constructor(bucket: string = 'playback-media') {
    this.bucket = bucket;
  }

  // Validate file before upload
  private validateFile(
    file: File,
    config: UploadConfig
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > config.maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.formatBytes(config.maxSize)}`,
      };
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  // Format bytes to human readable format
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate unique file path
  private generateFilePath(file: File, userId: string, type: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    return `${userId}/${type}/${timestamp}-${randomId}.${extension}`;
  }

  // Upload file to Supabase Storage
  async uploadFile(
    file: File,
    userId: string,
    type: keyof typeof UPLOAD_CONFIGS,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const config = UPLOAD_CONFIGS[type];

    // Validate file
    const validation = this.validateFile(file, config);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate file path
    const filePath = this.generateFilePath(file, userId, type);

    try {
      // Upload file
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      // Get file metadata
      const metadata = await this.getFileMetadata(file, type);

      return {
        url: urlData.publicUrl,
        path: filePath,
        size: file.size,
        type: file.type,
        ...metadata,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get file metadata (dimensions, duration, etc.)
  private async getFileMetadata(
    file: File,
    type: string
  ): Promise<Partial<UploadResult>> {
    return new Promise((resolve) => {
      if (type === 'highlight' && file.type.startsWith('video/')) {
        // Get video metadata
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        };
        video.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('image/')) {
        // Get image metadata
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.src = URL.createObjectURL(file);
      } else {
        resolve({});
      }
    });
  }

  // Delete file from storage
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  // Generate thumbnail from video
  async generateVideoThumbnail(
    videoFile: File,
    userId: string,
    timeOffset: number = 0
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        video.currentTime = timeOffset;
      };

      video.onseeked = () => {
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const thumbnailFile = new File([blob], 'thumbnail.jpg', {
                  type: 'image/jpeg',
                });

                try {
                  const result = await this.uploadFile(
                    thumbnailFile,
                    userId,
                    'thumbnail'
                  );
                  resolve(result);
                } catch (error) {
                  reject(error);
                }
              } else {
                reject(new Error('Failed to generate thumbnail'));
              }
            },
            'image/jpeg',
            0.7
          );
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail generation'));
      };

      video.src = URL.createObjectURL(videoFile);
    });
  }

  // Compress image before upload
  async compressImage(
    file: File,
    quality: number = 0.8,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    userId: string,
    type: keyof typeof UPLOAD_CONFIGS,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadFile(
          files[i],
          userId,
          type,
          (fileProgress) => {
            if (onProgress) {
              const overallProgress =
                ((i + fileProgress / 100) / totalFiles) * 100;
              onProgress(overallProgress);
            }
          }
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload file ${files[i].name}:`, error);
        throw error;
      }
    }

    return results;
  }

  // Get storage usage for user
  async getUserStorageUsage(userId: string): Promise<{
    used: number;
    limit: number;
    files: number;
  }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list(userId, {
          limit: 1000,
        });

      if (error) {
        throw error;
      }

      let totalSize = 0;
      let fileCount = 0;

      for (const file of data || []) {
        if (file.metadata) {
          totalSize += file.metadata.size || 0;
          fileCount++;
        }
      }

      // Default limit: 1GB per user
      const limit = 1024 * 1024 * 1024;

      return {
        used: totalSize,
        limit,
        files: fileCount,
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return {
        used: 0,
        limit: 1024 * 1024 * 1024,
        files: 0,
      };
    }
  }

  // Clean up orphaned files
  async cleanupOrphanedFiles(
    userId: string,
    validPaths: string[]
  ): Promise<number> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list(userId, {
          limit: 1000,
        });

      if (error) {
        throw error;
      }

      const orphanedFiles = (data || []).filter(
        (file) => !validPaths.includes(`${userId}/${file.name}`)
      );

      if (orphanedFiles.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.bucket)
          .remove(orphanedFiles.map((file) => `${userId}/${file.name}`));

        if (deleteError) {
          console.error('Error deleting orphaned files:', deleteError);
        }
      }

      return orphanedFiles.length;
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error);
      return 0;
    }
  }
}

// Factory function to create upload service
export const createUploadService = (bucket?: string) =>
  new UploadService(bucket);

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
