-- Add INSERT policy for anonymous deeplink tracking
-- This allows tracking visits before user authentication

-- Policy for anonymous users (anon role)
CREATE POLICY "Allow anonymous deeplink insert"
ON public.deeplink_analytics FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Also ensure authenticated users can still insert their own records
-- Drop existing INSERT policy if it's too restrictive and recreate
DO $$
BEGIN
  -- Try to drop old policy if exists
  DROP POLICY IF EXISTS "Users can insert own deeplink analytics" ON public.deeplink_analytics;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Policy doesn't exist, continue
END $$;

-- Create proper INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert deeplink analytics"
ON public.deeplink_analytics FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Add comment for documentation
COMMENT ON POLICY "Allow anonymous deeplink insert" ON public.deeplink_analytics IS 
  'Allows anonymous visitors to be tracked before authentication. user_id must be NULL.';