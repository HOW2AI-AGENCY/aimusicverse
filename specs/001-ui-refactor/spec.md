# Feature Specification: UI Architecture Refactoring & Optimization

**Feature Branch**: `001-ui-refactor`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "проработка интерфейса проекта, оптимизация и унификация, разделение логики и дизайна, функционала и тд и тп"

---

## Overview

This feature addresses critical UI architecture issues in the MusicVerse AI application, including component duplication, inconsistent separation of concerns, and unclear mobile optimization strategies. The refactoring will consolidate redundant components, extract business logic from presentation layers, and establish clear architectural patterns for future development.

**Current State Analysis:**
- 952 total component files (364,646 lines of code)
- 5 duplicate track card implementations (~1,800 redundant lines)
- 3 separate skeleton loader files (~400 redundant lines)
- 98 dialog/sheet components with significant overlap
- 37+ components mixing business logic with presentation
- Inconsistent naming conventions and mobile handling strategies

**Impact:**
- Reduced bundle size through component consolidation
- Improved maintainability through consistent patterns
- Enhanced testability through logic separation
- Clear mobile optimization guidelines

---

## User Scenarios & Testing

### User Story 1 - Unified Track Card Component (Priority: P1)

**Description**: Replace all duplicate track card implementations (TrackCard, MinimalTrackCard, PublicTrackCard, TrackCardEnhanced) with a single, unified component that supports multiple display variants while maintaining all existing functionality.

**Why this priority**: Track cards are the most frequently used UI component in the application (displayed in library, home, search, playlists, and studio). Consolidating 5 duplicate implementations eliminates ~1,800 lines of redundant code and ensures consistent user experience across all screens.

**Independent Test**: Can be tested by navigating to any screen displaying track cards (library, home, search) and verifying all existing functionality works (play, like, share, version switching, swipe gestures) with consistent visual design.

**Acceptance Scenarios**:

1. **Given** a user views the library screen, **When** track cards load, **Then** all cards display consistently with unified styling, layout, and behavior
2. **Given** a user opens a track card menu, **When** they select an action (share, delete, add to playlist), **Then** the action executes correctly regardless of which screen the card appears on
3. **Given** a developer creates a new track list, **When** they use the UnifiedTrackCard component, **Then** they can choose from grid, list, compact, or minimal variants via props
4. **Given** a user swipes on a track card, **When** the swipe gesture completes, **Then** the appropriate action (like, delete) triggers with haptic feedback
5. **Given** a user switches between track version A/B, **When** the switch completes, **Then** the active version updates atomically across all UI elements

---

### User Story 2 - Business Logic Extraction (Priority: P1)

**Description**: Extract all business logic (database queries, real-time subscriptions, state management) from UI components into dedicated custom hooks and services, leaving components purely focused on presentation.

**Why this priority**: Components mixing business logic with presentation are difficult to test, maintain, and reuse. The current TrackCard.tsx (720 lines) includes direct Supabase queries and real-time subscriptions that should be in hooks. Extracting logic improves testability and enables code reuse.

**Independent Test**: Can be tested by verifying components render correctly with mock data, and that all data fetching, state updates, and side effects happen in hooks rather than components.

**Acceptance Scenarios**:

1. **Given** a developer examines TrackCard component, **When** they view the code, **Then** they find only JSX and presentation logic (no database queries, no subscriptions)
2. **Given** a developer tests track card functionality, **When** they write unit tests, **Then** they can mock all data fetching and state management via hooks
3. **Given** a user interacts with a track card, **When** they click like/play/share, **Then** the action processes through extracted hooks (useTrackActions, usePlayerControls, useSocialInteractions)
4. **Given** a real-time update occurs (new like, version switch), **When** the update propagates, **Then** the UI updates via hooks, not component effects
5. **Given** a developer creates a new track-based component, **When** they need track actions, **Then** they can reuse existing hooks without duplicating logic

---

### User Story 3 - Consolidated Skeleton Loader System (Priority: P2)

**Description**: Unify three separate skeleton loader files (LoadingSpinner.tsx, skeleton-loader.tsx, skeleton-components.tsx) into a single, comprehensive skeleton system that eliminates duplicate implementations.

**Why this priority**: Skeleton loaders appear throughout the application for loading states. Having three separate files with overlapping TrackCardSkeleton implementations creates confusion and maintenance burden. Consolidation reduces bundle size and ensures consistent loading experiences.

**Independent Test**: Can be tested by triggering loading states across the application (home, library, studio) and verifying all skeleton loaders render consistently with proper shimmer animations.

**Acceptance Scenarios**:

1. **Given** a user navigates to the library, **When** tracks load, **Then** TrackCardSkeleton displays with shimmer animation matching actual track card layout
2. **Given** a developer adds a new loading state, **When** they import skeleton components, **Then** they find all skeleton variants in one file (not three)
3. **Given** a user with motion sensitivity views the app, **When** loading states appear, **Then** skeleton animations respect prefers-reduced-motion setting
4. **Given** a developer references TrackCardSkeleton, **When** they use the component, **Then** it works identically across home, library, and studio screens
5. **Given** the application rebuilds, **When** bundle analysis runs, **Then** the consolidated skeleton system reduces bundle size by ~300 lines

---

### User Story 4 - Dialog and Sheet Strategy Standardization (Priority: P2)

**Description**: Establish clear guidelines for when to use Dialog vs. Sheet components, consolidate duplicate dialogs (AudioExtendDialog vs ExtendTrackDialog), and implement consistent modal patterns using ResponsiveModal for mobile/desktop adaptation.

**Why this priority**: The application has 98 dialog/sheet components with significant overlap and inconsistent usage patterns. Duplicate dialogs serve the same purpose, and some components use Dialog while others use Sheet for similar interactions. Standardization improves UX consistency and reduces code.

**Independent Test**: Can be tested by opening various modals throughout the app (track details, settings, forms) and verifying mobile devices use bottom sheets while desktop uses centered dialogs, with consistent animation and dismissal behavior.

**Acceptance Scenarios**:

1. **Given** a user opens a detail view on mobile, **When** the modal appears, **Then** it renders as a bottom sheet (MobileBottomSheet) with swipe-to-dismiss
2. **Given** a user opens a detail view on desktop, **When** the modal appears, **Then** it renders as a centered dialog (Dialog) with backdrop blur
3. **Given** a developer needs a confirmation dialog, **When** they check guidelines, **Then** they use AlertDialog (not Sheet) for confirmations
4. **Given** a developer needs a form or detail view, **When** they check guidelines, **Then** they use Sheet (mobile) or Dialog (desktop) via ResponsiveModal
5. **Given** duplicate dialogs exist (AudioExtendDialog vs ExtendTrackDialog), **When** refactoring completes, **Then** only one dialog remains and all usage points to it

---

### User Story 5 - Mobile Component Strategy Clarification (Priority: P3)

**Description**: Document clear guidelines for when to create separate mobile components vs. using responsive components with adaptive behavior. Establish consistent patterns for touch targets, haptic feedback, and motion reduction across mobile interfaces.

**Why this priority**: Current mobile strategy is inconsistent - some components have separate mobile variants (MobileStudioLayout, MobileLyricsEditor) while others use conditional rendering (ResponsiveModal). Clear guidelines prevent future fragmentation and ensure consistent mobile UX.

**Independent Test**: Can be tested by navigating the application on mobile devices and verifying all interactive elements meet touch target requirements (44-56px), provide haptic feedback, and respect motion preferences.

**Acceptance Scenarios**:

1. **Given** a developer creates a new component, **When** they need mobile support, **Then** guidelines clarify whether to create separate Mobile* component or use responsive props
2. **Given** a user taps any button on mobile, **When** the tap registers, **Then** haptic feedback triggers (light for buttons, medium for swipes)
3. **Given** a user interacts with the app on mobile, **When** they encounter interactive elements, **Then** all touch targets are minimum 44×44px
4. **Given** a user with motion sensitivity views the app, **When** animations occur, **Then** reduced motion setting is respected across all components
5. **Given** a developer implements a new mobile feature, **When** they follow guidelines, **Then** they know exactly when to use useIsMobile() vs. creating separate components

---

### User Story 6 - Component Naming and Organization Standardization (Priority: P3)

**Description**: Establish consistent naming conventions for component files (kebab-case) and exports (PascalCase), resolve duplicate component names (VoiceInputButton vs voice-input-button), and reorganize component directories to follow clear grouping principles.

**Why this priority**: Inconsistent naming (PascalCase vs kebab-case files) and unclear organization (TrackCard at root, UnifiedTrackCard in track/, MinimalTrackCard in library/) creates developer confusion and makes components difficult to locate. Standardization improves developer experience.

**Independent Test**: Can be tested by navigating the component directory structure and verifying all files follow kebab-case naming, exports use PascalCase, and components are grouped logically by feature.

**Acceptance Scenarios**:

1. **Given** a developer searches for a component, **When** they browse directories, **Then** they find components organized by feature (player/, studio/, library/) not scattered
2. **Given** a developer creates a new component, **When** they name the file, **Then** they use kebab-case (track-card.tsx) with PascalCase export (TrackCard)
3. **Given** duplicate names exist (VoiceInputButton vs voice-input-button), **When** refactoring completes, **Then** only one component remains with consistent naming
4. **Given** a developer imports a component, **When** they use @/ alias, **Then** the path is predictable (@/components/track/track-card.tsx)
5. **Given** a new developer joins the project, **When** they learn the structure, **Then** documentation clearly explains component grouping and naming conventions

---

### Edge Cases

**Component Migration**:
- What happens when a component is still in use but marked for removal? → Create deprecation warnings, migrate all usage before removal
- How do we handle breaking changes to component APIs? → Document migration guide, support old props with deprecation warnings

**Business Logic Extraction**:
- What happens if a hook depends on component-specific state? → Pass state as hook parameter, or extract state to parent component
- How do we handle real-time subscriptions during component unmount? → Ensure useEffect cleanup functions close subscriptions

**Mobile Optimization**:
- What happens on devices with safe areas (notch, island)? → All components must respect safe-area-inset CSS variables
- How do we handle orientation changes on mobile? → Lock to portrait per constitution, or test both orientations if supported

**Bundle Size**:
- What happens if consolidation increases bundle size? → Use code splitting for variant components, lazy load heavy components
- How do we measure bundle impact of refactoring? → Run npm run size before and after each major change

**Testing**:
- What happens if extracted hooks change behavior? → Maintain unit tests for hooks, test components with mock hooks
- How do we test mobile-specific features on desktop? → Use Playwright mobile emulation, test on real devices

---

## Requirements

### Functional Requirements

**Component Consolidation**:
- **FR-001**: System MUST consolidate all track card implementations into single UnifiedTrackCard component with variant props (grid, list, compact, minimal, professional, enhanced)
- **FR-002**: System MUST deprecate and remove duplicate track cards: TrackCard.tsx (root), MinimalTrackCard.tsx, PublicTrackCard.tsx, TrackCardEnhanced.tsx
- **FR-003**: System MUST unify three skeleton loader files into single skeleton system with all variants (TrackCardSkeleton, PlayerSkeleton, StudioSkeleton, etc.)
- **FR-004**: System MUST consolidate duplicate dialog components (AudioExtendDialog vs ExtendTrackDialog) into single implementation
- **FR-005**: System MUST establish clear usage guidelines: Dialog for confirmations, Sheet for details/forms, ResponsiveModal for adaptive mobile/desktop behavior

**Business Logic Extraction**:
- **FR-006**: System MUST extract all database queries from UI components into custom hooks (useTrackData, useTrackActions, usePlayerControls)
- **FR-007**: System MUST extract all real-time subscriptions from UI components into hooks (useRealtimeTrackUpdates, useRealtimeSocialCounts)
- **FR-008**: System MUST ensure components contain only JSX and presentation logic (no direct Supabase queries, no subscription management)
- **FR-009**: System MUST create reusable hooks for common patterns: useSocialInteractions (like, follow, share), useTrackVersionSwitcher, useStemOperations

**Mobile Optimization**:
- **FR-010**: System MUST document guidelines for when to create separate Mobile* components vs. responsive components with adaptive behavior
- **FR-011**: System MUST ensure all interactive elements on mobile meet touch target requirements (44-56px minimum)
- **FR-012**: System MUST provide haptic feedback for all user interactions on mobile (button clicks, swipe gestures, errors, successes)
- **FR-013**: System MUST respect prefers-reduced-motion media query across all components (skeleton animations, transitions, gestures)

**Naming and Organization**:
- **FR-014**: System MUST use kebab-case for all component file names (track-card.tsx, mobile-header-bar.tsx)
- **FR-015**: System MUST use PascalCase for all component exports (export const TrackCard, export const MobileHeaderBar)
- **FR-016**: System MUST resolve duplicate component names (VoiceInputButton.tsx vs voice-input-button.tsx) by keeping one implementation
- **FR-017**: System MUST organize components by feature in subdirectories (player/, studio/, library/, track/) not scattered at root level
- **FR-018**: System MUST document component directory structure and naming conventions in CLAUDE.md

**Compatibility and Migration**:
- **FR-019**: System MUST maintain backward compatibility during migration by supporting old component props with deprecation warnings
- **FR-020**: System MUST provide clear migration paths for deprecated components (import aliases, codemods, documentation)
- **FR-021**: System MUST ensure all existing functionality continues working after refactoring (play, like, share, version switching, swipe gestures)

**Performance**:
- **FR-022**: System MUST maintain bundle size under 950 KB after consolidation (per constitution)
- **FR-023**: System MUST use code splitting for heavy variant components if needed
- **FR-024**: System MUST run npm run size before and after major refactoring changes to measure bundle impact

**Testing**:
- **FR-025**: System MUST include unit tests for all extracted hooks (mock data, test state changes, test side effects)
- **FR-026**: System MUST include integration tests for consolidated components (test all variants, test all props)
- **FR-027**: System MUST test mobile features on real devices (iOS Safari, Chrome Android) or via Playwright mobile emulation

### Key Entities

**Component**:
- Represents a React UI component
- Attributes: name (PascalCase), file path, props interface, variant (if applicable), dependencies
- Relationships: uses hooks, renders other components, imported by pages/features

**Hook**:
- Represents a custom React hook for business logic
- Attributes: name (use* pattern), purpose, parameters, return value, dependencies (API calls, subscriptions)
- Relationships: used by components, calls services/APIs, manages state

**SkeletonVariant**:
- Represents a loading state component
- Attributes: type (track, player, studio), layout (grid, list, compact), animation (shimmer, pulse)
- Relationships: mimics component structure, respects motion preferences

**ComponentVariant**:
- Represents a display variation of a component
- Attributes: name (grid, list, compact, minimal), prop requirements, styling differences
- Relationships: belongs to parent component, shares core logic, renders differently

---

## Success Criteria

### Measurable Outcomes

**Code Quality**:
- **SC-001**: Reduce duplicate track card implementations from 5 to 1, eliminating ~1,800 lines of redundant code
- **SC-002**: Reduce skeleton loader files from 3 to 1, eliminating ~400 lines of duplicate code
- **SC-003**: Consolidate duplicate dialog components by at least 50% (from 98 to <49 unique dialogs)
- **SC-004**: Extract business logic from 37+ components into dedicated hooks, reducing component average file size by 30%

**Developer Experience**:
- **SC-005**: Establish documented guidelines for mobile component strategy, reducing ambiguity for future development
- **SC-006**: Standardize naming conventions so 100% of component files follow kebab-case with PascalCase exports
- **SC-007**: Organize all components into logical feature directories (player/, studio/, library/, track/), eliminating root-level component files

**Bundle Size and Performance**:
- **SC-008**: Maintain total bundle size under 950 KB after consolidation (per constitution requirement)
- **SC-009**: Reduce component count by at least 10% through consolidation (from 952 to <857 component files)
- **SC-010**: Ensure all skeleton animations respect prefers-reduced-motion setting (100% compliance)

**Testing and Quality**:
- **SC-011**: Achieve 80%+ test coverage for all extracted hooks (unit tests for data fetching, state management, subscriptions)
- **SC-012**: Verify all touch targets meet 44-56px minimum on mobile (100% compliance via automated linting or manual review)
- **SC-013**: Test all consolidated components on real mobile devices (iOS Safari, Chrome Android) before merge

**Migration Safety**:
- **SC-014**: Maintain 100% backward compatibility during migration - no breaking changes to public APIs
- **SC-015**: Complete migration of all deprecated components with zero production incidents (no regressions in play, like, share, version switching)

---

## Assumptions

1. **Current Usage**: Component usage analysis identified all current import locations for deprecated components, enabling safe migration
2. **Bundle Budget**: 950 KB bundle limit remains enforced per constitution; consolidation should reduce bundle size, not increase it
3. **Mobile Priority**: Mobile-first development remains the primary focus per constitution; all refactoring must maintain or improve mobile UX
4. **Testing Capacity**: Team has capacity to write tests for extracted hooks and consolidated components (target: 80% coverage)
5. **Migration Timeline**: Migration can occur incrementally without blocking feature development (deprecated components coexist temporarily)
6. **Constitution Compliance**: All refactoring must comply with constitution principles (mobile-first, performance, component architecture, accessibility)
7. **Developer Resources**: Team has time to document new guidelines and update CLAUDE.md with refactoring patterns
8. **React 19 Compatibility**: All refactored components work with React 19.2 (current version) without breaking changes

---

## Dependencies

**Internal Dependencies**:
- Constitution principles (mobile-first, performance, component architecture) - MUST comply during refactoring
- Existing hooks patterns (useTrackCardLogic, useIsMobile) - should be extended, not replaced
- shadcn/ui components (Button, Card, Dialog, Sheet) - remain as base primitives
- TanStack Query (data fetching) - extracted hooks should use, not replace
- Zustand stores (playerStore, useUnifiedStudioStore) - state management remains in stores

**External Dependencies**:
- React 19.2 - no version changes, refactoring works within current React version
- Framer Motion - continue using @/lib/motion wrapper for tree-shaking
- Supabase - extracted hooks use existing Supabase client, no API changes
- Telegram SDK - mobile components continue using Telegram Web App SDK features

**Blocking Dependencies**:
- None - this is internal refactoring that can proceed independently

**Parallel Development**:
- Other features can continue development during refactoring (deprecated components remain temporarily)
- New components should follow refactored patterns immediately
- Existing components migrate incrementally

---

## Non-Functional Requirements

**Maintainability**:
- Components must follow single responsibility principle (presentation only, no business logic)
- Hooks must be reusable across multiple components
- Code must be self-documenting with clear naming and TypeScript types

**Performance**:
- Bundle size must not increase (target: reduce by 5-10% through consolidation)
- Component render performance must not degrade (maintain 60 FPS on mid-range devices)
- Lazy loading must be preserved for heavy components

**Accessibility**:
- All consolidated components must meet WCAG AA standards
- Touch targets must meet 44-56px minimum on mobile
- Screen reader labels must be preserved during consolidation
- Motion preferences must be respected (prefers-reduced-motion)

**Compatibility**:
- All existing functionality must work after refactoring (play, like, share, version switching, gestures)
- Mobile features must work on iOS Safari 15+ and Chrome Android 100+
- Telegram SDK integration must remain functional

**Security**:
- No security regressions (RLS policies remain enforced)
- Input validation remains in place (Zod schemas)
- No secrets exposed in frontend (already in Edge Functions)

---

## Out of Scope

The following items are explicitly OUT OF SCOPE for this refactoring:

- **New UI Features**: No new user-facing features or visual designs (consolidation only)
- **Backend Changes**: No database schema changes, no API modifications, no Edge Function changes
- **Animation Redesign**: No new animations or motion designs (consolidate existing only)
- **Third-Party Integrations**: No new integrations with external services
- **Performance Optimization**: Beyond bundle size reduction from consolidation (no lazy loading optimization, no caching strategy changes)
- **Mobile Redesign**: No new mobile UI patterns (document existing patterns only)
- **Testing Infrastructure**: No new testing frameworks or CI/CD changes (use existing Jest, Playwright)
- **Documentation Overhaul**: Update CLAUDE.md only for new patterns, not comprehensive rewrite

---

## Constitution Compliance Checklist

**Mobile-First Development** (Principle I):
- ✅ All consolidated components must support portrait mode as primary
- ✅ Touch targets must be 44-56px minimum
- ✅ Haptic feedback must be provided on Telegram
- ✅ Safe areas must be respected (notch/island)
- ✅ Must test on iOS Safari and Chrome Android

**Performance & Bundle Optimization** (Principle II):
- ✅ Bundle size must stay under 950 KB
- ✅ Route-level code splitting must be preserved
- ✅ Framer Motion must use @/lib/motion wrapper
- ✅ List virtualization must be preserved (VirtualizedTrackList)
- ✅ LazyImage must be used for all images

**Component Architecture** (Principle IV):
- ✅ Components must follow shadcn/ui patterns
- ✅ Base UI components go in src/components/ui/
- ✅ Feature components go in src/components/feature-name/
- ✅ className merging must use cn() utility
- ✅ Import paths must use @/ alias

**Unified Component Architecture** (Principle VIII):
- ✅ All screens must use unified component system
- ✅ MainLayout must be used for root layout
- ✅ BottomNavigation must be used for tab navigation
- ✅ MobileHeaderBar must be used for page headers
- ✅ MobileBottomSheet must be used for mobile modals
- ✅ VirtualizedTrackList must be used for >50 items

**Screen Development Patterns** (Principle IX):
- ✅ Lazy loading pattern must be used (React.lazy + Suspense)
- ✅ Data fetching must use TanStack Query (no raw fetch)
- ✅ Global UI state must use Zustand stores
- ✅ Animations must use @/lib/motion wrapper
- ✅ UI components must extend shadcn/ui

**Performance Budget Enforcement** (Principle X):
- ✅ Total bundle must be < 950KB (enforced by size-limit)
- ✅ Feature chunks must follow limits (feature-studio < 72KB, etc.)
- ✅ Route-level code splitting is mandatory
- ✅ Images must use LazyImage component
- ✅ List virtualization is mandatory for >50 items
- ✅ npm run size must pass before commits
