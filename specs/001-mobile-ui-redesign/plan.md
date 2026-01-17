# Implementation Plan: Mobile-First Minimalist UI Redesign

**Branch**: `001-mobile-ui-redesign` | **Date**: 2026-01-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mobile-ui-redesign/spec.md`

## Summary

Redesign the MusicVerse AI Telegram Mini App UI with a mobile-first minimalist approach. The redesign focuses on:
- Streamlined home screen (max 4 sections)
- Simplified navigation (4 tabs + FAB)
- Unified track cards (single component replacing 10+ variants)
- Collapsible generation form (simple/advanced modes)
- Consistent design system (8px grid, 3-level typography)

This is a **UI-only redesign** with no backend API changes, database migrations, or new features.

---

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19.2
**Primary Dependencies**: React 19, Zustand 5, TanStack Query 5.90, Framer Motion, Tailwind CSS 3.4, shadcn/ui, Radix UI
**Storage**: Supabase (PostgreSQL) - NO CHANGES
**Testing**: Jest 30.2 (unit), Playwright 1.57 (E2E)
**Target Platform**: Telegram Mini App (iOS Safari 15+, Chrome Android 100+)
**Project Type**: Mobile-first web application (Telegram Mini App)
**Performance Goals**: 60 FPS animations, < 2s home screen load, < 950KB bundle (existing limit)
**Constraints**: Portrait-first design (375-932px width), safe area support, Telegram SDK integration
**Scale/Scope**: 7 user stories, 52 functional requirements, 10 success criteria

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Development for Telegram Mini App

**Status**: ✅ PASS - Redesign enhances mobile-first approach

**Compliance**:
- All layouts designed for portrait mode (375-932px) first
- Touch targets meet 44-56px minimum (iOS HIG/Material Design)
- Telegram SDK integration maintained (HapticFeedback, BackButton, safe areas)
- Portrait orientation as primary with graceful landscape degradation

**Implementation**:
- Home screen: 4-section layout optimized for mobile viewport
- Navigation: Bottom tabs with FAB (Telegram-native pattern)
- Touch feedback: Haptic feedback on all interactions via Telegram SDK
- Safe areas: CSS env() variables for notch/island clearance

### Principle II: Performance & Bundle Optimization

**Status**: ✅ PASS - No new dependencies, bundle-neutral

**Compliance**:
- Bundle size limit: < 950KB (existing limit enforced)
- Route-level code splitting maintained (React.lazy)
- Component consolidation reduces code (UnifiedTrackCard replaces 10+ variants)
- No new dependencies added

**Implementation**:
- Use existing libraries only (Framer Motion, TanStack Query, Zustand)
- Consolidate components to reduce duplication
- Lazy load heavy components as needed
- Pre-commit `npm run size` check will pass

### Principle III: Audio Architecture

**Status**: ✅ PASS - No changes to audio system

**Compliance**:
- Single `<audio>` element via GlobalAudioProvider (maintained)
- Audio element pooling for iOS Safari (maintained)
- PlayerStore for state management (maintained)

**Implementation**:
- Player UI redesign only (no audio logic changes)
- Smooth player transitions via Framer Motion
- Haptic feedback on player controls

### Principle IV: Component Architecture

**Status**: ✅ PASS - Component consolidation within limits

**Compliance**:
- Base UI components in `src/components/ui/` (shadcn/ui)
- Feature components in `src/components/[feature]/`
- Shared unified components in `src/components/shared/` (NEW)
- Component size limit: 500 lines max

**Implementation**:
- Create `UnifiedTrackCard` in `src/components/shared/`
- Deprecate old track card variants (mark `@deprecated`)
- Split any components >500 lines into subcomponents

### Principle V: State Management Strategy

**Status**: ✅ PASS - Existing state management maintained

**Compliance**:
- Global UI state: Zustand stores (< 500 lines each)
- Server state: TanStack Query with optimized caching
- Form state: React Hook Form + Zod validation
- Component state: React hooks

**Implementation**:
- No new stores created
- Existing stores maintained (playerStore, useUnifiedStudioStore)
- Draft auto-save to localStorage (30min expiry)

### Principle VI: Security & Privacy

**Status**: ✅ PASS - No security changes

**Compliance**:
- RLS policies maintained (no database changes)
- Input validation: Zod schemas maintained
- No new attack vectors introduced

### Principle VII: Accessibility & UX Standards

**Status**: ✅ PASS - Enhanced accessibility

**Compliance**:
- Touch targets: 44-56px minimum (verified in spec)
- ARIA labels maintained
- Color contrast: WCAG AA (existing palette)
- Reduced motion support maintained

**Implementation**:
- Loading states: Skeleton screens with shimmer
- Error states: Clear messages with retry actions
- Empty states: Illustrations + CTAs
- Haptic feedback: Telegram SDK (light/medium/heavy)

### Principle VIII: Unified Component Architecture

**Status**: ✅ PASS - Component unification

**Compliance**:
- Layout system: MainLayout + BottomNavigation (maintained)
- Page headers: MobileHeaderBar (standardized)
- Modal/sheet system: MobileBottomSheet (primary pattern)
- List system: VirtualizedTrackList (react-virtuoso)

**Implementation**:
- Standardize MobileHeaderBar across all screens
- Create UnifiedTrackCard in `src/components/shared/`
- Use MobileBottomSheet for studio tabs

### Principle IX: Screen Development Patterns

**Status**: ✅ PASS - Follow existing patterns

**Compliance**:
- Lazy loading: React.lazy() for routes (maintained)
- Data fetching: TanStack Query (maintained)
- Global UI state: Zustand (maintained)
- Animations: Framer Motion via `@/lib/motion` (maintained)
- UI components: shadcn/ui (maintained)
- Form handling: React Hook Form + Zod (maintained)

### Principle X: Performance Budget Enforcement

**Status**: ✅ PASS - Budgets maintained

**Compliance**:
- Bundle limit: < 950KB (pre-commit hook)
- Route-level code splitting: React.lazy() (maintained)
- Image optimization: LazyImage (maintained)
- List virtualization: react-virtuoso (maintained)
- Animation performance: GPU-accelerated properties (maintained)

### Principle XI: Telegram Bot Integration

**Status**: ✅ PASS - No changes to bot integration

**Compliance**:
- Deep links: Maintained (t.me/BotName/app?startapp=PARAM)
- BotContextBanner: Can be added if needed
- Edge functions: No changes

### Principle XII: Post-Generation Flow

**Status**: ✅ PASS - No changes to post-generation flow

**Compliance**:
- GenerationResultSheet: Maintained if exists
- expectGenerationResult(): Maintained if exists
- A/B version selection: Maintained

### Principle XIII: Component Unification Rules

**Status**: ✅ PASS - Proactive unification

**Compliance**:
- UnifiedTrackCard: NEW in `src/components/shared/`
- Version selector: Use existing UnifiedVersionSelector
- No duplicate components created

**Implementation**:
- Replace InlineVersionToggle with UnifiedVersionSelector variant="inline"
- Replace VersionSwitcher with UnifiedVersionSelector variant="compact"
- Deprecate old track card variants (10+ components)

---

### Gate Evaluation Result

**Status**: ✅ ALL GATES PASSED

No constitution violations. This is a UI-only redesign that:
- Enhances mobile-first approach
- Consolidates components (reduces duplication)
- Maintains all existing patterns and limits
- Introduces no new dependencies or technical debt

---

## Project Structure

### Documentation (this feature)

```text
specs/001-mobile-ui-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (entity definitions)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (API contracts)
│   └── api-contracts.md
├── checklists/          # Quality checklists
│   └── requirements.md
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── shared/               # NEW: Unified shared components
│   │   └── UnifiedTrackCard.tsx    # Consolidated track card
│   ├── mobile/               # Mobile-specific components (existing)
│   │   ├── MobileHeaderBar.tsx
│   │   ├── MobileBottomSheet.tsx
│   │   └── MobileSkeletons.tsx
│   ├── home/                 # Redesigned home components
│   │   ├── HomeQuickCreate.tsx     # NEW: Simplified quick create
│   │   ├── FeaturedSection.tsx     # NEW: Max 6 tracks
│   │   └── RecentPlaysSection.tsx  # NEW: Last 5 tracks
│   ├── library/              # Redesigned library components
│   │   └── VirtualizedTrackList.tsx # Existing: May update styles
│   ├── generate-form/        # Redesigned form components
│   │   └── GenerateForm.tsx        # UPDATE: Collapsible advanced
│   ├── player/               # Redesigned player components
│   │   ├── CompactPlayer.tsx       # UPDATE: Smoother transitions
│   │   ├── ExpandedPlayer.tsx      # UPDATE: Smoother transitions
│   │   └── MobileFullscreenPlayer.tsx  # UPDATE: Smoother transitions
│   ├── track-card-new/       # DEPRECATED: Replaced by UnifiedTrackCard
│   └── studio/unified/       # Redesigned studio components
│       └── MobileStudioTabs.tsx    # NEW: Bottom sheet tabs
├── hooks/
│   ├── useTracks.ts          # Existing: No changes
│   ├── usePlayerState.ts     # Existing: No changes
│   └── useGenerateForm.ts    # Existing: No changes
├── stores/
│   ├── playerStore.ts        # Existing: No changes
│   └── useUnifiedStudioStore.ts  # Existing: No changes
├── pages/
│   ├── Index.tsx             # UPDATE: Redesigned home layout
│   ├── LibraryPage.tsx       # UPDATE: Redesigned library layout
│   └── StudioV2Page.tsx      # UPDATE: Redesigned studio layout
└── lib/
    ├── motion.ts             # Existing: Framer Motion wrapper
    └── utils.ts              # Existing: cn() utility
```

**Structure Decision**: This is a mobile-first web application (Telegram Mini App). All source code follows the existing single-project structure with React components organized by feature. The redesign creates a new `shared/` directory for cross-feature unified components and updates existing components to follow the minimalist design system.

---

## Complexity Tracking

> No complexity tracking required - NO constitution violations

---

## Phase 0: Research (Complete)

**Output**: [research.md](./research.md)

### Key Technical Decisions

1. **Navigation**: 4 tabs + FAB (reduced from 5 tabs)
2. **Forms**: Collapsible advanced options (progressive disclosure)
3. **Spacing**: 8px grid system
4. **Typography**: 3-level scale (H1: 24px, H2: 20px, H3: 16px)
5. **Track Cards**: UnifiedTrackCard with variants (minimal, list, grid)
6. **Player**: Continuous swipe with spring physics
7. **Loading**: Skeleton screens with shimmer animation
8. **Studio**: Bottom sheet with tab navigation
9. **Safe Areas**: CSS env() variables
10. **Colors**: Maintain existing semantic palette
11. **Haptics**: Telegram SDK HapticFeedback API
12. **Lists**: react-virtuoso (existing)
13. **Empty States**: Illustrated with CTAs
14. **Border Radius**: 8-12px consistent
15. **Touch Feedback**: 100ms visual, 200-300ms animation

**Dependencies**: No new dependencies required. All implementations use existing libraries.

---

## Phase 1: Design & Contracts (Complete)

**Outputs**:
- [data-model.md](./data-model.md) - Entity definitions and UI state models
- [contracts/api-contracts.md](./contracts/api-contracts.md) - API contracts (no changes)
- [quickstart.md](./quickstart.md) - Developer quickstart guide

### Data Model

No database changes. Documented existing entities:
- Track
- TrackVersion
- Project
- StylePreset
- UserSession (client-side state)

### API Contracts

No API changes. Documented existing endpoints:
- GET /api/tracks
- GET /api/tracks/public
- GET /api/tracks/:id/versions
- POST /api/generate
- GET /api/generations/:id
- GET /api/projects
- GET /api/styles

### Component Architecture

**New Components**:
- `UnifiedTrackCard` - Single track card with variants
- `HomeQuickCreate` - Simplified quick create section
- `FeaturedSection` - Featured tracks (max 6)
- `RecentPlaysSection` - Recent plays (last 5)
- `MobileStudioTabs` - Studio bottom sheet tabs

**Updated Components**:
- `BottomNavigation` - Reduce from 5 to 4 tabs
- `GenerateForm` - Add collapsible advanced section
- `MobileHeaderBar` - Standardize usage across all screens
- Player components - Smoother transitions

**Deprecated Components**:
- Old track card variants (10+) - Mark `@deprecated`, replace with UnifiedTrackCard
- `InlineVersionToggle` - Replace with UnifiedVersionSelector variant="inline"
- `VersionSwitcher` - Replace with UnifiedVersionSelector variant="compact"

---

## Agent Context Update

**Script executed**: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`

**Result**: Agent context file updated with new unified component pattern (shared/ directory).

---

## Implementation Notes

### Priority Order

Implement in priority order (P1 → P2 → P3):

1. **P1**: Streamlined Mobile Home
   - HomeQuickCreate component
   - FeaturedSection component
   - RecentPlaysSection component
   - Index.tsx updates

2. **P1**: Simplified Navigation System
   - BottomNavigation updates (4 tabs)
   - Navigation transitions

3. **P2**: Minimalist Track Cards
   - UnifiedTrackCard component
   - Replace old variants
   - VirtualizedTrackList updates

4. **P2**: Focused Generation Form
   - GenerateForm collapsible section
   - Simple/Advanced mode toggle

5. **P2**: Unified Player Experience
   - Smooth transition animations
   - Haptic feedback integration

6. **P3**: Simplified Studio Interface
   - MobileStudioTabs component
   - Bottom sheet pattern

7. **P3**: Consistent Typography and Spacing
   - Apply 8px grid across all components
   - Standardize heading levels

### Testing Strategy

1. **Visual Regression**: Test on iOS Safari and Chrome Android
2. **Performance**: Verify 60 FPS animations, < 2s home load
3. **Bundle Size**: Run `npm run size` before each commit
4. **Accessibility**: Verify 44px touch targets, WCAG AA contrast
5. **E2E**: Playwright tests for critical user flows

### Success Metrics

- Users can navigate home to any section within 3 seconds
- Users can initiate generation within 2 taps
- 90% completion rate for generation flow
- Home screen loads within 2 seconds on 4G
- 25% reduction in home screen bounce rate

---

## Next Steps

1. **Execute implementation** using `/speckit.tasks` to generate task breakdown
2. **Follow priority order** (P1 → P2 → P3)
3. **Test on device** (iOS Safari, Chrome Android, Telegram native)
4. **Run quality checks** (bundle size, lint, tests)
5. **Submit PR** with visual documentation

---

**Status**: Phase 0 and Phase 1 complete. Ready for task generation (`/speckit.tasks`).
