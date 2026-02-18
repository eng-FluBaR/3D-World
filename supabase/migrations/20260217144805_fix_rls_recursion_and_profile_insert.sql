-- Fix RLS recursion and allow authenticated users to self-create profile rows
-- Migration: fix_rls_recursion_and_profile_insert
-- Created: 2026-02-17

-- Helper functions executed as definer to avoid RLS recursion in policy subqueries
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('moderator', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
  );
$$;

-- Replace recursive profile policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Super admin can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin_user())
  WITH CHECK (public.is_super_admin_user());

-- Allow authenticated users to create their own profile if missing
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'user'
  );

-- Replace admin policies that reference profiles in-line (can trigger recursion)
DROP POLICY IF EXISTS "Admins can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can update requests" ON public.requests;
CREATE POLICY "Admins can view all requests"
  ON public.requests FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Admins can update requests"
  ON public.requests FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can manage materials" ON public.materials;
CREATE POLICY "Admins can manage materials"
  ON public.materials FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Super admin can manage cms pages" ON public.cms_pages;
CREATE POLICY "Super admin can manage cms pages"
  ON public.cms_pages FOR ALL
  TO authenticated
  USING (public.is_super_admin_user())
  WITH CHECK (public.is_super_admin_user());

DROP POLICY IF EXISTS "Allow admins full access" ON storage.objects;
CREATE POLICY "Allow admins full access"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND public.is_admin_user()
  )
  WITH CHECK (
    bucket_id = 'uploads'
    AND public.is_admin_user()
  );
