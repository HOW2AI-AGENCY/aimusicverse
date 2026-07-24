
ALTER TABLE public.lyrics_versions DROP CONSTRAINT lyrics_versions_user_id_fkey;
ALTER TABLE public.lyrics_versions
  ADD CONSTRAINT lyrics_versions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.lyrics_section_notes DROP CONSTRAINT lyrics_section_notes_user_id_fkey;
ALTER TABLE public.lyrics_section_notes
  ADD CONSTRAINT lyrics_section_notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_lyrics_versions_user_id ON public.lyrics_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_lyrics_section_notes_user_id ON public.lyrics_section_notes(user_id);
