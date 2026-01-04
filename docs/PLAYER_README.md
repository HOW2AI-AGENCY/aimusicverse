# Music Player System - Quick Start Guide

## Overview

The MusicVerse AI music player is a feature-rich, performant audio playback system built for the Telegram Mini App. This guide will help you quickly understand and use the player system.

## Quick Start

### Basic Player Usage

```typescript
import { usePlayerStore } from '@/hooks/usePlayerState';

function MyComponent() {
  const { 
    activeTrack,
    isPlaying,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack 
  } = usePlayerStore();

  return (
    <div>
      {activeTrack && <h2>{activeTrack.title}</h2>}
      <button onClick={() => playTrack(myTrack)}>Play</button>
      <button onClick={pauseTrack}>Pause</button>
      <button onClick={nextTrack}>Next</button>
      <button onClick={previousTrack}>Previous</button>
    </div>
  );
}
```

### Queue Management

```typescript
import { usePlaybackQueue } from '@/hooks/usePlaybackQueue';

function QueueManager() {
  const { 
    queue,
    addTrack,
    removeTrack,
    setQueue,
    clear 
  } = usePlaybackQueue();

  return (
    <div>
      <p>Queue has {queue.length} tracks</p>
      <button onClick={() => addTrack(track)}>Add to Queue</button>
      <button onClick={() => setQueue([track1, track2], 0)}>
        Play Playlist
      </button>
      <button onClick={clear}>Clear Queue</button>
    </div>
  );
}
```

### Audio Playback

```typescript
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

function CustomPlayer({ track }) {
  const {
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek
  } = useAudioPlayer({
    trackId: track.id,
    streamingUrl: track.streaming_url,
    localAudioUrl: track.local_audio_url,
    audioUrl: track.audio_url,
    onEnded: () => console.log('Track ended')
  });

  return (
    <div>
      <button onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <input 
        type="range" 
        value={currentTime} 
        max={duration}
        onChange={(e) => seek(Number(e.target.value))}
      />
      <span>{currentTime} / {duration}</span>
    </div>
  );
}
```

## Core Concepts

### Player State

The player state is managed by Zustand and includes:
- **activeTrack**: Currently playing/selected track
- **isPlaying**: Playback status
- **queue**: Array of tracks
- **currentIndex**: Position in queue
- **shuffle**: Shuffle mode enabled
- **repeat**: Repeat mode (off/all/one)
- **playerMode**: UI mode (minimized/compact/expanded/fullscreen)

### Audio Sources

The player supports multiple audio sources with automatic fallback:
1. **Streaming URL** (preferred): Optimized for streaming
2. **Local Audio URL**: Cached local file
3. **Audio URL**: Original source

### Playback Modes

- **Minimized**: Hidden, no UI
- **Compact**: Small bottom bar
- **Expanded**: Medium overlay
- **Fullscreen**: Full screen view

## Common Tasks

### Play a Track

```typescript
const { playTrack } = usePlayerStore();

// Play specific track
playTrack(track);

// Resume current track
playTrack();
```

### Manage Queue

```typescript
const { addTrack, addTracks, setQueue } = usePlaybackQueue();

// Add single track
addTrack(track, false); // Add to end
addTrack(track, true);  // Add and play now

// Add multiple tracks
addTracks([track1, track2], true); // Add and play first

// Replace entire queue
setQueue([track1, track2, track3], 0); // Start at index 0
```

### Handle Playback Modes

```typescript
const { shuffle, repeat, toggleShuffle, toggleRepeat } = usePlayerStore();

// Toggle shuffle
toggleShuffle(); // On/off

// Cycle repeat modes
toggleRepeat(); // off → all → one → off
```

### Change Player UI Mode

```typescript
const { playerMode, expandPlayer, minimizePlayer } = usePlayerStore();

expandPlayer();    // Show expanded player
minimizePlayer();  // Show compact player
```

## Advanced Features

### Performance Optimization

For better performance, use the optimized audio player:

```typescript
import { useOptimizedAudioPlayer } from '@/hooks/useOptimizedAudioPlayer';

function HighPerformancePlayer({ track, nextTrack }) {
  const player = useOptimizedAudioPlayer({
    trackId: track.id,
    streamingUrl: track.streaming_url,
    nextTrackUrl: nextTrack?.streaming_url,
    enablePreload: true // Preload next track
  });

  // Same API as regular player, but with:
  // - Debounced time updates
  // - Throttled progress updates
  // - Next track preloading
  // - Performance measurements
}
```

### Queue Persistence

Queue automatically saves to localStorage. To manually control:

```typescript
const { saveQueue, restoreQueue } = usePlaybackQueue();

// Manual save
saveQueue();

// Restore on app start
useEffect(() => {
  restoreQueue();
}, []);
```

### Error Handling

```typescript
const { error } = useOptimizedAudioPlayer({
  trackId: track.id,
  audioUrl: track.audio_url
});

if (error) {
  console.error('Playback error:', error);
  // Show error message to user
}
```

### Performance Monitoring

```typescript
import { markPerformance, calculateQueueMemory } from '@/lib/performance-utils';

// Measure operation time
const measure = markPerformance('queue-load');
loadQueue();
const duration = measure.end();
console.log('Loaded in', duration, 'ms');

// Monitor queue memory
const memStats = calculateQueueMemory(queue);
console.log('Queue size:', memStats.totalFormatted);
```

## Best Practices

### 1. Always Clean Up Audio

```typescript
useEffect(() => {
  return () => {
    // Audio elements are cleaned up automatically by hooks
    // But ensure you stop playback if needed
    pauseTrack();
  };
}, []);
```

### 2. Use Memoization for Expensive Operations

```typescript
const sortedQueue = useMemo(() => {
  return queue.sort((a, b) => a.title.localeCompare(b.title));
}, [queue]);
```

### 3. Handle Loading States

```typescript
const { loading, isPlaying } = useAudioPlayer({...});

if (loading) {
  return <Spinner />;
}
```

### 4. Provide User Feedback

```typescript
const { error } = useOptimizedAudioPlayer({...});

if (error) {
  toast.error(`Playback error: ${error}`);
}
```

### 5. Optimize for Mobile

```typescript
// Use touch-optimized controls
<button className="touch-manipulation h-11 w-11">
  Play
</button>

// Implement swipe gestures
<motion.div
  drag="y"
  onDragEnd={(e, info) => {
    if (info.offset.y > 50) onClose();
  }}
/>
```

## Components

### Pre-built Components

- **PlaybackControls**: Shuffle, prev, play/pause, next, repeat
- **ProgressBar**: Interactive progress bar with seek
- **VolumeControl**: Volume slider with mute
- **QueueSheet**: Drag-and-drop queue management
- **ExpandedPlayer**: Medium-sized player overlay

### Using Components

```typescript
import { PlaybackControls } from '@/components/player/PlaybackControls';
import { ProgressBar } from '@/components/player/ProgressBar';
import { VolumeControl } from '@/components/player/VolumeControl';

function MyPlayer() {
  const { currentTime, duration } = useAudioPlayer({...});
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  return (
    <div>
      <PlaybackControls size="medium" />
      
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        onSeek={(time) => seek(time)}
      />
      
      <VolumeControl
        volume={volume}
        muted={muted}
        onVolumeChange={setVolume}
        onMutedChange={setMuted}
      />
    </div>
  );
}
```

## Performance Tips

### 1. Reduce Re-renders

```typescript
// Use useCallback for event handlers
const handlePlay = useCallback(() => {
  playTrack(track);
}, [track, playTrack]);

// Memoize expensive computations
const trackInfo = useMemo(() => {
  return formatTrackInfo(track);
}, [track]);
```

### 2. Debounce Rapid Updates

```typescript
import { debounce } from '@/lib/performance-utils';

const debouncedSeek = useMemo(
  () => debounce((time) => seek(time), 100),
  [seek]
);
```

### 3. Use Virtual Scrolling for Large Queues

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={queue.length}
  itemSize={60}
>
  {({ index, style }) => (
    <div style={style}>
      {queue[index].title}
    </div>
  )}
</FixedSizeList>
```

### 4. Preload Next Track

```typescript
// Automatically enabled in useOptimizedAudioPlayer
const player = useOptimizedAudioPlayer({
  trackId: track.id,
  audioUrl: track.audio_url,
  nextTrackUrl: queue[currentIndex + 1]?.audio_url,
  enablePreload: true // Default: true
});
```

## Troubleshooting

### Audio Won't Play

1. Check audio source URLs
2. Verify user interaction (autoplay policy)
3. Check browser console for errors
4. Try different audio source

### Queue Not Persisting

1. Check localStorage is enabled
2. Verify not in private/incognito mode
3. Check storage quota
4. Clear corrupted data

### Performance Issues

1. Use `useOptimizedAudioPlayer`
2. Enable virtual scrolling for queues
3. Reduce update frequency with debouncing
4. Monitor memory usage

See [PLAYER_TROUBLESHOOTING.md](./PLAYER_TROUBLESHOOTING.md) for detailed solutions.

## API Reference

### Hooks

- `usePlayerStore()` - Main player state store
- `useAudioPlayer()` - Audio playback hook
- `useOptimizedAudioPlayer()` - Optimized audio playback
- `usePlaybackQueue()` - Queue management hook

### Utilities

- `player-utils.ts` - Player helper functions
- `performance-utils.ts` - Performance optimization utilities

See inline JSDoc comments in source files for detailed API documentation.

## Examples

### Full Player Implementation

```typescript
function FullPlayer() {
  const { 
    activeTrack, 
    isPlaying, 
    playTrack, 
    pauseTrack,
    nextTrack,
    previousTrack,
    playerMode,
    expandPlayer
  } = usePlayerStore();

  const { 
    currentTime, 
    duration,
    buffered,
    loading,
    seek 
  } = useAudioPlayer({
    trackId: activeTrack?.id || '',
    streamingUrl: activeTrack?.streaming_url,
    localAudioUrl: activeTrack?.local_audio_url,
    audioUrl: activeTrack?.audio_url,
  });

  if (!activeTrack) return null;

  return (
    <div className="player">
      {/* Track Info */}
      <div className="track-info">
        <img src={activeTrack.cover_url} alt={activeTrack.title} />
        <div>
          <h3>{activeTrack.title}</h3>
          <p>{activeTrack.style}</p>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        onSeek={seek}
      />

      {/* Controls */}
      <PlaybackControls size="medium" />

      {/* Expand Button */}
      <button onClick={expandPlayer}>
        Expand Player
      </button>
    </div>
  );
}
```

## Documentation

- **[Architecture](./PLAYER_ARCHITECTURE.md)**: Detailed system architecture
- **[Troubleshooting](./PLAYER_TROUBLESHOOTING.md)**: Common issues and solutions
- **[API Reference](../src/hooks/)**: Inline JSDoc documentation

## Contributing

When contributing to the player system:
1. Follow existing code patterns
2. Add JSDoc comments
3. Include tests
4. Update documentation
5. Test on multiple browsers
6. Verify mobile experience

## License

Part of MusicVerse AI project. See main LICENSE file.
