'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import SearchResults from './SearchResults';
import SportIcon from './SportIcon';
import { MapPinIcon } from 'lucide-react';
import { Sport, CourtSlot } from '@/lib/playscanner/types';
import { playscannerAnalytics } from '@/lib/playscanner/analytics';
import posthog from 'posthog-js';

/* ── Date helpers ─────────────────────────────────────── */
const DATES = (() => {
  const dates: { label: string; shortLabel: string; value: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
            });
    const shortLabel =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Tmrw'
          : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
    dates.push({ label, shortLabel, value });
  }
  return dates;
})();

const SPORTS: { id: Sport; label: string }[] = [
  { id: 'football', label: 'Football' },
  { id: 'padel', label: 'Padel' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'tennis', label: 'Tennis' },
];

/* ── Component ────────────────────────────────────────── */
export default function PLAYScannerMain() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlSport = (searchParams.get('sport') as Sport) || 'padel';
  const urlDate = searchParams.get('date') || DATES[0].value;

  const [sport, setSport] = useState<Sport>(
    SPORTS.some((s) => s.id === urlSport) ? urlSport : 'padel'
  );
  const [date, setDate] = useState(
    DATES.some((d) => d.value === urlDate) ? urlDate : DATES[0].value
  );
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CourtSlot[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);

  /* Analytics */
  useEffect(() => {
    playscannerAnalytics.initSession().then(() => {
      playscannerAnalytics.trackPageView('search');
    });
    const cleanup = () => playscannerAnalytics.endSession();
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  /* Search */
  const search = useCallback(async (s: Sport, d: string) => {
    setIsSearching(true);
    setError(null);
    const t0 = Date.now();
    try {
      const res = await fetch('/api/playscanner/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: s,
          location: 'London',
          date: d,
          cached: true,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const providers = [
        ...new Set((data.results || []).map((r: CourtSlot) => r.provider)),
      ] as string[];
      const sid = await playscannerAnalytics.trackSearch(
        { sport: s, location: 'London', date: d },
        data.results?.length || 0,
        Date.now() - t0,
        providers
      );
      setSearchId(sid);
      setResults(data.results || []);
      setHasSearched(true);
      posthog.capture('playscanner_search_performed', {
        sport: s,
        date: d,
        location: 'London',
        result_count: data.results?.length || 0,
        providers,
        duration_ms: Date.now() - t0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  /* Auto-search + URL sync */
  useEffect(() => {
    const p = new URLSearchParams();
    p.set('sport', sport);
    p.set('date', date);
    router.replace(`/playscanner?${p.toString()}`, { scroll: false });
    search(sport, date);
  }, [sport, date, search, router]);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="relative z-20 mx-auto max-w-5xl px-4">
      {/* ━━━ Unified search bar ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-3 pb-2 bg-[var(--night)]/[.97] backdrop-blur-lg">
        {/* Brand + Search controls — one unified bar */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2 space-y-2">
          {/* Desktop: single row — dates left, sports+location right */}
          {/* Mobile: two rows — sports+location on top, dates below */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
            <div className="flex items-center justify-evenly sm:justify-start gap-1 overflow-x-auto no-visible-scrollbar">
              {DATES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => {
                    if (d.value !== date) {
                      posthog.capture('playscanner_date_changed', {
                        date: d.value,
                        sport,
                      });
                    }
                    setDate(d.value);
                  }}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    date === d.value
                      ? 'bg-white/[0.12] text-white'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-white/[0.06] sm:hidden" />

            <div className="flex items-center sm:justify-end gap-1.5 shrink-0">
              <div className="flex items-center rounded-xl bg-white/[0.04] p-0.5 shrink-0">
                {SPORTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (s.id !== sport) {
                        posthog.capture('playscanner_sport_changed', {
                          sport: s.id,
                          previous_sport: sport,
                          date,
                        });
                      }
                      setSport(s.id);
                    }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      sport === s.id
                        ? 'bg-[#00FF88] text-[#0a100d] shadow-sm shadow-[#00FF88]/20'
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    <SportIcon sport={s.id} size={12} />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-white sm:hidden">
                {SPORTS.find((s) => s.id === sport)?.label}
              </span>
              <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-gray-500 ml-auto sm:ml-0">
                <MapPinIcon className="h-3 w-3" />
                London
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ Results ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="pt-2 pb-8">
        {(hasSearched || isSearching) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <SearchResults
              results={results}
              isLoading={isSearching}
              sport={sport}
              error={error ? { code: 'ERR', message: error } : undefined}
              onConversion={(slot) => {
                playscannerAnalytics.trackConversion(
                  {
                    provider_name: slot.provider,
                    venue_name: slot.venue.name,
                    venue_location: slot.venue.location?.city || '',
                    booking_url: slot.bookingUrl || '',
                    estimated_price: slot.price,
                    sport,
                    estimated_commission: slot.price ? slot.price * 0.05 : 0,
                    commission_rate: 5,
                  },
                  searchId || undefined
                );
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
