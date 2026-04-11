/**
 * TypeScript port of the Lambda-side slot mapper used by persistent-cache.ts
 * to convert `playscanner_slots` rows into the API-facing CourtSlot shape.
 *
 * Canonical JS version: lambda-playscanner/src/slot-mapper.js
 *
 * Keep the two in sync until the Lambdas share a package with PLAYBACK.
 */

import type {
  CourtSlot,
  PadelMeta,
  FootballMeta,
  TennisMeta,
  BasketballMeta,
  Provider,
  Sport,
} from './types';

/**
 * Shape of a row returned by `SELECT * FROM playscanner_slots`.
 * Kept loose (not generated from supabase types) because we only consume
 * a subset of columns here.
 */
export interface PlayscannerSlotRow {
  id: string;
  provider: string;
  sport: Sport;
  listing_type: string | null;
  city: string;

  venue_id: string;
  venue_name: string;
  venue_slug: string | null;
  venue_address: string | null;
  venue_postcode: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  venue_indoor: boolean;
  venue_surface: string | null;

  court_id: string | null;
  court_name: string | null;
  court_surface: string | null;

  start_time: string;
  end_time: string;
  duration: number;

  price: number;
  currency: string;

  booking_url: string | null;

  available: boolean;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

function buildSportMeta(
  sport: Sport,
  indoor: boolean
): PadelMeta | FootballMeta | TennisMeta | BasketballMeta {
  if (sport === 'football') {
    return {
      format: '5v5',
      organized: false,
      level: 'casual',
      requiresTeam: false,
    };
  }
  if (sport === 'tennis') {
    return {
      courtType: indoor ? 'indoor' : 'outdoor',
      surface: 'hard',
      format: 'doubles',
    };
  }
  if (sport === 'basketball') {
    return { format: '5v5', level: 'casual' };
  }
  // padel (default)
  return {
    courtType: indoor ? 'indoor' : 'outdoor',
    level: 'open',
    doubles: true,
  };
}

/**
 * Convert a flat `playscanner_slots` row into the CourtSlot shape the
 * frontend expects. Replaces persistent-cache.ts:transformLambdaSlot — all
 * the fields the old transform had to derive from loose provider shapes
 * are already materialized in the row, so this is a straight
 * field-by-field build.
 */
export function rowToCourtSlot(row: PlayscannerSlotRow): CourtSlot {
  const provider = row.provider as Provider;
  const indoor = row.venue_indoor === true;

  // Booking URL fallback — mirrors the old transformLambdaSlot behaviour:
  // Playtomic rows without a link fall back to the venue landing page.
  const bookingUrl =
    row.booking_url ||
    (provider === 'playtomic'
      ? `https://playtomic.com/venue/${row.venue_id}`
      : '');

  const surface =
    (row.court_surface as CourtSlot['features']['surface']) ||
    (row.venue_surface as CourtSlot['features']['surface']) ||
    'other';

  return {
    id: row.id,
    sport: row.sport,
    provider,
    listingType: (row.listing_type as CourtSlot['listingType']) || 'pitch_hire',
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
    currency: row.currency as CourtSlot['currency'],
    bookingUrl,
    collectedAt: row.collected_at,
    courtName: row.court_name || undefined,
    availability: {
      spotsAvailable: row.available ? 1 : 0,
      totalSpots: 1,
    },
    features: {
      indoor,
      lights: true,
      surface,
    },
    sportMeta: buildSportMeta(row.sport, indoor),
    lastUpdated: row.collected_at,
  };
}
