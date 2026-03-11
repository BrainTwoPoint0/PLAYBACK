'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@braintwopoint0/playback-commons/ui';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeConfig = {
    sm: { container: 'w-16 h-16', icon: 'h-6 w-6' },
    md: { container: 'w-24 h-24', icon: 'h-8 w-8' },
    lg: { container: 'w-32 h-32', icon: 'h-12 w-12' },
  };

  const config = sizeConfig[size];

  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setUploadError(null);
      setUploadSuccess(false);
    }, 3000);
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      try {
        const processedFile = await processImageFile(file, 400, 400, 0.8);
        const uploadResult = await uploadAvatar(processedFile, userId);

        if (!uploadResult.success) {
          setUploadError(uploadResult.error || 'Upload failed');
          clearMessages();
          return;
        }

        const updateResult = await updateProfileAvatar(
          userId,
          uploadResult.url!
        );

        if (!updateResult.success) {
          setUploadError(updateResult.error || 'Failed to update profile');
          clearMessages();
          return;
        }

        onAvatarUpdate(uploadResult.url!);
        setUploadSuccess(true);
        clearMessages();
        setShowModal(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

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

  const handleDelete = async () => {
    if (!currentAvatarUrl || disabled) return;

    setIsDeleting(true);
    setUploadError(null);

    try {
      const deleteResult = await deleteAvatar(currentAvatarUrl);
      if (!deleteResult.success) {
        setUploadError(deleteResult.error || 'Failed to delete avatar');
        clearMessages();
        return;
      }

      const updateResult = await updateProfileAvatar(userId, null);
      if (!updateResult.success) {
        setUploadError(updateResult.error || 'Failed to update profile');
        clearMessages();
        return;
      }

      onAvatarUpdate(null);
      setUploadSuccess(true);
      clearMessages();
      setShowModal(false);
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
    <>
      {/* Clickable Avatar */}
      <div
        className={`${config.container} relative rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-600 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } transition-all hover:border-[var(--ash-grey)]`}
        onClick={() => !disabled && setShowModal(true)}
      >
        <img
          src={avatarUrl}
          alt={fullName}
          className="w-full h-full object-cover"
        />

        {!disabled && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Camera className={`${config.icon} text-white`} />
          </div>
        )}

        {uploadSuccess && (
          <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
            <CheckCircle className={`${config.icon} text-white`} />
          </div>
        )}
      </div>

      {/* Avatar Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="sm:max-w-sm border-neutral-800"
          style={{ backgroundColor: 'var(--night)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--timberwolf)' }}>
              Profile Photo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="flex justify-center">
              <div
                className={`w-32 h-32 relative rounded-full overflow-hidden bg-neutral-800 border-2 ${
                  dragActive
                    ? 'border-green-400 border-dashed'
                    : 'border-neutral-600'
                } transition-all`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading || isDeleting}
                className="w-full flex items-center justify-center gap-2 border-neutral-700 hover:bg-neutral-800"
                style={{ color: 'var(--timberwolf)' }}
              >
                <Upload className="h-4 w-4" />
                {hasCustomAvatar ? 'Change Photo' : 'Upload Photo'}
              </Button>

              {hasCustomAvatar && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={disabled || isUploading || isDeleting}
                  className="w-full flex items-center justify-center gap-2 border-red-800/50 text-red-400 hover:bg-red-900/20"
                >
                  {isDeleting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Remove Photo
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Error */}
            {uploadError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-800 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{uploadError}</span>
                <button
                  onClick={() => setUploadError(null)}
                  className="hover:text-red-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </>
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
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    '3xl': 'w-40 h-40',
    '4xl': 'w-48 h-48',
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
