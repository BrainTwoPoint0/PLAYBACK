import { NextRequest, NextResponse } from 'next/server';
import { persistentCache } from '@/lib/playscanner/persistent-cache';
import { SearchParams } from '@/lib/playscanner/types';

// Input validation primitives. Kept inline to avoid pulling in zod for one route.
const SPORT_ALLOWLIST = ['padel', 'football', 'tennis', 'basketball'] as const;
const LOCATION_PATTERN = /^[a-zA-Z][a-zA-Z\s\-']{0,63}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_PRICE_CEILING = 1_000_000; // pence - sanity ceiling, not a real product limit

function validationError(message: string, field?: string) {
  return NextResponse.json(
    { error: message, code: 'VALIDATION_ERROR', field },
    { status: 400 }
  );
}

/**
 * PLAYScanner Search API Endpoint
 * POST /api/playscanner/search
 */
export async function POST(request: NextRequest) {
  let body: any;
  let searchParams: SearchParams | undefined;

  try {
    body = await request.json();

    // ---- Required fields ----
    const { sport, location, date } = body;
    if (!sport || !location || !date) {
      return validationError('Missing required fields: sport, location, date');
    }

    // sport: enum allowlist
    if (!SPORT_ALLOWLIST.includes(sport)) {
      return validationError(
        `Invalid sport. Must be one of: ${SPORT_ALLOWLIST.join(', ')}`,
        'sport'
      );
    }

    // location: typed string + length cap + char allowlist (prevents
    // unbounded-string DoS against the downstream Postgres function)
    if (typeof location !== 'string' || !LOCATION_PATTERN.test(location)) {
      return validationError(
        'Invalid location. 1-64 chars, letters/spaces/hyphens/apostrophes only.',
        'location'
      );
    }

    // date: shape + not in past
    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
      return validationError('Invalid date format. Use YYYY-MM-DD', 'date');
    }
    const searchDate = new Date(date);
    if (Number.isNaN(searchDate.getTime())) {
      return validationError('Invalid date value', 'date');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (searchDate < today) {
      return validationError('Date cannot be in the past', 'date');
    }

    // ---- Optional fields ----
    let startTime: string | undefined;
    if (body.startTime != null) {
      if (
        typeof body.startTime !== 'string' ||
        !TIME_PATTERN.test(body.startTime)
      ) {
        return validationError(
          'Invalid startTime. Use HH:MM (24h)',
          'startTime'
        );
      }
      startTime = body.startTime;
    }

    let endTime: string | undefined;
    if (body.endTime != null) {
      if (
        typeof body.endTime !== 'string' ||
        !TIME_PATTERN.test(body.endTime)
      ) {
        return validationError('Invalid endTime. Use HH:MM (24h)', 'endTime');
      }
      endTime = body.endTime;
    }

    let maxPrice: number | undefined;
    if (body.maxPrice != null) {
      const parsed =
        typeof body.maxPrice === 'number'
          ? body.maxPrice
          : parseInt(String(body.maxPrice), 10);
      if (
        !Number.isFinite(parsed) ||
        !Number.isInteger(parsed) ||
        parsed < 0 ||
        parsed > MAX_PRICE_CEILING
      ) {
        return validationError(
          `Invalid maxPrice. Integer 0-${MAX_PRICE_CEILING} (pence)`,
          'maxPrice'
        );
      }
      maxPrice = parsed;
    }

    let indoor: boolean | undefined;
    if (body.indoor != null) {
      if (typeof body.indoor !== 'boolean') {
        return validationError(
          'Invalid indoor. Must be true or false',
          'indoor'
        );
      }
      indoor = body.indoor;
    }

    // Build search parameters from validated inputs only - don't pass body
    // through wholesale, defends against unexpected keys reaching downstream.
    searchParams = {
      sport,
      location,
      date,
      startTime,
      endTime,
      maxPrice,
      indoor,
      filters: body.filters,
    };

    const searchResult = await persistentCache.search(searchParams);
    searchResult.source = 'persistent_cache';

    // Debug payload is dev-only - never echo request data back to clients in
    // production even if PLAYSCANNER_DEBUG is accidentally enabled.
    const debugInfo: any = {};
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.PLAYSCANNER_DEBUG === 'true'
    ) {
      debugInfo.searchParams = searchParams;
      debugInfo.searchMode = 'cached';
    }

    return NextResponse.json(
      {
        ...searchResult,
        ...(Object.keys(debugInfo).length > 0 && { debug: debugInfo }),
      },
      { status: 200 }
    );
  } catch (error) {
    // Server-side log only - never echo request bodies / params back to the
    // client. The full structured details stay in the logs where they can
    // include sensitive data without leaking to a caller.
    console.error('PLAYScanner search error:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
      searchParams: searchParams || 'not constructed',
    });

    return NextResponse.json(
      {
        error: 'Internal server error during search',
        code: 'SEARCH_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Something went wrong. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 * GET /api/playscanner/search
 */
export async function GET() {
  try {
    const cacheStats = await persistentCache.getCacheStats();
    const persistentCacheHealth = await persistentCache.healthCheck();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache: cacheStats,
      persistentCache: persistentCacheHealth,
      version: '2.0.0',
      dataSource: 'lambda-collected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
