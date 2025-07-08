'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading';
import { getUserHighlights, type Highlight } from '@/lib/highlights/utils';
import {
  Play,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Film,
  Sparkles,
  Download,
  Save,
  Eye,
  Clock,
  Star,
  Trash2,
  Edit,
  Copy,
  Shuffle,
  RotateCcw,
  Zap,
  Target,
  Trophy,
  Music,
  Palette,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface HighlightReelBuilderProps {
  userId: string;
  userSports?: any[];
  onSuccess?: (reel: any) => void;
  onCancel?: () => void;
}

interface ReelHighlight {
  id: string;
  highlight: Highlight;
  startTime?: number;
  endTime?: number;
  order: number;
  transition?: 'fade' | 'cut' | 'slide';
  effects?: string[];
}

interface ReelTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  style: 'recruitment' | 'season-recap' | 'skill-showcase' | 'game-highlights';
  recommendations: {
    minHighlights: number;
    maxHighlights: number;
    suggestedTags: string[];
    musicStyle: string;
  };
}

// Predefined reel templates
const REEL_TEMPLATES: ReelTemplate[] = [
  {
    id: 'recruitment',
    name: 'Recruitment Showcase',
    description: 'Perfect for college or professional recruitment',
    duration: 90,
    style: 'recruitment',
    recommendations: {
      minHighlights: 8,
      maxHighlights: 12,
      suggestedTags: ['Best Plays', 'Skills', 'Game Winners', 'Technique'],
      musicStyle: 'Motivational',
    },
  },
  {
    id: 'season-recap',
    name: 'Season Recap',
    description: 'Showcase your best moments from the season',
    duration: 120,
    style: 'season-recap',
    recommendations: {
      minHighlights: 10,
      maxHighlights: 15,
      suggestedTags: ['Goals', 'Assists', 'Saves', 'Victories'],
      musicStyle: 'Energetic',
    },
  },
  {
    id: 'skill-showcase',
    name: 'Skill Showcase',
    description: 'Focus on specific skills and techniques',
    duration: 60,
    style: 'skill-showcase',
    recommendations: {
      minHighlights: 6,
      maxHighlights: 10,
      suggestedTags: ['Technique', 'Skills', 'Training', 'Precision'],
      musicStyle: 'Focused',
    },
  },
  {
    id: 'game-highlights',
    name: 'Game Highlights',
    description: 'Best moments from a specific game or match',
    duration: 45,
    style: 'game-highlights',
    recommendations: {
      minHighlights: 4,
      maxHighlights: 8,
      suggestedTags: ['Match', 'Performance', 'Key Moments'],
      musicStyle: 'Dynamic',
    },
  },
];

export function HighlightReelBuilder({
  userId,
  userSports = [],
  onSuccess,
  onCancel,
}: HighlightReelBuilderProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ReelTemplate | null>(
    null
  );
  const [availableHighlights, setAvailableHighlights] = useState<Highlight[]>(
    []
  );
  const [selectedHighlights, setSelectedHighlights] = useState<ReelHighlight[]>(
    []
  );
  const [reelData, setReelData] = useState({
    title: '',
    description: '',
    sport_id: '',
    music_style: '',
    color_scheme: 'default',
    intro_text: '',
    outro_text: '',
    is_public: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load user highlights
  useEffect(() => {
    const loadHighlights = async () => {
      setLoading(true);
      try {
        const result = await getUserHighlights(userId);
        if (result.data) {
          setAvailableHighlights(result.data.filter((h) => h.is_public));
        }
      } catch (error) {
        console.error('Failed to load highlights:', error);
        setError('Failed to load your highlights');
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, [userId]);

  // Handle template selection
  const handleTemplateSelect = (template: ReelTemplate) => {
    setSelectedTemplate(template);
    setReelData((prev) => ({
      ...prev,
      music_style: template.recommendations.musicStyle,
      title: `My ${template.name}`,
    }));
  };

  // Add highlight to reel
  const addHighlightToReel = (highlight: Highlight) => {
    if (
      selectedHighlights.length >=
      (selectedTemplate?.recommendations.maxHighlights || 15)
    ) {
      setError('Maximum number of highlights reached for this template');
      return;
    }

    const reelHighlight: ReelHighlight = {
      id: `reel-${Date.now()}`,
      highlight,
      order: selectedHighlights.length,
      transition: 'fade',
      effects: [],
    };

    setSelectedHighlights((prev) => [...prev, reelHighlight]);
  };

  // Remove highlight from reel
  const removeHighlightFromReel = (id: string) => {
    setSelectedHighlights((prev) =>
      prev
        .filter((h) => h.id !== id)
        .map((h, index) => ({ ...h, order: index }))
    );
  };

  // Reorder highlights
  const moveHighlight = (id: string, direction: 'up' | 'down') => {
    setSelectedHighlights((prev) => {
      const currentIndex = prev.findIndex((h) => h.id === id);
      if (currentIndex === -1) return prev;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newOrder = [...prev];
      [newOrder[currentIndex], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[currentIndex],
      ];

      return newOrder.map((h, index) => ({ ...h, order: index }));
    });
  };

  // Auto-generate reel based on AI suggestions
  const generateAutoReel = () => {
    if (!selectedTemplate) return;

    const { recommendations } = selectedTemplate;
    const filteredHighlights = availableHighlights.filter((h) =>
      h.tags?.some((tag) => recommendations.suggestedTags.includes(tag))
    );

    const autoSelected = filteredHighlights
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, recommendations.maxHighlights)
      .map((highlight, index) => ({
        id: `auto-${Date.now()}-${index}`,
        highlight,
        order: index,
        transition: 'fade' as const,
        effects: [],
      }));

    setSelectedHighlights(autoSelected);
  };

  // Calculate total duration
  const getTotalDuration = () => {
    return selectedHighlights.reduce((total, rh) => {
      const duration =
        rh.endTime && rh.startTime
          ? rh.endTime - rh.startTime
          : rh.highlight.duration || 0;
      return total + duration;
    }, 0);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedHighlights.length === 0) {
      setError('Please select at least one highlight');
      return;
    }

    if (!reelData.title.trim()) {
      setError('Please enter a title for your reel');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Here you would typically send the data to your backend
      // For now, we'll simulate success
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess(true);
      if (onSuccess) {
        onSuccess({
          ...reelData,
          highlights: selectedHighlights,
          template: selectedTemplate,
          totalDuration: getTotalDuration(),
        });
      }
    } catch (error) {
      setError('Failed to create highlight reel');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = (step: number) => {
    switch (step) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return (
          selectedHighlights.length >=
          (selectedTemplate?.recommendations.minHighlights || 1)
        );
      case 3:
        return reelData.title.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-xl">
            <Film className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Highlight Reel
          </h2>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold
                  ${
                    step >= s
                      ? 'bg-purple-500 text-white'
                      : 'bg-neutral-700 text-neutral-400'
                  }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${step > s ? 'bg-purple-500' : 'bg-neutral-700'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div
          className="text-xs text-center"
          style={{ color: 'var(--ash-grey)' }}
        >
          {step === 1 && 'Choose template'}
          {step === 2 && 'Select highlights'}
          {step === 3 && 'Customize reel'}
          {step === 4 && 'Preview & export'}
        </div>
      </div>

      {/* Step 1: Template Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              Choose Your Reel Template
            </h3>
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Select a template that matches your goals and style
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REEL_TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200
                  ${
                    selectedTemplate?.id === template.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      template.style === 'recruitment'
                        ? 'bg-blue-400/10'
                        : template.style === 'season-recap'
                          ? 'bg-green-400/10'
                          : template.style === 'skill-showcase'
                            ? 'bg-purple-400/10'
                            : 'bg-orange-400/10'
                    }`}
                  >
                    {template.style === 'recruitment' && (
                      <Target className="h-6 w-6 text-blue-400" />
                    )}
                    {template.style === 'season-recap' && (
                      <Trophy className="h-6 w-6 text-green-400" />
                    )}
                    {template.style === 'skill-showcase' && (
                      <Zap className="h-6 w-6 text-purple-400" />
                    )}
                    {template.style === 'game-highlights' && (
                      <Star className="h-6 w-6 text-orange-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h4
                      className="font-semibold text-lg mb-2"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {template.name}
                    </h4>
                    <p
                      className="text-sm mb-3"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      {template.description}
                    </p>

                    <div className="space-y-2">
                      <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        <Clock className="h-3 w-3" />
                        <span>~{template.duration}s duration</span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        <Film className="h-3 w-3" />
                        <span>
                          {template.recommendations.minHighlights}-
                          {template.recommendations.maxHighlights} highlights
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        <Music className="h-3 w-3" />
                        <span>{template.recommendations.musicStyle} style</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => setStep(2)}
              disabled={!canProceed(1)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              Continue with {selectedTemplate?.name}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Highlight Selection */}
      {step === 2 && selectedTemplate && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: 'var(--timberwolf)' }}
              >
                Select Highlights ({selectedHighlights.length}/
                {selectedTemplate.recommendations.maxHighlights})
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={generateAutoReel}
                  variant="outline"
                  size="sm"
                  className="border-purple-400 text-purple-400 hover:bg-purple-400/10"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Generate
                </Button>
                <Button
                  onClick={() => setSelectedHighlights([])}
                  variant="outline"
                  size="sm"
                  className="border-neutral-600 text-neutral-300"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available Highlights */}
              <div>
                <h4
                  className="font-medium mb-3"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  Available Highlights
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableHighlights.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 bg-neutral-700 rounded-lg overflow-hidden">
                          {highlight.thumbnail_url && (
                            <img
                              src={highlight.thumbnail_url}
                              alt={highlight.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium text-sm truncate"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            {highlight.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            {highlight.duration}s • {highlight.views} views
                          </p>
                          {highlight.tags && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {highlight.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 bg-neutral-700 text-xs rounded-full"
                                  style={{ color: 'var(--ash-grey)' }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => addHighlightToReel(highlight)}
                          disabled={selectedHighlights.some(
                            (h) => h.highlight.id === highlight.id
                          )}
                          size="sm"
                          variant="outline"
                          className="border-green-400 text-green-400 hover:bg-green-400/10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Highlights */}
              <div>
                <h4
                  className="font-medium mb-3"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  Selected Highlights
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedHighlights.map((reelHighlight, index) => (
                    <div
                      key={reelHighlight.id}
                      className="p-3 bg-purple-900/20 rounded-xl border border-purple-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            onClick={() =>
                              moveHighlight(reelHighlight.id, 'up')
                            }
                            disabled={index === 0}
                            size="sm"
                            variant="ghost"
                            className="p-1 h-6 w-6"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() =>
                              moveHighlight(reelHighlight.id, 'down')
                            }
                            disabled={index === selectedHighlights.length - 1}
                            size="sm"
                            variant="ghost"
                            className="p-1 h-6 w-6"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>

                        <div
                          className="text-xs font-semibold w-6 text-center"
                          style={{ color: 'var(--timberwolf)' }}
                        >
                          {index + 1}
                        </div>

                        <div className="w-16 h-12 bg-neutral-700 rounded-lg overflow-hidden">
                          {reelHighlight.highlight.thumbnail_url && (
                            <img
                              src={reelHighlight.highlight.thumbnail_url}
                              alt={reelHighlight.highlight.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium text-sm truncate"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            {reelHighlight.highlight.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            {reelHighlight.highlight.duration}s
                          </p>
                        </div>

                        <Button
                          onClick={() =>
                            removeHighlightFromReel(reelHighlight.id)
                          }
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-400/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedHighlights.length > 0 && (
                  <div className="mt-4 p-3 bg-green-900/20 rounded-xl border border-green-700/50">
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <Clock className="h-4 w-4" />
                      <span>Total duration: {getTotalDuration()}s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="border-neutral-600 text-neutral-300"
            >
              Previous
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!canProceed(2)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              Next: Customize
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Customization */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--timberwolf)' }}
            >
              Customize Your Reel
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="reel-title"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Reel Title *
                </Label>
                <Input
                  id="reel-title"
                  value={reelData.title}
                  onChange={(e) =>
                    setReelData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="My Amazing Season Highlights"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="reel-sport"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Sport
                </Label>
                <select
                  id="reel-sport"
                  value={reelData.sport_id}
                  onChange={(e) =>
                    setReelData((prev) => ({
                      ...prev,
                      sport_id: e.target.value,
                    }))
                  }
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

              <div className="md:col-span-2">
                <Label
                  htmlFor="reel-description"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Description
                </Label>
                <Textarea
                  id="reel-description"
                  value={reelData.description}
                  onChange={(e) =>
                    setReelData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl resize-none"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="A compilation of my best highlights from this season..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Music Style
                </Label>
                <select
                  value={reelData.music_style}
                  onChange={(e) =>
                    setReelData((prev) => ({
                      ...prev,
                      music_style: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  <option value="Motivational">Motivational</option>
                  <option value="Energetic">Energetic</option>
                  <option value="Focused">Focused</option>
                  <option value="Dynamic">Dynamic</option>
                  <option value="Cinematic">Cinematic</option>
                </select>
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Color Scheme
                </Label>
                <select
                  value={reelData.color_scheme}
                  onChange={(e) =>
                    setReelData((prev) => ({
                      ...prev,
                      color_scheme: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  <option value="default">Default</option>
                  <option value="sport-themed">Sport Themed</option>
                  <option value="team-colors">Team Colors</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="vibrant">Vibrant</option>
                </select>
              </div>

              <div>
                <Label
                  htmlFor="intro-text"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Intro Text
                </Label>
                <Input
                  id="intro-text"
                  value={reelData.intro_text}
                  onChange={(e) =>
                    setReelData((prev) => ({
                      ...prev,
                      intro_text: e.target.value,
                    }))
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="Season 2024 Highlights"
                  maxLength={50}
                />
              </div>

              <div>
                <Label
                  htmlFor="outro-text"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Outro Text
                </Label>
                <Input
                  id="outro-text"
                  value={reelData.outro_text}
                  onChange={(e) =>
                    setReelData((prev) => ({
                      ...prev,
                      outro_text: e.target.value,
                    }))
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  placeholder="Thanks for watching!"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={reelData.is_public}
                  onChange={(e) =>
                    setReelData((prev) => ({
                      ...prev,
                      is_public: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-purple-400 border-neutral-600 rounded focus:ring-purple-500"
                />
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-400" />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Make this reel public
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              onClick={() => setStep(2)}
              variant="outline"
              className="border-neutral-600 text-neutral-300"
            >
              Previous
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!canProceed(3)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              Next: Preview
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Preview & Export */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--timberwolf)' }}
            >
              Preview Your Reel
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-neutral-800/50 rounded-xl">
                <h4
                  className="font-semibold text-lg mb-2"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {reelData.title}
                </h4>
                <p
                  className="text-sm mb-3"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {reelData.description}
                </p>
                <div
                  className="flex items-center gap-4 text-sm"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  <span>📱 {selectedHighlights.length} highlights</span>
                  <span>⏱️ {getTotalDuration()}s total</span>
                  <span>🎵 {reelData.music_style}</span>
                  <span>🎨 {reelData.color_scheme}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedHighlights.map((reelHighlight, index) => (
                  <div
                    key={reelHighlight.id}
                    className="p-3 bg-neutral-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="text-xs font-semibold w-6 text-center"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {index + 1}
                      </div>
                      <div className="w-16 h-12 bg-neutral-700 rounded-lg overflow-hidden">
                        {reelHighlight.highlight.thumbnail_url && (
                          <img
                            src={reelHighlight.highlight.thumbnail_url}
                            alt={reelHighlight.highlight.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-sm truncate"
                          style={{ color: 'var(--timberwolf)' }}
                        >
                          {reelHighlight.highlight.title}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          {reelHighlight.highlight.duration}s
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                <span className="text-sm">
                  Highlight reel created successfully!
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between gap-4">
            <Button
              onClick={() => setStep(3)}
              variant="outline"
              className="border-neutral-600 text-neutral-300"
            >
              Previous
            </Button>

            <div className="flex gap-3">
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  disabled={loading}
                  className="border-neutral-600 text-neutral-300"
                >
                  Cancel
                </Button>
              )}

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Reel
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
