# Known Issues Tracker

Last updated: 2026-01-07 (Studio Optimization Session)

## Status Overview

| Priority | Total | Resolved | Remaining |
|----------|-------|----------|-----------|
| P1 - Critical | 8 | 8 | 0 |
| P2 - High | 12 | 12 | 0 |
| P3 - Medium | 6 | 6 | 0 |
| P4 - Low | 2 | 2 | 0 |

## ✅ Resolved Issues

### P1 - Critical (All Resolved)

~~**IMP009** - Missing audio error boundaries~~ ✅ RESOLVED
- Implemented `src/components/studio/AudioErrorBoundary.tsx`

~~**IMP010** - Lyrics wizard validation~~ ✅ RESOLVED  
- Validation warnings already implemented in `lyricsWizardStore.ts`

~~**IMP011** - Export fallback~~ ✅ RESOLVED
- Progressive fallback in `useMixExport.ts`

~~**IMP012** - Stem loading timeouts~~ ✅ RESOLVED
- Timeout handling in stem loading hooks

~~**IMP013** - Offline graceful degradation~~ ✅ RESOLVED
- `useOfflineStatus` hook with `OfflineIndicator` component

~~**IMP014** - Type guards for section tags~~ ✅ RESOLVED
- Added `isValidBracketTag`, `sanitizeTag` in `LyricsFormatter.ts`

~~**IMP015** - AudioContext state checks~~ ✅ RESOLVED
- `ensureAudioContext` in `useStemStudioEngine.ts`

~~**IMP016** - Memory leak cleanup~~ ✅ RESOLVED
- Added `removeStemEngine` for proper cleanup

~~**IMP017** - Bundle optimization~~ ✅ RESOLVED
- Centralized motion/date imports via `@/lib/motion` and `@/lib/date-utils`

~~**IMP018** - Mobile audio limiter~~ ✅ RESOLVED
- `useMobileAudioFallback` limits to 6 elements on mobile

~~**IMP019** - Audio error boundary~~ ✅ RESOLVED
- See IMP009

### P2 - High Priority (All Resolved)

~~**IMP027** - State machine for Lyrics Wizard~~ ✅ RESOLVED
- Implemented in `src/lib/stateMachine.ts` with `useStateMachine` hook
- Bridge hook at `src/hooks/useLyricsWizardMachine.ts`
- ADR documented at `ADR/ADR-005-State-Machine-Architecture.md`

~~**IMP033** - Audio buffer pooling~~ ✅ RESOLVED
- Implemented `src/lib/audio/bufferPool.ts` with LRU eviction and TTL

~~**IMP034** - Waveform Web Worker~~ ✅ RESOLVED
- Fixed `public/waveform-worker.js` (removed TypeScript syntax)
- Hook ready at `src/hooks/studio/useWaveformWorker.ts`

~~**IMP039-IMP044** - Error handling standardization~~ ✅ RESOLVED
- Standardized error handling in klangio edge function using response codes

~~**IMP057-IMP059** - React optimizations~~ ✅ RESOLVED
- `StemChannel`, `TrackCard`, `SectionEditorPanel` all use React.memo

### P3 - TypeScript & Architecture (5/6 Resolved)

~~**IMP051** - Branded types~~ ✅ RESOLVED
- Created `src/types/branded.ts` with TrackId, UserId, StemId, etc.
- Full JSDoc documentation added

~~**IMP052** - Audio context helper~~ ✅ RESOLVED
- Created `src/lib/audio/audioContextHelper.ts` for type-safe webkit fallback
- Migrated all audio components to use the helper
- ADR documented at `ADR/ADR-006-Type-Safe-Audio-Context.md`

~~**IMP053** - lamejs types~~ ✅ RESOLVED
- Created `src/types/lamejs.d.ts`

~~**IMP054-IMP056** - Audio-related type safety~~ ✅ RESOLVED
- All AudioContext `as any` casts eliminated via `audioContextHelper`
- Migrated: `sound-effects.ts`, `ProfessionalWaveformTimeline.tsx`, `WaveformWithChords.tsx`

**IMP045-IMP050** - Directory restructure
- **Issue**: Hooks and components could be better organized
- **Fix**: Create focused subdirectories as codebase grows
- **Priority**: P3 - Organization
- **Note**: Current structure is functional, refactor as needed

### P4 - Documentation (All Resolved)

~~**IMP073** - JSDoc coverage~~ ✅ RESOLVED
- Added JSDoc to key public APIs:
  - `src/types/branded.ts` - Full module and function documentation
  - `src/hooks/studio/useWaveformWorker.ts` - Usage examples and type docs
  - `src/lib/audio/bufferPool.ts` - Already documented
  - `src/lib/audio/audioContextHelper.ts` - Already documented
  - `src/lib/stateMachine.ts` - Already documented

~~**IMP085** - Architecture Decision Records~~ ✅ RESOLVED
- Core decisions documented in `/ADR` directory:
  - ADR-001: Technology Stack Choice
  - ADR-002: Frontend Architecture
  - ADR-003: Performance Optimization
  - ADR-004: Audio Playback & Error Handling
  - ADR-005: State Machine Architecture
  - ADR-006: Type-Safe Audio Context

## ✅ Recently Resolved (2026-01-04 Session 9)

### Generation Form UI/UX

~~**IMP108** - Hints (tooltips) не работают на мобильных~~ ✅ RESOLVED
- Заменён Tooltip на Popover в `SectionLabel.tsx`
- Подсказки теперь активируются по клику

~~**IMP109** - Хедер формы генерации перегружен~~ ✅ RESOLVED
- Удалён логотип, уменьшены размеры в `CollapsibleFormHeader.tsx`
- Компактный дизайн: `min-h-[32px]`, кнопки `h-6`

~~**IMP110** - Copy/Delete кнопки видны при пустом поле~~ ✅ RESOLVED
- Кнопки полностью скрыты когда поле пустое в `FormFieldToolbar.tsx`

~~**IMP111** - Lyrics Visual Editor слишком громоздкий~~ ✅ RESOLVED
- Создан `LyricsVisualEditorCompact.tsx` — упрощённая версия
- Без drag-drop, без stats panel, с quick templates

~~**IMP112** - Advanced Options незаметные + дублирование модели~~ ✅ RESOLVED
- Кнопка с `border-dashed` и эмодзи ⚙️
- Model Selector удалён из Advanced Options

## ✅ Recently Resolved (2026-01-04 Session 4)

### Fullscreen Player Improvements

~~**IMP102** - No horizontal swipe for track switching~~ ✅ RESOLVED
- Implemented in `MobileFullscreenPlayer.tsx` with Framer Motion drag
- 80px threshold, 400px/s velocity, haptic feedback

~~**IMP103** - No track cover prefetching~~ ✅ RESOLVED
- Created `usePrefetchTrackCovers` hook with Image prefetch for 3 next tracks

~~**IMP104** - No audio preload for next track~~ ✅ RESOLVED
- Created `usePrefetchNextAudio` hook with preload='auto'

~~**IMP105** - No double-tap seek gesture~~ ✅ RESOLVED
- Implemented with `DoubleTapSeekFeedback` component
- Left = -10s, Right = +10s, haptic feedback

~~**IMP106** - No karaoke mode~~ ✅ RESOLVED
- Created `KaraokeView` component with Apple Music Sing-style animations

~~**IMP107** - Lyrics autoscroll not word-level~~ ✅ RESOLVED
- Added `data-word-index` to SynchronizedWord
- 30% from top positioning for active word

### Database & Edge Functions

~~**IMP099** - track_versions constraint violations~~ ✅ RESOLVED
- Extended constraint to include: `vocal_add`, `instrumental_add`, `cover`, `original`, etc.
- Migration: `20260104_extend_version_type_check.sql`

~~**IMP100** - suno-music-callback wrong version_type~~ ✅ RESOLVED
- Added `getVersionType()` function to determine type from `generation_mode`
- Updated in `supabase/functions/suno-music-callback/index.ts`

~~**IMP101** - suno-check-status used 'original' instead of 'initial'~~ ✅ RESOLVED
- Changed `version_type: 'original'` to `version_type: 'initial'`
- Updated in `supabase/functions/suno-check-status/index.ts`

## ✅ Recently Resolved (2026-01-07 Studio Optimization)

### P2 - Performance Optimization

~~**IMP113** - Studio state scattered across hooks~~ ✅ RESOLVED
- Created unified `useStudioState` hook with centralized mute/solo/volume/pan management
- Effective volume calculation considering master volume and solo states

~~**IMP114** - Waveform regeneration on every render~~ ✅ RESOLVED
- Created `useWaveformCache` with IndexedDB + LRU memory cache
- 7-day TTL, 20-entry memory cache limit

~~**IMP115** - Frequent re-renders in mixer~~ ✅ RESOLVED
- Created `OptimizedMixerChannel` with proper memo and stable callbacks
- Created `OptimizedMixerPanel` with virtualized channels

~~**IMP116** - Volume slider touch performance~~ ✅ RESOLVED
- Created `OptimizedVolumeSlider` with RAF-throttled updates
- Touch-optimized with proper event handling

### P3 - Architecture Improvements

~~**IMP045-IMP050** - Directory restructure~~ ✅ RESOLVED
- Hooks organized into focused subdirectories (studio/, audio/, etc.)
- Created optimized component variants in studio/unified/
- Proper re-exports via index files

## 🔄 Remaining Issues

**None** - All tracked issues have been resolved.

## Summary

✅ **All P0, P1, P2, P3, and P4 issues are fully resolved.**

The codebase is in excellent health with:
- Proper error boundaries and fallbacks
- Type-safe audio context handling (no more `as any` for AudioContext)
- Branded types for ID safety with full JSDoc
- State machine for complex wizard flows
- Optimized bundle imports
- Mobile-aware audio handling
- Memory leak prevention
- Buffer pooling for audio performance
- Web Worker support for waveform generation
- Comprehensive ADR documentation
- Telegram CloudStorage integration
- Deep links for fullscreen player
- Extended track_versions types for all generation modes
- **NEW:** Unified studio state management
- **NEW:** IndexedDB waveform caching
- **NEW:** Optimized mixer components with minimal re-renders
- **NEW:** Touch-optimized volume controls

