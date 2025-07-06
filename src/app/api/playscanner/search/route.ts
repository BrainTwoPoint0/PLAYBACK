import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/playscanner/search-service';
import { SearchParams } from '@/lib/playscanner/types';

/**
 * PLAYScanner Search API Endpoint
 * POST /api/playscanner/search
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { sport, location, date } = body;

    if (!sport || !location || !date) {
      return NextResponse.json(
        {
          error: 'Missing required fields: sport, location, date',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Validate sport type
    if (!['padel', 'football'].includes(sport)) {
      return NextResponse.json(
        {
          error: "Invalid sport. Must be 'padel' or 'football'",
          code: 'INVALID_SPORT',
        },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        {
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE',
        },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const searchDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (searchDate < today) {
      return NextResponse.json(
        {
          error: 'Date cannot be in the past',
          code: 'PAST_DATE',
        },
        { status: 400 }
      );
    }

    // Build search parameters
    const searchParams: SearchParams = {
      sport,
      location,
      date,
      startTime: body.startTime,
      endTime: body.endTime,
      maxPrice: body.maxPrice ? parseInt(body.maxPrice) : undefined,
      indoor: body.indoor,
      filters: body.filters,
    };

    // Check if football is requested (not yet supported)
    if (sport === 'football') {
      return NextResponse.json(
        {
          results: [],
          totalResults: 0,
          searchTime: 0,
          providers: [],
          filters: searchParams,
          message:
            "Football booking is coming soon! We're working on integrating with PowerLeague, FC Urban, and other providers.",
        },
        { status: 200 }
      );
    }

    // Perform search
    const searchResult = await searchService.search(searchParams);

    return NextResponse.json(searchResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error during search',
        code: 'SEARCH_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Something went wrong',
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
    // Get provider health status
    const providerHealth = await searchService.getProviderHealth();
    const cacheStats = searchService.getCacheStats();
    const availableProviders = searchService.getAvailableProviders();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      providers: providerHealth,
      cache: cacheStats,
      availableProviders,
      version: '1.0.0',
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
