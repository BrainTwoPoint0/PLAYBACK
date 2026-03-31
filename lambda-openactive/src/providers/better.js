/**
 * Better/GLL OpenActive Provider
 * Polls the Better RPDE feeds for basketball court availability in London.
 *
 * Strategy:
 * 1. Crawl the facility-uses feed (full crawl, no cursor) to build a map of
 *    basketball-related facilities in London.
 * 2. Poll the slots feed incrementally (cursor-based) and match each slot's
 *    facilityUse reference against the basketball facility map.
 * 3. Store matched basketball slots in playscanner_openactive_slots.
 *
 * The Better feed covers all of UK (200+ centres), so London filtering is
 * critical to keep data volume manageable.
 */

const { pollFeed } = require('../feed-consumer');
const { crawlFeed } = require('../feed-consumer-full');
const { getSupabaseClient } = require('../supabase');

// Better feed URLs
const FACILITY_USES_URL =
  'https://better-admin.org.uk/api/openactive/better/facility-uses';
const SLOTS_URL = 'https://better-admin.org.uk/api/openactive/better/slots';

// London bounding box (generous)
const LONDON_BOUNDS = {
  latMin: 51.28,
  latMax: 51.7,
  lngMin: -0.51,
  lngMax: 0.24,
};

// Basketball-related patterns for facility/activity names
const BASKETBALL_NAME_PATTERN =
  /\b(basketball|basket\s*ball|bball|nba\s*court\s*time|3[- ]?on[- ]?3\s*basketball)\b/i;

// Also match basketball in booking URL path segments
const BASKETBALL_URL_PATTERN = /\/(basketball|basket-ball|nba-court)/i;

class BetterProvider {
  constructor() {
    // Map of facilityUse ID (activity_recurrence_group:XXXX) → facility metadata
    // Includes both FacilityUse-level and IndividualFacilityUse-level entries
    this._basketballFacilities = null; // null = not loaded yet
  }

  /**
   * Poll feeds for updates, then build slots for a specific date.
   * @param {object} params - { date: 'YYYY-MM-DD' }
   * @returns {Array} Slot objects for the cache
   */
  async fetchAvailability(params) {
    const { date } = params;

    // Step 1: Load basketball facility map (once per collection run)
    if (!this._polled) {
      await this.loadBasketballFacilities();
      await this.pollSlotsFeed();
      this._polled = true;
    }

    // Step 2: Build slots for the requested date from stored data
    return this.buildSlotsForDate(date);
  }

  /**
   * Crawl the full facility-uses feed and extract basketball facilities in London.
   * This feed is moderate-sized (~200 pages) but we only keep basketball facilities.
   */
  async loadBasketballFacilities() {
    console.log(
      '🏀 Better: Loading basketball facilities from facility-uses feed...'
    );

    const items = await crawlFeed(FACILITY_USES_URL, {
      maxPages: 500,
      timeoutMs: 120000, // 2 minutes for the full facility feed
    });

    console.log(
      `  📋 Better: ${items.length} total facility-uses items received`
    );

    const facilities = {};
    let londonCount = 0;
    let basketballCount = 0;

    for (const item of items) {
      const d = item.data;
      if (!d || !d.location) continue;

      // Extract geo coordinates
      const lat = d.location.geo?.latitude;
      const lng = d.location.geo?.longitude;
      if (lat == null || lng == null) continue;

      // Filter to London only
      if (!this.isInLondon(lat, lng)) continue;
      londonCount++;

      // Check if this facility is basketball-related
      const facilityName = d.name || '';
      const facilityUrl = d.url || '';

      // Check main facility name and URL
      const mainIsBasketball =
        BASKETBALL_NAME_PATTERN.test(facilityName) ||
        BASKETBALL_URL_PATTERN.test(facilityUrl);

      // Check individual facility uses (sub-courts)
      const individualFUs = d.individualFacilityUse || [];
      const basketballIFUs = [];

      for (const ifu of individualFUs) {
        const ifuName = ifu.name || '';
        const ifuUrl = ifu.url || '';
        if (
          BASKETBALL_NAME_PATTERN.test(ifuName) ||
          BASKETBALL_URL_PATTERN.test(ifuUrl)
        ) {
          basketballIFUs.push(ifu);
        }
      }

      // Also check the description for basketball mentions — but treat this
      // as a weaker signal. A leisure centre description saying "basketball,
      // badminton and netball courts" doesn't mean every slot is basketball.
      // We include these facilities in the map but only match their slots
      // if the specific IFU or slot URL confirms basketball.
      const description = d.description || '';
      const descHasBasketball = BASKETBALL_NAME_PATTERN.test(description);

      // If neither the main facility nor any sub-courts are basketball, and
      // description doesn't mention basketball, skip
      if (
        !mainIsBasketball &&
        basketballIFUs.length === 0 &&
        !descHasBasketball
      ) {
        continue;
      }

      basketballCount++;

      // Build venue metadata from the facility-use
      const venue = {
        name: d.location.name || facilityName,
        address: this.formatAddress(d.location.address),
        postcode: d.location.address?.postalCode || '',
        lat,
        lng,
        url: d.url || '',
        indoor: this.isIndoor(d),
      };

      // Store the main FacilityUse ID
      // isMainBasketball is true only when the facility NAME or URL explicitly
      // says basketball (strong signal). Description-only matches are treated
      // as weak — slots must additionally match by IFU or slot URL.
      const fuId = this.extractFacilityUseId(item.id);
      if (fuId) {
        facilities[fuId] = {
          venue,
          facilityName,
          isMainBasketball: mainIsBasketball,
          individualFacilityUses: {},
        };

        // Store individual facility uses and their IDs
        for (const ifu of individualFUs) {
          const ifuId = this.extractIfuHash(ifu['@id']);
          if (ifuId) {
            const isBasketballIFU = basketballIFUs.includes(ifu);
            facilities[fuId].individualFacilityUses[ifuId] = {
              name: ifu.name || facilityName,
              isBasketball: isBasketballIFU,
            };
          }
        }
      }
    }

    this._basketballFacilities = facilities;
    console.log(
      `  🏀 Better: ${basketballCount} basketball facilities found in London (${londonCount} total London facilities scanned)`
    );
  }

  /**
   * Poll the slots RPDE feed incrementally.
   * This is a large feed (covering all of UK). We use cursor-based polling
   * with a high page limit and timeout.
   */
  async pollSlotsFeed() {
    console.log('📡 Better: Polling slots feed...');

    const { updated, deleted } = await pollFeed(SLOTS_URL, {
      maxPages: 500,
      timeoutMs: 180000, // 3 minutes for slots feed
    });

    console.log(
      `  📡 Better: ${updated.length} updated, ${deleted.length} deleted from slots feed`
    );

    // Process updates: filter for basketball slots
    if (updated.length > 0) {
      await this.processUpdates(updated);
    }

    // Process deletions
    if (deleted.length > 0) {
      await this.processDeletions(deleted);
    }
  }

  /**
   * Process updated slot items — match against basketball facility map and store.
   */
  async processUpdates(items) {
    if (!this._basketballFacilities) return;

    const slots = [];

    for (const item of items) {
      const d = item.data;
      if (!d) continue;

      // Must have a start date
      const startDate = d.startDate ? new Date(d.startDate) : null;
      if (!startDate || isNaN(startDate.getTime())) continue;

      // Only future slots (1hr grace period)
      if (startDate.getTime() < Date.now() - 3600000) continue;

      // Check availability
      const remaining = d.remainingUses ?? d.maximumUses ?? 1;
      if (remaining <= 0) continue;

      // Match the slot's facilityUse reference against our basketball facility map
      const match = this.matchSlotToFacility(d);
      if (!match) continue;

      const { venue, courtName } = match;

      // Parse slot data
      const durationMin = this.parseDuration(d.duration);
      const endDate = d.endDate
        ? new Date(d.endDate)
        : new Date(startDate.getTime() + durationMin * 60000);
      const { price, currency } = this.parsePrice(d.offers);
      const bookingUrl = d.url || venue.url || 'https://www.better.org.uk';

      slots.push({
        id: `better_${item.id}`,
        provider: 'better',
        sport: 'basketball',
        listing_type: 'pitch_hire',
        venue_slug: this.slugify(venue.name),
        venue_name: venue.name,
        venue_address: venue.address,
        venue_postcode: venue.postcode,
        venue_lat: venue.lat,
        venue_lng: venue.lng,
        court_name: courtName,
        indoor: venue.indoor,
        surface: 'indoor', // Better basketball is always indoor sports halls
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration: durationMin,
        price,
        currency,
        booking_url: bookingUrl,
        date: startDate.toISOString().split('T')[0],
      });
    }

    if (slots.length > 0) {
      await this.storeSlots(slots);
      console.log(`  🏀 Better: ${slots.length} basketball slots stored`);
    }
  }

  /**
   * Match a slot's facilityUse reference to our basketball facility map.
   * The slot's facilityUse field is a URL like:
   *   .../facility-uses/activity_recurrence_group:XXXX/individual-facility-uses/HASH
   *
   * We extract the group ID and optional IFU hash, then look them up.
   *
   * @returns {{ venue, courtName } | null}
   */
  matchSlotToFacility(slotData) {
    const fuRef = slotData.facilityUse;
    if (!fuRef || typeof fuRef !== 'string') return null;

    // Also check the slot URL for basketball keywords
    const slotUrl = slotData.url || '';
    const slotUrlIsBasketball = BASKETBALL_URL_PATTERN.test(slotUrl);

    // Extract the activity_recurrence_group ID from the facilityUse URL
    const groupMatch = fuRef.match(/activity_recurrence_group:(\d+)/);
    if (!groupMatch) return null;
    const groupId = `activity_recurrence_group:${groupMatch[1]}`;

    const facility = this._basketballFacilities[groupId];
    if (!facility) {
      // Facility not in our basketball map — but check if the slot URL itself
      // indicates basketball (catch any facilities we missed)
      if (slotUrlIsBasketball) {
        // We don't have venue metadata, so we can't include this slot
        // (no location data). Log it for future investigation.
        console.log(
          `  ⚠️ Basketball slot URL detected but facility ${groupId} not in map: ${slotUrl}`
        );
      }
      return null;
    }

    // Extract the individual facility use hash
    const ifuMatch = fuRef.match(/individual-facility-uses\/([a-f0-9]+)/);
    const ifuHash = ifuMatch ? ifuMatch[1] : null;

    // Determine court name
    let courtName = facility.facilityName;

    if (ifuHash && facility.individualFacilityUses[ifuHash]) {
      const ifu = facility.individualFacilityUses[ifuHash];
      courtName = ifu.name;

      // If the main facility is basketball-related, all its slots count.
      // If only specific IFUs are basketball, only match those.
      if (
        !facility.isMainBasketball &&
        !ifu.isBasketball &&
        !slotUrlIsBasketball
      ) {
        return null;
      }
    } else if (!facility.isMainBasketball && !slotUrlIsBasketball) {
      // Main facility isn't basketball and no IFU match — skip
      return null;
    }

    return {
      venue: facility.venue,
      courtName,
    };
  }

  /**
   * Store basketball slots in Supabase (upsert by ID).
   */
  async storeSlots(slots) {
    const supabase = getSupabaseClient();

    // Batch upserts to avoid payload size limits
    const batchSize = 200;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      const { error } = await supabase
        .from('playscanner_openactive_slots')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(
          `Failed to store Better slots batch (${batch.length}): ${error.message}`
        );
      }
    }
  }

  /**
   * Remove deleted slots from the store (batched).
   */
  async processDeletions(deletedIds) {
    if (deletedIds.length === 0) return;

    const supabase = getSupabaseClient();

    // Prefix IDs to match our storage format
    const prefixedIds = deletedIds.map((id) => `better_${id}`);

    const batchSize = 100;
    for (let i = 0; i < prefixedIds.length; i += batchSize) {
      const batch = prefixedIds.slice(i, i + batchSize);
      const { error } = await supabase
        .from('playscanner_openactive_slots')
        .delete()
        .in('id', batch);

      if (error) {
        console.error(`Failed to delete Better slots batch: ${error.message}`);
      }
    }
  }

  /**
   * Build PLAYScanner cache slots for a specific date from stored data.
   */
  async buildSlotsForDate(date) {
    const supabase = getSupabaseClient();

    const { data: rows, error } = await supabase
      .from('playscanner_openactive_slots')
      .select('*')
      .eq('provider', 'better')
      .eq('date', date);

    if (error || !rows) {
      console.warn(
        `Failed to read Better slots for ${date}: ${error?.message}`
      );
      return [];
    }

    return rows.map((row) => ({
      provider: 'better',
      sport: row.sport || 'basketball',
      venue: {
        id: row.venue_slug,
        name: row.venue_name,
        slug: row.venue_slug,
        address: row.venue_address,
        postcode: row.venue_postcode,
        latitude: row.venue_lat,
        longitude: row.venue_lng,
        indoor: row.indoor,
        surface: row.surface,
        amenities: [],
      },
      court: {
        id: row.id,
        name: row.court_name,
        surface: row.surface,
      },
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      price: row.price,
      currency: row.currency,
      available: true,
      link: row.booking_url,
    }));
  }

  // --- Helpers ---

  isInLondon(lat, lng) {
    return (
      lat >= LONDON_BOUNDS.latMin &&
      lat <= LONDON_BOUNDS.latMax &&
      lng >= LONDON_BOUNDS.lngMin &&
      lng <= LONDON_BOUNDS.lngMax
    );
  }

  isIndoor(facilityData) {
    const setting = facilityData['beta:facilitySetting'] || '';
    if (setting.includes('Indoor')) return true;
    if (setting.includes('Outdoor')) return false;
    // Default to indoor for Better sports halls
    return true;
  }

  formatAddress(address) {
    if (!address) return '';
    const parts = [
      address.streetAddress,
      address.addressLocality,
      address.addressRegion,
    ].filter(Boolean);
    return parts.join(', ');
  }

  extractFacilityUseId(itemId) {
    // itemId is like "activity_recurrence_group:XXXX"
    if (!itemId) return null;
    return itemId;
  }

  extractIfuHash(ifuUrl) {
    if (!ifuUrl) return null;
    const match = ifuUrl.match(/individual-facility-uses\/([a-f0-9]+)/);
    return match ? match[1] : null;
  }

  parseDuration(durationStr) {
    if (!durationStr) return 60;
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 60;
    return parseInt(match[1] || '0', 10) * 60 + parseInt(match[2] || '0', 10);
  }

  parsePrice(offers) {
    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return { price: 0, currency: 'GBP' };
    }
    const offer = offers[0];
    return {
      price: Math.round((offer.price ?? 0) * 100),
      currency: offer.priceCurrency || 'GBP',
    };
  }

  slugify(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = { BetterProvider };
