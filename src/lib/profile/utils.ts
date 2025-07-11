import { createClient } from '@/lib/supabase/client';

export interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

/**
 * Update user profile basic information
 */
export async function updateProfileBasicInfo(
  userId: string,
  profileData: ProfileUpdateData
) {
  const supabase = createClient();

  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that have values
    if (profileData.username?.trim()) {
      updateData.username = profileData.username.trim();
    }

    if (profileData.full_name?.trim()) {
      updateData.full_name = profileData.full_name.trim();
    }

    if (profileData.bio?.trim()) {
      updateData.bio = profileData.bio.trim();
    }

    if (profileData.location?.trim()) {
      updateData.location = profileData.location.trim();
    }

    if (profileData.social_links) {
      // Prepare social links - only include non-empty values
      const socialLinks: Record<string, string> = {};
      if (profileData.social_links.instagram?.trim()) {
        socialLinks.instagram = profileData.social_links.instagram.trim();
      }
      if (profileData.social_links.twitter?.trim()) {
        socialLinks.twitter = profileData.social_links.twitter.trim();
      }
      if (profileData.social_links.linkedin?.trim()) {
        socialLinks.linkedin = profileData.social_links.linkedin.trim();
      }

      if (Object.keys(socialLinks).length > 0) {
        updateData.social_links = socialLinks;
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(
  username: string,
  currentUserId?: string
) {
  const supabase = createClient();

  try {
    // Basic validation
    if (!username || username.length < 3 || username.length > 30) {
      return { available: false, error: 'Username must be 3-30 characters' };
    }

    // Check pattern (letters, numbers, hyphens, underscores only)
    const usernamePattern = /^[a-zA-Z0-9_-]+$/;
    if (!usernamePattern.test(username)) {
      return {
        available: false,
        error:
          'Username can only contain letters, numbers, hyphens, and underscores',
      };
    }

    // Check if username exists (excluding current user)
    let query = supabase
      .from('profiles')
      .select('id, user_id')
      .eq('username', username);

    // If checking for current user, exclude their profile
    if (currentUserId) {
      query = query.neq('user_id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      return {
        available: false,
        error: 'Failed to check username availability',
      };
    }

    return {
      available: !data || data.length === 0,
      error: null,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user profile by user ID with full details
 */
export async function getUserProfileWithDetails(userId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        username,
        full_name,
        bio,
        location,
        avatar_url,
        social_links,
        is_public,
        is_verified,
        created_at,
        updated_at,
        user_sports (
          id,
          sport_id,
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
      .eq('user_id', userId)
      .single();

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    };
  }
}

/**
 * Get public profile by username
 */
export async function getPublicProfileByUsername(username: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        user_id,
        username,
        full_name,
        bio,
        location,
        avatar_url,
        social_links,
        is_public,
        is_verified,
        created_at,
        updated_at,
        user_sports (
          id,
          sport_id,
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
      .eq('username', username)
      .single();

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Profile not found',
    };
  }
}

export interface SportSelection {
  sport_id: number;
  sport_name: string;
  role: 'player' | 'coach' | 'scout' | 'fan';
  position: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
}

/**
 * Update user sports and positions
 */
export async function updateUserSports(
  userId: string,
  userSports: SportSelection[]
) {
  const supabase = createClient();

  try {
    // First, get the user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return {
        data: null,
        error: 'Profile not found',
      };
    }

    const profileId = profile.id;

    // Delete existing user_sports entries
    const { error: deleteError } = await supabase
      .from('user_sports')
      .delete()
      .eq('user_id', profileId);

    if (deleteError) {
      return {
        data: null,
        error: 'Failed to clear existing sports',
      };
    }

    // Insert new user_sports entries if any
    if (userSports.length > 0) {
      const userSportsData = userSports.map((sport) => ({
        user_id: profileId,
        sport_id: sport.sport_id.toString(),
        role: sport.role,
        experience_level: sport.experience_level,
        positions: sport.position ? [sport.position] : [],
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('user_sports')
        .insert(userSportsData);

      if (insertError) {
        return {
          data: null,
          error: 'Failed to save sports',
        };
      }
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update sports',
    };
  }
}
