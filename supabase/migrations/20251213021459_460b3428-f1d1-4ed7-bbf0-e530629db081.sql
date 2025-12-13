-- Migration: Add lyrics transcription and audio analysis support
-- Sprint: transcribe-lyrics edge function support

-- 1. Add lyrics language and transcription method to tracks
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS lyrics_language TEXT,
ADD COLUMN IF NOT EXISTS lyrics_transcription_method TEXT;

COMMENT ON COLUMN public.tracks.lyrics_language IS 'Detected or specified language of the lyrics';
COMMENT ON COLUMN public.tracks.lyrics_transcription_method IS 'Method used to transcribe lyrics (whisper-large-v3, audio-flamingo-3, manual)';

-- 2. Add comprehensive analysis fields to reference_audio for cover/extend workflows
ALTER TABLE public.reference_audio
ADD COLUMN IF NOT EXISTS has_vocals BOOLEAN,
ADD COLUMN IF NOT EXISTS detected_language TEXT,
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS transcription_method TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS vocal_style TEXT,
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.reference_audio.has_vocals IS 'Whether vocals were detected in the audio';
COMMENT ON COLUMN public.reference_audio.detected_language IS 'Detected language of vocals';
COMMENT ON COLUMN public.reference_audio.transcription IS 'Transcribed lyrics/text from audio';
COMMENT ON COLUMN public.reference_audio.transcription_method IS 'Method used for transcription (whisper-large-v3, audio-flamingo-3)';
COMMENT ON COLUMN public.reference_audio.genre IS 'Detected genre from audio analysis';
COMMENT ON COLUMN public.reference_audio.mood IS 'Detected mood from audio analysis';
COMMENT ON COLUMN public.reference_audio.vocal_style IS 'Description of vocal characteristics';
COMMENT ON COLUMN public.reference_audio.analysis_status IS 'Status of audio analysis (pending, analyzing, completed, failed)';
COMMENT ON COLUMN public.reference_audio.analyzed_at IS 'When the audio was analyzed';

-- 3. Add index for faster queries on analysis status
CREATE INDEX IF NOT EXISTS idx_reference_audio_analysis_status 
ON public.reference_audio(analysis_status) 
WHERE analysis_status IS NOT NULL;

-- 4. Add index for tracks lyrics language for filtering
CREATE INDEX IF NOT EXISTS idx_tracks_lyrics_language 
ON public.tracks(lyrics_language) 
WHERE lyrics_language IS NOT NULL;