'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { startAcademyCheckout } from './actions';

interface SubclubCard {
  subclubSlug: string;
  displayName: string;
  logoUrl: string | null;
}

interface TeamCard {
  subclubSlug: string;
  teamSlug: string;
  displayName: string;
  logoUrl: string | null;
}

interface Props {
  clubSlug: string;
  clubName: string;
  displayPrice: string | null;
  subclubs: SubclubCard[];
  /** Flat list of every active team across every subclub. The picker groups
   *  by subclubSlug at render time. Loaded server-side once per request so
   *  switching clubs is purely client-state — no extra network roundtrip. */
  teams: TeamCard[];
}

/**
 * One-page hierarchical picker:
 *   row of club cards (horizontal scroll) → select club → age groups appear
 *   below → select age group → Stripe checkout via the existing server action.
 *
 * Selection is mirrored to ?club=<slug> via router.replace (no history spam)
 * so refreshes preserve the choice and the URL is shareable.
 */
export function AcademyHierarchicalPicker({
  clubSlug,
  clubName,
  displayPrice,
  subclubs,
  teams,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFromUrl = searchParams.get('club');

  // Validate the URL slug against the actual subclub set — a stale ?club=
  // value from a deleted subclub shouldn't lock the user in a broken state.
  const validInitial =
    initialFromUrl && subclubs.some((s) => s.subclubSlug === initialFromUrl)
      ? initialFromUrl
      : null;

  const [selectedSubclub, setSelectedSubclub] = useState<string | null>(
    validInitial
  );
  const [pending, startTransition] = useTransition();
  const [pendingTeamSlug, setPendingTeamSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyed off `selectedSubclub` so React remounts the reveal subtree each
  // time the parent picks a different club — triggers the CSS fade-in
  // animation defined in the className below without an extra effect.
  const ageGroupsRef = useRef<HTMLDivElement>(null);

  // Carousel scroll-state tracking for the edge fades + chevron buttons.
  // Tracked at this level (not via CSS only) so we can hide the arrows
  // when the rail has already hit the respective edge — chevrons that
  // never do anything are visual debt.
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const recomputeScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    // 1px tolerance — `scrollLeft` can land on a fractional pixel after
    // a snap and trigger arrow flicker without it.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    recomputeScrollState();
    // Window resize changes how much of the rail is visible, which flips
    // the right-edge condition. Cheap listener — recomputeScrollState is
    // a synchronous read on a small DOM.
    window.addEventListener('resize', recomputeScrollState);
    return () => window.removeEventListener('resize', recomputeScrollState);
  }, [recomputeScrollState]);

  function scrollByCards(direction: 'left' | 'right') {
    const el = railRef.current;
    if (!el) return;
    // Scroll by ~80% of the visible width so the parent sees a fresh page
    // of cards but a couple of the previously-visible ones stay in view as
    // a continuity anchor. Native scrollBehavior:'smooth' handles easing.
    const delta = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -delta : delta,
      behavior: 'smooth',
    });
  }

  function handleSelectSubclub(slug: string) {
    setSelectedSubclub(slug);
    setErrorMessage(null);
    // Mirror selection to URL — replace (not push) so the browser back button
    // returns to wherever the parent came from, not through every club they
    // tapped while browsing. `scroll: false` keeps the page in place — the
    // hero stays visible, the carousel stays where it is.
    const params = new URLSearchParams(searchParams.toString());
    params.set('club', slug);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleClearSelection() {
    setSelectedSubclub(null);
    setErrorMessage(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('club');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }

  const selectedSubclubMeta = selectedSubclub
    ? (subclubs.find((s) => s.subclubSlug === selectedSubclub) ?? null)
    : null;
  const teamsForSelection = selectedSubclub
    ? teams.filter((t) => t.subclubSlug === selectedSubclub)
    : [];

  function handlePickTeam(teamSlug: string) {
    if (!selectedSubclub) return;
    if (pendingTeamSlug !== null) return;
    setPendingTeamSlug(teamSlug);
    setErrorMessage(null);
    // Idempotency key minted per-click — same contract as AcademyTeamPicker.
    const idempotencyKey = crypto.randomUUID();
    startTransition(async () => {
      const result = await startAcademyCheckout(
        clubSlug,
        teamSlug,
        idempotencyKey,
        selectedSubclub
      );
      if (!result.ok) {
        setErrorMessage(result.message);
        setPendingTeamSlug(null);
      }
    });
  }

  return (
    <>
      {/* Carousel wrapper. `relative` so the gradient fades + chevron
          buttons can position over the rail. `-mx-6` lets the rail (and
          its fades) extend to the section's padding edges. */}
      <div className="relative -mx-6">
        {/* Left edge fade — only renders while there's content to the
            left to reveal. `bg-gradient-to-r from-[#0a100d]` matches the
            page background exactly so the fade dissolves into it. */}
        {canScrollLeft && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0a100d] via-[#0a100d]/80 to-transparent motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
          />
        )}
        {/* Right edge fade — symmetric. */}
        {canScrollRight && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0a100d] via-[#0a100d]/80 to-transparent motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
          />
        )}
        {/* Left chevron — hidden when fully scrolled left. Sits above the
            fade overlay (z-20 > z-10). Small, subtle, non-disruptive. */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByCards('left')}
            aria-label="Scroll clubs left"
            className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#d6d5c9]/20 bg-[#0a100d]/80 p-2 text-[#d6d5c9] backdrop-blur-sm transition-all hover:border-[#d6d5c9]/50 hover:bg-[#0a100d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6d5c9]/60 md:inline-flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByCards('right')}
            aria-label="Scroll clubs right"
            className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#d6d5c9]/20 bg-[#0a100d]/80 p-2 text-[#d6d5c9] backdrop-blur-sm transition-all hover:border-[#d6d5c9]/50 hover:bg-[#0a100d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6d5c9]/60 md:inline-flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {/* Carousel — horizontal scroll. snap-proximity (not mandatory)
            lets touch + trackpad inertia carry through naturally; cards
            "settle" near a snap point rather than being yanked to one.
            scroll-smooth handles keyboard-driven scrolling cleanly. */}
        <div
          ref={railRef}
          role="radiogroup"
          aria-label={`Clubs in ${clubName}`}
          onScroll={recomputeScrollState}
          className="overflow-x-auto scroll-smooth px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex snap-x snap-proximity gap-3 pb-2">
            {subclubs.map((sc) => {
              const isSelected = selectedSubclub === sc.subclubSlug;
              return (
                <li
                  key={sc.subclubSlug}
                  className="w-44 shrink-0 snap-start md:w-52"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectSubclub(sc.subclubSlug)}
                    aria-label={`Choose ${sc.displayName}`}
                    className={[
                      'group relative flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border bg-white p-5 text-center',
                      'motion-safe:transition-all motion-safe:duration-200',
                      isSelected
                        ? 'border-[#0a100d] ring-2 ring-[#0a100d]'
                        : 'border-transparent hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a100d]',
                    ].join(' ')}
                  >
                    {/* Logos sit directly on the white card — the stripped
                      white backgrounds blend in cleanly. Logos that still
                      have built-in coloured backgrounds (London Thames'
                      navy square, Chosen One's dark badge) read as
                      self-contained tile crests on the white field. */}
                    {sc.logoUrl ? (
                      <Image
                        src={sc.logoUrl}
                        alt=""
                        aria-hidden="true"
                        width={56}
                        height={56}
                        className="h-16 w-16 shrink-0 object-contain"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="h-16 w-16 shrink-0 rounded-full border border-[#0a100d]/15 bg-[#0a100d]/[0.03]"
                      />
                    )}
                    <h3 className="text-sm font-semibold leading-tight tracking-tight text-[#0a100d] md:text-base">
                      {sc.displayName}
                    </h3>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Age groups — appears below the carousel once a club is selected.
          Section is always rendered for layout consistency; its content
          swaps between "pick a club" prompt and the actual team grid.
          `key={selectedSubclub}` remounts the subtree per selection so the
          tailwindcss-animate `animate-in` classes re-fire each time. */}
      <div ref={ageGroupsRef} className="mt-12">
        {!selectedSubclubMeta ? (
          <div className="rounded-xl border border-dashed border-[#d6d5c9]/15 px-6 py-12 text-center text-sm text-[#b9baa3]">
            Pick a club above to see the age groups available for subscription.
          </div>
        ) : (
          <div
            key={selectedSubclub}
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
          >
            <div className="mb-6 flex items-baseline justify-between border-b border-[#d6d5c9]/10 pb-4">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#b9baa3] md:text-xs">
                  {selectedSubclubMeta.displayName} · Age groups
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-[#d6d5c9]">
                  Choose an age group
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs text-[#b9baa3] underline-offset-4 transition-colors hover:text-[#d6d5c9] hover:underline"
              >
                Clear
              </button>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-6 rounded-md border border-red-500/30 bg-red-500/[0.05] px-4 py-3 text-sm text-red-200/90"
              >
                {errorMessage}
              </div>
            )}

            {teamsForSelection.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d6d5c9]/15 px-6 py-12 text-center text-sm text-[#b9baa3]">
                <p className="text-[#d6d5c9]">
                  {selectedSubclubMeta.displayName} hasn&apos;t opened any age
                  groups for subscription yet.
                </p>
                <p className="mt-2">
                  New age groups usually go live before the season starts. Check
                  back soon.
                </p>
              </div>
            ) : (
              <ul
                aria-label={`Age groups at ${selectedSubclubMeta.displayName}`}
                className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
              >
                {teamsForSelection.map((team) => {
                  const isPending = pendingTeamSlug === team.teamSlug;
                  return (
                    <li key={team.teamSlug}>
                      <button
                        type="button"
                        onClick={() => handlePickTeam(team.teamSlug)}
                        aria-disabled={pending}
                        aria-label={`Subscribe to ${team.displayName} in ${selectedSubclubMeta.displayName} at ${clubName}`}
                        className={[
                          'group relative w-full overflow-hidden rounded-xl border bg-[#d6d5c9]/[0.015] p-6 text-left',
                          'motion-safe:transition-all motion-safe:duration-300',
                          isPending
                            ? 'border-[#d6d5c9]/50 bg-[#d6d5c9]/[0.04]'
                            : 'border-[#d6d5c9]/20 hover:border-[#d6d5c9]/50 hover:bg-[#d6d5c9]/[0.03]',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6d5c9]/50',
                          pending && !isPending ? 'cursor-wait' : '',
                        ].join(' ')}
                      >
                        {/* No logo on age-group cards — the subclub heading
                            above already establishes identity, and the
                            U7/U8/... text is the entire signal here. Empty
                            placeholder boxes for logo-less teams looked
                            worse than no slot at all. */}
                        <h3 className="mb-6 text-xl font-semibold leading-tight tracking-tight text-[#d6d5c9]">
                          {team.displayName}
                        </h3>
                        <div className="flex items-center justify-between border-t border-[#d6d5c9]/10 pt-4">
                          <span className="text-sm text-[#b9baa3]">
                            {displayPrice ?? '—'}
                          </span>
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-[#d6d5c9]">
                              <span
                                aria-hidden
                                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#d6d5c9]"
                              />
                              Redirecting to Stripe…
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm text-[#d6d5c9] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1">
                              Subscribe
                              <span aria-hidden>→</span>
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
