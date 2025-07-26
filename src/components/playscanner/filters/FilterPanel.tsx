'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDownIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react';
import { Sport, CourtSlot } from '@/lib/playscanner/types';
import TimeFilters from './TimeFilters';
import PriceFilters from './PriceFilters';

export interface FilterState {
  timeRange?: { start: string; end: string };
  priceRange?: { min: number; max: number };
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
    return count;
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
