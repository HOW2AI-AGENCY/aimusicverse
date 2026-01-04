-- Migration: Create database triggers for automatic stats updates
-- Sprint 011 - Task T007
-- Created: 2025-12-12

-- Function to update follower/following stats on follows table
CREATE OR REPLACE FUNCTION public.update_follower_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for user being followed
    UPDATE public.profiles
    SET stats_followers = stats_followers + 1
    WHERE user_id = NEW.following_id;
    
    -- Increment following count for user who is following
    UPDATE public.profiles
    SET stats_following = stats_following + 1
    WHERE user_id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for user being unfollowed
    UPDATE public.profiles
    SET stats_followers = GREATEST(stats_followers - 1, 0)
    WHERE user_id = OLD.following_id;
    
    -- Decrement following count for user who is unfollowing
    UPDATE public.profiles
    SET stats_following = GREATEST(stats_following - 1, 0)
    WHERE user_id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user_follows table
DROP TRIGGER IF EXISTS trigger_update_follower_stats ON public.user_follows;
CREATE TRIGGER trigger_update_follower_stats
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follower_stats();

-- Function to update reply count on comments
CREATE OR REPLACE FUNCTION public.update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    -- Increment reply count on parent comment
    UPDATE public.comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_comment_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    -- Decrement reply count on parent comment
    UPDATE public.comments
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.parent_comment_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on comments table for replies
DROP TRIGGER IF EXISTS trigger_update_reply_count ON public.comments;
CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reply_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count on comment
    UPDATE public.comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count on comment
    UPDATE public.comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on comment_likes table
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON public.comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_likes_count();

-- Function to update track likes count
CREATE OR REPLACE FUNCTION public.update_track_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count on track
    UPDATE public.tracks
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.track_id;
    
    -- Increment stats_likes_received for track owner
    UPDATE public.profiles p
    SET stats_likes_received = stats_likes_received + 1
    FROM public.tracks t
    WHERE t.id = NEW.track_id
    AND p.user_id = t.user_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count on track
    UPDATE public.tracks
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.track_id;
    
    -- Decrement stats_likes_received for track owner
    UPDATE public.profiles p
    SET stats_likes_received = GREATEST(stats_likes_received - 1, 0)
    FROM public.tracks t
    WHERE t.id = OLD.track_id
    AND p.user_id = t.user_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on track_likes table
DROP TRIGGER IF EXISTS trigger_update_track_likes_count ON public.track_likes;
CREATE TRIGGER trigger_update_track_likes_count
  AFTER INSERT OR DELETE ON public.track_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_track_likes_count();

-- Add comments
COMMENT ON FUNCTION public.update_follower_stats() IS 'Updates follower/following stats when follows change';
COMMENT ON FUNCTION public.update_reply_count() IS 'Updates reply count when comments are added/removed';
COMMENT ON FUNCTION public.update_comment_likes_count() IS 'Updates likes count on comments';
COMMENT ON FUNCTION public.update_track_likes_count() IS 'Updates likes count on tracks and owner stats';
