'use client';

import { useAuth, useProfile, useOnboardingStatus } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { AvatarDisplay } from '@/components/avatar/avatar-upload';
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
} from 'lucide-react';

function DashboardContent() {
  const { user, signOut, loading } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const onboardingStatus = useOnboardingStatus();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefreshProfile = async () => {
    await refreshProfile(true); // Force refresh
  };

  const isIncomplete =
    !onboardingStatus.isComplete && !onboardingStatus.loading && !loading;

  if (loading || onboardingStatus.loading) {
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
            <AvatarDisplay
              avatarUrl={profile.data?.avatar_url}
              fullName={
                profile.data?.full_name ||
                user?.user_metadata?.full_name ||
                'User'
              }
              size="lg"
            />

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
                  {onboardingStatus.isComplete ? (
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
                  {profile.data?.user_sports?.[0]?.role ||
                    user?.user_metadata?.role ||
                    'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {profile.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error loading profile data</span>
            </div>
            <p className="text-destructive/80 text-sm mt-1">{profile.error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshProfile}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Onboarding Incomplete Message */}
        {isIncomplete && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-foreground">
                Complete Your Profile Setup
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Welcome to PLAYBACK! To get the most out of your experience,
              please complete your profile setup by adding your sports
              information and personal details.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => (window.location.href = '/onboarding')}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Complete Setup Now
              </Button>
              <Button
                variant="outline"
                onClick={handleRefreshProfile}
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              >
                🔄 Refresh Status
              </Button>
            </div>
          </div>
        )}

        {/* Profile Data Sections */}
        {onboardingStatus.isComplete && profile.data && (
          <div className="space-y-8 mb-8">
            {/* Sports Information */}
            {profile.data.user_sports &&
              profile.data.user_sports.length > 0 && (
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Your Sports
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profile.data.user_sports.map((userSport) => (
                      <div
                        key={userSport.id}
                        className="bg-muted p-4 rounded-lg"
                      >
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
                                  {userSport.positions.map(
                                    (position, index) => (
                                      <span
                                        key={index}
                                        className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                                      >
                                        {position}
                                      </span>
                                    )
                                  )}
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
                {profile.data.bio && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Bio</h4>
                    <p className="text-muted-foreground text-sm">
                      {profile.data.bio}
                    </p>
                  </div>
                )}

                {profile.data.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {profile.data.location}
                    </span>
                  </div>
                )}

                {profile.data.social_links &&
                  Object.keys(profile.data.social_links).length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Social Media
                      </h4>
                      <div className="flex gap-4">
                        {profile.data.social_links.instagram && (
                          <a
                            href={profile.data.social_links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Instagram className="h-4 w-4" />
                            <span className="text-sm">Instagram</span>
                          </a>
                        )}
                        {profile.data.social_links.twitter && (
                          <a
                            href={profile.data.social_links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Twitter className="h-4 w-4" />
                            <span className="text-sm">Twitter</span>
                          </a>
                        )}
                        {profile.data.social_links.linkedin && (
                          <a
                            href={profile.data.social_links.linkedin}
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

                {!profile.data.bio &&
                  !profile.data.location &&
                  (!profile.data.social_links ||
                    Object.keys(profile.data.social_links).length === 0) && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-6 w-6 text-blue-500" />
              <h3 className="font-semibold">
                {onboardingStatus.isComplete
                  ? 'Edit Profile'
                  : 'Complete Profile'}
              </h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {onboardingStatus.isComplete
                ? 'Update your sports information, bio, and profile details'
                : 'Add your sports information, bio, and profile details'}
            </p>
            <Button
              className="w-full"
              onClick={() =>
                (window.location.href = onboardingStatus.isComplete
                  ? '/profile/edit'
                  : '/onboarding')
              }
              variant={onboardingStatus.isComplete ? 'outline' : 'default'}
            >
              {onboardingStatus.isComplete ? 'Edit Profile' : 'Complete Setup'}
            </Button>
          </div>

          {onboardingStatus.isComplete && profile.data?.username && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <ExternalLink className="h-6 w-6 text-purple-500" />
                <h3 className="font-semibold">View Public Profile</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                See how your profile appears to others
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() =>
                  (window.location.href = `/profile/${profile.data?.username}`)
                }
              >
                View Profile
              </Button>
            </div>
          )}

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
                  <span>State Management:</span>
                  <span className="text-green-600">✓ Optimized</span>
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
                      onboardingStatus.isComplete
                        ? 'text-green-600'
                        : 'text-orange-600'
                    }
                  >
                    {onboardingStatus.isComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sports Count:</span>
                  <span>{profile.data?.user_sports?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profile Data:</span>
                  <span
                    className={
                      profile.data ? 'text-green-600' : 'text-orange-600'
                    }
                  >
                    {profile.data ? 'Cached' : 'Not Loaded'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Fetched:</span>
                  <span className="text-xs">
                    {profile.lastFetched
                      ? new Date(profile.lastFetched).toLocaleTimeString()
                      : 'Never'}
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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
