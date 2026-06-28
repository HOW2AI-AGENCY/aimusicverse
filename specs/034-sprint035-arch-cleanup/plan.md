# Implementation Plan: Sprint 035 — Stabilization & Architecture Cleanup

**Branch**: `034-sprint035-arch-cleanup` | **Date**: 2026-06-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/034-sprint035-arch-cleanup/spec.md`

## Summary

Sprint 035 addresses the most critical findings from the architecture audit (6.1/10): runtime crash risks from downgraded ESLint rules and unprotected payment routes, state desynchronization from 3 duplicate PlaybackStores, ~1700 lines of duplicated hook code, scattered query keys causing stale data bugs, zero passing E2E tests, and 50KB of redundant DnD libraries. The approach is stabilize-first (Phase 1), then deduplicate (Phase 2), then test infrastructure (Phase 3), then quick wins (Phase 4).

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, Node 18+
**Primary Dependencies**: Vite 5.0, Zustand 5.0, TanStack Query 5.90, @dnd-kit/core, @hello-pangea/dnd, Playwright 1.57
**Storage**: Supabase (PostgreSQL + Edge Functions + Storage)
**Testing**: Vitest 4.x (unit, 320 tests), Playwright 1.57 (E2E, 47 specs / 0 passing)
**Target Platform**: Telegram Mini App (mobile-first, iOS/Android)
**Project Type**: Web (single SPA)
**Performance Goals**: Bundle < 950KB, Lighthouse mobile ≥ 90
**Constraints**: Single audio element (iOS Safari), touch targets ≥ 44px
**Scale/Scope**: 987 components, 347 hooks, 120 Edge Functions, 574+ users

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|-----------|--------|-------|
| §4.2 Code Style (no `any`, strict TS) | ALIGNS | Sprint reduces 342 `any` count indirectly via deduplication |
| §4.3 Layered Data Flow | ALIGNS | No layer violations introduced; existing violations tracked for Sprint 036 |
| §4.3 Single Audio Source | ALIGNS | PlaybackStore consolidation reinforces single-source pattern |
| §4.4 State Management (Zustand + TQ) | ALIGNS | Query key factory standardizes TanStack Query usage |
| §4.5 Performance Budget (<950KB) | ALIGNS | DnD consolidation reduces bundle ~50KB |
| §4.6 Testing | ALIGNS | E2E stabilization directly addresses testing gap |
| §4.7 Security | ALIGNS | ProtectedRoute for payment routes |
| §4.8 Accessibility | N/A | No accessibility changes in this sprint |
| §4.10 Pitfall #12 (files <500 LOC) | PARTIAL | PromptDJ enhanced is 1070 LOC — tracked for Sprint 036 split |

**Gate result**: PASS — no violations. PromptDJ size noted for future sprint.

**Post-Phase 1 re-check**: PASS — data model and contracts don't introduce new violations.

## Project Structure

### Documentation (this feature)

```text
specs/034-sprint035-arch-cleanup/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: implementation guide
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (affected areas)

```text
src/
├── stores/
│   ├── usePlaybackStore.ts          # MODIFY (canonical, absorb studio features)
│   ├── studio/usePlaybackStore.ts   # DELETE
│   └── slices/playbackSlice.ts      # DELETE
├── hooks/
│   ├── useMixExport.ts              # DELETE
│   ├── useOptimizedAudioPlayer.tsx   # DELETE
│   ├── usePromptDJ.ts               # DELETE (old) → RENAME enhanced here
│   ├── usePromptDJStore.ts          # DELETE
│   ├── usePromptDJEnhanced.ts       # RENAME → usePromptDJ.ts
│   ├── studio/useMixExport.ts       # KEEP (canonical)
│   └── audio/useOptimizedAudioPlayer.tsx  # KEEP (canonical)
├── lib/
│   └── queryKeys.ts                 # NEW
├── components/
│   ├── ProtectedRoute.tsx           # EXISTS (no changes)
│   ├── studio/unified/SortableTrackList.tsx  # KEEP (@dnd-kit)
│   ├── player/QueueSheet.tsx        # KEEP (@dnd-kit)
│   ├── player/QueueItem.tsx         # KEEP (@dnd-kit)
│   ├── generate-form/LyricsVisualEditor.tsx  # MIGRATE @hello-pangea → @dnd-kit
│   └── project/detail/ProjectTracklistSection.tsx  # MIGRATE @hello-pangea → @dnd-kit
├── pages/
│   └── ProjectDetail.tsx            # MIGRATE @hello-pangea → @dnd-kit
├── App.tsx                          # MODIFY (wrap payment routes)
eslint.config.js                     # MODIFY (rules-of-hooks → error)
vite.config.ts                       # MODIFY (remove react-redux chunk)
tests/e2e/                           # MODIFY (fix test infrastructure)
.github/workflows/                   # MODIFY (add Playwright CI)
```

## Phases & Execution Order

### Phase 1: Runtime Fixes (P1 — blocks everything)

| Task | Files | Risk | Verification |
|------|-------|------|-------------|
| 1.1 ESLint rules-of-hooks → error | `eslint.config.js` | May reveal hidden violations | `npm run lint` |
| 1.2 Fix any revealed hook violations | Various `src/` | Medium — conditional hooks need refactoring | `npm run lint` + `npm run build` |
| 1.3 Wrap payment routes | `src/App.tsx:337-338` | Low — established pattern | Manual test + E2E |
| 1.4 Consolidate PlaybackStore | 3 store files + consumers | High — many consumers | `npm run build` + manual test player |

### Phase 2: Deduplication (P2 — largest impact)

| Task | Files | Est. LOC removed | Verification |
|------|-------|-----------------|-------------|
| 2.1 Consolidate useMixExport | 2 files → 1 | ~380 | `npm run build` |
| 2.2 Consolidate useOptimizedAudioPlayer | 2 files → 1 | ~395 | `npm run build` |
| 2.3 Consolidate PromptDJ | 3 files → 1 | ~660 | `npm run build` |
| 2.4 Create query key factory | New `queryKeys.ts` + all hooks | 0 (net add) | `npm run build` + `npm test` |
| 2.5 Migrate hooks to query key factory | ~50+ hook files | Net reduce via cleanup | TypeScript compile |

### Phase 3: E2E Stabilization (P2)

| Task | Files | Verification |
|------|-------|-------------|
| 3.1 Fix test infrastructure (selectors, waits) | `tests/e2e/*.spec.ts` | 3 consecutive green runs |
| 3.2 Configure Playwright CI | `.github/workflows/` | CI pipeline green |

### Phase 4: Quick Fixes (P3)

| Task | Files | Bundle impact | Verification |
|------|-------|--------------|-------------|
| 4.1 Remove react-redux manualChunks | `vite.config.ts` | ~0 (dead ref) | `npm run build` |
| 4.2 Migrate @hello-pangea → @dnd-kit | 4 files | -50KB | `npm run size` |
| 4.3 Remove @hello-pangea/dnd package | `package.json` | -50KB | `npm install` + `npm run build` |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PlaybackStore migration breaks player | Medium | High | Test all player modes (compact, expanded, fullscreen) manually |
| Query key migration misses a hook | Low | Medium | TypeScript compilation + grep audit |
| DnD migration breaks drag interactions | Low | Medium | Test each DnD surface (queue, tracklist, lyrics editor, project detail) |
| E2E tests remain flaky | Medium | Low | Focus on deterministic tests (smoke, navigation), skip timing-sensitive |
| rules-of-hooks error reveals many violations | Low | Medium | Fix violations before changing config; can be done incrementally |

## Complexity Tracking

No constitution violations requiring justification.
