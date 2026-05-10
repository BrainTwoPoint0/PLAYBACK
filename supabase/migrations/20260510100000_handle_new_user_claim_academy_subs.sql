-- Cross-repo capture of the handle_new_user update from PLAYHUB.
--
-- Companion to:
--   PLAYHUB/supabase/migrations/20260510_academy_subscriptions.sql
--
-- The PLAYHUB migration creates three new tables (playhub_academy_teams,
-- playhub_pending_academy_subscriptions, playhub_academy_subscriptions) and
-- extends handle_new_user with a third side-effect that claims pending
-- academy subscriptions on signup.
--
-- This PLAYBACK-side migration captures the SAME function body so the
-- cross-repo invariant established by 20260505103000_handle_new_user_canonical_marker
-- holds: a fresh `db reset` against either repo's local stack must produce
-- the same handle_new_user definition. Per the protocol, the version
-- function is bumped to '20260510-01' in the same migration that changes
-- the body.
--
-- The new body references playhub_pending_academy_subscriptions, which only
-- exists once the PLAYHUB migration has run. PostgreSQL doesn't validate
-- table references at PL/pgSQL CREATE FUNCTION time — they're resolved at
-- call time. Side-effect 3 is wrapped in EXCEPTION WHEN OTHERS so a
-- PLAYBACK-only dev DB (where the table doesn't exist) gracefully skips
-- with a warning, matching how side-effects 1 and 2 already behave.
--
-- IDEMPOTENT: CREATE OR REPLACE on both functions. Re-applying against the
-- live remote (after the PLAYHUB migration has run) is a no-op semantically.

-- ============================================================================
-- handle_new_user — adds side-effect 3 (academy subscription claim)
-- ============================================================================

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
    pending_sub RECORD;
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
                    -- A user_id-based grant already exists for this recording;
                    -- the invited-email row is redundant. Drop it.
                    DELETE FROM public.playhub_access_rights WHERE id = access_row.id;
                END;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: access-rights linking failed for %: % (%)',
                NEW.email, SQLERRM, SQLSTATE;
        END;

        -- Side-effect 3: claim pending academy subscriptions.
        BEGIN
            FOR pending_sub IN
                SELECT
                    id,
                    club_slug,
                    stripe_subscription_id,
                    stripe_customer_id,
                    registration_team,
                    subscriber_type,
                    player_name,
                    customer_name,
                    last_known_status
                FROM public.playhub_pending_academy_subscriptions
                WHERE invited_email = lower(NEW.email)
                  AND claimed_at IS NULL
            LOOP
                BEGIN
                    INSERT INTO public.playhub_academy_subscriptions (
                        user_id,
                        club_slug,
                        stripe_subscription_id,
                        stripe_customer_id,
                        registration_team,
                        subscriber_type,
                        player_name,
                        customer_email,
                        customer_name,
                        status
                    )
                    VALUES (
                        NEW.id,
                        pending_sub.club_slug,
                        pending_sub.stripe_subscription_id,
                        pending_sub.stripe_customer_id,
                        pending_sub.registration_team,
                        pending_sub.subscriber_type,
                        pending_sub.player_name,
                        lower(NEW.email),
                        pending_sub.customer_name,
                        pending_sub.last_known_status
                    );
                EXCEPTION
                    WHEN unique_violation THEN
                        -- Either (user_id, club_slug) or stripe_subscription_id
                        -- already has an active row. Existing active row is
                        -- canonical; just mark the pending row claimed below
                        -- so it stops being re-attempted.
                        NULL;
                    WHEN foreign_key_violation THEN
                        -- The referenced club was deleted between webhook and signup.
                        -- Surface louder than the outer block — this is recoverable
                        -- only by ops re-creating the academy_config row.
                        RAISE WARNING 'handle_new_user: academy sub for % references missing club %: % (%)',
                            NEW.email, pending_sub.club_slug, SQLERRM, SQLSTATE;
                        CONTINUE;  -- skip the mark-claimed below; ops needs to see this row
                END;

                UPDATE public.playhub_pending_academy_subscriptions
                   SET claimed_at = now(),
                       claimed_user_id = NEW.id
                 WHERE id = pending_sub.id;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: academy sub claim failed for %: % (%)',
                NEW.email, SQLERRM, SQLSTATE;
        END;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: % (%)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;

-- ============================================================================
-- Bump cross-repo canonical version marker
-- ============================================================================

CREATE OR REPLACE FUNCTION public._handle_new_user_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '20260510-01'::text
$$;

-- Re-assert ACL (CREATE OR REPLACE preserves grants, but be explicit so a
-- future DROP+CREATE doesn't silently fall through to public-execute).
REVOKE EXECUTE ON FUNCTION public._handle_new_user_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._handle_new_user_version() TO postgres, service_role;
