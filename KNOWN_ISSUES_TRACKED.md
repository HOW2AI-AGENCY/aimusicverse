# Known Issues & Technical Debt - MusicVerse AI

**Created**: 2025-12-12  
**Last Updated**: 2025-12-21  
**Source**: Code audit from specs/copilot/plan-improvements-for-project/

---

## 🔴 P1 Critical Issues

### Lyrics Wizard (`src/stores/lyricsWizardStore.ts`)

~~**IMP009** - No state persistence~~ ✅ RESOLVED
- Added localStorage persistence middleware

~~**IMP010** - Missing section validation~~ ✅ RESOLVED  
- Added validation with warnings before step transitions (lines 204-218)

~~**IMP011** - Incorrect character count~~ ✅ RESOLVED
- Refactored with `LyricsFormatter` and `LyricsValidator` utilities

~~**IMP012** - Excessive validation calls~~ ✅ RESOLVED
- Added 500ms debouncing (line 177-179, 296-301)

~~**IMP013** - No undo/redo functionality~~ ✅ RESOLVED
- Implemented history stack with undo/redo (lines 362-420)

~~**IMP014** - Malformed brackets risk~~ ✅ RESOLVED
- Added type guards and sanitization functions in `LyricsFormatter`

### Stem Studio (`src/hooks/studio/useStemStudioEngine.ts`)

~~**IMP015** - No AudioContext state check~~ ✅ RESOLVED
- Added `ensureAudioContext()` function with suspended/closed state handling (lines 74-91)

~~**IMP016** - Memory leak from audio nodes~~ ✅ RESOLVED
- Added `removeStemEngine()` function for individual stem cleanup

~~**IMP017** - Race conditions in audio graph~~ ✅ RESOLVED
- Implemented `AsyncMutex` in `src/lib/audioMutex.ts`

~~**IMP018** - Mobile audio element limits~~ ✅ RESOLVED
- Implemented `useMobileAudioFallback` hook and `MobileAudioWarning` component

~~**IMP019** - No Web Audio error boundary~~ ✅ RESOLVED
- Implemented `AudioErrorBoundary` in `src/components/studio/AudioErrorBoundary.tsx`

---

## 🟠 P2 High Priority

### Architecture Refactoring

**IMP027** - State machine needed
- **Issue**: Lyrics wizard uses loose state management
- **Location**: `src/stores/lyricsWizardStore.ts`
- **Fix**: Implement XState for explicit transitions
- **Priority**: P2 - Architecture

**IMP039-IMP044** - Error handling standardization
- **Issue**: Inconsistent error handling patterns
- **Fix**: Create `AppError` class hierarchy
- **Priority**: P2 - Architecture

### Performance Optimizations

**IMP033** - Audio buffer pooling
- **Issue**: No buffer reuse across section replacements
- **Fix**: Implement buffer pool
- **Priority**: P2 - Performance

**IMP034** - Waveform blocking UI
- **Issue**: Waveform generation blocks main thread
- **Fix**: Use Web Worker
- **Priority**: P2 - Performance

**IMP057-IMP059** - Missing React optimizations
- **Issue**: Heavy components not memoized
- **Locations**: `StemChannel`, `SectionEditorPanel`, `TrackCard`
- **Fix**: Add `React.memo`, `useCallback`, `useMemo`
- **Priority**: P2 - Performance

---

## 🟡 P3 Medium Priority

### Code Organization

**IMP045-IMP050** - Directory structure
- **Issue**: Hooks and components not well organized
- **Fix**: Create subdirectories:
  - `src/hooks/generation/`
  - `src/hooks/studio/`
  - `src/lib/audio/`
  - `src/lib/validation/`
- **Priority**: P3 - Organization

### Type Safety

**IMP051-IMP056** - TypeScript improvements
- Replace `any` with `unknown`
- Create branded types for IDs
- Add Zod schemas for edge functions
- Add exhaustive switch checks
- **Priority**: P3 - Type Safety

---

## 🟢 P4 Low Priority

### Documentation

**IMP073** - JSDoc coverage
- **Issue**: Missing JSDoc comments on public APIs
- **Fix**: Add comprehensive documentation
- **Priority**: P4 - Documentation

**IMP085** - Architecture Decision Records
- **Issue**: Major decisions not documented
- **Fix**: Create ADRs in `/ADR` directory
- **Priority**: P4 - Documentation

---

## Migration Notes

### Database Fields
- ✅ **Fixed**: `is_master` → `is_primary` in database (already migrated)
- ✅ **Fixed**: `master_version_id` → `active_version_id` on tracks table

### Naming Conventions
- ✅ Use `is_primary` (NOT `is_master`) 
- ✅ Use `track_change_log` (NOT `track_changelog`)
- ✅ Document as "Lovable Cloud", code with Supabase SDK

---

## Resolved Issues

### ✅ Completed (Dec 21, 2025) - Phase 1 Tech Debt Closure
- **IMP009** - Lyrics wizard state persistence via localStorage
- **IMP010** - Section validation with warnings before step transitions
- **IMP011** - Character count with `LyricsFormatter`/`LyricsValidator`
- **IMP012** - 500ms debounced validation
- **IMP013** - Undo/redo history stack  
- **IMP014** - Type guards for section tags (`LyricsFormatter`)
- **IMP015** - AudioContext state checks (`ensureAudioContext`)
- **IMP016** - Stem cleanup (`removeStemEngine`)
- **IMP017** - Audio graph mutex lock (`src/lib/audioMutex.ts`)
- **IMP018** - Mobile audio fallback (`useMobileAudioFallback`)
- **IMP019** - Audio error boundary (`AudioErrorBoundary`)
- **Bundle optimization** - Centralized framer-motion/date-fns imports

### ✅ Completed (Dec 12, 2025)
- **LazyImage adoption**: Expanded to all player components
- **Skeleton loaders**: Implemented across 200+ async components
- **Code splitting**: feature-generate, feature-stem-studio bundles
- **Database schema**: All migrations applied
- **Type system**: All interfaces defined
- **Mobile touch targets**: 44×44px minimum enforced

---

## 🔴 P1 Critical Issues

**ALL P1 ISSUES RESOLVED** ✅

---

## Quick Wins (< 2 hours each)

All quick wins have been completed. Moving to Phase 2 (P2) architectural improvements.

---

## Tracking Progress

To mark an issue as resolved:
1. Fix the code
2. Add test coverage if applicable
3. Move issue from "Known Issues" to "Resolved Issues" section
4. Add date and commit reference

---

## References

- Full audit: `specs/copilot/plan-improvements-for-project/checklists/implementation-improvements.md`
- Architecture quality: `specs/copilot/plan-improvements-for-project/checklists/architecture-quality.md`
- Constitution: `constitution.md`
