/**
 * PLAYScanner Analytics Service
 * Tracks visitor sessions, page views, searches, and booking conversions
 */

import { createClient } from '@supabase/supabase-js';

interface SessionData {
  session_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  country_code?: string;
  city?: string;
}

interface PageViewData {
  session_id: string;
  page_type: 'search' | 'results' | 'map' | 'filters';
  page_url: string;
  referrer?: string;
  time_on_page?: number;
}

interface SearchData {
  session_id: string;
  search_params: Record<string, any>;
  results_count: number;
  search_duration_ms: number;
  viewed_providers: string[];
}

interface ConversionData {
  session_id: string;
  search_id?: string;
  provider_name: string;
  venue_name: string;
  venue_location: string;
  booking_url: string;
  estimated_price?: number;
  sport: string;
  estimated_commission?: number;
  commission_rate?: number;
}

class PLAYScannerAnalytics {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  private currentSessionId: string | null = null;
  private sessionStartTime: number = Date.now();
  private lastPageViewTime: number = Date.now();

  /**
   * Initialize a new session or resume existing one
   */
  async initSession(userId?: string): Promise<string> {
    // Check for existing session in sessionStorage
    if (typeof window !== 'undefined') {
      const existingSessionId = sessionStorage.getItem(
        'playscanner_session_id'
      );
      const sessionStartTime = sessionStorage.getItem(
        'playscanner_session_start'
      );

      // Resume session if less than 30 minutes old
      if (existingSessionId && sessionStartTime) {
        const sessionAge = Date.now() - parseInt(sessionStartTime);
        if (sessionAge < 30 * 60 * 1000) {
          // 30 minutes
          this.currentSessionId = existingSessionId;
          this.sessionStartTime = parseInt(sessionStartTime);
          return existingSessionId;
        }
      }
    }

    // Create new session
    const sessionId = this.generateSessionId();
    this.currentSessionId = sessionId;
    this.sessionStartTime = Date.now();

    // Store in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('playscanner_session_id', sessionId);
      sessionStorage.setItem(
        'playscanner_session_start',
        this.sessionStartTime.toString()
      );
    }

    // Create session record
    const sessionData: SessionData = {
      session_id: sessionId,
      user_id: userId,
      user_agent:
        typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ...(await this.getLocationData()),
    };

    await this.createSession(sessionData);
    return sessionId;
  }

  /**
   * Track a page view
   */
  async trackPageView(
    pageType: PageViewData['page_type'],
    additionalData: Partial<PageViewData> = {}
  ) {
    if (!this.currentSessionId) {
      await this.initSession();
    }

    const timeOnPage = Date.now() - this.lastPageViewTime;
    this.lastPageViewTime = Date.now();

    const pageViewData: PageViewData = {
      session_id: this.currentSessionId!,
      page_type: pageType,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      time_on_page:
        timeOnPage > 100 ? Math.round(timeOnPage / 1000) : undefined, // Only track if > 100ms
      ...additionalData,
    };

    await this.createPageView(pageViewData);
    await this.updateSessionActivity();
  }

  /**
   * Track a search query
   */
  async trackSearch(
    searchParams: Record<string, any>,
    resultsCount: number,
    searchDurationMs: number,
    viewedProviders: string[]
  ): Promise<string> {
    if (!this.currentSessionId) {
      await this.initSession();
    }

    const searchData: SearchData = {
      session_id: this.currentSessionId!,
      search_params: searchParams,
      results_count: resultsCount,
      search_duration_ms: searchDurationMs,
      viewed_providers: viewedProviders,
    };

    const searchId = await this.createSearch(searchData);
    await this.updateSessionActivity();

    // Increment search count
    await this.incrementSessionSearches();

    return searchId;
  }

  /**
   * Track a booking conversion (click to provider)
   */
  async trackConversion(
    conversionData: Omit<ConversionData, 'session_id'>,
    searchId?: string
  ) {
    if (!this.currentSessionId) {
      await this.initSession();
    }

    const fullConversionData: ConversionData = {
      session_id: this.currentSessionId!,
      search_id: searchId,
      ...conversionData,
    };

    await this.createConversion(fullConversionData);
    await this.updateSessionActivity();

    // Increment booking clicks count
    await this.incrementSessionBookingClicks();

    // Update daily provider analytics
    await this.updateProviderAnalytics(
      conversionData.provider_name,
      conversionData.estimated_commission || 0
    );
  }

  /**
   * End current session
   */
  async endSession() {
    if (!this.currentSessionId) return;

    const sessionDuration = Math.round(
      (Date.now() - this.sessionStartTime) / 1000
    );

    await this.supabase
      .from('playscanner_sessions')
      .update({
        session_duration: sessionDuration,
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', this.currentSessionId);

    // Clear session data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('playscanner_session_id');
      sessionStorage.removeItem('playscanner_session_start');
    }

    this.currentSessionId = null;
  }

  // Private helper methods

  private generateSessionId(): string {
    return `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getLocationData() {
    // In a real implementation, you might use a geolocation service
    // For now, return empty object
    return {};
  }

  private async createSession(sessionData: SessionData) {
    const { error } = await this.supabase
      .from('playscanner_sessions')
      .insert(sessionData)
      .select();

    if (error) {
      console.error('Failed to create session:', error);
    }
  }

  private async createPageView(pageViewData: PageViewData) {
    const { error } = await this.supabase
      .from('playscanner_page_views')
      .insert(pageViewData);

    if (error) {
      console.error('Failed to create page view:', error);
    }
  }

  private async createSearch(searchData: SearchData): Promise<string> {
    const { data, error } = await this.supabase
      .from('playscanner_searches')
      .insert(searchData)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create search:', error);
      return '';
    }

    return data?.id || '';
  }

  private async createConversion(conversionData: ConversionData) {
    const { error } = await this.supabase
      .from('playscanner_conversions')
      .insert(conversionData);

    if (error) {
      console.error('Failed to create conversion:', error);
    }
  }

  private async updateSessionActivity() {
    if (!this.currentSessionId) return;

    const { error } = await this.supabase
      .from('playscanner_sessions')
      .update({
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', this.currentSessionId);

    if (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  private async incrementSessionSearches() {
    if (!this.currentSessionId) return;

    const { data, error } = await this.supabase
      .from('playscanner_sessions')
      .select('search_queries')
      .eq('session_id', this.currentSessionId)
      .single();

    if (error) {
      console.error('Failed to get session searches:', error);
      return;
    }

    const { error: updateError } = await this.supabase
      .from('playscanner_sessions')
      .update({
        search_queries: (data?.search_queries || 0) + 1,
      })
      .eq('session_id', this.currentSessionId);

    if (updateError) {
      console.error('Failed to increment session searches:', updateError);
    }
  }

  private async incrementSessionBookingClicks() {
    if (!this.currentSessionId) return;

    const { data, error } = await this.supabase
      .from('playscanner_sessions')
      .select('booking_clicks')
      .eq('session_id', this.currentSessionId)
      .single();

    if (error) {
      console.error('Failed to get session booking clicks:', error);
      return;
    }

    const { error: updateError } = await this.supabase
      .from('playscanner_sessions')
      .update({
        booking_clicks: (data?.booking_clicks || 0) + 1,
      })
      .eq('session_id', this.currentSessionId);

    if (updateError) {
      console.error('Failed to increment session booking clicks:', updateError);
    }
  }

  private async updateProviderAnalytics(
    providerName: string,
    estimatedCommission: number
  ) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get existing analytics or create new
    const { data: existing } = await this.supabase
      .from('provider_analytics')
      .select('*')
      .eq('provider_name', providerName)
      .eq('date', today)
      .single();

    const analyticsData = {
      provider_name: providerName,
      date: today,
      total_clicks: (existing?.total_clicks || 0) + 1,
      estimated_revenue:
        (existing?.estimated_revenue || 0) + estimatedCommission,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from('provider_analytics')
      .upsert(analyticsData, {
        onConflict: 'provider_name,date',
      });

    if (error) {
      console.error('Failed to update provider analytics:', error);
    }
  }
}

// Export singleton instance
export const playscannerAnalytics = new PLAYScannerAnalytics();

// Utility functions for calculating commission estimates
export const CommissionCalculator = {
  /**
   * Calculate estimated commission based on provider and booking value
   */
  calculateCommission(
    providerName: string,
    bookingValue: number
  ): { commission: number; rate: number } {
    const rates: Record<string, number> = {
      Playtomic: 0.05, // 5% commission rate
      MATCHi: 0.04, // 4% commission rate
      'Padel Mates': 0.06, // 6% commission rate
      default: 0.05, // Default 5%
    };

    const rate = rates[providerName] || rates.default;
    const commission = bookingValue * rate;

    return { commission, rate };
  },

  /**
   * Get provider-specific commission rates
   */
  getProviderRate(providerName: string): number {
    const rates: Record<string, number> = {
      Playtomic: 5,
      MATCHi: 4,
      'Padel Mates': 6,
      default: 5,
    };

    return rates[providerName] || rates.default;
  },
};
