'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import ProfileHeader from '../components/ProfileHeader';
import SportsSelector from '../components/SportsSelector';
import ProfileEditor from '../components/ProfileEditor';
import HighlightsManager from '../components/HighlightsManager';
import StatsTracker from '../components/StatsTracker';
import Achievements from '../components/Achievements';
import ProfileNetwork from '../components/ProfileNetwork';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/radix-tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { motion } from 'framer-motion';
import { Label } from '../components/ui/label';

// Mock data for Phase 4 testing
const mockHighlights: any[] = [
  {
    id: '1',
    title: 'Amazing Goal vs Team A',
    description: 'Scored a beautiful goal from outside the box',
    video_url: 'https://example.com/video1.mp4',
    thumbnail_url: 'https://example.com/thumb1.jpg',
    duration: 15,
    sport_id: '1',
    sport_name: 'Football',
    position: 'Striker',
    play_type: 'Goal',
    difficulty: 'Advanced',
    is_public: true,
    is_featured: true,
    tags: ['goal', 'long-range', 'highlight'],
    player_targets: [
      {
        id: '1',
        name: 'John Doe',
        position: 'Striker',
        team: 'Team A',
        time_marker: 8,
      },
    ],
    created_at: '2024-01-15T10:30:00Z',
  },
];

const mockStats: any[] = [
  {
    id: '1',
    sport_id: '1',
    sport_name: 'Football',
    stat_type: 'goals',
    value: 15,
    unit: 'goals',
    date: '2024-01-15',
    match_name: 'vs Team A',
    notes: 'Great performance',
    created_at: '2024-01-15T10:30:00Z',
  },
];

const mockAchievements: any[] = [
  {
    id: '1',
    title: 'Goal Scorer',
    description: 'Score 10 goals in a season',
    category: 'Scoring',
    icon: 'target',
    rarity: 'common',
    is_unlocked: true,
    progress: 15,
    max_progress: 10,
    unlocked_at: '2024-01-15T10:30:00Z',
    points: 100,
    sport_id: '1',
    sport_name: 'Football',
  },
];

const mockConnections: any[] = [
  {
    id: '1',
    user_id: '1',
    connected_user_id: '2',
    connected_user_name: 'Alex Johnson',
    connected_user_avatar: 'https://example.com/avatar1.jpg',
    connected_user_role: 'Player',
    connected_user_sports: ['Football', 'Basketball'],
    connection_type: 'mutual',
    connected_at: '2024-01-10T10:00:00Z',
    mutual_connections: 5,
    shared_sports: ['Football'],
    last_activity: '2024-01-15T12:00:00Z',
  },
];

const mockNetworkStats = {
  followers: 45,
  following: 32,
  mutual_connections: 18,
  total_connections: 77,
  pending_requests: 3,
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<any>(null);
  const [profileStats, setProfileStats] = useState({
    views: 0,
    connections: 0,
    highlights: 0,
  });

  // Phase 4 state - using mock data for now
  const [highlights, setHighlights] = useState<any[]>(mockHighlights);
  const [stats, setStats] = useState<any[]>(mockStats);
  const [achievements, setAchievements] = useState<any[]>(mockAchievements);
  const [connections, setConnections] = useState<any[]>(mockConnections);
  const [networkStats, setNetworkStats] = useState(mockNetworkStats);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page if not logged in
      window.location.href = '/auth';
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      // Mock profile data for now
      setProfile({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'User',
        username: user.user_metadata?.username || 'user',
        title: 'Athlete',
        bio: 'Passionate about sports and performance.',
        location: 'London, UK',
        website: '',
        avatar_url: user.user_metadata?.avatar_url || '',
        is_public: true,
        tags: ['Football', 'Athlete', 'Performance'],
        created_at: user.created_at,
      });

      // Mock stats
      setProfileStats({
        views: Math.floor(Math.random() * 1000),
        connections: Math.floor(Math.random() * 500),
        highlights: highlights.length,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-timberwolf mx-auto mb-4"></div>
          <p className="text-timberwolf">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-timberwolf mb-4">
            Please sign in to view your profile
          </h1>
          <p className="text-ash-grey">
            You need to be authenticated to access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user.email}&apos;s Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  const handleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSave = (updatedProfile: any) => {
    setProfile(updatedProfile);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  return (
    <div className="min-h-screen bg-night">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProfileHeader
            user={user}
            profile={profile}
            stats={profileStats}
            onEdit={handleEdit}
            onShare={handleShare}
          />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 bg-timberwolf/10 border border-timberwolf/20">
              <TabsTrigger
                value="overview"
                className="text-timberwolf data-[state=active]:bg-timberwolf data-[state=active]:text-night"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="highlights"
                className="text-timberwolf data-[state=active]:bg-timberwolf data-[state=active]:text-night"
              >
                Highlights
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="text-timberwolf data-[state=active]:bg-timberwolf data-[state=active]:text-night"
              >
                Statistics
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="text-timberwolf data-[state=active]:bg-timberwolf data-[state=active]:text-night"
              >
                Achievements
              </TabsTrigger>
              <TabsTrigger
                value="network"
                className="text-timberwolf data-[state=active]:bg-timberwolf data-[state=active]:text-night"
              >
                Network
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Editor */}
                <Card className="bg-timberwolf/5 border-timberwolf/20">
                  <CardHeader>
                    <CardTitle className="text-timberwolf">
                      Profile Information
                    </CardTitle>
                    <CardDescription className="text-ash-grey">
                      Manage your personal information and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditMode ? (
                      <ProfileEditor
                        user={user}
                        profile={profile}
                        onSave={handleSave}
                        onCancel={handleCancel}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-timberwolf">Full Name</Label>
                          <p className="text-ash-grey">
                            {profile?.full_name || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-timberwolf">Title</Label>
                          <p className="text-ash-grey">
                            {profile?.title || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-timberwolf">Bio</Label>
                          <p className="text-ash-grey">
                            {profile?.bio || 'No bio added'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-timberwolf">Location</Label>
                          <p className="text-ash-grey">
                            {profile?.location || 'Not set'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sports Selector */}
                <Card className="bg-timberwolf/5 border-timberwolf/20">
                  <CardHeader>
                    <CardTitle className="text-timberwolf">
                      Sports & Roles
                    </CardTitle>
                    <CardDescription className="text-ash-grey">
                      Select your sports and define your roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SportsSelector
                      selectedSports={[]}
                      onSportsChange={() => {}}
                      availableSports={[
                        { id: '1', name: 'Football', icon: '⚽' },
                        { id: '2', name: 'Basketball', icon: '🏀' },
                        { id: '3', name: 'Tennis', icon: '🎾' },
                        { id: '4', name: 'Rugby', icon: '🏉' },
                        { id: '5', name: 'Volleyball', icon: '🏐' },
                      ]}
                    />
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-timberwolf/5 border-timberwolf/20 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-timberwolf">
                      Quick Overview
                    </CardTitle>
                    <CardDescription className="text-ash-grey">
                      Your profile activity and engagement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-timberwolf">
                          {profileStats.views}
                        </div>
                        <div className="text-sm text-ash-grey">
                          Profile Views
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-timberwolf">
                          {profileStats.connections}
                        </div>
                        <div className="text-sm text-ash-grey">Connections</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-timberwolf">
                          {profileStats.highlights}
                        </div>
                        <div className="text-sm text-ash-grey">Highlights</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-timberwolf">
                          {achievements.filter((a) => a.is_unlocked).length}
                        </div>
                        <div className="text-sm text-ash-grey">
                          Achievements
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Highlights Tab */}
            <TabsContent value="highlights" className="mt-6">
              <Card className="bg-timberwolf/5 border-timberwolf/20">
                <CardHeader>
                  <CardTitle className="text-timberwolf">
                    Video Highlights
                  </CardTitle>
                  <CardDescription className="text-ash-grey">
                    Showcase your best moments and skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HighlightsManager
                    highlights={highlights}
                    onHighlightsChange={setHighlights}
                    availableSports={[
                      { id: '1', name: 'Football', icon: '⚽' },
                      { id: '2', name: 'Basketball', icon: '🏀' },
                      { id: '3', name: 'Tennis', icon: '🎾' },
                      { id: '4', name: 'Rugby', icon: '🏉' },
                      { id: '5', name: 'Volleyball', icon: '🏐' },
                    ]}
                    userId={user?.id || ''}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="mt-6">
              <Card className="bg-timberwolf/5 border-timberwolf/20">
                <CardHeader>
                  <CardTitle className="text-timberwolf">
                    Performance Statistics
                  </CardTitle>
                  <CardDescription className="text-ash-grey">
                    Track your progress and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StatsTracker
                    stats={stats}
                    onStatsChange={setStats}
                    availableSports={[
                      { id: '1', name: 'Football', icon: '⚽' },
                      { id: '2', name: 'Basketball', icon: '🏀' },
                      { id: '3', name: 'Tennis', icon: '🎾' },
                      { id: '4', name: 'Rugby', icon: '🏉' },
                      { id: '5', name: 'Volleyball', icon: '🏐' },
                    ]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-6">
              <Card className="bg-timberwolf/5 border-timberwolf/20">
                <CardHeader>
                  <CardTitle className="text-timberwolf">
                    Achievements & Recognition
                  </CardTitle>
                  <CardDescription className="text-ash-grey">
                    Earn badges and recognition for your accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Achievements
                    achievements={achievements}
                    onAchievementsChange={setAchievements}
                    availableSports={[
                      { id: '1', name: 'Football', icon: '⚽' },
                      { id: '2', name: 'Basketball', icon: '🏀' },
                      { id: '3', name: 'Tennis', icon: '🎾' },
                      { id: '4', name: 'Rugby', icon: '🏉' },
                      { id: '5', name: 'Volleyball', icon: '🏐' },
                    ]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network" className="mt-6">
              <Card className="bg-timberwolf/5 border-timberwolf/20">
                <CardHeader>
                  <CardTitle className="text-timberwolf">
                    Professional Network
                  </CardTitle>
                  <CardDescription className="text-ash-grey">
                    Connect with other sports professionals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileNetwork
                    connections={connections}
                    onConnectionsChange={setConnections}
                    stats={networkStats}
                    onStatsChange={setNetworkStats}
                    availableSports={[
                      { id: '1', name: 'Football', icon: '⚽' },
                      { id: '2', name: 'Basketball', icon: '🏀' },
                      { id: '3', name: 'Tennis', icon: '🎾' },
                      { id: '4', name: 'Rugby', icon: '🏉' },
                      { id: '5', name: 'Volleyball', icon: '🏐' },
                    ]}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
