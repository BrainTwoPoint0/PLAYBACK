'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '../ui/section-title';
import SportSelector from './SportSelector';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import { Sport, SearchParams, CourtSlot } from '@/lib/playscanner/types';
import { playscannerAnalytics } from '@/lib/playscanner/analytics';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export default function PLAYScannerMain() {
  const [selectedSport, setSelectedSport] = useState<Sport>('padel');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CourtSlot[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [rawResults, setRawResults] = useState<CourtSlot[]>([]); // Store unfiltered results
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null); // Track current search for conversions

  // Initialize analytics session on component mount
  useEffect(() => {
    playscannerAnalytics.initSession().then(() => {
      playscannerAnalytics.trackPageView('search');
    });

    // End session on page unload
    const handleBeforeUnload = () => {
      playscannerAnalytics.endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Stable sport change handler
  const handleSportChange = useCallback((sport: Sport) => {
    setSelectedSport(sport);
  }, []);

  const handleSearch = async (searchParams: SearchParams) => {
    setIsSearching(true);
    setError(null);
    setResults(null);
    const searchStartTime = Date.now();

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
      const searchDuration = Date.now() - searchStartTime;

      // Track search analytics
      const providers = [
        ...new Set(
          (data.results || []).map((slot: CourtSlot) => slot.provider)
        ),
      ] as string[];
      const searchId = await playscannerAnalytics.trackSearch(
        searchParams,
        data.results?.length || 0,
        searchDuration,
        providers
      );

      setCurrentSearchId(searchId);
      setResults(data);
      setRawResults(data.results || []);
      setSearchResults(data.results || []);
      setHasSearched(true);

      // Track results page view
      playscannerAnalytics.trackPageView('results');
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
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-4xl md:text-6xl font-bold">
            PLAY<span className="text-[#00FF88]">Scanner</span>
          </h1>
          {/* <Link
            href="/playscanner/analytics"
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm"
            title="View Analytics"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link> */}
        </div>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Find and book sports courts and pitches across multiple providers.
          Compare prices, check availability, and book instantly.
        </p>
        {/* <div className="md:hidden mt-4">
          <Link
            href="/playscanner/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Link>
        </div> */}
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
            results={rawResults}
            isLoading={isSearching}
            sport={selectedSport}
            error={error ? { code: 'SEARCH_ERROR', message: error } : undefined}
            onConversion={(slot) => {
              // Track booking conversion
              playscannerAnalytics.trackConversion(
                {
                  provider_name: slot.provider,
                  venue_name:
                    typeof slot.venue === 'string'
                      ? slot.venue
                      : slot.venue.name,
                  venue_location:
                    typeof slot.venue === 'object' && slot.venue.location
                      ? typeof slot.venue.location === 'string'
                        ? slot.venue.location
                        : `${slot.venue.location.city}, ${slot.venue.location.postcode}`
                      : '',
                  booking_url: slot.bookingUrl || '',
                  estimated_price: slot.price,
                  sport: selectedSport,
                  estimated_commission: slot.price ? slot.price * 0.05 : 0, // 5% default commission
                  commission_rate: 5,
                },
                currentSearchId || undefined
              );
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
