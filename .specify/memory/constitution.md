# MusicVerse AI Constitution

<!--
================================================================================
SYNC IMPACT REPORT - Constitution Update
================================================================================
Version Change: 0.0.0 → 1.0.0
Rationale: MAJOR - Initial constitution ratification for MusicVerse AI project

Modified Principles:
- N/A (Initial version)

Added Sections:
- I. Mobile-First Development (Telegram Mini App focus)
- II. Performance & Bundle Optimization (950 KB limit enforcement)
- III. Audio Architecture (Single audio source pattern)
- IV. Component Architecture (Modular, lazy-loaded components)
- V. State Management Strategy (Right tool for right job)
- VI. Security & Privacy (RLS policies, Telegram validation)
- VII. Accessibility & UX Standards (44×44px touch targets)

Removed Sections:
- N/A (Initial version)

Templates Requiring Updates:
✅ plan-template.md - Constitution Check section aligns
✅ spec-template.md - Requirements structure aligns
✅ tasks-template.md - Task organization aligns

Follow-up TODOs:
- None - All placeholders filled based on CLAUDE.md documentation
================================================================================
-->

## Core Principles

### I. Mobile-First Development (Telegram Mini App)

**NON-NEGOTIABLE**: MusicVerse AI is a native Telegram Mini App, not a web app with Telegram login.

- All features MUST support mobile viewports (375px minimum width)
- Touch targets MUST be minimum 44×44px (iOS HIG standard)
- Gestures (swipe, long-press, pull-to-refresh) MUST use @use-gesture/react
- Safe areas MUST be respected using `safe-bottom` spacing for notch/island
- Keyboard handling MUST use visualViewport API for height tracking
- All UI components MUST be tested on iOS Safari and Chrome Android
- Responsive breakpoints MUST follow Tailwind config: xs(375px), sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)

**Rationale**: Telegram Mini Apps have specific constraints (viewport, gestures, safe areas) that differ from standard web apps. Mobile-first ensures optimal UX for primary platform.

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
- Player modes MUST transition: Compact → Expanded → Fullscreen
- Audio caching MUST use `src/lib/audioCache.ts` for pre-computed waveforms
- Audio element pool MUST use `src/lib/audioElementPool.ts` to prevent iOS crashes

**Rationale**: Multiple audio elements cause memory leaks, synchronization issues, and iOS Safari crashes. Single source ensures consistent playback and resource management.

### IV. Component Architecture (Modular & Lazy-Loaded)

**MANDATORY**: Components MUST follow shadcn/ui patterns and be organized by feature.

- Base UI components MUST go in `src/components/ui/` (Button, Card, Dialog, etc.)
- Feature components MUST go in `src/components/feature-name/` (player/, library/, stem-studio/, etc.)
- className merging MUST use `cn()` utility from `@/lib/utils`
- Import paths MUST use `@/` alias (never relative paths like `../../`)
- TypeScript strict mode MUST be enabled (no `any` types)
- Components MUST have proper type definitions (interfaces/types)
- Props MUST be validated with Zod for runtime validation when accepting user input

**Rationale**: Modular architecture enables parallel development, easier testing, and clear separation of concerns. Consistent patterns reduce cognitive load.

### V. State Management Strategy (Right Tool for Right Job)

**MANDATORY**: Use the appropriate state management solution for each use case.

**Global UI State** - Zustand stores:
- `playerStore` - Audio playback state, queue, current track
- `useUnifiedStudioStore` - Complex studio state (38KB, largest store)
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

**Rationale**: Each state management tool is optimized for specific use cases. Using the wrong tool (e.g., Zustand for server state) leads to cache invalidation bugs and stale data.

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

**MANDATORY**: All interactive elements MUST meet WCAG AA accessibility standards.

- Touch targets MUST be minimum 44×44px (iOS HIG) to 56px (Material Design)
- Keyboard navigation MUST work for all interactive elements
- ARIA labels MUST be provided for screen readers
- Color contrast MUST meet WCAG AA compliance (4.5:1 for text)
- Focus indicators MUST be visible for keyboard navigation
- Error messages MUST be descriptive and actionable
- Loading states MUST use Skeleton loaders (200+ uses across app)

**Rationale**: Accessibility is not optional. Users with disabilities, motor impairments, or using assistive technology must have equal access. Good accessibility improves UX for all users.

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

1. **Don't create multiple audio elements** - Use `useGlobalAudioPlayer()`
2. **Don't import entire framer-motion** - Use `@/lib/motion` for tree-shaking
3. **Don't forget mobile touch targets** - Minimum 44×44px
4. **Don't use console.log** - Use `logger` utility from `@/lib/logger`
5. **Don't skip LazyImage** - All images MUST lazy load with blur placeholder
6. **Don't batch version updates** - Update `is_primary` AND `active_version_id` together
7. **Don't exceed bundle limit** - Monitor with `npm run size` before committing
8. **Don't create audio elements on iOS** - Use `audioElementPool` to prevent crashes

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

**Template Consistency**:
- plan-template.md Constitution Check section MUST reference current principles
- spec-template.md requirements structure MUST align with Testing Strategy
- tasks-template.md task organization MUST support parallel development patterns

**Runtime Guidance**:
- CLAUDE.md serves as runtime development guidance for AI agents and developers
- All constitution principles MUST be reflected in CLAUDE.md Common Pitfalls section
- Architecture decisions MUST be documented in ADR/ (Architecture Decision Records)

**Version**: 1.0.0 | **Ratified**: 2026-01-05 | **Last Amended**: 2026-01-05
