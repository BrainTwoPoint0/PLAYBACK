-- Cross-repo coordination marker for `handle_new_user`.
--
-- The `handle_new_user` function body is currently captured byte-identical
-- in two places:
--   - PLAYBACK/supabase/migrations/20260505102000_capture_auth_triggers_in_playback.sql
--   - PLAYHUB/supabase/migrations/20260423_fix_handle_new_user_robustness.sql
--
-- Both repos point at the same Supabase project. If either repo edits the
-- function in a future migration, `db push` will overwrite the live function
-- with that repo's version. The risk: a stale captured copy in one repo
-- silently regresses the function for everyone.
--
-- This migration adds a canonical-version marker so:
--   1. Future edits in either repo MUST bump `_handle_new_user_version()`'s
--      return value, capturing intent in source.
--   2. CI can assert `SELECT public._handle_new_user_version() = '<expected>'`
--      against a fresh `db reset` to detect drift before deploy.
--   3. A reviewer reading either migration can grep for the version string
--      to find the matching canonical capture in the other repo.
--
-- Coordination protocol (documented here so both repos see it):
--   - When changing `handle_new_user`, edit BOTH repos' captured copies in
--     the same PR (or split PRs that land on the same day with cross-links).
--   - Bump the version string returned by `_handle_new_user_version()` in
--     the SAME migration that changes the function body.
--   - The new version string convention: 'YYYYMMDD-NN' (e.g. '20260505-01').

CREATE OR REPLACE FUNCTION public._handle_new_user_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '20260505-01'::text
$$;

COMMENT ON FUNCTION public._handle_new_user_version() IS
  'Canonical version marker for handle_new_user. Bump when either PLAYBACK or PLAYHUB changes the function body. CI asserts this matches expected.';

REVOKE EXECUTE ON FUNCTION public._handle_new_user_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._handle_new_user_version() TO postgres, service_role;
