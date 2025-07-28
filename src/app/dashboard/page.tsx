'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth, useProfile, useOnboardingStatus } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { AvatarDisplay } from '@/components/avatar/avatar-upload';
import { ProfileCompletion } from '@/components/profile/profile-completion';
import { getUserHighlights } from '@/lib/highlights/utils';
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
  TrendingUp,
  Star,
  Sparkles,
  ChevronRight,
  Play,
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
  const { profile } = useProfile();
  const onboardingStatus = useOnboardingStatus();
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    if (!profile.data) return 0;

    const items = [
      { completed: !!(profile.data.full_name && profile.data.bio), weight: 30 },
      { completed: !!profile.data.avatar_url, weight: 20 },
      { completed: !!profile.data.location, weight: 15 },
      { completed: !!profile.data.username, weight: 15 },
      {
        completed: !!(
          profile.data.social_links &&
          Object.values(profile.data.social_links).some((link) => link)
        ),
        weight: 20,
      },
    ];

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = items
      .filter((item) => item.completed)
      .reduce((sum, item) => sum + item.weight, 0);
    return totalWeight > 0
      ? Math.round((completedWeight / totalWeight) * 100)
      : 0;
  }, [profile.data]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Fetch user data counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;

      setLoadingCounts(true);
      try {
        const highlightsResult = await getUserHighlights(user.id);

        if (highlightsResult.data && !highlightsResult.error) {
          setHighlightsCount(highlightsResult.data.length);
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
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

          {/* Activity */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6 hover:border-blue-400/30 transition-all duration-300 group">
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
              Activity Score
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-400">8.5</span>
              <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
          </div>

          {/* Content */}
          <div
            className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6 hover:border-purple-400/30 transition-all duration-300 group cursor-pointer"
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
              Content
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-purple-400">
                {loadingCounts ? '...' : highlightsCount}
              </span>
              <span className="text-xs bg-purple-400/10 text-purple-400 px-2 py-1 rounded-full">
                Items
              </span>
            </div>
          </div>

          {/* Network */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-4 md:p-6 hover:border-blue-400/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-400/10 rounded-xl">
                <Star className="h-5 w-5 text-blue-400" />
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--ash-grey)' }}
            >
              Network
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-400">12</span>
              <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full">
                Growing
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
                <div className="flex items-start gap-8 mb-6">
                  {/* Left Column - Profile Picture */}
                  <div className="relative flex-shrink-0">
                    <AvatarDisplay
                      avatarUrl={profile.data?.avatar_url}
                      fullName={profile.data?.full_name || 'User'}
                      size="3xl"
                      className="ring-4 ring-neutral-700/50"
                    />
                    {profile.data?.is_verified && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Right Column - Profile Info */}
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* Row 1: Name */}
                    <div className="flex items-center gap-3">
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

                    {/* Row 4: User Profiles List */}
                    {profile.data?.user_sports &&
                      profile.data.user_sports.length > 0 && (
                        <div className="pt-2">
                          <p
                            className="text-xs font-medium mb-2"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            Your Profiles:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {profile.data.user_sports.map((sport, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/30 border border-neutral-700/50 rounded-full hover:bg-neutral-700/30 transition-colors cursor-pointer group"
                                onClick={() => {
                                  const sportName =
                                    sport.sport?.name
                                      ?.toLowerCase()
                                      .replace(/\s+/g, '-') || 'unknown';
                                  const role = sport.role || 'player';
                                  const username = profile.data?.username;
                                  const profileUrl = `/profile/${username}/${sportName}/${role}`;

                                  // For now, log the URL structure - in the future this will navigate to dedicated sport/role profile pages
                                  console.log(
                                    `Future profile URL: ${profileUrl}`
                                  );

                                  // Temporary: Navigate to general profile for now
                                  window.open(`/profile/${username}`, '_blank');
                                }}
                              >
                                <Trophy className="h-3 w-3 text-green-400" />
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: 'var(--timberwolf)' }}
                                >
                                  {sport.sport?.name}{' '}
                                  {sport.role === 'player'
                                    ? 'Player'
                                    : sport.role === 'coach'
                                      ? 'Coach'
                                      : 'Profile'}
                                </span>
                                <ChevronRight className="h-3 w-3 text-neutral-600 group-hover:text-green-400 transition-colors" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Row 5: Action Buttons */}
                    <div className="flex items-center gap-3 pt-4">
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
                      247
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                      Network
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
                {/* Player Profile - Active */}
                <div
                  className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 hover:bg-neutral-700/30 hover:border-green-400/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => (window.location.href = '/profile/player')}
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
                        Showcasing your skills and achievements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-700/30">
                    <div className="h-6"></div>
                    <div className="bg-green-400/10 text-green-400 border border-green-400/30 px-3 py-1 rounded-full text-xs">
                      Available
                    </div>
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
                  onClick={() => (window.location.href = '/profile/edit')}
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

            {/* Profile Completion */}
            {profileCompletion < 100 && (
              <ProfileCompletion profile={profile.data} />
            )}
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
