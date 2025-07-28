'use client';

import { useState, useEffect } from 'react';
import { useAuth, useProfile } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { AvatarDisplay } from '@/components/avatar/avatar-upload';
import { SportsTab } from '@/components/profile/sports-tab';
import { PhysicalAttributesTab } from '@/components/profile/physical-attributes-tab';
import { getUserHighlights } from '@/lib/highlights/utils';
import {
  updateUserSports,
  updateProfileBasicInfo,
  SportSelection,
} from '@/lib/profile/utils';
import {
  User,
  Trophy,
  ArrowLeft,
  Edit3,
  Share2,
  TrendingUp,
  Play,
  Target,
  CheckCircle,
  Crown,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface PlayerProfileProps {}

function PlayerProfileContent() {
  const { user } = useAuth();
  const { profile, updateProfile, refreshProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'sports' | 'physical' | 'highlights'
  >('overview');
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  // Load highlights count
  useEffect(() => {
    const loadHighlights = async () => {
      if (!user) return;
      try {
        const result = await getUserHighlights(user.id);
        if (result.data) {
          setHighlightsCount(result.data.length);
        }
      } catch (error) {
        console.error('Error loading highlights:', error);
      }
    };
    loadHighlights();
  }, [user]);

  const handleProfileUpdate = async (updates: any) => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Check if this is a sports update
      if (updates.user_sports) {
        // Convert to SportSelection format
        const sportsData: SportSelection[] = updates.user_sports
          .map((sport: any) => {
            // Get sport_id - it should already be a string UUID from the SportSelection
            const sportId = sport.sport_id || sport.sport?.id;

            if (!sportId || sportId === '0') {
              console.error('Invalid sport data - missing sport_id:', sport);
              return null;
            }

            return {
              sport_id: sportId,
              sport_name: sport.sport_name || sport.sport?.name || 'Unknown',
              role: sport.role || 'player',
              positions: sport.positions || [],
              experience_level: sport.experience_level || 'beginner',
            };
          })
          .filter(Boolean);

        const result = await updateUserSports(user.id, sportsData);
        if (result.error) {
          console.error('Error saving sports:', result.error);
          setSaveStatus('error');
          return;
        } else {
          setSaveStatus('success');
        }
      } else {
        // Handle other profile updates (physical attributes, basic info)
        const result = await updateProfileBasicInfo(user.id, updates);
        if (result.error) {
          console.error('Error saving profile:', result.error);
          setSaveStatus('error');
          return;
        } else {
          setSaveStatus('success');
        }
      }

      // Optimistically update local state
      updateProfile(updates);

      // Refresh profile data from server
      await refreshProfile(true);

      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
      setHasUnsavedChanges(false);
    }
  };

  const markChanged = () => {
    setHasUnsavedChanges(true);
  };

  const handleSportsUpdate = async (updates: any) => {
    // Auto-save sports changes immediately
    await handleProfileUpdate(updates);
  };

  const handlePhysicalUpdate = (updates: any) => {
    // For physical attributes, just mark as changed (manual save)
    updateProfile(updates);
    markChanged();
  };

  if (!profile.data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: User,
      description: 'Profile summary and stats',
    },
    {
      id: 'sports' as const,
      label: 'Sports & Positions',
      icon: Trophy,
      description: 'Manage your sports and positions',
    },
    {
      id: 'physical' as const,
      label: 'Physical Attributes',
      icon: TrendingUp,
      description: 'Height, weight, and fitness data',
    },
    {
      id: 'highlights' as const,
      label: 'Highlights',
      icon: Play,
      description: 'Video highlights and reels',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 hover:bg-neutral-800/50"
              style={{ color: 'var(--ash-grey)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="w-px h-6 bg-neutral-700"></div>
            <div>
              <h1
                className="text-2xl font-bold flex items-center gap-3"
                style={{ color: 'var(--timberwolf)' }}
              >
                <div className="p-2 bg-yellow-400/10 rounded-xl">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                </div>
                Player Profile
              </h1>
              <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                Manage your athletic profile and showcase your skills
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            {isSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-400/10 border border-blue-400/30 rounded-full">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-blue-400">Saving...</span>
              </div>
            )}
            {saveStatus === 'success' && !isSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-400/10 border border-green-400/30 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">Saved</span>
              </div>
            )}
            {saveStatus === 'error' && !isSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-400/10 border border-red-400/30 rounded-full">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">Save Failed</span>
              </div>
            )}

            {/* Manual Save Button for Physical Attributes */}
            {hasUnsavedChanges && (
              <Button
                onClick={() => handleProfileUpdate({})}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-600 hover:bg-neutral-800/50"
              onClick={() =>
                window.open(`/profile/${profile.data?.username}`, '_blank')
              }
            >
              <Share2 className="h-4 w-4 mr-2" />
              View Public
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Profile Summary & Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-fit">
                  <AvatarDisplay
                    avatarUrl={profile.data.avatar_url}
                    fullName={profile.data.full_name || 'Player'}
                    size="2xl"
                    className="ring-4 ring-neutral-700/50"
                  />
                  {profile.data.is_verified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                <div>
                  <h3
                    className="text-lg font-bold flex items-center justify-center gap-2"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    {profile.data.full_name || 'Player Name'}
                    {profile.data.is_verified && (
                      <Crown className="h-4 w-4 text-yellow-400" />
                    )}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                    @{profile.data.username}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-700/50">
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-400">
                      {profile.data.user_sports?.length || 0}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Sports
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-purple-400">
                      {highlightsCount}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Highlights
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4">
              <h4
                className="text-sm font-semibold mb-4"
                style={{ color: 'var(--timberwolf)' }}
              >
                Profile Sections
              </h4>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-green-400/10 border border-green-400/30'
                          : 'hover:bg-neutral-800/30 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive
                              ? 'text-green-400'
                              : 'text-neutral-400 group-hover:text-green-400'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              isActive
                                ? 'text-green-400'
                                : 'text-timberwolf group-hover:text-green-400'
                            }`}
                          >
                            {tab.label}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            {tab.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      Player Profile Overview
                    </h2>
                    <p
                      className="text-base"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Complete overview of your athletic profile and
                      achievements
                    </p>
                  </div>

                  {/* Profile Completion */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-6 text-center">
                      <Target className="h-8 w-8 mx-auto mb-3 text-green-400" />
                      <h3
                        className="text-lg font-semibold mb-2"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        Profile Power
                      </h3>
                      <p className="text-2xl font-bold text-green-400 mb-1">
                        85%
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Strong profile
                      </p>
                    </div>

                    <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-6 text-center">
                      <Trophy className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
                      <h3
                        className="text-lg font-semibold mb-2"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        Sports Added
                      </h3>
                      <p className="text-2xl font-bold text-yellow-400 mb-1">
                        {profile.data.user_sports?.length || 0}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Active sports
                      </p>
                    </div>

                    <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-6 text-center">
                      <Play className="h-8 w-8 mx-auto mb-3 text-purple-400" />
                      <h3
                        className="text-lg font-semibold mb-2"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        Highlights
                      </h3>
                      <p className="text-2xl font-bold text-purple-400 mb-1">
                        {highlightsCount}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Video content
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => setActiveTab('sports')}
                        variant="outline"
                        className="justify-start h-auto p-4 border-neutral-600 hover:bg-neutral-800/50"
                      >
                        <Trophy className="h-5 w-5 mr-3 text-yellow-400" />
                        <div className="text-left">
                          <p
                            className="font-medium"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            Manage Sports
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            Add sports and positions
                          </p>
                        </div>
                      </Button>

                      <Button
                        onClick={() => setActiveTab('physical')}
                        variant="outline"
                        className="justify-start h-auto p-4 border-neutral-600 hover:bg-neutral-800/50"
                      >
                        <TrendingUp className="h-5 w-5 mr-3 text-purple-400" />
                        <div className="text-left">
                          <p
                            className="font-medium"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            Physical Data
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            Height, weight, metrics
                          </p>
                        </div>
                      </Button>

                      <Button
                        onClick={() => (window.location.href = '/highlights')}
                        variant="outline"
                        className="justify-start h-auto p-4 border-neutral-600 hover:bg-neutral-800/50"
                      >
                        <Play className="h-5 w-5 mr-3 text-purple-400" />
                        <div className="text-left">
                          <p
                            className="font-medium"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            Upload Highlights
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            Add video content
                          </p>
                        </div>
                      </Button>

                      <Button
                        onClick={() =>
                          window.open(
                            `/profile/${profile.data?.username}`,
                            '_blank'
                          )
                        }
                        variant="outline"
                        className="justify-start h-auto p-4 border-neutral-600 hover:bg-neutral-800/50"
                      >
                        <Share2 className="h-5 w-5 mr-3 text-blue-400" />
                        <div className="text-left">
                          <p
                            className="font-medium"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            View Public Profile
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            See how others view you
                          </p>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sports' && (
                <SportsTab
                  profile={profile.data}
                  onUpdate={handleSportsUpdate}
                  onMarkChanged={() => {}} // No need for manual marking since we auto-save
                  fixedRole="player"
                />
              )}

              {activeTab === 'physical' && (
                <PhysicalAttributesTab
                  profile={profile.data}
                  onUpdate={handlePhysicalUpdate}
                  onMarkChanged={markChanged}
                />
              )}

              {activeTab === 'highlights' && (
                <div className="text-center py-12">
                  <Play
                    className="h-16 w-16 mx-auto mb-4"
                    style={{ color: 'var(--ash-grey)', opacity: 0.5 }}
                  />
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    Highlights Integration
                  </h3>
                  <p
                    className="text-base mb-6"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Manage your video highlights and reels from the main
                    highlights page
                  </p>
                  <Button
                    onClick={() => (window.location.href = '/highlights')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Go to Highlights
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerProfilePage() {
  return (
    <ProtectedRoute>
      <PlayerProfileContent />
    </ProtectedRoute>
  );
}
