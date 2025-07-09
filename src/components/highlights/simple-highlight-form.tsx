'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  uploadVideo,
  validateVideoFile,
  extractVideoMetadata,
  generateVideoThumbnail,
  generateVideoThumbnailPreview,
} from '@/lib/video/utils';
import {
  createHighlight,
  type HighlightFormData,
} from '@/lib/highlights/utils';
import {
  Film,
  Upload,
  X,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Play,
  Clock,
} from 'lucide-react';

interface SimpleHighlightFormProps {
  userId: string;
  userSports?: any[];
  onSuccess?: (highlight: any) => void;
  onCancel?: () => void;
}

interface VideoPreview {
  file: File;
  previewUrl: string;
  thumbnail?: string;
  duration?: number;
  size: number;
}

export function SimpleHighlightForm({
  userId,
  userSports = [],
  onSuccess,
  onCancel,
}: SimpleHighlightFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport_id: '',
    tags: '',
    is_public: true,
  });

  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle video file selection (preview only, don't upload yet)
  const handleVideoSelect = async (file: File) => {
    try {
      setError(null);

      // Validate file
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid video file');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Generate preview thumbnail and extract metadata
      const [thumbnail, metadata] = await Promise.all([
        generateVideoThumbnailPreview(file),
        extractVideoMetadata(file),
      ]);

      setVideoPreview({
        file,
        previewUrl,
        thumbnail,
        duration: metadata.duration,
        size: file.size,
      });
    } catch (error) {
      setError('Failed to process video file');
      console.error(error);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleVideoSelect(file);
    }
  };

  // Remove video preview
  const removeVideo = () => {
    if (videoPreview?.previewUrl) {
      URL.revokeObjectURL(videoPreview.previewUrl);
    }
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoPreview) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Step 1: Upload video and thumbnail to storage
      const [uploadResult, thumbnailUrl] = await Promise.all([
        uploadVideo(videoPreview.file, userId),
        generateVideoThumbnail(videoPreview.file, userId),
      ]);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload video');
      }

      // Step 2: Create highlight record
      const highlightData: HighlightFormData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        video_url: uploadResult.url,
        thumbnail_url: thumbnailUrl || '',
        duration: videoPreview.duration || 0,
        sport_id: formData.sport_id || undefined,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        is_public: formData.is_public,
      };

      const result = await createHighlight(userId, highlightData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Success
      if (onSuccess && result.data) {
        onSuccess(result.data);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to save highlight'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-purple-400/10 rounded-xl">
            <Film className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Upload Highlight
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Share your best athletic moments
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video Upload Section */}
        <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6">
          <Label
            className="text-base font-semibold mb-4 block"
            style={{ color: 'var(--timberwolf)' }}
          >
            Video File
          </Label>

          {!videoPreview ? (
            <div
              className="border-2 border-dashed border-neutral-600 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload
                className="h-12 w-12 mx-auto mb-4"
                style={{ color: 'var(--ash-grey)' }}
              />
              <p
                className="text-lg font-medium mb-2"
                style={{ color: 'var(--timberwolf)' }}
              >
                Click to upload video
              </p>
              <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                MP4, WebM, or MOV up to 100MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/mov,video/avi"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  src={videoPreview.previewUrl}
                  poster={videoPreview.thumbnail}
                  controls
                  className="w-full aspect-video object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Video Info */}
              <div
                className="flex items-center gap-4 text-sm"
                style={{ color: 'var(--ash-grey)' }}
              >
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {videoPreview.duration
                      ? formatDuration(videoPreview.duration)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Film className="h-4 w-4" />
                  <span>{formatFileSize(videoPreview.size)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6 space-y-4">
          <Label
            className="text-base font-semibold"
            style={{ color: 'var(--timberwolf)' }}
          >
            Basic Information
          </Label>

          {/* Title */}
          <div>
            <Label
              htmlFor="title"
              className="text-sm font-medium mb-2 block"
              style={{ color: 'var(--ash-grey)' }}
            >
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Amazing goal vs rivals"
              className="bg-neutral-800 border-neutral-600 focus:border-purple-400"
              style={{ color: 'var(--timberwolf)' }}
            />
          </div>

          {/* Description */}
          <div>
            <Label
              htmlFor="description"
              className="text-sm font-medium mb-2 block"
              style={{ color: 'var(--ash-grey)' }}
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe what happened in this highlight..."
              rows={3}
              className="bg-neutral-800 border-neutral-600 focus:border-purple-400 resize-none"
              style={{ color: 'var(--timberwolf)' }}
            />
          </div>

          {/* Sport Selection */}
          {userSports.length > 0 && (
            <div>
              <Label
                className="text-sm font-medium mb-2 block"
                style={{ color: 'var(--ash-grey)' }}
              >
                Sport
              </Label>
              <Select
                value={formData.sport_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, sport_id: value }))
                }
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 focus:border-purple-400">
                  <SelectValue placeholder="Select sport (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {userSports.map((userSport) => (
                    <SelectItem
                      key={userSport.sport.id}
                      value={userSport.sport.id}
                    >
                      {userSport.sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label
              htmlFor="tags"
              className="text-sm font-medium mb-2 block"
              style={{ color: 'var(--ash-grey)' }}
            >
              Tags
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="goal, assist, skill (comma separated)"
              className="bg-neutral-800 border-neutral-600 focus:border-purple-400"
              style={{ color: 'var(--timberwolf)' }}
            />
          </div>

          {/* Privacy Setting */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setFormData((prev) => ({ ...prev, is_public: !prev.is_public }))
              }
              className={`flex items-center gap-2 ${
                formData.is_public
                  ? 'text-green-400 hover:text-green-300'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              {formData.is_public ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              {formData.is_public ? 'Public' : 'Private'}
            </Button>
            <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
              {formData.is_public
                ? 'Visible on your public profile'
                : 'Only visible to you'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="border-neutral-600 hover:bg-neutral-800"
            style={{ color: 'var(--ash-grey)' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!videoPreview || !formData.title.trim() || saving}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex-1"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Highlight
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
