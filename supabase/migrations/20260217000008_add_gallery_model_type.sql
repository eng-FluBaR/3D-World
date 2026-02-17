-- Add model_type metadata for gallery previews
-- Migration: add_gallery_model_type
-- Created: 2026-02-17

ALTER TABLE public.gallery_projects
  ADD COLUMN IF NOT EXISTS model_type TEXT;
