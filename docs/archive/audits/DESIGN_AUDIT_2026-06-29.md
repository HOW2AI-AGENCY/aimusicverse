# Design Audit & Optimization Plan

**Date:** 2026-06-29  
**Project:** MusicVerse AI (Telegram Mini App)  
**Scope:** Design system, responsiveness, mobile UX, accessibility  
**Build status:** OK (918 KB / 950 KB limit)

---

## Executive Summary

MusicVerse AI has a **professionally designed design token system** and strong Telegram SDK integration, but **token adoption is critically low** — only 1% of components use the design tokens. The codebase has accumulated significant design debt: 1,762 spacing violations, 1,155 typography bypasses, and 3 conflicting z-index systems. 69% of components lack responsive breakpoints. Mobile readiness is 7.5/10 — the foundation is solid but gaps exist in touch targets, image optimization, and safe area consistency.

### Composite Score: 5.8 / 10

| Area                      | Score  | Key Metric                                       |
| ------------------------- | ------ | ------------------------------------------------ |
| Design Token Adoption     | 1/10   | 11/1113 files use tokens                         |
| Responsive Design         | 4/10   | 69% of components have zero breakpoints          |
| Mobile UX (Telegram)      | 7.5/10 | Excellent SDK integration, gaps in details       |
| UX Patterns & Flows       | 6.5/10 | Good skeleton/loading system, missing onboarding |
| Design System Consistency | 4.2/10 | 3000+ token violations across the codebase       |
| Typography                | 4/10   | 1,155 arbitrary text sizes                       |
| Spacing                   | 3/10   | 1,762 arbitrary values (47% of files)            |
| Color                     | 6/10   | ~293 hard-coded colors in 81 files               |
| Z-index                   | 2/10   | 3 conflicting systems, 297 hard-coded values     |
| Buttons & Icons           | 8/10   | Well-centralized, minimal violations             |
| Border Radius             | 9/10   | Only 8 violations                                |
| Touch Targets             | 8/10   | Good base, specific violations in key pages      |
| Safe Areas                | 8/10   | Good infrastructure, inconsistent usage          |
| Viewport & Keyboard       | 9/10   | Excellent handling                               |
| Image Optimization        | 6/10   | 32 raw `<img>` bypassing LazyImage               |

---

## Part 1: Critical Issues (Fix First)

### 1.1 Three Conflicting Z-index Systems

**Severity: CRITICAL**

Three independent z-index definitions exist with **different values for the same layers**:

| Layer  | CSS vars (`index.css`) | TS constants (`z-index.ts`) | Design tokens (`design-tokens.ts`) |
| ------ | ---------------------- | --------------------------- | ---------------------------------- |
| Dialog | `--z-dialog: 140`      | `dialog: 160`               | `dialog: 80`                       |
| Player | `--z-player: 60`       | `player: 50`                | `player: 60`                       |
| Toast  | `--z-toast: 300`       | `notification: 500`         | `toast: 300`                       |

**Impact:** 297 hard-coded `z-[N]` values across 161 files. Overlapping modals, toasts hidden behind sheets, player controls disappearing behind overlays.

**Fix:** Consolidate into one source of truth (CSS variables in `index.css`), delete `z-index.ts` and design-tokens z-index, add semantic Tailwind z-index classes.

### 1.2 Duplicate useMediaQuery Hooks

**Severity: HIGH**

Two competing implementations:

- `src/hooks/useMediaQuery.ts` (camelCase) — uses deprecated `window.resize` event. Imported in 9 files including `MainLayout.tsx`
- `src/hooks/use-media-query.ts` (kebab-case) — uses correct `MediaQueryList.addEventListener('change')`, SSR-safe. Imported in 81+ files via `use-mobile.tsx`

**Impact:** Results can diverge during fast resizes. `MainLayout.tsx` uses the inferior version.

**Fix:** Delete `useMediaQuery.ts`, migrate 9 imports to `use-media-query.ts`.

### 1.3 Mobile Threshold Mismatch

**Severity: HIGH**

- `design-tokens.ts` defines mobile as `< 768px` (md breakpoint)
- `useIsMobile()` defines mobile as `< 640px` (max-width: 639px, sm breakpoint)

**Impact:** A 700px tablet renders "mobile" UI via tokens but "desktop" UI via the hook, or vice versa.

**Fix:** Align all mobile detection to a single breakpoint (recommend 768px = md, matching Tailwind convention).

### 1.4 No Offline / Network Error Detection

**Severity: HIGH**

Failed API requests show generic "Something went wrong" toast with no context about connectivity. No offline banner, no retry-when-online logic.

**Fix:** Add `useOnlineStatus()` hook + persistent "You're offline" banner + auto-retry queue.

### 1.5 Raw API Errors Exposed to Users

**Severity: HIGH**

`src/hooks/useGenerateTrack.ts` passes unsanitized Suno API error strings to the UI. RLS policy violation messages from Supabase leak in some service files.

**Fix:** Route all API errors through `src/lib/errorMessages.ts` with a user-friendly mapping.

---

## Part 2: Design System Debt

### 2.1 Spacing Violations — 1,762 instances in 521 files (47%)

Components use arbitrary values like `p-[15px]`, `mt-[22px]`, `h-[180px]` instead of the 8px grid defined in design tokens.

**Top offenders:**

| File                                                                     | Violations |
| ------------------------------------------------------------------------ | ---------- |
| `src/pages/admin/GenerationMetrics.tsx`                                  | 20         |
| `src/pages/ProfilePage.tsx`                                              | 15         |
| `src/pages/LyricsStudio.tsx`                                             | 12         |
| `src/components/admin/RevenueAnalytics.tsx`                              | 11         |
| `src/components/lyrics-workspace/ai-agent/messages/EnhancedMessages.tsx` | 11         |

### 2.2 Typography Violations — 1,155 instances in 363 files (33%)

Hard-coded `text-[10px]`, `text-[11px]`, `text-[13px]` instead of the typography scale (`text-caption`, `text-body`, `text-heading-1`, etc.).

**Top offenders:**

| File                                              | Violations |
| ------------------------------------------------- | ---------- |
| `src/components/admin/GenerationStatsPanel.tsx`   | 17         |
| `src/components/admin/EnhancedAnalyticsPanel.tsx` | 15         |
| `src/components/admin/RevenueAnalytics.tsx`       | 15         |
| `src/pages/admin/GenerationMetrics.tsx`           | 14         |
| `src/pages/ProfilePage.tsx`                       | 14         |

### 2.3 Color Violations — ~293 instances in 81 files (7%)

Hard-coded hex, rgb(), rgba(), hsl() values that bypass the CSS variable system.

**Top offenders:**

| File                                                     | Type | Count |
| -------------------------------------------------------- | ---- | ----- |
| `src/components/stem-studio/UnifiedWaveformTimeline.tsx` | hsl  | 24    |
| `src/components/waveform/UnifiedWaveform.tsx`            | hsl  | 18    |
| `src/components/ui/hardware/LEDIndicator.tsx`            | rgba | 17    |
| `src/components/ui/hardware/HardwareSwitch.tsx`          | rgba | 12    |
| `src/components/admin/BotMenuPreview.tsx`                | hex  | 12    |

### 2.4 Shadow / Elevation — Almost Unused

The 5-level elevation system (`elevation-0` through `elevation-5`) is used in only **1 component** (`RefinedCard.tsx`). Instead, 232 files use raw Tailwind shadows (`shadow-sm`, `shadow-md`, `shadow-lg`) with no consistent hierarchy. 67 instances of hard-coded box-shadow values.

### 2.5 Animation Timing — Not Semantic

Design tokens define `--duration-fast: 100ms`, `--duration-normal: 200ms`, etc. Only **1 component** references these tokens. 243 occurrences use raw `duration-200`, `duration-300`, making system-wide timing adjustments impossible.

---

## Part 3: Responsive Design Issues

### 3.1 Breakpoint Adoption

| Breakpoint         | Files using it | % of 1,061 TSX files |
| ------------------ | -------------- | -------------------- |
| `xs:` (375px)      | 33             | 3.1%                 |
| `sm:` (640px)      | 287            | 27.0%                |
| `md:` (768px)      | 111            | 10.5%                |
| `lg:` (1024px)     | 123            | 11.6%                |
| `xl:` (1280px)     | 29             | 2.7%                 |
| `2xl:` (1536px)    | 2              | 0.2%                 |
| **Any breakpoint** | **331**        | **31.2%**            |
| **No breakpoint**  | **730**        | **68.8%**            |

### 3.2 Critical Pages Without Responsive Adaptation

| Page                                         | Lines | Severity                            |
| -------------------------------------------- | ----- | ----------------------------------- |
| `src/pages/studio-v2/UnifiedStudioPage.tsx`  | large | HIGH — main editing interface       |
| `src/pages/ProjectDetail.tsx`                | 830   | HIGH — large page, zero breakpoints |
| `src/pages/LyricsStudio.tsx`                 | 1,092 | HIGH — hard-coded `w-[400px]` panel |
| `src/pages/payments/MobilePaymentScreen.tsx` | —     | MEDIUM — no tablet fallback         |

### 3.3 Large Components Without Responsive Patterns

| Component                                    | Lines | Issue                                                     |
| -------------------------------------------- | ----- | --------------------------------------------------------- |
| `player/MobileFullscreenPlayer.tsx`          | 849   | No breakpoints, identical on 320px phone and 768px tablet |
| `studio/unified/SectionNotesPanel.tsx`       | 882   | No responsiveness at all                                  |
| `generate-form/LyricsVisualEditor.tsx`       | 777   | Large editor, no responsive adaptation                    |
| `gamification/UnifiedRewardNotification.tsx` | 708   | No breakpoints for notifications                          |
| `analysis/InteractivePianoRoll.tsx`          | 620   | Complex visual — no responsive scaling                    |
| `studio/unified/PianoRoll.tsx`               | 605   | Fixed sizes                                               |
| `tab-editor/GuitarTabEditor.tsx`             | 543   | No responsive behavior                                    |
| `onboarding/ProfileSetupOnboarding.tsx`      | 498   | Shown to ALL users, no adaptation                         |
| `player/QueueSheet.tsx`                      | 420   | No responsive sizing                                      |
| `payments/SubscriptionManagement.tsx`        | 415   | Payment page — no responsive layout                       |

### 3.4 ResponsiveGrid Underutilization

A well-built `ResponsiveGrid` component exists at `src/components/common/ResponsiveGrid.tsx` with presets for tracks, projects, users, stats. Used in only **1 component** (`TracksGridSection`). Many other grid layouts manually define responsive columns.

---

## Part 4: UX Issues

### 4.1 HIGH Priority

| #   | Issue                                            | Location                        |
| --- | ------------------------------------------------ | ------------------------------- |
| 1   | No guided tour / feature discovery for new users | App-wide                        |
| 2   | No offline detection or "You're offline" banner  | App-wide                        |
| 3   | Raw Suno API errors exposed to users             | `src/hooks/useGenerateTrack.ts` |
| 4   | Projects page — blank screen when no projects    | `src/pages/ProjectsPage.tsx`    |

### 4.2 MEDIUM Priority

| #   | Issue                                               | Location                             |
| --- | --------------------------------------------------- | ------------------------------------ |
| 1   | No step indicator in multi-step generate form       | `GenerateFormContainer.tsx`          |
| 2   | Pull-to-refresh missing on Home page                | `src/pages/HomePage.tsx`             |
| 3   | Scroll restoration conflicts with react-virtuoso    | `useScrollRestoration.ts`            |
| 4   | Unified Studio lacks progressive loading            | `UnifiedStudioPage.tsx`              |
| 5   | No haptics on mixer sliders                         | `MixerSlider.tsx`                    |
| 6   | No haptic warning on destructive confirmations      | Various delete dialogs               |
| 7   | Swipeable track items missing on Community feed     | `CommunityTrackCard.tsx`             |
| 8   | Fullscreen player lacks drag handle affordance      | `MobileFullscreenPlayer.tsx`         |
| 9   | ErrorBoundary fallback has no "Go Home" option      | `ErrorBoundaryFallback.tsx`          |
| 10  | Edge function calls lack timeout handling           | `stem.service.ts`, `midi.service.ts` |
| 11  | Notification list lacks empty state                 | `NotificationList.tsx`               |
| 12  | No taste preferences in onboarding                  | `src/components/onboarding/`         |
| 13  | No first-track CTA after onboarding                 | `HomePage.tsx`                       |
| 14  | Generation progress is polling-based, not real-time | `useGenerationProgress.ts`           |

### 4.3 LOW Priority

| #   | Issue                                                     |
| --- | --------------------------------------------------------- |
| 1   | Bottom nav active state incorrect on nested routes        |
| 2   | No swipe-to-go-back gesture on detail pages               |
| 3   | Draft restore notification too subtle (small toast)       |
| 4   | "Inspire Me" button has no loading state                  |
| 5   | Infinite scroll "loading more" uses spinner, not skeleton |
| 6   | No haptics on toggle switches (solo/mute, public/private) |
| 7   | WelcomeScreen uses static images, not animated            |
| 8   | Copy link action has no button-level visual feedback      |

---

## Part 5: Mobile / Telegram Specific Issues

### 5.1 Touch Targets Below 44px

| Component                      | Size                       | Required |
| ------------------------------ | -------------------------- | -------- |
| `ProjectDetail.tsx` buttons    | `h-7` (28px), `h-8` (32px) | 44px     |
| `Library.tsx` icon buttons     | `h-8 w-8` (32px)           | 44px     |
| `LyricsStudio.tsx` back button | `h-8 w-8` (32px)           | 44px     |
| `Tabs` component               | `min-h-[36px]`             | 44px     |
| `Slider` thumb                 | `h-5 w-5` (20px)           | 44px     |

### 5.2 Raw `<img>` Tags (32 files bypass LazyImage)

Key offenders:

- `src/pages/ProjectDetail.tsx` (2 raw img)
- `src/pages/PublicProfilePage.tsx` (3 raw img)
- `src/pages/AlbumView.tsx` (4 raw img)
- `src/components/home/RecentTracksSection.tsx`
- `src/components/track-detail/sections/TrackCoverSection.tsx`
- `src/components/blog/BlogPostCard.tsx`
- 26 more files

### 5.3 Pages Outside MainLayout Missing Safe Areas

`PaymentSuccess.tsx`, `PaymentFail.tsx`, `ErrorPage.tsx`, `NotFound.tsx` have no safe area handling. Studio-v2 pages delegate to shell components but the pages themselves have no explicit safe area handling.

### 5.4 Inconsistent Safe Area Approach

Four different approaches coexist: inline `calc()` strings, `SAFE_STYLES` constants, `safeAreaClasses` CSS classes, layout wrapper inheritance. `SAFE_AREA_CLASSES` referenced in constants file may not have corresponding CSS definitions.

---

## Part 6: Bundle & Performance

### 6.1 Current Bundle (918 KB / 950 KB limit — 96.6% used)

**Largest chunks:**

| Chunk                  | Size   | Notes                                   |
| ---------------------- | ------ | --------------------------------------- |
| `feature-admin-studio` | 2.0 MB | Admin + Studio combined — should split  |
| `vendor-osmd`          | 1.2 MB | OpenSheetMusicDisplay — lazy load only  |
| `vendor-other`         | 1.0 MB | Catch-all — needs investigation         |
| `vendor-charts`        | 481 KB | Recharts — used only on admin/analytics |
| `vendor-tone`          | 256 KB | Tone.js — load on studio entry          |
| `vendor-react`         | 245 KB | Core — cannot reduce                    |
| `index` (main)         | 238 KB | App shell — should target < 200 KB      |

### 6.2 Performance Concerns

- `will-change` used in 30+ CSS rules — excessive on low-end mobile
- No `content-visibility: auto` usage for below-fold optimization
- Only 6 components use `react-virtuoso` despite many list-heavy screens
- 33 files > 500 lines — slower parsing on low-end devices
- Two DnD libraries loaded — `-50 KB` potential savings (noted in Sprint 037)

---

## Optimization Plan

### Phase 1: Critical Fixes (Week 1-2)

**Goal: Eliminate runtime bugs and conflicting systems**

| #   | Task                                                    | Impact                         | Effort |
| --- | ------------------------------------------------------- | ------------------------------ | ------ |
| 1.1 | Consolidate z-index into single CSS var system          | Fixes overlay stacking bugs    | M      |
| 1.2 | Delete duplicate `useMediaQuery.ts`, migrate 9 imports  | Fixes responsive inconsistency | S      |
| 1.3 | Align mobile threshold to 768px everywhere              | Fixes mobile/desktop detection | S      |
| 1.4 | Add offline detection + persistent banner + retry queue | Fixes UX on poor connections   | M      |
| 1.5 | Route all API errors through errorMessages.ts           | Prevents raw error exposure    | S      |
| 1.6 | Add empty states to Projects, Notifications             | Fixes blank screen UX          | S      |

### Phase 2: Touch & Mobile Polish (Week 2-3)

**Goal: Bring touch targets and mobile UX to production quality**

| #   | Task                                                                    | Impact                                 | Effort |
| --- | ----------------------------------------------------------------------- | -------------------------------------- | ------ |
| 2.1 | Fix touch targets < 44px (ProjectDetail, Library, Lyrics, Tabs, Slider) | Touch usability                        | S      |
| 2.2 | Replace 32 raw `<img>` with LazyImage                                   | Mobile loading perf + UX               | M      |
| 2.3 | Add safe area handling to pages outside MainLayout                      | Fixes notch/island on payments, errors | S      |
| 2.4 | Add drag handle to MobileFullscreenPlayer                               | Gesture affordance                     | S      |
| 2.5 | Extend haptic feedback to sliders, toggles, destructive actions         | Touch feedback completeness            | S      |
| 2.6 | Add step indicator to generate form wizard                              | Form UX clarity                        | S      |
| 2.7 | Add pull-to-refresh to Home page                                        | Expected mobile behavior               | S      |

### Phase 3: Design System Enforcement (Week 3-5)

**Goal: Reduce design debt from 3,000+ violations to < 500**

| #   | Task                                                      | Impact                      | Effort |
| --- | --------------------------------------------------------- | --------------------------- | ------ |
| 3.1 | Add ESLint rule for arbitrary Tailwind spacing values     | Prevents new violations     | M      |
| 3.2 | Migrate admin pages (worst offenders) to design tokens    | 200+ violations eliminated  | L      |
| 3.3 | Replace hard-coded typography with scale classes          | 1,155 violations targeted   | L      |
| 3.4 | Replace hard-coded colors in hardware/waveform components | 293 violations targeted     | M      |
| 3.5 | Migrate shadows to elevation system                       | Consistent visual hierarchy | M      |
| 3.6 | Migrate animation durations to semantic tokens            | System-wide timing control  | S      |
| 3.7 | Standardize safe area approach to one pattern             | Consistent mobile behavior  | S      |

### Phase 4: Responsive Redesign (Week 5-8)

**Goal: Bring responsive coverage from 31% to 60%+**

| #   | Task                                                        | Impact                                | Effort |
| --- | ----------------------------------------------------------- | ------------------------------------- | ------ |
| 4.1 | Add responsive breakpoints to UnifiedStudioPage             | Core feature on all devices           | L      |
| 4.2 | Fix LyricsStudio `w-[400px]` → responsive layout            | Broken on narrow screens              | M      |
| 4.3 | Add tablet adaptation to MobileFullscreenPlayer             | 849-line component, used by all users | M      |
| 4.4 | Make ProjectDetail responsive (830 lines, zero breakpoints) | Key page                              | M      |
| 4.5 | Add breakpoints to ProfileSetupOnboarding                   | First thing every user sees           | S      |
| 4.6 | Adopt ResponsiveGrid in 10+ grid layouts                    | Consistent grid behavior              | M      |
| 4.7 | Make SubscriptionManagement responsive                      | Payment flow — critical path          | S      |
| 4.8 | Add responsive behavior to PianoRoll, GuitarTabEditor       | Studio features on tablets            | L      |

### Phase 5: UX Enhancements (Week 8-12)

**Goal: Improve onboarding, discovery, and advanced interactions**

| #   | Task                                                         | Impact                       | Effort |
| --- | ------------------------------------------------------------ | ---------------------------- | ------ |
| 5.1 | Implement lightweight feature discovery (coach marks)        | New user retention           | L      |
| 5.2 | Add taste/genre preferences to onboarding                    | Personalized feed from day 1 | M      |
| 5.3 | Add "Create your first track" CTA on Home page for new users | Activation funnel            | S      |
| 5.4 | Add progressive loading to Unified Studio                    | Perceived performance        | M      |
| 5.5 | Fix scroll restoration with react-virtuoso                   | Smooth back navigation       | M      |
| 5.6 | Add swipeable actions to Community feed cards                | Interaction consistency      | S      |
| 5.7 | Upgrade generation progress to WebSocket/Realtime            | Real-time feedback           | L      |
| 5.8 | Add "Go Home" option to ErrorBoundary fallback               | Error recovery UX            | S      |
| 5.9 | Add timeout handling to Edge Function calls                  | Prevents infinite loading    | M      |

### Phase 6: Performance & Bundle (Week 10-14)

**Goal: Reduce initial bundle, improve runtime on low-end devices**

| #   | Task                                                     | Impact                      | Effort |
| --- | -------------------------------------------------------- | --------------------------- | ------ |
| 6.1 | Split feature-admin-studio (2.0 MB) into separate chunks | Admin + Studio independence | M      |
| 6.2 | Lazy load vendor-osmd (1.2 MB) only on sheet music view  | -1.2 MB from initial paths  | S      |
| 6.3 | Audit vendor-other (1.0 MB) catch-all chunk              | Identify lazy-loadable deps | M      |
| 6.4 | Choose one DnD library (-50 KB)                          | Bundle reduction            | M      |
| 6.5 | Add content-visibility: auto for below-fold sections     | Paint performance           | S      |
| 6.6 | Audit will-change usage, reduce to animation-only        | Memory on low-end devices   | S      |
| 6.7 | Extend virtualization to 10+ list components             | Scroll performance          | M      |

---

## Target Metrics After Optimization

| Metric                  | Current      | Target     | Timeline          |
| ----------------------- | ------------ | ---------- | ----------------- |
| Design System Score     | 4.2/10       | 7.5/10     | Phase 3 (Week 5)  |
| Responsive Coverage     | 31%          | 60%        | Phase 4 (Week 8)  |
| Mobile Readiness        | 7.5/10       | 9/10       | Phase 2 (Week 3)  |
| UX Score                | 6.5/10       | 8.5/10     | Phase 5 (Week 12) |
| Bundle (main)           | 238 KB       | < 200 KB   | Phase 6 (Week 14) |
| Spacing Violations      | 1,762        | < 300      | Phase 3 (Week 5)  |
| Typography Violations   | 1,155        | < 200      | Phase 3 (Week 5)  |
| Z-index Systems         | 3            | 1          | Phase 1 (Week 1)  |
| Touch Target Violations | 5 components | 0          | Phase 2 (Week 2)  |
| Raw `<img>` Tags        | 32 files     | 0          | Phase 2 (Week 3)  |
| **Composite Score**     | **5.8/10**   | **8.4/10** | **Week 14**       |

---

## Quick Wins (Can Do Today)

1. Delete `src/hooks/useMediaQuery.ts` and migrate 9 imports to `use-media-query.ts`
2. Add empty state to `ProjectsPage.tsx` and `NotificationList.tsx`
3. Add `min-h-touch` to Tabs component and increase Slider thumb to 44px
4. Add drag handle indicator to `MobileFullscreenPlayer.tsx`
5. Add pull-to-refresh wrapper to `HomePage.tsx`
6. Add "Go Home" button to `ErrorBoundaryFallback.tsx`
7. Add step indicator to `GenerateFormContainer.tsx`

---

_Generated by design audit on 2026-06-29. Aligns with Architecture Audit score 6.1/10 → target 8.4/10._
