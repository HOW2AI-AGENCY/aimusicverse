# Known Issues Tracker

Last updated: 2025-12-21

## Status Overview

| Priority | Total | Resolved | Remaining |
|----------|-------|----------|-----------|
| P1 - Critical | 8 | 8 | 0 |
| P2 - High | 6 | 6 | 0 |
| P3 - Medium | 6 | 5 | 1 |
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

## 🔄 Remaining Issues

### P3 - Medium Priority  

**IMP045-IMP050** - Directory restructure
- **Issue**: Hooks and components could be better organized
- **Fix**: Create focused subdirectories as codebase grows
- **Priority**: P3 - Organization
- **Note**: Current structure is functional, refactor incrementally

## Summary

✅ **All P1, P2, and P4 issues are fully resolved.**
✅ **5 of 6 P3 issues resolved.**

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

The only remaining item is organizational directory restructuring, which can be addressed incrementally as the codebase grows.

