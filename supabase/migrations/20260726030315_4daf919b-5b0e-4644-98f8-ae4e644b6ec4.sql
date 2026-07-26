UPDATE public.tracks t
SET custom_voice_id = 'b3525eae-b24e-4f8e-ad4d-a5183274b5bc'
WHERE t.id = '28cb9f1a-4bda-4f5c-8147-d9950a2f2b34'
  AND t.custom_voice_id IS NULL;