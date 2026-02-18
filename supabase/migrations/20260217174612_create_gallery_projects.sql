-- Create gallery projects table managed by admins from completed requests
-- Migration: create_gallery_projects
-- Created: 2026-02-17

CREATE TABLE IF NOT EXISTS public.gallery_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.requests(id) ON DELETE CASCADE,
  file_name TEXT,
  file_url TEXT,
  category TEXT NOT NULL DEFAULT 'Общи',
  short_description TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gallery_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view visible gallery projects" ON public.gallery_projects;
CREATE POLICY "Public can view visible gallery projects"
  ON public.gallery_projects FOR SELECT
  TO public
  USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can manage gallery projects" ON public.gallery_projects;
CREATE POLICY "Admins can manage gallery projects"
  ON public.gallery_projects FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (
    public.is_admin_user()
    AND EXISTS (
      SELECT 1
      FROM public.requests r
      WHERE r.id = request_id
        AND r.status = 'completed'
    )
  );

CREATE INDEX IF NOT EXISTS idx_gallery_projects_request_id ON public.gallery_projects(request_id);
CREATE INDEX IF NOT EXISTS idx_gallery_projects_visible ON public.gallery_projects(is_visible);
