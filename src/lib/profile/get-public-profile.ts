import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type Visibility = 'public' | 'authenticated' | 'club_only' | 'private';

export interface PublicVariant {
  id: string;
  variant_type: string;
  sport_id: string | null;
  module_slug: string;
  is_primary: boolean | null;
  display_name: string | null;
  variant_bio: string | null;
  visibility: Visibility;
  sport_name: string | null;
}

export interface VerifierOrg {
  organization_id: string;
  name: string;
  logo_url: string | null;
  season_label: string | null;
  verified_at: string;
}

export interface PublicProfile {
  profile: {
    id: string;
    user_id: string;
    username: string;
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_image_url: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    location: string | null;
    // NOTE: `date_of_birth` and `social_links` are intentionally NOT projected
    // on the public path. DOB is identifying info on minors; `social_links`
    // is an unstructured field where users routinely store private contact
    // (phone, personal email, Telegram). Re-introduce only behind a curated
    // public-allowlist (handles + computed age, not raw values).
  };
  publicVariants: PublicVariant[];
  activeVariant: PublicVariant;
  football: {
    experience_level: string;
    preferred_foot: string | null;
    primary_position: string | null;
    secondary_positions: string[] | null;
    preferred_jersey_number: number | null;
  } | null;
  coach: {
    sports_coached: string[];
    age_groups: string[];
    qualifications: Record<string, unknown>;
    coaching_philosophy: string | null;
  } | null;
  verifications: VerifierOrg[];
  highlights: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    video_url: string;
    duration: number | null;
    view_count: number | null;
    metadata: Record<string, unknown> | null;
  }[];
  featuredHighlight: PublicProfile['highlights'][number] | null;
  /**
   * Clips auto-attributed to this player via the jersey-map → clip_attribution
   * pipeline. The connective-tissue payoff: the profile *receives* clips from
   * club-owned recordings rather than the player having to upload them.
   */
  attributedClips: {
    attributionId: string;
    clipId: string;
    recordingId: string;
    recordingTitle: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    thumbnailUrl: string | null;
    offsetStartMs: number;
    offsetEndMs: number;
    type: string;
    title: string | null;
    jerseyNumberAtMatch: number | null;
    attributedAt: string;
  }[];
  stats: {
    id: string;
    stat_type: string;
    stat_date: string;
    metrics: Record<string, unknown>;
    competition: string | null;
    opponent: string | null;
  }[];
  career: {
    id: string;
    organization_name: string;
    role: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean | null;
    description: string | null;
  }[];
  education: {
    id: string;
    institution_name: string;
    institution_type: string | null;
    degree_or_program: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean | null;
    description: string | null;
  }[];
  organizationName: string | null;
}

/**
 * Fetch a public profile resolved against the connective-tissue layer:
 * - profile_module_privacies gates which variants are visible to the current viewer
 * - module_slug determines which variant (`/p/[slug]/[module_slug]`) is active
 * - profile_verifications drives the verified-badge UI
 *
 * Returns null if the profile doesn't exist or has no public variants.
 * Returns 'module-not-found' sentinel if a moduleSlug was requested but doesn't
 * resolve to a public variant on this profile.
 */
export const getPublicProfile = cache(_getPublicProfile);

async function _getPublicProfile(
  slug: string,
  moduleSlug?: string
): Promise<PublicProfile | null | 'module-not-found'> {
  // Cheap allowlist on the slug shape — keeps malformed probes from hitting RLS.
  if (!/^[A-Za-z0-9_-]{1,50}$/.test(slug)) return null;
  if (moduleSlug !== undefined && !/^[a-z0-9-]{1,40}$/.test(moduleSlug)) {
    return 'module-not-found';
  }

  const supabase = await createClient();

  const { data: profileRow } = await supabase
    .from('profiles')
    .select(
      // PII deliberately excluded from the projection: `date_of_birth` and
      // `social_links` (see PublicProfile interface comment).
      'id, user_id, username, full_name, bio, avatar_url, cover_image_url, height_cm, weight_kg, location, is_public'
    )
    .eq('username', slug)
    .maybeSingle();
  if (!profileRow) return null;
  const profile = profileRow as any;
  // Top-level visibility kill-switch. If the user toggled is_public off, no
  // module is reachable regardless of profile_module_privacies state.
  if (profile.is_public === false) return null;

  const { data: variantRows } = await supabase
    .from('profile_variants')
    .select(
      'id, variant_type, sport_id, module_slug, is_primary, is_active, display_name, variant_bio'
    )
    .eq('profile_id', profile.id)
    .eq('is_active', true);
  const variants = (variantRows ?? []) as any[];
  if (variants.length === 0) return null;

  const variantIds = variants.map((v) => v.id);

  const { data: privacyRows } = await supabase
    .from('profile_module_privacies')
    .select('profile_variant_id, visibility')
    .in('profile_variant_id', variantIds);
  // Variants without an explicit privacy row are treated as 'private' — the
  // backfill + AFTER INSERT trigger ensure every variant gets a row, so a
  // missing row indicates an inconsistency we shouldn't render through.
  const privacyByVariant = new Map<string, Visibility>(
    (privacyRows ?? []).map((p: any) => [p.profile_variant_id, p.visibility])
  );

  const sportIds = Array.from(
    new Set(variants.map((v) => v.sport_id).filter(Boolean))
  );
  const sportNameById = new Map<string, string>();
  if (sportIds.length > 0) {
    const { data: sports } = await supabase
      .from('sports')
      .select('id, name')
      .in('id', sportIds);
    (sports ?? []).forEach((s: any) => sportNameById.set(s.id, s.name));
  }

  const publicVariants: PublicVariant[] = variants
    .map((v) => ({
      id: v.id as string,
      variant_type: v.variant_type as string,
      sport_id: (v.sport_id as string | null) ?? null,
      module_slug: v.module_slug as string,
      is_primary: (v.is_primary as boolean | null) ?? null,
      display_name: (v.display_name as string | null) ?? null,
      variant_bio: (v.variant_bio as string | null) ?? null,
      visibility: (privacyByVariant.get(v.id as string) ??
        'private') as Visibility,
      sport_name: v.sport_id
        ? (sportNameById.get(v.sport_id as string) ?? null)
        : null,
    }))
    .filter((v) => v.visibility === 'public');

  if (publicVariants.length === 0) return null;

  let activeVariant: PublicVariant;
  if (moduleSlug) {
    const match = publicVariants.find((v) => v.module_slug === moduleSlug);
    if (!match) return 'module-not-found';
    activeVariant = match;
  } else {
    activeVariant =
      publicVariants.find((v) => v.is_primary) ?? publicVariants[0];
  }

  const [
    { data: footballRow },
    { data: coachRow },
    { data: verificationRows },
    { data: highlightRows },
    { data: statRows },
    { data: careerRows },
    { data: educationRows },
    { data: attributionRows },
  ] = await Promise.all([
    activeVariant.variant_type === 'player'
      ? supabase
          .from('football_player_profiles')
          .select(
            'experience_level, preferred_foot, primary_position, secondary_positions, preferred_jersey_number'
          )
          .eq('profile_variant_id', activeVariant.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    activeVariant.variant_type === 'coach'
      ? supabase
          .from('coach_modules')
          .select(
            'sports_coached, age_groups, qualifications, coaching_philosophy'
          )
          .eq('profile_variant_id', activeVariant.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('profile_verifications')
      .select(
        'id, verifying_org_id, season_label, verified_at, organizations:verifying_org_id (id, name, logo_url)'
      )
      .eq('profile_id', profile.id)
      .is('revoked_at', null),
    supabase
      .from('highlights')
      .select(
        'id, title, thumbnail_url, video_url, duration, view_count, metadata'
      )
      .eq('profile_variant_id', activeVariant.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('statistics')
      .select('id, stat_type, stat_date, metrics, competition, opponent')
      .eq('profile_variant_id', activeVariant.id)
      .order('stat_date', { ascending: false })
      .limit(10),
    supabase
      .from('career_history')
      .select(
        'id, organization_name, role, start_date, end_date, is_current, description, display_order'
      )
      .eq('profile_variant_id', activeVariant.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('education')
      .select(
        'id, institution_name, institution_type, degree_or_program, field_of_study, start_date, end_date, is_current, description, display_order'
      )
      .eq('profile_id', profile.id)
      .order('display_order', { ascending: true }),
    // Clip attributions: profile-wide. The `!inner` joins drop rows whose
    // clip is soft-deleted or whose recording isn't published at the SQL
    // level (rather than fetching them and filtering in JS) — guarantees the
    // limit-24 page can't be silently emptied by a draft-recording cluster.
    // Public read is also RLS-gated as defense in depth.
    supabase
      .from('clip_attributions')
      .select(
        `id, clip_id, jersey_number_at_match, attributed_at,
         clips:clip_id!inner (
           id, recording_id, owner_org_id, offset_start_ms, offset_end_ms,
           type, title, deleted_at,
           playhub_match_recordings:recording_id!inner (
             id, title, home_team, away_team, match_date,
             thumbnail_url, status
           )
         )`
      )
      .eq('profile_id', profile.id)
      .is('revoked_at', null)
      .is('clips.deleted_at', null)
      .eq('clips.playhub_match_recordings.status', 'published')
      .order('attributed_at', { ascending: false })
      .limit(24),
  ]);

  const verifications: VerifierOrg[] = ((verificationRows ?? []) as any[])
    .map((v) => {
      // PostgREST returns the embedded relation as an object for many-to-one
      // FKs, but earlier versions returned a single-element array — handle
      // both defensively. Drops rows where the org is RLS-hidden or missing.
      const orgRaw = v.organizations;
      const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
      if (!org?.name) return null;
      return {
        organization_id: v.verifying_org_id as string,
        name: org.name as string,
        logo_url: (org.logo_url as string | null) ?? null,
        season_label: (v.season_label as string | null) ?? null,
        verified_at: v.verified_at as string,
      };
    })
    .filter((v): v is VerifierOrg => v !== null);

  const highlights = ((highlightRows ?? []) as any[]).map((h) => ({
    id: h.id as string,
    title: h.title as string,
    thumbnail_url: (h.thumbnail_url as string | null) ?? null,
    video_url: h.video_url as string,
    duration: (h.duration as number | null) ?? null,
    view_count: (h.view_count as number | null) ?? null,
    metadata: (h.metadata as Record<string, unknown> | null) ?? null,
  }));

  const career = (careerRows ?? []) as any[];
  const currentRole = career.find((c) => c.is_current);

  // Map clip_attributions rows. PostgREST returns embedded relations as
  // objects for many-to-one FKs; defensively handle the array case too.
  // Drops rows whose clip is soft-deleted or whose recording isn't published
  // (RLS already filters but the join returns null in that case).
  const attributedClips: PublicProfile['attributedClips'] = (
    (attributionRows ?? []) as any[]
  )
    .map((a) => {
      const clipRaw = a.clips;
      const clip = Array.isArray(clipRaw) ? clipRaw[0] : clipRaw;
      if (!clip || clip.deleted_at) return null;
      const recRaw = clip.playhub_match_recordings;
      const rec = Array.isArray(recRaw) ? recRaw[0] : recRaw;
      if (!rec || rec.status !== 'published') return null;
      return {
        attributionId: a.id as string,
        clipId: clip.id as string,
        recordingId: rec.id as string,
        recordingTitle: rec.title as string,
        homeTeam: (rec.home_team as string) ?? '',
        awayTeam: (rec.away_team as string) ?? '',
        matchDate: rec.match_date as string,
        thumbnailUrl: (rec.thumbnail_url as string | null) ?? null,
        offsetStartMs: (clip.offset_start_ms as number) ?? 0,
        offsetEndMs: (clip.offset_end_ms as number) ?? 0,
        type: (clip.type as string) ?? 'custom',
        title: (clip.title as string | null) ?? null,
        jerseyNumberAtMatch:
          (a.jersey_number_at_match as number | null) ?? null,
        attributedAt: a.attributed_at as string,
      };
    })
    .filter((c): c is PublicProfile['attributedClips'][number] => c !== null);

  return {
    profile,
    publicVariants,
    activeVariant,
    football: footballRow as any,
    coach: coachRow as any,
    verifications,
    highlights,
    featuredHighlight: highlights.length > 0 ? highlights[0] : null,
    stats: ((statRows ?? []) as any[]).map((s) => ({
      ...s,
      metrics: (s.metrics as Record<string, unknown>) ?? {},
    })),
    career,
    education: (educationRows ?? []) as any[],
    organizationName: currentRole?.organization_name ?? null,
    attributedClips,
  };
}
