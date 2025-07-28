'use client';

import { useState, useEffect } from 'react';
import { useAuth, useProfile } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading';
import { AvatarUpload, AvatarDisplay } from '@/components/avatar/avatar-upload';
import {
  User,
  Trophy,
  Share2,
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Instagram,
  Twitter,
  Linkedin,
  MapPin,
  Info,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { ProfileHeader } from '@/components/profile/profile-header';
import { PhysicalAttributesTab } from '@/components/profile/physical-attributes-tab';
import { useRouter } from 'next/navigation';
import {
  updateProfileBasicInfo,
  updateUserSports,
  checkUsernameAvailability as checkUsernameAPI,
  SportSelection,
} from '@/lib/profile/utils';

// Types
interface SocialLinks {
  instagram: string;
  twitter: string;
  linkedin: string;
}

// Basic Info Tab Component
function BasicInfoTab({
  profile,
  user,
  onUpdate,
  onMarkChanged,
}: {
  profile: any;
  user: any;
  onUpdate: (updates: any) => void;
  onMarkChanged: () => void;
}) {
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
  });

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    onUpdate({ [field]: value });
    onMarkChanged();

    // Check username availability when username changes
    if (field === 'username' && value !== profile?.username) {
      checkUsernameAvailability(value);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const result = await checkUsernameAPI(username, user?.id);
      setUsernameAvailable(result.available);
    } catch (error) {
      console.error('Username availability check failed:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const bioCharCount = formData.bio.length;
  const bioMaxLength = 500;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-green-400/10 rounded-xl">
            <User className="h-6 w-6 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Basic Information
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Update your core profile information to build your athletic identity
        </p>
      </div>

      {/* Username */}
      <div className="space-y-3">
        <Label
          htmlFor="username"
          className="font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Username
        </Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl h-12"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
            placeholder="your-username"
            pattern="[a-zA-Z0-9_-]+"
            minLength={3}
            maxLength={30}
          />
          {checkingUsername && (
            <div className="absolute right-3 top-3">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
            Letters, numbers, hyphens and underscores only
          </span>
          {usernameAvailable === true && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Available
            </span>
          )}
          {usernameAvailable === false && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Not available
            </span>
          )}
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-3">
        <Label
          htmlFor="full_name"
          className="font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Full Name
        </Label>
        <Input
          id="full_name"
          type="text"
          value={formData.full_name}
          onChange={(e) => handleInputChange('full_name', e.target.value)}
          className="bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl h-12"
          style={{
            color: 'var(--timberwolf)',
            borderColor: 'var(--ash-grey)',
          }}
          placeholder="Your full name"
          maxLength={100}
        />
      </div>

      {/* Bio */}
      <div className="space-y-3">
        <Label
          htmlFor="bio"
          className="font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Bio
        </Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          className="min-h-[120px] bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl resize-none"
          style={{
            color: 'var(--timberwolf)',
            borderColor: 'var(--ash-grey)',
          }}
          placeholder="Tell us about yourself, your sports journey, achievements..."
          maxLength={bioMaxLength}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
            Share your athletic story and goals
          </span>
          <span
            className={`text-xs ${bioCharCount > bioMaxLength * 0.9 ? 'text-orange-400' : ''}`}
            style={{
              color:
                bioCharCount > bioMaxLength * 0.9
                  ? undefined
                  : 'var(--ash-grey)',
            }}
          >
            {bioCharCount}/{bioMaxLength}
          </span>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label
          htmlFor="location"
          className="font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          Location
        </Label>
        <div className="relative">
          <MapPin
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
            style={{ color: 'var(--ash-grey)' }}
          />
          <Input
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="pl-11 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl h-12"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
            placeholder="City, State/Country"
            maxLength={100}
          />
        </div>
        <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
          Help scouts and teams find athletes in your area
        </span>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-neutral-800/40 to-neutral-700/30 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-6">
        <h4
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          <div className="p-1 bg-green-400/10 rounded-lg">
            <Info className="h-4 w-4 text-green-400" />
          </div>
          Profile Tips
        </h4>
        <ul className="text-sm space-y-2" style={{ color: 'var(--ash-grey)' }}>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Choose a memorable username for your PLAYBACK profile URL
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Write a compelling bio that showcases your athletic journey
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Include your location to connect with local opportunities
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Sport Edit Form Component
function SportEditForm({
  sport,
  sportName,
  onSave,
  onCancel,
}: {
  sport: SportSelection;
  sportName: string;
  onSave: (updates: Partial<SportSelection>) => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState(sport.role);
  const [position, setPosition] = useState(sport.positions[0] || '');
  const [experienceLevel, setExperienceLevel] = useState(
    sport.experience_level
  );

  const getPositionsForSport = (sportName: string): string[] => {
    const positionMap: Record<string, string[]> = {
      Football: [
        'Goalkeeper',
        'Defender',
        'Midfielder',
        'Forward',
        'Striker',
        'Winger',
      ], // European Football
      'American Football': [
        'Quarterback',
        'Running Back',
        'Wide Receiver',
        'Tight End',
        'Offensive Line',
        'Defensive Line',
        'Linebacker',
        'Cornerback',
        'Safety',
        'Kicker',
        'Punter',
      ],
      Basketball: [
        'Point Guard',
        'Shooting Guard',
        'Small Forward',
        'Power Forward',
        'Center',
      ],
      Soccer: [
        'Goalkeeper',
        'Defender',
        'Midfielder',
        'Forward',
        'Striker',
        'Winger',
      ], // Alias for Football
      Baseball: [
        'Pitcher',
        'Catcher',
        'First Base',
        'Second Base',
        'Third Base',
        'Shortstop',
        'Left Field',
        'Center Field',
        'Right Field',
        'Designated Hitter',
      ],
      Tennis: ['Singles', 'Doubles'],
      Volleyball: [
        'Setter',
        'Outside Hitter',
        'Middle Blocker',
        'Opposite Hitter',
        'Libero',
        'Defensive Specialist',
      ],
      Hockey: ['Goaltender', 'Defenseman', 'Left Wing', 'Right Wing', 'Center'],
    };

    return positionMap[sportName] || ['Player'];
  };

  const positions = getPositionsForSport(sportName);

  const handleSave = () => {
    onSave({
      role: role as 'player' | 'coach' | 'scout' | 'fan',
      positions: position ? [position] : [],
      experience_level: experienceLevel as
        | 'beginner'
        | 'intermediate'
        | 'advanced'
        | 'professional',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h4 className="font-medium" style={{ color: 'var(--timberwolf)' }}>
          Edit {sportName}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label
            htmlFor="role"
            className="text-sm font-medium"
            style={{ color: 'var(--ash-grey)' }}
          >
            Role
          </Label>
          <select
            id="role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as 'player' | 'coach' | 'scout' | 'fan');
              // Clear position if not a player
              if (e.target.value !== 'player') {
                setPosition('');
              }
            }}
            className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          >
            <option value="player">Player</option>
            <option value="coach">Coach</option>
            <option value="scout">Scout</option>
            <option value="fan">Fan</option>
          </select>
        </div>

        {role === 'player' && (
          <div>
            <Label
              htmlFor="position"
              className="text-sm font-medium"
              style={{ color: 'var(--ash-grey)' }}
            >
              Position
            </Label>
            <select
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            >
              <option value="">Select position</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label
            htmlFor="experience"
            className="text-sm font-medium"
            style={{ color: 'var(--ash-grey)' }}
          >
            Experience Level
          </Label>
          <select
            id="experience"
            value={experienceLevel}
            onChange={(e) =>
              setExperienceLevel(
                e.target.value as
                  | 'beginner'
                  | 'intermediate'
                  | 'advanced'
                  | 'professional'
              )
            }
            className="w-full mt-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="professional">Professional</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={handleSave}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button
          onClick={onCancel}
          size="sm"
          variant="outline"
          className="border-neutral-600 hover:bg-neutral-700"
          style={{ color: 'var(--ash-grey)' }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Add Sport Modal Component
function AddSportModal({
  allSports,
  userSports,
  onAddSport,
  onClose,
}: {
  allSports: any[];
  userSports: SportSelection[];
  onAddSport: (sportId: string, sportName: string) => void;
  onClose: () => void;
}) {
  const userSportIds = userSports.map((sport) => sport.sport_id);
  const availableSports = allSports.filter(
    (sport) => !userSportIds.includes(sport.id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--timberwolf)' }}
          >
            Add New Sport
          </h3>
          <Button onClick={onClose} size="sm" variant="ghost" className="p-1">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {availableSports.length === 0 ? (
            <p
              className="text-center py-4"
              style={{ color: 'var(--ash-grey)' }}
            >
              You&apos;ve added all available sports!
            </p>
          ) : (
            availableSports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => onAddSport(sport.id, sport.name)}
                className="w-full p-3 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-600 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <div>
                    <h4
                      className="font-medium"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {sport.name}
                    </h4>
                    {sport.description && (
                      <p
                        className="text-sm"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {sport.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Avatar Tab Component
function AvatarTab({
  profile,
  user,
  onAvatarSaved,
}: {
  profile: any;
  user: any;
  onAvatarSaved: () => void;
}) {
  const { refreshProfile } = useProfile();

  const handleAvatarUpdate = async (newAvatarUrl: string | null) => {
    // Refresh profile data to reflect the change
    await refreshProfile(true);

    // Notify parent that avatar was saved (resets unsaved changes state)
    onAvatarSaved();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-blue-400/10 rounded-xl">
            <User className="h-6 w-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Profile Avatar
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Upload a professional photo that represents your athletic identity
        </p>
      </div>

      {/* Avatar Upload */}
      <div className="bg-gradient-to-br from-neutral-800/40 to-neutral-700/30 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-6">
        <AvatarUpload
          userId={user.id}
          currentAvatarUrl={profile?.avatar_url}
          fullName={
            profile?.full_name || user?.user_metadata?.full_name || 'User'
          }
          onAvatarUpdate={handleAvatarUpdate}
          size="lg"
        />
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-neutral-800/40 to-neutral-700/30 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-6">
        <h4
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          <div className="p-1 bg-blue-400/10 rounded-lg">
            <Info className="h-4 w-4 text-blue-400" />
          </div>
          Avatar Tips
        </h4>
        <ul className="text-sm space-y-2" style={{ color: 'var(--ash-grey)' }}>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>Use a clear, professional photo that shows your face</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Square images work best and will be automatically cropped
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Your avatar appears on your public profile and in connections
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              If you don&apos;t upload a photo, we&apos;ll generate one with
              your initials
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Social Tab Component
function SocialTab({
  profile,
  onUpdate,
  onMarkChanged,
}: {
  profile: any;
  onUpdate: (updates: any) => void;
  onMarkChanged: () => void;
}) {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: profile?.social_links?.instagram || '',
    twitter: profile?.social_links?.twitter || '',
    linkedin: profile?.social_links?.linkedin || '',
  });

  const handleSocialLinkChange = (
    platform: keyof SocialLinks,
    value: string
  ) => {
    const newLinks = { ...socialLinks, [platform]: value };
    setSocialLinks(newLinks);
    onUpdate({ social_links: newLinks });
    onMarkChanged();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-pink-400/10 rounded-xl">
            <Share2 className="h-6 w-6 text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Social & Contact
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Connect your social media accounts to build your athletic network
        </p>
      </div>

      {/* Social Links */}
      <div className="space-y-6">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--timberwolf)' }}
        >
          Social Media Links
        </h3>

        {/* Instagram */}
        <div className="space-y-3">
          <Label
            htmlFor="instagram"
            className="text-sm font-medium flex items-center gap-2"
            style={{ color: 'var(--ash-grey)' }}
          >
            <Instagram className="h-4 w-4" />
            Instagram
          </Label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--ash-grey)' }}
            >
              @
            </span>
            <Input
              id="instagram"
              type="text"
              placeholder="username"
              value={socialLinks.instagram}
              onChange={(e) =>
                handleSocialLinkChange('instagram', e.target.value)
              }
              className="pl-8 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl h-12"
              style={{
                color: 'var(--timberwolf)',
                borderColor: 'var(--ash-grey)',
              }}
            />
          </div>
        </div>

        {/* Twitter */}
        <div className="space-y-3">
          <Label
            htmlFor="twitter"
            className="text-sm font-medium flex items-center gap-2"
            style={{ color: 'var(--ash-grey)' }}
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </Label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--ash-grey)' }}
            >
              @
            </span>
            <Input
              id="twitter"
              type="text"
              placeholder="username"
              value={socialLinks.twitter}
              onChange={(e) =>
                handleSocialLinkChange('twitter', e.target.value)
              }
              className="pl-8 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl h-12"
              style={{
                color: 'var(--timberwolf)',
                borderColor: 'var(--ash-grey)',
              }}
            />
          </div>
        </div>

        {/* LinkedIn */}
        <div className="space-y-3">
          <Label
            htmlFor="linkedin"
            className="text-sm font-medium flex items-center gap-2"
            style={{ color: 'var(--ash-grey)' }}
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--ash-grey)' }}
            >
              /in/
            </span>
            <Input
              id="linkedin"
              type="text"
              placeholder="username"
              value={socialLinks.linkedin}
              onChange={(e) =>
                handleSocialLinkChange('linkedin', e.target.value)
              }
              className="pl-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl h-12"
              style={{
                color: 'var(--timberwolf)',
                borderColor: 'var(--ash-grey)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-neutral-800/40 to-neutral-700/30 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-6">
        <h4
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          <div className="p-1 bg-pink-400/10 rounded-lg">
            <Info className="h-4 w-4 text-pink-400" />
          </div>
          Social Media Tips
        </h4>
        <ul className="text-sm space-y-2" style={{ color: 'var(--ash-grey)' }}>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Connect your social accounts to increase your visibility
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Maintain professional profiles to attract scouts and teams
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>Use consistent usernames across platforms when possible</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Tab Navigation Component
function TabNavigation({
  activeTab,
  setActiveTab,
  tabs,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: { id: string; label: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="bg-neutral-800/30 p-3 rounded-2xl border border-neutral-700/50 overflow-x-auto no-visible-scrollbar">
      <div className="flex gap-2 min-w-full px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex-1 justify-center whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        {/* Spacer to ensure right padding in scrollable area */}
        <div className="w-4 flex-shrink-0" aria-hidden="true"></div>
      </div>
    </div>
  );
}

function ProfileEditContent() {
  const { user, loading: authLoading } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [profileUpdates, setProfileUpdates] = useState<any>({});
  const [activeTab, setActiveTab] = useState('basic');

  const loading = authLoading || profile.loading;

  const tabs = [
    { id: 'basic', label: 'Info', icon: <User className="h-4 w-4" /> },
    { id: 'avatar', label: 'Avatar', icon: <User className="h-4 w-4" /> },
    {
      id: 'physical',
      label: 'Physical',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    { id: 'social', label: 'Social', icon: <Share2 className="h-4 w-4" /> },
  ];

  const handleBackToDashboard = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmLeave) return;
    }
    router.push('/dashboard');
  };

  const handleProfileUpdate = (updates: any) => {
    setProfileUpdates((prev: any) => ({ ...prev, ...updates }));
  };

  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  const handleAvatarSaved = () => {
    // Avatar is already saved by the AvatarUpload component
    // Just reset the unsaved changes state
    setHasUnsavedChanges(false);
    setSaveSuccess(true);

    // Clear success message after a delay
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveChanges = async () => {
    if (!user || !profileUpdates || Object.keys(profileUpdates).length === 0) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Handle basic profile info updates
      const { user_sports, ...basicUpdates } = profileUpdates;

      // Update basic profile info if there are any basic fields
      if (Object.keys(basicUpdates).length > 0) {
        const result = await updateProfileBasicInfo(user.id, basicUpdates);
        if (result.error) {
          setSaveError(result.error);
          return;
        }
      }

      // Update user sports if changed
      if (user_sports) {
        const sportsResult = await updateUserSports(user.id, user_sports);
        if (sportsResult.error) {
          setSaveError(sportsResult.error);
          return;
        }
      }

      // Success
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setProfileUpdates({});

      // Refresh profile data in context
      await refreshProfile(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save changes'
      );
    } finally {
      setSaving(false);
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
          <p style={{ color: 'var(--ash-grey)' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile.data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--night)' }}
      >
        <div className="text-center py-12">
          <AlertCircle
            className="h-16 w-16 mx-auto mb-4"
            style={{ color: 'var(--ash-grey)' }}
          />
          <p
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--timberwolf)' }}
          >
            Profile Loading
          </p>
          <p className="mb-6" style={{ color: 'var(--ash-grey)' }}>
            Setting up your profile...
          </p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="container mx-auto px-4 pt-6 pb-4 max-w-6xl">
        <ProfileHeader
          title="Edit Profile"
          description="Update your PLAYBACK profile information"
          backTo="/dashboard"
          backLabel="Back to Dashboard"
          gradient="from-green-400 to-blue-400"
        />
        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6 justify-center sm:justify-start">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 px-3 py-2 rounded-lg border border-green-800">
              <CheckCircle className="h-4 w-4" />
              Changes saved
            </div>
          )}
          {hasUnsavedChanges && !saveSuccess && (
            <div className="flex items-center gap-2 text-sm text-orange-400 bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-800">
              <AlertCircle className="h-4 w-4" />
              Unsaved changes
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
            disabled={saving}
            className="flex items-center gap-2 border-neutral-600 hover:bg-neutral-800"
            style={{ color: 'var(--ash-grey)' }}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || saving}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
      {/* Main Content */}

      <div className="container mx-auto px-4 pb-8 max-w-6xl">
        {/* Error Display */}
        {saveError && (
          <div className="mb-8 bg-red-900/20 border border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Failed to save changes</span>
            </div>
            <p className="text-red-300 text-sm mb-3">{saveError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveError(null)}
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              Dismiss
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl shadow-lg relative max-h-[80vh] overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-blue-400/20"></div>
              </div>

              <div className="relative z-10 p-6">
                {/* Tab Navigation */}
                <div className="mb-8">
                  <TabNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    tabs={tabs}
                  />
                </div>

                {/* Tab Content */}
                <div className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-8 border border-neutral-700/50 max-h-[60vh] overflow-y-auto">
                  {activeTab === 'basic' && (
                    <BasicInfoTab
                      profile={profile.data}
                      user={user}
                      onUpdate={handleProfileUpdate}
                      onMarkChanged={markAsChanged}
                    />
                  )}
                  {activeTab === 'avatar' && (
                    <AvatarTab
                      profile={profile.data}
                      user={user}
                      onAvatarSaved={handleAvatarSaved}
                    />
                  )}
                  {activeTab === 'physical' && (
                    <PhysicalAttributesTab
                      profile={profile.data}
                      onUpdate={handleProfileUpdate}
                      onMarkChanged={markAsChanged}
                    />
                  )}
                  {activeTab === 'social' && (
                    <SocialTab
                      profile={profile.data}
                      onUpdate={handleProfileUpdate}
                      onMarkChanged={markAsChanged}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-400/10 rounded-xl">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  Profile Preview
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <AvatarDisplay
                    avatarUrl={profile.data.avatar_url}
                    fullName={
                      profile.data.full_name ||
                      user?.user_metadata?.full_name ||
                      'User'
                    }
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-semibold truncate"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {profile.data.full_name ||
                        user?.user_metadata?.full_name ||
                        'Your Name'}
                    </h4>
                    <p
                      className="text-sm truncate"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      @{profile.data.username || 'username'}
                    </p>
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  <div
                    className="flex items-center gap-2"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>{profile.data.user_sports?.[0]?.role || 'Role'}</span>
                  </div>
                  {profile.data.location && (
                    <div
                      className="flex items-center gap-2"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      <MapPin className="h-4 w-4" />
                      <span>{profile.data.location}</span>
                    </div>
                  )}
                  <div
                    className="flex items-center gap-2"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>
                      {profile.data.user_sports?.length || 0} sport
                      {(profile.data.user_sports?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {profile.data.bio && (
                  <div className="pt-3 border-t border-neutral-700">
                    <p
                      className="text-sm line-clamp-3"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      {profile.data.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <ProtectedRoute>
      <ProfileEditContent />
    </ProtectedRoute>
  );
}
