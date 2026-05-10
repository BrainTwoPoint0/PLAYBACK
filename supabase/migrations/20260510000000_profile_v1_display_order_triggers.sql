-- Atomic `display_order` assignment for career_history and education.
--
-- The application-layer pattern (`SELECT count(*) ... + 1`) is racy: two
-- concurrent INSERTs both observe `count = N`, both write `N + 1`, and the
-- list ends up with two rows tied at the same display_order. The cosmetic
-- result is a non-deterministic list ordering; the structural result is that
-- a future "drag to reorder" feature can't trust the column.
--
-- Fix: BEFORE INSERT trigger that sets `display_order` to
-- `coalesce(max(display_order), 0) + 1` *inside the same statement*. The
-- subquery runs against the table after the row's lock has been acquired,
-- so concurrent inserts see consistent state. Client code can stop sending
-- the column entirely (see lib/profile/actions.ts).
--
-- The triggers only fill display_order when the client passes NULL — clients
-- that explicitly set a value (e.g. drag-to-reorder) keep that value.

CREATE OR REPLACE FUNCTION public.set_career_history_display_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
    IF NEW.display_order IS NULL THEN
        SELECT COALESCE(MAX(display_order), 0) + 1
          INTO NEW.display_order
          FROM public.career_history
         WHERE profile_variant_id = NEW.profile_variant_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_career_history_set_display_order
    ON public.career_history;
CREATE TRIGGER trg_career_history_set_display_order
    BEFORE INSERT ON public.career_history
    FOR EACH ROW EXECUTE FUNCTION public.set_career_history_display_order();

CREATE OR REPLACE FUNCTION public.set_education_display_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
    IF NEW.display_order IS NULL THEN
        SELECT COALESCE(MAX(display_order), 0) + 1
          INTO NEW.display_order
          FROM public.education
         WHERE profile_id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_education_set_display_order
    ON public.education;
CREATE TRIGGER trg_education_set_display_order
    BEFORE INSERT ON public.education
    FOR EACH ROW EXECUTE FUNCTION public.set_education_display_order();
