
-- Ensure storage policies for bot-assets don't depend on user_roles RLS
DROP POLICY IF EXISTS "Admins can upload bot assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update bot assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete bot assets" ON storage.objects;

CREATE POLICY "Admins can upload bot assets" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bot-assets'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update bot assets" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'bot-assets'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete bot assets" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bot-assets'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
