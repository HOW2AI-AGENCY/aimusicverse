-- Create storage bucket for stems
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stems', 'stems', true, 52428800, ARRAY['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac'])
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Users can view their own stems
CREATE POLICY "Users can view their own stems"
ON storage.objects FOR SELECT
USING (bucket_id = 'stems' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy: Users can upload their own stems  
CREATE POLICY "Users can upload their own stems"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stems' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy: Users can delete their own stems
CREATE POLICY "Users can delete their own stems"
ON storage.objects FOR DELETE
USING (bucket_id = 'stems' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy: Service role can manage all stems (for edge functions)
CREATE POLICY "Service role can manage stems"
ON storage.objects FOR ALL
USING (bucket_id = 'stems' AND auth.role() = 'service_role');