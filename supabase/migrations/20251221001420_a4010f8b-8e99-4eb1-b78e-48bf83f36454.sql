
-- Drop existing INSERT policy for bot-assets
DROP POLICY IF EXISTS "Admins can upload bot assets" ON storage.objects;

-- Create a more permissive policy that handles the auth check properly
CREATE POLICY "Admins can upload bot assets" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bot-assets' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::public.app_role
  )
);

-- Also fix UPDATE policy just in case
DROP POLICY IF EXISTS "Admins can update bot assets" ON storage.objects;

CREATE POLICY "Admins can update bot assets" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'bot-assets' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::public.app_role
  )
);

-- Fix DELETE policy
DROP POLICY IF EXISTS "Admins can delete bot assets" ON storage.objects;

CREATE POLICY "Admins can delete bot assets" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bot-assets' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::public.app_role
  )
);
