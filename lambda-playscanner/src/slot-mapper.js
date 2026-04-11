/**
 * Pure helpers for the flat-table migration.
 *
 * Shared between lambda-playscanner, lambda-openactive, and (eventually) the
 * PLAYBACK/src/lib/playscanner TS port. No Supabase calls here — these are
 * deterministic conversions between the per-provider "raw slot" shape, the
 * `playscanner_slots` table row shape, and the API-facing CourtSlot shape.
 *
 * Canonical location: lambda-playscanner/src/slot-mapper.js
 * Duplicated to: lambda-openactive/src/slot-mapper.js (Phase 1)
 * Ported to TS: PLAYBACK/src/lib/playscanner/slot-mapper.ts (Phase 2)
 */

const FOOTBALL_ONLY_PROVIDERS = [
  'openactive',
  'powerleague',
  'goals',
  'footy_addicts',
  'fc_urban',
  'hireapitch',
];
const PADEL_ONLY_PROVIDERS = ['padel_mates'];

/**
 * Normalize the venue address grab-bag. Providers return one of:
 *   - slot.venue.address as a string (flow, matchi, better)
 *   - slot.venue.address as an object { city, street, postal_code, coordinate: { lat, lon } }  (playtomic)
 *   - slot.venue.location as { city, ... } (some openactive shapes)
 *   - flat fields on slot.venue: latitude, longitude, postcode
 */
function normalizeVenue(rawVenue) {
  const v = rawVenue || {};
  const addr = (typeof v.address === 'object' && v.address) || v.location || {};

  const city =
    addr.city || v.city || (v.location && v.location.city) || 'London';

  const street =
    addr.street ||
    addr.address ||
    (typeof v.address === 'string' ? v.address : '') ||
    '';

  const postcode =
    addr.postal_code || addr.postcode || v.postcode || v.postal_code || '';

  const lat =
    (addr.coordinate && addr.coordinate.lat) || v.latitude || v.lat || 0;

  const lng =
    (addr.coordinate && addr.coordinate.lon) ||
    (addr.coordinate && addr.coordinate.lng) ||
    v.longitude ||
    v.lng ||
    0;

  return {
    id: v.id || '',
    name: v.name || 'Unknown Venue',
    slug: v.slug || null,
    street,
    city,
    postcode,
    lat,
    lng,
    indoor: v.indoor === true,
    surface: v.surface || null,
  };
}

/**
 * Resolve the final sport for a slot. Prefer the explicit slot.sport, then
 * fall back to provider-based detection for providers that only serve one sport.
 * Mirrors the logic in persistent-cache.ts transformLambdaSlot (lines 536-561).
 */
function resolveSport(slot) {
  if (
    slot.sport === 'padel' ||
    slot.sport === 'tennis' ||
    slot.sport === 'football' ||
    slot.sport === 'basketball'
  ) {
    return slot.sport;
  }
  if (FOOTBALL_ONLY_PROVIDERS.includes(slot.provider)) return 'football';
  if (PADEL_ONLY_PROVIDERS.includes(slot.provider)) return 'padel';
  return 'padel';
}

/**
 * Build the stable natural key for the playscanner_slots primary key.
 *
 * Format: `${provider}:${venue_id}:${court_name}:${start_time_iso}`
 *
 * Uses court_name rather than court_id because several providers rotate
 * court IDs between scrapes (MATCHi's slotId is a per-request booking token,
 * FC Urban falls back to positional index). court_name is a stable text label
 * across runs, and it's the thing users actually see/book. The trade-off:
 * courts at the same venue that share a display name (rare) will collide on
 * the same (start_time) — in practice that means we pick one per time slot,
 * which matches user expectation.
 */
function buildSlotId(slot) {
  const provider = slot.provider || 'unknown';
  const venueId = (slot.venue && slot.venue.id) || 'unknown-venue';
  const courtName =
    (slot.court && slot.court.name) || (slot.court && slot.court.id) || 'court';
  const startTime = slot.startTime || slot.start_time;
  return `${provider}:${venueId}:${courtName}:${startTime}`;
}

/**
 * Convert a provider-produced slot into a row object ready to upsert into
 * `playscanner_slots`. Takes a city override (lowercased) because the
 * providers don't always set it reliably on the venue object.
 *
 * Does NOT set `collected_at` — the writer is expected to use the database's
 * NOW() at insert time via the MERGE statement (not a client-side timestamp),
 * to avoid clock skew between Lambda and Postgres.
 */
function slotToRow(slot, city) {
  const venue = normalizeVenue(slot.venue);
  const sport = resolveSport(slot);
  const court = slot.court || {};

  return {
    id: buildSlotId(slot),
    provider: slot.provider,
    sport,
    listing_type: slot.listingType || slot.listing_type || 'pitch_hire',
    city: (city || 'london').toLowerCase(),
    venue_id: venue.id,
    venue_name: venue.name,
    venue_slug: venue.slug,
    venue_address: venue.street,
    venue_postcode: venue.postcode,
    venue_lat: venue.lat,
    venue_lng: venue.lng,
    venue_indoor: venue.indoor,
    venue_surface: venue.surface,
    court_id: court.id || null,
    court_name: court.name || null,
    court_surface:
      court.surface === 'unknown' ? 'artificial' : court.surface || null,
    start_time: slot.startTime || slot.start_time,
    end_time: slot.endTime || slot.end_time,
    duration: slot.duration || 60,
    price: slot.price || 0,
    currency: slot.currency || 'GBP',
    booking_url: slot.link || slot.bookingUrl || null,
    available: slot.available !== false,
  };
}

/**
 * Convert a flat `playscanner_slots` row back into the CourtSlot API shape.
 * This replaces `persistent-cache.ts:transformLambdaSlot` — all the fields
 * the old transform had to derive from loose provider shapes are already
 * materialized in the row, so this is a straight field-by-field build.
 */
function rowToCourtSlot(row) {
  const sport = row.sport;
  const provider = row.provider;

  let sportMeta;
  if (sport === 'football') {
    sportMeta = {
      format: '5v5',
      organized: false,
      level: 'casual',
      requiresTeam: false,
    };
  } else if (sport === 'tennis') {
    sportMeta = {
      courtType: row.venue_indoor ? 'indoor' : 'outdoor',
      surface: 'hard',
      format: 'doubles',
    };
  } else if (sport === 'basketball') {
    sportMeta = { format: '5v5', level: 'casual' };
  } else {
    sportMeta = {
      courtType: row.venue_indoor ? 'indoor' : 'outdoor',
      level: 'open',
      doubles: true,
    };
  }

  const bookingUrl =
    row.booking_url ||
    (provider === 'playtomic'
      ? `https://playtomic.com/venue/${row.venue_id}`
      : '');

  return {
    id: row.id,
    sport,
    provider,
    listingType: row.listing_type || 'pitch_hire',
    venue: {
      id: row.venue_id,
      name: row.venue_name,
      provider,
      location: {
        address: row.venue_address || '',
        city: row.city,
        postcode: row.venue_postcode || '',
        coordinates: {
          lat: row.venue_lat || 0,
          lng: row.venue_lng || 0,
        },
      },
      address: {
        city: row.city,
        postcode: row.venue_postcode || '',
        street: row.venue_address || '',
      },
      amenities: [],
      images: [],
      contact: {},
    },
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    price: row.price,
    currency: row.currency,
    bookingUrl,
    collectedAt: row.collected_at,
    courtName: row.court_name || undefined,
    availability: {
      spotsAvailable: row.available ? 1 : 0,
      totalSpots: 1,
    },
    features: {
      indoor: row.venue_indoor === true,
      lights: true,
      surface: row.court_surface || row.venue_surface || 'artificial',
    },
    sportMeta,
    lastUpdated: row.collected_at || new Date().toISOString(),
  };
}

/**
 * Apply the in-memory filter + sort that persistent-cache.ts:search() does
 * today. Kept as a pure function for two reasons:
 *   1. Phase 0 tests can verify semantic equivalence against a blob fixture
 *      without a real Supabase instance.
 *   2. The Phase 2 Supabase query will push most of this into SQL, but the
 *      client-side fallbacks (e.g. time-range filters that span date
 *      boundaries) still need the same logic.
 *
 * @param rows   flat rows in `playscanner_slots` shape
 * @param params { sport, startTime?, endTime?, maxPrice?, indoor?, date }
 * @param nowMs  current time in ms (injectable for tests)
 */
function filterAndSort(rows, params, nowMs) {
  const now = nowMs != null ? nowMs : Date.now();

  let out = rows.filter((row) => {
    if (row.available === false) return false;
    if (row.sport !== params.sport) return false;
    if (new Date(row.start_time).getTime() <= now) return false;
    return true;
  });

  if (params.startTime) {
    const threshold = new Date(`${params.date}T${params.startTime}`).getTime();
    out = out.filter((r) => new Date(r.start_time).getTime() >= threshold);
  }

  if (params.endTime) {
    const threshold = new Date(`${params.date}T${params.endTime}`).getTime();
    out = out.filter((r) => new Date(r.end_time).getTime() <= threshold);
  }

  if (params.maxPrice != null) {
    out = out.filter((r) => r.price <= params.maxPrice);
  }

  if (params.indoor != null) {
    out = out.filter((r) => r.venue_indoor === params.indoor);
  }

  out.sort((a, b) => {
    const tDiff =
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (tDiff !== 0) return tDiff;
    return a.price - b.price;
  });

  return out;
}

module.exports = {
  buildSlotId,
  slotToRow,
  rowToCourtSlot,
  filterAndSort,
  normalizeVenue,
  resolveSport,
};
