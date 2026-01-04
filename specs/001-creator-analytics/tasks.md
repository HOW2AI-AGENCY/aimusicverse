---
description: "Implementation tasks for Creator Analytics Dashboard feature"
---

# Tasks: Creator Analytics Dashboard

**Feature Branch**: `001-creator-analytics`  
**Input**: Design documents from `/specs/001-creator-analytics/`  
**Prerequisites**: plan.md, spec.md, research.md, contracts/ (all complete)

**Tests**: TDD approach REQUIRED per Constitution. All P1 tasks must have failing tests written first. Property-based tests using fast-check for calculation logic.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8 from spec.md)
- Include exact file paths in descriptions

## Path Conventions

Web app structure: `src/` (frontend), `supabase/` (backend), `tests/` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and analytics feature foundation

- [x] T001 Install analytics dependencies: `npm install recharts fast-check --save-dev`
- [x] T002 [P] Create analytics feature directories: `src/components/analytics/`, `src/hooks/analytics/`, `src/services/analytics/`, `src/lib/analytics/`, `src/types/analytics.ts`
- [x] T003 [P] Create test directories: `tests/unit/hooks/analytics/`, `tests/unit/services/analytics/`, `tests/unit/lib/analytics/`, `tests/integration/`, `tests/property/`
- [x] T004 [P] Copy TypeScript types from contracts to `src/types/analytics.ts`
- [x] T005 Configure fast-check for property-based testing in `jest.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Migration

- [x] T006 Create database migration script `supabase/migrations/20260104_creator_analytics.sql` with all 6 analytics tables (analytics_events, track_analytics, demographic_summaries, revenue_summaries, analytics_exports, notification_preferences)
- [x] T007 Add indexes to migration: idx_analytics_events_track_id, idx_analytics_events_timestamp, idx_track_analytics_track_date
- [x] T008 Add RLS policies to migration for all analytics tables (creator can only see their own data)
- [x] T009 Add 90-day TTL policy for analytics_events table cleanup
- [x] T010 Add default notification preferences for existing users
- [ ] T011 Test migration locally: apply migration, verify tables created, test RLS policies, verify rollback

### Core Analytics Service Layer

- [ ] T012 [P] Create analytics API client service in `src/services/analytics/analyticsService.ts` with type-safe wrappers for all 8 API endpoints
- [ ] T013 [P] Create event tracking service in `src/services/analytics/eventTracker.ts` with buffering and batch sending (flush every 30 seconds or 10 events)
- [ ] T014 [P] Create metrics calculator utility in `src/lib/analytics/metricsCalculator.ts` with functions: calculateEngagementRate, calculateCompletionRate, calculateViralCoefficient, calculateRPM
- [ ] T015 [P] Create privacy filter utility in `src/lib/analytics/privacyFilter.ts` with shouldShowDemographics function (100 play threshold)
- [ ] T016 [P] Create chart helpers utility in `src/lib/analytics/chartHelpers.ts` with downsampleData function (max 100 points on mobile)

### Property-Based Test Setup (Foundation)

- [ ] T017 Create property test file `tests/property/analytics-calculations.test.ts` with test structure and fast-check imports
- [ ] T018 [P] Write property test: "engagement rate is always between 0 and 100" for calculateEngagementRate
- [ ] T019 [P] Write property test: "completion rate is always between 0 and 100" for calculateCompletionRate
- [ ] T020 [P] Write property test: "viral coefficient is always non-negative" for calculateViralCoefficient
- [ ] T021 [P] Write property test: "RPM is 0 when plays is 0" for calculateRPM
- [ ] T022 [P] Write property test: "demographics visible only when play_count >= 100" for shouldShowDemographics
- [ ] T023 Run property tests to verify they FAIL (no implementation yet)

### Edge Function Templates

- [ ] T024 [P] Create Edge Function structure: `supabase/functions/analytics-track-summary/index.ts` with JWT auth and error handling
- [ ] T025 [P] Create Edge Function structure: `supabase/functions/analytics-trends/index.ts` with JWT auth and error handling
- [ ] T026 [P] Create Edge Function structure: `supabase/functions/analytics-demographics/index.ts` with JWT auth and privacy check
- [ ] T027 [P] Create Edge Function structure: `supabase/functions/analytics-revenue/index.ts` with JWT auth and error handling
- [ ] T028 [P] Create Edge Function structure: `supabase/functions/analytics-compare-versions/index.ts` with JWT auth and error handling
- [ ] T029 [P] Create Edge Function structure: `supabase/functions/analytics-export/index.ts` with JWT auth and job creation
- [ ] T030 [P] Create Edge Function structure: `supabase/functions/analytics-export-status/index.ts` with JWT auth and job status
- [ ] T031 [P] Create Edge Function structure: `supabase/functions/analytics-benchmarks/index.ts` with JWT auth and error handling
- [ ] T032 [P] Create Edge Function structure: `supabase/functions/analytics-event-ingest/index.ts` with JWT auth and batch validation

### Zustand Store

- [ ] T033 Create analytics store in `src/stores/analyticsStore.ts` with state: selectedDateRange, versionFilter, activeExportJobId, unreadNotifications

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Track Performance Overview (Priority: P1) 🎯 MVP

**Goal**: Creators can view play count, completion rate, average listen duration, and daily trends for their tracks. This is the core value proposition.

**Independent Test**: Create a track with simulated playback data, verify dashboard displays accurate play count, completion rate (plays that reached 90%+ duration), and average listen duration metrics.

### Tests for User Story 1 (TDD - Write FIRST) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T034 [P] [US1] Unit test for useTrackAnalytics hook in `tests/unit/hooks/analytics/useTrackAnalytics.test.ts`: test data fetching, caching, error handling
- [ ] T035 [P] [US1] Unit test for useAnalyticsTrends hook in `tests/unit/hooks/analytics/useAnalyticsTrends.test.ts`: test trend data fetching, 7/30/90 day ranges
- [ ] T036 [P] [US1] Unit test for metricsCalculator in `tests/unit/lib/analytics/metricsCalculator.test.ts`: test calculateEngagementRate, calculateCompletionRate edge cases
- [ ] T037 [P] [US1] Component test for TrackPerformanceCard in `tests/unit/components/analytics/TrackPerformanceCard.test.tsx`: test metric display, loading states, error states
- [ ] T038 [P] [US1] Component test for AnalyticsChart in `tests/unit/components/analytics/AnalyticsChart.test.tsx`: test Recharts rendering, responsive behavior
- [ ] T039 [P] [US1] Integration test for analytics API in `tests/integration/analytics-track-summary.test.ts`: test GET /analytics/tracks/:id endpoint with real Supabase connection
- [ ] T040 [P] [US1] Integration test for trend API in `tests/integration/analytics-trends.test.ts`: test GET /analytics/tracks/:id/trends endpoint
- [ ] T041 [US1] Run all US1 tests to verify they FAIL (red state)

### Implementation for User Story 1

#### Backend - Edge Functions

- [ ] T042 [P] [US1] Implement analytics-track-summary Edge Function: query track_analytics table, aggregate versions, return TrackAnalyticsResponse
- [ ] T043 [P] [US1] Implement analytics-trends Edge Function: query track_analytics daily stats for 7/30/90 days, return TrendDataResponse
- [ ] T044 [US1] Add materialized view mv_current_day_analytics to migration for real-time current-day metrics
- [ ] T045 [US1] Create aggregation job Edge Function `supabase/functions/analytics-aggregation-job/index.ts`: incremental aggregation from analytics_events to track_analytics
- [ ] T046 [US1] Configure Supabase cron job to run aggregation every 5 minutes

#### Frontend - Hooks

- [ ] T047 [P] [US1] Implement useTrackAnalytics hook in `src/hooks/analytics/useTrackAnalytics.ts`: TanStack Query wrapper for track summary API with 30s stale time
- [ ] T048 [P] [US1] Implement useAnalyticsTrends hook in `src/hooks/analytics/useAnalyticsTrends.ts`: TanStack Query wrapper for trends API with 1min stale time
- [ ] T049 [US1] Run unit tests for hooks to verify they PASS (green state)

#### Frontend - Components

- [ ] T050 [P] [US1] Implement MetricCard component in `src/components/analytics/MetricCard.tsx`: display single metric with label, value, trend indicator
- [ ] T051 [P] [US1] Implement TrendIndicator component in `src/components/analytics/TrendIndicator.tsx`: up/down arrow with percentage change
- [ ] T052 [P] [US1] Implement AnalyticsChart component in `src/components/analytics/AnalyticsChart.tsx`: Recharts wrapper with theme integration, responsive container, downsampling
- [ ] T053 [US1] Implement TrackPerformanceCard component in `src/components/analytics/TrackPerformanceCard.tsx`: display play count, completion rate, listen duration, 7/30/90d trend chart
- [ ] T054 [US1] Run component tests to verify they PASS (green state)

#### Frontend - Page & Integration

- [ ] T055 [US1] Create AnalyticsPage component in `src/pages/AnalyticsPage.tsx`: route /analytics/:trackId, load track data, display TrackPerformanceCard
- [ ] T056 [US1] Create AnalyticsDashboard container in `src/components/analytics/AnalyticsDashboard.tsx`: orchestrate cards, date range selector, loading/error states
- [ ] T057 [US1] Add analytics route to router configuration with lazy loading: `const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))`
- [ ] T058 [US1] Add Analytics navigation link to Telegram bottom navigation menu
- [ ] T059 [US1] Integrate event tracker with useGlobalAudioPlayer hook: call eventTracker.trackPlay, trackComplete, trackSkip

#### Testing & Validation

- [ ] T060 [US1] Run integration tests to verify complete flow: event ingestion → aggregation → API → UI display
- [ ] T061 [US1] Run all property tests to verify calculations are correct
- [ ] T062 [US1] Manual testing: Create test track, generate 100+ plays with varying completion rates, verify metrics display correctly
- [ ] T063 [US1] Performance test: Verify dashboard loads in < 2s on 4G, chart renders in < 300ms
- [ ] T064 [US1] Accessibility test: Verify chart has ARIA labels, keyboard navigation works, screen reader support

**Checkpoint**: User Story 1 complete - track performance analytics fully functional and independently testable

---

## Phase 4: User Story 2 - Understand Audience Demographics (Priority: P1)

**Goal**: Creators can view age distribution, geographic locations, listening times, and platform usage patterns to understand their audience.

**Independent Test**: Simulate listener profiles with age, location, and listening time data, verify dashboard displays accurate demographics with visual breakdowns and privacy threshold enforcement.

### Tests for User Story 2 (TDD - Write FIRST) ⚠️

- [ ] T065 [P] [US2] Unit test for useDemographics hook in `tests/unit/hooks/analytics/useDemographics.test.ts`: test data fetching, privacy threshold error handling (451), caching
- [ ] T066 [P] [US2] Unit test for privacyFilter in `tests/unit/lib/analytics/privacyFilter.test.ts`: test shouldShowDemographics with various play counts
- [ ] T067 [P] [US2] Component test for AudienceInsightsCard in `tests/unit/components/analytics/AudienceInsightsCard.test.tsx`: test demographic display, privacy message, loading states
- [ ] T068 [P] [US2] Component test for DemographicMap in `tests/unit/components/analytics/DemographicMap.test.tsx`: test SVG map rendering, country highlights, hover interactions
- [ ] T069 [P] [US2] Integration test for demographics API in `tests/integration/analytics-demographics.test.ts`: test GET /analytics/tracks/:id/demographics with play count < 100 and >= 100
- [ ] T070 [US2] Run all US2 tests to verify they FAIL (red state)

### Implementation for User Story 2

#### Backend - Edge Function

- [ ] T071 [US2] Implement analytics-demographics Edge Function: query demographic_summaries table, enforce 100 play threshold, return DemographicSummaryResponse or 451 error
- [ ] T072 [US2] Add demographic aggregation to analytics-aggregation-job: aggregate analytics_events by age_range, country, listening hour when play_count >= 100
- [ ] T073 [US2] Update migration with demographic_summaries table triggers for privacy enforcement

#### Frontend - Hooks

- [ ] T074 [US2] Implement useDemographics hook in `src/hooks/analytics/useDemographics.ts`: TanStack Query wrapper with 5min stale time, handle 451 error gracefully
- [ ] T075 [US2] Run hook unit tests to verify they PASS (green state)

#### Frontend - Components

- [ ] T076 [P] [US2] Implement DemographicMap component in `src/components/analytics/DemographicMap.tsx`: SVG world map with country highlights, top 10 countries display, interactive hover
- [ ] T077 [P] [US2] Implement age distribution chart in AudienceInsightsCard: bar chart showing age ranges with percentages
- [ ] T078 [P] [US2] Implement peak listening hours heatmap in AudienceInsightsCard: visual heatmap of hours 0-23
- [ ] T079 [US2] Implement AudienceInsightsCard component in `src/components/analytics/AudienceInsightsCard.tsx`: orchestrate all demographic visualizations, show privacy message when < 100 plays
- [ ] T080 [US2] Run component tests to verify they PASS (green state)

#### Integration

- [ ] T081 [US2] Add AudienceInsightsCard to AnalyticsDashboard layout below TrackPerformanceCard
- [ ] T082 [US2] Implement lazy loading for AudienceInsightsCard with Intersection Observer (load when scrolled into view)

#### Testing & Validation

- [ ] T083 [US2] Run integration tests to verify demographics flow: events with age/country → aggregation → API → UI display
- [ ] T084 [US2] Test privacy enforcement: Create track with 50 plays, verify "insufficient data" message shown
- [ ] T085 [US2] Test privacy threshold: Create track with 100+ plays, verify demographics displayed
- [ ] T086 [US2] Accessibility test: Verify map has descriptive labels, charts have proper ARIA attributes
- [ ] T087 [US2] Performance test: Verify demographic visualizations render smoothly on mobile

**Checkpoint**: User Story 2 complete - audience demographics fully functional with privacy compliance

---

## Phase 5: User Story 3 - Track Engagement Metrics (Priority: P2)

**Goal**: Creators can measure engagement through likes, comments, shares, playlist adds, and calculate engagement rates and viral coefficient.

**Independent Test**: Create tracks with simulated likes, comments, shares, verify engagement rate calculation ((likes + comments + shares) / plays × 100) and viral coefficient (shares / plays) are accurate.

### Tests for User Story 3 (TDD - Write FIRST) ⚠️

- [ ] T088 [P] [US3] Property test: "engagement rate increases with more engagement actions (monotonicity)" in `tests/property/analytics-calculations.test.ts`
- [ ] T089 [P] [US3] Property test: "viral coefficient increases with more shares (monotonicity)" in `tests/property/analytics-calculations.test.ts`
- [ ] T090 [P] [US3] Component test for EngagementMetricsCard in `tests/unit/components/analytics/EngagementMetricsCard.test.tsx`: test engagement display, breakdown chart, deep links
- [ ] T091 [US3] Run all US3 tests to verify they FAIL (red state)

### Implementation for User Story 3

#### Backend - No new endpoints needed (data already in track_analytics)

- [ ] T092 [US3] Update analytics-track-summary Edge Function to include engagement breakdown: like_count, comment_count, share_count, playlist_add_count
- [ ] T093 [US3] Update analytics-aggregation-job to aggregate engagement events: count like, comment, share, playlist_add events

#### Frontend - Components

- [ ] T094 [P] [US3] Implement engagement breakdown chart in EngagementMetricsCard: stacked bar chart showing likes, comments, shares, playlist adds
- [ ] T095 [US3] Implement EngagementMetricsCard component in `src/components/analytics/EngagementMetricsCard.tsx`: display total counts, engagement rate, viral coefficient, breakdown chart, deep links to comments/likes
- [ ] T096 [US3] Run component tests to verify they PASS (green state)

#### Integration

- [ ] T097 [US3] Add EngagementMetricsCard to AnalyticsDashboard layout below AudienceInsightsCard
- [ ] T098 [US3] Integrate event tracker with social features: call eventTracker.trackLike, trackShare, trackComment on user interactions

#### Testing & Validation

- [ ] T099 [US3] Run property tests to verify engagement calculations are monotonic and bounded
- [ ] T100 [US3] Manual test: Generate likes, comments, shares for test track, verify metrics update correctly
- [ ] T101 [US3] Test deep links: Click "View Comments" link, verify navigation to comments section works

**Checkpoint**: User Story 3 complete - engagement metrics fully functional

---

## Phase 6: User Story 4 - Monitor Revenue and Monetization (Priority: P2)

**Goal**: Creators can track income from platform plays, tips, premium subscriptions, view RPM, and see revenue projections.

**Independent Test**: Simulate plays with revenue attribution, verify total income, RPM calculations ((revenue / plays) × 1000), and 30-day revenue projections are accurate.

### Tests for User Story 4 (TDD - Write FIRST) ⚠️

- [ ] T102 [P] [US4] Unit test for useRevenueData hook in `tests/unit/hooks/analytics/useRevenueData.test.ts`: test data fetching, real-time updates, error handling
- [ ] T103 [P] [US4] Property test: "RPM calculation is consistent: (revenue / plays) × 1000" in `tests/property/analytics-calculations.test.ts`
- [ ] T104 [P] [US4] Property test: "total revenue is never negative" in `tests/property/analytics-calculations.test.ts`
- [ ] T105 [P] [US4] Component test for RevenueCard in `tests/unit/components/analytics/RevenueCard.test.tsx`: test revenue display, breakdown, projections, settled vs pending
- [ ] T106 [P] [US4] Integration test for revenue API in `tests/integration/analytics-revenue.test.ts`: test GET /analytics/tracks/:id/revenue endpoint
- [ ] T107 [US4] Run all US4 tests to verify they FAIL (red state)

### Implementation for User Story 4

#### Backend - Edge Function & Data Model

- [ ] T108 [US4] Add revenue_summaries table population to analytics-aggregation-job: aggregate revenue by source, calculate RPM, project 30/90 day revenue
- [ ] T109 [US4] Implement analytics-revenue Edge Function: query revenue_summaries table, return RevenueSummaryResponse with settled/pending breakdown

#### Frontend - Hooks

- [ ] T110 [US4] Implement useRevenueData hook in `src/hooks/analytics/useRevenueData.ts`: TanStack Query wrapper with 1min stale time, real-time updates
- [ ] T111 [US4] Run hook unit tests to verify they PASS (green state)

#### Frontend - Components

- [ ] T112 [P] [US4] Implement revenue breakdown chart in RevenueCard: stacked area chart showing platform plays, tips, premium subscriptions over time
- [ ] T113 [P] [US4] Implement revenue projection display in RevenueCard: show 30/90 day projections with trend indicator
- [ ] T114 [US4] Implement RevenueCard component in `src/components/analytics/RevenueCard.tsx`: display total revenue, RPM, breakdown chart, projections, settled vs pending amounts
- [ ] T115 [US4] Run component tests to verify they PASS (green state)

#### Integration

- [ ] T116 [US4] Add RevenueCard to AnalyticsDashboard layout below EngagementMetricsCard
- [ ] T117 [US4] Add "Enable Monetization" link/button for creators who haven't enabled it yet

#### Testing & Validation

- [ ] T118 [US4] Run integration tests to verify revenue flow: revenue events → aggregation → API → UI display
- [ ] T119 [US4] Run property tests to verify RPM calculation is consistent and revenue is never negative
- [ ] T120 [US4] Test revenue projections: Verify 30/90 day projections based on linear trend are reasonable
- [ ] T121 [US4] Test settled vs pending display: Verify pending amounts show expected settlement date

**Checkpoint**: User Story 4 complete - revenue tracking fully functional

---

## Phase 7: User Story 5 - Compare Track Versions (Priority: P3)

**Goal**: Creators can compare A/B versions side-by-side to determine which version performs better with statistical confidence indicators.

**Independent Test**: Create track with A and B versions, simulate different performance metrics, verify side-by-side comparison shows accurate differential and confidence levels.

### Tests for User Story 5 (TDD - Write FIRST) ⚠️

- [ ] T122 [P] [US5] Unit test for useVersionComparison hook in `tests/unit/hooks/analytics/useVersionComparison.test.ts`: test comparison data fetching, caching, error handling
- [ ] T123 [P] [US5] Component test for VersionComparisonCard in `tests/unit/components/analytics/VersionComparisonCard.test.tsx`: test side-by-side display, differential indicators, confidence levels, version switcher
- [ ] T124 [P] [US5] Integration test for version comparison API in `tests/integration/analytics-compare-versions.test.ts`: test GET /analytics/tracks/:id/compare-versions endpoint
- [ ] T125 [US5] Run all US5 tests to verify they FAIL (red state)

### Implementation for User Story 5

#### Backend - Edge Function & Statistical Analysis

- [ ] T126 [US5] Implement statistical analysis utility in analytics-compare-versions Edge Function: calculate confidence level based on sample size and difference magnitude
- [ ] T127 [US5] Implement analytics-compare-versions Edge Function: query track_analytics for version A and B, calculate differential, determine confidence, return VersionComparisonResponse

#### Frontend - Hooks

- [ ] T128 [US5] Implement useVersionComparison hook in `src/hooks/analytics/useVersionComparison.ts`: TanStack Query wrapper with 2min stale time, conditional fetching (only if 2 versions exist)
- [ ] T129 [US5] Run hook unit tests to verify they PASS (green state)

#### Frontend - Components

- [ ] T130 [P] [US5] Implement version comparison visualization: side-by-side bars with differential percentage overlay
- [ ] T131 [P] [US5] Implement confidence indicator: visual badge showing confidence level (low/medium/high) with explanation tooltip
- [ ] T132 [US5] Implement VersionComparisonCard component in `src/components/analytics/VersionComparisonCard.tsx`: display A vs B metrics, differential, confidence, recommendation, version switcher button
- [ ] T133 [US5] Run component tests to verify they PASS (green state)

#### Integration

- [ ] T134 [US5] Add VersionComparisonCard to AnalyticsDashboard layout (only shown when track has 2 versions)
- [ ] T135 [US5] Integrate version switcher with useVersionSwitcher hook: allow creators to switch active version based on recommendation

#### Testing & Validation

- [ ] T136 [US5] Test statistical confidence: Create versions with 50, 100, 500, 1000 plays, verify confidence levels adjust appropriately
- [ ] T137 [US5] Test version recommendation: Create versions where A clearly outperforms B, verify recommendation shows "A"
- [ ] T138 [US5] Test insufficient data: Create versions with < 100 plays each, verify confidence message shown
- [ ] T139 [US5] Manual test: Switch active version, verify track playback uses new version

**Checkpoint**: User Story 5 complete - version comparison with statistical analysis fully functional

---

## Phase 8: User Story 6 - Receive Real-time Notifications (Priority: P3)

**Goal**: Creators receive Telegram notifications for milestones (1K, 10K, 100K, 1M plays), trending tracks (5x engagement spike), and featured placements.

**Independent Test**: Simulate milestone events and trending conditions, verify notifications delivered with accurate information and actionable deep links.

### Tests for User Story 6 (TDD - Write FIRST) ⚠️

- [ ] T140 [P] [US6] Unit test for useAnalyticsNotifications hook in `tests/unit/hooks/analytics/useAnalyticsNotifications.test.ts`: test notification listening, unread count, preferences
- [ ] T141 [P] [US6] Integration test for notification delivery in `tests/integration/analytics-notifications.test.ts`: test milestone detection, Telegram Bot API call, rate limiting
- [ ] T142 [US6] Run all US6 tests to verify they FAIL (red state)

### Implementation for User Story 6

#### Backend - Notification System

- [ ] T143 [US6] Create notification detection logic in analytics-aggregation-job: check for milestones (1K, 10K, 100K, 1M plays), detect trending (5x engagement spike vs 7-day avg)
- [ ] T144 [US6] Create send-analytics-notification Edge Function: check notification preferences, enforce rate limiting (max 5/hour), send Telegram message with MarkdownV2, log notification
- [ ] T145 [US6] Add notification_log table to track sent notifications for rate limiting
- [ ] T146 [US6] Implement rate limiting query: COUNT notifications in last hour, reject if >= 5

#### Frontend - Hooks & Preferences

- [ ] T147 [US6] Implement useAnalyticsNotifications hook in `src/hooks/analytics/useAnalyticsNotifications.ts`: fetch notification preferences, update preferences mutation
- [ ] T148 [US6] Implement useUpdateNotificationPreferences mutation hook with optimistic updates
- [ ] T149 [US6] Run hook unit tests to verify they PASS (green state)

#### Frontend - UI

- [ ] T150 [US6] Create notification preferences UI in analytics settings: toggles for milestones, trending, charts notifications
- [ ] T151 [US6] Add notification preferences link to AnalyticsDashboard header

#### Telegram Bot Integration

- [ ] T152 [US6] Add notification message templates for milestones: celebratory emoji, play count, deep link to analytics
- [ ] T153 [US6] Add notification message template for trending: trending emoji, engagement spike stats, deep link
- [ ] T154 [US6] Implement notification batching: if multiple milestones reached simultaneously, send as single message
- [ ] T155 [US6] Implement notification idempotency: check if milestone notification already sent, skip duplicates

#### Testing & Validation

- [ ] T156 [US6] Test milestone notifications: Simulate track reaching 1K, 10K plays, verify Telegram messages sent
- [ ] T157 [US6] Test trending notifications: Simulate 5x engagement spike, verify trending notification sent
- [ ] T158 [US6] Test rate limiting: Simulate 6 notifications in 1 hour, verify 6th is blocked
- [ ] T159 [US6] Test notification preferences: Disable milestones, simulate milestone, verify no notification sent
- [ ] T160 [US6] Test deep links: Click notification link, verify opens analytics dashboard at correct track

**Checkpoint**: User Story 6 complete - notification system fully functional with rate limiting

---

## Phase 9: User Story 7 - Export Analytics Data (Priority: P3)

**Goal**: Creators can export analytics data in CSV, PDF, and JSON formats with date range filtering for external analysis and record-keeping.

**Independent Test**: Generate analytics data, export to CSV/PDF/JSON, verify exported files contain accurate complete data matching dashboard displays.

### Tests for User Story 7 (TDD - Write FIRST) ⚠️

- [ ] T161 [P] [US7] Unit test for useAnalyticsExport hook in `tests/unit/hooks/analytics/useAnalyticsExport.test.ts`: test export request mutation, polling, error handling
- [ ] T162 [P] [US7] Unit test for useExportPolling hook in `tests/unit/hooks/analytics/useExportPolling.test.ts`: test polling interval, completion detection, timeout
- [ ] T163 [P] [US7] Component test for ExportDialog in `tests/unit/components/analytics/ExportDialog.test.tsx`: test form validation, format selection, date range picker, progress display
- [ ] T164 [P] [US7] Integration test for export job flow in `tests/integration/analytics-export.test.ts`: test POST /analytics/export → job creation → GET /analytics/export/:id → completion → download
- [ ] T165 [US7] Run all US7 tests to verify they FAIL (red state)

### Implementation for User Story 7

#### Backend - Export Job System

- [ ] T166 [US7] Implement analytics-export Edge Function: validate request, create job in analytics_exports table (status: pending), return job_id
- [ ] T167 [US7] Implement analytics-export-status Edge Function: query analytics_exports table by job_id, return status and download_url if completed
- [ ] T168 [US7] Create export worker Edge Function `supabase/functions/analytics-export-worker/index.ts`: pick up pending jobs, generate exports, upload to Supabase Storage
- [ ] T169 [US7] Implement CSV generation in export worker: use Deno CSV encoder, export track_analytics data
- [ ] T170 [US7] Implement JSON generation in export worker: JSON.stringify analytics data with schema
- [ ] T171 [US7] Implement PDF generation in export worker: use Puppeteer to render HTML report with charts, convert to PDF
- [ ] T172 [US7] Configure Supabase Storage bucket: create analytics-exports bucket with RLS (user can only access their own exports)
- [ ] T173 [US7] Implement export expiry cleanup job: delete exports where expires_at < NOW(), run daily

#### Frontend - Hooks

- [ ] T174 [US7] Implement useAnalyticsExport hook in `src/hooks/analytics/useAnalyticsExport.ts`: mutation for creating export jobs, start polling on success
- [ ] T175 [US7] Implement useExportPolling hook in `src/hooks/analytics/useExportPolling.ts`: poll every 2 seconds, stop when status = completed/failed, timeout after 5 minutes
- [ ] T176 [US7] Run hook unit tests to verify they PASS (green state)

#### Frontend - Components

- [ ] T177 [P] [US7] Implement export format selector in ExportDialog: radio buttons for CSV, PDF, JSON
- [ ] T178 [P] [US7] Implement date range picker in ExportDialog: start date, end date inputs with validation
- [ ] T179 [P] [US7] Implement track selector in ExportDialog: multi-select for specific tracks or "All tracks" option
- [ ] T180 [P] [US7] Implement export progress display in ExportDialog: progress bar, status text, estimated completion time
- [ ] T181 [US7] Implement ExportDialog component in `src/components/analytics/ExportDialog.tsx`: orchestrate all export UI, handle form submission, display download link when ready
- [ ] T182 [US7] Run component tests to verify they PASS (green state)

#### Integration

- [ ] T183 [US7] Add "Export Data" button to AnalyticsDashboard header, opens ExportDialog
- [ ] T184 [US7] Implement download link auto-copy: when export completes, copy download URL to clipboard with toast notification

#### Testing & Validation

- [ ] T185 [US7] Test CSV export: Create export job, verify CSV file generated correctly with proper headers and data
- [ ] T186 [US7] Test PDF export: Create export with include_charts=true, verify PDF contains charts and formatted report
- [ ] T187 [US7] Test JSON export: Create export, verify JSON schema matches expected structure
- [ ] T188 [US7] Test date range filtering: Export 30-day data, verify only data within range included
- [ ] T189 [US7] Test export expiry: Create export, wait 7 days, verify download link expired and file deleted
- [ ] T190 [US7] Test large export: Export 90 days with 1M events, verify completes within 2 minutes and file size < 50MB
- [ ] T191 [US7] Performance test: Verify export job completes within 30 seconds for standard 30-day export

**Checkpoint**: User Story 7 complete - data export system fully functional with all formats

---

## Phase 10: User Story 8 - Benchmark Against Platform Averages (Priority: P3)

**Goal**: Creators can compare their performance to platform averages in their genre to gauge relative success and see percentile rankings.

**Independent Test**: Create genre-categorized tracks with varying performance, calculate platform averages, verify benchmark displays show accurate comparisons with percentile rankings.

### Tests for User Story 8 (TDD - Write FIRST) ⚠️

- [ ] T192 [P] [US8] Unit test for usePlatformBenchmarks hook in `tests/unit/hooks/analytics/usePlatformBenchmarks.test.ts`: test benchmark data fetching, genre filtering, caching (1 hour stale time)
- [ ] T193 [P] [US8] Component test for BenchmarkComparison in `tests/unit/components/analytics/BenchmarkComparison.test.tsx`: test percentile display, comparison indicators, genre selector
- [ ] T194 [P] [US8] Integration test for benchmarks API in `tests/integration/analytics-benchmarks.test.ts`: test GET /analytics/benchmarks/:genre endpoint
- [ ] T195 [US8] Run all US8 tests to verify they FAIL (red state)

### Implementation for User Story 8

#### Backend - Benchmark Calculation

- [ ] T196 [US8] Create benchmark calculation job Edge Function `supabase/functions/analytics-calculate-benchmarks/index.ts`: aggregate platform-wide stats by genre, calculate percentiles (p10, p25, p50, p75, p90)
- [ ] T197 [US8] Add benchmark_data table to store calculated benchmarks: genre, averages, percentiles, sample_size, calculated_at
- [ ] T198 [US8] Configure benchmark calculation job to run daily at midnight UTC
- [ ] T199 [US8] Implement analytics-benchmarks Edge Function: query benchmark_data by genre, return BenchmarkResponse or 404 if insufficient data (< 1000 tracks)

#### Frontend - Hooks

- [ ] T200 [US8] Implement usePlatformBenchmarks hook in `src/hooks/analytics/usePlatformBenchmarks.ts`: TanStack Query wrapper with 1 hour stale time (benchmarks change slowly)
- [ ] T201 [US8] Run hook unit tests to verify they PASS (green state)

#### Frontend - Components

- [ ] T202 [P] [US8] Implement percentile position indicator: visual gauge showing where creator ranks (p10-p90)
- [ ] T203 [P] [US8] Implement benchmark comparison bars: side-by-side bars showing creator vs platform average
- [ ] T204 [P] [US8] Implement genre selector dropdown: allow filtering benchmarks by genre
- [ ] T205 [US8] Implement BenchmarkComparison component in `src/components/analytics/BenchmarkComparison.tsx`: display creator's percentile, comparison to averages, genre selector
- [ ] T206 [US8] Run component tests to verify they PASS (green state)

#### Integration

- [ ] T207 [US8] Add BenchmarkComparison to AnalyticsDashboard layout at bottom (optional section, collapsed by default)
- [ ] T208 [US8] Add "Compare to Platform" toggle button in dashboard header to show/hide benchmarks

#### Testing & Validation

- [ ] T209 [US8] Test benchmark calculation: Run job manually, verify averages and percentiles calculated correctly
- [ ] T210 [US8] Test insufficient data: Query genre with < 1000 tracks, verify 404 error with helpful message
- [ ] T211 [US8] Test percentile ranking: Create track with 50K plays in genre with average 10K, verify shows "p90" ranking
- [ ] T212 [US8] Test genre filtering: Switch genre selector, verify benchmarks update for new genre
- [ ] T213 [US8] Manual test: Review benchmark calculations against spreadsheet to ensure accuracy

**Checkpoint**: User Story 8 complete - platform benchmarking fully functional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality assurance

### Code Quality & Refactoring

- [ ] T214 [P] Code review: Review all analytics components for consistent styling, naming conventions, error handling
- [ ] T215 [P] Refactor duplicate code: Extract shared analytics utilities to common functions
- [ ] T216 [P] Add JSDoc comments to all public functions and components
- [ ] T217 [P] Run ESLint on all analytics code, fix warnings

### Performance Optimization

- [ ] T218 [P] Implement Service Worker caching for analytics dashboard assets: use vite-plugin-pwa
- [ ] T219 [P] Optimize chart data sampling: verify mobile performance with 500+ data points
- [ ] T220 [P] Add lazy loading for all below-the-fold analytics cards with Intersection Observer
- [ ] T221 [P] Bundle size analysis: verify analytics bundle < 100KB gzipped, optimize if needed

### Accessibility

- [ ] T222 [P] Accessibility audit: Run axe DevTools on analytics dashboard, fix violations
- [ ] T223 [P] Keyboard navigation: Verify all interactive elements accessible via keyboard
- [ ] T224 [P] Screen reader testing: Test dashboard with NVDA/JAWS, fix ARIA label issues
- [ ] T225 [P] Color contrast: Verify all charts meet WCAG AA contrast ratio (4.5:1 text, 3:1 non-text)
- [ ] T226 [P] Touch target sizing: Verify all buttons/links meet 44×44px minimum size

### Internationalization

- [ ] T227 [P] Extract all analytics text to i18n files: move hardcoded strings to translation keys
- [ ] T228 [P] Add RTL layout support: test analytics dashboard with Arabic/Hebrew locales
- [ ] T229 [P] Number formatting: use locale-aware number formatting for metrics (12,345 vs 12.345)
- [ ] T230 [P] Date formatting: use locale-aware date formatting for trends and exports

### Security

- [ ] T231 Run security audit: Check for SQL injection vulnerabilities in Edge Functions
- [ ] T232 Test RLS policies: Verify creators can only access their own analytics data
- [ ] T233 Test authentication: Verify all API endpoints reject unauthenticated requests
- [ ] T234 Test authorization: Verify creators cannot access other creators' analytics

### Documentation

- [ ] T235 [P] Create analytics developer guide in `specs/001-creator-analytics/quickstart.md`
- [ ] T236 [P] Create analytics user guide for creators: how to interpret metrics, use features
- [ ] T237 [P] Update main README with analytics feature description and screenshots
- [ ] T238 [P] Add inline help tooltips to analytics dashboard: explain metrics, formulas, thresholds

### Monitoring & Observability

- [ ] T239 [P] Add structured logging to all Edge Functions: log request ID, duration, errors
- [ ] T240 [P] Set up error monitoring: integrate Sentry or similar for production error tracking
- [ ] T241 [P] Add performance monitoring: track analytics API latency, aggregation job duration
- [ ] T242 [P] Set up alerting: alert on analytics update delay > 30 minutes, API error rate > 5%

### Final Testing

- [ ] T243 End-to-end testing: Complete user journey from track creation → playback → analytics viewing → export
- [ ] T244 Load testing: Simulate 10,000 concurrent analytics requests, verify < 3s response time
- [ ] T245 Mobile device testing: Test on iPhone SE, Pixel 6a, Samsung Galaxy A52
- [ ] T246 Cross-browser testing: Test on Chrome, Safari, Firefox mobile browsers
- [ ] T247 Regression testing: Re-run all unit, integration, property tests, verify 100% pass rate

### Deployment

- [ ] T248 Create feature flag: Add VITE_ANALYTICS_ENABLED environment variable
- [ ] T249 Deploy to staging: Deploy analytics feature behind feature flag
- [ ] T250 Beta testing: Enable for 10 beta creators, gather feedback for 1 week
- [ ] T251 Monitor beta: Track usage metrics, error rates, performance, user feedback
- [ ] T252 Address beta feedback: Fix critical issues, improve UX based on feedback
- [ ] T253 Production deployment: Enable analytics for all creators
- [ ] T254 Monitor production: Track adoption rate, error rates, performance for first 48 hours

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) once Foundation is complete
  - Or sequentially in priority order: P1 (US1, US2) → P2 (US3, US4) → P3 (US5, US6, US7, US8)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories ✅ MVP
- **US2 (P1)**: Can start after Foundational - No dependencies on other stories ✅ MVP
- **US3 (P2)**: Depends on US1 (uses track_analytics table) - Can work in parallel with US4
- **US4 (P2)**: Depends on US1 (uses track_analytics table) - Can work in parallel with US3
- **US5 (P3)**: Depends on US1 (uses track_analytics table) - Independent from US6, US7, US8
- **US6 (P3)**: Depends on US1 (milestone detection) - Independent from US5, US7, US8
- **US7 (P3)**: Depends on US1 (data to export) - Independent from US5, US6, US8
- **US8 (P3)**: Depends on US1 (benchmark calculation) - Independent from US5, US6, US7

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD requirement)
- Backend Edge Functions before frontend hooks
- Hooks before components
- Components before page integration
- Integration testing after feature complete
- Story complete before moving to next priority

### Parallel Opportunities

#### Foundation Phase (Tasks can run in parallel)
- T002-T005: Directory creation, dependency installation (different areas)
- T012-T016: Service layer, utilities (different files)
- T017-T022: Property tests (different test cases)
- T024-T032: Edge Function templates (different functions)

#### User Story 1 (After foundation complete)
- T034-T040: All unit tests (different test files)
- T042-T043: Both Edge Functions (different endpoints)
- T047-T048: Both hooks (different files)
- T050-T052: Reusable components (different files)

#### User Story 2 (After US1 backend complete)
- T065-T069: All unit tests (different test files)
- T076-T078: All visualization components (different files)

#### User Story 3 (After US1 complete)
- T088-T090: Property tests (different test cases)
- Can work fully in parallel with US4

#### User Story 4 (After US1 complete)
- T102-T106: All tests (different test files)
- T112-T113: Chart and projection components (different files)
- Can work fully in parallel with US3

#### Multiple User Stories (After US1 complete)
- US3, US4, US5, US6, US7, US8 can all be worked on in parallel by different developers
- Each story is independently testable and doesn't block others

#### Polish Phase
- T214-T217: Code quality tasks (different files)
- T218-T221: Performance tasks (different optimizations)
- T222-T226: Accessibility tasks (different aspects)
- T227-T230: i18n tasks (different locales)
- T235-T238: Documentation tasks (different docs)
- T239-T242: Monitoring tasks (different tools)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T034: "Unit test for useTrackAnalytics hook"
Task T035: "Unit test for useAnalyticsTrends hook"
Task T036: "Unit test for metricsCalculator"
Task T037: "Component test for TrackPerformanceCard"
Task T038: "Component test for AnalyticsChart"
Task T039: "Integration test for analytics-track-summary API"
Task T040: "Integration test for analytics-trends API"

# Launch all backend Edge Functions together:
Task T042: "Implement analytics-track-summary Edge Function"
Task T043: "Implement analytics-trends Edge Function"

# Launch all frontend hooks together:
Task T047: "Implement useTrackAnalytics hook"
Task T048: "Implement useAnalyticsTrends hook"

# Launch all reusable components together:
Task T050: "Implement MetricCard component"
Task T051: "Implement TrendIndicator component"
Task T052: "Implement AnalyticsChart component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T033) - CRITICAL
3. Complete Phase 3: User Story 1 (T034-T064) - Track Performance
4. Complete Phase 4: User Story 2 (T065-T087) - Audience Demographics
5. **STOP and VALIDATE**: Test US1 & US2 independently
6. Deploy/demo MVP

**MVP Scope**: Creators can view track performance (plays, completion rate, trends) and audience demographics (age, geography, listening patterns). This delivers core value proposition.

### Incremental Delivery

1. **Foundation** (Phase 1-2) → Database + APIs ready
2. **MVP** (Phase 3-4: US1, US2) → Test independently → Deploy/Demo ✅
3. **Engagement & Revenue** (Phase 5-6: US3, US4) → Test independently → Deploy/Demo
4. **Advanced Features** (Phase 7-10: US5, US6, US7, US8) → Test independently → Deploy/Demo
5. **Polish** (Phase 11) → Final QA → Full release

Each phase adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Foundation together** (Phase 1-2)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Track Performance)
   - **Developer B**: User Story 2 (Audience Demographics)
   - **Developer C**: Property-based tests + Edge Function setup
3. After US1 & US2 MVP:
   - **Developer A**: User Story 3 (Engagement)
   - **Developer B**: User Story 4 (Revenue)
   - **Developer C**: User Story 5 (Version Comparison)
4. Final stretch:
   - **Developer A**: User Story 6 (Notifications)
   - **Developer B**: User Story 7 (Export)
   - **Developer C**: User Story 8 (Benchmarks)
5. All developers: Polish phase together

---

## Testing Summary

### Test Coverage Targets

- **Unit Tests**: 80%+ code coverage for Phase 3-4 (P1), 85%+ for subsequent phases
- **Integration Tests**: All API endpoints covered
- **Property Tests**: All calculation functions covered (10 core properties)
- **E2E Tests**: 4 critical user journeys

### Test Execution

```bash
# Unit tests
npm test -- tests/unit

# Integration tests
npm test -- tests/integration

# Property-based tests
npm test -- tests/property

# All tests
npm test

# Coverage report
npm test -- --coverage
```

### Property-Based Test Properties (10 Core)

1. **Engagement rate bounds**: 0 ≤ engagement_rate ≤ 100
2. **Completion rate bounds**: 0 ≤ completion_rate ≤ 100
3. **Viral coefficient non-negative**: viral_coefficient ≥ 0
4. **RPM zero when no plays**: plays = 0 → RPM = 0
5. **Privacy threshold**: demographics_visible ⟺ plays ≥ 100
6. **Total revenue non-negative**: total_revenue ≥ 0
7. **Engagement rate monotonic**: more engagement → higher rate
8. **Viral coefficient monotonic**: more shares → higher coefficient
9. **Aggregation associativity**: sum(daily) = daily(sum)
10. **RPM calculation consistency**: RPM = (revenue / plays) × 1000

---

## Task Statistics

**Total Tasks**: 254

**Tasks per Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundation): 28 tasks
- Phase 3 (US1): 31 tasks
- Phase 4 (US2): 23 tasks
- Phase 5 (US3): 14 tasks
- Phase 6 (US4): 22 tasks
- Phase 7 (US5): 18 tasks
- Phase 8 (US6): 21 tasks
- Phase 9 (US7): 31 tasks
- Phase 10 (US8): 22 tasks
- Phase 11 (Polish): 41 tasks

**Tasks per Priority**:
- P1 (US1, US2): 54 implementation tasks (MVP)
- P2 (US3, US4): 36 implementation tasks
- P3 (US5, US6, US7, US8): 92 implementation tasks
- Setup + Foundation: 33 tasks
- Polish: 41 tasks

**Parallelizable Tasks**: 128 tasks marked with [P] flag (50% of total)

**Test Tasks**: 67 tasks (26% of total)
- Unit tests: 35 tasks
- Integration tests: 12 tasks
- Property tests: 10 tasks
- E2E tests: 4 tasks
- Accessibility tests: 6 tasks

**Estimated Timeline**:
- **MVP (US1, US2)**: 3-4 weeks (2 developers)
- **Full Feature**: 8-10 weeks (3 developers)
- **Solo Developer**: 12-14 weeks

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD Required**: Verify tests fail before implementing (red → green → refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Constitution Compliance**: All P1 tasks include tests, property-based tests for calculations, mobile-first design, GDPR privacy enforcement
- **Property Tests**: 10 core properties cover analytics calculation correctness
- **Performance Targets**: < 2s load, 60 FPS scrolling, < 500KB bundle size
- **Accessibility**: WCAG AA compliance, 44×44px touch targets, ARIA labels, keyboard navigation
