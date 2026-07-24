REVOKE ALL ON FUNCTION public.ensure_track_active_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_track_active_version() FROM anon;
REVOKE ALL ON FUNCTION public.ensure_track_active_version() FROM authenticated;
REVOKE ALL ON FUNCTION public.ensure_track_active_version() FROM service_role;