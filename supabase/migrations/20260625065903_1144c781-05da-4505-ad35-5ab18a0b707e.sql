
-- Storage RLS for voice cloning buckets (users access only their own folder = first path segment is user_id)
CREATE POLICY "Voice sources: owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'voice-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Voice sources: owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Voice sources: owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'voice-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Voice sources: owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'voice-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Voice verifications: owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'voice-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Voice verifications: owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Voice verifications: owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'voice-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Voice verifications: owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'voice-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Economy: voice cloning price (30 credits)
INSERT INTO public.economy_config (key, value, description)
VALUES ('voice_clone_cost', '30'::jsonb, 'Suno voice cloning credit cost')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
