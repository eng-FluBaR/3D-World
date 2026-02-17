-- Allow admins to delete requests
-- Migration: admin_can_delete_requests
-- Created: 2026-02-17

DROP POLICY IF EXISTS "Admins can delete requests" ON public.requests;

CREATE POLICY "Admins can delete requests"
  ON public.requests FOR DELETE
  TO authenticated
  USING (public.is_admin_user());
