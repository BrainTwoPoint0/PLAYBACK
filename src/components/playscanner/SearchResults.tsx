'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchResultsProps, SortBy, CourtSlot } from '@/lib/playscanner/types';
import {
  MapPinIcon,
  ClockIcon,
  PoundSterlingIcon,
  ExternalLinkIcon,
  ListIcon,
  MapIcon,
  ArrowUpDownIcon,
} from 'lucide-react';
import MapView from './MapView';
import FilterPanel, { FilterState } from './filters/FilterPanel';

type ViewMode = 'list' | 'map';

export default function SearchResults({
  results,
  isLoading,
  sport,
  error,
  onConversion,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCount, setShowCount] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>('time-asc');
  const [filters, setFilters] = useState<FilterState>({});

  // Filter results based on selected filters
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Apply time filter
    if (filters.timeRange) {
      filtered = filtered.filter((slot) => {
        const slotTime = new Date(slot.startTime);
        const slotHour = slotTime.getHours();
        const slotMinutes = slotTime.getMinutes();
        const slotTimeValue = slotHour * 60 + slotMinutes;

        const [startHour, startMin] = filters
          .timeRange!.start.split(':')
          .map(Number);
        const [endHour, endMin] = filters.timeRange!.end.split(':').map(Number);
        const startTimeValue = startHour * 60 + startMin;
        const endTimeValue = endHour * 60 + endMin;

        return slotTimeValue >= startTimeValue && slotTimeValue <= endTimeValue;
      });
    }

    // Apply price filter
    if (filters.priceRange) {
      filtered = filtered.filter(
        (slot) =>
          slot.price >= filters.priceRange!.min &&
          slot.price <= filters.priceRange!.max
      );
    }

    // Apply venue filter
    if (filters.selectedVenues && filters.selectedVenues.length > 0) {
      filtered = filtered.filter((slot) => {
        const venueName =
          typeof slot.venue === 'string' ? slot.venue : slot.venue.name;
        return filters.selectedVenues!.includes(venueName);
      });
    }

    return filtered;
  }, [results, filters]);

  // Sort results based on selected option
  const sortedResults = useMemo(() => {
    const sorted = [...filteredResults];

    switch (sortBy) {
      case 'time-asc':
        sorted.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        break;
      case 'time-desc':
        sorted.sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
    }

    return sorted;
  }, [filteredResults, sortBy]);

  // Paginated results for display
  const displayedResults = sortedResults.slice(0, showCount);
  const hasMoreResults = sortedResults.length > showCount;

  const showMoreResults = () => {
    setShowCount((prev) => Math.min(prev + 10, sortedResults.length));
  };

  const ViewModeToggle = () => (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        className="h-8 w-8 p-0"
        title="List view"
      >
        <ListIcon className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('map')}
        className="h-8 w-8 p-0"
        title="Map view"
      >
        <MapIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  const CourtCard = ({ slot, index }: { slot: any; index: number }) => (
    <Card
      key={`${slot.id}-${slot.venue.id}-${slot.startTime}-${index}`}
      className="hover:shadow-md transition-shadow"
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-3">
              <h3 className="text-lg md:text-xl font-semibold text-white mb-1 sm:mb-0">
                {slot.venue.name}
              </h3>
              <Badge variant="outline" className="text-xs w-fit">
                {slot.provider}
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-300">
              {(slot.venue.location?.city || slot.venue.address?.city) && (
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {slot.venue.location?.city || slot.venue.address?.city}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                <span>
                  {new Date(slot.startTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(slot.endTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-row lg:flex-col lg:text-right items-center lg:items-end justify-between lg:justify-start space-x-4 lg:space-x-0 lg:space-y-2">
            <div className="text-xl lg:text-2xl font-bold text-[#00FF88]">
              £{(slot.price / 100).toFixed(2)}
            </div>
            <Button
              onClick={() => {
                onConversion?.(slot);
                window.open(slot.bookingUrl, '_blank');
              }}
              className="flex items-center space-x-2 bg-[#00FF88] hover:bg-[#00E077] text-[#0a100d]"
              size="sm"
            >
              <span>Book</span>
              <ExternalLinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Court/Pitch Details */}
        {((sport === 'padel' &&
          slot.sportMeta &&
          'courtType' in slot.sportMeta) ||
          (sport !== 'padel' && slot.features?.surface)) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {sport === 'padel'
              ? slot.sportMeta &&
                'courtType' in slot.sportMeta && (
                  <Badge variant="secondary" className="text-xs">
                    {slot.sportMeta.courtType.toUpperCase()}
                  </Badge>
                )
              : slot.features?.surface && (
                  <Badge variant="secondary" className="text-xs">
                    {slot.features.surface.toUpperCase()}
                  </Badge>
                )}
          </div>
        )}

        {/* Availability */}
        {(slot.availability?.totalSpots || slot.lastUpdated) && (
          <div className="flex items-center justify-between text-xs text-gray-400">
            {slot.availability?.totalSpots && (
              <div>
                {slot.availability.spotsAvailable || 0} of{' '}
                {slot.availability.totalSpots} spots available
              </div>
            )}
            {slot.lastUpdated && (
              <div>
                Updated{' '}
                {new Date(slot.lastUpdated).toLocaleString('en-GB', {
                  timeZone: 'Europe/London',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Searching for{' '}
            {sport === 'padel' ? 'Padel Courts' : 'Football Pitches'}...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-700 h-32 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Search Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">{error.message}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Results Found</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎾</div>
            <p className="text-gray-300 mb-4">
              No {sport === 'padel' ? 'padel courts' : 'football pitches'} found
              for your search criteria.
            </p>
            <div className="text-sm text-gray-400">
              <p>Try adjusting your search criteria:</p>
              <ul className="mt-2 space-y-1">
                <li>• Search in a different location</li>
                <li>• Try a different date</li>
                <li>• Expand your time range</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>
            Found {filteredResults.length}{' '}
            {sport === 'padel' ? 'Padel Courts' : 'Football Pitches'}
            {filters.timeRange ||
            filters.priceRange ||
            (filters.selectedVenues && filters.selectedVenues.length > 0)
              ? ` (filtered from ${results.length})`
              : ''}
          </CardTitle>
          <div className="flex items-center sm:gap-3 sm:justify-normal justify-between">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <SelectTrigger className="w-[190px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDownIcon className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time-asc">Time: Earliest</SelectItem>
                <SelectItem value="time-desc">Time: Latest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <ViewModeToggle />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filter Panel */}
        <FilterPanel
          sport={sport}
          filters={filters}
          onFiltersChange={setFilters}
          searchResults={results} // Pass original unfiltered results
          className="mb-6"
        />
        {/* Results Count Info */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold">
              {displayedResults.length}{' '}
              {displayedResults.length === 1 ? 'Court' : 'Courts'} Available
            </h3>
            <p className="text-neutral-400">
              Showing {displayedResults.length} of {sortedResults.length}{' '}
              results in London
            </p>
          </div>

          {/* Cached Data Indicator */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-neutral-500">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live data</span>
          </div>
        </div>

        {/* Results Display */}
        {viewMode === 'map' ? (
          <MapView results={sortedResults} sport={sport} />
        ) : (
          <div className="space-y-4">
            {displayedResults.map((slot, index) => (
              <CourtCard
                key={`${slot.id}-${index}`}
                slot={slot}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Show More Button - Only show for list view */}
        {hasMoreResults && viewMode !== 'map' && (
          <div className="flex justify-center mt-8">
            <Button onClick={showMoreResults} variant="outline" size="lg">
              Show More Courts ({sortedResults.length - showCount} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
