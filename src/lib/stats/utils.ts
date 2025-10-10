import { createClient } from '@/lib/supabase/client';

export interface Statistic {
  id: string;
  profile_variant_id: string;
  sport_id?: string | null;
  stat_type: string;
  metrics: any;
  stat_date: string;
  competition?: string | null;
  opponent?: string | null;
  match_id?: string | null;
  is_verified?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateStatisticData {
  sport_id?: string;
  stat_type: string;
  value: number;
  unit?: string;
  description?: string;
  date_recorded: string;
}

export interface StatisticCategory {
  type: string;
  name: string;
  stats: {
    name: string;
    unit?: string;
    description: string;
  }[];
}

/**
 * Predefined statistics categories by sport
 */
export const STATISTIC_CATEGORIES: Record<string, StatisticCategory[]> = {
  Football: [
    {
      type: 'offensive',
      name: 'Offensive Stats',
      stats: [
        { name: 'Goals', description: 'Goals scored' },
        { name: 'Assists', description: 'Assists made' },
        { name: 'Shots', description: 'Total shots taken' },
        { name: 'Shots on Target', description: 'Shots on target' },
        { name: 'Passes Completed', description: 'Successful passes' },
        {
          name: 'Pass Accuracy',
          unit: '%',
          description: 'Pass completion percentage',
        },
        { name: 'Crosses', description: 'Crosses attempted' },
        { name: 'Dribbles', description: 'Successful dribbles' },
      ],
    },
    {
      type: 'defensive',
      name: 'Defensive Stats',
      stats: [
        { name: 'Tackles', description: 'Tackles made' },
        { name: 'Interceptions', description: 'Interceptions made' },
        { name: 'Clearances', description: 'Clearances made' },
        { name: 'Blocks', description: 'Shots blocked' },
        { name: 'Clean Sheets', description: 'Games without conceding' },
        { name: 'Saves', description: 'Goalkeeper saves' },
      ],
    },
    {
      type: 'physical',
      name: 'Physical Stats',
      stats: [
        {
          name: 'Distance Covered',
          unit: 'km',
          description: 'Distance run during match',
        },
        { name: 'Sprint Speed', unit: 'km/h', description: 'Top sprint speed' },
        {
          name: 'Minutes Played',
          unit: 'min',
          description: 'Total minutes on field',
        },
      ],
    },
  ],
  Basketball: [
    {
      type: 'scoring',
      name: 'Scoring Stats',
      stats: [
        { name: 'Points', description: 'Total points scored' },
        { name: 'Field Goals Made', description: 'Field goals made' },
        {
          name: 'Field Goal Percentage',
          unit: '%',
          description: 'Field goal percentage',
        },
        { name: '3-Pointers Made', description: 'Three-pointers made' },
        {
          name: '3-Point Percentage',
          unit: '%',
          description: 'Three-point percentage',
        },
        { name: 'Free Throws Made', description: 'Free throws made' },
        {
          name: 'Free Throw Percentage',
          unit: '%',
          description: 'Free throw percentage',
        },
      ],
    },
    {
      type: 'playmaking',
      name: 'Playmaking Stats',
      stats: [
        { name: 'Assists', description: 'Assists made' },
        { name: 'Rebounds', description: 'Total rebounds' },
        { name: 'Offensive Rebounds', description: 'Offensive rebounds' },
        { name: 'Defensive Rebounds', description: 'Defensive rebounds' },
        { name: 'Steals', description: 'Steals made' },
        { name: 'Blocks', description: 'Shots blocked' },
        { name: 'Turnovers', description: 'Turnovers committed' },
      ],
    },
  ],
  Tennis: [
    {
      type: 'serve',
      name: 'Serving Stats',
      stats: [
        { name: 'Aces', description: 'Aces served' },
        {
          name: 'First Serve Percentage',
          unit: '%',
          description: 'First serve percentage',
        },
        {
          name: 'First Serve Points Won',
          unit: '%',
          description: 'Points won on first serve',
        },
        {
          name: 'Second Serve Points Won',
          unit: '%',
          description: 'Points won on second serve',
        },
        {
          name: 'Service Games Won',
          unit: '%',
          description: 'Service games won',
        },
        { name: 'Double Faults', description: 'Double faults committed' },
      ],
    },
    {
      type: 'return',
      name: 'Return Stats',
      stats: [
        {
          name: 'Return Points Won',
          unit: '%',
          description: 'Return points won',
        },
        {
          name: 'Break Points Converted',
          unit: '%',
          description: 'Break points converted',
        },
        {
          name: 'Return Games Won',
          unit: '%',
          description: 'Return games won',
        },
      ],
    },
  ],
};

/**
 * Create a new statistic
 */
export async function createStatistic(
  userId: string,
  statisticData: CreateStatisticData
): Promise<{ data: Statistic | null; error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('statistics')
      .insert({
        profile_variant_id: userId,
        sport_id: statisticData.sport_id,
        stat_type: statisticData.stat_type,
        metrics: {
          value: statisticData.value,
          unit: statisticData.unit,
          description: statisticData.description,
        },
        stat_date: statisticData.date_recorded,
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
        error instanceof Error ? error.message : 'Failed to create statistic',
    };
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(
  userId: string,
  filters?: {
    sport_id?: string;
    stat_type?: string;
  }
): Promise<{ data: Statistic[] | null; error: string | null }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('statistics')
      .select('*')
      .eq('user_id', userId)
      .order('stat_date', { ascending: false });

    if (filters?.sport_id) {
      query = query.eq('sport_id', filters.sport_id);
    }

    if (filters?.stat_type) {
      query = query.eq('stat_type', filters.stat_type);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch statistics',
    };
  }
}

/**
 * Update statistic
 */
export async function updateStatistic(
  statisticId: string,
  updates: Partial<CreateStatisticData>
): Promise<{ data: Statistic | null; error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('statistics')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', statisticId)
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
        error instanceof Error ? error.message : 'Failed to update statistic',
    };
  }
}

/**
 * Delete statistic
 */
export async function deleteStatistic(
  statisticId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('statistics')
      .delete()
      .eq('id', statisticId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete statistic',
    };
  }
}

/**
 * Get personal bests
 */
export async function getPersonalBests(
  userId: string,
  sportId?: string
): Promise<{ data: Statistic[] | null; error: string | null }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('statistics')
      .select('*')
      .eq('user_id', userId)
      .order('stat_date', { ascending: false });

    if (sportId) {
      query = query.eq('sport_id', sportId);
    }

    const { data, error } = await query;

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
          : 'Failed to fetch personal bests',
    };
  }
}

/**
 * Get statistics summary
 */
export async function getStatisticsSummary(userId: string): Promise<{
  data: {
    totalStats: number;
    personalBests: number;
    sportsTracked: number;
    recentStats: Statistic[];
  } | null;
  error: string | null;
}> {
  const supabase = createClient();

  try {
    // Get all stats for user
    const { data: allStats, error } = await supabase
      .from('statistics')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return { data: null, error: error.message };
    }

    const stats = allStats || [];

    // Calculate summary
    const totalStats = stats.length;
    const personalBests = 0; // No personal best field in current schema
    const sportsTracked = new Set(stats.map((s) => s.sport_id).filter(Boolean))
      .size;
    const recentStats = stats
      .sort(
        (a, b) =>
          new Date(b.stat_date).getTime() - new Date(a.stat_date).getTime()
      )
      .slice(0, 5);

    return {
      data: {
        totalStats,
        personalBests,
        sportsTracked,
        recentStats,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch statistics summary',
    };
  }
}
