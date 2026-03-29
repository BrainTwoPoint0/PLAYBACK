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

      // Step 2: Fetch schedule for each facility — extract slots WITH prices from HTML
      const allSlots = [];

      for (const facility of facilities) {
        try {
          const scheduleSlots = await this.getSchedule(facility, date);
          for (const slot of scheduleSlots) {
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
              price: 0, // Price requires separate API call — skip to respect rate limits
              currency: 'GBP',
              available: true,
              link: `${this.baseUrl}/facilities/${facility.slug}?date=${date}&sport=${this.sportId}`,
            });
          }
        } catch (error) {
          if (!error.message.includes('429')) {
            console.warn(
              `MATCHi schedule failed for ${facility.name}: ${error.message}`
            );
          }
        }

        // 3s between facilities to stay under rate limit
        await this.sleep(3000);
      }

      console.log(
        `✅ MATCHi: collected ${allSlots.length} slots from ${facilities.length} facilities`
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
    const maxRetries = 1; // Only 1 retry — don't burn budget on retries

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this._doRequest(url, options);
      } catch (error) {
        if (error.message.includes('429') && attempt < maxRetries) {
          console.log(`⏳ MATCHi rate limited, waiting 30s...`);
          await this.sleep(30000); // Full cooldown
          continue;
        }
        throw error;
      }
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
