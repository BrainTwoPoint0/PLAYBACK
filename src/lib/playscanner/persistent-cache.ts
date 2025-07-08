import { createClient } from '@supabase/supabase-js';
import { CourtSlot, SearchParams, SearchResult, Venue } from './types';

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
   * Search cached data with filters
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // Get cached slots for this location/date
      const cachedSlots = await this.getCachedData(
        params.location,
        params.date
      );
      if (!cachedSlots || cachedSlots.length === 0) {
        return {
          results: [],
          totalResults: 0,
          searchTime: Date.now() - startTime,
          providers: [],
          filters: params,
          source: 'cached',
          cacheAge: 'empty',
        };
      }

      // Apply filters to cached data
      let filteredSlots = cachedSlots;

      // Filter by time range
      if (params.startTime) {
        const startTimeFilter = new Date(
          `${params.date}T${params.startTime}`
        ).getTime();
        filteredSlots = filteredSlots.filter(
          (slot) => new Date(slot.startTime).getTime() >= startTimeFilter
        );
      }

      if (params.endTime) {
        const endTimeFilter = new Date(
          `${params.date}T${params.endTime}`
        ).getTime();
        filteredSlots = filteredSlots.filter(
          (slot) => new Date(slot.endTime).getTime() <= endTimeFilter
        );
      }

      // Filter by price
      if (params.maxPrice) {
        filteredSlots = filteredSlots.filter(
          (slot) => slot.price <= params.maxPrice!
        );
      }

      // Filter by indoor/outdoor
      if (params.indoor !== undefined) {
        filteredSlots = filteredSlots.filter(
          (slot) => slot.features.indoor === params.indoor
        );
      }

      // Sort by time, then price
      filteredSlots.sort((a, b) => {
        const timeCompare =
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.price - b.price;
      });

      const providers = [
        ...new Set(filteredSlots.map((slot) => slot.provider)),
      ];
      const cacheAge = await this.getCacheAge(params.location, params.date);

      return {
        results: filteredSlots,
        totalResults: filteredSlots.length,
        searchTime: Date.now() - startTime,
        providers,
        filters: params,
        source: 'cached',
        cacheAge,
      };
    } catch (error) {
      console.error('PersistentCacheService search error:', error);
      return {
        results: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
        providers: [],
        filters: params,
        source: 'cached',
        cacheAge: 'error',
      };
    }
  }

  /**
   * Get cached data if valid (not expired)
   */
  async getCachedData(city: string, date: string): Promise<CourtSlot[] | null> {
    try {
      const cacheKey = this.getCacheKey(city, date);

      const { data, error } = await this.supabase
        .from('playscanner_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - this is expected for cache misses
          return null;
        }
        console.error('Error fetching cached data:', error);
        return null;
      }

      if (!data || !data.slots) {
        return null;
      }

      console.log(
        `📚 Serving ${data.slots.length} slots from persistent cache: ${cacheKey}`
      );
      return data.slots;
    } catch (error) {
      console.error('getCachedData error:', error);
      return null;
    }
  }

  /**
   * Store collected data in persistent cache
   */
  async setCachedData(
    city: string,
    date: string,
    slots: CourtSlot[],
    ttl: number = PersistentCacheService.defaultTTL
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(city, date);
      const expiresAt = new Date(Date.now() + ttl);

      // Calculate metadata
      const uniqueVenues = new Set(slots.map((slot) => slot.venue.id)).size;
      const metadata = {
        totalSlots: slots.length,
        uniqueVenues,
        collectedAt: new Date().toISOString(),
        provider: 'playtomic',
      };

      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        const { error } = await this.supabase.from('playscanner_cache').upsert(
          {
            cache_key: cacheKey,
            city: city.toLowerCase(),
            date,
            slots,
            metadata,
            expires_at: expiresAt.toISOString(),
          },
          {
            onConflict: 'cache_key',
            ignoreDuplicates: false,
          }
        );

        if (!error) {
          break;
        }

        if (error.code === '23505' && retryCount < maxRetries - 1) {
          console.warn(
            `Duplicate key conflict for ${cacheKey}, retrying... (${retryCount + 1}/${maxRetries})`
          );
          retryCount++;
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
          continue;
        }

        console.error('Error storing cached data:', error);
        throw error;
      }

      console.log(
        `💾 Cached ${slots.length} slots for ${city} ${date} (TTL: ${ttl / 1000 / 60}min)`
      );
    } catch (error) {
      console.error('setCachedData error:', error);
      throw error;
    }
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
   * Store venue metadata
   */
  async storeVenue(venue: Venue, city: string): Promise<void> {
    try {
      const { error } = await this.supabase.from('playscanner_venues').upsert({
        venue_id: venue.id,
        provider: venue.provider,
        city: city.toLowerCase(),
        venue_data: venue,
        is_active: true,
        last_seen: new Date().toISOString(),
      });

      if (error) {
        console.error('Error storing venue:', error);
      }
    } catch (error) {
      console.error('storeVenue error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const { data, error } = await this.supabase.rpc('get_cache_stats');

      if (error) {
        console.error('Error getting cache stats:', error);
        return this.getDefaultStats();
      }

      return {
        totalEntries: data.total_entries || 0,
        activeEntries: data.active_entries || 0,
        expiredEntries: data.expired_entries || 0,
        totalSlots: data.total_slots || 0,
        citiesCovered: data.cities_covered || 0,
        dateRange: {
          oldest: data.date_range?.oldest || null,
          newest: data.date_range?.newest || null,
        },
        lastCollection: data.last_collection || null,
        memoryUsage: 'N/A (Database)',
      };
    } catch (error) {
      console.error('getCacheStats error:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Health check - verify database connection
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const { data, error } = await this.supabase
        .from('playscanner_health')
        .select('count')
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
   * Clear expired cache entries
   */
  async cleanup(): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_cache');

      if (error) {
        console.error('Error during cleanup:', error);
        return 0;
      }

      console.log(`🗑️ Cleaned up ${data} expired cache entries`);
      return data;
    } catch (error) {
      console.error('cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get cache key for city and date
   */
  private getCacheKey(city: string, date: string): string {
    return `${city.toLowerCase()}:${date}`;
  }

  /**
   * Get cache age description
   */
  private async getCacheAge(city: string, date: string): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(city, date);

      const { data, error } = await this.supabase
        .from('playscanner_cache')
        .select('created_at')
        .eq('cache_key', cacheKey)
        .single();

      if (error || !data) {
        return 'unknown';
      }

      const ageMs = Date.now() - new Date(data.created_at).getTime();
      const ageMinutes = Math.floor(ageMs / 60000);

      if (ageMinutes < 1) return 'fresh';
      if (ageMinutes < 15) return `${ageMinutes}m old`;
      if (ageMinutes < 60) return `${ageMinutes}m old`;

      const ageHours = Math.floor(ageMinutes / 60);
      return `${ageHours}h old`;
    } catch (error) {
      return 'unknown';
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
