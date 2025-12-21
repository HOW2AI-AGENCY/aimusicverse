# ADR-006: Type-Safe AudioContext Handling

## Status
**Accepted** - December 2024

## Context

Web Audio API's `AudioContext` has a webkit-prefixed variant (`webkitAudioContext`) that's required for Safari and older browsers. This led to scattered `(window as any).webkitAudioContext` casts throughout the codebase, which:

1. Bypassed TypeScript's type checking
2. Created maintenance burden with repeated patterns
3. Made it harder to track browser compatibility issues
4. Violated DRY principles

### Problem Areas Identified
- `src/lib/sound-effects.ts` - Sound effects engine
- `src/components/studio/timeline/ProfessionalWaveformTimeline.tsx` - Waveform visualization
- `src/components/guitar/WaveformWithChords.tsx` - Guitar chord visualization
- `src/contexts/MusicLabAudioContext.tsx` - Music lab context
- `src/hooks/studio/useMobileAudioFallback.ts` - Mobile audio handling

## Decision

Create a centralized `audioContextHelper` module that:

1. **Extends Window interface** properly with TypeScript declarations
2. **Provides factory functions** for creating AudioContext instances
3. **Includes utility functions** for common operations (resume, close)
4. **Eliminates all `as any` casts** related to AudioContext

### Implementation

```typescript
// src/lib/audio/audioContextHelper.ts

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function getAudioContextClass(): typeof AudioContext | undefined {
  return window.AudioContext || window.webkitAudioContext;
}

export function createAudioContext(options?: AudioContextOptions): AudioContext {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported in this browser');
  }
  return new AudioContextClass(options);
}

export function isAudioContextSupported(): boolean {
  return !!(window.AudioContext || window.webkitAudioContext);
}

export async function ensureAudioContextRunning(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}
```

## Consequences

### Positive
- **Type Safety**: All AudioContext creation is now fully typed
- **Single Source of Truth**: One place to handle browser compatibility
- **Easier Testing**: Can mock the helper for unit tests
- **Future-Proof**: Easy to add new browser workarounds in one place
- **Reduced `as any`**: Eliminated 5+ `as any` casts related to audio

### Negative
- **Extra Import**: Components need to import from the helper
- **Slightly More Code**: Factory function vs direct instantiation

### Neutral
- Dynamic imports can still be used for code splitting
- Error handling is now centralized

## Migration

All existing usages were migrated:

```typescript
// Before
const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

// After
import { createAudioContext } from '@/lib/audio/audioContextHelper';
const ctx = createAudioContext();
```

## Related Decisions
- ADR-004: Audio Playback Optimization
- ADR-003: Performance Optimization Architecture

## References
- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
- [Safari AudioContext Support](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/PlayingandSynthesizingSounds/PlayingandSynthesizingSounds.html)
