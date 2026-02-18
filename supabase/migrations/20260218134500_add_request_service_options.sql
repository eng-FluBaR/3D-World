-- Add optional service selection for each request
-- Migration: add_request_service_options
-- Created: 2026-02-18

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS service_options TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.requests
  DROP CONSTRAINT IF EXISTS requests_service_options_check;

ALTER TABLE public.requests
  ADD CONSTRAINT requests_service_options_check
  CHECK (service_options <@ ARRAY['scan', 'model', 'print']::text[]);
