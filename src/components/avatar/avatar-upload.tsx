'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  uploadAvatar,
  deleteAvatar,
  updateProfileAvatar,
  processImageFile,
  getOptimizedAvatarUrl,
} from '@/lib/avatar/utils';
import {
  Upload,
  X,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
} from 'lucide-react';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  fullName: string;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  fullName,
  onAvatarUpdate,
  size = 'md',
  disabled = false,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-16 h-16', icon: 'h-6 w-6', text: 'text-xs' },
    md: { container: 'w-24 h-24', icon: 'h-8 w-8', text: 'text-sm' },
    lg: { container: 'w-32 h-32', icon: 'h-12 w-12', text: 'text-base' },
  };

  const config = sizeConfig[size];

  // Clear messages after timeout
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setUploadError(null);
      setUploadSuccess(false);
    }, 3000);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      try {
        // Process image (resize and optimize)
        const processedFile = await processImageFile(file, 400, 400, 0.8);

        // Upload to storage
        const uploadResult = await uploadAvatar(processedFile, userId);

        if (!uploadResult.success) {
          setUploadError(uploadResult.error || 'Upload failed');
          clearMessages();
          return;
        }

        // Update profile in database
        const updateResult = await updateProfileAvatar(
          userId,
          uploadResult.url!
        );

        if (!updateResult.success) {
          setUploadError(updateResult.error || 'Failed to update profile');
          clearMessages();
          return;
        }

        // Success - update parent component
        onAvatarUpdate(uploadResult.url!);
        setUploadSuccess(true);
        clearMessages();
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : 'Upload failed'
        );
        clearMessages();
      } finally {
        setIsUploading(false);
      }
    },
    [userId, onAvatarUpdate, disabled, clearMessages]
  );

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      setUploadError('Please drop a valid image file');
      clearMessages();
    }
  };

  // Handle avatar deletion
  const handleDelete = async () => {
    if (!currentAvatarUrl || disabled) return;

    setIsDeleting(true);
    setUploadError(null);

    try {
      // Delete from storage
      const deleteResult = await deleteAvatar(currentAvatarUrl);
      if (!deleteResult.success) {
        setUploadError(deleteResult.error || 'Failed to delete avatar');
        clearMessages();
        return;
      }

      // Update profile in database
      const updateResult = await updateProfileAvatar(userId, null);
      if (!updateResult.success) {
        setUploadError(updateResult.error || 'Failed to update profile');
        clearMessages();
        return;
      }

      // Success - update parent component
      onAvatarUpdate(null);
      setUploadSuccess(true);
      clearMessages();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Failed to delete avatar'
      );
      clearMessages();
    } finally {
      setIsDeleting(false);
    }
  };

  const avatarUrl = getOptimizedAvatarUrl(currentAvatarUrl, fullName, 200);
  const hasCustomAvatar =
    currentAvatarUrl && !currentAvatarUrl.includes('dicebear');

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex items-center gap-4">
        <div
          className={`${config.container} relative rounded-full overflow-hidden bg-neutral-800 border-2 ${
            dragActive ? 'border-green-400 border-dashed' : 'border-neutral-600'
          } ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } transition-all hover:border-green-400`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          {/* Avatar Image */}
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />

          {/* Upload Overlay */}
          {!disabled && (
            <div
              className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity ${
                dragActive ? 'opacity-100' : ''
              }`}
            >
              {isUploading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Camera className={`${config.icon} text-white`} />
              )}
            </div>
          )}

          {/* Success Indicator */}
          {uploadSuccess && (
            <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
              <CheckCircle className={`${config.icon} text-white`} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading || isDeleting}
            className="flex items-center gap-2 border-neutral-600 hover:bg-neutral-800"
            style={{ color: 'var(--ash-grey)' }}
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {hasCustomAvatar ? 'Change' : 'Upload'}
              </>
            )}
          </Button>

          {hasCustomAvatar && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={disabled || isUploading || isDeleting}
              className="flex items-center gap-2 border-red-600 text-red-400 hover:bg-red-900/20"
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Guidelines */}
      <div className="text-xs space-y-1" style={{ color: 'var(--ash-grey)' }}>
        <p>• Drag and drop an image or click to browse</p>
        <p>• Supports JPEG, PNG, WebP, GIF up to 5MB</p>
        <p>• Images will be automatically resized to 400x400px</p>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className={config.text}>{uploadError}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setUploadError(null)}
            className="ml-auto p-1 h-auto hover:bg-red-800/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-3 py-2 rounded-lg border border-green-800">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className={config.text}>
            Avatar {hasCustomAvatar ? 'updated' : 'uploaded'} successfully!
          </span>
        </div>
      )}
    </div>
  );
}

// Simplified Avatar Display Component
export function AvatarDisplay({
  avatarUrl,
  fullName,
  size = 'md',
  className = '',
}: {
  avatarUrl?: string | null;
  fullName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const displayUrl = getOptimizedAvatarUrl(avatarUrl, fullName, 200);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-neutral-800 border border-neutral-600 flex-shrink-0 ${className}`}
    >
      <img
        src={displayUrl}
        alt={fullName}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
