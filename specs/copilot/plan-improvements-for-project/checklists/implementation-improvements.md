# Implementation Improvements Checklist: MusicVerse AI Code Quality

**Purpose**: Identify specific code improvements, refactoring opportunities, and technical debt in MusicVerse AI implementation
**Created**: 2025-12-09
**Feature**: Surgical code improvements across generation, lyrics wizard, stem studio, and project modules

**Note**: This checklist focuses on implementation quality while respecting architectural requirements documented in architecture-quality.md

---

## P1 Critical - Generation Form Improvements

- [ ] IMP001 - Extract audio reference loading logic into `useAudioReferenceLoader` hook to eliminate 75-line duplicate pattern [P1, DRY, src/hooks/useGenerateForm.ts:152-227]
- [ ] IMP002 - Add explicit cleanup for localStorage `stem_audio_reference` in error scenarios to prevent stale data accumulation [P1, Bug Risk, src/hooks/useGenerateForm.ts:201]
- [ ] IMP003 - Implement pre-generation credit validation to block submission when credits < required amount [P1, UX, src/hooks/useGenerateForm.ts:326]
- [ ] IMP004 - Fix race condition between planTrackContext, draft restoration, and template loading by implementing priority queue [P1, Bug, src/hooks/useGenerateForm.ts:103-257]
- [ ] IMP005 - Add loading state for boost style operation to prevent double-click submissions [P1, UX, src/hooks/useGenerateForm.ts:281-323]
- [ ] IMP006 - Implement model fallback chain instead of single fallback to handle multiple deprecated models [P1, Robustness, src/hooks/useGenerateForm.ts:352-363]
- [ ] IMP007 - Add timeout handling (30s) for FileReader operations on large audio files [P1, Performance, src/hooks/useGenerateForm.ts:388-393]
- [ ] IMP008 - Extract error toast patterns into `showGenerationError(error)` utility function [P1, DRY, src/hooks/useGenerateForm.ts:460-476]

## P1 Critical - Lyrics Wizard State Management

- [ ] IMP009 - Add state persistence to localStorage for lyrics wizard to enable resume after accidental close [P1, UX, src/stores/lyricsWizardStore.ts]
- [ ] IMP010 - Implement validation for section content before allowing step transition to prevent empty sections [P1, Data Quality, src/stores/lyricsWizardStore.ts:92-110]
- [ ] IMP011 - Fix character count calculation to exclude structural tags from 3000 char limit [P1, Bug, src/stores/lyricsWizardStore.ts:225]
- [ ] IMP012 - Add debouncing (500ms) to validateLyrics() to prevent excessive computation on keystroke [P1, Performance, src/stores/lyricsWizardStore.ts:218-253]
- [ ] IMP013 - Implement undo/redo for section content changes using Immer or custom history stack [P1, UX]
- [ ] IMP014 - Add explicit type guards for section tag insertion to prevent malformed brackets [P1, Data Quality, src/stores/lyricsWizardStore.ts:266-278]

## P1 Critical - Stem Studio Audio Sync

- [ ] IMP015 - Add AudioContext state check before operations to handle suspended/interrupted contexts [P1, Bug, src/hooks/useStemStudioEngine.ts:24-28]
- [ ] IMP016 - Implement cleanup for orphaned audio nodes when stem is removed to prevent memory leak [P1, Memory Leak, src/hooks/useStemStudioEngine.ts:76-84]
- [ ] IMP017 - Add synchronization lock to prevent concurrent modifications to audio graph [P1, Concurrency, src/hooks/useStemStudioEngine.ts]
- [ ] IMP018 - Implement graceful degradation when max audio elements limit (6-8 on mobile) is reached [P1, Mobile, Gap]
- [ ] IMP019 - Add error boundary specifically for Web Audio API errors with recovery mechanism [P1, Robustness]

## P2 High - useGenerateForm Refactoring

- [ ] IMP020 - Split useGenerateForm into three focused hooks: `useGenerateFormState`, `useGenerateFormActions`, `useGenerateFormEffects` [P2, Architecture, src/hooks/useGenerateForm.ts 582 lines]
- [ ] IMP021 - Extract form validation logic into `validateGenerateForm(mode, fields)` pure function [P2, Testability, src/hooks/useGenerateForm.ts:326-350]
- [ ] IMP022 - Create `GenerateFormState` discriminated union type to replace loose object structure [P2, Type Safety, src/hooks/useGenerateForm.ts:11-29]
- [ ] IMP023 - Extract credit fetching into `useCreditsBalance()` hook with automatic refresh [P2, Separation, src/hooks/useGenerateForm.ts:134-148]
- [ ] IMP024 - Move model validation to initialization phase instead of submission phase [P2, UX, src/hooks/useGenerateForm.ts:352-363]
- [ ] IMP025 - Consolidate three separate context sources (plan track, draft, template) into single `useFormContextLoader` hook [P2, Complexity, src/hooks/useGenerateForm.ts:103-257]
- [ ] IMP026 - Extract artist and track selection handlers into separate `useFormReferences()` hook [P2, Separation, src/hooks/useGenerateForm.ts:488-523]

## P2 High - Lyrics Wizard Architecture

- [ ] IMP027 - Implement wizard state machine using XState for explicit state transitions and guards [P2, Architecture, src/stores/lyricsWizardStore.ts]
- [ ] IMP028 - Extract lyrics formatting logic into `LyricsFormatter` class with unit tests [P2, Testability, src/stores/lyricsWizardStore.ts:259-302]
- [ ] IMP029 - Create `SectionValidator` utility to centralize section content validation rules [P2, DRY, src/stores/lyricsWizardStore.ts:239-243]
- [ ] IMP030 - Add optimistic UI updates for AI generation steps with rollback on failure [P2, UX]
- [ ] IMP031 - Implement wizard step analytics tracking (time spent, completion rate) for UX insights [P2, Analytics]
- [ ] IMP032 - Extract tag insertion logic into `TagInserter` utility with configurable rules [P2, Separation, src/stores/lyricsWizardStore.ts:266-298]

## P2 High - Stem Studio Performance

- [ ] IMP033 - Implement audio buffer pooling to reuse buffers across section replacements [P2, Performance]
- [ ] IMP034 - Add Web Worker for waveform generation to prevent UI blocking on large files [P2, Performance]
- [ ] IMP035 - Implement virtual scrolling for stem channel list when >10 stems present [P2, Performance]
- [ ] IMP036 - Add memoization for effect parameter calculations using useMemo [P2, Performance, src/hooks/useStemStudioEngine.ts]
- [ ] IMP037 - Implement incremental rendering for timeline visualization using canvas [P2, Performance]
- [ ] IMP038 - Add lazy initialization for effect nodes (create only when effect enabled) [P2, Memory, src/hooks/useStemStudioEngine.ts:100+]

## P2 High - Error Handling Standardization

- [ ] IMP039 - Create `AppError` class hierarchy (NetworkError, ValidationError, APIError) for typed error handling [P2, Architecture]
- [ ] IMP040 - Implement centralized error logger with Sentry/LogRocket integration [P2, Observability]
- [ ] IMP041 - Add error boundaries for each major route with custom fallback UI [P2, UX]
- [ ] IMP042 - Create `ErrorRecoveryService` for automatic retry with exponential backoff [P2, Resilience]
- [ ] IMP043 - Implement toast notification queue to prevent overlapping error messages [P2, UX]
- [ ] IMP044 - Add contextual error information (user action, component stack, timestamp) to all logged errors [P2, Debugging]

## P3 Medium - Code Organization

- [ ] IMP045 - Create `src/hooks/generation/` subdirectory and move related hooks: useGenerateForm, useGenerateDraft, useActiveGenerations [P3, Organization]
- [ ] IMP046 - Create `src/hooks/studio/` subdirectory for stem studio hooks: useStemStudioEngine, useStemAudioEngine, useStudioPlayer [P3, Organization]
- [ ] IMP047 - Extract lyrics wizard steps into `src/components/lyrics-wizard/steps/` directory [P3, Organization]
- [ ] IMP048 - Consolidate stem studio dialogs into `src/components/stem-studio/dialogs/` directory [P3, Organization]
- [ ] IMP049 - Create `src/lib/audio/` for audio utility functions (Web Audio API helpers) [P3, Organization]
- [ ] IMP050 - Create `src/lib/validation/` for shared validation functions [P3, Organization]

## P3 Medium - Type Safety Improvements

- [ ] IMP051 - Replace `any` with `unknown` and add explicit type guards in edge function responses [P3, Type Safety]
- [ ] IMP052 - Create branded types for IDs (TrackId, ProjectId, ArtistId) to prevent mixups [P3, Type Safety]
- [ ] IMP053 - Add exhaustive checks in switch statements using `assertNever()` helper [P3, Type Safety]
- [ ] IMP054 - Replace optional properties with discriminated unions where applicable (e.g., GenerateFormState) [P3, Type Safety]
- [ ] IMP055 - Add Zod schemas for edge function request/response validation [P3, Runtime Safety]
- [ ] IMP056 - Create strict event types for analytics tracking instead of string literals [P3, Type Safety]

## P3 Medium - Performance Optimizations

- [ ] IMP057 - Add React.memo to heavy components: StemChannel, SectionEditorPanel, TrackCard [P3, Performance]
- [ ] IMP058 - Implement useCallback for event handlers in VirtualizedTrackList items [P3, Performance]
- [ ] IMP059 - Add useMemo for expensive computations: lyrics formatting, waveform data processing [P3, Performance]
- [ ] IMP060 - Implement code splitting for heavy features: Stem Studio, Lyrics Wizard, MIDI Transcription [P3, Bundle Size]
- [ ] IMP061 - Add bundle analyzer and optimize largest chunks (reduce below 500KB) [P3, Bundle Size]
- [ ] IMP062 - Implement prefetching for likely next actions (e.g., credits after form open) [P3, UX]

## P3 Medium - State Management Patterns

- [ ] IMP063 - Standardize Zustand actions to return void instead of mixed return types [P3, Consistency]
- [ ] IMP064 - Add devtools integration for all Zustand stores for debugging [P3, DX]
- [ ] IMP065 - Implement store selectors for derived state instead of computing in components [P3, Performance]
- [ ] IMP066 - Add middleware for store persistence where appropriate (lyricsWizardStore, playerStore) [P3, UX]
- [ ] IMP067 - Create store slice pattern for large stores (split lyricsWizardStore into concept/structure/writing slices) [P3, Organization]

## P3 Medium - Form Handling Improvements

- [ ] IMP068 - Migrate to React Hook Form for complex forms (generation form, lyrics wizard) [P3, DX]
- [ ] IMP069 - Add field-level validation with immediate feedback instead of submit-time validation [P3, UX]
- [ ] IMP070 - Implement form dirty tracking with unsaved changes warning [P3, UX]
- [ ] IMP071 - Add keyboard shortcuts for common actions (Ctrl+Enter to submit, Esc to close) [P3, UX]
- [ ] IMP072 - Implement auto-save indicators showing "Saving..." / "Saved" status [P3, UX]

## P4 Low - Code Quality

- [ ] IMP073 - Add JSDoc comments for all public hook interfaces with usage examples [P4, Documentation]
- [ ] IMP074 - Extract magic numbers into named constants (e.g., 3000 char limit, 1000ms debounce) [P4, Readability]
- [ ] IMP075 - Replace nested ternaries with early returns or extracted functions [P4, Readability]
- [ ] IMP076 - Add meaningful variable names instead of single letters (s → section, t → track) [P4, Readability]
- [ ] IMP077 - Consolidate duplicate type definitions across components [P4, DRY]
- [ ] IMP078 - Add ESLint rules for consistent code style (max-lines-per-function, complexity threshold) [P4, Quality]

## P4 Low - Testing Infrastructure

- [ ] IMP079 - Add unit tests for useGenerateForm with React Testing Library [P4, Coverage]
- [ ] IMP080 - Add unit tests for lyricsWizardStore with mock Zustand store [P4, Coverage]
- [ ] IMP081 - Add integration tests for generation flow using Playwright [P4, Coverage]
- [ ] IMP082 - Add visual regression tests for key UI components [P4, Coverage]
- [ ] IMP083 - Add performance tests for stem audio synchronization [P4, Performance]
- [ ] IMP084 - Implement test fixtures for common test data (tracks, artists, projects) [P4, DX]

## P4 Low - Documentation

- [ ] IMP085 - Create architecture decision records (ADR) for major patterns (Single Audio Source, Zustand over Context) [P4, Documentation]
- [ ] IMP086 - Add inline code comments explaining complex algorithms (lyrics formatting, audio sync) [P4, Maintainability]
- [ ] IMP087 - Create component usage examples in Storybook for UI library [P4, DX]
- [ ] IMP088 - Document hook dependencies and when to use each hook variant [P4, DX]
- [ ] IMP089 - Add troubleshooting guide for common development issues [P4, DX]

## P4 Low - Developer Experience

- [ ] IMP090 - Add pre-commit hooks for linting and type checking [P4, Quality]
- [ ] IMP091 - Implement conventional commits with commitlint [P4, Git History]
- [ ] IMP092 - Add VS Code snippets for common patterns (custom hook template, Zustand store template) [P4, DX]
- [ ] IMP093 - Create development seed data script for rapid testing [P4, DX]
- [ ] IMP094 - Add script to analyze bundle size per feature module [P4, Monitoring]

## Specific File Improvements

### src/hooks/useGenerateForm.ts (582 lines → Target 200-250 lines)

**Extraction Plan:**

```typescript
// NEW: src/hooks/generation/useGenerateFormState.ts (120 lines)
export function useGenerateFormState(initialProjectId?: string) {
  // All useState declarations (lines 53-81)
  // Form state only, no logic
  return { mode, setMode, description, setDescription, ... };
}

// NEW: src/hooks/generation/useFormContextLoader.ts (150 lines)
export function useFormContextLoader(open: boolean, hasDraft: boolean) {
  // Lines 103-257: planTrackContext, draft, template loading
  // Priority queue: planTrack > template > draft
  // Cleanup logic extracted
  return { loadContext, clearContext };
}

// NEW: src/hooks/generation/useAudioReferenceLoader.ts (80 lines)
export function useAudioReferenceLoader() {
  // Lines 152-227: stem reference loading
  // Reusable for other audio upload scenarios
  return { loadAudioReference, clearAudioReference, loading };
}

// NEW: src/hooks/generation/useGenerateFormActions.ts (180 lines)
export function useGenerateFormActions(state: GenerateFormState) {
  // Lines 281-523: handleGenerate, handleBoostStyle, handleTrackSelect, handleArtistSelect
  // Pure business logic
  return { handleGenerate, handleBoostStyle, ... };
}

// REFACTORED: src/hooks/generation/useGenerateForm.ts (100 lines)
export function useGenerateForm(props: UseGenerateFormProps) {
  // Compose the above hooks
  // Minimal glue code
  const state = useGenerateFormState(props.initialProjectId);
  const context = useFormContextLoader(props.open, hasDraft);
  const audioRef = useAudioReferenceLoader();
  const actions = useGenerateFormActions(state);
  return { ...state, ...actions };
}
```

- [ ] IMP095 - Implement the above extraction plan [P2, Architecture]

### src/stores/lyricsWizardStore.ts (308 lines → Target 250 lines + utilities)

**Extraction Plan:**

```typescript
// NEW: src/lib/lyrics/LyricsFormatter.ts (80 lines)
export class LyricsFormatter {
  static formatFinal(sections: LyricSection[], enrichment: Enrichment): string {
    // Lines 259-302: Complex formatting logic
    // Pure function, easily testable
  }
  
  static calculateCharCount(lyrics: string, excludeTags: boolean): number {
    // Fix character counting logic
  }
}

// NEW: src/lib/lyrics/LyricsValidator.ts (60 lines)
export class LyricsValidator {
  static validate(lyrics: string, sections: LyricSection[]): ValidationResult {
    // Lines 218-253: Validation logic
    // Add more comprehensive checks
  }
}

// REFACTORED: src/stores/lyricsWizardStore.ts (200 lines)
import { LyricsFormatter } from '@/lib/lyrics/LyricsFormatter';
import { LyricsValidator } from '@/lib/lyrics/LyricsValidator';

export const useLyricsWizardStore = create<LyricsWizardState>((set, get) => ({
  // Use extracted utilities
  validateLyrics: () => {
    const state = get();
    const result = LyricsValidator.validate(state.getFinalLyrics(), state.writing.sections);
    set({ validation: result });
  },
  getFinalLyrics: () => {
    const state = get();
    return LyricsFormatter.formatFinal(state.writing.sections, state.enrichment);
  },
}));
```

- [ ] IMP096 - Implement the above extraction plan [P2, Architecture]

### src/hooks/useStemStudioEngine.ts (Needs full review)

**Improvements Needed:**

```typescript
// Add cleanup on unmount
useEffect(() => {
  return () => {
    // Disconnect all nodes
    Object.values(nodesMapRef.current).forEach(nodes => {
      nodes.source.disconnect();
      nodes.gainNode.disconnect();
      // ... disconnect all nodes
    });
    nodesMapRef.current = {};
    
    // Close AudioContext if no other instances
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
  };
}, []);

// Add synchronization lock
const operationLockRef = useRef<Promise<void>>(Promise.resolve());

const withLock = async <T>(operation: () => Promise<T>): Promise<T> => {
  const previousOp = operationLockRef.current;
  const currentOp = previousOp.then(operation);
  operationLockRef.current = currentOp.then(() => {}, () => {});
  return currentOp;
};

// Add AudioContext state check
const ensureAudioContext = useCallback(async () => {
  const ctx = audioContextRef.current;
  if (!ctx) throw new Error('AudioContext not initialized');
  
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  
  if (ctx.state === 'closed') {
    throw new Error('AudioContext is closed');
  }
}, []);
```

- [ ] IMP097 - Add comprehensive cleanup logic [P1, Memory Leak]
- [ ] IMP098 - Implement operation locking for thread safety [P1, Concurrency]
- [ ] IMP099 - Add AudioContext state management [P1, Robustness]

## Edge Function Improvements

### supabase/functions/suno-music-generate/

- [ ] IMP100 - Add request payload schema validation with Zod [P2, Safety]
- [ ] IMP101 - Implement idempotency key support to prevent duplicate generations [P1, Data Integrity]
- [ ] IMP102 - Add timeout handling with graceful degradation [P2, Reliability]
- [ ] IMP103 - Implement structured logging with request context [P2, Observability]
- [ ] IMP104 - Add rate limiting per user with Redis [P2, Abuse Prevention]

### supabase/functions/suno-boost-style/

- [ ] IMP105 - Cache AI responses for identical inputs to reduce costs [P2, Cost]
- [ ] IMP106 - Add character limit enforcement (450 chars) before API call [P2, Validation]
- [ ] IMP107 - Implement fallback to simple prompt expansion if AI fails [P2, Reliability]

## Database Query Optimization

- [ ] IMP108 - Add composite index on (user_id, created_at) for tracks table [P2, Performance]
- [ ] IMP109 - Add index on (track_id, is_primary) for track_versions table [P2, Performance]
- [ ] IMP110 - Implement pagination cursor strategy instead of offset for large lists [P2, Performance]
- [ ] IMP111 - Add database connection pooling configuration for edge functions [P2, Scalability]
- [ ] IMP112 - Implement query result caching with automatic invalidation [P3, Performance]

## Mobile Optimization

- [ ] IMP113 - Reduce initial bundle size below 200KB for faster Telegram Mini App load [P1, Performance]
- [ ] IMP114 - Implement touch gesture library for swipe actions (delete track, change version) [P2, UX]
- [ ] IMP115 - Add haptic feedback for important actions (generation started, track completed) [P2, UX]
- [ ] IMP116 - Optimize image loading with WebP format and responsive sizes [P2, Performance]
- [ ] IMP117 - Implement service worker for offline capabilities [P3, UX]

## Security Enhancements

- [ ] IMP118 - Add input sanitization for all user-generated content before storage [P1, Security]
- [ ] IMP119 - Implement rate limiting on client side to prevent API abuse [P2, Security]
- [ ] IMP120 - Add Content Security Policy headers to edge functions [P2, Security]
- [ ] IMP121 - Implement file upload virus scanning integration [P2, Security]
- [ ] IMP122 - Add XSS protection for rendered track titles and lyrics [P1, Security]

## Notes

- **Priority Distribution**: P1 (19 items), P2 (27 items), P3 (26 items), P4 (16 items), Mixed (34 items)
- **Quick Wins**: IMP008, IMP074, IMP078 can be completed in <30 minutes each
- **High Impact**: IMP001, IMP020, IMP027, IMP095, IMP096 significantly improve maintainability
- **Technical Debt**: IMP015, IMP016, IMP097 address potential production issues
- **Testing**: IMP079-IMP084 establish testing foundation for long-term quality
