-- Capture the auth-side triggers + guards that protect public.profiles.
--
-- These objects already exist on the live remote (some created by historic
-- PLAYBACK migrations that were squashed out, some by PLAYHUB-side migrations
-- in a different folder). The shared Supabase project means they're applied
-- to the same DB as PLAYBACK's migrations — but because PLAYBACK's local
-- supabase/migrations folder didn't carry them, a fresh `supabase db reset`
-- against this repo wouldn't recreate them. Phase 7.1 grant lockdown depends
-- on these being present (e.g. the `is_admin` column-grant block + RLS
-- WITH CHECK rely on `current_profile_is_admin()` and the SECURITY DEFINER
-- signup trigger bypassing the new lockdown).
--
-- Idempotent: CREATE OR REPLACE for functions, DROP IF EXISTS + CREATE for
-- triggers. Re-applying against the live remote is a no-op semantically
-- (the function bodies are identical to what's already there, the trigger
-- recreate is atomic inside the migration transaction).

-- ============================================================================
-- 1) handle_new_user — auth signup → profile creation + invite/access linking
-- ============================================================================
-- Captured from live state (pg_get_functiondef on 2026-05-05). This is the
-- canonical version. Side-effects (invite promotion, access-rights linking)
-- gracefully skip if the playhub_* tables don't exist (EXCEPTION WHEN OTHERS
-- catches and warns), so this function is safe on a PLAYBACK-only dev DB
-- where those tables haven't been created yet.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    new_profile_id uuid;
    invite RECORD;
    access_row RECORD;
BEGIN
    -- Primary purpose: create the profile row.
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
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO new_profile_id;

    IF new_profile_id IS NOT NULL AND NEW.email IS NOT NULL THEN
        -- Side-effect 1: promote pending admin invites into memberships.
        BEGIN
            FOR invite IN
                SELECT id, organization_id, role
                FROM public.playhub_pending_admin_invites
                WHERE invited_email = lower(NEW.email)
            LOOP
                INSERT INTO public.organization_members (organization_id, profile_id, role, is_active)
                VALUES (
                    invite.organization_id,
                    new_profile_id,
                    invite.role::public.profile_variant_type,
                    true
                )
                ON CONFLICT (organization_id, profile_id) DO NOTHING;

                DELETE FROM public.playhub_pending_admin_invites WHERE id = invite.id;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: invite processing failed for %: % (%)',
                NEW.email, SQLERRM, SQLSTATE;
        END;

        -- Side-effect 2: link pending recording access grants.
        BEGIN
            FOR access_row IN
                SELECT id
                FROM public.playhub_access_rights
                WHERE invited_email = lower(NEW.email)
                  AND user_id IS NULL
            LOOP
                BEGIN
                    UPDATE public.playhub_access_rights
                       SET user_id = NEW.id, invited_email = NULL
                     WHERE id = access_row.id;
                EXCEPTION WHEN unique_violation THEN
                    -- A user_id-based grant already exists for this recording; the
                    -- invited-email row is redundant. Drop it.
                    DELETE FROM public.playhub_access_rights WHERE id = access_row.id;
                END;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: access-rights linking failed for %: % (%)',
                NEW.email, SQLERRM, SQLSTATE;
        END;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: % (%)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2) guard_platform_admin_write — column-write guard for is_platform_admin
-- ============================================================================
-- Captured from PLAYHUB/supabase/migrations/20260422_guard_profiles_platform_admin_writes.sql
-- so PLAYBACK's local schema reproduces it on `db reset`.

CREATE OR REPLACE FUNCTION public.guard_platform_admin_write()
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
    IF NEW.is_platform_admin IS NOT DISTINCT FROM OLD.is_platform_admin THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.is_platform_admin IS NOT TRUE THEN
      RETURN NEW;
    END IF;
  END IF;

  IF caller_uid IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_platform_admin
    INTO caller_is_admin
    FROM public.profiles
   WHERE user_id = caller_uid;

  IF caller_is_admin IS TRUE THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Modifying is_platform_admin requires platform admin privileges'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS guard_platform_admin_write ON public.profiles;

CREATE TRIGGER guard_platform_admin_write
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_platform_admin_write();
