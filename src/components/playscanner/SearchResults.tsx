'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@braintwopoint0/playback-commons/ui';
import { SearchResultsProps, CourtSlot } from '@/lib/playscanner/types';
import { ListIcon, MapIcon } from 'lucide-react';
import MapView from './MapView';
import FilterPanel, { FilterState } from './filters/FilterPanel';
import VenueCard, { groupSlotsByVenue } from './VenueCard';
import SkeletonCard from './SkeletonCard';
import BookingConfirm from './BookingConfirm';
import SportIcon from './SportIcon';

type ViewMode = 'list' | 'map';

export default function SearchResults({
  results,
  isLoading,
  sport,
  error,
  onConversion,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCount, setShowCount] = useState(15);
  const [sortMode, setSortMode] = useState<'soonest' | 'cheapest'>('soonest');
  const [filters, setFilters] = useState<FilterState>({});
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);

  const isFootball = sport === 'football';

  // Filter results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    if (filters.timeRange) {
      filtered = filtered.filter((slot) => {
        const slotTime = new Date(slot.startTime);
        const slotMinutes = slotTime.getHours() * 60 + slotTime.getMinutes();
        const [startH, startM] = filters
          .timeRange!.start.split(':')
          .map(Number);
        const [endH, endM] = filters.timeRange!.end.split(':').map(Number);
        return (
          slotMinutes >= startH * 60 + startM && slotMinutes <= endH * 60 + endM
        );
      });
    }

    if (filters.priceRange) {
      filtered = filtered.filter(
        (slot) =>
          slot.price >= filters.priceRange!.min &&
          slot.price <= filters.priceRange!.max
      );
    }

    if (filters.selectedVenues?.length) {
      filtered = filtered.filter((slot) =>
        filters.selectedVenues!.includes(slot.venue.name)
      );
    }

    if (filters.selectedProviders?.length) {
      filtered = filtered.filter((slot) =>
        filters.selectedProviders!.includes(slot.provider)
      );
    }

    return filtered;
  }, [results, filters]);

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...filteredResults];
    if (sortMode === 'cheapest') {
      sorted.sort((a, b) => a.price - b.price);
    } else {
      sorted.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    }
    return sorted;
  }, [filteredResults, sortMode]);

  // Group by venue for display
  const venueGroups = useMemo(
    () => groupSlotsByVenue(sortedResults),
    [sortedResults]
  );

  const displayedGroups = venueGroups.slice(0, showCount);
  const hasMore = venueGroups.length > showCount;

  // Booking handler — opens confirmation overlay
  const handleBook = useCallback((slot: CourtSlot) => {
    setSelectedSlot(slot);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.02]"
            />
          ))}
        </div>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} delay={i * 100} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-6 text-center">
        <p className="text-red-400">{error.message}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
        <div className="mb-4 flex justify-center text-gray-500">
          <SportIcon sport={sport as 'padel' | 'football'} size={48} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No {isFootball ? 'football pitches' : 'padel courts'} found
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Try a different date or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Count + Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-semibold text-white">
            {venueGroups.length} {venueGroups.length === 1 ? 'venue' : 'venues'}
          </h3>
          <span className="text-sm text-gray-500">
            {filteredResults.length} slots
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Row 2: Sort + View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] p-0.5 text-xs">
          <button
            onClick={() => setSortMode('soonest')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              sortMode === 'soonest'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Soonest
          </button>
          <button
            onClick={() => setSortMode('cheapest')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              sortMode === 'cheapest'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Cheapest
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'map'
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <MapIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        sport={sport}
        filters={filters}
        onFiltersChange={setFilters}
        searchResults={results}
      />

      {/* Results */}
      {viewMode === 'map' ? (
        <MapView results={sortedResults} sport={sport} />
      ) : (
        <div className="space-y-3">
          {displayedGroups.map((group) => (
            <VenueCard
              key={`${group.venueId}-${group.provider}`}
              group={group}
              onBook={handleBook}
            />
          ))}
        </div>
      )}

      {/* Show More */}
      {hasMore && viewMode !== 'map' && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowCount((p) => p + 10)}
            className="rounded-lg border border-white/[0.08] px-6 py-2.5 text-sm text-gray-400 transition-colors hover:border-white/[0.15] hover:text-white"
          >
            Show more ({venueGroups.length - showCount} remaining)
          </button>
        </div>
      )}

      {/* Booking confirmation overlay */}
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
