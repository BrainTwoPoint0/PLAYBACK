-- Profile v1 — admin-write lockdown.
--
-- Combines the column-grant lockdown for `profiles.is_admin` /
-- `profiles.is_platform_admin` with the symmetry trigger that defends
-- `is_admin` if either layer regresses. Single migration replaces four
-- iterative drafts that lived in the working tree (revoke / correct
-- pattern / tighten / guard).
--
-- Layered defenses:
--
-- 1. Column-grant allowlist on UPDATE/INSERT for `authenticated`.
--    `is_admin` and `is_platform_admin` are deliberately excluded — clients
--    cannot reach them through PostgREST regardless of RLS.
--
-- 2. RLS WITH CHECK on the existing UPDATE policy still gates row-targeting
--    (auth.uid() = user_id) — independent layer.
--
-- 3. BEFORE-INSERT/UPDATE trigger `guard_is_admin_write` mirrors the
--    pre-existing `guard_platform_admin_write`. A caller may set or clear
--    `is_admin` only if they already hold it, or have no JWT context
--    (service-role / migration / DB trigger). Any other path is rejected
--    with SQLSTATE 42501.
--
-- Anon: no UPDATE/INSERT at all. Signup flows through the SECURITY DEFINER
-- `handle_new_user` auth trigger which runs as table owner and is unaffected
-- by role grants. Any non-trigger anon write path was already RLS-blocked
-- and is now also permission-blocked.
--
-- `update_profiles_updated_at` BEFORE-UPDATE trigger overrides client-set
-- `updated_at`, so including it in the UPDATE grant is harmless.
--
-- Maintenance note: when adding a column to public.profiles, decide whether
-- `authenticated` should be able to UPDATE/INSERT it via PostgREST. If yes,
-- add it to BOTH the UPDATE and INSERT GRANT clauses below (or in a follow-up
-- migration). Without that GRANT, every client write to the new column 403s
-- silently. If no (admin/system flag), explicitly leave it out and treat it
-- like is_admin / is_platform_admin.

-- ---- UPDATE: tightened allowlist ----
REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  username, email, full_name, bio, avatar_url, cover_image_url,
  date_of_birth, height_cm, weight_kg, nationality, location, phone,
  website, social_links, is_public, updated_at, last_dashboard_view_at
) ON public.profiles TO authenticated;

REVOKE UPDATE ON public.profiles FROM anon;

-- ---- INSERT: parallel lockdown ----
REVOKE INSERT ON public.profiles FROM authenticated;

GRANT INSERT (
  user_id, username, email, full_name, bio, avatar_url, cover_image_url,
  date_of_birth, height_cm, weight_kg, nationality, location, phone,
  website, social_links, is_public, last_dashboard_view_at
) ON public.profiles TO authenticated;

REVOKE INSERT ON public.profiles FROM anon;

COMMENT ON COLUMN public.profiles.is_admin IS
  'Admin flag — written only by service_role / DB owner. Layered defenses: column-grant block + RLS WITH CHECK + guard_is_admin_write trigger.';

-- ---- guard_is_admin_write trigger ----
-- Symmetry pass with guard_platform_admin_write. Closes the gap if BOTH the
-- column GRANT and the RLS policy regress in a single careless migration.

CREATE OR REPLACE FUNCTION public.guard_is_admin_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_uid uuid := auth.uid();
  caller_is_admin boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.is_admin IS NOT DISTINCT FROM OLD.is_admin THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- INSERT with is_admin=false is the default and harmless.
    IF NEW.is_admin IS NOT TRUE THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Service-role / migration / db-trigger context: auth.uid() is NULL AND
  -- the active role is one of the known service tiers. Tying the bypass to
  -- `current_user` (not just `auth.uid() IS NULL`) closes the gap where a
  -- future SECURITY DEFINER helper that drops JWT context but still runs as
  -- `authenticated` would otherwise be treated as trusted.
  -- (handle_new_user is SECURITY DEFINER and runs as postgres; auth.uid()
  -- returns the *caller's* uid which is null during the trigger's INSERT path.)
  IF caller_uid IS NULL
     AND current_user IN ('postgres', 'service_role', 'supabase_admin')
  THEN
    RETURN NEW;
  END IF;

  -- Anyone else with a null JWT context (i.e., not a known service tier) is
  -- rejected outright — touching `is_admin` requires authenticated identity.
  IF caller_uid IS NULL THEN
    RAISE EXCEPTION 'Modifying is_admin without auth context is not permitted'
      USING ERRCODE = '42501';
  END IF;

  -- Authenticated caller: must currently hold is_admin themselves.
  SELECT is_admin
    INTO caller_is_admin
    FROM public.profiles
   WHERE user_id = caller_uid;

  IF caller_is_admin IS TRUE THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Modifying is_admin requires admin privileges'
    USING ERRCODE = '42501';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_is_admin_write() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guard_is_admin_write() TO postgres, service_role;

DROP TRIGGER IF EXISTS guard_is_admin_write ON public.profiles;

CREATE TRIGGER guard_is_admin_write
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_is_admin_write();
