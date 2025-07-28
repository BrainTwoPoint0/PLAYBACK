import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  try {
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile ID - foreign key expects profiles.id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profile.id;

    // Create service role client to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user_sports using service role
    const { data: userSportsData, error: sportsError } = await serviceSupabase
      .from('user_sports')
      .select(
        `
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
      `
      )
      .eq('user_id', profileId);

    if (sportsError) {
      return NextResponse.json(
        { error: 'Failed to fetch sports' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user_sports: userSportsData || [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
