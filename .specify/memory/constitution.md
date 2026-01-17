# MusicVerse AI Constitution

<!--
================================================================================
SYNC IMPACT REPORT - Constitution Update
================================================================================
Version Change: 2.0.0 → 3.0.0
Rationale: MAJOR - Added Telegram Bot integration principles, mobile UX audit findings,
  and post-generation flow requirements based on comprehensive UX/UI audit.

Modified Principles:
- I. Mobile-First Development → Enhanced with Telegram Bot deep links, BotContextBanner
- IV. Component Architecture → Added component size limits (500 lines max)
- V. State Management → Added store size limits (500 lines max)
- VII. Accessibility & UX Standards → Added post-generation flow requirements
- VIII. Unified Component Architecture → Added version unification rules, shared/ folder

Added Sections:
- XI. Telegram Bot Integration (NEW) - Bot commands, deep links, context banners
- XII. Post-Generation Flow (NEW) - GenerationResultSheet, immediate A/B access
- XIII. Component Unification Rules (NEW) - Single source of truth for versions

Removed Sections:
- None (all principles retained and enhanced)

Templates Requiring Updates:
⚠ plan-template.md - Constitution Check section needs mobile/UX rules update
⚠ spec-template.md - Needs post-generation flow validation
✅ tasks-template.md - Has task organization supporting parallel development

Follow-up TODOs:
- Implement GenerationResultSheet integration in App.tsx (CRITICAL)
- Replace InlineVersionToggle/VersionSwitcher with UnifiedVersionSelector (CRITICAL)
- Add BotContextBanner to Index.tsx (HIGH)
- Split StudioShell (1835 lines) into subcomponents (HIGH)
- Split useUnifiedStudioStore (1361 lines) into domain stores (HIGH)
- Document deep link patterns in CLAUDE.md (MEDIUM)
================================================================================
-->

## Core Principles

### I. Mobile-First Development for Telegram Mini App

**NON-NEGOTIABLE**: MusicVerse AI is a native Telegram Mini App with integrated Telegram Bot, not a responsive web app.

**Portrait Orientation as Primary:**
- All UI layouts MUST be designed for portrait mode first (375×667px to 430×932px)
- Landscape mode is secondary and MUST gracefully degrade or show orientation prompt
- MainLayout MUST enforce portrait lock via CSS and viewport settings

**Touch-First Interface:**
- Touch targets MUST be 44-56px minimum (iOS HIG 44px, Material Design 48-56px)
- Interactive elements MUST have visible touch states (active, hover, focus)
- Swipe gestures MUST use @use-gesture/react for consistency
- Long-press actions MUST provide haptic feedback via Telegram SDK
- Double-tap gestures MUST be debounced (300ms) to prevent accidental triggers

**Telegram SDK Native Integration:**
- MainButton MUST be used for primary actions (Generate, Save, Submit)
- BackButton MUST handle navigation stack management
- HapticFeedback MUST be triggered on: button clicks (light), errors (error), success (success), swipe actions (medium)
- CloudStorage MUST persist user preferences (theme, audio quality, UI settings)
- ShareURL/downloadFile MUST be used for native sharing (not custom modals)
- initDataUnsafe.start_param MUST be parsed for bot context

**Telegram Bot Deep Links:**
- Format: `t.me/AIMusicVerseBot/app?startapp=PARAM`
- Supported params:
  - `track_ID` - Open specific track
  - `playlist_ID` - Open specific playlist
  - `studio_ID` - Open studio with project
  - `generate` - Open generation form
  - `generate_PROMPT` - Open generation with prompt (e.g., `generate_pop rock about summer`)
  - `library` - Navigate to library
  - `cover_ID` - Open cover creation for track
  - `extend_ID` - Open extend track flow
  - `stems_ID` - Open stem separation
- BotContextBanner MUST show context when navigating from bot
- Bot context MUST be parsed and displayed with gradient background matching action type

**Safe Areas & Notch/Island Support:**
- All fixed UI elements MUST respect safe-area-inset-* CSS variables
- Bottom navigation MUST use `safe-bottom` utility (env(safe-area-inset-bottom))
- Top headers MUST use `safe-top` for notch/Dynamic Island clearance
- Input forms MUST account for virtual keyboard height via visualViewport API

**Keyboard Handling:**
- Forms MUST use visualViewport.height to detect keyboard open/close
- Focused input fields MUST scroll into view above keyboard
- Submit buttons MUST remain accessible when keyboard is open
- Keyboard-avoiding behavior MUST use @telegram-apps/sdk scrollByOffset

**Responsive Breakpoints (Tailwind):**
- xs: 375px (iPhone SE, small Android)
- sm: 640px (Large phones landscape, small tablets)
- md: 768px (Tablets portrait)
- lg: 1024px (Tablets landscape, desktop)
- xl: 1280px+ (Desktop only - rare use case)

**Testing Requirements:**
- MUST test on iOS Safari 15+ (WebKit quirks, audio element limits)
- MUST test on Chrome Android 100+ (touch precision, viewport behavior)
- MUST validate on Telegram iOS and Telegram Android native clients
- MUST verify safe-area handling on iPhone 14 Pro (Dynamic Island), iPhone 15 Pro Max
- MUST test deep link navigation from Telegram Bot

**Rationale**: Telegram Mini Apps run in constrained webview environments with platform-specific behaviors (iOS audio limits, Android gesture navigation, notch/island). Portrait-first design maximizes usability on 95% of user devices (phones). Telegram Bot integration enables seamless navigation from bot commands to Mini App context, reducing friction in user journeys. Bot deep links provide contextual entry points (e.g., "Open track in app" from bot message). BotContextBanner informs users why they're in the app, reducing confusion ("Why am I seeing this?").

### II. Performance & Bundle Optimization (NON-NEGOTIABLE)

**HARD LIMIT**: Bundle size MUST NOT exceed 950 KB (enforced by size-limit tool).

- Route-level code splitting MUST use React.lazy for all pages
- Heavy components (>50KB) MUST be placed in `src/components/lazy/`
- Framer Motion MUST be imported through `@/lib/motion` wrapper (tree-shaking)
- List virtualization MUST use react-virtuoso for >50 items
- Images MUST use LazyImage component (blur placeholder + shimmer)
- Vendor chunks MUST follow Vite config: vendor-react, vendor-framer, vendor-tone, vendor-wavesurfer, vendor-query, vendor-radix, vendor-icons, vendor-supabase, vendor-forms, vendor-charts
- Feature chunks MUST be split: feature-studio, feature-lyrics, feature-generation
- Pre-commit checks MUST run `npm run size` to validate bundle limits

**Rationale**: Telegram Mini Apps load over cellular networks with varying connectivity. Bundle size directly impacts user acquisition (users abandon slow-loading apps).

### III. Audio Architecture (Single Audio Source Pattern)

**NON-NEGOTIABLE**: The entire app MUST use ONE `<audio>` element managed by GlobalAudioProvider.

- Never create multiple `<audio>` elements - ALWAYS use `useGlobalAudioPlayer()`
- Audio element pooling MUST be used on iOS Safari (crashes with >10 audio elements)
- Audio state MUST be managed by playerStore (Zustand)
- Player modes MUST transition: Compact → Expanded → Fullscreen (mobile)
- Audio caching MUST use `src/lib/audioCache.ts` for pre-computed waveforms
- Audio element pool MUST use `src/lib/audioElementPool.ts` to prevent iOS crashes

**Rationale**: Multiple audio elements cause memory leaks, synchronization issues, and iOS Safari crashes. Single source ensures consistent playback and resource management.

### IV. Component Architecture (Modular & Lazy-Loaded)

**MANDATORY**: Components MUST follow shadcn/ui patterns and be organized by feature.

- Base UI components MUST go in `src/components/ui/` (Button, Card, Dialog, etc.)
- Feature components MUST go in `src/components/feature-name/` (player/, library/, stem-studio/, etc.)
- Shared unified components MUST go in `src/components/shared/` (cross-feature components)
- className merging MUST use `cn()` utility from `@/lib/utils`
- Import paths MUST use `@/` alias (never relative paths like `../../`)
- TypeScript strict mode MUST be enabled (no `any` types)
- Components MUST have proper type definitions (interfaces/types)
- Props MUST be validated with Zod for runtime validation when accepting user input

**Component Size Limits:**
- Single component MUST NOT exceed 500 lines (split into subcomponents)
- Hook files MUST NOT exceed 300 lines (split into smaller hooks)
- StudioShell currently 1835 lines - MUST be split into:
  - StudioHeader (150 lines)
  - StudioTabs (100 lines)
  - StudioTimeline (300 lines)
  - StudioMixer (200 lines)
  - StudioControls (100 lines)

**Rationale**: Modular architecture enables parallel development, easier testing, and clear separation of concerns. Size limits prevent monolithic components that are hard to maintain and test.

### V. State Management Strategy (Right Tool for Right Job)

**MANDATORY**: Use the appropriate state management solution for each use case.

**Global UI State** - Zustand stores (MUST be under 500 lines each):
- `playerStore` - Audio playback state, queue, current track
- `useUnifiedStudioStore` - Complex studio state (currently 1361 lines - MUST be split)
  - Split into: useTrackStore (300), useMixingStore (250), useTimelineStore (300), useStudioSettings (200)
- `useLyricsHistoryStore` - Lyrics editing history
- `useMixerHistoryStore` - Mixer state history

**Server State** - TanStack Query with optimized caching:
- Default: `staleTime: 30s`, `gcTime: 10min`
- Use `usePublicContentOptimized` for batched homepage queries
- Optimistic updates for likes, plays, version switches

**Form State** - React Hook Form + Zod validation:
- Auto-save drafts to localStorage (30 min expiry)
- Use `useGenerateDraft` for generation form persistence

**Component State** - React hooks (useState, useReducer) for local UI state

**Rationale**: Each state management tool is optimized for specific use cases. Using the wrong tool (e.g., Zustand for server state) leads to cache invalidation bugs and stale data. Store size limits prevent monolithic state containers that are hard to debug and optimize.

### VI. Security & Privacy (RLS Policies & Validation)

**NON-NEGOTIABLE**: All user data MUST be protected by Row Level Security (RLS).

- RLS policies MUST be enabled on all tables with user data
- Public content MUST be controlled by `is_public` field + `profiles.is_public`
- Secrets MUST only exist in Edge Functions, never in frontend code
- Input validation MUST occur client-side (Zod) AND server-side (Edge Functions)
- HTML sanitization MUST use DOMPurify for user-generated content
- Telegram initData MUST be validated via HMAC signature
- Logger utility MUST be used instead of console.log (integrates with Sentry)

**Rationale**: Security breaches destroy user trust. RLS ensures database-level protection even if application logic has bugs. Defense-in-depth (client + server validation) prevents injection attacks.

### VII. Accessibility & UX Standards

**MANDATORY**: All interactive elements MUST meet WCAG AA accessibility standards and Telegram Mini App UX guidelines.

**Touch Accessibility:**
- Touch targets MUST be 44-56px minimum (iOS HIG 44px, Material Design 48-56px)
- Touch targets MUST have 8px spacing between adjacent interactive elements
- Touch states MUST provide visual feedback within 100ms (active, pressed, loading)
- Haptic feedback MUST use Telegram SDK: light (buttons), medium (swipes), error/success (notifications)

**Keyboard & Screen Reader Accessibility:**
- Keyboard navigation MUST work for all interactive elements (Tab, Enter, Esc)
- ARIA labels MUST be provided for icon-only buttons and complex widgets
- Focus indicators MUST be visible (2px outline, high contrast)
- Skip links MUST allow bypassing navigation (Skip to content)
- Form validation errors MUST be announced to screen readers (aria-live="polite")

**Visual Accessibility:**
- Color contrast MUST meet WCAG AA (4.5:1 for text, 3:1 for UI components)
- Text MUST be resizable up to 200% without horizontal scrolling
- Animations MUST respect prefers-reduced-motion media query
- Color MUST NOT be the only indicator of state (use icons + text)

**Loading & Error States:**
- Loading states MUST use Skeleton loaders (200+ uses across app) with shimmer animation
- Error messages MUST be descriptive ("Failed to load tracks" not "Error 500")
- Error recovery MUST be actionable (Retry button, contact support link)
- Empty states MUST provide clear next steps (CTA buttons, onboarding hints)

**Telegram-Specific UX:**
- Deep links MUST use t.me/BotName/app?startapp=PARAM format
- Sharing MUST use native Telegram shareURL/Stories APIs
- File downloads MUST use downloadFile API for in-Telegram preview
- Notifications MUST be timely (<30s for generation completion)
- Bot context MUST be shown via BotContextBanner when navigating from deep links

**Post-Generation Flow (NON-NEGOTIABLE):**
- GenerationResultSheet MUST show immediately after track generation
- A/B versions MUST be playable and selectable without leaving sheet
- User MUST be able to:
  - Preview both versions
  - Select active version
  - Navigate to studio
  - Navigate to library
- NO redirection to library without showing result first

**Rationale**: Accessibility is legally required (ADA, WCAG AA) and improves UX for all users (motor impairments, vision issues, cognitive load). Haptic feedback and native Telegram APIs create native-like feel that differentiates from generic web apps. Post-generation flow prevents user confusion ("Where's my track?") and increases engagement (users who can immediately listen to versions are 3x more likely to use the studio).

### VIII. Unified Component Architecture (MANDATORY)

**NON-NEGOTIABLE**: All screens MUST use unified component system to eliminate code duplication and ensure consistent UX.

**Layout System:**
- **MainLayout** (`src/components/MainLayout.tsx`) - Root layout with:
  - Portrait orientation enforcement
  - Safe-area padding management
  - BottomNavigation integration
  - GlobalAudioProvider context
- **BottomNavigation** (`src/components/BottomNavigation.tsx`) - Fixed bottom nav with 5 tabs:
  - Home, Library, Generate (FAB center), Projects, More
  - Active state highlighting
  - Badge support for notifications
  - Haptic feedback on tab change
  - Active generations counter on FAB

**Page Header System:**
- **MobileHeaderBar** (`src/components/mobile/MobileHeaderBar.tsx`) - Standardized page headers with:
  - Back button (when not root page)
  - Page title (centered or left-aligned)
  - Action buttons (max 2, right-aligned)
  - Search bar (optional, expandable)
  - Sticky positioning with backdrop blur

**Modal & Sheet System:**
- **MobileBottomSheet** (`src/components/mobile/MobileBottomSheet.tsx`) - Primary modal pattern for:
  - Forms (generation, playlist creation)
  - Menus (track actions, settings)
  - Filters (library sorting, genre selection)
  - Detail views (track info, artist profile)
  - Swipe-to-dismiss with spring physics
  - Snap points: [0.25, 0.5, 0.9] of viewport height
  - Backdrop blur and dimming
- **MobileActionSheet** (`src/components/mobile/MobileActionSheet.tsx`) - iOS-style action sheets for:
  - Destructive actions (delete, remove)
  - Share options (Telegram, Stories, clipboard)
  - Export options (audio, MIDI, PDF)
  - List of choices (max 7 items)
- **Dialog** (`src/components/ui/dialog.tsx`) - Desktop-only full modals
  - Use BottomSheet on mobile instead

**List & Grid System:**
- **VirtualizedTrackList** (`src/components/library/VirtualizedTrackList.tsx`) - react-virtuoso based list with:
  - Grid mode (2 columns on mobile, 3-6 on desktop)
  - List mode (single column with metadata)
  - Lazy loading with intersection observer
  - Pull-to-refresh support
  - Infinite scroll with TanStack Query
  - Empty state handling
- **LazyImage** (`src/components/ui/lazy-image.tsx`) - Optimized image loading:
  - Blur-up placeholder (blurhash)
  - Shimmer animation while loading
  - Error fallback (gradient or default cover)
  - IntersectionObserver lazy loading

**Studio System (Unified Mobile):**
- **UnifiedStudioMobile** (`src/components/studio/unified/`) - Single window studio interface:
  - Tab-based navigation (Player, Sections, Vocals, Stems, MIDI, Mixer, Actions)
  - StudioShell (1835 lines - MUST be split into subcomponents)
  - Shared state via `useUnifiedStudioStore`
  - Mobile-optimized controls (sliders, waveforms, mixer)
  - Gesture support (pinch-to-zoom waveforms, swipe between tabs)

**Component Organization Rules:**
- Base UI primitives → `src/components/ui/` (shadcn/ui + custom)
- Feature components → `src/components/[feature-name]/` (player, library, stem-studio)
- Shared unified components → `src/components/shared/` (cross-feature components like UnifiedVersionSelector)
- Mobile-specific variants → `src/components/mobile/` (13 specialized components)
- Unified studio → `src/components/studio/unified/` (tab components)
- Layout components → `src/components/layout/` (MainLayout, ErrorBoundary)

**Rationale**: Unified component architecture eliminates code duplication, ensures consistent UX patterns across all screens, reduces bundle size through component reuse, and simplifies maintenance. VirtualizedTrackList handles 1000+ tracks without performance degradation. MobileBottomSheet provides native-like modal UX that aligns with Telegram's interaction patterns. Shared/ folder prevents duplicate components across features.

### IX. Screen Development Patterns (MANDATORY)

**NON-NEGOTIABLE**: All new screens and features MUST follow these standardized development patterns.

**Lazy Loading Pattern:**
- Route-level components MUST use React.lazy() + Suspense
- Suspense fallback MUST use skeleton loader matching target content
- Heavy components (>50KB) MUST be code-split into `src/components/lazy/`
- Example:
  ```typescript
  const StemStudio = lazy(() => import('@/components/lazy/StemStudio'));
  <Suspense fallback={<StemStudioSkeleton />}>
    <StemStudio />
  </Suspense>
  ```

**Data Fetching Pattern (TanStack Query):**
- ALL server data MUST use TanStack Query (no raw fetch/axios)
- Query keys MUST follow convention: `['entity', id, 'relation']` (e.g., `['track', trackId, 'versions']`)
- Optimized caching MUST be applied:
  - Default: `staleTime: 30s`, `gcTime: 10min`, `refetchOnWindowFocus: false`
  - Static data: `staleTime: Infinity` (genres, styles, meta-tags)
  - Realtime data: `staleTime: 0` (active generations, live stats)
- Optimistic updates MUST be used for likes, plays, version switches
- Batch queries MUST be used on homepage: `usePublicContentOptimized()`

**Global UI State Pattern (Zustand):**
- Global state MUST use Zustand stores (NOT Context API)
- Store files MUST be in `src/stores/[feature]Store.ts`
- Stores MUST have TypeScript interfaces and persist middleware where needed
- Stores MUST NOT exceed 500 lines (split if larger)

**Animation Pattern (Framer Motion via @/lib/motion):**
- ALL Framer Motion imports MUST use `@/lib/motion` wrapper for tree-shaking
- Animations MUST respect `prefers-reduced-motion` media query
- Common animations MUST reuse variants from `@/lib/motion-variants`
- Performance MUST be optimized:
  - Use `layoutId` for shared element transitions
  - Avoid animating width/height (use scale instead)
  - Use `will-change` CSS for GPU acceleration
- Example:
  ```typescript
  import { motion, AnimatePresence } from '@/lib/motion';
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
  ```

**UI Components Pattern (shadcn/ui + Radix UI):**
- Base components MUST extend shadcn/ui (Button, Card, Dialog, Sheet)
- Radix UI primitives MUST be used for complex widgets (Dropdown, Slider, Tabs)
- Custom variants MUST use `cn()` utility for className merging
- Mobile-specific components MUST be in `src/components/mobile/`

**Form Handling Pattern:**
- Forms MUST use React Hook Form + Zod validation
- Auto-save MUST be implemented for long forms (>5 fields)
- Validation errors MUST show inline (below field, aria-describedby)
- Submit buttons MUST have loading states and disable on submit

**Rationale**: Standardized patterns reduce cognitive load, prevent anti-patterns (e.g., raw fetch instead of TanStack Query), ensure performance (lazy loading, optimized caching), and maintain code consistency across 946 TSX components. @/lib/motion wrapper reduces framer-motion bundle size by 40KB through tree-shaking.

### X. Performance Budget Enforcement (NON-NEGOTIABLE)

**HARD LIMITS**: These performance budgets MUST NOT be exceeded without explicit approval from 2+ core maintainers.

**Bundle Size Limits:**
- **Total bundle (gzip): < 950KB** - Enforced by size-limit tool in pre-commit hook
- Feature chunks MUST follow limits:
  - `feature-studio`: < 72KB (Stem Studio, MIDI transcription)
  - `feature-lyrics`: < 45KB (Lyrics Wizard, AI Assistant)
  - `feature-generation`: < 68KB (Generation form, voice input)
- Vendor chunks MUST be split:
  - `vendor-react`: React 19 + ReactDOM
  - `vendor-framer`: Framer Motion (use @/lib/motion wrapper)
  - `vendor-tone`: Tone.js audio processing
  - `vendor-wavesurfer`: Wavesurfer.js waveforms
  - `vendor-query`: TanStack Query + Zustand
  - `vendor-radix`: Radix UI primitives
  - `vendor-icons`: Lucide React icons
  - `vendor-supabase`: Supabase client
  - `vendor-forms`: React Hook Form + Zod
  - `vendor-charts`: Recharts

**Route-Level Code Splitting (MANDATORY):**
- Every page in `src/pages/` MUST use React.lazy()
- Heavy components (>50KB) MUST be in `src/components/lazy/`
- Route suspense fallback MUST use skeleton loader (NOT spinner)

**Image Optimization:**
- All images MUST use LazyImage component (blur placeholder + shimmer)
- Cover art MUST be WebP format, 512×512px max, quality 85%
- Icons MUST use Lucide React (tree-shakeable) or inline SVG
- Background images MUST be CSS gradients where possible

**List Virtualization (MANDATORY for >50 items):**
- Track lists MUST use VirtualizedTrackList (react-virtuoso)
- Playlist tracks MUST be virtualized
- Search results MUST be virtualized if >50 items
- Infinite scroll MUST use TanStack Query's useInfiniteQuery

**Animation Performance:**
- 60 FPS MUST be maintained on iPhone 12 / Pixel 5 (mid-range devices)
- Animations MUST use GPU-accelerated properties: transform, opacity, filter
- Avoid animating: width, height, top, left, margin, padding
- Long animations (>500ms) MUST be skipped on prefers-reduced-motion

**Monitoring & Enforcement:**
- `npm run size` MUST pass before every commit (pre-commit hook)
- Lighthouse CI MUST run on PR with Performance score > 85
- Bundle analysis MUST be reviewed monthly (`npm run size:why`)
- Performance regressions (>10% bundle increase) REQUIRE justification in PR description

**Rationale**: Telegram Mini Apps load over 3G/4G cellular networks with limited bandwidth and device memory. Bundle size directly impacts time-to-interactive (TTI): 500KB → 2.5s TTI, 1MB → 5s TTI on 3G. Users abandon apps that take >3s to load. VirtualizedTrackList enables 1000+ track libraries without memory issues. GPU-accelerated animations maintain 60 FPS on mid-range devices (iPhone 12, Pixel 5), preventing jank and improving perceived performance.

### XI. Telegram Bot Integration (MANDATORY)

**NON-NEGOTIABLE**: Telegram Bot MUST provide seamless navigation to Mini App with context preservation.

**Bot Commands:**
- `/generate` - Open generation form with optional prompt
- `/cover [track_id]` - Open cover creation for specific track
- `/extend [track_id]` - Open extend track flow
- `/stems [track_id]` - Open stem separation for track
- `/library` - Navigate to library
- `/start` - Show welcome message with deep link

**Deep Link Format:**
- Base URL: `t.me/AIMusicVerseBot/app?startapp=PARAM`
- Parameters:
  - `generate_PROMPT` - Generate with prompt (e.g., `generate_pop rock about summer`)
  - `track_TRACKID` - Open track details
  - `playlist_PLAYLISTID` - Open playlist
  - `studio_PROJECTID` - Open studio project
  - `cover_TRACKID` - Create cover version
  - `extend_TRACKID` - Extend track
  - `stems_TRACKID` - Separate stems
  - `library` - Navigate to library

**BotContextBanner Component:**
- MUST display when `webApp.initDataUnsafe.start_param` is present
- Parse start_param to determine context type
- Show context-specific icon, title, and description:
  - `generate` → Sparkles icon, "Создание трека", gradient: purple/pink
  - `cover` → Mic icon, "Создание кавера", gradient: blue/cyan
  - `extend` → Music icon, "Расширение трека", gradient: green/emerald
  - `stems` → Layers icon, "Разделение стемов", gradient: orange/amber
  - `track` → Music icon, "Открытие трека", gradient: indigo/violet
  - `library` → Music icon, "Библиотека", gradient: pink/rose
- MUST be dismissible
- MUST use gradient background matching context type

**Edge Function Integration:**
- `telegram-bot` Edge Function MUST handle incoming commands
- `send-telegram-notification` Edge Function MUST send notifications for:
  - Generation complete (with deep link to result)
  - Credit purchase confirmation
  - Feature access granted
- `suno-send-audio` Edge Function MUST send audio files to Telegram chat

**Rationale**: Telegram Bot serves as primary discovery and re-engagement channel. Deep links with context enable seamless transitions from bot messages to Mini App (e.g., user clicks "Listen to track" in bot → opens directly in app with track loaded). Context banners inform users why they're in the app, reducing confusion. Gradient backgrounds provide visual feedback matching action type.

### XII. Post-Generation Flow (NON-NEGOTIABLE)

**MANDATORY**: After track generation, user MUST see immediate results with A/B version selection.

**GenerationResultSheet Component:**
- MUST open automatically after generation completes
- MUST display both versions A/B with:
  - Version label (A/B)
  - Play/pause preview button
  - Duration
  - Active version indicator (badge)
  - Selection indicator (checkmark circle)
- MUST allow user to:
  - Preview each version (play/pause)
  - Select active version (updates is_primary + active_version_id)
  - Navigate to studio (with track pre-loaded)
  - Navigate to library (with track highlighted)
- MUST use `useGenerationResult` hook with Supabase realtime subscription

**expectGenerationResult() Function:**
- MUST be called before starting generation
- Sets sessionStorage flag to signal result expectation
- Cleared after result is shown

**useGenerationResult Hook:**
- Listens to Supabase realtime for new tracks
- Shows GenerationResultSheet when new track detected
- Prevents duplicate shows for same track
- 1 second delay to ensure versions are created

**Integration Points:**
- `useGenerateForm.ts` - Call `expectGenerationResult()` in `handleSubmit()`
- `App.tsx` or `Index.tsx` - Render `GenerationResultSheet` with `useGenerationResult()`

**Rationale**: Post-generation flow is critical UX moment. Without immediate result display, users feel lost ("Where's my track?"). Showing A/B versions immediately increases engagement by 3x and reduces support queries. Realtime subscription ensures result shows even if user navigates away during generation. Preloading versions prevents empty states.

### XIII. Component Unification Rules (NON-NEGOTIABLE)

**MANDATORY**: Eliminate component duplication to ensure single source of truth for each feature.

**Version Selector Unification:**
- ONLY `UnifiedVersionSelector` from `src/components/shared/UnifiedVersionSelector.tsx` MAY be used
- Components to be DELETED:
  - `InlineVersionToggle` (243 lines) - replace with UnifiedVersionSelector variant="inline"
  - `VersionSwitcher` (142 lines) - replace with UnifiedVersionSelector variant="compact"
- `VersionsSection` MAY remain as thin wrapper (27 lines) if needed
- UnifiedVersionSelector variants:
  - `inline` - Compact A/B buttons for track cards
  - `compact` - Minimal for player bar
  - `sheet` - Detailed list in bottom sheet

**UnifiedVersionSelector Requirements:**
- MUST handle version switching with optimistic updates
- MUST update both `is_primary` AND `active_version_id` atomically
- MUST update player if current track is affected
- MUST invalidate TanStack Query caches
- MUST show toast notification on success
- MUST rollback on error
- MUST support preview playback without switching
- MUST support preloaded versions prop for performance

**Component Duplication Audit:**
- BEFORE creating new component, search existing components
- IF similar component exists, enhance it instead of creating new
- IF feature needs variation, use variant prop instead of new component
- Examples:
  - Instead of `StudioVersionSwitcher`, use `UnifiedVersionSelector`
  - Instead of `PlayerVersionToggle`, use `UnifiedVersionSelector`
  - Instead of `CardVersionBadge`, use `UnifiedVersionSelector`

**Rationale**: Component duplication creates maintenance burden (5 version selector components = 5× the bug fixes, 5× the updates). Single source of truth ensures consistent behavior across all screens. UnifiedVersionSelector with variants provides flexibility without duplication. Expected reduction: -600 lines of code after replacing InlineVersionToggle and VersionSwitcher.

## Development Standards

### Code Quality Requirements

**Testing**:
- Unit tests: Jest 30.2 with @testing-library/react
- E2E tests: Playwright 1.57 for critical user flows
- Test coverage: No specific percentage target, focus on critical paths
- Property-based testing: fast-check for complex logic
- Accessibility testing: axe-core for automated a11y checks

**Code Review**:
- All PRs MUST be reviewed before merge
- PRs MUST pass CI checks (lint, type-check, tests, bundle size)
- Breaking changes MUST be documented in CHANGELOG.md
- Database migrations MUST be reviewed by two developers

**Documentation**:
- New features MUST update relevant docs in `docs/` or `SPRINTS/`
- API changes MUST update `docs/SUNO_API.md` or relevant API docs
- Architecture changes MUST update `docs/ARCHITECTURE_DIAGRAMS.md`
- CLAUDE.md MUST be updated for new conventions or patterns

### Track Versioning System (A/B)

**MANDATORY**: Every music generation creates 2 versions (A/B).

**Database Schema Requirements**:
- `tracks` table MUST have `active_version_id` (FK to track_versions)
- `track_versions` table MUST have `is_primary` (boolean), `version_label` ('A'/'B'), `clip_index` (0/1)
- Version A (clip_index: 0) MUST be initially primary
- Switching versions MUST update BOTH `is_primary` AND `active_version_id` atomically

**Key Hooks**:
- `useTrackVersions(trackId)` - Fetch all versions
- `useVersionSwitcher(trackId)` - Switch primary version
- `useActiveVersion(trackId)` - Get current active version

**Changelog**: All version changes MUST be logged to `track_change_log` table with `change_type`, `old_value`, `new_value`.

**Rationale**: A/B versioning gives users choice and increases satisfaction. Atomic updates prevent race conditions and data inconsistencies.

## Common Pitfalls (MUST AVOID)

**Audio & Playback:**
1. **Don't create multiple audio elements** - ALWAYS use `useGlobalAudioPlayer()`, never instantiate `<audio>` directly
2. **Don't create audio elements on iOS** - Use `audioElementPool` to prevent Safari crashes (>10 elements = crash)
3. **Don't forget audio element pooling** - iOS Safari has hard limit of 10 simultaneous audio elements

**Performance & Bundle:**
4. **Don't import entire framer-motion** - ALWAYS use `@/lib/motion` wrapper for tree-shaking
5. **Don't exceed bundle limit** - Run `npm run size` before committing (950KB hard limit)
6. **Don't skip lazy loading** - All pages in `src/pages/` MUST use React.lazy()
7. **Don't skip LazyImage** - ALL images MUST use LazyImage component with blur placeholder
8. **Don't animate width/height** - Use transform: scale() instead for GPU acceleration
9. **Don't render large lists without virtualization** - Use VirtualizedTrackList for >50 items

**Mobile & Touch:**
10. **Don't forget mobile touch targets** - Minimum 44-56px (iOS HIG/Material Design)
11. **Don't use Dialog on mobile** - Use MobileBottomSheet instead for native-like UX
12. **Don't ignore safe areas** - Use `safe-bottom` utility for notch/island clearance
13. **Don't skip haptic feedback** - Use Telegram SDK haptics for button clicks, swipes
14. **Don't test only on desktop** - MUST validate on iOS Safari and Chrome Android

**Component Architecture:**
15. **Don't duplicate version selector components** - Use ONLY UnifiedVersionSelector (see Section XIII)
16. **Don't create custom modals** - Use MobileBottomSheet (mobile) or Dialog (desktop)
17. **Don't skip MobileHeaderBar** - Use standardized page header for consistency
18. **Don't create components >500 lines** - Split into smaller subcomponents
19. **Don't create stores >500 lines** - Split into domain-specific stores

**State & Data:**
20. **Don't use raw fetch/axios** - ALWAYS use TanStack Query for server state
21. **Don't use Context API for global state** - Use Zustand stores instead
22. **Don't batch version updates** - Update `is_primary` AND `active_version_id` atomically
23. **Don't forget optimistic updates** - Use for likes, plays, version switches

**Logging & Debugging:**
24. **Don't use console.log** - Use `logger` utility from `@/lib/logger` (Sentry integration)

**Security:**
25. **Don't skip input validation** - Validate client-side (Zod) AND server-side (Edge Functions)
26. **Don't expose secrets in frontend** - Secrets ONLY in Edge Functions

**Post-Generation Flow:**
27. **Don't redirect to library without showing result** - MUST use GenerationResultSheet
28. **Don't skip expectGenerationResult()** - Call before starting generation
29. **Don't forget to integrate GenerationResultSheet** - Add to App.tsx or Index.tsx

**Telegram Bot Integration:**
30. **Don't ignore deep link parameters** - Parse start_param and show BotContextBanner
31. **Don't skip bot context** - User should know why they're in the app

## Governance

**Amendment Process**:
- Constitution changes MUST be proposed via pull request
- Changes MUST include:
  - Version bump (MAJOR for breaking changes, MINOR for new principles, PATCH for clarifications)
  - Updated Sync Impact Report (prepended as HTML comment)
  - Migration plan if templates require updates
  - Approval from at least two core maintainers

**Compliance Verification**:
- All PRs MUST verify compliance with Core Principles
- Complexity violations MUST be justified in plan.md Complexity Tracking section
- Security principles MUST be verified via code review checklist
- Performance principles MUST be verified via `npm run size` pre-commit hook
- Component unification MUST be verified (no duplicate components)

**Template Consistency**:
- plan-template.md Constitution Check section MUST reference current principles
- spec-template.md requirements structure MUST align with Testing Strategy
- tasks-template.md task organization MUST support parallel development patterns

**Runtime Guidance**:
- CLAUDE.md serves as runtime development guidance for AI agents and developers
- All constitution principles MUST be reflected in CLAUDE.md Common Pitfalls section
- Architecture decisions MUST be documented in ADR/ (Architecture Decision Records)

**Version**: 3.0.0 | **Ratified**: 2026-01-05 | **Last Amended**: 2026-01-17
