# Implementation Plan: Mobile Performance & UX Redesign

**Branch**: `036-mobile-perf-ux-redesign` | **Date**: 2026-06-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/036-mobile-perf-ux-redesign/spec.md`

## Summary

Comprehensive mobile performance optimization and UX redesign focused on: reducing bundle size from 918KB to ≤880KB, achieving TTI <2s, implementing minimalist design principles across all screens, adding configurable gestures with haptic feedback, and establishing a maintainable design token system. The work builds on the existing React 19 + Tailwind + shadcn/ui stack without architectural changes.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, Vite 5.0
**Primary Dependencies**: Tailwind CSS 3.4, shadcn/ui, Radix UI, Zustand 5.0, TanStack Query 5.90, framer-motion (via @/lib/motion), @use-gesture/react, Tone.js 14.9, Wavesurfer.js 7.8, @twa-dev/sdk 8.0.2
**Storage**: Supabase (PostgreSQL), localStorage (preferences), Telegram CloudStorage
**Testing**: Vitest 4.x (unit), Playwright 1.57 (E2E)
**Target Platform**: Telegram Mini App, mobile-first (375px–430px portrait), iOS 15+ / Android 10+
**Project Type**: Web/mobile (single SPA)
**Performance Goals**: TTI <2s, FPS ≥55, transitions <300ms, bundle ≤880KB
**Constraints**: Bundle hard limit 950KB, single audio element, iOS Safari audio pool limit 10, Telegram SDK constraints
**Scale/Scope**: 987 components, 347 hooks, 57 pages, 17 Zustand stores, 33 oversized files (>500 LOC)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
| ---- | ------ | ----- |
| §4.2 File sizes <500 LOC | ✅ ALIGNED | Feature goal: reduce 33 oversized files to 0, target <300 LOC per component |
| §4.3 Layered Data Flow | ✅ ALIGNED | No changes to API→Service→Hook→Component flow |
| §4.3 Single Audio Source | ✅ N/A | Audio system unchanged |
| §4.5 Bundle <950KB | ✅ ALIGNED | Feature target: reduce to ≤880KB |
| §4.5 Lazy loading all pages | ✅ ALIGNED | Will audit and ensure coverage |
| §4.5 Motion via @/lib/motion | ✅ ALIGNED | All new animations use @/lib/motion |
| §4.5 GPU-only animations | ✅ ALIGNED | Only transform, opacity, filter |
| §4.8 Touch targets ≥44px | ✅ ALIGNED | Core feature requirement |
| §4.8 prefers-reduced-motion | ✅ ALIGNED | FR-010 explicitly requires this |
| §4.10 No Dialog on mobile | ✅ ALIGNED | MobileBottomSheet enforced |
| §4.10 LazyImage for all images | ✅ ALIGNED | Will audit coverage |
| §4.10 Virtualization for lists >50 | ✅ ALIGNED | FR-003 requires ≥55 FPS |

**Result**: ALL GATES PASS. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/036-mobile-perf-ux-redesign/
├── plan.md              # This file
├── research.md          # Phase 0: Performance analysis & design patterns
├── data-model.md        # Phase 1: Design tokens, gesture config, preferences
├── quickstart.md        # Phase 1: Integration scenarios
├── contracts/           # Phase 1: N/A (no new API endpoints)
└── tasks.md             # Phase 2: Task breakdown (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/                    # Enhanced: design token integration, size audit
│   ├── mobile/                # Enhanced: gesture wrappers, minimalist layouts
│   ├── player/                # Enhanced: swipe gestures, minimalist controls
│   ├── library/               # Enhanced: minimalist track cards
│   ├── generate-form/         # Enhanced: simplified wizard UI
│   ├── settings/              # NEW: personalization screens
│   └── layout/                # Enhanced: consistent spacing, navigation
├── hooks/
│   ├── useGestureConfig.ts    # NEW: gesture settings management
│   ├── useUserPreferences.ts  # NEW: theme, text size, preferences
│   └── usePerformanceMonitor.ts # NEW: FPS/TTI tracking
├── lib/
│   ├── design-tokens.ts       # NEW: centralized token definitions
│   ├── gesture-defaults.ts    # NEW: default gesture configurations
│   └── motion.ts              # EXISTING: audit for tree-shaking coverage
├── stores/
│   └── usePreferencesStore.ts # NEW: user preferences Zustand store
└── styles/
    └── tokens.css             # NEW: CSS custom properties for design tokens

tests/
├── unit/
│   ├── design-tokens.test.ts  # Token validation
│   ├── gesture-config.test.ts # Gesture defaults
│   └── preferences.test.ts   # Preference persistence
└── e2e/
    ├── performance.spec.ts    # Lighthouse/FPS assertions
    └── gestures.spec.ts       # Mobile gesture flows
```

**Structure Decision**: Extends existing single-project SPA structure. New files go into established directories. No new top-level directories created. Design tokens as CSS custom properties align with existing Tailwind approach.

## Complexity Tracking

No violations — no justification needed.
