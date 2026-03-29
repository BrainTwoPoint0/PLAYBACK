'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import SearchResults from './SearchResults';
import SportIcon from './SportIcon';
import { MapPinIcon, ChevronDownIcon } from 'lucide-react';
import { Sport, SearchParams, CourtSlot } from '@/lib/playscanner/types';
import { playscannerAnalytics } from '@/lib/playscanner/analytics';

const QUICK_DATES = (() => {
  const dates: { label: string; value: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
    dates.push({ label, value });
  }
  return dates;
})();

export default function PLAYScannerMain() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize from URL params or defaults
  const initialSport = (searchParams.get('sport') as Sport) || 'padel';
  const initialDate = searchParams.get('date') || QUICK_DATES[0].value;

  const [selectedSport, setSelectedSport] = useState<Sport>(
    ['padel', 'football'].includes(initialSport) ? initialSport : 'padel'
  );
  const [selectedDate, setSelectedDate] = useState(
    QUICK_DATES.some((d) => d.value === initialDate)
      ? initialDate
      : QUICK_DATES[0].value
  );
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResults, setRawResults] = useState<CourtSlot[]>([]);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);

  // Initialize analytics
  useEffect(() => {
    playscannerAnalytics.initSession().then(() => {
      playscannerAnalytics.trackPageView('search');
    });
    const handleUnload = () => playscannerAnalytics.endSession();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const handleSearch = useCallback(async (sport: Sport, date: string) => {
    setIsSearching(true);
    setError(null);
    const startTime = Date.now();

    try {
      const searchParams: SearchParams = {
        sport,
        location: 'London',
        date,
      };

      const response = await fetch('/api/playscanner/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...searchParams, cached: true }),
      });

      if (!response.ok) throw new Error(`Search failed: ${response.status}`);

      const data = await response.json();
      const duration = Date.now() - startTime;

      const providers = [
        ...new Set((data.results || []).map((s: CourtSlot) => s.provider)),
      ] as string[];

      const searchId = await playscannerAnalytics.trackSearch(
        searchParams,
        data.results?.length || 0,
        duration,
        providers
      );

      setCurrentSearchId(searchId);
      setRawResults(data.results || []);
      setHasSearched(true);
      playscannerAnalytics.trackPageView('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search on mount, sport change, or date change + sync URL
  useEffect(() => {
    // Update URL without navigation
    const params = new URLSearchParams();
    params.set('sport', selectedSport);
    params.set('date', selectedDate);
    router.replace(`/playscanner?${params.toString()}`, { scroll: false });

    handleSearch(selectedSport, selectedDate);
  }, [selectedSport, selectedDate, handleSearch, router]);

  return (
    <div className="relative z-20 max-w-4xl mx-auto px-4 py-6">
      {/* Header with shimmer */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          PLAY
          <motion.span
            className="bg-[linear-gradient(110deg,#00FF88,35%,#a0ffd0,50%,#00FF88,75%,#00FF88)] bg-[length:200%_100%] bg-clip-text text-transparent"
            initial={{ backgroundPosition: '200% 0' }}
            animate={{ backgroundPosition: '-200% 0' }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'linear',
            }}
          >
            Scanner
          </motion.span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare courts and pitches across London
        </p>
      </motion.div>

      {/* Search bar: sport toggle + date chips — sticky */}
      <motion.div
        className="sticky top-0 z-30 -mx-4 bg-[var(--night)]/95 backdrop-blur-md px-4 pb-4 pt-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Sport toggle + location */}
        <div className="flex items-center gap-2 mb-3">
          {(['padel', 'tennis', 'football'] as Sport[]).map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedSport === sport
                  ? 'bg-[#00FF88] text-[#0a100d]'
                  : 'bg-white/[0.06] text-gray-400 hover:text-white'
              }`}
            >
              <SportIcon sport={sport} size={14} />
              {sport.charAt(0).toUpperCase() + sport.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            <span>London</span>
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          </div>
        </div>

        {/* Date quick-select chips */}
        <div className="flex sm:justify-center gap-1.5 overflow-x-auto pb-1 -mb-1 no-visible-scrollbar">
          {QUICK_DATES.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDate(d.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedDate === d.value
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/[0.03] text-gray-500 border border-transparent hover:text-gray-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {hasSearched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SearchResults
            results={rawResults}
            isLoading={isSearching}
            sport={selectedSport}
            error={error ? { code: 'SEARCH_ERROR', message: error } : undefined}
            onConversion={(slot) => {
              playscannerAnalytics.trackConversion(
                {
                  provider_name: slot.provider,
                  venue_name: slot.venue.name,
                  venue_location: slot.venue.location?.city || '',
                  booking_url: slot.bookingUrl || '',
                  estimated_price: slot.price,
                  sport: selectedSport,
                  estimated_commission: slot.price ? slot.price * 0.05 : 0,
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
