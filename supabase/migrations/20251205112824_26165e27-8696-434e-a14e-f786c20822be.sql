-- Allow admins to view all tracks
DROP POLICY IF EXISTS "Users can view own or public tracks" ON public.tracks;

CREATE POLICY "Users can view own or public or admin all tracks"
ON public.tracks
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR has_role(auth.uid(), 'admin')
);