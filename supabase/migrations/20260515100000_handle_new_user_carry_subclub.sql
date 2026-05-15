-- PLAYBACK mirror of PLAYHUB migration 20260515_academy_subclubs.sql.
--
-- The PLAYHUB migration extends `handle_new_user` to copy the new
-- `registration_subclub` column from pending → active academy subscriptions
-- so Veo provisioning can pick the right club within a hierarchical league
-- (e.g. LYL → Barnes Eagles → U12).
--
-- Per the cross-repo coordination protocol established in
-- 20260505103000_handle_new_user_canonical_marker.sql, both repos must hold
-- byte-identical copies of the trigger body and bump
-- _handle_new_user_version() in lockstep. This migration is the PLAYBACK
-- copy. The version marker must be '20260515-01' on both sides; a CI assert
-- verifies the markers match before deploys ship.
--
-- This file makes NO schema changes — only PLAYHUB owns the
-- playhub_academy_* tables. PLAYBACK ships the mirror solely so that, if a
-- future PLAYBACK-owned migration touches `handle_new_user` and forgets the
-- PLAYHUB-side knowledge, the symmetry guard fires.

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
                    DELETE FROM public.playhub_access_rights WHERE id = access_row.id;
                END;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: access-rights linking failed for %: % (%)',
                NEW.email, SQLERRM, SQLSTATE;
        END;

        BEGIN
            FOR pending_sub IN
                SELECT
                    id,
                    club_slug,
                    stripe_subscription_id,
                    stripe_customer_id,
                    registration_team,
                    registration_subclub,
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
                        registration_subclub,
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
                        pending_sub.registration_subclub,
                        pending_sub.subscriber_type,
                        pending_sub.player_name,
                        lower(NEW.email),
                        pending_sub.customer_name,
                        pending_sub.last_known_status
                    );
                EXCEPTION
                    WHEN unique_violation THEN
                        NULL;
                    WHEN foreign_key_violation THEN
                        RAISE WARNING 'handle_new_user: academy sub for % references missing club %: % (%)',
                            NEW.email, pending_sub.club_slug, SQLERRM, SQLSTATE;
                        CONTINUE;
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

CREATE OR REPLACE FUNCTION public._handle_new_user_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '20260515-01'::text
$$;

REVOKE EXECUTE ON FUNCTION public._handle_new_user_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._handle_new_user_version() TO postgres, service_role;
