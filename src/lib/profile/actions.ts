'use server';

import { createClient } from '@/lib/supabase/server';
import {
  validateCreatePlayerVariant,
  validateUpdateBaseProfile,
  validateUpdateFootballProfile,
  validateCreateHighlight,
  type CreatePlayerVariantInput,
  type UpdateBaseProfileInput,
  type UpdateFootballProfileInput,
  type CreateHighlightInput,
} from './validation';

interface ActionResult {
  success: boolean;
  data?: { variantId: string };
  error?: string;
  errors?: string[];
}

export async function createPlayerVariant(
  input: CreatePlayerVariantInput
): Promise<ActionResult> {
  // Validate input
  const validation = validateCreatePlayerVariant(input);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors[0],
      errors: validation.errors,
    };
  }

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'You must be logged in' };
  }

  // Get user's profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profileData) {
    return { success: false, error: 'Profile not found' };
  }

  const profile = profileData as unknown as { id: string };

  // Check if user already has a player variant
  const { data: existingVariant } = await supabase
    .from('profile_variants')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('variant_type', 'player')
    .single();

  if (existingVariant) {
    return { success: false, error: 'You already have a player profile' };
  }

  // Get football sport ID
  const { data: sportData, error: sportError } = await supabase
    .from('sports')
    .select('id')
    .eq('name', 'football')
    .single();

  if (sportError || !sportData) {
    return { success: false, error: 'Football sport not found in database' };
  }

  const sport = sportData as unknown as { id: string };

  // Create profile variant
  const { data: variantData, error: variantError } = await supabase
    .from('profile_variants')
    .insert({
      profile_id: profile.id,
      variant_type: 'player' as const,
      sport_id: sport.id,
      is_active: true,
      is_primary: true,
    } as any)
    .select('id')
    .single();

  if (variantError || !variantData) {
    return {
      success: false,
      error: variantError?.message || 'Failed to create player variant',
    };
  }

  const variant = variantData as unknown as { id: string };

  // Create football player profile
  const { error: footballError } = await supabase
    .from('football_player_profiles')
    .insert({
      profile_variant_id: variant.id,
      experience_level: input.experience_level,
      preferred_foot: input.preferred_foot,
      primary_position: input.primary_position,
      secondary_positions: input.secondary_positions || [],
      preferred_jersey_number: input.preferred_jersey_number ?? null,
    } as any);

  if (footballError) {
    // Rollback: delete the variant if football profile creation fails
    await supabase.from('profile_variants').delete().eq('id', variant.id);
    return {
      success: false,
      error: footballError.message || 'Failed to create football profile',
    };
  }

  return { success: true, data: { variantId: variant.id } };
}

// Helper: get authenticated user's profile ID
async function getAuthenticatedProfileId(): Promise<
  { profileId: string; userId: string } | { error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'You must be logged in' };
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profileData) {
    return { error: 'Profile not found' };
  }

  const profile = profileData as unknown as { id: string };
  return { profileId: profile.id, userId: user.id };
}

export async function updateBaseProfile(
  input: UpdateBaseProfileInput
): Promise<ActionResult> {
  const validation = validateUpdateBaseProfile(input);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors[0],
      errors: validation.errors,
    };
  }

  const auth = await getAuthenticatedProfileId();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (input.bio !== undefined) updateData.bio = input.bio;
  if (input.social_links !== undefined)
    updateData.social_links = input.social_links;
  if (input.height_cm !== undefined) updateData.height_cm = input.height_cm;
  if (input.weight_kg !== undefined) updateData.weight_kg = input.weight_kg;
  if (input.date_of_birth !== undefined)
    updateData.date_of_birth = input.date_of_birth;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.nationality !== undefined)
    updateData.nationality = input.nationality;

  const { error } = await (supabase.from('profiles') as any)
    .update(updateData)
    .eq('id', auth.profileId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateFootballProfile(
  input: UpdateFootballProfileInput
): Promise<ActionResult> {
  const validation = validateUpdateFootballProfile(input);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors[0],
      errors: validation.errors,
    };
  }

  const auth = await getAuthenticatedProfileId();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  // Get the user's player variant
  const { data: variantData } = await supabase
    .from('profile_variants')
    .select('id')
    .eq('profile_id', auth.profileId)
    .eq('variant_type', 'player')
    .single();

  if (!variantData) {
    return { success: false, error: 'No player profile found' };
  }

  const variant = variantData as unknown as { id: string };

  const updateData: Record<string, unknown> = {};
  if (input.experience_level !== undefined)
    updateData.experience_level = input.experience_level;
  if (input.preferred_foot !== undefined)
    updateData.preferred_foot = input.preferred_foot;
  if (input.primary_position !== undefined)
    updateData.primary_position = input.primary_position;
  if (input.secondary_positions !== undefined)
    updateData.secondary_positions = input.secondary_positions;
  if (input.preferred_jersey_number !== undefined)
    updateData.preferred_jersey_number = input.preferred_jersey_number;

  const { error } = await (supabase.from('football_player_profiles') as any)
    .update(updateData)
    .eq('profile_variant_id', variant.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// --- Highlight actions ---

export async function createHighlight(
  input: CreateHighlightInput & {
    duration?: number | null;
    metadata?: Record<string, unknown>;
  }
): Promise<ActionResult> {
  const validation = validateCreateHighlight(input);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors[0],
      errors: validation.errors,
    };
  }

  const auth = await getAuthenticatedProfileId();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  // Get player variant
  const { data: variantData } = await supabase
    .from('profile_variants')
    .select('id, sport_id')
    .eq('profile_id', auth.profileId)
    .eq('variant_type', 'player')
    .single();

  if (!variantData) {
    return { success: false, error: 'No player profile found' };
  }

  const variant = variantData as unknown as { id: string; sport_id: string };

  const { error: insertError } = await (
    supabase.from('highlights') as any
  ).insert({
    profile_id: auth.profileId,
    profile_variant_id: variant.id,
    sport_id: variant.sport_id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    video_url: input.video_url,
    thumbnail_url: input.thumbnail_url || null,
    duration: input.duration || null,
    is_public: true,
    metadata: input.metadata || {},
  });

  if (insertError) {
    return { success: false, error: 'Failed to create highlight' };
  }

  return { success: true };
}

export async function deleteHighlight(
  highlightId: string
): Promise<ActionResult> {
  if (!highlightId) {
    return { success: false, error: 'Highlight ID is required' };
  }

  const auth = await getAuthenticatedProfileId();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  // Verify ownership by checking profile_id matches
  const { data: highlight } = await supabase
    .from('highlights')
    .select('id, profile_id')
    .eq('id', highlightId)
    .single();

  if (!highlight) {
    return { success: false, error: 'Highlight not found' };
  }

  const typedHighlight = highlight as unknown as {
    id: string;
    profile_id: string;
  };

  if (typedHighlight.profile_id !== auth.profileId) {
    return { success: false, error: 'Not authorized to delete this highlight' };
  }

  // Delete from database (RLS also protects this)
  const { error: deleteError } = await supabase
    .from('highlights')
    .delete()
    .eq('id', highlightId);

  if (deleteError) {
    return { success: false, error: 'Failed to delete highlight' };
  }

  return { success: true };
}

export async function importRecordingAsHighlight(
  recordingId: string
): Promise<ActionResult> {
  if (!recordingId) {
    return { success: false, error: 'Recording ID is required' };
  }

  const auth = await getAuthenticatedProfileId();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  // Verify user has access to this recording
  const { data: access } = await supabase
    .from('playhub_access_rights')
    .select('id')
    .eq('user_id', auth.userId)
    .eq('match_recording_id', recordingId)
    .eq('is_active', true)
    .single();

  if (!access) {
    return { success: false, error: 'No access to this recording' };
  }

  // Fetch recording details
  const { data: recording } = await supabase
    .from('playhub_match_recordings')
    .select('id, title, thumbnail_url, duration_seconds, home_team, away_team')
    .eq('id', recordingId)
    .single();

  if (!recording) {
    return { success: false, error: 'Recording not found' };
  }

  const typedRecording = recording as unknown as {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    home_team: string;
    away_team: string;
  };

  // Get player variant
  const { data: variantData } = await supabase
    .from('profile_variants')
    .select('id, sport_id')
    .eq('profile_id', auth.profileId)
    .eq('variant_type', 'player')
    .single();

  if (!variantData) {
    return { success: false, error: 'No player profile found' };
  }

  const variant = variantData as unknown as { id: string; sport_id: string };

  // Check if already imported
  const { data: existing } = await supabase
    .from('highlights')
    .select('id')
    .eq('profile_variant_id', variant.id)
    .contains('metadata', { source: 'playhub', recording_id: recordingId });

  if (existing && existing.length > 0) {
    return {
      success: false,
      error: 'This recording is already in your highlights',
    };
  }

  // Create highlight from recording
  const title =
    typedRecording.title ||
    `${typedRecording.home_team} vs ${typedRecording.away_team}`;

  const { error: insertError } = await (
    supabase.from('highlights') as any
  ).insert({
    profile_id: auth.profileId,
    profile_variant_id: variant.id,
    sport_id: variant.sport_id,
    title,
    video_url: `playhub://recording/${recordingId}`,
    thumbnail_url: typedRecording.thumbnail_url,
    duration: typedRecording.duration_seconds,
    is_public: true,
    metadata: {
      source: 'playhub',
      recording_id: recordingId,
    },
  });

  if (insertError) {
    return { success: false, error: 'Failed to import recording' };
  }

  return { success: true };
}
