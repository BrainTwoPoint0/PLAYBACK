import { createClient } from '@/lib/supabase/client';

export interface OnboardingData {
  role: string;
  selectedSports: string[];
  sportPositions: Record<
    string,
    {
      positions: string[];
      experience: string;
    }
  >;
  profileInfo: {
    bio: string;
    location: string;
    socialLinks: {
      instagram: string;
      twitter: string;
      linkedin: string;
    };
  };
}

export interface ProfileUpdateData {
  bio?: string;
  location?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface UserSportData {
  user_id: string;
  sport_id: string;
  role: 'player' | 'coach' | 'scout' | 'fan';
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  positions: string[];
}

/**
 * Update user profile with onboarding data
 */
export async function updateUserProfile(
  userId: string,
  profileData: ProfileUpdateData
) {
  const supabase = createClient();

  // Prepare social links - only include non-empty values
  const socialLinks: Record<string, string> = {};
  if (profileData.social_links?.instagram?.trim()) {
    socialLinks.instagram = profileData.social_links.instagram.trim();
  }
  if (profileData.social_links?.twitter?.trim()) {
    socialLinks.twitter = profileData.social_links.twitter.trim();
  }
  if (profileData.social_links?.linkedin?.trim()) {
    socialLinks.linkedin = profileData.social_links.linkedin.trim();
  }

  const updateData: Record<string, any> = {};

  if (profileData.bio?.trim()) {
    updateData.bio = profileData.bio.trim();
  }

  if (profileData.location?.trim()) {
    updateData.location = profileData.location.trim();
  }

  if (Object.keys(socialLinks).length > 0) {
    updateData.social_links = socialLinks;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get profile ID from user ID
 */
export async function getProfileId(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  return { profileId: data?.id, error };
}

/**
 * Create user-sports relationships
 */
export async function createUserSports(userSportsData: UserSportData[]) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_sports')
    .insert(userSportsData)
    .select();

  return { data, error };
}

/**
 * Remove existing user-sports relationships for a user
 */
export async function clearUserSports(profileId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('user_sports')
    .delete()
    .eq('user_id', profileId);

  return { error };
}

/**
 * Map experience level from UI to database enum
 */
function mapExperienceLevel(
  experience: string
): 'beginner' | 'intermediate' | 'advanced' | 'professional' {
  const mapping: Record<
    string,
    'beginner' | 'intermediate' | 'advanced' | 'professional'
  > = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    professional: 'professional',
  };

  return mapping[experience.toLowerCase()] || 'beginner';
}

/**
 * Map role from UI to database enum
 */
function mapRole(role: string): 'player' | 'coach' | 'scout' | 'fan' {
  const mapping: Record<string, 'player' | 'coach' | 'scout' | 'fan'> = {
    player: 'player',
    coach: 'coach',
    scout: 'scout',
    fan: 'fan',
  };

  return mapping[role.toLowerCase()] || 'player';
}

/**
 * Complete onboarding save - saves all onboarding data
 */
export async function saveOnboardingData(
  userId: string,
  onboardingData: OnboardingData
) {
  const supabase = createClient();

  try {
    // Start a transaction-like approach by collecting all operations
    const operations = [];

    // 1. Get profile ID
    const { profileId, error: profileIdError } = await getProfileId(userId);
    if (profileIdError || !profileId) {
      throw new Error(
        `Failed to get profile ID: ${profileIdError?.message || 'Profile not found'}`
      );
    }

    // 2. Update profile with personal information
    const profileUpdateData: ProfileUpdateData = {
      bio: onboardingData.profileInfo.bio,
      location: onboardingData.profileInfo.location,
      social_links: onboardingData.profileInfo.socialLinks,
    };

    const { error: profileUpdateError } = await updateUserProfile(
      userId,
      profileUpdateData
    );
    if (profileUpdateError) {
      throw new Error(
        `Failed to update profile: ${profileUpdateError.message}`
      );
    }

    // 3. Clear existing user-sports relationships
    const { error: clearError } = await clearUserSports(profileId);
    if (clearError) {
      throw new Error(`Failed to clear existing sports: ${clearError.message}`);
    }

    // 4. Create new user-sports relationships
    if (onboardingData.selectedSports.length > 0) {
      const userSportsData: UserSportData[] = onboardingData.selectedSports.map(
        (sportId, index) => {
          const sportPositions = onboardingData.sportPositions[sportId];

          return {
            user_id: profileId,
            sport_id: sportId,
            role: mapRole(onboardingData.role),
            experience_level: mapExperienceLevel(sportPositions.experience),
            positions: sportPositions.positions,
          };
        }
      );

      const { error: sportsError } = await createUserSports(userSportsData);
      if (sportsError) {
        throw new Error(`Failed to create user sports: ${sportsError.message}`);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if user has completed onboarding
 */
export async function checkOnboardingStatus(userId: string) {
  const supabase = createClient();

  try {
    // Get profile with user sports
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        bio,
        location,
        social_links,
        user_sports (
          id,
          sport_id,
          role,
          experience_level,
          positions
        )
      `
      )
      .eq('user_id', userId)
      .single();

    if (profileError) {
      return { isComplete: false, error: profileError };
    }

    // Check if onboarding is complete
    const hasUserSports = profile.user_sports && profile.user_sports.length > 0;
    const hasRole = profile.user_sports?.some((us: any) => us.role);

    const isComplete = hasUserSports && hasRole;

    return {
      isComplete,
      profile,
      error: null,
      completionData: {
        hasUserSports,
        hasRole,
        sportsCount: profile.user_sports?.length || 0,
      },
    };
  } catch (error) {
    return {
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
