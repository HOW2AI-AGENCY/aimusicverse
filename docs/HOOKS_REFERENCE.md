# MusicVerse AI - Hooks Reference Guide

**Last Updated**: 2026-01-04
**Total Hooks**: 263 custom hooks
**Total Lines of Code**: ~48,812 lines

---

## Table of Contents

1. [Overview](#overview)
2. [Audio System Hooks](#audio-system-hooks)
3. [Studio & Production Hooks](#studio--production-hooks)
4. [Generation Hooks](#generation-hooks)
5. [Social & Engagement Hooks](#social--engagement-hooks)
6. [UI/UX Hooks](#uiux-hooks)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)

---

## Overview

MusicVerse AI uses a comprehensive hook-based architecture with **263 custom hooks** organized into **13 categories**. This guide documents the most important hooks and their usage patterns.

### Hook Categories

| Category | Count | Description |
|----------|-------|-------------|
| Audio System | 25+ | Player state, playback, visualization |
| Studio & Production | 28+ | Multi-track, effects, rendering |
| Generation | 8+ | Music generation and progress tracking |
| Lyrics & Music Recognition | 5+ | Lyrics extraction, MIDI transcription |
| Analysis & Instruments | 8+ | Melody, guitar, drums analysis |
| Audio Reference & Stems | 6+ | Reference management, stem separation |
| Generation Features | 12+ | PromptDJ, predictive generation |
| Social & Engagement | 8+ | Following, comments, likes |
| User Systems | 15+ | Credits, rewards, gamification, admin |
| UI & UX | 15+ | Mobile, gestures, hints, keyboard |
| Analytics & Tracking | 10+ | Analytics, playback tracking |
| Telegram Integration | 8+ | Mini app, storage, haptics |
| Data & Persistence | 10+ | Projects, tracks, moderation |

---

## Audio System Hooks

### usePlayerStore
**Location**: `src/hooks/audio/usePlayerState.ts`
**Type**: Zustand Store
**Lines**: ~200

Central player state management with localStorage persistence.

```typescript
import { usePlayerStore } from '@/hooks/audio/usePlayerState';

function PlayerControls() {
  const {
    activeTrack,
    isPlaying,
    volume,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    setVolume,
  } = usePlayerStore();

  return (
    <div>
      <button onClick={() => isPlaying ? pauseTrack() : playTrack(activeTrack)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        value={volume * 100}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
      />
    </div>
  );
}
```

**State Shape**:
```typescript
interface PlayerState {
  activeTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  volume: number;
}
```

**Actions**:
- `playTrack(track)` - Start playing a track
- `pauseTrack()` - Pause current track
- `nextTrack()` - Skip to next track
- `previousTrack()` - Go to previous track
- `seekTo(time)` - Seek to specific time
- `setVolume(volume)` - Set volume (0-1)
- `addToQueue(track)` - Add track to queue

---

### usePlaybackQueue
**Location**: `src/hooks/audio/usePlaybackQueue.ts`
**Lines**: ~150

Advanced queue management with localStorage persistence.

```typescript
import { usePlaybackQueue } from '@/hooks/audio/usePlaybackQueue';

function QueueManager() {
  const {
    queue,
    currentIndex,
    addTrack,
    removeTrack,
    playNext,
    clearQueue,
    shuffleQueue,
  } = usePlaybackQueue();

  const handleAddToQueue = (track: Track) => {
    addTrack(track, false); // false = don't play now
    toast.success('Added to queue');
  };

  const handlePlayNext = (track: Track) => {
    playNext(track); // Insert after current track
    toast.success('Will play next');
  };

  return (
    <div>
      {queue.map((track, index) => (
        <QueueItem
          key={track.id}
          track={track}
          isActive={index === currentIndex}
          onRemove={() => removeTrack(index)}
        />
      ))}
    </div>
  );
}
```

**Features**:
- Add tracks to queue
- Play next (insert after current)
- Remove from queue
- Shuffle queue
- Clear queue
- Auto-persistence to localStorage

---

### useOptimizedAudioPlayer
**Location**: `src/hooks/audio/useOptimizedAudioPlayer.tsx`
**Lines**: 375

High-performance audio player with caching and prefetching.

```typescript
import { useOptimizedAudioPlayer } from '@/hooks/audio/useOptimizedAudioPlayer';

function AudioPlayer() {
  const {
    play,
    pause,
    seek,
    setVolume,
    prefetchNextTracks,
    cacheStatus,
  } = useOptimizedAudioPlayer({
    enablePrefetch: true,
    enableCache: true,
    crossfadeDuration: 0.3,
  });

  useEffect(() => {
    // Prefetch next 2 tracks in queue
    prefetchNextTracks(2);
  }, [queue]);

  return (
    <div>
      <p>Cache: {cacheStatus.size}MB / {cacheStatus.maxSize}MB</p>
      <p>Cached tracks: {cacheStatus.count}</p>
    </div>
  );
}
```

**Options**:
```typescript
interface OptimizedAudioPlayerOptions {
  enablePrefetch?: boolean;  // Prefetch next tracks
  enableCache?: boolean;     // Cache audio in IndexedDB
  crossfadeDuration?: number; // Crossfade in seconds
  maxCacheSize?: number;     // Max cache size in MB
}
```

**Features**:
- IndexedDB audio caching (500MB max)
- LRU eviction strategy
- Automatic prefetching
- Crossfade between tracks
- Buffer monitoring
- Network status awareness

---

### useWaveform
**Location**: `src/hooks/audio/useWaveform.ts`
**Lines**: ~200

Waveform visualization using WaveSurfer.js.

```typescript
import { useWaveform } from '@/hooks/audio/useWaveform';

function WaveformVisualizer({ audioUrl }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isReady,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
  } = useWaveform({
    container: containerRef.current,
    url: audioUrl,
    waveColor: '#4F46E5',
    progressColor: '#818CF8',
    height: 128,
  });

  return (
    <div>
      <div ref={containerRef} />
      <p>{currentTime.toFixed(2)} / {duration.toFixed(2)}</p>
    </div>
  );
}
```

---

### useAudioVisualizer
**Location**: `src/hooks/audio/useAudioVisualizer.ts`
**Lines**: ~180

Real-time frequency visualization using Web Audio API.

```typescript
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';

function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useAudioVisualizer({
    audioElement: audioRef.current,
    canvasElement: canvasRef.current,
    fftSize: 256,
    smoothingTimeConstant: 0.8,
    barColor: '#4F46E5',
    barGap: 2,
  });

  return <canvas ref={canvasRef} width={800} height={200} />;
}
```

**Options**:
- `fftSize`: 128, 256, 512, 1024, 2048 (frequency resolution)
- `smoothingTimeConstant`: 0-1 (smoothing factor)
- `barColor`: CSS color
- `barGap`: Spacing between bars

---

## Studio & Production Hooks

### useStemAudioEngine
**Location**: `src/hooks/studio/useStemAudioEngine.ts`
**Lines**: ~320

Multi-track stem playback with synchronization.

```typescript
import { useStemAudioEngine } from '@/hooks/studio/useStemAudioEngine';

function StemStudio({ stems }) {
  const {
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
    setStemVolume,
    setStemMute,
    setStemSolo,
  } = useStemAudioEngine(stems);

  return (
    <div>
      {stems.map(stem => (
        <StemControl
          key={stem.id}
          stem={stem}
          onVolumeChange={(vol) => setStemVolume(stem.id, vol)}
          onMuteToggle={() => setStemMute(stem.id)}
          onSoloToggle={() => setStemSolo(stem.id)}
        />
      ))}
    </div>
  );
}
```

**Features**:
- Synchronized playback of multiple stems
- Drift detection and auto-correction (0.1s threshold)
- Individual stem volume control
- Mute/Solo functionality
- Master clock synchronization

---

### useAudioEffectsChain
**Location**: `src/hooks/studio/useAudioEffectsChain.ts`
**Lines**: ~280

Real-time audio effects processing using Tone.js.

```typescript
import { useAudioEffectsChain } from '@/hooks/studio/useAudioEffectsChain';

function EffectsPanel({ stemId }) {
  const {
    effects,
    addEffect,
    removeEffect,
    updateEffect,
    bypassEffect,
  } = useAudioEffectsChain(stemId);

  const handleAddReverb = () => {
    addEffect({
      type: 'reverb',
      params: {
        roomSize: 0.8,
        dampening: 3000,
        wet: 0.3,
      },
    });
  };

  return (
    <div>
      <button onClick={handleAddReverb}>Add Reverb</button>
      {effects.map(effect => (
        <EffectControl
          key={effect.id}
          effect={effect}
          onUpdate={(params) => updateEffect(effect.id, params)}
          onBypass={() => bypassEffect(effect.id)}
          onRemove={() => removeEffect(effect.id)}
        />
      ))}
    </div>
  );
}
```

**Available Effects**:
- EQ (3-band)
- Compression
- Reverb
- Delay
- Distortion
- Filter (low-pass, high-pass, band-pass)
- Limiter

---

### useMixExport
**Location**: `src/hooks/studio/useMixExport.ts`
**Lines**: 372

Export mixed stems to various formats.

```typescript
import { useMixExport } from '@/hooks/studio/useMixExport';

function ExportButton({ stems, stemControls }) {
  const {
    isExporting,
    progress,
    exportMix,
  } = useMixExport();

  const handleExport = async () => {
    const blob = await exportMix({
      stems,
      stemControls,
      format: 'wav',
      bitrate: 320,
      sampleRate: 44100,
    });

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mix.wav';
    a.click();
  };

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? `Exporting ${progress}%` : 'Export Mix'}
    </button>
  );
}
```

**Formats**:
- WAV (lossless)
- MP3 (320kbps)
- OGG (variable quality)

---

### useLoopRegion
**Location**: `src/hooks/studio/useLoopRegion.ts`
**Lines**: ~240

Loop region management for studio timeline.

```typescript
import { useLoopRegion } from '@/hooks/studio/useLoopRegion';

function LoopControls() {
  const {
    loopEnabled,
    loopStart,
    loopEnd,
    setLoop,
    clearLoop,
    toggleLoop,
  } = useLoopRegion();

  const handleSetLoop = () => {
    setLoop({
      start: 10.5,  // seconds
      end: 30.2,
    });
  };

  return (
    <div>
      <button onClick={toggleLoop}>
        Loop: {loopEnabled ? 'ON' : 'OFF'}
      </button>
      {loopEnabled && (
        <p>Loop: {loopStart}s - {loopEnd}s</p>
      )}
    </div>
  );
}
```

---

### useUndoRedo
**Location**: `src/hooks/studio/useUndoRedo.ts`
**Lines**: ~200

Undo/Redo state management for studio.

```typescript
import { useUndoRedo } from '@/hooks/studio/useUndoRedo';

function StudioEditor() {
  const {
    state,
    canUndo,
    canRedo,
    setState,
    undo,
    redo,
    reset,
  } = useUndoRedo({
    initialState: defaultStudioState,
    maxHistory: 50,
  });

  const handleChange = (newState) => {
    setState(newState); // Adds to history
  };

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

---

## Generation Hooks

### useGenerateForm
**Location**: `src/hooks/generation/useGenerateForm.ts`
**Lines**: ~180

Form state management for music generation.

```typescript
import { useGenerateForm } from '@/hooks/generation/useGenerateForm';

function GenerateSheet() {
  const {
    formData,
    isValid,
    errors,
    updateField,
    submit,
    reset,
  } = useGenerateForm();

  const handleSubmit = async () => {
    if (!isValid) return;

    const result = await submit();
    if (result.success) {
      toast.success('Generation started!');
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <input
        value={formData.prompt}
        onChange={(e) => updateField('prompt', e.target.value)}
      />
      {errors.prompt && <span>{errors.prompt}</span>}
    </form>
  );
}
```

---

### useGenerateDraft
**Location**: `src/hooks/generation/useGenerateDraft.ts`
**Lines**: ~120

Auto-save form drafts to localStorage with 30-minute expiry.

```typescript
import { useGenerateDraft } from '@/hooks/generation/useGenerateDraft';

function GenerateForm() {
  const {
    draft,
    saveDraft,
    clearDraft,
    hasDraft,
  } = useGenerateDraft();

  // Auto-save on change
  useEffect(() => {
    saveDraft(formData);
  }, [formData]);

  // Restore on mount
  useEffect(() => {
    if (hasDraft && confirm('Restore previous draft?')) {
      setFormData(draft);
    }
  }, []);

  return <div>...</div>;
}
```

---

### useActiveGenerations
**Location**: `src/hooks/generation/useActiveGenerations.ts`
**Lines**: ~150

Track active generation tasks with real-time updates.

```typescript
import { useActiveGenerations } from '@/hooks/generation/useActiveGenerations';

function GenerationMonitor() {
  const {
    activeGenerations,
    completedCount,
    failedCount,
    cancelGeneration,
  } = useActiveGenerations();

  return (
    <div>
      <h3>Active Generations: {activeGenerations.length}</h3>
      {activeGenerations.map(gen => (
        <GenerationCard
          key={gen.id}
          generation={gen}
          onCancel={() => cancelGeneration(gen.id)}
        />
      ))}
    </div>
  );
}
```

---

## Social & Engagement Hooks

### useFollow
**Location**: `src/hooks/social/useFollow.ts`
**Lines**: ~140

Follow/unfollow users with optimistic updates.

```typescript
import { useFollow } from '@/hooks/social/useFollow';

function FollowButton({ userId }) {
  const {
    isFollowing,
    isLoading,
    follow,
    unfollow,
  } = useFollow(userId);

  const handleToggle = async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  return (
    <button onClick={handleToggle} disabled={isLoading}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}
```

**Features**:
- Optimistic UI updates
- Haptic feedback
- Rate limiting
- Error rollback

---

### useLikeTrack
**Location**: `src/hooks/engagement/useLikeTrack.ts`
**Lines**: ~130

Like/unlike tracks with animation and optimistic updates.

```typescript
import { useLikeTrack } from '@/hooks/engagement/useLikeTrack';

function LikeButton({ track }) {
  const {
    isLiked,
    likesCount,
    toggleLike,
  } = useLikeTrack(track.id);

  return (
    <button onClick={toggleLike}>
      <Heart filled={isLiked} />
      <span>{likesCount}</span>
    </button>
  );
}
```

---

### useComments
**Location**: `src/hooks/comments/useComments.ts`
**Lines**: ~200

Threaded comments with real-time updates.

```typescript
import { useComments } from '@/hooks/comments/useComments';

function CommentsSection({ trackId }) {
  const {
    comments,
    isLoading,
    addComment,
    deleteComment,
    likeComment,
  } = useComments(trackId);

  const handleSubmit = async (content: string, parentId?: string) => {
    await addComment({
      content,
      parent_id: parentId,
    });
  };

  return (
    <div>
      {comments.map(comment => (
        <CommentThread
          key={comment.id}
          comment={comment}
          onReply={(content) => handleSubmit(content, comment.id)}
          onDelete={() => deleteComment(comment.id)}
          onLike={() => likeComment(comment.id)}
        />
      ))}
    </div>
  );
}
```

**Features**:
- 5-level threading
- @mentions
- Real-time updates via Supabase
- Optimistic updates

---

## UI/UX Hooks

### useHaptic
**Location**: `src/hooks/useHaptic.ts`
**Lines**: ~80

Haptic feedback for mobile devices.

```typescript
import { useHaptic } from '@/hooks/useHaptic';

function InteractiveButton() {
  const { isAvailable, patterns } = useHaptic();

  const handleClick = () => {
    if (isAvailable) {
      patterns.tap();  // Light impact
    }
    // ... action
  };

  const handleDelete = () => {
    patterns.delete();  // Heavy impact
    // ... delete action
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

**Available Patterns**:
- `tap()` - Light impact
- `success()` - Success notification
- `error()` - Error notification
- `warning()` - Warning notification
- `select()` - Selection changed
- `delete()` - Heavy impact
- `toggle()` - Medium impact

---

### useSwipeGesture
**Location**: `src/hooks/useSwipeGesture.ts`
**Lines**: ~150

Swipe gesture detection for mobile.

```typescript
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

function SwipeableCard({ onSwipeLeft, onSwipeRight }) {
  const { handlers, swipeDirection, swipeProgress } = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: 100,  // pixels
    velocity: 0.3,   // pixels per ms
  });

  return (
    <div {...handlers} style={{ transform: `translateX(${swipeProgress}px)` }}>
      <p>Swipe me!</p>
    </div>
  );
}
```

---

### useKeyboardAware
**Location**: `src/hooks/useKeyboardAware.ts`
**Lines**: ~100

Handle virtual keyboard on mobile devices.

```typescript
import { useKeyboardAware } from '@/hooks/useKeyboardAware';

function ChatInput() {
  const {
    keyboardHeight,
    isKeyboardOpen,
  } = useKeyboardAware();

  return (
    <div
      style={{
        paddingBottom: keyboardHeight,
        transition: 'padding 0.3s',
      }}
    >
      <input type="text" />
    </div>
  );
}
```

---

## Best Practices

### 1. Always Cleanup Effects

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Update logic
  }, 1000);

  // Always cleanup
  return () => clearInterval(interval);
}, [dependencies]);
```

### 2. Use Optimistic Updates

```typescript
const likeMutation = useMutation({
  mutationFn: likeTrack,
  onMutate: async (trackId) => {
    // Optimistic update
    queryClient.setQueryData(['track', trackId], (old) => ({
      ...old,
      likes_count: old.likes_count + 1,
    }));
  },
  onError: (err, vars, context) => {
    // Rollback on error
    queryClient.setQueryData(['track', vars.trackId], context.previous);
  },
});
```

### 3. Memoize Expensive Computations

```typescript
const filteredTracks = useMemo(() => {
  return tracks.filter(/* expensive filter */);
}, [tracks, filterCriteria]);
```

### 4. Use Dependency Injection

```typescript
// Good - testable with mock
export function useAudioLevel(mediaStream: MediaStream | null) {
  // ...
}

// Bad - hard to test
export function useAudioLevel() {
  const mediaStream = useMediaStream(); // Hard-coded dependency
  // ...
}
```

### 5. Proper Error Handling

```typescript
const { data, error, isError, isLoading } = useQuery({
  queryKey: ['tracks'],
  queryFn: fetchTracks,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

---

## Common Patterns

### Pattern 1: Optimistic Update with Rollback

```typescript
export function useOptimisticUpdate<T>({
  initialData,
  updateFn,
  onSuccess,
  onError,
}: Options<T>) {
  const [state, setState] = useState({ data: initialData, isOptimistic: false });
  const previousDataRef = useRef(initialData);

  const update = useCallback(async (newData: T) => {
    previousDataRef.current = state.data;
    setState({ data: newData, isOptimistic: true });

    try {
      const confirmedData = await updateFn(newData);
      setState({ data: confirmedData, isOptimistic: false });
      onSuccess?.(confirmedData);
    } catch (error) {
      setState({ data: previousDataRef.current, isOptimistic: false });
      onError?.(error, previousDataRef.current);
    }
  }, [state.data, updateFn, onSuccess, onError]);

  return { data: state.data, isOptimistic: state.isOptimistic, update };
}
```

### Pattern 2: Debounced State

```typescript
import { useDebouncedValue } from 'use-debounce';

export function useDebouncedSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm] = useDebouncedValue(searchTerm, 300);

  const { data: results } = useQuery({
    queryKey: ['search', debouncedTerm],
    queryFn: () => searchTracks(debouncedTerm),
    enabled: debouncedTerm.length > 0,
  });

  return { searchTerm, setSearchTerm, results };
}
```

### Pattern 3: Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;

    const delay = 1000 * (4 - attempts);
    await new Promise(resolve => setTimeout(resolve, delay));

    return retryWithBackoff(fn, attempts - 1);
  }
}
```

---

## Hook Dependencies

**Avoid Circular Dependencies**

```typescript
// ❌ BAD - circular dependency
// hooks/audio/index.ts
export * from './usePlayerState';
export * from './useAudioPlayer';

// ✅ GOOD - direct imports
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useAudioPlayer } from '@/hooks/audio/useAudioPlayer';
```

---

**For implementation details of specific hooks, see the source code in `/src/hooks/`**

**Last Updated**: 2026-01-04
