-- =============================================
-- MISSING FUNCTIONS AND TRIGGERS
-- =============================================

-- 1. Function: Update follower/following counts in profiles
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for follower
    UPDATE public.profiles 
    SET following_count = COALESCE(following_count, 0) + 1,
        updated_at = now()
    WHERE user_id = NEW.follower_id;
    
    -- Increment followers_count for followed user
    UPDATE public.profiles 
    SET followers_count = COALESCE(followers_count, 0) + 1,
        updated_at = now()
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for follower
    UPDATE public.profiles 
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0),
        updated_at = now()
    WHERE user_id = OLD.follower_id;
    
    -- Decrement followers_count for followed user
    UPDATE public.profiles 
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0),
        updated_at = now()
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for follow counts
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW
EXECUTE FUNCTION public.update_follow_counts();

-- 2. Function: Update comment likes_count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments 
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for comment likes count
CREATE TRIGGER update_comment_likes_count_trigger
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_comment_likes_count();

-- 3. Trigger: Update updated_at on blog_posts
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Trigger: Update updated_at on comments
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();