# Tasks: Sprint 011 - Social Features & Collaboration

**Sprint**: 011 (18 of 25)  
**Period**: January 26 - February 9, 2026 (2 weeks)  
**Input**: Design documents from `/specs/sprint-011-social-features/`  
**Prerequisites**: plan.md, spec.md, data-model.md

**Total Estimated Tasks**: 87 tasks  
**Estimated Duration**: 14 days (2 weeks)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US7, US8, US9, US10, US11, US12, US13)
- Include exact file paths in descriptions

## Path Conventions

- Frontend: `src/` at repository root
- Backend: `supabase/` at repository root
- React components in `src/components/`
- Hooks in `src/hooks/`
- Types in `src/types/`
- Database migrations in `supabase/migrations/`
- Edge functions in `supabase/functions/`

---

## Phase 1: Setup (Database & Infrastructure)

**Purpose**: Database schema and foundational infrastructure for all social features

**Duration**: Day 1-2

- [ ] T001 Create database migration `2026_01_26_001_extend_profiles.sql` to extend profiles table with display_name, bio, avatar_url, banner_url, is_verified, is_public, privacy_level, social_links JSONB, stats columns
- [ ] T002 Create database migration `2026_01_26_002_create_follows.sql` with follows table (follower_id, following_id, status, created_at), indexes, and constraints (no self-follow)
- [ ] T003 Create database migration `2026_01_27_003_create_comments.sql` with comments table (track_id, user_id, parent_comment_id, content, likes_count, reply_count, is_edited, is_moderated), indexes on track_id, parent_comment_id
- [ ] T004 Create database migration `2026_01_27_004_create_likes.sql` with comment_likes and track_likes tables, UNIQUE constraints on (user_id, entity_id)
- [ ] T005 Create database migration `2026_01_28_005_create_activities.sql` with activities table (user_id, actor_id, activity_type, entity_type, entity_id, metadata JSONB)
- [ ] T006 Create database migration `2026_01_28_006_create_notifications.sql` with notifications table (user_id, actor_id, notification_type, entity_type, entity_id, content, is_read)
- [ ] T007 Create database migration `2026_01_28_007_create_triggers.sql` implementing trigger functions: update_follower_stats(), update_reply_count(), update_comment_likes_count(), update_track_likes_count()
- [ ] T008 Create database migration `2026_01_29_008_create_indexes.sql` adding performance indexes: idx_follows_follower, idx_comments_track_created, idx_activities_user_created, idx_notifications_user_read_created
- [ ] T009 Create database migration `2026_01_29_009_create_rls_policies.sql` implementing RLS policies for profiles, follows, comments, likes, activities, notifications based on is_public and auth.uid()
- [ ] T010 Create database migration `2026_01_29_010_create_blocked_users.sql` with blocked_users table (blocker_id, blocked_id) for privacy feature
- [ ] T011 Test all migrations on staging database with rollback scripts, verify constraints prevent invalid data (self-follow, duplicate likes)

---

## Phase 2: Foundational (Core Types & Utilities)

**Purpose**: TypeScript types and shared utilities that ALL user stories depend on

**Duration**: Day 2-3

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T012 [P] Create TypeScript types in `src/types/profile.ts`: ProfileExtended, ProfileStats, SocialLinks, PrivacyLevel, VerificationStatus
- [ ] T013 [P] Create TypeScript types in `src/types/social.ts`: Follow, FollowStatus, FollowersList, FollowingList, FollowStats
- [ ] T014 [P] Create TypeScript types in `src/types/comment.ts`: Comment, CommentThread, CommentWithUser, CommentFormData, Mention
- [ ] T015 [P] Create TypeScript types in `src/types/activity.ts`: Activity, ActivityType, EntityType, ActivityFeedItem, ActivityMetadata
- [ ] T016 [P] Create TypeScript types in `src/types/notification.ts`: Notification, NotificationType, NotificationSettings, UnreadCount
- [ ] T017 [P] Implement content moderation utility in `src/lib/content-moderation.ts` with profanity filter, spam detection, rate limit checker (max 10 comments/min, 30 follows/hour)
- [ ] T018 [P] Implement mention parser in `src/lib/mention-parser.ts` to extract @mentions from text, generate notification data, validate mentioned users exist
- [ ] T019 [P] Create Supabase Storage buckets configuration for `avatars/` (public, 5MB limit, image/* only) and `banners/` (public, 10MB limit)
- [ ] T020 Create Edge Function `supabase/functions/moderate-content/index.ts` for server-side content validation (profanity, spam, rate limiting) returning approval/rejection decision

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 7 - User Profiles & Artist Pages (Priority: P1) 🎯 MVP

**Goal**: Users can create rich artist profiles with bio, avatar, banner, social links, and view statistics (followers, tracks, likes)

**Independent Test**: Create new user account, navigate to profile, edit with bio/avatar/banner/social links, verify all fields save, view as another user, verify privacy settings work

**Duration**: Day 3-5

### Implementation for User Story 7

- [ ] T021 [P] [US7] Create ProfileHeader component in `src/components/profile/ProfileHeader.tsx` rendering avatar (circular, 120px), banner image (full-width, 200px height), display name, username, verification badge if is_verified
- [ ] T022 [P] [US7] Create ProfileStats component in `src/components/profile/ProfileStats.tsx` displaying "X Followers • Y Following • Z Tracks" with tap handlers to open lists
- [ ] T023 [P] [US7] Create ProfileBio component in `src/components/profile/ProfileBio.tsx` rendering bio text (max 500 chars) with "Read more" expansion for long bios
- [ ] T024 [P] [US7] Create SocialLinks component in `src/components/profile/SocialLinks.tsx` rendering icon buttons for Instagram, Twitter, SoundCloud, YouTube with external link handlers
- [ ] T025 [P] [US7] Create VerificationBadge component in `src/components/profile/VerificationBadge.tsx` displaying blue checkmark with tooltip "Verified Artist"
- [ ] T026 [P] [US7] Create ProfileEditDialog component in `src/components/profile/ProfileEditDialog.tsx` with form fields: display name input (max 50), bio textarea (max 500 with counter), avatar upload (file input + preview), banner upload, social links inputs with URL validation, privacy level dropdown
- [ ] T027 [US7] Implement useProfile hook in `src/hooks/profile/useProfile.ts` using TanStack Query to fetch profile by user_id with caching (staleTime: 5min)
- [ ] T028 [US7] Implement useUpdateProfile hook in `src/hooks/profile/useUpdateProfile.ts` with mutation for updating profile fields, optimistic updates, image upload to Supabase Storage
- [ ] T029 [US7] Implement useProfileStats hook in `src/hooks/profile/useProfileStats.ts` fetching stats_followers, stats_following, stats_tracks from profiles table
- [ ] T030 [US7] Create ProfilePage component in `src/pages/ProfilePage.tsx` composing ProfileHeader, ProfileStats, ProfileBio, SocialLinks, and VirtualizedTrackList (user's tracks), handle own vs. other user profile logic
- [ ] T031 [US7] Create EditProfilePage component in `src/pages/EditProfilePage.tsx` rendering ProfileEditDialog form with save/cancel actions, image upload progress indicators
- [ ] T032 [US7] Add profile routes to router: `/profile/:userId` for view, `/profile/edit` for editing own profile, implement deep linking from Telegram `t.me/bot/app?startapp=profile_{userId}`

**Checkpoint**: User Story 7 complete - users can create and view profiles independently

---

## Phase 4: User Story 8 - Social Interactions: Following System (Priority: P1) 🎯 MVP

**Goal**: Users can follow/unfollow other creators, see follower/following lists, receive follow notifications

**Independent Test**: User A follows User B via button, User B receives notification, counts increment, User A unfollows and counts decrement, verify privacy settings work

**Duration**: Day 5-7

### Implementation for User Story 8

- [ ] T033 [P] [US8] Create FollowButton component in `src/components/social/FollowButton.tsx` with states: "Follow" (outline), "Following" (filled), "Pending" (for private profiles), tap handler with optimistic update
- [ ] T034 [P] [US8] Create FollowersList component in `src/components/social/FollowersList.tsx` with virtualized list (react-virtuoso), user cards (avatar, name, bio snippet, Follow button), search/filter input
- [ ] T035 [P] [US8] Create FollowingList component in `src/components/social/FollowingList.tsx` similar to FollowersList but showing followed users with "Following" button (tap to unfollow)
- [ ] T036 [US8] Implement useFollow hook in `src/hooks/social/useFollow.ts` with mutation to insert/delete follows row, optimistic UI updates, rollback on error, create notification
- [ ] T037 [US8] Implement useFollowers hook in `src/hooks/social/useFollowers.ts` querying follows table WHERE following_id = userId with infinite scroll pagination (50 per page)
- [ ] T038 [US8] Implement useFollowing hook in `src/hooks/social/useFollowing.ts` querying follows table WHERE follower_id = userId with pagination
- [ ] T039 [US8] Add FollowButton to ProfilePage (below ProfileStats), show/hide based on viewing own profile, handle follow/unfollow with haptic feedback
- [ ] T040 [US8] Create modal for FollowersList triggered by tapping "X Followers" on ProfileStats, with close button and search functionality
- [ ] T041 [US8] Create modal for FollowingList triggered by tapping "Y Following" on ProfileStats
- [ ] T042 [US8] Implement follow notification creation: on INSERT into follows table, create notification row (type: 'follow', actor_id: follower_id, user_id: following_id, content: '@username started following you')
- [ ] T043 [US8] Implement real-time subscription in useFollowers/useFollowing hooks to update lists when new follows occur via Supabase channel `follows:user:{userId}`
- [ ] T044 [US8] Add rate limiting to useFollow hook: check if user has made >30 follows in last hour, show error "Please wait before following more users"

**Checkpoint**: User Story 8 complete - following system fully functional independently

---

## Phase 5: User Story 9 - Social Interactions: Comments & Threading (Priority: P1)

**Goal**: Users can comment on tracks, reply to comments (threaded), use @mentions, edit/delete own comments, see real-time updates

**Independent Test**: Open track, post comment (appears immediately), reply to comment (nested), edit/delete own comment, @ mention user (they receive notification), verify moderation (profanity filter)

**Duration**: Day 7-9

### Implementation for User Story 9

- [ ] T045 [P] [US9] Create CommentsList component in `src/components/comments/CommentsList.tsx` rendering top-level comments with virtualization (react-virtuoso), sort by created_at DESC
- [ ] T046 [P] [US9] Create CommentItem component in `src/components/comments/CommentItem.tsx` displaying user avatar, display name, comment content, timestamp, like button, reply button, "•••" menu (edit/delete)
- [ ] T047 [P] [US9] Create CommentThread component in `src/components/comments/CommentThread.tsx` rendering nested replies (recursive up to 5 levels), collapse/expand thread, "View parent thread" link for deep nesting
- [ ] T048 [P] [US9] Create CommentForm component in `src/components/comments/CommentForm.tsx` with textarea (max 1000 chars with counter), submit button, mentions autocomplete dropdown, client-side profanity validation
- [ ] T049 [P] [US9] Create MentionInput component in `src/components/comments/MentionInput.tsx` wrapping CommentForm textarea, detecting "@" trigger, showing autocomplete with users (search by username/display_name), inserting mention with highlighted styling
- [ ] T050 [US9] Implement useComments hook in `src/hooks/comments/useComments.ts` querying comments WHERE track_id = X AND parent_comment_id IS NULL with infinite scroll, real-time subscription on `comments:track:{trackId}` channel
- [ ] T051 [US9] Implement useAddComment hook in `src/hooks/comments/useAddComment.ts` with mutation to insert comment, parse @mentions, create notifications for mentioned users, optimistic update to comments list
- [ ] T052 [US9] Implement useDeleteComment hook in `src/hooks/comments/useDeleteComment.ts` with soft delete logic: if reply_count > 0 replace content with "[Deleted]", else hard delete row
- [ ] T053 [US9] Implement useMentions hook in `src/hooks/comments/useMentions.ts` for autocomplete: debounced search query on profiles WHERE username LIKE '%query%' OR display_name LIKE '%query%' LIMIT 10
- [ ] T054 [US9] Add CommentsList to TrackDetailPage (below player), with tab for "Comments (count)" vs. "Track Info", lazy load comments on tab switch
- [ ] T055 [US9] Implement edit comment functionality: clicking "Edit" in "•••" menu opens CommentForm with existing text, on save set is_edited = true, show "(edited)" label
- [ ] T056 [US9] Integrate content moderation: call `content-moderation.ts` on client submit, if rejected show error, call `moderate-content` edge function on server, if flagged set is_moderated = true (hide from UI)
- [ ] T057 [US9] Implement rate limiting in useAddComment: check localStorage for recent comments (max 10 in last minute), show error "You're commenting too fast. Please wait a moment."
- [ ] T058 [US9] Create notification for comment owner when reply added: notification type 'reply', link to comment thread
- [ ] T059 [US9] Create notification for track owner when comment added: notification type 'comment', link to track with comment highlighted

**Checkpoint**: User Story 9 complete - comment system fully functional with threading and mentions

---

## Phase 6: User Story 10 - Social Interactions: Likes & Engagement (Priority: P2)

**Goal**: Users can like tracks and comments, see liked tracks list, track owners receive notifications

**Independent Test**: Like track (heart animates, count increments), unlike (count decrements), view "Liked Tracks" in profile, like comment, verify notifications sent

**Duration**: Day 9-10

### Implementation for User Story 10

- [ ] T060 [P] [US10] Create LikeButton component in `src/components/engagement/LikeButton.tsx` with heart icon (outline/filled), scale animation on tap, like count display, debounced tap handler
- [ ] T061 [P] [US10] Create StatsDisplay component in `src/components/engagement/StatsDisplay.tsx` showing like count as "1.2K likes" (formatted), tapping opens LikersModal with user list
- [ ] T062 [US10] Implement useLikeTrack hook in `src/hooks/engagement/useLikeTrack.ts` with mutation to insert/delete track_likes row (ON CONFLICT ignore), optimistic update, create notification for track owner (batched: max 1 per user per track)
- [ ] T063 [US10] Implement useLikeComment hook in `src/hooks/engagement/useLikeComment.ts` similar to useLikeTrack for comment_likes table
- [ ] T064 [US10] Implement useTrackStats hook in `src/hooks/engagement/useTrackStats.ts` fetching likes_count from tracks table, checking if current user liked (EXISTS query on track_likes)
- [ ] T065 [US10] Add LikeButton to TrackCard component (bottom-right corner), show filled state if user liked
- [ ] T066 [US10] Add LikeButton to TrackDetailPage (below player controls), larger size
- [ ] T067 [US10] Add LikeButton to CommentItem component (right side), smaller size
- [ ] T068 [US10] Create "Liked Tracks" tab in ProfilePage showing tracks from track_likes WHERE user_id = current user, sorted by created_at DESC, infinite scroll
- [ ] T069 [US10] Implement LikersModal component showing users who liked track/comment, virtualized list, follow buttons on each user card
- [ ] T070 [US10] Create notification for track like: notification type 'like_track', batch similar notifications (if same user likes multiple tracks by same owner, group as "liked 3 of your tracks")

**Checkpoint**: User Story 10 complete - like system fully functional independently

---

## Phase 7: User Story 11 - Activity Feed & Discovery (Priority: P2)

**Goal**: Users see activity feed from followed creators (new tracks, likes, playlists), real-time updates, infinite scroll

**Independent Test**: User A follows Users B, C, D; Users B/C/D perform actions (publish track, like, create playlist); User A sees timestamped activities in feed, real-time updates

**Duration**: Day 10-11

### Implementation for User Story 11

- [ ] T071 [P] [US11] Create ActivityFeed component in `src/components/social/ActivityFeed.tsx` with virtualized list (react-virtuoso), loading skeletons, empty state ("Follow creators to see their activities")
- [ ] T072 [P] [US11] Create ActivityItem component in `src/components/social/ActivityItem.tsx` rendering activity type icon, actor avatar/name, action text, entity (track card, playlist), relative timestamp ("2 hours ago")
- [ ] T073 [US11] Implement useActivityFeed hook in `src/hooks/social/useActivityFeed.ts` querying activities WHERE user_id IN (SELECT following_id FROM follows WHERE follower_id = current_user) ORDER BY created_at DESC with pagination (50 per page)
- [ ] T074 [US11] Implement real-time subscription in useActivityFeed on `activities:user:{userId}` channel, prepend new activities with slide-down animation and 3s highlight effect
- [ ] T075 [US11] Create ActivityPage component in `src/pages/ActivityPage.tsx` rendering ActivityFeed, filter tabs ("All", "Tracks", "Likes", "Playlists")
- [ ] T076 [US11] Add Activity tab to main navigation (bottom tab bar), badge showing count of new activities since last view (stored in localStorage)
- [ ] T077 [US11] Implement activity creation triggers: on INSERT into tracks (if is_public = true) create activity (type: 'track_published'), on INSERT into track_likes create activity (type: 'track_liked'), on INSERT into playlists create activity (type: 'playlist_created')
- [ ] T078 [US11] Implement activity archival: Edge Function `supabase/functions/archive-old-activities/index.ts` to move activities older than 30 days to activities_archive table, scheduled daily via Supabase cron

**Checkpoint**: User Story 11 complete - activity feed functional, users can discover content from followed users

---

## Phase 8: User Story 12 - Notifications System (Priority: P2)

**Goal**: Users receive notifications for social interactions (comments, likes, follows, mentions), view notification list, mark as read

**Independent Test**: User B comments on User A's track, User A receives notification (badge on bell icon), tap notification navigates to track, mark as read, badge decrements

**Duration**: Day 11-12

### Implementation for User Story 12

- [ ] T079 [P] [US12] Create NotificationBell component in `src/components/notifications/NotificationBell.tsx` with bell icon, red badge showing unread count, bounce animation when new notification arrives
- [ ] T080 [P] [US12] Create NotificationList component in `src/components/notifications/NotificationList.tsx` dropdown with virtualized list, filter tabs ("All", "Unread", "Mentions"), "Mark all as read" button
- [ ] T081 [P] [US12] Create NotificationItem component in `src/components/notifications/NotificationItem.tsx` rendering type icon, actor avatar, notification text, relative timestamp, bold if unread, tap to navigate to entity
- [ ] T082 [US12] Implement useNotifications hook in `src/hooks/notifications/useNotifications.ts` querying notifications WHERE user_id = current user ORDER BY created_at DESC with pagination, real-time subscription on `notifications:user:{userId}` channel
- [ ] T083 [US12] Implement useMarkAsRead hook in `src/hooks/notifications/useMarkAsRead.ts` with mutation to UPDATE notifications SET is_read = true, optimistic update, decrement unread badge count
- [ ] T084 [US12] Add NotificationBell to app header (top-right), subscribe to real-time notifications, increment badge on new notification
- [ ] T085 [US12] Implement notification navigation: tapping notification determines entity_type (track/comment/user), navigates to appropriate page, scrolls to entity if needed (e.g., specific comment), marks notification as read
- [ ] T086 [US12] Implement Telegram bot notification delivery via Edge Function `supabase/functions/send-notification/index.ts` for critical notifications (mention, comment on my track), sends via Telegram bot API with deep link
- [ ] T087 [US12] Create notification settings page in `src/pages/NotificationSettingsPage.tsx` with toggles for each notification type: "Comments on my tracks", "Replies to my comments", "Mentions", "New followers", "Likes on tracks", "Likes on comments", save to profiles JSONB column `notification_settings`

**Checkpoint**: User Story 12 complete - notification system fully functional with in-app and Telegram delivery

---

## Phase 9: User Story 13 - Privacy & Content Moderation (Priority: P3)

**Goal**: Users can set privacy controls (public/private profile), block users, report inappropriate comments, admins can moderate

**Independent Test**: Set profile to private, verify followers-only see content, block user (can't comment/follow), report comment, admin reviews and hides comment

**Duration**: Day 12-13

### Implementation for User Story 13

- [ ] T088 [P] [US13] Create PrivacySettings component in `src/components/settings/PrivacySettings.tsx` with dropdowns: Profile visibility (Public/Followers Only/Private), Track visibility per track, Comment permissions (Everyone/Followers/Off), Show activity toggle
- [ ] T089 [P] [US13] Create BlockUserButton in `src/components/social/BlockUserButton.tsx` in user profile "•••" menu, confirmation dialog "Block @username?", on confirm insert into blocked_users table
- [ ] T090 [P] [US13] Create ReportCommentButton in `src/components/comments/ReportCommentButton.tsx` in comment "•••" menu, modal with report reasons (Spam, Harassment, Inappropriate, Other), submit creates moderation_reports row
- [ ] T091 [US13] Implement RLS policy enforcement: verify profiles.is_public controls visibility, blocked users can't see profile/comment/follow, private profiles require approved follow to see content
- [ ] T092 [US13] Create admin moderation dashboard in `src/pages/admin/ModerationDashboard.tsx` (admin-only route) listing moderation_reports with status 'pending', show reported comment/user, actions: "Hide Comment", "Dismiss Report", "Warn User"
- [ ] T093 [US13] Implement moderation action handlers: "Hide Comment" sets is_moderated = true on comment (hides from public), "Warn User" increments strike count, 3 strikes = 24-hour comment ban (stored in profiles JSONB column `moderation_status`)
- [ ] T094 [US13] Add profanity filter integration to CommentForm: on submit, call `content-moderation.ts`, if detected profanity highlight word and show error "Please keep comments respectful", allow edit and resubmit
- [ ] T095 [US13] Implement blocked users check in useComments hook: filter out comments WHERE user_id IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = current_user)
- [ ] T096 [US13] Add "Blocked Users" management page in `src/pages/settings/BlockedUsersPage.tsx` listing blocked users with "Unblock" button

**Checkpoint**: User Story 13 complete - privacy controls and moderation system functional

---

## Phase 10: Integration & Cross-Cutting Concerns (Final Polish)

**Purpose**: Integration testing, performance optimization, documentation, deployment preparation

**Duration**: Day 13-14

- [ ] T097 [P] Run end-to-end tests with Playwright: user registration → profile creation → follow users → comment on track → receive notifications → like tracks → view activity feed
- [ ] T098 [P] Performance testing: load profile with 1000+ tracks (virtualization), scroll activity feed with 1000+ activities, render comment thread with 100+ comments, verify 60fps
- [ ] T099 [P] Real-time latency testing: User A comments, measure time until User B sees comment (target <1s), User A follows User B, measure notification delivery time
- [ ] T100 [P] Security audit: test RLS policies (attempt to view private profile, attempt to comment as blocked user, attempt to access other user's notifications), verify all fail with proper errors
- [ ] T101 [P] Database query optimization: run EXPLAIN ANALYZE on all critical queries (activity feed, comments list, followers list), verify indexes are used, all queries <100ms at p95
- [ ] T102 [P] Image upload testing: upload 5MB avatar (success), upload 6MB avatar (client validation rejects), upload banner (success), verify CDN delivery speed
- [ ] T103 [P] Content moderation testing: submit comment with profanity (rejected), submit 11 comments in 1 minute (rate limited), report comment (appears in admin dashboard)
- [ ] T104 [P] Update user documentation in `docs/user-guide.md`: Profile setup, Following users, Commenting etiquette, Privacy settings, Reporting inappropriate content
- [ ] T105 [P] Update developer documentation in `docs/api-reference.md`: Social endpoints, Real-time subscriptions, RLS policy documentation, Content moderation workflow
- [ ] T106 Add monitoring and alerts: Sentry for error tracking, Supabase dashboard for query performance, set up alerts for error rate >1%, real-time disconnect rate >5%, query time >500ms
- [ ] T107 Deploy database migrations to staging environment, test with synthetic data (100 users, 1000 follows, 5000 comments), verify performance and data integrity
- [ ] T108 Deploy Edge Functions to staging: `moderate-content`, `send-notification`, `archive-old-activities`, test each function manually
- [ ] T109 Deploy frontend to staging, smoke test all user stories: create profile, follow user, comment, like, view activity feed, receive notifications
- [ ] T110 User acceptance testing with 10+ beta users, collect feedback on UX, bugs, performance issues, prioritize critical fixes
- [ ] T111 Production deployment: merge feature branch to main, deploy migrations (with rollback scripts ready), deploy Edge Functions, deploy frontend, enable feature flags gradually (10% → 50% → 100%)
- [ ] T112 Post-deployment monitoring: track error rates, query performance, user engagement metrics (follower growth, comment rate, notification CTR), set up daily dashboard

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately (Day 1-2)
- **Foundational (Phase 2)**: Depends on Setup completion (migrations deployed) - BLOCKS all user stories (Day 2-3)
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - User Story 7 (Profiles) can start after Foundational (Day 3-5)
  - User Story 8 (Following) depends on US7 (FollowButton on ProfilePage) (Day 5-7)
  - User Story 9 (Comments) can start in parallel with US8 (Day 7-9)
  - User Story 10 (Likes) can start in parallel with US9 (Day 9-10)
  - User Story 11 (Activity Feed) depends on US8 (follows system) (Day 10-11)
  - User Story 12 (Notifications) integrates with US8, US9, US10 (Day 11-12)
  - User Story 13 (Privacy) can start after US7, US8, US9 (Day 12-13)
- **Integration (Phase 10)**: Depends on all desired user stories being complete (Day 13-14)

### Critical Path

```
Day 1-2: Setup (T001-T011) → 
Day 2-3: Foundational (T012-T020) → [BLOCKING CHECKPOINT] →
Day 3-5: US7 Profiles (T021-T032) → [MVP CHECKPOINT] →
Day 5-7: US8 Following (T033-T044) → [MVP CHECKPOINT] →
Day 7-9: US9 Comments (T045-T059) → [MVP CHECKPOINT] →
Day 9-10: US10 Likes (T060-T070) →
Day 10-11: US11 Activity Feed (T071-T078) →
Day 11-12: US12 Notifications (T079-T087) →
Day 12-13: US13 Privacy (T088-T096) →
Day 13-14: Integration & Deploy (T097-T112)
```

### User Story Dependencies

- **User Story 7 (Profiles)**: Independent, can start after Foundational
- **User Story 8 (Following)**: Depends on US7 (FollowButton integrated into ProfilePage)
- **User Story 9 (Comments)**: Independent, can run parallel to US8
- **User Story 10 (Likes)**: Depends on US7 (tracks visible), US9 (comments visible)
- **User Story 11 (Activity Feed)**: Depends on US8 (follows determine feed), US7 (activities reference profiles)
- **User Story 12 (Notifications)**: Integrates with US8 (follow notifications), US9 (comment notifications), US10 (like notifications)
- **User Story 13 (Privacy)**: Depends on US7 (profile settings), US8 (block users from following), US9 (report comments)

### Within Each User Story

- Types and utilities before components (T012-T020 before all others)
- Hooks before components that use them
- Base components (CommentItem, ActivityItem) before container components (CommentsList, ActivityFeed)
- UI components before page components
- Pages before route configuration
- Core implementation before integration with other stories

### Parallel Opportunities

**Setup Phase (Day 1-2)**:
- T001-T010 can run sequentially (migrations depend on each other)
- T011 testing can overlap with Phase 2 start

**Foundational Phase (Day 2-3)**:
- T012-T019 marked [P] can ALL run in parallel (different files)
- T020 Edge Function can run parallel to types

**User Story 7 (Day 3-5)**:
- T021-T026 components marked [P] can run in parallel
- T027-T029 hooks can run after types are done
- T030-T032 pages/routes run after components/hooks

**User Story 8 (Day 5-7)**:
- T033-T035 components marked [P] can run in parallel
- T037-T038 hooks can run in parallel
- T039-T041 integration tasks sequential

**User Story 9 (Day 7-9)**:
- T045-T049 components marked [P] can run in parallel
- T050-T053 hooks can run in parallel (different queries)
- T054-T059 integration tasks sequential

**User Story 10 (Day 9-10)**:
- T060-T061 components marked [P] can run in parallel
- T062-T064 hooks can run in parallel
- T065-T070 integration tasks can partially overlap

**User Story 11 (Day 10-11)**:
- T071-T072 components marked [P] can run in parallel
- T073-T074 hook + real-time can run together

**User Story 12 (Day 11-12)**:
- T079-T081 components marked [P] can run in parallel
- T082-T083 hooks can run in parallel

**User Story 13 (Day 12-13)**:
- T088-T090 components marked [P] can run in parallel
- T091-T096 integration tasks sequential

**Integration Phase (Day 13-14)**:
- T097-T106 marked [P] can ALL run in parallel (different test types)
- T107-T112 deployment tasks must run sequentially

---

## Parallel Execution Examples

### Example 1: User Story 7 Components (Day 3)
Launch all UI components in parallel:
```bash
Task T021: "Create ProfileHeader component"
Task T022: "Create ProfileStats component"  
Task T023: "Create ProfileBio component"
Task T024: "Create SocialLinks component"
Task T025: "Create VerificationBadge component"
Task T026: "Create ProfileEditDialog component"
```

### Example 2: Foundational Types (Day 2)
Launch all type files in parallel:
```bash
Task T012: "Create types in src/types/profile.ts"
Task T013: "Create types in src/types/social.ts"
Task T014: "Create types in src/types/comment.ts"
Task T015: "Create types in src/types/activity.ts"
Task T016: "Create types in src/types/notification.ts"
Task T017: "Implement content-moderation.ts"
Task T018: "Implement mention-parser.ts"
Task T019: "Create Storage buckets config"
```

### Example 3: Integration Testing (Day 13)
Launch all tests in parallel:
```bash
Task T097: "End-to-end tests with Playwright"
Task T098: "Performance testing"
Task T099: "Real-time latency testing"
Task T100: "Security audit"
Task T101: "Database query optimization"
Task T102: "Image upload testing"
Task T103: "Content moderation testing"
Task T104: "Update user documentation"
Task T105: "Update developer documentation"
```

---

## Implementation Strategy

### MVP First (User Stories 7 + 8 Only)

**Minimum Viable Product** for social features:

1. Complete Phase 1: Setup (Day 1-2)
2. Complete Phase 2: Foundational (Day 2-3) [BLOCKING]
3. Complete Phase 3: User Story 7 - Profiles (Day 3-5)
4. Complete Phase 4: User Story 8 - Following (Day 5-7)
5. **STOP and VALIDATE**: Test profiles + following independently
6. Deploy to staging for user feedback

**MVP Delivers**:
- Rich user profiles with bio, avatar, social links
- Following/follower relationships
- Activity feed showing followed users' new tracks
- Basic notifications for follows

**Deferred to Post-MVP**:
- Comments (US9)
- Likes (US10)
- Full activity feed (US11)
- Comprehensive notifications (US12)
- Privacy/moderation (US13)

### Incremental Delivery (Recommended)

**Sprint Week 1 (Day 1-7)**:
1. Setup + Foundational (Day 1-3) → Foundation ready
2. User Story 7: Profiles (Day 3-5) → Deploy → Demo (MVP Checkpoint 1)
3. User Story 8: Following (Day 5-7) → Deploy → Demo (MVP Checkpoint 2)

**Sprint Week 2 (Day 8-14)**:
4. User Story 9: Comments (Day 7-9) → Test independently → Deploy
5. User Story 10: Likes (Day 9-10) → Test independently → Deploy
6. User Story 11: Activity Feed (Day 10-11) → Test independently → Deploy
7. User Story 12: Notifications (Day 11-12) → Test independently → Deploy
8. User Story 13: Privacy (Day 12-13) → Test independently
9. Integration & Deploy (Day 13-14) → Production launch

**Each phase adds value without breaking previous features**

### Parallel Team Strategy

With 3 developers:

**Week 1**:
- All: Complete Setup + Foundational together (Day 1-3)
- Once Foundational done (Day 3):
  - Developer A: User Story 7 (Profiles) - T021-T032
  - Developer B: User Story 8 (Following) - T033-T044 (starts Day 5 after US7)
  - Developer C: User Story 9 (Comments) - T045-T059 (can start Day 3, parallel to US7/US8)

**Week 2**:
- Developer A: User Story 10 (Likes) + US11 (Activity Feed) - T060-T078
- Developer B: User Story 12 (Notifications) - T079-T087
- Developer C: User Story 13 (Privacy) - T088-T096
- All: Integration testing & deployment (Day 13-14)

---

## Risk Assessment

### High Priority Risks

**Risk 1: Real-time Subscription Scalability**
- **Impact**: Activity feed/notifications lag at scale
- **Affected Tasks**: T043, T074, T082
- **Mitigation**: Connection pooling, fallback to polling, monitor connection count
- **Contingency**: If >180 connections, upgrade Supabase tier ($25/mo unlimited)

**Risk 2: Database Migration Failure**
- **Impact**: Blocks all development
- **Affected Tasks**: T001-T011 (entire Setup phase)
- **Mitigation**: Test on staging with production data copy, prepare rollback scripts, test constraints thoroughly
- **Contingency**: If migration fails, rollback immediately, fix issue, re-run next day

**Risk 3: Content Moderation Gaps**
- **Impact**: Spam/harassment damages community
- **Affected Tasks**: T056, T094, T103
- **Mitigation**: Multi-layer filtering, rate limiting, admin dashboard, clear reporting flow
- **Contingency**: If spam wave occurs, temporarily disable comments for non-followers, increase moderation response time

### Medium Priority Risks

**Risk 4: Image Upload Performance**
- **Impact**: Slow avatar/banner uploads, poor UX
- **Affected Tasks**: T028, T102
- **Mitigation**: Client-side compression, chunked uploads, progress indicators, CDN caching
- **Contingency**: If CDN slow, use smaller image sizes, implement lazy loading

**Risk 5: Comment Thread Performance**
- **Impact**: Slow rendering of deep comment threads
- **Affected Tasks**: T047, T050, T098
- **Mitigation**: Virtualized rendering, collapse deep threads after 5 levels, pagination
- **Contingency**: If performance issues, limit thread depth to 3 levels, paginate replies

**Risk 6: Notification Fatigue**
- **Impact**: Users disable notifications, miss important updates
- **Affected Tasks**: T082, T086, T087
- **Mitigation**: Batch similar notifications, sensible defaults, per-type toggles
- **Contingency**: If opt-out rate >30%, reduce notification frequency, add daily digest option

---

## Testing Requirements

### Unit Tests (Per Story)

**User Story 7**:
- ProfileHeader renders correctly with/without verification badge
- ProfileEditDialog validates bio length, social link URLs
- useUpdateProfile handles image upload errors

**User Story 8**:
- FollowButton handles optimistic updates and rollback
- useFollow enforces rate limit (30/hour)
- useFollowers pagination works correctly

**User Story 9**:
- CommentForm validates content length, blocks profanity
- MentionInput detects @ and shows autocomplete
- useAddComment parses mentions correctly

**User Story 10**:
- LikeButton debounces rapid taps
- useLikeTrack handles optimistic update and rollback
- useTrackStats correctly determines if user liked track

**User Story 11**:
- ActivityItem renders different activity types correctly
- useActivityFeed pagination works, real-time updates prepend

**User Story 12**:
- NotificationBell badge updates on new notification
- useNotifications filters by type (All/Unread/Mentions)
- Notification navigation goes to correct entity

**User Story 13**:
- PrivacySettings saves all privacy levels correctly
- BlockUserButton confirmation dialog works
- RLS policies prevent blocked user access

### Integration Tests

- Follow user → receive notification → unfollow → notification archived
- Comment on track → owner receives notification → reply → commenter receives notification
- Like track → owner receives notification → unlike → notification removed
- Publish track → followers see in activity feed in real-time
- Set profile to private → non-followers can't see tracks/comments
- Block user → blocked user can't see profile, can't comment, can't follow

### E2E Tests (Playwright)

```typescript
test('Complete social interaction flow', async ({ page }) => {
  // User A creates profile
  await page.goto('/profile/edit');
  await page.fill('[data-testid="display-name-input"]', 'User A');
  await page.fill('[data-testid="bio-textarea"]', 'Music creator');
  await page.click('[data-testid="save-profile-button"]');
  
  // User B follows User A
  await page.goto('/profile/user-a-id');
  await page.click('[data-testid="follow-button"]');
  await expect(page.locator('[data-testid="follower-count"]')).toContainText('1');
  
  // User A comments on track
  await page.goto('/track/track-id');
  await page.fill('[data-testid="comment-input"]', 'Great track!');
  await page.click('[data-testid="submit-comment"]');
  await expect(page.locator('[data-testid="comment-list"]')).toContainText('Great track!');
  
  // User B likes track
  await page.click('[data-testid="like-button"]');
  await expect(page.locator('[data-testid="like-count"]')).toContainText('1');
  
  // User A receives notification
  await page.goto('/');
  await expect(page.locator('[data-testid="notification-badge"]')).toContainText('2'); // follow + like
});
```

### Performance Benchmarks

- Profile page load: <2s on 3G (Lighthouse test)
- Activity feed scroll: 60fps with 1000+ activities (React DevTools Profiler)
- Comment submission to real-time delivery: <1s (timestamp comparison)
- Follower list rendering: <500ms for 1000+ followers (with virtualization)
- Database queries: <100ms at p95 (pg_stat_statements)

---

## Success Criteria Summary

### Definition of Done

- [ ] All database migrations deployed to staging and production
- [ ] All RLS policies tested and verified (no data leaks)
- [ ] All components render correctly on mobile (375px - 430px width)
- [ ] All user stories have passing E2E tests (Playwright)
- [ ] Real-time subscriptions working with <1s latency
- [ ] Profanity filter tested with known corpus (>95% accuracy)
- [ ] Rate limiting enforced on all write operations
- [ ] Privacy settings enforced at database and UI level
- [ ] Notification system delivers messages reliably (>98%)
- [ ] Performance benchmarks met (profile <2s, queries <100ms p95)
- [ ] Security audit completed (no critical vulnerabilities)
- [ ] Documentation updated (user guide, API docs)
- [ ] Admin moderation dashboard functional
- [ ] Monitoring and alerts configured (Sentry, Supabase)
- [ ] User acceptance testing completed with 10+ beta users
- [ ] Production deployment completed with gradual rollout (10% → 50% → 100%)

### User Acceptance Criteria

- [ ] Users can create rich profiles with avatar, bio, social links
- [ ] Users can follow/unfollow others with real-time updates
- [ ] Users can comment on tracks with threading and mentions
- [ ] Users can like tracks and comments with notifications
- [ ] Users see personalized activity feed from followed users
- [ ] Users receive notifications for social interactions
- [ ] Users can report inappropriate content
- [ ] Privacy settings work correctly (public/private profiles)
- [ ] All touch targets are ≥44×44px (mobile accessibility)
- [ ] Keyboard navigation works (web accessibility)
- [ ] 30% of users follow at least 1 user within 7 days (engagement metric)
- [ ] 20% of users comment at least once within 7 days
- [ ] 50% of users like at least 1 track within 7 days
- [ ] 30-day retention increases by 15% post-launch
- [ ] Average session duration increases by 25%

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Database migrations must be tested on staging before production
- RLS policies are critical for security - test thoroughly
- Real-time subscriptions require Supabase paid tier if >200 concurrent connections
- Content moderation is multi-layered: client filter + server validation + admin review
- Notifications should be batched to avoid fatigue (max 1 per user per action type)
- Image uploads require CDN for fast delivery - configure Supabase Storage properly
- Activity feed performance depends on proper indexes - monitor query times
- Stop at any checkpoint to validate story independently before proceeding
- Commit after each task or logical group
- Monitor Sentry for errors, Supabase dashboard for query performance
- Use feature flags for gradual rollout (10% → 50% → 100%)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
