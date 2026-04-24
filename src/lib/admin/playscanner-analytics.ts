import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Canonical shape returned to the admin analytics page. Kept stable so a
// future JSON export / download can serialise it directly without adapters.
export interface PlayScannerAnalytics {
  timeframe: string;
  timeframeDays: number;
  period: { start: string; end: string };
  previousPeriod: { start: string; end: string };
  // NOTE: intentionally minimal. `ip_address`, `country_code`, `city`,
  // and `session_duration` are either never populated or too sparse/noisy
  // to report honestly from the current collector. `page_views` is always
  // 1 (session-init increments only), so bounceRate was always 100% and
  // pageViews duplicated sessions. Add fields back only when the
  // collector actually fills them.
  visitors: {
    totalSessions: number;
  };
  searches: {
    totalSearches: number;
    averageResultsPerSearch: number;
    averageSearchDuration: number;
    topProviders: Array<{ provider: string; count: number }>;
  };
  conversions: {
    totalConversions: number;
    conversionRate: number;
    totalEstimatedRevenue: number;
    averageBookingValue: number;
    topProviders: Array<{ provider: string; count: number; revenue: number }>;
  };
  providers: Array<{
    name: string;
    date: string;
    clicks: number;
    revenue: number;
    conversionRate: number;
  }>;
  daily: Array<{
    date: string;
    sessions: number;
    searches: number;
    conversions: number;
    revenue: number;
  }>;
  // Previous-equivalent-window totals. Same window length as the current one,
  // ending right when the current one begins. Used to render delta chips.
  previous: {
    totalSessions: number;
    totalSearches: number;
    totalConversions: number;
    totalEstimatedRevenue: number;
    conversionRate: number;
    averageBookingValue: number;
  };
}

const TIMEFRAME_MIN = 1;
const TIMEFRAME_MAX = 90;
const TIMEFRAME_DEFAULT = 7;

// Supabase stores `estimated_price`, `estimated_commission`, and
// `provider_analytics.estimated_revenue` in **pence**. Convert once at the
// aggregation boundary so the UI speaks pounds everywhere. The legacy public
// page had this inconsistent (revenue displayed as pence, avg booking as
// pence/100) — fixing here surfaces 1/100th the number the old UI was
// showing for totals. That is the correct number.
const PENCE_TO_POUNDS = 1 / 100;

// Parse and validate the timeframe query param. Returns the default when the
// raw value is missing; throws when it's present but malformed so the caller
// can translate to a 400-equivalent UX. Accepts the `string | string[]` shape
// Next 15 App Router produces for `?timeframe=a&timeframe=b` — take the first.
export function parseTimeframe(
  raw: string | string[] | null | undefined
): number {
  if (raw == null) return TIMEFRAME_DEFAULT;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null || value === '') return TIMEFRAME_DEFAULT;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < TIMEFRAME_MIN || n > TIMEFRAME_MAX) {
    throw new InvalidTimeframeError(
      `Invalid timeframe (must be integer days ${TIMEFRAME_MIN}..${TIMEFRAME_MAX})`
    );
  }
  return n;
}

export class InvalidTimeframeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTimeframeError';
  }
}

// Fetches and aggregates PLAYScanner analytics for the given window. Uses the
// service-role key; only call from server code gated by requireAdmin().
// Also fetches the previous equivalent window so we can compute period-over-
// period deltas for every top-level KPI.
export async function getPlayScannerAnalytics(
  timeframeDays: number
): Promise<PlayScannerAnalytics> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Single "now" anchor so period.end, daily buckets, and both windows all
  // agree even if queries take seconds.
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - timeframeDays);

  const previousEnd = new Date(startDate);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - timeframeDays);

  const [
    sessionsRes,
    searchesRes,
    conversionsRes,
    providerRes,
    prevSessionsRes,
    prevSearchesRes,
    prevConversionsRes,
  ] = await Promise.all([
    // Current window. `.lt(now)` caps the upper bound so totals never include
    // rows landing between the `now` anchor and query execution — without it
    // KPI totals can exceed sum(daily) under clock drift.
    supabase
      .from('playscanner_sessions')
      .select('*')
      .gte('started_at', startDate.toISOString())
      .lt('started_at', now.toISOString())
      .order('started_at', { ascending: false }),
    supabase
      .from('playscanner_searches')
      .select('*')
      .gte('searched_at', startDate.toISOString())
      .lt('searched_at', now.toISOString())
      .order('searched_at', { ascending: false }),
    supabase
      .from('playscanner_conversions')
      .select('*')
      .gte('clicked_at', startDate.toISOString())
      .lt('clicked_at', now.toISOString())
      .order('clicked_at', { ascending: false }),
    supabase
      .from('provider_analytics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false }),
    // Previous window — narrow projection since we only need counts + sums.
    supabase
      .from('playscanner_sessions')
      .select('id')
      .gte('started_at', previousStart.toISOString())
      .lt('started_at', previousEnd.toISOString()),
    supabase
      .from('playscanner_searches')
      .select('id')
      .gte('searched_at', previousStart.toISOString())
      .lt('searched_at', previousEnd.toISOString()),
    supabase
      .from('playscanner_conversions')
      .select('estimated_commission, estimated_price')
      .gte('clicked_at', previousStart.toISOString())
      .lt('clicked_at', previousEnd.toISOString()),
  ]);

  if (sessionsRes.error) throw sessionsRes.error;
  if (searchesRes.error) throw searchesRes.error;
  if (conversionsRes.error) throw conversionsRes.error;
  if (providerRes.error) throw providerRes.error;
  if (prevSessionsRes.error) throw prevSessionsRes.error;
  if (prevSearchesRes.error) throw prevSearchesRes.error;
  if (prevConversionsRes.error) throw prevConversionsRes.error;

  const sessions = sessionsRes.data ?? [];
  const searches = searchesRes.data ?? [];
  const conversions = conversionsRes.data ?? [];
  const providerAnalytics = providerRes.data ?? [];
  const prevSessions = prevSessionsRes.data ?? [];
  const prevSearches = prevSearchesRes.data ?? [];
  const prevConversions = prevConversionsRes.data ?? [];

  const sessionCount = sessions.length;
  const searchCount = searches.length;
  const conversionCount = conversions.length;
  const prevSessionCount = prevSessions.length;
  const prevSearchCount = prevSearches.length;
  const prevConversionCount = prevConversions.length;
  const prevRevenue =
    prevConversions.reduce((sum, c) => sum + (c.estimated_commission || 0), 0) *
    PENCE_TO_POUNDS;
  const prevAvgBooking = prevConversionCount
    ? (prevConversions.reduce((sum, c) => sum + (c.estimated_price || 0), 0) /
        prevConversionCount) *
      PENCE_TO_POUNDS
    : 0;
  const prevConvRate = prevSearchCount
    ? (prevConversionCount / prevSearchCount) * 100
    : 0;

  return {
    timeframe: `${timeframeDays} days`,
    timeframeDays,
    period: {
      start: startDate.toISOString(),
      end: now.toISOString(),
    },
    previousPeriod: {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
    },
    visitors: {
      totalSessions: sessionCount,
    },
    searches: {
      totalSearches: searchCount,
      averageResultsPerSearch: searchCount
        ? searches.reduce((sum, s) => sum + (s.results_count || 0), 0) /
          searchCount
        : 0,
      averageSearchDuration: searchCount
        ? searches.reduce((sum, s) => sum + (s.search_duration_ms || 0), 0) /
          searchCount
        : 0,
      topProviders: topProvidersFromSearches(searches),
    },
    conversions: {
      totalConversions: conversionCount,
      conversionRate: searchCount ? (conversionCount / searchCount) * 100 : 0,
      totalEstimatedRevenue:
        conversions.reduce((sum, c) => sum + (c.estimated_commission || 0), 0) *
        PENCE_TO_POUNDS,
      averageBookingValue: conversionCount
        ? (conversions.reduce((sum, c) => sum + (c.estimated_price || 0), 0) /
            conversionCount) *
          PENCE_TO_POUNDS
        : 0,
      topProviders: topProvidersFromConversions(conversions),
    },
    providers: providerAnalytics.map((p) => ({
      name: p.provider_name,
      date: p.date,
      clicks: p.total_clicks,
      revenue: (p.estimated_revenue ?? 0) * PENCE_TO_POUNDS,
      conversionRate: p.conversion_rate,
    })),
    daily: dailyBreakdown(sessions, searches, conversions, timeframeDays, now),
    previous: {
      totalSessions: prevSessionCount,
      totalSearches: prevSearchCount,
      totalConversions: prevConversionCount,
      totalEstimatedRevenue: prevRevenue,
      conversionRate: prevConvRate,
      averageBookingValue: prevAvgBooking,
    },
  };
}

function topProvidersFromSearches(
  searches: Array<{ viewed_providers?: string[] | null }>
): Array<{ provider: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const s of searches) {
    if (s.viewed_providers) {
      for (const p of s.viewed_providers) {
        counts[p] = (counts[p] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .map(([provider, count]) => ({ provider, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function topProvidersFromConversions(
  conversions: Array<{
    provider_name: string;
    estimated_commission?: number | null;
  }>
): Array<{ provider: string; count: number; revenue: number }> {
  const stats: Record<string, { count: number; revenue: number }> = {};
  for (const c of conversions) {
    if (!stats[c.provider_name]) {
      stats[c.provider_name] = { count: 0, revenue: 0 };
    }
    stats[c.provider_name].count += 1;
    stats[c.provider_name].revenue += c.estimated_commission || 0;
  }
  return Object.entries(stats)
    .map(([provider, s]) => ({
      provider,
      count: s.count,
      revenue: s.revenue * PENCE_TO_POUNDS,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function dailyBreakdown(
  sessions: Array<{ started_at: string }>,
  searches: Array<{ searched_at: string }>,
  conversions: Array<{
    clicked_at: string;
    estimated_commission?: number | null;
  }>,
  days: number,
  now: Date
) {
  // Bucket by UTC calendar day to match the Supabase rows (which are stored as
  // UTC ISO strings). Using server-local `new Date()` here risked splitting a
  // UTC day across two local buckets near midnight.
  const out: PlayScannerAnalytics['daily'] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayConversions = conversions.filter((c) =>
      c.clicked_at.startsWith(dateStr)
    );
    out.unshift({
      date: dateStr,
      sessions: sessions.filter((s) => s.started_at.startsWith(dateStr)).length,
      searches: searches.filter((s) => s.searched_at.startsWith(dateStr))
        .length,
      conversions: dayConversions.length,
      revenue:
        dayConversions.reduce(
          (sum, c) => sum + (c.estimated_commission || 0),
          0
        ) * PENCE_TO_POUNDS,
    });
  }
  return out;
}
