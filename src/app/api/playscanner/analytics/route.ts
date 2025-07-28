import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * PLAYScanner Analytics API
 * GET /api/playscanner/analytics
 *
 * Provides analytics data for visitor tracking and conversion metrics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '7'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Get visitor analytics
    const { data: sessions, error: sessionsError } = await supabase
      .from('playscanner_sessions')
      .select('*')
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Get search analytics
    const { data: searches, error: searchesError } = await supabase
      .from('playscanner_searches')
      .select('*')
      .gte('searched_at', startDate.toISOString())
      .order('searched_at', { ascending: false });

    if (searchesError) {
      throw new Error(`Failed to fetch searches: ${searchesError.message}`);
    }

    // Get conversion analytics
    const { data: conversions, error: conversionsError } = await supabase
      .from('playscanner_conversions')
      .select('*')
      .gte('clicked_at', startDate.toISOString())
      .order('clicked_at', { ascending: false });

    if (conversionsError) {
      throw new Error(
        `Failed to fetch conversions: ${conversionsError.message}`
      );
    }

    // Get provider analytics
    const { data: providerAnalytics, error: providerError } = await supabase
      .from('provider_analytics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (providerError) {
      throw new Error(
        `Failed to fetch provider analytics: ${providerError.message}`
      );
    }

    // Calculate summary metrics
    const analytics = {
      timeframe: `${timeframe} days`,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },

      // Visitor metrics
      visitors: {
        totalSessions: sessions?.length || 0,
        uniqueVisitors: new Set(sessions?.map((s) => s.ip_address)).size,
        averageSessionDuration:
          sessions?.reduce((sum, s) => sum + (s.session_duration || 0), 0) /
          (sessions?.length || 1),
        totalPageViews: sessions?.reduce(
          (sum, s) => sum + (s.page_views || 0),
          0
        ),
        bounceRate:
          (sessions?.filter((s) => (s.page_views || 0) <= 1).length /
            (sessions?.length || 1)) *
          100,
      },

      // Search metrics
      searches: {
        totalSearches: searches?.length || 0,
        averageResultsPerSearch:
          searches?.reduce((sum, s) => sum + (s.results_count || 0), 0) /
          (searches?.length || 1),
        averageSearchDuration:
          searches?.reduce((sum, s) => sum + (s.search_duration_ms || 0), 0) /
          (searches?.length || 1),
        topProviders: getTopProviders(searches || []),
      },

      // Conversion metrics
      conversions: {
        totalConversions: conversions?.length || 0,
        conversionRate:
          ((conversions?.length || 0) / (searches?.length || 1)) * 100,
        totalEstimatedRevenue: conversions?.reduce(
          (sum, c) => sum + (c.estimated_commission || 0),
          0
        ),
        averageBookingValue:
          conversions?.reduce((sum, c) => sum + (c.estimated_price || 0), 0) /
          (conversions?.length || 1),
        topProviders: getTopConversionProviders(conversions || []),
      },

      // Provider performance
      providers:
        providerAnalytics?.map((p) => ({
          name: p.provider_name,
          date: p.date,
          clicks: p.total_clicks,
          revenue: p.estimated_revenue,
          conversionRate: p.conversion_rate,
        })) || [],

      // Daily breakdown
      daily: getDailyBreakdown(
        sessions || [],
        searches || [],
        conversions || [],
        parseInt(timeframe)
      ),

      // Geographic data (simplified)
      geography: getGeographicBreakdown(sessions || []),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('❌ Analytics API error:', error);

    return NextResponse.json(
      {
        error: 'Analytics fetch failed',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Helper functions for analytics calculations
 */
function getTopProviders(
  searches: any[]
): Array<{ provider: string; count: number }> {
  const providerCounts: Record<string, number> = {};

  searches.forEach((search) => {
    if (search.viewed_providers) {
      search.viewed_providers.forEach((provider: string) => {
        providerCounts[provider] = (providerCounts[provider] || 0) + 1;
      });
    }
  });

  return Object.entries(providerCounts)
    .map(([provider, count]) => ({ provider, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getTopConversionProviders(
  conversions: any[]
): Array<{ provider: string; count: number; revenue: number }> {
  const providerStats: Record<string, { count: number; revenue: number }> = {};

  conversions.forEach((conversion) => {
    const provider = conversion.provider_name;
    if (!providerStats[provider]) {
      providerStats[provider] = { count: 0, revenue: 0 };
    }
    providerStats[provider].count += 1;
    providerStats[provider].revenue += conversion.estimated_commission || 0;
  });

  return Object.entries(providerStats)
    .map(([provider, stats]) => ({ provider, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function getDailyBreakdown(
  sessions: any[],
  searches: any[],
  conversions: any[],
  days: number
) {
  const dailyData = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const daySessions = sessions.filter((s) =>
      s.started_at.startsWith(dateStr)
    );
    const daySearches = searches.filter((s) =>
      s.searched_at.startsWith(dateStr)
    );
    const dayConversions = conversions.filter((c) =>
      c.clicked_at.startsWith(dateStr)
    );

    dailyData.unshift({
      date: dateStr,
      sessions: daySessions.length,
      searches: daySearches.length,
      conversions: dayConversions.length,
      revenue: dayConversions.reduce(
        (sum, c) => sum + (c.estimated_commission || 0),
        0
      ),
    });
  }

  return dailyData;
}

function getGeographicBreakdown(sessions: any[]) {
  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};

  sessions.forEach((session) => {
    if (session.country_code) {
      countryCounts[session.country_code] =
        (countryCounts[session.country_code] || 0) + 1;
    }
    if (session.city) {
      cityCounts[session.city] = (cityCounts[session.city] || 0) + 1;
    }
  });

  return {
    countries: Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    cities: Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}
