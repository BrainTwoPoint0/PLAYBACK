/**
 * ClubSpark Provider for AWS Lambda
 *
 * ClubSpark is the LTA's (Lawn Tennis Association) national tennis court
 * booking platform — it powers ~2,500 UK tennis venues including a large
 * slice of London public parks and clubs. Anonymous availability lookup
 * works via a clean JSON endpoint (no auth, no CSRF, no Cloudflare).
 *
 * API:
 *   GET https://clubspark.lta.org.uk/{venueSlug}/v0/VenueBooking/{venueSlug}/GetVenueSessions
 *     ?resourceID=            (empty = all resources)
 *     &startDate=YYYY-MM-DD
 *     &endDate=YYYY-MM-DD
 *     &roleId=                (empty = anonymous public role)
 *
 * Response shape (trimmed):
 *   {
 *     TimeZone: "Europe/London",
 *     MinimumInterval: 60,                 // granularity minutes
 *     ResourceGroups: [{ ID, Name, SortOrder }],
 *     Resources: [{
 *       ID, Name, ResourceGroupID, Surface,
 *       Days: [{
 *         Date: "2026-04-13T00:00:00",
 *         Sessions: [{
 *           ID, Category, Name, StartTime, EndTime,  // minutes since midnight LOCAL
 *           Cost, CostFrom, CourtCost, Capacity
 *         }]
 *       }]
 *     }]
 *   }
 *
 * Session categories (derived, not documented):
 *   0     — bookable public session (emit)
 *   1000  — already booked (skip, or emit available=false)
 *   2000  — coaching/programme (skip — not pay-and-play)
 *   8000  — closed (skip)
 *
 * Times are minutes since midnight in Europe/London LOCAL time, so we
 * convert via getUKOffset(date) to UTC ISO for the slot shape.
 */

const https = require('https');
const { URL } = require('url');
const { getUKOffset, sleep } = require('../utils');

// Seed list of known London ClubSpark venues. Each entry carries the slug
// and denormalized venue metadata (name / postcode / lat / lng / address)
// so we can emit slots without a second round-trip to discover venue info.
//
// Slugs confirmed against the live clubspark.lta.org.uk API — entries that
// returned HTTP 500 or were federation-only (no resources) have been
// removed. Discovery source for new entries is LTA venue finder
// (lta.org.uk/play/find-a-tennis-court) filtered to venues whose booking
// links point at clubspark.lta.org.uk. Add new venues by dropping a row
// here with slug + metadata — no code change required.
const LONDON_VENUES = [
  {
    slug: 'ClaphamCommon',
    name: 'Clapham Common Tennis',
    postcode: 'SW4 9DE',
    lat: 51.4607,
    lng: -0.1443,
    address: 'Clapham Common, London SW4 9DE',
  },
  {
    slug: 'WimbledonPark',
    name: 'Wimbledon Park Tennis',
    postcode: 'SW19 8AL',
    lat: 51.4366,
    lng: -0.2061,
    address: 'Home Park Road, London SW19 8AL',
  },
  {
    slug: 'WestHamPark',
    name: 'West Ham Park Tennis',
    postcode: 'E7 9PS',
    lat: 51.545,
    lng: 0.0295,
    address: 'Upton Lane, London E7 9PS',
  },
  {
    slug: 'LarkhallPark',
    name: 'Larkhall Park Tennis',
    postcode: 'SW4 6SP',
    lat: 51.4759,
    lng: -0.1244,
    address: 'Larkhall Park, London SW4 6SP',
  },
  {
    slug: 'HackneyDowns',
    name: 'Hackney Downs Tennis',
    postcode: 'E5 8NR',
    lat: 51.5525,
    lng: -0.0655,
    address: 'Hackney Downs, London E5 8NR',
  },
  {
    slug: 'VictoriaPark',
    name: 'Victoria Park Tennis',
    postcode: 'E9 7DE',
    lat: 51.5362,
    lng: -0.0411,
    address: 'Victoria Park, London E9 7DE',
  },
  {
    slug: 'HollandPark',
    name: 'Holland Park Tennis',
    postcode: 'W8 6LU',
    lat: 51.5033,
    lng: -0.2016,
    address: 'Ilchester Place, London W8 6LU',
  },
  {
    slug: 'AlexandraPark',
    name: 'Alexandra Park Tennis',
    postcode: 'N22 7AY',
    lat: 51.5935,
    lng: -0.1085,
    address: 'Alexandra Palace Way, London N22 7AY',
  },
  {
    slug: 'DulwichPark',
    name: 'Dulwich Park Tennis',
    postcode: 'SE21 7BQ',
    lat: 51.4445,
    lng: -0.0785,
    address: 'College Road, London SE21 7BQ',
  },
  {
    slug: 'BurgessPark',
    name: 'Burgess Park Tennis',
    postcode: 'SE5 0RJ',
    lat: 51.4818,
    lng: -0.0891,
    address: 'Albany Road, London SE5 0RJ',
  },
  {
    slug: 'RegentsPark',
    name: "Regent's Park Tennis",
    postcode: 'NW1 4NR',
    lat: 51.5313,
    lng: -0.1537,
    address: "Outer Circle, Regent's Park, London NW1 4NR",
  },
];

// Session category codes we emit as bookable slots. Everything else is
// skipped (coaching sessions, closures, existing bookings).
const BOOKABLE_CATEGORY = 0;

// Resource group names we treat as tennis courts. Most ClubSpark venues
// only have tennis, but mixed-sport sites (Clapham Common has cricket
// nets) need filtering so we don't emit cricket slots on the tennis page.
const TENNIS_GROUP_PATTERN = /tennis|court/i;
const NON_TENNIS_GROUP_PATTERN =
  /cricket|padel|pickleball|squash|netball|football|basketball/i;

class ClubSparkProvider {
  constructor() {
    this.baseUrl = 'https://clubspark.lta.org.uk';
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    this.requestTimeoutMs = 10000;
    this.batchConcurrency = 5;
  }

  /**
   * Fetch availability for a given location, date, and sport.
   * Returns slot objects in the PLAYScanner provider shape.
   */
  async fetchAvailability(params) {
    const { location, date, sport } = params;

    // Single sport / single city for now. Bail fast if either doesn't apply.
    if (sport && sport !== 'tennis') return [];
    if (location && String(location).toLowerCase() !== 'london') return [];

    console.log(
      `🎾 Fetching ClubSpark tennis for London on ${date} (${LONDON_VENUES.length} venues)`
    );

    const ukOffset = getUKOffset(date);
    const allSlots = [];

    // Parallel fetch in batches to keep request rate polite while not
    // taking forever on 15 venues. Each batch resolves before the next
    // starts so we cap concurrent sockets at batchConcurrency.
    for (let i = 0; i < LONDON_VENUES.length; i += this.batchConcurrency) {
      const batch = LONDON_VENUES.slice(i, i + this.batchConcurrency);
      const batchResults = await Promise.all(
        batch.map((venue) =>
          this.fetchVenue(venue, date, ukOffset).catch((err) => {
            console.warn(`ClubSpark failed for ${venue.slug}: ${err.message}`);
            return [];
          })
        )
      );
      for (const slots of batchResults) allSlots.push(...slots);
      // Small jitter between batches so we don't hammer the edge.
      if (i + this.batchConcurrency < LONDON_VENUES.length) {
        await sleep(200 + Math.random() * 200);
      }
    }

    console.log(
      `✅ ClubSpark: ${allSlots.length} bookable slots from ${LONDON_VENUES.length} venues`
    );
    return allSlots;
  }

  /**
   * GET /{slug}/v0/VenueBooking/{slug}/GetVenueSessions for one venue + one day
   * and flatten the Resources → Days → Sessions tree into provider slots.
   */
  async fetchVenue(venue, date, ukOffset) {
    const url = `${this.baseUrl}/v0/VenueBooking/${venue.slug}/GetVenueSessions?resourceID=&startDate=${date}&endDate=${date}&roleId=`;

    const body = await this.httpRequest(url);
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      throw new Error(`invalid JSON from ${venue.slug}: ${e.message}`);
    }

    if (!data || !Array.isArray(data.Resources)) return [];

    // Build a set of ResourceGroup IDs that correspond to tennis. We allow
    // either an explicit tennis match in the name, or "Courts" (many venues
    // don't disambiguate because they're tennis-only). We explicitly
    // exclude obvious non-tennis groups.
    const tennisGroupIds = new Set();
    for (const group of data.ResourceGroups || []) {
      const name = group.Name || '';
      if (NON_TENNIS_GROUP_PATTERN.test(name)) continue;
      if (
        TENNIS_GROUP_PATTERN.test(name) ||
        (data.ResourceGroups || []).length === 1
      ) {
        tennisGroupIds.add(group.ID);
      }
    }
    // Fallback: no groups at all (rare) → emit everything.
    const filterByGroup = tennisGroupIds.size > 0;

    const slots = [];
    const nowMs = Date.now();

    for (const resource of data.Resources) {
      if (filterByGroup && !tennisGroupIds.has(resource.ResourceGroupID)) {
        continue;
      }
      const courtName = resource.Name || 'Court';
      const courtId = resource.ID || courtName;

      for (const day of resource.Days || []) {
        // `day.Date` looks like "2026-04-13T00:00:00" (no tz). It corresponds
        // to the London-local day, which is what we want as the start for
        // StartTime/EndTime offsets.
        const localDateStr = (day.Date || '').slice(0, 10) || date;

        for (const session of day.Sessions || []) {
          if (session.Category !== BOOKABLE_CATEGORY) continue;

          const startMin = session.StartTime;
          const endMin = session.EndTime;
          if (typeof startMin !== 'number' || typeof endMin !== 'number') {
            continue;
          }

          const startIso = this.localMinutesToIso(
            localDateStr,
            startMin,
            ukOffset
          );
          const endIso = this.localMinutesToIso(localDateStr, endMin, ukOffset);

          // Skip past slots (the flat-table writer also filters, but
          // trimming early keeps payloads small).
          if (new Date(startIso).getTime() <= nowMs) continue;

          const duration = endMin - startMin;
          if (duration < 30) continue;

          // Pricing fallback chain: Cost (the chosen rate) → CostFrom
          // (cheapest rate) → CourtCost (raw court fee, excludes lighting).
          // All are in GBP pounds — multiply to pence for the slot shape.
          const rawCost =
            (typeof session.Cost === 'number' && session.Cost) ||
            (typeof session.CostFrom === 'number' && session.CostFrom) ||
            (typeof session.CourtCost === 'number' && session.CourtCost) ||
            0;
          const pricePence = Math.round(rawCost * 100);

          const bookingUrl = `${this.baseUrl}/${venue.slug}/Booking/BookByDate/${localDateStr}`;

          slots.push({
            provider: 'clubspark',
            sport: 'tennis',
            listingType: 'pitch_hire',
            venue: {
              id: `clubspark-${venue.slug}`,
              name: venue.name,
              slug: venue.slug,
              address: venue.address,
              postcode: venue.postcode,
              latitude: venue.lat,
              longitude: venue.lng,
              indoor: false, // most ClubSpark venues are outdoor parks; tune per-venue later
              surface: 'hard',
            },
            court: {
              id: courtId,
              name: courtName,
              surface: 'hard',
            },
            startTime: startIso,
            endTime: endIso,
            duration,
            price: pricePence,
            currency: 'GBP',
            available: true,
            link: bookingUrl,
          });
        }
      }
    }

    return slots;
  }

  /**
   * Convert a (localDateStr, minutesSinceMidnight, ukOffset) triple into
   * a UTC ISO string. ClubSpark reports session times in London-local
   * minutes since midnight, so we build the offset-aware string and let
   * the Date constructor normalize.
   */
  localMinutesToIso(dateStr, minutes, ukOffset) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return new Date(`${dateStr}T${hh}:${mm}:00${ukOffset}`).toISOString();
  }

  /**
   * Simple HTTPS GET wrapper with timeout and realistic headers.
   */
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
            Accept: 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-GB,en;q=0.9',
            'X-Requested-With': 'XMLHttpRequest',
          },
          timeout: this.requestTimeoutMs,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
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
}

module.exports = { ClubSparkProvider };
