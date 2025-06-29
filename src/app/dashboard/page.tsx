'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
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
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserSport {
  id: string;
  role: string;
  experience_level: string | null;
  positions: string[] | null;
  sport: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

interface ProfileData {
  id: string;
  bio: string | null;
  location: string | null;
  social_links: any; // JSON field from Supabase
  user_sports: UserSport[];
}

function DashboardContent() {
  const { user, signOut, loading, onboardingStatus, refreshOnboardingStatus } =
    useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState('');
  const [forceRefresh, setForceRefresh] = useState(0); // Force re-render counter

  const handleSignOut = async () => {
    await signOut();
  };

  // Fetch user profile data
  const fetchProfileData = async () => {
    if (!user) return;

    setProfileLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          bio,
          location,
          social_links,
          user_sports (
            id,
            role,
            experience_level,
            positions,
            sport:sports (
              id,
              name,
              description
            )
          )
        `
        )
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfileData(data);

      // Debug log to understand the data structure
      console.log('Profile data loaded:', {
        userSportsCount: data.user_sports?.length,
        userSports: data.user_sports?.map((us) => ({
          id: us.id,
          role: us.role,
          experience_level: us.experience_level,
          positions: us.positions,
          sport_name: us.sport?.name,
        })),
      });
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load profile data'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  // Debug render-time state values
  console.log('🎨 Dashboard render state:', {
    loading,
    profileLoading,
    onboardingStatus,
    showIncompleteMessage:
      !onboardingStatus?.isComplete && !onboardingStatus?.loading && !loading,
  });

  if (loading || (onboardingStatus?.isComplete && profileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to your Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your PLAYBACK profile and sports journey
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* User Info Card */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-primary-foreground" />
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">
                {user?.user_metadata?.full_name || 'Athlete'}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined {new Date(user?.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Account Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Email Verified:</span>
                <span
                  className={
                    user?.email_confirmed_at
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }
                >
                  {user?.email_confirmed_at ? 'Yes' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Profile Setup:</span>
                <div className="flex items-center gap-1">
                  {onboardingStatus?.isComplete ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Complete</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-600">Incomplete</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span>Primary Role:</span>
                <span className="capitalize">
                  {profileData?.user_sports?.[0]?.role ||
                    user?.user_metadata?.role ||
                    'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error loading profile data</span>
            </div>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProfileData}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Onboarding Incomplete Message */}
        {!onboardingStatus?.isComplete &&
          !onboardingStatus?.loading &&
          !loading && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-foreground">
                  Profile Status Issue
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                It looks like your profile completion isn&apos;t being detected
                properly. If you&apos;ve already completed the onboarding, try
                refreshing the status below.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => (window.location.href = '/onboarding')}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Go to Onboarding
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    console.log('Manual onboarding refresh triggered');
                    await refreshOnboardingStatus();
                    await fetchProfileData();
                    // Force re-render after state updates
                    setTimeout(() => setForceRefresh((prev) => prev + 1), 500);
                  }}
                  className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                >
                  🔄 Refresh Status
                </Button>
              </div>
            </div>
          )}

        {/* Profile Data Sections */}
        {onboardingStatus?.isComplete && profileData && (
          <div className="space-y-8 mb-8">
            {/* Sports Information */}
            {profileData.user_sports && profileData.user_sports.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Your Sports
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileData.user_sports.map((userSport) => (
                    <div key={userSport.id} className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground capitalize mb-2">
                        {userSport.sport?.name || 'Unknown Sport'}
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Role:</span>
                          <span className="capitalize">{userSport.role}</span>
                        </div>
                        {userSport.experience_level && (
                          <div className="flex justify-between">
                            <span>Level:</span>
                            <span className="capitalize">
                              {userSport.experience_level}
                            </span>
                          </div>
                        )}
                        {userSport.positions &&
                          userSport.positions.length > 0 && (
                            <div>
                              <span>Positions:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {userSport.positions.map((position, index) => (
                                  <span
                                    key={index}
                                    className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                                  >
                                    {position}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Information */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Profile Information
              </h3>
              <div className="space-y-4">
                {profileData.bio && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Bio</h4>
                    <p className="text-muted-foreground text-sm">
                      {profileData.bio}
                    </p>
                  </div>
                )}

                {profileData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {profileData.location}
                    </span>
                  </div>
                )}

                {profileData.social_links &&
                  Object.keys(profileData.social_links).length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Social Media
                      </h4>
                      <div className="flex gap-4">
                        {profileData.social_links.instagram && (
                          <a
                            href={profileData.social_links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Instagram className="h-4 w-4" />
                            <span className="text-sm">Instagram</span>
                          </a>
                        )}
                        {profileData.social_links.twitter && (
                          <a
                            href={profileData.social_links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Twitter className="h-4 w-4" />
                            <span className="text-sm">Twitter</span>
                          </a>
                        )}
                        {profileData.social_links.linkedin && (
                          <a
                            href={profileData.social_links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Linkedin className="h-4 w-4" />
                            <span className="text-sm">LinkedIn</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                {!profileData.bio &&
                  !profileData.location &&
                  (!profileData.social_links ||
                    Object.keys(profileData.social_links).length === 0) && (
                    <p className="text-muted-foreground text-sm italic">
                      No additional profile information provided during
                      onboarding.
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-6 w-6 text-blue-500" />
              <h3 className="font-semibold">
                {onboardingStatus?.isComplete
                  ? 'Edit Profile'
                  : 'Complete Profile'}
              </h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {onboardingStatus?.isComplete
                ? 'Update your sports information, bio, and profile details'
                : 'Add your sports information, bio, and profile details'}
            </p>
            <Button
              className="w-full"
              onClick={() => (window.location.href = '/onboarding')}
              variant={onboardingStatus?.isComplete ? 'outline' : 'default'}
            >
              {onboardingStatus?.isComplete ? 'Edit Profile' : 'Complete Setup'}
            </Button>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h3 className="font-semibold">Upload Highlights</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Share your best moments and achievements
            </p>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="h-6 w-6 text-green-500" />
              <h3 className="font-semibold">Connect</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Find and connect with other athletes and coaches
            </p>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </div>
        </div>

        {/* Development Info */}
        <div className="bg-muted border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-3">
            🚧 Development Status
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Authentication and onboarding systems are complete! The highlights
            upload and social networking features are coming next in Phase 2.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background p-4 rounded border">
              <h4 className="font-medium mb-2">System Status:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Authentication:</span>
                  <span className="text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between">
                  <span>Onboarding:</span>
                  <span className="text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between">
                  <span>Profile Display:</span>
                  <span className="text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between">
                  <span>Highlights Upload:</span>
                  <span className="text-orange-600">⏳ Coming Soon</span>
                </div>
                <div className="flex justify-between">
                  <span>Social Network:</span>
                  <span className="text-orange-600">⏳ Coming Soon</span>
                </div>
              </div>
            </div>

            <div className="bg-background p-4 rounded border">
              <h4 className="font-medium mb-2">Profile Status:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="font-mono text-xs">
                    {user?.id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Onboarding:</span>
                  <span
                    className={
                      onboardingStatus?.isComplete
                        ? 'text-green-600'
                        : 'text-orange-600'
                    }
                  >
                    {onboardingStatus?.isComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sports Count:</span>
                  <span>{profileData?.user_sports?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profile Data:</span>
                  <span
                    className={
                      profileData ? 'text-green-600' : 'text-orange-600'
                    }
                  >
                    {profileData ? 'Loaded' : 'Not Loaded'}
                  </span>
                </div>
                {profileData?.user_sports &&
                  profileData.user_sports.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-muted">
                      <div className="text-xs">
                        <div className="font-medium mb-1">Sports Details:</div>
                        {profileData.user_sports.map((us, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{us.sport?.name}:</span>
                            <span
                              className={
                                us.role ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {us.role || 'NO ROLE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <div className="mt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchProfileData();
                    window.location.reload(); // Force refresh onboarding status
                  }}
                  className="w-full"
                >
                  🔄 Refresh Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('=== DEBUG SESSION START ===');
                    console.log('👤 Current user:', user);
                    console.log(
                      '📊 Current onboarding status:',
                      onboardingStatus
                    );
                    await refreshOnboardingStatus();
                    await fetchProfileData();
                    // Force re-render after state updates
                    setTimeout(() => setForceRefresh((prev) => prev + 1), 500);
                    console.log('=== DEBUG SESSION END ===');
                  }}
                  className="w-full text-xs"
                >
                  🐛 Debug Database
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
