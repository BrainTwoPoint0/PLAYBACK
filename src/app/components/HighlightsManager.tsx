'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Play,
  Heart,
  Share2,
  Target,
  Clock,
  Calendar,
  Upload,
  Video,
  Image,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Highlight {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number; // in seconds
  sport_id: string;
  sport_name: string;
  position: string;
  play_type: string;
  difficulty: string;
  is_public: boolean;
  is_featured: boolean;
  tags: string[];
  player_targets: PlayerTarget[];
  created_at?: string;
}

interface PlayerTarget {
  id: string;
  name: string;
  position: string;
  team?: string;
  time_marker: number; // when in the video this player is highlighted
}

const playTypes = [
  'Goal',
  'Assist',
  'Save',
  'Tackle',
  'Pass',
  'Shot',
  'Dribble',
  'Cross',
  'Header',
  'Free Kick',
  'Penalty',
  'Corner',
  'Counter Attack',
  'Build Up',
  'Defensive Play',
  'Other',
];

const difficulties = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Professional',
  'Elite',
];

const positions = [
  'Goalkeeper',
  'Right Back',
  'Center Back',
  'Left Back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Right Winger',
  'Left Winger',
  'Striker',
  'Forward',
];

interface HighlightsManagerProps {
  highlights: Highlight[];
  onHighlightsChange: (highlights: Highlight[]) => void;
  availableSports: any[];
  userId: string;
}

export default function HighlightsManager({
  highlights,
  onHighlightsChange,
  availableSports,
  userId,
}: HighlightsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newHighlight, setNewHighlight] = useState<Partial<Highlight>>({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: 0,
    sport_id: '',
    sport_name: '',
    position: '',
    play_type: '',
    difficulty: '',
    is_public: true,
    is_featured: false,
    tags: [],
    player_targets: [],
  });
  const [newTag, setNewTag] = useState('');
  const [newPlayerTarget, setNewPlayerTarget] = useState<Partial<PlayerTarget>>(
    {
      name: '',
      position: '',
      team: '',
      time_marker: 0,
    }
  );

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);

  // Handle video file upload
  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'highlight');
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        setNewHighlight((prev) => ({
          ...prev,
          video_url: result.data.url,
          duration: result.data.duration || 0,
        }));
        setUploadProgress(100);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Video upload error:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle thumbnail file upload
  const handleThumbnailUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'thumbnail');
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        setNewHighlight((prev) => ({
          ...prev,
          thumbnail_url: result.data.url,
        }));
        setUploadProgress(100);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      alert('Failed to upload thumbnail. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddHighlight = () => {
    if (
      !newHighlight.title ||
      !newHighlight.video_url ||
      !newHighlight.sport_id ||
      !newHighlight.play_type
    ) {
      return;
    }

    const sport = availableSports.find((s) => s.id === newHighlight.sport_id);
    if (!sport) return;

    const highlightData: Highlight = {
      title: newHighlight.title,
      description: newHighlight.description || '',
      video_url: newHighlight.video_url,
      thumbnail_url: newHighlight.thumbnail_url || '',
      duration: newHighlight.duration || 0,
      sport_id: newHighlight.sport_id,
      sport_name: sport.name,
      position: newHighlight.position || '',
      play_type: newHighlight.play_type,
      difficulty: newHighlight.difficulty || 'Intermediate',
      is_public: newHighlight.is_public || true,
      is_featured: newHighlight.is_featured || false,
      tags: newHighlight.tags || [],
      player_targets: newHighlight.player_targets || [],
    };

    onHighlightsChange([...highlights, highlightData]);

    setNewHighlight({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      duration: 0,
      sport_id: '',
      sport_name: '',
      position: '',
      play_type: '',
      difficulty: '',
      is_public: true,
      is_featured: false,
      tags: [],
      player_targets: [],
    });
    setIsAdding(false);
  };

  const handleUpdateHighlight = () => {
    if (
      editingIndex === null ||
      !newHighlight.title ||
      !newHighlight.video_url ||
      !newHighlight.sport_id ||
      !newHighlight.play_type
    ) {
      return;
    }

    const sport = availableSports.find((s) => s.id === newHighlight.sport_id);
    if (!sport) return;

    const updatedHighlights = [...highlights];
    updatedHighlights[editingIndex] = {
      ...updatedHighlights[editingIndex],
      title: newHighlight.title,
      description: newHighlight.description || '',
      video_url: newHighlight.video_url,
      thumbnail_url: newHighlight.thumbnail_url || '',
      duration: newHighlight.duration || 0,
      sport_id: newHighlight.sport_id,
      sport_name: sport.name,
      position: newHighlight.position || '',
      play_type: newHighlight.play_type,
      difficulty: newHighlight.difficulty || 'Intermediate',
      is_public: newHighlight.is_public || true,
      is_featured: newHighlight.is_featured || false,
      tags: newHighlight.tags || [],
      player_targets: newHighlight.player_targets || [],
    };

    onHighlightsChange(updatedHighlights);
    setEditingIndex(null);
    setNewHighlight({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      duration: 0,
      sport_id: '',
      sport_name: '',
      position: '',
      play_type: '',
      difficulty: '',
      is_public: true,
      is_featured: false,
      tags: [],
      player_targets: [],
    });
  };

  const handleRemoveHighlight = (index: number) => {
    const updatedHighlights = highlights.filter((_, i) => i !== index);
    onHighlightsChange(updatedHighlights);
  };

  const handleEditHighlight = (index: number) => {
    const highlight = highlights[index];
    setNewHighlight({
      title: highlight.title,
      description: highlight.description,
      video_url: highlight.video_url,
      thumbnail_url: highlight.thumbnail_url,
      duration: highlight.duration,
      sport_id: highlight.sport_id,
      sport_name: highlight.sport_name,
      position: highlight.position,
      play_type: highlight.play_type,
      difficulty: highlight.difficulty,
      is_public: highlight.is_public,
      is_featured: highlight.is_featured,
      tags: highlight.tags,
      player_targets: highlight.player_targets,
    });
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newHighlight.tags?.includes(newTag.trim())) {
      setNewHighlight((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewHighlight((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleAddPlayerTarget = () => {
    if (newPlayerTarget.name && newPlayerTarget.position) {
      const target: PlayerTarget = {
        id: Date.now().toString(),
        name: newPlayerTarget.name,
        position: newPlayerTarget.position,
        team: newPlayerTarget.team,
        time_marker: newPlayerTarget.time_marker || 0,
      };

      setNewHighlight((prev) => ({
        ...prev,
        player_targets: [...(prev.player_targets || []), target],
      }));

      setNewPlayerTarget({
        name: '',
        position: '',
        team: '',
        time_marker: 0,
      });
    }
  };

  const handleRemovePlayerTarget = (targetId: string) => {
    setNewHighlight((prev) => ({
      ...prev,
      player_targets:
        prev.player_targets?.filter((target) => target.id !== targetId) || [],
    }));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Video Highlights</h3>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isAdding}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Highlight
        </Button>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gray-900 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">
              {editingIndex !== null ? 'Edit Highlight' : 'Add New Highlight'}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setEditingIndex(null);
                setNewHighlight({
                  title: '',
                  description: '',
                  video_url: '',
                  thumbnail_url: '',
                  duration: 0,
                  sport_id: '',
                  sport_name: '',
                  position: '',
                  play_type: '',
                  difficulty: '',
                  is_public: true,
                  is_featured: false,
                  tags: [],
                  player_targets: [],
                });
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={newHighlight.title}
                  onChange={(e) =>
                    setNewHighlight((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter highlight title"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newHighlight.description}
                  onChange={(e) =>
                    setNewHighlight((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe your highlight"
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="sport" className="text-white">
                  Sport *
                </Label>
                <Select
                  value={newHighlight.sport_id}
                  onValueChange={(value) =>
                    setNewHighlight((prev) => ({ ...prev, sport_id: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {availableSports.map((sport) => (
                      <SelectItem
                        key={sport.id}
                        value={sport.id}
                        className="text-white"
                      >
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="play_type" className="text-white">
                  Play Type *
                </Label>
                <Select
                  value={newHighlight.play_type}
                  onValueChange={(value) =>
                    setNewHighlight((prev) => ({ ...prev, play_type: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select play type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {playTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="text-white"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="position" className="text-white">
                  Position
                </Label>
                <Select
                  value={newHighlight.position}
                  onValueChange={(value) =>
                    setNewHighlight((prev) => ({ ...prev, position: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {positions.map((pos) => (
                      <SelectItem key={pos} value={pos} className="text-white">
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty" className="text-white">
                  Difficulty
                </Label>
                <Select
                  value={newHighlight.difficulty}
                  onValueChange={(value) =>
                    setNewHighlight((prev) => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {difficulties.map((diff) => (
                      <SelectItem
                        key={diff}
                        value={diff}
                        className="text-white"
                      >
                        {diff}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Video Upload */}
              <div>
                <Label className="text-white">Video Upload *</Label>
                <div className="mt-2">
                  <input
                    ref={videoFileRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleVideoUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => videoFileRef.current?.click()}
                    disabled={isUploading}
                    className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {newHighlight.video_url
                      ? 'Video Uploaded ✓'
                      : 'Upload Video'}
                  </Button>
                  {isUploading && uploadProgress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                  {newHighlight.video_url && (
                    <p className="text-sm text-green-400 mt-1">
                      ✓ Video uploaded successfully
                    </p>
                  )}
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <Label className="text-white">Thumbnail Upload</Label>
                <div className="mt-2">
                  <input
                    ref={thumbnailFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleThumbnailUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => thumbnailFileRef.current?.click()}
                    disabled={isUploading}
                    className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {newHighlight.thumbnail_url
                      ? 'Thumbnail Uploaded ✓'
                      : 'Upload Thumbnail'}
                  </Button>
                  {newHighlight.thumbnail_url && (
                    <p className="text-sm text-green-400 mt-1">
                      ✓ Thumbnail uploaded successfully
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-6">
            <Label className="text-white">Tags</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                className="bg-gray-800 border-gray-600 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button
                onClick={handleAddTag}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add
              </Button>
            </div>
            {newHighlight.tags && newHighlight.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newHighlight.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-700 text-white"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Player Targets */}
          <div className="mt-6">
            <Label className="text-white">Player Targets</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
              <Input
                value={newPlayerTarget.name}
                onChange={(e) =>
                  setNewPlayerTarget((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Player name"
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Input
                value={newPlayerTarget.position}
                onChange={(e) =>
                  setNewPlayerTarget((prev) => ({
                    ...prev,
                    position: e.target.value,
                  }))
                }
                placeholder="Position"
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Input
                value={newPlayerTarget.team}
                onChange={(e) =>
                  setNewPlayerTarget((prev) => ({
                    ...prev,
                    team: e.target.value,
                  }))
                }
                placeholder="Team (optional)"
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Input
                type="number"
                value={newPlayerTarget.time_marker}
                onChange={(e) =>
                  setNewPlayerTarget((prev) => ({
                    ...prev,
                    time_marker: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="Time (seconds)"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <Button
              onClick={handleAddPlayerTarget}
              className="mt-2 bg-blue-600 hover:bg-blue-700"
            >
              Add Player Target
            </Button>
            {newHighlight.player_targets &&
              newHighlight.player_targets.length > 0 && (
                <div className="mt-2 space-y-2">
                  {newHighlight.player_targets.map((target) => (
                    <div
                      key={target.id}
                      className="flex items-center justify-between bg-gray-800 p-2 rounded"
                    >
                      <span className="text-white text-sm">
                        {target.name} ({target.position}){' '}
                        {target.team && `- ${target.team}`} at{' '}
                        {formatDuration(target.time_marker)}
                      </span>
                      <button
                        onClick={() => handleRemovePlayerTarget(target.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Privacy Settings */}
          <div className="mt-6 flex gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newHighlight.is_public}
                onChange={(e) =>
                  setNewHighlight((prev) => ({
                    ...prev,
                    is_public: e.target.checked,
                  }))
                }
                className="rounded border-gray-600 bg-gray-800"
              />
              <span className="text-white text-sm">Public</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newHighlight.is_featured}
                onChange={(e) =>
                  setNewHighlight((prev) => ({
                    ...prev,
                    is_featured: e.target.checked,
                  }))
                }
                className="rounded border-gray-600 bg-gray-800"
              />
              <span className="text-white text-sm">Featured</span>
            </label>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              onClick={
                editingIndex !== null
                  ? handleUpdateHighlight
                  : handleAddHighlight
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={
                !newHighlight.title ||
                !newHighlight.video_url ||
                !newHighlight.sport_id ||
                !newHighlight.play_type ||
                isUploading
              }
            >
              {editingIndex !== null ? 'Update Highlight' : 'Add Highlight'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setEditingIndex(null);
                setNewHighlight({
                  title: '',
                  description: '',
                  video_url: '',
                  thumbnail_url: '',
                  duration: 0,
                  sport_id: '',
                  sport_name: '',
                  position: '',
                  play_type: '',
                  difficulty: '',
                  is_public: true,
                  is_featured: false,
                  tags: [],
                  player_targets: [],
                });
              }}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Existing Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {highlights.map((highlight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <div className="relative">
              {highlight.thumbnail_url ? (
                <img
                  src={highlight.thumbnail_url}
                  alt={highlight.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                  <Video className="w-12 h-12 text-gray-600" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                {highlight.is_featured && (
                  <Badge className="bg-yellow-600 text-black">Featured</Badge>
                )}
                {!highlight.is_public && (
                  <Badge variant="secondary" className="bg-gray-700 text-white">
                    Private
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 px-2 py-1 rounded">
                <span className="text-white text-sm">
                  {formatDuration(highlight.duration)}
                </span>
              </div>
            </div>
            <CardContent className="p-4">
              <h4 className="font-semibold text-white mb-2">
                {highlight.title}
              </h4>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {highlight.description}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="border-blue-600 text-blue-400"
                >
                  {highlight.sport_name}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-green-600 text-green-400"
                >
                  {highlight.play_type}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-purple-600 text-purple-400"
                >
                  {highlight.difficulty}
                </Badge>
              </div>

              {highlight.tags && highlight.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {highlight.tags.slice(0, 3).map((tag, tagIndex) => (
                    <Badge
                      key={tagIndex}
                      variant="secondary"
                      className="bg-gray-700 text-white text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {highlight.tags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-700 text-white text-xs"
                    >
                      +{highlight.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="w-4 h-4" />
                    <span>0</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditHighlight(index)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveHighlight(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </motion.div>
        ))}
      </div>

      {highlights.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No highlights yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start by adding your first video highlight
          </p>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Highlight
          </Button>
        </div>
      )}
    </div>
  );
}
