'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import posthog from 'posthog-js';
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
    const prices = results.map((s) => s.price);
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
    posthog.capture('playscanner_slot_selected', {
      provider: slot.provider,
      sport: slot.sport,
      venue_id: slot.venue.id,
      venue_name: slot.venue.name,
      price_pence: slot.price,
      currency: slot.currency,
      start_time: slot.startTime,
      listing_type: slot.listingType,
    });
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
              className="h-7 w-20 animate-pulse rounded-full bg-white/[0.04]"
            />
          ))}
          <div className="ml-auto h-7 w-7 animate-pulse rounded-md bg-white/[0.04]" />
        </div>
        {/* Card skeletons */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-white/[0.06]" />
                <div className="h-3 w-56 rounded bg-white/[0.04]" />
              </div>
              <div className="h-5 w-14 rounded bg-white/[0.06]" />
            </div>
            <div className="mt-3 flex gap-1.5">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-8 w-16 rounded-lg bg-white/[0.04]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-6 text-center">
        <p className="text-red-400">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          Try Again
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
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
        <div className="mb-3 flex justify-center text-gray-600">
          <SportIcon
            sport={sport as 'padel' | 'football' | 'tennis' | 'basketball'}
            size={40}
          />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          No {labels[sport] || 'courts'} available
        </h3>
        <p className="text-sm text-gray-500">
          Try a different date or check back later
        </p>
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
                ? 'border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]'
                : 'border-white/[0.1] bg-white/[0.03] text-gray-400 hover:border-white/[0.2] hover:text-white'
            }`}
          >
            <SlidersHorizontalIcon className="h-3 w-3" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#00FF88] text-[10px] font-bold text-[#0a100d]">
                {activeFilterCount}
              </span>
            )}
          </button>

          <ProviderRequestGotcha />

          <div className="ml-auto flex items-center gap-2">
            {stats && (
              <span className="hidden sm:inline text-[11px] text-gray-600">
                {venueGroups.length} venues
                {stats.cheapest > 0 &&
                  ` · from £${(stats.cheapest / 100).toFixed(0)}`}
                {stats.ageMin !== null && (
                  <>
                    {' · '}
                    <span
                      className={
                        stats.ageMin < 10
                          ? 'text-green-500'
                          : stats.ageMin < 30
                            ? 'text-yellow-500'
                            : 'text-amber-500'
                      }
                    >
                      {stats.ageMin < 1 ? 'just now' : `${stats.ageMin}m ago`}
                    </span>
                  </>
                )}
              </span>
            )}
            <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.1] p-0.5">
              <button
                onClick={() => {
                  if (viewMode !== 'list') {
                    posthog.capture('playscanner_view_mode_changed', {
                      view_mode: 'list',
                      sport,
                    });
                  }
                  setViewMode('list');
                }}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <ListIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (viewMode !== 'map') {
                    posthog.capture('playscanner_view_mode_changed', {
                      view_mode: 'map',
                      sport,
                    });
                  }
                  setViewMode('map');
                }}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'map' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}
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
                  ? 'border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]'
                  : 'border-white/[0.1] bg-white/[0.03] text-gray-400 hover:border-white/[0.2] hover:text-white'
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
                  ? 'border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]'
                  : 'border-white/[0.1] bg-white/[0.03] text-gray-400 hover:border-white/[0.2] hover:text-white'
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
                  ? 'border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]'
                  : 'border-white/[0.1] bg-white/[0.03] text-gray-400 hover:border-white/[0.2] hover:text-white'
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
          className={`border-white/[0.08] bg-[#0a100d] ${
            isMobile
              ? 'max-h-[70vh] rounded-t-2xl overflow-y-auto'
              : 'w-[360px] sm:max-w-[360px] overflow-y-auto'
          }`}
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-white flex items-center justify-between">
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-normal text-gray-500 hover:text-white transition-colors"
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
              <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
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
                <div className="flex justify-between mt-2 text-xs text-gray-400">
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
                  className="mt-1 text-[11px] text-gray-600 hover:text-white transition-colors"
                >
                  Reset price
                </button>
              )}
            </div>

            {/* ── Time range ── */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
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
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{formatHour(timeRange?.[0] ?? timeMin)}</span>
                  <span>{formatHour(timeRange?.[1] ?? timeMax)}</span>
                </div>
              </div>
              {timeRange && (
                <button
                  onClick={() => setTimeRange(null)}
                  className="mt-1 text-[11px] text-gray-600 hover:text-white transition-colors"
                >
                  Reset time
                </button>
              )}
            </div>

            {/* ── Providers ── */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
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
                          ? 'border-[#00FF88]/30 bg-[#00FF88]/5 text-white'
                          : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.12] hover:text-white'
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
                      <span className="text-[11px] text-gray-600">{count}</span>
                    </button>
                  );
                })}
              </div>
              {selectedProviders.size > 0 && (
                <button
                  onClick={() => setSelectedProviders(new Set())}
                  className="mt-1 text-[11px] text-gray-600 hover:text-white transition-colors"
                >
                  Clear providers
                </button>
              )}
            </div>

            {/* ── Venues ── */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                Venues ({availableVenues.length})
              </h4>
              {availableVenues.length > 8 && (
                <div className="relative mb-2">
                  <SearchIcon className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search venues..."
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-gray-600 focus:border-white/[0.2] focus:outline-none"
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
                            ? 'border-[#00FF88]/30 bg-[#00FF88]/5 text-white'
                            : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.12] hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-medium truncate mr-2">
                          {name}
                        </span>
                        <span className="text-[11px] text-gray-600 shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
              {selectedVenues.size > 0 && (
                <button
                  onClick={() => setSelectedVenues(new Set())}
                  className="mt-1 text-[11px] text-gray-600 hover:text-white transition-colors"
                >
                  Clear venues
                </button>
              )}
            </div>
          </div>

          {/* Apply / results count footer */}
          <div className="sticky bottom-0 mt-6 pt-4 border-t border-white/[0.06] bg-[#0a100d]">
            <button
              onClick={() => {
                if (activeFilterCount > 0) {
                  posthog.capture('playscanner_filter_applied', {
                    sport,
                    provider_count: selectedProviders.size,
                    venue_count: selectedVenues.size,
                    has_price_filter: priceRange !== null,
                    has_time_filter: timeRange !== null,
                    result_count: filteredResults.length,
                  });
                }
                setFilterOpen(false);
              }}
              className="w-full rounded-lg bg-[#00FF88] py-2.5 text-sm font-semibold text-[#0a100d] hover:bg-[#00E077] transition-colors"
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
            <MapView results={filteredResults} sport={sport} />
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
            className="rounded-full border border-white/[0.06] px-5 py-2 text-xs text-gray-500 transition-colors hover:border-white/[0.12] hover:text-gray-300"
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
