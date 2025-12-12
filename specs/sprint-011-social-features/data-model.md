# Data Model: Sprint 011 - Social Features & Collaboration

**Version**: 1.0  
**Last Updated**: 2026-01-20  
**Status**: Planning

## Overview

This document defines the database schema for social features including extended user profiles, following relationships, comments with threading, likes, activity feeds, and notifications.

## Entity Relationship Diagram

```
profiles (extended)
    ├─→ follows (many-to-many self-reference)
    ├─→ comments (one-to-many)
    ├─→ track_likes (one-to-many)
    ├─→ comment_likes (one-to-many)
    ├─→ activities (one-to-many as actor)
    └─→ notifications (one-to-many as recipient)

tracks (existing)
    ├─→ comments (one-to-many)
    └─→ track_likes (one-to-many)

comments
    ├─→ comments (self-reference for threading)
    └─→ comment_likes (one-to-many)
```

## Entities

### 1. profiles (Extended)

**Description**: User profile with social features and statistics.

**Extends**: Existing profiles table

**New Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| display_name | TEXT | max 50 chars | Public display name (defaults to first_name) |
| bio | TEXT | max 500 chars | User bio/description |
| avatar_url | TEXT | valid URL | Supabase Storage URL for avatar image |
| banner_url | TEXT | valid URL | Supabase Storage URL for banner image |
| is_verified | BOOLEAN | DEFAULT false | Verified artist badge |
| is_public | BOOLEAN | DEFAULT true | Profile visibility |
| privacy_level | TEXT | 'public', 'followers', 'private' | Content visibility level |
| social_links | JSONB | valid JSON | Instagram, Twitter, SoundCloud, YouTube URLs |
| stats_followers | INTEGER | DEFAULT 0, ≥0 | Cached follower count |
| stats_following | INTEGER | DEFAULT 0, ≥0 | Cached following count |
| stats_tracks | INTEGER | DEFAULT 0, ≥0 | Cached public track count |
| stats_likes | INTEGER | DEFAULT 0, ≥0 | Cached likes given count |

**Example social_links JSON**:
```json
{
  "instagram": "https://instagram.com/username",
  "twitter": "https://twitter.com/username",
  "soundcloud": "https://soundcloud.com/username",
  "youtube": "https://youtube.com/@username"
}
```

**Indexes**:
- `idx_profiles_display_name` on `display_name` (search)
- `idx_profiles_is_public` on `is_public` (filtering)
- `idx_profiles_is_verified` on `is_verified` (filtering)

**Constraints**:
- `check_display_name_length` CHECK (length(display_name) <= 50)
- `check_bio_length` CHECK (length(bio) <= 500)
- `check_privacy_level` CHECK (privacy_level IN ('public', 'followers', 'private'))
- `check_stats_positive` CHECK (stats_followers >= 0 AND stats_following >= 0 AND stats_tracks >= 0 AND stats_likes >= 0)

---

### 2. follows

**Description**: Many-to-many relationship for user following system.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique follow relationship ID |
| follower_id | UUID | NOT NULL, FK profiles(user_id) | User who is following |
| following_id | UUID | NOT NULL, FK profiles(user_id) | User being followed |
| status | TEXT | 'approved', 'pending' | For private profile follow requests |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | When follow occurred |

**Indexes**:
- `idx_follows_follower` on `follower_id` (get following list)
- `idx_follows_following` on `following_id` (get followers list)
- `idx_follows_composite` on `(follower_id, following_id)` (uniqueness check)
- `idx_follows_status` on `status` (filter pending requests)

**Constraints**:
- `unique_follow` UNIQUE (follower_id, following_id)
- `check_no_self_follow` CHECK (follower_id != following_id)
- `check_status` CHECK (status IN ('approved', 'pending'))
- `fk_follower` FOREIGN KEY (follower_id) REFERENCES profiles(user_id) ON DELETE CASCADE
- `fk_following` FOREIGN KEY (following_id) REFERENCES profiles(user_id) ON DELETE CASCADE

**Triggers**:
- `update_follower_stats` AFTER INSERT/DELETE on follows
  - Increments/decrements stats_following for follower_id
  - Increments/decrements stats_followers for following_id

**Sample Data**:
```sql
-- User A follows User B
INSERT INTO follows (follower_id, following_id, status) 
VALUES ('user-a-uuid', 'user-b-uuid', 'approved');

-- User C sends follow request to private User D
INSERT INTO follows (follower_id, following_id, status) 
VALUES ('user-c-uuid', 'user-d-uuid', 'pending');
```

---

### 3. comments

**Description**: User comments on tracks with threading support.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique comment ID |
| track_id | UUID | NOT NULL, FK tracks(id) | Track being commented on |
| user_id | UUID | NOT NULL, FK profiles(user_id) | Comment author |
| parent_comment_id | UUID | NULL, FK comments(id) | Parent comment for threading |
| content | TEXT | NOT NULL, max 1000 chars | Comment text |
| likes_count | INTEGER | DEFAULT 0, ≥0 | Cached like count |
| reply_count | INTEGER | DEFAULT 0, ≥0 | Cached reply count |
| is_edited | BOOLEAN | DEFAULT false | If comment was edited |
| is_moderated | BOOLEAN | DEFAULT false | If hidden by moderation |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last edit timestamp |

**Indexes**:
- `idx_comments_track` on `(track_id, created_at DESC)` (track comment list)
- `idx_comments_parent` on `parent_comment_id` (thread replies)
- `idx_comments_user` on `user_id` (user comment history)
- `idx_comments_moderated` on `is_moderated` (filter hidden comments)

**Constraints**:
- `check_content_length` CHECK (length(content) > 0 AND length(content) <= 1000)
- `check_counts_positive` CHECK (likes_count >= 0 AND reply_count >= 0)
- `fk_track` FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
- `fk_user` FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE SET NULL
- `fk_parent` FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE

**Triggers**:
- `update_reply_count` AFTER INSERT/DELETE on comments
  - Increments/decrements reply_count for parent_comment_id
- `update_updated_at` BEFORE UPDATE on comments
  - Sets updated_at = NOW(), is_edited = true

**Sample Data**:
```sql
-- Top-level comment
INSERT INTO comments (track_id, user_id, content) 
VALUES ('track-uuid', 'user-uuid', 'Amazing track! Love the bassline.');

-- Reply to comment
INSERT INTO comments (track_id, user_id, parent_comment_id, content) 
VALUES ('track-uuid', 'user2-uuid', 'comment-uuid', '@user Thanks! Used a Moog synth.');
```

---

### 4. comment_likes

**Description**: Tracks which users liked which comments.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique like ID |
| comment_id | UUID | NOT NULL, FK comments(id) | Comment being liked |
| user_id | UUID | NOT NULL, FK profiles(user_id) | User who liked |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | When liked |

**Indexes**:
- `idx_comment_likes_comment` on `comment_id` (get comment likers)
- `idx_comment_likes_user` on `user_id` (get user's liked comments)

**Constraints**:
- `unique_comment_like` UNIQUE (comment_id, user_id)
- `fk_comment` FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
- `fk_user` FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE

**Triggers**:
- `update_comment_likes_count` AFTER INSERT/DELETE on comment_likes
  - Increments/decrements likes_count on comments table

---

### 5. track_likes

**Description**: Tracks which users liked which tracks.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique like ID |
| track_id | UUID | NOT NULL, FK tracks(id) | Track being liked |
| user_id | UUID | NOT NULL, FK profiles(user_id) | User who liked |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | When liked |

**Indexes**:
- `idx_track_likes_track` on `track_id` (get track likers)
- `idx_track_likes_user` on `(user_id, created_at DESC)` (get user's liked tracks chronologically)
- `idx_track_likes_user_track` on `(user_id, track_id)` (check if user liked track)

**Constraints**:
- `unique_track_like` UNIQUE (track_id, user_id)
- `fk_track` FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
- `fk_user` FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE

**Triggers**:
- `update_track_likes_count` AFTER INSERT/DELETE on track_likes
  - Increments/decrements likes_count on tracks table (if column exists)
  - Increments/decrements stats_likes on profiles table for user_id

---

### 6. activities

**Description**: Activity feed events for followed users.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique activity ID |
| user_id | UUID | NOT NULL, FK profiles(user_id) | Owner of the activity feed |
| actor_id | UUID | NOT NULL, FK profiles(user_id) | User who performed action |
| activity_type | TEXT | NOT NULL | Type of activity |
| entity_type | TEXT | NOT NULL | Type of entity acted upon |
| entity_id | UUID | NOT NULL | ID of entity |
| metadata | JSONB | NULL | Additional activity data |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | When activity occurred |

**Activity Types**:
- `track_published` - User published a new track
- `track_liked` - User liked a track
- `comment_added` - User commented on a track
- `user_followed` - User followed another user
- `playlist_created` - User created a playlist
- `playlist_updated` - User updated a playlist

**Entity Types**:
- `track`, `comment`, `user`, `playlist`

**Metadata Examples**:
```json
{
  "track_title": "Sunset Dreams",
  "track_cover_url": "https://...",
  "comment_preview": "Amazing work!",
  "playlist_name": "Chill Vibes"
}
```

**Indexes**:
- `idx_activities_user_created` on `(user_id, created_at DESC)` (user's feed)
- `idx_activities_actor_created` on `(actor_id, created_at DESC)` (user's activity history)
- `idx_activities_type` on `activity_type` (filter by type)
- `idx_activities_entity` on `(entity_type, entity_id)` (find activities for entity)

**Constraints**:
- `check_activity_type` CHECK (activity_type IN ('track_published', 'track_liked', 'comment_added', 'user_followed', 'playlist_created', 'playlist_updated'))
- `check_entity_type` CHECK (entity_type IN ('track', 'comment', 'user', 'playlist'))
- `fk_user` FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
- `fk_actor` FOREIGN KEY (actor_id) REFERENCES profiles(user_id) ON DELETE CASCADE

**Note**: Activities are generated automatically via triggers when certain actions occur (track published, etc.). They are denormalized for feed performance.

---

### 7. notifications

**Description**: User notifications for social interactions.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique notification ID |
| user_id | UUID | NOT NULL, FK profiles(user_id) | Recipient user |
| actor_id | UUID | NULL, FK profiles(user_id) | User who triggered notification |
| notification_type | TEXT | NOT NULL | Type of notification |
| entity_type | TEXT | NULL | Type of related entity |
| entity_id | UUID | NULL | ID of related entity |
| content | TEXT | NULL | Notification message text |
| is_read | BOOLEAN | DEFAULT false | Read status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | When notification created |

**Notification Types**:
- `comment` - Comment on user's track
- `reply` - Reply to user's comment
- `mention` - User mentioned in comment
- `like_track` - User's track was liked
- `like_comment` - User's comment was liked
- `follow` - Someone followed user
- `follow_request` - Someone requested to follow (private profile)
- `generation_complete` - Music generation finished (existing type)

**Indexes**:
- `idx_notifications_user_read_created` on `(user_id, is_read, created_at DESC)` (user's unread notifications)
- `idx_notifications_actor` on `actor_id` (notifications from specific user)
- `idx_notifications_type` on `notification_type` (filter by type)

**Constraints**:
- `check_notification_type` CHECK (notification_type IN ('comment', 'reply', 'mention', 'like_track', 'like_comment', 'follow', 'follow_request', 'generation_complete'))
- `check_entity_type` CHECK (entity_type IS NULL OR entity_type IN ('track', 'comment', 'user', 'playlist'))
- `fk_user` FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
- `fk_actor` FOREIGN KEY (actor_id) REFERENCES profiles(user_id) ON DELETE SET NULL

**Sample Data**:
```sql
-- New comment notification
INSERT INTO notifications (user_id, actor_id, notification_type, entity_type, entity_id, content)
VALUES ('track-owner-uuid', 'commenter-uuid', 'comment', 'track', 'track-uuid', 
        '@commenter commented on "Track Title"');

-- Mention notification
INSERT INTO notifications (user_id, actor_id, notification_type, entity_type, entity_id, content)
VALUES ('mentioned-user-uuid', 'commenter-uuid', 'mention', 'comment', 'comment-uuid', 
        '@commenter mentioned you in a comment');

-- Follow notification
INSERT INTO notifications (user_id, actor_id, notification_type, entity_type, entity_id, content)
VALUES ('followed-user-uuid', 'follower-uuid', 'follow', 'user', 'follower-uuid', 
        '@follower started following you');
```

---

### 8. blocked_users (Optional - Privacy Enhancement)

**Description**: Users blocked by other users (prevents follow/comment/view).

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique block ID |
| blocker_id | UUID | NOT NULL, FK profiles(user_id) | User who blocked |
| blocked_id | UUID | NOT NULL, FK profiles(user_id) | User being blocked |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | When blocked |

**Indexes**:
- `idx_blocked_users_blocker` on `blocker_id` (get user's block list)
- `idx_blocked_users_blocked` on `blocked_id` (check if user is blocked)

**Constraints**:
- `unique_block` UNIQUE (blocker_id, blocked_id)
- `check_no_self_block` CHECK (blocker_id != blocked_id)
- `fk_blocker` FOREIGN KEY (blocker_id) REFERENCES profiles(user_id) ON DELETE CASCADE
- `fk_blocked` FOREIGN KEY (blocked_id) REFERENCES profiles(user_id) ON DELETE CASCADE

---

### 9. moderation_reports (Optional - Content Moderation)

**Description**: User reports of inappropriate content.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique report ID |
| reporter_id | UUID | NOT NULL, FK profiles(user_id) | User who reported |
| reported_user_id | UUID | NULL, FK profiles(user_id) | Reported user (if applicable) |
| entity_type | TEXT | NOT NULL | Type of reported content |
| entity_id | UUID | NOT NULL | ID of reported content |
| reason | TEXT | NOT NULL | Report reason |
| status | TEXT | DEFAULT 'pending' | Report status |
| admin_notes | TEXT | NULL | Admin review notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | When reported |
| reviewed_at | TIMESTAMPTZ | NULL | When reviewed |

**Report Reasons**:
- `spam`, `harassment`, `inappropriate_content`, `copyright`, `other`

**Report Statuses**:
- `pending`, `reviewing`, `resolved`, `dismissed`

**Indexes**:
- `idx_reports_status` on `status` (pending reports queue)
- `idx_reports_reporter` on `reporter_id` (user's report history)
- `idx_reports_entity` on `(entity_type, entity_id)` (reports for specific content)

**Constraints**:
- `check_entity_type` CHECK (entity_type IN ('comment', 'track', 'profile', 'playlist'))
- `check_reason` CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'copyright', 'other'))
- `check_status` CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed'))

---

## Database Triggers

### Follower Stats Trigger
```sql
CREATE OR REPLACE FUNCTION update_follower_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    -- Increment following count for follower
    UPDATE profiles SET stats_following = stats_following + 1 
    WHERE user_id = NEW.follower_id;
    -- Increment followers count for followed user
    UPDATE profiles SET stats_followers = stats_followers + 1 
    WHERE user_id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counts on unfollow
    UPDATE profiles SET stats_following = stats_following - 1 
    WHERE user_id = OLD.follower_id;
    UPDATE profiles SET stats_followers = stats_followers - 1 
    WHERE user_id = OLD.following_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'approved' THEN
    -- Follow request approved
    UPDATE profiles SET stats_following = stats_following + 1 
    WHERE user_id = NEW.follower_id;
    UPDATE profiles SET stats_followers = stats_followers + 1 
    WHERE user_id = NEW.following_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follower_stats
  AFTER INSERT OR DELETE OR UPDATE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_stats();
```

### Comment Reply Count Trigger
```sql
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count - 1 
    WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_reply_count();
```

### Like Count Triggers
```sql
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

CREATE OR REPLACE FUNCTION update_track_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tracks SET likes_count = likes_count + 1 WHERE id = NEW.track_id;
    UPDATE profiles SET stats_likes = stats_likes + 1 WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tracks SET likes_count = likes_count - 1 WHERE id = OLD.track_id;
    UPDATE profiles SET stats_likes = stats_likes - 1 WHERE user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_track_likes_count
  AFTER INSERT OR DELETE ON track_likes
  FOR EACH ROW EXECUTE FUNCTION update_track_likes_count();
```

## RLS Policies

### profiles
```sql
-- Public profiles viewable by all
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### follows
```sql
-- Follows viewable based on privacy
CREATE POLICY "Follows are viewable"
  ON follows FOR SELECT
  USING (
    -- Own follows always visible
    auth.uid() IN (follower_id, following_id)
    OR
    -- Public profiles' follows visible
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = follows.following_id AND is_public = true
    )
  );

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);
```

### comments
```sql
-- Comments viewable on public tracks
CREATE POLICY "Comments viewable on public tracks"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tracks 
      WHERE id = comments.track_id AND is_public = true
    )
    AND is_moderated = false
  );

-- Users can comment on public tracks
CREATE POLICY "Users can comment"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tracks WHERE id = track_id AND is_public = true
    )
  );

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);
```

### track_likes, comment_likes
```sql
-- Users can view likes on public content
CREATE POLICY "Likes are viewable"
  ON track_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tracks WHERE id = track_likes.track_id AND is_public = true
    )
  );

-- Users can like tracks
CREATE POLICY "Users can like tracks"
  ON track_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike tracks
CREATE POLICY "Users can unlike tracks"
  ON track_likes FOR DELETE
  USING (auth.uid() = user_id);
```

### activities
```sql
-- Users see activities from followed users
CREATE POLICY "Users see followed activities"
  ON activities FOR SELECT
  USING (
    -- Own activities
    auth.uid() = actor_id
    OR
    -- Activities from followed users
    auth.uid() IN (
      SELECT follower_id FROM follows 
      WHERE following_id = activities.actor_id 
      AND status = 'approved'
    )
  );
```

### notifications
```sql
-- Users see own notifications
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

## Migration Sequence

1. **Migration 1**: Extend profiles table with new columns
2. **Migration 2**: Create follows table with indexes and constraints
3. **Migration 3**: Create comments table with indexes and constraints
4. **Migration 4**: Create comment_likes and track_likes tables
5. **Migration 5**: Create activities table with indexes
6. **Migration 6**: Create notifications table with indexes
7. **Migration 7**: Create database triggers for stat updates
8. **Migration 8**: Create RLS policies for all tables
9. **Migration 9**: (Optional) Create blocked_users table
10. **Migration 10**: (Optional) Create moderation_reports table

## Data Seeding (Development/Staging)

```sql
-- Seed extended profiles
UPDATE profiles SET 
  display_name = first_name,
  bio = 'Music creator on MusicVerse AI',
  is_public = true,
  privacy_level = 'public'
WHERE display_name IS NULL;

-- Seed test follows
INSERT INTO follows (follower_id, following_id, status)
SELECT 
  (SELECT user_id FROM profiles ORDER BY RANDOM() LIMIT 1),
  (SELECT user_id FROM profiles ORDER BY RANDOM() LIMIT 1),
  'approved'
FROM generate_series(1, 100);

-- Seed test comments
INSERT INTO comments (track_id, user_id, content)
SELECT 
  (SELECT id FROM tracks WHERE is_public = true ORDER BY RANDOM() LIMIT 1),
  (SELECT user_id FROM profiles ORDER BY RANDOM() LIMIT 1),
  'Great track! Love it.'
FROM generate_series(1, 200);
```

## Performance Considerations

### Query Optimization
- All foreign keys have indexes
- Composite indexes for common query patterns (user_id + created_at)
- Partial indexes on boolean flags (is_public, is_moderated)

### Caching Strategy
- Profile stats cached in profiles table (updated via triggers)
- Like counts cached in comments/tracks tables
- Activity feed can be cached in Redis for active users

### Archival Strategy
- Archive activities older than 30 days to `activities_archive` table
- Archive notifications older than 30 days to `notifications_archive` table
- Soft delete comments (replace content with "[Deleted]") if replies exist

## Future Enhancements

### Potential New Tables
- `user_badges` - Achievement system
- `direct_messages` - DM feature
- `user_analytics` - Detailed user metrics
- `content_flags` - ML-based content moderation flags
- `user_settings` - Granular user preferences

### Schema Extensions
- Full-text search indexes (tsvector) on profiles.bio, comments.content
- Materialized views for trending tracks/users
- Partitioning for high-volume tables (activities, notifications)
