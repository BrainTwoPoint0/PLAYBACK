import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role to bypass RLS (org_members has no SELECT policy)
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user's profile
  const { data: profileRow } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  const profile = profileRow as { id: string } | null;

  // 1. Recordings via access_rights (purchased/granted)
  const { data: accessData } = await admin
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
        duration_seconds,
        status
      )
    `
    )
    .eq('user_id', user.id)
    .eq('is_active', true);

  // 2. Recordings from orgs the user is a member of
  let orgRecordings: any[] = [];
  if (profile) {
    const { data: memberships } = await admin
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', profile.id)
      .eq('is_active', true);

    if (memberships && memberships.length > 0) {
      const orgIds = memberships.map((m: any) => m.organization_id);
      const { data: orgData } = await admin
        .from('playhub_match_recordings')
        .select(
          'id, title, thumbnail_url, match_date, home_team, away_team, content_type, duration_seconds'
        )
        .in('organization_id', orgIds)
        .eq('status', 'published')
        .order('match_date', { ascending: false });

      orgRecordings = orgData || [];
    }
  }

  // Combine and deduplicate
  const accessRecordings = (accessData || [])
    .map((row: any) => row.playhub_match_recordings)
    .filter(
      (r: any) => r !== null && r.status !== 'archived' && r.status !== 'draft'
    );

  const seen = new Set<string>();
  const recordings: any[] = [];
  for (const r of [...orgRecordings, ...accessRecordings]) {
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      recordings.push(r);
    }
  }

  return NextResponse.json({ recordings });
}
