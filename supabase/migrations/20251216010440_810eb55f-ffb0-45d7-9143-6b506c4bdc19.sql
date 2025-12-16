-- Create storage bucket for bot menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('bot-assets', 'bot-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for bot assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'bot-assets');

-- Allow admin to upload
CREATE POLICY "Admins can upload bot assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bot-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admin to update
CREATE POLICY "Admins can update bot assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bot-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admin to delete
CREATE POLICY "Admins can delete bot assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bot-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);