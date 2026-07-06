import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { createServiceClient } from '@/lib/supabase/server';
import { AcademyTeamPicker } from './AcademyTeamPicker';
import { AcademyHierarchicalPicker } from './AcademyHierarchicalPicker';

// Slug shape mirrors the validation in the action + PLAYHUB. Cheap guard
// before hitting Supabase, also bounds what lands in error logs.
const CLUB_SLUG_RE = /^[a-z0-9_][a-z0-9_-]{0,63}$/;

interface ClubRow {
  club_slug: string;
  name: string;
  logo_url: string | null;
  display_price: string | null;
}

interface TeamRow {
  team_slug: string;
  display_name: string;
  logo_url: string | null;
  sort_order: number;
  /** NULL for flat configs (CFA, SEFA). Set for LYL-shaped hierarchical
   *  configs — the hierarchical picker groups teams by this client-side. */
  subclub_slug: string | null;
}

/** Hierarchical-academy middle layer (LYL → 16 clubs). When the lookup
 *  returns rows the page renders the subclub picker; when empty the page
 *  falls through to the flat (CFA, SEFA) team picker — no behaviour change
 *  for legacy clubs. */
interface SubclubRow {
  subclub_slug: string;
  display_name: string;
  logo_url: string | null;
  sort_order: number;
}

/**
 * Drops a remote URL that isn't `https:`. Operator-set logo URLs come from
 * playhub_academy_config / playhub_academy_teams — bypassing RLS via the
 * service-role client — so we re-validate at render time rather than trust
 * the row blindly. javascript:/data:/http:/relative all → null.
 */
function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

// `cache()` dedupes the lookup across the page's two callsites (metadata +
// default export) per request. Without it we'd pay for two Supabase round
// trips on every render.
//
// E.2: lookup now returns subclubs alongside the flat-team list. The
// renderer picks one or the other:
//   - subclubs.length > 0 → render the subclub grid (LYL-shape; teams list
//     intentionally ignored at this layer — picked on the subclub page)
//   - subclubs.length === 0 → render the flat team grid (CFA/SEFA-shape).
// We deliberately fetch BOTH in one cache() call rather than branching at
// load time, because (a) at the row counts in play (~50 subclubs lifetime,
// ~500 teams lifetime) two queries per page are cheap, and (b) it avoids a
// second cache() helper that subtly drifts from this one.
const loadClubAndTeams = cache(
  async (
    clubSlug: string
  ): Promise<{
    club: ClubRow;
    teams: TeamRow[];
    subclubs: SubclubRow[];
  } | null> => {
    if (!CLUB_SLUG_RE.test(clubSlug)) return null;

    // PLAYBACK's generated `Database` type doesn't yet include the
    // playhub_academy_* tables (they live in PLAYHUB's migrations). Cast for
    // the academy queries — regenerating types is tracked as a follow-up.
    const supabase = createServiceClient() as any;

    const { data: clubRow, error: clubErr } = await supabase
      .from('playhub_academy_config')
      .select('club_slug, name, logo_url, display_price')
      .eq('club_slug', clubSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (clubErr) {
      console.error('academy page: club lookup failed', clubErr);
      return null;
    }
    if (!clubRow) return null;

    const club: ClubRow = {
      club_slug: clubRow.club_slug,
      name: clubRow.name,
      logo_url: safeImageUrl(clubRow.logo_url),
      display_price: clubRow.display_price ?? null,
    };

    // Fan out the two listing queries in parallel. Teams query is now
    // UNFILTERED on subclub_slug — the renderer splits flat vs hierarchical
    // client-side (since the new hierarchical picker is single-page and
    // needs every subclub's teams pre-loaded for instant tab switching).
    // At LYL pilot scale (~16 subclubs × ~10 age groups ≈ 160 rows max)
    // the payload is trivial; revisit if a single league passes ~2K teams.
    const [teamsResult, subclubsResult] = await Promise.all([
      supabase
        .from('playhub_academy_teams')
        .select('team_slug, display_name, logo_url, sort_order, subclub_slug')
        .eq('club_slug', clubSlug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('display_name', { ascending: true }),
      supabase
        .from('playhub_academy_subclubs')
        .select('subclub_slug, display_name, logo_url, sort_order')
        .eq('club_slug', clubSlug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('display_name', { ascending: true }),
    ]);

    if (teamsResult.error) {
      console.error('academy page: teams lookup failed', teamsResult.error);
      return null;
    }
    if (subclubsResult.error) {
      // Subclub-table reads are RLS-allowed for anon; failure here is a
      // schema/migration drift rather than RLS. Log + fail-closed so the
      // page either renders correctly or 404s — never as a half-rendered
      // hierarchical config that would confuse parents.
      console.error(
        'academy page: subclubs lookup failed',
        subclubsResult.error
      );
      return null;
    }

    const teams: TeamRow[] = (teamsResult.data ?? []).map(
      (t: any): TeamRow => ({
        team_slug: t.team_slug,
        display_name: t.display_name,
        logo_url: safeImageUrl(t.logo_url),
        sort_order: t.sort_order ?? 0,
        subclub_slug: t.subclub_slug ?? null,
      })
    );

    const subclubs: SubclubRow[] = (subclubsResult.data ?? []).map(
      (s: any): SubclubRow => ({
        subclub_slug: s.subclub_slug,
        display_name: s.display_name,
        logo_url: safeImageUrl(s.logo_url),
        sort_order: s.sort_order ?? 0,
      })
    );

    return { club, teams, subclubs };
  }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const data = await loadClubAndTeams(clubSlug);
  if (!data) {
    return { title: 'Academy Subscription' };
  }
  return {
    title: `${data.club.name} — Academy Subscription`,
    description: `Subscribe to ${data.club.name} on PLAYBACK to unlock match recordings, training clips, and analysis from every fixture.`,
    alternates: { canonical: `/academy/${clubSlug}` },
    openGraph: {
      title: `${data.club.name} — Academy Subscription`,
      description: `Subscribe to ${data.club.name} on PLAYBACK.`,
      type: 'website',
      url: `/academy/${clubSlug}`,
    },
  };
}

export default async function AcademyClubPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { clubSlug } = await params;
  const { canceled } = await searchParams;
  const data = await loadClubAndTeams(clubSlug);
  if (!data) notFound();

  const { club, teams, subclubs } = data;
  // The presence of any active subclub row promotes this league into
  // hierarchical mode (LYL-shape). Otherwise it's flat (CFA, SEFA) and
  // the renderer falls through to the legacy team picker. Per the E.2
  // checkpoint plan: zero changes to flat-config behaviour.
  const isHierarchical = subclubs.length > 0;

  return (
    <main className="relative min-h-screen bg-[#0a100d] text-[#d6d5c9]">
      {/* Ambient wash — a single low-intensity radial at the top. No purple. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[60vh]"
      >
        <div className="absolute left-1/2 top-[-20%] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#d6d5c9]/[0.04] blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Hero — club identity. Type carries the weight; logo renders bare. */}
        <section className="px-6 pb-16 pt-24 md:pb-20 md:pt-32 lg:pt-40">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-[10px] uppercase tracking-[0.32em] text-[#b9baa3] md:text-xs">
              PLAYBACK Academy · Subscribe
            </p>

            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
              {club.logo_url && (
                <Image
                  src={club.logo_url}
                  alt={`${club.name} crest`}
                  width={128}
                  height={128}
                  className="h-20 w-20 shrink-0 object-contain md:h-24 md:w-24"
                />
              )}
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-[#d6d5c9] md:text-4xl lg:text-5xl">
                {club.name}
              </h1>
            </div>

            <p className="mt-10 max-w-xl text-base leading-relaxed text-[#b9baa3] md:text-lg">
              {isHierarchical
                ? 'Pick your club to see the age groups available for subscription. Each subscription unlocks match recordings, training clips, and analysis from every fixture this season.'
                : 'Subscribe to your team and unlock match recordings, training clips, and analysis from every fixture this season — delivered to your PLAYBACK account, accessible from any device.'}
            </p>

            {canceled === '1' && (
              <div className="mt-8 inline-flex items-center gap-2 rounded-md border border-[#d6d5c9]/20 bg-[#d6d5c9]/[0.04] px-3 py-2 text-xs text-[#b9baa3]">
                Checkout cancelled.{' '}
                {isHierarchical
                  ? 'Pick a club below to try again.'
                  : 'Pick a team below to try again.'}
              </div>
            )}
          </div>
        </section>

        {/* Hierarchical: one-page club carousel + age groups reveal below.
            Flat (CFA/SEFA): unchanged team picker grid. */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-baseline justify-between border-b border-[#d6d5c9]/10 pb-4">
              <h2 className="text-xl font-semibold tracking-tight text-[#d6d5c9]">
                {isHierarchical ? 'Clubs' : 'Teams'}
              </h2>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#b9baa3] md:text-xs">
                {isHierarchical
                  ? `${subclubs.length} ${subclubs.length === 1 ? 'club' : 'clubs'}`
                  : `${teams.length} ${teams.length === 1 ? 'team' : 'teams'}`}
              </p>
            </div>

            {isHierarchical ? (
              <AcademyHierarchicalPicker
                clubSlug={club.club_slug}
                clubName={club.name}
                displayPrice={club.display_price}
                subclubs={subclubs.map((sc) => ({
                  subclubSlug: sc.subclub_slug,
                  displayName: sc.display_name,
                  logoUrl: sc.logo_url,
                }))}
                // Filter out flat-only rows (subclub_slug=null) — those are
                // a defensive safety net for legacy data that doesn't exist
                // in the LYL config but would noise up the picker if it did.
                teams={teams
                  .filter((t) => t.subclub_slug !== null)
                  .map((t) => ({
                    subclubSlug: t.subclub_slug as string,
                    teamSlug: t.team_slug,
                    displayName: t.display_name,
                    logoUrl: t.logo_url,
                  }))}
              />
            ) : teams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d6d5c9]/20 px-6 py-16 text-center text-sm text-[#b9baa3]">
                <p className="text-[#d6d5c9]">
                  {club.name} hasn&apos;t opened any teams for subscription yet.
                </p>
                <p className="mt-2">
                  New teams usually go live before the season starts. Check back
                  soon.
                </p>
              </div>
            ) : (
              <AcademyTeamPicker
                clubSlug={club.club_slug}
                clubName={club.name}
                displayPrice={club.display_price}
                teams={teams.map((t) => ({
                  teamSlug: t.team_slug,
                  displayName: t.display_name,
                  logoUrl: t.logo_url,
                }))}
              />
            )}

            <p className="mt-12 text-sm leading-relaxed text-[#b9baa3]">
              Payments are processed by Stripe. After successful checkout
              you&apos;ll be invited to claim your PLAYBACK account — your
              subscription is held against the email address you provide.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
