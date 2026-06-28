# Feature Specification: Sprint 035 — Stabilization & Architecture Cleanup

**Feature Branch**: `034-sprint035-arch-cleanup`
**Created**: 2026-06-28
**Status**: Draft
**Input**: Architecture audit (score 6.1/10) identified critical runtime risks, code duplication, missing test infrastructure, and bundle bloat requiring immediate stabilization.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Runtime Crash Prevention (Priority: P1)

A developer enables strict ESLint rules-of-hooks enforcement and fixes all violations so that conditional/nested hook calls no longer cause silent React crashes in production.

**Why this priority**: Conditional hook calls cause unpredictable crashes in production that are impossible to debug from user reports. This is the highest-risk item.

**Independent Test**: Run `npx eslint --rule '{"react-hooks/rules-of-hooks":"error"}' src/` — zero errors. Build succeeds.

**Acceptance Scenarios**:

1. **Given** `eslint.config.js` has `rules-of-hooks: "warn"`, **When** the rule is changed to `"error"`, **Then** `npm run lint` passes with zero rules-of-hooks violations
2. **Given** any component with a conditional hook call, **When** the code is refactored, **Then** hooks are called unconditionally at the top level

---

### User Story 2 — Payment Route Protection (Priority: P1)

An unauthenticated user navigating to `/payment` or `/payment/buy` is redirected to the login flow instead of seeing a broken payment page.

**Why this priority**: Unprotected payment routes expose broken UI to unauthenticated users and represent a security gap.

**Independent Test**: Navigate to `/payment` while logged out — verify redirect to auth flow.

**Acceptance Scenarios**:

1. **Given** a user is not authenticated, **When** they navigate to `/payment`, **Then** they are redirected to the authentication flow
2. **Given** a user is authenticated, **When** they navigate to `/payment`, **Then** the payment page loads normally

---

### User Story 3 — PlaybackStore Consolidation (Priority: P1)

The three separate PlaybackStore implementations are merged into a single source of truth so that playback state is never out of sync across Studio, Player, and Library views.

**Why this priority**: Three competing stores cause state desynchronization — a user might see "playing" in the player bar but "paused" in studio.

**Independent Test**: Play a track in Library, switch to Studio — playback state is consistent in both views.

**Acceptance Scenarios**:

1. **Given** three PlaybackStore files exist, **When** they are consolidated, **Then** only one canonical store remains in `src/stores/usePlaybackStore.ts`
2. **Given** a track is playing, **When** the user navigates between views, **Then** playback state is identical everywhere
3. **Given** the old store files are removed, **When** `npm run build` is run, **Then** the build succeeds with zero import errors

---

### User Story 4 — Hook Deduplication (Priority: P2)

Duplicate hook implementations (`useMixExport`, `useOptimizedAudioPlayer`, PromptDJ trio) are consolidated to canonical versions, removing ~1700 lines of dead code.

**Why this priority**: Duplicates cause confusion about which version to use and bugs when one copy is updated but the other is not.

**Independent Test**: `grep -r "useMixExport\|useOptimizedAudioPlayer\|usePromptDJ" src/hooks/ --include="*.ts" --include="*.tsx" -l` returns at most one file per hook name.

**Acceptance Scenarios**:

1. **Given** `useMixExport` exists in `hooks/` and `hooks/studio/`, **When** they are consolidated, **Then** only one remains and all imports point to it
2. **Given** `useOptimizedAudioPlayer` exists in `hooks/` and `hooks/audio/`, **When** they are consolidated, **Then** only one remains
3. **Given** `usePromptDJ.ts`, `usePromptDJEnhanced.ts`, and `usePromptDJStore.ts` exist, **When** the old versions are removed, **Then** only `usePromptDJEnhanced.ts` (renamed to `usePromptDJ.ts`) remains
4. **Given** deduplication is complete, **When** `npm run build` is run, **Then** the build succeeds

---

### User Story 5 — Query Key Factory (Priority: P2)

All TanStack Query hooks use a centralized query key factory (`src/lib/queryKeys.ts`) instead of scattered string literals, enabling reliable cache invalidation and consistent staleTime defaults.

**Why this priority**: Scattered query keys lead to stale data bugs and make cache invalidation unreliable. Inconsistent staleTime (2s to 5min) causes unnecessary refetches or stale UI.

**Independent Test**: `grep -rn "queryKey:" src/hooks/ | grep -v "queryKeys\."` returns zero results — all hooks use the factory.

**Acceptance Scenarios**:

1. **Given** no query key factory exists, **When** `src/lib/queryKeys.ts` is created, **Then** it exports typed key factories for all query domains (tracks, playlists, users, generation, etc.)
2. **Given** hooks use string literal query keys, **When** they are migrated to the factory, **Then** all query keys are centralized
3. **Given** staleTime varies from 2s to 5min, **When** defaults are standardized, **Then** a consistent policy is applied (30s default, configurable per domain)

---

### User Story 6 — E2E Test Stabilization (Priority: P2)

At least 20 of the 47 existing E2E specs pass reliably in CI, and a Playwright CI pipeline is configured.

**Why this priority**: Zero E2E tests passing means no regression safety net for UI changes.

**Independent Test**: `npm run test:e2e -- --grep "smoke|homepage|navigation"` passes consistently across 3 consecutive runs.

**Acceptance Scenarios**:

1. **Given** 47 E2E specs exist but 0 pass, **When** smoke/homepage/navigation tests are fixed, **Then** at least 20 specs pass
2. **Given** no Playwright CI pipeline exists, **When** it is configured, **Then** E2E tests run on push/PR in GitHub Actions
3. **Given** E2E tests are in CI, **When** a test fails, **Then** the pipeline reports which tests failed with screenshots

---

### User Story 7 — Bundle Cleanup (Priority: P3)

Remove dead `react-redux` chunk reference and consolidate to a single DnD library, reducing bundle by ~50KB.

**Why this priority**: Quick wins that reduce bundle size without architectural changes.

**Independent Test**: `npm run size` passes and reports reduced bundle. `npm run build` has no `react-redux` chunk warning.

**Acceptance Scenarios**:

1. **Given** `vite.config.ts` references `react-redux` in manualChunks, **When** the reference is removed, **Then** no build warnings about missing `react-redux`
2. **Given** both `@dnd-kit/core` and `@hello-pangea/dnd` are installed, **When** one is removed, **Then** only one DnD library remains and all drag-and-drop features work
3. **Given** cleanup is done, **When** `npm run size` is run, **Then** bundle size is below 950KB

---

### Edge Cases

- What happens when a component imports from a removed duplicate file? Build must fail with a clear import error, not silently break.
- What happens if a query key factory key is misspelled? TypeScript must catch it at compile time.
- What happens when ESLint rules-of-hooks is set to "error" but a violation exists in generated/third-party code? Must be excluded via eslint-disable with justification.
- What happens if the consolidated PlaybackStore has a different API than the old ones? All consumers must be updated atomically.

## Requirements _(mandatory)_

### Functional Requirements

**Phase 1: Runtime Fixes**
- **FR-001**: System MUST enforce `react-hooks/rules-of-hooks` as `"error"` in ESLint configuration
- **FR-002**: System MUST wrap `/payment` and `/payment/buy` routes with `ProtectedRoute` in `src/App.tsx`
- **FR-003**: System MUST have a single `usePlaybackStore` as the canonical playback state source, removing `stores/studio/usePlaybackStore.ts` and `stores/slices/playbackSlice.ts`

**Phase 2: Deduplication**
- **FR-004**: System MUST have one canonical `useMixExport` hook (consolidating `hooks/useMixExport.ts` + `hooks/studio/useMixExport.ts`)
- **FR-005**: System MUST have one canonical `useOptimizedAudioPlayer` hook (consolidating `hooks/useOptimizedAudioPlayer.tsx` + `hooks/audio/useOptimizedAudioPlayer.tsx`)
- **FR-006**: System MUST consolidate PromptDJ into one hook (removing `usePromptDJ.ts` and `usePromptDJStore.ts`, keeping enhanced version)
- **FR-007**: System MUST provide a typed query key factory at `src/lib/queryKeys.ts` used by all TanStack Query hooks
- **FR-008**: System MUST apply consistent staleTime/gcTime defaults across all query hooks (30s default)

**Phase 3: E2E Stabilization**
- **FR-009**: System MUST have at least 20 passing E2E test specifications
- **FR-010**: System MUST have a Playwright CI pipeline in GitHub Actions

**Phase 4: Quick Fixes**
- **FR-011**: System MUST remove dead `react-redux` reference from `vite.config.ts` manualChunks
- **FR-012**: System MUST use only one DnD library (either `@dnd-kit` or `@hello-pangea/dnd`, not both)
- **FR-013**: System MUST pass `npm run build` and `npm run size` (bundle < 950KB)

### Key Entities

- **PlaybackStore**: Zustand store managing current track, queue, playback state (play/pause/seek), volume, repeat/shuffle modes
- **QueryKeyFactory**: Typed object exporting hierarchical query keys per domain (tracks, playlists, users, generation, studio, etc.)
- **ProtectedRoute**: Route wrapper that redirects unauthenticated users to login flow

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `npm run lint` passes with `rules-of-hooks: "error"` — zero violations
- **SC-002**: Unauthenticated access to `/payment` redirects to auth (manual + E2E test)
- **SC-003**: Only 1 PlaybackStore file exists in `src/stores/` (was 3)
- **SC-004**: 0 duplicate hook pairs remain (was 6 pairs)
- **SC-005**: Net code reduction of at least 1500 lines from deduplication
- **SC-006**: 100% of TanStack Query hooks use `queryKeys.*` factory (0 raw string keys)
- **SC-007**: At least 20 E2E specs pass in CI consistently (3 consecutive green runs)
- **SC-008**: Playwright CI pipeline runs on every PR
- **SC-009**: Bundle size remains under 950KB after all changes
- **SC-010**: `npm run build` produces zero warnings about missing chunks or modules
- **SC-011**: Architecture audit score improves from 6.1 to at least 7.0/10
- **SC-012**: Only 1 DnD library in `package.json` (was 2)

### Assumptions

- The enhanced version of each duplicate hook (`hooks/studio/useMixExport.ts`, `hooks/audio/useOptimizedAudioPlayer.tsx`, `usePromptDJEnhanced.ts`) is the more complete implementation and should be kept as canonical
- `@dnd-kit` is the preferred DnD library (more modern, smaller bundle, better accessibility) — to be verified by checking usage count of each
- E2E test failures are primarily due to missing test infrastructure (selectors, wait conditions) rather than actual application bugs
- The existing `ProtectedRoute` component pattern is already implemented for other routes and can be reused
