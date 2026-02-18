-- Allow authenticated users to update/delete their own non-completed requests
-- Migration: user_manage_open_requests
-- Created: 2026-02-18

DROP POLICY IF EXISTS "Users can update own non-completed requests" ON public.requests;
CREATE POLICY "Users can update own non-completed requests"
  ON public.requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status <> 'completed'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status <> 'completed'
  );

DROP POLICY IF EXISTS "Users can delete own non-completed requests" ON public.requests;
CREATE POLICY "Users can delete own non-completed requests"
  ON public.requests FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status <> 'completed'
  );
