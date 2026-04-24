'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SearchResultsProps,
  CourtSlot,
  PROVIDER_CONFIG,
} from '@/lib/playscanner/types';
import {
  ListIcon,
  MapIcon,
  SlidersHorizontalIcon,
  SearchIcon,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import MapView from './MapView';
import VenueCard, { groupSlotsByVenue } from './VenueCard';
import BookingConfirm from './BookingConfirm';
import SportIcon from './SportIcon';
import { TIME_CHIPS } from './QuickFilters';
import { ProviderRequestGotcha } from './ProviderRequestGotcha';

type ViewMode = 'list' | 'map';

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export default function SearchResults({
  results,
  isLoading,
  sport,
  error,
  onConversion,
}: SearchResultsProps) {
  // Responsive: bottom sheet on mobile, right panel on desktop
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCount, setShowCount] = useState(15);
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);
  const [activeTimeFilter, setActiveTimeFilter] = useState<string | null>(null);
  const [showIndoor, setShowIndoor] = useState(false);
  const [showDropIn, setShowDropIn] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(
    new Set()
  );
  const [selectedVenues, setSelectedVenues] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number] | null>(null);
  const [venueSearch, setVenueSearch] = useState('');

  // Derive available providers and venues from results
  const availableProviders = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach((s) => {
      map.set(s.provider, (map.get(s.provider) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count }));
  }, [results]);

  const availableVenues = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    results.forEach((s) => {
      const key = s.venue.id;
      if (!map.has(key)) {
        map.set(key, { name: s.venue.name, count: 0 });
      }
      map.get(key)!.count++;
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([id, { name, count }]) => ({ id, name, count }));
  }, [results]);

  const priceMin = useMemo(() => {
    const prices = results.map((s) => s.price).filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [results]);

  const priceMax = useMemo(() => {
    const prices = results.map((s) => s.price).filter((p) => p > 0);
    return prices.length > 0 ? Math.max(...prices) : 10000;
  }, [results]);

  const timeMin = useMemo(() => {
    const hours = results.map((s) => new Date(s.startTime).getHours());
    return hours.length > 0 ? Math.min(...hours) : 0;
  }, [results]);

  const timeMax = useMemo(() => {
    const hours = results.map((s) => new Date(s.startTime).getHours() + 1);
    return hours.length > 0 ? Math.max(...hours) : 24;
  }, [results]);

  // Count active advanced filters
  const activeFilterCount =
    (selectedProviders.size > 0 ? 1 : 0) +
    (selectedVenues.size > 0 ? 1 : 0) +
    (priceRange ? 1 : 0) +
    (timeRange ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedProviders(new Set());
    setSelectedVenues(new Set());
    setPriceRange(null);
    setTimeRange(null);
    setActiveTimeFilter(null);
    setShowIndoor(false);
    setShowDropIn(false);
  };

  // Filter results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Time-of-day filter (chip or slider - mutually exclusive)
    if (activeTimeFilter) {
      const chip = TIME_CHIPS.find((t) => t.id === activeTimeFilter);
      if (chip) {
        filtered = filtered.filter((slot) => {
          const hour = new Date(slot.startTime).getHours();
          return hour >= chip.range[0] && hour < chip.range[1];
        });
      }
    } else if (timeRange) {
      filtered = filtered.filter((slot) => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= timeRange[0] && hour < timeRange[1];
      });
    }

    if (showIndoor) {
      filtered = filtered.filter((slot) => slot.features?.indoor);
    }

    if (showDropIn) {
      filtered = filtered.filter((slot) => slot.listingType === 'drop_in');
    }

    // Provider filter
    if (selectedProviders.size > 0) {
      filtered = filtered.filter((slot) =>
        selectedProviders.has(slot.provider)
      );
    }

    // Venue filter
    if (selectedVenues.size > 0) {
      filtered = filtered.filter((slot) => selectedVenues.has(slot.venue.id));
    }

    // Price filter
    if (priceRange) {
      filtered = filtered.filter(
        (slot) => slot.price >= priceRange[0] && slot.price <= priceRange[1]
      );
    }

    return filtered;
  }, [
    results,
    activeTimeFilter,
    showIndoor,
    showDropIn,
    selectedProviders,
    selectedVenues,
    priceRange,
    timeRange,
  ]);

  const venueGroups = useMemo(
    () => groupSlotsByVenue(filteredResults),
    [filteredResults]
  );

  const displayedGroups = venueGroups.slice(0, showCount);
  const hasMore = venueGroups.length > showCount;

  const handleBook = useCallback((slot: CourtSlot) => {
    setSelectedSlot(slot);
  }, []);

  // Stats
  const stats = useMemo(() => {
    if (filteredResults.length === 0) return null;
    const cheapest = Math.min(...filteredResults.map((s) => s.price));
    const providers = [...new Set(filteredResults.map((s) => s.provider))];
    const timestamps = filteredResults
      .map((r) => r.collectedAt)
      .filter(Boolean)
      .map((t) => new Date(t!).getTime());
    const ageMin =
      timestamps.length > 0
        ? Math.floor((Date.now() - Math.max(...timestamps)) / 60000)
        : null;
    return { cheapest, providers, ageMin };
  }, [filteredResults]);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Control bar skeleton */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-7 w-20 animate-pulse rounded-full bg-[rgba(214,213,201,0.04)]"
            />
          ))}
          <div className="ml-auto h-7 w-7 animate-pulse rounded-md bg-[rgba(214,213,201,0.04)]" />
        </div>
        {/* Card skeletons */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-line bg-[rgba(214,213,201,0.02)] p-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-[rgba(214,213,201,0.06)]" />
                <div className="h-3 w-56 rounded bg-[rgba(214,213,201,0.04)]" />
              </div>
              <div className="h-5 w-14 rounded bg-[rgba(214,213,201,0.06)]" />
            </div>
            <div className="mt-3 flex gap-1.5">
              {[...Array(5)].map((_, j) => (
                <div
                  key={j}
                  className="h-8 w-16 rounded-lg bg-[rgba(214,213,201,0.04)]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[rgba(237,106,106,0.22)] bg-[rgba(237,106,106,0.05)] p-6 text-center">
        <p className="text-[rgb(237,106,106)]">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-full border border-line-strong px-4 py-2 text-sm text-ink-muted hover:text-timberwolf hover:border-timberwolf/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night"
        >
          Try again
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    const labels: Record<string, string> = {
      football: 'football pitches',
      tennis: 'tennis courts',
      padel: 'padel courts',
      basketball: 'basketball courts',
    };
    return (
      <div className="rounded-xl border border-line-strong bg-[rgba(214,213,201,0.02)] p-10 text-center">
        <div className="mb-3 flex justify-center text-ink-muted">
          <SportIcon
            sport={sport as 'padel' | 'football' | 'tennis' | 'basketball'}
            size={40}
          />
        </div>
        <h3 className="text-base font-display font-semibold text-timberwolf mb-1">
          No {labels[sport] || 'courts'} for this day
        </h3>
        <p className="text-sm text-ink-muted max-w-[40ch] mx-auto">
          Try a different date, switch sport, or let us know which provider
          you&rsquo;d like to see covered.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <ProviderRequestGotcha />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ─── Control bar ─── */}
      <div className="space-y-2">
        {/* Row 1: Filters button + stats + view toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className={`relative rounded-lg border px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeFilterCount > 0
                ? 'border-[rgba(214,213,201,0.4)] bg-[rgba(214,213,201,0.1)] text-timberwolf'
                : 'border-line-strong bg-[rgba(214,213,201,0.03)] text-ink-muted hover:border-line-strong hover:text-timberwolf'
            }`}
          >
            <SlidersHorizontalIcon className="h-3 w-3" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-timberwolf text-[10px] font-bold text-night">
                {activeFilterCount}
              </span>
            )}
          </button>

          <ProviderRequestGotcha />

          <div className="ml-auto flex items-center gap-2">
            {stats && (
              <span className="text-[11px] text-ink-subtle tabular-nums">
                <span className="sm:hidden">{venueGroups.length}v</span>
                <span className="hidden sm:inline">
                  {venueGroups.length} venues
                </span>
                {stats.cheapest > 0 && (
                  <>
                    <span className="sm:hidden">
                      {' · £'}
                      {(stats.cheapest / 100).toFixed(0)}
                    </span>
                    <span className="hidden sm:inline">
                      {' · from £'}
                      {(stats.cheapest / 100).toFixed(0)}
                    </span>
                  </>
                )}
                {stats.ageMin !== null && (
                  <>
                    {' · '}
                    <span
                      className={
                        stats.ageMin < 10
                          ? 'text-[rgb(120,196,140)]'
                          : stats.ageMin < 30
                            ? 'text-[rgb(224,173,98)]'
                            : 'text-[rgb(214,151,98)]'
                      }
                    >
                      {stats.ageMin < 1 ? 'live' : `${stats.ageMin}m`}
                    </span>
                  </>
                )}
              </span>
            )}
            <div className="flex items-center gap-0.5 rounded-lg border border-line-strong p-0.5">
              <button
                onClick={() => {
                  setViewMode('list');
                }}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-[rgba(214,213,201,0.1)] text-timberwolf' : 'text-ink-subtle hover:text-ink-muted'}`}
              >
                <ListIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setViewMode('map');
                }}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'map' ? 'bg-[rgba(214,213,201,0.1)] text-timberwolf' : 'text-ink-subtle hover:text-ink-muted'}`}
              >
                <MapIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Quick time + sport-specific chips */}
        <div className="flex items-center gap-1.5">
          {TIME_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => {
                setActiveTimeFilter((prev) =>
                  prev === chip.id ? null : chip.id
                );
                setTimeRange(null);
              }}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all text-center ${
                activeTimeFilter === chip.id
                  ? 'border-[rgba(214,213,201,0.4)] bg-[rgba(214,213,201,0.1)] text-timberwolf'
                  : 'border-line-strong bg-[rgba(214,213,201,0.03)] text-ink-muted hover:border-line-strong hover:text-timberwolf'
              }`}
            >
              {chip.label}
            </button>
          ))}
          {(sport === 'padel' || sport === 'tennis') && (
            <button
              onClick={() => setShowIndoor(!showIndoor)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all text-center ${
                showIndoor
                  ? 'border-[rgba(214,213,201,0.4)] bg-[rgba(214,213,201,0.1)] text-timberwolf'
                  : 'border-line-strong bg-[rgba(214,213,201,0.03)] text-ink-muted hover:border-line-strong hover:text-timberwolf'
              }`}
            >
              Indoor
            </button>
          )}
          {sport === 'football' && (
            <button
              onClick={() => setShowDropIn(!showDropIn)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all text-center ${
                showDropIn
                  ? 'border-[rgba(214,213,201,0.4)] bg-[rgba(214,213,201,0.1)] text-timberwolf'
                  : 'border-line-strong bg-[rgba(214,213,201,0.03)] text-ink-muted hover:border-line-strong hover:text-timberwolf'
              }`}
            >
              Drop-in
            </button>
          )}
        </div>
      </div>

      {/* ─── Filter Sheet - bottom on mobile, right on desktop ─── */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={`border-line bg-[#0a100d] ${
            isMobile
              ? 'max-h-[70vh] rounded-t-2xl overflow-y-auto'
              : 'w-[360px] sm:max-w-[360px] overflow-y-auto'
          }`}
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-timberwolf flex items-center justify-between">
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-normal text-ink-muted hover:text-timberwolf transition-colors"
                >
                  Clear all
                </button>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Filter search results by price, provider, and venue
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* ── Price range ── */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">
                Price range
              </h4>
              <div className="px-1">
                <Slider
                  value={priceRange || [priceMin, priceMax]}
                  onValueChange={(v) => {
                    // If slider is at full range, treat as no filter
                    if (v[0] <= priceMin && v[1] >= priceMax)
                      setPriceRange(null);
                    else setPriceRange([v[0], v[1]]);
                  }}
                  min={priceMin}
                  max={priceMax}
                  step={100}
                />
                <div className="flex justify-between mt-2 text-xs text-ink-muted">
                  <span>
                    £{((priceRange?.[0] ?? priceMin) / 100).toFixed(0)}
                  </span>
                  <span>
                    £{((priceRange?.[1] ?? priceMax) / 100).toFixed(0)}
                  </span>
                </div>
              </div>
              {priceRange && (
                <button
                  onClick={() => setPriceRange(null)}
                  className="mt-1 text-[11px] text-ink-subtle hover:text-timberwolf transition-colors"
                >
                  Reset price
                </button>
              )}
            </div>

            {/* ── Time range ── */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">
                Time range
              </h4>
              <div className="px-1">
                <Slider
                  value={timeRange || [timeMin, timeMax]}
                  onValueChange={(v) => {
                    if (v[0] <= timeMin && v[1] >= timeMax) setTimeRange(null);
                    else {
                      setTimeRange([v[0], v[1]]);
                      setActiveTimeFilter(null);
                    }
                  }}
                  min={timeMin}
                  max={timeMax}
                  step={1}
                />
                <div className="flex justify-between mt-2 text-xs text-ink-muted">
                  <span>{formatHour(timeRange?.[0] ?? timeMin)}</span>
                  <span>{formatHour(timeRange?.[1] ?? timeMax)}</span>
                </div>
              </div>
              {timeRange && (
                <button
                  onClick={() => setTimeRange(null)}
                  className="mt-1 text-[11px] text-ink-subtle hover:text-timberwolf transition-colors"
                >
                  Reset time
                </button>
              )}
            </div>

            {/* ── Providers ── */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">
                Providers
              </h4>
              <div className="space-y-1">
                {availableProviders.map(({ id, count }) => {
                  const config = PROVIDER_CONFIG[id];
                  const isSelected = selectedProviders.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setSelectedProviders((prev) => {
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        });
                      }}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                        isSelected
                          ? 'border-[rgba(214,213,201,0.3)] bg-[rgba(214,213,201,0.05)] text-timberwolf'
                          : 'border-line bg-[rgba(214,213,201,0.02)] text-ink-muted hover:border-line-strong hover:text-timberwolf'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: config?.color || '#666' }}
                        />
                        <span className="text-xs font-medium">
                          {config?.displayName || id}
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-subtle">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedProviders.size > 0 && (
                <button
                  onClick={() => setSelectedProviders(new Set())}
                  className="mt-1 text-[11px] text-ink-subtle hover:text-timberwolf transition-colors"
                >
                  Clear providers
                </button>
              )}
            </div>

            {/* ── Venues ── */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">
                Venues ({availableVenues.length})
              </h4>
              {availableVenues.length > 8 && (
                <div className="relative mb-2">
                  <SearchIcon className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-subtle" />
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search venues..."
                    className="w-full rounded-lg border border-line bg-[rgba(214,213,201,0.03)] py-1.5 pl-8 pr-3 text-xs text-timberwolf placeholder:text-ink-subtle focus:border-line-strong focus:outline-none"
                  />
                </div>
              )}
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {availableVenues
                  .filter((v) =>
                    venueSearch
                      ? v.name.toLowerCase().includes(venueSearch.toLowerCase())
                      : true
                  )
                  .map(({ id, name, count }) => {
                    const isSelected = selectedVenues.has(id);
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedVenues((prev) => {
                            const next = new Set(prev);
                            if (next.has(id)) next.delete(id);
                            else next.add(id);
                            return next;
                          });
                        }}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                          isSelected
                            ? 'border-[rgba(214,213,201,0.3)] bg-[rgba(214,213,201,0.05)] text-timberwolf'
                            : 'border-line bg-[rgba(214,213,201,0.02)] text-ink-muted hover:border-line-strong hover:text-timberwolf'
                        }`}
                      >
                        <span className="text-xs font-medium truncate mr-2">
                          {name}
                        </span>
                        <span className="text-[11px] text-ink-subtle shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
              {selectedVenues.size > 0 && (
                <button
                  onClick={() => setSelectedVenues(new Set())}
                  className="mt-1 text-[11px] text-ink-subtle hover:text-timberwolf transition-colors"
                >
                  Clear venues
                </button>
              )}
            </div>
          </div>

          {/* Apply / results count footer */}
          <div className="sticky bottom-0 mt-6 pt-4 border-t border-line bg-[#0a100d]">
            <button
              onClick={() => {
                setFilterOpen(false);
              }}
              className="w-full rounded-lg bg-timberwolf py-2.5 text-sm font-semibold text-night hover:bg-ash-grey transition-colors"
            >
              Show {filteredResults.length} results
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Results ─── */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MapView
              results={filteredResults}
              sport={sport}
              onSlotSelect={handleBook}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {displayedGroups.map((group, i) => (
              <motion.div
                key={`${group.venueId}-${group.provider}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <VenueCard group={group} onBook={handleBook} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show more */}
      {hasMore && viewMode !== 'map' && (
        <div className="flex justify-center pt-1">
          <button
            onClick={() => setShowCount((p) => p + 10)}
            className="rounded-full border border-line px-5 py-2 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-timberwolf"
          >
            Show more ({venueGroups.length - showCount} remaining)
          </button>
        </div>
      )}

      {/* Booking confirmation */}
      {selectedSlot && (
        <BookingConfirm
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onConversion={onConversion}
        />
      )}
    </div>
  );
}
