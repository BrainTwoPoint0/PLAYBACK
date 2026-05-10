-- PLAYBACK Profile v1 — Connective Tissue Layer (Phase 0: Schema + RLS)
--
-- Reframes the profile as a *receiving surface* for clips/stats/attributions
-- between PLAYBACK clubs and PLAYHUB clips, rather than a self-curated CV.
--
-- Plan: ~/.claude/plans/polymorphic-drifting-hearth.md
-- Reuses: public.is_org_member(uuid, profile_variant_type[]) (existing helper).
-- Out of scope (v1.1+): parental_consent, club_player_membership (temporal),
-- match normalization, organization_branding/domains, ML auto-attribution.
--
-- Naming: plural to match existing convention (profiles, organizations, etc.).
-- Supabase migration runner manages the outer transaction — no BEGIN/COMMIT here.

-- ============================================================================
-- 1. ENUMs
-- ============================================================================

CREATE TYPE public.profile_module_visibility AS ENUM (
    'public',
    'authenticated',
    'club_only',
    'private'
);

CREATE TYPE public.clip_type AS ENUM (
    'goal',
    'assist',
    'save',
    'tackle',
    'skill',
    'custom'
);

CREATE TYPE public.attribution_source AS ENUM (
    'jersey_map',
    'manual'
);

CREATE TYPE public.attribution_revoker AS ENUM (
    'player',
    'club',
    'admin'
);

-- ============================================================================
-- 2. profile_variants — add module_slug (per-module URL fragment)
-- ============================================================================

ALTER TABLE public.profile_variants
    ADD COLUMN module_slug varchar(40);

-- Backfill: derive slug from sport name (slugified) or variant_type. Strip
-- non-alphanumerics, collapse repeats, trim hyphens, then lowercase. Empty
-- result falls back to variant_type.
UPDATE public.profile_variants pv
SET module_slug = COALESCE(
    NULLIF(
        trim(both '-' from regexp_replace(
            lower((SELECT s.name FROM public.sports s WHERE s.id = pv.sport_id)),
            '[^a-z0-9]+', '-', 'g'
        )),
        ''
    ),
    pv.variant_type::text
);

-- Resolve any (profile_id, module_slug) collisions by appending a suffix.
WITH ranked AS (
    SELECT id, profile_id, module_slug,
        ROW_NUMBER() OVER (
            PARTITION BY profile_id, module_slug
            ORDER BY created_at NULLS LAST, id
        ) AS rn
    FROM public.profile_variants
)
UPDATE public.profile_variants pv
SET module_slug = ranked.module_slug || '-' || ranked.rn
FROM ranked
WHERE pv.id = ranked.id AND ranked.rn > 1;

ALTER TABLE public.profile_variants
    ALTER COLUMN module_slug SET NOT NULL;

ALTER TABLE public.profile_variants
    ADD CONSTRAINT profile_variants_module_slug_format_check
    CHECK (module_slug ~ '^[a-z0-9][a-z0-9-]{0,39}$');

CREATE UNIQUE INDEX idx_profile_variants_profile_slug
    ON public.profile_variants (profile_id, module_slug);

-- Hot path: dashboard + /p/[slug] both scan profile_variants by
-- (profile_id, is_active=true). Without this partial index the planner
-- falls back to a full per-profile scan + filter; for profiles with
-- multiple soft-deactivated historical variants that's wasted work.
CREATE INDEX IF NOT EXISTS idx_profile_variants_profile_active
    ON public.profile_variants (profile_id) WHERE is_active = true;

COMMENT ON COLUMN public.profile_variants.module_slug IS
    'Per-module URL fragment, e.g. /p/<username>/<module_slug>. Unique per profile.';

-- ============================================================================
-- 3. profile_module_privacies — per-module visibility
-- ============================================================================

CREATE TABLE public.profile_module_privacies (
    profile_variant_id uuid PRIMARY KEY
        REFERENCES public.profile_variants(id) ON DELETE CASCADE,
    visibility public.profile_module_visibility NOT NULL DEFAULT 'public',
    public_to_org_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.profile_module_privacies IS
    'Per-module visibility. Read by /p/[slug]/[module] route to gate access.';
COMMENT ON COLUMN public.profile_module_privacies.public_to_org_ids IS
    'When visibility=club_only, only members of these orgs can read.';

CREATE TRIGGER set_updated_at_profile_module_privacies
    BEFORE UPDATE ON public.profile_module_privacies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Partial index for the public verification-read path which joins through
-- profile_module_privacies WHERE visibility='public'. Cheap; reversible.
CREATE INDEX idx_profile_module_privacies_public
    ON public.profile_module_privacies (profile_variant_id)
    WHERE visibility = 'public';

-- ============================================================================
-- 4. profile_verifications — verification edges (NOT a boolean)
-- ============================================================================

CREATE TABLE public.profile_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_variant_id uuid
        REFERENCES public.profile_variants(id) ON DELETE CASCADE,
    verifying_org_id uuid NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    verified_by_membership_id uuid
        REFERENCES public.organization_members(id) ON DELETE SET NULL,
    season_label text,
    verified_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    revocation_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.profile_verifications IS
    'Multi-club verification edges. Multiple clubs can independently verify the '
    'same player; current-state badge query filters revoked_at IS NULL.';
COMMENT ON COLUMN public.profile_verifications.season_label IS
    'Display label, e.g. "2025-26 season". Filterable for current-state badge.';
COMMENT ON COLUMN public.profile_verifications.verified_by_membership_id IS
    'FK to the membership row that issued the verification. SET NULL on member '
    'removal — verification fact survives, individual verifier becomes anonymous.';

CREATE INDEX idx_profile_verifications_profile_active
    ON public.profile_verifications (profile_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_profile_verifications_org
    ON public.profile_verifications (verifying_org_id);

CREATE TRIGGER set_updated_at_profile_verifications
    BEFORE UPDATE ON public.profile_verifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lock immutable columns post-insert. Only revocation fields and updated_at
-- may change. Prevents UPDATE-escalation rewriting profile_id or verifying_org_id.
-- Also enforces "revoke is one-way" for verifications.
CREATE OR REPLACE FUNCTION public.profile_verifications_lock_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
    IF NEW.profile_id IS DISTINCT FROM OLD.profile_id
        OR NEW.profile_variant_id IS DISTINCT FROM OLD.profile_variant_id
        OR NEW.verifying_org_id IS DISTINCT FROM OLD.verifying_org_id
        OR NEW.verified_by_membership_id IS DISTINCT FROM OLD.verified_by_membership_id
        OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
        RAISE EXCEPTION 'profile_verifications: only revoked_at, revocation_reason, season_label, updated_at may change post-insert';
    END IF;
    IF OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS NULL THEN
        RAISE EXCEPTION 'profile_verifications.revoked_at is one-way and cannot be cleared';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_verifications_lock_immutable
    BEFORE UPDATE ON public.profile_verifications
    FOR EACH ROW EXECUTE FUNCTION public.profile_verifications_lock_immutable();

-- ============================================================================
-- 5. coach_modules — sport-coach data, 1:1 with profile_variants where coach
-- ============================================================================

CREATE TABLE public.coach_modules (
    profile_variant_id uuid PRIMARY KEY
        REFERENCES public.profile_variants(id) ON DELETE CASCADE,
    sports_coached uuid[] NOT NULL DEFAULT '{}'::uuid[],
    age_groups text[] NOT NULL DEFAULT '{}'::text[],
    qualifications jsonb NOT NULL DEFAULT '{}'::jsonb,
    coaching_philosophy text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.coach_modules IS
    'Sport-agnostic coach data. Pairs with profile_variants where variant_type=coach.';

CREATE TRIGGER set_updated_at_coach_modules
    BEFORE UPDATE ON public.coach_modules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. match_jersey_maps — coach maps shirt → player per recording
-- ============================================================================

CREATE TABLE public.match_jersey_maps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id uuid NOT NULL
        REFERENCES public.playhub_match_recordings(id) ON DELETE CASCADE,
    club_org_id uuid NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    jersey_number integer NOT NULL,
    profile_id uuid
        REFERENCES public.profiles(id) ON DELETE SET NULL,
    mapped_by_membership_id uuid
        REFERENCES public.organization_members(id) ON DELETE SET NULL,
    mapped_at timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT match_jersey_maps_jersey_number_check
        CHECK (jersey_number >= 0 AND jersey_number <= 99),
    CONSTRAINT match_jersey_maps_unique
        UNIQUE (recording_id, club_org_id, jersey_number)
);

COMMENT ON TABLE public.match_jersey_maps IS
    'Per-recording jersey assignment. profile_id NULL = "shirt N was unassigned '
    'for this match". locked_at NOT NULL = published; further edits should rewrite '
    'in v1, audit table comes in v1.1.';

CREATE INDEX idx_match_jersey_maps_profile
    ON public.match_jersey_maps (profile_id) WHERE profile_id IS NOT NULL;
-- Note: no separate (recording_id) index — UNIQUE (recording_id, club_org_id, jersey_number)
-- already provides leftmost-prefix lookup on recording_id.

CREATE TRIGGER set_updated_at_match_jersey_maps
    BEFORE UPDATE ON public.match_jersey_maps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce: club_org_id must equal the recording's organization_id. Prevents
-- a coach at Club A from writing maps for Club B's recordings.
CREATE OR REPLACE FUNCTION public.match_jersey_maps_check_recording_org()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    rec_org uuid;
BEGIN
    SELECT organization_id INTO rec_org
    FROM public.playhub_match_recordings
    WHERE id = NEW.recording_id;
    IF rec_org IS NULL THEN
        RAISE EXCEPTION 'match_jersey_maps: recording % has no organization_id; cannot map', NEW.recording_id;
    END IF;
    IF rec_org IS DISTINCT FROM NEW.club_org_id THEN
        RAISE EXCEPTION 'match_jersey_maps: club_org_id (%) must equal recording.organization_id (%)',
            NEW.club_org_id, rec_org;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_match_jersey_maps_check_recording_org
    BEFORE INSERT OR UPDATE OF recording_id, club_org_id ON public.match_jersey_maps
    FOR EACH ROW EXECUTE FUNCTION public.match_jersey_maps_check_recording_org();

-- Enforce: profile_id (when set) must be a current rostered player at club_org_id.
-- Closes the SECURITY DEFINER attribution-trigger bypass: even though the
-- trigger runs as the function owner and skips clip_attributions INSERT RLS,
-- the upstream jersey-map row that drives it cannot name a non-rostered
-- profile, so derived attributions inherit the same constraint.
CREATE OR REPLACE FUNCTION public.match_jersey_maps_check_player_roster()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
    IF NEW.profile_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = NEW.club_org_id
              AND om.profile_id = NEW.profile_id
              AND om.role = 'player'::public.profile_variant_type
              AND om.is_active = true
        ) THEN
            RAISE EXCEPTION 'match_jersey_maps: profile_id % is not a current active player at club_org_id %',
                NEW.profile_id, NEW.club_org_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_match_jersey_maps_check_player_roster
    BEFORE INSERT OR UPDATE OF profile_id, club_org_id ON public.match_jersey_maps
    FOR EACH ROW EXECUTE FUNCTION public.match_jersey_maps_check_player_roster();

-- ============================================================================
-- 7. clips — granular slice of a recording
-- ============================================================================

CREATE TABLE public.clips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id uuid NOT NULL
        REFERENCES public.playhub_match_recordings(id) ON DELETE CASCADE,
    owner_org_id uuid NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    offset_start_ms integer NOT NULL,
    offset_end_ms integer NOT NULL,
    type public.clip_type NOT NULL DEFAULT 'custom',
    title text,
    description text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- Generated column for jersey-map trigger lookup. NULLIF guards against
    -- empty-string before the int cast; non-numeric strings will fail the cast,
    -- which is correct: we don't want bad data flowing into attribution.
    jersey_number_meta integer
        GENERATED ALWAYS AS (
            CASE
                WHEN metadata->>'jersey_number' ~ '^[0-9]{1,2}$'
                    THEN (metadata->>'jersey_number')::int
                ELSE NULL
            END
        ) STORED,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT clips_offsets_check
        CHECK (offset_start_ms >= 0 AND offset_end_ms > offset_start_ms)
);

COMMENT ON TABLE public.clips IS
    'A 5-30 second slice of a match recording. Owned by the club (bytes). '
    'Player attribution lives in clip_attributions.';
COMMENT ON COLUMN public.clips.metadata IS
    'Flexible bag for CV-pipeline output. The jersey_number key is extracted '
    'into the generated jersey_number_meta column for fast lookup.';

CREATE INDEX idx_clips_recording_owner_active
    ON public.clips (recording_id, owner_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clips_jersey_lookup
    ON public.clips (recording_id, owner_org_id, jersey_number_meta)
    WHERE deleted_at IS NULL AND jersey_number_meta IS NOT NULL;

CREATE TRIGGER set_updated_at_clips
    BEFORE UPDATE ON public.clips
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 8. clip_attributions — player ↔ clip link with co-ownership semantics
-- ============================================================================

CREATE TABLE public.clip_attributions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id uuid NOT NULL
        REFERENCES public.clips(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    jersey_number_at_match integer,
    source public.attribution_source NOT NULL DEFAULT 'jersey_map',
    confidence numeric(3,2),
    attributed_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    revoked_by public.attribution_revoker,
    revocation_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT clip_attributions_unique
        UNIQUE (clip_id, profile_id),
    CONSTRAINT clip_attributions_revoke_consistency
        CHECK (
            (revoked_at IS NULL AND revoked_by IS NULL)
            OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
        ),
    CONSTRAINT clip_attributions_jersey_number_check
        CHECK (jersey_number_at_match IS NULL
            OR (jersey_number_at_match >= 0 AND jersey_number_at_match <= 99)),
    CONSTRAINT clip_attributions_confidence_check
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

COMMENT ON TABLE public.clip_attributions IS
    'Co-owned attribution edge. Club owns clip bytes; player owns the attribution '
    'link. Either party can revoke (one-way) — RLS forbids un-revoking. Trigger '
    'enforces revoke is one-way and locks immutable columns post-insert.';

CREATE INDEX idx_clip_attributions_profile_active
    ON public.clip_attributions (profile_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_clip_attributions_clip_active
    ON public.clip_attributions (clip_id) WHERE revoked_at IS NULL;
-- Hot path: /p/[slug] AttributedClips list — ORDER BY attributed_at DESC LIMIT 24
-- per profile_id. Without the ordered index the planner has to sort the
-- profile-scoped rows even when profile_id is highly selective.
CREATE INDEX idx_clip_attributions_profile_attributed_at
    ON public.clip_attributions (profile_id, attributed_at DESC)
    WHERE revoked_at IS NULL;

CREATE TRIGGER set_updated_at_clip_attributions
    BEFORE UPDATE ON public.clip_attributions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lock immutable columns. Only revocation fields and updated_at may change.
-- Also enforces "revoke is one-way": revoked_at cannot transition back to NULL.
CREATE OR REPLACE FUNCTION public.clip_attributions_lock_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
    IF NEW.clip_id IS DISTINCT FROM OLD.clip_id
        OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
        OR NEW.jersey_number_at_match IS DISTINCT FROM OLD.jersey_number_at_match
        OR NEW.source IS DISTINCT FROM OLD.source
        OR NEW.confidence IS DISTINCT FROM OLD.confidence
        OR NEW.attributed_at IS DISTINCT FROM OLD.attributed_at
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
        RAISE EXCEPTION 'clip_attributions: only revoked_at, revoked_by, revocation_note, updated_at may change post-insert';
    END IF;
    IF OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS NULL THEN
        RAISE EXCEPTION 'clip_attributions.revoked_at is one-way and cannot be cleared';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clip_attributions_lock_immutable
    BEFORE UPDATE ON public.clip_attributions
    FOR EACH ROW EXECUTE FUNCTION public.clip_attributions_lock_immutable();

-- ============================================================================
-- 9. Trigger: derive clip_attributions from match_jersey_maps on lock
-- ============================================================================

CREATE OR REPLACE FUNCTION public.derive_clip_attributions_from_jersey_map()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    -- Defense-in-depth: when invoked by an end-user UPDATE, the locking caller
    -- must be a staff member of the club. RLS already enforces this on the
    -- triggering write, but we revalidate.
    --
    -- Trusted bypass requires BOTH `auth.uid() IS NULL` AND `current_user` in
    -- a known service-tier role. The earlier shape allowed any caller with a
    -- null JWT context (could be a misrouted future SECURITY DEFINER helper
    -- that has dropped JWT context but is still running as `authenticated`)
    -- to skip the membership check. Tying the bypass to `current_user`
    -- closes that gap.
    IF current_user IN ('postgres', 'service_role', 'supabase_admin')
       AND auth.uid() IS NULL
    THEN
        -- service-role / cron / migration path
        NULL;
    ELSIF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'derive_clip_attributions_from_jersey_map: missing auth context';
    ELSIF NOT public.is_org_member(NEW.club_org_id,
           ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[])
    THEN
        RAISE EXCEPTION 'derive_clip_attributions_from_jersey_map: caller is not staff at club_org_id %', NEW.club_org_id;
    END IF;

    -- For each clip on the same recording, owned by the same club, whose
    -- generated jersey_number_meta matches this map's jersey, attribute the
    -- mapped player. ON CONFLICT preserves prior attributions (incl. revoked).
    IF NEW.profile_id IS NOT NULL THEN
        INSERT INTO public.clip_attributions
            (clip_id, profile_id, jersey_number_at_match, source, attributed_at)
        SELECT c.id, NEW.profile_id, NEW.jersey_number,
               'jersey_map'::public.attribution_source, now()
        FROM public.clips c
        WHERE c.recording_id = NEW.recording_id
          AND c.owner_org_id = NEW.club_org_id
          AND c.deleted_at IS NULL
          AND c.jersey_number_meta = NEW.jersey_number
        ON CONFLICT (clip_id, profile_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.derive_clip_attributions_from_jersey_map() FROM PUBLIC;

-- Two triggers, one function. Coaches may either insert with locked_at set
-- (single-statement publish) or insert-then-update (two-step publish). Both
-- paths must derive attributions.
CREATE TRIGGER trg_match_jersey_maps_lock_attribute_update
    AFTER UPDATE OF locked_at ON public.match_jersey_maps
    FOR EACH ROW
    WHEN (OLD.locked_at IS NULL AND NEW.locked_at IS NOT NULL)
    EXECUTE FUNCTION public.derive_clip_attributions_from_jersey_map();

CREATE TRIGGER trg_match_jersey_maps_lock_attribute_insert
    AFTER INSERT ON public.match_jersey_maps
    FOR EACH ROW
    WHEN (NEW.locked_at IS NOT NULL)
    EXECUTE FUNCTION public.derive_clip_attributions_from_jersey_map();

-- ============================================================================
-- 10. RLS — enable + per-operation policies for all new tables
-- ============================================================================
-- Convention: every new table has explicit FOR SELECT / FOR INSERT / FOR
-- UPDATE policies. DELETE is implicitly denied (no policy = denied under RLS),
-- preserving audit trail. Service role bypasses RLS — server-side admin paths
-- use it deliberately.

-- ---------- profile_module_privacies ----------
ALTER TABLE public.profile_module_privacies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read public privacy rows"
    ON public.profile_module_privacies FOR SELECT
    USING (visibility = 'public');

CREATE POLICY "Authenticated can read authenticated/club privacy rows"
    ON public.profile_module_privacies FOR SELECT
    TO authenticated
    USING (
        visibility IN ('public', 'authenticated')
        OR (visibility = 'club_only' AND EXISTS (
            SELECT 1 FROM unnest(public_to_org_ids) org_id
            WHERE public.is_org_member(org_id,
                ARRAY['admin','club_admin','league_admin','manager','coach','player']::public.profile_variant_type[])
        ))
    );

CREATE POLICY "Owner can read own privacy rows"
    ON public.profile_module_privacies FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profile_variants pv
        JOIN public.profiles p ON p.id = pv.profile_id
        WHERE pv.id = profile_module_privacies.profile_variant_id
          AND p.user_id = auth.uid()
    ));

CREATE POLICY "Owner can insert own privacy rows"
    ON public.profile_module_privacies FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profile_variants pv
        JOIN public.profiles p ON p.id = pv.profile_id
        WHERE pv.id = profile_module_privacies.profile_variant_id
          AND p.user_id = auth.uid()
    ));

CREATE POLICY "Owner can update own privacy rows"
    ON public.profile_module_privacies FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profile_variants pv
        JOIN public.profiles p ON p.id = pv.profile_id
        WHERE pv.id = profile_module_privacies.profile_variant_id
          AND p.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profile_variants pv
        JOIN public.profiles p ON p.id = pv.profile_id
        WHERE pv.id = profile_module_privacies.profile_variant_id
          AND p.user_id = auth.uid()
    ));

-- ---------- profile_verifications ----------
ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;

-- Public can read non-revoked verifications, but only for profiles whose
-- relevant variant is publicly visible. Prevents leaking "this private
-- profile is verified by Al Hilal Academy" facts.
CREATE POLICY "Public can read verifications for public modules"
    ON public.profile_verifications FOR SELECT
    USING (
        revoked_at IS NULL
        AND (
            -- Variant-scoped verification: gate on its own privacy row.
            (profile_variant_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.profile_module_privacies pmp
                WHERE pmp.profile_variant_id = profile_verifications.profile_variant_id
                  AND pmp.visibility = 'public'
            ))
            OR
            -- Profile-wide verification: any public variant on the profile is enough.
            (profile_variant_id IS NULL AND EXISTS (
                SELECT 1 FROM public.profile_variants pv
                JOIN public.profile_module_privacies pmp ON pmp.profile_variant_id = pv.id
                WHERE pv.profile_id = profile_verifications.profile_id
                  AND pmp.visibility = 'public'
            ))
        )
    );

CREATE POLICY "Verifying org admins can read all own-org verifications"
    ON public.profile_verifications FOR SELECT
    TO authenticated
    USING (public.is_org_member(verifying_org_id,
        ARRAY['admin','club_admin','league_admin','manager']::public.profile_variant_type[]));

CREATE POLICY "Verified profile owner can read own verifications"
    ON public.profile_verifications FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = profile_verifications.profile_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Org admins can insert verifications for their org"
    ON public.profile_verifications FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(verifying_org_id,
        ARRAY['admin','club_admin','league_admin','manager']::public.profile_variant_type[]));

CREATE POLICY "Org admins can update own-org verifications (revoke only enforced by trigger)"
    ON public.profile_verifications FOR UPDATE
    TO authenticated
    USING (public.is_org_member(verifying_org_id,
        ARRAY['admin','club_admin','league_admin','manager']::public.profile_variant_type[]))
    WITH CHECK (public.is_org_member(verifying_org_id,
        ARRAY['admin','club_admin','league_admin','manager']::public.profile_variant_type[]));

-- ---------- coach_modules ----------
ALTER TABLE public.coach_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read coach modules with public privacy"
    ON public.coach_modules FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profile_module_privacies pmp
        WHERE pmp.profile_variant_id = coach_modules.profile_variant_id
          AND pmp.visibility = 'public'
    ));

CREATE POLICY "Owner can read own coach module"
    ON public.coach_modules FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profile_variants pv
        JOIN public.profiles p ON p.id = pv.profile_id
        WHERE pv.id = coach_modules.profile_variant_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Owner can insert own coach module"
    ON public.coach_modules FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profile_variants pv
        JOIN public.profiles p ON p.id = pv.profile_id
        WHERE pv.id = coach_modules.profile_variant_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Owner can update own coach module"
    ON public.coach_modules FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profile_variants pv
        JOIN public.profiles p ON p.id = pv.profile_id
        WHERE pv.id = coach_modules.profile_variant_id AND p.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profile_variants pv
        JOIN public.profiles p ON p.id = pv.profile_id
        WHERE pv.id = coach_modules.profile_variant_id AND p.user_id = auth.uid()
    ));

-- ---------- match_jersey_maps ----------
ALTER TABLE public.match_jersey_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club staff can read own-club jersey maps"
    ON public.match_jersey_maps FOR SELECT
    TO authenticated
    USING (public.is_org_member(club_org_id,
        ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[]));

CREATE POLICY "Mapped player can read own jersey map rows"
    ON public.match_jersey_maps FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = match_jersey_maps.profile_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Club staff can insert own-club jersey maps"
    ON public.match_jersey_maps FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(club_org_id,
        ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[]));

CREATE POLICY "Club staff can update own-club jersey maps"
    ON public.match_jersey_maps FOR UPDATE
    TO authenticated
    USING (public.is_org_member(club_org_id,
        ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[]))
    WITH CHECK (public.is_org_member(club_org_id,
        ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[]));

-- ---------- clips ----------
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read clips of published recordings"
    ON public.clips FOR SELECT
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.playhub_match_recordings r
            WHERE r.id = clips.recording_id AND r.status = 'published'
        )
    );

CREATE POLICY "Club staff can read all own-club clips"
    ON public.clips FOR SELECT
    TO authenticated
    USING (public.is_org_member(owner_org_id,
        ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[]));

CREATE POLICY "Club staff can insert own-club clips"
    ON public.clips FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(owner_org_id,
        ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[]));

CREATE POLICY "Club staff can update own-club clips"
    ON public.clips FOR UPDATE
    TO authenticated
    USING (public.is_org_member(owner_org_id,
        ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[]))
    WITH CHECK (public.is_org_member(owner_org_id,
        ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[]));

-- ---------- clip_attributions ----------
ALTER TABLE public.clip_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read non-revoked attributions of public clips"
    ON public.clip_attributions FOR SELECT
    USING (
        revoked_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.clips c
            JOIN public.playhub_match_recordings r ON r.id = c.recording_id
            WHERE c.id = clip_attributions.clip_id
              AND c.deleted_at IS NULL
              AND r.status = 'published'
        )
    );

CREATE POLICY "Attributed player can read own attributions"
    ON public.clip_attributions FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = clip_attributions.profile_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Owning-club staff can read all own-club attributions"
    ON public.clip_attributions FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.clips c
        WHERE c.id = clip_attributions.clip_id
          AND public.is_org_member(c.owner_org_id,
              ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[])
    ));

-- INSERT path: club staff can attribute, but ONLY a profile that is currently
-- on their roster (organization_members with player role + active). This
-- prevents a coach at Club A from attributing arbitrary profiles to their clips.
-- The auto-trigger path runs SECURITY DEFINER and bypasses this — that path
-- is gated by the jersey-map UPDATE which already verified the mapper.
CREATE POLICY "Owning-club staff can insert attributions for rostered players"
    ON public.clip_attributions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clips c
            WHERE c.id = clip_attributions.clip_id
              AND public.is_org_member(c.owner_org_id,
                  ARRAY['admin','club_admin','league_admin','manager','coach']::public.profile_variant_type[])
              AND EXISTS (
                  SELECT 1 FROM public.organization_members om
                  WHERE om.organization_id = c.owner_org_id
                    AND om.profile_id = clip_attributions.profile_id
                    AND om.role = 'player'::public.profile_variant_type
                    AND om.is_active = true
              )
        )
    );

CREATE POLICY "Player can revoke own attribution"
    ON public.clip_attributions FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = clip_attributions.profile_id AND p.user_id = auth.uid()
    ))
    WITH CHECK (
        revoked_at IS NOT NULL
        AND revoked_by = 'player'::public.attribution_revoker
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = clip_attributions.profile_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Owning-club admin can revoke attribution"
    ON public.clip_attributions FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.clips c
        WHERE c.id = clip_attributions.clip_id
          AND public.is_org_member(c.owner_org_id,
              ARRAY['admin','club_admin','league_admin','manager']::public.profile_variant_type[])
    ))
    WITH CHECK (
        revoked_at IS NOT NULL
        AND revoked_by = ANY(ARRAY['club','admin']::public.attribution_revoker[])
    );
