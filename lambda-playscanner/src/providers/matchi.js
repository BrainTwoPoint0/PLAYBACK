/**
 * MATCHi Provider for AWS Lambda
 * Scrapes matchi.se HTML endpoints for padel court availability.
 *
 * Rate limit: ~40 requests per 30s window, 30s cooldown after 429.
 * Strategy: fetch schedules only (9 requests), skip individual price fetches.
 * Prices come from the schedule tooltip or are set to 0.
 */

const https = require('https');
const { URL } = require('url');
const cheerio = require('cheerio');
const { getUKOffset } = require('../utils');

class MatchiProvider {
  constructor() {
    this.baseUrl = 'https://www.matchi.se';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    this.defaultSportId = '5'; // Padel
  }

  async fetchAvailability(params) {
    const { location, date, sport = 'padel' } = params;
    this._currentSport = sport;
    this.sportId = sport === 'tennis' ? '1' : this.defaultSportId;

    console.log(`🔍 Fetching MATCHi ${sport} for ${location} on ${date}`);

    try {
      // Step 1: Discover facilities (cached per sport)
      const cacheKey = `${location}_${sport}`;
      if (!this._facilitiesCacheMap) this._facilitiesCacheMap = {};
      if (!this._facilitiesCacheMap[cacheKey]) {
        this._facilitiesCacheMap[cacheKey] =
          await this.findFacilities(location);
        console.log(
          `Found ${this._facilitiesCacheMap[cacheKey].length} MATCHi ${sport} facilities in ${location}`
        );
        // Cooldown after facility discovery
        await this.sleep(3000);
      }
      const facilities = this._facilitiesCacheMap[cacheKey];

      if (!facilities || facilities.length === 0) return [];

      // Step 2: Fetch schedules — collect all slot IDs grouped by facility
      const facilitySlots = new Map(); // facilityId -> { facility, slots[] }

      for (const facility of facilities) {
        try {
          const scheduleSlots = await this.getSchedule(facility, date);
          if (scheduleSlots.length > 0) {
            facilitySlots.set(facility.id, { facility, slots: scheduleSlots });
          }
        } catch (error) {
          if (!error.message.includes('429')) {
            console.warn(
              `MATCHi schedule failed for ${facility.name}: ${error.message}`
            );
          }
        }
        await this.sleep(3000);
      }

      // Step 3: Price sampling — only on first date (cache prices for subsequent dates)
      // Budget: ~10 schedule requests + ~21 price requests = 31 total (under 40 limit)
      if (!this._priceCache) this._priceCache = new Map(); // facilityId -> price samples

      const needsPrices = !this._priceCache.size;
      if (needsPrices) {
        await this.sleep(5000); // Extra cooldown before price phase
      }

      if (needsPrices) {
        for (const [facId, { facility, slots }] of facilitySlots) {
          if (slots.length === 0) continue;

          const indices = [0];
          if (slots.length > 2) indices.push(Math.floor(slots.length / 2));
          if (slots.length > 1) indices.push(slots.length - 1);

          const samples = [];

          for (const idx of indices) {
            try {
              const slotId = slots[idx].slotId;
              const response = await this.httpRequest(
                `${this.baseUrl}/book/getSlotPrices?slotId=${slotId}`,
                { headers: { Accept: 'application/json' } }
              );
              if (response.length > 0) {
                const data = JSON.parse(response);
                if (Array.isArray(data) && data.length > 0) {
                  samples.push({
                    price: data[0].price,
                    currency: data[0].currency,
                  });
                }
              }
            } catch {
              // Skip price failures
            }
            await this.sleep(1000);
          }

          if (samples.length > 0) {
            this._priceCache.set(facId, samples);
          }
        }
      }

      // Apply cached prices to all slots
      for (const [facId, { slots }] of facilitySlots) {
        const samples = this._priceCache.get(facId) || [
          { price: 0, currency: 'GBP' },
        ];

        for (let i = 0; i < slots.length; i++) {
          let price = samples[0];
          if (samples.length >= 3) {
            const third = Math.floor(slots.length / 3);
            if (i < third) price = samples[0];
            else if (i < third * 2) price = samples[1];
            else price = samples[2];
          }
          slots[i]._price = Math.round(price.price * 100);
          slots[i]._currency = price.currency || 'GBP';
        }
      }

      // Step 4: Build final slot objects
      const allSlots = [];
      for (const [, { facility, slots }] of facilitySlots) {
        for (const slot of slots) {
          allSlots.push({
            provider: 'matchi',
            sport: this._currentSport || 'padel',
            listingType: 'pitch_hire',
            venue: {
              id: String(facility.id),
              name: facility.name,
              slug: facility.slug,
              address: facility.location || '',
              postcode: '',
              latitude: 0,
              longitude: 0,
              indoor: false,
              surface: 'artificial grass',
              amenities: [],
            },
            court: {
              id: slot.slotId,
              name: slot.courtName,
              surface: 'artificial grass',
            },
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration,
            price: slot._price || 0,
            currency: slot._currency || 'GBP',
            available: true,
            link: `${this.baseUrl}/facilities/${facility.slug}?date=${date}&sport=${this.sportId}`,
          });
        }
      }

      console.log(
        `✅ MATCHi: ${allSlots.length} slots, ${[...facilitySlots.values()].reduce((s, f) => s + Math.min(3, f.slots.length), 0)} price samples`
      );
      return allSlots;
    } catch (error) {
      console.error('MATCHi fetch error:', error);
      throw error;
    }
  }

  /**
   * Discover facilities via POST /book/findFacilities
   */
  async findFacilities(location) {
    const body = `q=${encodeURIComponent(location)}&sport=${this.sportId}&lang=en_US`;

    const html = await this.httpRequest(`${this.baseUrl}/book/findFacilities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': String(Buffer.byteLength(body)),
      },
      body,
    });

    const $ = cheerio.load(html);
    const facilities = [];

    $('[id^="slots_"]').each((_, slotsEl) => {
      const facilityId = $(slotsEl).attr('id').replace('slots_', '');
      const panel = $(slotsEl).closest('.panel');

      const nameLink = panel.find('.media-heading a').first();
      const name = nameLink.text().trim();
      const href = nameLink.attr('href') || '';
      const slugMatch = href.match(/\/facilities\/([^?]+)/);
      const slug = slugMatch ? slugMatch[1] : facilityId;

      const locationText = panel.find('.fa-map-marker').parent().text().trim();

      if (panel.find('.text-info').text().includes('Only club members')) return;
      if (!name) return;

      facilities.push({ id: facilityId, name, slug, location: locationText });
    });

    return facilities;
  }

  /**
   * Fetch schedule for a single facility
   */
  async getSchedule(facility, date) {
    const url = `${this.baseUrl}/book/schedule?facilityId=${facility.id}&date=${date}&sport=${this.sportId}&indoor=false&wl=`;

    const html = await this.httpRequest(url);
    const $ = cheerio.load(html);
    const slots = [];

    $('td.slot.free').each((_, td) => {
      const $td = $(td);
      const slotId = $td.attr('slotid');
      if (!slotId) return;

      const duration = parseInt($td.attr('data-slot-duration') || '60', 10);

      const title = $td.attr('title') || '';
      const parts = title.split('<br>').map((s) => s.trim());

      let courtName = 'Court';
      let startHour = '';
      let endHour = '';

      if (parts.length >= 3) {
        courtName = parts[1] || 'Court';
        const timeRange = parts[2] || '';
        const timeMatch = timeRange.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        if (timeMatch) {
          startHour = timeMatch[1];
          endHour = timeMatch[2];
        }
      }

      if (!startHour) return;

      const tzOffset = getUKOffset(date);
      const startTime = new Date(`${date}T${startHour}:00${tzOffset}`);
      const endTime = new Date(`${date}T${endHour}:00${tzOffset}`);

      slots.push({
        slotId,
        facility,
        courtName,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
      });
    });

    return slots;
  }

  /**
   * HTTPS request wrapper with retry on 429
   */
  async httpRequest(url, options = {}) {
    try {
      return await this._doRequest(url, options);
    } catch (error) {
      if (error.message.includes('429')) {
        // Don't retry 429s — the Lambda IP may be persistently rate-limited.
        // Just skip this request and move on.
        throw error;
      }
      throw error;
    }
  }

  _doRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const requestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en-GB,en;q=0.9',
          Accept: 'text/html,application/xhtml+xml,*/*',
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

module.exports = { MatchiProvider };
