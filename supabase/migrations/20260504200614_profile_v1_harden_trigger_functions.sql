-- Hardening for the Profile v1 connective-tissue migration:
--   1. Lock search_path on match_jersey_maps_check_recording_org (linter 0011)
--   2. Revoke EXECUTE from anon + authenticated on the SECURITY DEFINER trigger
--      function so it cannot be called as an RPC via PostgREST (linter 0028).
--      It is a trigger function; no role should be able to invoke it directly.

CREATE OR REPLACE FUNCTION public.match_jersey_maps_check_recording_org()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
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

REVOKE EXECUTE ON FUNCTION public.derive_clip_attributions_from_jersey_map() FROM anon, authenticated;
