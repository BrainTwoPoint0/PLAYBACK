import { supabase } from './supabase';
import { Profile, Highlight, UserSport } from './profileService';

export interface SearchFilters {
  sports?: string[];
  roles?: string[];
  locations?: string[];
  experienceLevels?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  isPublic?: boolean;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UserSearchResult extends Profile {
  user_sports: UserSport[];
  highlights_count: number;
  achievements_count: number;
  mutual_connections: number;
  shared_sports: string[];
}

export interface HighlightSearchResult extends Highlight {
  user_profile: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  sport_name: string;
  likes_count: number;
  views_count: number;
  comments_count: number;
}

export interface SearchSuggestion {
  type: 'user' | 'sport' | 'tag' | 'location';
  value: string;
  count: number;
}

export class SearchService {
  // Search users with filters
  async searchUsers(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult<UserSearchResult>> {
    try {
      let queryBuilder = supabase
        .from('profiles')
        .select(
          `
          *,
          user_sports (*),
          highlights (count),
          user_achievements!inner(count)
        `
        )
        .or(
          `full_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`
        )
        .eq('is_public', true);

      // Apply filters
      if (filters.sports && filters.sports.length > 0) {
        queryBuilder = queryBuilder.in('user_sports.sport_id', filters.sports);
      }

      if (filters.roles && filters.roles.length > 0) {
        queryBuilder = queryBuilder.in('user_sports.role', filters.roles);
      }

      if (filters.locations && filters.locations.length > 0) {
        queryBuilder = queryBuilder.in('location', filters.locations);
      }

      if (filters.experienceLevels && filters.experienceLevels.length > 0) {
        queryBuilder = queryBuilder.in(
          'user_sports.experience_level',
          filters.experienceLevels
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', filters.tags);
      }

      if (filters.dateRange) {
        queryBuilder = queryBuilder
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      // Pagination
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        throw error;
      }

      // Transform data to include computed fields
      const transformedData = (data || []).map((user: any) => ({
        ...user,
        highlights_count: user.highlights?.[0]?.count || 0,
        achievements_count: user.user_achievements?.[0]?.count || 0,
        mutual_connections: 0, // This would be calculated separately
        shared_sports: [], // This would be calculated separately
      }));

      return {
        data: transformedData,
        total: count || 0,
        page,
        limit,
        hasMore: (data || []).length === limit,
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }
  }

  // Search highlights with filters
  async searchHighlights(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult<HighlightSearchResult>> {
    try {
      let queryBuilder = supabase
        .from('highlights')
        .select(
          `
          *,
          profiles!inner (
            full_name,
            username,
            avatar_url
          ),
          sports!inner (name)
        `
        )
        .or(
          `title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`
        )
        .eq('is_public', true);

      // Apply filters
      if (filters.sports && filters.sports.length > 0) {
        queryBuilder = queryBuilder.in('sport_id', filters.sports);
      }

      if (filters.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', filters.tags);
      }

      if (filters.dateRange) {
        queryBuilder = queryBuilder
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      // Order by relevance (views + likes)
      queryBuilder = queryBuilder.order('views', { ascending: false });

      // Pagination
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        throw error;
      }

      // Transform data
      const transformedData = (data || []).map((highlight: any) => ({
        ...highlight,
        user_profile: highlight.profiles,
        sport_name: highlight.sports?.name,
        likes_count: highlight.likes || 0,
        views_count: highlight.views || 0,
        comments_count: 0, // This would be calculated separately
      }));

      return {
        data: transformedData,
        total: count || 0,
        page,
        limit,
        hasMore: (data || []).length === limit,
      };
    } catch (error) {
      console.error('Error searching highlights:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      // User suggestions
      const { data: users } = await supabase
        .from('profiles')
        .select('full_name, username')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .eq('is_public', true)
        .limit(5);

      users?.forEach((user) => {
        suggestions.push({
          type: 'user',
          value: user.full_name || user.username,
          count: 1,
        });
      });

      // Sport suggestions
      const { data: sports } = await supabase
        .from('sports')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(5);

      sports?.forEach((sport) => {
        suggestions.push({
          type: 'sport',
          value: sport.name,
          count: 1,
        });
      });

      // Tag suggestions (from highlights)
      const { data: highlights } = await supabase
        .from('highlights')
        .select('tags')
        .not('tags', 'is', null)
        .limit(100);

      const tagCounts: Record<string, number> = {};
      highlights?.forEach((highlight) => {
        highlight.tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      });

      Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([tag, count]) => {
          suggestions.push({
            type: 'tag',
            value: tag,
            count,
          });
        });

      // Location suggestions
      const { data: locations } = await supabase
        .from('profiles')
        .select('location')
        .not('location', 'is', null)
        .ilike('location', `%${query}%`)
        .limit(5);

      const locationCounts: Record<string, number> = {};
      locations?.forEach((profile) => {
        if (profile.location) {
          locationCounts[profile.location] =
            (locationCounts[profile.location] || 0) + 1;
        }
      });

      Object.entries(locationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([location, count]) => {
          suggestions.push({
            type: 'location',
            value: location,
            count,
          });
        });

      return suggestions;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Get trending content
  async getTrendingContent(limit: number = 10): Promise<{
    highlights: HighlightSearchResult[];
    users: UserSearchResult[];
    tags: { tag: string; count: number }[];
  }> {
    try {
      // Trending highlights (most viewed in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: trendingHighlights } = await supabase
        .from('highlights')
        .select(
          `
          *,
          profiles!inner (
            full_name,
            username,
            avatar_url
          ),
          sports!inner (name)
        `
        )
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('is_public', true)
        .order('views', { ascending: false })
        .limit(limit);

      // Trending users (most highlights in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: trendingUsers } = await supabase
        .from('profiles')
        .select(
          `
          *,
          highlights (count)
        `
        )
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('is_public', true)
        .order('highlights.count', { ascending: false })
        .limit(limit);

      // Trending tags
      const { data: allHighlights } = await supabase
        .from('highlights')
        .select('tags')
        .not('tags', 'is', null)
        .gte('created_at', sevenDaysAgo.toISOString());

      const tagCounts: Record<string, number> = {};
      allHighlights?.forEach((highlight) => {
        highlight.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const trendingTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));

      return {
        highlights: (trendingHighlights || []).map((highlight: any) => ({
          ...highlight,
          user_profile: highlight.profiles,
          sport_name: highlight.sports?.name,
          likes_count: highlight.likes || 0,
          views_count: highlight.views || 0,
          comments_count: 0,
        })),
        users: (trendingUsers || []).map((user: any) => ({
          ...user,
          highlights_count: user.highlights?.[0]?.count || 0,
          achievements_count: 0,
          mutual_connections: 0,
          shared_sports: [],
        })),
        tags: trendingTags,
      };
    } catch (error) {
      console.error('Error getting trending content:', error);
      return {
        highlights: [],
        users: [],
        tags: [],
      };
    }
  }

  // Get recommended users for a specific user
  async getRecommendedUsers(
    userId: string,
    limit: number = 10
  ): Promise<UserSearchResult[]> {
    try {
      // Get user's sports and interests
      const { data: userProfile } = await supabase
        .from('profiles')
        .select(
          `
          tags,
          user_sports (sport_id, role)
        `
        )
        .eq('id', userId)
        .single();

      if (!userProfile) {
        return [];
      }

      const userSports =
        userProfile.user_sports?.map((us: any) => us.sport_id) || [];
      const userTags = userProfile.tags || [];

      // Find users with similar interests
      let queryBuilder = supabase
        .from('profiles')
        .select(
          `
          *,
          user_sports (*),
          highlights (count)
        `
        )
        .neq('id', userId)
        .eq('is_public', true);

      // Filter by shared sports
      if (userSports.length > 0) {
        queryBuilder = queryBuilder.in('user_sports.sport_id', userSports);
      }

      // Filter by shared tags
      if (userTags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', userTags);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []).map((user: any) => ({
        ...user,
        highlights_count: user.highlights?.[0]?.count || 0,
        achievements_count: 0,
        mutual_connections: 0,
        shared_sports: userSports.filter((sport: string) =>
          user.user_sports?.some((us: any) => us.sport_id === sport)
        ),
      }));
    } catch (error) {
      console.error('Error getting recommended users:', error);
      return [];
    }
  }

  // Get search analytics
  async getSearchAnalytics(): Promise<{
    totalUsers: number;
    totalHighlights: number;
    popularSearches: { query: string; count: number }[];
    activeSports: { sport: string; count: number }[];
  }> {
    try {
      // Get total counts
      const [{ count: totalUsers }, { count: totalHighlights }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_public', true),
          supabase
            .from('highlights')
            .select('*', { count: 'exact', head: true })
            .eq('is_public', true),
        ]);

      // Get popular sports
      const { data: sportsData } = await supabase
        .from('user_sports')
        .select('sport_id, sports!inner(name)')
        .limit(1000);

      const sportCounts: Record<string, number> = {};
      sportsData?.forEach((item: any) => {
        const sportName = item.sports?.name;
        if (sportName) {
          sportCounts[sportName] = (sportCounts[sportName] || 0) + 1;
        }
      });

      const activeSports = Object.entries(sportCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([sport, count]) => ({ sport, count }));

      return {
        totalUsers: totalUsers || 0,
        totalHighlights: totalHighlights || 0,
        popularSearches: [], // This would be tracked separately
        activeSports,
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return {
        totalUsers: 0,
        totalHighlights: 0,
        popularSearches: [],
        activeSports: [],
      };
    }
  }
}

// Factory function to create search service
export const createSearchService = () => new SearchService();
