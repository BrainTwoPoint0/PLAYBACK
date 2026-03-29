'use client';

import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Label,
} from '@braintwopoint0/playback-commons/ui';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDownIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react';
import { Sport, CourtSlot, PROVIDER_CONFIG } from '@/lib/playscanner/types';
import TimeFilters from './TimeFilters';
import PriceFilters from './PriceFilters';
import VenueFilters from './VenueFilters';

export interface FilterState {
  timeRange?: { start: string; end: string };
  priceRange?: { min: number; max: number };
  selectedVenues?: string[]; // Array of venue names
  selectedProviders?: string[]; // Array of provider IDs
}

interface FilterPanelProps {
  sport: Sport;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  searchResults: CourtSlot[]; // Pass search results for dynamic bounds
  className?: string;
}

export default function FilterPanel({
  sport,
  filters,
  onFiltersChange,
  searchResults,
  className = '',
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(
      (value) =>
        value !== undefined &&
        value !== null &&
        (Array.isArray(value) ? value.length > 0 : true)
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.timeRange) count++;
    if (filters.priceRange) count++;
    if (filters.selectedVenues && filters.selectedVenues.length > 0) count++;
    if (filters.selectedProviders && filters.selectedProviders.length > 0)
      count++;
    return count;
  };

  // Derive available providers + counts from search results
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    searchResults.forEach((slot) => {
      counts[slot.provider] = (counts[slot.provider] || 0) + 1;
    });
    return counts;
  }, [searchResults]);

  const toggleProvider = (provider: string) => {
    const current = filters.selectedProviders || [];
    const updated = current.includes(provider)
      ? current.filter((p) => p !== provider)
      : [...current, provider];
    updateFilter('selectedProviders', updated.length > 0 ? updated : undefined);
  };

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12"
            type="button"
          >
            <div className="flex items-center space-x-2">
              <SlidersHorizontalIcon className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </div>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filter Options</CardTitle>
                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Filters */}
              {Object.keys(providerCounts).length > 1 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Providers</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(providerCounts).map(([provider, count]) => {
                      const config = PROVIDER_CONFIG[provider] || {
                        displayName: provider,
                        color: '#888888',
                      };
                      const isSelected =
                        !filters.selectedProviders ||
                        filters.selectedProviders.includes(provider);
                      return (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => toggleProvider(provider)}
                          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border"
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${config.color}15`,
                                  borderColor: `${config.color}40`,
                                  color: config.color,
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  borderColor: 'rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.35)',
                                }
                          }
                        >
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: isSelected
                                ? config.color
                                : 'rgba(255,255,255,0.2)',
                            }}
                          />
                          {config.displayName}
                          <span
                            style={{
                              opacity: isSelected ? 0.7 : 0.5,
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Venue Filters */}
              <VenueFilters
                selectedVenues={filters.selectedVenues}
                onVenuesChange={(venues) =>
                  updateFilter('selectedVenues', venues)
                }
                searchResults={searchResults}
              />

              {/* Time Range Filters */}
              <TimeFilters
                timeRange={filters.timeRange}
                onTimeRangeChange={(range) => updateFilter('timeRange', range)}
                searchResults={searchResults}
              />

              {/* Price Range Filters */}
              <PriceFilters
                priceRange={filters.priceRange}
                onPriceRangeChange={(range) =>
                  updateFilter('priceRange', range)
                }
                searchResults={searchResults}
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Active Filters:
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.selectedProviders &&
              filters.selectedProviders.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {filters.selectedProviders.length === 1
                    ? PROVIDER_CONFIG[filters.selectedProviders[0]]
                        ?.displayName || filters.selectedProviders[0]
                    : `${filters.selectedProviders.length} providers`}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                    onClick={() => updateFilter('selectedProviders', undefined)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            {filters.selectedVenues && filters.selectedVenues.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {filters.selectedVenues.length === 1
                  ? filters.selectedVenues[0]
                  : `${filters.selectedVenues.length} venues`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                  onClick={() => updateFilter('selectedVenues', undefined)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.timeRange && (
              <Badge variant="secondary" className="gap-1">
                {filters.timeRange.start} - {filters.timeRange.end}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                  onClick={() => updateFilter('timeRange', undefined)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.priceRange && (
              <Badge variant="secondary" className="gap-1">
                £{filters.priceRange.min / 100} - £
                {filters.priceRange.max / 100}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                  onClick={() => updateFilter('priceRange', undefined)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
