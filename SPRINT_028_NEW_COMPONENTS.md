# 📦 Sprint 028: New Components & Hooks

This document provides quick reference for components and hooks added in Sprint 028.

---

## 🎣 useHintTracking Hook

**File:** `src/hooks/useHintTracking.ts`

### Purpose
Manages tooltip/hint state with localStorage persistence. Shows hints once per user, with ability to reset.

### Usage

#### Basic Usage
```typescript
import { useHintTracking, HINT_IDS } from '@/hooks/useHintTracking';

function MyComponent() {
  const { hasSeenHint, markAsSeen } = useHintTracking(HINT_IDS.SWIPE_GESTURE);
  
  return (
    <>
      {!hasSeenHint && (
        <Tooltip onOpen={markAsSeen}>
          <TooltipContent>
            💡 Swipe left or right for quick actions
          </TooltipContent>
        </Tooltip>
      )}
      <TrackCard />
    </>
  );
}
```

#### Multiple Hints
```typescript
const { seenHints, markHintAsSeen } = useMultipleHints([
  'hint-1',
  'hint-2',
  'hint-3'
]);

if (!seenHints['hint-1']) {
  // Show hint-1
  markHintAsSeen('hint-1');
}
```

#### Global Operations
```typescript
import { resetAllHints, getSeenHints } from '@/hooks/useHintTracking';

// In Settings
<Button onClick={resetAllHints}>
  Reset All Hints
</Button>

// Check what's been seen
const seen = getSeenHints(); // ['swipe-gesture', 'version-badge', ...]
```

### Predefined Hint IDs
```typescript
import { HINT_IDS } from '@/hooks/useHintTracking';

HINT_IDS.SWIPE_GESTURE        // Track card swipe actions
HINT_IDS.VERSION_BADGE        // Version switching
HINT_IDS.WAVEFORM_SEEK        // Seek by clicking waveform
HINT_IDS.TRACK_MENU          // Track action menu
HINT_IDS.QUEUE_MANAGEMENT    // Queue features
HINT_IDS.REPEAT_MODES        // Repeat/shuffle modes
HINT_IDS.STEM_MIXING         // Stem studio mixing
HINT_IDS.EFFECTS_PANEL       // Audio effects
HINT_IDS.QUICK_PRESETS       // Quick generation presets
HINT_IDS.REFERENCE_AUDIO     // Reference audio upload
HINT_IDS.SHARE_OPTIONS       // Sharing methods
HINT_IDS.PLAYLIST_CREATION   // Playlist creation
```

### API Reference

#### `useHintTracking(hintId: string)`
Returns:
- `hasSeenHint: boolean` - Whether hint was seen
- `markAsSeen: () => void` - Mark hint as seen
- `resetHint: () => void` - Reset this specific hint

#### `useMultipleHints(hintIds: string[])`
Returns:
- `seenHints: Record<string, boolean>` - Map of hint IDs to seen status
- `markHintAsSeen: (hintId: string) => void` - Mark specific hint as seen

#### `resetAllHints(): void`
Clears all hint states from localStorage.

#### `getSeenHints(): string[]`
Returns array of all seen hint IDs.

---

## 📤 ShareSheet Component

**File:** `src/components/ShareSheet.tsx`

### Purpose
Enhanced sharing component with 4 methods: Telegram chat, Telegram Story, clipboard, and QR codes.

### Usage

```typescript
import { ShareSheet } from '@/components/ShareSheet';

function TrackActions({ track }) {
  const [shareOpen, setShareOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShareOpen(true)}>
        <Share2 />
        Share
      </Button>
      
      <ShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        item={{
          id: track.id,
          title: track.title,
          artist: track.artist_name,
          style: track.style,
          coverUrl: track.image_url,
          audioUrl: track.audio_url,
        }}
        itemType="track" // or 'playlist' or 'artist'
      />
    </>
  );
}
```

### Features

#### 1. Share to Telegram Chat
- Native `shareURL` API integration
- Rich text preview with emoji
- Deep link to app

#### 2. Share to Telegram Story
- Requires cover image
- Widget link with "Слушать в MusicVerse" button
- Only available if Stories supported in user's Telegram version

#### 3. Copy Link
- Clipboard API with fallback for older browsers
- Toast confirmation
- Deep link format: `https://t.me/AIMusicVerseBot/app?startapp=track_{id}`

#### 4. QR Code
- 256x256 high-quality QR code
- Lazy loaded (reduces initial bundle size)
- Download as PNG
- Inline preview

### Props

```typescript
interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    title: string;
    artist?: string;
    style?: string;
    coverUrl?: string;
    audioUrl?: string;
  };
  itemType?: 'track' | 'playlist' | 'artist';
}
```

### Deep Link Format

```
https://t.me/AIMusicVerseBot/app?startapp={itemType}_{id}

Examples:
- https://t.me/AIMusicVerseBot/app?startapp=track_abc123
- https://t.me/AIMusicVerseBot/app?startapp=playlist_xyz789
- https://t.me/AIMusicVerseBot/app?startapp=artist_def456
```

### Share Text Format

```
🎵 Track Title
👤 Artist Name
🎼 Music Style

✨ Создано в MusicVerse AI
🔗 [deep link]
```

---

## 🎵 Audio Element Pool

**File:** `src/lib/audioElementPool.ts`

### Purpose
Manages audio elements to prevent iOS Safari crashes (6-8 element limit). Priority-based allocation ensures important stems load first.

### Usage

#### Basic Usage (Already Integrated in StemStudioContent)
```typescript
import { audioElementPool, AudioPriority, AudioElementPool } from '@/lib/audioElementPool';

// Determine priority based on stem type
const priority = AudioElementPool.getPriorityForStemType(stem.stem_type);

// Acquire audio element
const audio = audioElementPool.acquire(`stem-${stem.id}`, priority);

if (!audio) {
  toast.error('Audio limit reached');
  return;
}

// Configure and use
audio.src = stem.audio_url;
audio.play();

// Release when done (in cleanup)
audioElementPool.release(`stem-${stem.id}`);
```

#### Priority System
```typescript
AudioPriority.HIGH    // 3 - Vocals, lead, main, melody
AudioPriority.MEDIUM  // 2 - Bass, drums, rhythm, guitar
AudioPriority.LOW     // 1 - Other, ambient, FX
```

#### Get Priority for Stem Type
```typescript
const priority = AudioElementPool.getPriorityForStemType('vocals');     // HIGH
const priority = AudioElementPool.getPriorityForStemType('bass');       // MEDIUM
const priority = AudioElementPool.getPriorityForStemType('other');      // LOW
```

#### Pool Statistics
```typescript
const stats = audioElementPool.getStats();
console.log(stats);
// {
//   poolSize: 2,
//   activeSize: 4,
//   totalCapacity: 6,
//   available: 2,
//   activeElements: [...]
// }
```

### How It Works

1. **Acquisition:** Request audio element with ID and priority
2. **Allocation:** 
   - Return existing element if already allocated
   - Take from pool if available
   - Create new if under limit
   - Evict lower priority if at limit
3. **Release:** Clean up and return to pool
4. **Cleanup:** Automatic on component unmount

### Integration Example

```typescript
useEffect(() => {
  const audioElements: Record<string, HTMLAudioElement> = {};
  
  stems.forEach(stem => {
    const priority = AudioElementPool.getPriorityForStemType(stem.stem_type);
    const audio = audioElementPool.acquire(`stem-${stem.id}`, priority);
    
    if (audio) {
      audio.src = stem.audio_url;
      audioElements[stem.id] = audio;
    }
  });
  
  return () => {
    // Cleanup
    Object.keys(audioElements).forEach(stemId => {
      audioElementPool.release(`stem-${stemId}`);
    });
  };
}, [stems]);
```

---

## 🎮 Gesture System

**File:** `src/hooks/useGestures.ts` (Already Exists)

### Purpose
Unified gesture handling for mobile interactions: double-tap, long-press, swipe, pinch.

### Usage

```typescript
import { useGestures } from '@/hooks/useGestures';

function TrackCard({ track }) {
  const { gestureHandlers } = useGestures({
    onSwipeLeft: () => handleDelete(track.id),
    onSwipeRight: () => handleFavorite(track.id),
    onLongPress: () => showContextMenu(track.id),
    onDoubleTap: () => handleLike(track.id),
    swipeThreshold: 50,    // pixels
    longPressDelay: 500,   // milliseconds
  });
  
  return (
    <div {...gestureHandlers}>
      <TrackCover />
    </div>
  );
}
```

### Gesture Types

- `onSwipeLeft` - Swipe left gesture
- `onSwipeRight` - Swipe right gesture  
- `onSwipeUp` - Swipe up gesture
- `onSwipeDown` - Swipe down gesture
- `onPinch` - Two-finger pinch/zoom (receives scale)
- `onLongPress` - Press and hold
- `onDoubleTap` - Quick double tap

### Configuration

- `swipeThreshold: number` - Min distance in pixels (default: 50)
- `longPressDelay: number` - Hold duration in ms (default: 500)

---

## 💀 Skeleton Components

**File:** `src/components/ui/skeleton-components.tsx` (Already Exists)

### Purpose
Loading state components with shimmer animations for consistent UX.

### Available Components

```typescript
import {
  TrackCardSkeleton,
  TrackCardSkeletonCompact,
  PlayerSkeleton,
  ListItemSkeleton,
  GridSkeleton,
  CarouselSkeleton,
  SectionHeaderSkeleton,
  FormSkeleton,
  StatsWidgetSkeleton,
  ProfileHeaderSkeleton,
  WaveformSkeleton,
  PlaylistCoverSkeleton,
  ArtistCardSkeleton,
} from '@/components/ui/skeleton-components';
```

### Usage Examples

#### Track Card Grid
```typescript
{isLoading ? (
  <GridSkeleton count={6} columns={2} />
) : (
  <TrackGrid tracks={tracks} />
)}
```

#### Horizontal Carousel
```typescript
{isLoading ? (
  <CarouselSkeleton count={4} />
) : (
  <TrackCarousel tracks={tracks} />
)}
```

#### Player
```typescript
<AnimatePresence mode="wait">
  {isLoadingTrack ? (
    <PlayerSkeleton />
  ) : (
    <Player track={track} />
  )}
</AnimatePresence>
```

---

## 📚 Additional Resources

### Sprint Documentation
- [Sprint 028 Plan](SPRINT_028_UI_UX_OPTIMIZATION.md)
- [Sprint 028 Completion Report](SPRINT_028_COMPLETION_REPORT.md)
- [Sprint Status](SPRINT_STATUS.md)

### Related Hooks
- `useKeyboardAware` - Keyboard-aware UI handling
- `useHapticFeedback` - Telegram haptic feedback
- `useTelegram` - Telegram Mini App context

### Component Integration
All new components follow existing patterns:
- TypeScript strict mode
- Error handling with logging
- Haptic feedback integration
- Responsive design
- Accessibility considerations

---

*Last Updated: 2025-12-22*  
*Sprint: 028 - UI/UX Optimization*
