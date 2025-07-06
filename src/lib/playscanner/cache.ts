import { CourtSlot, SearchParams } from './types';

/**
 * Enhanced caching system for PLAYScanner
 * Supports both in-memory cache and database storage with TTL
 */

export interface CacheConfig {
  defaultTtl: number; // Default TTL in milliseconds
  maxCacheSize: number; // Maximum number of entries in memory
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export class PLAYScannerCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 15 * 60 * 1000, // 15 minutes default
      maxCacheSize: 1000,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes cleanup
      ...config,
    };

    this.startCleanupTimer();
  }

  /**
   * Generate cache key for search parameters
   */
  static generateSearchKey(params: SearchParams): string {
    const keyParts = [
      params.sport,
      params.location.toLowerCase(),
      params.date,
      params.startTime || '',
      params.endTime || '',
      params.maxPrice || '',
      params.indoor?.toString() || '',
      JSON.stringify(params.filters || {}),
    ];

    return `search:${keyParts.join(':')}`;
  }

  /**
   * Generate cache key for venue data
   */
  static generateVenueKey(provider: string, venueId: string): string {
    return `venue:${provider}:${venueId}`;
  }

  /**
   * Generate cache key for provider health check
   */
  static generateHealthKey(provider: string): string {
    return `health:${provider}`;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      key,
    };

    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.config.maxCacheSize) {
      this.evictOldest();
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.memoryCache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    Array.from(this.memoryCache.values()).forEach((entry) => {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: this.memoryCache.size,
      valid,
      expired,
      hitRate: 0, // Would need hit/miss tracking for this
      maxSize: this.config.maxCacheSize,
    };
  }

  /**
   * Manual cache cleanup
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    Array.from(this.memoryCache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    Array.from(this.memoryCache.entries()).forEach(([key, entry]) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer and clean up resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

/**
 * Database storage interface for persistent caching
 * Can be implemented with Supabase, Redis, or other storage solutions
 */
export interface PersistentCache {
  set(key: string, data: any, ttlSeconds: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * Supabase implementation of persistent cache
 * Uses a cache table with TTL functionality
 */
export class SupabasePersistentCache implements PersistentCache {
  constructor(private supabase: any) {}

  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const { error } = await this.supabase.from('playscanner_cache').upsert({
      key,
      data: JSON.stringify(data),
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to set cache: ${error.message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from('playscanner_cache')
      .select('data, expires_at')
      .eq('key', key)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      // Clean up expired entry
      await this.delete(key);
      return null;
    }

    try {
      return JSON.parse(data.data);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('playscanner_cache')
      .delete()
      .eq('key', key);

    return !error;
  }

  async clear(): Promise<void> {
    await this.supabase.from('playscanner_cache').delete().neq('key', ''); // Delete all
  }
}

/**
 * Two-level cache implementation
 * Fast memory cache with persistent fallback
 */
export class TwoLevelCache {
  constructor(
    private memoryCache: PLAYScannerCache,
    private persistentCache?: PersistentCache
  ) {}

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const actualTtl = ttl || 15 * 60 * 1000; // 15 minutes default

    // Set in memory cache
    this.memoryCache.set(key, data, actualTtl);

    // Set in persistent cache if available
    if (this.persistentCache) {
      try {
        await this.persistentCache.set(key, data, Math.floor(actualTtl / 1000));
      } catch (error) {
        // Persistent cache set failed, continue with in-memory only
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryResult = this.memoryCache.get<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Fallback to persistent cache
    if (this.persistentCache) {
      try {
        const persistentResult = await this.persistentCache.get<T>(key);
        if (persistentResult !== null) {
          // Restore to memory cache
          this.memoryCache.set(key, persistentResult);
          return persistentResult;
        }
      } catch (error) {
        // Persistent cache get failed, continue without persistent cache
      }
    }

    return null;
  }

  async delete(key: string): Promise<boolean> {
    const memoryDeleted = this.memoryCache.delete(key);

    if (this.persistentCache) {
      try {
        await this.persistentCache.delete(key);
      } catch (error) {
        // Persistent cache delete failed, continue with memory-only operation
      }
    }

    return memoryDeleted;
  }
}

// Global cache instance
export const globalCache = new PLAYScannerCache({
  defaultTtl: 15 * 60 * 1000, // 15 minutes
  maxCacheSize: 500,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
});

// Cache TTL constants
export const CACHE_TTL = {
  SEARCH_RESULTS: 15 * 60 * 1000, // 15 minutes
  VENUE_DETAILS: 60 * 60 * 1000, // 1 hour
  HEALTH_CHECK: 5 * 60 * 1000, // 5 minutes
  PROVIDER_STATUS: 30 * 1000, // 30 seconds
} as const;
