-- Fix search_path for social notification functions
ALTER FUNCTION public.notify_on_track_like() SET search_path = public;
ALTER FUNCTION public.notify_on_comment() SET search_path = public;
ALTER FUNCTION public.notify_on_follow() SET search_path = public;