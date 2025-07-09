'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPublicProfileByUsername } from '@/lib/profile/utils';
import { getPublicHighlights, type Highlight } from '@/lib/highlights/utils';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { AvatarDisplay } from '@/components/avatar/avatar-upload';
import { VideoPlayer } from '@/components/video/video-player';
import {
  User,
  Trophy,
  MapPin,
  Calendar,
  Share2,
  ArrowLeft,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  CheckCircle,
  Star,
  Users,
  Crown,
  ExternalLink,
  Calendar as CalendarIcon,
  Play,
  Film,
  Eye,
  Clock,
  Grid3X3,
} from 'lucide-react';

// Types
interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  social_links: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  } | null;
  is_public: boolean | null;
  is_verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  user_sports: Array<{
    id: string;
    role: string;
    experience_level: string | null;
    positions: string[] | null;
    sport: {
      id: string;
      name: string;
      description: string | null;
    } | null;
  }>;
}

// Experience level display helper
function getExperienceDisplay(level: string | null) {
  if (!level) return { label: 'Unknown', color: 'text-gray-400' };

  const levels = {
    beginner: { label: 'Beginner', color: 'text-blue-400' },
    intermediate: { label: 'Intermediate', color: 'text-green-400' },
    advanced: { label: 'Advanced', color: 'text-orange-400' },
    professional: { label: 'Professional', color: 'text-purple-400' },
  };
  return (
    levels[level as keyof typeof levels] || {
      label: level,
      color: 'text-gray-400',
    }
  );
}

// Role display helper
function getRoleDisplay(role: string) {
  const roles = {
    player: { label: 'Player', icon: User },
    coach: { label: 'Coach', icon: Users },
    scout: { label: 'Scout', icon: Star },
    fan: { label: 'Fan', icon: Trophy },
  };
  return roles[role as keyof typeof roles] || { label: role, icon: User };
}

// Social Link Component
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

  const IconComponent = config.icon;

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-600 hover:bg-neutral-700/50 transition-colors ${config.color}`}
    >
      <IconComponent className="h-4 w-4" />
      <span className="text-sm">@{username}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// Sport Card Component
function SportCard({
  sportData,
}: {
  sportData: ProfileData['user_sports'][0];
}) {
  const experience = getExperienceDisplay(sportData.experience_level);
  const role = getRoleDisplay(sportData.role);
  const RoleIcon = role.icon;

  return (
    <div className="bg-neutral-800/50 border border-neutral-600 rounded-xl p-4 hover:bg-neutral-700/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
          <Trophy className="h-5 w-5 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">
            {sportData.sport?.name || 'Unknown Sport'}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <RoleIcon className="h-3 w-3" />
            <span style={{ color: 'var(--ash-grey)' }}>{role.label}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            Experience:
          </span>
          <span className={`text-sm font-medium ${experience.color}`}>
            {experience.label}
          </span>
        </div>

        {sportData.positions && sportData.positions.length > 0 && (
          <div>
            <span className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Positions:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {sportData.positions.map((position, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-neutral-700/50 rounded-full text-green-400 border border-green-800"
                >
                  {position}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Share Profile Component
function ShareProfile({ username }: { username: string }) {
  const profileUrl = `${window.location.origin}/profile/${username}`;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 border-neutral-600 hover:bg-neutral-800"
      style={{ color: 'var(--ash-grey)' }}
    >
      <Share2 className="h-4 w-4" />
      {copied ? 'Copied!' : 'Share Profile'}
    </Button>
  );
}

// Public Highlights Component
function PublicHighlights({ userId }: { userId: string }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const handlePlayVideo = async (highlightId: string) => {
    console.log('Attempting to play video:', highlightId);

    // Pause any currently playing video
    if (playingVideo && videoRefs.current[playingVideo]) {
      videoRefs.current[playingVideo]?.pause();
    }

    // Start playing the new video
    setPlayingVideo(highlightId);

    // Wait for the next tick and try to play
    setTimeout(async () => {
      const video = videoRefs.current[highlightId];
      if (video) {
        try {
          await video.play();
          console.log('Video started playing successfully');
        } catch (error) {
          console.error('Failed to play video:', error);
        }
      }
    }, 100);
  };

  useEffect(() => {
    const loadHighlights = async () => {
      try {
        setLoading(true);
        const result = await getPublicHighlights(userId);
        if (result.data) {
          setHighlights(result.data);
        }
      } catch (error) {
        console.error('Failed to load highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Film className="h-5 w-5 text-purple-400" />
          <h2
            className="text-xl font-bold"
            style={{ color: 'var(--timberwolf)' }}
          >
            Highlights
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Film className="h-5 w-5 text-purple-400" />
          <h2
            className="text-xl font-bold"
            style={{ color: 'var(--timberwolf)' }}
          >
            Highlights
          </h2>
        </div>
        <div className="text-center py-8">
          <Film
            className="h-12 w-12 mx-auto mb-3"
            style={{ color: 'var(--ash-grey)' }}
          />
          <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            No public highlights available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-purple-400" />
          <h2
            className="text-xl font-bold"
            style={{ color: 'var(--timberwolf)' }}
          >
            Highlights
          </h2>
          <span className="text-sm bg-purple-400/10 text-purple-400 px-2 py-1 rounded-full">
            {highlights.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs hover:bg-neutral-800"
            style={{ color: 'var(--ash-grey)' }}
          >
            <Grid3X3 className="h-3 w-3 mr-1" />
            Grid View
          </Button>
        </div>
      </div>

      {/* Highlights Grid - Much Larger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            className="group relative aspect-video bg-neutral-800/50 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-400/50 transition-all duration-300"
          >
            {/* Direct Video Implementation */}
            {highlight.video_url ? (
              <video
                ref={(el) => {
                  videoRefs.current[highlight.id] = el;
                }}
                key={highlight.id}
                className="w-full h-full object-cover rounded-xl"
                poster={highlight.thumbnail_url || undefined}
                controls={playingVideo === highlight.id}
                preload="metadata"
                playsInline
                muted={playingVideo !== highlight.id}
                onPlay={() => setPlayingVideo(highlight.id)}
                onPause={() => setPlayingVideo(null)}
                onEnded={() => setPlayingVideo(null)}
                onLoadStart={() =>
                  console.log('Video loading started:', highlight.title)
                }
                onLoadedData={() =>
                  console.log('Video loaded:', highlight.title)
                }
                onError={(e) =>
                  console.error('Video error:', e, highlight.video_url)
                }
              >
                <source src={highlight.video_url} type="video/mp4" />
                <source src={highlight.video_url} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 rounded-xl">
                <div className="text-center text-neutral-400">
                  <Film className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Video not available</p>
                </div>
              </div>
            )}

            {/* Overlay Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white text-sm font-medium truncate mb-2">
                  {highlight.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-white/80">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {highlight.duration
                        ? Math.floor(highlight.duration / 60) +
                          ':' +
                          String(highlight.duration % 60).padStart(2, '0')
                        : '0:00'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{highlight.views || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Play Button Overlay - Only show when not playing */}
            {playingVideo !== highlight.id && highlight.video_url && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-300 rounded-xl cursor-pointer"
                onClick={() => handlePlayVideo(highlight.id)}
              >
                <div className="w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-8 w-8 text-white ml-0.5" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show All Button */}
      {highlights.length > 8 && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            className="border-neutral-600 hover:bg-neutral-800"
            style={{ color: 'var(--ash-grey)' }}
          >
            View All Highlights ({highlights.length})
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPublicProfileByUsername(username);

      if (result.error || !result.data) {
        setError(result.error || 'Profile not found');
        return;
      }

      // Check if profile is public
      if (!result.data.is_public) {
        setError('This profile is private');
        return;
      }

      setProfile(result.data as ProfileData);

      // Load highlights count
      const highlightsResult = await getPublicHighlights(
        result.data.user_id || ''
      );
      if (highlightsResult.data) {
        setHighlightsCount(highlightsResult.data.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--night)' }}
      >
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p style={{ color: 'var(--ash-grey)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--night)' }}
      >
        <div className="text-center py-12">
          <User
            className="h-16 w-16 mx-auto mb-4"
            style={{ color: 'var(--ash-grey)' }}
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--timberwolf)' }}
          >
            {error === 'Profile not found'
              ? 'Profile Not Found'
              : 'Profile Unavailable'}
          </h1>
          <p className="mb-6" style={{ color: 'var(--ash-grey)' }}>
            {error || 'This profile could not be loaded'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-neutral-600 hover:bg-neutral-800"
              style={{ color: 'var(--ash-grey)' }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/auth/register')}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Create Your Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const joinedDate = new Date(
    profile.created_at || Date.now()
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Profile Header */}
          <div className="lg:col-span-3">
            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column - Avatar */}
                <div className="flex-shrink-0 flex justify-center md:justify-start">
                  <AvatarDisplay
                    avatarUrl={profile.avatar_url}
                    fullName={profile.full_name}
                    size="3xl"
                    className="shadow-lg"
                  />
                </div>

                {/* Right Column - Profile Info */}
                <div className="flex-1 min-w-0 space-y-4">
                  {/* Name and Username */}
                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                      <h1
                        className="text-3xl font-bold"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {profile.full_name}
                      </h1>
                      {profile.is_verified && (
                        <CheckCircle className="h-6 w-6 text-blue-400" />
                      )}
                    </div>
                    <p className="text-lg" style={{ color: 'var(--ash-grey)' }}>
                      @{profile.username}
                    </p>
                  </div>

                  {/* Profile Stats - Sports, Location, Date Joined */}
                  <div className="flex flex-row sm:flex-wrap gap-2 sm:gap-4 justify-center md:justify-start">
                    {profile.user_sports.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-green-400" />
                        <span
                          className="text-sm"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          {profile.user_sports.length} sport
                          {profile.user_sports.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {profile.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        <span
                          className="text-sm"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          {profile.location}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-purple-400" />
                      <span
                        className="text-sm"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Joined {joinedDate}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p
                      className="text-base leading-relaxed text-center md:text-left"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      {profile.bio}
                    </p>
                  )}

                  {/* Share Profile Button */}
                  <div className="flex justify-center md:justify-start">
                    <ShareProfile username={profile.username} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sports Section */}
          <div className="lg:col-span-2">
            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6 mb-6">
              <h2
                className="text-xl font-bold mb-6 flex items-center gap-2"
                style={{ color: 'var(--timberwolf)' }}
              >
                <Trophy className="h-5 w-5 text-green-400" />
                Sports & Positions
              </h2>

              {profile.user_sports.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy
                    className="h-12 w-12 mx-auto mb-3"
                    style={{ color: 'var(--ash-grey)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                    No sports information available
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {profile.user_sports.map((sport) => (
                    <SportCard key={sport.id} sportData={sport} />
                  ))}
                </div>
              )}
            </div>

            {/* Highlights Section */}
            <PublicHighlights userId={profile.user_id} />
          </div>

          {/* Contact & Social */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            {/* Social Links */}
            {profile.social_links && (
              <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 md:p-6">
                <h3
                  className="text-lg font-semibold mb-4 flex items-center gap-2"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  <Share2 className="h-4 w-4" />
                  Connect
                </h3>

                <div className="space-y-3">
                  {profile.social_links.instagram && (
                    <SocialLink
                      platform="instagram"
                      username={profile.social_links.instagram}
                    />
                  )}
                  {profile.social_links.twitter && (
                    <SocialLink
                      platform="twitter"
                      username={profile.social_links.twitter}
                    />
                  )}
                  {profile.social_links.linkedin && (
                    <SocialLink
                      platform="linkedin"
                      username={profile.social_links.linkedin}
                    />
                  )}

                  {!profile.social_links.instagram &&
                    !profile.social_links.twitter &&
                    !profile.social_links.linkedin && (
                      <p
                        className="text-sm text-center py-4"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        No social links available
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 md:p-6">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: 'var(--timberwolf)' }}
              >
                Actions
              </h3>

              <div className="space-y-3">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-neutral-600 hover:bg-neutral-800"
                  style={{ color: 'var(--ash-grey)' }}
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 md:p-6">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: 'var(--timberwolf)' }}
              >
                Profile Stats
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Profile Views
                  </span>
                  <span className="text-sm font-medium text-green-400">
                    Coming Soon
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Connections
                  </span>
                  <span className="text-sm font-medium text-blue-400">
                    Coming Soon
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Highlights
                  </span>
                  <span className="text-sm font-medium text-purple-400">
                    {highlightsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
