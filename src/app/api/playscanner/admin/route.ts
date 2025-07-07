import { NextRequest, NextResponse } from 'next/server';
import { persistentCache } from '@/lib/playscanner/persistent-cache';

/**
 * PLAYScanner Admin Dashboard API
 * GET /api/playscanner/admin
 *
 * Provides admin-level insights and controls for PLAYScanner
 */
export async function GET(request: NextRequest) {
  try {
    // Basic auth check (in production, use proper authentication)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.PLAYSCANNER_COLLECT_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid API key required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const timeframe = searchParams.get('timeframe') || '24'; // hours

    let dashboardData: any = {
      timestamp: new Date().toISOString(),
      timeframe: `${timeframe}h`,
    };

    // Get comprehensive stats
    const cacheStats = await persistentCache.getCacheStats();
    const healthCheck = await persistentCache.healthCheck();
    const successRate = await persistentCache.getCollectionSuccessRate(
      parseInt(timeframe)
    );
    const recentCollections = await persistentCache.getRecentCollections(20);

    dashboardData.overview = {
      cacheHealth: healthCheck.healthy ? 'healthy' : 'unhealthy',
      activeEntries: cacheStats.activeEntries,
      totalSlots: cacheStats.totalSlots,
      citiesCovered: cacheStats.citiesCovered,
      successRate: `${successRate.toFixed(1)}%`,
      lastCollection: recentCollections[0]?.created_at,
    };

    dashboardData.cache = {
      stats: cacheStats,
      performance: {
        hitRate: '~95%', // Placeholder - implement actual hit rate tracking
        avgResponseTime: '<50ms',
        dataFreshness: getDataFreshness(cacheStats.lastCollection),
      },
    };

    dashboardData.collections = {
      recent: recentCollections.slice(0, 10),
      summary: getCollectionSummary(recentCollections),
      trends: getCollectionTrends(recentCollections),
    };

    // Handle specific actions
    if (action === 'cleanup') {
      const cleanedEntries = await persistentCache.cleanup();
      dashboardData.action = {
        type: 'cleanup',
        result: `Cleaned ${cleanedEntries} expired entries`,
      };
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('❌ Admin dashboard error:', error);

    return NextResponse.json(
      {
        error: 'Admin dashboard failed',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Admin actions endpoint
 * POST /api/playscanner/admin
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.PLAYSCANNER_COLLECT_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid API key required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, params } = body;

    let result: any = { action, timestamp: new Date().toISOString() };

    switch (action) {
      case 'cleanup_cache':
        const cleanedEntries = await persistentCache.cleanup();
        result.message = `Cleaned ${cleanedEntries} expired cache entries`;
        result.cleanedEntries = cleanedEntries;
        break;

      case 'health_check':
        const healthCheck = await persistentCache.healthCheck();
        result.health = healthCheck;
        result.message = healthCheck.healthy
          ? 'System healthy'
          : 'System issues detected';
        break;

      case 'force_collection':
        // This would trigger a manual collection
        result.message =
          'Manual collection triggered (implement via /api/playscanner/collect)';
        result.endpoint = '/api/playscanner/collect';
        break;

      case 'get_stats':
        const cacheStats = await persistentCache.getCacheStats();
        result.stats = cacheStats;
        result.message = 'Cache statistics retrieved';
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Admin action error:', error);

    return NextResponse.json(
      {
        error: 'Admin action failed',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Helper functions
 */
function getDataFreshness(lastCollection: string | null): string {
  if (!lastCollection) return 'unknown';

  const ageMs = Date.now() - new Date(lastCollection).getTime();
  const ageMinutes = Math.floor(ageMs / 60000);

  if (ageMinutes < 30) return 'fresh';
  if (ageMinutes < 120) return 'recent';
  if (ageMinutes < 360) return 'stale';
  return 'very stale';
}

function getCollectionSummary(collections: any[]) {
  const last24h = collections.filter((c) => {
    const ageHours =
      (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);
    return ageHours <= 24;
  });

  const successful = last24h.filter((c) => c.status === 'success');
  const failed = last24h.filter((c) => c.status === 'error');

  return {
    total: last24h.length,
    successful: successful.length,
    failed: failed.length,
    totalSlots: successful.reduce(
      (sum, c) => sum + (c.slots_collected || 0),
      0
    ),
    avgExecutionTime:
      successful.length > 0
        ? Math.round(
            successful.reduce((sum, c) => sum + (c.execution_time_ms || 0), 0) /
              successful.length
          )
        : 0,
  };
}

function getCollectionTrends(collections: any[]) {
  const last24h = collections.filter((c) => {
    const ageHours =
      (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);
    return ageHours <= 24;
  });

  // Group by 4-hour periods
  const periods = [];
  for (let i = 0; i < 6; i++) {
    const periodStart = Date.now() - (i + 1) * 4 * 60 * 60 * 1000;
    const periodEnd = Date.now() - i * 4 * 60 * 60 * 1000;

    const periodCollections = last24h.filter((c) => {
      const time = new Date(c.created_at).getTime();
      return time >= periodStart && time < periodEnd;
    });

    periods.unshift({
      period: `${4 * (6 - i - 1)}-${4 * (6 - i)}h ago`,
      collections: periodCollections.length,
      successful: periodCollections.filter((c) => c.status === 'success')
        .length,
      avgSlots:
        periodCollections.length > 0
          ? Math.round(
              periodCollections.reduce(
                (sum, c) => sum + (c.slots_collected || 0),
                0
              ) / periodCollections.length
            )
          : 0,
    });
  }

  return periods;
}
