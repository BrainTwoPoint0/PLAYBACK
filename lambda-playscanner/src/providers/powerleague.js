/**
 * PowerLeague Provider for AWS Lambda
 * Scrapes server-rendered booking pages for 5-a-side football availability.
 *
 * Single HTTP request per venue returns ~10 days of availability with prices
 * embedded in data-base-activity attributes. No auth or API key needed.
 */

const https = require('https');
const { URL } = require('url');
const cheerio = require('cheerio');
const { getUKOffset } = require('../utils');

// Curated London-area PowerLeague venues
const VENUES = [
  {
    slug: 'shoreditch',
    name: 'Powerleague Shoreditch',
    id: 'a20a54a1-3bdd-57b8-e211-6f44da11e82f',
    lat: 51.5255,
    lng: -0.0763,
  },
  {
    slug: 'tottenham',
    name: 'Powerleague Tottenham',
    id: 'a951d95c-9eb4-ec90-e211-d9603e4ed88b',
    lat: 51.5906,
    lng: -0.072,
  },
  {
    slug: 'croydon',
    name: 'Powerleague Croydon',
    id: '9a1b8d33-91e7-d88e-e211-0f5fe2796d5c',
    lat: 51.3762,
    lng: -0.0986,
  },
  {
    slug: 'barnet',
    name: 'Powerleague Barnet',
    id: 'f43ae0e2-58fb-11b8-e211-712e3ec94836',
    lat: 51.6532,
    lng: -0.1997,
  },
  {
    slug: 'wembley',
    name: 'Powerleague Wembley',
    id: 'a3c6524d-a502-93aa-e211-a05ac4212183',
    lat: 51.556,
    lng: -0.2796,
  },
  {
    slug: 'romford',
    name: 'Powerleague Romford',
    id: 'a21f6d63-4043-a38a-8214-65baa0218977',
    lat: 51.575,
    lng: 0.1832,
  },
  {
    slug: 'enfield',
    name: 'Powerleague Enfield',
    id: 'e4b590cb-3622-f49d-0314-7558e87f89ed',
    lat: 51.6522,
    lng: -0.0808,
  },
  {
    slug: 'harrow',
    name: 'Powerleague Harrow',
    id: 'ac1c8e58-0f26-c6b9-6214-1e8fc029ef3a',
    lat: 51.5785,
    lng: -0.3379,
  },
  {
    slug: 'watford',
    name: 'Powerleague Watford',
    id: 'd851caae-6f28-8b8d-e211-015f12033cce',
    lat: 51.6565,
    lng: -0.3961,
  },
  {
    slug: 'slough',
    name: 'Powerleague Slough',
    id: 'da93c147-9207-1dae-e211-0a60da660831',
    lat: 51.5105,
    lng: -0.595,
  },
];

class PowerLeagueProvider {
  constructor() {
    this.baseUrl = 'https://www.powerleague.com';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    this.bookingType = '5-a-side Football';
  }

  /**
   * Fetch availability for a given location and date.
   * Each venue page returns ~10 days of availability in one request.
   * We only collect once per venue (first date call), then return per-date from cache.
   */
  async fetchAvailability(params) {
    const { date } = params;

    // Only scrape venues once per collection run
    if (!this._allSlots) {
      this._allSlots = {};
      await this.scrapeAllVenues();
    }

    return this._allSlots[date] || [];
  }

  /**
   * Scrape all venue booking pages. Each page returns ~10 days of availability.
   */
  async scrapeAllVenues() {
    console.log(`🏟️ Scraping ${VENUES.length} PowerLeague venues...`);

    for (const venue of VENUES) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const url = `${this.baseUrl}/booking/select-time?search_booking_type_name=${encodeURIComponent(this.bookingType)}&search_location_id=${venue.id}&search_date=${today}`;

        const html = await this.httpRequest(url);
        const slots = this.parseBookingPage(html, venue);

        // Group by date
        for (const slot of slots) {
          const slotDate = slot.startTime.split('T')[0];
          if (!this._allSlots[slotDate]) this._allSlots[slotDate] = [];
          this._allSlots[slotDate].push(slot);
        }

        console.log(`  ✅ ${venue.name}: ${slots.length} available slots`);
      } catch (error) {
        console.warn(`  ❌ ${venue.name}: ${error.message}`);
      }

      // Rate limit between venues
      await this.sleep(500);
    }
  }

  /**
   * Parse a PowerLeague booking page HTML to extract all available slots.
   */
  parseBookingPage(html, venue) {
    const $ = cheerio.load(html);
    const slots = [];

    // Each day column has data-day-column="YYYY-MM-DD"
    $('[data-day-column]').each((_, col) => {
      const date = $(col).attr('data-day-column');
      if (!date) return;

      // Each calendar card with data-base-activity is a time slot
      $(col)
        .find('[data-base-activity]')
        .each((_, el) => {
          const card = $(el);
          const text = card.text().trim().replace(/\s+/g, ' ');

          // Skip unavailable slots
          if (
            text.includes('Not bookable') ||
            text.includes('Slot Booked') ||
            text.includes('Not available') ||
            text.includes('Unavailable')
          )
            return;

          // Parse activity data (prices, booking type)
          let activity;
          try {
            activity = JSON.parse(card.attr('data-base-activity'));
          } catch {
            return;
          }

          // Parse time from text (e.g. "6:00pm", "10:30am")
          const timeMatch = text.match(/(\d{1,2}:\d{2}(?:am|pm))/i);
          if (!timeMatch) return;

          // Parse duration from text (e.g. "60 min", "40 min")
          const durationMatch = text.match(/(\d+)\s*min/);
          const duration = durationMatch ? parseInt(durationMatch[1], 10) : 60;

          // Convert 12h time to 24h
          const startTime24 = this.to24h(timeMatch[1]);
          const tzOffset = getUKOffset(date);
          const startDt = new Date(`${date}T${startTime24}:00${tzOffset}`);
          const endDt = new Date(startDt.getTime() + duration * 60000);

          const price = activity.DiscountedPrice || activity.FullPrice || 0;

          slots.push({
            provider: 'powerleague',
            sport: 'football',
            listingType: 'pitch_hire',
            venue: {
              id: venue.id,
              name: venue.name,
              slug: venue.slug,
              address: '',
              postcode: '',
              latitude: venue.lat,
              longitude: venue.lng,
              indoor: false,
              surface: '3G',
              amenities: [],
            },
            court: {
              id: `${venue.id}-${date}-${startTime24}`,
              name: activity.BookingTypeName || '5-a-side Pitch',
              surface: '3G',
            },
            startTime: startDt.toISOString(),
            endTime: endDt.toISOString(),
            duration,
            price: Math.round(price * 100), // Convert to pence
            currency: activity.CurrencyCode || 'GBP',
            available: true,
            link: `${this.baseUrl}/booking/select-time?search_booking_type_name=${encodeURIComponent(this.bookingType)}&search_location_id=${venue.id}&search_date=${date}`,
          });
        });
    });

    return slots;
  }

  /**
   * Convert 12h time string to 24h (e.g. "6:00pm" → "18:00")
   */
  to24h(time12) {
    const match = time12.match(/(\d{1,2}):(\d{2})(am|pm)/i);
    if (!match) return '00:00';
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toLowerCase();
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  httpRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const req = https.request(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'text/html',
            'Accept-Language': 'en-GB,en;q=0.9',
          },
          timeout: 15000,
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

module.exports = { PowerLeagueProvider };
