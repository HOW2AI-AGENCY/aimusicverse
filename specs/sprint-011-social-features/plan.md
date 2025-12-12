# Implementation Plan: Sprint 011 - Social Features & Collaboration

**Sprint Period**: January 26 - February 9, 2026 (2 weeks)  
**Status**: Planning  
**Priority**: High (Sprint 18 of 25 in roadmap)

## Overview

This sprint implements comprehensive social features including user profiles, artist pages, following system, track comments with threading, likes, activity feeds, mentions, and notifications. This transforms MusicVerse AI from an individual creation tool into a collaborative music platform.

## Current State

### Existing Infrastructure
- **Profiles Table**: Basic user profiles with Telegram data (telegram_id, first_name, last_name, username, photo_url)
- **Tracks Table**: With `is_public` field and `active_version_id` for versioning
- **Playlists System**: User playlists with `playlist_tracks` junction table
- **Real-time**: Supabase real-time channels available
- **Telegram Bot**: Deep linking, notifications, sharing capabilities

### Gaps for Social Features
- No extended profile fields (bio, banner, verification, social links)
- No following/follower relationships
- No commenting system
- No likes tracking
- No activity feed
- No @ mentions or social notifications

## Tech Stack

### Frontend
- **React 19** with TypeScript 5
- **TanStack Query v5** for data fetching with optimized caching
- **Zustand** for state management
- **Framer Motion** for animations
- **react-virtuoso** for virtualized lists
- **shadcn/ui** components with Tailwind CSS
- **Telegram Mini App SDK** (@twa-dev/sdk)

### Backend (Lovable Cloud/Supabase)
- **PostgreSQL** database with Row Level Security (RLS)
- **Edge Functions** (Deno) for serverless API endpoints
- **Supabase Realtime** for live updates
- **Supabase Storage** for user avatars and banners
- **Full-text Search** (PostgreSQL tsvector)

### Key Libraries
- `@tanstack/react-query` - Data fetching
- `@twa-dev/sdk` - Telegram integration
- `zustand` - State management
- `framer-motion` - Animations
- `react-virtuoso` - List virtualization
- `date-fns` - Date formatting
- `react-hook-form` - Form handling
- `zod` - Schema validation

## Project Structure

```
src/
├── components/
│   ├── profile/              # Profile components
│   │   ├── ProfileHeader.tsx
│   │   ├── ProfileStats.tsx
│   │   ├── ProfileBio.tsx
│   │   ├── ProfileEditDialog.tsx
│   │   ├── VerificationBadge.tsx
│   │   └── SocialLinks.tsx
│   ├── social/               # Social features
│   │   ├── FollowButton.tsx
│   │   ├── FollowersList.tsx
│   │   ├── FollowingList.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── ActivityItem.tsx
│   ├── comments/             # Comment system
│   │   ├── CommentsList.tsx
│   │   ├── CommentItem.tsx
│   │   ├── CommentForm.tsx
│   │   ├── CommentThread.tsx
│   │   └── MentionInput.tsx
│   ├── engagement/           # Likes & interactions
│   │   ├── LikeButton.tsx
│   │   ├── ShareButton.tsx
│   │   └── StatsDisplay.tsx
│   └── notifications/        # Notification system
│       ├── NotificationBell.tsx
│       ├── NotificationList.tsx
│       └── NotificationItem.tsx
│
├── hooks/
│   ├── profile/
│   │   ├── useProfile.ts
│   │   ├── useUpdateProfile.ts
│   │   └── useProfileStats.ts
│   ├── social/
│   │   ├── useFollow.ts
│   │   ├── useFollowers.ts
│   │   ├── useFollowing.ts
│   │   └── useActivityFeed.ts
│   ├── comments/
│   │   ├── useComments.ts
│   │   ├── useAddComment.ts
│   │   ├── useDeleteComment.ts
│   │   └── useMentions.ts
│   ├── engagement/
│   │   ├── useLikeTrack.ts
│   │   ├── useLikeComment.ts
│   │   └── useTrackStats.ts
│   └── notifications/
│       ├── useNotifications.ts
│       ├── useMarkAsRead.ts
│       └── useNotificationSettings.ts
│
├── pages/
│   ├── ProfilePage.tsx       # User profile view
│   ├── EditProfilePage.tsx   # Profile editing
│   └── ActivityPage.tsx      # Activity feed
│
├── types/
│   ├── profile.ts
│   ├── social.ts
│   ├── comment.ts
│   ├── activity.ts
│   └── notification.ts
│
└── lib/
    ├── content-moderation.ts # Comment moderation
    └── mention-parser.ts     # @ mention parsing

supabase/
├── migrations/
│   ├── 2026_01_26_extend_profiles.sql
│   ├── 2026_01_26_create_follows.sql
│   ├── 2026_01_27_create_comments.sql
│   ├── 2026_01_28_create_activities.sql
│   ├── 2026_01_28_create_notifications.sql
│   └── 2026_01_29_create_indexes.sql
│
└── functions/
    ├── moderate-content/         # Content moderation
    ├── send-notification/        # Notification delivery
    └── update-activity-feed/     # Activity aggregation
```

## Database Schema Design

### Extended Profiles Table
```sql
ALTER TABLE profiles ADD COLUMN:
- display_name TEXT
- bio TEXT (max 500 chars)
- avatar_url TEXT (Supabase Storage)
- banner_url TEXT (Supabase Storage)
- is_verified BOOLEAN DEFAULT false
- is_public BOOLEAN DEFAULT true
- social_links JSONB (Instagram, Twitter, etc.)
- privacy_level TEXT ('public', 'followers', 'private')
- stats_followers INTEGER DEFAULT 0
- stats_following INTEGER DEFAULT 0
- stats_tracks INTEGER DEFAULT 0
- stats_likes INTEGER DEFAULT 0
```

### New Tables

#### follows (Many-to-Many)
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(user_id),
  following_id UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
```

#### comments (with threading)
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id),
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 1000),
  likes_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### comment_likes
```sql
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);
```

#### track_likes
```sql
CREATE TABLE track_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, user_id)
);
```

#### activities (Feed aggregation)
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  actor_id UUID REFERENCES profiles(user_id),
  activity_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Types: 'track_published', 'track_liked', 'comment_added', 
--        'user_followed', 'playlist_created'
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  actor_id UUID REFERENCES profiles(user_id),
  notification_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Types: 'comment', 'reply', 'mention', 'like', 'follow', 'generation_complete'
```

## Data Flow Architecture

### Profile Flow
```
User → ProfilePage → useProfile hook → Supabase RLS query → Profile data
         ↓
    Profile stats (followers, tracks, likes) computed via joins
         ↓
    Track portfolio fetched with useTracksInfinite
```

### Following Flow
```
User clicks Follow → useFollow hook → 
  → Insert into follows table
  → Update follower/following stats (triggers)
  → Create activity record
  → Send notification to followed user
  → Real-time update via Supabase subscription
```

### Comment Flow
```
User types comment → MentionInput detects @ → 
  → Suggest users from profiles → 
  → Submit via useAddComment →
  → Insert into comments table
  → Parse mentions from content
  → Create notifications for mentioned users
  → Create activity record
  → Real-time update to comment thread
```

### Like Flow
```
User clicks Like → useLikeTrack hook →
  → Insert into track_likes (ON CONFLICT ignore)
  → Update track likes_count (trigger)
  → Create activity record
  → Send notification to track owner
  → Optimistic UI update
```

### Activity Feed Flow
```
User opens feed → useActivityFeed hook →
  → Query activities WHERE user_id IN (following_ids)
  → Order by created_at DESC
  → Paginate with cursor
  → Real-time subscription for new activities
```

## Performance Optimizations

### Database Indexes
```sql
-- Follow lookups
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Comment queries
CREATE INDEX idx_comments_track ON comments(track_id, created_at DESC);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Activity feed
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_actor_created ON activities(actor_id, created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- Likes
CREATE INDEX idx_track_likes_track ON track_likes(track_id);
CREATE INDEX idx_track_likes_user ON track_likes(user_id);
```

### Caching Strategy (TanStack Query)
```typescript
// Profile data - semi-static
{ staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 }

// Social stats - updated frequently
{ staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 }

// Activity feed - real-time
{ staleTime: 0, gcTime: 2 * 60 * 1000 }

// Notifications - real-time
{ staleTime: 0, gcTime: 1 * 60 * 1000 }
```

### Virtual Scrolling
- Use `react-virtuoso` for:
  - Followers/Following lists (1000+ users)
  - Activity feed (infinite scroll)
  - Comment threads (nested virtualization)

## Real-time Features

### Supabase Real-time Subscriptions
```typescript
// New comments on track
supabase
  .channel(`comments:track:${trackId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'comments' },
    handleNewComment
  )

// New followers
supabase
  .channel(`follows:user:${userId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'follows' },
    handleNewFollower
  )

// Activity feed updates
supabase
  .channel(`activities:user:${userId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'activities' },
    handleNewActivity
  )
```

## Content Moderation

### Automated Moderation
- Profanity filter on comments (client & server)
- Rate limiting: max 10 comments per minute per user
- Spam detection: duplicate content within 1 minute blocked
- Link validation: only allow approved domains

### Manual Moderation
- Users can report comments
- Admins can mark comments as moderated (hidden)
- Three strikes → user comment ban (24 hours)

### Edge Function: `moderate-content`
```typescript
// Check profanity, spam, rate limit
// Store in moderation_log table
// Send alert to admins if flagged
```

## Privacy & Security

### RLS Policies

#### Profiles
```sql
-- Public profiles visible to all
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

#### Follows
```sql
-- Anyone can view follows of public profiles
CREATE POLICY "Follows are viewable based on privacy"
  ON follows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = follows.following_id 
      AND is_public = true
    )
  );
```

#### Comments
```sql
-- Comments visible on public tracks
CREATE POLICY "Comments viewable on public tracks"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tracks 
      WHERE id = comments.track_id 
      AND is_public = true
    )
  );

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
```

#### Activities
```sql
-- Users see activities from followed users
CREATE POLICY "Users see followed activities"
  ON activities FOR SELECT
  USING (
    auth.uid() IN (
      SELECT follower_id FROM follows 
      WHERE following_id = activities.actor_id
    )
    OR auth.uid() = actor_id
  );
```

## Telegram Integration

### Deep Linking
- `t.me/AIMusicVerseBot/app?startapp=profile_{userId}` → User profile
- `t.me/AIMusicVerseBot/app?startapp=track_{trackId}_comments` → Track comments

### Notifications via Bot
- New follower: "🎵 @username started following you!"
- Comment on track: "💬 @username commented on [Track Name]"
- Mention in comment: "👤 @username mentioned you in a comment"
- Track liked: "❤️ @username liked [Track Name]"

### Sharing
```typescript
Telegram.shareURL({
  url: `t.me/AIMusicVerseBot/app?startapp=profile_${userId}`,
  text: `Check out ${displayName}'s music on MusicVerse AI! 🎵`
});
```

## Migration Strategy

### Phase 1: Database (Day 1-2)
1. Extend profiles table
2. Create follows, comments, likes tables
3. Create activities, notifications tables
4. Add indexes and triggers
5. Test migrations on staging

### Phase 2: Backend (Day 3-4)
1. Implement Edge Functions
2. Set up RLS policies
3. Configure real-time channels
4. Test moderation pipeline

### Phase 3: Frontend (Day 5-9)
1. Profile components (Day 5-6)
2. Social features (Day 6-7)
3. Comments system (Day 7-8)
4. Notifications (Day 8-9)

### Phase 4: Integration & Testing (Day 10-12)
1. End-to-end testing
2. Performance testing
3. Security audit
4. Bug fixes

### Phase 5: Deployment (Day 13-14)
1. Staging deployment
2. User acceptance testing
3. Production deployment
4. Monitoring

## Testing Strategy

### Unit Tests
- Component rendering with various states
- Hook logic with mock data
- Mention parsing
- Content moderation functions

### Integration Tests
- Follow/unfollow flow
- Comment submission and threading
- Notification delivery
- Activity feed updates

### E2E Tests (Playwright)
```typescript
test('User can follow another user', async ({ page }) => {
  await page.goto('/profile/user-123');
  await page.click('[data-testid="follow-button"]');
  await expect(page.locator('[data-testid="follower-count"]')).toContainText('1');
});

test('User can comment on track', async ({ page }) => {
  await page.goto('/track/track-456');
  await page.fill('[data-testid="comment-input"]', 'Great track!');
  await page.click('[data-testid="submit-comment"]');
  await expect(page.locator('[data-testid="comment-list"]')).toContainText('Great track!');
});
```

### Performance Tests
- Load 1000+ followers list
- Render comment thread with 500+ comments
- Activity feed scrolling performance
- Real-time update latency

## Risk Mitigation

### High Priority Risks

**Risk 1: Database Performance Degradation**
- **Impact**: Slow queries on follows, activities
- **Mitigation**: Comprehensive indexes, query optimization, connection pooling
- **Monitoring**: pg_stat_statements, query plan analysis

**Risk 2: Real-time Scalability**
- **Impact**: Too many concurrent subscriptions
- **Mitigation**: Rate limiting, connection pooling, fallback to polling
- **Limit**: 200 concurrent on free tier, upgrade if needed

**Risk 3: Content Moderation Gaps**
- **Impact**: Spam, inappropriate content
- **Mitigation**: Multi-layer moderation (client filter, server validation, report system)
- **Manual Review**: Admin dashboard for flagged content

**Risk 4: Privacy Violations**
- **Impact**: Data leaks, unauthorized access
- **Mitigation**: Comprehensive RLS policies, security audit, penetration testing
- **Testing**: Automated RLS policy tests in CI

## Success Metrics

### User Engagement
- **Follows**: >30% of users follow at least 1 other user within 7 days
- **Comments**: >20% of users leave at least 1 comment within 7 days
- **Likes**: >50% of users like at least 1 track within 7 days
- **Profile Completion**: >60% of users add bio and avatar

### Technical Metrics
- **Page Load**: Profile page loads in <2s on 3G
- **Real-time Latency**: New comments appear within 1s
- **Query Performance**: All queries <100ms at p95
- **Uptime**: 99.5% uptime for social features

### Business Metrics
- **User Retention**: +15% increase in 30-day retention
- **Session Duration**: +25% increase in avg session time
- **User Growth**: +20% increase in new user signups (social proof effect)

## Documentation

### User Documentation
- Profile setup guide
- Privacy settings explanation
- Comment guidelines & community standards
- Reporting inappropriate content

### Developer Documentation
- API reference for social endpoints
- Real-time subscription patterns
- RLS policy documentation
- Content moderation workflow

## Future Enhancements (Post-Sprint)

### Sprint 012+
- Collaborative projects/tracks
- Direct messaging
- User badges and achievements
- Advanced search (users, tracks, playlists)
- Trending tracks algorithm
- Content recommendations based on follows

### Long-term
- Groups/Communities
- Live collaboration sessions
- Creator monetization tools
- Analytics dashboard for creators
