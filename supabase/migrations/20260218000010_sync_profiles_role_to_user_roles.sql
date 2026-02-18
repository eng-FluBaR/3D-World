-- Keep legacy profiles.role updates compatible with JWT + user_roles authorization
-- Migration: sync_profiles_role_to_user_roles
-- Created: 2026-02-18

CREATE OR REPLACE FUNCTION public.sync_profiles_role_to_user_roles_and_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role)
    ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        updated_at = NOW();

    UPDATE auth.users u
    SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', NEW.role)
    WHERE u.id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_role_sync ON public.profiles;
CREATE TRIGGER trg_profiles_role_sync
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profiles_role_to_user_roles_and_claims();

-- Backfill once more in case some roles were changed only in profiles before this trigger existed
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role
FROM public.profiles p
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role,
    updated_at = NOW();

UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', p.role)
FROM public.profiles p
WHERE p.user_id = u.id
  AND (
    u.raw_app_meta_data IS NULL
    OR (u.raw_app_meta_data ->> 'user_role') IS DISTINCT FROM p.role
  );
