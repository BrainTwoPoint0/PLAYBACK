import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Allowed booking URL domains — prevents open redirect / SSRF
const ALLOWED_DOMAINS = [
  'playtomic.com',
  'matchi.se',
  'www.matchi.se',
  'padelmates.se',
  'www.powerleague.com',
  'powerleague.com',
  'www.goalsfootball.co.uk',
  'goalsfootball.co.uk',
  'footyaddicts.com',
  'www.footyaddicts.com',
  'play.fcurban.com',
  'fcurban.com',
  'www.fcurban.com',
  'bookteq.com',
  'hireapitch.com',
  'www.hireapitch.com',
  'flow.onl',
  'better.org.uk',
  'www.better.org.uk',
  'legendonlineservices.co.uk',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d)
    );
  } catch {
    return false;
  }
}

/**
 * PLAYScanner Redirect & Click Tracking Endpoint
 * POST /api/playscanner/redirect
 *
 * Logs the booking click, optionally validates price with the provider,
 * then returns the booking URL for the frontend to open.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
    } = body;

    if (!bookingUrl || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate booking URL against provider allowlist
    if (!isAllowedUrl(bookingUrl)) {
      return NextResponse.json(
        { error: 'Invalid booking URL' },
        { status: 400 }
      );
    }

    // 1. Log the click (non-blocking)
    logClick({
      session_id: sessionId || 'unknown',
      provider_name: provider,
      venue_name: venueName || '',
      venue_location: venueId || '',
      booking_url: bookingUrl,
      estimated_price: price ? price / 100 : undefined,
      sport: sport || 'padel',
    }).catch(() => {}); // Don't let logging failures block the redirect

    // 2. Validate price with provider (for API-based providers)
    let priceValidation = null;
    if (['padel_mates', 'goals', 'playtomic'].includes(provider)) {
      try {
        priceValidation = await validatePrice(body);
      } catch {
        // Validation failure shouldn't block the redirect
      }
    }

    // 3. Return the booking URL + validation result
    return NextResponse.json({
      bookingUrl,
      validation: priceValidation,
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
  if (!date || !slot.venueId) return null;

  switch (slot.provider) {
    case 'goals': {
      const bookingDate = `${date}T00:00`;
      const apiKey = process.env.GOALS_API_KEY;
      if (!apiKey) return null;

      const res = await fetch(
        `https://api.goalsfootball.co.uk/branches/${slot.venueId}/availability?bookingDate=${encodeURIComponent(bookingDate)}&productId=72`,
        {
          headers: { 'Api-Key': apiKey, Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!res.ok) return null;

      const data = await res.json();
      const bookings = data.availableBookings || [];
      const match = bookings.find(
        (b: any) => b.startDateTime === slot.startTime.replace('Z', '')
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
        `https://fastapi-production-fargate.padelmates.io/player/player_booking/all_courts_slot_prices?club_id=${slot.venueId}&start_datetime=${startMs}&end_datetime=${endMs}&sport_type=PADEL`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return null;

      const courts = await res.json();
      if (!Array.isArray(courts)) return null;

      // Find matching slot across all courts
      for (const court of courts) {
        for (const s of court.available_slots || []) {
          const sStart = new Date(s.start_datetime).toISOString();
          if (sStart === slot.startTime) {
            const currentPrice = Math.round((s.price || 0) * 100);
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
      const res = await fetch(
        `https://api.playtomic.io/v1/availability?sport_id=${slot.sport === 'tennis' ? 'TENNIS' : 'PADEL'}&tenant_id=${slot.venueId}&start_min=${date}T00:00:00&start_max=${date}T23:59:59`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return null;

      const data = await res.json();
      if (!Array.isArray(data)) return null;

      // Find matching slot
      for (const court of data) {
        for (const s of court.slots || []) {
          const sStart = new Date(
            `${court.start_date}T${s.start_time}Z`
          ).toISOString();
          if (sStart === slot.startTime) {
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
