import { NextRequest, NextResponse } from 'next/server';
import { BackgroundCollector } from '@/lib/playscanner/collector';
import { CachedSearchService } from '@/lib/playscanner/cached-service';

/**
 * Background Data Collection Endpoint (Playskan-style)
 * POST /api/playscanner/collect
 *
 * This endpoint scrapes and caches availability data in the background
 * Users then query cached data instead of live scraping
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Authentication check (secure this endpoint)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.PLAYSCANNER_COLLECT_SECRET}`) {
      return NextResponse.json(
        {
          error: 'Unauthorized - Valid API key required',
          hint: 'Set PLAYSCANNER_COLLECT_SECRET environment variable',
        },
        { status: 401 }
      );
    }

    console.log('🚀 Starting background data collection...');

    const collector = new BackgroundCollector();
    const collectionResult = await collector.collectAll();

    // Store collected data in cache
    let cacheUpdates = 0;
    collectionResult.results.forEach((result) => {
      if (result.status === 'success' && result.slots) {
        CachedSearchService.setCachedData(
          result.city,
          result.date,
          result.slots
        );
        cacheUpdates++;
      }
    });

    const totalTime = Date.now() - startTime;

    console.log(
      `✅ Collection completed: ${cacheUpdates} cache updates, ${totalTime}ms`
    );

    return NextResponse.json({
      status: 'success',
      message: 'Background collection completed',
      collection: collectionResult,
      cacheUpdates,
      totalTime,
      cacheStats: CachedSearchService.getCacheStats(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Collection failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Background collection failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Collection Status Endpoint
 * GET /api/playscanner/collect
 */
export async function GET() {
  const cacheStats = CachedSearchService.getCacheStats();

  return NextResponse.json({
    status: 'ready',
    message: 'Background collection service ready',
    instructions: {
      collect: 'POST with Authorization: Bearer <secret> to start collection',
      secret: 'Set PLAYSCANNER_COLLECT_SECRET environment variable',
    },
    currentCache: cacheStats,
    timestamp: new Date().toISOString(),
  });
}
