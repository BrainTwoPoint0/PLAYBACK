import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/playscanner/search-service';
import { SearchParams, Provider } from '@/lib/playscanner/types';

/**
 * Test endpoint for PLAYScanner providers
 * POST /api/playscanner/test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, searchParams } = body;

    if (!provider || !searchParams) {
      return NextResponse.json(
        {
          error: 'Missing required fields: provider, searchParams',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Validate provider
    const availableProviders = searchService.getAvailableProviders();
    const validProvider = availableProviders.find((p) => p.name === provider);

    if (!validProvider) {
      return NextResponse.json(
        {
          error: `Invalid provider. Available: ${availableProviders.map((p) => p.name).join(', ')}`,
          code: 'INVALID_PROVIDER',
        },
        { status: 400 }
      );
    }

    // Test the provider
    const testResult = await searchService.testProvider(
      provider as Provider,
      searchParams as SearchParams
    );

    return NextResponse.json({
      provider,
      test: testResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error during provider test',
        code: 'TEST_ERROR',
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
 * Get available providers for testing
 * GET /api/playscanner/test
 */
export async function GET() {
  try {
    const providers = searchService.getAvailableProviders();
    const health = await searchService.getProviderHealth();

    return NextResponse.json({
      providers: providers.map((provider) => ({
        ...provider,
        healthy: health[provider.name] || false,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get providers',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
