import { CourtSlot, SearchParams, Venue } from '../types';

/**
 * Base provider interface that all providers must implement
 * Supports both API integrations and web scraping
 */
export interface ProviderAdapter {
  readonly name: string;
  readonly sports: string[];
  readonly regions: string[];
  readonly rateLimit: number; // requests per second

  /**
   * Fetch available court slots based on search parameters
   */
  fetchAvailability(params: SearchParams): Promise<CourtSlot[]>;

  /**
   * Get detailed venue information
   */
  getVenueDetails?(venueId: string): Promise<Venue>;

  /**
   * Health check to verify provider is accessible
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get booking URL for external redirect
   */
  getBookingUrl(primaryId: string, ...additionalParams: any[]): string;
}

/**
 * Rate limiter utility for respecting provider ToS
 */
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(requestsPerSecond: number) {
    this.maxRequests = requestsPerSecond;
    this.windowMs = 1000; // 1 second window
  }

  async limit(): Promise<void> {
    const now = Date.now();

    // Remove requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(now);
  }
}

/**
 * Cache utility for storing scraped data
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * HTTP client with user agent rotation and error handling
 */
export class ScrapingClient {
  private userAgents = [
    // Latest Chrome versions with realistic versions
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Safari versions
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      Accept:
        'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Sec-Ch-Ua':
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      Connection: 'keep-alive',
      DNT: '1',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} for ${url}`
      );
    }

    return response;
  }

  async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://playtomic.com/',
        Origin: 'https://playtomic.com',
        ...options.headers,
      },
    });

    return response.json();
  }
}

/**
 * Error types for provider operations
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(provider: string) {
    super('Rate limit exceeded', provider, 'RATE_LIMIT');
  }
}

export class ScrapingError extends ProviderError {
  constructor(message: string, provider: string, statusCode?: number) {
    super(message, provider, 'SCRAPING_ERROR', statusCode);
  }
}

/**
 * Utility functions for data transformation
 */
export class DataTransformer {
  static parsePrice(priceText: string): number {
    // Extract price from various formats: "£25.50", "$30", "25,50 €"
    const match = priceText.match(/[\d,\.]+/);
    if (!match) return 0;

    const cleanPrice = match[0].replace(',', '.');
    const price = parseFloat(cleanPrice);

    // Convert to pence if in pounds
    if (priceText.includes('£') || priceText.includes('GBP')) {
      return Math.round(price * 100);
    }

    return Math.round(price);
  }

  static parseDateTime(dateStr: string, timeStr: string): string {
    // Handle various date/time formats and return ISO string
    try {
      const combined = `${dateStr} ${timeStr}`;
      const date = new Date(combined);
      return date.toISOString();
    } catch {
      throw new Error(`Invalid date/time: ${dateStr} ${timeStr}`);
    }
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static generateSlotId(
    provider: string,
    venueId: string,
    startTime: string
  ): string {
    const timestamp = new Date(startTime).getTime();
    return `${provider}_${venueId}_${timestamp}`;
  }
}
