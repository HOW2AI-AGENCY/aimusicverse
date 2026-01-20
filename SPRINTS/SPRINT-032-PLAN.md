# Sprint 032: UX Improvements & Engagement

**Dates:** January 20 - February 2, 2026 (2 weeks)
**Status:** Active
**Focus:** Priority 1 - Critical UX Improvements

---

## 🎯 Sprint Goals

### Primary Objectives
1. ✅ Reduce Bounce Rate: 72% → <50%
2. ✅ Reduce Generation Failure: 16% → <8%
3. ✅ Increase Social Engagement: 14 likes/week → 50+ likes/week
4. ✅ Improve First-Time User Experience: 2-click path to generation

### Success Metrics
| Metric | Current | Target (2 weeks) |
|--------|---------|------------------|
| Bounce Rate | 72% | <60% |
| First Generation Conversion | 15% | 30% |
| Avg Time to First Generation | 90s | 30s |
| Comments per New Track | 0 | 5+ |
| Error Recovery Rate | 40% | 70% |

---

## 📋 Sprint Backlog

### Phase 1: Quick Start Flow (Days 1-3)

#### US-001: Quick Start Button - 1-Click Generation
**Priority:** P1 | **Story Points:** 5 | **Owner:** Frontend

**Description:**
As a new user, I want to start generating music with a single tap, so I can experience the value immediately.

**Acceptance Criteria:**
- [ ] Hero section has prominent "Create Music" button
- [ ] Clicking immediately starts generation with sensible defaults
- [ ] Shows generation progress overlay
- [ ] Opens result sheet when complete
- [ ] Defaults: pop style, energetic mood, simple prompt
- [ ] Haptic feedback on tap
- [ ] Works offline (queued generation)

**Tasks:**
- [ ] Create `QuickStartButton` component
- [ ] Add `useQuickGeneration` hook with default preset
- [ ] Create generation progress overlay
- [ ] Integrate with `GenerationResultSheet`
- [ ] Add analytics tracking

**Files:**
- `src/components/onboarding/QuickStartButton.tsx` (new)
- `src/hooks/useQuickGeneration.ts` (new)
- `src/components/generate/GenerationProgressOverlay.tsx` (new)

---

#### US-002: Simplified Generation Form
**Priority:** P1 | **Story Points:** 3 | **Owner:** Frontend

**Description:**
As a new user, I want a simple generation form with only essential fields, so I'm not overwhelmed.

**Acceptance Criteria:**
- [ ] Simple mode has only 3 fields: style, mood, description
- [ ] Advanced options hidden behind "Show more"
- [ ] Style dropdown with popular presets (Pop, Rock, Hip-Hop, EDM)
- [ ] Mood selector (Happy, Sad, Energetic, Chill)
- [ ] Description textarea with placeholder examples
- [ ] Character counter for description
- [ ] Validate before enabling generate button

**Tasks:**
- [ ] Create `SimpleGenerateForm` variant
- [ ] Add style/mood preset data
- [ ] Implement collapsible advanced options
- [ ] Add form validation
- [ ] Style for mobile-first

**Files:**
- `src/components/generate-form/SimpleGenerateForm.tsx` (new)
- `src/data/generation-presets.ts` (new)

---

### Phase 2: Error Handling & Recovery (Days 4-6)

#### US-003: User-Friendly Error Messages
**Priority:** P1 | **Story Points:** 5 | **Owner:** Frontend

**Description:**
As a user, I want clear error messages that explain what went wrong and how to fix it.

**Acceptance Criteria:**
- [ ] All Suno API errors mapped to user-friendly messages
- [ ] Error messages include: title, description, actionable next step
- [ ] Error codes: RATE_LIMIT, INVALID_AUDIO, INSUFFICIENT_CREDITS, CONTENT_FILTER, NETWORK_ERROR
- [ ] Retry button for retryable errors
- [ ] Contact support button for unknown errors
- [ ] Error logger captures context for debugging

**Tasks:**
- [ ] Create `suno-error-mapper.ts` utility
- [ ] Define error message constants
- [ ] Create `UserFriendlyError` component
- [ ] Update all generation error handlers
- [ ] Add error logging with context
- [ ] Test all error scenarios

**Files:**
- `src/lib/suno-error-mapper.ts` (new)
- `src/components/errors/UserFriendlyError.tsx` (new)
- `src/lib/error-messages.ts` (new)

**Error Mapping:**
```typescript
const errorMessages = {
  RATE_LIMIT: {
    title: 'Слишком много запросов',
    message: 'Пожалуйста, подождите 2 минуты перед следующей генерацией.',
    action: 'Понятно',
    retryable: true
  },
  INVALID_AUDIO: {
    title: 'Неверный формат аудио',
    message: 'Загрузите аудио в формате MP3 или WAV (макс. 10MB).',
    action: 'Выбрать файл',
    retryable: false
  },
  INSUFFICIENT_CREDITS: {
    title: 'Недостаточно кредитов',
    message: 'Для генерации нужно 5 кредитов. У вас осталось {credits}.',
    action: 'Пополнить баланс',
    retryable: false
  },
  CONTENT_FILTER: {
    title: 'Контент не прошел проверку',
    message: 'Ваш запрос содержит запрещенный контент. Пожалуйста, измените описание.',
    action: 'Изменить',
    retryable: false
  },
  NETWORK_ERROR: {
    title: 'Ошибка соединения',
    message: 'Проверьте подключение к интернету и попробуйте снова.',
    action: 'Повторить',
    retryable: true
  }
};
```

---

#### US-004: Automatic Retry with Backoff
**Priority:** P1 | **Story Points:** 3 | **Owner:** Backend

**Description:**
As a user, I want failed generations to automatically retry, so I don't have to manually restart.

**Acceptance Criteria:**
- [ ] Auto-retry for retryable errors (network, rate limit)
- [ ] Max 3 retries with exponential backoff (1s, 2s, 4s)
- [ ] Show "Retrying..." indicator
- [ ] Notify user after final failure
- [ ] Log retry attempts
- [ ] Disable manual retry during auto-retry

**Tasks:**
- [ ] Create `useAutomaticRetry` hook
- [ ] Implement exponential backoff logic
- [ ] Add retry state to generation store
- [ ] Update UI to show retry status
- [ ] Add retry logging

**Files:**
- `src/hooks/useAutomaticRetry.ts` (new)
- `src/stores/generationStore.ts` (update)

---

### Phase 3: Social Engagement (Days 7-9)

#### US-005: First Comment CTA
**Priority:** P1 | **Story Points:** 3 | **Owner:** Frontend

**Description:**
As a listener, I want to be encouraged to leave the first comment on a track.

**Acceptance Criteria:**
- [ ] Show CTA banner on tracks with 0 comments
- [ ] CTA design: gradient card with avatar
- [ ] Text: "Будьте первым! Оставьте комментарий"
- [ ] Subtitle: "Что вам больше всего понравилось?"
- [ ] Tappable to open comments sheet
- [ ] Dismissible (don't show again if dismissed)
- [ ] Haptic feedback on tap

**Tasks:**
- [ ] Create `FirstCommentCTA` component
- [ ] Add `useHasCommented` hook
- [ ] Integrate into track detail view
- [ ] Add dismissal tracking
- [ ] Style with gradient design
- [ ] Add analytics event

**Files:**
- `src/components/comments/FirstCommentCTA.tsx` (new)
- `src/hooks/useHasCommented.ts` (new)

---

#### US-006: Comment Prompt Suggestions
**Priority:** P2 | **Story Points:** 2 | **Owner:** Frontend

**Description:**
As a commenter, I want suggestion prompts to help me write a comment.

**Acceptance Criteria:**
- [ ] Show 3-4 prompt suggestions above comment input
- [ ] Prompts are context-aware (based on track style)
- [ ] Tappable to insert into comment field
- [ ] Examples: "Отличный бит!", "Люблю мелодию 🎵", "Хочу ремикс!"

**Tasks:**
- [ ] Create `CommentSuggestions` component
- [ ] Define suggestion prompts by genre
- [ ] Add tap-to-insert functionality
- [ ] Track which prompts are used

**Files:**
- `src/components/comments/CommentSuggestions.tsx` (new)
- `src/data/comment-prompts.ts` (new)

---

### Phase 4: Content Discovery (Days 10-12)

#### US-007: Personalized Recommendations
**Priority:** P1 | **Story Points:** 5 | **Owner:** Frontend + ML

**Description:**
As a new user, I want personalized track recommendations after my first generation.

**Acceptance Criteria:**
- [ ] Show "Based on your first track" section after generation
- [ ] Recommend 6-8 similar tracks
- [ ] Similarity based on: style, mood, tags
- [ ] Mix of public content and suggested styles
- [ ] "Create similar" button for each recommendation
- [ ] "Explore more styles" CTA at bottom

**Tasks:**
- [ ] Create `PersonalizedRecommendations` component
- [ ] Implement similarity algorithm (style match)
- [ ] Fetch similar public tracks
- [ ] Add "Create similar" action
- [ ] Track recommendation clicks

**Files:**
- `src/components/discovery/PersonalizedRecommendations.tsx` (new)
- `src/hooks/usePersonalizedRecommendations.ts` (new)
- `src/lib/track-similarity.ts` (new)

**Similarity Algorithm:**
```typescript
const calculateSimilarity = (track: Track, other: Track): number => {
  let score = 0;

  // Style match (40% weight)
  if (track.style === other.style) score += 0.4;

  // Mood match (30% weight)
  if (track.mood === other.mood) score += 0.3;

  // Tag overlap (30% weight)
  const trackTags = new Set(track.tags || []);
  const otherTags = new Set(other.tags || []);
  const overlap = [...trackTags].filter(t => otherTags.has(t)).length;
  const tagScore = overlap / Math.max(trackTags.size, otherTags.size);
  score += tagScore * 0.3;

  return score;
};
```

---

#### US-008: Continue Creating CTA
**Priority:** P2 | **Story Points:** 2 | **Owner:** Frontend

**Description:**
As a user, I want to be encouraged to create more music after listening to my track.

**Acceptance Criteria:**
- [ ] Show "Create more like this" card below track player
- [ ] Pre-fills form with similar settings
- [ ] Shows after track finishes playing
- [ ] One tap to start new generation

**Tasks:**
- [ ] Create `ContinueCreatingCTA` component
- [ ] Detect when track finishes
- [ ] Prefill generation form
- [ ] Track conversion rate

**Files:**
- `src/components/generation/ContinueCreatingCTA.tsx` (new)

---

### Phase 5: Polish & Testing (Days 13-14)

#### US-009: Loading State Improvements
**Priority:** P1 | **Story Points:** 2 | **Owner:** Frontend

**Description:**
As a user, I want better loading states, so the app feels faster.

**Acceptance Criteria:**
- [ ] All lists use skeleton loaders
- [ ] Skeletons match actual content layout
- [ ] Shimmer animation on skeletons
- [ ] Progressive image loading with blur
- [ ] Optimistic UI updates for likes

**Tasks:**
- [ ] Create `TrackListSkeleton` component
- [ ] Add shimmer animation
- [ ] Update all `LazyImage` with blur
- [ ] Add optimistic updates

**Files:**
- `src/components/ui/skeletons/TrackListSkeleton.tsx` (new)
- `src/components/ui/skeletons/LoadingShimmer.tsx` (new)

---

#### US-010: Analytics Integration
**Priority:** P1 | **Story Points:** 3 | **Owner:** Backend

**Description:**
As a product team, we want to track user behavior to measure success.

**Acceptance Criteria:**
- [ ] Track first-generation conversion
- [ ] Track time to first generation
- [ ] Track bounce rate (single page session)
- [ ] Track comment submission rate
- [ ] Track CTA click-through rates
- [ ] Dashboard for metrics

**Events to Track:**
```typescript
// Analytics Events
events = {
  // First-time user
  'quick_start_tapped': { buttonType: 'hero' | 'fab' },
  'first_generation_started': { source: 'quick_start' | 'form' },
  'first_generation_completed': { duration: number, style: string },

  // Engagement
  'comment_cta_shown': { trackId: string },
  'comment_cta_tapped': { trackId: string },
  'comment_submitted': { trackId: string, hasPrompt: boolean },
  'recommendation_clicked': { trackId: string, similarity: number },
  'continue_creating_tapped': { fromTrackId: string },

  // Errors
  'generation_failed': { errorCode: string, retried: boolean },
  'error_shown': { type: string, actionTaken: string }
};
```

**Tasks:**
- [ ] Create `useAnalytics` hook
- [ ] Implement event tracking
- [ ] Set up analytics dashboard
- [ ] Create conversion funnel reports

**Files:**
- `src/lib/analytics.ts` (new)
- `src/hooks/useAnalytics.ts` (new)
- `supabase/functions/analytics-dashboard/` (new)

---

## 📊 Sprint Board

### To Do
- US-001: Quick Start Button
- US-002: Simplified Generation Form
- US-003: User-Friendly Error Messages
- US-004: Automatic Retry with Backoff
- US-005: First Comment CTA
- US-006: Comment Prompt Suggestions
- US-007: Personalized Recommendations
- US-008: Continue Creating CTA
- US-009: Loading State Improvements
- US-010: Analytics Integration

### In Progress
- _None yet_

### Review
- _None yet_

### Done
- _None yet_

---

## 🎯 Definition of Done

Each user story is complete when:
- [ ] Code is peer-reviewed
- [ ] Unit tests pass (Jest)
- [ ] E2E tests pass (Playwright)
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] Bundle size within limits
- [ ] Accessibility checked (WAVE)
- [ ] Analytics events added
- [ ] Documentation updated
- [ ] Deployed to staging

---

## 📈 Daily Standup Format

**When:** Daily at 10:00 AM (15 minutes)
**Format:**
1. What I completed yesterday
2. What I'm working on today
3. Blockers (if any)

**Blockers to escalate:**
- Technical dependencies blocked
- API changes needed
- Design clarification needed

---

## 🚨 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | Medium | Strict sprint scope, no additions |
| Technical debt | Low | 20% time for refactoring |
| API changes | Medium | Freeze API changes during sprint |
| Testing bottlenecks | Low | Parallel testing with development |

---

## 📞 Sprint Review

**Date:** February 2, 2026 at 4:00 PM
**Attendees:** Product, Engineering, Design
**Agenda:**
1. Demo completed features
2. Review metrics vs targets
3. Collect feedback
4. Plan next sprint

---

**Last Updated:** January 20, 2026
**Sprint Master:** Claude Code
**Product Owner:** [To be assigned]
