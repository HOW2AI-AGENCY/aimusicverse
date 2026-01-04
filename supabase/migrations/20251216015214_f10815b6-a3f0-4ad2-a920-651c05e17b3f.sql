-- Add DELETE policy for generation_tasks
CREATE POLICY "Users can delete own generation tasks"
ON public.generation_tasks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create a view for public profile info that hides sensitive data
CREATE OR REPLACE VIEW public.safe_public_profiles AS
SELECT 
  id,
  user_id,
  username,
  first_name,
  photo_url,
  display_name,
  is_public,
  followers_count,
  following_count,
  created_at
FROM public.profiles
WHERE is_public = true;

-- Grant access to the view
GRANT SELECT ON public.safe_public_profiles TO authenticated, anon;