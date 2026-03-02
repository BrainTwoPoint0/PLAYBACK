'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useAuth,
  useProfile,
  useOnboardingStatus,
} from '@braintwopoint0/playback-commons/auth';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@braintwopoint0/playback-commons/ui';
import { LoadingSpinner } from '@/components/ui/loading';
import { AvatarUpload } from '@/components/avatar/avatar-upload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlayerProfileForm } from '@/components/profile/player-profile-form';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { VideoUpload } from '@/components/video/video-upload';
import {
  createHighlight,
  deleteHighlight,
  importRecordingAsHighlight,
} from '@/lib/profile/actions';
import { createBrowserClient } from '@supabase/ssr';
import {
  User,
  Trophy,
  LogOut,
  Instagram,
  Twitter,
  Linkedin,
  CheckCircle,
  ExternalLink,
  Edit3,
  Share2,
  Target,
  Zap,
  Crown,
  Sparkles,
  ChevronRight,
  Play,
  Plus,
  Trash2,
  Film,
  Settings,
} from 'lucide-react';

// SocialLink Component (from public profile)
function SocialLink({
  platform,
  username,
}: {
  platform: string;
  username: string;
}) {
  const socialConfig = {
    instagram: {
      icon: Instagram,
      url: `https://instagram.com/${username}`,
      color: 'text-pink-400 hover:text-pink-300',
    },
    twitter: {
      icon: Twitter,
      url: `https://twitter.com/${username}`,
      color: 'text-sky-400 hover:text-sky-300',
    },
    linkedin: {
      icon: Linkedin,
      url: `https://linkedin.com/in/${username}`,
      color: 'text-blue-400 hover:text-blue-300',
    },
  };

  const config = socialConfig[platform as keyof typeof socialConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/50 hover:border-neutral-600 transition-all duration-300 hover:bg-neutral-800/50 group ${config.color}`}
    >
      <Icon className="h-5 w-5" />
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--timberwolf)' }}
      >
        @{username}
      </span>
      <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </a>
  );
}

function DashboardContent() {
  const { user, signOut, loading } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const onboardingStatus = useOnboardingStatus();
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [hasPlayerVariant, setHasPlayerVariant] = useState(false);
  const [footballData, setFootballData] = useState<{
    experience_level: string;
    preferred_foot: string | null;
    primary_position: string | null;
    secondary_positions: string[] | null;
    preferred_jersey_number: number | null;
  } | null>(null);
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [playerVariantId, setPlayerVariantId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<
    {
      id: string;
      title: string;
      thumbnail_url: string | null;
      video_url: string;
      duration: number | null;
      metadata: Record<string, unknown> | null;
    }[]
  >([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadedVideoData, setUploadedVideoData] = useState<{
    url: string;
    thumbnail: string;
    duration: number;
  } | null>(null);
  const [savingHighlight, setSavingHighlight] = useState(false);
  const [showPlayhubPicker, setShowPlayhubPicker] = useState(false);
  const [playhubRecordings, setPlayhubRecordings] = useState<
    {
      id: string;
      title: string;
      thumbnail_url: string | null;
      match_date: string;
      home_team: string;
      away_team: string;
      content_type: string;
      duration_seconds: number | null;
    }[]
  >([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Check if user has a player variant and fetch football data
  const checkPlayerVariant = useCallback(async () => {
    if (!profile.data?.id) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: variant } = await supabase
      .from('profile_variants')
      .select('id')
      .eq('profile_id', profile.data.id)
      .eq('variant_type', 'player')
      .single();
    setHasPlayerVariant(!!variant);

    if (variant) {
      const typedVariant = variant as unknown as { id: string };
      setPlayerVariantId(typedVariant.id);
      const { data: football } = await supabase
        .from('football_player_profiles')
        .select(
          'experience_level, preferred_foot, primary_position, secondary_positions, preferred_jersey_number'
        )
        .eq('profile_variant_id', typedVariant.id)
        .single();
      if (football) {
        setFootballData(football as unknown as typeof footballData);
      }

      // Fetch highlights
      const { data: highlightsData, count } = await supabase
        .from('highlights')
        .select('id, title, thumbnail_url, video_url, duration, metadata', {
          count: 'exact',
        })
        .eq('profile_variant_id', typedVariant.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setHighlightsCount(count || 0);
      setHighlights((highlightsData as unknown as typeof highlights) || []);
    }
  }, [profile.data?.id]);

  useEffect(() => {
    checkPlayerVariant();
  }, [checkPlayerVariant]);

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    if (!profile.data) return 0;

    const items = [
      { completed: !!(profile.data.full_name && profile.data.bio), weight: 20 },
      { completed: !!profile.data.avatar_url, weight: 15 },
      { completed: !!profile.data.location, weight: 10 },
      { completed: !!profile.data.username, weight: 10 },
      {
        completed: !!(
          profile.data.social_links &&
          Object.values(profile.data.social_links).some((link) => link)
        ),
        weight: 15,
      },
      { completed: hasPlayerVariant, weight: 15 },
      { completed: !!footballData?.primary_position, weight: 15 },
    ];

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = items
      .filter((item) => item.completed)
      .reduce((sum, item) => sum + item.weight, 0);
    return totalWeight > 0
      ? Math.round((completedWeight / totalWeight) * 100)
      : 0;
  }, [profile.data, hasPlayerVariant, footballData]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveHighlight = async () => {
    if (!uploadedVideoData || !uploadTitle.trim()) return;
    setSavingHighlight(true);
    const result = await createHighlight({
      title: uploadTitle.trim(),
      video_url: uploadedVideoData.url,
      thumbnail_url: uploadedVideoData.thumbnail || null,
      description: uploadDescription.trim() || null,
      duration: uploadedVideoData.duration || null,
    });
    setSavingHighlight(false);
    if (result.success) {
      setShowUploadDialog(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadedVideoData(null);
      checkPlayerVariant();
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    const result = await deleteHighlight(highlightId);
    if (result.success) {
      checkPlayerVariant();
    }
  };

  const fetchPlayhubRecordings = useCallback(async () => {
    setLoadingRecordings(true);
    try {
      const res = await fetch('/api/recordings/accessible');
      if (res.ok) {
        const data = await res.json();
        setPlayhubRecordings(data.recordings || []);
      }
    } catch {
      // Silently fail — user may not have PLAYHUB access
    }
    setLoadingRecordings(false);
  }, []);

  const handleImportRecording = async (recordingId: string) => {
    setImportingId(recordingId);
    const result = await importRecordingAsHighlight(recordingId);
    setImportingId(null);
    if (result.success) {
      checkPlayerVariant();
      fetchPlayhubRecordings();
    }
  };

  useEffect(() => {
    if (showPlayhubPicker) {
      fetchPlayhubRecordings();
    }
  }, [showPlayhubPicker, fetchPlayhubRecordings]);

  if (loading || onboardingStatus.loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Welcome back,{' '}
                  {profile.data?.full_name?.split(' ')[0] || 'User'}
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-neutral-800/50"
              onClick={handleSignOut}
              style={{ color: 'var(--ash-grey)' }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
          <p className="text-base" style={{ color: 'var(--ash-grey)' }}>
            Continue building your sports profile with cutting-edge tools and
            insights.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
          {/* Profile Completion */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6 hover:border-green-400/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-400/10 rounded-xl">
                <Target className="h-5 w-5 text-green-400" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-green-400 transition-colors" />
            </div>
            <h3
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--ash-grey)' }}
            >
              Profile Completion
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">
                {profileCompletion}%
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  profileCompletion >= 90
                    ? 'bg-yellow-400/10 text-yellow-400'
                    : profileCompletion >= 70
                      ? 'bg-green-400/10 text-green-400'
                      : profileCompletion >= 50
                        ? 'bg-blue-400/10 text-blue-400'
                        : profileCompletion >= 30
                          ? 'bg-blue-400/10 text-blue-400'
                          : 'bg-red-400/10 text-red-400'
                }`}
              >
                {profileCompletion >= 90
                  ? 'Complete'
                  : profileCompletion >= 70
                    ? 'Strong'
                    : profileCompletion >= 50
                      ? 'Good'
                      : profileCompletion >= 30
                        ? 'Basic'
                        : 'Starting'}
              </span>
            </div>
          </div>

          {/* Highlights */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6 hover:border-purple-400/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-400/10 rounded-xl">
                <Play className="h-5 w-5 text-purple-400" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-purple-400 transition-colors" />
            </div>
            <h3
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--ash-grey)' }}
            >
              Highlights
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-purple-400">
                {highlightsCount}
              </span>
              <span className="text-xs bg-purple-400/10 text-purple-400 px-2 py-1 rounded-full">
                {highlightsCount === 1 ? 'Video' : 'Videos'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section - Takes up 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-blue-400/20"></div>
              </div>

              <div className="relative z-10">
                {/* Profile Content */}
                <div className="flex flex-col items-center md:flex-row md:items-start gap-4 md:gap-8 mb-6">
                  {/* Left Column - Profile Picture */}
                  <div className="relative flex-shrink-0">
                    {user && (
                      <AvatarUpload
                        userId={user.id}
                        currentAvatarUrl={profile.data?.avatar_url}
                        fullName={profile.data?.full_name || 'User'}
                        onAvatarUpdate={() => refreshProfile(true)}
                        size="lg"
                      />
                    )}
                  </div>

                  {/* Right Column - Profile Info */}
                  <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
                    {/* Row 1: Name */}
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <h2
                        className="text-2xl font-bold"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {profile.data?.full_name || 'Your Name'}
                      </h2>
                    </div>

                    {/* Row 2: Username */}
                    {profile.data?.username && (
                      <div>
                        <p
                          className="text-sm"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          @{profile.data.username}
                        </p>
                      </div>
                    )}

                    {/* Row 3: Bio */}
                    {profile.data?.bio && (
                      <div>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          {profile.data.bio}
                        </p>
                      </div>
                    )}

                    {/* Row 4: Profile Variants (New Schema) */}
                    <div className="pt-2">
                      <p
                        className="text-xs font-medium mb-2"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Profile Status:
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/30 border border-neutral-700/50 rounded-full">
                          <Trophy className="h-3 w-3 text-green-400" />
                          <span
                            className="text-xs font-medium"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            Base Profile Active
                          </span>
                        </div>
                        {hasPlayerVariant && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-400/10 border border-green-400/30 rounded-full">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-xs font-medium text-green-400">
                              Player Profile
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 5: Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neutral-600 hover:bg-neutral-800/50 group"
                        onClick={() => {
                          if (profile.data?.username) {
                            window.location.href = `/player/${profile.data.username}`;
                          }
                        }}
                        disabled={!hasPlayerVariant}
                      >
                        <Share2
                          className="h-4 w-4 mr-2"
                          style={{ color: 'var(--ash-grey)' }}
                        />
                        <span style={{ color: 'var(--ash-grey)' }}>
                          View Public
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white group"
                        onClick={() => {
                          if (hasPlayerVariant && footballData) {
                            setShowEditForm(true);
                          } else {
                            setShowPlayerForm(true);
                          }
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-neutral-700/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      {hasPlayerVariant ? 1 : 0}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Profile Variants
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {highlightsCount}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Highlights
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Modules Section */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-400/10 rounded-xl">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                  </div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    Profile Modules
                  </h3>
                </div>
              </div>

              {/* Available Profile Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Player Profile */}
                <div
                  className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 hover:bg-neutral-700/30 hover:border-green-400/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => {
                    if (hasPlayerVariant) {
                      window.location.href = `/player/${profile.data?.username}`;
                    } else {
                      setShowPlayerForm(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-lg">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4
                        className="font-medium group-hover:text-green-400 transition-colors"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        Player Profile
                      </h4>
                      <p
                        className="text-xs h-8 flex items-start"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {hasPlayerVariant
                          ? 'View your public player profile'
                          : 'Showcasing your skills and achievements'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-700/30">
                    <div className="h-6"></div>
                    {hasPlayerVariant ? (
                      <div className="flex items-center gap-1.5 bg-green-400/10 text-green-400 border border-green-400/30 px-3 py-1 rounded-full text-xs">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </div>
                    ) : (
                      <div className="bg-green-400/10 text-green-400 border border-green-400/30 px-3 py-1 rounded-full text-xs">
                        Create
                      </div>
                    )}
                  </div>
                </div>

                {/* Coach Profile - Coming Soon */}
                <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 opacity-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-lg">
                      <User className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4
                        className="font-medium"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        Coach Profile
                      </h4>
                      <p
                        className="text-xs h-8 flex items-start"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Build coaching portfolio
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-700/30">
                    <div className="h-6"></div>
                    <div className="bg-blue-400/10 text-blue-400 border border-blue-400/30 px-3 py-1 rounded-full text-xs">
                      Coming Soon
                    </div>
                  </div>
                </div>

                {/* Club Admin Profile - Coming Soon */}
                <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 opacity-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-orange-400/10 to-yellow-400/10 rounded-lg">
                      <Crown className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4
                        className="font-medium"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        Club Admin
                      </h4>
                      <p
                        className="text-xs h-8 flex items-start"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Manage clubs and teams
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-700/30">
                    <div className="h-6"></div>
                    <div className="bg-blue-400/10 text-blue-400 border border-blue-400/30 px-3 py-1 rounded-full text-xs">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlights Section */}
            {hasPlayerVariant && (
              <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-400/10 rounded-xl">
                      <Film className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      Highlights
                    </h3>
                    <span
                      className="text-sm"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      ({highlightsCount})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                      onClick={() => setShowPlayhubPicker(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">From PLAYHUB</span>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                      onClick={() => setShowUploadDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>

                {highlights.length === 0 ? (
                  <div className="text-center py-12 rounded-xl bg-neutral-800/20 border border-neutral-700/30">
                    <Play
                      className="h-8 w-8 mx-auto mb-3"
                      style={{ color: 'var(--ash-grey)' }}
                    />
                    <p
                      className="text-sm mb-1"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      No highlights yet
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Upload videos or import from PLAYHUB
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {highlights.map((h) => (
                      <div
                        key={h.id}
                        className="group rounded-xl overflow-hidden bg-neutral-800/30 border border-neutral-700/30 hover:border-neutral-600 transition-all"
                      >
                        <a
                          href={h.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="relative aspect-video bg-neutral-900">
                            {h.thumbnail_url ? (
                              <img
                                src={h.thumbnail_url}
                                alt={h.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="h-8 w-8 text-neutral-600" />
                              </div>
                            )}
                            {h.metadata?.source === 'playhub' && (
                              <span className="absolute top-2 left-2 bg-blue-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                PLAYHUB
                              </span>
                            )}
                          </div>
                        </a>
                        <div className="p-3 flex items-center justify-between">
                          <p
                            className="text-sm font-medium truncate flex-1"
                            style={{ color: 'var(--timberwolf)' }}
                          >
                            {h.title}
                          </p>
                          <button
                            onClick={() => handleDeleteHighlight(h.id)}
                            className="ml-2 p-1 rounded hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Quick Actions and Social */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-400/10 rounded-xl">
                  <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  Quick Actions
                </h3>
              </div>

              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-neutral-800/30 hover:bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600/50 transition-all duration-300 group"
                  onClick={() => {
                    if (hasPlayerVariant && footballData) {
                      setShowEditForm(true);
                    }
                  }}
                >
                  <Settings className="h-4 w-4 mr-3 text-gray-400" />
                  <span style={{ color: 'var(--timberwolf)' }}>
                    Profile Settings
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-neutral-600 group-hover:text-green-400" />
                </Button>
              </div>
            </div>

            {/* Social Links */}
            {profile.data?.social_links &&
              Object.values(profile.data.social_links).some((link) => link) && (
                <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-400/10 rounded-xl">
                      <Share2 className="h-5 w-5 text-pink-400" />
                    </div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      Connect
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {profile.data.social_links.instagram && (
                      <SocialLink
                        platform="instagram"
                        username={profile.data.social_links.instagram}
                      />
                    )}
                    {profile.data.social_links.twitter && (
                      <SocialLink
                        platform="twitter"
                        username={profile.data.social_links.twitter}
                      />
                    )}
                    {profile.data.social_links.linkedin && (
                      <SocialLink
                        platform="linkedin"
                        username={profile.data.social_links.linkedin}
                      />
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Player Profile Creation Dialog */}
      <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Player Profile</DialogTitle>
            <DialogDescription>
              Set up your football player profile to showcase your skills.
            </DialogDescription>
          </DialogHeader>
          <PlayerProfileForm
            onSuccess={() => {
              setShowPlayerForm(false);
              setHasPlayerVariant(true);
              checkPlayerVariant();
            }}
            onCancel={() => setShowPlayerForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Edit Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile details across different sections.
            </DialogDescription>
          </DialogHeader>
          {profile.data && footballData && (
            <ProfileEditForm
              profileData={{
                bio: profile.data.bio ?? null,
                social_links:
                  (profile.data.social_links as Record<string, string>) ?? null,
                height_cm: profile.data.height_cm ?? null,
                weight_kg: profile.data.weight_kg ?? null,
                date_of_birth: profile.data.date_of_birth ?? null,
                location: profile.data.location ?? null,
                nationality: profile.data.nationality ?? null,
              }}
              footballData={footballData}
              onSaved={() => {
                setShowEditForm(false);
                checkPlayerVariant();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Highlight Dialog */}
      <Dialog
        open={showUploadDialog}
        onOpenChange={(open) => {
          setShowUploadDialog(open);
          if (!open) {
            setUploadTitle('');
            setUploadDescription('');
            setUploadedVideoData(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Highlight</DialogTitle>
            <DialogDescription>
              Add a video highlight to your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Title *
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Match Highlights vs FC United"
                maxLength={100}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-green-400"
                style={{ color: 'var(--timberwolf)' }}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--timberwolf)' }}
              >
                Description
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Optional description..."
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-green-400 resize-none"
                style={{ color: 'var(--timberwolf)' }}
              />
            </div>
            {user && (
              <VideoUpload
                userId={user.id}
                onVideoUploaded={(data) =>
                  setUploadedVideoData({
                    url: data.url,
                    thumbnail: data.thumbnail,
                    duration: data.duration,
                  })
                }
                maxFiles={1}
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(false)}
                className="border-neutral-600"
                style={{ color: 'var(--ash-grey)' }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveHighlight}
                disabled={
                  !uploadedVideoData || !uploadTitle.trim() || savingHighlight
                }
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
              >
                {savingHighlight ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  'Save Highlight'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PLAYHUB Recording Picker Dialog */}
      <Dialog open={showPlayhubPicker} onOpenChange={setShowPlayhubPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import from PLAYHUB</DialogTitle>
            <DialogDescription>
              Add match recordings you have access to as profile highlights.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loadingRecordings ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : playhubRecordings.length === 0 ? (
              <div className="text-center py-8">
                <Film
                  className="h-8 w-8 mx-auto mb-3"
                  style={{ color: 'var(--ash-grey)' }}
                />
                <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                  No recordings available
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Purchase match recordings on PLAYHUB to import them here.
                </p>
              </div>
            ) : (
              playhubRecordings.map((rec) => {
                const alreadyImported = highlights.some(
                  (h) =>
                    h.metadata?.source === 'playhub' &&
                    h.metadata?.recording_id === rec.id
                );
                return (
                  <div
                    key={rec.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      alreadyImported
                        ? 'border-neutral-700/30 opacity-50'
                        : 'border-neutral-700/50 hover:border-blue-400/30'
                    }`}
                  >
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                      {rec.thumbnail_url ? (
                        <img
                          src={rec.thumbnail_url}
                          alt={rec.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-5 w-5 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {rec.title || `${rec.home_team} vs ${rec.away_team}`}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {rec.home_team} vs {rec.away_team}
                        {rec.match_date &&
                          ` · ${new Date(rec.match_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    {alreadyImported ? (
                      <span className="text-xs text-green-400 flex items-center gap-1 flex-shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        Added
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10 flex-shrink-0"
                        onClick={() => handleImportRecording(rec.id)}
                        disabled={importingId === rec.id}
                      >
                        {importingId === rec.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
