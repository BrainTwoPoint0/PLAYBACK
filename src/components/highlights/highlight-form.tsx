'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading';
import { VideoUpload } from '@/components/video/video-upload';
import {
  createHighlight,
  type HighlightFormData,
} from '@/lib/highlights/utils';
import {
  Trophy,
  Tag,
  Eye,
  EyeOff,
  Star,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface HighlightFormProps {
  userId: string;
  userSports?: any[];
  onSuccess?: (highlight: any) => void;
  onCancel?: () => void;
}

interface VideoData {
  url: string;
  thumbnail: string;
  duration: number;
  size: number;
  format: string;
}

export function HighlightForm({
  userId,
  userSports = [],
  onSuccess,
  onCancel,
}: HighlightFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport_id: '',
    sport_name: '',
    skill_tags: [] as string[],
    is_public: true,
  });

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [skillTag, setSkillTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle sport selection
  const handleSportChange = (sportId: string) => {
    const selectedSport = userSports.find((s) => s.sport?.id === sportId);
    setFormData((prev) => ({
      ...prev,
      sport_id: sportId,
      sport_name: selectedSport?.sport?.name || '',
    }));
  };

  // Add skill tag
  const addSkillTag = () => {
    if (skillTag.trim() && !formData.skill_tags.includes(skillTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        skill_tags: [...prev.skill_tags, skillTag.trim()],
      }));
      setSkillTag('');
    }
  };

  // Remove skill tag
  const removeSkillTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skill_tags: prev.skill_tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle video upload
  const handleVideoUploaded = (data: VideoData) => {
    setVideoData(data);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoData) {
      setError('Please upload a video first');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const highlightData: HighlightFormData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        video_url: videoData.url,
        thumbnail_url: videoData.thumbnail,
        duration: videoData.duration, // Will be converted to integer in createHighlight
        sport_id: formData.sport_id || undefined,
        tags: formData.skill_tags,
        is_public: formData.is_public,
      };

      const result = await createHighlight(userId, highlightData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }

        // Reset form
        setFormData({
          title: '',
          description: '',
          sport_id: '',
          sport_name: '',
          skill_tags: [],
          is_public: true,
        });
        setVideoData(null);
        setSkillTag('');

        // Hide success message after delay
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to save highlight'
      );
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = videoData && formData.title.trim() && !saving;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-purple-400/10 rounded-xl">
            <Trophy className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Add New Highlight
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Upload and showcase your best athletic moments
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Video Upload */}
        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
          <h3
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--timberwolf)' }}
          >
            <div className="p-1 bg-purple-400/10 rounded-lg">
              <Trophy className="h-4 w-4 text-purple-400" />
            </div>
            Video Upload
          </h3>

          <VideoUpload
            userId={userId}
            onVideoUploaded={handleVideoUploaded}
            maxFiles={1}
            disabled={saving}
          />
        </div>

        {/* Highlight Details */}
        {videoData && (
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 space-y-6">
            <h3
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              <div className="p-1 bg-blue-400/10 rounded-lg">
                <Tag className="h-4 w-4 text-blue-400" />
              </div>
              Highlight Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="Amazing goal from midfield"
                  maxLength={100}
                  required
                />
              </div>

              {/* Sport Selection */}
              <div>
                <Label
                  htmlFor="sport"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Sport
                </Label>
                <select
                  id="sport"
                  value={formData.sport_id}
                  onChange={(e) => handleSportChange(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  <option value="">Select sport</option>
                  {userSports.map((userSport) => (
                    <option
                      key={userSport.sport?.id}
                      value={userSport.sport?.id}
                    >
                      {userSport.sport?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility */}
              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Visibility
                </Label>
                <div className="mt-2 space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) =>
                        handleFieldChange('is_public', e.target.checked)
                      }
                      className="w-4 h-4 text-purple-400 border-neutral-600 rounded focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      {formData.is_public ? (
                        <Eye className="h-4 w-4 text-green-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-neutral-400" />
                      )}
                      <span
                        className="text-sm"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Public
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleFieldChange('description', e.target.value)
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl resize-none"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="Describe the context, technique, or significance of this highlight..."
                  rows={3}
                  maxLength={500}
                />
                <div className="flex justify-end mt-1">
                  <span
                    className="text-xs"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Skill Tags */}
              <div className="md:col-span-2">
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Skill Tags
                </Label>

                <div className="mt-2 flex gap-2">
                  <Input
                    type="text"
                    value={skillTag}
                    onChange={(e) => setSkillTag(e.target.value)}
                    className="flex-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                    style={{ color: 'var(--timberwolf)' }}
                    placeholder="e.g., Goal, Assist, Defense, Technique"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addSkillTag())
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSkillTag}
                    disabled={!skillTag.trim()}
                    className="border-purple-400 text-purple-400 hover:bg-purple-400/10"
                  >
                    Add
                  </Button>
                </div>

                {formData.skill_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.skill_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-400/10 text-purple-400 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeSkillTag(tag)}
                          className="hover:bg-purple-400/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Highlight saved successfully!</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
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
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
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
