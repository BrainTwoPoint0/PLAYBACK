-- Race-fix: two concurrent POST /api/profile/[id]/verify calls would both pass
-- the dup-check SELECT and both INSERT, leaving two active verifications for
-- the same (profile, org, variant). The route's idempotency contract assumes
-- one active row.
--
-- Partial unique index: at most one non-revoked verification per
-- (profile, org, variant). NULLs in profile_variant_id are treated as
-- distinct by Postgres, so we use COALESCE-on-zero-uuid to collapse the
-- "profile-wide" rows into a single index slot.

CREATE UNIQUE INDEX idx_profile_verifications_active_unique
    ON public.profile_verifications (
        profile_id,
        verifying_org_id,
        COALESCE(profile_variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    WHERE revoked_at IS NULL;
