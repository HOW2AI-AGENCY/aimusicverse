# Sprint Implementation Guide - Sprints 008 & 009

**Target Audience:** Developers implementing Sprint 008 and 009  
**Created:** 2025-12-02  
**Status:** Living Document

---

## Table of Contents

1. [Sprint 008: Library & Player MVP](#sprint-008-library--player-mvp)
2. [Sprint 009: Track Details & Actions](#sprint-009-track-details--actions)
3. [Code Patterns & Best Practices](#code-patterns--best-practices)
4. [Testing Strategy](#testing-strategy)
5. [Common Pitfalls](#common-pitfalls)

---

## Sprint 008: Library & Player MVP

### User Story 1: Library Mobile Redesign (10 tasks)

#### Task Priority Matrix

| Priority | Tasks | Description |
|----------|-------|-------------|
| **P0 (Critical)** | US1-T01, T02, T03, T04, T06 | Core components and integration |
| **P1 (High)** | US1-T05, T07, T08 | Enhanced features |
| **P2 (Medium)** | US1-T09, T10 | Testing (optional) |

#### Implementation Order

```
Phase 1: Core Components (Days 1-2)
├── US1-T02: TrackRow Component (no dependencies)
├── US1-T03: VersionBadge Component (no dependencies)
├── US1-T05: TrackTypeIcons Component (no dependencies)
└── US1-T08: Skeleton Loaders (no dependencies)

Phase 2: Version Management (Days 2-3)
├── US1-T04: VersionSwitcher Component
│   └── Depends on: T03 (VersionBadge)
└── US1-T01: TrackCard Enhancement
    └── Depends on: T03, T05 (badges, icons)

Phase 3: Integration (Days 3-4)
├── US1-T07: Swipe Actions
│   └── Depends on: T01 (TrackCard)
└── US1-T06: Library Page Update
    └── Depends on: T01, T02, T04, T08

Phase 4: Testing (Day 5, optional)
├── US1-T09: Library Tests
└── US1-T10: Library E2E
```

#### Code Examples

**TrackRow Component (US1-T02)**

```tsx
// src/components/library/TrackRow.tsx
import type { Track } from '@/types/track';
import { Play, Pause, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TrackRowProps {
  track: Track;
  isPlaying?: boolean;
  onPlay?: () => void;
  onMoreActions?: () => void;
}

export function TrackRow({ 
  track, 
  isPlaying, 
  onPlay, 
  onMoreActions 
}: TrackRowProps) {
  return (
    <div className="flex items-center gap-3 h-16 px-4 hover:bg-accent/50 transition-colors">
      {/* Cover Image */}
      <img
        src={track.cover_url}
        alt={track.title}
        className="w-12 h-12 rounded object-cover"
        loading="lazy"
      />
      
      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {track.style || 'Unknown Style'}
        </p>
      </div>
      
      {/* Actions */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onPlay}
        className="h-11 w-11 touch-manipulation"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      <Button
        size="icon"
        variant="ghost"
        onClick={onMoreActions}
        className="h-11 w-11 touch-manipulation"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

**VersionBadge Component (US1-T03)**

```tsx
// src/components/library/VersionBadge.tsx
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface VersionBadgeProps {
  versionNumber: number;
  versionCount: number;
  isMaster: boolean;
  onClick?: () => void;
}

export function VersionBadge({
  versionNumber,
  versionCount,
  isMaster,
  onClick
}: VersionBadgeProps) {
  return (
    <Badge
      variant={isMaster ? 'default' : 'secondary'}
      className="text-xs cursor-pointer touch-manipulation min-h-[32px] px-3 gap-1"
      onClick={onClick}
    >
      {isMaster && <Star className="h-3 w-3 fill-current" />}
      v{versionNumber}
      {versionCount > 1 && ` (${versionCount})`}
    </Badge>
  );
}
```

**VersionSwitcher Component (US1-T04)**

```tsx
// src/components/library/VersionSwitcher.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { format } from 'date-fns';
import { Star } from 'lucide-react';

interface VersionSwitcherProps {
  trackId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVersionSelect?: (versionId: string) => void;
}

export function VersionSwitcher({
  trackId,
  open,
  onOpenChange,
  onVersionSelect
}: VersionSwitcherProps) {
  const { data: versions, isLoading } = useTrackVersions(trackId);

  const handleVersionSelect = (versionId: string) => {
    onVersionSelect?.(versionId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader>
          <SheetTitle>Select Version</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 mt-4 overflow-auto max-h-[calc(60vh-80px)]">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading versions...</div>
          ) : versions?.length === 0 ? (
            <div className="text-center text-muted-foreground">No versions found</div>
          ) : (
            versions?.map((version) => (
              <div
                key={version.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Version {version.version_type}</p>
                    {version.is_primary && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Master
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(version.created_at), 'MMM d, yyyy')}
                    {version.duration_seconds && ` • ${Math.floor(version.duration_seconds / 60)}:${String(Math.floor(version.duration_seconds % 60)).padStart(2, '0')}`}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={version.is_primary ? 'default' : 'outline'}
                  onClick={() => handleVersionSelect(version.id)}
                  className="touch-manipulation"
                >
                  {version.is_primary ? 'Current' : 'Use This'}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

### User Story 2: Player Mobile Optimization (12 tasks)

#### Implementation Order

```
Phase 1: Core Player Components (Days 1-2)
├── US2-T04: PlaybackControls Component (no dependencies)
├── US2-T05: ProgressBar Component (no dependencies)
└── US2-T07: QueueItem Component (no dependencies)

Phase 2: Player Modes (Days 2-3)
├── US2-T01: CompactPlayer Enhancement
├── US2-T02: ExpandedPlayer Component
└── US2-T03: FullscreenPlayer Enhancement

Phase 3: Queue Management (Days 3-4)
└── US2-T06: QueueSheet Component
    └── Depends on: T07 (QueueItem), @dnd-kit installed

Phase 4: Integration (Days 4-5)
├── US2-T09: Player State Management
├── US2-T10: Player Transitions
└── US2-T08: TimestampedLyrics Update

Phase 5: Testing (Day 5, optional)
├── US2-T11: Player Tests
└── US2-T12: Player E2E
```

#### Code Examples

**PlaybackControls Component (US2-T04)**

```tsx
// src/components/player/PlaybackControls.tsx
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  size?: 'compact' | 'medium' | 'large';
}

export function PlaybackControls({
  isPlaying,
  shuffle,
  repeat,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffleToggle,
  onRepeatToggle,
  size = 'medium'
}: PlaybackControlsProps) {
  const buttonSize = {
    compact: 'h-8 w-8',
    medium: 'h-11 w-11',
    large: 'h-14 w-14'
  }[size];

  const iconSize = {
    compact: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  }[size];

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Shuffle */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onShuffleToggle}
        className={cn(buttonSize, 'touch-manipulation')}
      >
        <Shuffle className={cn(iconSize, shuffle && 'text-primary')} />
      </Button>

      {/* Previous */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onPrevious}
        className={cn(buttonSize, 'touch-manipulation')}
      >
        <SkipBack className={iconSize} />
      </Button>

      {/* Play/Pause */}
      <Button
        size="icon"
        onClick={onPlayPause}
        className={cn(
          size === 'large' ? 'h-16 w-16' : size === 'medium' ? 'h-12 w-12' : 'h-10 w-10',
          'rounded-full touch-manipulation'
        )}
      >
        {isPlaying ? (
          <Pause className={iconSize} />
        ) : (
          <Play className={iconSize} />
        )}
      </Button>

      {/* Next */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onNext}
        className={cn(buttonSize, 'touch-manipulation')}
      >
        <SkipForward className={iconSize} />
      </Button>

      {/* Repeat */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onRepeatToggle}
        className={cn(buttonSize, 'touch-manipulation')}
      >
        <Repeat className={cn(iconSize, repeat !== 'off' && 'text-primary')} />
      </Button>
    </div>
  );
}
```

**ProgressBar Component (US2-T05)**

```tsx
// src/components/player/ProgressBar.tsx
import { Slider } from '@/components/ui/slider';
import { formatDuration } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function ProgressBar({ current, duration, onSeek }: ProgressBarProps) {
  const handleValueChange = (value: number[]) => {
    onSeek(value[0]);
  };

  const percentage = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Slider with touch-friendly area */}
      <div className="px-2 py-4 -my-4">
        <Slider
          value={[current]}
          max={duration}
          step={1}
          onValueChange={handleValueChange}
          className="touch-manipulation"
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDuration(current)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
}

// Helper function if not exists
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
```

**QueueSheet Component (US2-T06)**

```tsx
// src/components/player/QueueSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { QueueItem } from './QueueItem';
import type { Track } from '@/types/track';
import { Trash2 } from 'lucide-react';

interface QueueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: Track[];
  currentIndex: number;
  onReorder: (newQueue: Track[]) => void;
  onRemove: (index: number) => void;
  onClearQueue: () => void;
}

export function QueueSheet({
  open,
  onOpenChange,
  queue,
  currentIndex,
  onReorder,
  onRemove,
  onClearQueue
}: QueueSheetProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((track) => track.id === active.id);
      const newIndex = queue.findIndex((track) => track.id === over.id);

      const newQueue = arrayMove(queue, oldIndex, newIndex);
      onReorder(newQueue);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Queue ({queue.length})</SheetTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearQueue}
              className="touch-manipulation"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-4 overflow-auto max-h-[calc(70vh-80px)]">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={queue.map((track) => track.id)}
              strategy={verticalListSortingStrategy}
            >
              {queue.map((track, index) => (
                <QueueItem
                  key={track.id}
                  track={track}
                  isCurrentTrack={index === currentIndex}
                  onRemove={() => onRemove(index)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Code Patterns & Best Practices

### 1. Touch-Friendly Design

```tsx
// ✅ Good: Minimum 44x44px touch target
<Button className="h-11 w-11 touch-manipulation">
  <Icon />
</Button>

// ❌ Bad: Too small for touch
<Button className="h-6 w-6">
  <Icon />
</Button>
```

### 2. Haptic Feedback (Telegram)

```tsx
import { useTelegram } from '@/hooks/useTelegram';

function Component() {
  const { hapticFeedback } = useTelegram();

  const handleAction = () => {
    hapticFeedback('impact', 'medium'); // light, medium, heavy
    // Perform action
  };
}
```

### 3. Responsive Layout

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {tracks.map(track => <TrackCard key={track.id} track={track} />)}
</div>
```

### 4. Loading States

```tsx
if (isLoading) {
  return <SkeletonLoader count={8} type="card" />;
}

if (error) {
  return <ErrorMessage message="Failed to load tracks" />;
}

return <TrackList tracks={data} />;
```

### 5. Optimistic Updates

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const likeMutation = useMutation({
  mutationFn: (trackId: string) => likeTrack(trackId),
  onMutate: async (trackId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['tracks']);
    
    // Snapshot previous value
    const previousTracks = queryClient.getQueryData(['tracks']);
    
    // Optimistically update
    queryClient.setQueryData(['tracks'], (old) => {
      return old.map(track =>
        track.id === trackId ? { ...track, liked: true } : track
      );
    });
    
    return { previousTracks };
  },
  onError: (err, trackId, context) => {
    // Rollback on error
    queryClient.setQueryData(['tracks'], context.previousTracks);
  },
});
```

---

## Testing Strategy

### Unit Tests

```tsx
// src/components/library/__tests__/TrackRow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackRow } from '../TrackRow';

describe('TrackRow', () => {
  const mockTrack = {
    id: '1',
    title: 'Test Track',
    style: 'Rock',
    cover_url: 'https://example.com/cover.jpg',
  };

  it('renders track information', () => {
    render(<TrackRow track={mockTrack} />);
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Rock')).toBeInTheDocument();
  });

  it('calls onPlay when play button clicked', () => {
    const onPlay = jest.fn();
    render(<TrackRow track={mockTrack} onPlay={onPlay} />);
    
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/library.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Library Page', () => {
  test('should switch between grid and list view', async ({ page }) => {
    await page.goto('/library');
    
    // Default is grid view
    await expect(page.locator('.grid')).toBeVisible();
    
    // Switch to list view
    await page.click('text=List');
    await expect(page.locator('.space-y-2')).toBeVisible();
    
    // Switch back to grid
    await page.click('text=Grid');
    await expect(page.locator('.grid')).toBeVisible();
  });
  
  test('should open version switcher', async ({ page }) => {
    await page.goto('/library');
    
    // Click version badge
    await page.click('[data-testid="version-badge"]');
    
    // Version switcher should be visible
    await expect(page.locator('text=Select Version')).toBeVisible();
  });
});
```

---

## Common Pitfalls

### 1. Gesture Conflicts

**Problem:** Swipe gestures conflict with scrolling

**Solution:**
```tsx
// Set threshold for swipe detection
const SWIPE_THRESHOLD = 50; // pixels

const handleDragEnd = (event, { offset }) => {
  if (Math.abs(offset.x) > SWIPE_THRESHOLD) {
    // Horizontal swipe - perform action
    if (offset.x < 0) handleSwipeLeft();
    else handleSwipeRight();
  }
  // Else: not enough distance, ignore
};
```

### 2. Performance with Large Lists

**Problem:** Rendering 1000+ tracks causes lag

**Solution:**
```tsx
// Use react-window for virtualization
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={tracks.length}
  itemSize={64}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TrackRow track={tracks[index]} />
    </div>
  )}
</FixedSizeList>
```

### 3. Memory Leaks in Subscriptions

**Problem:** Realtime subscriptions not cleaned up

**Solution:**
```tsx
useEffect(() => {
  const subscription = supabase
    .channel('track-updates')
    .on('postgres_changes', { ... }, handleUpdate)
    .subscribe();

  // Cleanup
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 4. Race Conditions in State Updates

**Problem:** Multiple async operations updating same state

**Solution:**
```tsx
// Use React Query's staleTime and cacheTime
useQuery({
  queryKey: ['tracks'],
  queryFn: fetchTracks,
  staleTime: 5000, // Don't refetch for 5 seconds
  cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
});
```

---

## Resources

- **Framer Motion Docs:** https://www.framer.com/motion/
- **DnD Kit Docs:** https://docs.dndkit.com/
- **Telegram Mini Apps:** https://core.telegram.org/bots/webapps
- **shadcn/ui Components:** https://ui.shadcn.com/
- **React Query:** https://tanstack.com/query/latest

---

**Last Updated:** 2025-12-02  
**Contributors:** GitHub Copilot Agent
