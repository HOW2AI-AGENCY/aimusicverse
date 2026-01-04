-- Add UPDATE policy for reference_audio table
CREATE POLICY "Users can update their own reference audio"
ON public.reference_audio FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);