import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          date_of_birth: string | null;
          phone: string | null;
          website: string | null;
          social_links: any | null;
          kit_number: number | null;
          graduation_year: number | null;
          gpa: number | null;
          strong_foot: 'left' | 'right' | 'both' | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          date_of_birth?: string | null;
          phone?: string | null;
          website?: string | null;
          social_links?: any | null;
          kit_number?: number | null;
          graduation_year?: number | null;
          gpa?: number | null;
          strong_foot?: 'left' | 'right' | 'both' | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          date_of_birth?: string | null;
          phone?: string | null;
          website?: string | null;
          social_links?: any | null;
          kit_number?: number | null;
          graduation_year?: number | null;
          gpa?: number | null;
          strong_foot?: 'left' | 'right' | 'both' | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sports: {
        Row: {
          id: string;
          user_id: string;
          sport: string;
          user_type:
            | 'player'
            | 'coach'
            | 'manager'
            | 'staff'
            | 'scout'
            | 'analyst';
          experience_years: number | null;
          level:
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'professional'
            | 'elite'
            | null;
          positions: string[] | null;
          achievements: string[] | null;
          certifications: string[] | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport: string;
          user_type:
            | 'player'
            | 'coach'
            | 'manager'
            | 'staff'
            | 'scout'
            | 'analyst';
          experience_years?: number | null;
          level?:
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'professional'
            | 'elite'
            | null;
          positions?: string[] | null;
          achievements?: string[] | null;
          certifications?: string[] | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport?: string;
          user_type?:
            | 'player'
            | 'coach'
            | 'manager'
            | 'staff'
            | 'scout'
            | 'analyst';
          experience_years?: number | null;
          level?:
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'professional'
            | 'elite'
            | null;
          positions?: string[] | null;
          achievements?: string[] | null;
          certifications?: string[] | null;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      user_highlights: {
        Row: {
          id: string;
          user_id: string;
          sport_id: string;
          title: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          skill_tags: string[] | null;
          player_target_time: number | null;
          player_position_x: number | null;
          player_position_y: number | null;
          duration: number | null;
          is_featured: boolean;
          view_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport_id: string;
          title: string;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          skill_tags?: string[] | null;
          player_target_time?: number | null;
          player_position_x?: number | null;
          player_position_y?: number | null;
          duration?: number | null;
          is_featured?: boolean;
          view_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport_id?: string;
          title?: string;
          description?: string | null;
          video_url?: string;
          thumbnail_url?: string | null;
          skill_tags?: string[] | null;
          player_target_time?: number | null;
          player_position_x?: number | null;
          player_position_y?: number | null;
          duration?: number | null;
          is_featured?: boolean;
          view_count?: number;
          created_at?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          sport_id: string;
          stat_type: string;
          stat_name: string;
          stat_value: string;
          stat_unit: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport_id: string;
          stat_type: string;
          stat_name: string;
          stat_value: string;
          stat_unit?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport_id?: string;
          stat_type?: string;
          stat_name?: string;
          stat_value?: string;
          stat_unit?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
      };
      user_positions: {
        Row: {
          id: string;
          user_id: string;
          sport_id: string;
          position_name: string;
          position_x: number;
          position_y: number;
          preference_level: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport_id: string;
          position_name: string;
          position_x: number;
          position_y: number;
          preference_level: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport_id?: string;
          position_name?: string;
          position_x?: number;
          position_y?: number;
          preference_level?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      user_play_styles: {
        Row: {
          id: string;
          user_id: string;
          sport_id: string;
          play_style: string;
          description: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport_id: string;
          play_style: string;
          description?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport_id?: string;
          play_style?: string;
          description?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      external_integrations: {
        Row: {
          id: string;
          user_id: string;
          platform: 'veo' | 'playerdata' | 'other';
          external_id: string | null;
          profile_url: string | null;
          last_sync: string | null;
          sync_status: 'pending' | 'success' | 'failed';
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: 'veo' | 'playerdata' | 'other';
          external_id?: string | null;
          profile_url?: string | null;
          last_sync?: string | null;
          sync_status?: 'pending' | 'success' | 'failed';
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: 'veo' | 'playerdata' | 'other';
          external_id?: string | null;
          profile_url?: string | null;
          last_sync?: string | null;
          sync_status?: 'pending' | 'success' | 'failed';
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profile_shares: {
        Row: {
          id: string;
          user_id: string;
          share_code: string;
          is_active: boolean;
          view_count: number;
          last_viewed: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          share_code: string;
          is_active?: boolean;
          view_count?: number;
          last_viewed?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          share_code?: string;
          is_active?: boolean;
          view_count?: number;
          last_viewed?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
