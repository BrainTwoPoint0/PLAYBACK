'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User } from '@supabase/supabase-js';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/radix-tabs';
import { Badge } from './ui/badge';
import {
  Save,
  X,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Globe,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import SportsSelector from './SportsSelector';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';

interface ProfileEditorProps {
  user: User | null;
  profile: any;
  onSave: (profile: any) => void;
  onCancel: () => void;
}

interface ProfileSection {
  id?: string;
  section_type: string;
  title: string;
  content: string;
  is_public: boolean;
  order_index: number;
}

const sectionTypes = [
  { id: 'about', name: 'About Me', icon: '👤' },
  { id: 'experience', name: 'Experience', icon: '💼' },
  { id: 'education', name: 'Education', icon: '🎓' },
  { id: 'achievements', name: 'Achievements', icon: '🏆' },
  { id: 'skills', name: 'Skills', icon: '⚡' },
  { id: 'interests', name: 'Interests', icon: '❤️' },
  { id: 'contact', name: 'Contact Info', icon: '📞' },
];

export default function ProfileEditor({
  user,
  profile,
  onSave,
  onCancel,
}: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    title: profile?.title || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    avatar_url: profile?.avatar_url || '',
    is_public: profile?.is_public || false,
    tags: profile?.tags || [],
  });

  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [selectedSports, setSelectedSports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Avatar upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfileData();
  }, [profile]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Load user sports
      const { data: sportsData } = await supabase
        .from('user_sports')
        .select('*')
        .eq('user_id', user.id);

      if (sportsData) {
        setSelectedSports(sportsData);
      }

      // Load profile sections
      const { data: sectionsData } = await supabase
        .from('profile_sections')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index');

      if (sectionsData) {
        setSections(sectionsData);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  // Handle avatar file upload
  const handleAvatarUpload = async (file: File) => {
    if (!file || !user) return;

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      formData.append('userId', user.id);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          avatar_url: result.data.url,
        }));
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          title: formData.title,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          avatar_url: formData.avatar_url,
          is_public: formData.is_public,
          tags: formData.tags,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update user sports
      if (selectedSports.length > 0) {
        // Delete existing sports
        await supabase.from('user_sports').delete().eq('user_id', user.id);

        // Insert new sports
        const sportsToInsert = selectedSports.map((sport) => ({
          user_id: user.id,
          sport_id: sport.sport_id,
          role: sport.role,
          experience_level: sport.experience_level,
          years_experience: sport.years_experience,
          is_primary: sport.is_primary,
        }));

        const { error: sportsError } = await supabase
          .from('user_sports')
          .insert(sportsToInsert);

        if (sportsError) throw sportsError;
      }

      // Update profile sections
      if (sections.length > 0) {
        // Delete existing sections
        await supabase.from('profile_sections').delete().eq('user_id', user.id);

        // Insert new sections
        const sectionsToInsert = sections.map((section) => ({
          user_id: user.id,
          section_type: section.section_type,
          title: section.title,
          content: section.content,
          is_public: section.is_public,
          order_index: section.order_index,
        }));

        const { error: sectionsError } = await supabase
          .from('profile_sections')
          .insert(sectionsToInsert);

        if (sectionsError) throw sectionsError;
      }

      onSave({ ...profile, ...formData });
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag: string) => tag !== tagToRemove),
    });
  };

  const handleAddSection = () => {
    const newSection: ProfileSection = {
      section_type: 'about',
      title: '',
      content: '',
      is_public: true,
      order_index: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (
    index: number,
    field: keyof ProfileSection,
    value: any
  ) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setSections(updatedSections);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isLoading || isUploadingAvatar}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-600 text-white hover:bg-gray-700"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="basic" className="text-white">
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="sports" className="text-white">
            Sports
          </TabsTrigger>
          <TabsTrigger value="sections" className="text-white">
            Sections
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-white">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {formData.avatar_url ? (
                    <Image
                      src={formData.avatar_url}
                      alt="Profile avatar"
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAvatarUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-2 -right-2 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">
                    Upload a profile picture (JPG, PNG, WebP)
                  </p>
                  {isUploadingAvatar && (
                    <p className="text-sm text-blue-400">Uploading avatar...</p>
                  )}
                  {formData.avatar_url && !isUploadingAvatar && (
                    <p className="text-sm text-green-400">
                      ✓ Avatar uploaded successfully
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name" className="text-white">
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-white">
                    Username *
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="Choose a username"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="title" className="text-white">
                    Professional Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Professional Footballer"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-white">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="City, Country"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-white">
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://yourwebsite.com"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio" className="text-white">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              {/* Tags */}
              <div>
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
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag: string, index: number) => (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sports" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Sports & Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <SportsSelector
                selectedSports={selectedSports}
                onSportsChange={setSelectedSports}
                availableSports={[
                  { id: 'football', name: 'Football', icon: '⚽' },
                  { id: 'basketball', name: 'Basketball', icon: '🏀' },
                  { id: 'tennis', name: 'Tennis', icon: '🎾' },
                  { id: 'rugby', name: 'Rugby', icon: '🏉' },
                  { id: 'cricket', name: 'Cricket', icon: '🏏' },
                  { id: 'hockey', name: 'Hockey', icon: '🏑' },
                  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
                  { id: 'badminton', name: 'Badminton', icon: '🏸' },
                  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
                  { id: 'golf', name: 'Golf', icon: '⛳' },
                  { id: 'swimming', name: 'Swimming', icon: '🏊' },
                  { id: 'athletics', name: 'Athletics', icon: '🏃' },
                  { id: 'boxing', name: 'Boxing', icon: '🥊' },
                  { id: 'martial-arts', name: 'Martial Arts', icon: '🥋' },
                  { id: 'cycling', name: 'Cycling', icon: '🚴' },
                  { id: 'lacrosse', name: 'Lacrosse', icon: '🥍' },
                  { id: 'padel', name: 'Padel', icon: '🎾' },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Profile Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="border border-gray-700 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Select
                      value={section.section_type}
                      onValueChange={(value) =>
                        handleUpdateSection(index, 'section_type', value)
                      }
                    >
                      <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {sectionTypes.map((type) => (
                          <SelectItem
                            key={type.id}
                            value={type.id}
                            className="text-white"
                          >
                            {type.icon} {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={section.is_public}
                          onChange={(e) =>
                            handleUpdateSection(
                              index,
                              'is_public',
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-600 bg-gray-800"
                        />
                        <span className="text-white text-sm">Public</span>
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSection(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={section.title}
                    onChange={(e) =>
                      handleUpdateSection(index, 'title', e.target.value)
                    }
                    placeholder="Section title"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <Textarea
                    value={section.content}
                    onChange={(e) =>
                      handleUpdateSection(index, 'content', e.target.value)
                    }
                    placeholder="Section content..."
                    rows={3}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              ))}
              <Button
                onClick={handleAddSection}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {formData.is_public ? (
                    <Globe className="w-5 h-5 text-green-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <h4 className="font-medium text-white">
                      Profile Visibility
                    </h4>
                    <p className="text-sm text-gray-400">
                      {formData.is_public
                        ? 'Your profile is public and can be viewed by anyone'
                        : 'Your profile is private and only visible to you'}
                    </p>
                  </div>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) =>
                      setFormData({ ...formData, is_public: e.target.checked })
                    }
                    className="rounded border-gray-600 bg-gray-800"
                  />
                  <span className="text-white text-sm">Public Profile</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
