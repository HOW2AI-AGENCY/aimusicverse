# Feature Specification: Sprint 011 - Social Features & Collaboration

**Sprint**: 011 (18 of 25)  
**Period**: Started December 13, 2025 - Target completion December 20, 2025  
**Status**: 🔄 **In Progress** (86% Complete - 123/143 tasks)  
**Priority**: High

## Current Status (Updated 2025-12-13)

- ✅ **Phases 1-9 Complete** (123 tasks): All core social features implemented
- 🔄 **Phase 10** (7/9 tasks - 78%): Content moderation nearly complete
- 🔄 **Phase 11** (6/9 tasks - 67%): Real-time optimization in progress
- ⏳ **Phase 12** (0/16 tasks): Testing & QA pending
- ⏳ **Phase 13** (1/13 tasks): Documentation partially complete

**Build Status**: ✅ Passing (41.27s, zero errors)  
**Production Readiness**: Phases 1-9 ready for deployment

For detailed implementation status, see:
- [Sprint 011 Execution Status](../../SPRINT_011_EXECUTION_STATUS.md)
- [Sprint 011 Implementation Guide](../../SPRINT_IMPLEMENTATION_GUIDE.md)
- [Sprint Progress Tracker](../../SPRINTS/SPRINT-PROGRESS.md)

---

## Overview

This sprint transforms MusicVerse AI into a collaborative music platform by implementing comprehensive social features. Users will be able to create rich profiles, follow other creators, engage through comments and likes, discover content through activity feeds, and receive real-time notifications for social interactions.

## User Scenarios & Testing

### User Story 7: User Profiles & Artist Pages (Priority: P1) 🎯 MVP

As a music creator on MusicVerse AI, I want to have a professional artist profile with bio, avatar, banner, social links, and statistics so that other users can discover my work and follow my creative journey.

**Why this priority**: Profiles are the foundation of any social platform. Without profiles, users cannot establish identity, build reputation, or be discovered. This is a blocking prerequisite for all other social features.

**Independent Test**: Can be fully tested by creating a new user account, navigating to profile page, editing profile with bio/avatar/banner/social links, verifying all fields save correctly, viewing own profile as logged-in user, and viewing as another user to verify privacy settings work. Profile stats should show accurate counts.

**Acceptance Scenarios**:

1. **Given** a new user completes onboarding, **When** they navigate to their profile, **Then** they see a default profile with placeholder avatar, empty bio, and stats showing 0 followers/0 following/0 tracks.

2. **Given** a user is on their profile page, **When** they tap the "Edit Profile" button, **Then** they can upload avatar (up to 5MB), upload banner (up to 10MB), enter display name (max 50 chars), write bio (max 500 chars), add social links (Instagram, Twitter, SoundCloud), and select privacy level (Public/Followers Only/Private).

3. **Given** a user has published 10 tracks, gained 50 followers, and liked 20 tracks, **When** viewing their profile, **Then** stats accurately display "50 Followers • 0 Following • 10 Tracks" and liked tracks count is visible in a separate section.

4. **Given** a user profile is set to "Public", **When** another user views the profile, **Then** they see full profile information, track portfolio (virtualized grid), and can tap Follow button. If profile is "Private", they only see display name and avatar with message "This profile is private".

5. **Given** an artist has been verified by admins, **When** viewing their profile, **Then** a blue verification checkmark appears next to their name with tooltip "Verified Artist" to establish authenticity.

**Edge Cases**:
- What happens if user uploads 50MB avatar? → Client-side validation rejects files >5MB before upload
- How does profile handle 1000+ tracks? → react-virtuoso infinite scroll with pagination (50 tracks per page)
- What if user changes display name to profanity? → Server-side content filter rejects on save with error message
- How does system handle concurrent profile edits from multiple devices? → Last-write-wins with updated_at timestamp, optimistic updates with rollback on conflict

---

### User Story 8: Social Interactions - Following System (Priority: P1) 🎯 MVP

As a user discovering interesting creators, I want to follow them to see their new tracks in my feed and support their work, and I want to see who follows me to understand my audience.

**Why this priority**: Following creates the social graph that powers content discovery and engagement. Without follows, there's no personalized feed, no audience building, and no social proof. This is core to platform growth.

**Independent Test**: Can be tested by creating 2 user accounts, Account A follows Account B via Follow button on profile, Account B receives notification, Account B's follower count increments, Account A's following count increments, Account A unfollows and counts decrement, verify privacy settings (private profiles hide follower list).

**Acceptance Scenarios**:

1. **Given** User A visits User B's profile (public), **When** User A taps the "Follow" button, **Then** button changes to "Following" with haptic feedback, User B's follower count increments immediately (optimistic update), User B receives notification "🎵 @UserA started following you!", and relationship is saved to follows table.

2. **Given** User A is following User B, **When** User A taps "Following" button, **Then** confirmation dialog appears "Unfollow @UserB?", on confirm button changes to "Follow", counts decrement, and User A no longer sees User B's content in feed.

3. **Given** User A has 500 followers, **When** User A taps "500 Followers" on profile, **Then** FollowersList modal opens with virtualized scrollable list showing avatar, display name, bio snippet, and Follow/Following button for each user with search/filter capability.

4. **Given** User A follows Users B, C, D, **When** User A taps "3 Following" on profile, **Then** FollowingList modal opens showing all followed users with option to unfollow directly from list.

5. **Given** User B's profile is set to "Private", **When** User A tries to follow, **Then** User A sees "Request to Follow" button, User B receives follow request notification, User B can approve/deny, only approved follows count toward follower count.

**Edge Cases**:
- Can user follow themselves? → No, Follow button hidden on own profile
- What if user follows/unfollows rapidly (spam)? → Rate limit: max 30 follows per hour, cooldown message shown
- How does system handle deleted user in follows table? → CASCADE delete removes all follow relationships automatically
- What happens to activity feed after unfollow? → Previous activities remain visible but new ones don't appear

---

### User Story 9: Social Interactions - Comments & Threading (Priority: P1)

As a user listening to tracks, I want to leave comments and reply to other comments to engage in discussions about the music, provide feedback to creators, and build community.

**Why this priority**: Comments are the primary engagement mechanism on content platforms. They drive user interaction, provide value to creators (feedback), and increase time-on-platform. Essential for community building.

**Independent Test**: Can be tested by opening a public track, posting top-level comment, seeing it appear immediately via real-time subscription, posting reply to comment (nested thread), editing/deleting own comment, viewing comment from another user, liking comments, reporting inappropriate comment, and verifying moderation (profanity filter, rate limit).

**Acceptance Scenarios**:

1. **Given** a user is viewing a public track, **When** they type a comment in the input field and tap "Post", **Then** comment appears immediately below the track (optimistic update + real-time), character count shows "0/1000", and track owner receives notification "💬 @username commented on [Track Name]".

2. **Given** a user sees an existing comment, **When** they tap "Reply", **Then** CommentForm opens with @username prefilled, user types reply, on submit reply appears nested under parent comment (thread view), and parent comment's reply_count increments.

3. **Given** a user types "@john" in comment field, **When** they continue typing, **Then** mention autocomplete dropdown appears showing users matching "john" (search by username/display_name), user selects from list, mention is inserted as highlighted text, on submit mentioned user receives notification "👤 @commenter mentioned you in a comment".

4. **Given** a user posted a comment 2 minutes ago, **When** they tap the "•••" menu on their comment, **Then** options appear: "Edit", "Delete". On Edit: input reopens with existing text, on save comment shows "(edited)" label. On Delete: confirmation dialog appears, on confirm comment is removed and reply_count of parent decrements.

5. **Given** multiple users are viewing the same track, **When** User A posts a comment, **Then** all viewers see the new comment appear in real-time (Supabase subscription) without page refresh, with smooth slide-in animation.

6. **Given** a user attempts to post profanity or spam, **When** they submit the comment, **Then** client-side filter detects and rejects with error "Please keep comments respectful", or if bypassed, server-side moderation flags it, marks as `is_moderated = true`, and hides from public view with "This comment has been removed" placeholder.

**Edge Cases**:
- What if comment thread is 100+ levels deep? → Flatten threads after 5 levels, show "View parent thread" link
- How does delete handle replies? → Soft delete: replace content with "[Deleted]", preserve structure for replies
- What if user posts duplicate comment? → Reject if exact match within 60 seconds from same user
- How does system handle mentions of private users? → Mention allowed but no notification sent, clicking mention shows "User not found or private"

---

### User Story 10: Social Interactions - Likes & Engagement (Priority: P2)

As a user discovering tracks, I want to like tracks and comments to show appreciation, save favorites, and provide feedback to creators about what resonates with me.

**Why this priority**: Likes are low-friction engagement that drives dopamine loops, provides social proof, and helps algorithms surface popular content. While not blocking, significantly impacts user retention and creator satisfaction.

**Independent Test**: Can be tested by liking a track (button animates, count increments), unliking (count decrements), viewing liked tracks in profile section "Liked Tracks" (filtered library), liking comments, and verifying track owner receives notification for track likes.

**Acceptance Scenarios**:

1. **Given** a user is viewing a track card, **When** they tap the heart icon, **Then** heart fills with red color and scale animation, likes count increments immediately (optimistic update), like is saved to track_likes table, and track owner receives notification "❤️ @username liked [Track Name]" (batched: max 1 notification per user per track).

2. **Given** a user has liked a track, **When** they tap the heart icon again, **Then** heart animates to outline, likes count decrements, record removed from track_likes table, and like is reflected in profile stats.

3. **Given** a user has liked 50 tracks, **When** they navigate to Profile → "Liked Tracks" tab, **Then** they see all liked tracks in reverse chronological order (most recently liked first) with infinite scroll, and can play/share/add to playlist directly from liked list.

4. **Given** a user is viewing comments on a track, **When** they tap the like icon on a comment, **Then** icon fills, comment's likes_count increments, commenter receives notification "❤️ @username liked your comment" (rate limited: max 1 notification per hour for comment likes).

5. **Given** a track has 1000+ likes, **When** viewing the track, **Then** likes display as "1K likes" (formatted), tapping count opens modal showing recent likers (avatar + name), infinite scroll to load more, and option to follow users from list.

**Edge Cases**:
- Can user like their own track/comment? → Yes, no restriction (common pattern on social platforms)
- What if user likes/unlikes rapidly? → Debounce on client (500ms), optimistic updates prevent UI jank
- How does deleted track affect track_likes? → CASCADE delete removes all likes automatically
- What happens to liked tracks if user makes track private? → Still visible in own "Liked Tracks" but not to other users

---

### User Story 11: Activity Feed & Discovery (Priority: P2)

As a user following creators, I want to see an activity feed showing their new tracks, likes, and milestones so I stay updated on their work and discover new music from my network.

**Why this priority**: Activity feed is the content discovery engine that keeps users engaged. It provides personalized content based on social graph. While P2 (can ship without), significantly increases daily active users and session duration.

**Independent Test**: Can be tested by User A following Users B, C, D, then Users B/C/D performing actions (publish track, like track, create playlist), User A refreshes activity feed and sees timestamped activities from followed users in chronological order, real-time updates as new activities occur, infinite scroll for older activities.

**Acceptance Scenarios**:

1. **Given** User A follows 10 creators, **When** User A opens the Activity feed page, **Then** they see a scrollable list of recent activities from followed users (last 7 days): "🎵 @UserB published a new track: [Track Name]", "❤️ @UserC liked [Track Name] by @UserD", "📁 @UserB created playlist: [Playlist Name]", sorted by created_at DESC with relative timestamps ("2 hours ago").

2. **Given** User A is viewing activity feed, **When** User B (whom User A follows) publishes a new track, **Then** new activity appears at top of feed in real-time (Supabase subscription) with slide-down animation and brief highlight effect (3s).

3. **Given** User A has scrolled through 100 activities, **When** they scroll to bottom, **Then** next 50 activities load automatically (infinite scroll with react-virtuoso), loading skeleton shown during fetch, and "No more activities" message appears when reaching end.

4. **Given** User A taps on an activity, **When** activity is "track published", **Then** navigates to track detail page. When activity is "track liked", navigates to track with highlight on like button. When activity is "playlist created", opens playlist view.

5. **Given** User A's activity feed is empty (no follows), **When** viewing feed, **Then** empty state shows: "Follow creators to see their activities here" with "Discover Creators" button that navigates to curated creator list or search.

**Edge Cases**:
- What if user follows 1000+ people (very active feed)? → Pagination handles it, consider "Top Activities" algorithm to surface best content
- How far back does feed go? → 30 days, older activities archived (separate "View Archive" option)
- What if followed user deletes track that's in activity? → Activity remains but shows "[Track Deleted]" with disabled link
- How does activity feed handle rapid updates (spam)? → Rate limit on activity creation: max 1 activity per action type per user per 5 minutes

---

### User Story 12: Notifications System (Priority: P2)

As a user engaging with the platform, I want to receive notifications for social interactions (comments, likes, follows, mentions) so I stay informed and can respond to engagement on my content.

**Why this priority**: Notifications drive re-engagement and retention. Users return when notified of activity. While P2 (platform works without), critical for long-term growth and user loyalty.

**Independent Test**: Can be tested by User B performing actions on User A's content (comment, like, follow), User A receives notification in app (badge on bell icon), tapping notification navigates to relevant content, marking as read updates badge count, viewing notification list shows all recent notifications with filters (All/Unread/Mentions).

**Acceptance Scenarios**:

1. **Given** User A has new unread notifications, **When** viewing any page, **Then** notification bell icon in top bar shows red badge with count (e.g., "3"), badge bounces briefly when new notification arrives (real-time), and tapping bell opens NotificationList dropdown.

2. **Given** User A opens NotificationList, **When** viewing list, **Then** they see notifications grouped by type with icons: "💬 @UserB commented on [Track Name] • 2 hours ago", "❤️ @UserC liked [Track Name] • 5 hours ago", "🎵 @UserD started following you • 1 day ago", with unread notifications shown in bold and read ones with reduced opacity.

3. **Given** User A has an unread mention notification, **When** they tap "👤 @UserB mentioned you in a comment", **Then** app navigates to track comments section, scrolls to specific comment with @UserA mention highlighted, notification is marked as read (badge decrements), and Telegram bot also sent message "👤 @UserB mentioned you: [comment preview]" with deep link.

4. **Given** User A has 50+ notifications, **When** viewing NotificationList, **Then** notifications load in batches (20 per load) with infinite scroll, filter tabs appear at top ("All • Unread • Mentions • Likes"), tapping "Mark all as read" button clears badge.

5. **Given** User A wants to customize notifications, **When** they navigate to Settings → Notifications, **Then** they see toggles for each notification type: "Comments on my tracks" (on), "Replies to my comments" (on), "Mentions" (on), "New followers" (on), "Likes on my tracks" (off), "Likes on my comments" (off), and changes save immediately.

**Edge Cases**:
- What if user receives 100 notifications in 1 minute? → Batch similar notifications: "❤️ 10 users liked [Track Name]" instead of 10 separate
- How long are notifications stored? → 30 days, then archived (can view in "Notification History" page)
- What if notification refers to deleted content? → Show notification but disable link, gray out with "(deleted)" label
- How does notification system handle offline users? → Store in database, deliver when user returns, also send via Telegram bot if enabled

---

### User Story 13: Privacy & Content Moderation (Priority: P3)

As a platform user, I want privacy controls for my profile and content moderation for comments to ensure a safe and respectful community environment.

**Why this priority**: Privacy and safety are essential for user trust but can be incrementally improved. Basic privacy (public/private profiles) should be in P1, advanced controls (block users, mute, report) can be P3. Moderation prevents platform toxicity.

**Independent Test**: Can be tested by setting profile to private, verifying followers-only can see content, blocking a user (they can't comment/follow), reporting inappropriate comment, admin reviewing report in moderation dashboard, flagged comment hidden from public view.

**Acceptance Scenarios**:

1. **Given** User A wants privacy, **When** they navigate to Settings → Privacy, **Then** they see options: Profile visibility (Public/Followers Only/Private), Track visibility (Inherit/Public/Private per track), Comment permissions (Everyone/Followers/Off), Show activity (On/Off), and changes take effect immediately.

2. **Given** User A encounters User B posting spam, **When** User A taps "•••" on User B's comment → "Report", **Then** report modal opens with reasons: "Spam", "Harassment", "Inappropriate content", "Other", User A selects reason and submits, report is logged in moderation queue, and User A sees "Thank you for reporting. We'll review this within 24 hours."

3. **Given** User A is annoyed by User B, **When** User A navigates to User B's profile → "•••" → "Block User", **Then** confirmation appears "Block @UserB? They won't be able to follow you, comment on your tracks, or see your profile", on confirm User B is added to blocked_users table, existing follows are removed, and User B sees "User not found" when trying to access User A's profile.

4. **Given** admin reviews reported comment, **When** admin confirms violation, **Then** comment is marked as `is_moderated = true` (hidden from public), commenter receives warning notification, repeat violations (3 strikes) result in 24-hour comment ban, ban status stored in user_moderation table.

5. **Given** profanity filter detects inappropriate word, **When** user submits comment, **Then** client-side validation rejects with "Please keep comments respectful" and highlights problematic word, user can edit and resubmit, server-side also validates as backup.

**Edge Cases**:
- What if user reports 100 comments in 1 hour (abuse)? → Rate limit: max 10 reports per hour per user
- How does blocking affect existing comments? → Comments remain visible but marked "[Blocked User]", no new interactions
- What if admin accidentally moderates wrong comment? → Admin dashboard has "Restore" button, restores comment and removes moderation flag
- How does system handle false positives in profanity filter? → Whitelist common false positives (e.g., "Scunthorpe problem"), appeal process for users

---

## Edge Cases (Cross-Story)

### Data Integrity
- **What happens when user deletes account?** → Cascade delete profile, soft delete comments (replace with "[Deleted User]"), remove from follows, transfer track ownership or anonymize, notifications remain but user reference nullified.

- **How does system handle race conditions in follower counts?** → Use database triggers to update counts atomically, optimistic UI updates with eventual consistency, conflict resolution via database constraints (UNIQUE on follows table).

### Performance at Scale
- **What if activity feed query spans 10K+ activities?** → Index on (user_id, created_at), cursor-based pagination, consider materialized view for frequently accessed feeds, cache in Redis for premium users.

- **How does real-time scale with 10K concurrent users?** → Supabase handles 200 connections free tier, use connection pooling, fall back to polling for non-critical updates, upgrade to paid tier ($25/mo for unlimited).

### UX Edge Cases
- **What if user's display name is emoji-only?** → Allow but require minimum 1 alphanumeric character for searchability, max 50 characters (can be emojis).

- **How does mention autocomplete handle 1000+ users with similar names?** → Limit search results to 10 most relevant (fuzzy match + follower count as ranking), show "View all results" to open full search.

- **What happens if user follows then immediately unfollows?** → Both actions complete, activity record created for follow is marked as reversed (not shown in feed), notification sent but marked as obsolete if unfollow within 5 seconds.

## Requirements

### Functional Requirements

#### FR-S001: Profile Management
- System MUST allow users to set display name (1-50 chars), bio (0-500 chars), avatar (image, max 5MB), banner (image, max 10MB)
- System MUST validate avatar/banner as valid image formats (JPEG, PNG, WebP)
- System MUST store images in Supabase Storage with CDN URLs
- System MUST display profile stats: followers, following, tracks, likes
- System MUST support social links (Instagram, Twitter, SoundCloud, YouTube) with URL validation
- System MUST provide verification badge for verified artists (admin-controlled)

#### FR-S002: Following System
- System MUST allow user to follow/unfollow other users via button on profile
- System MUST prevent self-follows (constraint: follower_id != following_id)
- System MUST update follower/following counts via database triggers (atomic)
- System MUST send notification to followed user in real-time
- System MUST support follow requests for private profiles (approve/deny flow)
- System MUST display followers/following lists with virtualized scrolling (1000+ users)
- System MUST rate limit follows (max 30 per hour per user)

#### FR-S003: Comment System
- System MUST allow users to comment on public tracks (max 1000 chars)
- System MUST support comment threading (replies) with parent_comment_id
- System MUST support @ mentions with autocomplete from followers/following
- System MUST send notification to mentioned users
- System MUST allow users to edit/delete own comments
- System MUST show "(edited)" label on edited comments
- System MUST support soft delete (replace content with "[Deleted]" if replies exist)
- System MUST implement profanity filter (client + server)
- System MUST rate limit comments (max 10 per minute per user)
- System MUST update comment counts (track, parent comment) via triggers

#### FR-S004: Likes System
- System MUST allow users to like tracks and comments
- System MUST prevent duplicate likes (UNIQUE constraint on user+entity)
- System MUST update like counts via database triggers (atomic)
- System MUST support optimistic UI updates with rollback on failure
- System MUST send notification to content owner (batched: max 1 per user per track)
- System MUST display list of users who liked content (infinite scroll)

#### FR-S005: Activity Feed
- System MUST aggregate activities from followed users (track published, liked, playlist created)
- System MUST order activities by created_at DESC with pagination (50 per page)
- System MUST update feed in real-time via Supabase subscriptions
- System MUST support infinite scroll with react-virtuoso
- System MUST show activities from last 30 days (archive older)
- System MUST deduplicate similar activities (e.g., user liked 5 tracks → 1 activity)

#### FR-S006: Notifications
- System MUST create notifications for: new comment, comment reply, mention, follow, like (configurable)
- System MUST display unread count badge on notification bell icon
- System MUST mark notifications as read when viewed
- System MUST support notification filtering (All/Unread/Mentions)
- System MUST batch similar notifications ("10 users liked your track")
- System MUST send Telegram bot notifications for critical events (mention, comment on my track)
- System MUST respect user notification preferences (per-type toggle)
- System MUST auto-archive notifications after 30 days

#### FR-S007: Privacy & Moderation
- System MUST support profile privacy levels (Public, Followers Only, Private)
- System MUST enforce privacy via RLS policies on profiles, tracks, comments
- System MUST allow users to report comments with reason
- System MUST provide admin moderation dashboard to review reports
- System MUST hide moderated comments (is_moderated flag)
- System MUST support user blocking (block list, prevents follow/comment)
- System MUST implement content filters (profanity, spam detection)
- System MUST apply rate limits (comments, follows, reports)

### Non-Functional Requirements

#### NFR-S001: Performance
- Profile page load time MUST be <2 seconds on 3G networks
- Real-time comment updates MUST appear within 1 second of submission
- Follower/following lists MUST render smoothly with 60fps (virtualized)
- Activity feed MUST support infinite scroll without frame drops
- Database queries MUST complete within 100ms at p95 (proper indexes)

#### NFR-S002: Scalability
- System MUST support 10K+ concurrent users on activity feed
- System MUST handle 1000+ comments per track without degradation
- System MUST scale follower counts to 100K+ per user
- Supabase real-time MUST handle 200+ concurrent connections (free tier) or scale to paid tier

#### NFR-S003: Security
- All user inputs MUST be sanitized (XSS prevention)
- RLS policies MUST enforce privacy at database level
- Uploaded images MUST be validated and scanned for malware
- API endpoints MUST be rate limited (per user, per IP)
- Sensitive actions (block, report) MUST be logged for audit

#### NFR-S004: Reliability
- Social features MUST maintain 99.5% uptime
- Failed follow/like actions MUST be retried or show clear error
- Real-time subscriptions MUST have fallback to polling if disconnected
- Data integrity MUST be maintained via database constraints and triggers

## Success Criteria

### Measurable Outcomes

#### Phase 1: Profile & Following (Week 1)
- **SC-S001**: 100% of users can create/edit profile with avatar, bio, social links
- **SC-S002**: Profile page loads in <2s on 3G (Lighthouse test)
- **SC-S003**: Follow/unfollow actions complete within 500ms (p95)
- **SC-S004**: 30% of active users follow at least 1 other user within first 7 days
- **SC-S005**: 60% of users complete profile (add bio + avatar) within 14 days

#### Phase 2: Comments & Engagement (Week 2)
- **SC-S006**: 100% of users can comment on public tracks with real-time updates
- **SC-S007**: Comment threads support 5+ levels of nesting without UI breaks
- **SC-S008**: 20% of users leave at least 1 comment within first 7 days
- **SC-S009**: 50% of users like at least 1 track within first 7 days
- **SC-S010**: Profanity filter catches >95% of inappropriate content (tested corpus)

#### Phase 3: Activity Feed & Notifications (Week 2)
- **SC-S011**: Activity feed loads and scrolls smoothly with 1000+ activities
- **SC-S012**: Real-time activity updates appear within 1 second (measured via timestamp)
- **SC-S013**: 70% of users check notifications at least once per session
- **SC-S014**: Notification click-through rate >40% (tap notification → view content)
- **SC-S015**: <5% of users report notification spam (too frequent)

#### Business Impact (30 days post-launch)
- **SC-S016**: 30-day user retention increases by 15% (baseline: current retention rate)
- **SC-S017**: Average session duration increases by 25% (social engagement drives time-on-platform)
- **SC-S018**: New user signups increase by 20% (social proof + discovery)
- **SC-S019**: Daily Active Users (DAU) increases by 30% (notifications drive re-engagement)
- **SC-S020**: <1% of comments are moderated (indicates healthy community)

#### Technical Metrics
- **SC-S021**: Zero data integrity errors in follows, likes, comments (database constraints working)
- **SC-S022**: API error rate <0.1% for social endpoints
- **SC-S023**: Real-time subscription disconnect rate <2%
- **SC-S024**: 100% of RLS policies tested and verified (no data leaks)

## Assumptions

- **User Behavior**: Users are willing to share profile information publicly (photo, bio, social links)
- **Growth Rate**: Platform has sufficient user base (500+ active users) to make social features valuable
- **Content Quality**: Majority of users will post respectful comments (profanity filter handles outliers)
- **Technical**: Supabase free tier supports 200 concurrent real-time connections (upgrade if exceeded)
- **Mobile First**: 80%+ of users access via Telegram Mini App on mobile devices
- **Network**: Users have at least 3G connection (platform works offline-first where possible)
- **Localization**: Initial implementation supports English and Russian (existing platform languages)
- **Moderation**: Manual moderation by admins available within 24 hours of report submission

## Dependencies

### Internal Dependencies
- **Existing Auth System**: Requires stable Supabase auth with user_id
- **Tracks System**: Comments depend on public tracks being viewable
- **Telegram Bot**: Notifications leverage existing bot for push delivery
- **Storage**: Profile images require Supabase Storage configured
- **Real-time**: Activity feed requires Supabase real-time subscriptions working

### External Dependencies
- **Supabase**: API uptime, real-time service, storage availability
- **Telegram**: Mini App API, bot message delivery, deep linking
- **CDN**: Fast image delivery for avatars/banners (Supabase CDN)

### Blocking Dependencies
- **BLOCKER**: Database migrations must complete before any social feature development
- **BLOCKER**: RLS policies must be tested and deployed before real user data
- **CRITICAL**: Image upload and storage must be working for profile avatars/banners

## Risks & Mitigation

### High Priority Risks

**Risk S-1: Real-time Scalability Issues**
- **Impact**: Activity feed and notifications lag or fail at scale
- **Probability**: Medium (30%)
- **Mitigation**: Connection pooling, fallback to polling, paginate real-time events, monitor connection count, upgrade Supabase tier if approaching 200 connections
- **Detection**: Monitor Supabase dashboard for connection count, latency metrics

**Risk S-2: Content Moderation Gaps**
- **Impact**: Spam, harassment, inappropriate content damages community
- **Probability**: Medium (35%)
- **Mitigation**: Multi-layer filtering (client + server), report system, rate limiting, admin dashboard for quick response, clear community guidelines
- **Detection**: Track report volume, moderation queue size, user complaints

**Risk S-3: Privacy Policy Violations**
- **Impact**: Data leaks, unauthorized access to private profiles/content
- **Probability**: Low (15%)
- **Mitigation**: Comprehensive RLS policies tested in CI, security audit before launch, penetration testing, clear privacy settings UI
- **Detection**: Automated RLS policy tests, manual security review, user reports

### Medium Priority Risks

**Risk S-4: Database Performance Degradation**
- **Impact**: Slow queries on follows, comments, activity feed
- **Probability**: Medium (25%)
- **Mitigation**: Comprehensive indexes on all foreign keys and sort columns, query optimization with EXPLAIN, connection pooling, consider materialized views for expensive aggregations
- **Detection**: Monitor pg_stat_statements, query execution times, Supabase dashboard

**Risk S-5: Image Upload Failures**
- **Impact**: Users can't set avatars/banners, poor UX
- **Probability**: Low (20%)
- **Mitigation**: Client-side validation (file size, type), chunked upload for large files, retry logic, clear error messages, fallback to default avatars
- **Detection**: Monitor upload success rate, error logs, user complaints

**Risk S-6: Notification Fatigue**
- **Impact**: Users disable notifications, miss important updates
- **Probability**: Medium (30%)
- **Mitigation**: Batching similar notifications, sensible defaults (only critical notifications enabled), easy opt-out per type, daily digest option
- **Detection**: Track notification settings changes, opt-out rate, user feedback

## Out of Scope (Future Sprints)

### Sprint 012+ Features
- Direct messaging between users
- Collaborative projects/tracks (multiple users editing)
- User badges and achievements system
- Advanced search (users, tags, genres)
- Trending tracks algorithm (time-weighted popularity)
- Content recommendations based on social graph
- Groups/Communities feature
- Creator analytics dashboard

### Long-term Features
- Live collaboration sessions (real-time co-editing)
- Creator monetization tools (tips, subscriptions)
- NFT integration for tracks
- Third-party integrations (Spotify, Apple Music)
- Mobile push notifications (native apps)
- Video comments/reactions
- AI-powered content moderation

## Acceptance Criteria Summary

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
