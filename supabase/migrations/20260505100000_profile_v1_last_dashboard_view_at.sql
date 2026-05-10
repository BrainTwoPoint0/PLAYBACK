-- Phase 7.1 — last_dashboard_view_at on profiles
-- Drives NEW pulse pills on attributed clips + verifications. Null = never
-- opened the dashboard, treated upstream as "all current rows are new" so
-- the first-ever load surfaces everything that arrived while away.
--
-- RLS: owner-update on profiles already exists; no new policy needed. The
-- column is harmless to read (just a timestamp). Writes happen client-side
-- after dashboard mount via the existing owner-update path.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_dashboard_view_at timestamp with time zone;

COMMENT ON COLUMN public.profiles.last_dashboard_view_at IS
  'Last time the user opened their dashboard. Drives NEW pills on clips/verifications. Null = never opened.';
