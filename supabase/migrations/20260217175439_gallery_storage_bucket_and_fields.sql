-- Add public gallery storage and metadata fields for visual model previews
-- Migration: gallery_storage_bucket_and_fields
-- Created: 2026-02-17

ALTER TABLE public.gallery_projects
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  52428800,
  ARRAY[
    'image/svg+xml',
    'model/stl',
    'application/octet-stream',
    'application/vnd.ms-pki.stl',
    'model/obj',
    'text/plain',
    'application/x-obj'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view gallery files" ON storage.objects;
CREATE POLICY "Public can view gallery files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Admins can manage gallery files" ON storage.objects;
CREATE POLICY "Admins can manage gallery files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND public.is_admin_user()
  )
  WITH CHECK (
    bucket_id = 'gallery'
    AND public.is_admin_user()
  );
