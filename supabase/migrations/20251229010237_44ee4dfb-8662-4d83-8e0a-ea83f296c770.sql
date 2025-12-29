-- Add admin view policy for generation_tasks
CREATE POLICY "Admins can view all generation tasks"
ON public.generation_tasks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin view policy for track_likes (for content stats)
CREATE POLICY "Admins can view all track likes"
ON public.track_likes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin view policy for comments (for content stats)
CREATE POLICY "Admins can view all comments"
ON public.comments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));