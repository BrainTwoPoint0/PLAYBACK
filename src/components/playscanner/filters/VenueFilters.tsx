'use client';

import { useMemo } from 'react';
import { Label } from '@playback/commons/components/ui/label';
import { Button } from '@playback/commons/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@playback/commons/components/ui/select';
import { Badge } from '@playback/commons/components/ui/badge';
import { MapPinIcon, XIcon } from 'lucide-react';
import { CourtSlot } from '@/lib/playscanner/types';

interface VenueFiltersProps {
  selectedVenues?: string[];
  onVenuesChange: (venues: string[] | undefined) => void;
  searchResults: CourtSlot[];
}

export default function VenueFilters({
  selectedVenues,
  onVenuesChange,
  searchResults,
}: VenueFiltersProps) {
  // Get unique venues from search results
  const availableVenues = useMemo(() => {
    const venues = searchResults.map((slot) =>
      typeof slot.venue === 'string' ? slot.venue : slot.venue.name
    );
    return [...new Set(venues)].sort();
  }, [searchResults]);

  const handleVenueSelect = (venue: string) => {
    if (venue === 'all') {
      onVenuesChange(undefined);
      return;
    }

    if (!selectedVenues) {
      onVenuesChange([venue]);
      return;
    }

    if (selectedVenues.includes(venue)) {
      // Already selected, don't add again
      return;
    }

    onVenuesChange([...selectedVenues, venue]);
  };

  const removeVenue = (venue: string) => {
    if (!selectedVenues) return;

    const newVenues = selectedVenues.filter((v) => v !== venue);
    onVenuesChange(newVenues.length > 0 ? newVenues : undefined);
  };

  const clearVenues = () => {
    onVenuesChange(undefined);
  };

  // Get display value for the select
  const getSelectValue = () => {
    if (!selectedVenues || selectedVenues.length === 0) {
      return 'all';
    }
    if (selectedVenues.length === 1) {
      return selectedVenues[0];
    }
    // For multiple selections, we'll use 'all' as the value but show custom text
    return 'all';
  };

  // Get display text for the select trigger
  const getSelectDisplayText = () => {
    if (!selectedVenues || selectedVenues.length === 0) {
      return 'All Venues';
    }
    if (selectedVenues.length === 1) {
      return selectedVenues[0];
    }
    return `${selectedVenues.length} venues selected`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-4 w-4" />
          <Label className="text-sm font-medium">Venues</Label>
        </div>
        {selectedVenues && selectedVenues.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearVenues}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Venue Selection Dropdown */}
      <div className="space-y-3">
        <Select value={getSelectValue()} onValueChange={handleVenueSelect}>
          <SelectTrigger className="w-full">
            <span>{getSelectDisplayText()}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            {availableVenues.map((venue) => (
              <SelectItem key={venue} value={venue}>
                {venue}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selected Venues Display */}
        {selectedVenues && selectedVenues.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Selected: {selectedVenues.length} venue
              {selectedVenues.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedVenues.map((venue) => (
                <Badge key={venue} variant="secondary" className="gap-1">
                  <span className="truncate max-w-[120px]">{venue}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                    onClick={() => removeVenue(venue)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
