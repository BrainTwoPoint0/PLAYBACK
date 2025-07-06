import { CourtSlot, SearchParams, SearchResult, Provider } from './types';
import { PlaytomicProvider } from './providers/playtomic';
import { PLAYScannerCache, globalCache, CACHE_TTL } from './cache';
import { ProviderAdapter } from './providers/base';

/**
 * Main search service that orchestrates provider calls and caching
 */
export class SearchService {
  private providers: Map<Provider, ProviderAdapter> = new Map();
  private cache: PLAYScannerCache;

  constructor(cache: PLAYScannerCache = globalCache) {
    this.cache = cache;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize available providers
    this.providers.set('playtomic', new PlaytomicProvider());

    // TODO: Add other providers as they're implemented
    // this.providers.set("matchi", new MatchiProvider());
    // this.providers.set("padel_mates", new PadelMatesProvider());
  }

  /**
   * Main search method that aggregates results from all relevant providers
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = PLAYScannerCache.generateSearchKey(params);

    // Try to get from cache first
    const cachedResult = this.cache.get<SearchResult>(cacheKey);
    if (cachedResult) {
      return {
        ...cachedResult,
        searchTime: Date.now() - startTime,
      };
    }

    // Get relevant providers for this sport
    const relevantProviders = this.getProvidersForSport(params.sport);

    if (relevantProviders.length === 0) {
      return {
        results: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
        providers: [],
        filters: params,
      };
    }

    // Fetch from all providers in parallel with timeout
    const timeout = 25000; // 25 second timeout
    const providerResults = await Promise.allSettled(
      relevantProviders.map(async (provider) => {
        try {
          // Add timeout to each provider call using manual timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error('Provider request timed out')),
              timeout
            );
          });

          const slots = await Promise.race([
            provider.fetchAvailability(params),
            timeoutPromise,
          ]);

          return {
            provider: provider.name as Provider,
            slots,
            error: null,
          };
        } catch (error) {
          return {
            provider: provider.name as Provider,
            slots: [],
            error: (error as Error).message,
          };
        }
      })
    );

    // Aggregate results
    const allSlots: CourtSlot[] = [];
    const successfulProviders: Provider[] = [];
    const errors: string[] = [];

    providerResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.slots.length > 0) {
          allSlots.push(...result.value.slots);
          successfulProviders.push(result.value.provider);
        }
        if (result.value.error) {
          errors.push(`${result.value.provider}: ${result.value.error}`);
        }
      } else {
        errors.push(`Provider failed: ${result.reason}`);
      }
    });

    // Sort and deduplicate results
    const sortedSlots = this.sortAndDeduplicateSlots(allSlots);

    const searchResult: SearchResult = {
      results: sortedSlots,
      totalResults: sortedSlots.length,
      searchTime: Date.now() - startTime,
      providers: successfulProviders,
      filters: params,
      // Include error information for debugging
      ...(errors.length > 0 &&
        process.env.NODE_ENV === 'development' && { errors }),
    };

    // Only cache successful results (with at least some data or no errors)
    if (sortedSlots.length > 0 || errors.length === 0) {
      this.cache.set(cacheKey, searchResult, CACHE_TTL.SEARCH_RESULTS);
    }

    return searchResult;
  }

  /**
   * Get providers that support the specified sport
   */
  private getProvidersForSport(sport: string): ProviderAdapter[] {
    const providers: ProviderAdapter[] = [];

    Array.from(this.providers.values()).forEach((provider) => {
      if (provider.sports.includes(sport)) {
        providers.push(provider);
      }
    });

    return providers;
  }

  /**
   * Sort results by time and price, remove duplicates
   */
  private sortAndDeduplicateSlots(slots: CourtSlot[]): CourtSlot[] {
    // Remove duplicates based on venue, start time, and similar price
    const uniqueSlots = new Map<string, CourtSlot>();

    for (const slot of slots) {
      const key = `${slot.venue.id}_${slot.startTime}_${Math.floor(slot.price / 100)}`;

      if (!uniqueSlots.has(key) || uniqueSlots.get(key)!.price > slot.price) {
        uniqueSlots.set(key, slot);
      }
    }

    // Sort by time, then by price
    return Array.from(uniqueSlots.values()).sort((a, b) => {
      const timeCompare =
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (timeCompare !== 0) return timeCompare;
      return a.price - b.price;
    });
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<Record<Provider, boolean>> {
    const healthResults: Record<string, boolean> = {};

    const healthChecks = Array.from(this.providers.entries()).map(
      async ([name, provider]) => {
        const cacheKey = PLAYScannerCache.generateHealthKey(name);

        // Check cache first
        const cachedHealth = this.cache.get<boolean>(cacheKey);
        if (cachedHealth !== null) {
          return { name, healthy: cachedHealth };
        }

        // Perform health check
        try {
          const healthy = await provider.healthCheck();
          this.cache.set(cacheKey, healthy, CACHE_TTL.HEALTH_CHECK);
          return { name, healthy };
        } catch {
          this.cache.set(cacheKey, false, CACHE_TTL.HEALTH_CHECK);
          return { name, healthy: false };
        }
      }
    );

    const results = await Promise.allSettled(healthChecks);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        healthResults[result.value.name] = result.value.healthy;
      }
    });

    return healthResults as Record<Provider, boolean>;
  }

  /**
   * Clear cache for specific search or all cache
   */
  clearCache(params?: SearchParams): void {
    if (params) {
      const cacheKey = PLAYScannerCache.generateSearchKey(params);
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get available providers and their supported sports
   */
  getAvailableProviders(): Array<{
    name: Provider;
    sports: string[];
    regions: string[];
  }> {
    return Array.from(this.providers.values()).map((provider) => ({
      name: provider.name as Provider,
      sports: provider.sports,
      regions: provider.regions,
    }));
  }

  /**
   * Test a specific provider
   */
  async testProvider(
    providerName: Provider,
    params: SearchParams
  ): Promise<{
    success: boolean;
    results: CourtSlot[];
    error?: string;
    responseTime: number;
  }> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return {
        success: false,
        results: [],
        error: `Provider ${providerName} not found`,
        responseTime: 0,
      };
    }

    const startTime = Date.now();

    try {
      const results = await provider.fetchAvailability(params);
      return {
        success: true,
        results,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        error: (error as Error).message,
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// Global search service instance
export const searchService = new SearchService();
