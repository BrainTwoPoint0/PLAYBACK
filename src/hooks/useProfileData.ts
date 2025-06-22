import { useState, useEffect } from 'react';
import { useAuth } from '../app/components/auth/AuthProvider';
import {
  ProfileService,
  Profile,
  Highlight,
  StatEntry,
  Achievement,
  Connection,
  NetworkStats,
  ProfileStats,
  UserSport,
} from '../lib/profileService';
import { supabase } from '../lib/supabase';

// Hook for profile data with real-time updates
export const useProfileData = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const profileService = new ProfileService(user);

    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await profileService.getProfile();
        setProfile(profileData);
        setError(null);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    // Set up real-time subscription for profile updates
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (
            payload.eventType === 'UPDATE' ||
            payload.eventType === 'INSERT'
          ) {
            setProfile(payload.new as Profile);
          } else if (payload.eventType === 'DELETE') {
            setProfile(null);
          }
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
    };
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return null;

    const profileService = new ProfileService(user);
    try {
      const updatedProfile = await profileService.updateProfile(updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
      return null;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
};

// Hook for highlights with real-time updates
export const useHighlights = () => {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setHighlights([]);
      setLoading(false);
      return;
    }

    const profileService = new ProfileService(user);

    const loadHighlights = async () => {
      try {
        setLoading(true);
        const highlightsData = await profileService.getHighlights();
        setHighlights(highlightsData);
        setError(null);
      } catch (err) {
        setError('Failed to load highlights');
        console.error('Error loading highlights:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();

    // Set up real-time subscription for highlights
    const highlightsSubscription = supabase
      .channel('highlights-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'highlights',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHighlights((prev) => [payload.new as Highlight, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setHighlights((prev) =>
              prev.map((h) =>
                h.id === payload.new.id ? (payload.new as Highlight) : h
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setHighlights((prev) =>
              prev.filter((h) => h.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      highlightsSubscription.unsubscribe();
    };
  }, [user]);

  const createHighlight = async (
    highlightData: Omit<
      Highlight,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'views' | 'likes'
    >
  ) => {
    if (!user) return null;

    const profileService = new ProfileService(user);
    try {
      const newHighlight = await profileService.createHighlight(highlightData);
      return newHighlight;
    } catch (err) {
      setError('Failed to create highlight');
      console.error('Error creating highlight:', err);
      return null;
    }
  };

  const updateHighlight = async (id: string, updates: Partial<Highlight>) => {
    if (!user) return null;

    const profileService = new ProfileService(user);
    try {
      const updatedHighlight = await profileService.updateHighlight(
        id,
        updates
      );
      return updatedHighlight;
    } catch (err) {
      setError('Failed to update highlight');
      console.error('Error updating highlight:', err);
      return null;
    }
  };

  const deleteHighlight = async (id: string) => {
    if (!user) return false;

    const profileService = new ProfileService(user);
    try {
      const success = await profileService.deleteHighlight(id);
      return success;
    } catch (err) {
      setError('Failed to delete highlight');
      console.error('Error deleting highlight:', err);
      return false;
    }
  };

  return {
    highlights,
    loading,
    error,
    createHighlight,
    updateHighlight,
    deleteHighlight,
  };
};

// Hook for statistics with real-time updates
export const useStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStats([]);
      setLoading(false);
      return;
    }

    const profileService = new ProfileService(user);

    const loadStats = async () => {
      try {
        setLoading(true);
        const statsData = await profileService.getStats();
        setStats(statsData);
        setError(null);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Set up real-time subscription for stats
    const statsSubscription = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setStats((prev) => [payload.new as StatEntry, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setStats((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? (payload.new as StatEntry) : s
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setStats((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      statsSubscription.unsubscribe();
    };
  }, [user]);

  const createStat = async (
    statData: Omit<StatEntry, 'id' | 'user_id' | 'created_at'>
  ) => {
    if (!user) return null;

    const profileService = new ProfileService(user);
    try {
      const newStat = await profileService.createStat(statData);
      return newStat;
    } catch (err) {
      setError('Failed to create statistic');
      console.error('Error creating stat:', err);
      return null;
    }
  };

  const updateStat = async (id: string, updates: Partial<StatEntry>) => {
    if (!user) return null;

    const profileService = new ProfileService(user);
    try {
      const updatedStat = await profileService.updateStat(id, updates);
      return updatedStat;
    } catch (err) {
      setError('Failed to update statistic');
      console.error('Error updating stat:', err);
      return null;
    }
  };

  const deleteStat = async (id: string) => {
    if (!user) return false;

    const profileService = new ProfileService(user);
    try {
      const success = await profileService.deleteStat(id);
      return success;
    } catch (err) {
      setError('Failed to delete statistic');
      console.error('Error deleting stat:', err);
      return false;
    }
  };

  return {
    stats,
    loading,
    error,
    createStat,
    updateStat,
    deleteStat,
  };
};

// Hook for achievements with real-time updates
export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAchievements([]);
      setLoading(false);
      return;
    }

    const profileService = new ProfileService(user);

    const loadAchievements = async () => {
      try {
        setLoading(true);
        const achievementsData = await profileService.getAchievements();
        setAchievements(achievementsData);
        setError(null);
      } catch (err) {
        setError('Failed to load achievements');
        console.error('Error loading achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();

    // Set up real-time subscription for achievements
    const achievementsSubscription = supabase
      .channel('achievements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAchievements((prev) => [payload.new as Achievement, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAchievements((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? (payload.new as Achievement) : a
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setAchievements((prev) =>
              prev.filter((a) => a.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      achievementsSubscription.unsubscribe();
    };
  }, [user]);

  const unlockAchievement = async (
    achievementType: string,
    progress: number
  ) => {
    if (!user) return null;

    const profileService = new ProfileService(user);
    try {
      const achievement = await profileService.unlockAchievement(
        achievementType,
        progress
      );
      return achievement;
    } catch (err) {
      setError('Failed to unlock achievement');
      console.error('Error unlocking achievement:', err);
      return null;
    }
  };

  return {
    achievements,
    loading,
    error,
    unlockAchievement,
  };
};

// Hook for network connections with real-time updates
export const useNetwork = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    followers: 0,
    following: 0,
    mutual_connections: 0,
    total_connections: 0,
    pending_requests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setConnections([]);
      setNetworkStats({
        followers: 0,
        following: 0,
        mutual_connections: 0,
        total_connections: 0,
        pending_requests: 0,
      });
      setLoading(false);
      return;
    }

    const profileService = new ProfileService(user);

    const loadNetwork = async () => {
      try {
        setLoading(true);
        const [connectionsData, statsData] = await Promise.all([
          profileService.getConnections(),
          profileService.getNetworkStats(),
        ]);
        setConnections(connectionsData);
        setNetworkStats(statsData);
        setError(null);
      } catch (err) {
        setError('Failed to load network data');
        console.error('Error loading network:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNetwork();

    // Set up real-time subscription for connections
    const networkSubscription = supabase
      .channel('network-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections',
          filter: `user_id=eq.${user.id},connected_user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Reload network data when connections change
          const profileService = new ProfileService(user);
          const [connectionsData, statsData] = await Promise.all([
            profileService.getConnections(),
            profileService.getNetworkStats(),
          ]);
          setConnections(connectionsData);
          setNetworkStats(statsData);
        }
      )
      .subscribe();

    return () => {
      networkSubscription.unsubscribe();
    };
  }, [user]);

  const followUser = async (targetUserId: string) => {
    if (!user) return null;

    const profileService = new ProfileService(user);
    try {
      const connection = await profileService.followUser(targetUserId);
      return connection;
    } catch (err) {
      setError('Failed to follow user');
      console.error('Error following user:', err);
      return null;
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return false;

    const profileService = new ProfileService(user);
    try {
      const success = await profileService.unfollowUser(targetUserId);
      return success;
    } catch (err) {
      setError('Failed to unfollow user');
      console.error('Error unfollowing user:', err);
      return false;
    }
  };

  const acceptConnection = async (connectionId: string) => {
    if (!user) return null;

    const profileService = new ProfileService(user);
    try {
      const connection =
        await profileService.acceptConnectionRequest(connectionId);
      return connection;
    } catch (err) {
      setError('Failed to accept connection');
      console.error('Error accepting connection:', err);
      return null;
    }
  };

  const rejectConnection = async (connectionId: string) => {
    if (!user) return false;

    const profileService = new ProfileService(user);
    try {
      const success =
        await profileService.rejectConnectionRequest(connectionId);
      return success;
    } catch (err) {
      setError('Failed to reject connection');
      console.error('Error rejecting connection:', err);
      return false;
    }
  };

  return {
    connections,
    networkStats,
    loading,
    error,
    followUser,
    unfollowUser,
    acceptConnection,
    rejectConnection,
  };
};

// Hook for user sports
export const useUserSports = () => {
  const { user } = useAuth();
  const [userSports, setUserSports] = useState<UserSport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUserSports([]);
      setLoading(false);
      return;
    }

    const profileService = new ProfileService(user);

    const loadUserSports = async () => {
      try {
        setLoading(true);
        const sportsData = await profileService.getUserSports();
        setUserSports(sportsData);
        setError(null);
      } catch (err) {
        setError('Failed to load user sports');
        console.error('Error loading user sports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserSports();

    // Set up real-time subscription for user sports
    const sportsSubscription = supabase
      .channel('user-sports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sports',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUserSports((prev) => [...prev, payload.new as UserSport]);
          } else if (payload.eventType === 'UPDATE') {
            setUserSports((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? (payload.new as UserSport) : s
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setUserSports((prev) =>
              prev.filter((s) => s.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      sportsSubscription.unsubscribe();
    };
  }, [user]);

  const updateUserSports = async (
    sports: Omit<UserSport, 'id' | 'user_id' | 'created_at'>[]
  ) => {
    if (!user) return [];

    const profileService = new ProfileService(user);
    try {
      const updatedSports = await profileService.updateUserSports(sports);
      return updatedSports;
    } catch (err) {
      setError('Failed to update user sports');
      console.error('Error updating user sports:', err);
      return [];
    }
  };

  return {
    userSports,
    loading,
    error,
    updateUserSports,
  };
};

// Hook for profile statistics
export const useProfileStats = () => {
  const { user } = useAuth();
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    views: 0,
    connections: 0,
    highlights: 0,
    achievements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfileStats({
        views: 0,
        connections: 0,
        highlights: 0,
        achievements: 0,
      });
      setLoading(false);
      return;
    }

    const profileService = new ProfileService(user);

    const loadProfileStats = async () => {
      try {
        setLoading(true);
        const statsData = await profileService.getProfileStats();
        setProfileStats(statsData);
        setError(null);
      } catch (err) {
        setError('Failed to load profile statistics');
        console.error('Error loading profile stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileStats();
  }, [user]);

  return {
    profileStats,
    loading,
    error,
  };
};
