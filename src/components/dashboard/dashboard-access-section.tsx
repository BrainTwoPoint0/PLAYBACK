'use client';

import Link from 'next/link';
import { Film, Receipt, ArrowUpRight } from 'lucide-react';
import { DashboardSection } from './dashboard-section';

export interface AccessSummary {
  /** Number of currently active recording access grants */
  recordingsAccessibleCount: number;
  /** Most recent access timestamp (granted_at) — null if none */
  latestGrantedAt: string | null;
  /** Number of completed purchases this account has ever made */
  totalPurchases: number;
  /** Most recent completed purchase timestamp — null if none */
  latestPurchasedAt: string | null;
  /** Latest purchase amount + currency for display */
  latestPurchaseAmount: number | null;
  latestPurchaseCurrency: string | null;
}

interface DashboardAccessSectionProps {
  summary: AccessSummary;
  playhubBaseUrl?: string;
}

function relativeDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30)
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/**
 * Account-management surface inside the connective-tissue dashboard.
 * Read-only summary of PLAYHUB-side ownership: recordings the user can
 * watch, purchases they've made. Full management (cancel, refund,
 * billing details) deep-links to PLAYHUB.
 *
 * Empty state explains the model: if the user has never purchased a
 * match recording or been granted access, this is empty by design.
 */
export function DashboardAccessSection({
  summary,
  playhubBaseUrl,
}: DashboardAccessSectionProps) {
  const playhub =
    playhubBaseUrl ??
    process.env.NEXT_PUBLIC_PLAYHUB_URL?.replace(/\/$/, '') ??
    'https://playhub.playbacksports.ai';

  const hasAnything =
    summary.recordingsAccessibleCount > 0 || summary.totalPurchases > 0;

  return (
    <DashboardSection
      title="Subscriptions & access"
      action={
        <Link
          href={`${playhub}/library`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 text-xs font-medium hover:underline focus-visible:outline-none focus-visible:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          Open PLAYHUB
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      }
    >
      {!hasAnything ? (
        // Day-1 zero-state collapses to a single muted line — earn the card
        // shell only when there's content.
        <p
          className="text-sm leading-relaxed max-w-prose"
          style={{ color: 'var(--text-subtle)' }}
        >
          No subscriptions or purchased recordings yet. Match recordings you buy
          or are granted access to will appear here.{' '}
          <Link
            href={`${playhub}/library`}
            target="_blank"
            rel="noopener"
            className="underline hover:no-underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Browse on PLAYHUB →
          </Link>
        </p>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border p-1"
          style={{
            backgroundColor: 'var(--surface-1)',
            borderColor: 'var(--line)',
          }}
        >
          <SummaryTile
            Icon={Film}
            label="Recordings you can watch"
            value={summary.recordingsAccessibleCount.toString()}
            sub={
              summary.latestGrantedAt
                ? `last access ${relativeDate(summary.latestGrantedAt)}`
                : null
            }
          />
          <SummaryTile
            Icon={Receipt}
            label="Completed purchases"
            value={summary.totalPurchases.toString()}
            sub={
              summary.latestPurchasedAt && summary.latestPurchaseAmount !== null
                ? `last ${relativeDate(summary.latestPurchasedAt)} · ${formatMoney(
                    summary.latestPurchaseAmount,
                    summary.latestPurchaseCurrency ?? 'GBP'
                  )}`
                : summary.latestPurchasedAt
                  ? `last ${relativeDate(summary.latestPurchasedAt)}`
                  : null
            }
          />
        </div>
      )}
    </DashboardSection>
  );
}

function SummaryTile({
  Icon,
  label,
  value,
  sub,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string | null;
}) {
  return (
    <div
      className="rounded-xl px-4 py-4 flex items-start gap-3"
      style={{ backgroundColor: 'var(--surface-2)' }}
    >
      <div
        className="rounded-lg p-2 shrink-0"
        style={{
          backgroundColor: 'rgba(214,213,201,0.05)',
          color: 'var(--timberwolf)',
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-lg font-semibold tabular-nums leading-none"
          style={{ color: 'var(--timberwolf)' }}
        >
          {value}
        </div>
        <div className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>
        {sub && (
          <div
            className="mt-0.5 text-[11px] tabular-nums"
            style={{ color: 'var(--text-subtle)' }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
