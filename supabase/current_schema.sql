

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."basketball_experience_level" AS ENUM (
    'recreational',
    'amateur_club',
    'school_youth',
    'university',
    'semi_professional',
    'professional_domestic',
    'professional_elite',
    'former_professional'
);


ALTER TYPE "public"."basketball_experience_level" OWNER TO "postgres";


CREATE TYPE "public"."football_experience_level" AS ENUM (
    'recreational',
    'school_team',
    'sunday_league',
    'club_youth',
    'academy',
    'amateur_club',
    'non_league',
    'college_university',
    'semi_professional',
    'professional',
    'former_professional'
);


ALTER TYPE "public"."football_experience_level" OWNER TO "postgres";


CREATE TYPE "public"."preference_category" AS ENUM (
    'playscanner',
    'notifications',
    'privacy',
    'display',
    'communication',
    'discovery',
    'analytics'
);


ALTER TYPE "public"."preference_category" OWNER TO "postgres";


CREATE TYPE "public"."profile_variant_type" AS ENUM (
    'player',
    'coach',
    'scout',
    'agent',
    'parent',
    'fan',
    'referee',
    'trainer',
    'physio',
    'club_admin',
    'league_admin'
);


ALTER TYPE "public"."profile_variant_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ 
BEGIN
    -- Use INSERT ... ON CONFLICT to handle race conditions
    INSERT INTO public.profiles (user_id, username, email, full_name)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'username',
            'user_' || substring(NEW.id::text, 1, 8)
        ),
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            'New User'
        )
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."basketball_player_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_variant_id" "uuid" NOT NULL,
    "experience_level" "public"."basketball_experience_level" NOT NULL,
    "preferred_hand" character varying(10),
    "primary_position" character varying(10),
    "secondary_positions" "text"[],
    "preferred_jersey_number" integer,
    "device_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "basketball_player_profiles_preferred_hand_check" CHECK ((("preferred_hand")::"text" = ANY ((ARRAY['left'::character varying, 'right'::character varying, 'both'::character varying])::"text"[]))),
    CONSTRAINT "basketball_player_profiles_preferred_jersey_number_check" CHECK ((("preferred_jersey_number" >= 0) AND ("preferred_jersey_number" <= 99)))
);


ALTER TABLE "public"."basketball_player_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_variant_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "organization_name" character varying(255),
    "role" character varying(100),
    "start_date" "date",
    "end_date" "date",
    "is_current" boolean DEFAULT false,
    "achievements" "text"[],
    "description" "text",
    "verified" boolean DEFAULT false,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."career_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid",
    "recipient_id" "uuid",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."education" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "institution_name" character varying(255) NOT NULL,
    "institution_type" character varying(50),
    "degree_or_program" character varying(255),
    "field_of_study" character varying(255),
    "start_date" "date",
    "end_date" "date",
    "is_current" boolean DEFAULT false,
    "achievements" "text"[],
    "description" "text",
    "verified" boolean DEFAULT false,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."football_player_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_variant_id" "uuid" NOT NULL,
    "experience_level" "public"."football_experience_level" NOT NULL,
    "preferred_foot" character varying(10),
    "primary_position" character varying(20),
    "secondary_positions" "text"[],
    "preferred_jersey_number" integer,
    "player_data_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "football_player_profiles_preferred_foot_check" CHECK ((("preferred_foot")::"text" = ANY ((ARRAY['left'::character varying, 'right'::character varying, 'both'::character varying])::"text"[]))),
    CONSTRAINT "football_player_profiles_preferred_jersey_number_check" CHECK ((("preferred_jersey_number" >= 0) AND ("preferred_jersey_number" <= 99)))
);


ALTER TABLE "public"."football_player_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."highlights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "profile_variant_id" "uuid",
    "sport_id" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text",
    "video_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "duration" integer,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_public" boolean DEFAULT true,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."highlights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "profile_id" "uuid",
    "profile_variant_id" "uuid",
    "role" "public"."profile_variant_type" NOT NULL,
    "jersey_number" integer,
    "contract_start" "date",
    "contract_end" "date",
    "is_active" boolean DEFAULT true,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organization_members_jersey_number_check" CHECK ((("jersey_number" >= 0) AND ("jersey_number" <= 99)))
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "type" character varying(50) NOT NULL,
    "parent_organization_id" "uuid",
    "sport_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "logo_url" "text",
    "cover_image_url" "text",
    "description" "text",
    "founded_year" integer,
    "website" character varying(255),
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "location" character varying(100),
    "country_code" character varying(3),
    "level" character varying(50),
    "member_count" integer,
    "contact_info" "jsonb" DEFAULT '{}'::"jsonb",
    "is_verified" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organizations_country_code_check" CHECK (("length"(("country_code")::"text") = ANY (ARRAY[2, 3])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playscanner_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "city" "text" NOT NULL,
    "date" "date" NOT NULL,
    "slots" "jsonb" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."playscanner_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playscanner_collection_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "collection_id" "text" NOT NULL,
    "city" "text" NOT NULL,
    "date" "date" NOT NULL,
    "status" "text" NOT NULL,
    "slots_collected" integer DEFAULT 0,
    "venues_processed" integer DEFAULT 0,
    "error_message" "text",
    "execution_time_ms" integer,
    "provider" "text" DEFAULT 'playtomic'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "playscanner_collection_log_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text", 'partial'::"text"])))
);


ALTER TABLE "public"."playscanner_collection_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playscanner_conversions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" character varying(255),
    "search_id" "uuid",
    "provider_name" character varying(100) NOT NULL,
    "venue_name" character varying(255),
    "venue_location" "text",
    "booking_url" "text",
    "estimated_price" numeric(10,2),
    "sport" character varying(50),
    "clicked_at" timestamp with time zone DEFAULT "now"(),
    "estimated_commission" numeric(10,2),
    "commission_rate" numeric(5,2)
);


ALTER TABLE "public"."playscanner_conversions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playscanner_page_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" character varying(255),
    "page_type" character varying(50) NOT NULL,
    "page_url" "text",
    "referrer" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"(),
    "time_on_page" integer
);


ALTER TABLE "public"."playscanner_page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playscanner_searches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" character varying(255),
    "search_params" "jsonb",
    "results_count" integer,
    "search_duration_ms" integer,
    "viewed_providers" "text"[],
    "searched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."playscanner_searches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playscanner_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "user_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "country_code" character varying(2),
    "city" character varying(100),
    "started_at" timestamp with time zone DEFAULT "now"(),
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "page_views" integer DEFAULT 1,
    "search_queries" integer DEFAULT 0,
    "booking_clicks" integer DEFAULT 0,
    "session_duration" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."playscanner_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_variant_sports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_variant_id" "uuid",
    "sport_id" "uuid",
    "started_date" "date",
    "is_primary" boolean DEFAULT false,
    "achievements" "jsonb" DEFAULT '[]'::"jsonb",
    "statistics" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profile_variant_sports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "variant_type" "public"."profile_variant_type" NOT NULL,
    "sport_id" "uuid",
    "display_name" character varying(100),
    "variant_bio" "text",
    "is_active" boolean DEFAULT true,
    "is_primary" boolean DEFAULT false,
    "is_searchable" boolean DEFAULT true,
    "is_verified" boolean DEFAULT false,
    "verification_date" timestamp with time zone,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profile_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "username" character varying(50) NOT NULL,
    "email" character varying(255),
    "full_name" character varying(100),
    "bio" "text",
    "avatar_url" "text",
    "cover_image_url" "text",
    "date_of_birth" "date",
    "height_cm" integer,
    "weight_kg" integer,
    "nationality" character varying(3),
    "location" character varying(100),
    "phone" character varying(20),
    "website" character varying(255),
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_height_cm_check" CHECK ((("height_cm" > 0) AND ("height_cm" < 300))),
    CONSTRAINT "profiles_nationality_check" CHECK (("length"(("nationality")::"text") = ANY (ARRAY[2, 3]))),
    CONSTRAINT "profiles_weight_kg_check" CHECK ((("weight_kg" > 0) AND ("weight_kg" < 500)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_name" character varying(100) NOT NULL,
    "date" "date" NOT NULL,
    "total_impressions" integer DEFAULT 0,
    "total_clicks" integer DEFAULT 0,
    "conversion_rate" numeric(5,2),
    "estimated_revenue" numeric(10,2),
    "avg_booking_value" numeric(10,2),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."provider_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100),
    "icon_url" "text",
    "description" "text",
    "parent_sport_id" "uuid",
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_variant_id" "uuid" NOT NULL,
    "sport_id" "uuid",
    "stat_type" character varying(50) NOT NULL,
    "stat_date" "date" NOT NULL,
    "metrics" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "match_id" character varying(100),
    "opponent" character varying(255),
    "competition" character varying(255),
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "category" "public"."preference_category" NOT NULL,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


ALTER TABLE ONLY "public"."basketball_player_profiles"
    ADD CONSTRAINT "basketball_player_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."basketball_player_profiles"
    ADD CONSTRAINT "basketball_player_profiles_profile_variant_id_key" UNIQUE ("profile_variant_id");



ALTER TABLE ONLY "public"."career_history"
    ADD CONSTRAINT "career_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_requester_id_recipient_id_key" UNIQUE ("requester_id", "recipient_id");



ALTER TABLE ONLY "public"."education"
    ADD CONSTRAINT "education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."football_player_profiles"
    ADD CONSTRAINT "football_player_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."football_player_profiles"
    ADD CONSTRAINT "football_player_profiles_profile_variant_id_key" UNIQUE ("profile_variant_id");



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."playscanner_cache"
    ADD CONSTRAINT "playscanner_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."playscanner_cache"
    ADD CONSTRAINT "playscanner_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playscanner_collection_log"
    ADD CONSTRAINT "playscanner_collection_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playscanner_conversions"
    ADD CONSTRAINT "playscanner_conversions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playscanner_page_views"
    ADD CONSTRAINT "playscanner_page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playscanner_searches"
    ADD CONSTRAINT "playscanner_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playscanner_sessions"
    ADD CONSTRAINT "playscanner_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playscanner_sessions"
    ADD CONSTRAINT "playscanner_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."profile_variant_sports"
    ADD CONSTRAINT "profile_variant_sports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_variant_sports"
    ADD CONSTRAINT "profile_variant_sports_profile_variant_id_sport_id_key" UNIQUE ("profile_variant_id", "sport_id");



ALTER TABLE ONLY "public"."profile_variants"
    ADD CONSTRAINT "profile_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_variants"
    ADD CONSTRAINT "profile_variants_profile_id_variant_type_sport_id_key" UNIQUE ("profile_id", "variant_type", "sport_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."provider_analytics"
    ADD CONSTRAINT "provider_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_analytics"
    ADD CONSTRAINT "provider_analytics_provider_name_date_key" UNIQUE ("provider_name", "date");



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statistics"
    ADD CONSTRAINT "statistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_profile_id_category_key" UNIQUE ("profile_id", "category");



CREATE INDEX "idx_basketball_profiles_experience" ON "public"."basketball_player_profiles" USING "btree" ("experience_level");



CREATE INDEX "idx_basketball_profiles_position" ON "public"."basketball_player_profiles" USING "btree" ("primary_position");



CREATE INDEX "idx_basketball_profiles_variant" ON "public"."basketball_player_profiles" USING "btree" ("profile_variant_id");



CREATE INDEX "idx_cache_key" ON "public"."playscanner_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_city_date" ON "public"."playscanner_cache" USING "btree" ("city", "date");



CREATE INDEX "idx_collection_log_date" ON "public"."playscanner_collection_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_collection_log_status" ON "public"."playscanner_collection_log" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_expires_at" ON "public"."playscanner_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_football_profiles_experience" ON "public"."football_player_profiles" USING "btree" ("experience_level");



CREATE INDEX "idx_football_profiles_position" ON "public"."football_player_profiles" USING "btree" ("primary_position");



CREATE INDEX "idx_football_profiles_variant" ON "public"."football_player_profiles" USING "btree" ("profile_variant_id");



CREATE INDEX "idx_highlights_profile" ON "public"."highlights" USING "btree" ("profile_id");



CREATE INDEX "idx_highlights_sport" ON "public"."highlights" USING "btree" ("sport_id");



CREATE INDEX "idx_organization_members_org" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_profile" ON "public"."organization_members" USING "btree" ("profile_id");



CREATE INDEX "idx_organizations_slug" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "idx_playscanner_conversions_clicked_at" ON "public"."playscanner_conversions" USING "btree" ("clicked_at");



CREATE INDEX "idx_playscanner_conversions_provider" ON "public"."playscanner_conversions" USING "btree" ("provider_name");



CREATE INDEX "idx_playscanner_conversions_session_id" ON "public"."playscanner_conversions" USING "btree" ("session_id");



CREATE INDEX "idx_playscanner_page_views_page_type" ON "public"."playscanner_page_views" USING "btree" ("page_type");



CREATE INDEX "idx_playscanner_page_views_session_id" ON "public"."playscanner_page_views" USING "btree" ("session_id");



CREATE INDEX "idx_playscanner_page_views_viewed_at" ON "public"."playscanner_page_views" USING "btree" ("viewed_at");



CREATE INDEX "idx_playscanner_searches_searched_at" ON "public"."playscanner_searches" USING "btree" ("searched_at");



CREATE INDEX "idx_playscanner_searches_session_id" ON "public"."playscanner_searches" USING "btree" ("session_id");



CREATE INDEX "idx_playscanner_sessions_session_id" ON "public"."playscanner_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_playscanner_sessions_started_at" ON "public"."playscanner_sessions" USING "btree" ("started_at");



CREATE INDEX "idx_playscanner_sessions_user_id" ON "public"."playscanner_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_profile_variant_sports_sport" ON "public"."profile_variant_sports" USING "btree" ("sport_id");



CREATE INDEX "idx_profile_variant_sports_variant" ON "public"."profile_variant_sports" USING "btree" ("profile_variant_id");



CREATE INDEX "idx_profile_variants_profile_id" ON "public"."profile_variants" USING "btree" ("profile_id");



CREATE INDEX "idx_profile_variants_searchable" ON "public"."profile_variants" USING "btree" ("is_searchable") WHERE ("is_searchable" = true);



CREATE INDEX "idx_profile_variants_type" ON "public"."profile_variants" USING "btree" ("variant_type");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_provider_analytics_date" ON "public"."provider_analytics" USING "btree" ("date");



CREATE INDEX "idx_provider_analytics_provider" ON "public"."provider_analytics" USING "btree" ("provider_name");



CREATE INDEX "idx_statistics_date" ON "public"."statistics" USING "btree" ("stat_date");



CREATE INDEX "idx_statistics_variant" ON "public"."statistics" USING "btree" ("profile_variant_id");



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profile_variants_updated_at" BEFORE UPDATE ON "public"."profile_variants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_statistics_updated_at" BEFORE UPDATE ON "public"."statistics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."basketball_player_profiles"
    ADD CONSTRAINT "basketball_player_profiles_profile_variant_id_fkey" FOREIGN KEY ("profile_variant_id") REFERENCES "public"."profile_variants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."career_history"
    ADD CONSTRAINT "career_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."career_history"
    ADD CONSTRAINT "career_history_profile_variant_id_fkey" FOREIGN KEY ("profile_variant_id") REFERENCES "public"."profile_variants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."education"
    ADD CONSTRAINT "education_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."football_player_profiles"
    ADD CONSTRAINT "football_player_profiles_profile_variant_id_fkey" FOREIGN KEY ("profile_variant_id") REFERENCES "public"."profile_variants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_profile_variant_id_fkey" FOREIGN KEY ("profile_variant_id") REFERENCES "public"."profile_variants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."highlights"
    ADD CONSTRAINT "highlights_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_profile_variant_id_fkey" FOREIGN KEY ("profile_variant_id") REFERENCES "public"."profile_variants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_parent_organization_id_fkey" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."playscanner_conversions"
    ADD CONSTRAINT "playscanner_conversions_search_id_fkey" FOREIGN KEY ("search_id") REFERENCES "public"."playscanner_searches"("id");



ALTER TABLE ONLY "public"."playscanner_conversions"
    ADD CONSTRAINT "playscanner_conversions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."playscanner_sessions"("session_id");



ALTER TABLE ONLY "public"."playscanner_page_views"
    ADD CONSTRAINT "playscanner_page_views_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."playscanner_sessions"("session_id");



ALTER TABLE ONLY "public"."playscanner_searches"
    ADD CONSTRAINT "playscanner_searches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."playscanner_sessions"("session_id");



ALTER TABLE ONLY "public"."profile_variant_sports"
    ADD CONSTRAINT "profile_variant_sports_profile_variant_id_fkey" FOREIGN KEY ("profile_variant_id") REFERENCES "public"."profile_variants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_variant_sports"
    ADD CONSTRAINT "profile_variant_sports_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."profile_variants"
    ADD CONSTRAINT "profile_variants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_variants"
    ADD CONSTRAINT "profile_variants_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_parent_sport_id_fkey" FOREIGN KEY ("parent_sport_id") REFERENCES "public"."sports"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."statistics"
    ADD CONSTRAINT "statistics_profile_variant_id_fkey" FOREIGN KEY ("profile_variant_id") REFERENCES "public"."profile_variants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."statistics"
    ADD CONSTRAINT "statistics_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Allow profile creation and updates" ON "public"."profiles" FOR INSERT WITH CHECK ((("auth"."uid"() IS NULL) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Allow public profile viewing" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Allow username availability check" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() IS NULL));



CREATE POLICY "Public basketball profiles are viewable" ON "public"."basketball_player_profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profile_variants" "pv"
     JOIN "public"."profiles" "p" ON (("p"."id" = "pv"."profile_id")))
  WHERE (("pv"."id" = "basketball_player_profiles"."profile_variant_id") AND ("pv"."is_searchable" = true) AND ("p"."is_public" = true)))));



CREATE POLICY "Public football profiles are viewable" ON "public"."football_player_profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profile_variants" "pv"
     JOIN "public"."profiles" "p" ON (("p"."id" = "pv"."profile_id")))
  WHERE (("pv"."id" = "football_player_profiles"."profile_variant_id") AND ("pv"."is_searchable" = true) AND ("p"."is_public" = true)))));



CREATE POLICY "Public highlights are viewable" ON "public"."highlights" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public profiles are viewable" ON "public"."profiles" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public variants are viewable" ON "public"."profile_variants" FOR SELECT USING ((("is_searchable" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "profile_variants"."profile_id") AND ("profiles"."is_public" = true))))));



CREATE POLICY "Sports are publicly readable" ON "public"."sports" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can manage own basketball profiles" ON "public"."basketball_player_profiles" USING ((EXISTS ( SELECT 1
   FROM ("public"."profile_variants" "pv"
     JOIN "public"."profiles" "p" ON (("p"."id" = "pv"."profile_id")))
  WHERE (("pv"."id" = "basketball_player_profiles"."profile_variant_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage own football profiles" ON "public"."football_player_profiles" USING ((EXISTS ( SELECT 1
   FROM ("public"."profile_variants" "pv"
     JOIN "public"."profiles" "p" ON (("p"."id" = "pv"."profile_id")))
  WHERE (("pv"."id" = "football_player_profiles"."profile_variant_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage own highlights" ON "public"."highlights" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "highlights"."profile_id") AND ("profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage own preferences" ON "public"."user_preferences" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "user_preferences"."profile_id") AND ("profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage own variants" ON "public"."profile_variants" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "profile_variants"."profile_id") AND ("profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."basketball_player_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."football_player_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."highlights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playscanner_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playscanner_collection_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playscanner_conversions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playscanner_page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playscanner_searches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playscanner_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."statistics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."basketball_player_profiles" TO "anon";
GRANT ALL ON TABLE "public"."basketball_player_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."basketball_player_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."career_history" TO "anon";
GRANT ALL ON TABLE "public"."career_history" TO "authenticated";
GRANT ALL ON TABLE "public"."career_history" TO "service_role";



GRANT ALL ON TABLE "public"."connections" TO "anon";
GRANT ALL ON TABLE "public"."connections" TO "authenticated";
GRANT ALL ON TABLE "public"."connections" TO "service_role";



GRANT ALL ON TABLE "public"."education" TO "anon";
GRANT ALL ON TABLE "public"."education" TO "authenticated";
GRANT ALL ON TABLE "public"."education" TO "service_role";



GRANT ALL ON TABLE "public"."football_player_profiles" TO "anon";
GRANT ALL ON TABLE "public"."football_player_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."football_player_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."highlights" TO "anon";
GRANT ALL ON TABLE "public"."highlights" TO "authenticated";
GRANT ALL ON TABLE "public"."highlights" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."playscanner_cache" TO "anon";
GRANT ALL ON TABLE "public"."playscanner_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."playscanner_cache" TO "service_role";



GRANT ALL ON TABLE "public"."playscanner_collection_log" TO "anon";
GRANT ALL ON TABLE "public"."playscanner_collection_log" TO "authenticated";
GRANT ALL ON TABLE "public"."playscanner_collection_log" TO "service_role";



GRANT ALL ON TABLE "public"."playscanner_conversions" TO "anon";
GRANT ALL ON TABLE "public"."playscanner_conversions" TO "authenticated";
GRANT ALL ON TABLE "public"."playscanner_conversions" TO "service_role";



GRANT ALL ON TABLE "public"."playscanner_page_views" TO "anon";
GRANT ALL ON TABLE "public"."playscanner_page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."playscanner_page_views" TO "service_role";



GRANT ALL ON TABLE "public"."playscanner_searches" TO "anon";
GRANT ALL ON TABLE "public"."playscanner_searches" TO "authenticated";
GRANT ALL ON TABLE "public"."playscanner_searches" TO "service_role";



GRANT ALL ON TABLE "public"."playscanner_sessions" TO "anon";
GRANT ALL ON TABLE "public"."playscanner_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."playscanner_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."profile_variant_sports" TO "anon";
GRANT ALL ON TABLE "public"."profile_variant_sports" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_variant_sports" TO "service_role";



GRANT ALL ON TABLE "public"."profile_variants" TO "anon";
GRANT ALL ON TABLE "public"."profile_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_variants" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."provider_analytics" TO "anon";
GRANT ALL ON TABLE "public"."provider_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."sports" TO "anon";
GRANT ALL ON TABLE "public"."sports" TO "authenticated";
GRANT ALL ON TABLE "public"."sports" TO "service_role";



GRANT ALL ON TABLE "public"."statistics" TO "anon";
GRANT ALL ON TABLE "public"."statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."statistics" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
