/**
 * Padel Mates Provider for AWS Lambda
 * Uses the unauthenticated v1 API at fastapi-production-fargate.padelmates.io
 *
 * Endpoints used (all unauthenticated):
 *   POST /player/player_booking/nearby_clubs  — club discovery by lat/lng
 *   GET  /player/player_booking/all_courts_slot_prices — availability + prices per club
 */

const https = require('https');
const { URL } = require('url');

class PadelMatesProvider {
  constructor() {
    this.baseUrl = 'https://fastapi-production-fargate.padelmates.io';
    this.webUrl = 'https://padelmates.se';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
  }

  /**
   * Fetch availability for a given location and date
   */
  async fetchAvailability(params) {
    const { location, date } = params;

    console.log(`🔍 Fetching Padel Mates data for ${location} on ${date}`);

    try {
      // Step 1: Discover nearby clubs
      const coordinates = this.getLocationCoordinates(location);
      const clubs = await this.getNearbyClubs(coordinates);

      if (!clubs || clubs.length === 0) {
        console.log(`No Padel Mates clubs found for ${location}`);
        return [];
      }

      console.log(`Found ${clubs.length} Padel Mates clubs near ${location}`);

      // Step 2: Fetch availability for each club
      const allSlots = [];
      const dateObj = new Date(`${date}T00:00:00Z`);
      const startMs = dateObj.getTime();
      const endMs = startMs + 24 * 60 * 60 * 1000 - 1; // end of day

      for (const club of clubs) {
        try {
          const clubSlots = await this.getClubAvailability(
            club,
            startMs,
            endMs,
            date
          );
          allSlots.push(...clubSlots);
        } catch (error) {
          console.warn(`Padel Mates failed for ${club.name}: ${error.message}`);
        }

        // Rate limit: 500ms between club requests
        await this.sleep(500);
      }

      console.log(
        `✅ Padel Mates: collected ${allSlots.length} slots from ${clubs.length} clubs`
      );
      return allSlots;
    } catch (error) {
      console.error('Padel Mates fetch error:', error);
      throw error;
    }
  }

  /**
   * Discover nearby clubs via POST /player/player_booking/nearby_clubs
   */
  async getNearbyClubs(coordinates) {
    const queryParams = new URLSearchParams({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      radius: '50',
      player_id: 'anonymous',
    });

    const response = await this.httpRequest(
      `${this.baseUrl}/player/player_booking/nearby_clubs?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sport: ['padel'] }),
      }
    );

    const data = JSON.parse(response);

    // Response has { filtered_clubs: [...] }
    const clubs = data.filtered_clubs || data;
    if (!Array.isArray(clubs)) return [];

    return clubs
      .filter((club) => !club.club_only) // Skip private clubs
      .map((club) => ({
        id: club._id,
        name: club.name || club.short_name || 'Unknown',
        city: club.city || '',
        address: club.address || '',
        latitude: club.loc?.coordinates?.[1] || 0,
        longitude: club.loc?.coordinates?.[0] || 0,
        indoor: (club.number_of_courts?.indoor_courts || 0) > 0,
        currency: club.currency || 'GBP',
      }));
  }

  /**
   * Get availability for a single club
   * GET /player/player_booking/all_courts_slot_prices (v1, no auth)
   */
  async getClubAvailability(club, startMs, endMs, date) {
    const queryParams = new URLSearchParams({
      club_id: club.id,
      start_datetime: String(startMs),
      end_datetime: String(endMs),
      sport_type: 'PADEL',
    });

    const response = await this.httpRequest(
      `${this.baseUrl}/player/player_booking/all_courts_slot_prices?${queryParams}`
    );

    const courts = JSON.parse(response);
    if (!Array.isArray(courts)) return [];

    const slots = [];

    for (const court of courts) {
      const availableSlots = court.available_slots || [];

      for (const slot of availableSlots) {
        const startTime = new Date(slot.start_datetime);
        const endTime = new Date(slot.end_datetime);

        // Skip past slots
        if (startTime.getTime() < Date.now()) continue;

        const durationMin = Math.round(
          (endTime.getTime() - startTime.getTime()) / 60000
        );

        // Build duration options from interval_prices
        const durationOptions = [];
        let defaultPrice = slot.price || 0;
        let defaultDuration = durationMin;

        if (slot.interval_prices && slot.interval_prices.length > 0) {
          const enabled = slot.interval_prices
            .filter((p) => p.enabled)
            .sort((a, b) => a.duration - b.duration);

          for (const ip of enabled) {
            durationOptions.push({
              duration: ip.duration,
              price: Math.round(ip.price * 100),
            });
          }

          if (enabled.length > 0) {
            defaultPrice = enabled[0].price;
            defaultDuration = enabled[0].duration;
          }
        }

        slots.push({
          provider: 'padel_mates',
          sport: 'padel',
          listingType: 'pitch_hire',
          venue: {
            id: club.id,
            name: club.name,
            slug: club.id,
            address: club.address,
            postcode: '',
            latitude: club.latitude,
            longitude: club.longitude,
            indoor: court.indoor || false,
            surface: 'unknown',
            amenities: [],
          },
          court: {
            id: court._id || slot.slot_id,
            name: court.name || 'Court',
            surface: court.indoor ? 'indoor' : 'outdoor',
          },
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: defaultDuration,
          price: Math.round(defaultPrice * 100),
          durationOptions:
            durationOptions.length > 1 ? durationOptions : undefined,
          currency: club.currency || 'GBP',
          available: true,
          link: `${this.webUrl}/club/${club.id}`,
        });
      }
    }

    return slots;
  }

  /**
   * Get coordinates for a location
   */
  getLocationCoordinates(location) {
    const locationCoords = {
      london: { lat: 51.5074, lng: -0.1278 },
    };

    const locationLower = location.toLowerCase();
    return locationCoords[locationLower] || locationCoords['london'];
  }

  /**
   * HTTPS request wrapper
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
        timeout: 15000,
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
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
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

module.exports = { PadelMatesProvider };
