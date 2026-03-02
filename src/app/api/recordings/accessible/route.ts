import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch recordings the user has access to via playhub_access_rights
  const { data, error } = await supabase
    .from('playhub_access_rights')
    .select(
      `
      match_recording_id,
      playhub_match_recordings (
        id,
        title,
        thumbnail_url,
        match_date,
        home_team,
        away_team,
        content_type,
        duration_seconds
      )
    `
    )
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    );
  }

  // Flatten and filter to published recordings
  const recordings = (data || [])
    .map((row: any) => row.playhub_match_recordings)
    .filter(
      (r: any) => r !== null && r.status !== 'archived' && r.status !== 'draft'
    );

  return NextResponse.json({ recordings });
}
