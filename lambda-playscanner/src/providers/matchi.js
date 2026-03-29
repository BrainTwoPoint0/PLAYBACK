/**
 * MATCHi Provider for AWS Lambda
 * Scrapes matchi.se HTML endpoints for padel court availability
 *
 * Two-step approach:
 *   1. POST /book/findFacilities (no date) — discover London facility IDs/names/slugs
 *   2. GET  /book/schedule per facility per date — get slot table with availability
 *   3. GET  /book/getSlotPrices — batch JSON prices for discovered slot IDs
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

  /**
   * Fetch availability for a given location and date
   */
  async fetchAvailability(params) {
    const { location, date, sport = 'padel' } = params;
    this._currentSport = sport;
    this.sportId = sport === 'tennis' ? '1' : this.defaultSportId;

    console.log(`🔍 Fetching MATCHi ${sport} for ${location} on ${date}`);

    try {
      // Step 1: Discover facilities (cached per sport within a collection run)
      const cacheKey = `${location}_${sport}`;
      if (!this._facilitiesCacheMap) this._facilitiesCacheMap = {};
      if (!this._facilitiesCacheMap[cacheKey]) {
        this._facilitiesCacheMap[cacheKey] =
          await this.findFacilities(location);
        console.log(
          `Found ${this._facilitiesCacheMap[cacheKey].length} MATCHi ${sport} facilities in ${location}`
        );
      }
      const facilities = this._facilitiesCacheMap[cacheKey];

      if (!facilities || facilities.length === 0) {
        console.log(`No MATCHi facilities found for ${location}`);
        return [];
      }

      // Step 2: Fetch schedule for each facility on the target date
      const allSlotIds = [];
      const slotDetails = []; // { slotId, facility, courtName, startTime, endTime, duration }

      for (const facility of facilities) {
        try {
          const scheduleSlots = await this.getSchedule(facility, date);
          for (const slot of scheduleSlots) {
            allSlotIds.push(slot.slotId);
            slotDetails.push(slot);
          }
        } catch (error) {
          console.warn(
            `MATCHi schedule failed for ${facility.name}: ${error.message}`
          );
        }

        // Rate limit: 2s between facility requests (MATCHi aggressively 429s)
        await this.sleep(2000);
      }

      if (allSlotIds.length === 0) {
        console.log(`No available MATCHi slots for ${location} on ${date}`);
        return [];
      }

      // Step 3: Batch-fetch prices
      const priceMap = await this.getSlotPrices(allSlotIds);

      // Step 4: Build final slot objects
      const allSlots = [];
      for (const detail of slotDetails) {
        const price = priceMap[detail.slotId];

        allSlots.push({
          provider: 'matchi',
          sport: this._currentSport || 'padel',
          listingType: 'pitch_hire',
          venue: {
            id: String(detail.facility.id),
            name: detail.facility.name,
            slug: detail.facility.slug,
            address: detail.facility.location || '',
            postcode: '',
            latitude: 0,
            longitude: 0,
            indoor: false,
            surface: 'artificial grass',
            amenities: [],
          },
          court: {
            id: detail.slotId,
            name: detail.courtName,
            surface: 'artificial grass',
          },
          startTime: detail.startTime,
          endTime: detail.endTime,
          duration: detail.duration,
          price: price ? Math.round(price.price * 100) : 0,
          currency: price?.currency || 'GBP',
          available: true,
          link: `${this.baseUrl}/facilities/${detail.facility.slug}?date=${date}&sport=${this.sportId}`,
        });
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
   * Discover facilities via POST /book/findFacilities (no date to get full list)
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

      // Skip members-only facilities
      if (panel.find('.text-info').text().includes('Only club members')) return;
      if (!name) return;

      facilities.push({ id: facilityId, name, slug, location: locationText });
    });

    return facilities;
  }

  /**
   * Fetch schedule for a single facility on a specific date
   * GET /book/schedule?facilityId=X&date=Y&sport=5
   *
   * Returns array of { slotId, facility, courtName, startTime, endTime, duration }
   */
  async getSchedule(facility, date) {
    const url = `${this.baseUrl}/book/schedule?facilityId=${facility.id}&date=${date}&sport=${this.sportId}&indoor=false&wl=`;

    const html = await this.httpRequest(url);
    const $ = cheerio.load(html);
    const slots = [];

    // Find all free slot cells in the schedule table
    $('td.slot.free').each((_, td) => {
      const $td = $(td);
      const slotId = $td.attr('slotid');
      if (!slotId) return;

      const duration = parseInt($td.attr('data-slot-duration') || '60', 10);

      // Parse title: "Available<br>Court 1<br> 07:00 - 08:00"
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

      if (!startHour) return; // Skip if we can't parse the time

      // MATCHi times are UK local time — Lambda runs in UTC so append offset
      // During GMT: +00:00, during BST: +01:00. Use Europe/London heuristic.
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
   * Fetch prices for slot IDs via GET /book/getSlotPrices
   * MATCHi's endpoint is unreliable with multiple IDs — fetch one at a time.
   * Returns map of slotId -> { price, currency }
   */
  async getSlotPrices(slotIds) {
    const priceMap = {};
    if (slotIds.length === 0) return priceMap;

    // Deduplicate slot IDs
    const uniqueIds = [...new Set(slotIds)];

    for (let i = 0; i < uniqueIds.length; i++) {
      const id = uniqueIds[i];
      try {
        const response = await this.httpRequest(
          `${this.baseUrl}/book/getSlotPrices?slotId=${id}`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (response.length > 0) {
          const data = JSON.parse(response);
          if (Array.isArray(data) && data.length > 0) {
            priceMap[data[0].slotId] = {
              price: data[0].price,
              currency: data[0].currency,
            };
          }
        }
      } catch (error) {
        // Skip individual price failures silently
      }

      // Delay to respect rate limits — longer pause every 5 requests
      if ((i + 1) % 5 === 0 && i + 1 < uniqueIds.length) {
        await this.sleep(2000);
      } else if (i + 1 < uniqueIds.length) {
        await this.sleep(300);
      }
    }

    console.log(
      `💰 MATCHi: fetched ${Object.keys(priceMap).length}/${uniqueIds.length} prices`
    );
    return priceMap;
  }

  /**
   * HTTPS request wrapper with retry on 429
   */
  async httpRequest(url, options = {}) {
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this._doRequest(url, options);
        return result;
      } catch (error) {
        if (error.message.includes('429') && attempt < maxRetries) {
          const delay = (attempt + 1) * 3000; // 3s, 6s
          console.log(`⏳ MATCHi rate limited, waiting ${delay}ms...`);
          await this.sleep(delay);
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
