'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useProfile } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle,
  User,
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  Trophy,
  Sparkles,
  Star,
  AlertCircle,
} from 'lucide-react';
import {
  saveOnboardingData,
  type OnboardingData,
} from '@/lib/onboarding/utils';

interface Sport {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

interface SportPosition {
  positions: string[];
  experience: string;
}

interface ProfileInfo {
  bio: string;
  location: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}

// Progress indicator component
function ProgressIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'border-2 text-white'
                      : 'bg-neutral-700 text-neutral-400'
                }
              `}
              style={{
                backgroundColor: isCompleted
                  ? '#10b981'
                  : isCurrent
                    ? 'var(--ash-grey)'
                    : undefined,
                borderColor: isCurrent ? 'var(--ash-grey)' : undefined,
                color: isCurrent ? 'var(--night)' : undefined,
              }}
            >
              {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
            </div>
            {stepNumber < totalSteps && (
              <div
                className={`w-8 h-0.5 transition-colors duration-200 ${
                  isCompleted ? 'bg-green-500' : 'bg-neutral-600'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Step 1: Welcome & Role Selection
function WelcomeStep({
  selectedRole,
  setSelectedRole,
}: {
  selectedRole: string;
  setSelectedRole: (role: string) => void;
}) {
  const roles = [
    {
      value: 'player',
      title: 'Player',
      description:
        'I am an athlete looking to showcase my skills and connect with opportunities',
    },
    {
      value: 'coach',
      title: 'Coach',
      description:
        'I coach athletes and want to manage teams and track player development',
    },
    {
      value: 'scout',
      title: 'Scout',
      description:
        'I discover and evaluate talent for recruitment opportunities',
    },
    {
      value: 'fan',
      title: 'Fan',
      description:
        'I follow sports and want to connect with the athletic community',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--timberwolf)' }}
        >
          Welcome to PLAYBACK! 👋
        </h2>
        <p style={{ color: 'var(--ash-grey)' }}>
          Let&apos;s get you set up. First, tell us what describes you best:
        </p>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => setSelectedRole(role.value)}
            className={`
              p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02]
              ${
                selectedRole === role.value
                  ? 'border-2 bg-neutral-700/50'
                  : 'border-neutral-600 bg-neutral-800/30 hover:border-neutral-500'
              }
            `}
            style={{
              borderColor:
                selectedRole === role.value ? 'var(--ash-grey)' : undefined,
            }}
          >
            <h3
              className="font-semibold mb-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              {role.title}
            </h3>
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              {role.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 2: Multiple Sports Selection
function SportSelectionStep({
  selectedSports,
  setSelectedSports,
}: {
  selectedSports: string[];
  setSelectedSports: (sportIds: string[]) => void;
}) {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data, error } = await supabase
          .from('sports')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        setSports(data || []);
      } catch (err) {
        console.error('Error fetching sports:', err);
        setError('Failed to load sports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSports();
  }, []);

  const toggleSport = (sportId: string) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports(selectedSports.filter((id) => id !== sportId));
    } else {
      setSelectedSports([...selectedSports, sportId]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--timberwolf)' }}
          >
            Choose Your Sports
          </h2>
          <p style={{ color: 'var(--ash-grey)' }}>
            Select all the sports you want to showcase on your profile.
          </p>
        </div>

        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4" style={{ color: 'var(--ash-grey)' }}>
            Loading sports...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--timberwolf)' }}
          >
            Choose Your Sports
          </h2>
          <p style={{ color: 'var(--ash-grey)' }}>
            Select all the sports you want to showcase on your profile.
          </p>
        </div>

        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-neutral-600"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--timberwolf)' }}
        >
          Choose Your Sports
        </h2>
        <p style={{ color: 'var(--ash-grey)' }}>
          Select all the sports you want to showcase on your profile.
          You&apos;ll set positions for each sport next.
        </p>
        {selectedSports.length > 0 && (
          <p className="text-sm mt-2" style={{ color: 'var(--ash-grey)' }}>
            {selectedSports.length} sport
            {selectedSports.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {sports.map((sport) => {
          const isSelected = selectedSports.includes(sport.id);

          return (
            <button
              key={sport.id}
              onClick={() => toggleSport(sport.id)}
              className={`
                p-4 rounded-xl border-2 text-center transition-all duration-200 hover:scale-[1.05] relative
                ${
                  isSelected
                    ? 'border-2 bg-neutral-700/50'
                    : 'border-neutral-600 bg-neutral-800/30 hover:border-neutral-500'
                }
              `}
              style={{
                borderColor: isSelected ? 'var(--ash-grey)' : undefined,
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              {sport.icon_url ? (
                <img
                  src={sport.icon_url}
                  alt={sport.name}
                  className="w-12 h-12 mx-auto mb-3 object-contain"
                />
              ) : (
                <div
                  className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--ash-grey)' }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ color: 'var(--night)' }}
                  >
                    {sport.name.charAt(0)}
                  </span>
                </div>
              )}
              <h3
                className="font-semibold mb-1"
                style={{ color: 'var(--timberwolf)' }}
              >
                {sport.name}
              </h3>
              {sport.description && (
                <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                  {sport.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 3: Sport-Specific Position & Experience Selection
function PositionExperienceStep({
  selectedSports,
  sportPositions,
  setSportPositions,
  allSports,
}: {
  selectedSports: string[];
  sportPositions: Record<string, SportPosition>;
  setSportPositions: (positions: Record<string, SportPosition>) => void;
  allSports: Sport[];
}) {
  const [currentSportIndex, setCurrentSportIndex] = useState(0);

  // Sample positions by sport (this could be fetched from database)
  const getPositionsForSport = (sportName: string): string[] => {
    const positions: Record<string, string[]> = {
      Football: [
        'Goalkeeper',
        'Defender',
        'Midfielder',
        'Forward',
        'Striker',
        'Winger',
      ],
      Basketball: [
        'Point Guard',
        'Shooting Guard',
        'Small Forward',
        'Power Forward',
        'Center',
      ],
      Tennis: ['Singles Player', 'Doubles Player'],
      Rugby: [
        'Prop',
        'Hooker',
        'Lock',
        'Flanker',
        'Number 8',
        'Scrum-half',
        'Fly-half',
        'Wing',
        'Centre',
        'Fullback',
      ],
      Volleyball: [
        'Setter',
        'Outside Hitter',
        'Middle Blocker',
        'Opposite Hitter',
        'Libero',
        'Defensive Specialist',
      ],
      Lacrosse: ['Attack', 'Midfield', 'Defense', 'Goalie'],
      Padel: ['Front Court', 'Back Court'],
    };
    return positions[sportName] || ['Player'];
  };

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', description: 'New to the sport' },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'Some experience',
    },
    { value: 'advanced', label: 'Advanced', description: 'Highly skilled' },
    {
      value: 'professional',
      label: 'Professional',
      description: 'Competing professionally',
    },
  ];

  const currentSport = allSports.find(
    (sport) => sport.id === selectedSports[currentSportIndex]
  );
  const currentPositions = sportPositions[
    selectedSports[currentSportIndex]
  ] || { positions: [], experience: '' };

  const updateSportPosition = (
    sportId: string,
    update: Partial<SportPosition>
  ) => {
    setSportPositions({
      ...sportPositions,
      [sportId]: {
        positions: update.positions ?? sportPositions[sportId]?.positions ?? [],
        experience:
          update.experience ?? sportPositions[sportId]?.experience ?? '',
      },
    });
  };

  const togglePosition = (position: string) => {
    const sportId = selectedSports[currentSportIndex];
    const currentPos = currentPositions.positions;
    const newPositions = currentPos.includes(position)
      ? currentPos.filter((p) => p !== position)
      : [...currentPos, position];

    updateSportPosition(sportId, { positions: newPositions });
  };

  const setExperience = (experience: string) => {
    const sportId = selectedSports[currentSportIndex];
    updateSportPosition(sportId, { experience });
  };

  if (!currentSport) {
    return <div>Error: Sport not found</div>;
  }

  const availablePositions = getPositionsForSport(currentSport.name);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--timberwolf)' }}
        >
          {currentSport.name} Details
        </h2>
        <p style={{ color: 'var(--ash-grey)' }}>
          Sport {currentSportIndex + 1} of {selectedSports.length}
        </p>
      </div>

      {/* Sport navigation */}
      {selectedSports.length > 1 && (
        <div className="flex justify-center space-x-2 mb-6">
          {selectedSports.map((sportId, index) => {
            const sport = allSports.find((s) => s.id === sportId);
            const isCompleted =
              sportPositions[sportId]?.positions.length > 0 &&
              sportPositions[sportId]?.experience;
            return (
              <button
                key={sportId}
                onClick={() => setCurrentSportIndex(index)}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  index === currentSportIndex
                    ? 'bg-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700'
                }`}
                style={{ color: 'var(--timberwolf)' }}
              >
                {isCompleted && (
                  <CheckCircle className="inline h-3 w-3 mr-1 text-green-400" />
                )}
                {sport?.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-6">
        {/* Position Selection */}
        <div>
          <Label
            className="text-base font-semibold mb-4 block"
            style={{ color: 'var(--timberwolf)' }}
          >
            What positions do you play in {currentSport.name}?
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availablePositions.map((position) => {
              const isSelected = currentPositions.positions.includes(position);
              return (
                <button
                  key={position}
                  onClick={() => togglePosition(position)}
                  className={`p-3 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? 'border-2 bg-neutral-700/50'
                      : 'border-neutral-600 bg-neutral-800/30 hover:border-neutral-500'
                  }`}
                  style={{
                    borderColor: isSelected ? 'var(--ash-grey)' : undefined,
                    color: 'var(--timberwolf)',
                  }}
                >
                  {position}
                  {isSelected && <Check className="inline h-4 w-4 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <Label
            className="text-base font-semibold mb-4 block"
            style={{ color: 'var(--timberwolf)' }}
          >
            What&apos;s your experience level in {currentSport.name}?
          </Label>
          <div className="grid gap-3">
            {experienceLevels.map((level) => {
              const isSelected = currentPositions.experience === level.value;
              return (
                <button
                  key={level.value}
                  onClick={() => setExperience(level.value)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-2 bg-neutral-700/50'
                      : 'border-neutral-600 bg-neutral-800/30 hover:border-neutral-500'
                  }`}
                  style={{
                    borderColor: isSelected ? 'var(--ash-grey)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className="font-semibold"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {level.label}
                      </h4>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {level.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check
                        className="h-5 w-5"
                        style={{ color: 'var(--ash-grey)' }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation for multiple sports */}
      {selectedSports.length > 1 && (
        <div className="flex justify-between pt-4">
          <Button
            onClick={() =>
              setCurrentSportIndex(Math.max(0, currentSportIndex - 1))
            }
            disabled={currentSportIndex === 0}
            variant="outline"
            className="border-neutral-600"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Sport
          </Button>

          <Button
            onClick={() =>
              setCurrentSportIndex(
                Math.min(selectedSports.length - 1, currentSportIndex + 1)
              )
            }
            disabled={currentSportIndex === selectedSports.length - 1}
            variant="outline"
            className="border-neutral-600"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
          >
            Next Sport
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Role-Specific Profile Step for Non-Players
function NonPlayerProfileStep({
  selectedRole,
  profileInfo,
  setProfileInfo,
}: {
  selectedRole: string;
  profileInfo: ProfileInfo;
  setProfileInfo: (info: ProfileInfo) => void;
}) {
  const handleInputChange = (field: string, value: string) => {
    setProfileInfo({ ...profileInfo, [field]: value });
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setProfileInfo({
      ...profileInfo,
      socialLinks: {
        ...profileInfo.socialLinks,
        [platform]: value,
      },
    });
  };

  const getRoleSpecificContent = () => {
    switch (selectedRole) {
      case 'coach':
        return {
          title: 'Tell us about your coaching experience',
          bioPlaceholder:
            'Share your coaching philosophy, experience, specializations, and what you bring to athlete development...',
          bioLabel: 'Coaching Background',
        };
      case 'scout':
        return {
          title: 'Tell us about your scouting focus',
          bioPlaceholder:
            'Share your scouting expertise, what sports you focus on, your evaluation criteria, and experience...',
          bioLabel: 'Scouting Profile',
        };
      case 'fan':
        return {
          title: 'Tell us about your sports interests',
          bioPlaceholder:
            'Share your favorite sports, teams, players, and what makes you passionate about athletics...',
          bioLabel: 'Sports Interests',
        };
      default:
        return {
          title: 'Tell us about yourself',
          bioPlaceholder:
            'Share something about yourself and your connection to sports...',
          bioLabel: 'About You',
        };
    }
  };

  const content = getRoleSpecificContent();
  const bioCharCount = profileInfo.bio.length;
  const bioMaxLength = 500;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--timberwolf)' }}
        >
          {content.title}
        </h2>
        <p style={{ color: 'var(--ash-grey)' }}>
          Help others understand your role in the sports community
        </p>
      </div>

      <div className="space-y-6">
        {/* Bio Section */}
        <div className="space-y-3">
          <Label
            htmlFor="bio"
            className="text-sm font-medium"
            style={{ color: 'var(--ash-grey)' }}
          >
            {content.bioLabel}
          </Label>
          <Textarea
            id="bio"
            value={profileInfo.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="min-h-[120px] bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-lg resize-none"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
            placeholder={content.bioPlaceholder}
            maxLength={bioMaxLength}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
              This will be displayed on your public profile
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
            className="text-sm font-medium flex items-center gap-2"
            style={{ color: 'var(--ash-grey)' }}
          >
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="City, State/Country"
            value={profileInfo.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="h-10 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-lg"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
          />
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--timberwolf)' }}
          >
            Connect Your Social Media
          </h3>
          <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            All fields are optional. Add your social media to help others
            connect with you.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Instagram */}
            <div className="space-y-2">
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  @
                </span>
                <Input
                  id="instagram"
                  type="text"
                  placeholder="username"
                  value={profileInfo.socialLinks.instagram}
                  onChange={(e) =>
                    handleSocialLinkChange('instagram', e.target.value)
                  }
                  className="h-10 pl-8 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-lg"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
                />
              </div>
            </div>

            {/* Twitter */}
            <div className="space-y-2">
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  @
                </span>
                <Input
                  id="twitter"
                  type="text"
                  placeholder="username"
                  value={profileInfo.socialLinks.twitter}
                  onChange={(e) =>
                    handleSocialLinkChange('twitter', e.target.value)
                  }
                  className="h-10 pl-8 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-lg"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2 sm:col-span-2">
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  /in/
                </span>
                <Input
                  id="linkedin"
                  type="text"
                  placeholder="username"
                  value={profileInfo.socialLinks.linkedin}
                  onChange={(e) =>
                    handleSocialLinkChange('linkedin', e.target.value)
                  }
                  className="h-10 pl-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-lg"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 4: Profile Info
function ProfileInfoStep({
  profileInfo,
  setProfileInfo,
}: {
  profileInfo: ProfileInfo;
  setProfileInfo: (info: ProfileInfo) => void;
}) {
  const handleInputChange = (field: keyof ProfileInfo, value: string) => {
    setProfileInfo({
      ...profileInfo,
      [field]: value,
    });
  };

  const handleSocialLinkChange = (
    platform: keyof ProfileInfo['socialLinks'],
    value: string
  ) => {
    setProfileInfo({
      ...profileInfo,
      socialLinks: {
        ...profileInfo.socialLinks,
        [platform]: value,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--timberwolf)' }}
        >
          Add Personal Details
        </h2>
        <p style={{ color: 'var(--ash-grey)' }}>
          Share more about yourself to help others connect with you. All fields
          are optional!
        </p>
      </div>

      <div className="space-y-6">
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
            placeholder="Tell us about yourself, your sports journey, goals, and what makes you unique..."
            value={profileInfo.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="min-h-[100px] bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl resize-none"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
            maxLength={500}
          />
          <div
            className="text-xs text-right"
            style={{ color: 'var(--ash-grey)' }}
          >
            {profileInfo.bio.length}/500 characters
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <Label
            htmlFor="location"
            className="font-medium flex items-center gap-2"
            style={{ color: 'var(--timberwolf)' }}
          >
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="City, State/Province, Country"
            value={profileInfo.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="h-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
            autoComplete="address-level1"
          />
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <Label className="font-medium" style={{ color: 'var(--timberwolf)' }}>
            Social Media (Optional)
          </Label>
          <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            Help others connect with you on social platforms
          </p>

          <div className="space-y-4">
            {/* Instagram */}
            <div className="space-y-2">
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  @
                </span>
                <Input
                  id="instagram"
                  type="text"
                  placeholder="username"
                  value={profileInfo.socialLinks.instagram}
                  onChange={(e) =>
                    handleSocialLinkChange('instagram', e.target.value)
                  }
                  className="h-10 pl-8 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-lg"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
                />
              </div>
            </div>

            {/* Twitter */}
            <div className="space-y-2">
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  @
                </span>
                <Input
                  id="twitter"
                  type="text"
                  placeholder="username"
                  value={profileInfo.socialLinks.twitter}
                  onChange={(e) =>
                    handleSocialLinkChange('twitter', e.target.value)
                  }
                  className="h-10 pl-8 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-lg"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  /in/
                </span>
                <Input
                  id="linkedin"
                  type="text"
                  placeholder="username"
                  value={profileInfo.socialLinks.linkedin}
                  onChange={(e) =>
                    handleSocialLinkChange('linkedin', e.target.value)
                  }
                  className="h-10 pl-12 bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-lg"
                  style={{
                    color: 'var(--timberwolf)',
                    borderColor: 'var(--ash-grey)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 5: Welcome & Summary
function WelcomeSummaryStep({
  selectedRole,
  selectedSports,
  sportPositions,
  profileInfo,
  allSports,
  onFinish,
  loading,
  error,
}: {
  selectedRole: string;
  selectedSports: string[];
  sportPositions: Record<string, SportPosition>;
  profileInfo: ProfileInfo;
  allSports: Sport[];
  onFinish: () => void;
  loading: boolean;
  error?: string;
}) {
  const getSportName = (sportId: string) => {
    const sport = allSports.find((s) => s.id === sportId);
    return sport?.name || 'Unknown Sport';
  };

  const selectedSportsCount = selectedSports.length;
  const totalPositions = Object.values(sportPositions).reduce(
    (acc, pos) => acc + pos.positions.length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Celebration Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg border border-neutral-700 animate-pulse"
              style={{ backgroundColor: 'var(--ash-grey)' }}
            >
              <Trophy className="h-10 w-10" style={{ color: 'var(--night)' }} />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" />
            </div>
          </div>
        </div>
        <h2
          className="text-3xl font-bold mb-4"
          style={{ color: 'var(--timberwolf)' }}
        >
          🎉 Welcome to PLAYBACK!
        </h2>
        <p className="text-lg" style={{ color: 'var(--ash-grey)' }}>
          You&apos;re all set up and ready to showcase your athletic journey!
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-6">
        {/* Role Summary */}
        <div className="bg-neutral-700/30 rounded-xl p-6 border border-neutral-600">
          <div className="flex items-center gap-3 mb-3">
            <Star className="h-5 w-5" style={{ color: 'var(--ash-grey)' }} />
            <h3
              className="font-semibold text-lg"
              style={{ color: 'var(--timberwolf)' }}
            >
              Your Role
            </h3>
          </div>
          <p
            className="capitalize text-lg font-medium"
            style={{ color: 'var(--ash-grey)' }}
          >
            {selectedRole}
          </p>
        </div>

        {/* Sports Summary */}
        <div className="bg-neutral-700/30 rounded-xl p-6 border border-neutral-600">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-5 w-5" style={{ color: 'var(--ash-grey)' }} />
            <h3
              className="font-semibold text-lg"
              style={{ color: 'var(--timberwolf)' }}
            >
              Your Sports ({selectedSportsCount}{' '}
              {selectedSportsCount === 1 ? 'sport' : 'sports'})
            </h3>
          </div>
          <div className="space-y-4">
            {selectedSports.map((sportId) => {
              const sportName = getSportName(sportId);
              const positions = sportPositions[sportId]?.positions || [];
              const experience = sportPositions[sportId]?.experience || '';

              return (
                <div
                  key={sportId}
                  className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-600"
                >
                  <h4
                    className="font-medium mb-2"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    {sportName}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span style={{ color: 'var(--ash-grey)' }}>
                        Positions:{' '}
                      </span>
                      <span style={{ color: 'var(--timberwolf)' }}>
                        {positions.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ash-grey)' }}>
                        Experience:{' '}
                      </span>
                      <span
                        className="capitalize font-medium"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {experience}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profile Details Summary */}
        {(profileInfo.bio ||
          profileInfo.location ||
          profileInfo.socialLinks.instagram ||
          profileInfo.socialLinks.twitter ||
          profileInfo.socialLinks.linkedin) && (
          <div className="bg-neutral-700/30 rounded-xl p-6 border border-neutral-600">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5" style={{ color: 'var(--ash-grey)' }} />
              <h3
                className="font-semibold text-lg"
                style={{ color: 'var(--timberwolf)' }}
              >
                Personal Details
              </h3>
            </div>
            <div className="space-y-3">
              {profileInfo.bio && (
                <div>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Bio:{' '}
                  </span>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    {profileInfo.bio}
                  </p>
                </div>
              )}
              {profileInfo.location && (
                <div>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Location:{' '}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    {profileInfo.location}
                  </span>
                </div>
              )}
              {(profileInfo.socialLinks.instagram ||
                profileInfo.socialLinks.twitter ||
                profileInfo.socialLinks.linkedin) && (
                <div>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    Social Links:{' '}
                  </span>
                  <div className="flex gap-4 mt-2">
                    {profileInfo.socialLinks.instagram && (
                      <div className="flex items-center gap-2">
                        <Instagram
                          className="h-4 w-4"
                          style={{ color: 'var(--ash-grey)' }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: 'var(--timberwolf)' }}
                        >
                          @{profileInfo.socialLinks.instagram}
                        </span>
                      </div>
                    )}
                    {profileInfo.socialLinks.twitter && (
                      <div className="flex items-center gap-2">
                        <Twitter
                          className="h-4 w-4"
                          style={{ color: 'var(--ash-grey)' }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: 'var(--timberwolf)' }}
                        >
                          @{profileInfo.socialLinks.twitter}
                        </span>
                      </div>
                    )}
                    {profileInfo.socialLinks.linkedin && (
                      <div className="flex items-center gap-2">
                        <Linkedin
                          className="h-4 w-4"
                          style={{ color: 'var(--ash-grey)' }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: 'var(--timberwolf)' }}
                        >
                          /in/{profileInfo.socialLinks.linkedin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-green-900/20 backdrop-blur border border-green-700/30 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-3 text-green-400">
          🚀 What&apos;s Next?
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--ash-grey)' }}>
          <li>• Complete your profile with photos and highlights</li>
          <li>• Connect with other athletes, coaches, and scouts</li>
          <li>• Start building your athletic portfolio</li>
          <li>• Discover opportunities in your sports</li>
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 backdrop-blur border border-red-700/30 rounded-xl p-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Failed to complete onboarding
              </p>
              <p className="text-xs mt-1 opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Finish Button */}
      <div className="text-center pt-4">
        <Button
          onClick={onFinish}
          disabled={loading}
          className="w-full h-12 text-lg font-semibold rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white border-0"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Setting up your profile...
            </>
          ) : (
            <>
              {error ? 'Try Again' : 'Enter PLAYBACK'}
              <Trophy className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Main onboarding component
function OnboardingContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [sportPositions, setSportPositions] = useState<
    Record<string, SportPosition>
  >({});
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    bio: '',
    location: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      linkedin: '',
    },
  });
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const router = useRouter();

  // Dynamic total steps based on role
  const totalSteps = selectedRole === 'player' ? 5 : 3;

  // Fetch sports for position step
  useEffect(() => {
    if (selectedSports.length > 0) {
      const fetchSports = async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          const { data } = await supabase
            .from('sports')
            .select('*')
            .in('id', selectedSports);

          setAllSports(data || []);
        } catch (err) {
          console.error('Error fetching sports details:', err);
        }
      };

      fetchSports();
    }
  }, [selectedSports]);

  const canGoNext = () => {
    // General validation regardless of role
    switch (currentStep) {
      case 1:
        return selectedRole !== '';
      default:
        break;
    }

    if (selectedRole === 'player') {
      // Player-specific validation flow
      switch (currentStep) {
        case 2:
          return selectedSports.length > 0;
        case 3:
          // Check if all selected sports have positions and experience
          return selectedSports.every((sportId) => {
            const sportPos = sportPositions[sportId];
            return (
              sportPos && sportPos.positions.length > 0 && sportPos.experience
            );
          });
        case 4:
          // All fields are optional in profile step
          return true;
        case 5:
          // Final step - always ready to finish
          return true;
        default:
          return false;
      }
    } else {
      // Non-player validation flow (3 steps total)
      switch (currentStep) {
        case 2:
          // All fields are optional for non-players
          return true;
        case 3:
          // Final step - always ready to finish
          return true;
        default:
          return false;
      }
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    if (!user) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      // Prepare onboarding data for database save
      const onboardingData: OnboardingData = {
        role: selectedRole,
        selectedSports,
        sportPositions,
        profileInfo,
      };

      // Save to database
      const { success, error: saveError } = await saveOnboardingData(
        user.id,
        onboardingData
      );

      if (!success) {
        throw new Error(saveError || 'Failed to save onboarding data');
      }

      // Refresh profile data in context to reflect changes
      await refreshProfile(true); // Force refresh

      // Small delay for UX (let user see success state)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to complete onboarding. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    // Role-specific step flow
    if (selectedRole === 'player') {
      // Player flow: Role → Sports → Positions → Profile → Summary
      switch (currentStep) {
        case 1:
          return (
            <WelcomeStep
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
            />
          );
        case 2:
          return (
            <SportSelectionStep
              selectedSports={selectedSports}
              setSelectedSports={setSelectedSports}
            />
          );
        case 3:
          return (
            <PositionExperienceStep
              selectedSports={selectedSports}
              sportPositions={sportPositions}
              setSportPositions={setSportPositions}
              allSports={allSports}
            />
          );
        case 4:
          return (
            <ProfileInfoStep
              profileInfo={profileInfo}
              setProfileInfo={setProfileInfo}
            />
          );
        case 5:
          return (
            <WelcomeSummaryStep
              selectedRole={selectedRole}
              selectedSports={selectedSports}
              sportPositions={sportPositions}
              profileInfo={profileInfo}
              allSports={allSports}
              onFinish={handleFinish}
              loading={loading}
              error={error}
            />
          );
        default:
          return null;
      }
    } else {
      // Non-player flow: Role → Profile → Summary (simplified)
      switch (currentStep) {
        case 1:
          return (
            <WelcomeStep
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
            />
          );
        case 2:
          return (
            <NonPlayerProfileStep
              selectedRole={selectedRole}
              profileInfo={profileInfo}
              setProfileInfo={setProfileInfo}
            />
          );
        case 3:
          return (
            <WelcomeSummaryStep
              selectedRole={selectedRole}
              selectedSports={[]} // No sports for non-players
              sportPositions={{}}
              profileInfo={profileInfo}
              allSports={allSports}
              onFinish={handleFinish}
              loading={loading}
              error={error}
            />
          );
        default:
          return null;
      }
    }
  };

  return (
    <div
      className="min-h-screen p-2 sm:p-4"
      style={{ backgroundColor: 'var(--night)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border border-neutral-700"
              style={{ backgroundColor: 'var(--ash-grey)' }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: 'var(--night)' }}
              >
                PB
              </span>
            </div>
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--timberwolf)' }}
          >
            Set up your profile
          </h1>
          <p style={{ color: 'var(--ash-grey)' }}>
            Welcome {user?.email}! Let&apos;s customize your PLAYBACK
            experience.
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step Content */}
        <div className="bg-neutral-800/70 backdrop-blur-xl border border-neutral-700/60 rounded-2xl shadow-2xl p-8 mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 border-neutral-600"
            style={{
              color: 'var(--timberwolf)',
              borderColor: 'var(--ash-grey)',
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep === totalSteps ? (
            // Step 5 has its own finish button integrated into the component
            <div></div>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex items-center gap-2 font-semibold rounded-xl"
              style={{
                backgroundColor: 'var(--ash-grey)',
                color: 'var(--night)',
              }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
