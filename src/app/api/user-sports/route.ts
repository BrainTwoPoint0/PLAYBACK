import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    const { userSports } = await request.json();

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

    // Delete existing user_sports entries using service role
    const { error: deleteError } = await serviceSupabase
      .from('user_sports')
      .delete()
      .eq('user_id', profileId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to clear existing sports' },
        { status: 500 }
      );
    }

    // Insert new user_sports entries if any
    if (userSports && userSports.length > 0) {
      // Filter out any invalid sports
      const validSports = userSports.filter(
        (sport: any) =>
          sport.sport_id &&
          sport.sport_id !== '0' &&
          sport.sport_id.trim() !== ''
      );

      if (validSports.length > 0) {
        const userSportsData = validSports.map((sport: any) => ({
          user_id: profileId,
          sport_id: sport.sport_id,
          role: sport.role,
          experience_level: sport.experience_level,
          positions: sport.positions || [],
          is_primary: false,
        }));

        const { error: insertError } = await serviceSupabase
          .from('user_sports')
          .insert(userSportsData);

        if (insertError) {
          return NextResponse.json(
            { error: insertError.message || 'Failed to save sports' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
