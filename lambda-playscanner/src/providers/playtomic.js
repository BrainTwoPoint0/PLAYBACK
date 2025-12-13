/**
 * Playtomic Provider for AWS Lambda
 * Optimized version with minimal dependencies
 */

const https = require('https');
const { URL } = require('url');

class PlaytomicProvider {
  constructor() {
    this.baseUrl = 'https://api.playtomic.io';
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
    const { location, date } = params;

    console.log(`🔍 Fetching Playtomic data for ${location} on ${date}`);

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
    // Try multiple search approaches like the working implementation
    const searchApproaches = [
      () => this.searchVenuesAPI(location),
      () => this.searchVenuesWeb(location),
    ];

    for (const approach of searchApproaches) {
      try {
        const venues = await approach();
        if (venues.length > 0) {
          console.log(`Found ${venues.length} venues using approach`);
          return venues;
        }
      } catch (error) {
        console.log(`Search approach failed: ${error.message}`);
        continue;
      }
    }

    return [];
  }

  /**
   * Search venues using API approach (tenants endpoint)
   */
  async searchVenuesAPI(location) {
    const coordinates = this.getLocationCoordinates(location);
    const url = `${this.baseUrl}/v1/tenants`;

    const searchParams = new URLSearchParams({
      coordinate: `${coordinates.lat},${coordinates.lng}`,
      sport_id: 'PADEL',
      radius: '25000', // 25km radius to limit to Greater London area
    });

    try {
      const response = await this.httpRequest(`${url}?${searchParams}`);
      const data = JSON.parse(response);

      if (!data || !Array.isArray(data)) {
        console.log('No venues found in tenants API response');
        return [];
      }

      // Filter to only include London venues using Playtomic's own location data
      const londonVenues = data.filter((venue) => {
        const city = venue.address?.city;

        // Only include venues that are explicitly in London city
        // Exclude outer areas like Purley, Epsom, Romford even if they're in Greater London
        return (
          city === 'London' ||
          city === 'Лондон' || // Russian translation
          city === 'Londra' || // Italian/Turkish translation
          city === 'Londres' // French/Spanish translation
        );
      });

      console.log(
        `🏙️ Filtered ${data.length} venues down to ${londonVenues.length} London venues`
      );

      // Transform venue data
      return londonVenues.map((venue) => ({
        id: venue.tenant_id || venue.id,
        name: venue.tenant_name || venue.name,
        slug: venue.tenant_slug || venue.slug || venue.id,
        address: venue.address || '',
        postcode: venue.postal_code || '',
        latitude: venue.coordinates?.lat || venue.lat || 0,
        longitude: venue.coordinates?.lng || venue.lng || 0,
        indoor: venue.indoor || false,
        surface: venue.surface_type || 'unknown',
        amenities: venue.amenities || [],
      }));
    } catch (error) {
      throw new Error(`Tenants API failed: ${error.message}`);
    }
  }

  /**
   * Search venues using web scraping approach
   */
  async searchVenuesWeb(location) {
    const searchUrl = `${this.baseUrl}/venues?location=${encodeURIComponent(location)}&sport=padel`;

    try {
      const response = await this.httpRequest(searchUrl);
      // For now, return empty array as web scraping would be complex
      // This is a fallback approach
      return [];
    } catch (error) {
      throw new Error(`Web search failed: ${error.message}`);
    }
  }

  /**
   * Get coordinates for a location (London coordinates for now)
   */
  getLocationCoordinates(location) {
    const locationCoords = {
      london: { lat: 51.5074, lng: -0.1278 },
      // Add more cities as needed
    };

    const locationLower = location.toLowerCase();
    return locationCoords[locationLower] || locationCoords['london'];
  }

  /**
   * Get availability for a specific venue
   */
  async getVenueAvailability(venue, date) {
    // Use the exact working implementation from local-collector.js
    const availabilityUrl = 'https://api.playtomic.io/v1/availability';

    // Use correct date format from working script
    const dateStr = date; // date is already in YYYY-MM-DD format
    const startMin = `${dateStr}T00:00:00`;
    const startMax = `${dateStr}T23:59:59`;

    const queryParams = new URLSearchParams({
      sport_id: 'PADEL',
      tenant_id: venue.id,
      start_min: startMin,
      start_max: startMax,
    });

    try {
      // Use exact headers from working script
      const headers = {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://playtomic.com/venues/london',
        Origin: 'https://playtomic.com',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'User-Agent': this.userAgent,
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      };

      const response = await this.httpRequest(
        `${availabilityUrl}?${queryParams}`,
        { headers }
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

          // Create proper date-time strings
          const startTime = `${startDate}T${timeSlot.start_time}`;
          const startDateTime = new Date(startTime);
          const endDateTime = new Date(
            startDateTime.getTime() + timeSlot.duration * 60 * 1000
          );

          slots.push({
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
            link: `https://playtomic.com/venue/${venue.id}?date=${date}&time=${timeSlot.start_time}`,
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
