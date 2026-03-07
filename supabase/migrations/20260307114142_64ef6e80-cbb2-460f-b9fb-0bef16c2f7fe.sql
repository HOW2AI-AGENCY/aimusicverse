
-- Allow anonymous users to view basic profile info for users with public content
CREATE POLICY "Anon can view profiles of public content creators"
ON public.profiles FOR SELECT
TO anon
USING (
  is_public = true 
  OR EXISTS (
    SELECT 1 FROM public.tracks t 
    WHERE t.user_id = profiles.user_id 
    AND t.is_public = true 
    LIMIT 1
  )
);

-- Platform stats function (bypasses RLS for counts)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'tracks_count', (SELECT count(*) FROM tracks WHERE status = 'completed'),
    'users_count', (SELECT count(*) FROM profiles),
    'generations_count', (SELECT count(*) FROM generation_tasks),
    'total_plays', (SELECT COALESCE(sum(play_count), 0) FROM tracks WHERE status = 'completed')
  );
$$;
