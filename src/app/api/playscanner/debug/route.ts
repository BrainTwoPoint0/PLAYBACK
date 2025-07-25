import { NextRequest, NextResponse } from 'next/server';

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
        return NextResponse.json({
          status: 'disabled',
          message: 'Provider testing disabled - now using cached data only',
          timestamp: new Date().toISOString(),
        });

      case 'simple-search':
        return NextResponse.json({
          status: 'disabled',
          message: 'Simple search disabled - now using cached data only',
          timestamp: new Date().toISOString(),
        });

      case 'venue-search':
        return NextResponse.json({
          status: 'disabled',
          message: 'Venue search disabled - now using cached data only',
          timestamp: new Date().toISOString(),
        });

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
        return NextResponse.json({
          status: 'disabled',
          message: 'Full search debug disabled - now using cached data only',
          timestamp: new Date().toISOString(),
        });

      case 'debug-search':
        return NextResponse.json({
          status: 'disabled',
          message: 'Live search disabled - now using cached data only',
          timestamp: new Date().toISOString(),
        });

      case 'cached-search':
        return NextResponse.json({
          status: 'disabled',
          message: 'Cached search test disabled - use persistent cache instead',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            status: 'error',
            message: 'Unknown test type',
            availableTests: [
              'basic',
              'api-test',
              'headers',
              'availability-test',
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
