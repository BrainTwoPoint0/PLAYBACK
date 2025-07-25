import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint for PLAYScanner providers - DEPRECATED
 * POST /api/playscanner/test
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'deprecated',
      message: 'Provider testing disabled - now using cached data from Lambda',
      suggestion: 'Use /api/playscanner/search for cached results',
      timestamp: new Date().toISOString(),
    },
    { status: 410 }
  );
}

/**
 * Get available providers for testing - DEPRECATED
 * GET /api/playscanner/test
 */
export async function GET() {
  return NextResponse.json({
    status: 'deprecated',
    message: 'Provider testing disabled - now using cached data from Lambda',
    providers: [
      {
        name: 'playtomic',
        sports: ['padel'],
        regions: ['uk'],
        status: 'managed_by_lambda',
      },
    ],
    timestamp: new Date().toISOString(),
  });
}
