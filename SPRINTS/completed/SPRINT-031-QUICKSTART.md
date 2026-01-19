# Sprint 031: Quickstart Guide

**Date**: 2026-01-07
**Status**: Phase 1 Design Artifact
**Related**: [SPRINT-031-DATA-MODEL.md](./SPRINT-031-DATA-MODEL.md), [SPRINT-031-RESEARCH.md](./SPRINT-031-RESEARCH.md)

---

## Overview

This guide provides quick reference for implementing Sprint 031 optimization features. Includes API signatures, usage examples, and integration points.

---

## Table of Contents

1. [Store Usage](#store-usage)
2. [Optimized Components](#optimized-components)
3. [BPM Detection & Snap](#bpm-detection--snap)
4. [Waveform Caching](#waveform-caching)
5. [RAF Throttling](#raf-throttling)
6. [Testing Utilities](#testing-utilities)

---

## Store Usage

### useUnifiedStudioStore

**Import:**
```typescript
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
```

**Basic Usage:**
```typescript
function StudioComponent() {
  // Subscribe to specific state (prevents re-renders)
  const isPlaying = useUnifiedStudioStore(state => state.isPlaying);
  const currentTime = useUnifiedStudioStore(state => state.currentTime);

  // Get actions
  const { play, pause, seek } = useUnifiedStudioStore();

  return (
    <div>
      <button onClick={play}>Play</button>
      <div>Time: {currentTime.toFixed(2)}s</div>
    </div>
  );
}
```

**Advanced Usage (Optimized Selectors):**
```typescript
import { shallow } from 'zustand/shallow';

// Select multiple values with shallow comparison
const { isPlaying, currentTime, duration } = useUnifiedStudioStore(
  state => ({
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
  }),
  shallow // Only re-render if one of these values changes
);

// Parameterized selector
const stemState = useUnifiedStudioStore(
  state => state.stemStates['vocals'] || defaultStemState
);

// Computed selector
const effectiveVolume = useUnifiedStudioStore(
  state => state.getEffectiveVolume('vocals')
);
```

**Actions:**
```typescript
// Playback
play();
pause();
seek(10.5); // Seek to 10.5 seconds
setLoopMode('track');

// Mixer
setMasterVolume(0.8);
setStemVolume('vocals', 0.5);
toggleStemMute('vocals');
toggleStemSolo('drums');

// History
undo();
redo();
resetAll();
```

---

## Optimized Components

### OptimizedLyricsLine

**Import:**
```typescript
import { OptimizedLyricsLine } from '@/components/lyrics/OptimizedLyricsLine';
```

**Usage:**
```typescript
function LyricsPanel({ lyrics, currentLineIndex }: LyricsPanelProps) {
  return (
    <div className="lyrics-panel">
      {lyrics.map((line, index) => (
        <OptimizedLyricsLine
          key={line.id}
          line={line}
          index={index}
          isActive={index === currentLineIndex}
          isNext={index === currentLineIndex + 1}
          isPast={index < currentLineIndex}
          onClick={(line, i) => seekToLine(line.startTime)}
          showTimestamps={true}
          editable={true}
        />
      ))}
    </div>
  );
}
```

**Props:**
```typescript
interface OptimizedLyricsLineProps {
  line: LyricsLineData;
  index: number;
  isActive: boolean;
  isNext?: boolean;
  isPast?: boolean;
  onClick?: (line: LyricsLineData, index: number) => void;
  onDoubleClick?: (line: LyricsLineData, index: number) => void;
  showTimestamps?: boolean;
  editable?: boolean;
  className?: string;
}
```

**Optimization Notes:**
- Uses `React.memo` with custom comparison
- Only re-renders when `line.id`, `line.text`, or boolean state changes
- Parent must stabilize `onClick`/`onDoubleClick` with `useCallback`

---

### OptimizedMixerChannel

**Import:**
```typescript
import { OptimizedMixerChannel } from '@/components/studio/unified/OptimizedMixerChannel';
```

**Usage:**
```typescript
function MixerPanel({ stems }: MixerPanelProps) {
  // Stabilize callbacks in parent
  const handleVolumeChange = useCallback((stemId: string, volume: number) => {
    useUnifiedStudioStore.getState().setStemVolume(stemId, volume);
  }, []);

  const handleToggleMute = useCallback((stemId: string) => {
    useUnifiedStudioStore.getState().toggleStemMute(stemId);
  }, []);

  const handleToggleSolo = useCallback((stemId: string) => {
    useUnifiedStudioStore.getState().toggleStemSolo(stemId);
  }, []);

  return (
    <div className="mixer-panel">
      {stems.map(stem => (
        <OptimizedMixerChannel
          key={stem.id}
          {...stem}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleSolo={handleToggleSolo}
        />
      ))}
    </div>
  );
}
```

**Props:**
```typescript
interface OptimizedMixerChannelProps {
  id: string;
  name: string;
  shortName?: string;
  icon?: string;
  color?: string;
  volume: number;
  pan?: number;
  muted: boolean;
  solo: boolean;
  isPlaying?: boolean;
  hasEffects?: boolean;
  compact?: boolean;
  delay?: number;
  onVolumeChange: (id: string, volume: number) => void;
  onPanChange?: (id: string, pan: number) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onOpenEffects?: (id: string) => void;
}
```

**Optimization Notes:**
- Custom comparison focuses on `volume`, `muted`, `solo` (frequently changing)
- Parent must stabilize all callbacks with `useCallback`
- Only re-renders when mixer state changes, not on parent re-render

---

### OptimizedPlaylistItem (Virtualized)

**Import:**
```typescript
import { OptimizedPlaylistItem } from '@/components/library/OptimizedPlaylistItem';
import { VirtuosoGrid } from 'react-virtuoso';
```

**Usage:**
```typescript
function TrackList({ tracks, onPlay, onLike }: TrackListProps) {
  // Stabilize callbacks
  const handlePlayTrack = useCallback((track: Track, index: number) => {
    onPlay(track, index);
  }, [onPlay]);

  const handleLikeTrack = useCallback((trackId: string, isLiked: boolean) => {
    onLike(trackId, isLiked);
  }, [onLike]);

  return (
    <VirtuosoGrid
      style={{ height: '100%' }}
      totalCount={tracks.length}
      itemContent={(index, track) => (
        <OptimizedPlaylistItem
          key={track.id}
          track={track}
          isActive={track.id === currentTrackId}
          isPlaying={track.id === currentTrackId && isPlaying}
          onPlay={handlePlayTrack}
          onLike={handleLikeTrack}
        />
      )}
    />
  );
}
```

**Props:**
```typescript
interface OptimizedPlaylistItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (track: Track, index: number) => void;
  onLike: (trackId: string, isLiked: boolean) => void;
  onShare?: (track: Track) => void;
  onOpenMenu?: (track: Track) => void;
}
```

**Optimization Notes:**
- Uses `React.memo` with shallow comparison
- Virtualization reduces DOM nodes to ~20 visible items
- Parent must stabilize callbacks
- Comparison focuses on `track.id`, `isActive`, `isPlaying`

---

## BPM Detection & Snap

### detectBPM

**Import:**
```typescript
import { detectBPM, detectBPMFromUrl } from '@/lib/bpmDetection';
```

**Usage:**
```typescript
// From AudioBuffer
const audioBuffer = await decodeAudioData(arrayBuffer);
const result = await detectBPM(audioBuffer);
console.log(`BPM: ${result.bpm}, Confidence: ${result.confidence}`);

// From URL
const result = await detectBPMFromUrl('https://cdn.example.com/track.mp3');
```

**Return Type:**
```typescript
interface BPMDetectionResult {
  bpm: number | null;
  confidence: number;
  beatPositions: number[];
  duration: number;
}
```

---

### snapToGrid

**Import:**
```typescript
import { snapToGrid } from '@/lib/beatSnap';
```

**Usage:**
```typescript
// Snap time to nearest beat (if BPM available)
const { snappedTime, gridType, distanceToGrid } = snapToGrid(
  10.5, // Time to snap
  bpmResult, // BPMDetectionResult or null
  { resolution: 'beat', fallbackGridSeconds: 1 }
);

console.log(`Snapped to ${snappedTime}s using ${gridType} grid`);
```

**Return Type:**
```typescript
interface SnapResult {
  snappedTime: number;
  gridType: 'beat' | 'seconds';
  distanceToGrid: number;
}
```

---

### useBPMGrid Hook

**Import:**
```typescript
import { useBPMGrid } from '@/hooks/useBPMGrid';
```

**Usage:**
```typescript
function Timeline({ audioUrl, duration, onSeek }: TimelineProps) {
  const {
    snap,
    getGridLines,
    formatTime,
    hasBPM,
    bpm,
    isDetecting
  } = useBPMGrid({
    audioUrl,
    snapResolution: 'beat',
    fallbackGridSeconds: 1
  });

  const handleClick = (clientX: number) => {
    const time = (clientX / width) * duration;
    const { snappedTime } = snap(time);
    onSeek(snappedTime);
  };

  return (
    <div>
      <div>Click timeline to snap to grid</div>
      {isDetecting && <div>Detecting BPM...</div>}
      {hasBPM && <div>{bpm} BPM</div>}
    </div>
  );
}
```

---

## Waveform Caching

### getCachedWaveform / saveWaveform

**Import:**
```typescript
import { getCachedWaveform, saveWaveform } from '@/lib/waveformCache';
```

**Usage:**
```typescript
// Check cache first
const cached = await getCachedWaveform(trackId);
if (cached) {
  console.log('Cache hit! Using cached waveform.');
  renderWaveform(cached);
} else {
  console.log('Cache miss. Generating waveform...');
  const waveform = await generateWaveform(trackId);
  await saveWaveform(trackId, waveform);
  renderWaveform(waveform);
}
```

**Cache Metrics:**
```typescript
import { getWaveformCacheMetrics } from '@/lib/waveformCache';

const metrics = getWaveformCacheMetrics();
console.log(`Hit rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
console.log(`Avg retrieval: ${metrics.avgRetrievalTime.toFixed(2)}ms`);
```

---

## RAF Throttling

### useRAFThrottle

**Import:**
```typescript
import { useRAFThrottle, usePlayheadDrag, usePinchZoom } from '@/hooks/studio/useRAFThrottle';
```

**Usage:**
```typescript
function Playhead({ onPositionChange }: PlayheadProps) {
  // Use specialized hook for playhead
  const throttledDrag = usePlayheadDrag(onPositionChange);

  return (
    <div
      onMouseMove={(e) => throttledDrag(e.clientX)}
      onMouseUp={() => throttledDrag.cancel?.()}
    >
      <PlayheadHead />
    </div>
  );
}

// Custom RAF throttle
const throttledZoom = useRAFThrottle((scale: number) => {
  redrawWaveform(scale);
}, {
  skipThreshold: 0.01, // Skip if scale change < 1%
  monitorPerformance: true
});
```

**Advanced Hook Signature:**
```typescript
function useRAFThrottle<T extends (...args: any[]) => void>(
  fn: T,
  options?: {
    leading?: boolean; // Execute immediately on first call
    skipThreshold?: number; // Skip if value unchanged by this amount
    shouldUpdate?: (prev: any, curr: any) => boolean; // Custom comparison
    monitorPerformance?: boolean; // Log frame times
  }
): T;
```

---

## Testing Utilities

### Performance Profiling

**Import:**
```typescript
import { markPerformance } from '@/lib/performance-utils';
```

**Usage:**
```typescript
function TestComponent() {
  const handleClick = () => {
    const measure = markPerformance('mixer-volume-change');

    // Perform action
    updateVolume(0.8);

    const duration = measure.end();
    if (duration > 16.67) {
      console.warn(`Frame exceeded budget: ${duration.toFixed(2)}ms`);
    }
  };

  return <button onClick={handleClick}>Update Volume</button>;
}
```

---

### React Profiler

**Usage:**
```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number
) {
  console.log(`${id} ${phase}:`, {
    actual: `${actualDuration.toFixed(2)}ms`,
    base: `${baseDuration.toFixed(2)}ms`,
    efficiency: `${(baseDuration / actualDuration * 100).toFixed(0)}%`
  });
}

<Profiler id="OptimizedMixerChannel" onRender={onRenderCallback}>
  <OptimizedMixerChannel {...props} />
</Profiler>
```

---

### Cache Testing

**Mock IndexedDB:**
```typescript
import { getCachedWaveform, saveWaveform } from '@/lib/waveformCache';

// Setup test
const mockWaveform = new Array(1000).fill(0).map(() => Math.random());

// Test save
await saveWaveform('test-track', mockWaveform);

// Test retrieve
const cached = await getCachedWaveform('test-track');
expect(cached).toEqual(mockWaveform);

// Test TTL (advance time by 8 days)
vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
const expired = await getCachedWaveform('test-track');
expect(expired).toBeNull();
```

---

## Common Patterns

### Stabilizing Callbacks

```typescript
// ❌ BAD: New function every render
<MixerChannel onVolumeChange={(id, vol) => updateVolume(id, vol)} />

// ✅ GOOD: Stable reference with useCallback
const handleVolumeChange = useCallback((id: string, volume: number) => {
  updateVolume(id, volume);
}, []); // Empty deps if function doesn't change

<MixerChannel onVolumeChange={handleVolumeChange} />
```

---

### Selector Optimization

```typescript
// ❌ BAD: Subscribes to entire store
const store = useUnifiedStudioStore();

// ✅ GOOD: Subscribes to specific values
const isPlaying = useUnifiedStudioStore(state => state.isPlaying);

// ✅ BETTER: Multiple values with shallow comparison
const { isPlaying, currentTime } = useUnifiedStudioStore(
  state => ({ isPlaying: state.isPlaying, currentTime: state.currentTime }),
  shallow
);
```

---

### Batch Updates

```typescript
// ❌ BAD: Multiple setState calls
setState({ loading: true });
setState({ data: null });
setState({ error: null });

// ✅ GOOD: Single setState with batch
useUnifiedStudioStore.getState().setLoading(true);
useUnifiedStudioStore.getState().resetAll();
// Or use batched updates utility
import { unstable_batchedUpdates } from 'react-dom';
unstable_batchedUpdates(() => {
  setLoading(true);
  resetAll();
});
```

---

## Troubleshooting

### Issue: Component re-renders too frequently

**Diagnosis:**
```typescript
import { Profiler } from 'react';

<Profiler id="problem-component" onRender={(id, phase, actualDuration) => {
  console.log(`${id} rendered in ${actualDuration}ms`);
}}>
  <ProblemComponent />
</Profiler>
```

**Solutions:**
1. Check if parent is passing new function references (stabilize with `useCallback`)
2. Verify `React.memo` comparison function includes all changing props
3. Use shallow comparison for object/array selectors
4. Profile to identify actual bottlenecks

---

### Issue: Cache hit rate is low

**Diagnosis:**
```typescript
const metrics = getWaveformCacheMetrics();
console.log('Hit rate:', metrics.hitRate);
console.log('Total entries:', memoryCache.size);
```

**Solutions:**
1. Increase cache size (currently 20 entries for memory cache)
2. Check if cache keys are consistent (trackId vs URL)
3. Verify TTL isn't too short (7 days recommended)
4. Check browser storage limits (iOS Safari: ~50MB)

---

### Issue: RAF callbacks causing jank

**Diagnosis:**
```typescript
const throttled = useRAFThrottle(fn, { monitorPerformance: true });
// Check console for warnings like "Frame exceeded budget (18.42ms)"
```

**Solutions:**
1. Keep RAF callbacks under 5ms
2. Use CSS transforms (hardware accelerated) instead of width/height
3. Batch DOM reads, then batch DOM writes
4. Minimize state updates during RAF
5. Use `useRef` for visual-only updates (no re-render)

---

## Performance Benchmarks

**Target Metrics (Mid-range devices):**
- TrackList scroll: 60 FPS
- Mixer re-renders per volume change: 1 (from ~10)
- Waveform load (cached): <50ms (from ~500ms)
- Bundle size (studio): <180KB (from ~200KB)
- Memory (10 stems): <100MB (from ~150MB)

**Measurement:**
```bash
# Run bundle size check
npm run size

# Run performance benchmarks
npm run test:performance

# Run E2E tests
npm run test:e2e:mobile
```

---

**Quickstart Version**: 1.0.0
**Created**: 2026-01-07
**Status**: Ready for implementation
