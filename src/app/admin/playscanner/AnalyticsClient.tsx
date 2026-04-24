'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ChevronDown,
  ClipboardCheck,
  ClipboardCopy,
} from 'lucide-react';
import type { PlayScannerAnalytics } from '@/lib/admin/playscanner-analytics';
import { DeltaChip } from './components/DeltaChip';
import { EditorialAreaChart } from './components/EditorialAreaChart';
import { FunnelSteps } from './components/FunnelSteps';
import { ProviderRow } from './components/ProviderRow';
import { RevenueHero } from './components/RevenueHero';
import { StatCell } from './components/StatCell';

interface AnalyticsClientProps {
  analytics: PlayScannerAnalytics;
  timeframeDays: number;
  postHogDeepDiveUrl: string;
}

const TIMEFRAME_OPTIONS: Array<{ value: 1 | 7 | 30; label: string }> = [
  { value: 1, label: '24h' },
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
];

// Keyboard shortcut map. `1`/`7` map to their day counts; `m` for month so
// the binding isn't "press 3 for 30 days" (which reads as 3 days to anyone
// who isn't the author).
const KEY_TO_DAYS: Record<string, 1 | 7 | 30> = {
  '1': 1,
  '7': 7,
  m: 30,
  M: 30,
};

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

const gbpCompact = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});

export default function AnalyticsClient({
  analytics,
  timeframeDays,
  postHogDeepDiveUrl,
}: AnalyticsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDaily, setShowDaily] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const setTimeframe = useCallback(
    (days: number) => {
      startTransition(() => {
        router.replace(`/admin/playscanner?timeframe=${days}`, {
          scroll: false,
        });
      });
    },
    [router]
  );

  // Keyboard shortcuts: 1 / 7 / 3 cycle the timeframe. Ignore when the user is
  // typing in an input, and when any modifier is held so the browser's native
  // shortcuts keep working.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }
      const match = KEY_TO_DAYS[e.key];
      if (match != null && match !== timeframeDays) {
        e.preventDefault();
        setTimeframe(match);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [timeframeDays, setTimeframe]);

  // Hero sparkline from the already-available daily revenue series.
  const revenueSeries = useMemo(
    () => analytics.daily.map((d) => d.revenue),
    [analytics.daily]
  );

  const providerRevenueMax = useMemo(() => {
    const revenues = analytics.conversions.topProviders.map((p) => p.revenue);
    return revenues.length ? Math.max(...revenues) : 0;
  }, [analytics.conversions.topProviders]);

  const funnelSteps = useMemo(
    () => [
      { label: 'Sessions', value: analytics.visitors.totalSessions },
      { label: 'Searches', value: analytics.searches.totalSearches },
      {
        label: 'Booking clicks',
        value: analytics.conversions.totalConversions,
      },
    ],
    [
      analytics.visitors.totalSessions,
      analytics.searches.totalSearches,
      analytics.conversions.totalConversions,
    ]
  );

  const periodRange = useMemo(() => {
    const start = new Date(analytics.period.start);
    const end = new Date(analytics.period.end);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${fmt(start)}–${fmt(end)}`;
  }, [analytics.period.start, analytics.period.end]);

  const copySummary = useCallback(async () => {
    const prev = analytics.previous.totalEstimatedRevenue;
    const cur = analytics.conversions.totalEstimatedRevenue;
    const deltaPct = prev > 0 ? ((cur - prev) / prev) * 100 : null;
    const deltaStr =
      deltaPct == null
        ? ''
        : ` (${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%)`;
    const top = analytics.conversions.topProviders[0];
    const summary = [
      `PLAYScanner · last ${timeframeDays}d (${periodRange})`,
      `Potential commission ${gbp.format(cur)}${deltaStr} — upper bound, pre-contract (3–6% assumed)`,
      `${analytics.conversions.totalConversions} booking clicks · ${analytics.conversions.conversionRate.toFixed(1)}% click-thru`,
      `${analytics.visitors.totalSessions} sessions · ${analytics.searches.totalSearches} searches`,
      top
        ? `Top: ${top.provider} (${gbp.format(top.revenue)} potential)`
        : null,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard permission may be denied; no-op rather than crash the UI.
    }
  }, [analytics, timeframeDays, periodRange]);

  const comparisonStart = new Date(analytics.previousPeriod.start);
  const comparisonEnd = new Date(analytics.previousPeriod.end);
  const periodLabel = `Last ${timeframeDays} day${timeframeDays === 1 ? '' : 's'}`;

  return (
    <div
      className={`transition-opacity duration-200 ${isPending ? 'opacity-70' : ''}`}
    >
      {/* ━━━ Context bar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-4 sm:pt-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#E0AD62] shadow-[0_0_8px_rgba(224,173,98,0.55)]"
          />
          Playscanner · Analytics · Live
        </div>
        <span className="sm:ml-auto text-[11px] text-ink-subtle tabular-nums whitespace-nowrap">
          vs{' '}
          {comparisonStart.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })}
          {' – '}
          {comparisonEnd.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })}
        </span>

        {/* Timeframe switcher — tablist because the timeframe drives the URL
            and re-renders page content. `role="tablist"` matches that mental
            model better than radiogroup and doesn't demand arrow-key cycling
            the browser's back/forward already gives us. */}
        <div
          role="tablist"
          aria-label="Timeframe"
          className="flex items-center rounded-xl bg-[rgba(214,213,201,0.04)] p-0.5"
        >
          {TIMEFRAME_OPTIONS.map((opt) => {
            const active = opt.value === timeframeDays;
            return (
              <button
                key={opt.value}
                role="tab"
                aria-selected={active}
                onClick={() => setTimeframe(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
                  active
                    ? 'bg-timberwolf text-night'
                    : 'text-ink-muted hover:text-timberwolf'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={copySummary}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted hover:text-timberwolf hover:border-line-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night"
        >
          {copied ? (
            <ClipboardCheck
              className="h-3.5 w-3.5 text-[#7FA98A]"
              aria-hidden
            />
          ) : (
            <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
          )}
          <span>{copied ? 'Copied' : 'Copy summary'}</span>
        </button>
      </header>

      {/* ━━━ Hero band ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevenueHero
        current={analytics.conversions.totalEstimatedRevenue}
        previous={analytics.previous.totalEstimatedRevenue}
        timeframeLabel={periodLabel}
        series={revenueSeries}
        topProvider={
          analytics.conversions.topProviders[0]
            ? {
                name: analytics.conversions.topProviders[0].provider,
                revenue: analytics.conversions.topProviders[0].revenue,
              }
            : null
        }
      />

      {/* ━━━ KPI strip ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-line border-b border-line">
        <StatCell
          label="Sessions"
          value={analytics.visitors.totalSessions.toLocaleString()}
          support={`over ${periodLabel.toLowerCase()}`}
          current={analytics.visitors.totalSessions}
          previous={analytics.previous.totalSessions}
        />
        <StatCell
          label="Searches"
          value={analytics.searches.totalSearches.toLocaleString()}
          support={`${analytics.searches.averageResultsPerSearch.toFixed(1)} avg results · ${(analytics.searches.averageSearchDuration / 1000).toFixed(1)}s`}
          current={analytics.searches.totalSearches}
          previous={analytics.previous.totalSearches}
        />
        <StatCell
          label="Booking clicks"
          value={analytics.conversions.totalConversions.toLocaleString()}
          support={
            analytics.conversions.totalConversions > 0
              ? `Avg slot value ${gbpCompact.format(analytics.conversions.averageBookingValue)}`
              : 'No clicks yet'
          }
          current={analytics.conversions.totalConversions}
          previous={analytics.previous.totalConversions}
        />
        <StatCell
          label="Click-thru rate"
          value={`${analytics.conversions.conversionRate.toFixed(1)}%`}
          support={`${analytics.conversions.totalConversions} / ${analytics.searches.totalSearches} searches`}
          current={analytics.conversions.conversionRate}
          previous={analytics.previous.conversionRate}
        />
      </section>

      {/* ━━━ Primary chart + Funnel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          On mobile, funnel comes first — it carries the "what happened in
          the conversion pipeline" story, which is the second question after
          revenue. Chart follows because it's less scannable on a phone. */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-8 lg:mt-10">
        <div className="order-2 lg:order-1 lg:col-span-8">
          <div className="flex items-baseline justify-between mb-4 lg:mb-5 gap-2 flex-wrap">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
              Daily activity
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-ink-muted">
              <LegendDot colour="amber" label="Potential £" />
              <LegendDot colour="muted" label="Searches" />
              <LegendDot colour="subtle" label="Sessions" />
            </div>
          </div>
          <div className="lg:hidden">
            <EditorialAreaChart
              data={analytics.daily}
              series={[
                { key: 'revenue', label: 'Potential £', colour: 'amber' },
                { key: 'searches', label: 'Searches', colour: 'muted' },
                { key: 'sessions', label: 'Sessions', colour: 'subtle' },
              ]}
              yFormat="count"
              height={220}
            />
          </div>
          <div className="hidden lg:block">
            <EditorialAreaChart
              data={analytics.daily}
              series={[
                { key: 'revenue', label: 'Potential £', colour: 'amber' },
                { key: 'searches', label: 'Searches', colour: 'muted' },
                { key: 'sessions', label: 'Sessions', colour: 'subtle' },
              ]}
              yFormat="count"
              height={320}
            />
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-4">
          <div className="flex items-baseline justify-between mb-4 lg:mb-5 gap-2">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
              Funnel
            </div>
            <DeltaChip
              current={analytics.conversions.conversionRate}
              previous={analytics.previous.conversionRate}
            />
          </div>
          <FunnelSteps steps={funnelSteps} />
          <div className="mt-5 rounded-lg border border-line px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
              Session → click rate
            </div>
            <div className="mt-1 font-display text-[22px] font-normal leading-none tracking-[-0.02em] text-timberwolf tabular-nums">
              {analytics.visitors.totalSessions > 0
                ? `${((analytics.conversions.totalConversions / analytics.visitors.totalSessions) * 100).toFixed(2)}%`
                : '—'}
            </div>
            <div className="mt-1 text-[12px] text-ink-muted">
              Sessions that clicked through to a provider
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Providers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Geography was removed because ip_address / country_code / city
          are never populated by the current session collector. Providers
          now takes the full width. */}
      <section className="mt-10 lg:mt-12">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
            Providers by potential commission
          </div>
          <div className="text-[11px] text-ink-subtle tabular-nums">
            {analytics.conversions.topProviders.length} active
          </div>
        </div>
        {analytics.conversions.topProviders.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-ink-muted">
            No booking clicks yet in this window.
          </div>
        ) : (
          <div>
            {analytics.conversions.topProviders.map((p, i) => (
              <ProviderRow
                key={p.provider}
                rank={i + 1}
                name={p.provider}
                bookings={p.count}
                revenue={p.revenue}
                revenueMax={providerRevenueMax}
                currencyFormatter={gbp}
              />
            ))}
          </div>
        )}
      </section>

      {/* ━━━ Daily breakdown (collapsible) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="mt-12 border-t border-line pt-6">
        <button
          onClick={() => setShowDaily((v) => !v)}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-subtle hover:text-timberwolf transition-colors"
          aria-expanded={showDaily}
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showDaily ? 'rotate-0' : '-rotate-90'}`}
            aria-hidden
          />
          <span>Daily breakdown ({analytics.daily.length} days)</span>
        </button>
        {showDaily && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-[13px] tabular-nums">
              <thead>
                <tr className="bg-[rgba(214,213,201,0.025)] text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-right px-4 py-2 font-medium">Sessions</th>
                  <th className="text-right px-4 py-2 font-medium">Searches</th>
                  <th className="text-right px-4 py-2 font-medium">Clicks</th>
                  <th className="text-right px-4 py-2 font-medium">
                    Potential £
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.daily.map((day) => (
                  <tr
                    key={day.date}
                    className="border-t border-line hover:bg-[rgba(214,213,201,0.03)]"
                  >
                    <td className="px-4 py-2 text-timberwolf">
                      {new Date(day.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="text-right px-4 py-2 text-ink-muted">
                      {day.sessions.toLocaleString()}
                    </td>
                    <td className="text-right px-4 py-2 text-ink-muted">
                      {day.searches.toLocaleString()}
                    </td>
                    <td className="text-right px-4 py-2 text-timberwolf">
                      {day.conversions.toLocaleString()}
                    </td>
                    <td className="text-right px-4 py-2 text-[#E0AD62]">
                      {gbp.format(day.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ━━━ Footer: deep-dive link + keyboard hint ━━━━━━━━━━━━━━━━━━━━━━
          No more iframed PostHog dashboard. Deep exploration (funnels,
          retention, cohorts, session replay) lives in PostHog directly —
          one click away, opens in a new tab. Keeps this page fast and
          mobile-first. */}
      <section className="mt-10 lg:mt-12 border-t border-line pt-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <a
          href={postHogDeepDiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-line px-3 py-2 text-[12px] text-ink-muted hover:text-timberwolf hover:border-line-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night"
        >
          <span>Explore in PostHog</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
        <span className="hidden sm:inline text-[11px] text-ink-subtle">
          Funnel, retention, cohorts, session replay.
        </span>
        <span className="hidden lg:inline ml-auto text-[11px] text-ink-subtle">
          Press{' '}
          <kbd className="rounded border border-line px-1 py-0.5 text-[10px] tabular-nums">
            1
          </kbd>{' '}
          <kbd className="rounded border border-line px-1 py-0.5 text-[10px] tabular-nums">
            7
          </kbd>{' '}
          <kbd className="rounded border border-line px-1 py-0.5 text-[10px]">
            M
          </kbd>{' '}
          to switch timeframe.
        </span>
      </section>
    </div>
  );
}

function LegendDot({
  colour,
  label,
}: {
  colour: 'amber' | 'muted' | 'subtle';
  label: string;
}) {
  const bg =
    colour === 'amber'
      ? 'bg-[#E0AD62]'
      : colour === 'muted'
        ? 'bg-[rgba(214,213,201,0.55)]'
        : 'bg-[rgba(214,213,201,0.28)]';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-[1px] ${bg}`}
      />
      <span>{label}</span>
    </span>
  );
}
