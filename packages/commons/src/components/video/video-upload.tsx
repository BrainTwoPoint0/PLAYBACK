'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading';
import {
  uploadVideo,
  validateVideoFile,
  extractVideoMetadata,
  generateVideoThumbnail,
  formatFileSize,
  formatDuration,
} from '../../lib/video/utils';
import {
  Upload,
  X,
  Play,
  Trash2,
  AlertCircle,
  CheckCircle,
  Film,
} from 'lucide-react';

interface VideoUploadProps {
  userId: string;
  onVideoUploaded: (videoData: {
    url: string;
    thumbnail: string;
    duration: number;
    size: number;
    format: string;
  }) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadingVideo {
  file: File;
  progress: number;
  thumbnail?: string;
  metadata?: {
    duration: number;
    size: number;
    format: string;
  };
  url?: string;
  error?: string;
}

export function VideoUpload({
  userId,
  onVideoUploaded,
  maxFiles = 5,
  disabled = false,
}: VideoUploadProps) {
  const [uploadingVideos, setUploadingVideos] = useState<UploadingVideo[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList) => {
      if (disabled) return;

      const fileArray = Array.from(files).slice(0, maxFiles);

      for (const file of fileArray) {
        // Validate file
        const validation = validateVideoFile(file);
        if (!validation.valid) {
          // Add error state
          setUploadingVideos((prev) => [
            ...prev,
            {
              file,
              progress: 0,
              error: validation.error,
            },
          ]);
          continue;
        }

        // Add to uploading list
        const uploadingVideo: UploadingVideo = {
          file,
          progress: 0,
        };

        setUploadingVideos((prev) => [...prev, uploadingVideo]);

        try {
          // Extract metadata
          const metadata = await extractVideoMetadata(file);

          // Generate thumbnail
          const thumbnail = await generateVideoThumbnail(file, userId);

          // Update with metadata and thumbnail
          setUploadingVideos((prev) =>
            prev.map((v) =>
              v.file === file
                ? { ...v, metadata, thumbnail: thumbnail || '', progress: 25 }
                : v
            )
          );

          // Upload video
          setUploadingVideos((prev) =>
            prev.map((v) => (v.file === file ? { ...v, progress: 50 } : v))
          );

          const uploadResult = await uploadVideo(file, userId);

          if (uploadResult.success && uploadResult.url) {
            // Upload successful
            setUploadingVideos((prev) =>
              prev.map((v) =>
                v.file === file
                  ? { ...v, url: uploadResult.url, progress: 100 }
                  : v
              )
            );

            // Notify parent component
            onVideoUploaded({
              url: uploadResult.url,
              thumbnail: thumbnail || '',
              duration: metadata.duration,
              size: metadata.size,
              format: metadata.format,
            });

            // Remove from uploading list after a delay
            setTimeout(() => {
              setUploadingVideos((prev) => prev.filter((v) => v.file !== file));
            }, 2000);
          } else {
            // Upload failed
            setUploadingVideos((prev) =>
              prev.map((v) =>
                v.file === file
                  ? {
                      ...v,
                      error: uploadResult.error || 'Upload failed',
                      progress: 0,
                    }
                  : v
              )
            );
          }
        } catch (error) {
          // Error during processing
          setUploadingVideos((prev) =>
            prev.map((v) =>
              v.file === file
                ? {
                    ...v,
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Processing failed',
                    progress: 0,
                  }
                : v
            )
          );
        }
      }
    },
    [userId, onVideoUploaded, maxFiles, disabled]
  );

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
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

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Remove uploading video
  const removeUploadingVideo = (file: File) => {
    setUploadingVideos((prev) => prev.filter((v) => v.file !== file));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-green-400 bg-green-400/5'
            : 'border-neutral-600 hover:border-green-400/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-2xl">
              <Film className="h-12 w-12 text-purple-400" />
            </div>
          </div>

          <div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              Upload Highlight Videos
            </h3>
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Drag and drop your videos here, or click to browse
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="border-green-400 text-green-400 hover:bg-green-400/10"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Videos
            </Button>
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Upload Guidelines */}
      <div className="bg-gradient-to-br from-neutral-800/40 to-neutral-700/30 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
        <h4
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          <div className="p-1 bg-blue-400/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-400" />
          </div>
          Upload Guidelines
        </h4>
        <ul className="text-xs space-y-1" style={{ color: 'var(--ash-grey)' }}>
          <li>• Supported formats: MP4, WebM, OGG, MOV, AVI</li>
          <li>• Maximum file size: 100MB per video</li>
          <li>• Maximum {maxFiles} videos at once</li>
          <li>• Best quality: 1080p or higher, good lighting</li>
          <li>• Keep videos under 2 minutes for best engagement</li>
        </ul>
      </div>

      {/* Uploading Videos */}
      {uploadingVideos.length > 0 && (
        <div className="space-y-3">
          <h4
            className="text-sm font-semibold"
            style={{ color: 'var(--timberwolf)' }}
          >
            Uploading Videos
          </h4>

          {uploadingVideos.map((video, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-neutral-800/40 to-neutral-700/30 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail or Icon */}
                <div className="w-16 h-12 bg-neutral-800 rounded-lg flex items-center justify-center overflow-hidden">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film
                      className="h-6 w-6"
                      style={{ color: 'var(--ash-grey)' }}
                    />
                  )}
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    {video.file.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="text-xs"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      {formatFileSize(video.file.size)}
                    </span>
                    {video.metadata && (
                      <span
                        className="text-xs"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {formatDuration(video.metadata.duration)}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {!video.error && video.progress < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-neutral-700 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-green-400 to-blue-400 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${video.progress}%` }}
                        ></div>
                      </div>
                      <p
                        className="text-xs mt-1"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {video.progress === 0 && 'Starting upload...'}
                        {video.progress === 25 && 'Processing video...'}
                        {video.progress === 50 && 'Uploading...'}
                        {video.progress > 50 &&
                          video.progress < 100 &&
                          `Uploading ${video.progress}%`}
                      </p>
                    </div>
                  )}

                  {/* Success State */}
                  {video.progress === 100 && !video.error && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-green-400">
                        Upload complete!
                      </span>
                    </div>
                  )}

                  {/* Error State */}
                  {video.error && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-red-400">
                        {video.error}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {video.progress < 100 && !video.error && (
                    <LoadingSpinner size="sm" />
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeUploadingVideo(video.file)}
                    className="p-1 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
