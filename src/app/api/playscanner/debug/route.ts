import { NextRequest, NextResponse } from 'next/server';
import { PlaytomicProvider } from '@/lib/playscanner/providers/playtomic';

/**
 * Debug endpoint to test PLAYScanner components
 * GET /api/playscanner/debug?test=basic|provider|scraper
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test') || 'basic';

  try {
    switch (test) {
      case 'basic':
        return NextResponse.json({
          status: 'success',
          message: 'Basic API endpoint working',
          timestamp: new Date().toISOString(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV,
        });

      case 'provider':
        const provider = new PlaytomicProvider();
        const healthStatus = await provider.healthCheck();
        return NextResponse.json({
          status: 'success',
          message: 'Provider health check completed',
          healthStatus,
          providerName: provider.name,
          timestamp: new Date().toISOString(),
        });

      case 'simple-search':
        const simpleProvider = new PlaytomicProvider();
        const testParams = {
          sport: 'padel' as const,
          location: 'London',
          date: '2025-07-07',
        };

        // Test with a very short timeout to avoid hanging
        const startTime = Date.now();
        try {
          const results = await Promise.race([
            simpleProvider.fetchAvailability(testParams),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Test timeout')), 10000)
            ),
          ]);

          return NextResponse.json({
            status: 'success',
            message: 'Simple search completed',
            resultsCount: results.length,
            searchTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json({
            status: 'error',
            message: 'Simple search failed',
            error: (error as Error).message,
            searchTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
        }

      case 'headers':
        return NextResponse.json({
          status: 'success',
          message: 'Request headers test',
          headers: Object.fromEntries(request.headers.entries()),
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            status: 'error',
            message: 'Unknown test type',
            availableTests: ['basic', 'provider', 'simple-search', 'headers'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Debug endpoint failed',
        error: (error as Error).message,
        stack:
          process.env.NODE_ENV === 'development'
            ? (error as Error).stack
            : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
