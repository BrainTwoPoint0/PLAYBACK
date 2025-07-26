import { CourtSlot, Sport } from './types';
import { FilterState } from '@/components/playscanner/filters/FilterPanel';

export function applyFilters(
  results: CourtSlot[],
  filters: FilterState,
  sport: Sport
): CourtSlot[] {
  return results.filter((slot) => {
    // Time range filter
    if (
      filters.timeRange &&
      (filters.timeRange.start || filters.timeRange.end)
    ) {
      const slotStart = new Date(slot.startTime);
      const slotTime = `${slotStart.getHours().toString().padStart(2, '0')}:${slotStart.getMinutes().toString().padStart(2, '0')}`;

      if (filters.timeRange.start && slotTime < filters.timeRange.start) {
        return false;
      }
      if (filters.timeRange.end && slotTime > filters.timeRange.end) {
        return false;
      }
    }

    // Price range filter
    if (
      filters.priceRange &&
      (filters.priceRange.min !== undefined ||
        filters.priceRange.max !== undefined)
    ) {
      const minPrice =
        filters.priceRange.min !== undefined ? filters.priceRange.min : 0;
      const maxPrice =
        filters.priceRange.max !== undefined
          ? filters.priceRange.max
          : Infinity;

      if (slot.price < minPrice || slot.price > maxPrice) {
        return false;
      }
    }

    return true;
  });
}

export function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some(
    (value) =>
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : true)
  );
}

export function getFilterSummary(filters: FilterState): string[] {
  const summary: string[] = [];

  if (filters.timeRange) {
    summary.push(`${filters.timeRange.start} - ${filters.timeRange.end}`);
  }

  if (filters.priceRange) {
    summary.push(
      `£${filters.priceRange.min / 100} - £${filters.priceRange.max / 100}`
    );
  }

  return summary;
}

// Analyze search results to determine dynamic filter bounds
export function analyzeSearchResults(results: CourtSlot[]) {
  if (results.length === 0) {
    return {
      priceRange: { min: 500, max: 20000 }, // Default £5-£200
      timeRange: { earliest: '06:00', latest: '23:30' },
    };
  }

  // Calculate price bounds
  const prices = results.map((slot) => slot.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Calculate time bounds
  const times = results.map((slot) => {
    const date = new Date(slot.startTime);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  });
  const earliestTime = times.sort()[0] || '08:00';
  const latestTime = times.sort().reverse()[0] || '22:00';

  return {
    priceRange: {
      min: Math.floor(minPrice / 100) * 100, // Round down to nearest pound
      max: Math.ceil(maxPrice / 100) * 100, // Round up to nearest pound
    },
    timeRange: { earliest: earliestTime, latest: latestTime },
  };
}
