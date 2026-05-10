'use client';

import { ShieldCheck } from 'lucide-react';
import { DashboardSection } from './dashboard-section';

export interface VerificationRow {
  id: string;
  organizationName: string;
  seasonLabel: string | null;
  verifiedAt: string;
}

interface DashboardVerificationsSectionProps {
  verifications: VerificationRow[];
  /**
   * The user's last_dashboard_view_at — verifications signed after this
   * render with a NEW eyebrow. Null = first-ever load → all are new.
   */
  lastSeenAt?: string | null;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Surfaces every active verification — a small, calm list. Multi-club
 * verifications stack here (Verified by CFA + SEFA both visible). The
 * verification fact is the trust signal; revoked verifications drop out
 * upstream (filtered by `revoked_at IS NULL` query).
 */
export function DashboardVerificationsSection({
  verifications,
  lastSeenAt,
}: DashboardVerificationsSectionProps) {
  const lastSeenMs = lastSeenAt ? new Date(lastSeenAt).getTime() : null;
  const isNewSince = (iso: string) => {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    if (lastSeenMs === null) return true;
    return t > lastSeenMs;
  };
  return (
    <DashboardSection
      title="Verifications"
      count={verifications.length || null}
    >
      {verifications.length === 0 ? (
        // Day-1 zero-state collapses to a single muted line — earn the card
        // shell only when there's content. Avoids the "four empty cards
        // stacked" failure mode the UX reviewer flagged.
        <p
          className="text-sm leading-relaxed max-w-prose"
          style={{ color: 'var(--text-subtle)' }}
        >
          No verifications yet. A club admin can verify you from their roster
          page — once they do, the badge appears on your public profile and
          here.
        </p>
      ) : (
        <ul
          className="rounded-2xl border overflow-hidden divide-y"
          style={{
            backgroundColor: 'var(--surface-1)',
            borderColor: 'var(--line)',
          }}
        >
          {verifications.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5"
              style={{ borderColor: 'var(--line)' }}
            >
              <div
                className="rounded-lg p-2 shrink-0"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                <ShieldCheck
                  className="h-4 w-4"
                  style={{ color: 'var(--timberwolf)' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium truncate flex items-center gap-2"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {v.organizationName}
                  {isNewSince(v.verifiedAt) && (
                    <span
                      className="inline-flex items-center text-[9px] uppercase tracking-[0.22em] font-semibold"
                      style={{ color: 'var(--timberwolf)' }}
                      aria-label="New verification"
                    >
                      New
                    </span>
                  )}
                </div>
                <div
                  className="mt-0.5 text-xs truncate tabular-nums"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {v.seasonLabel ? `${v.seasonLabel} · ` : ''}
                  {formatDate(v.verifiedAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
