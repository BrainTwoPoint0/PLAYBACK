'use client';

import { useState, useEffect } from 'react';
import { useAuth, useProfile } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  updateProfileBasicInfo,
  checkUsernameAvailability as checkUsernameAPI,
} from '@/lib/profile/utils';

// Types
interface SportSelection {
  sport_id: number;
  sport_name: string;
  position: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
}

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
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          Basic Information
        </h2>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Update your core profile information
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
            className="absolute left-3 top-3 h-5 w-5"
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
      <div className="bg-neutral-800/50 border border-neutral-600 rounded-xl p-6">
        <h4
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          <Info className="h-4 w-4" />
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

// Sports Tab Component
function SportsTab({
  profile,
  onUpdate,
  onMarkChanged,
}: {
  profile: any;
  onUpdate: (updates: any) => void;
  onMarkChanged: () => void;
}) {
  const [userSports, setUserSports] = useState<SportSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserSports();
  }, []);

  const loadUserSports = async () => {
    try {
      // For now, use the sports data from the profile
      const sports = profile?.user_sports || [];
      setUserSports(
        sports.map((sport: any) => ({
          sport_id: sport.sport_id,
          sport_name: sport.sport?.name || 'Unknown Sport',
          position: sport.position,
          experience_level: sport.experience_level,
        }))
      );
    } catch (error) {
      console.error('Failed to load user sports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <LoadingSpinner size="lg" className="mb-4" />
        <p style={{ color: 'var(--ash-grey)' }}>Loading your sports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          Sports & Positions
        </h2>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Manage your sports and playing positions
        </p>
      </div>

      {/* Current Sports */}
      <div className="space-y-4">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--timberwolf)' }}
        >
          Your Sports
        </h3>

        {userSports.length === 0 ? (
          <div className="text-center py-8 bg-neutral-800/30 rounded-xl border border-neutral-600">
            <Trophy
              className="h-12 w-12 mx-auto mb-3"
              style={{ color: 'var(--ash-grey)' }}
            />
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              No sports added yet. Add your first sport to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userSports.map((sport, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-neutral-600"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <div>
                    <h4
                      className="font-medium"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {sport.sport_name}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                      {sport.position} •{' '}
                      {sport.experience_level.charAt(0).toUpperCase() +
                        sport.experience_level.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-neutral-800/50 border border-neutral-600 rounded-xl p-6">
        <h4
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          <Info className="h-4 w-4" />
          Sports Management
        </h4>
        <p className="text-sm mb-3" style={{ color: 'var(--ash-grey)' }}>
          Advanced sports editing functionality is coming soon! For now, you can
          view your current sports.
        </p>
        <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
          To modify your sports, positions, or experience levels, please contact
          support or re-complete onboarding.
        </p>
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
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          Social & Contact
        </h2>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Connect your social media accounts to build your network
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
              className="absolute left-3 top-3 text-sm"
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
              className="absolute left-3 top-3 text-sm"
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
              className="absolute left-3 top-3 text-sm"
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
      <div className="bg-neutral-800/50 border border-neutral-600 rounded-xl p-6">
        <h4
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          <Info className="h-4 w-4" />
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
    <div className="flex space-x-1 bg-neutral-800/50 p-1 rounded-xl border border-neutral-600">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-green-500 text-white shadow-lg'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
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
    { id: 'basic', label: 'Basic Info', icon: <User className="h-4 w-4" /> },
    { id: 'sports', label: 'Sports', icon: <Trophy className="h-4 w-4" /> },
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
      const result = await updateProfileBasicInfo(user.id, profileUpdates);

      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        setProfileUpdates({});

        // Refresh profile data in context
        await refreshProfile(true);

        // Auto-hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      }
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
            Profile Not Found
          </p>
          <p className="mb-6" style={{ color: 'var(--ash-grey)' }}>
            Please complete your onboarding first.
          </p>
          <Button onClick={() => router.push('/onboarding')}>
            Complete Onboarding
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      {/* Header */}
      <div className="bg-neutral-900/50 border-b border-neutral-700">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 hover:bg-neutral-800"
                style={{ color: 'var(--ash-grey)' }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-neutral-600" />
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  Edit Profile
                </h1>
                <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                  Update your PLAYBACK profile information
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl shadow-lg">
              <div className="p-6">
                {/* Tab Navigation */}
                <div className="mb-8">
                  <TabNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    tabs={tabs}
                  />
                </div>

                {/* Tab Content */}
                <div className="bg-neutral-800/30 rounded-xl p-8">
                  {activeTab === 'basic' && (
                    <BasicInfoTab
                      profile={profile.data}
                      user={user}
                      onUpdate={handleProfileUpdate}
                      onMarkChanged={markAsChanged}
                    />
                  )}
                  {activeTab === 'sports' && (
                    <SportsTab
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
            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6 sticky top-8">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: 'var(--timberwolf)' }}
              >
                Profile Preview
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
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
