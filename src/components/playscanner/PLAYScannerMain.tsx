'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '@/components/ui/section-title';
import SportSelector from './SportSelector';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import { Sport, SearchParams, CourtSlot } from '@/lib/playscanner/types';
import { applyFilters } from '@/lib/playscanner/filter-utils';
import { FilterState } from './filters/FilterPanel';

export default function PLAYScannerMain() {
  const [selectedSport, setSelectedSport] = useState<Sport>('padel');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CourtSlot[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({});
  const [rawResults, setRawResults] = useState<CourtSlot[]>([]); // Store unfiltered results

  // Apply filters to raw results
  const filteredResults = useMemo(() => {
    return applyFilters(rawResults, currentFilters, selectedSport);
  }, [rawResults, currentFilters, selectedSport]);

  // Stable sport change handler
  const handleSportChange = useCallback((sport: Sport) => {
    setSelectedSport(sport);
  }, []);

  const handleSearch = async (searchParams: SearchParams) => {
    setIsSearching(true);
    setError(null);
    setResults(null);

    // Extract filters from search params to store in component state
    const filters: FilterState = {
      timeRange:
        searchParams.startTime && searchParams.endTime
          ? {
              start: searchParams.startTime,
              end: searchParams.endTime,
            }
          : undefined,
      priceRange: searchParams.maxPrice
        ? {
            min: 500, // Default minimum £5
            max: searchParams.maxPrice,
          }
        : undefined,
    };

    setCurrentFilters(filters);

    try {
      const response = await fetch('/api/playscanner/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...searchParams,
          cached: true, // Use cached mode for production reliability
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      setRawResults(data.results || []);
      setSearchResults(data.results || []);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Default search for today's London padel bookings
  useEffect(() => {
    const performDefaultSearch = async () => {
      const today = new Date().toISOString().split('T')[0];
      const defaultSearchParams = {
        sport: 'padel' as const,
        location: 'London',
        date: today,
      };

      await handleSearch(defaultSearchParams);
    };

    performDefaultSearch();
  }, []);

  return (
    <div className="relative z-20 my-12 max-w-7xl mx-auto px-4">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          PLAY<span className="text-[#00FF88]">Scanner</span>
        </h1>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Find and book sports courts and pitches across multiple providers.
          Compare prices, check availability, and book instantly.
        </p>
      </motion.div>

      {/* Sport Selector */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <SportSelector
          selectedSport={selectedSport}
          onSportChange={handleSportChange}
        />
      </motion.div>

      {/* Search Form */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="border border-neutral-800 rounded-lg bg-neutral-950/50 backdrop-blur-sm">
          <div className="p-6 border-b border-neutral-800">
            <h2 className="text-2xl font-semibold mb-2">
              Find{' '}
              {selectedSport === 'padel' ? 'Padel Courts' : 'Football Pitches'}
            </h2>
            <p className="text-neutral-400">
              {selectedSport === 'padel'
                ? 'Search across Playtomic, MATCHi, and Padel Mates to find the perfect court'
                : 'Search across PowerLeague, FC Urban, and more (coming soon)'}
            </p>
          </div>
          <div className="p-6">
            <SearchForm
              sport={selectedSport}
              onSearch={handleSearch}
              isSearching={isSearching}
              searchResults={rawResults}
              filters={currentFilters}
              onFiltersChange={setCurrentFilters}
            />
          </div>
        </div>
      </motion.div>

      {/* Search Results */}
      {hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <SearchResults
            results={filteredResults}
            isLoading={isSearching}
            sport={selectedSport}
            error={error ? { code: 'SEARCH_ERROR', message: error } : undefined}
          />
        </motion.div>
      )}
    </div>
  );
}
