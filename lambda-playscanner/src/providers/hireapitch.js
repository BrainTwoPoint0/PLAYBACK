/**
 * HireAPitch Provider for AWS Lambda
 * Uses their ASP.NET API for pitch availability at London school venues.
 *
 * Endpoints (all unauthenticated POST):
 *   /venue/getPitchTypes — pitch options per venue
 *   /venue/getBookingSlots — FullCalendar events with availability + prices
 */

const https = require('https');
const { URL } = require('url');

// London HireAPitch venues (discovered via enumeration)
const VENUES = [
  { id: 857, name: 'Haggerston School', slug: 'haggerston-school' },
  { id: 722, name: 'Hackney Marshes Centre', slug: 'hackney-marshes-centre' },
  { id: 790, name: 'Mabley Green', slug: 'mabley-green' },
  { id: 749, name: 'London Fields', slug: 'london-fields' },
  { id: 860, name: 'Shoreditch Park', slug: 'shoreditch-park' },
  { id: 756, name: 'Clissold Park', slug: 'clissold-park' },
  { id: 858, name: 'Haggerston Park', slug: 'haggerston-park' },
  { id: 716, name: 'Daubeney Fields', slug: 'daubeney-fields' },
  { id: 740, name: 'Springfield Park', slug: 'springfield-park' },
  {
    id: 859,
    name: 'Britannia Leisure Centre',
    slug: 'britannia-leisure-centre',
  },
  { id: 511, name: 'Westway Sports Centre', slug: 'Westway' },
];

class HireAPitchProvider {
  constructor() {
    this.baseUrl = 'https://hireapitch.com';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
  }

  async fetchAvailability(params) {
    const { date } = params;

    // Only fetch once per run — gets all dates at once
    if (!this._allSlots) {
      this._allSlots = {};
      await this.scrapeAllVenues();
    }

    return this._allSlots[date] || [];
  }

  async scrapeAllVenues() {
    console.log(`🏫 Scraping HireAPitch (${VENUES.length} venues)...`);

    for (const venue of VENUES) {
      try {
        // Get pitch types first
        const pitchTypes = await this.getPitchTypes(venue.id);
        if (pitchTypes.length === 0) continue;

        // Get slots for each pitch category
        for (const pitch of pitchTypes) {
          try {
            const slots = await this.getBookingSlots(venue, pitch);

            for (const slot of slots) {
              const slotDate = slot.startTime.split('T')[0];
              if (!this._allSlots[slotDate]) this._allSlots[slotDate] = [];
              this._allSlots[slotDate].push(slot);
            }
          } catch {
            // Skip individual pitch failures
          }
        }
      } catch (error) {
        console.warn(`HireAPitch ${venue.name}: ${error.message}`);
      }

      await this.sleep(500);
    }

    const total = Object.values(this._allSlots).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    console.log(`  ✅ HireAPitch: ${total} slots collected`);
  }

  async getPitchTypes(placeId) {
    const body = `PlaceID=${placeId}`;
    const response = await this.httpRequest(
      `${this.baseUrl}/venue/getPitchTypes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': String(Buffer.byteLength(body)),
        },
        body,
      }
    );

    const data = JSON.parse(response);
    if (!Array.isArray(data)) return [];

    // Filter for football-related pitches
    return data.filter((p) => {
      const cat = (p.Category || '').toLowerCase();
      const name = (p.OptionName || '').toLowerCase();
      return (
        cat.includes('football') ||
        cat.includes('a side') ||
        name.includes('pitch') ||
        name.includes('a side') ||
        name.includes('football')
      );
    });
  }

  async getBookingSlots(venue, pitch) {
    // Get slots for the next 7 days
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);

    const body = `PlaceID=${venue.id}&Category=${encodeURIComponent(pitch.Category)}&start=${start.toISOString()}&end=${end.toISOString()}`;

    const response = await this.httpRequest(
      `${this.baseUrl}/venue/getBookingSlots`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': String(Buffer.byteLength(body)),
        },
        body,
      }
    );

    const events = JSON.parse(response);
    if (!Array.isArray(events)) return [];

    const slots = [];
    const now = Date.now();

    for (const event of events) {
      // id=0 or color="#CCCCCC" means booked
      if (event.id === 0 || event.color === '#CCCCCC') continue;

      const startTime = new Date(event.start);
      if (isNaN(startTime.getTime()) || startTime.getTime() < now) continue;

      // Default 1 hour duration
      const endTime = new Date(startTime.getTime() + 60 * 60000);

      // Parse price from title (e.g. "£69.00")
      const priceMatch = (event.title || '').match(/(\d+(?:\.\d+)?)/);
      const price = priceMatch
        ? Math.round(parseFloat(priceMatch[1]) * 100)
        : pitch.Price
          ? Math.round(pitch.Price * 100)
          : 0;

      slots.push({
        provider: 'hireapitch',
        sport: 'football',
        listingType: 'pitch_hire',
        venue: {
          id: String(venue.id),
          name: venue.name,
          slug: venue.slug,
          address: '',
          postcode: '',
          latitude: 0,
          longitude: 0,
          indoor: false,
          surface: 'artificial',
          amenities: [],
        },
        court: {
          id: String(event.id),
          name: event.description || pitch.OptionName || 'Pitch',
          surface: 'artificial',
        },
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: 60,
        price,
        currency: 'GBP',
        available: true,
        link: `${this.baseUrl}/${venue.slug}`,
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
          method: options.method || 'GET',
          headers: {
            'User-Agent': this.userAgent,
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
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = { HireAPitchProvider };
