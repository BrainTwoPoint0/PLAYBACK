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
  Clock,
  MapPin,
  Users,
  Target,
  Zap,
  Award,
  Plus,
  Minus,
  Calendar,
  Timer,
} from 'lucide-react';

interface EnhancedHighlightFormProps {
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

interface GameContext {
  opponent: string;
  competition: string;
  date: string;
  score: string;
  timeRemaining: string;
  fieldPosition: string;
}

interface PerformanceMetrics {
  speed?: number;
  distance?: number;
  accuracy?: number;
  power?: number;
}

// Sport-specific tag libraries
const SPORT_TAGS = {
  Football: {
    Offensive: [
      'Goal',
      'Assist',
      'Shot',
      'Pass',
      'Dribble',
      'Cross',
      'Free Kick',
      'Penalty',
      'Header',
    ],
    Defensive: [
      'Tackle',
      'Interception',
      'Block',
      'Clearance',
      'Save',
      'Dive',
      'Punch',
      'Catch',
    ],
    Technical: [
      'First Touch',
      'Volley',
      'Chip',
      'Curve',
      'Placement',
      'Power',
      'Finesse',
      'Skill Move',
    ],
    Situational: [
      'Counter Attack',
      'Set Piece',
      'Last Minute',
      'Pressure',
      'Clutch',
      'Game Winner',
    ],
  },
  Basketball: {
    Offensive: [
      'Dunk',
      'Three-Pointer',
      'Layup',
      'Assist',
      'Steal',
      'Rebound',
      'Fadeaway',
      'Crossover',
    ],
    Defensive: [
      'Block',
      'Steal',
      'Rebound',
      'Deflection',
      'Charge',
      'Help Defense',
      'Rotation',
    ],
    Technical: [
      'Footwork',
      'Ball Handling',
      'Shooting',
      'Passing',
      'Court Vision',
      'IQ',
      'Positioning',
    ],
    Situational: [
      'Clutch',
      'Buzzer Beater',
      'And-One',
      'Fast Break',
      'Comeback',
      'Momentum',
    ],
  },
  Tennis: {
    Shots: [
      'Forehand',
      'Backhand',
      'Serve',
      'Volley',
      'Overhead',
      'Drop Shot',
      'Lob',
      'Slice',
    ],
    Technique: [
      'Topspin',
      'Placement',
      'Power',
      'Accuracy',
      'Footwork',
      'Recovery',
      'Anticipation',
    ],
    Tactical: [
      'Winner',
      'Passing Shot',
      'Return',
      'Approach',
      'Defensive',
      'Aggressive',
      'Counter',
    ],
    Situational: [
      'Match Point',
      'Break Point',
      'Comeback',
      'Pressure',
      'Clutch',
      'Rally',
    ],
  },
  Default: {
    Performance: [
      'Skill',
      'Technique',
      'Speed',
      'Power',
      'Accuracy',
      'Coordination',
      'Timing',
    ],
    Achievement: [
      'Personal Best',
      'Victory',
      'Comeback',
      'Breakthrough',
      'Milestone',
      'Record',
    ],
    Situational: [
      'Pressure',
      'Clutch',
      'Competition',
      'Training',
      'Practice',
      'Demonstration',
    ],
  },
};

export function EnhancedHighlightForm({
  userId,
  userSports = [],
  onSuccess,
  onCancel,
}: EnhancedHighlightFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport_id: '',
    sport_name: '',
    skill_tags: [] as string[],
    is_public: true,
  });

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [gameContext, setGameContext] = useState<GameContext>({
    opponent: '',
    competition: '',
    date: '',
    score: '',
    timeRemaining: '',
    fieldPosition: '',
  });

  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics>({});
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>('');
  const [customTag, setCustomTag] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get current sport's tag library
  const getCurrentSportTags = () => {
    if (!formData.sport_name) return SPORT_TAGS['Default'];
    return (
      SPORT_TAGS[formData.sport_name as keyof typeof SPORT_TAGS] ||
      SPORT_TAGS['Default']
    );
  };

  // Get current sport tag categories
  const getCurrentSportTagCategories = () => {
    const tags = getCurrentSportTags();
    return Object.keys(tags) as Array<keyof typeof tags>;
  };

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
      skill_tags: [], // Reset tags when sport changes
    }));
    setSelectedTagCategory('');
  };

  // Add skill tag (predefined or custom)
  const addSkillTag = (tag: string) => {
    if (tag.trim() && !formData.skill_tags.includes(tag.trim())) {
      setFormData((prev) => ({
        ...prev,
        skill_tags: [...prev.skill_tags, tag.trim()],
      }));
    }
  };

  // Add custom tag
  const addCustomTag = () => {
    if (customTag.trim()) {
      addSkillTag(customTag.trim());
      setCustomTag('');
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
    setActiveStep(2); // Move to next step after video upload
  };

  // Handle game context change
  const handleGameContextChange = (field: keyof GameContext, value: string) => {
    setGameContext((prev) => ({ ...prev, [field]: value }));
  };

  // Handle performance metrics change
  const handleMetricsChange = (
    metric: keyof PerformanceMetrics,
    value: number
  ) => {
    setPerformanceMetrics((prev) => ({ ...prev, [metric]: value }));
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
      // Combine all metadata
      const metadata = {
        gameContext:
          Object.keys(gameContext).length > 0 ? gameContext : undefined,
        performanceMetrics:
          Object.keys(performanceMetrics).length > 0
            ? performanceMetrics
            : undefined,
      };

      const highlightData: HighlightFormData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        video_url: videoData.url,
        thumbnail_url: videoData.thumbnail,
        duration: videoData.duration, // Will be converted to integer in createHighlight
        sport_id: formData.sport_id || undefined,
        tags: formData.skill_tags,
        is_public: formData.is_public,
        // Add metadata as JSON to existing fields or extend the interface
      };

      const result = await createHighlight(userId, highlightData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mobile-First Progress Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-purple-400/10 rounded-xl">
            <Trophy className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Athletic Highlight
          </h2>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold
                ${
                  activeStep >= step
                    ? 'bg-purple-500 text-white'
                    : 'bg-neutral-700 text-neutral-400'
                }`}
            >
              {step}
            </div>
          ))}
        </div>

        <div
          className="text-xs text-center"
          style={{ color: 'var(--ash-grey)' }}
        >
          {activeStep === 1 && 'Upload your video'}
          {activeStep === 2 && 'Add details & tags'}
          {activeStep === 3 && 'Game context (optional)'}
          {activeStep === 4 && 'Review & publish'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Video Upload */}
        {activeStep === 1 && (
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6">
            <h3
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              <div className="p-1 bg-purple-400/10 rounded-lg">
                <Trophy className="h-4 w-4 text-purple-400" />
              </div>
              Upload Your Highlight
            </h3>

            <VideoUpload
              userId={userId}
              onVideoUploaded={handleVideoUploaded}
              maxFiles={1}
              disabled={saving}
            />
          </div>
        )}

        {/* Step 2: Basic Details & Sport-Specific Tags */}
        {activeStep === 2 && videoData && (
          <div className="space-y-6">
            {/* Basic Details */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6">
              <h3
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: 'var(--timberwolf)' }}
              >
                <div className="p-1 bg-blue-400/10 rounded-lg">
                  <Tag className="h-4 w-4 text-blue-400" />
                </div>
                Highlight Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                <div className="md:col-span-1">
                  <Label
                    htmlFor="sport"
                    className="text-sm font-medium"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Sport *
                  </Label>
                  <select
                    id="sport"
                    value={formData.sport_id}
                    onChange={(e) => handleSportChange(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ color: 'var(--timberwolf)' }}
                    required
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
                <div className="md:col-span-1">
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Visibility
                  </Label>
                  <div className="mt-2">
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
              </div>
            </div>

            {/* Sport-Specific Tags */}
            {formData.sport_name && (
              <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6">
                <h3
                  className="text-lg font-semibold mb-4 flex items-center gap-2"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  <div className="p-1 bg-green-400/10 rounded-lg">
                    <Zap className="h-4 w-4 text-green-400" />
                  </div>
                  {formData.sport_name} Skills & Techniques
                </h3>

                {/* Tag Categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {getCurrentSportTagCategories().map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant={
                        selectedTagCategory === category ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        setSelectedTagCategory(
                          selectedTagCategory === category ? '' : category
                        )
                      }
                      className={`text-xs ${
                        selectedTagCategory === category
                          ? 'bg-purple-500 text-white'
                          : 'border-neutral-600 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                {/* Quick Tags */}
                {selectedTagCategory && (
                  <div className="mb-4">
                    <p
                      className="text-sm mb-2"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Quick Tags - {selectedTagCategory}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getCurrentSportTags()[
                        selectedTagCategory as keyof ReturnType<
                          typeof getCurrentSportTags
                        >
                      ]?.map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addSkillTag(tag)}
                          disabled={formData.skill_tags.includes(tag)}
                          className={`text-xs ${
                            formData.skill_tags.includes(tag)
                              ? 'bg-green-500/20 border-green-500 text-green-400'
                              : 'border-neutral-600 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {formData.skill_tags.includes(tag) ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Tag Input */}
                <div className="mb-4">
                  <p
                    className="text-sm mb-2"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Custom Tag:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      className="flex-1 bg-neutral-800/50 border-neutral-600 rounded-xl text-sm"
                      style={{ color: 'var(--timberwolf)' }}
                      placeholder="Enter custom skill or technique"
                      onKeyPress={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), addCustomTag())
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomTag}
                      disabled={!customTag.trim()}
                      className="border-purple-400 text-purple-400 hover:bg-purple-400/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Selected Tags */}
                {formData.skill_tags.length > 0 && (
                  <div>
                    <p
                      className="text-sm mb-2"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Selected Tags ({formData.skill_tags.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                  </div>
                )}
              </div>
            )}

            {/* Step Navigation */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(1)}
                className="border-neutral-600 text-neutral-300"
              >
                Previous
              </Button>
              <Button
                type="button"
                onClick={() => setActiveStep(3)}
                disabled={!formData.title.trim() || !formData.sport_id}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                Next: Game Context
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Game Context (Optional) */}
        {activeStep === 3 && (
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6">
            <h3
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              <div className="p-1 bg-orange-400/10 rounded-lg">
                <MapPin className="h-4 w-4 text-orange-400" />
              </div>
              Game Context (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Opponent
                </Label>
                <Input
                  value={gameContext.opponent}
                  onChange={(e) =>
                    handleGameContextChange('opponent', e.target.value)
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="vs. Real Madrid"
                />
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Competition
                </Label>
                <Input
                  value={gameContext.competition}
                  onChange={(e) =>
                    handleGameContextChange('competition', e.target.value)
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="Champions League"
                />
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Date
                </Label>
                <Input
                  type="date"
                  value={gameContext.date}
                  onChange={(e) =>
                    handleGameContextChange('date', e.target.value)
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                />
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Score
                </Label>
                <Input
                  value={gameContext.score}
                  onChange={(e) =>
                    handleGameContextChange('score', e.target.value)
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="2-1"
                />
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Time Remaining
                </Label>
                <Input
                  value={gameContext.timeRemaining}
                  onChange={(e) =>
                    handleGameContextChange('timeRemaining', e.target.value)
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="15:30"
                />
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Field Position
                </Label>
                <Input
                  value={gameContext.fieldPosition}
                  onChange={(e) =>
                    handleGameContextChange('fieldPosition', e.target.value)
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="Center field"
                />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mt-6">
              <h4
                className="text-md font-semibold mb-3 flex items-center gap-2"
                style={{ color: 'var(--timberwolf)' }}
              >
                <div className="p-1 bg-green-400/10 rounded-lg">
                  <Target className="h-4 w-4 text-green-400" />
                </div>
                Performance Metrics
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Speed (mph)
                  </Label>
                  <Input
                    type="number"
                    value={performanceMetrics.speed || ''}
                    onChange={(e) =>
                      handleMetricsChange('speed', Number(e.target.value))
                    }
                    className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                    style={{ color: 'var(--timberwolf)' }}
                    placeholder="22"
                  />
                </div>

                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Distance (m)
                  </Label>
                  <Input
                    type="number"
                    value={performanceMetrics.distance || ''}
                    onChange={(e) =>
                      handleMetricsChange('distance', Number(e.target.value))
                    }
                    className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                    style={{ color: 'var(--timberwolf)' }}
                    placeholder="50"
                  />
                </div>

                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Accuracy (%)
                  </Label>
                  <Input
                    type="number"
                    max="100"
                    value={performanceMetrics.accuracy || ''}
                    onChange={(e) =>
                      handleMetricsChange('accuracy', Number(e.target.value))
                    }
                    className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                    style={{ color: 'var(--timberwolf)' }}
                    placeholder="85"
                  />
                </div>

                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Power (1-10)
                  </Label>
                  <Input
                    type="number"
                    max="10"
                    value={performanceMetrics.power || ''}
                    onChange={(e) =>
                      handleMetricsChange('power', Number(e.target.value))
                    }
                    className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                    style={{ color: 'var(--timberwolf)' }}
                    placeholder="8"
                  />
                </div>
              </div>
            </div>

            {/* Step Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(2)}
                className="border-neutral-600 text-neutral-300"
              >
                Previous
              </Button>
              <Button
                type="button"
                onClick={() => setActiveStep(4)}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                Next: Review
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {activeStep === 4 && (
          <div className="space-y-6">
            {/* Review Summary */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6">
              <h3
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: 'var(--timberwolf)' }}
              >
                <div className="p-1 bg-blue-400/10 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                </div>
                Review Your Highlight
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-24 bg-neutral-800 rounded-lg overflow-hidden">
                    {videoData?.thumbnail && (
                      <img
                        src={videoData.thumbnail}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4
                      className="font-semibold text-lg"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {formData.title}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                      {formData.sport_name} • {videoData?.duration}s •{' '}
                      {formData.is_public ? 'Public' : 'Private'}
                    </p>
                    {formData.description && (
                      <p
                        className="text-sm mt-2"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {formData.description}
                      </p>
                    )}
                  </div>
                </div>

                {formData.skill_tags.length > 0 && (
                  <div>
                    <p
                      className="text-sm font-medium mb-2"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Skills & Techniques:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.skill_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-400/10 text-purple-400 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(gameContext.opponent || gameContext.competition) && (
                  <div>
                    <p
                      className="text-sm font-medium mb-2"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Game Context:
                    </p>
                    <div
                      className="text-sm space-y-1"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      {gameContext.opponent && (
                        <p>vs. {gameContext.opponent}</p>
                      )}
                      {gameContext.competition && (
                        <p>{gameContext.competition}</p>
                      )}
                      {gameContext.score && <p>Score: {gameContext.score}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

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

            {/* Final Action Buttons */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(3)}
                className="border-neutral-600 text-neutral-300 w-full md:w-auto"
              >
                Previous
              </Button>

              <div className="flex gap-3 w-full md:w-auto">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={saving}
                    className="border-neutral-600 hover:bg-neutral-800 flex-1 md:flex-none"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex-1 md:flex-none"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Publish Highlight
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
