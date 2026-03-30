/**
 * HireAPitch Provider for AWS Lambda
 * Dynamically discovers all venues with football pitches via API scan.
 *
 * Endpoints (all unauthenticated POST):
 *   /venue/getPitchTypes — pitch options per venue
 *   /venue/getBookingSlots — FullCalendar events with availability + prices
 */

const https = require('https');
const { URL } = require('url');

// Known venue ID range — scan these for football pitch types
const ID_RANGE = { min: 1, max: 860 };

// Exclude test/invalid venues
const EXCLUDE_IDS = new Set([158, 178, 510]); // Test venues, Solihull (not London)

class HireAPitchProvider {
  constructor() {
    this.baseUrl = 'https://hireapitch.com';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
  }

  async fetchAvailability(params) {
    const { date } = params;

    if (!this._allSlots) {
      this._allSlots = {};
      await this.scrapeAllVenues();
    }

    return this._allSlots[date] || [];
  }

  async scrapeAllVenues() {
    // Discover venues with football pitches (cached across dates)
    if (!this._venues) {
      this._venues = await this.discoverVenues();
      console.log(
        `🏫 HireAPitch: found ${this._venues.length} venues with football`
      );
    }

    for (const venue of this._venues) {
      try {
        for (const pitch of venue.pitches) {
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
        console.warn(`HireAPitch ${venue.id}: ${error.message}`);
      }

      await this.sleep(300);
    }

    const total = Object.values(this._allSlots).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    console.log(
      `  ✅ HireAPitch: ${total} slots from ${this._venues.length} venues`
    );
  }

  /**
   * Discover all venues that have football pitch types.
   * Scans ID range in parallel batches — fast because getPitchTypes is lightweight.
   */
  async discoverVenues() {
    const venues = [];
    const batchSize = 20;

    for (let start = ID_RANGE.min; start <= ID_RANGE.max; start += batchSize) {
      const batch = [];
      for (
        let id = start;
        id < Math.min(start + batchSize, ID_RANGE.max + 1);
        id++
      ) {
        if (EXCLUDE_IDS.has(id)) continue;
        batch.push(this.checkVenue(id));
      }

      const results = await Promise.all(batch);
      for (const result of results) {
        if (result) venues.push(result);
      }

      // Small delay between batches
      await this.sleep(200);
    }

    return venues;
  }

  async checkVenue(id) {
    try {
      const body = `PlaceID=${id}`;
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
      if (!Array.isArray(data) || data.length === 0) return null;

      const footballPitches = data.filter((p) => {
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

      if (footballPitches.length === 0) return null;

      // Get real venue name from page title
      let venueName = `HireAPitch Venue ${id}`;
      try {
        const page = await this.httpRequest(
          `${this.baseUrl}/venue/index/${id}`
        );
        const titleMatch = page.match(/<title>([^|<]+)/);
        if (titleMatch) {
          venueName = titleMatch[1].trim();
        }
      } catch {
        // Fallback to extracting from pitch name
        const sampleName = footballPitches[0].OptionName || '';
        venueName = this.extractVenueName(sampleName, id);
      }

      // URL slug is the venue name kebab-cased
      const slug =
        venueName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || String(id);

      return {
        id,
        name: venueName,
        slug,
        pitches: footballPitches,
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract a venue name from a pitch option name like "Bermondsey 7 a side pitch 1"
   */
  extractVenueName(pitchName, id) {
    // Remove common pitch suffixes
    let name = pitchName
      .replace(/\d+\s*a?\s*-?\s*side.*/i, '')
      .replace(/pitch\s*\d*/i, '')
      .replace(/\d*[gG]\s*(Pitch)?/i, '')
      .replace(/football.*/i, '')
      .replace(/(indoor|outdoor|caged|muga|grass|turf)/i, '')
      .replace(/\s*(on|off)\s*peak.*/i, '')
      .trim();

    if (name.length < 3) name = `HireAPitch Venue ${id}`;
    return name;
  }

  async getBookingSlots(venue, pitch) {
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
      if (event.id === 0 || event.color === '#CCCCCC') continue;

      const startTime = new Date(event.start);
      if (isNaN(startTime.getTime()) || startTime.getTime() < now) continue;

      const endTime = new Date(startTime.getTime() + 60 * 60000);

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
          timeout: 5000,
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
