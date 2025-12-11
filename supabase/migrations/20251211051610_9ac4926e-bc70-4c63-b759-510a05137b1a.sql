-- Update handle_new_user function to set is_public to true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, telegram_id, first_name, last_name, username, language_code, photo_url, is_public)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'telegram_id')::bigint,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'language_code',
    NEW.raw_user_meta_data->>'photo_url',
    true -- All profiles are public by default
  )
  ON CONFLICT (telegram_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    username = EXCLUDED.username,
    language_code = EXCLUDED.language_code,
    photo_url = EXCLUDED.photo_url,
    is_public = true, -- Ensure existing profiles become public too
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Set all existing profiles to public
UPDATE public.profiles SET is_public = true WHERE is_public IS NULL OR is_public = false;

-- Set all existing tracks to public
UPDATE public.tracks SET is_public = true WHERE is_public IS NULL OR is_public = false;

-- Set default value for is_public on tracks table
ALTER TABLE public.tracks ALTER COLUMN is_public SET DEFAULT true;

-- Set default value for is_public on profiles table
ALTER TABLE public.profiles ALTER COLUMN is_public SET DEFAULT true;