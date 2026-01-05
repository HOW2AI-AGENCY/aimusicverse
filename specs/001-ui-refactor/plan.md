# Implementation Plan: UI Architecture Refactoring & Optimization

**Branch**: `001-ui-refactor` | **Date**: 2026-01-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ui-refactor/spec.md`

---

## Summary

This refactoring addresses critical UI architecture issues in the MusicVerse AI Telegram Mini App: component duplication (5 track card variants, 3 skeleton files, 98 dialog/sheet components), business logic mixed with presentation (37+ components), and inconsistent mobile/naming patterns. The technical approach consolidates duplicate components into unified variants with prop-based configuration, extracts all database queries and real-time subscriptions into reusable React hooks, establishes clear mobile component guidelines, and standardizes naming conventions (kebab-case files, PascalCase exports). This reduces codebase by ~3,000 lines while maintaining 100% backward compatibility and adhering to constitution-mandated 950 KB bundle limit.

---

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19.2 (current stack, no changes)
**Primary Dependencies**:
- React 19.2 (components, hooks)
- TanStack Query 5.90 (data fetching in extracted hooks)
- Zustand 5.0 (global state - playerStore, useUnifiedStudioStore)
- Framer Motion (via @/lib/motion wrapper for tree-shaking)
- Supabase client (existing, extracted hooks use same APIs)
- shadcn/ui + Radix UI (base components: Button, Card, Dialog, Sheet)
- @use-gesture/react (swipe gestures on track cards)
- Telegram Web App SDK 8.0.2 (haptic feedback, safe areas)

**Storage**: No changes - existing Supabase PostgreSQL database, extracted hooks use same client
**Testing**:
- Jest 30.2 + @testing-library/react (unit tests for hooks)
- Playwright 1.57 (integration tests, mobile emulation)
- Existing test infrastructure (no new frameworks)

**Target Platform**:
- Primary: Telegram Mini App (iOS Safari 15+, Chrome Android 100+)
- Portrait mode locked per constitution
- Desktop: Progressive enhancement (Chrome, Firefox, Safari, Edge)

**Project Type**: Single React application (Vite 5.0 build system)
- 952 current component files (target: <857 after consolidation)
- Route-level code splitting with React.lazy()
- Monorepo structure: src/ contains all frontend code

**Performance Goals**:
- Bundle size: < 950 KB (constitution hard limit, enforced by size-limit)
- Target reduction: 5-10% through consolidation (~50-95 KB savings)
- Render performance: 60 FPS on iPhone 12 / Pixel 5 (mid-range devices)
- Component render: No degradation from current baseline

**Constraints**:
- Bundle size hard limit: 950 KB (enforced via pre-commit hook)
- Touch targets: 44-56px minimum on mobile (iOS HIG / Material Design)
- Code splitting mandatory for routes and heavy components (>50 KB)
- All motion must respect prefers-reduced-motion
- 100% backward compatibility required (no breaking API changes)

**Scale/Scope**:
- Components affected: 952 total, ~200 require migration
- Lines of code reduction: ~3,000 lines (from consolidation)
- Testing scope: 80% coverage for extracted hooks
- Migration timeline: Incremental, deprecated components coexist temporarily

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Evaluation

**I. Mobile-First Development** ✅ PASS
- All consolidated components support portrait mode (existing behavior)
- Touch targets 44-56px enforced via linting (FR-011, SC-012)
- Haptic feedback via Telegram SDK (existing, preserved)
- Safe areas respected (existing safe-area-inset CSS vars)
- Testing on iOS Safari and Chrome Android required (FR-027)

**II. Performance & Bundle Optimization** ✅ PASS
- Bundle size < 950 KB maintained (FR-022, SC-008)
- Route-level code splitting preserved (existing)
- Framer Motion via @/lib/motion wrapper (existing)
- VirtualizedTrackList preserved for >50 items (existing)
- LazyImage used for all images (existing)
- Pre-commit npm run size enforced (existing)

**III. Audio Architecture** ✅ PASS
- No changes to audio system (out of scope)
- GlobalAudioProvider preserved (existing)

**IV. Component Architecture** ✅ PASS
- Components follow shadcn/ui patterns (FR-001, FR-005)
- Base UI in src/components/ui/ (existing structure)
- Feature components in src/components/feature-name/ (FR-017)
- className merging via cn() utility (existing)
- Import paths use @/ alias (existing)

**V. State Management Strategy** ✅ PASS
- Extracted hooks use TanStack Query (no raw fetch per FR-008)
- Global state remains in Zustand stores (playerStore, useUnifiedStudioStore)
- Form state via React Hook Form + Zod (preserved)
- Component state via React hooks (preserved)

**VI. Security & Privacy** ✅ PASS
- No security regressions (RLS policies preserved)
- Input validation via Zod (preserved)
- No secrets in frontend (existing, unchanged)

**VII. Accessibility & UX Standards** ✅ PASS
- Touch targets 44-56px (FR-011, SC-012)
- prefers-reduced-motion respected (FR-013, SC-010)
- WCAG AA compliance maintained (existing)
- Haptic feedback via Telegram SDK (FR-012)

**VIII. Unified Component Architecture** ✅ PASS
- MainLayout preserved (existing)
- BottomNavigation preserved (existing)
- MobileHeaderBar used for page headers (existing)
- MobileBottomSheet used for mobile modals (FR-005)
- VirtualizedTrackList for >50 items (existing)

**IX. Screen Development Patterns** ✅ PASS
- Lazy loading via React.lazy() preserved (existing)
- Data fetching via TanStack Query (FR-008)
- Global state via Zustand (preserved)
- Animations via @/lib/motion (existing)
- UI components extend shadcn/ui (FR-001)

**X. Performance Budget Enforcement** ✅ PASS
- Bundle < 950 KB (FR-022, SC-008)
- Feature chunks follow limits (preserved)
- Route-level code splitting (preserved)
- LazyImage for images (preserved)
- List virtualization for >50 items (preserved)
- npm run size before commits (FR-024)

**Gate Result**: ✅ **ALL PASS** - No violations, no complexity justification needed. Proceed to Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Hook contracts)
└── tasks.md             # Phase 2 output (NOT created yet)
```

### Source Code (repository root)

**Structure Decision**: This is a single React application (Option 1 from template). The refactoring reorganizes existing components within the src/ directory structure. No new top-level directories are created.

```text
src/
├── components/
│   ├── ui/                    # Base shadcn/ui components (preserved)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton-loader.tsx  # [REFACTOR] Consolidated from 3 files
│   │   └── ...
│   ├── mobile/                # Mobile-specific components (preserved)
│   │   ├── MobileBottomSheet.tsx
│   │   ├── MobileActionSheet.tsx
│   │   └── ...
│   ├── layout/                # Layout components (preserved)
│   │   ├── MainLayout.tsx
│   │   └── ...
│   ├── navigation/            # Navigation components (preserved)
│   │   └── BottomNavigation.tsx
│   ├── track/                 # [REFACTOR] Unified track components
│   │   ├── track-card.tsx     # [NEW] Consolidated from 5 variants
│   │   └── track-actions.tsx  # [PRESERVED] Already unified
│   ├── player/                # Player components (preserved)
│   ├── library/               # Library components (preserved)
│   ├── generate-form/         # Generation form (preserved)
│   ├── studio/                # Studio components (preserved)
│   ├── studio/unified/        # Unified studio (preserved)
│   └── [feature- dirs]/       # Other features (preserved)
├── hooks/
│   ├── track/                 # [NEW] Extracted track-related hooks
│   │   ├── useTrackData.ts
│   │   ├── useTrackActions.ts
│   │   ├── useTrackVersionSwitcher.ts
│   │   └── useRealtimeTrackUpdates.ts
│   ├── social/                # [NEW] Social interaction hooks
│   │   ├── useSocialInteractions.ts
│   │   └── useRealtimeSocialCounts.ts
│   ├── player/                # [NEW] Player control hooks
│   │   └── usePlayerControls.ts
│   └── stem/                  # [NEW] Stem operation hooks
│       └── useStemOperations.ts
├── services/                  # Business logic services (preserved)
├── api/                       # Supabase queries (preserved)
├── stores/                    # Zustand stores (preserved)
├── lib/                       # Utilities (preserved)
└── pages/                     # Route pages (preserved)

tests/
├── unit/
│   └── hooks/                 # [NEW] Hook unit tests
├── integration/
│   └── components/            # [NEW] Consolidated component tests
└── e2e/                       # Playwright E2E tests (preserved)
```

**Key Changes**:
1. **New**: `src/hooks/track/`, `src/hooks/social/`, `src/hooks/player/`, `src/hooks/stem/` - Extracted business logic
2. **Refactored**: `src/components/track/track-card.tsx` - Consolidated from 5 variants
3. **Refactored**: `src/components/ui/skeleton-loader.tsx` - Consolidated from 3 files
4. **Reorganized**: Component directories follow feature grouping (FR-017)
5. **Preserved**: All other directories remain unchanged

---

## Complexity Tracking

> **No violations to justify** - All constitution checks passed.

This section would be used only if constitution violations required justification. Since all checks passed, no complexity tracking is needed.

---

## Phase 0: Research & Technical Decisions

### Research Tasks

**Task 1: Component Consolidation Patterns**
- **Question**: What is the best pattern for consolidating 5 track card variants into a single component while maintaining all functionality (grid, list, compact, minimal, professional, enhanced)?
- **Research Needed**: React component composition patterns, variant prop strategies, TypeScript discriminated unions for variant props
- **Output**: Recommended pattern for UnifiedTrackCard with variant prop system

**Task 2: Hook Extraction Best Practices**
- **Question**: What are the best practices for extracting database queries and real-time subscriptions from React 19 components into custom hooks?
- **Research Needed**: TanStack Query integration in custom hooks, real-time subscription cleanup patterns, hook testing strategies
- **Output**: Hook extraction patterns with examples for useTrackData, useTrackActions, useRealtimeTrackUpdates

**Task 3: Skeleton Loader Consolidation**
- **Question**: How to consolidate 3 skeleton loader files (400+ lines) into a single system while maintaining all variants (TrackCardSkeleton, PlayerSkeleton, StudioSkeleton, etc.)?
- **Research Needed**: Skeleton composition patterns, variant props vs. separate components, motion preference handling
- **Output**: Consolidated skeleton system architecture

**Task 4: Dialog/Sheet Usage Guidelines**
- **Question**: When should Dialog vs. Sheet vs. ResponsiveModal be used? What are the clear decision criteria?
- **Research Needed**: Mobile UX patterns for modals, Telegram Mini App modal guidelines, shadcn/ui Dialog vs. Sheet use cases
- **Output**: Documented decision tree for modal component selection

**Task 5: Mobile Component Strategy**
- **Question**: When should separate Mobile* components be created vs. using responsive components with adaptive behavior?
- **Research Needed**: React responsive patterns, mobile-first design principles, Telegram Mini App constraints
- **Output**: Guidelines document with decision criteria and examples

**Task 6: Naming Convention Standards**
- **Question**: What are the industry-standard naming conventions for React component files and exports in 2025?
- **Research Needed**: React community standards, TypeScript conventions, ESLint rules for naming
- **Output**: Naming convention standard (kebab-case files, PascalCase exports)

**Task 7: Bundle Size Impact Analysis**
- **Question**: How to measure and minimize bundle size impact during component consolidation?
- **Research Needed**: size-limit configuration, Vite bundle analysis, code splitting strategies
- **Output**: Bundle size monitoring strategy and mitigation tactics

**Task 8: Testing Strategies for Refactored Components**
- **Question**: How to test consolidated components and extracted hooks effectively?
- **Research Needed**: React Testing Library patterns for hooks, integration testing for component variants, Playwright mobile emulation
- **Output**: Testing strategy with coverage targets (80% for hooks)

---

### Research Deliverables

**research.md** will contain:
1. Component consolidation patterns (Task 1)
2. Hook extraction best practices (Task 2)
3. Skeleton consolidation architecture (Task 3)
4. Dialog/sheet decision tree (Task 4)
5. Mobile component strategy guidelines (Task 5)
6. Naming convention standards (Task 6)
7. Bundle size impact analysis (Task 7)
8. Testing strategies (Task 8)

Each section will include:
- **Decision**: Chosen approach
- **Rationale**: Why this approach
- **Alternatives Considered**: Other options evaluated
- **References**: Links to documentation, articles, examples

---

## Phase 1: Design & Contracts

### Prerequisites

`research.md` must be complete with all 8 research tasks resolved before proceeding to Phase 1.

### Design Artifacts

**1. data-model.md**
- Entity definitions for: Component, Hook, SkeletonVariant, ComponentVariant
- Component variant system (discriminated union types)
- Hook parameter and return value types
- State transition diagrams (where applicable)

**2. contracts/**
- Hook contracts (TypeScript interfaces):
  - `contracts/useTrackData.contract.ts` - Data fetching hook
  - `contracts/useTrackActions.contract.ts` - Track operations hook
  - `contracts/useTrackVersionSwitcher.contract.ts` - Version switching hook
  - `contracts/useRealtimeTrackUpdates.contract.ts` - Real-time subscriptions
  - `contracts/useSocialInteractions.contract.ts` - Social actions hook
  - `contracts/usePlayerControls.contract.ts` - Player controls hook
  - `contracts/useStemOperations.contract.ts` - Stem operations hook

- Component contracts:
  - `contracts/UnifiedTrackCard.contract.ts` - Consolidated track card
  - `contracts/ResponsiveModal.contract.ts` - Adaptive modal
  - `contracts/SkeletonLoader.contract.ts` - Consolidated skeleton

**3. quickstart.md**
Developer quickstart guide for:
- Using consolidated components (UnifiedTrackCard, SkeletonLoader)
- Using extracted hooks (useTrackData, useTrackActions, etc.)
- Following naming conventions
- Following mobile component strategy
- Running and testing refactored code

**4. Agent Context Update**
Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude` to update CLAUDE.md with:
- New hook patterns (useTrackData, useTrackActions, etc.)
- Consolidated component usage (UnifiedTrackCard variants)
- Mobile component strategy guidelines
- Naming convention standards

---

### Post-Design Constitution Re-Check

After Phase 1 design artifacts are complete, re-evaluate constitution check:

**Expected Outcome**: ✅ All checks still pass (design phase should not introduce violations)

**If violations found**:
- Document in Complexity Tracking table
- Justify why simpler alternative rejected
- Get explicit approval before proceeding to Phase 2

---

## Implementation Phases

### Phase 0: Research (Current Phase)
- Generate research.md with all technical decisions
- Resolve all NEEDS CLARIFICATION items
- Establish best practices for consolidation and extraction

### Phase 1: Design (Next Phase)
- Generate data-model.md with entity definitions
- Generate contracts/ with hook and component interfaces
- Generate quickstart.md with developer guide
- Update agent context (CLAUDE.md)
- Re-check constitution compliance

### Phase 2: Task Breakdown (Separate Command)
- Run `/speckit.tasks` to generate tasks.md
- Break down into actionable implementation tasks
- Order tasks by dependency
- Mark parallel tasks with [P]

---

## Next Steps

**Current Command**: `/speckit.plan` (this document)

**Remaining Commands**:
1. Review plan.md and ensure all sections are complete
2. Run Phase 0 research (generate research.md)
3. Run Phase 1 design (generate data-model.md, contracts/, quickstart.md)
4. Update agent context (update-agent-context.ps1)
5. Re-check constitution compliance
6. Report completion with generated artifact paths

**After This Command Completes**:
- Run `/speckit.tasks` to generate task breakdown
- Review tasks.md before running `/speckit.implement`
