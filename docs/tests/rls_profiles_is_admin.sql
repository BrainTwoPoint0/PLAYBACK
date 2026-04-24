-- pgTAP regression test for the profiles.is_admin RLS policy.
--
-- Confirms that:
--   1. The is_admin column exists.
--   2. The set of RLS policies on profiles matches what the migration
--      shipped — so a silent policy drop or rename fails the test.
--   3. The SECURITY DEFINER helper `current_profile_is_admin` exists.
--   4. An authenticated user cannot flip their own is_admin via UPDATE
--      (original production-escalation bug this migration fixes).
--   5. The same user CAN update their own non-privileged fields.
--   6. Cross-user UPDATEs are silently filtered to 0 rows by the USING
--      clause (Postgres RLS does not throw on USING-rejected UPDATEs).
--   7. The victim's is_admin is still false after the hostile attempt.
--
-- Requires pgTAP:
--   CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
--
-- Invocation — Supabase SQL editor or psql:
--   \i docs/tests/rls_profiles_is_admin.sql
--
-- Or via pg_prove against a branch:
--   pg_prove -d "$SUPABASE_DB_URL" docs/tests/rls_profiles_is_admin.sql
--
-- The test runs inside a BEGIN/ROLLBACK so fixture rows (inserted into
-- auth.users and profiles) are discarded after the run.

BEGIN;

-- Collect every TAP line. Granting access on the temp table before the
-- role switch is required because pgTAP assertions that follow
-- `SET LOCAL ROLE authenticated` would otherwise fail to INSERT here.
CREATE TEMP TABLE tap_output (line_no serial, line text);
GRANT ALL ON TABLE tap_output TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE tap_output_line_no_seq TO authenticated;

INSERT INTO tap_output (line) SELECT plan(7);

-- ── Fixtures ──────────────────────────────────────────────────────────
DO $$
DECLARE
  victim_uid uuid := '00000000-0000-0000-0000-000000000aa1';
  other_uid  uuid := '00000000-0000-0000-0000-000000000aa2';
BEGIN
  INSERT INTO auth.users (id, email, instance_id, aud, role, created_at, updated_at)
  VALUES
    (victim_uid, 'rls-test-victim@example.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    (other_uid,  'rls-test-other@example.com',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (user_id, username, full_name, is_admin)
  VALUES
    (victim_uid, 'rls-test-victim-' || substr(gen_random_uuid()::text, 1, 6), 'Victim', false),
    (other_uid,  'rls-test-other-'  || substr(gen_random_uuid()::text, 1, 6), 'Other',  false)
  ON CONFLICT (user_id) DO UPDATE
    SET is_admin = EXCLUDED.is_admin, full_name = EXCLUDED.full_name;
END $$;

-- ── Schema assertions ─────────────────────────────────────────────────
INSERT INTO tap_output (line) SELECT has_column(
  'public', 'profiles', 'is_admin',
  'profiles.is_admin column exists'
);

INSERT INTO tap_output (line) SELECT policies_are(
  'public', 'profiles',
  ARRAY[
    'Allow username availability check',
    'Public profiles are viewable',
    'Users can view own profile',
    'Users can update own profile fields',
    'Allow profile creation and updates'
  ],
  'profiles RLS policies match the expected set'
);

INSERT INTO tap_output (line) SELECT has_function(
  'public', 'current_profile_is_admin', ARRAY[]::text[],
  'SECURITY DEFINER helper current_profile_is_admin exists'
);

-- ── Switch to authenticated role + victim's JWT ───────────────────────
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',  '00000000-0000-0000-0000-000000000aa1',
    'role', 'authenticated'
  )::text,
  true
);

-- ── Self-elevation must throw RLS policy violation ────────────────────
INSERT INTO tap_output (line) SELECT throws_ok(
  $t$
    UPDATE profiles SET is_admin = true
    WHERE user_id = '00000000-0000-0000-0000-000000000aa1'::uuid;
  $t$,
  '42501',
  'new row violates row-level security policy for table "profiles"',
  'authenticated user cannot self-elevate via UPDATE'
);

-- ── Legitimate update must succeed ────────────────────────────────────
INSERT INTO tap_output (line) SELECT lives_ok(
  $t$
    UPDATE profiles SET full_name = 'Victim updated'
    WHERE user_id = '00000000-0000-0000-0000-000000000aa1'::uuid;
  $t$,
  'authenticated user can update their own non-privileged fields'
);

-- ── Cross-user UPDATE: no error, but USING filter yields 0 rows ───────
UPDATE profiles SET full_name = 'hijacked'
WHERE user_id = '00000000-0000-0000-0000-000000000aa2'::uuid;

RESET ROLE;

INSERT INTO tap_output (line) SELECT is(
  (SELECT full_name FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000aa2'::uuid),
  'Other',
  'cross-user UPDATE did not modify the target row (USING filter blocks)'
);

-- ── Final state check: victim was never promoted ──────────────────────
INSERT INTO tap_output (line) SELECT is(
  (SELECT is_admin FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000aa1'::uuid),
  false,
  'victim profile row is still is_admin = false after self-elevation attempt'
);

INSERT INTO tap_output (line) SELECT * FROM finish();

-- Emit TAP stream for human or pg_prove consumption.
SELECT line_no, line FROM tap_output ORDER BY line_no;

ROLLBACK;
