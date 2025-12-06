-- Create a function to reward users when they receive likes
CREATE OR REPLACE FUNCTION public.reward_like_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  track_owner_id uuid;
BEGIN
  -- Get the track owner
  SELECT user_id INTO track_owner_id
  FROM public.tracks
  WHERE id = NEW.track_id;
  
  -- Don't reward if user likes their own track
  IF track_owner_id IS NOT NULL AND track_owner_id != NEW.user_id THEN
    -- Add credits and experience directly (simpler than calling edge function from trigger)
    INSERT INTO public.user_credits (user_id, balance, total_earned, experience, level)
    VALUES (track_owner_id, 1, 1, 5, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      balance = public.user_credits.balance + 1,
      total_earned = public.user_credits.total_earned + 1,
      experience = public.user_credits.experience + 5,
      level = GREATEST(1, FLOOR(SQRT((public.user_credits.experience + 5) / 100))::integer + 1),
      updated_at = now();
    
    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, action_type, description, metadata)
    VALUES (
      track_owner_id, 
      1, 
      'earn', 
      'like_received', 
      'Получен лайк на трек',
      jsonb_build_object('track_id', NEW.track_id, 'from_user_id', NEW.user_id, 'experience_earned', 5)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for likes
DROP TRIGGER IF EXISTS on_track_like_received ON public.track_likes;
CREATE TRIGGER on_track_like_received
  AFTER INSERT ON public.track_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.reward_like_received();

-- Create function to reward users when they share tracks
CREATE OR REPLACE FUNCTION public.log_share_reward()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This is a placeholder - shares are tracked via edge function call
  -- because they happen client-side
  NULL;
END;
$$;