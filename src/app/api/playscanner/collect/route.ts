import { NextRequest, NextResponse } from 'next/server';
import { PlaytomicProvider } from '@/lib/playscanner/providers/playtomic';

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

        // Authentication check (you'll want to secure this endpoint)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.PLAYSCANNER_COLLECT_SECRET}`) {
            return NextResponse.json({
                error: 'Unauthorized',
            }, { status: 401 });
        }

        const provider = new PlaytomicProvider();
        const collectResults = [];

        // Define collection parameters
        const cities = ['London']; // Expand later
        const daysAhead = 7; // Collect next 7 days

        for (const city of cities) {
            for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
                const date = new Date();
                date.setDate(date.getDate() + dayOffset);
                const dateString = date.toISOString().split('T')[0];

                try {
                    // Collect availability for this city/date
                    const params = {
                        sport: 'padel' as const,
                        location: city,
                        date: dateString,
                    };

                    const slots = await provider.fetchAvailability(params);

                    // Here you would store in your database (Supabase)
                    // For now, we'll just collect the results
                    collectResults.push({
                        city,
                        date: dateString,
                        slotsCount: slots.length,
                        venues: [...new Set(slots.map(slot => slot.venue.id))].length,
                        priceRange: slots.length > 0 ? {
                            min: Math.min(...slots.map(s => s.price)) / 100,
                            max: Math.max(...slots.map(s => s.price)) / 100,
                        } : null,
                    });

                    // Add delay between requests to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (error) {
                    collectResults.push({
                        city,
                        date: dateString,
                        error: (error as Error).message,
                    });
                }
            }
        }

        const collectTime = Date.now() - startTime;

        return NextResponse.json({
            status: 'success',
            message: 'Data collection completed',
            results: collectResults,
            totalCollected: collectResults.filter(r => !r.error).length,
            errors: collectResults.filter(r => r.error).length,
            collectionTime: collectTime,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: 'Collection failed',
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

/**
 * Collection Status Endpoint
 * GET /api/playscanner/collect
 */
export async function GET() {
    return NextResponse.json({
        status: 'ready',
        message: 'Background collection service ready',
        instructions: 'POST with Authorization header to start collection',
        timestamp: new Date().toISOString(),
    });
} 