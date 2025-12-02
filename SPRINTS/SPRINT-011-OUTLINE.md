# Sprint 011: Social Features & Collaboration (High-Level Outline)

**Period**: 2026-01-26 - 2026-02-09 (2 недели)  
**Focus**: User profiles, following system, comments, likes, collaborative projects  
**Estimated Tasks**: 28-32 задачи

---

## User Stories

### User Story 7: User Profiles & Artist Pages (P2)
**Goal**: Allow users to create public profiles and showcase their music

**Key Features**:
- User profile pages with bio, avatar, banner
- Artist verification system
- Track portfolio/showcase
- Stats: followers, likes, plays, track count
- Social media links integration
- Profile customization (themes, layout options)

**Key Tasks** (12 tasks):
- [ ] T001 [P] Create UserProfile model with bio, avatar, banner, social_links
- [ ] T002 [P] Create ProfilePage component in src/pages/ProfilePage.tsx
- [ ] T003 [P] Create ProfileHeader component with edit mode
- [ ] T004 [P] Create TrackPortfolio component for user's tracks
- [ ] T005 [P] Create FollowersList and FollowingList components
- [ ] T006 [P] Create EditProfileDialog component
- [ ] T007 Database migration for user_profiles table
- [ ] T008 [P] Create useUserProfile hook for profile CRUD
- [ ] T009 [P] Implement profile statistics aggregation
- [ ] T010 [P] Add profile privacy settings (public/private/friends-only)
- [ ] T011 [P] Implement artist verification workflow
- [ ] T012 Add profile to navigation and routing

---

### User Story 8: Social Interactions (P2)
**Goal**: Enable community engagement through following, comments, and likes

**Key Features**:
- Follow/unfollow users
- Activity feed showing followed users' actions
- Track comments with threading
- Reply to comments
- Like tracks and comments
- Share tracks to external platforms
- @ mentions and notifications

**Key Tasks** (16 tasks):
- [ ] T013 [P] Create follows table (follower_id, following_id)
- [ ] T014 [P] Create comments table with parent_comment_id for threading
- [ ] T015 [P] Create FollowButton component with optimistic updates
- [ ] T016 [P] Create ActivityFeed component in src/components/social/ActivityFeed.tsx
- [ ] T017 [P] Create CommentSection component with threading support
- [ ] T018 [P] Create CommentInput component with @ mention autocomplete
- [ ] T019 [P] Create ShareDialog component with platform integrations
- [ ] T020 Database migration for comments, follows, notifications tables
- [ ] T021 [P] Implement useFollow hook for follow/unfollow actions
- [ ] T022 [P] Implement useComments hook with pagination
- [ ] T023 [P] Implement useActivityFeed hook for timeline
- [ ] T024 [P] Create notification system for social interactions
- [ ] T025 [P] Implement @ mention detection and linking
- [ ] T026 [P] Add moderation tools (report, block, hide)
- [ ] T027 [P] Implement share tracking analytics
- [ ] T028 Add real-time updates for new comments and likes

---

## Database Schema Requirements

```sql
-- User profiles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  social_links JSONB,
  privacy_level TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows
CREATE TABLE follows (
  follower_id UUID REFERENCES auth.users(id),
  following_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  parent_comment_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity feed
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL, -- 'track_created', 'track_liked', 'user_followed'
  entity_id UUID,
  entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Technical Considerations

### Performance
- Implement activity feed with Redis caching
- Use pagination for comments (cursor-based)
- Optimize follower/following queries with proper indexes
- Implement rate limiting for comment posting

### Security
- Content moderation for comments (profanity filter)
- Spam prevention (rate limiting, captcha for suspicious activity)
- Privacy controls for profile visibility
- Block/mute functionality

### Real-time Features
- Live comment updates using Supabase real-time
- Instant follower count updates
- Real-time activity feed

---

## Success Metrics

- User profile creation rate: > 40% of users
- Average followers per active user: > 10
- Comment engagement: > 20% of track views
- Share rate: > 5% of track plays
- Daily active community members: > 30% growth

---

## Dependencies
- Requires Sprint 010 (Homepage) for public content foundation
- Requires notification system (can be basic initially)
- Requires moderation tools (can be manual initially)

---

*Outline created: 2025-12-02*
