import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

export type Highlight = Database['public']['Tables']['highlights']['Row'];
export type CreateHighlightData =
  Database['public']['Tables']['highlights']['Insert'];

export interface HighlightFormData {
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number; // Duration in seconds (will be converted to integer)
  sport_id?: string;
  tags?: string[];
  is_public?: boolean;
}

/**
 * Create a new highlight
 */
export async function createHighlight(
  userId: string, // This is auth.users.id
  highlightData: HighlightFormData
): Promise<{ data: Highlight | null; error: string | null }> {
  const supabase = createClient();

  try {
    // First, get the profile ID from the user ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return { data: null, error: 'Profile not found' };
    }

    const { data, error } = await supabase
      .from('highlights')
      .insert({
        user_id: profile.id, // Use profiles.id instead of auth.users.id
        title: highlightData.title,
        description: highlightData.description,
        video_url: highlightData.video_url,
        thumbnail_url: highlightData.thumbnail_url,
        duration: Math.round(highlightData.duration),
        sport_id: highlightData.sport_id,
        tags: highlightData.tags || [],
        is_public: highlightData.is_public !== false, // Default to public
        views: 0,
        likes: 0,
        shares: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to create highlight',
    };
  }
}

/**
 * Get user highlights
 */
export async function getUserHighlights(
  userId: string // This is auth.users.id
): Promise<{ data: Highlight[] | null; error: string | null }> {
  const supabase = createClient();

  try {
    // First, get the profile ID from the user ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return { data: null, error: 'Profile not found' };
    }

    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('user_id', profile.id) // Use profiles.id instead of auth.users.id
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch highlights',
    };
  }
}

/**
 * Get public highlights for a user
 */
export async function getPublicHighlights(
  userId: string // This is auth.users.id
): Promise<{ data: Highlight[] | null; error: string | null }> {
  const supabase = createClient();

  try {
    // First, get the profile ID from the user ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return { data: null, error: 'Profile not found' };
    }

    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('user_id', profile.id) // Use profiles.id instead of auth.users.id
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch highlights',
    };
  }
}

/**
 * Update highlight
 */
export async function updateHighlight(
  highlightId: string,
  updates: Partial<CreateHighlightData>
): Promise<{ data: Highlight | null; error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('highlights')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', highlightId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to update highlight',
    };
  }
}

/**
 * Delete highlight
 */
export async function deleteHighlight(
  highlightId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', highlightId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete highlight',
    };
  }
}

/**
 * Increment view count
 */
export async function incrementViewCount(
  highlightId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    // Get current view count
    const { data: highlight, error: fetchError } = await supabase
      .from('highlights')
      .select('views')
      .eq('id', highlightId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Increment view count
    const { error } = await supabase
      .from('highlights')
      .update({
        views: (highlight.views || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', highlightId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to increment views',
    };
  }
}

/**
 * Get featured highlights
 */
export async function getFeaturedHighlights(
  limit = 10
): Promise<{ data: Highlight[] | null; error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('highlights')
      .select(
        `
        *,
        profiles:user_id (
          full_name,
          username,
          avatar_url
        )
      `
      )
      .eq('is_public', true)
      .eq('is_featured', true)
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch featured highlights',
    };
  }
}

/**
 * Search highlights by sport or skill
 */
export async function searchHighlights(
  query: string,
  sportId?: string,
  limit = 20
): Promise<{ data: Highlight[] | null; error: string | null }> {
  const supabase = createClient();

  try {
    let queryBuilder = supabase
      .from('highlights')
      .select(
        `
        *,
        profiles:user_id (
          full_name,
          username,
          avatar_url
        )
      `
      )
      .eq('is_public', true);

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,skill_tags.cs.{${query}}`
      );
    }

    if (sportId) {
      queryBuilder = queryBuilder.eq('sport_id', sportId);
    }

    const { data, error } = await queryBuilder
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to search highlights',
    };
  }
}
