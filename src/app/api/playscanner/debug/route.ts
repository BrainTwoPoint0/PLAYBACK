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
          const testUrl =
            'https://playtomic.com/api/v1/tenants?coordinate=51.5074,-0.1278&sport_id=PADEL&radius=20000&size=5';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(testUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json, text/plain, */*',
              Referer: 'https://playtomic.com/venues/london',
              Origin: 'https://playtomic.com',
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

      case 'availability-test':
        try {
          // Test the specific availability API that's failing
          // Using real venue data from our working venue search
          const tenantId = '2ab75436-9bb0-4e9c-9a6f-b12931a9ca4a'; // Powerleague Shoreditch
          const testDate = '2025-07-07';

          const availabilityUrl = 'https://playtomic.com/api/v1/availability';
          const queryParams = new URLSearchParams({
            sport_id: 'PADEL',
            start_min: `${testDate}T00:00:00`,
            start_max: `${testDate}T23:59:59`,
            tenant_id: tenantId,
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(`${availabilityUrl}?${queryParams}`, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              Referer: `https://playtomic.com/tenant/${tenantId}`,
              Origin: 'https://playtomic.com',
              'Sec-Fetch-Site': 'same-site',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Dest': 'empty',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
              status: 'success',
              message: 'Availability API test successful',
              responseStatus: response.status,
              dataType: Array.isArray(data) ? 'array' : typeof data,
              itemCount: Array.isArray(data) ? data.length : 'N/A',
              sampleData: Array.isArray(data) ? data.slice(0, 2) : data,
              tenantId,
              testDate,
              apiUrl: `${availabilityUrl}?${queryParams}`,
              timestamp: new Date().toISOString(),
            });
          } else {
            const errorText = await response.text();
            return NextResponse.json({
              status: 'error',
              message: 'Availability API test failed',
              responseStatus: response.status,
              responseHeaders: Object.fromEntries(response.headers.entries()),
              responseText: errorText,
              tenantId,
              testDate,
              apiUrl: `${availabilityUrl}?${queryParams}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          return NextResponse.json({
            status: 'error',
            message: 'Availability API test error',
            error: (error as Error).message,
            errorType: (error as Error).constructor.name,
            timestamp: new Date().toISOString(),
          });
        }

      case 'full-search-debug':
        try {
          // Test the EXACT same logic as the full search but with detailed logging
          const debugProvider = new PlaytomicProvider();
          const testParams = {
            sport: 'padel' as const,
            location: 'London',
            date: '2025-07-07',
          };

          const startTime = Date.now();
          const baseUrl = 'https://playtomic.com';

          // Step 1: Get venues (we know this works)
          const searchMethod = (debugProvider as any).searchVenues;
          const venues = await searchMethod.call(
            debugProvider,
            baseUrl,
            'London'
          );

          if (!venues || venues.length === 0) {
            return NextResponse.json({
              status: 'error',
              message: 'No venues found',
              step: 'venue-search',
              timestamp: new Date().toISOString(),
            });
          }

          // Step 2: Test with just the FIRST venue (reduce complexity)
          const firstVenue = venues[0];
          const fetchMethod = (debugProvider as any).fetchRealAvailability;

          try {
            const slots = await fetchMethod.call(
              debugProvider,
              firstVenue,
              testParams
            );

            return NextResponse.json({
              status: 'success',
              message: 'Full search debug successful',
              venue: {
                id: firstVenue.id,
                name: firstVenue.name,
                tenantId: firstVenue._raw?.tenant_id,
              },
              slotsCount: slots.length,
              sampleSlots: slots.slice(0, 3),
              searchTime: Date.now() - startTime,
              timestamp: new Date().toISOString(),
            });
          } catch (availabilityError) {
            return NextResponse.json({
              status: 'error',
              message: 'Availability fetch failed',
              step: 'availability-fetch',
              error: (availabilityError as Error).message,
              errorType: (availabilityError as Error).constructor.name,
              venue: {
                id: firstVenue.id,
                name: firstVenue.name,
                tenantId: firstVenue._raw?.tenant_id,
              },
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          return NextResponse.json({
            status: 'error',
            message: 'Full search debug failed',
            step: 'overall',
            error: (error as Error).message,
            errorType: (error as Error).constructor.name,
            timestamp: new Date().toISOString(),
          });
        }

      case 'debug-search':
        try {
          // Enable debug mode and test full search
          process.env.PLAYSCANNER_DEBUG = 'true';

          const { searchService } = await import(
            '@/lib/playscanner/search-service'
          );
          const testParams = {
            sport: 'padel' as const,
            location: 'London',
            date: '2025-07-07',
          };

          const startTime = Date.now();
          const result = await searchService.search(testParams);

          // Reset debug mode
          delete process.env.PLAYSCANNER_DEBUG;

          return NextResponse.json({
            status: 'success',
            message: 'Debug search completed',
            results: result.results.slice(0, 5), // First 5 results
            totalResults: result.totalResults,
            providers: result.providers,
            searchTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          // Reset debug mode
          delete process.env.PLAYSCANNER_DEBUG;

          return NextResponse.json({
            status: 'error',
            message: 'Debug search failed',
            error: (error as Error).message,
            errorType: (error as Error).constructor.name,
            stack:
              process.env.NODE_ENV === 'development'
                ? (error as Error).stack
                : undefined,
            timestamp: new Date().toISOString(),
          });
        }

      case 'cached-search':
        try {
          // Test cached search approach (Playskan-style)
          const { CachedSearchService } = await import(
            '@/lib/playscanner/cached-service'
          );

          // Initialize mock data
          CachedSearchService.initializeMockData();

          const testParams = {
            sport: 'padel' as const,
            location: 'London',
            date: new Date().toISOString().split('T')[0], // Today
          };

          const startTime = Date.now();
          const result = await CachedSearchService.search(testParams);

          return NextResponse.json({
            status: 'success',
            message: 'Cached search completed',
            results: result.results,
            totalResults: result.totalResults,
            searchTime: result.searchTime,
            source: result.source,
            cacheAge: result.cacheAge,
            cacheStats: CachedSearchService.getCacheStats(),
            apiCallTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json({
            status: 'error',
            message: 'Cached search failed',
            error: (error as Error).message,
            errorType: (error as Error).constructor.name,
            timestamp: new Date().toISOString(),
          });
        }

      default:
        return NextResponse.json(
          {
            status: 'error',
            message: 'Unknown test type',
            availableTests: [
              'basic',
              'provider',
              'simple-search',
              'venue-search',
              'api-test',
              'headers',
              'availability-test',
              'full-search-debug',
              'debug-search',
              'cached-search',
            ],
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
