# Feature Specification: Next Development Phases Roadmap

**Feature Branch**: `001-next-phases-roadmap`  
**Created**: 2025-12-02  
**Status**: Planning  
**Input**: User description: "изучи в деталях бэклог, спринты и задачи и создай спецификацию для следующих этапов разработки, структурировав и разбив на отдельные этапы"

## Overview

This specification defines a structured development roadmap for MusicVerse AI based on comprehensive analysis of the existing backlog, completed sprints (1-6), current work (Sprint 7), and planned initiatives. The roadmap organizes 35+ backlog tasks into prioritized development phases spanning Q4 2025 through Q2 2026, ensuring systematic delivery of critical features while maintaining code quality and user experience.

## Current State Analysis

### Completed Work (Sprints 1-6)
- ✅ Project setup with modern tech stack (React 19, TypeScript 5, Vite, Tailwind)
- ✅ Comprehensive code audit and documentation updates
- ✅ GitHub Actions automation for issue creation from TODO/FIXME comments
- ✅ Performance optimization and production hardening
- ✅ UI/UX audit with detailed 105-task implementation plan
- ✅ 25 ESLint errors fixed, TypeScript typing improved

### Current Sprint (Sprint 7 - 15% Complete)
- 🔄 Database migrations for track versioning system
- 🔄 TypeScript type system updates
- 🔄 Core hooks and queries for new features
- 🔄 Backend API filtering optimization

### Backlog Analysis
- **Total Tasks**: 35+ identified tasks across 7 epics
- **High Priority**: 15 tasks (E002, E003, E004, E007)
- **Medium Priority**: 12 tasks (E005, E006)
- **Low Priority**: 8 tasks (optimization, enhancement)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Mobile-First UI/UX Transformation (Priority: P1)

As a product manager, I need to complete the mobile-first UI/UX redesign initiative (Epic E007) that was planned in Sprint 6, ensuring all 6 user stories are implemented across 5 sprints with measurable improvements in mobile user engagement and satisfaction.

**Why this priority**: This is the highest business value initiative with 105 detailed tasks already planned. Mobile users represent the fastest-growing segment, and the current interface has significant usability issues on mobile devices. Success here directly impacts user retention and session duration.

**Independent Test**: Can be fully tested by deploying each sprint's deliverables to staging environment, running mobile E2E tests on 3 viewport sizes (320px, 375px, 390px), measuring Lighthouse mobile scores, and conducting user acceptance testing with 10+ mobile users per sprint. Each sprint delivers independently valuable features (library redesign, player optimization, etc.).

**Acceptance Scenarios**:

1. **Given** Sprint 7 infrastructure is complete, **When** deploying Sprint 8 (Library & Player MVP), **Then** mobile users can browse their library with touch-optimized cards (≥44px targets), switch between track versions seamlessly, and use the 3-mode player (compact/expanded/fullscreen) with queue management.

2. **Given** Sprint 9 features are deployed, **When** users access track details on mobile, **Then** they can view synchronized lyrics, manage track versions, access stems, see AI analysis, create personas from tracks, and add tracks to projects/playlists.

3. **Given** all UI/UX sprints are complete, **When** measuring against success criteria, **Then** Lighthouse mobile score exceeds 90, First Contentful Paint is under 2 seconds on 3G, mobile user session duration increases by 30%, and mobile user base grows by 50%.

---

### User Story 2 - Core Feature Completion (Authentication, Real-time, Payments) (Priority: P1)

As a product owner, I need to complete essential platform features including deep linking authentication (T005), real-time bot-to-app communication (T010), and payment integration (T011) to enable full user workflows and monetization before expanding to social features.

**Why this priority**: These are foundational capabilities that block other features. Deep linking enables proper user onboarding from Telegram bot. Real-time communication creates seamless bot-app integration. Payment system is critical for business model and must be completed before public launch.

**Independent Test**: Can be tested independently by: (1) Deep linking - clicking bot links and verifying correct Mini App navigation, (2) Real-time sync - generating music in bot and confirming instant updates in app, (3) Payments - completing full subscription purchase flow and verifying account upgrade.

**Acceptance Scenarios**:

1. **Given** a user receives a Telegram bot deep link, **When** they click it, **Then** the Mini App opens to the specific screen (track details, generation form, etc.) with correct context loaded.

2. **Given** a user initiates music generation in the Telegram bot, **When** generation completes, **Then** the Mini App library updates in real-time without refresh, showing the new track immediately.

3. **Given** a user wants to upgrade to premium, **When** they select a subscription plan in the app, **Then** they complete payment via Telegram Payments or Stripe, their account is upgraded instantly, and they receive confirmation in both app and bot.

---

### User Story 3 - Enhanced Library Experience (Infinite Scroll, Batch Actions, Context Menus) (Priority: P2)

As a user with a large music library (100+ tracks), I need infinite scrolling (T008), batch operations (T024), and context menus (T023) to efficiently manage my collection without performance degradation or tedious one-by-one actions.

**Why this priority**: Addresses scalability and user efficiency for power users. While not blocking core functionality, these improvements significantly reduce friction for engaged users who create substantial content. Impacts user satisfaction and retention for the most valuable user segment.

**Independent Test**: Can be tested by creating a test account with 500+ tracks, scrolling through the library to verify smooth infinite loading, selecting 20 tracks for batch deletion, and long-pressing tracks to access context menu with various actions.

**Acceptance Scenarios**:

1. **Given** a library with 500+ tracks, **When** user scrolls to bottom, **Then** next 50 tracks load within 500ms, scroll position is maintained, and skeleton loaders provide visual feedback during loading.

2. **Given** user needs to organize tracks, **When** they enable batch selection mode, **Then** they can select multiple tracks via checkboxes, see selection count, and apply actions (delete, add to project, change visibility) to all selected tracks simultaneously.

3. **Given** user wants quick track actions, **When** they long-press a track card, **Then** a context menu appears with options (play, add to queue, share, delete, edit, view details) within 100ms with haptic feedback.

---

### User Story 4 - User Experience Refinements (Notifications, Likes, Navigation, Accessibility) (Priority: P2)

As a regular user, I need better feedback mechanisms through notifications (T012), ability to favorite tracks (T013), improved navigation in generation wizard (T019), and accessible interface (T026) to have a more engaging and inclusive experience.

**Why this priority**: These improvements enhance overall platform usability and inclusiveness. Notifications keep users engaged, likes enable content curation, better navigation reduces errors, and accessibility ensures the platform is usable by everyone. While not critical for launch, these significantly improve user satisfaction.

**Independent Test**: Can be tested independently by: (1) triggering various events and verifying notification delivery, (2) liking/unliking tracks and seeing favorites list, (3) navigating back to previous wizard steps, (4) running automated accessibility tests and manual testing with screen readers.

**Acceptance Scenarios**:

1. **Given** user has generation in progress, **When** generation completes, **Then** user receives in-app notification and Telegram bot message with track preview and quick access link.

2. **Given** user discovers favorite tracks, **When** they tap the like button, **Then** track is added to favorites list, like count increments, and user can filter library to show only liked tracks.

3. **Given** user is in GenerateWizard step 5, **When** they want to modify step 2 input, **Then** they can navigate back to step 2, make changes, and return to step 5 without losing progress.

4. **Given** user with visual impairment uses screen reader, **When** they navigate the app, **Then** all interactive elements have proper ARIA labels, focus order is logical, and all actions are keyboard-accessible.

---

### User Story 5 - Code Quality and Developer Experience (Priority: P3)

As a developer, I need improved code organization through wizard refactoring (T020), clearer UX in dialogs (T021), better library sorting UI (T022), and navigation structure review (T025) to maintain code quality and enable faster feature development.

**Why this priority**: These are internal improvements that don't directly impact users but enable more efficient development. Important for long-term maintainability but can be done incrementally alongside feature work. Lower priority than user-facing features but critical for sustainable development velocity.

**Independent Test**: Can be tested through code review, TypeScript compilation checks, and developer onboarding exercises. Success measured by reduced bug rate, faster feature development time, and improved developer satisfaction scores.

**Acceptance Scenarios**:

1. **Given** GenerateWizard has loosely-typed form data, **When** refactoring is complete, **Then** all form fields have strict TypeScript types, validation is type-safe, and IDE provides full autocomplete support.

2. **Given** users are confused by dialog names, **When** dialogs are redesigned, **Then** Upload Extend Dialog becomes "Extend Track from Audio", Upload Cover Dialog becomes "Create Cover from Reference", both have clear descriptions and examples.

3. **Given** library sorting uses unclear icon, **When** UI is improved, **Then** sorting control shows text label "Sort by: [Date/Name/Duration]" with dropdown for selection, visually indicating current sort order.

---

### Edge Cases

- **What happens when a user has 10,000+ tracks?** Infinite scroll pagination must maintain performance. Backend filtering and indexing required. Virtual scrolling for optimal rendering.

- **How does system handle network interruption during payment?** Payment must be idempotent with retry logic. User sees clear status and can resume or retry. Telegram payment webhooks ensure state consistency.

- **What happens when real-time sync fails?** Graceful fallback to polling. User sees indicator that real-time is unavailable. Manual refresh option always available.

- **How does deep linking work when app is already open?** Router must handle in-app navigation to deep link target. Previous screen added to history stack for back navigation.

- **What happens with concurrent version edits?** Optimistic updates with conflict resolution. Last-write-wins for simple fields, merge strategy for complex changes. Version history shows all changes.

- **How does batch operation handle partial failures?** Atomic operations where possible. Non-atomic operations show detailed progress (5 of 20 succeeded). User can retry failed items.

- **What happens when accessibility features conflict with gestures?** Provide alternative input methods. Keyboard shortcuts for all gesture-based actions. Screen reader announces gesture targets before requiring gesture.

## Requirements *(mandatory)*

### Contracts & Schemas

This feature defines a planning and organizational specification and does not introduce new APIs or data schemas. However, the individual phases/tasks referenced will require:

- **Track Versioning API** (Sprint 7-9): OpenAPI spec at `specs/copilot/audit-interface-and-optimize/contracts/versioning-api.yaml`
- **Public Content API** (Sprint 10): OpenAPI spec at `specs/copilot/audit-interface-and-optimize/contracts/public-content-api.yaml`
- **Player State Schema** (Sprint 8): JSON Schema at `specs/copilot/audit-interface-and-optimize/contracts/player-state.schema.json`
- **Real-time Events Schema** (Phase 2): JSON Schema defining bot-app sync messages, generation status updates, payment confirmations
- **Deep Link Schema** (Phase 2): URL structure documentation for Telegram deep links to Mini App screens

### Functional Requirements

#### Phase 1: Mobile-First UI/UX Completion (Sprints 7-11, Dec 2025 - Feb 2026)

- **FR-001**: System MUST complete Sprint 7 infrastructure (database migrations, type updates, core hooks) to enable version-based features
- **FR-002**: System MUST implement mobile-optimized library with version management, achieving Lighthouse mobile score >90
- **FR-003**: System MUST provide 3-mode player (compact/expanded/fullscreen) with queue management and synchronized lyrics
- **FR-004**: System MUST display track details including versions, stems, lyrics (normal and timestamped), and AI analysis
- **FR-005**: System MUST support track actions (create persona, open in studio, add to projects/playlists)
- **FR-006**: System MUST provide public content discovery on homepage with featured/new/popular sections
- **FR-007**: System MUST implement AI Assistant mode for generation form with context-aware guidance
- **FR-008**: System MUST ensure all touch targets are ≥44×44px and all interactive elements are keyboard accessible
- **FR-009**: System MUST achieve WCAG 2.1 AA accessibility compliance across all new components

#### Phase 2: Core Platform Features (Q1 2026, Post-Sprint 11)

- **FR-010**: System MUST implement client-side router for deep link handling from Telegram bot
- **FR-011**: System MUST establish real-time communication channel between Telegram bot and Mini App
- **FR-012**: System MUST integrate payment system (Telegram Payments or Stripe) with subscription management
- **FR-013**: System MUST broadcast generation status updates from bot to app in real-time
- **FR-014**: System MUST handle deep links to specific app screens (track details, generation form, library filters)
- **FR-015**: System MUST process payment webhooks and update user subscription status immediately

#### Phase 3: Enhanced Library & User Experience (Q1 2026)

- **FR-016**: System MUST implement infinite scroll with virtual windowing for libraries with 1000+ tracks
- **FR-017**: System MUST support batch operations (delete, visibility toggle, project assignment) on multiple tracks
- **FR-018**: System MUST provide context menu on long-press with track-specific actions
- **FR-019**: System MUST display comprehensive notification system for generation, sharing, and system events
- **FR-020**: System MUST track track likes/favorites and provide favorites filtering in library
- **FR-021**: System MUST allow navigation to any previously completed step in GenerateWizard
- **FR-022**: System MUST provide clear sorting UI in library with text labels and visual indicators

#### Phase 4: Polish & Technical Debt (Q1-Q2 2026)

- **FR-023**: System MUST use strict TypeScript typing throughout GenerateWizard form data
- **FR-024**: System MUST rename and clarify all upload dialogs with descriptions
- **FR-025**: System MUST optimize navigation hierarchy for minimal user journey friction
- **FR-026**: System MUST pass automated accessibility audits and manual screen reader testing

### Key Entities

- **Development Phase**: Represents a major initiative with defined scope, timeline (sprint range), priority, dependencies, and success metrics
- **Sprint**: Time-boxed iteration (1-2 weeks) with specific deliverables, containing tasks grouped by feature area
- **Task**: Atomic unit of work from backlog with ID, description, epic assignment, priority, status, and acceptance criteria
- **Epic**: High-level feature grouping that organizes related tasks (E001: CI/CD, E002: Auth, E003: Music Gen, E004: Integration, E005: UX, E006: Quality, E007: Mobile UI)
- **User Story**: Describes user value in Given-When-Then format with independent testability, priority justification, and acceptance scenarios
- **Success Criteria**: Measurable outcomes for phase completion including performance metrics, user metrics, and quality metrics
- **Dependency**: Relationship between phases/tasks indicating prerequisite work (Sprint 7 must complete before Sprint 8 begins)
- **Risk**: Potential issue that could impact timeline or quality with mitigation strategy (e.g., migration data integrity risk)

## Success Criteria *(mandatory)*

### Measurable Outcomes

#### Phase 1: Mobile-First UI/UX (Completion: Feb 2, 2026)

- **SC-001**: 100% of Sprint 7 infrastructure tasks completed (24/24) with all migrations applied successfully and zero rollbacks
- **SC-002**: Lighthouse mobile score improves from current baseline (estimated 65-75) to >90 for all primary screens
- **SC-003**: First Contentful Paint on 3G networks reduced to <2 seconds (measured on Lighthouse simulated 3G)
- **SC-004**: Mobile user session duration increases by 30% compared to pre-redesign baseline
- **SC-005**: Mobile user base grows by 50% within 4 weeks of Sprint 8 deployment (library/player improvements)
- **SC-006**: Touch target compliance reaches 100% (all interactive elements ≥44×44px, verified via automated tests)
- **SC-007**: Zero critical accessibility violations reported by automated tools (axe-core, Lighthouse accessibility audit)
- **SC-008**: 95% of users successfully complete primary task (generate → listen → manage track) on first attempt in mobile usability testing
- **SC-009**: Code quality maintained: >80% test coverage for all new components, zero ESLint errors in new code

#### Phase 2: Core Platform Features (Completion: Mar 15, 2026)

- **SC-010**: Deep linking success rate >95% (users clicking bot links arrive at correct screen within 3 seconds)
- **SC-011**: Real-time sync latency <1 second (bot generation complete → app library updated)
- **SC-012**: Payment completion rate >85% (users who initiate payment successfully complete transaction)
- **SC-013**: Zero payment errors or duplicates (idempotent payment processing with full audit trail)
- **SC-014**: 100% of generation events propagate from bot to app without manual refresh required

#### Phase 3: Enhanced Library & UX (Completion: Apr 15, 2026)

- **SC-015**: Library with 1000+ tracks loads and scrolls smoothly at 60fps with no frame drops
- **SC-016**: Batch operations complete in <2 seconds for up to 50 selected tracks
- **SC-017**: Context menu appears within 100ms of long-press gesture with haptic feedback
- **SC-018**: Notification delivery rate >98% (all eligible events trigger notifications successfully)
- **SC-019**: User satisfaction score increases by 20% in post-deployment survey
- **SC-020**: Support tickets related to navigation and usability decrease by 40%

#### Phase 4: Polish & Quality (Ongoing through Q2 2026)

- **SC-021**: TypeScript strict mode compliance reaches 100% (zero `any` types, no type errors)
- **SC-022**: Developer onboarding time reduced by 30% (measured by time to first successful feature contribution)
- **SC-023**: Bug regression rate <5% (percentage of fixed bugs that reoccur within 30 days)
- **SC-024**: Code review cycle time reduced by 25% (time from PR open to merge)

## Assumptions

- **Infrastructure Assumption**: Supabase free tier or paid plan has sufficient capacity for real-time connections (default: up to 200 concurrent connections on free tier, unlimited on paid)
- **Payment Provider Assumption**: Telegram Payments is available in target markets, or Stripe integration is approved by Telegram for Mini Apps
- **Mobile Performance Assumption**: Target devices are iPhone 12 equivalent or newer (iOS 14+) and Android devices with 4GB+ RAM (Android 10+)
- **Development Velocity Assumption**: Team capacity remains stable at current sprint velocity (5-8 story points per sprint) throughout planning horizon
- **User Growth Assumption**: Monthly active users grow at 15% month-over-month, justifying investment in scalability features
- **Design Resource Assumption**: UI/UX design assets for new components are available when development begins (parallel design track)
- **Testing Assumption**: Mobile device lab or cloud testing service (BrowserStack/Sauce Labs) is available for cross-device testing
- **Localization Assumption**: Initial implementation supports English and Russian; other languages added in future phases

## Dependencies

### Phase 1 Dependencies (Mobile-First UI/UX)
- **Sprint 7 → Sprint 8**: Database migrations and type updates must complete before UI components can use new data structures
- **Sprint 8 → Sprint 9**: Library and player components must be stable before building dependent features (track details panel uses player, track actions use library selections)
- **Design → Development**: Figma mockups for each sprint's components must be ready 1 week before sprint start

### Phase 2 Dependencies (Core Platform)
- **Deep Linking → Bot Integration**: Requires Telegram bot to generate properly formatted Mini App links
- **Real-time → Bot**: Requires bot to publish events to shared message queue or Supabase real-time channel
- **Payments → Legal**: Requires terms of service and privacy policy updates for payment processing

### Phase 3 Dependencies (Enhanced Library)
- **Infinite Scroll → Backend**: Requires pagination API endpoints with cursor-based pagination (not offset-based)
- **Batch Operations → Permissions**: Requires proper authorization checks to prevent unauthorized bulk modifications
- **Notifications → Bot**: Leverages Telegram bot for push notification delivery (in-app notifications secondary)

### Phase 4 Dependencies (Polish)
- **Type Refactoring → All Components**: Touches all form-related code; requires comprehensive testing
- **Accessibility → Component Library**: May require updates to shadcn/ui base components for full ARIA support

### External Dependencies
- **Supabase**: API stability, real-time service uptime, migration tooling
- **Telegram**: Mini App API stability, Bot API uptime, payment service availability
- **Suno AI**: Music generation API rate limits, pricing stability, new feature availability

## Risks & Mitigation

### High Priority Risks

**Risk 1: Sprint 7 Migration Data Integrity**
- **Impact**: Existing tracks without versions could break app
- **Probability**: Medium (40%)
- **Mitigation**: Create comprehensive rollback scripts, test migration on staging with production data copy, implement master_version_id auto-creation script with full audit logging, maintain backward compatibility in queries for 1 sprint duration

**Risk 2: Payment Integration Complexity**
- **Impact**: Delays to monetization, revenue loss
- **Probability**: Medium (35%)
- **Mitigation**: Start payment integration early in parallel with Sprint 9, use Telegram Payments as primary (simpler than Stripe), implement feature flag for gradual rollout, have fallback to manual payment processing

**Risk 3: Real-time Sync Performance at Scale**
- **Impact**: Poor UX for users with many tracks, infrastructure costs
- **Probability**: Medium (30%)
- **Mitigation**: Implement rate limiting on real-time events, use event batching for bulk operations, provide manual refresh fallback, test with 1000+ concurrent users before production deployment

### Medium Priority Risks

**Risk 4: Mobile Performance on Older Devices**
- **Impact**: Poor experience for significant user segment
- **Probability**: Low-Medium (25%)
- **Mitigation**: Progressive enhancement approach, detect device capabilities and adjust features (disable animations on low-end devices), provide lite mode toggle, test on oldest supported devices (iPhone 8, Android 8)

**Risk 5: Accessibility Compliance Gaps**
- **Impact**: Legal risk, excludes users with disabilities
- **Probability**: Low (20%)
- **Mitigation**: Integrate axe-core automated testing in CI, conduct manual testing with screen readers (NVDA, JAWS, VoiceOver), hire accessibility consultant for final audit, prioritize WCAG 2.1 AA (not AAA) for pragmatic compliance

**Risk 6: Scope Creep in Sprint Execution**
- **Impact**: Sprint delays, burnout, quality reduction
- **Probability**: High (60%)
- **Mitigation**: Strict sprint planning with clear definition of done, daily standups to catch scope additions early, product owner empowered to defer non-critical items, retrospectives to improve estimation accuracy

## Phase Breakdown & Timeline

### Phase 1: Mobile-First UI/UX Completion
**Duration**: 5 sprints (Sprint 7-11)  
**Timeline**: Dec 8, 2025 - Feb 2, 2026  
**Status**: Sprint 7 in progress (15% complete)

#### Sprint 7: Setup & Infrastructure (Dec 8-15, 2025) - 🔄 IN PROGRESS
- Database migrations (6 tasks): master version tracking, version numbering, changelog, playlists, indexes, data migration
- Type system updates (7 tasks): Track, TrackVersion, Changelog, Playlist, Player, Queue, Assistant types
- Core hooks & queries (11 tasks): version management, player state, queue management, public content, backend filtering

#### Sprint 8: Library & Player MVP (Dec 15-29, 2025) - ⏳ PLANNED
- **User Story 1**: Library redesign with versioning (10 tasks)
- **User Story 2**: Player optimization with 3 modes (12 tasks)
- **Deliverable**: Mobile-optimized library and player usable on production

#### Sprint 9: Track Details & Actions (Dec 29, 2025 - Jan 12, 2026) - ⏳ PLANNED
- **User Story 3**: Track details panel (11 tasks)
- **User Story 4**: Track actions menu (8 tasks)
- **Deliverable**: Complete track management experience

#### Sprint 10: Homepage & AI Assistant (Jan 12-26, 2026) - ⏳ PLANNED
- **User Story 5**: Homepage public discovery (10 tasks)
- **User Story 6**: AI Assistant mode (15 tasks)
- **Deliverable**: Public content platform and guided generation

#### Sprint 11: Polish & Testing (Jan 26 - Feb 2, 2026) - ⏳ PLANNED
- Responsive testing, accessibility compliance, performance optimization
- Bug fixes, documentation updates, release preparation
- **Deliverable**: Production-ready mobile-first platform

### Phase 2: Core Platform Features
**Duration**: 4 weeks  
**Timeline**: Feb 3 - Mar 2, 2026  
**Tasks**: T005 (Deep Linking), T010 (Real-time Sync), T011 (Payments)

#### Week 1-2: Deep Linking & Real-time Foundation
- Implement client-side router for deep link handling
- Set up Supabase real-time channels for bot-app sync
- Define event schemas and test with bot team

#### Week 3-4: Payment Integration
- Integrate Telegram Payments API
- Implement subscription management flow
- Add payment webhook handling and reconciliation
- Test end-to-end payment scenarios

### Phase 3: Enhanced Library & UX
**Duration**: 4 weeks  
**Timeline**: Mar 3-30, 2026  
**Tasks**: T008, T012, T013, T019, T023, T024, T026

#### Week 1: Library Enhancements
- Implement infinite scroll with TanStack Query infinite queries
- Add batch selection mode and bulk operations
- Optimize for 1000+ track libraries

#### Week 2: Interaction Improvements
- Implement context menu (long-press)
- Add navigation back-stepping in GenerateWizard
- Improve sorting UI with text labels

#### Week 3: Engagement Features
- Build notification system (in-app + bot)
- Implement track likes/favorites
- Add favorites filtering in library

#### Week 4: Accessibility & Polish
- Run accessibility audits (axe-core, manual screen reader testing)
- Fix critical and major issues
- Document accessibility features

### Phase 4: Technical Debt & Optimization
**Duration**: Ongoing through Q2 2026  
**Timeline**: Parallel with new feature development  
**Tasks**: T020, T021, T022, T025, T009, T014, T026 (ongoing)

- Refactor GenerateWizard with strict TypeScript (1 week, Mar)
- Rename and improve upload dialogs (3 days, Mar)
- Review and optimize navigation hierarchy (1 week, Apr)
- Implement React.lazy for code splitting (3 days, Apr)
- Add detailed bot track information (1 week, May)

## Sprint Capacity Planning

### Current Velocity
- **Average Story Points**: 5.8 SP/sprint (Sprints 1-5)
- **Sprint 6**: 6 SP (planning-intensive)
- **Sprint 7 Target**: 24 SP (infrastructure, higher complexity)
- **Sprint 8 Target**: 22 SP (UI implementation)

### Team Capacity Assumptions
- **Team Size**: 2-3 developers (full-stack)
- **Sprint Duration**: 1-2 weeks
- **Availability**: 80% (accounting for meetings, interruptions)
- **Story Point = 4 hours** of focused work

### Buffer Strategy
- Each sprint includes 20% buffer for unplanned work
- Critical bugs and security issues take priority
- Product owner can deprioritize lower-value items mid-sprint

## Testing Strategy

### Unit Testing
- All new components have >80% test coverage
- Jest + React Testing Library for component tests
- Test user interactions, edge cases, error states

### Integration Testing
- TanStack Query hooks tested with mock API responses
- Real-time event handling tested with mock Supabase client
- Payment flow tested with Stripe/Telegram test mode

### E2E Testing
- Playwright tests for critical user journeys
- Mobile viewport testing (375×667, 390×844)
- Test on real devices via BrowserStack

### Performance Testing
- Lighthouse CI on every PR for mobile score
- Web Vitals monitoring (FCP, LCP, CLS, FID)
- Load testing for infinite scroll with 10k+ items

### Accessibility Testing
- Automated axe-core tests in CI
- Manual testing with NVDA, JAWS, VoiceOver
- Keyboard navigation testing for all flows

### Regression Testing
- Visual regression tests with Percy or Chromatic
- Snapshot tests for critical components
- Automated smoke tests on staging before production deploy

## Rollout Strategy

### Feature Flags
- Use Supabase feature flags or custom implementation
- Gradual rollout: 10% → 50% → 100% over 1 week
- Instant rollback capability if issues detected

### Monitoring
- Real-time error rate monitoring with Sentry
- Performance monitoring with Web Vitals
- User analytics with GA4 or PostHog
- Database query performance monitoring

### Rollback Plan
- Database migrations have rollback scripts
- Feature flags allow instant feature disable
- Previous app version deployable within 5 minutes
- Data backup before major schema changes

## Success Metrics Dashboard

### Product Metrics
- Monthly Active Users (MAU) growth rate
- Mobile vs. Desktop user split
- Session duration by platform
- Feature adoption rates (likes, batches, etc.)
- Payment conversion rate

### Technical Metrics
- Lighthouse mobile score trend
- Average API response time (p50, p95, p99)
- Client-side error rate
- Real-time message delivery latency
- Test coverage percentage

### Business Metrics
- Paid subscription count
- Monthly Recurring Revenue (MRR)
- User churn rate
- Support ticket volume and resolution time
- Net Promoter Score (NPS)
