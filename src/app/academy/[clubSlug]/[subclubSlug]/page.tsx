import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Instrument_Serif } from 'next/font/google';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { createServiceClient } from '@/lib/supabase/server';
import { AcademyTeamPicker } from '../AcademyTeamPicker';

// Same display face as the parent league page so the visual carries through
// the two-step flow without disrupting PLAYBACK's body type (Inter at root).
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
});

// Slug shapes mirror the validation in the action + PLAYHUB. Cheap pre-flight
// guards before hitting Supabase, also bound what lands in error logs.
const CLUB_SLUG_RE = /^[a-z0-9_][a-z0-9_-]{0,63}$/;
const SUBCLUB_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

interface ClubRow {
  club_slug: string;
  name: string;
  display_price: string | null;
}

interface SubclubRow {
  subclub_slug: string;
  display_name: string;
  logo_url: string | null;
}

interface TeamRow {
  team_slug: string;
  display_name: string;
  logo_url: string | null;
  sort_order: number;
}

/** Same protocol-allowlist check as the parent page — rejects http/data/
 *  javascript/relative URLs that operator-set rows might carry in by mistake. */
function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

// Single cache() entry per request — used by both generateMetadata and the
// default export so we don't pay for two Supabase round trips.
const loadSubclubAndTeams = cache(
  async (
    clubSlug: string,
    subclubSlug: string
  ): Promise<{
    club: ClubRow;
    subclub: SubclubRow;
    teams: TeamRow[];
  } | null> => {
    if (!CLUB_SLUG_RE.test(clubSlug)) return null;
    if (!SUBCLUB_SLUG_RE.test(subclubSlug)) return null;

    // Cast: the generated Database type lives in PLAYHUB's repo and doesn't
    // know about playhub_academy_*. Same reasoning as the parent page.
    const supabase = createServiceClient() as any;

    // Three queries fanned out in parallel: club row (for display name +
    // price), subclub row (for hero copy + 404 gate), team list scoped to
    // (club, subclub). All three return small payloads — at LYL pilot
    // scale (~16 subclubs, ~10 age groups each) the round-trip latency
    // dominates so parallel is a strict win.
    const [clubResult, subclubResult, teamsResult] = await Promise.all([
      supabase
        .from('playhub_academy_config')
        .select('club_slug, name, display_price')
        .eq('club_slug', clubSlug)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('playhub_academy_subclubs')
        .select('subclub_slug, display_name, logo_url')
        .eq('club_slug', clubSlug)
        .eq('subclub_slug', subclubSlug)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('playhub_academy_teams')
        .select('team_slug, display_name, logo_url, sort_order')
        .eq('club_slug', clubSlug)
        .eq('subclub_slug', subclubSlug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('display_name', { ascending: true }),
    ]);

    if (clubResult.error) {
      console.error('subclub page: club lookup failed', clubResult.error);
      return null;
    }
    if (subclubResult.error) {
      console.error('subclub page: subclub lookup failed', subclubResult.error);
      return null;
    }
    if (teamsResult.error) {
      console.error('subclub page: teams lookup failed', teamsResult.error);
      return null;
    }
    if (!clubResult.data || !subclubResult.data) return null;

    const club: ClubRow = {
      club_slug: clubResult.data.club_slug,
      name: clubResult.data.name,
      display_price: clubResult.data.display_price ?? null,
    };
    const subclub: SubclubRow = {
      subclub_slug: subclubResult.data.subclub_slug,
      display_name: subclubResult.data.display_name,
      logo_url: safeImageUrl(subclubResult.data.logo_url),
    };
    const teams: TeamRow[] = (teamsResult.data ?? []).map(
      (t: any): TeamRow => ({
        team_slug: t.team_slug,
        display_name: t.display_name,
        logo_url: safeImageUrl(t.logo_url),
        sort_order: t.sort_order ?? 0,
      })
    );

    return { club, subclub, teams };
  }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string; subclubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug, subclubSlug } = await params;
  const data = await loadSubclubAndTeams(clubSlug, subclubSlug);
  if (!data) return { title: 'Academy Subscription' };
  return {
    title: `${data.subclub.display_name} — ${data.club.name} | PLAYBACK Academy`,
    description: `Subscribe to ${data.subclub.display_name} on PLAYBACK to unlock match recordings, training clips, and analysis from every fixture.`,
    alternates: { canonical: `/academy/${clubSlug}/${subclubSlug}` },
    openGraph: {
      title: `${data.subclub.display_name} — ${data.club.name}`,
      description: `Subscribe to ${data.subclub.display_name} on PLAYBACK.`,
      type: 'website',
      url: `/academy/${clubSlug}/${subclubSlug}`,
    },
  };
}

export default async function AcademySubclubPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string; subclubSlug: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { clubSlug, subclubSlug } = await params;
  const { canceled } = await searchParams;
  const data = await loadSubclubAndTeams(clubSlug, subclubSlug);
  if (!data) notFound();

  const { club, subclub, teams } = data;

  return (
    <main
      className={`${instrumentSerif.variable} relative min-h-screen bg-[#0a100d] text-[#d6d5c9]`}
    >
      {/* Same ambient wash as the parent league page — keeps the two-step
          flow visually contiguous. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[60vh]"
      >
        <div className="absolute left-1/2 top-[-20%] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#d6d5c9]/[0.04] blur-3xl" />
      </div>

      <div className="relative z-10">
        <section className="px-6 pb-16 pt-24 md:pb-20 md:pt-32 lg:pt-40">
          <div className="mx-auto max-w-5xl">
            {/* Breadcrumb back to the league page. Plain Link gives us
                back/forward + middle-click without re-running the action. */}
            <nav
              aria-label="Breadcrumb"
              className="mb-10 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#b9baa3] md:text-xs"
            >
              <Link
                href={`/academy/${encodeURIComponent(club.club_slug)}`}
                className="text-[#b9baa3] underline-offset-4 transition-colors hover:text-[#d6d5c9] hover:underline"
              >
                {club.name}
              </Link>
              <span aria-hidden>·</span>
              <span className="text-[#d6d5c9]">{subclub.display_name}</span>
            </nav>

            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
              {subclub.logo_url && (
                <Image
                  src={subclub.logo_url}
                  alt={`${subclub.display_name} crest`}
                  width={80}
                  height={80}
                  className="h-16 w-16 shrink-0 rounded-md object-contain md:h-20 md:w-20"
                />
              )}
              <h1
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-5xl font-normal leading-[0.95] tracking-[-0.03em] text-[#d6d5c9] md:text-7xl lg:text-[5.5rem]"
              >
                {subclub.display_name}
              </h1>
            </div>

            <p className="mt-10 max-w-xl text-base leading-relaxed text-[#b9baa3] md:text-lg">
              Pick your child&apos;s age group to subscribe. Each subscription
              unlocks match recordings, training clips, and analysis from every
              fixture this season — delivered to your PLAYBACK account.
            </p>

            {canceled === '1' && (
              <div className="mt-8 inline-flex items-center gap-2 rounded-md border border-[#d6d5c9]/20 bg-[#d6d5c9]/[0.04] px-3 py-2 text-xs text-[#b9baa3]">
                Checkout cancelled. Pick an age group below to try again.
              </div>
            )}
          </div>
        </section>

        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-baseline justify-between border-b border-[#d6d5c9]/10 pb-4">
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-2xl font-normal tracking-tight text-[#d6d5c9]"
              >
                Age Groups
              </h2>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#b9baa3] md:text-xs">
                {teams.length} {teams.length === 1 ? 'group' : 'groups'}
              </p>
            </div>

            {teams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d6d5c9]/20 px-6 py-16 text-center text-sm text-[#b9baa3]">
                <p className="text-[#d6d5c9]">
                  {subclub.display_name} hasn&apos;t opened any age groups for
                  subscription yet.
                </p>
                <p className="mt-2">
                  New age groups usually go live before the season starts. Check
                  back soon.
                </p>
              </div>
            ) : (
              <AcademyTeamPicker
                clubSlug={club.club_slug}
                clubName={club.name}
                subclubSlug={subclub.subclub_slug}
                subclubName={subclub.display_name}
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
