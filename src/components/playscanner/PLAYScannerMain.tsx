'use client';

import {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import SearchResults from './SearchResults';
import SportIcon from './SportIcon';
import { MapPinIcon } from 'lucide-react';
import { Sport, CourtSlot } from '@/lib/playscanner/types';
import { playscannerAnalytics } from '@/lib/playscanner/analytics';

/* ── Date helpers ─────────────────────────────────────── */
// Formats a Date as YYYY-MM-DD in the user's LOCAL timezone.
// toISOString() would serialise in UTC, which can shift the day (and trip the
// server's "date cannot be in the past" check) for users east of UTC.
function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DATES = (() => {
  const dates: { label: string; shortLabel: string; value: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = toLocalISODate(d);
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
  const reduceMotion = useReducedMotion();

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  /* URL sync — runs on every sport/date change. router is intentionally not in
     deps; App Router re-creates the router instance on render and listing it
     would loop the effect and hammer /api/playscanner/search. */
  useEffect(() => {
    const p = new URLSearchParams();
    p.set('sport', sport);
    p.set('date', date);
    router.replace(`/playscanner?${p.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, date]);

  /* Auto-search — separate effect so URL sync doesn't re-trigger fetches. */
  useEffect(() => {
    search(sport, date);
  }, [sport, date, search]);

  /* Sport-selector chip geometry — measure the active button's
     container-relative offsetLeft / offsetWidth and animate a single shared
     chip element to match. Container-relative coordinates stay correct
     regardless of sticky positioning or scroll, unlike Framer's layoutId
     which captures viewport rects and breaks once the bar is stuck.
     ResizeObserver tracks the button's mobile-label expansion so the chip
     width grows in step with the button. */
  const sportSelectorRef = useRef<HTMLDivElement | null>(null);
  const [sportChipRect, setSportChipRect] = useState<{
    x: number;
    w: number;
  } | null>(null);
  useLayoutEffect(() => {
    const container = sportSelectorRef.current;
    if (!container) return;
    const findActive = () =>
      container.querySelector<HTMLButtonElement>(
        `button[data-sport="${sport}"]`
      );
    const measure = () => {
      const btn = findActive();
      if (!btn || btn.offsetWidth === 0) return;
      setSportChipRect({ x: btn.offsetLeft, w: btn.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    for (const btn of container.querySelectorAll('button')) ro.observe(btn);
    return () => ro.disconnect();
  }, [sport]);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="relative z-20 mx-auto max-w-5xl px-4">
      {/* ━━━ Context header ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="pt-6 pb-3 sm:pt-8 sm:pb-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-[rgb(224,173,98)] shadow-[0_0_8px_rgba(224,173,98,0.55)]"
          />
          PLAYSCANNER - London
        </div>
        <h1 className="mt-2 font-display font-semibold text-[clamp(24px,3.4vw,34px)] leading-[1.1] tracking-[-0.02em] text-timberwolf">
          One search. Every slot.
        </h1>
        <p className="mt-1.5 max-w-[52ch] text-[13px] sm:text-[14px] leading-[1.5] text-ink-muted">
          Aggregating 10+ providers - Playtomic, MATCHi, PowerLeague, Goals,
          Footy Addicts and more. Data refreshes every 15 minutes.
        </p>
      </header>

      {/* ━━━ Unified search bar ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* top offset tracks NavBar's --chrome-h (banner + header). -16px
          matches the navbar's height shrink on scroll so no gap appears. */}
      <div
        style={{ top: 'calc(var(--chrome-h, 112px) - 16px)' }}
        className="sticky z-30 -mx-4 px-4 pt-3 pb-2 bg-[var(--night)]/[.97] backdrop-blur-lg"
      >
        {/* Brand + Search controls - one unified bar */}
        <div
          className={`rounded-2xl border bg-[rgba(214,213,201,0.025)] p-2 space-y-2 transition-colors ${
            isSearching ? 'border-[rgba(214,213,201,0.22)]' : 'border-line'
          }`}
        >
          {/* Desktop: single row - dates left, sports+location right */}
          {/* Mobile: two rows - sports+location on top, dates below */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
            <div className="flex items-center justify-start gap-1 overflow-x-auto no-visible-scrollbar">
              {DATES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => {
                    setDate(d.value);
                  }}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
                    date === d.value
                      ? 'bg-[rgba(214,213,201,0.12)] text-timberwolf'
                      : 'text-ink-subtle hover:text-ink-muted'
                  }`}
                >
                  <span className="sm:hidden">{d.shortLabel}</span>
                  <span className="hidden sm:inline">{d.label}</span>
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-[rgba(214,213,201,0.06)] sm:hidden" />

            <div className="flex items-center sm:justify-end gap-1.5 shrink-0">
              <div
                ref={sportSelectorRef}
                className="relative flex items-center rounded-xl bg-[rgba(214,213,201,0.04)] p-0.5 shrink-0"
              >
                {sportChipRect && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-lg bg-timberwolf shadow-sm shadow-[0_1px_3px_rgba(214,213,201,0.2)]"
                    initial={false}
                    animate={{
                      x: sportChipRect.x,
                      width: sportChipRect.w,
                    }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 500,
                            damping: 38,
                            mass: 0.8,
                          }
                    }
                  />
                )}
                {SPORTS.map((s) => {
                  const active = sport === s.id;
                  const chipSpring = reduceMotion
                    ? { duration: 0 }
                    : {
                        type: 'spring' as const,
                        stiffness: 500,
                        damping: 38,
                        mass: 0.8,
                      };
                  return (
                    <button
                      key={s.id}
                      data-sport={s.id}
                      onClick={() => {
                        setSport(s.id);
                      }}
                      aria-label={s.label}
                      aria-pressed={active}
                      className="relative flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night"
                    >
                      {/* Text colour rides the SAME spring as the chip so both
                          settle on the exact same frame — no lingering fade
                          after the chip has arrived. */}
                      <motion.span
                        className="relative flex items-center gap-1.5"
                        initial={false}
                        animate={{
                          color: active
                            ? '#0a100d'
                            : 'rgba(214, 213, 201, 0.7)',
                        }}
                        transition={chipSpring}
                      >
                        <SportIcon sport={s.id} size={12} />
                        {/* Desktop: label always visible. */}
                        <span className="hidden sm:inline">{s.label}</span>
                        {/* Mobile: label expands AFTER the chip arrives so the
                            eye reads "chip moved → label appeared" instead of
                            both fighting at once. */}
                        <AnimatePresence initial={false}>
                          {active && (
                            <motion.span
                              key="mobile-label"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : {
                                      duration: 0.22,
                                      ease: [0.32, 0.72, 0, 1],
                                      delay: 0.12,
                                    }
                              }
                              className="sm:hidden overflow-hidden whitespace-nowrap"
                            >
                              {s.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.span>
                    </button>
                  );
                })}
              </div>
              <div
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[rgba(214,213,201,0.04)] px-3 py-1.5 text-xs text-ink-muted ml-auto sm:ml-0"
                title="London only - more cities coming"
              >
                <MapPinIcon className="h-3 w-3" aria-hidden />
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
