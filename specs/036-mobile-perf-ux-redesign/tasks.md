# Tasks: Оптимизация производительности и UX-редизайн мобильного интерфейса

**Input**: Design documents from `/specs/036-mobile-perf-ux-redesign/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Not explicitly requested — test tasks omitted. Validation via manual testing, Lighthouse, and `npm run size`.

**Organization**: Tasks are grouped by user story (P1, P2, P3 priority) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

- **Repository root**: `src/` for source code
- **Spec directory**: `specs/036-mobile-perf-ux-redesign/`
- **Tokens**: `src/styles/tokens.css`, `src/lib/design-tokens.ts`
- **Stores**: `src/stores/`
- **Components**: `src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create foundational files and configurations needed by all user stories

- [x] T001 Create design tokens CSS file at `src/styles/tokens.css` with CSS custom properties for colors (brand, neutral, semantic, surface, text), typography (sizes, weights, line-heights), spacing (8px grid scale), radii, shadows, and transitions
- [x] T002 [P] Create TypeScript design tokens companion at `src/lib/design-tokens.ts` exporting typed token objects that mirror the CSS custom properties
- [x] T003 [P] Import `tokens.css` in `src/main.tsx` and verify Tailwind `theme.extend` references CSS custom properties in `tailwind.config.ts`
- [x] T004 [P] Create Zod schemas for GestureConfig and UserPreferences in `src/lib/schemas/preferences.schema.ts` per data-model.md validation rules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create `usePreferencesStore` Zustand store at `src/stores/usePreferencesStore.ts` with two slices: `preferences` (theme, textSize, reducedMotion, audioQuality, notificationsEnabled, compactCards) and `gestureConfig` (swipeEnabled, swipeSensitivity, longPressEnabled, longPressDuration, doubleTapEnabled, pullToRefreshEnabled, hapticEnabled, hapticIntensity)
- [x] T006 [P] Add triple persistence middleware to `usePreferencesStore`: Zustand → localStorage (`user-preferences`, `gesture-config` keys) → Telegram CloudStorage (`prefs`, `gestures` keys) with async write
- [x] T007 [P] Create `useGestureConfig` hook at `src/hooks/useGestureConfig.ts` that reads gesture settings from `usePreferencesStore` and provides typed getters
- [x] T008 [P] Create `useDisplayPreferences` hook (renamed from useUserPreferences to avoid conflict) at `src/hooks/useUserPreferences.ts` that reads user preferences from `usePreferencesStore` and applies theme/textSize/reducedMotion to DOM
- [x] T009 Wire `useDisplayPreferences` into `src/App.tsx` to apply theme class (`dark`/`light`) and text scale CSS variable (`--text-scale`) on mount and on change

**Checkpoint**: Foundation ready — design tokens, preferences store, and hooks available for all user stories

---

## Phase 3: User Story 1 — Мгновенный отклик на мобильном (Priority: P1) 🎯 MVP

**Goal**: TTI <2s, FPS ≥55, transitions <300ms, bundle ≤880KB

**Independent Test**: Open app on Pixel 5 emulator, perform full cycle: launch → library → play track → generate → studio. Each transition <300ms, no FPS drops below 55. Run `npm run size` — must be ≤880KB.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Audit all 57 pages in `src/pages/` for React.lazy() coverage — list any pages imported eagerly and convert to lazy imports in `src/App.tsx`
- [ ] T011 [P] [US1] Audit all image usages across `src/components/` — replace any raw `<img>` tags with `LazyImage` from `src/components/ui/lazy-image.tsx`
- [ ] T012 [P] [US1] Identify and remove 6 duplicate hook pairs listed in PROJECT_STATUS.md — consolidate into single canonical hooks, update all imports (~1700 LOC reduction)
- [ ] T013 [P] [US1] Audit DnD library usage — find all imports of `react-beautiful-dnd` and `@dnd-kit`, consolidate to `@dnd-kit` only, remove `react-beautiful-dnd` from `package.json` (~50KB savings)
- [ ] T014 [US1] Audit all framer-motion imports across `src/` — replace any direct `import { ... } from 'framer-motion'` with `import { ... } from '@/lib/motion'`
- [ ] T015 [US1] Audit list components in `src/components/library/`, `src/components/player/Queue*.tsx`, and playlist screens — ensure all lists >50 items use `react-virtuoso` with proper overscan
- [ ] T016 [US1] Audit animations across `src/components/` — replace any CSS/JS animations using `width`, `height`, `top`, `left`, `margin`, `padding` with `transform`/`opacity`/`filter` equivalents
- [ ] T017 [US1] Split `src/hooks/useGenerateForm.ts` (1218 LOC) into 4 focused hooks: `useGenerateFormState.ts`, `useGenerateFormValidation.ts`, `useGenerateFormDraft.ts`, `useGenerateFormSubmit.ts` — each <300 LOC
- [ ] T018 [US1] Split `src/hooks/usePromptDJEnhanced.ts` (1070 LOC) into 2 focused hooks: `usePromptDJCore.ts` and `usePromptDJUI.ts` — each <300 LOC
- [ ] T019 [US1] Identify and split the 8 oversized components (>800 LOC) listed in PROJECT_STATUS.md into subcomponents — each resulting file <300 LOC
- [ ] T020 [US1] Run `npm run size` and verify bundle ≤880KB — if over, run `npm run size:why` and identify additional reduction targets
- [ ] T021 [US1] Run Lighthouse mobile audit — verify Performance score ≥95, identify and fix any remaining bottlenecks

**Checkpoint**: Bundle ≤880KB, lazy loading complete, duplicates removed, oversized files split, Lighthouse ≥95

---

## Phase 4: User Story 2 — Минималистичный и чистый дизайн (Priority: P1)

**Goal**: Every screen follows "one action per screen" principle, ≤7 visual elements (Miller's Law), consistent typography and spacing

**Independent Test**: Show each major screen to 5 users. Each identifies the primary action in <10 seconds. Track cards contain only: cover, title, artist, duration, play button.

### Implementation for User Story 2

- [ ] T022 [P] [US2] Audit and simplify `src/components/generate-form/` — reduce visual elements per step to ≤7, ensure single CTA per step, remove decorative elements
- [ ] T023 [P] [US2] Audit and simplify `src/components/library/` track cards — ensure each card shows only: cover image (LazyImage), title, artist, duration, play button. Remove secondary info from default view
- [ ] T024 [P] [US2] Audit and simplify `src/components/player/MobileFullscreenPlayer.tsx` — reduce controls to essential: play/pause, prev/next, progress bar, like. Move advanced controls to expandable drawer
- [ ] T025 [P] [US2] Audit `src/components/studio/unified/` mobile views — apply "one CTA per screen" principle, group secondary actions into MobileBottomSheet menus
- [ ] T026 [US2] Audit typography consistency across all `src/components/` — enforce type scale (12/14/16/20/24/32px) using Tailwind classes (`text-xs`/`text-sm`/`text-base`/`text-xl`/`text-2xl`/`text-3xl`), fix any hardcoded pixel values
- [ ] T027 [US2] Audit spacing consistency — enforce 8px grid (Tailwind `p-1`=4px, `p-2`=8px, `p-3`=12px, `p-4`=16px) across all mobile layouts, replace arbitrary spacing values
- [ ] T028 [US2] Audit negative space — add consistent vertical spacing (`space-y-3` or `space-y-4`) between sections on all major screens, ensure content has room to breathe
- [ ] T029 [US2] Audit all mobile screens for element count — create list of screens exceeding 7 visual elements, simplify by grouping or hiding secondary elements behind progressive disclosure
- [ ] T030 [US2] Migrate all hardcoded color values across `src/components/` to design token CSS variables defined in `src/styles/tokens.css` — no raw hex/rgb values in component files

**Checkpoint**: All screens follow minimalist principles — one CTA, ≤7 elements, consistent type/spacing, token-based colors

---

## Phase 5: User Story 3 — Продвинутые жесты и микровзаимодействия (Priority: P2)

**Goal**: Swipe, long-press, double-tap, pull-to-refresh gestures with haptic feedback, all configurable

**Independent Test**: Give user task "find a track and add to playlist" without explanation. User should discover and use ≥2 gestures naturally.

### Implementation for User Story 3

- [ ] T031 [P] [US3] Create `useSwipeable` hook at `src/hooks/gestures/useSwipeable.ts` using `@use-gesture/react` — horizontal swipe with configurable sensitivity from `useGestureConfig`, haptic feedback via `hapticImpact()`
- [ ] T032 [P] [US3] Create `useLongPress` hook at `src/hooks/gestures/useLongPress.ts` — configurable hold duration from `useGestureConfig`, haptic on trigger, cancel on move
- [ ] T033 [P] [US3] Create `useDoubleTap` hook at `src/hooks/gestures/useDoubleTap.ts` — double tap detection with 300ms window, haptic on trigger, animation callback
- [ ] T034 [US3] Integrate `useSwipeable` into `src/components/player/MobileFullscreenPlayer.tsx` — swipe left/right to switch tracks with slide animation via `@/lib/motion`
- [ ] T035 [US3] Integrate `useLongPress` into track cards in `src/components/library/` — long press triggers MobileBottomSheet context menu with track actions
- [ ] T036 [US3] Integrate `useDoubleTap` into track cards and player — double tap toggles like with heart burst animation (reuse existing like explosion from sprint 033)
- [ ] T037 [US3] Audit pull-to-refresh implementation across library, feed, and explore screens — ensure consistent behavior using existing PTR component, wire to `useGestureConfig.pullToRefreshEnabled`
- [ ] T038 [US3] Add gesture discovery hints — show one-time tooltip on first use of each screen indicating available gestures (reuse `MoreMenuHintTooltip` pattern from sprint 033)

**Checkpoint**: All 4 gesture types working, haptic feedback active, gestures configurable, discovery hints shown

---

## Phase 6: User Story 4 — Удобная настройка и персонализация (Priority: P2)

**Goal**: Settings screen accessible in ≤2 taps, theme/text/gesture changes apply instantly, persist across sessions

**Independent Test**: User opens settings, changes theme + text size + disables a gesture. All changes visible immediately. Close and reopen app — all settings preserved.

### Implementation for User Story 4

- [ ] T039 [P] [US4] Create `SettingsScreen` page at `src/pages/SettingsPage.tsx` with sections: Appearance (theme, text size), Gestures, Audio, Notifications — lazy-loaded route in `src/App.tsx`
- [ ] T040 [P] [US4] Create `ThemeSelector` component at `src/components/settings/ThemeSelector.tsx` — 3 options (light/dark/auto) with instant preview, uses `usePreferencesStore`
- [ ] T041 [P] [US4] Create `TextSizeSelector` component at `src/components/settings/TextSizeSelector.tsx` — 3 options (small/medium/large) with live preview text, updates `--text-scale` CSS variable
- [ ] T042 [P] [US4] Create `GestureSettings` component at `src/components/settings/GestureSettings.tsx` — toggle switches for each gesture type, sensitivity slider for swipe, duration selector for long press
- [ ] T043 [US4] Add settings entry point — add settings icon/button to profile/menu accessible from bottom navigation or hamburger, ensure ≤2 taps from any screen
- [ ] T044 [US4] Implement `prefers-reduced-motion` detection in `useUserPreferences` — auto-set `reducedMotion: true` if OS setting detected, allow manual override in settings
- [ ] T045 [US4] Implement text scaling — when `textSize` changes, update `--text-scale` CSS variable (small: 0.875, medium: 1.0, large: 1.125), apply to `html` element, verify all text elements scale proportionally

**Checkpoint**: Settings screen complete, all preferences apply instantly, persist after app restart

---

## Phase 7: User Story 5 — Обслуживаемый и модульный UI (Priority: P3)

**Goal**: Design system documented in Storybook, new screen creation <30 minutes, single-point color/typography changes

**Independent Test**: Developer creates new screen with 3 standard components (card, list, button) in <30 minutes without creating new UI primitives.

### Implementation for User Story 5

- [ ] T046 [P] [US5] Add Storybook stories for 10 core UI components: `Button`, `GlowButton`, `LazyImage`, `MobileBottomSheet`, `MobileHeaderBar`, `Card`, `Badge`, `Input`, `Select`, `Skeleton` — each with variants and API docs in `src/components/ui/*.stories.tsx`
- [ ] T047 [P] [US5] Add Storybook stories for 5 composite components: `TrackCard`, `PlaylistCard`, `UnifiedVersionSelector`, `PlayerControls`, `GenerateButton` in `src/components/**/*.stories.tsx`
- [ ] T048 [P] [US5] Create screen template component at `src/components/templates/MobileScreenTemplate.tsx` — standard layout: MobileHeaderBar + scrollable content + optional sticky footer CTA, with documentation
- [ ] T049 [US5] Create developer guide at `docs/SCREEN_TEMPLATE.md` — step-by-step instructions for creating a new page using `MobileScreenTemplate`, existing components, and design tokens. Include code examples from quickstart.md
- [ ] T050 [US5] Verify single-point color changes — change primary brand color in `src/styles/tokens.css`, confirm all screens update automatically without individual component changes
- [ ] T051 [US5] Verify single-point typography changes — change base font size in `src/styles/tokens.css`, confirm all text elements scale correctly

**Checkpoint**: 15 components documented in Storybook, screen template ready, single-point style changes verified

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality assurance across all user stories

- [ ] T052 [P] Run `npm run size` — verify bundle ≤880KB, document final size
- [ ] T053 [P] Run `npm run lint` — fix any new lint errors introduced during refactoring
- [ ] T054 [P] Run `npm test` — verify all existing unit tests pass after refactoring
- [ ] T055 [P] Run Lighthouse mobile audit — verify Performance ≥95, Accessibility 100, Best Practices ≥95
- [ ] T056 [P] Verify `prefers-reduced-motion` — test with OS setting enabled, confirm all animations disabled
- [ ] T057 [P] Verify 320px viewport — test all major screens at 320px width, confirm no horizontal scroll
- [ ] T058 Test complete user flow on Pixel 5 emulator: launch → library → play → generate → studio → settings. Verify all transitions <300ms, no jank
- [ ] T059 Test settings persistence: change 5 settings → close app → reopen → verify all settings preserved
- [ ] T060 Test gesture discovery: fresh session → navigate to player → verify gesture hint appears → perform gesture → verify hint dismisses permanently
- [ ] T061 Run `npm run build` — verify production build succeeds with no TypeScript errors
- [ ] T062 Update `PROJECT_STATUS.md` with sprint 036 results: new bundle size, oversized files count, Lighthouse score
- [ ] T063 Update `CHANGELOG.md` with sprint 036 release notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (tokens and schemas must exist for store)
- **US1 (Phase 3)**: Depends on Foundational — performance work is independent of other stories
- **US2 (Phase 4)**: Depends on Foundational — design work requires tokens to be available
- **US3 (Phase 5)**: Depends on Foundational — gestures require gestureConfig store
- **US4 (Phase 6)**: Depends on Foundational + partially US3 — settings screen configures gestures from US3
- **US5 (Phase 7)**: Depends on US1 + US2 — components must be split and styled before Storybook docs
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1) — Performance**: Can start after Foundational. No dependencies on other stories.
- **US2 (P1) — Design**: Can start after Foundational. Independent of US1 (different concerns: optimization vs styling).
- **US3 (P2) — Gestures**: Can start after Foundational. Independent of US1/US2 (different files: hooks/gestures/).
- **US4 (P2) — Settings**: Depends on Foundational. Partially depends on US3 (gesture settings reference gesture hooks).
- **US5 (P3) — Maintainability**: Depends on US1 + US2 (Storybook documents components after they're split and styled).

### Within Each User Story

- Audit tasks [P] can run in parallel (different files/areas)
- Splitting tasks must complete before downstream integration
- Verification tasks last within each story

### Parallel Opportunities

- **Phase 1**: T002 + T003 + T004 all [P] — different files
- **Phase 2**: T006 + T007 + T008 all [P] — different files
- **Phase 3 (US1)**: T010–T013 all [P] — independent audit/removal tasks
- **Phase 4 (US2)**: T022–T025 all [P] — different component directories
- **Phase 5 (US3)**: T031–T033 all [P] — independent gesture hooks
- **Phase 6 (US4)**: T039–T042 all [P] — independent settings components
- **Phase 7 (US5)**: T046–T048 all [P] — independent Storybook stories
- **US1 + US2 + US3**: Can all run in parallel after Foundational (different files and concerns)

---

## Implementation Strategy

### MVP First (US1 Only — Performance)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009)
3. Complete Phase 3: US1 Performance (T010-T021)
4. **STOP and VALIDATE**: `npm run size` ≤880KB, Lighthouse ≥95
5. Deploy to main if ready

**MVP Deliverable**: Faster app — reduced bundle, split files, no duplicates, smooth scrolling

### Incremental Delivery

1. Setup + Foundational → Design tokens and preferences store ready
2. US1 (P1) → Performance optimization → **MVP!**
3. US2 (P1) → Minimalist design → Deploy
4. US3 (P2) → Advanced gestures → Deploy
5. US4 (P2) → Settings & personalization → Deploy
6. US5 (P3) → Storybook docs & templates → Deploy
7. Polish → Final validation → Deploy

### Parallel Team Strategy

With 3 developers after Foundational:

```bash
# Developer A: Performance (US1)
T010-T021: Lazy loading audit, duplicate removal, DnD consolidation, file splitting

# Developer B: Design (US2)
T022-T030: Screen simplification, typography/spacing audit, color token migration

# Developer C: Gestures (US3)
T031-T038: Gesture hooks, player/library integration, discovery hints
```

Then sequentially: US4 (settings, needs US3 hooks) → US5 (Storybook, needs US1+US2 done) → Polish

---

## Summary

**Total Tasks**: 63 tasks
- **Setup (Phase 1)**: 4 tasks
- **Foundational (Phase 2)**: 5 tasks
- **US1 Performance (Phase 3)**: 12 tasks
- **US2 Design (Phase 4)**: 9 tasks
- **US3 Gestures (Phase 5)**: 8 tasks
- **US4 Settings (Phase 6)**: 7 tasks
- **US5 Maintainability (Phase 7)**: 6 tasks
- **Polish (Phase 8)**: 12 tasks

**Parallel Opportunities**: 28 tasks marked [P] — can execute in parallel within their phase

**Estimated Effort**: 6-8 sessions (1 phase per session)

**Suggested MVP Scope**: US1 only (Phase 3) — performance optimization. 12 tasks after foundational = 21 tasks total for MVP.
