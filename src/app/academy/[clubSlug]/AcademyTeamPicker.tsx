'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { startAcademyCheckout } from './actions';

interface TeamCard {
  teamSlug: string;
  displayName: string;
  logoUrl: string | null;
}

interface Props {
  clubSlug: string;
  /** Always the league-level name (e.g. "London Youth League") — keep this
   *  free of subclub composition so aria-labels read cleanly. */
  clubName: string;
  displayPrice: string | null;
  teams: TeamCard[];
  /** Hierarchical-academy middle layer (LYL → 'barnes-eagles'). The flat
   *  page (CFA, SEFA) omits it and the picker subscribes against
   *  (club, team) only. */
  subclubSlug?: string | null;
  /** Display name of the subclub the parent navigated through (e.g.
   *  "Barnes Eagles"). Lets aria-labels read "Subscribe to U12 Tigers
   *  in Barnes Eagles at London Youth League" instead of overloading
   *  clubName with the composition. */
  subclubName?: string | null;
}

export function AcademyTeamPicker({
  clubSlug,
  clubName,
  displayPrice,
  teams,
  subclubSlug = null,
  subclubName = null,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [pendingTeamSlug, setPendingTeamSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handlePick(teamSlug: string) {
    // Synchronous guard — `pendingTeamSlug` is set before startTransition's
    // async callback runs, so a rapid second click before React commits the
    // useTransition flag is still rejected. Combined with passing a single
    // idempotency key per submission to the action, this honours the contract
    // C set out: "PLAYBACK proxy mints Idempotency-Key once per browser
    // submission and reuses it for any retry."
    if (pendingTeamSlug !== null) return;
    setPendingTeamSlug(teamSlug);
    setErrorMessage(null);

    // crypto.randomUUID is available in modern browsers (Chrome 92+, Safari
    // 15.4+, Firefox 95+). Generated on click → passed to the action → onward
    // to Stripe. If the parent later retries (after error or refresh), they
    // get a fresh key — that's correct, the original session may already be
    // valid in Stripe's 24h window.
    const idempotencyKey = crypto.randomUUID();

    startTransition(async () => {
      const result = await startAcademyCheckout(
        clubSlug,
        teamSlug,
        idempotencyKey,
        subclubSlug
      );
      // On success the action calls redirect() and never returns. On failure
      // it returns {ok: false, message} — show inline so the parent can retry
      // without losing context.
      if (!result.ok) {
        setErrorMessage(result.message);
        setPendingTeamSlug(null);
      }
    });
  }

  return (
    <>
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-500/30 bg-red-500/[0.05] px-4 py-3 text-sm text-red-200/90"
        >
          {errorMessage}
        </div>
      )}

      <ul
        aria-label={
          subclubName
            ? `Age groups at ${subclubName} (${clubName})`
            : `Teams at ${clubName}`
        }
        className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
      >
        {teams.map((team) => {
          const isPending = pendingTeamSlug === team.teamSlug;
          // Use aria-disabled + an onClick guard rather than the `disabled`
          // attribute so keyboard focus stays with the button across the
          // redirect window — `disabled` removes the element from the tab
          // order entirely, which strands screen-reader / keyboard users.
          return (
            <li key={team.teamSlug}>
              <button
                type="button"
                onClick={() => handlePick(team.teamSlug)}
                aria-disabled={pending}
                aria-label={
                  subclubName
                    ? `Subscribe to ${team.displayName} in ${subclubName} at ${clubName}`
                    : `Subscribe to ${team.displayName} on ${clubName}`
                }
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
                <div className="mb-6 flex items-start gap-4">
                  {team.logoUrl ? (
                    <Image
                      src={team.logoUrl}
                      alt=""
                      aria-hidden="true"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-md object-contain motion-safe:grayscale motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:grayscale-0"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="h-12 w-12 shrink-0 rounded-md border border-[#d6d5c9]/20 bg-[#d6d5c9]/[0.03]"
                    />
                  )}
                  <h3
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-2xl font-normal leading-tight tracking-tight text-[#d6d5c9]"
                  >
                    {team.displayName}
                  </h3>
                </div>

                <div className="flex items-center justify-between border-t border-[#d6d5c9]/10 pt-4">
                  {/* Hide the left "price" cell when no displayPrice is set —
                      otherwise the row reads "Subscribe → Subscribe" which
                      looks like a layout bug. */}
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
    </>
  );
}
