'use client';

import { useState, useEffect } from 'react';
import { useAuth, useProfile, useOnboardingStatus } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { AvatarDisplay } from '@/components/avatar/avatar-upload';
import { getUserHighlights } from '@/lib/highlights/utils';
import { getUserStatistics } from '@/lib/stats/utils';
import {
  User,
  Mail,
  Calendar,
  Trophy,
  LogOut,
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Edit3,
  Share2,
  BarChart3,
  Target,
  Zap,
  Crown,
  TrendingUp,
  Star,
  Sparkles,
  ChevronRight,
  Play,
  Upload,
  Settings,
  Bell,
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
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [statsCount, setStatsCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefreshProfile = async () => {
    await refreshProfile(true); // Force refresh
  };

  const isIncomplete =
    !onboardingStatus.isComplete && !onboardingStatus.loading && !loading;

  // Fetch user data counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;

      setLoadingCounts(true);
      try {
        const [highlightsResult, statsResult] = await Promise.all([
          getUserHighlights(user.id),
          getUserStatistics(user.id),
        ]);

        if (highlightsResult.data && !highlightsResult.error) {
          setHighlightsCount(highlightsResult.data.length);
        }

        if (statsResult.data && !statsResult.error) {
          setStatsCount(statsResult.data.length);
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchCounts();
  }, [user]);

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
                  {profile.data?.full_name?.split(' ')[0] || 'Athlete'}
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
            Continue building your athletic legacy with cutting-edge tools and
            insights.
          </p>
        </div>

        {/* Performance Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Profile Strength */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 group">
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
              Profile Strength
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">85%</span>
              <span className="text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded-full">
                Strong
              </span>
            </div>
          </div>

          {/* Performance Score */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 hover:border-blue-400/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-400/10 rounded-xl">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--ash-grey)' }}
            >
              Performance
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-400">92</span>
              <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full">
                Elite
              </span>
            </div>
          </div>

          {/* Highlights */}
          <div
            className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 hover:border-purple-400/30 transition-all duration-300 group cursor-pointer"
            onClick={() => (window.location.href = '/highlights')}
          >
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
                {loadingCounts ? '...' : highlightsCount}
              </span>
              <span className="text-xs bg-purple-400/10 text-purple-400 px-2 py-1 rounded-full">
                Videos
              </span>
            </div>
          </div>

          {/* Connections */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 hover:border-orange-400/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-400/10 rounded-xl">
                <Star className="h-5 w-5 text-orange-400" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-orange-400 transition-colors" />
            </div>
            <h3
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--ash-grey)' }}
            >
              Network
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-orange-400">247</span>
              <span className="text-xs bg-orange-400/10 text-orange-400 px-2 py-1 rounded-full">
                Pro
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
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <AvatarDisplay
                        avatarUrl={profile.data?.avatar_url}
                        fullName={profile.data?.full_name || 'User'}
                        size="xl"
                        className="ring-4 ring-neutral-700/50"
                      />
                      {profile.data?.is_verified && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2
                          className="text-2xl font-bold"
                          style={{ color: 'var(--timberwolf)' }}
                        >
                          {profile.data?.full_name || 'Your Name'}
                        </h2>
                        {profile.data?.is_verified && (
                          <Crown className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                      {profile.data?.username && (
                        <p
                          className="text-sm mb-3"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          @{profile.data.username}
                        </p>
                      )}
                      {profile.data?.bio && (
                        <p
                          className="text-sm leading-relaxed max-w-md"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          {profile.data.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-neutral-600 hover:bg-neutral-800/50 group"
                      onClick={() =>
                        window.open(
                          `/profile/${profile.data?.username}`,
                          '_blank'
                        )
                      }
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
                      onClick={() => (window.location.href = '/profile/edit')}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-neutral-700/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      {profile.data?.user_sports?.length || 0}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Sports
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {loadingCounts ? '...' : highlightsCount}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Highlights
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                      {loadingCounts ? '...' : statsCount}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Statistics
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sports Section */}
            {profile.data?.user_sports &&
              profile.data.user_sports.length > 0 && (
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
                        Athletic Profile
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-neutral-800/50"
                      onClick={() =>
                        (window.location.href = '/profile/edit?tab=sports')
                      }
                    >
                      <Edit3
                        className="h-4 w-4"
                        style={{ color: 'var(--ash-grey)' }}
                      />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.data.user_sports.map(
                      (sport: any, index: number) => (
                        <div
                          key={index}
                          className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 hover:border-neutral-600/50 transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-lg">
                              <Trophy className="h-4 w-4 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <h4
                                className="font-medium"
                                style={{ color: 'var(--timberwolf)' }}
                              >
                                {sport.sport?.name || 'Unknown Sport'}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="text-xs bg-neutral-700/50 px-2 py-1 rounded-full"
                                  style={{ color: 'var(--ash-grey)' }}
                                >
                                  {sport.role?.charAt(0).toUpperCase() +
                                    sport.role?.slice(1) || 'Player'}
                                  {sport.role === 'player' &&
                                    sport.positions?.[0] &&
                                    ` • ${sport.positions[0]}`}
                                </span>
                                <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full">
                                  {sport.experience_level
                                    ?.charAt(0)
                                    .toUpperCase() +
                                    sport.experience_level?.slice(1) ||
                                    'Beginner'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar - Quick Actions and Social */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-400/10 rounded-xl">
                  <Zap className="h-5 w-5 text-purple-400" />
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
                  onClick={() => (window.location.href = '/highlights')}
                >
                  <Upload className="h-4 w-4 mr-3 text-purple-400" />
                  <span style={{ color: 'var(--timberwolf)' }}>
                    Upload Highlight
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-neutral-600 group-hover:text-purple-400" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start bg-neutral-800/30 hover:bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600/50 transition-all duration-300 group"
                  onClick={() =>
                    (window.location.href = '/highlights?tab=stats')
                  }
                >
                  <BarChart3 className="h-4 w-4 mr-3 text-blue-400" />
                  <span style={{ color: 'var(--timberwolf)' }}>
                    Add Statistics
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-neutral-600 group-hover:text-blue-400" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start bg-neutral-800/30 hover:bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600/50 transition-all duration-300 group"
                  onClick={() => (window.location.href = '/profile/edit')}
                >
                  <Settings className="h-4 w-4 mr-3 text-green-400" />
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

            {/* Profile Completion */}
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-400/10 rounded-xl">
                  <Target className="h-5 w-5 text-green-400" />
                </div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  Profile Power
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Completion
                    </span>
                    <span className="text-sm font-bold text-green-400">
                      85%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                  <p>💪 Strong profile! Add more highlights to reach 100%.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
