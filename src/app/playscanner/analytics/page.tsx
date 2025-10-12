'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@playback/commons/components/ui/card';
import { Button } from '@playback/commons/components/ui/button';
import { Badge } from '@playback/commons/components/ui/badge';
import {
  Users,
  Search,
  MousePointer,
  PoundSterling,
  TrendingUp,
  Calendar,
  MapPin,
  BarChart3,
  Download,
} from 'lucide-react';
import {
  SimpleBarChart,
  SimpleLineChart,
} from '@playback/commons/components/analytics/SimpleChart';

interface AnalyticsData {
  timeframe: string;
  period: {
    start: string;
    end: string;
  };
  visitors: {
    totalSessions: number;
    uniqueVisitors: number;
    averageSessionDuration: number;
    totalPageViews: number;
    bounceRate: number;
  };
  searches: {
    totalSearches: number;
    averageResultsPerSearch: number;
    averageSearchDuration: number;
    topProviders: Array<{ provider: string; count: number }>;
  };
  conversions: {
    totalConversions: number;
    conversionRate: number;
    totalEstimatedRevenue: number;
    averageBookingValue: number;
    topProviders: Array<{ provider: string; count: number; revenue: number }>;
  };
  providers: Array<{
    name: string;
    date: string;
    clicks: number;
    revenue: number;
    conversionRate: number;
  }>;
  daily: Array<{
    date: string;
    sessions: number;
    searches: number;
    conversions: number;
    revenue: number;
  }>;
  geography: {
    countries: Array<{ country: string; count: number }>;
    cities: Array<{ city: string; count: number }>;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (days: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/playscanner/analytics?timeframe=${days}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exportData = () => {
    if (!analytics) return;

    const exportData = {
      period: analytics.period,
      summary: {
        totalSessions: analytics.visitors.totalSessions,
        uniqueVisitors: analytics.visitors.uniqueVisitors,
        totalConversions: analytics.conversions.totalConversions,
        conversionRate: analytics.conversions.conversionRate,
        totalRevenue: analytics.conversions.totalEstimatedRevenue,
      },
      providerPerformance: analytics.conversions.topProviders,
      dailyBreakdown: analytics.daily,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `playscanner-analytics-${timeframe}d.json`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-800 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-600/20 bg-red-950/20">
            <CardContent className="p-6">
              <div className="text-red-400 text-center">
                <h2 className="text-xl font-semibold mb-2">Analytics Error</h2>
                <p>{error}</p>
                <Button
                  onClick={() => fetchAnalytics(timeframe)}
                  variant="outline"
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-neutral-400">
            No analytics data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-[#00FF88]" />
              PLAYScanner Analytics
            </h1>
            <p className="text-neutral-400 mt-1">
              Visitor tracking and booking conversion insights
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-neutral-700 rounded-lg p-1">
              {['1', '7', '30'].map((days) => (
                <Button
                  key={days}
                  variant={timeframe === days ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeframe(days)}
                  className="h-8"
                >
                  {days === '1' ? '24h' : `${days}d`}
                </Button>
              ))}
            </div>

            <Button
              onClick={exportData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.visitors.totalSessions.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-400">
                {analytics.visitors.uniqueVisitors} unique •{' '}
                {analytics.visitors.totalPageViews} page views
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Avg session:{' '}
                {formatDuration(analytics.visitors.averageSessionDuration)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4 text-green-400" />
                Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.searches.totalSearches.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-400">
                {analytics.searches.averageResultsPerSearch.toFixed(1)} avg
                results
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Avg duration:{' '}
                {(analytics.searches.averageSearchDuration / 1000).toFixed(1)}s
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-orange-400" />
                Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.conversions.totalConversions.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-400">
                {analytics.conversions.conversionRate.toFixed(1)}% conversion
                rate
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Avg booking:{' '}
                {formatCurrency(
                  analytics.conversions.averageBookingValue / 100
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PoundSterling className="h-4 w-4 text-[#00FF88]" />
                Est. Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00FF88]">
                {formatCurrency(analytics.conversions.totalEstimatedRevenue)}
              </div>
              <div className="text-xs text-neutral-400">
                Commission estimates
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {analytics.timeframe}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Activity Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart
                data={analytics.daily.map((day) => ({
                  label: new Date(day.date).toLocaleDateString('en-GB', {
                    month: 'short',
                    day: 'numeric',
                  }),
                  value: day.sessions,
                }))}
                height={250}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Provider Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={analytics.conversions.topProviders.map((provider) => ({
                  label: provider.provider,
                  value: provider.revenue,
                  color:
                    provider.provider === 'Playtomic'
                      ? '#00FF88'
                      : provider.provider === 'MATCHi'
                        ? '#0099FF'
                        : '#FF6B00',
                }))}
                height={250}
              />
            </CardContent>
          </Card>
        </div>

        {/* Provider Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Conversion Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.conversions.topProviders.map((provider, index) => (
                  <div
                    key={provider.provider}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{provider.provider}</div>
                        <div className="text-sm text-neutral-400">
                          {provider.count} bookings
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#00FF88]">
                        {formatCurrency(provider.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Top Cities</h4>
                  <div className="space-y-2">
                    {analytics.geography.cities.slice(0, 5).map((city) => (
                      <div
                        key={city.city}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{city.city}</span>
                        <Badge variant="outline" className="text-xs">
                          {city.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Top Countries</h4>
                  <div className="space-y-2">
                    {analytics.geography.countries
                      .slice(0, 5)
                      .map((country) => (
                        <div
                          key={country.country}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm">{country.country}</span>
                          <Badge variant="outline" className="text-xs">
                            {country.count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Breakdown ({analytics.timeframe})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-2 px-3 text-sm font-medium text-neutral-400">
                      Date
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-neutral-400">
                      Sessions
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-neutral-400">
                      Searches
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-neutral-400">
                      Conversions
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-neutral-400">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.daily.map((day) => (
                    <tr
                      key={day.date}
                      className="border-b border-neutral-800/50"
                    >
                      <td className="py-2 px-3 text-sm">
                        {new Date(day.date).toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="text-right py-2 px-3 text-sm">
                        {day.sessions}
                      </td>
                      <td className="text-right py-2 px-3 text-sm">
                        {day.searches}
                      </td>
                      <td className="text-right py-2 px-3 text-sm">
                        {day.conversions}
                      </td>
                      <td className="text-right py-2 px-3 text-sm text-[#00FF88]">
                        {formatCurrency(day.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Footer */}
        <Card className="bg-neutral-900/50 border-[#00FF88]/20">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Commission Summary</h3>
              <p className="text-neutral-400 mb-4">
                Over the last {analytics.timeframe}, PLAYScanner generated{' '}
                {analytics.conversions.totalConversions} booking conversions
                with an estimated total commission value of{' '}
                <span className="text-[#00FF88] font-semibold">
                  {formatCurrency(analytics.conversions.totalEstimatedRevenue)}
                </span>
                .
              </p>
              <div className="text-sm text-neutral-500">
                Data includes Playtomic (5%), MATCHi (4%), and Padel Mates (6%)
                commission rates.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
