
DROP VIEW IF EXISTS public.generation_skip_stats;
CREATE VIEW public.generation_skip_stats
WITH (security_invoker = true) AS
SELECT
  code,
  COUNT(*)::bigint                                                 AS total,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') AS last_24h,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')   AS last_7d,
  MAX(created_at) AS last_seen_at
FROM public.generation_skip_metrics
WHERE created_at > now() - interval '30 days'
GROUP BY code
ORDER BY total DESC;

GRANT SELECT ON public.generation_skip_stats TO authenticated;
GRANT ALL   ON public.generation_skip_stats TO service_role;

REVOKE EXECUTE ON FUNCTION public.backfill_active_versions(INTEGER)         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rebuild_track_versions_from_task(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mine_generation_skip_metrics()             FROM PUBLIC;
