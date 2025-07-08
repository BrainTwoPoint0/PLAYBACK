import { NextRequest, NextResponse } from 'next/server';
import { BackgroundCollector } from '@/lib/playscanner/collector';
import { ProductionCollector } from '@/lib/playscanner/production-collector';
import { persistentCache } from '@/lib/playscanner/persistent-cache';

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

    console.log('🚀 Starting production data collection...');

    // Use production collector for sophisticated collection
    const productionCollector = new ProductionCollector();
    const collectionResult = await Promise.race([
      productionCollector.collectWithIntelligence(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(new Error('Collection timeout - serverless function limit')),
          25000
        )
      ),
    ]);

    // Cache updates are handled within the collector now
    const cacheUpdates = collectionResult.results.filter(
      (result) => result.status === 'success'
    ).length;

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
      cacheStats: await persistentCache.getCacheStats(),
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
  try {
    const cacheStats = await persistentCache.getCacheStats();
    const healthCheck = await persistentCache.healthCheck();
    const recentCollections = await persistentCache.getRecentCollections(5);
    const successRate = await persistentCache.getCollectionSuccessRate(24);

    return NextResponse.json({
      status: 'ready',
      message: 'Background collection service ready',
      instructions: {
        collect: 'POST with Authorization: Bearer <secret> to start collection',
        secret: 'Set PLAYSCANNER_COLLECT_SECRET environment variable',
      },
      currentCache: cacheStats,
      healthCheck,
      recentCollections,
      successRate: `${successRate.toFixed(1)}%`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to get collection service status',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
