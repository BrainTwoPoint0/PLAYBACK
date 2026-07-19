/**
 * Playtomic Provider for AWS Lambda
 * Optimized version with minimal dependencies
 */

const https = require('https');
const { URL } = require('url');

class PlaytomicProvider {
  constructor() {
    // Playtomic walled off the public api.playtomic.io behind an AWS WAF
    // (blanket 403) and retired /venues/{city}. Both the venue list and
    // availability are now served from the same-origin playtomic.com BFF,
    // which is reachable with plain server-side requests (no browser / token).
    this.baseUrl = 'https://playtomic.com';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

    // DNS resolution timeout and retry settings for Lambda
    this.dnsTimeout = 5000;
    this.maxRetries = 2;
  }

  /**
   * Fetch availability for a given location and date
   */
  async fetchAvailability(params) {
    const { location, date, sport = 'padel' } = params;
    this._currentSport = sport;
    const sportId = sport === 'tennis' ? 'TENNIS' : 'PADEL';

    console.log(`🔍 Fetching Playtomic ${sport} for ${location} on ${date}`);

    try {
      // Step 1: Get venue IDs for the location
      const venues = await this.getVenues(location);

      if (!venues || venues.length === 0) {
        console.log(`No venues found for ${location}`);
        return [];
      }

      console.log(`Found ${venues.length} venues in ${location}`);

      // Step 2: Fetch availability for each venue
      const allSlots = [];
      const batchSize = 5; // Process venues in batches

      for (let i = 0; i < venues.length; i += batchSize) {
        const batch = venues.slice(i, i + batchSize);
        const batchPromises = batch.map((venue) =>
          this.getVenueAvailability(venue, date).catch((err) => {
            console.error(`Failed to fetch venue ${venue.id}:`, err.message);
            return [];
          })
        );

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((slots) => allSlots.push(...slots));

        // Small delay between batches
        if (i + batchSize < venues.length) {
          await this.sleep(500);
        }
      }

      console.log(
        `✅ Collected ${allSlots.length} total slots from ${venues.length} venues`
      );
      return allSlots;
    } catch (error) {
      console.error('Playtomic fetch error:', error);
      throw error;
    }
  }

  /**
   * Get venues for a location using multiple approaches (like working Next.js code)
   */
  async getVenues(location) {
    try {
      const venues = await this.searchVenuesAPI(location);
      if (venues.length > 0) {
        console.log(`Found ${venues.length} venues via API`);
        return venues;
      }
    } catch (error) {
      console.log(`Venue search failed: ${error.message}`);
    }

    return [];
  }

  /**
   * Search venues by scraping Playtomic's public city landing page
   * (e.g. https://playtomic.com/padel-courts/london). The page embeds a flat
   * tenant object per club — { id, slug, name, country_code, address, image } —
   * in its server-rendered payload, which is all we need to fetch availability.
   */
  async searchVenuesAPI(location) {
    const sportPrefix = this._currentSport === 'tennis' ? 'tennis' : 'padel';
    const citySlug = location.toLowerCase().trim().replace(/\s+/g, '-');
    const url = `${this.baseUrl}/${sportPrefix}-courts/${citySlug}`;

    let html;
    try {
      html = await this.httpRequest(url);
    } catch (error) {
      throw new Error(`City page fetch failed (${url}): ${error.message}`);
    }

    const venues = PlaytomicProvider.parseVenues(html);
    console.log(
      `🏙️ Found ${venues.length} venues on ${sportPrefix}-courts/${citySlug}`
    );
    return venues;
  }

  /**
   * Extract venue objects from a city landing page's HTML. Kept static and
   * pure so it can be unit-tested against a captured fixture without any
   * network access. The RSC payload escapes quotes (\") — unescape first,
   * then match each flat tenant object and JSON.parse it (robust to key order).
   */
  static parseVenues(html) {
    const unescaped = String(html || '').replace(/\\"/g, '"');
    const objects = unescaped.match(/\{"id":"[0-9a-f-]{36}"[^{}]*\}/g) || [];

    const byId = new Map();
    for (const raw of objects) {
      let tenant;
      try {
        tenant = JSON.parse(raw);
      } catch {
        continue;
      }
      // A venue object carries a slug + human name + address; other id-objects
      // on the page (images, resources) don't and are skipped.
      if (!tenant.id || !tenant.slug || !tenant.name || !tenant.address) {
        continue;
      }
      if (byId.has(tenant.id)) continue;

      const address = String(tenant.address).trim();
      const postcodeMatch = address.match(
        /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i
      );

      byId.set(tenant.id, {
        id: tenant.id,
        name: String(tenant.name).trim(),
        slug: tenant.slug,
        address,
        postcode: postcodeMatch ? postcodeMatch[0].toUpperCase() : '',
      });
    }

    return [...byId.values()];
  }

  /**
   * Get availability for a specific venue
   */
  async getVenueAvailability(venue, date) {
    const sportId = this._currentSport === 'tennis' ? 'TENNIS' : 'PADEL';

    const queryParams = new URLSearchParams({
      tenant_id: venue.id,
      date, // already in YYYY-MM-DD format
      sport_id: sportId,
    });
    const availabilityUrl = `${this.baseUrl}/api/clubs/availability`;

    try {
      const response = await this.httpRequest(
        `${availabilityUrl}?${queryParams}`
      );
      const data = JSON.parse(response);

      if (!Array.isArray(data)) {
        return [];
      }

      const slots = [];

      // Process availability data exactly like working script
      data.forEach((courtData) => {
        const resourceId = courtData.resource_id;
        const startDate = courtData.start_date;

        (courtData.slots || []).forEach((timeSlot) => {
          // Parse price - handle different formats: "48 GBP", "48.5 GBP", etc.
          let price = 0;
          if (timeSlot.price) {
            const priceMatch = timeSlot.price.match(/(\d+(?:\.\d+)?)/);
            price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          }

          // Create proper date-time strings with explicit UTC
          // Playtomic API returns times in UTC
          const startTime = `${startDate}T${timeSlot.start_time}Z`;
          const startDateTime = new Date(startTime);
          const endDateTime = new Date(
            startDateTime.getTime() + timeSlot.duration * 60 * 1000
          );

          slots.push({
            provider: 'playtomic',
            sport: this._currentSport || 'padel',
            listingType: 'pitch_hire',
            venue,
            court: {
              id: resourceId,
              name: `Court ${resourceId.slice(-4).toUpperCase()}`,
              surface: venue.surface || 'turf',
            },
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            duration: timeSlot.duration || 90,
            price: Math.round(price * 100), // Convert to pence
            currency: 'GBP',
            available: true,
            link: `${this.baseUrl}/clubs/${venue.slug}?sport=${this._currentSport === 'tennis' ? 'TENNIS' : 'PADEL'}&date=${date}`,
          });
        });
      });

      return slots;
    } catch (error) {
      // Silently handle individual venue failures - this is expected for many venues
      return [];
    }
  }

  /**
   * Simple HTTPS request wrapper
   */
  httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const requestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
          'Accept-Language': 'en-GB,en;q=0.9',
          ...options.headers,
        },
        timeout: 10000,
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { PlaytomicProvider };
