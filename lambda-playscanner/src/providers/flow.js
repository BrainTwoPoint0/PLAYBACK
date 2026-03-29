/**
 * Flow (OpenPlay) Provider for AWS Lambda
 * Uses the Flow.onl REST API for Royal Parks padel/tennis/football courts.
 *
 * API: https://flow.onl/api/
 * Auth: None needed — just `Client-Domain-Identifier` header per tenant
 *
 * Endpoints:
 *   GET /api/activities/venues — list venues
 *   GET /api/activities/venue/{slug}/activity/{sport}/v2/times?date=YYYY-MM-DD — availability
 *   GET /api/activities/venue/{slug}/activity/{sport}/v2/slots?date=YYYY-MM-DD — per-court detail
 */

const https = require('https');
const { URL } = require('url');

// Flow tenants with London venues
const TENANTS = [
  {
    clientDomain: 'sportsandleisureroyalparks',
    name: 'Royal Parks',
    venues: [
      {
        slug: 'the-regents-park-courts',
        name: "Regent's Park Courts",
        sports: ['padel', 'tennis'],
        lat: 51.5273,
        lng: -0.1535,
        postcode: 'NW1 4NR',
      },
      {
        slug: 'hyde-park-courts',
        name: 'Hyde Park Courts',
        sports: ['padel', 'tennis', 'football'],
        lat: 51.5073,
        lng: -0.1657,
        postcode: 'W2 2UH',
      },
      {
        slug: 'greenwich-park-courts',
        name: 'Greenwich Park Courts',
        sports: ['tennis'],
        lat: 51.4769,
        lng: -0.0005,
        postcode: 'SE10 8QY',
      },
    ],
  },
];

class FlowProvider {
  constructor() {
    this.apiBase = 'https://flow.onl/api';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
  }

  async fetchAvailability(params) {
    const { date } = params;

    console.log(`🌳 Fetching Flow/Royal Parks for ${date}`);

    const allSlots = [];

    for (const tenant of TENANTS) {
      for (const venue of tenant.venues) {
        for (const sport of venue.sports) {
          try {
            const slots = await this.getSlots(
              tenant.clientDomain,
              venue,
              sport,
              date
            );
            allSlots.push(...slots);
          } catch (error) {
            // Skip individual failures silently
          }

          await this.sleep(300);
        }
      }
    }

    console.log(`  ✅ Flow: ${allSlots.length} slots collected`);
    return allSlots;
  }

  async getSlots(clientDomain, venue, sport, date) {
    const url = `${this.apiBase}/activities/venue/${venue.slug}/activity/${sport}/v2/slots?date=${date}`;

    const response = await this.httpRequest(url, {
      headers: {
        'Client-Domain-Identifier': clientDomain,
        Accept: 'application/json',
      },
    });

    const data = JSON.parse(response);
    const items = data.data || data || [];
    if (!Array.isArray(items)) return [];

    const slots = [];
    const now = Date.now();

    for (const item of items) {
      // Skip full/unavailable slots
      if (item.action_to_show?.status !== 'BOOK') continue;

      const startHour = item.starts_at?.format_24_hour;
      const endHour = item.ends_at?.format_24_hour;
      if (!startHour) continue;

      const startTime = new Date(`${date}T${startHour}:00Z`);
      if (startTime.getTime() < now) continue;

      const endTime = endHour
        ? new Date(`${date}T${endHour}:00Z`)
        : new Date(startTime.getTime() + 60 * 60000);

      const durationMin = Math.round(
        (endTime.getTime() - startTime.getTime()) / 60000
      );

      // Price: raw is in pence, may be null for some sports without auth
      const price = item.price?.raw || 0;

      const courtName = item.location?.name || item.name || `${sport} Court`;

      const slotSport =
        sport === 'padel'
          ? 'padel'
          : sport === 'tennis'
            ? 'tennis'
            : 'football';

      slots.push({
        provider: 'flow',
        sport: slotSport,
        listingType: 'pitch_hire',
        venue: {
          id: `flow-${venue.slug}`,
          name: venue.name,
          slug: venue.slug,
          address: '',
          postcode: venue.postcode || '',
          latitude: venue.lat || 0,
          longitude: venue.lng || 0,
          indoor: false,
          surface: sport === 'padel' ? 'artificial' : 'grass',
          amenities: [],
        },
        court: {
          id: item.id || item.composite_key || '',
          name: courtName,
          surface: sport === 'padel' ? 'artificial' : 'grass',
        },
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: durationMin,
        price,
        currency: 'GBP',
        available: true,
        link: `https://${TENANTS[0].clientDomain}.bookings.flow.onl/location/${venue.slug}/${sport}/${date}/by-time`,
      });
    }

    return slots;
  }

  httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const req = https.request(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'application/json',
            ...options.headers,
          },
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = { FlowProvider };
