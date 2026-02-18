-- Public aggregate stats for homepage KPI cards
-- Migration: create_public_site_kpis_rpc

CREATE OR REPLACE FUNCTION public.get_public_site_kpis()
RETURNS TABLE (
  completed_projects BIGINT,
  registered_users BIGINT,
  active_requests BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.requests WHERE status = 'completed')::BIGINT AS completed_projects,
    (SELECT COUNT(*) FROM public.profiles)::BIGINT AS registered_users,
    (
      SELECT COUNT(*)
      FROM public.requests
      WHERE status IN ('pending', 'quoted', 'accepted')
    )::BIGINT AS active_requests;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_site_kpis() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_site_kpis() TO authenticated;
