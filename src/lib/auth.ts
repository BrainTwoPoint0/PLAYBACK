import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export type AuthUser = User & {
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  date_of_birth: string | null;
  phone: string | null;
  website: string | null;
  social_links: any | null;
  kit_number: number | null;
  graduation_year: number | null;
  gpa: number | null;
  strong_foot: 'left' | 'right' | 'both' | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Get current user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  metadata?: any
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (
  userId: string
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }

  return data;
};

// Create or update user profile
export const upsertProfile = async (profile: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, {
      onConflict: 'id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Check if username is available
export const checkUsernameAvailability = async (
  username: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (error && error.code === 'PGRST116') {
    // No rows returned, username is available
    return true;
  }

  if (error) {
    throw error;
  }

  // Username exists
  return false;
};

// Get profile by username
export const getProfileByUsername = async (
  username: string
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .eq('is_public', true)
    .single();

  if (error) {
    console.error('Error getting profile by username:', error);
    return null;
  }

  return data;
};

// Get profile by share code
export const getProfileByShareCode = async (
  shareCode: string
): Promise<Profile | null> => {
  const { data: shareData, error: shareError } = await supabase
    .from('profile_shares')
    .select('user_id, view_count')
    .eq('share_code', shareCode)
    .eq('is_active', true)
    .single();

  if (shareError) {
    console.error('Error getting share data:', shareError);
    return null;
  }

  // Update view count
  await supabase
    .from('profile_shares')
    .update({
      view_count: (shareData.view_count || 0) + 1,
      last_viewed: new Date().toISOString(),
    })
    .eq('share_code', shareCode);

  // Get profile
  return await getUserProfile(shareData.user_id);
};

// Generate share code
export const generateShareCode = async (userId: string): Promise<string> => {
  const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('profile_shares')
    .insert({
      user_id: userId,
      share_code: shareCode,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return shareCode;
};

// Get user's share codes
export const getUserShareCodes = async (userId: string) => {
  const { data, error } = await supabase
    .from('profile_shares')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};
