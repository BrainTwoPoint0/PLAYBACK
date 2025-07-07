import { NextRequest, NextResponse } from 'next/server';
import { persistentCache } from '@/lib/playscanner/persistent-cache';
import { searchService } from '@/lib/playscanner/search-service';

/**
 * PLAYScanner Health Check and Monitoring Endpoint
 * GET /api/playscanner/health
 * 
 * Comprehensive health check for all PLAYScanner components
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const detailed = searchParams.get('detailed') === 'true';
    const component = searchParams.get('component'); // 'cache', 'providers', 'collection'

    let healthData: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      mode: process.env.PLAYSCANNER_USE_CACHED === 'true' ? 'cached' : 'live',
    };

    // Component-specific health checks
    if (!component || component === 'cache') {
      const cacheHealth = await checkCacheHealth(detailed);
      healthData.cache = cacheHealth;
      
      if (cacheHealth.status !== 'healthy') {
        healthData.status = 'degraded';
      }
    }

    if (!component || component === 'providers') {
      const providerHealth = await checkProviderHealth(detailed);
      healthData.providers = providerHealth;
      
      if (providerHealth.status !== 'healthy') {
        healthData.status = 'degraded';
      }
    }

    if (!component || component === 'collection') {
      const collectionHealth = await checkCollectionHealth(detailed);
      healthData.collection = collectionHealth;
      
      if (collectionHealth.status !== 'healthy') {
        healthData.status = 'degraded';
      }
    }

    // Environment and configuration check
    if (detailed) {
      healthData.environment = await checkEnvironment();
    }

    healthData.responseTime = Date.now() - startTime;

    // Log health check if there are issues
    if (healthData.status !== 'healthy') {
      console.warn('🔴 PLAYScanner health check detected issues:', {
        status: healthData.status,
        cache: healthData.cache?.status,
        providers: healthData.providers?.status,
        collection: healthData.collection?.status,
      });
    }

    return NextResponse.json(healthData, {
      status: healthData.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Check persistent cache health
 */
async function checkCacheHealth(detailed: boolean = false) {
  try {
    const cacheHealthCheck = await persistentCache.healthCheck();
    const cacheStats = await persistentCache.getCacheStats();
    
    const health = {
      status: cacheHealthCheck.healthy ? 'healthy' : 'unhealthy',
      connection: cacheHealthCheck.healthy,
      activeEntries: cacheStats.activeEntries,
      totalSlots: cacheStats.totalSlots,
      citiesCovered: cacheStats.citiesCovered,
    };

    if (detailed) {
      health.details = {
        ...cacheStats,
        lastCollection: cacheStats.lastCollection,
        dateRange: cacheStats.dateRange,
      };
    }

    // Check if cache is empty (might indicate collection issues)
    if (cacheStats.activeEntries === 0) {
      health.status = 'degraded';
      health.warning = 'No active cache entries found';
    }

    return health;
  } catch (error) {
    return {
      status: 'unhealthy',
      error: (error as Error).message,
    };
  }
}

/**
 * Check provider health
 */
async function checkProviderHealth(detailed: boolean = false) {
  try {
    const providerHealth = await searchService.getProviderHealth();
    const availableProviders = searchService.getAvailableProviders();
    
    const health = {
      status: 'healthy',
      availableProviders: availableProviders.length,
      providers: availableProviders,
    };

    if (detailed) {
      health.details = providerHealth;
    }

    // Check if any providers are unhealthy
    const unhealthyProviders = Object.values(providerHealth).filter(
      (status: any) => !status
    );
    
    if (unhealthyProviders.length > 0) {
      health.status = 'degraded';
      health.warning = `${unhealthyProviders.length} providers unhealthy`;
    }

    if (availableProviders.length === 0) {
      health.status = 'unhealthy';
      health.error = 'No providers available';
    }

    return health;
  } catch (error) {
    return {
      status: 'unhealthy',
      error: (error as Error).message,
    };
  }
}

/**
 * Check collection service health
 */
async function checkCollectionHealth(detailed: boolean = false) {
  try {
    const successRate = await persistentCache.getCollectionSuccessRate(24);
    const recentCollections = await persistentCache.getRecentCollections(5);
    
    const health = {
      status: 'healthy',
      successRate: `${successRate.toFixed(1)}%`,
      recentCollections: recentCollections.length,
    };

    if (detailed) {
      health.details = {
        recentCollections,
        lastSuccessfulCollection: recentCollections.find(c => c.status === 'success')?.created_at,
      };
    }

    // Check success rate thresholds
    if (successRate < 50) {
      health.status = 'unhealthy';
      health.error = `Low success rate: ${successRate.toFixed(1)}%`;
    } else if (successRate < 80) {
      health.status = 'degraded';
      health.warning = `Moderate success rate: ${successRate.toFixed(1)}%`;
    }

    // Check if collections are recent (within last 2 hours)
    const lastCollection = recentCollections[0];
    if (lastCollection) {
      const lastCollectionTime = new Date(lastCollection.created_at).getTime();
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      
      if (lastCollectionTime < twoHoursAgo) {
        health.status = 'degraded';
        health.warning = 'No recent collections (>2h)';
      }
    } else {
      health.status = 'degraded';
      health.warning = 'No collection history found';
    }

    return health;
  } catch (error) {
    return {
      status: 'unhealthy',
      error: (error as Error).message,
    };
  }
}

/**
 * Check environment configuration
 */
async function checkEnvironment() {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'PLAYSCANNER_COLLECT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  return {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    platform: process.platform,
    architecture: process.arch,
    memory: {
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    },
    configuration: {
      cacheMode: process.env.PLAYSCANNER_USE_CACHED === 'true',
      debugMode: process.env.PLAYSCANNER_DEBUG === 'true',
      missingEnvVars: missingVars.length > 0 ? missingVars : undefined,
    },
  };
}

/**
 * Health check ping endpoint
 * GET /api/playscanner/health?ping=true
 */
export async function HEAD() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}