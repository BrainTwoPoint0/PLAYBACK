/**
 * Bookteq OpenActive Provider
 * Polls RPDE feeds incrementally from curated London Bookteq venues.
 *
 * Uses cursor-based RPDE polling:
 * - First run: crawls entire feed (may take multiple Lambda invocations to catch up)
 * - Subsequent runs: only processes changes since last cursor position
 *
 * Maintains a local slot store in Supabase (playscanner_openactive_slots) so we can
 * build date-based cache snapshots at any time.
 */

const { pollFeed } = require('../feed-consumer');
const { getSupabaseClient } = require('../supabase');

// Football-related name patterns
const FOOTBALL_NAME_PATTERN =
  /\b(football|pitch|5[- ]?a[- ]?side|6[- ]?a[- ]?side|7[- ]?a[- ]?side|8[- ]?a[- ]?side|9[- ]?a[- ]?side|11[- ]?a[- ]?side|3[gG]|4[gG]|astro|futsal|arena|muga)\b/i;

// Basketball-related name patterns
const BASKETBALL_NAME_PATTERN =
  /\b(basketball|basket\s*ball|bball|nba\s*court\s*time|3[- ]?on[- ]?3\s*basketball)\b/i;

// Exclude non-sport
const EXCLUDE_PATTERN =
  /\b(cricket|rugby|hockey|netball|tennis|padel|badminton|swimming|squash|changing room)\b/i;

class BookteqProvider {
  constructor(venues) {
    this.venues = venues;
    // Map of facilityUse UUID → name, keyed by venue slug
    this._facilityNames = {};
  }

  /**
   * Poll all venue feeds for updates, then build slots for a specific date.
   * @param {object} params - { date: 'YYYY-MM-DD' }
   * @returns {Array} Slot objects for the cache
   */
  async fetchAvailability(params) {
    const { date } = params;

    // Step 1: Poll all venue feeds for new data (incremental)
    // Only do this once per collection run (for the first date)
    if (!this._polled) {
      await this.pollAllVenues();
      this._polled = true;
    }

    // Step 2: Build slots for the requested date from stored data
    return this.buildSlotsForDate(date);
  }

  /**
   * Poll all venue RPDE feeds for incremental updates.
   * Also loads FacilityUse names for court name resolution.
   */
  async pollAllVenues() {
    console.log(`📡 Polling ${this.venues.length} OpenActive feeds...`);

    for (const venue of this.venues) {
      try {
        // Load facility names (small feed, usually 1-2 pages)
        await this.loadFacilityNames(venue);

        // Bookteq: /api/open-active/slots, Legend: /api/facility-uses/events
        const feedUrl = venue.slotsPath
          ? `${venue.feedBaseUrl}${venue.slotsPath}`
          : `${venue.feedBaseUrl}/slots`;
        const { updated, deleted } = await pollFeed(feedUrl, {
          maxPages: 200,
          timeoutMs: 15000, // 15s per venue
        });

        // Process updates: store valid football slots
        if (updated.length > 0) {
          await this.processUpdates(venue, updated);
        }

        // Process deletions
        if (deleted.length > 0) {
          await this.processDeletions(deleted);
        }
      } catch (error) {
        console.warn(`Poll failed for ${venue.name}: ${error.message}`);
      }

      // Small delay between venues
      await this.sleep(200);
    }
  }

  /**
   * Process updated items from the feed — extract football slots and store them
   */
  async processUpdates(venue, items) {
    const slots = [];

    for (const item of items) {
      const d = item.data;
      if (!d) continue;

      // Must have a start date
      const startDate = d.startDate ? new Date(d.startDate) : null;
      if (!startDate || isNaN(startDate.getTime())) continue;

      // Only future slots
      if (startDate.getTime() < Date.now() - 3600000) continue; // Allow 1hr grace

      // Check availability
      const remaining = d.remainingUses ?? d.maximumUses ?? 1;
      if (remaining <= 0) continue;

      // Get facility name (resolved from FacilityUse feed)
      const facilityName = this.extractFacilityName(d, venue.slug);

      // Also check activity labels (Legend feeds use this instead of names)
      const activityLabels = (d.activity || [])
        .map((a) => a.prefLabel || '')
        .join(' ');
      const combinedText = `${facilityName} ${activityLabels}`;

      // Determine sport from name/activity
      const isFootball = FOOTBALL_NAME_PATTERN.test(combinedText);
      const isBasketball = BASKETBALL_NAME_PATTERN.test(combinedText);
      if (!isFootball && !isBasketball) continue;
      if (EXCLUDE_PATTERN.test(combinedText)) continue;

      const sport = isBasketball ? 'basketball' : 'football';

      // Parse slot data
      const durationMin = this.parseDuration(d.duration);
      const endDate = d.endDate
        ? new Date(d.endDate)
        : new Date(startDate.getTime() + durationMin * 60000);
      const { price, currency } = this.parsePrice(d.offers);
      const bookingUrl =
        d.url || d.offers?.[0]?.url || `https://${venue.slug}.bookteq.com`;

      slots.push({
        id: item.id,
        provider: 'openactive',
        sport,
        listingType: 'pitch_hire',
        venue_slug: venue.slug,
        venue_name: venue.name,
        venue_address: venue.address || '',
        venue_postcode: venue.postcode || '',
        venue_lat: venue.latitude || 0,
        venue_lng: venue.longitude || 0,
        court_name: facilityName,
        indoor: facilityName.toLowerCase().includes('indoor'),
        surface: this.guessSurface(facilityName),
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
    }
  }

  /**
   * Store football slots in Supabase for later retrieval by date
   */
  async storeSlots(slots) {
    const supabase = getSupabaseClient();

    // Upsert slots (replace existing by ID)
    const { error } = await supabase
      .from('playscanner_openactive_slots')
      .upsert(slots, { onConflict: 'id' });

    if (error) {
      console.error(`Failed to store ${slots.length} slots: ${error.message}`);
    }
  }

  /**
   * Remove deleted slots from the store (batched to avoid 414 URI Too Large)
   */
  async processDeletions(deletedIds) {
    if (deletedIds.length === 0) return;

    const supabase = getSupabaseClient();

    // Batch deletions in groups of 100 to avoid URI length limits
    const batchSize = 100;
    for (let i = 0; i < deletedIds.length; i += batchSize) {
      const batch = deletedIds.slice(i, i + batchSize);
      const { error } = await supabase
        .from('playscanner_openactive_slots')
        .delete()
        .in('id', batch);

      if (error) {
        console.error(`Failed to delete batch: ${error.message}`);
      }
    }
  }

  /**
   * Build PLAYScanner cache slots for a specific date from the stored data
   */
  async buildSlotsForDate(date) {
    const supabase = getSupabaseClient();

    const { data: rows, error } = await supabase
      .from('playscanner_openactive_slots')
      .select('*')
      .eq('date', date);

    if (error || !rows) {
      console.warn(`Failed to read slots for ${date}: ${error?.message}`);
      return [];
    }

    // Transform to PLAYScanner cache format
    return rows.map((row) => ({
      provider: 'openactive',
      sport: row.sport || 'football',
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

  /**
   * Load FacilityUse feed for a venue to build a UUID → name map.
   * Always crawls from the beginning (no cursor) since we need the full list
   * and these feeds are small (typically 1-2 pages).
   */
  async loadFacilityNames(venue) {
    if (this._facilityNames[venue.slug]) return; // Already loaded this run

    try {
      const { crawlFeed } = require('../feed-consumer-full');
      const fuPath = venue.facilityUsesPath || '/facility-uses';
      const items = await crawlFeed(`${venue.feedBaseUrl}${fuPath}`, {
        maxPages: 10,
        timeoutMs: 10000,
      });

      const nameMap = {};
      for (const item of items) {
        if (item.data?.name && item.id) {
          nameMap[item.id] = item.data.name;
        }
      }

      this._facilityNames[venue.slug] = nameMap;
      if (Object.keys(nameMap).length > 0) {
        console.log(
          `  📋 ${venue.slug}: ${Object.keys(nameMap).length} facility names loaded`
        );
      }
    } catch (error) {
      console.warn(
        `Failed to load facility names for ${venue.name}: ${error.message}`
      );
      this._facilityNames[venue.slug] = {};
    }
  }

  /**
   * Extract facility name from slot data, using the FacilityUse name map as fallback.
   */
  extractFacilityName(slotData, venueSlug) {
    // Direct name on the slot
    if (slotData.name) return slotData.name;

    // Name on an inline facilityUse object
    if (slotData.facilityUse?.name) return slotData.facilityUse.name;

    // Look up from the facilityUse URL reference
    if (
      typeof slotData.facilityUse === 'string' &&
      this._facilityNames[venueSlug]
    ) {
      // Extract UUID from URL like ".../facility-uses/41e9e0a2-c4c0-4d05-a78a-08b678aea110"
      const parts = slotData.facilityUse.split('/');
      const fuId = parts[parts.length - 1];
      const name = this._facilityNames[venueSlug][fuId];
      if (name) return name;
    }

    if (slotData.superEvent?.name) return slotData.superEvent.name;
    return 'Pitch';
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

  guessSurface(name) {
    const lower = name.toLowerCase();
    if (lower.includes('3g') || lower.includes('4g') || lower.includes('astro'))
      return '3G';
    if (lower.includes('grass')) return 'grass';
    if (lower.includes('indoor')) return 'indoor';
    if (lower.includes('concrete')) return 'concrete';
    return 'artificial';
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = { BookteqProvider };
