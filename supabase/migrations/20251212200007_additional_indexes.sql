-- Migration: Add additional performance indexes for social features
-- Sprint 011 - Task T008
-- Created: 2025-12-12
-- Updated: 2025-12-13 - Renamed follows to user_follows

-- Additional indexes for user_follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_status ON public.user_follows(follower_id, status);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_status ON public.user_follows(following_id, status);

-- Additional indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_user_track ON public.comments(user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_comments_likes_count ON public.comments(likes_count DESC) WHERE likes_count > 0;

-- Additional indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_type_created ON public.activities(user_id, activity_type, created_at DESC);

-- Additional indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON public.notifications(notification_type, created_at DESC);

-- Composite index for follower list query
CREATE INDEX IF NOT EXISTS idx_user_follows_composite_follower ON public.user_follows(following_id, status, created_at DESC) WHERE status = 'active';

-- Composite index for following list query
CREATE INDEX IF NOT EXISTS idx_user_follows_composite_following ON public.user_follows(follower_id, status, created_at DESC) WHERE status = 'active';

-- Add statistics collection for query optimization
ANALYZE public.user_follows;
ANALYZE public.comments;
ANALYZE public.track_likes;
ANALYZE public.comment_likes;
ANALYZE public.activities;
ANALYZE public.notifications;
