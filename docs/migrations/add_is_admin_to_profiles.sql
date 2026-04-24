-- Add admin flag to profiles for /admin/* route gating.
-- Run this once in the Supabase SQL editor as a single transaction.
-- Afterwards, flip a row from the Supabase SQL editor (NOT the client):
--   UPDATE profiles SET is_admin = true WHERE user_id = '<auth.users-id>';
--
-- NOTE: the WITH CHECK comparison to current is_admin uses a SECURITY DEFINER
-- helper. A direct subquery against `profiles` inside the policy triggers
-- "infinite recursion detected in policy for relation 'profiles'" and breaks
-- ALL authenticated updates to the table. The helper bypasses RLS on the
-- read so the policy can compare NEW vs OLD safely.

BEGIN;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.current_profile_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT is_admin FROM profiles WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_profile_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_is_admin() TO authenticated;

-- Replace the permissive UPDATE policy so is_admin is immutable from the
-- client. Admin grants must go through the service_role (SQL editor).
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile fields" ON profiles;

CREATE POLICY "Users can update own profile fields"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_admin IS NOT DISTINCT FROM public.current_profile_is_admin()
  );

-- Belt-and-suspenders column revoke. In practice these are no-ops while the
-- table-level GRANT UPDATE ON profiles TO authenticated is in place — the
-- RLS policy above is the real gate — but keep them so a future policy
-- regression doesn't silently unlock is_admin.
REVOKE UPDATE (is_admin) ON profiles FROM authenticated;
REVOKE UPDATE (is_admin) ON profiles FROM anon;

COMMIT;
