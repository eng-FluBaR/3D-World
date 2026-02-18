-- JWT-based roles integrated with user_roles table
-- Migration: jwt_user_roles_rls
-- Created: 2026-02-18

-- 1) Canonical roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'super_admin')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

DROP TRIGGER IF EXISTS update_user_roles_timestamp ON public.user_roles;
CREATE TRIGGER update_user_roles_timestamp
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- 2) JWT helpers + role validation against DB
CREATE OR REPLACE FUNCTION public.get_jwt_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'user_role',
    auth.jwt() ->> 'user_role'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_verified_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = public.get_jwt_user_role()
      AND ur.role = ANY(required_roles)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_jwt_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_verified_role(TEXT[]) TO anon, authenticated;

-- 3) Rewire existing admin helpers to JWT + user_roles
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_verified_role(ARRAY['moderator', 'super_admin']);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_verified_role(ARRAY['super_admin']);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin_user() TO anon, authenticated;

-- 4) Keep JWT claim + profiles.role in sync with user_roles
CREATE OR REPLACE FUNCTION public.sync_user_role_to_claims_and_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE auth.users u
    SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', 'user')
    WHERE u.id = OLD.user_id;

    UPDATE public.profiles p
    SET role = 'user'
    WHERE p.user_id = OLD.user_id;

    RETURN OLD;
  END IF;

  UPDATE auth.users u
  SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', NEW.role)
  WHERE u.id = NEW.user_id;

  UPDATE public.profiles p
  SET role = NEW.role
  WHERE p.user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_role_claims ON public.user_roles;
CREATE TRIGGER trg_sync_user_role_claims
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_claims_and_profile();

-- 5) Backfill roles from existing profiles/auth users
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role
FROM public.profiles p
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role,
    updated_at = NOW();

INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'user'
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', ur.role)
FROM public.user_roles ur
WHERE ur.user_id = u.id;

-- 6) RLS for user_roles itself
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Super admins can manage user roles" ON public.user_roles;
CREATE POLICY "Super admins can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_super_admin_user())
  WITH CHECK (public.is_super_admin_user());
