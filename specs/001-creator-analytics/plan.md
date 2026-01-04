# Implementation Plan: Creator Analytics Dashboard

**Branch**: `001-creator-analytics` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-creator-analytics/spec.md`

## Summary

The Creator Analytics Dashboard provides comprehensive analytics for music creators on the MusicVerse AI platform. Creators can track performance metrics (plays, completion rates, engagement), understand their audience demographics, monitor revenue, and compare A/B track versions. The implementation follows a mobile-first approach with privacy-by-design principles, real-time data aggregation, and seamless Telegram integration. The feature will be delivered incrementally across 4 phases, starting with core analytics viewing (P1) and progressively adding revenue tracking, version comparison, and export capabilities.

## Technical Context

**Language/Version**: TypeScript 5.9+ (frontend), TypeScript on Deno (backend Edge Functions)  
**Primary Dependencies**: 
- Frontend: React 19, TanStack Query 5.90+, Zustand 5.0+, Recharts (charts), react-virtuoso (virtualization)
- Backend: Supabase Edge Functions (Deno runtime), PostgreSQL 16
- Integration: Telegram Mini App SDK (@twa-dev/sdk)

**Storage**: PostgreSQL 16 (Lovable Cloud/Supabase) with Row Level Security  
**Testing**: Jest 30.x + React Testing Library 16.x (frontend), property-based testing with fast-check  
**Target Platform**: Telegram Mini App (mobile-first: iOS/Android Telegram, Web version support)  
**Project Type**: Web application with mobile-first design integrated in Telegram ecosystem  
**Performance Goals**: 
- Initial load < 2s on 4G network
- 60 FPS scrolling performance
- Analytics updates within 5 minutes (near real-time)
- API response time p95 < 500ms
- 10,000 concurrent analytics requests support

**Constraints**: 
- Mobile screen width: 320px-430px (primary), must be responsive
- Must comply with GDPR (demographic data requires min 100 plays)
- Must integrate seamlessly with Telegram (haptic feedback, theme, navigation)
- 90-day raw event retention for cost optimization
- Must not impact existing track playback performance

**Scale/Scope**: 
- Expected: 10,000+ creators, 100,000+ tracks with analytics
- Anticipated load: 1M+ analytics events per day
- Data retention: 90 days raw events, permanent aggregated data
- ~15 new React components, 8 API endpoints, 6 database tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Constitution Check (Pre-Phase 0)

- ✅ **Tests**: P1 user stories (View Track Performance, Understand Audience Demographics) MUST include failing tests before implementation (TDD requirement per Constitution Principle I). Unit tests for hooks, integration tests for API endpoints, property-based tests for data aggregation logic.

- ✅ **Security & Privacy**: 
  - Plans MUST document data minimization: demographic data suppressed below 100 plays (GDPR compliance)
  - No sensitive user data stored without consent
  - All analytics data behind RLS policies (user can only access their own track analytics)
  - API keys for external services (if any) handled via Edge Functions only
  - Secrets handling per Constitution Principle II

- ✅ **Observability**: 
  - Structured JSON logging for all analytics aggregation jobs
  - Metrics tracking: analytics API latency, aggregation job duration, failed exports
  - Error monitoring for analytics computation failures
  - Query performance monitoring (slow queries > 500ms)
  - Real-time alerting for > 5 minute analytics delay
  - Per Constitution Principle III

- ✅ **Versioning & Migration**: 
  - Database schema changes versioned via Supabase migrations
  - API versioned (v1 in endpoint paths)
  - No breaking changes in Phase 1 (greenfield feature)
  - Migration plan for adding analytics tables without disrupting existing track playback
  - Per Constitution Principle IV

**Status**: ✅ All Constitution gates passed. Ready for Phase 0 research.

### Post-Phase 1 Re-check

*To be completed after Phase 1 design artifacts are generated.*

## Project Structure

### Documentation (this feature)

```text
specs/001-creator-analytics/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output: Technical decisions & best practices
├── data-model.md        # Phase 1 output: Database schema & entities
├── quickstart.md        # Phase 1 output: Developer onboarding guide
├── contracts/           # Phase 1 output: API contracts (already created)
│   ├── analytics-api.yaml    # OpenAPI 3.0 specification
│   └── types.ts              # TypeScript type definitions
├── checklists/          # Specification validation (already exists)
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web Application Structure (React + Supabase)

src/
├── components/
│   ├── analytics/                    # NEW: Analytics dashboard components
│   │   ├── AnalyticsDashboard.tsx           # Main dashboard container
│   │   ├── TrackPerformanceCard.tsx         # Performance metrics card
│   │   ├── AudienceInsightsCard.tsx         # Demographics visualization
│   │   ├── EngagementMetricsCard.tsx        # Engagement stats
│   │   ├── RevenueCard.tsx                  # Revenue tracking
│   │   ├── VersionComparisonCard.tsx        # A/B comparison
│   │   ├── AnalyticsChart.tsx               # Recharts wrapper
│   │   ├── MetricCard.tsx                   # Reusable metric display
│   │   ├── TrendIndicator.tsx               # Up/down trend arrows
│   │   ├── DemographicMap.tsx               # Geographic visualization
│   │   ├── ExportDialog.tsx                 # Export options modal
│   │   └── BenchmarkComparison.tsx          # Platform benchmark display
│   ├── ui/                           # Existing shadcn/ui components
│   ├── player/                       # Existing player components
│   ├── library/                      # Existing library components
│   └── track/                        # Existing track components
│
├── hooks/
│   ├── analytics/                    # NEW: Analytics hooks
│   │   ├── useTrackAnalytics.ts             # Fetch track analytics summary
│   │   ├── useAnalyticsTrends.ts            # Time-series trend data
│   │   ├── useDemographics.ts               # Audience demographics
│   │   ├── useRevenueData.ts                # Revenue metrics
│   │   ├── useVersionComparison.ts          # A/B version comparison
│   │   ├── usePlatformBenchmarks.ts         # Platform averages
│   │   ├── useAnalyticsExport.ts            # Export job management
│   │   └── useAnalyticsNotifications.ts     # Notification preferences
│   ├── useTracks.ts                  # Existing track hook
│   └── useGlobalAudioPlayer.ts       # Existing player hook
│
├── pages/
│   ├── AnalyticsPage.tsx             # NEW: Main analytics page (/analytics/:trackId)
│   └── ...existing pages
│
├── services/
│   ├── analytics/                    # NEW: Analytics business logic
│   │   ├── analyticsService.ts              # API client for analytics endpoints
│   │   ├── eventTracker.ts                  # Client-side event tracking
│   │   └── aggregationUtils.ts              # Data aggregation helpers
│   └── ...existing services
│
├── stores/
│   ├── analyticsStore.ts             # NEW: Analytics global state (Zustand)
│   └── ...existing stores
│
├── types/
│   ├── analytics.ts                  # NEW: Analytics type definitions (from contracts/types.ts)
│   └── ...existing types
│
└── lib/
    ├── analytics/                    # NEW: Analytics utilities
    │   ├── chartHelpers.ts                  # Chart data transformation
    │   ├── metricsCalculator.ts             # Metric computation
    │   └── privacyFilter.ts                 # Privacy threshold enforcement
    └── ...existing lib

supabase/
├── functions/
│   ├── analytics-track-summary/      # NEW: Get track analytics summary
│   ├── analytics-trends/             # NEW: Get time-series trends
│   ├── analytics-demographics/       # NEW: Get audience demographics
│   ├── analytics-revenue/            # NEW: Get revenue data
│   ├── analytics-compare-versions/   # NEW: Compare A/B versions
│   ├── analytics-export/             # NEW: Create export job
│   ├── analytics-export-status/      # NEW: Check export status
│   ├── analytics-benchmarks/         # NEW: Get platform benchmarks
│   ├── analytics-event-ingest/       # NEW: Ingest analytics events
│   ├── analytics-aggregation-job/    # NEW: Background aggregation worker
│   └── ...existing functions
│
└── migrations/
    └── 20260104_creator_analytics.sql  # NEW: Analytics schema migration

tests/
├── unit/
│   ├── hooks/analytics/              # NEW: Hook unit tests
│   ├── services/analytics/           # NEW: Service unit tests
│   └── lib/analytics/                # NEW: Utility unit tests
│
├── integration/
│   ├── analytics-api.test.ts         # NEW: API endpoint integration tests
│   └── analytics-aggregation.test.ts # NEW: Aggregation job tests
│
└── property/
    └── analytics-calculations.test.ts # NEW: Property-based tests for metrics
```

**Structure Decision**: Web application structure chosen because the feature is frontend-heavy with React components for visualization and backend Edge Functions for data aggregation. The analytics feature integrates into the existing MusicVerse AI web app structure, adding a new `/analytics/:trackId` page with dedicated components, hooks, and services following the established patterns (component-driven UI, TanStack Query for data fetching, service layer for business logic).

## Complexity Tracking

> **Note**: No Constitution violations identified. This section documents architectural complexity for future reference.

| Complexity Point | Justification | Mitigation |
|-----------------|---------------|------------|
| Real-time aggregation | Analytics must update within 5 minutes of events for creator value | Background job processing with incremental aggregation; batch processing for efficiency |
| Chart library choice | Need mobile-optimized, accessible charts with smooth performance | Recharts chosen for React integration, tree-shakeable, good mobile performance |
| Privacy-preserving demographics | GDPR compliance requires 100-play threshold | Implemented at database query level with privacy filters; clear UI messaging |
| 90-day data retention | Balance storage costs vs historical analysis needs | Separate raw events (90-day TTL) from aggregated data (permanent); automated cleanup jobs |

---

## Phase 0: Outline & Research

### Research Objectives

Based on the Technical Context and Key Technical Decisions from the prompt, the following unknowns must be resolved before proceeding to design:

#### 1. Data Aggregation Strategy
**Question**: How to efficiently aggregate analytics data - real-time vs batch processing?

**Research Tasks**:
- Investigate real-time aggregation patterns using PostgreSQL materialized views vs application-level batch jobs
- Research incremental aggregation strategies (update existing aggregates vs full recalculation)
- Evaluate Supabase Edge Function cron jobs for scheduled aggregation
- Analyze performance impact of real-time aggregation on track playback queries
- Determine optimal aggregation frequency (every minute, 5 minutes, hourly?)

**Deliverable**: Decision document in `research.md` with chosen aggregation architecture, rationale, and implementation approach.

---

#### 2. Caching Strategy
**Question**: What caching strategy should be used for frequently accessed analytics metrics?

**Research Tasks**:
- Research TanStack Query caching strategies for analytics data (stale time, cache time, refetch policies)
- Investigate PostgreSQL query caching and indexing strategies for analytics queries
- Evaluate Redis/Memcached for server-side caching (if supported by Lovable Cloud)
- Determine cache invalidation strategy (time-based, event-based, or hybrid)
- Analyze cache hit rates for different time ranges (7d, 30d, 90d)

**Deliverable**: Caching architecture document in `research.md` with client-side and server-side caching strategies.

---

#### 3. Chart Library Selection
**Question**: Which chart library to use - Recharts vs Chart.js?

**Research Tasks**:
- Compare Recharts vs Chart.js for:
  - Mobile performance (60 FPS scrolling requirement)
  - Bundle size impact (must stay < 500KB total gzipped)
  - React integration and hooks support
  - Accessibility (WCAG AA compliance)
  - Customization capabilities (match Telegram theme)
  - TypeScript support
- Evaluate Victory Charts and Nivo as alternatives
- Test rendering performance with large datasets (1000+ data points)
- Verify tree-shaking capabilities to minimize bundle impact

**Deliverable**: Chart library decision matrix in `research.md` with performance benchmarks and bundle size analysis.

---

#### 4. Export Implementation
**Question**: Server-side vs client-side PDF generation for analytics exports?

**Research Tasks**:
- Research PDF generation libraries for Deno (Edge Functions):
  - jsPDF, pdfmake, Puppeteer (headless browser)
- Evaluate CSV generation approaches (server-side vs client-side)
- Investigate file size limits for exports (Supabase Storage constraints)
- Determine export job queue implementation (pg_cron, Edge Function scheduling)
- Research progress tracking for long-running export jobs
- Evaluate email delivery vs download link for completed exports

**Deliverable**: Export architecture document in `research.md` with chosen approach for CSV, PDF, and JSON exports.

---

#### 5. Notification System Architecture
**Question**: Should notifications use Supabase Realtime, Edge Functions with cron, or separate service?

**Research Tasks**:
- Investigate Supabase Realtime for push notifications vs polling
- Research Telegram Bot API for push notifications integration
- Evaluate notification rate limiting strategies (max 5 per hour per Constitution)
- Determine notification persistence and delivery guarantees
- Research notification preference management (enable/disable per category)
- Investigate batching strategies for multiple simultaneous milestones

**Deliverable**: Notification architecture document in `research.md` with delivery mechanism and rate limiting strategy.

---

#### 6. Mobile Performance Optimization
**Question**: How to achieve 60 FPS scrolling with large datasets and charts on mobile?

**Research Tasks**:
- Research react-virtuoso for virtualizing large analytics lists
- Investigate chart data sampling/downsampling for mobile performance
- Evaluate lazy loading strategies for below-the-fold charts
- Research Intersection Observer API for progressive chart rendering
- Determine optimal data point count for mobile chart rendering
- Investigate Service Worker caching for analytics dashboard assets

**Deliverable**: Mobile performance optimization guide in `research.md` with virtualization and rendering strategies.

---

#### 7. Property-Based Testing Approach
**Question**: How to implement property-based testing for analytics calculations per Constitution requirement?

**Research Tasks**:
- Research fast-check library for property-based testing in TypeScript
- Identify key properties for analytics calculations:
  - Engagement rate = (likes + comments + shares) / plays * 100
  - Completion rate = completions / plays * 100
  - Viral coefficient = shares / plays
- Define property tests for aggregation functions (associativity, commutativity)
- Evaluate test coverage for edge cases (zero plays, negative values, overflow)
- Research generative testing for demographic data distributions

**Deliverable**: Property-based testing strategy in `research.md` with test cases and library integration plan.

---

### Research Timeline

**Phase 0 Duration**: 3-4 days

**Day 1**: Data aggregation strategy, caching strategy  
**Day 2**: Chart library selection, mobile performance optimization  
**Day 3**: Export implementation, notification system architecture  
**Day 4**: Property-based testing approach, consolidate findings into `research.md`

**Output**: `research.md` with all decisions documented using the format:
- **Decision**: [what was chosen]
- **Rationale**: [why chosen based on requirements and constraints]
- **Alternatives Considered**: [what else was evaluated and why rejected]
- **Implementation Notes**: [key technical considerations]

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete with all technical decisions finalized.

### 1.1 Data Model Design

**Objective**: Design database schema for analytics data storage based on contracts/types.ts.

**Tasks**:
1. **Extract entities from feature spec and contracts**:
   - `analytics_events` - Raw event tracking table
   - `track_analytics` - Daily aggregated metrics table
   - `demographic_summaries` - Privacy-safe demographic rollups
   - `revenue_summaries` - Financial metrics table
   - `analytics_exports` - Export job tracking table
   - `notification_preferences` - User notification settings

2. **Define relationships**:
   - `analytics_events.track_id` → `tracks.id`
   - `analytics_events.version_id` → `track_versions.id`
   - `analytics_events.user_id` → `profiles.id` (nullable for anonymous)
   - `track_analytics.track_id` → `tracks.id`
   - `track_analytics.version_id` → `track_versions.id` (nullable for aggregated)
   - All analytics tables scoped by creator via RLS policies

3. **Define validation rules**:
   - `completion_percentage`: 0-100 range constraint
   - `engagement_rate`: computed field, non-negative
   - `event_timestamp`: cannot be future date
   - `demographic_summaries`: only created when `play_count >= 100`

4. **State transitions**:
   - Analytics events: immutable once inserted
   - Export jobs: pending → processing → completed/failed
   - Aggregations: incremental updates on new events

**Output**: `data-model.md` with:
- Entity-relationship diagram (Mermaid syntax)
- Table schemas with field types, constraints, indexes
- RLS policy specifications
- Data retention policies (90-day TTL on raw events)

---

### 1.2 API Contract Generation

**Objective**: Validate and document API contracts based on contracts/analytics-api.yaml.

**Tasks**:
1. **Review existing OpenAPI specification** (contracts/analytics-api.yaml):
   - 8 endpoints already defined
   - Request/response schemas validated
   - Error responses documented

2. **Generate TypeScript types** from OpenAPI spec:
   - Use openapi-typescript or similar tool
   - Ensure types match contracts/types.ts
   - Generate client SDK for type-safe API calls

3. **Define Edge Function contracts**:
   - `/analytics/tracks/{track_id}` - GET track summary
   - `/analytics/tracks/{track_id}/trends` - GET time-series data
   - `/analytics/tracks/{track_id}/demographics` - GET audience insights
   - `/analytics/tracks/{track_id}/revenue` - GET revenue data
   - `/analytics/tracks/{track_id}/compare-versions` - GET A/B comparison
   - `/analytics/export` - POST create export job
   - `/analytics/export/{job_id}` - GET export status
   - `/analytics/benchmarks/{genre}` - GET platform benchmarks

4. **Add event ingestion endpoint**:
   - `/analytics/events` - POST batch event ingestion
   - Internal endpoint for client-side event tracking

**Output**: Validated `contracts/analytics-api.yaml` (already exists, verify completeness) and generated TypeScript client types.

---

### 1.3 Quickstart Guide

**Objective**: Create developer onboarding documentation for implementing analytics features.

**Tasks**:
1. **Setup instructions**:
   - Database migration: `supabase db push`
   - Environment variables (if any)
   - Install dependencies: recharts, fast-check (dev)

2. **Integration examples**:
   - How to track analytics events from track playback
   - How to fetch and display analytics in a component
   - How to implement export functionality
   - How to add new analytics metrics

3. **Testing guide**:
   - Running unit tests: `npm test -- analytics`
   - Running integration tests: `npm test -- integration/analytics`
   - Property-based tests: `npm test -- property/analytics`
   - Seeding test data for development

4. **Architecture overview**:
   - Event flow: client → ingest endpoint → database → aggregation job → API
   - Data lifecycle: raw events (90d) → aggregated metrics (permanent)
   - Caching strategy: client-side (TanStack Query) + server-side (PostgreSQL indexes)

**Output**: `quickstart.md` with step-by-step developer guide, code examples, and architecture diagrams.

---

### 1.4 Agent Context Update

**Objective**: Update GitHub Copilot instructions with analytics feature context.

**Tasks**:
1. **Run context update script**:
   ```bash
   .specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot
   ```

2. **Add analytics-specific context**:
   - New hooks: `useTrackAnalytics`, `useDemographics`, etc.
   - New components: `AnalyticsDashboard`, `AnalyticsChart`, etc.
   - Analytics service layer patterns
   - Privacy threshold enforcement (100 plays for demographics)
   - Event tracking patterns

3. **Preserve manual additions**:
   - Keep existing Copilot context between markers
   - Only add NEW technology and patterns from analytics feature
   - Update with analytics conventions (e.g., metric calculation formulas)

**Output**: Updated `.github/copilot-instructions.md` with analytics feature context.

---

### 1.5 Database Migration Script

**Objective**: Create Supabase migration for analytics schema.

**Tasks**:
1. **Create migration file**: `supabase/migrations/20260104_creator_analytics.sql`

2. **Include in migration**:
   - All 6 analytics tables with proper types and constraints
   - Indexes on frequently queried fields (track_id, user_id, event_timestamp, date)
   - RLS policies for all tables (creator can only see their own analytics)
   - TTL policy for analytics_events (90-day retention)
   - Functions/triggers for automatic aggregation (optional, can be in Edge Functions)
   - Default notification preferences for existing users

3. **Test migration**:
   - Apply to local Supabase instance
   - Verify RLS policies work correctly
   - Test rollback (if needed)
   - Ensure no impact on existing track playback queries

**Output**: `supabase/migrations/20260104_creator_analytics.sql` ready for deployment.

---

### Phase 1 Timeline

**Phase 1 Duration**: 4-5 days

**Day 1**: Data model design (data-model.md)  
**Day 2**: API contract validation and TypeScript type generation  
**Day 3**: Database migration script creation and testing  
**Day 4**: Quickstart guide writing  
**Day 5**: Agent context update and Phase 1 review

**Phase 1 Deliverables**:
- ✅ `data-model.md` with complete schema design
- ✅ `contracts/analytics-api.yaml` validated (already exists)
- ✅ `contracts/types.ts` validated (already exists)
- ✅ `quickstart.md` with developer onboarding guide
- ✅ `supabase/migrations/20260104_creator_analytics.sql` migration script
- ✅ Updated `.github/copilot-instructions.md` with analytics context

---

### Post-Phase 1 Constitution Re-check

After Phase 1 design artifacts are complete, re-evaluate Constitution compliance:

- [ ] **Principle I: Quality & Testing** - Are test plans comprehensive? TDD for P1?
- [ ] **Principle II: Security & Privacy** - RLS policies correct? Privacy thresholds enforced?
- [ ] **Principle III: Observability** - Logging and metrics integrated?
- [ ] **Principle IV: Incremental Delivery** - Can we ship Phase 1 independently?
- [ ] **Principle V: Simplicity** - Contracts clear? No over-engineering?
- [ ] **Principle VI: Performance** - Performance benchmarks defined? Bundle size checked?
- [ ] **Principle VII: i18n & a11y** - Internationalization considered? Charts accessible?
- [ ] **Principle VIII: Telegram-first UX** - Navigation seamless? Theme integrated?

**Gate**: If any principle fails re-check, design must be revised before proceeding to Phase 2 (tasks generation).

---

## Phase 2: Task Breakdown (Generated by /speckit.tasks)

**Note**: This section is intentionally left empty. Phase 2 task breakdown will be generated by the `/speckit.tasks` command after Phase 0 (research) and Phase 1 (design) are complete.

The `/speckit.tasks` command will create `tasks.md` with:
- Detailed implementation tasks organized by phase
- Task dependencies and sequencing
- Time estimates for each task
- Assignment suggestions
- Acceptance criteria for each task

**Command to run after Phase 1 completion**:
```bash
/speckit.tasks
```

---

## Implementation Phases & Milestones

This section outlines the phased delivery approach for incremental value delivery per Constitution Principle IV.

### Phase A: Foundation & Core Analytics (P1 - MVP)

**Goal**: Deliver minimum viable analytics dashboard with core performance metrics.

**Scope**:
- Database schema and migrations
- Event ingestion system
- Basic aggregation jobs (daily rollups)
- Track performance overview API endpoint
- Analytics dashboard page with performance metrics card
- Basic trend visualization (7d, 30d time ranges)
- Unit tests for core hooks and services

**Success Criteria**:
- Creators can view play count, completion rate, engagement metrics
- Analytics update within 5 minutes of events
- Dashboard loads in < 2s on 4G
- 80%+ test coverage for Phase A code

**Duration**: 2-3 weeks

**Deliverables**:
- `/analytics/:trackId` page functional
- `useTrackAnalytics` hook working
- Basic `AnalyticsChart` component
- Database migration deployed
- Event tracking integrated with player

---

### Phase B: Audience Insights (P1 - Value Add)

**Goal**: Add demographic and behavioral insights for audience understanding.

**Scope**:
- Demographics API endpoint with privacy thresholds
- Audience insights card with age/location visualization
- Geographic distribution map component
- Peak listening hours analysis
- Privacy messaging (< 100 plays threshold)

**Success Criteria**:
- Demographics displayed when play count >= 100
- Privacy-compliant data aggregation
- Clear "insufficient data" messaging
- Demographic visualizations accessible (WCAG AA)

**Duration**: 1-2 weeks

**Deliverables**:
- `useDemographics` hook functional
- `AudienceInsightsCard` component
- `DemographicMap` visualization
- Privacy filter integration

---

### Phase C: Engagement & Revenue (P2)

**Goal**: Add detailed engagement metrics and revenue tracking.

**Scope**:
- Engagement metrics API (likes, comments, shares breakdown)
- Revenue API with RPM and projections
- Revenue card with earnings visualization
- Engagement breakdown charts
- Settlement tracking

**Success Criteria**:
- Revenue data accurate within 1 cent
- Projections based on 30-day moving average
- Engagement metrics match social features
- Revenue updates in real-time

**Duration**: 1-2 weeks

**Deliverables**:
- `useRevenueData` hook functional
- `RevenueCard` component
- `EngagementMetricsCard` component
- Revenue projection algorithm

---

### Phase D: Version Comparison (P3)

**Goal**: Enable A/B testing with version performance comparison.

**Scope**:
- Version comparison API with statistical analysis
- A/B comparison card with differential visualization
- Confidence level calculations
- Recommendation engine (which version is better)
- Version switching integration

**Success Criteria**:
- Statistical significance calculated correctly
- Both versions need 100+ plays for comparison
- Clear winner recommendation when confidence > 80%
- Version switcher integration

**Duration**: 1 week

**Deliverables**:
- `useVersionComparison` hook functional
- `VersionComparisonCard` component
- Statistical analysis library
- Version recommendation logic

---

### Phase E: Notifications & Benchmarks (P3)

**Goal**: Real-time alerts and platform comparison features.

**Scope**:
- Notification system with Telegram Bot integration
- Milestone notifications (1K, 10K, 100K, 1M plays)
- Trending alerts (5x engagement spike)
- Platform benchmarks API by genre
- Benchmark comparison visualization
- Notification preferences management

**Success Criteria**:
- Notifications delivered within 1 minute of milestone
- Rate limiting enforced (max 5/hour)
- Benchmarks updated daily
- Genre-specific comparisons accurate

**Duration**: 1-2 weeks

**Deliverables**:
- `useAnalyticsNotifications` hook
- `BenchmarkComparison` component
- Telegram Bot notification integration
- Notification preferences UI

---

### Phase F: Export & Advanced Features (P3)

**Goal**: Data export capabilities and advanced analytics.

**Scope**:
- Export job system (async processing)
- CSV export generation
- PDF export with charts
- JSON export for programmatic access
- Export status polling
- Download link generation with 7-day expiry
- Export history tracking

**Success Criteria**:
- Exports complete within 2 minutes for 90-day data
- File size limits respected (< 50MB)
- Export links expire after 7 days
- All formats generated correctly

**Duration**: 1-2 weeks

**Deliverables**:
- `useAnalyticsExport` hook functional
- `ExportDialog` component
- Export job queue system
- PDF/CSV/JSON generators
- Export status tracking UI

---

## Key Technical Decisions Summary

Based on user prompt, the following technical decisions need to be made during Phase 0 research:

### 1. Data Aggregation Approach
**Options**: Real-time (materialized views) vs Batch (scheduled jobs)

**Recommendation**: Hybrid approach
- **Real-time** for current-day metrics (incremental updates on writes)
- **Batch** for historical aggregations (daily job at midnight UTC)
- Use PostgreSQL materialized views for frequently queried aggregates
- Edge Function cron job for daily rollups

**Rationale**: Balances freshness requirement (5 min updates) with performance and cost.

---

### 2. Caching Strategy
**Options**: TanStack Query only vs Multi-layer caching

**Recommendation**: Multi-layer caching
- **Client-side**: TanStack Query with 30s stale time, 10min cache time
- **Server-side**: PostgreSQL indexes + query result caching
- **Aggregate tables**: Pre-computed daily rollups for historical data
- Invalidation: Time-based for historical, event-based for current-day

**Rationale**: Reduces API calls, improves dashboard load time, supports offline viewing.

---

### 3. Chart Library
**Options**: Recharts, Chart.js, Victory, Nivo

**Recommendation**: **Recharts**

**Rationale**:
- Native React integration (no wrapper needed)
- Excellent TypeScript support
- Tree-shakeable (bundle impact ~50KB gzipped)
- Good mobile performance (SVG-based, smooth animations)
- Accessible by default (ARIA labels, keyboard navigation)
- Easy theming (matches Telegram design system)
- Active maintenance and community

**Alternatives Considered**:
- Chart.js: Canvas-based (harder to style, less accessible)
- Victory: Larger bundle size (~100KB gzipped)
- Nivo: Overkill for our needs, complex API

---

### 4. Export Implementation
**Options**: Client-side generation vs Server-side generation

**Recommendation**: **Server-side generation** via Edge Functions

**Rationale**:
- **CSV**: Server-side (simple, efficient, supports large datasets)
- **JSON**: Server-side (direct database export)
- **PDF**: Server-side using jsPDF or Puppeteer (charts rendering, consistent formatting)
- Async job queue for large exports (>10K rows)
- Progress tracking via polling endpoint
- File storage in Supabase Storage with 7-day TTL

**Why not client-side**:
- Mobile devices have limited memory (can't handle large datasets)
- PDF generation with charts requires server rendering
- Consistent formatting across devices
- Better error handling and retry logic

---

### 5. Notification System
**Options**: Supabase Realtime, Edge Functions + cron, Telegram Bot API

**Recommendation**: **Telegram Bot API** with Edge Function triggers

**Architecture**:
- Edge Function checks for milestones/trending after each aggregation job
- Sends notification via Telegram Bot API (`sendMessage`)
- Rate limiting: Redis or PostgreSQL-based (max 5/hour per user)
- Notification preferences stored in `notification_preferences` table
- Delivery guarantees: At-least-once (idempotent bot messages)

**Rationale**:
- Native Telegram integration (notifications appear in chat)
- No additional service needed (Telegram Bot API is free)
- Users already in Telegram ecosystem
- Supports rich formatting (MarkdownV2)
- Can include deep links to analytics dashboard

---

### 6. Mobile Performance Strategy

**Optimization Techniques**:
1. **Virtualization**: react-virtuoso for long lists (if needed)
2. **Chart data sampling**: Max 100 data points on mobile (downsample larger datasets)
3. **Lazy loading**: Intersection Observer for below-the-fold charts
4. **Service Worker**: Cache dashboard assets for instant loads
5. **Code splitting**: Lazy load analytics page and chart library
6. **Image optimization**: WebP for chart exports (if applicable)

**Performance Targets**:
- Time to Interactive: < 2s
- Smooth scrolling: 60 FPS
- Chart render time: < 300ms
- Bundle size impact: < 100KB gzipped (Recharts + analytics code)

---

### 7. Property-Based Testing Strategy

**Library**: **fast-check** for TypeScript property-based testing

**Test Properties**:
1. **Engagement Rate Calculation**:
   - Property: `engagement_rate >= 0`
   - Property: `engagement_rate <= 100` when plays > 0
   - Property: `engagement_rate = 0` when plays = 0

2. **Completion Rate Calculation**:
   - Property: `completion_rate >= 0`
   - Property: `completion_rate <= 100`
   - Property: `completion_rate = (completions / plays) * 100`

3. **Aggregation Associativity**:
   - Property: `aggregate(day1) + aggregate(day2) = aggregate(day1 + day2)`
   - Ensures daily rollups can be combined

4. **Privacy Threshold**:
   - Property: `demographics visible <=> play_count >= 100`
   - Property: Demographics never shown when threshold not met

**Implementation**:
```typescript
import * as fc from 'fast-check';

describe('Analytics Calculations', () => {
  it('engagement rate is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.nat(), // plays
        fc.nat(), // likes
        fc.nat(), // comments
        fc.nat(), // shares
        (plays, likes, comments, shares) => {
          const rate = calculateEngagementRate(plays, likes, comments, shares);
          return rate >= 0 && rate <= 100;
        }
      )
    );
  });
});
```

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

**Coverage Target**: 80% for Phase A (MVP), 85%+ for subsequent phases

**Test Categories**:
1. **Hooks Tests** (`tests/unit/hooks/analytics/`):
   - `useTrackAnalytics.test.ts` - API data fetching, caching, error handling
   - `useDemographics.test.ts` - Privacy threshold enforcement
   - `useRevenueData.test.ts` - Revenue calculations, projections
   - `useVersionComparison.test.ts` - Statistical analysis, recommendations

2. **Component Tests** (`tests/unit/components/analytics/`):
   - `AnalyticsDashboard.test.tsx` - Layout, navigation, loading states
   - `TrackPerformanceCard.test.tsx` - Metric display, formatting
   - `AnalyticsChart.test.tsx` - Chart rendering, interactions
   - `ExportDialog.test.tsx` - Form validation, job submission

3. **Service Tests** (`tests/unit/services/analytics/`):
   - `analyticsService.test.ts` - API client, request/response handling
   - `metricsCalculator.test.ts` - Calculation accuracy
   - `privacyFilter.test.ts` - Threshold enforcement

4. **Utility Tests** (`tests/unit/lib/analytics/`):
   - `chartHelpers.test.ts` - Data transformation, sampling
   - Property-based tests for calculation functions

---

### Integration Tests

**Test Categories**:
1. **API Endpoint Tests** (`tests/integration/analytics-api.test.ts`):
   - End-to-end API calls with test database
   - RLS policy enforcement
   - Response format validation
   - Error handling (401, 403, 404, 451)

2. **Aggregation Job Tests** (`tests/integration/analytics-aggregation.test.ts`):
   - Event ingestion → aggregation → API response flow
   - Daily rollup accuracy
   - Incremental aggregation correctness

3. **Export Job Tests** (`tests/integration/analytics-export.test.ts`):
   - Export request → job processing → file generation → download
   - Format validation (CSV, PDF, JSON)
   - Expiry mechanism

---

### Property-Based Tests

**File**: `tests/property/analytics-calculations.test.ts`

**Properties to Test**:
- Engagement rate bounds (0-100%)
- Completion rate bounds (0-100%)
- Viral coefficient non-negativity
- Aggregation associativity
- Privacy threshold enforcement
- Revenue calculations (no negative revenue)

---

### E2E Tests (Optional, Recommended)

**Tool**: Playwright

**Critical User Journeys**:
1. Creator views analytics dashboard for their track
2. Creator exports analytics data to PDF
3. Creator receives milestone notification in Telegram
4. Creator compares A/B versions and switches active version

---

### Test Data Strategy

**Development**:
- Seed script: `scripts/seed-analytics-data.ts`
- Generates realistic analytics events for testing
- Creates tracks with varying play counts (0, 50, 500, 10K, 100K)
- Generates demographic distributions
- Creates export jobs in different states

**CI/CD**:
- Use Supabase test project with isolated database
- Reset database before each test run
- Mock Telegram Bot API calls
- Mock export file generation (use test files)

---

## Database Schema Overview

### Tables Summary

1. **analytics_events** (Raw events, 90-day retention)
   - Captures every user interaction
   - Fields: id, track_id, version_id, user_id, event_type, event_timestamp, listen_duration, completion_percentage, user_age_range, user_country, session_id
   - Indexes: track_id, event_timestamp, user_id
   - Partitioned by month for performance

2. **track_analytics** (Aggregated metrics, permanent)
   - Daily rollups of track performance
   - Fields: track_id, version_id (nullable), date, play_count, unique_listeners, completion_count, completion_rate, average_listen_duration, skip_count, skip_rate, like_count, comment_count, share_count, playlist_add_count, engagement_rate, viral_coefficient
   - Indexes: track_id, date, version_id
   - Materialized view for current-day metrics

3. **demographic_summaries** (Privacy-safe aggregates)
   - Generated only when play_count >= 100
   - Fields: track_id, date_range_start, date_range_end, age_distribution (JSONB), geographic_distribution (JSONB), peak_listening_hours (INT[]), average_session_duration, total_unique_listeners
   - RLS: Creator can only see their own track demographics

4. **revenue_summaries** (Financial metrics)
   - Fields: track_id, date_range_start, date_range_end, total_revenue, revenue_by_source (JSONB), rpm, projected_30_day_revenue, projected_90_day_revenue, settled_revenue, pending_revenue, pending_settlement_date
   - RLS: Creator can only see their own track revenue

5. **analytics_exports** (Export job tracking)
   - Fields: id, user_id, track_ids (UUID[]), format, date_range_start, date_range_end, status, download_url, file_size, expires_at, created_at, completed_at, error_message
   - Status: pending, processing, completed, failed
   - Auto-cleanup: Delete files after expires_at

6. **notification_preferences** (User settings)
   - Fields: user_id, milestones_enabled, trending_enabled, charts_enabled, updated_at
   - Default: All notifications enabled for new users

---

### RLS Policies

**Pattern**: All analytics tables follow the same RLS pattern:

```sql
-- Example for track_analytics table
CREATE POLICY "Users can view analytics for their own tracks"
ON track_analytics
FOR SELECT
USING (
  track_id IN (
    SELECT id FROM tracks WHERE user_id = auth.uid()
  )
);
```

**Applied to**:
- track_analytics
- demographic_summaries
- revenue_summaries
- analytics_exports (user_id = auth.uid())
- notification_preferences (user_id = auth.uid())

**Note**: analytics_events table has no direct user SELECT access (only via aggregation jobs).

---

## API Endpoints Summary

### Implemented Endpoints (from contracts/analytics-api.yaml)

1. **GET /analytics/tracks/{track_id}**
   - Returns: Track performance summary
   - Query params: date_range, aggregate_versions
   - Auth: Required (track ownership)

2. **GET /analytics/tracks/{track_id}/trends**
   - Returns: Time-series daily stats
   - Query params: days (7, 30, 90)
   - Auth: Required

3. **GET /analytics/tracks/{track_id}/demographics**
   - Returns: Audience demographics (if play_count >= 100)
   - Query params: date_range
   - Auth: Required
   - Error: 451 if insufficient data

4. **GET /analytics/tracks/{track_id}/revenue**
   - Returns: Revenue summary with projections
   - Query params: date_range
   - Auth: Required

5. **GET /analytics/tracks/{track_id}/compare-versions**
   - Returns: A/B version comparison with confidence
   - Query params: date_range
   - Auth: Required

6. **POST /analytics/export**
   - Creates: Export job
   - Body: track_ids, format, date_range, include_charts
   - Returns: job_id, status, poll_url
   - Auth: Required

7. **GET /analytics/export/{job_id}**
   - Returns: Export job status and download URL
   - Auth: Required (job ownership)

8. **GET /analytics/benchmarks/{genre}**
   - Returns: Platform averages and percentiles
   - Query params: date_range
   - Auth: Required

### Internal Endpoint (not in contracts)

9. **POST /analytics/events**
   - Purpose: Batch event ingestion from client
   - Body: Array of AnalyticsEvent objects
   - Rate limited: 100 events per request
   - Auth: Required

---

## Frontend Components Architecture

### Page Components

1. **AnalyticsPage.tsx** (`/analytics/:trackId`)
   - Main analytics dashboard page
   - Route: `/analytics/:trackId?range=30d`
   - Layout: Mobile-first, scrollable cards
   - State: Track ID from URL, date range from query param

### Container Components

2. **AnalyticsDashboard.tsx**
   - Orchestrates all analytics cards
   - Handles date range selection
   - Manages loading states
   - Error boundaries

### Card Components (Feature-specific)

3. **TrackPerformanceCard.tsx**
   - Displays: Play count, unique listeners, completion rate, skip rate
   - Chart: Line chart with 7/30/90 day trend
   - Actions: None (read-only)

4. **AudienceInsightsCard.tsx**
   - Displays: Age distribution, geographic distribution, peak hours
   - Visualizations: Bar chart (age), map (geography), heatmap (hours)
   - Privacy: "Insufficient data" message if < 100 plays

5. **EngagementMetricsCard.tsx**
   - Displays: Likes, comments, shares, playlist adds, engagement rate
   - Chart: Stacked bar chart for engagement breakdown
   - Actions: Deep link to comments/likes

6. **RevenueCard.tsx**
   - Displays: Total revenue, RPM, projections, pending vs settled
   - Chart: Line chart with revenue trend
   - Actions: View detailed breakdown

7. **VersionComparisonCard.tsx**
   - Displays: Side-by-side A/B metrics with differential
   - Chart: Comparison bars with confidence indicator
   - Actions: Switch active version (if recommended)

8. **BenchmarkComparison.tsx**
   - Displays: Your performance vs platform averages
   - Chart: Percentile position indicator
   - Actions: Filter by genre

### Reusable Components

9. **AnalyticsChart.tsx**
   - Wrapper around Recharts with theme integration
   - Props: type (line/bar/area), data, config
   - Responsive: Auto-adjusts to mobile screen

10. **MetricCard.tsx**
    - Displays single metric with label, value, trend
    - Props: label, value, trend, icon
    - Variants: Large (dashboard), small (inline)

11. **TrendIndicator.tsx**
    - Shows up/down arrow with percentage change
    - Props: value (percentage), direction (up/down)
    - Color: Green (up), red (down), gray (neutral)

12. **DemographicMap.tsx**
    - SVG-based world map with country highlights
    - Props: geographic_distribution data
    - Interactive: Hover for country details

13. **ExportDialog.tsx**
    - Modal for export options
    - Forms: track selection, date range, format
    - Progress: Polling for job completion

---

## Hooks Architecture

### Data Fetching Hooks (TanStack Query)

1. **useTrackAnalytics(trackId, dateRange)**
   - Fetches: Track performance summary
   - Cache: 30s stale, 10min gc
   - Refetch: On window focus (disabled), on date range change

2. **useAnalyticsTrends(trackId, days)**
   - Fetches: Time-series trend data
   - Cache: 1min stale, 10min gc
   - Dependencies: trackId, days

3. **useDemographics(trackId, dateRange)**
   - Fetches: Audience demographics (with privacy check)
   - Cache: 5min stale, 15min gc
   - Error handling: 451 (insufficient data)

4. **useRevenueData(trackId, dateRange)**
   - Fetches: Revenue metrics
   - Cache: 1min stale, 10min gc
   - Real-time updates: WebSocket (optional)

5. **useVersionComparison(trackId, dateRange)**
   - Fetches: A/B comparison with confidence
   - Cache: 2min stale, 10min gc
   - Conditional: Only if track has 2 versions

6. **usePlatformBenchmarks(genre, dateRange)**
   - Fetches: Platform-wide averages
   - Cache: 1 hour stale, 2 hour gc (benchmarks change slowly)
   - Global: Shared across tracks in same genre

### Mutation Hooks

7. **useAnalyticsExport()**
   - Mutation: Create export job
   - Success: Start polling for completion
   - Error: Show toast notification

8. **useUpdateNotificationPreferences()**
   - Mutation: Update user notification settings
   - Optimistic updates: Immediately update UI
   - Rollback: On error

### Utility Hooks

9. **useAnalyticsNotifications()**
   - Subscription: Listen for new notifications
   - Integration: Telegram Bot API (via webhook)
   - State: Unread count, notification list

10. **useExportPolling(jobId)**
    - Polling: Check export job status every 2 seconds
    - Stop: When status = completed/failed
    - Timeout: 5 minutes (show error if not complete)

---

## State Management

### Zustand Store: analyticsStore.ts

**State**:
```typescript
interface AnalyticsState {
  // Current view state
  selectedDateRange: '7d' | '30d' | '90d' | 'all';
  setSelectedDateRange: (range) => void;
  
  // Filters
  versionFilter: 'all' | 'A' | 'B';
  setVersionFilter: (filter) => void;
  
  // Export state
  activeExportJobId: string | null;
  setActiveExportJobId: (jobId) => void;
  
  // Notifications
  unreadNotifications: number;
  setUnreadNotifications: (count) => void;
}
```

**Usage**: Global state for analytics dashboard (shared across components).

---

## Service Layer

### analyticsService.ts

**Responsibilities**:
- API client for all analytics endpoints
- Request/response transformation
- Error handling and retries
- Type-safe API calls

**Key Methods**:
```typescript
class AnalyticsService {
  async getTrackAnalytics(trackId, dateRange): Promise<TrackAnalyticsResponse>
  async getTrends(trackId, days): Promise<TrendDataResponse>
  async getDemographics(trackId, dateRange): Promise<DemographicSummaryResponse>
  async getRevenue(trackId, dateRange): Promise<RevenueSummaryResponse>
  async compareVersions(trackId, dateRange): Promise<VersionComparisonResponse>
  async getBenchmarks(genre, dateRange): Promise<BenchmarkResponse>
  async createExport(request): Promise<ExportJobResponse>
  async getExportStatus(jobId): Promise<ExportStatusResponse>
}
```

---

### eventTracker.ts

**Responsibilities**:
- Client-side event tracking
- Batch event buffering (send every 30 seconds or 10 events)
- Session management
- Privacy-safe data collection

**Key Methods**:
```typescript
class EventTracker {
  trackPlay(trackId, versionId): void
  trackComplete(trackId, versionId, duration): void
  trackSkip(trackId, versionId, duration): void
  trackLike(trackId): void
  trackShare(trackId): void
  trackComment(trackId): void
  
  private flush(): void // Send buffered events to API
}
```

**Integration**: Called from player hooks (useGlobalAudioPlayer).

---

## GDPR Compliance & Data Privacy

### Privacy-by-Design Principles

1. **Data Minimization**:
   - Only collect necessary analytics events
   - No PII stored (user_age_range, not exact age)
   - Country-level geography (not city/IP)
   - Anonymous listeners (user_id nullable)

2. **Demographic Threshold**:
   - Demographics displayed only when play_count >= 100
   - Prevents re-identification of small cohorts
   - Clear UI messaging about insufficient data

3. **Data Retention**:
   - Raw events: 90-day retention (automatic deletion)
   - Aggregated metrics: Permanent (no PII)
   - Export files: 7-day expiry (automatic cleanup)

4. **User Rights**:
   - Right to access: Via analytics dashboard
   - Right to deletion: Delete track → cascade delete analytics
   - Right to export: Via export feature (CSV/JSON)
   - Right to opt-out: Notification preferences

5. **Consent**:
   - Analytics tracking disclosed in Terms of Service
   - Notification preferences: Opt-in by default, easy opt-out
   - Export feature: Explicit user action required

---

### Security Measures

1. **Authentication**:
   - All API endpoints require valid Supabase JWT
   - Token validation in Edge Functions

2. **Authorization**:
   - RLS policies enforce track ownership
   - Creators can only see analytics for their own tracks
   - Exports scoped to user's tracks

3. **Rate Limiting**:
   - Event ingestion: 100 events per request, 1000/hour per user
   - API endpoints: 100 req/min per user (Supabase default)
   - Export jobs: 5 concurrent jobs per user

4. **Data Encryption**:
   - At rest: PostgreSQL encryption (Supabase)
   - In transit: HTTPS/TLS for all API calls
   - Exports: Presigned URLs with 7-day expiry

---

## Performance Optimization Plan

### Bundle Size Optimization

**Target**: < 100KB gzipped for analytics feature

**Strategies**:
1. **Code Splitting**:
   - Lazy load analytics page: `React.lazy(() => import('./AnalyticsPage'))`
   - Lazy load Recharts library (only when analytics page visited)
   - Separate chunk for analytics code

2. **Tree Shaking**:
   - Import specific Recharts components (not full library)
   - Use ES modules for all imports
   - Remove unused analytics types/utilities

3. **Compression**:
   - Vite builds with Brotli compression
   - Serve gzipped assets via CDN

**Estimated Sizes**:
- Recharts: ~50KB gzipped
- Analytics components: ~30KB gzipped
- Analytics hooks/services: ~15KB gzipped
- Total: ~95KB gzipped ✅

---

### Database Query Optimization

**Strategies**:
1. **Indexes**:
   - `CREATE INDEX idx_analytics_events_track_id ON analytics_events(track_id)`
   - `CREATE INDEX idx_analytics_events_timestamp ON analytics_events(event_timestamp)`
   - `CREATE INDEX idx_track_analytics_track_date ON track_analytics(track_id, date DESC)`

2. **Materialized Views**:
   - `mv_current_day_analytics`: Real-time aggregation for today
   - Refresh: On each event insert (incremental)

3. **Partitioning**:
   - Partition `analytics_events` by month
   - Automatic partition creation (pg_cron job)
   - Old partitions dropped after 90 days

4. **Query Optimization**:
   - Use date range filters in all queries
   - Avoid SELECT * (specify columns)
   - Use EXPLAIN ANALYZE for slow queries

**Expected Performance**:
- Track summary query: < 100ms
- Trends query (30 days): < 200ms
- Demographics query: < 150ms
- Export generation (90 days): < 30s

---

### Client-Side Performance

**Strategies**:
1. **Virtualization**:
   - Use react-virtuoso if analytics list grows (not initially needed)

2. **Chart Optimization**:
   - Downsample data: Max 100 points on mobile
   - Use ResponsiveContainer from Recharts (automatic resize)
   - Debounce chart interactions (zoom, pan)

3. **Caching**:
   - TanStack Query with aggressive caching
   - Service Worker for offline viewing
   - LocalStorage for user preferences (date range, version filter)

4. **Lazy Loading**:
   - Intersection Observer for below-the-fold cards
   - Load charts only when visible

**Performance Targets**:
- Initial load: < 2s (LCP < 2.5s)
- Smooth scrolling: 60 FPS
- Chart render: < 300ms
- Bundle size: < 100KB gzipped

---

## Migration Strategy

### Database Migration

**File**: `supabase/migrations/20260104_creator_analytics.sql`

**Steps**:
1. Create all 6 analytics tables
2. Create indexes
3. Create RLS policies
4. Create materialized view for current-day analytics
5. Create function for event TTL cleanup
6. Create default notification preferences for existing users
7. Grant permissions

**Rollback Plan**:
- Drop all analytics tables (cascade)
- Remove indexes
- Remove functions

**Testing**:
- Apply to local Supabase instance
- Verify RLS policies with test users
- Check no performance impact on existing queries
- Test rollback procedure

**Deployment**:
- Apply during low-traffic window
- Monitor slow query log
- Alert team if migration fails

---

### Frontend Migration

**Steps**:
1. Add analytics route to router
2. Add analytics navigation link (Telegram bottom nav)
3. Integrate event tracker with player
4. Deploy analytics components (behind feature flag initially)
5. Enable feature flag for beta users
6. Full rollout after 1 week of beta testing

**Feature Flag**:
```typescript
const ANALYTICS_ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
```

---

## Monitoring & Observability

### Metrics to Track

1. **Usage Metrics**:
   - Analytics dashboard page views
   - Unique users viewing analytics per day
   - Export requests per day
   - Notification delivery success rate

2. **Performance Metrics**:
   - Analytics API latency (p50, p95, p99)
   - Aggregation job duration
   - Export job duration
   - Dashboard load time (LCP)

3. **Business Metrics**:
   - % of creators viewing analytics weekly
   - % of creators exporting data
   - % of creators with notifications enabled
   - Average session duration on analytics dashboard

### Logging Strategy

**Structured Logs** (JSON format):

```json
{
  "timestamp": "2026-01-04T04:36:32Z",
  "level": "INFO",
  "service": "analytics-aggregation-job",
  "user_id": "uuid",
  "track_id": "uuid",
  "action": "aggregate_daily",
  "duration_ms": 1234,
  "rows_processed": 5000
}
```

**Log Levels**:
- **ERROR**: Aggregation failures, export failures, API errors
- **WARN**: Slow queries (> 500ms), rate limit hits
- **INFO**: Job completions, export completions, milestone notifications
- **DEBUG**: Event ingestion details, cache hits/misses

### Alerting

**Critical Alerts** (Page immediately):
- Analytics API error rate > 5%
- Aggregation job failing for > 1 hour
- Analytics updates delayed > 30 minutes

**Warning Alerts** (Notify team):
- API latency p95 > 1s
- Export job duration > 5 minutes
- Database disk usage > 80%

---

## Risks & Mitigation

### Risk 1: Aggregation Job Delay

**Risk**: Aggregation jobs take too long, analytics update delayed > 5 minutes

**Impact**: HIGH - Users see stale data, trust in analytics erodes

**Mitigation**:
- Incremental aggregation (only process new events)
- Parallel processing for multiple tracks
- Database indexing optimization
- Monitoring and alerting for job duration
- Fallback: Show "Data refreshing..." message if delay detected

**Likelihood**: MEDIUM

---

### Risk 2: Database Storage Growth

**Risk**: Raw events table grows too large (>1M events/day), impacting performance

**Impact**: MEDIUM - Slow queries, increased costs

**Mitigation**:
- 90-day TTL on raw events (automatic cleanup)
- Table partitioning by month
- Monitor storage usage
- Upgrade plan if needed
- Aggregated data is much smaller (daily rollups)

**Likelihood**: MEDIUM

---

### Risk 3: Chart Performance on Mobile

**Risk**: Charts render slowly on older mobile devices, 60 FPS not achieved

**Impact**: MEDIUM - Poor UX, users avoid analytics

**Mitigation**:
- Downsample chart data (max 100 points)
- Use Recharts (SVG-based, hardware accelerated)
- Lazy load charts (Intersection Observer)
- Test on mid-range Android devices
- Fallback: Show table view if device detected as low-end

**Likelihood**: LOW (Recharts is well-optimized)

---

### Risk 4: Privacy Threshold Too High

**Risk**: 100-play threshold means most tracks never show demographics

**Impact**: LOW - Feature less useful for small creators

**Mitigation**:
- Clearly explain threshold in UI ("Available after 100 plays")
- Consider lower threshold (50 plays?) if user feedback warrants
- Show other metrics that don't require threshold (play count, trends)
- Encourage creators to promote tracks to reach threshold

**Likelihood**: MEDIUM

**Decision**: Start with 100-play threshold, gather user feedback, adjust if needed.

---

### Risk 5: Export Job Queue Overwhelmed

**Risk**: Too many concurrent export requests, jobs time out

**Impact**: LOW - Exports fail, users retry (amplifies problem)

**Mitigation**:
- Limit 5 concurrent jobs per user
- Queue-based processing (first-in, first-out)
- Notify users of queue position
- Estimated completion time shown
- Cancel stale jobs after 10 minutes

**Likelihood**: LOW (most users won't export simultaneously)

---

## Success Metrics & KPIs

### Launch Success Criteria (1 week post-launch)

- [ ] **Adoption**: 40%+ of creators with tracks view analytics at least once
- [ ] **Performance**: Analytics dashboard loads in < 2s (p95)
- [ ] **Reliability**: API error rate < 1%
- [ ] **Engagement**: Average session duration > 2 minutes
- [ ] **Quality**: No critical bugs reported

### 30-Day Success Criteria

- [ ] **Active Usage**: 60%+ of creators view analytics weekly
- [ ] **Export Adoption**: 10%+ of creators export data at least once
- [ ] **Notification Engagement**: 70%+ of creators keep notifications enabled
- [ ] **Performance**: 95% of API calls < 500ms
- [ ] **Satisfaction**: User feedback score > 4/5 (if survey conducted)

### Long-Term KPIs (3 months)

- [ ] **Retention**: 80%+ of creators return to analytics monthly
- [ ] **Data-Driven Decisions**: 30%+ of creators act on analytics (e.g., switch versions, promote tracks)
- [ ] **Platform Engagement**: Analytics users have 20%+ higher track creation rate
- [ ] **Revenue Impact**: Creators using analytics generate 15%+ more revenue (RPM increase)
- [ ] **Support Burden**: <1% of analytics sessions result in support tickets

---

## Open Questions (To be resolved in Phase 0)

1. **Should we support custom date ranges (e.g., "Last 14 days", "December 2025")?**
   - Pro: More flexibility for creators
   - Con: More complex UI, potential performance impact
   - Decision: Start with preset ranges (7d, 30d, 90d, all), add custom later if requested

2. **Should revenue projections use linear regression or more advanced models?**
   - Pro: Advanced models (e.g., moving average, seasonality) more accurate
   - Con: More complex to implement, harder to explain to users
   - Decision: Start with 30-day moving average, iterate based on accuracy

3. **Should we show version-level analytics by default or aggregated?**
   - Pro: Aggregated is simpler, shows overall performance
   - Pro: Version-level is more granular, useful for A/B testing
   - Decision: Aggregated by default, toggle to show per-version breakdown

4. **Should demographic map be interactive (zoom, pan) or static?**
   - Pro: Interactive is engaging, better for large country lists
   - Con: More complex, potential performance issues on mobile
   - Decision: Static SVG map, show top 10 countries, full list in expandable section

5. **Should we implement real-time updates (WebSocket) or polling?**
   - Pro: Real-time feels more responsive, no polling overhead
   - Con: More complex infrastructure, may not be necessary (5-min update is acceptable)
   - Decision: Polling with 1-minute interval when dashboard is active, no real-time for MVP

---

## Appendix: Related Documentation

- [Feature Specification](./spec.md) - Full requirements and user stories
- [API Contracts](./contracts/analytics-api.yaml) - OpenAPI 3.0 specification
- [Type Definitions](./contracts/types.ts) - TypeScript schemas
- [Constitution](./../.specify/memory/constitution.md) - Project principles
- [Infrastructure Audit](./../../INFRASTRUCTURE_AUDIT_2025-12-03.md) - Storage and naming conventions

---

## Sign-off

**Plan Status**: ✅ Ready for Phase 0 (Research)

**Next Steps**:
1. Begin Phase 0 research (estimated 3-4 days)
2. Generate `research.md` with all technical decisions
3. Proceed to Phase 1 (Design & Contracts) after research complete
4. Run `/speckit.tasks` after Phase 1 to generate implementation tasks

**Plan Author**: GitHub Copilot Agent  
**Plan Date**: 2026-01-04  
**Plan Version**: 1.0.0
