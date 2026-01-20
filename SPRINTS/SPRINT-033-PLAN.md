# Sprint 033: Integration & Metrics

**Dates:** January 20-27, 2026 (1 week sprint)
**Status:** Active
**Focus:** Integrate Sprint 32 components and measure impact

---

## 🎯 Sprint Goals

### Primary Objectives
1. ✅ Integrate all Sprint 32 components into existing pages
2. ✅ Add analytics tracking for new user flows
3. ✅ Create metrics dashboard for real-time monitoring
4. ✅ Measure impact on key metrics (bounce rate, engagement, retention)

### Success Metrics
| Metric | Before | Target (1 week) | Target (2 weeks) |
|--------|--------|-----------------|------------------|
| First Generation Conversion | 15% | 20% | 25% |
| Comment Rate | 0% | 2% | 5% |
| Error Recovery Rate | 40% | 55% | 70% |
| Session Duration | 4.3 min | 4.8 min | 5.5 min |

---

## 📋 Sprint Backlog

### Phase 1: Integration (Days 1-3)

#### Task 1: Apply Index.tsx Patch (4 hours)
**Priority:** P0 | **Owner:** Frontend

**Description:**
Apply the integration patch to add Sprint 32 components to the homepage.

**Acceptance Criteria:**
- [ ] Import `PersonalizedRecommendations`, `ContinueCreatingCTA`, `useFirstGeneratedTrack`
- [ ] Add `useFirstGeneratedTrack` hook
- [ ] Show `<PersonalizedRecommendations>` after first generation
- [ ] Show `<ContinueCreatingCTA>` after track finishes
- [ ] Replace `HeroSkeleton` with enhanced version
- [ ] Test all new components on homepage
- [ ] No TypeScript errors
- [ ] No ESLint errors

**Files:**
- `src/pages/Index.tsx`

**Dependencies:**
- `src/hooks/useFirstGeneratedTrack.ts` ✅ Created
- `src/components/discovery/PersonalizedRecommendations.tsx` ✅ Created
- `src/components/generation/ContinueCreatingCTA.tsx` ✅ Created

---

#### Task 2: Apply Library.tsx Patch (3 hours)
**Priority:** P0 | **Owner:** Frontend

**Description:**
Apply the integration patch to add Sprint 32 components to the library page.

**Acceptance Criteria:**
- [ ] Import new skeleton components
- [ ] Replace existing skeletons with enhanced versions
- [ ] Add `<ContinueCreatingCTA>` for active track
- [ ] Update `GeneratingTrackSkeleton` usage
- [ ] Test loading states
- [ ] No TypeScript errors
- [ ] No ESLint errors

**Files:**
- `src/pages/Library.tsx`

**Dependencies:**
- `src/components/ui/skeletons/TrackListSkeleton.tsx` ✅ Created

---

#### Task 3: Apply CommentsList Patch (2 hours)
**Priority:** P0 | **Owner:** Frontend

**Description:**
Apply the integration patch to add Sprint 32 components to comments.

**Acceptance Criteria:**
- [ ] Import `FirstCommentCTA`, `CommentSuggestions`
- [ ] Add `track` prop to `CommentsListProps`
- [ ] Show `<FirstCommentCTA>` when `comments.length === 0`
- [ ] Show `<CommentSuggestions>` above form
- [ ] Use `CommentsSectionSkeleton` for loading
- [ ] Test comment flow
- [ ] No TypeScript errors
- [ ] No ESLint errors

**Files:**
- `src/components/comments/CommentsList.tsx`

**Dependencies:**
- `src/components/comments/FirstCommentCTA.tsx` ✅ Created
- `src/components/comments/CommentSuggestions.tsx` ✅ Created

---

#### Task 4: Integrate Error Handling (3 hours)
**Priority:** P0 | **Owner:** Frontend

**Description:**
Integrate enhanced error handling and automatic retry into generation flow.

**Acceptance Criteria:**
- [ ] Import `mapSunoError`, `useAutomaticRetry`
- [ ] Wrap generation API calls in `retry()` function
- [ ] Show `UserFriendlyError` on error
- [ ] Automatic retry for retryable errors
- [ ] Track retry attempts in analytics
- [ ] Test error scenarios (rate limit, network, etc.)
- [ ] No TypeScript errors

**Files:**
- `src/hooks/generation/useGenerateForm.ts`
- `src/hooks/generation/useGenerationWithErrorHandling.ts` ✅ Created

**Dependencies:**
- `src/lib/suno-error-mapper.ts` ✅ Created
- `src/hooks/useAutomaticRetry.ts` ✅ Created
- `src/components/errors/UserFriendlyError.tsx` ✅ Created

---

### Phase 2: Analytics (Days 4-5)

#### Task 5: Create Metrics Dashboard (6 hours)
**Priority:** P1 | **Owner:** Fullstack

**Description:**
Create a real-time metrics dashboard for tracking key performance indicators.

**Acceptance Criteria:**
- [ ] Create dashboard page at `/admin/metrics`
- [ ] Display real-time metrics:
  - First generation conversion funnel
  - Comment submission rate
  - Error recovery rate
  - Continue creating rate
- [ ] Show trends over time (last 7 days, 30 days)
- [ - Export metrics as CSV
- [ ] Role-based access (admin only)
- [ ] Responsive design (mobile + desktop)
- [ ] Auto-refresh every 30s

**Files:**
- `src/pages/admin/MetricsDashboard.tsx` (new)
- `supabase/functions/analytics-dashboard/` (new)
- `src/components/admin/MetricCard.tsx` (new)
- `src/components/admin/MetricsChart.tsx` (new)

**Database Schema:**
```sql
-- Add analytics_events table if not exists
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id UUID,
  properties JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_event_name (event_name),
  INDEX idx_timestamp (timestamp),
  INDEX idx_user_id (user_id)
);

-- Add daily_aggregates table for pre-computed metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  date DATE PRIMARY KEY,
  new_users INTEGER DEFAULT 0,
  first_generations INTEGER DEFAULT 0,
  comments_submitted INTEGER DEFAULT 0,
  continue_creating INTEGER DEFAULT 0,
  error_retries INTEGER DEFAULT 0,
  payment_conversions INTEGER DEFAULT 0
);
```

---

#### Task 6: Add Analytics Events (4 hours)
**Priority:** P1 | **Owner:** Frontend

**Description:**
Add analytics tracking to all Sprint 32 components (already added in code, just verify).

**Acceptance Criteria:**
- [ ] Verify `quick_start_tapped` event exists
- [ ] Verify `first_comment_cta_*` events exist
- [ ] Verify `comment_suggestion_used` event exists
- [ ] Verify `recommendation_clicked` event exists
- [ ] Verify `continue_creating_tapped` event exists
- [ ] Verify `generation_retry_*` events exist
- [ ] Test that events fire correctly
- [ ] Verify events appear in dashboard

**Events to Track:**
```typescript
// Quick start
'quick_start_tapped'

// First comment CTA
'first_comment_cta_shown'
'first_comment_cta_tapped'
'first_comment_cta_dismissed'

// Comment suggestions
'comment_suggestion_used'

// Recommendations
'recommendation_clicked'
'create_similar_tapped'
'explore_more_tapped'

// Continue creating
'continue_creating_tapped'
'track_finished_playing'

// Errors
'generation_retry_attempt'
'generation_retry_success'
'generation_retry_failed'
'error_shown'
'error_action_taken'
```

---

### Phase 3: Testing & Deployment (Days 6-7)

#### Task 7: Manual Testing (4 hours)
**Priority:** P1 | **Owner:** QA

**Test Scenarios:**
1. **First Generation Flow:**
   - Open app as new user
   - Click "Создать первый трек"
   - Fill form and generate
   - Wait for completion
   - Verify `<PersonalizedRecommendations>` appears
   - Verify `<ContinueCreatingCTA>` appears after playback

2. **Error Recovery Flow:**
   - Force rate limit error
   - Verify `UserFriendlyError` appears
   - Verify automatic retry triggers
   - Verify success after retry

3. **Comment Engagement Flow:**
   - Open track without comments
   - Verify `<FirstCommentCTA>` appears
   - Click comment button
   - Verify `<CommentSuggestions>` appears
   - Select suggestion
   - Submit comment
   - Verify comment appears

4. **Skeleton Loading States:**
   - Navigate to Library
   - Verify skeleton loaders appear
   - Wait for content to load
   - Verify smooth transition

5. **Mobile Testing:**
   - Test all flows on mobile device
   - Verify touch targets are adequate
   - Verify haptic feedback works

---

#### Task 8: Code Review & Deploy (3 hours)
**Priority:** P1 | **Owner:** Tech Lead

**Checklist:**
- [ ] Review all integration patches
- [ ] Review new components (Sprint 32)
- [ ] Review analytics events
- [ ] Review metrics dashboard
- [ ] TypeScript checks pass
- [ ] ESLint checks pass
- [ ] Bundle size within limits
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ - Deploy to production
- [ ] Monitor metrics for 24 hours

---

## 📊 Success Metrics

### Week 1 Targets

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|---------------------|
| First Generation Conversion | 15% | 20% | Analytics funnel |
| Comment Rate | 0% | 2% | Comments / tracks |
| Error Recovery Rate | 40% | 55% | Retry success / total retries |
| Session Duration | 4.3 min | 4.8 min | Average session length |

### Week 2 Targets (stretch)

| Metric | Target | Measurement Method |
|--------|--------|---------------------|
| First Generation Conversion | 25% | Analytics funnel |
| Comment Rate | 5% | Comments / tracks |
| Error Recovery Rate | 70% | Retry success / total retries |
| Session Duration | 5.5 min | Average session length |

---

## 🚀 Quick Start (Day 1)

### Immediate Actions

1. **Review Integration Patches** (30 min)
   - Read `SPRINTS/INTEGRATION_PATCH_Index.md`
   - Read `SPRINTS/INTEGRATION_PATCH_Library.md`
   - Read `SPRINTS/INTEGRATION_PATCH_CommentsList.md`

2. **Apply Index.tsx Patch** (1 hour)
   ```bash
   # Backup original
   cp src/pages/Index.tsx src/pages/Index.tsx.backup

   # Apply patch manually (see INTEGRATION_PATCH_Index.md)
   # Or use git apply if patch file is created
   ```

3. **Apply Library.tsx Patch** (45 min)
   ```bash
   cp src/pages/Library.tsx src/pages/Library.tsx.backup
   # Apply patch (see INTEGRATION_PATCH_Library.md)
   ```

4. **Apply CommentsList Patch** (30 min)
   ```bash
   cp src/components/comments/CommentsList.tsx src/components/comments/CommentsList.tsx.backup
   # Apply patch (see INTEGRATION_PATCH_CommentsList.md)
   ```

5. **Test Changes** (1 hour)
   ```bash
   npm run dev
   # Manual test all new features
   ```

---

## 📋 Daily Standup Format

**When:** Daily at 10:00 AM (15 minutes)
**Format:**
1. What I completed yesterday
2. What I'm working on today
3. Blockers (if any)

**Sprint Board:**

| Task | Owner | Status |
|------|-------|--------|
| Index.tsx Integration | Frontend | 🔄 In Progress |
| Library.tsx Integration | Frontend | ⏳ To Do |
| CommentsList Integration | Frontend | ⏳ To Do |
| Error Handling Integration | Frontend | ⏳ To Do |
| Metrics Dashboard | Fullstack | ⏳ To Do |
| Analytics Events Verification | Frontend | ⏳ To Do |
| Manual Testing | QA | ⏳ To Do |
| Code Review & Deploy | Tech Lead | ⏳ To Do |

---

## 🎯 Definition of Done

Sprint is complete when:
- [ ] All integration patches applied
- [ ] All components tested manually
- [ ] Analytics dashboard deployed
- [ ] Metrics dashboard accessible
- [ ] Code review approved
- [ | Deployed to production
- [ ] Metrics stable for 24 hours

---

## 📚 Related Documents

- [Sprint 032 Final Report](SPRINTS/completed/SPRINT-032-FINAL-REPORT.md)
- [Integration Patches](SPRINTS/INTEGRATION_PATCH_Index.md)
- [Future Work Plan 2026](SPRINTS/FUTURE_WORK_PLAN_2026.md)
- [PROJECT_STATUS.md](../PROJECT_STATUS.md)

---

**Last Updated:** 2026-01-20
**Sprint Master:** Claude Code
**Product Owner:** [To be assigned]
