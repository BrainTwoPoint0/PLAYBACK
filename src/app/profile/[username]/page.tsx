'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPublicProfileByUsername } from '@/lib/profile/utils';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { AvatarDisplay } from '@/components/avatar/avatar-upload';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle,
  Users,
  Crown,
  ExternalLink,
  ChevronRight,
  Shield,
  Star,
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
  profile_type: string | null;
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
      sport_category: string | null;
    } | null;
  }>;
}

// Profile type configurations
const PROFILE_TYPES = {
  player: {
    label: 'Player Profile',
    icon: Trophy,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/30',
    description: 'Athletic performance, highlights, and stats',
    available: true,
  },
  coach: {
    label: 'Coach Profile',
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/30',
    description: 'Coaching experience and team management',
    available: false,
    comingSoon: true,
  },
  club_admin: {
    label: 'Club Admin',
    icon: Shield,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/30',
    description: 'Club management and administration',
    available: false,
    comingSoon: true,
  },
};

// Social Link Component
function SocialLink({
  platform,
  username,
}: {
  platform: string;
  username: string | undefined;
}) {
  if (!username) return null;

  const configs = {
    instagram: {
      icon: Instagram,
      url: `https://instagram.com/${username}`,
      label: 'Instagram',
    },
    twitter: {
      icon: Twitter,
      url: `https://twitter.com/${username}`,
      label: 'Twitter',
    },
    linkedin: {
      icon: Linkedin,
      url: `https://linkedin.com/in/${username}`,
      label: 'LinkedIn',
    },
  };

  const config = configs[platform as keyof typeof configs];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 rounded-lg transition-colors"
    >
      <Icon className="h-4 w-4" style={{ color: 'var(--ash-grey)' }} />
      <span className="text-sm" style={{ color: 'var(--timberwolf)' }}>
        {config.label}
      </span>
      <ExternalLink className="h-3 w-3" style={{ color: 'var(--ash-grey)' }} />
    </a>
  );
}

// Profile Card Component
function ProfileCard({
  profile,
  sport,
  role,
  onClick,
}: {
  profile: ProfileData;
  sport?: any;
  role: string;
  onClick: () => void;
}) {
  const profileType =
    PROFILE_TYPES[role as keyof typeof PROFILE_TYPES] || PROFILE_TYPES.player;
  const Icon = profileType.icon;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
        profileType.available
          ? 'hover:shadow-lg hover:border-green-400/50'
          : 'opacity-60 cursor-not-allowed'
      }`}
      style={{
        backgroundColor: 'rgba(185, 186, 163, 0.05)',
        borderColor: 'rgba(185, 186, 163, 0.2)',
      }}
      onClick={profileType.available ? onClick : undefined}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${profileType.bgColor}`}>
              <Icon className={`h-6 w-6 ${profileType.color}`} />
            </div>
            <div>
              <CardTitle
                className="text-lg"
                style={{ color: 'var(--timberwolf)' }}
              >
                {sport
                  ? `${sport.name} ${profileType.label}`
                  : profileType.label}
              </CardTitle>
              <CardDescription style={{ color: 'var(--ash-grey)' }}>
                {profileType.description}
              </CardDescription>
            </div>
          </div>
          {'comingSoon' in profileType && profileType.comingSoon && (
            <Badge
              variant="outline"
              className="bg-orange-400/10 text-orange-400 border-orange-400/30 text-xs"
            >
              Coming Soon
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sport && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                Experience
              </span>
              <Badge variant="outline" className="capitalize text-xs">
                {sport.experience_level || 'Not specified'}
              </Badge>
            </div>
            {sport.positions && sport.positions.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                  Positions
                </span>
                <div className="flex flex-wrap gap-1">
                  {sport.positions.map((position: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-neutral-800/50 rounded-full"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {position}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            {profileType.available ? 'View Profile' : 'Not Available'}
          </span>
          {profileType.available && (
            <ChevronRight className="h-4 w-4 text-green-400" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    if (!username) {
      setError('No username provided');
      setLoading(false);
      return;
    }

    try {
      const result = await getPublicProfileByUsername(username);
      if (result.error || !result.data) {
        setError(result.error || 'Profile not found');
      } else {
        setProfile(result.data as ProfileData);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name || profile?.username}'s PLAYBACK Profile`,
          text: 'Check out this athletic profile on PLAYBACK',
          url: profileUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(profileUrl);
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

  // Group sports by role
  const profilesByRole = profile.user_sports.reduce(
    (acc, sport) => {
      const role = sport.role || 'player';
      if (!acc[role]) acc[role] = [];
      acc[role].push(sport);
      return acc;
    },
    {} as Record<string, typeof profile.user_sports>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 flex justify-center md:justify-start">
              <div className="relative">
                <AvatarDisplay
                  avatarUrl={profile.avatar_url}
                  fullName={profile.full_name}
                  size="3xl"
                  className="shadow-xl ring-4 ring-neutral-700/50"
                />
                {profile.is_verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Name and Username */}
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-1">
                  <h1
                    className="text-3xl font-bold"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    {profile.full_name}
                  </h1>
                  {profile.is_verified && (
                    <Crown className="h-6 w-6 text-yellow-400" />
                  )}
                </div>
                <p className="text-lg" style={{ color: 'var(--ash-grey)' }}>
                  @{profile.username}
                </p>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p
                  className="text-base leading-relaxed text-center md:text-left max-w-2xl"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
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
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Joined {joinedDate}
                  </span>
                </div>
              </div>

              {/* Social Links and Actions */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {profile.social_links?.instagram && (
                  <SocialLink
                    platform="instagram"
                    username={profile.social_links.instagram}
                  />
                )}
                {profile.social_links?.twitter && (
                  <SocialLink
                    platform="twitter"
                    username={profile.social_links.twitter}
                  />
                )}
                {profile.social_links?.linkedin && (
                  <SocialLink
                    platform="linkedin"
                    username={profile.social_links.linkedin}
                  />
                )}
                <Button
                  onClick={handleShareProfile}
                  variant="outline"
                  size="sm"
                  className="border-neutral-600 hover:bg-neutral-800/50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Profiles Section */}
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              Available Profiles
            </h2>
            <p className="text-base mb-6" style={{ color: 'var(--ash-grey)' }}>
              Explore {profile.full_name}&apos;s different profiles and athletic
              roles
            </p>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Player Profiles */}
            {profilesByRole.player?.map((sport, index) => (
              <ProfileCard
                key={`player-${index}`}
                profile={profile}
                sport={sport}
                role="player"
                onClick={() => {
                  // Navigate to player profile
                  window.location.href = `/profile/player?user=${profile.username}`;
                }}
              />
            ))}

            {/* Coach Profiles */}
            {profilesByRole.coach?.map((sport, index) => (
              <ProfileCard
                key={`coach-${index}`}
                profile={profile}
                sport={sport}
                role="coach"
                onClick={() => {
                  // Future: Navigate to coach profile
                  console.log('Coach profile coming soon');
                }}
              />
            ))}

            {/* If no sports added, show generic profiles */}
            {profile.user_sports.length === 0 && (
              <>
                <ProfileCard
                  profile={profile}
                  role="player"
                  onClick={() => {
                    window.location.href = `/profile/player?user=${profile.username}`;
                  }}
                />
                <ProfileCard
                  profile={profile}
                  role="coach"
                  onClick={() => {
                    console.log('Coach profile coming soon');
                  }}
                />
                <ProfileCard
                  profile={profile}
                  role="club_admin"
                  onClick={() => {
                    console.log('Club admin profile coming soon');
                  }}
                />
              </>
            )}
          </div>

          {/* Empty State */}
          {profile.user_sports.length === 0 && (
            <div className="text-center py-12">
              <Trophy
                className="h-12 w-12 mx-auto mb-4"
                style={{ color: 'var(--ash-grey)', opacity: 0.5 }}
              />
              <p
                className="text-lg font-medium mb-2"
                style={{ color: 'var(--timberwolf)' }}
              >
                No Active Profiles Yet
              </p>
              <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                This user hasn&apos;t added any sports or roles to their profile
                yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
