import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

// Types
export interface Profile {
  id: string;
  full_name: string;
  username: string;
  title: string;
  bio: string;
  location: string;
  website: string;
  avatar_url: string;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface UserSport {
  id: string;
  user_id: string;
  sport_id: string;
  role: string;
  experience_level: string;
  years_experience: number;
  is_primary: boolean;
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  sport_id: string;
  position: string;
  play_type: string;
  difficulty: string;
  is_public: boolean;
  is_featured: boolean;
  tags: string[];
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerTarget {
  id: string;
  highlight_id: string;
  name: string;
  position: string;
  team?: string;
  time_marker: number;
  created_at: string;
}

export interface StatEntry {
  id: string;
  user_id: string;
  sport_id: string;
  stat_type: string;
  value: number;
  unit: string;
  date: string;
  match_id?: string;
  match_name?: string;
  notes?: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_unlocked: boolean;
  progress: number;
  max_progress: number;
  unlocked_at?: string;
  points: number;
  sport_id?: string;
  created_at: string;
}

export interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  connection_type: 'follower' | 'following' | 'mutual' | 'pending';
  created_at: string;
}

export interface NetworkStats {
  followers: number;
  following: number;
  mutual_connections: number;
  total_connections: number;
  pending_requests: number;
}

export interface ProfileStats {
  views: number;
  connections: number;
  highlights: number;
  achievements: number;
}

// Profile Service Class
export class ProfileService {
  private user: User;

  constructor(user: User) {
    this.user = user;
  }

  // Profile Management
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', this.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', this.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  }

  async createProfile(
    profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: this.user.id,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  }

  // User Sports Management
  async getUserSports(): Promise<UserSport[]> {
    const { data, error } = await supabase
      .from('user_sports')
      .select('*')
      .eq('user_id', this.user.id);

    if (error) {
      console.error('Error fetching user sports:', error);
      return [];
    }

    return data || [];
  }

  async updateUserSports(
    sports: Omit<UserSport, 'id' | 'user_id' | 'created_at'>[]
  ): Promise<UserSport[]> {
    // Delete existing sports
    await supabase.from('user_sports').delete().eq('user_id', this.user.id);

    if (sports.length === 0) return [];

    // Insert new sports
    const sportsToInsert = sports.map((sport) => ({
      ...sport,
      user_id: this.user.id,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('user_sports')
      .insert(sportsToInsert)
      .select();

    if (error) {
      console.error('Error updating user sports:', error);
      return [];
    }

    return data || [];
  }

  // Highlights Management
  async getHighlights(): Promise<Highlight[]> {
    const { data, error } = await supabase
      .from('highlights')
      .select(
        `
        *,
        player_targets (*)
      `
      )
      .eq('user_id', this.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching highlights:', error);
      return [];
    }

    return data || [];
  }

  async createHighlight(
    highlightData: Omit<
      Highlight,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'views' | 'likes'
    >,
    playerTargets?: Omit<PlayerTarget, 'id' | 'highlight_id' | 'created_at'>[]
  ): Promise<Highlight | null> {
    const { data: highlight, error: highlightError } = await supabase
      .from('highlights')
      .insert({
        ...highlightData,
        user_id: this.user.id,
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (highlightError) {
      console.error('Error creating highlight:', highlightError);
      return null;
    }

    // Add player targets if provided
    if (playerTargets && playerTargets.length > 0) {
      const targetsToInsert = playerTargets.map((target) => ({
        ...target,
        highlight_id: highlight.id,
        created_at: new Date().toISOString(),
      }));

      const { error: targetsError } = await supabase
        .from('player_targets')
        .insert(targetsToInsert);

      if (targetsError) {
        console.error('Error creating player targets:', targetsError);
      }
    }

    return highlight;
  }

  async updateHighlight(
    id: string,
    updates: Partial<Highlight>
  ): Promise<Highlight | null> {
    const { data, error } = await supabase
      .from('highlights')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', this.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating highlight:', error);
      return null;
    }

    return data;
  }

  async deleteHighlight(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)
      .eq('user_id', this.user.id);

    if (error) {
      console.error('Error deleting highlight:', error);
      return false;
    }

    return true;
  }

  // Statistics Management
  async getStats(): Promise<StatEntry[]> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', this.user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching stats:', error);
      return [];
    }

    return data || [];
  }

  async createStat(
    statData: Omit<StatEntry, 'id' | 'user_id' | 'created_at'>
  ): Promise<StatEntry | null> {
    const { data, error } = await supabase
      .from('user_stats')
      .insert({
        ...statData,
        user_id: this.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stat:', error);
      return null;
    }

    return data;
  }

  async updateStat(
    id: string,
    updates: Partial<StatEntry>
  ): Promise<StatEntry | null> {
    const { data, error } = await supabase
      .from('user_stats')
      .update(updates)
      .eq('id', id)
      .eq('user_id', this.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating stat:', error);
      return null;
    }

    return data;
  }

  async deleteStat(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_stats')
      .delete()
      .eq('id', id)
      .eq('user_id', this.user.id);

    if (error) {
      console.error('Error deleting stat:', error);
      return false;
    }

    return true;
  }

  // Achievements Management
  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', this.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return data || [];
  }

  async unlockAchievement(
    achievementType: string,
    progress: number
  ): Promise<Achievement | null> {
    // First, check if achievement exists
    const { data: existingAchievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', this.user.id)
      .eq('achievement_type', achievementType)
      .single();

    if (existingAchievement) {
      // Update existing achievement
      const { data, error } = await supabase
        .from('user_achievements')
        .update({
          progress,
          is_unlocked: progress >= existingAchievement.max_progress,
          unlocked_at:
            progress >= existingAchievement.max_progress
              ? new Date().toISOString()
              : null,
        })
        .eq('id', existingAchievement.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating achievement:', error);
        return null;
      }

      return data;
    }

    // Create new achievement (this would typically be done by the system)
    return null;
  }

  // Network Management
  async getConnections(): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .or(`user_id.eq.${this.user.id},connected_user_id.eq.${this.user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      return [];
    }

    return data || [];
  }

  async followUser(targetUserId: string): Promise<Connection | null> {
    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id: this.user.id,
        connected_user_id: targetUserId,
        connection_type: 'following',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error following user:', error);
      return null;
    }

    return data;
  }

  async unfollowUser(targetUserId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .eq('user_id', this.user.id)
      .eq('connected_user_id', targetUserId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }

    return true;
  }

  async acceptConnectionRequest(
    connectionId: string
  ): Promise<Connection | null> {
    const { data, error } = await supabase
      .from('user_connections')
      .update({
        connection_type: 'mutual',
      })
      .eq('id', connectionId)
      .eq('connected_user_id', this.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error accepting connection:', error);
      return null;
    }

    return data;
  }

  async rejectConnectionRequest(connectionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .eq('id', connectionId)
      .eq('connected_user_id', this.user.id);

    if (error) {
      console.error('Error rejecting connection:', error);
      return false;
    }

    return true;
  }

  // Statistics and Analytics
  async getProfileStats(): Promise<ProfileStats> {
    const [
      { count: highlights },
      { count: achievements },
      { count: connections },
    ] = await Promise.all([
      supabase
        .from('highlights')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.user.id),
      supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.user.id)
        .eq('is_unlocked', true),
      supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${this.user.id},connected_user_id.eq.${this.user.id}`),
    ]);

    return {
      views: 0, // This would be calculated from profile views
      connections: connections || 0,
      highlights: highlights || 0,
      achievements: achievements || 0,
    };
  }

  async getNetworkStats(): Promise<NetworkStats> {
    const { data: connections } = await supabase
      .from('user_connections')
      .select('*')
      .or(`user_id.eq.${this.user.id},connected_user_id.eq.${this.user.id}`);

    if (!connections) {
      return {
        followers: 0,
        following: 0,
        mutual_connections: 0,
        total_connections: 0,
        pending_requests: 0,
      };
    }

    const followers = connections.filter(
      (c) =>
        c.connected_user_id === this.user.id &&
        c.connection_type !== 'following'
    ).length;
    const following = connections.filter(
      (c) => c.user_id === this.user.id && c.connection_type !== 'follower'
    ).length;
    const mutual_connections = connections.filter(
      (c) =>
        (c.user_id === this.user.id || c.connected_user_id === this.user.id) &&
        c.connection_type === 'mutual'
    ).length;
    const pending_requests = connections.filter(
      (c) =>
        c.connected_user_id === this.user.id && c.connection_type === 'pending'
    ).length;

    return {
      followers,
      following,
      mutual_connections,
      total_connections: connections.length,
      pending_requests,
    };
  }

  // Search and Discovery
  async searchUsers(query: string, sportId?: string): Promise<Profile[]> {
    let queryBuilder = supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .neq('id', this.user.id)
      .eq('is_public', true);

    if (sportId) {
      queryBuilder = queryBuilder.eq('user_sports.sport_id', sportId);
    }

    const { data, error } = await queryBuilder.limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  }

  async getPublicProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_public', true)
      .single();

    if (error) {
      console.error('Error fetching public profile:', error);
      return null;
    }

    return data;
  }
}

// Factory function to create profile service
export const createProfileService = (user: User) => new ProfileService(user);
