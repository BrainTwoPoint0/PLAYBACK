'use client';

import { useMemo } from 'react';
import { Label } from '@playback/commons/components/ui/label';
import { Slider } from '@playback/commons/components/ui/slider';
import { Button } from '@playback/commons/components/ui/button';
import { PoundSterlingIcon } from 'lucide-react';
import { CourtSlot } from '@/lib/playscanner/types';

interface PriceRange {
  min: number;
  max: number;
}

interface PriceFiltersProps {
  priceRange?: PriceRange;
  onPriceRangeChange: (range: PriceRange | undefined) => void;
  searchResults: CourtSlot[]; // Add search results to calculate dynamic bounds
}

export default function PriceFilters({
  priceRange,
  onPriceRangeChange,
  searchResults,
}: PriceFiltersProps) {
  // Calculate dynamic price bounds from search results
  const { dynamicMin, dynamicMax } = useMemo(() => {
    if (searchResults.length === 0) {
      return { dynamicMin: 500, dynamicMax: 5000 }; // Default £5-£50
    }

    const prices = searchResults.map((slot) => slot.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Round down min to nearest £1, round up max to nearest £1
    return {
      dynamicMin: Math.floor(min / 100) * 100,
      dynamicMax: Math.ceil(max / 100) * 100,
    };
  }, [searchResults]);

  const currentMin = priceRange?.min ?? dynamicMin;
  const currentMax = priceRange?.max ?? dynamicMax;

  const handleSliderChange = (values: number[]) => {
    if (values.length === 2) {
      const [min, max] = values;
      onPriceRangeChange({ min, max });
    }
  };

  const clearPriceRange = () => {
    onPriceRangeChange(undefined);
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(0)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PoundSterlingIcon className="h-4 w-4" />
          <Label className="text-sm font-medium">Price Range</Label>
        </div>
        {priceRange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearPriceRange}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Dynamic Price Range Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatPrice(currentMin)}</span>
          <span>{formatPrice(currentMax)}</span>
        </div>

        <Slider
          value={[currentMin, currentMax]}
          onValueChange={handleSliderChange}
          min={dynamicMin}
          max={dynamicMax}
          step={100}
          minStepsBetweenThumbs={1}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(dynamicMin)}</span>
          <span>{formatPrice(dynamicMax)}</span>
        </div>
      </div>
    </div>
  );
}
