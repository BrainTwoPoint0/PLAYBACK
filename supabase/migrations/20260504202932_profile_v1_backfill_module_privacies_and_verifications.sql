-- Phase 1 backfill for the connective-tissue layer.
--
-- 1. Mirror profiles.is_public into profile_module_privacies for every
--    existing profile_variant. Idempotent via PRIMARY KEY conflict.
-- 2. Convert any profile_variants.is_verified=true row into a profile_verifications
--    edge attributed to the player's first active org membership. The legacy
--    boolean is left in place for now as advisory; profile_verifications is
--    the source of truth from this migration forward.

INSERT INTO public.profile_module_privacies (profile_variant_id, visibility)
SELECT pv.id,
       CASE WHEN p.is_public
            THEN 'public'::public.profile_module_visibility
            ELSE 'private'::public.profile_module_visibility
       END
FROM public.profile_variants pv
JOIN public.profiles p ON p.id = pv.profile_id
ON CONFLICT (profile_variant_id) DO NOTHING;

INSERT INTO public.profile_verifications
    (profile_id, profile_variant_id, verifying_org_id, season_label, verified_at)
SELECT pv.profile_id,
       pv.id,
       (SELECT om.organization_id
          FROM public.organization_members om
         WHERE om.profile_id = pv.profile_id
           AND om.is_active = true
         ORDER BY om.created_at NULLS LAST, om.id
         LIMIT 1),
       NULL,
       COALESCE(pv.verification_date, pv.updated_at, pv.created_at, now())
FROM public.profile_variants pv
WHERE pv.is_verified = true
  AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.profile_id = pv.profile_id
        AND om.is_active = true
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.profile_verifications existing
      WHERE existing.profile_variant_id = pv.id
  );
