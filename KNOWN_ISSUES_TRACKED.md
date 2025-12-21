# Known Issues Tracker

Last updated: 2025-12-21

## Status Overview

| Priority | Total | Resolved | Remaining |
|----------|-------|----------|-----------|
| P1 - Critical | 8 | 8 | 0 |
| P2 - High | 6 | 5 | 1 |
| P3 - Medium | 6 | 1 | 5 |
| P4 - Low | 2 | 0 | 2 |

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

### P2 - High Priority

~~**IMP033** - Audio buffer pooling~~ ✅ RESOLVED
- Implemented `src/lib/audio/bufferPool.ts` with LRU eviction and TTL

~~**IMP034** - Waveform Web Worker~~ ✅ RESOLVED
- Fixed `public/waveform-worker.js` (removed TypeScript syntax)
- Hook ready at `src/hooks/studio/useWaveformWorker.ts`

~~**IMP039-IMP044** - Error handling standardization~~ ✅ RESOLVED
- Standardized error handling in klangio edge function using response codes

~~**IMP057-IMP059** - React optimizations~~ ✅ RESOLVED
- `StemChannel`, `TrackCard`, `SectionEditorPanel` all use React.memo

### P3 - TypeScript & Architecture

~~**IMP051** - Branded types~~ ✅ RESOLVED
- Created `src/types/branded.ts` with TrackId, UserId, StemId, etc.

~~**IMP052** - Audio context helper~~ ✅ RESOLVED
- Created `src/lib/audio/audioContextHelper.ts` for type-safe webkit fallback

~~**IMP053** - lamejs types~~ ✅ RESOLVED
- Created `src/types/lamejs.d.ts`

## 🔄 Remaining Issues

### P2 - High Priority

**IMP027** - State machine for Lyrics Wizard
- **Issue**: Loose state management in lyrics wizard
- **Location**: `src/stores/lyricsWizardStore.ts`
- **Fix**: Consider XState for explicit state transitions
- **Priority**: P2 - Architecture

### P3 - Medium Priority  

**IMP045-IMP050** - Directory restructure
- **Issue**: Hooks and components could be better organized
- **Fix**: Create focused subdirectories as codebase grows
- **Priority**: P3 - Organization
- **Note**: Current structure is functional, refactor as needed

**IMP054-IMP056** - Remaining type safety
- **Issue**: Some `as any` casts remain in Supabase query results
- **Fix**: These are acceptable due to Supabase SDK type generation
- **Priority**: P3 - Type Safety

### P4 - Low Priority

**IMP073** - JSDoc coverage
- **Issue**: Missing JSDoc on some public APIs
- **Fix**: Add documentation incrementally
- **Priority**: P4 - Documentation

**IMP085** - Architecture Decision Records
- **Issue**: Major decisions not documented
- **Fix**: Continue ADR practice in `/ADR` directory
- **Priority**: P4 - Documentation

## Summary

All critical P1 issues have been resolved. The codebase is in good health with:
- Proper error boundaries and fallbacks
- Type-safe audio context handling
- Branded types for ID safety
- Optimized bundle imports
- Mobile-aware audio handling
- Memory leak prevention

Remaining items are organizational/documentation improvements that can be addressed incrementally.
