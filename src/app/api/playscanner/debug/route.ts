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
                        errorType: (error as Error).constructor.name,
                        searchTime: Date.now() - startTime,
                        timestamp: new Date().toISOString(),
                    });
                }

            case 'venue-search':
                const venueProvider = new PlaytomicProvider();
                try {
                    // Test just the venue search part
                    const baseUrl = 'https://playtomic.com';
                    const searchMethod = (venueProvider as any).searchVenues;
                    const venues = await Promise.race([
                        searchMethod.call(venueProvider, baseUrl, 'London'),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Venue search timeout')), 8000)
                        ),
                    ]);

                    return NextResponse.json({
                        status: 'success',
                        message: 'Venue search completed',
                        venueCount: venues?.length || 0,
                        venues: venues?.slice(0, 3) || [], // First 3 venues for testing
                        timestamp: new Date().toISOString(),
                    });
                } catch (error) {
                    return NextResponse.json({
                        status: 'error',
                        message: 'Venue search failed',
                        error: (error as Error).message,
                        errorType: (error as Error).constructor.name,
                        timestamp: new Date().toISOString(),
                    });
                }

            case 'api-test':
                try {
                    // Test direct API call to Playtomic
                    const testUrl = 'https://playtomic.com/api/v1/tenants?coordinate=51.5074,-0.1278&sport_id=PADEL&radius=20000&size=5';
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const response = await fetch(testUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Referer': 'https://playtomic.com/venues/london',
                            'Origin': 'https://playtomic.com',
                        },
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        return NextResponse.json({
                            status: 'success',
                            message: 'Direct API test successful',
                            responseStatus: response.status,
                            dataType: Array.isArray(data) ? 'array' : typeof data,
                            itemCount: Array.isArray(data) ? data.length : 'N/A',
                            sampleData: Array.isArray(data) ? data.slice(0, 2) : data,
                            timestamp: new Date().toISOString(),
                        });
                    } else {
                        return NextResponse.json({
                            status: 'error',
                            message: 'Direct API test failed',
                            responseStatus: response.status,
                            responseText: await response.text(),
                            timestamp: new Date().toISOString(),
                        });
                    }
                } catch (error) {
                    return NextResponse.json({
                        status: 'error',
                        message: 'Direct API test error',
                        error: (error as Error).message,
                        errorType: (error as Error).constructor.name,
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
                        availableTests: ['basic', 'provider', 'simple-search', 'venue-search', 'api-test', 'headers'],
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
