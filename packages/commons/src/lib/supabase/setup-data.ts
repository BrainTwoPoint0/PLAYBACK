import { createClient } from './client';

export async function insertDefaultSports() {
  try {
    const supabase = createClient();

    const defaultSports = [
      {
        name: 'Football',
        description: 'Association football/soccer',
        icon_url: '/sports/football.png',
      },
      {
        name: 'Basketball',
        description: 'Basketball',
        icon_url: '/sports/basketball.png',
      },
      {
        name: 'Tennis',
        description: 'Tennis',
        icon_url: '/sports/tennis.png',
      },
      {
        name: 'Rugby',
        description: 'Rugby football',
        icon_url: '/sports/rugby.png',
      },
      {
        name: 'Volleyball',
        description: 'Volleyball',
        icon_url: '/sports/volleyball.png',
      },
      {
        name: 'Lacrosse',
        description: 'Lacrosse',
        icon_url: '/sports/lacrosse.png',
      },
      {
        name: 'Padel',
        description: 'Padel tennis',
        icon_url: '/sports/padel.png',
      },
    ];

    // Check if sports already exist
    const { data: existingSports } = await supabase
      .from('sports')
      .select('name');

    const existingSportNames =
      (existingSports as Array<{ name: string }> | null)?.map((s) => s.name) ||
      [];
    const sportsToInsert = defaultSports.filter(
      (sport) => !existingSportNames.includes(sport.name)
    );

    if (sportsToInsert.length === 0) {
      return {
        success: true,
        message: 'All default sports already exist',
        count: existingSports?.length || 0,
      };
    }

    const { data, error } = await supabase
      .from('sports')
      // @ts-ignore - Type generated from database
      .insert(sportsToInsert)
      .select();

    if (error) {
      return {
        success: false,
        error: 'Failed to insert sports',
        details: error,
      };
    }

    return {
      success: true,
      message: `Successfully inserted ${sportsToInsert.length} sports`,
      insertedSports: data,
      totalSports: (existingSports?.length || 0) + sportsToInsert.length,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to insert default sports',
      details: error,
    };
  }
}

export async function insertDefaultAchievements() {
  try {
    const supabase = createClient();

    const defaultAchievements = [
      {
        name: 'First Goal',
        description: 'Score your first goal',
        type: 'milestone' as const,
        icon_url: '🏆',
        criteria: { type: 'goal', count: 1 },
        points: 10,
      },
      {
        name: 'Social Butterfly',
        description: 'Connect with 10 other athletes',
        type: 'social' as const,
        icon_url: '🦋',
        criteria: { type: 'connections', count: 10 },
        points: 25,
      },
      {
        name: 'Highlight Reel',
        description: 'Upload your first highlight',
        type: 'milestone' as const,
        icon_url: '🎬',
        criteria: { type: 'highlights', count: 1 },
        points: 15,
      },
      {
        name: 'Consistent Performer',
        description: 'Track statistics for 7 consecutive days',
        type: 'performance' as const,
        icon_url: '📈',
        criteria: { type: 'stats_streak', days: 7 },
        points: 50,
      },
      {
        name: 'Team Player',
        description: 'Join a team or club',
        type: 'social' as const,
        icon_url: '👥',
        criteria: { type: 'team_join', count: 1 },
        points: 20,
      },
    ];

    // TODO: Re-enable when achievements table is created
    // Check if achievements already exist
    // const { data: existingAchievements } = await supabase
    //   .from('achievements')
    //   .select('name');

    const existingAchievementNames: string[] = [];
    // existingAchievements?.map((a) => a.name) || [];
    const achievementsToInsert = defaultAchievements.filter(
      (achievement) => !existingAchievementNames.includes(achievement.name)
    );

    if (achievementsToInsert.length === 0) {
      return {
        success: true,
        message: 'All default achievements already exist',
        count: 0, // existingAchievements?.length || 0,
      };
    }

    // TODO: Re-enable when achievements table is created
    return {
      success: true,
      message: 'Achievements functionality disabled until table is created',
      totalAchievements: 0,
    };

    /* const { data, error } = await supabase
      .from('achievements')
      .insert(achievementsToInsert)
      .select();

    if (error) {
      return {
        success: false,
        error: 'Failed to insert achievements',
        details: error,
      };
    }

    return {
      success: true,
      message: `Successfully inserted ${achievementsToInsert.length} achievements`,
      insertedAchievements: data,
      totalAchievements:
        (existingAchievements?.length || 0) + achievementsToInsert.length,
    }; */
  } catch (error) {
    return {
      success: false,
      error: 'Failed to insert default achievements',
      details: error,
    };
  }
}

export async function setupDefaultData() {
  try {
    const sportsResult = await insertDefaultSports();
    const achievementsResult = await insertDefaultAchievements();

    return {
      success: sportsResult.success && achievementsResult.success,
      sports: sportsResult,
      achievements: achievementsResult,
      message: 'Default data setup completed',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to setup default data',
      details: error,
    };
  }
}
