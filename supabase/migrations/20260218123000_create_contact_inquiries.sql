-- Create contact inquiries table for public contact form submissions
-- Migration: create_contact_inquiries
-- Created: 2026-02-18

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_is_read ON public.contact_inquiries(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);

DROP TRIGGER IF EXISTS update_contact_inquiries_timestamp ON public.contact_inquiries;
CREATE TRIGGER update_contact_inquiries_timestamp
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

DROP POLICY IF EXISTS "Anyone can create contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Anyone can create contact inquiries"
  ON public.contact_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(email)) > 0
    AND length(trim(message)) > 0
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can read contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can read contact inquiries"
  ON public.contact_inquiries FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update contact inquiries"
  ON public.contact_inquiries FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can delete contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can delete contact inquiries"
  ON public.contact_inquiries FOR DELETE
  TO authenticated
  USING (public.is_admin_user());
