import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import providerRegistry from '@/lib/playscanner/providers.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// `isAllowedUrl` matches `hostname === d` OR `hostname.endsWith('.' + d)`,
// so the bare apex covers all subdomains.
const ALLOWED_DOMAINS: readonly string[] = providerRegistry.allowedDomains;

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d)
    );
  } catch {
    return false;
  }
}

const VALIDATING_PROVIDERS: readonly string[] =
  providerRegistry.validatingProviders;
const KNOWN_PROVIDERS: readonly string[] = providerRegistry.providers;
const KNOWN_SPORTS = ['padel', 'tennis', 'football', 'basketball'];
const KNOWN_CURRENCIES = ['GBP', 'USD', 'EUR', 'SEK'];

// Path-safe identifier — rejects /, ?, #, &, =, .., URL-encoding, whitespace
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const SAFE_SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Slot times across providers come at minute granularity. Allow a small jitter
// window so that minor encoding differences (sub-second precision, rounding)
// don't break the strict equality match.
const SLOT_MATCH_TOLERANCE_MS = 60_000;

function slotsMatch(aMs: number, bMs: number): boolean {
  if (!Number.isFinite(aMs) || !Number.isFinite(bMs)) return false;
  return Math.abs(aMs - bMs) < SLOT_MATCH_TOLERANCE_MS;
}

/**
 * PLAYScanner Redirect & Click Tracking Endpoint
 * POST /api/playscanner/redirect
 *
 * Logs the booking click, optionally validates price with the provider,
 * then returns the booking URL for the frontend to open.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const {
      provider,
      venueName,
      venueId,
      bookingUrl,
      price,
      currency,
      sport,
      sessionId,
      startTime,
    } = body || {};

    if (
      typeof bookingUrl !== 'string' ||
      bookingUrl.length > 2048 ||
      typeof provider !== 'string' ||
      !KNOWN_PROVIDERS.includes(provider)
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    if (!isAllowedUrl(bookingUrl)) {
      return NextResponse.json(
        { error: 'Invalid booking URL' },
        { status: 400 }
      );
    }

    const safeVenueId =
      typeof venueId === 'string' && SAFE_ID.test(venueId) ? venueId : null;
    const safeSport =
      typeof sport === 'string' && KNOWN_SPORTS.includes(sport) ? sport : null;
    const safeSessionId =
      typeof sessionId === 'string' && SAFE_SESSION_ID.test(sessionId)
        ? sessionId
        : 'unknown';
    const safeVenueName =
      typeof venueName === 'string' ? venueName.slice(0, 256) : '';
    const safeCurrency =
      typeof currency === 'string' && KNOWN_CURRENCIES.includes(currency)
        ? currency
        : null;
    const safePrice =
      typeof price === 'number' && Number.isFinite(price) && price >= 0
        ? Math.round(price)
        : null;
    const safeStartTime =
      typeof startTime === 'string' &&
      Number.isFinite(new Date(startTime).getTime())
        ? startTime
        : null;

    // 1. Log the click (non-blocking)
    logClick({
      session_id: safeSessionId,
      provider_name: provider,
      venue_name: safeVenueName,
      venue_location: safeVenueId || '',
      booking_url: bookingUrl,
      estimated_price: safePrice != null ? safePrice / 100 : undefined,
      sport: safeSport || 'padel',
    }).catch(() => {});

    // 2. Validate price with provider (for API-based providers)
    let priceValidation = null;
    if (
      VALIDATING_PROVIDERS.includes(provider) &&
      safeVenueId &&
      safeStartTime &&
      safePrice != null
    ) {
      try {
        priceValidation = await validatePrice({
          provider,
          venueId: safeVenueId,
          startTime: safeStartTime,
          price: safePrice,
          sport: safeSport || undefined,
        });
      } catch {
        // Validation failure shouldn't block the redirect
      }
    }

    return NextResponse.json({
      bookingUrl,
      validation: priceValidation,
      currency: safeCurrency,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Log a booking click to playscanner_conversions
 */
async function logClick(data: {
  session_id: string;
  provider_name: string;
  venue_name: string;
  venue_location: string;
  booking_url: string;
  estimated_price?: number;
  sport: string;
}) {
  await supabase.from('playscanner_conversions').insert({
    ...data,
    clicked_at: new Date().toISOString(),
  });
}

/**
 * Validate that a slot is still available and price hasn't changed.
 * Returns { available, currentPrice, priceChanged } or null if validation not possible.
 */
async function validatePrice(slot: {
  provider: string;
  venueId: string;
  startTime: string;
  price: number;
  sport?: string;
}): Promise<{
  available: boolean;
  currentPrice: number | null;
  priceChanged: boolean;
} | null> {
  const date = slot.startTime?.split('T')[0];
  if (!date || !ISO_DATE.test(date)) return null;
  if (!slot.venueId || !SAFE_ID.test(slot.venueId)) return null;

  const venueIdEnc = encodeURIComponent(slot.venueId);
  const dateEnc = encodeURIComponent(date);
  const cachedStartMs = new Date(slot.startTime).getTime();
  if (!Number.isFinite(cachedStartMs)) return null;

  switch (slot.provider) {
    case 'goals': {
      const apiKey = process.env.GOALS_API_KEY;
      if (!apiKey) return null;

      const bookingDate = `${dateEnc}T00:00`;
      const res = await fetch(
        `https://api.goalsfootball.co.uk/branches/${venueIdEnc}/availability?bookingDate=${encodeURIComponent(bookingDate)}&productId=72`,
        {
          headers: { 'Api-Key': apiKey, Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!res.ok) return null;

      const data = await res.json();
      const bookings = data.availableBookings || [];
      const match = bookings.find((b: any) =>
        slotsMatch(new Date(b.startDateTime).getTime(), cachedStartMs)
      );

      if (!match)
        return { available: false, currentPrice: null, priceChanged: false };

      const currentPrice = Math.round((match.price || 0) * 100);
      return {
        available: true,
        currentPrice,
        priceChanged: currentPrice !== slot.price,
      };
    }

    case 'padel_mates': {
      const startMs = new Date(date + 'T00:00:00Z').getTime();
      const endMs = startMs + 86400000 - 1;

      const res = await fetch(
        `https://fastapi-production-fargate.padelmates.io/player/player_booking/all_courts_slot_prices?club_id=${venueIdEnc}&start_datetime=${startMs}&end_datetime=${endMs}&sport_type=PADEL`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return null;

      const courts = await res.json();
      if (!Array.isArray(courts)) return null;

      for (const court of courts) {
        for (const s of court.available_slots || []) {
          if (slotsMatch(new Date(s.start_datetime).getTime(), cachedStartMs)) {
            // Mirror the collector: prefer the shortest enabled interval's price
            // (slot-level `s.price` is 0 for variable-duration slots).
            let priceUnits = s.price || 0;
            const enabled = (s.interval_prices || [])
              .filter((p: any) => p?.enabled)
              .sort((a: any, b: any) => a.duration - b.duration);
            if (enabled.length > 0) priceUnits = enabled[0].price;

            const currentPrice = Math.round((priceUnits || 0) * 100);
            return {
              available: true,
              currentPrice,
              priceChanged: currentPrice !== slot.price,
            };
          }
        }
      }

      return { available: false, currentPrice: null, priceChanged: false };
    }

    case 'playtomic': {
      const sportId = slot.sport === 'tennis' ? 'TENNIS' : 'PADEL';
      const res = await fetch(
        `https://api.playtomic.io/v1/availability?sport_id=${sportId}&tenant_id=${venueIdEnc}&start_min=${dateEnc}T00:00:00&start_max=${dateEnc}T23:59:59`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return null;

      const data = await res.json();
      if (!Array.isArray(data)) return null;

      for (const court of data) {
        for (const s of court.slots || []) {
          const sStartMs = new Date(
            `${court.start_date}T${s.start_time}Z`
          ).getTime();
          if (slotsMatch(sStartMs, cachedStartMs)) {
            const priceMatch = s.price?.match(/(\d+(?:\.\d+)?)/);
            const currentPrice = priceMatch
              ? Math.round(parseFloat(priceMatch[1]) * 100)
              : 0;
            return {
              available: true,
              currentPrice,
              priceChanged: currentPrice !== slot.price,
            };
          }
        }
      }

      return { available: false, currentPrice: null, priceChanged: false };
    }

    default:
      return null;
  }
}
