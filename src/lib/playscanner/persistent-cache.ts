import { createClient } from '@supabase/supabase-js';
import { CourtSlot, SearchParams, SearchResult } from './types';
import { rowToCourtSlot, PlayscannerSlotRow } from './slot-mapper';

/**
 * Production-ready persistent cache service using Supabase
 * Replaces in-memory cache with database persistence
 */

interface CacheEntry {
  id: string;
  cache_key: string;
  city: string;
  date: string;
  slots: CourtSlot[];
  metadata: {
    totalSlots: number;
    uniqueVenues: number;
    collectedAt: string;
    provider: string;
  };
  created_at: string;
  expires_at: string;
}

interface CollectionLogEntry {
  collection_id: string;
  city: string;
  date: string;
  status: 'success' | 'error' | 'partial';
  slots_collected: number;
  venues_processed: number;
  error_message?: string;
  execution_time_ms: number;
  provider: string;
  created_at?: string;
}

interface CacheStats {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  totalSlots: number;
  citiesCovered: number;
  dateRange: {
    oldest: string | null;
    newest: string | null;
  };
  lastCollection: string | null;
  memoryUsage: string;
}

export class PersistentCacheService {
  private supabase;
  private static defaultTTL = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * Search `playscanner_slots` via the `playscanner_search_slots_json`
   * Postgres function. One round-trip, jsonb-aggregated response -
   * bypasses PostgREST's default 1000-row cap so padel/football slices
   * with 2k+ rows finish in a single network hop instead of 2-3 paged
   * trans-Atlantic round-trips.
   *
   * Filtering (sport/city/time/price/indoor), ordering, and the 24h
   * staleness floor all live in the SQL function. The TS side is a
   * thin caller + row → CourtSlot mapper.
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const { data, error } = await this.supabase.rpc(
        'playscanner_search_slots_json',
        {
          p_city: params.location.toLowerCase(),
          p_sport: params.sport,
          p_date: params.date,
          p_start_time: params.startTime ?? null,
          p_end_time: params.endTime ?? null,
          p_max_price: params.maxPrice ?? null,
          p_indoor: params.indoor ?? null,
        }
      );

      if (error) {
        console.error('PersistentCacheService search rpc error:', error);
        return this.emptySearchResult(params, startTime, 'error');
      }

      const rows = (Array.isArray(data) ? data : []) as PlayscannerSlotRow[];
      const results = rows.map(rowToCourtSlot);
      const providers = [...new Set(results.map((s) => s.provider))];
      const latestCollectedAt = rows.reduce<string | null>((acc, r) => {
        if (!acc || r.collected_at > acc) return r.collected_at;
        return acc;
      }, null);

      return {
        results,
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        providers,
        filters: params,
        source: 'persistent_cache',
        cacheAge: latestCollectedAt
          ? this.describeAge(Date.now() - new Date(latestCollectedAt).getTime())
          : 'empty',
      };
    } catch (error) {
      console.error('PersistentCacheService search error:', error);
      return this.emptySearchResult(params, startTime, 'error');
    }
  }

  private emptySearchResult(
    params: SearchParams,
    startTime: number,
    cacheAge: string
  ): SearchResult {
    return {
      results: [],
      totalResults: 0,
      searchTime: Date.now() - startTime,
      providers: [],
      filters: params,
      source: 'persistent_cache',
      cacheAge,
    };
  }

  private describeAge(ageMs: number): string {
    const minutes = Math.floor(ageMs / 60000);
    if (minutes < 1) return 'fresh';
    if (minutes < 60) return `${minutes}m old`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h old`;
  }

  /**
   * Log collection attempt
   */
  async logCollection(entry: CollectionLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('playscanner_collection_log')
        .insert({
          collection_id: entry.collection_id,
          city: entry.city.toLowerCase(),
          date: entry.date,
          status: entry.status,
          slots_collected: entry.slots_collected,
          venues_processed: entry.venues_processed,
          error_message: entry.error_message,
          execution_time_ms: entry.execution_time_ms,
          provider: entry.provider,
        });

      if (error) {
        console.error('Error logging collection:', error);
      }
    } catch (error) {
      console.error('logCollection error:', error);
    }
  }

  /**
   * Aggregate stats from `playscanner_slots`. Semantics shifted slightly
   * from the blob era but the shape is preserved for existing callers
   * (admin/health/search endpoints):
   *   - totalEntries / totalSlots both count rows (no per-city/date bucketing anymore)
   *   - activeEntries counts available=TRUE rows
   *   - expiredEntries counts tombstoned (available=FALSE) rows
   *   - dateRange is min/max start_time (what users can book)
   *   - lastCollection is max collected_at (most recent successful write)
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const [totalsRes, activeRes, citiesRes, dateRangeRes] = await Promise.all(
        [
          this.supabase
            .from('playscanner_slots')
            .select('id', { count: 'exact', head: true }),
          this.supabase
            .from('playscanner_slots')
            .select('id', { count: 'exact', head: true })
            .eq('available', true),
          this.supabase.from('playscanner_slots').select('city'),
          this.supabase
            .from('playscanner_slots')
            .select('start_time, collected_at')
            .order('start_time', { ascending: true })
            .limit(1),
        ]
      );

      const total = totalsRes.count || 0;
      const active = activeRes.count || 0;
      const expired = Math.max(0, total - active);

      const cities = new Set(
        (citiesRes.data || []).map((row: { city: string }) => row.city)
      );

      // Cheapest way to get the newest start_time + latest collected_at without
      // pulling every row: one row each, ordered.
      const [newestRow, latestCollectRow] = await Promise.all([
        this.supabase
          .from('playscanner_slots')
          .select('start_time')
          .order('start_time', { ascending: false })
          .limit(1)
          .maybeSingle(),
        this.supabase
          .from('playscanner_slots')
          .select('collected_at')
          .order('collected_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        totalEntries: total,
        activeEntries: active,
        expiredEntries: expired,
        totalSlots: total,
        citiesCovered: cities.size,
        dateRange: {
          oldest: dateRangeRes.data?.[0]?.start_time || null,
          newest: newestRow.data?.start_time || null,
        },
        lastCollection: latestCollectRow.data?.collected_at || null,
        memoryUsage: 'N/A (Database)',
      };
    } catch (error) {
      console.error('getCacheStats error:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Health check - verify database connection by probing playscanner_slots.
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const { error } = await this.supabase
        .from('playscanner_slots')
        .select('id')
        .limit(1);

      if (error) {
        return {
          healthy: false,
          details: { error: error.message },
        };
      }

      const stats = await this.getCacheStats();

      return {
        healthy: true,
        details: {
          connection: 'ok',
          activeEntries: stats.activeEntries,
          totalSlots: stats.totalSlots,
          lastCollection: stats.lastCollection,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: (error as Error).message },
      };
    }
  }

  /**
   * Delete truly old rows from `playscanner_slots`. The writer's tombstone
   * sweep handles the hot path (booked-out slots flip to available=FALSE),
   * but tombstones accumulate - this wipes anything older than 7 days,
   * which is well beyond any possible future-date read.
   */
  async cleanup(): Promise<number> {
    try {
      const cutoff = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error, count } = await this.supabase
        .from('playscanner_slots')
        .delete({ count: 'exact' })
        .lt('collected_at', cutoff);

      if (error) {
        console.error('Error during cleanup:', error);
        return 0;
      }

      const deleted = count || 0;
      console.log(`🗑️ Cleaned up ${deleted} stale playscanner_slots rows`);
      return deleted;
    } catch (error) {
      console.error('cleanup error:', error);
      return 0;
    }
  }

  /**
   * Default stats for error cases
   */
  private getDefaultStats(): CacheStats {
    return {
      totalEntries: 0,
      activeEntries: 0,
      expiredEntries: 0,
      totalSlots: 0,
      citiesCovered: 0,
      dateRange: { oldest: null, newest: null },
      lastCollection: null,
      memoryUsage: 'N/A',
    };
  }

  /**
   * Get recent collection logs
   */
  async getRecentCollections(
    limit: number = 10
  ): Promise<CollectionLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('playscanner_collection_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching collection logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('getRecentCollections error:', error);
      return [];
    }
  }

  /**
   * Get collection success rate
   */
  async getCollectionSuccessRate(hours: number = 24): Promise<number> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('playscanner_collection_log')
        .select('status')
        .gte('created_at', since);

      if (error || !data) {
        return 0;
      }

      const total = data.length;
      const successful = data.filter(
        (entry) => entry.status === 'success'
      ).length;

      return total > 0 ? (successful / total) * 100 : 0;
    } catch (error) {
      console.error('getCollectionSuccessRate error:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const persistentCache = new PersistentCacheService();
