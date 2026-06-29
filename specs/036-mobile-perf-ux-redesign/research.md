# Research: Mobile Performance & UX Redesign

**Feature**: 036-mobile-perf-ux-redesign
**Date**: 2026-06-28

## R1: Bundle Size Reduction Strategy (918KB → ≤880KB)

**Decision**: Reduce bundle through duplicate removal, DnD library consolidation, and tree-shaking audit.

**Rationale**: Current 918KB is 32KB from the hard limit. Three proven reduction vectors:
1. **Duplicate hooks** (6 pairs, ~1700 LOC) — eliminating duplicates removes dead code
2. **DnD libraries** — project uses both `@dnd-kit` and `react-beautiful-dnd`; consolidating to `@dnd-kit` alone saves ~50KB
3. **Tree-shaking gaps** — audit framer-motion imports not going through `@/lib/motion`, Radix primitives imported but unused

**Alternatives considered**:
- Dynamic imports for Tone.js/Wavesurfer (already chunked via vendor splits — minimal gain)
- Replacing shadcn/ui with lighter alternatives (too risky, 987 components depend on it)
- Image format optimization (images are already WebP, not bundled)

## R2: Mobile Rendering Performance (FPS ≥55)

**Decision**: Focus on three areas: list virtualization audit, animation GPU acceleration enforcement, and component re-render reduction via React Compiler or manual memoization.

**Rationale**:
1. **Virtualization gaps**: Some lists may not use `react-virtuoso` consistently (library, queue, playlists)
2. **Layout thrashing**: Files >500 LOC often contain nested state updates that trigger layout recalculation
3. **Animation jank**: Any remaining `width`/`height` animations cause layout shifts

**Alternatives considered**:
- Web Workers for heavy computation (overkill for current use case)
- OffscreenCanvas for waveforms (Wavesurfer.js handles this)
- React Server Components (incompatible with Telegram Mini App SPA model)

## R3: Design Token System

**Decision**: CSS custom properties defined in a single `tokens.css` file, consumed by Tailwind via `theme.extend`, with a TypeScript companion for programmatic access.

**Rationale**:
- CSS custom properties allow runtime theme switching without JS re-renders
- Tailwind already supports custom properties via `var()` in config
- TypeScript companion enables type-safe access in components that need dynamic styling
- Existing Tailwind config already defines custom colors (`generate`, `library`, etc.) — extend rather than replace

**Alternatives considered**:
- Style Dictionary (too heavyweight for a single-project setup)
- Tailwind-only tokens (no runtime switching without CSS vars)
- CSS-in-JS tokens (contradicts Tailwind-first approach)

## R4: Gesture System Architecture

**Decision**: Build on existing `@use-gesture/react` with a `GestureConfig` Zustand store for user preferences, persisted to localStorage and Telegram CloudStorage.

**Rationale**:
- `@use-gesture/react` already in dependencies — no new library needed
- Sprint 033 already implemented gesture hints (PlayerGestureHints, SwipeChevronIndicator) — extend, don't rebuild
- Zustand store for config aligns with existing state management patterns (§4.4)
- Dual persistence (localStorage + CloudStorage) ensures cross-device sync

**Alternatives considered**:
- Hammer.js (would add ~7KB, @use-gesture already covers all needed gestures)
- Native touch events (too low-level, lose gesture composition)
- Server-side preference storage in Supabase (latency for gesture settings is unacceptable)

## R5: Minimalist Design Principles

**Decision**: Apply "one action per screen" principle with systematic audit of all 57 pages, reducing visual elements to ≤7 per screen (Miller's Law). Use 8px grid system for spacing consistency.

**Rationale**:
- Current screens have inconsistent element density — some are clean (player), some are cluttered (generate form, studio)
- 8px grid aligns with Tailwind's default spacing scale (2=8px, 3=12px, 4=16px)
- Typography scale already exists (12/14/16/20/24/32px) but isn't consistently enforced
- Negative space is the cheapest UX improvement — requires removing elements, not adding

**Alternatives considered**:
- Complete visual redesign (too risky with 987 components, incremental is safer)
- Material Design 3 adoption (would require rebuilding shadcn/ui, not worth it)
- Figma-first design process (can do parallel, but code-level improvements can start immediately)

## R6: Oversized File Decomposition Strategy

**Decision**: Prioritize splitting the 33 files >500 LOC by impact: start with most-imported components, then stores, then hooks. Target <300 LOC per component, <300 LOC per hook.

**Rationale**:
- 33 files >500 LOC is the #1 maintainability issue per PROJECT_STATUS
- Constitution §4.2 mandates <500 LOC — this feature tightens to <300 LOC
- Most-imported files cause the widest cascade of re-renders when they change
- Known oversized files: `useGenerateForm.ts` (1218 LOC), `usePromptDJEnhanced.ts` (1070 LOC), `useUnifiedStudioStore` (38KB)

**Alternatives considered**:
- Automated splitting tools (don't understand domain boundaries)
- Leaving at <500 LOC (insufficient — still causes review and comprehension burden)
- Splitting only stores (hooks are equally problematic)

## R7: Settings & Personalization Storage

**Decision**: `usePreferencesStore` (Zustand) with triple persistence: reactive state → localStorage (immediate) → Telegram CloudStorage (async, cross-device).

**Rationale**:
- Zustand for reactive UI updates (theme switch <200ms)
- localStorage for instant persistence (survives page reload)
- CloudStorage for cross-device sync (Telegram-specific, async write is acceptable)
- Existing patterns: `useLyricsHistoryStore` and `useMixerHistoryStore` already use similar persistence

**Alternatives considered**:
- Supabase user_preferences table (adds latency, overkill for UI prefs)
- Context API (Constitution §4.4 prohibits for global state)
- sessionStorage only (doesn't persist between sessions)
