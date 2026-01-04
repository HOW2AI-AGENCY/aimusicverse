# Music Player Architecture Documentation

## Overview

MusicVerse AI's music player is a comprehensive audio playback system built with React, TypeScript, and Zustand. It provides advanced features including queue management, multiple playback modes, streaming support, and persistent state.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│  ┌──────────────┐                        ┌──────────────┐  │
│  │   Compact    │                        │  Fullscreen  │  │
│  │    Player    │                        │    Player    │  │
│  └──────────────┘                        └──────────────┘  │
│         │                                        │          │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
├───────────────────────────┼─────────────────────────────────┤
│                    Component Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Playback    │  │   Progress   │  │   Volume     │     │
│  │  Controls    │  │     Bar      │  │   Control    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │    Queue     │  │   Queue      │                       │
│  │    Sheet     │  │    Item      │                       │
│  └──────────────┘  └──────────────┘                       │
│                           │                                 │
├───────────────────────────┼─────────────────────────────────┤
│                       Hook Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   usePlayer  │  │useAudioPlayer│  │usePlayback   │     │
│  │    State     │  │              │  │    Queue     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
├───────────────────────────┼─────────────────────────────────┤
│                      State Layer                            │
│  ┌────────────────────────────────────────────────┐        │
│  │         Zustand Store (usePlayerStore)         │        │
│  │  - Active Track                                │        │
│  │  - Queue Management                            │        │
│  │  - Playback State                              │        │
│  │  - Player Modes                                │        │
│  └────────────────────────────────────────────────┘        │
│                           │                                 │
├───────────────────────────┼─────────────────────────────────┤
│                    Storage Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  localStorage│  │   Telegram   │  │  HTML5 Audio │     │
│  │   (Queue)    │  │ CloudStorage │  │   Element    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. State Management (`usePlayerState.ts`)

The central state store using Zustand. Manages all player state and provides actions for state manipulation.

**Key State:**
- `activeTrack`: Currently playing/selected track
- `isPlaying`: Playback status (playing/paused)
- `queue`: Array of tracks in playback order
- `currentIndex`: Position in queue
- `shuffle`: Shuffle mode enabled/disabled
- `repeat`: Repeat mode (off/all/one)
- `playerMode`: UI display mode (minimized/compact/fullscreen)

**Key Actions:**
- `playTrack(track?)`: Play specific track or resume
- `pauseTrack()`: Pause playback
- `nextTrack()`: Skip to next with shuffle/repeat support
- `previousTrack()`: Skip to previous
- `addToQueue(track)`: Add track to queue
- `removeFromQueue(index)`: Remove track at index
- `clearQueue()`: Clear entire queue
- `reorderQueue(from, to)`: Reorder queue items
- `toggleShuffle()`: Toggle shuffle mode
- `toggleRepeat()`: Cycle repeat modes

**State Persistence:**
- Queue saved to localStorage automatically
- Restored on app initialization
- Includes queue data and playback state

### 2. Audio Playback (`useAudioPlayer.tsx`)

Low-level audio playback hook that manages HTML5 Audio element.

**Features:**
- Multi-source priority (streaming → local → original)
- Automatic source fallback on error
- Buffering progress tracking
- Playback position tracking
- Volume control
- Lifecycle management

**Audio Source Priority:**
1. **Streaming URL**: Optimized CDN delivery (preferred)
2. **Local Audio URL**: Cached local file (fallback)
3. **Audio URL**: Original source (last resort)

**Events Handled:**
- `loadedmetadata`: Duration available
- `timeupdate`: Playback progress
- `progress`: Buffer progress
- `canplay`: Ready to play
- `waiting`: Buffering
- `play/pause/ended`: State changes
- `error`: Automatic fallback

**Memory Management:**
- Audio element cleaned up on unmount
- Event listeners properly removed
- Source reset to release resources

### 3. Queue Management (`usePlaybackQueue.ts`)

High-level queue operations and persistence.

**Features:**
- Add single or multiple tracks
- Remove tracks with index adjustment
- Reorder via drag-and-drop
- Set entire queue
- Jump to specific track
- Shuffle with current track preservation
- Automatic localStorage persistence

**Queue Operations:**
- `addTrack(track, playNow)`: Add track, optionally play immediately
- `addTracks(tracks, playFirst)`: Batch add tracks
- `setQueue(tracks, startIndex)`: Replace entire queue
- `removeTrack(index)`: Remove with smart index handling
- `reorder(from, to)`: Drag-and-drop reordering
- `jumpToTrack(index)`: Play specific queue position

**Persistence Strategy:**
- Queue and state saved separately
- Auto-save on any change
- Validation on restore
- Error handling for storage issues

## Player Components

### PlaybackControls

Main control buttons: shuffle, previous, play/pause, next, repeat.

**Features:**
- Responsive sizing (compact/medium/large)
- Touch-optimized hit areas
- Visual feedback for active modes
- Accessibility support

### ProgressBar

Interactive progress indicator with seek functionality.

**Features:**
- Current/total time display
- Buffer progress visualization
- Click/drag to seek
- Touch-optimized interaction area
- Smooth dragging experience

### VolumeControl

Volume slider with mute toggle.

**Features:**
- Volume slider (0-100%)
- Mute/unmute with memory
- Dynamic volume icons
- localStorage persistence
- Visual feedback

### QueueSheet

Bottom sheet displaying playback queue.

**Features:**
- Drag-and-drop reordering (@dnd-kit)
- Current track highlighting
- Remove track functionality
- Clear all option
- Empty state message

## Player Modes

### 1. Minimized
- Player hidden
- No UI visible
- Default state when no track active

### 2. Compact
- Small bar at bottom
- Basic controls visible (play/pause, next)
- Track info and progress bar
- Action buttons (like, download, close) expandable
- Swipe up to open fullscreen
- Auto-opens when playing

### 3. Fullscreen
- Full screen takeover
- Large cover art with animated background
- All playback controls
- Lyrics display with synchronized highlighting
- Version switcher for A/B tracks
- Queue management
- Maximum immersion
- Swipe down or tap close to return to compact mode

## Data Flow

### Playing a Track

```
User clicks track
    ↓
Component calls playTrack(track)
    ↓
usePlayerStore updates state
    ↓
useAudioPlayer creates/updates Audio element
    ↓
Audio element starts playback
    ↓
Event listeners update state (time, buffer, etc.)
    ↓
Components re-render with new state
```

### Queue Persistence

```
Queue changes (add/remove/reorder)
    ↓
usePlayerStore state updates
    ↓
usePlaybackQueue effect triggers
    ↓
saveQueueToStorage called
    ↓
Data saved to localStorage
    ↓
On app restart:
    ↓
restoreQueueFromStorage called
    ↓
Queue and state restored
    ↓
Player ready with previous queue
```

### Source Fallback

```
Audio element loads streaming URL
    ↓
Error occurs (network, CORS, etc.)
    ↓
Error handler catches event
    ↓
Tries local URL if available
    ↓
If fails, tries original URL
    ↓
If all fail, error state displayed
```

## Performance Optimizations

### Audio Element Management
- Single Audio element per track
- Proper cleanup on unmount
- Event listener cleanup
- Source reset to release memory

### State Updates
- Zustand provides efficient re-renders
- useCallback for stable function references
- Local state in components when appropriate
- Debouncing for rapid updates (seek, volume)

### Queue Persistence
- Separate storage for queue data and state
- Error handling for quota exceeded
- Validation on restore
- Only save when queue has content

### Component Rendering
- Memoization where needed
- Conditional rendering
- Lazy loading for heavy components
- Touch-optimized interaction areas

## Error Handling

### Audio Playback Errors
- Automatic source fallback
- User-friendly error messages
- Console logging for debugging
- Graceful degradation

### Storage Errors
- QuotaExceededError handling
- Parse error recovery
- Validation on restore
- Silent failures (don't break UX)

### Queue Operations
- Bounds checking
- Index validation
- Type validation
- Safe array operations

## Accessibility

### ARIA Labels
- All buttons have aria-label
- aria-pressed for toggles
- aria-valuemin/max/now for sliders
- role="slider" for progress bar

### Keyboard Support
- Buttons keyboard accessible
- Drag-and-drop keyboard support (@dnd-kit)
- Focus management
- Tab order optimization

### Touch Optimization
- Larger hit areas (touch-manipulation)
- Proper pointer events
- Swipe gestures
- Haptic feedback (where available)

## Storage Strategy

### localStorage
- Queue persistence
- Volume preference
- Player state
- ~5MB limit (browser dependent)

### Telegram CloudStorage
- User preferences sync
- Cross-device support
- Fallback to localStorage
- Limited to small data

### Audio Caching
- Streaming URL (CDN)
- Local cached files
- Original URL backup
- Browser cache utilized

## Future Enhancements

### Potential Improvements
- [ ] Preload next track in queue
- [ ] Crossfade between tracks
- [ ] Equalizer/audio effects
- [ ] Gapless playback
- [ ] Picture-in-Picture mode
- [ ] Media session API integration
- [ ] Background audio (PWA)
- [ ] Download for offline playback
- [ ] Lyrics synchronization
- [ ] Collaborative queue

### Performance
- [ ] Virtual scrolling for large queues
- [ ] Web Worker for audio processing
- [ ] IndexedDB for large queue storage
- [ ] Service Worker caching
- [ ] Lazy load player components

## Troubleshooting

### Common Issues

**Audio not playing:**
- Check source URLs are valid
- Verify CORS headers
- Check browser autoplay policy
- Ensure user interaction occurred

**Queue not persisting:**
- Check localStorage quota
- Verify not in private/incognito mode
- Check browser storage settings
- Clear corrupted storage data

**Buffering issues:**
- Check network connection
- Verify streaming URL quality
- Try local source fallback
- Check server response time

**Seek not working:**
- Ensure duration loaded (loadedmetadata)
- Check if source is seekable
- Verify time range validity
- Check for CORS issues

## API Reference

See inline JSDoc comments in source files for detailed API documentation:
- `src/hooks/usePlayerState.ts` - State management
- `src/hooks/useAudioPlayer.tsx` - Audio playback
- `src/hooks/usePlaybackQueue.ts` - Queue operations
- `src/lib/player-utils.ts` - Utility functions

## Development Guidelines

### Adding New Features
1. Update state interface if needed
2. Add actions to Zustand store
3. Create/update components
4. Add tests
5. Update documentation

### Code Style
- Use TypeScript strictly
- Add JSDoc comments
- Follow existing patterns
- Handle errors gracefully
- Add accessibility support

### Testing
- Test playback scenarios
- Test queue operations
- Test persistence
- Test error handling
- Test accessibility

## Related Documentation

- [Project README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Database Schema](./database-schema.md)
- [Suno API Integration](./suno-api.md)
