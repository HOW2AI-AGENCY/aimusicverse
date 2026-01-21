-- Migration: Add social notification triggers for Telegram
-- Phase 8: Social Activity
-- Created: 2026-01-21

-- Add social notification settings to user_notification_settings if not exists
ALTER TABLE public.user_notification_settings 
ADD COLUMN IF NOT EXISTS notify_likes boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_comments boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_followers boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_mentions boolean DEFAULT true;

-- Function to create notification and queue Telegram message on track like
CREATE OR REPLACE FUNCTION public.notify_on_track_like()
RETURNS TRIGGER AS $$
DECLARE
  v_track RECORD;
  v_liker RECORD;
  v_owner_profile RECORD;
  v_total_likes integer;
BEGIN
  -- Get track info
  SELECT id, title, user_id, likes_count INTO v_track
  FROM public.tracks
  WHERE id = NEW.track_id;
  
  -- Don't notify if liking own track
  IF v_track.user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker info
  SELECT user_id, username, first_name INTO v_liker
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Get track owner profile with telegram_chat_id
  SELECT user_id, telegram_chat_id INTO v_owner_profile
  FROM public.profiles
  WHERE user_id = v_track.user_id;
  
  -- Get total likes
  SELECT COALESCE(likes_count, 0) INTO v_total_likes
  FROM public.tracks
  WHERE id = NEW.track_id;
  
  -- Insert notification record (using existing schema: title, message, type, metadata)
  INSERT INTO public.notifications (
    user_id, type, title, message, metadata, action_url
  ) VALUES (
    v_track.user_id,
    'track_liked',
    '❤️ Новый лайк',
    COALESCE(v_liker.first_name, v_liker.username, 'Пользователь') || ' оценил ваш трек "' || COALESCE(v_track.title, 'Без названия') || '"',
    jsonb_build_object(
      'trackId', NEW.track_id,
      'actorId', NEW.user_id,
      'totalLikes', v_total_likes
    ),
    '/track/' || NEW.track_id
  );
  
  -- Queue Telegram notification if user has telegram_chat_id
  IF v_owner_profile.telegram_chat_id IS NOT NULL THEN
    INSERT INTO public.telegram_notification_queue (
      chat_id, notification_type, payload, priority
    ) VALUES (
      v_owner_profile.telegram_chat_id,
      'track_liked',
      jsonb_build_object(
        'trackId', NEW.track_id,
        'trackTitle', COALESCE(v_track.title, 'Трек'),
        'likerName', COALESCE(v_liker.first_name, v_liker.username, 'Кто-то'),
        'likerUsername', v_liker.username,
        'totalLikes', v_total_likes
      ),
      5
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on track_likes
DROP TRIGGER IF EXISTS trigger_notify_track_like ON public.track_likes;
CREATE TRIGGER trigger_notify_track_like
  AFTER INSERT ON public.track_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_track_like();

-- Function to create notification on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_track RECORD;
  v_commenter RECORD;
  v_owner_profile RECORD;
  v_parent_comment RECORD;
  v_notification_type text;
  v_target_user_id uuid;
  v_title text;
BEGIN
  -- Get track info
  SELECT id, title, user_id INTO v_track
  FROM public.tracks
  WHERE id = NEW.track_id;
  
  -- Get commenter info
  SELECT user_id, username, first_name INTO v_commenter
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Determine if this is a reply or new comment
  IF NEW.parent_id IS NOT NULL THEN
    -- This is a reply
    SELECT user_id INTO v_parent_comment
    FROM public.comments
    WHERE id = NEW.parent_id;
    
    v_notification_type := 'comment_reply';
    v_target_user_id := v_parent_comment.user_id;
    v_title := '💬 Ответ на комментарий';
  ELSE
    -- This is a new comment on track
    v_notification_type := 'track_commented';
    v_target_user_id := v_track.user_id;
    v_title := '💬 Новый комментарий';
  END IF;
  
  -- Don't notify if commenting on own content
  IF v_target_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get target user profile with telegram_chat_id
  SELECT user_id, telegram_chat_id INTO v_owner_profile
  FROM public.profiles
  WHERE user_id = v_target_user_id;
  
  -- Insert notification record
  INSERT INTO public.notifications (
    user_id, type, title, message, metadata, action_url
  ) VALUES (
    v_target_user_id,
    v_notification_type,
    v_title,
    COALESCE(v_commenter.first_name, v_commenter.username, 'Пользователь') || 
    CASE WHEN v_notification_type = 'comment_reply' 
      THEN ' ответил на ваш комментарий' 
      ELSE ': "' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END || '"'
    END,
    jsonb_build_object(
      'trackId', NEW.track_id,
      'commentId', NEW.id,
      'actorId', NEW.user_id
    ),
    '/track/' || NEW.track_id || '#comment-' || NEW.id
  );
  
  -- Queue Telegram notification
  IF v_owner_profile.telegram_chat_id IS NOT NULL THEN
    INSERT INTO public.telegram_notification_queue (
      chat_id, notification_type, payload, priority
    ) VALUES (
      v_owner_profile.telegram_chat_id,
      v_notification_type,
      jsonb_build_object(
        'trackId', NEW.track_id,
        'trackTitle', COALESCE(v_track.title, 'Трек'),
        'commentId', NEW.id,
        'commenterName', COALESCE(v_commenter.first_name, v_commenter.username, 'Кто-то'),
        'commenterUsername', v_commenter.username,
        'commentPreview', LEFT(NEW.content, 100),
        'isReply', NEW.parent_id IS NOT NULL
      ),
      5
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on comments
DROP TRIGGER IF EXISTS trigger_notify_comment ON public.comments;
CREATE TRIGGER trigger_notify_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

-- Function to create notification on new follower
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  v_follower RECORD;
  v_following_profile RECORD;
  v_total_followers integer;
BEGIN
  -- Don't notify on self-follow
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  
  -- Get follower info
  SELECT user_id, username, first_name, photo_url INTO v_follower
  FROM public.profiles
  WHERE user_id = NEW.follower_id;
  
  -- Get following user profile
  SELECT user_id, telegram_chat_id, stats_followers INTO v_following_profile
  FROM public.profiles
  WHERE user_id = NEW.following_id;
  
  v_total_followers := COALESCE(v_following_profile.stats_followers, 0);
  
  -- Insert notification record
  INSERT INTO public.notifications (
    user_id, type, title, message, metadata, action_url
  ) VALUES (
    NEW.following_id,
    'new_follower',
    '👥 Новый подписчик',
    COALESCE(v_follower.first_name, v_follower.username, 'Пользователь') || ' подписался на вас',
    jsonb_build_object(
      'followerId', NEW.follower_id,
      'totalFollowers', v_total_followers
    ),
    '/profile/' || NEW.follower_id
  );
  
  -- Queue Telegram notification
  IF v_following_profile.telegram_chat_id IS NOT NULL THEN
    INSERT INTO public.telegram_notification_queue (
      chat_id, notification_type, payload, priority
    ) VALUES (
      v_following_profile.telegram_chat_id,
      'new_follower',
      jsonb_build_object(
        'followerId', NEW.follower_id,
        'followerName', COALESCE(v_follower.first_name, v_follower.username, 'Пользователь'),
        'followerUsername', v_follower.username,
        'followerPhoto', v_follower.photo_url,
        'totalFollowers', v_total_followers
      ),
      5
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user_follows
DROP TRIGGER IF EXISTS trigger_notify_follow ON public.user_follows;
CREATE TRIGGER trigger_notify_follow
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow();