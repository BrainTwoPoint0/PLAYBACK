import {
  ProviderAdapter,
  RateLimiter,
  ScrapingClient,
  DataTransformer,
  ProviderError,
  ScrapingError,
} from './base';
import { CourtSlot, SearchParams, Venue, PadelMeta } from '../types';

/**
 * Playtomic provider implementation using web scraping
 * Based on research of Playtomic's booking flow and API endpoints
 */
export class PlaytomicProvider implements ProviderAdapter {
  readonly name = 'playtomic';
  readonly sports = ['padel'];
  readonly regions = ['uk', 'es', 'fr', 'it'];
  readonly rateLimit = 0.5; // Slower rate limit for production - 1 request per 2 seconds

  private rateLimiter = new RateLimiter(this.rateLimit);
  private client = new ScrapingClient();
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  // Playtomic uses different base URLs for different regions
  private baseUrls = {
    uk: 'https://playtomic.com',
    es: 'https://playtomic.com',
    fr: 'https://playtomic.com',
    it: 'https://playtomic.com',
  };

  async fetchAvailability(params: SearchParams): Promise<CourtSlot[]> {
    await this.rateLimiter.limit();

    // Debug mode: bypass retry logic in production for testing
    const debugMode = process.env.PLAYSCANNER_DEBUG === 'true';

    if (debugMode) {
      return this.fetchAvailabilityDirect(params);
    }

    return this.withRetry(async () => {
      return this.fetchAvailabilityDirect(params);
    });
  }

  private async fetchAvailabilityDirect(
    params: SearchParams
  ): Promise<CourtSlot[]> {
    const region = this.detectRegion(params.location);
    const baseUrl = this.baseUrls[region] || this.baseUrls.uk;

    const venues = await this.searchVenues(baseUrl, params.location);

    if (venues.length === 0) {
      return [];
    }

    const allSlots: CourtSlot[] = [];

    // Debug mode: process venues one by one instead of batches
    const debugMode = process.env.PLAYSCANNER_DEBUG === 'true';

    if (debugMode) {
      // Process just the first venue for debugging
      try {
        const slots = await this.fetchRealAvailability(venues[0], params);
        allSlots.push(...slots);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Debug mode venue failed:', error);
        }
      }
    } else {
      // Process venues in smaller batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < venues.length; i += batchSize) {
        const batch = venues.slice(i, i + batchSize);

        const batchPromises = batch.map(async (venue) => {
          try {
            await this.rateLimiter.limit();
            return await this.fetchRealAvailability(venue, params);
          } catch (error) {
            // Log error but continue with other venues
            return [];
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            allSlots.push(...result.value);
          }
        });

        // Small delay between batches
        if (i + batchSize < venues.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    const filteredSlots = this.filterAndSortSlots(allSlots, params);

    return filteredSlots;
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay =
          this.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new ScrapingError(
      `Failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      this.name
    );
  }

  private detectRegion(location: string): keyof typeof this.baseUrls {
    const locationLower = location.toLowerCase();

    if (
      locationLower.includes('london') ||
      locationLower.includes('manchester') ||
      locationLower.includes('birmingham') ||
      locationLower.match(/\b(uk|england|britain)\b/)
    ) {
      return 'uk';
    }

    if (
      locationLower.includes('madrid') ||
      locationLower.includes('barcelona') ||
      locationLower.match(/\b(spain|españa)\b/)
    ) {
      return 'es';
    }

    if (
      locationLower.includes('paris') ||
      locationLower.includes('lyon') ||
      locationLower.match(/\b(france|français)\b/)
    ) {
      return 'fr';
    }

    if (
      locationLower.includes('rome') ||
      locationLower.includes('milan') ||
      locationLower.match(/\b(italy|italia)\b/)
    ) {
      return 'it';
    }

    return 'uk'; // Default to UK
  }

  private async searchVenues(
    baseUrl: string,
    location: string
  ): Promise<Venue[]> {
    await this.rateLimiter.limit();

    // Try multiple approaches to find venues
    const searchApproaches = [
      () => this.searchVenuesAPI(baseUrl, location),
      () => this.searchVenuesWeb(baseUrl, location),
      () => this.searchVenuesAlternative(baseUrl, location),
    ];

    for (const approach of searchApproaches) {
      try {
        const venues = await approach();
        if (venues.length > 0) {
          return venues;
        }
      } catch (error) {
        continue;
      }
    }

    return [];
  }

  private async searchVenuesAPI(
    baseUrl: string,
    location: string
  ): Promise<Venue[]> {
    try {
      // Use the discovered Playtomic tenants API
      const coordinates = this.getLocationCoordinates(location);
      const searchUrl = `${baseUrl}/api/v1/tenants`;
      const params = new URLSearchParams({
        coordinate: `${coordinates.lat},${coordinates.lng}`,
        sport_id: 'PADEL',
        radius: '20000', // 20km radius
        size: '50',
      });

      // Add production-specific headers
      const headers: Record<string, string> = {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://playtomic.com/venues/london',
        Origin: 'https://playtomic.com',
      };

      // In production, add more realistic headers
      if (process.env.NODE_ENV === 'production') {
        headers['Sec-Fetch-Site'] = 'same-origin';
        headers['Sec-Fetch-Mode'] = 'cors';
        headers['Sec-Fetch-Dest'] = 'empty';
        headers['Cache-Control'] = 'no-cache';
        headers['Pragma'] = 'no-cache';
      }

      const response = await this.client.fetchJson<any>(
        `${searchUrl}?${params}`,
        { headers }
      );

      if (Array.isArray(response)) {
        // Filter out test venues and inactive venues
        const realVenues = response.filter((tenant: any) => {
          // Only include venues with ACTIVE playtomic_status (real, bookable venues)
          if (tenant.playtomic_status !== 'ACTIVE') {
            return false;
          }

          // Filter out obvious test venues by name patterns
          const name = tenant.tenant_name?.toLowerCase() || '';
          const testPatterns = [
            'test',
            'to be deleted',
            'deleted',
            /^abc\s*$/, // ABC venue
            /^club \d+$/, // "Club 2", "Club 3", etc.
            /^suga$/, // Single word test names
            'playground club', // Obvious test name
            'golden rocket', // Test venue
          ];

          for (const pattern of testPatterns) {
            if (typeof pattern === 'string' && name.includes(pattern)) {
              return false;
            } else if (pattern instanceof RegExp && pattern.test(name)) {
              return false;
            }
          }

          return true;
        });

        return realVenues.map((tenant: any) =>
          this.transformTenant(tenant, baseUrl)
        );
      }

      return [];
    } catch (error) {
      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Playtomic API search failed:', error);
      }
      return [];
    }
  }

  private getLocationCoordinates(location: string): {
    lat: number;
    lng: number;
  } {
    // Simple location to coordinates mapping
    const locationMap: Record<string, { lat: number; lng: number }> = {
      london: { lat: 51.5074, lng: -0.1278 },
      madrid: { lat: 40.4168, lng: -3.7038 },
      barcelona: { lat: 41.3851, lng: 2.1734 },
      paris: { lat: 48.8566, lng: 2.3522 },
      rome: { lat: 41.9028, lng: 12.4964 },
      milan: { lat: 45.4642, lng: 9.19 },
    };

    const key = location.toLowerCase();
    return locationMap[key] || locationMap['london']; // Default to London
  }

  private transformTenant(tenant: any, baseUrl: string): Venue {
    return {
      id: tenant.tenant_id || tenant.tenant_uid,
      name: tenant.tenant_name || 'Unknown Venue',
      provider: 'playtomic',
      location: {
        address: tenant.address?.street || '',
        city: tenant.address?.city || '',
        postcode: tenant.address?.postal_code || '',
        coordinates: {
          lat: tenant.address?.coordinate?.lat || 0,
          lng: tenant.address?.coordinate?.lon || 0,
        },
      },
      amenities: [],
      images: tenant.images || [],
      rating: undefined,
      contact: {
        website: `${baseUrl}/clubs/${tenant.slug || tenant.tenant_uid}`,
      },
      // Store additional tenant data for availability fetching
      _raw: tenant,
    };
  }

  private async searchVenuesWeb(
    baseUrl: string,
    location: string
  ): Promise<Venue[]> {
    return this.scrapeVenueSearch(baseUrl, location);
  }

  private async searchVenuesAlternative(
    baseUrl: string,
    location: string
  ): Promise<Venue[]> {
    // Try searching through different pages or methods
    const searchUrls = [
      `${baseUrl}/venues?location=${encodeURIComponent(location)}&sport=padel`,
      `${baseUrl}/search?q=${encodeURIComponent(location)}&sport=padel`,
      `${baseUrl}/find-venues?city=${encodeURIComponent(location)}`,
    ];

    for (const searchUrl of searchUrls) {
      try {
        const response = await this.client.fetch(searchUrl);
        const html = await response.text();

        const venues = this.parseVenuesFromHTML(html, baseUrl);
        if (venues.length > 0) {
          return venues;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('No alternative search methods worked');
  }

  private async scrapeVenueSearch(
    baseUrl: string,
    location: string
  ): Promise<Venue[]> {
    await this.rateLimiter.limit();

    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(location)}&sport=padel`;

    try {
      const response = await this.client.fetch(searchUrl);
      const html = await response.text();

      return this.parseVenuesFromHTML(html, baseUrl);
    } catch (error) {
      throw new ScrapingError(
        `Failed to scrape venue search: ${(error as Error).message}`,
        this.name
      );
    }
  }

  private parseVenuesFromHTML(html: string, baseUrl: string): Venue[] {
    const venues: Venue[] = [];

    try {
      // Try multiple patterns to find venue data
      const patterns = [
        // Pattern 1: Standard venue cards
        /venue-card.*?data-venue-id="(\d+)".*?venue-name">([^<]+)/g,
        // Pattern 2: Alternative venue structure
        /data-venue="(\d+)".*?class="venue-title">([^<]+)/g,
        // Pattern 3: JSON data in script tags
        /"venues"\s*:\s*\[([^\]]+)\]/g,
        // Pattern 4: React component data
        /venue:\s*{[^}]*id:\s*["'](\d+)["'][^}]*name:\s*["']([^"']+)["']/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null && venues.length < 20) {
          const id = match[1];
          const name = match[2]?.trim();

          if (id && name) {
            venues.push({
              id,
              name: this.cleanVenueName(name),
              provider: 'playtomic',
              location: {
                address: '',
                city: 'London', // Default for now
                postcode: '',
                coordinates: { lat: 0, lng: 0 },
              },
              amenities: [],
              images: [],
              contact: {
                website: `${baseUrl}/venue/${id}`,
              },
            } as Venue);
          }
        }

        if (venues.length > 0) {
          break;
        }
      }

      // If no venues found with patterns, try to extract from structured data
      if (venues.length === 0) {
        const structuredData = this.extractStructuredData(html, baseUrl);
        venues.push(...structuredData);
      }

      return venues;
    } catch (error) {
      return [];
    }
  }

  private cleanVenueName(name: string): string {
    // Clean up venue names by removing HTML entities, extra whitespace, etc.
    return name
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractStructuredData(html: string, baseUrl: string): Venue[] {
    const venues: Venue[] = [];

    try {
      // Look for JSON-LD structured data
      const jsonLdMatches = html.match(
        /<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g
      );

      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          const jsonContent = match
            .replace(/<script[^>]*>/, '')
            .replace(/<\/script>/, '');
          try {
            const data = JSON.parse(jsonContent);
            if (data['@type'] === 'SportsClub' || data.name) {
              venues.push({
                id: `structured_${venues.length}`,
                name: data.name || 'Unknown Venue',
                provider: 'playtomic',
                location: {
                  address: data.address?.streetAddress || '',
                  city: data.address?.addressLocality || 'London',
                  postcode: data.address?.postalCode || '',
                  coordinates: { lat: 0, lng: 0 },
                },
                amenities: [],
                images: data.image ? [data.image] : [],
                contact: {
                  website: data.url || baseUrl,
                  phone: data.telephone,
                },
              } as Venue);
            }
          } catch (e) {}
        }
      }

      return venues;
    } catch (error) {
      return [];
    }
  }

  private async fetchVenueAvailability(
    baseUrl: string,
    venue: Venue,
    params: SearchParams
  ): Promise<CourtSlot[]> {
    await this.rateLimiter.limit();

    try {
      // Playtomic's availability endpoint
      const availabilityUrl = `${baseUrl}/api/v1/venues/${venue.id}/availability`;
      const queryParams = new URLSearchParams({
        date: params.date,
        sport_type: 'padel',
      });

      const response = await this.client.fetchJson<any>(
        `${availabilityUrl}?${queryParams}`
      );

      if (!response.slots) {
        return [];
      }

      return response.slots
        .filter((slot: any) => slot.available)
        .map((slot: any) => this.transformSlot(slot, venue));
    } catch (error) {
      // Fallback to scraping venue page
      return this.scrapeVenueAvailability(baseUrl, venue, params);
    }
  }

  private async scrapeVenueAvailability(
    baseUrl: string,
    venue: Venue,
    params: SearchParams
  ): Promise<CourtSlot[]> {
    await this.rateLimiter.limit();

    const venueUrl = `${baseUrl}/venue/${venue.id}?date=${params.date}`;

    try {
      const response = await this.client.fetch(venueUrl);
      const html = await response.text();

      // Extract availability slots from HTML
      // Look for time slots and prices
      const slotPattern =
        /data-time="([^"]+)".*?data-price="([^"]+)".*?data-court="([^"]+)"/g;
      const slots: CourtSlot[] = [];

      let match;
      while ((match = slotPattern.exec(html)) !== null) {
        const [, timeStr, priceStr, courtId] = match;

        try {
          const startTime = DataTransformer.parseDateTime(params.date, timeStr);
          const endTime = new Date(
            new Date(startTime).getTime() + 90 * 60 * 1000
          ).toISOString(); // 90 min slots
          const price = DataTransformer.parsePrice(priceStr);

          const slot: CourtSlot = {
            id: DataTransformer.generateSlotId(this.name, venue.id, startTime),
            sport: 'padel',
            provider: 'playtomic',
            venue,
            startTime,
            endTime,
            duration: 90,
            price,
            currency: 'GBP',
            bookingUrl: this.getBookingUrl(
              venue.id,
              courtId,
              params.date,
              new Date(startTime)
            ),
            availability: {
              spotsAvailable: 1,
              totalSpots: 1,
            },
            features: {
              indoor: true, // Default for most padel courts
              lights: true,
              surface: 'turf',
            },
            sportMeta: {
              courtType: 'indoor',
              level: 'open',
              doubles: true,
            } as PadelMeta,
            lastUpdated: new Date().toISOString(),
          };

          slots.push(slot);
        } catch (parseError) {}
      }

      return slots;
    } catch (error) {
      throw new ScrapingError(
        `Failed to scrape venue availability: ${(error as Error).message}`,
        this.name
      );
    }
  }

  private transformVenue(apiVenue: any, baseUrl: string): Venue {
    return {
      id: apiVenue.id?.toString() || '',
      name: apiVenue.name || 'Unknown Venue',
      provider: 'playtomic',
      location: {
        address: apiVenue.address || '',
        city: apiVenue.city || '',
        postcode: apiVenue.postal_code || '',
        coordinates: {
          lat: parseFloat(apiVenue.latitude) || 0,
          lng: parseFloat(apiVenue.longitude) || 0,
        },
      },
      amenities: apiVenue.amenities || [],
      images: apiVenue.images?.map((img: any) => img.url) || [],
      rating: apiVenue.rating,
      contact: {
        phone: apiVenue.phone,
        email: apiVenue.email,
        website: `${baseUrl}/venue/${apiVenue.id}`,
      },
    };
  }

  private transformSlot(apiSlot: any, venue: Venue): CourtSlot {
    const startTime = new Date(apiSlot.start_time).toISOString();
    const endTime = new Date(apiSlot.end_time).toISOString();
    const duration =
      (new Date(apiSlot.end_time).getTime() -
        new Date(apiSlot.start_time).getTime()) /
      (1000 * 60);

    return {
      id: DataTransformer.generateSlotId(this.name, venue.id, startTime),
      sport: 'padel',
      provider: 'playtomic',
      venue,
      startTime,
      endTime,
      duration,
      price: DataTransformer.parsePrice(apiSlot.price?.toString() || '0'),
      currency: apiSlot.currency || 'GBP',
      bookingUrl: this.getBookingUrl(venue.id),
      availability: {
        spotsAvailable: apiSlot.available_spots || 1,
        totalSpots: apiSlot.total_spots || 1,
      },
      features: {
        indoor: apiSlot.court?.indoor ?? true,
        lights: apiSlot.court?.lights ?? true,
        surface: apiSlot.court?.surface || 'turf',
      },
      sportMeta: {
        courtType: apiSlot.court?.type || 'indoor',
        level: apiSlot.level || 'open',
        doubles: true,
      } as PadelMeta,
      lastUpdated: new Date().toISOString(),
    };
  }

  private filterAndSortSlots(
    slots: CourtSlot[],
    params: SearchParams
  ): CourtSlot[] {
    let filtered = slots;

    // Filter by time range if specified
    if (params.startTime) {
      const startTimeFilter = new Date(
        `${params.date}T${params.startTime}`
      ).getTime();
      filtered = filtered.filter(
        (slot) => new Date(slot.startTime).getTime() >= startTimeFilter
      );
    }

    if (params.endTime) {
      const endTimeFilter = new Date(
        `${params.date}T${params.endTime}`
      ).getTime();
      filtered = filtered.filter(
        (slot) => new Date(slot.endTime).getTime() <= endTimeFilter
      );
    }

    // Filter by price if specified
    if (params.maxPrice) {
      filtered = filtered.filter((slot) => slot.price <= params.maxPrice!);
    }

    // Filter by indoor/outdoor preference
    if (params.indoor !== undefined) {
      filtered = filtered.filter(
        (slot) => slot.features.indoor === params.indoor
      );
    }

    // Sort by time, then by price
    return filtered.sort((a, b) => {
      const timeCompare =
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (timeCompare !== 0) return timeCompare;
      return a.price - b.price;
    });
  }

  private async fetchRealAvailability(
    venue: Venue,
    params: SearchParams
  ): Promise<CourtSlot[]> {
    await this.rateLimiter.limit();

    // Add small delay to look more human-like
    if (process.env.NODE_ENV === 'production') {
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 1000)
      );
    }

    try {
      const tenant = (venue as any)._raw;
      const tenantId = tenant.tenant_id;

      if (!tenantId) {
        throw new Error(`No tenant_id found for venue ${venue.id}`);
      }

      // Format date for Playtomic API (YYYY-MM-DDTHH:mm:ss)
      const startMin = `${params.date}T00:00:00`;
      const endMax = `${params.date}T23:59:59`;

      const availabilityUrl = 'https://playtomic.com/api/v1/availability';
      const queryParams = new URLSearchParams({
        sport_id: 'PADEL',
        start_min: startMin,
        start_max: endMax,
        tenant_id: tenantId,
      });

      // Add production-specific headers for availability API
      const headers: Record<string, string> = {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `https://playtomic.com/tenant/${tenantId}`,
        Origin: 'https://playtomic.com',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Ch-Ua':
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin', // Changed from same-site since we're using same domain now
        DNT: '1',
      };

      if (process.env.NODE_ENV === 'production') {
        // Add production-specific headers to mimic real browser session
        headers['Accept-Language'] = 'en-GB,en-US;q=0.9,en;q=0.8';
        headers['Accept-Encoding'] = 'gzip, deflate, br';
      }

      const response = await this.client.fetchJson<any[]>(
        `${availabilityUrl}?${queryParams}`,
        { headers }
      );

      if (!Array.isArray(response)) {
        return [];
      }

      const slots: CourtSlot[] = [];

      try {
        response.forEach((resourceAvailability: any) => {
          const resourceId = resourceAvailability.resource_id;
          const resourceSlots = resourceAvailability.slots || [];

          // Find the resource details from tenant data
          const resource = tenant.resources?.find(
            (r: any) => r.resource_id === resourceId
          );

          resourceSlots.forEach((slot: any) => {
            try {
              // Playtomic times are in London time - parse them as local time
              const startTime = new Date(
                `${params.date}T${slot.start_time}`
              );
              const endTime = new Date(
                startTime.getTime() + slot.duration * 60 * 1000
              );

              // Apply user time filters (user times are also in local time)
              if (params.startTime) {
                const userStartTime = new Date(
                  `${params.date}T${params.startTime}`
                );
                if (startTime < userStartTime) return;
              }

              if (params.endTime) {
                const userEndTime = new Date(
                  `${params.date}T${params.endTime}`
                );
                if (endTime > userEndTime) return;
              }

              // Parse price (e.g., "48 GBP" -> 4800 pence)
              const priceMatch = slot.price.match(/(\d+(?:\.\d+)?)/);
              const price = priceMatch
                ? Math.round(parseFloat(priceMatch[1]) * 100)
                : 0;

              // Apply price filter
              if (params.maxPrice && price > params.maxPrice) {
                return;
              }

              const courtSlot: CourtSlot = {
                id: `${this.name}_${venue.id}_${resourceId}_${startTime.getTime()}`,
                sport: 'padel',
                provider: 'playtomic',
                venue,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: slot.duration,
                price,
                currency: 'GBP',
                bookingUrl: this.getBookingUrl(
                  tenant,
                  resourceId,
                  params.date,
                  startTime
                ),
                availability: {
                  spotsAvailable: 1, // If it's in the API response, it's available
                  totalSpots: 1,
                },
                features: {
                  indoor:
                    resource?.properties?.resource_type === 'indoor' || true,
                  lights: true,
                  surface:
                    resource?.properties?.resource_feature === 'wall'
                      ? 'turf'
                      : 'concrete',
                },
                sportMeta: {
                  courtType: resource?.properties?.resource_type || 'indoor',
                  level: 'open',
                  doubles: resource?.properties?.resource_size === 'double',
                } as PadelMeta,
                lastUpdated: new Date().toISOString(),
              };

              slots.push(courtSlot);
            } catch (slotError) {
              // Log individual slot processing errors in development
              if (process.env.NODE_ENV === 'development') {
                console.error(
                  'Error processing slot:',
                  slotError,
                  'Slot data:',
                  slot
                );
              }
              // Continue processing other slots
            }
          });
        });
      } catch (processingError) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            'Error processing availability response:',
            processingError
          );
        }
        throw new Error(
          `Failed to process availability data: ${(processingError as Error).message}`
        );
      }

      return slots;
    } catch (error) {
      const errorMessage = `Failed to fetch availability for venue ${venue.id}: ${(error as Error).message}`;
      if (process.env.NODE_ENV === 'development') {
        console.error(errorMessage, error);
      }
      throw new Error(errorMessage);
    }
  }

  private generateSlotsFromVenue(
    venue: Venue,
    params: SearchParams
  ): CourtSlot[] {
    // This method is now replaced by fetchRealAvailability
    // Keeping it as fallback for non-Playtomic providers
    return [];
  }

  getBookingUrl(
    tenantDataOrVenueId: any,
    resourceId?: string,
    date?: string,
    startTime?: Date
  ): string {
    let slug: string;

    // Handle both new tenant data format and old venue ID format
    if (typeof tenantDataOrVenueId === 'string') {
      // Old format: just venue ID, clean it up
      slug = tenantDataOrVenueId.trim().replace(/[-\s]+$/, '');
    } else if (tenantDataOrVenueId.slug) {
      // New format: tenant data object with slug
      slug = tenantDataOrVenueId.slug;
    } else if (tenantDataOrVenueId.tenant_uid) {
      // New format: tenant data object with tenant_uid
      slug = tenantDataOrVenueId.tenant_uid.trim().replace(/[-\s]+$/, '');
    } else {
      // Fallback: try to use as string
      slug = String(tenantDataOrVenueId)
        .trim()
        .replace(/[-\s]+$/, '');
    }

    // Generate proper Playtomic booking URL using club slug pattern
    return `https://playtomic.com/clubs/${slug}`;
  }

  async getVenueDetails(venueId: string): Promise<Venue> {
    await this.rateLimiter.limit();

    try {
      const response = await this.client.fetchJson<any>(
        `https://playtomic.com/api/v1/venues/${venueId}`
      );
      return this.transformVenue(response, 'https://playtomic.com');
    } catch (error) {
      throw new ProviderError(
        `Failed to fetch venue details: ${(error as Error).message}`,
        this.name,
        'VENUE_FETCH_ERROR'
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.rateLimiter.limit();
      const response = await this.client.fetch('https://playtomic.com');
      return response.ok;
    } catch {
      return false;
    }
  }
}
