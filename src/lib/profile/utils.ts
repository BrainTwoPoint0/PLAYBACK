import { createClient } from '@/lib/supabase/client';

export interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  height_cm?: number | null;
  weight_kg?: number | null;
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

    // Handle physical attributes - these can be null to clear them
    if (profileData.height_cm !== undefined) {
      updateData.height_cm = profileData.height_cm;
    }

    if (profileData.weight_kg !== undefined) {
      updateData.weight_kg = profileData.weight_kg;
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
        profile_type,
        height_cm,
        weight_kg,
        preferred_foot,
        organization_name,
        organization_role,
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
            description,
            sport_category,
            common_positions
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
        profile_type,
        height_cm,
        weight_kg,
        preferred_foot,
        organization_name,
        organization_role,
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
            description,
            sport_category,
            common_positions
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
  sport_id: string; // Changed from number to string for UUID
  sport_name: string;
  role: 'player' | 'coach' | 'scout' | 'fan';
  positions: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
}

/**
 * Update user sports and positions
 */
export async function updateUserSports(
  userId: string,
  userSports: SportSelection[]
) {
  try {
    const response = await fetch('/api/user-sports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userSports }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: errorData.error || 'Failed to save sports',
      };
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update sports',
    };
  }
}
