export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    user_id: string | null
                    username: string
                    full_name: string
                    bio: string | null
                    avatar_url: string | null
                    location: string | null
                    date_of_birth: string | null
                    phone: string | null
                    website: string | null
                    social_links: Json | null
                    tags: string[] | null
                    is_public: boolean | null
                    is_verified: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    username: string
                    full_name: string
                    bio?: string | null
                    avatar_url?: string | null
                    location?: string | null
                    date_of_birth?: string | null
                    phone?: string | null
                    website?: string | null
                    social_links?: Json | null
                    tags?: string[] | null
                    is_public?: boolean | null
                    is_verified?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    username?: string
                    full_name?: string
                    bio?: string | null
                    avatar_url?: string | null
                    location?: string | null
                    date_of_birth?: string | null
                    phone?: string | null
                    website?: string | null
                    social_links?: Json | null
                    tags?: string[] | null
                    is_public?: boolean | null
                    is_verified?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            sports: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    icon_url: string | null
                    is_active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    icon_url?: string | null
                    is_active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    icon_url?: string | null
                    is_active?: boolean | null
                    created_at?: string | null
                }
                Relationships: []
            }
            user_sports: {
                Row: {
                    id: string
                    user_id: string | null
                    sport_id: string | null
                    role: 'player' | 'coach' | 'scout' | 'fan'
                    experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
                    positions: string[] | null
                    years_experience: number | null
                    achievements: string[] | null
                    is_primary: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    sport_id?: string | null
                    role: 'player' | 'coach' | 'scout' | 'fan'
                    experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
                    positions?: string[] | null
                    years_experience?: number | null
                    achievements?: string[] | null
                    is_primary?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    sport_id?: string | null
                    role?: 'player' | 'coach' | 'scout' | 'fan'
                    experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
                    positions?: string[] | null
                    years_experience?: number | null
                    achievements?: string[] | null
                    is_primary?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_sports_sport_id_fkey"
                        columns: ["sport_id"]
                        isOneToOne: false
                        referencedRelation: "sports"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_sports_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            highlights: {
                Row: {
                    id: string
                    user_id: string | null
                    sport_id: string | null
                    title: string
                    description: string | null
                    video_url: string
                    thumbnail_url: string | null
                    duration: number | null
                    tags: string[] | null
                    is_public: boolean | null
                    views: number | null
                    likes: number | null
                    shares: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    sport_id?: string | null
                    title: string
                    description?: string | null
                    video_url: string
                    thumbnail_url?: string | null
                    duration?: number | null
                    tags?: string[] | null
                    is_public?: boolean | null
                    views?: number | null
                    likes?: number | null
                    shares?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    sport_id?: string | null
                    title?: string
                    description?: string | null
                    video_url?: string
                    thumbnail_url?: string | null
                    duration?: number | null
                    tags?: string[] | null
                    is_public?: boolean | null
                    views?: number | null
                    likes?: number | null
                    shares?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "highlights_sport_id_fkey"
                        columns: ["sport_id"]
                        isOneToOne: false
                        referencedRelation: "sports"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "highlights_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            statistics: {
                Row: {
                    id: string
                    user_id: string | null
                    sport_id: string | null
                    stat_type: string
                    stat_value: number
                    stat_unit: string | null
                    stat_date: string
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    sport_id?: string | null
                    stat_type: string
                    stat_value: number
                    stat_unit?: string | null
                    stat_date: string
                    notes?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    sport_id?: string | null
                    stat_type?: string
                    stat_value?: number
                    stat_unit?: string | null
                    stat_date?: string
                    notes?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "statistics_sport_id_fkey"
                        columns: ["sport_id"]
                        isOneToOne: false
                        referencedRelation: "sports"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "statistics_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            achievements: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    type: Database["public"]["Enums"]["achievement_type"]
                    icon_url: string | null
                    criteria: Json
                    points: number | null
                    is_active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    type: Database["public"]["Enums"]["achievement_type"]
                    icon_url?: string | null
                    criteria: Json
                    points?: number | null
                    is_active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    type?: Database["public"]["Enums"]["achievement_type"]
                    icon_url?: string | null
                    criteria?: Json
                    points?: number | null
                    is_active?: boolean | null
                    created_at?: string | null
                }
                Relationships: []
            }
            user_achievements: {
                Row: {
                    id: string
                    user_id: string | null
                    achievement_id: string | null
                    unlocked_at: string | null
                    progress: number | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    achievement_id?: string | null
                    unlocked_at?: string | null
                    progress?: number | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    achievement_id?: string | null
                    unlocked_at?: string | null
                    progress?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_achievements_achievement_id_fkey"
                        columns: ["achievement_id"]
                        isOneToOne: false
                        referencedRelation: "achievements"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_achievements_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            connections: {
                Row: {
                    id: string
                    requester_id: string | null
                    recipient_id: string | null
                    status: string | null
                    message: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    requester_id?: string | null
                    recipient_id?: string | null
                    status?: string | null
                    message?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    requester_id?: string | null
                    recipient_id?: string | null
                    status?: string | null
                    message?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "connections_recipient_id_fkey"
                        columns: ["recipient_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "connections_requester_id_fkey"
                        columns: ["requester_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string | null
                    type: 'achievement_unlocked' | 'new_connection' | 'highlight_liked' | 'highlight_commented' | 'highlight_shared' | 'new_follower' | 'profile_viewed' | 'match_suggestion' | 'tournament_invite' | 'system_update' | 'welcome_message'
                    title: string
                    message: string
                    data: Json | null
                    is_read: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    type: 'achievement_unlocked' | 'new_connection' | 'highlight_liked' | 'highlight_commented' | 'highlight_shared' | 'new_follower' | 'profile_viewed' | 'match_suggestion' | 'tournament_invite' | 'system_update' | 'welcome_message'
                    title: string
                    message: string
                    data?: Json | null
                    is_read?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    type?: 'achievement_unlocked' | 'new_connection' | 'highlight_liked' | 'highlight_commented' | 'highlight_shared' | 'new_follower' | 'profile_viewed' | 'match_suggestion' | 'tournament_invite' | 'system_update' | 'welcome_message'
                    title?: string
                    message?: string
                    data?: Json | null
                    is_read?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notification_preferences: {
                Row: {
                    id: string
                    user_id: string | null
                    email_notifications: boolean | null
                    push_notifications: boolean | null
                    in_app_notifications: boolean | null
                    achievement_notifications: boolean | null
                    connection_notifications: boolean | null
                    highlight_notifications: boolean | null
                    system_notifications: boolean | null
                    quiet_hours_enabled: boolean | null
                    quiet_hours_start: string | null
                    quiet_hours_end: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    email_notifications?: boolean | null
                    push_notifications?: boolean | null
                    in_app_notifications?: boolean | null
                    achievement_notifications?: boolean | null
                    connection_notifications?: boolean | null
                    highlight_notifications?: boolean | null
                    system_notifications?: boolean | null
                    quiet_hours_enabled?: boolean | null
                    quiet_hours_start?: string | null
                    quiet_hours_end?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    email_notifications?: boolean | null
                    push_notifications?: boolean | null
                    in_app_notifications?: boolean | null
                    achievement_notifications?: boolean | null
                    connection_notifications?: boolean | null
                    highlight_notifications?: boolean | null
                    system_notifications?: boolean | null
                    quiet_hours_enabled?: boolean | null
                    quiet_hours_start?: string | null
                    quiet_hours_end?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notification_preferences_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            analytics_events: {
                Row: {
                    id: string
                    user_id: string | null
                    event_type: string
                    event_data: Json | null
                    session_id: string | null
                    user_agent: string | null
                    ip_address: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    event_type: string
                    event_data?: Json | null
                    session_id?: string | null
                    user_agent?: string | null
                    ip_address?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    event_type?: string
                    event_data?: Json | null
                    session_id?: string | null
                    user_agent?: string | null
                    ip_address?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "analytics_events_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            public_profiles: {
                Row: {
                    id: string | null
                    user_id: string | null
                    username: string | null
                    full_name: string | null
                    bio: string | null
                    avatar_url: string | null
                    location: string | null
                    date_of_birth: string | null
                    phone: string | null
                    website: string | null
                    social_links: Json | null
                    tags: string[] | null
                    is_public: boolean | null
                    is_verified: boolean | null
                    created_at: string | null
                    updated_at: string | null
                    sports: string[] | null
                    highlights_count: number | null
                    achievements_count: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Functions: {
            get_user_connections: {
                Args: {
                    user_uuid: string
                }
                Returns: {
                    connection_id: string
                    other_user_id: string
                    other_username: string
                    other_full_name: string
                    other_avatar_url: string
                    status: string
                    mutual_connections: number
                }[]
            }
        }
        Enums: {
            user_role: 'player' | 'coach' | 'scout' | 'fan'
            experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
            achievement_type: 'milestone' | 'performance' | 'social' | 'special'
            notification_type: 'achievement_unlocked' | 'new_connection' | 'highlight_liked' | 'highlight_commented' | 'highlight_shared' | 'new_follower' | 'profile_viewed' | 'match_suggestion' | 'tournament_invite' | 'system_update' | 'welcome_message'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
} 