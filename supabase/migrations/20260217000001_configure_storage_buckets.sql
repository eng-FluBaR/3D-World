-- Configure storage buckets for file uploads
-- Migration: configure_storage_buckets
-- Created: 2026-02-17
-- Supports: STL, OBJ, SVG (vector images)

-- Create uploads bucket with size and MIME type limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  false,
  52428800,
  ARRAY[
    'image/svg+xml',
    'model/stl',
    'application/octet-stream',
    'application/vnd.ms-pki.stl',
    'model/obj',
    'text/plain',
    'application/x-obj',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: RLS Policies must be configured via Supabase Dashboard due to table ownership restrictions
-- Required policies for uploads bucket:
-- 1. Authenticated users can upload: INSERT, auth.role() = 'authenticated'
-- 2. Users can view files: SELECT, true
-- 3. Users can delete own files: DELETE, auth.uid()::text = (storage.foldername(name))[1]
-- 4. Admins can manage all files: ALL, role IN ('moderator', 'super_admin')
