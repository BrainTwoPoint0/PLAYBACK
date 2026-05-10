-- Tighten profile_variants_auto_module_slug:
-- 1. Hoist base_slug computation outside the WHILE loop (was recomputed each iter).
-- 2. Bound the collision loop at 1000 to surface pathological cases.
-- 3. Final COALESCE to a literal so candidate can never be NULL/empty even if
--    both sport_name and variant_type::text resolve to empty.

CREATE OR REPLACE FUNCTION public.profile_variants_auto_module_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
    base_slug text;
    candidate text;
    sport_name text;
    suffix int := 1;
    -- Reserved slugs that would shadow / conflict with route segments under
    -- /p/[slug]/[module_slug] OR squat on top-level app routes (so a user
    -- can't mint module_slug='academy' and produce /p/<user>/academy that
    -- reads as a club-affiliation claim). Keep this list sorted and in
    -- sync with `src/app/` top-level segments — when a new top-level route
    -- ships, add it here.
    reserved CONSTANT text[] := ARRAY[
        'academy', 'admin', 'api', 'assets', 'auth', 'card-demo',
        'dashboard', 'edit', 'health', 'index', 'legal', 'login',
        'logout', 'me', 'new', 'null', 'p', 'player', 'playscanner',
        'press', 'private', 'privacy', 'public', 'settings', 'signup',
        'static', 'studio', 'test-commons', 'tournament', 'undefined',
        '_next'
    ];
BEGIN
    IF NEW.module_slug IS NOT NULL AND NEW.module_slug <> '' THEN
        -- An explicitly-supplied slug still has to clear the reserved list.
        IF NEW.module_slug = ANY (reserved) THEN
            RAISE EXCEPTION
              'profile_variants_auto_module_slug: % is a reserved slug',
              NEW.module_slug
              USING ERRCODE = '23514'; -- check_violation
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.sport_id IS NOT NULL THEN
        SELECT s.name INTO sport_name FROM public.sports s WHERE s.id = NEW.sport_id;
    END IF;

    -- Final fallback is `variant`, not `profile` — `profile` is in the
    -- reserved list (it's a top-level app concept and a likely squat
    -- target), so using it as a fallback would always trip the collision
    -- loop on the first iteration and emit `variant-2` etc. Picking a
    -- non-reserved fallback keeps the slug stable for the common case.
    base_slug := COALESCE(
        NULLIF(
            trim(both '-' from regexp_replace(lower(sport_name), '[^a-z0-9]+', '-', 'g')),
            ''
        ),
        NULLIF(NEW.variant_type::text, ''),
        'variant'
    );

    candidate := base_slug;

    WHILE candidate = ANY (reserved)
       OR EXISTS (
        SELECT 1 FROM public.profile_variants pv
        WHERE pv.profile_id = NEW.profile_id AND pv.module_slug = candidate
    ) LOOP
        suffix := suffix + 1;
        IF suffix > 1000 THEN
            RAISE EXCEPTION 'profile_variants_auto_module_slug: collision-suffix exceeded 1000 for profile_id %', NEW.profile_id;
        END IF;
        candidate := base_slug || '-' || suffix;
    END LOOP;

    NEW.module_slug := candidate;
    RETURN NEW;
END;
$$;
