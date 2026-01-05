# Quickstart Guide: UI Architecture Refactoring

**Feature**: 001-ui-refactor
**Last Updated**: 2026-01-06

This guide helps developers use the refactored UI components and hooks after the consolidation is complete.

---

## Table of Contents

1. [Using Consolidated Components](#using-consolidated-components)
2. [Using Extracted Hooks](#using-extracted-hooks)
3. [Naming Conventions](#naming-conventions)
4. [Mobile Component Guidelines](#mobile-component-guidelines)
5. [Running and Testing](#running-and-testing)

---

## Using Consolidated Components

### UnifiedTrackCard

The new `UnifiedTrackCard` replaces 5 duplicate track card implementations. Use it for all track displays.

**Basic Usage**:

```typescript
import { UnifiedTrackCard } from '@/components/track/track-card';

function TrackList({ tracks }: { tracks: Track[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tracks.map((track) => (
        <UnifiedTrackCard
          key={track.id}
          variant="grid"
          track={track}
          onPlay={handlePlay}
        />
      ))}
    </div>
  );
}
```

**Variants**:

```typescript
// Grid layout (default)
<UnifiedTrackCard variant="grid" track={track} />

// List layout
<UnifiedTrackCard variant="list" track={track} />

// Compact layout (for tight spaces)
<UnifiedTrackCard variant="compact" track={track} />

// Minimal layout (no actions)
<UnifiedTrackCard variant="minimal" track={track} />

// Enhanced (with social features)
<UnifiedTrackCard
  variant="enhanced"
  track={track}
  onFollow={handleFollow}
  onShare={handleShare}
  onAddToPlaylist={handleAddToPlaylist}
/>

// Professional (with MIDI status)
<UnifiedTrackCard
  variant="professional"
  track={track}
  midiStatus={{ hasMidi: true, hasPdf: false }}
/>
```

**Type Safety**:

```typescript
// TypeScript enforces variant-specific props
<UnifiedTrackCard
  variant="enhanced"  // ✅ Allows onFollow, onShare
  track={track}
  onFollow={handleFollow}
/>

// ❌ Error: onFollow not valid for 'grid' variant
<UnifiedTrackCard
  variant="grid"
  track={track}
  onFollow={handleFollow}  // Type error!
/>
```

### SkeletonLoader

The consolidated skeleton system replaces 3 duplicate skeleton files.

**Basic Usage**:

```typescript
import { Skeletons } from '@/components/ui/skeleton-loader';

function TrackListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Skeletons.TrackCard layout="grid" count={6} />
    </div>
  );
}
```

**Available Skeletons**:

```typescript
// Track skeletons
<Skeletons.TrackCard layout="grid" count={6} />
<Skeletons.TrackList layout="list" count={10} />
<Skeletons.TrackCard layout="compact" count={8} />

// Player skeletons
<Skeletons.Player />
<Skeletons.PlayerCompact />

// Layout skeletons
<Skeletons.Grid columns={3} count={9} />
<Skeletons.Carousel count={5} />

// Form skeletons
<Skeletons.Form fieldCount={5} showActions />

// Utility skeletons
<Skeletons.Text lines={3} />
<Skeletons.Circle size={40} />
```

**Motion Preferences**:

```typescript
// Skeletons automatically respect prefers-reduced-motion
// No manual configuration needed
<Skeletons.TrackCard /> // Animations disabled for users who prefer reduced motion
```

### ResponsiveModal

Use `ResponsiveModal` for adaptive modals (Sheet on mobile, Dialog on desktop).

**Basic Usage**:

```typescript
import { ResponsiveModal } from '@/components/ui/responsive-modal';

function ShareDialog({ track }: { track: Track }) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveModal open={open} onOpenChange={setOpen}>
      <ResponsiveModalContent>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Share Track</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        {/* Share options */}
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
```

**Modal Selection Guide**:

| Use Case | Component | Example |
|----------|-----------|---------|
| Destructive confirmations | `AlertDialog` | Delete track, account deletion |
| Simple quick actions | `Dialog` | Rename, quick settings |
| Details and forms | `Sheet` | Track details, settings panel |
| Adaptive modals | `ResponsiveModal` | Complex forms, rich content |

---

## Using Extracted Hooks

### useTrackData

Data fetching hook with TanStack Query caching.

**Basic Usage**:

```typescript
import { useTrackData } from '@/hooks/track/use-track-data';

function LibraryPage() {
  const { tracks, isLoading, error, fetchNextPage } = useTrackData({
    userId: user?.id,
    limit: 20,
  });

  if (isLoading) return <Skeletons.TrackList />;
  if (error) return <Error message={error.message} />;

  return (
    <VirtualizedTrackList
      tracks={tracks}
      onLoadMore={fetchNextPage}
    />
  );
}
```

**Parameters**:

```typescript
useTrackData({
  userId?: string;           // Filter by user
  isPublic?: boolean;        // Public tracks only
  limit?: number;            // Pagination limit (default: 20)
  offset?: number;           // Pagination offset
  genres?: string[];         // Filter by genres
  moods?: string[];          // Filter by moods
  searchQuery?: string;      // Search query
})
```

**Return Value**:

```typescript
{
  tracks: Track[];           // Fetched tracks
  isLoading: boolean;        // Initial loading state
  isFetching: boolean;       // Background refetching
  error: Error | null;       // Error object
  refetch: () => void;       // Manual refetch
  hasNextPage: boolean;      // More pages available
  fetchNextPage: () => void; // Load next page
  totalCount?: number;       // Total matching tracks
}
```

### useTrackActions

Action hook for track operations with optimistic updates.

**Basic Usage**:

```typescript
import { useTrackActions } from '@/hooks/track/use-track-actions';

function TrackCard({ track }: { track: Track }) {
  const { likeTrack, shareTrack, deleteTrack, isPending } = useTrackActions({
    trackId: track.id,
  });

  return (
    <div>
      <button onClick={() => likeTrack()}>Like</button>
      <button onClick={() => shareTrack('telegram')}>Share</button>
      <button onClick={() => deleteTrack()}>Delete</button>
    </div>
  );
}
```

**Available Actions**:

```typescript
{
  likeTrack: () => Promise<void>;
  unlikeTrack: () => Promise<void>;
  shareTrack: (platform: 'telegram' | 'twitter' | 'clipboard') => Promise<void>;
  deleteTrack: () => Promise<void>;
  addToPlaylist: (playlistId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string) => Promise<void>;
  remixTrack: () => Promise<void>;
  downloadTrack: () => Promise<void>;
  isPending: boolean;        // Any action in progress
  error: Error | null;       // Last error
}
```

### useTrackVersionSwitcher

Hook for switching between A/B track versions.

**Basic Usage**:

```typescript
import { useTrackVersionSwitcher } from '@/hooks/track/use-track-version-switcher';

function VersionSwitcher({ trackId }: { trackId: string }) {
  const { activeVersion, allVersions, switchVersion, isPending } =
    useTrackVersionSwitcher({ trackId });

  return (
    <div>
      {allVersions.map((version) => (
        <button
          key={version.id}
          onClick={() => switchVersion(version.id)}
          disabled={isPending}
        >
          {version.version_label}
        </button>
      ))}
    </div>
  );
}
```

### useRealtimeTrackUpdates

Real-time subscription hook for track updates.

**Basic Usage**:

```typescript
import { useRealtimeTrackUpdates } from '@/hooks/track/use-realtime-track-updates';

function TrackCard({ track }: { track: Track }) {
  const { data, isConnected } = useRealtimeTrackUpdates({
    trackId: track.id,
    enabled: true,
    onUpdate: (update) => {
      console.log('Track updated:', update);
    },
  });

  return <div>{/* Track display */}</div>;
}
```

**Note**: Cleanup happens automatically on unmount. No need to manually unsubscribe.

---

## Naming Conventions

### File Names

All component files use **kebab-case**:

```
✓ track-card.tsx
✓ mobile-header-bar.tsx
✓ voice-input-button.tsx

✗ TrackCard.tsx
✗ MobileHeaderBar.tsx
✗ voiceInputButton.tsx
```

### Export Names

All component exports use **PascalCase**:

```typescript
// track-card.tsx
export function TrackCard() {}

// mobile-header-bar.tsx
export function MobileHeaderBar() {}

// voice-input-button.tsx
export function VoiceInputButton() {}
```

### Hook Names

Hook files and exports use **camelCase** with `use` prefix:

```typescript
// use-track-data.ts
export const useTrackData = () => {}

// use-player-state.ts
export const usePlayerState = () => {}
```

### Import Paths

Use `@/` alias for all imports:

```typescript
// ✅ Correct
import { TrackCard } from '@/components/track/track-card';
import { useTrackData } from '@/hooks/track/use-track-data';

// ❌ Incorrect
import { TrackCard } from '../../components/track/track-card';
```

---

## Mobile Component Guidelines

### When to Create Separate Mobile* Components

Create a separate `Mobile*` component when:

- Complex gesture interactions (swipe, pinch, multi-touch)
- Different UI paradigm (bottom sheet, tab-based interface)
- Performance-critical with mobile-optimized rendering
- Haptic feedback integration required
- Touch-optimized layouts (thumb-reachable zones, 44px+ targets)
- Mobile-specific state management
- Feature-rich interface (studio, lyrics editor)

**Example**:

```typescript
// ✅ Good: Complex mobile studio interface
export function MobileStudioLayout({ /* ... */ } {
  // Mobile-specific implementation
  // Touch gestures, haptic feedback, etc.
}

// ✅ Good: Complex mobile lyrics editor
export function MobileLyricsEditor({ /* ...*/ } {
  // Mobile-optimized editing interface
}
```

### When to Use Responsive Components

Use responsive components when:

- Simple layout changes (stack vs. flex, spacing adjustments)
- Conditional elements (show/hide based on breakpoint)
- Text scaling (font size, padding adjustments)
- Media queries for basic responsive design
- Minor component variants
- Form fields
- List items
- Simple modals

**Example**:

```typescript
// ✅ Good: Simple button with mobile size
export function ResponsiveButton({ children, className }) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md',
        isMobile && 'h-12 touch-manipulation',
        className
      )}
    >
      {children}
    </button>
  );
}
```

### Touch Target Requirements

All interactive elements must meet **44-56px minimum** touch targets:

```typescript
// ✅ Correct: Meets touch target requirement
<button className="h-12 min-w-[44px]">Click</button>

// ❌ Incorrect: Too small for touch
<button className="h-6 w-6">Click</button>
```

### Haptic Feedback

Provide haptic feedback for all user interactions on mobile:

```typescript
import { HapticFeedback } from '@telegram-apps/sdk';

function handleTap() {
  // Light haptic for button taps
  HapticFeedback.impactOccurred('light');
}

function handleSwipe() {
  // Medium haptic for swipe actions
  HapticFeedback.impactOccurred('medium');
}

function handleError() {
  // Error haptic for failures
  HapticFeedback.notificationOccurred('error');
}

function handleSuccess() {
  // Success haptic for completions
  HapticFeedback.notificationOccurred('success');
}
```

---

## Running and Testing

### Development Server

```bash
# Start development server
npm run dev

# Server runs on http://localhost:5173
```

### Bundle Size Monitoring

```bash
# Check bundle size
npm run size

# Detailed analysis
npm run size:why

# Visualize bundle
npm run visualizer
```

**Important**: Bundle must stay under **950 KB** (constitution requirement).

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests for specific hook
npm test useTrackData

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run mobile E2E tests
npm run test:e2e:mobile
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix

# Check file naming conventions
npm run lint -- --rule check-file/filename-naming-convention
```

---

## Migration Examples

### Migrating from Old Components

**Before** (using duplicate components):

```typescript
// Using old TrackCard
import { TrackCard } from '@/components/TrackCard';

<TrackCard track={track} layout="grid" />

// Using old MinimalTrackCard
import { MinimalTrackCard } from '@/components/library/MinimalTrackCard';

<MinimalTrackCard track={track} />

// Using old PublicTrackCard
import { PublicTrackCard } from '@/components/home/PublicTrackCard';

<PublicTrackCard track={track} onFollow={handleFollow} />
```

**After** (using UnifiedTrackCard):

```typescript
import { UnifiedTrackCard } from '@/components/track/track-card';

// Grid variant (replaces TrackCard with layout="grid")
<UnifiedTrackCard variant="grid" track={track} />

// Minimal variant (replaces MinimalTrackCard)
<UnifiedTrackCard variant="minimal" track={track} />

// Enhanced variant (replaces PublicTrackCard with follow)
<UnifiedTrackCard
  variant="enhanced"
  track={track}
  onFollow={handleFollow}
/>
```

### Migrating from Old Skeletons

**Before**:

```typescript
import { TrackCardSkeleton } from '@/components/ui/skeleton-loader';

<TrackCardSkeleton layout="grid" count={6} />
```

**After**:

```typescript
import { Skeletons } from '@/components/ui/skeleton-loader';

<Skeletons.TrackCard layout="grid" count={6} />
```

---

## Common Patterns

### Pattern 1: Loading with Skeletons

```typescript
function TrackList() {
  const { tracks, isLoading } = useTrackData({ userId: user?.id });

  if (isLoading) {
    return <Skeletons.TrackList layout="grid" count={6} />;
  }

  return <VirtualizedTrackList tracks={tracks} />;
}
```

### Pattern 2: Error Handling

```typescript
function TrackList() {
  const { tracks, isLoading, error } = useTrackData({ userId: user?.id });

  if (isLoading) return <Skeletons.TrackList />;
  if (error) return <ErrorMessage error={error} />;

  return <VirtualizedTrackList tracks={tracks} />;
}
```

### Pattern 3: Infinite Scroll

```typescript
function TrackList() {
  const { tracks, fetchNextPage, hasNextPage } = useTrackData({
    userId: user?.id,
    limit: 20,
  });

  return (
    <Virtuoso
      data={tracks}
      endReached={() => hasNextPage && fetchNextPage()}
      itemContent={(index, track) => <UnifiedTrackCard variant="list" track={track} />}
    />
  );
}
```

### Pattern 4: Optimistic Updates

```typescript
function LikeButton({ trackId }: { trackId: string }) {
  const { likeTrack, unlikeTrack, isPending } = useTrackActions({ trackId });

  return (
    <button
      onClick={() => likeTrack()}  // Optimistic update + API call
      disabled={isPending}
    >
      Like
    </button>
  );
}
```

---

## Getting Help

- **Documentation**: See [docs/](../../docs/) for detailed architecture docs
- **Constitution**: See [.specify/memory/constitution.md](../../.specify/memory/constitution.md) for principles
- **Component Examples**: See [src/components/](../../src/components/) for usage examples
- **Issues**: Report bugs via GitHub Issues

---

## Checklist for New Components

Before creating new components, ensure:

- [ ] File name uses kebab-case
- [ ] Export name uses PascalCase
- [ ] Component follows shadcn/ui patterns
- [ ] Touch targets are 44-56px minimum (mobile)
- [ ] Haptic feedback provided (mobile)
- [ ] Motion preferences respected
- [ ] Lazy loading used for heavy components
- [ ] Uses `cn()` utility for className merging
- [ ] Imports use `@/` alias
- [ ] TypeScript strict mode enabled
- [ ] Unit tests included (for hooks)
- [ ] Bundle size impact measured

---

**Last Updated**: 2026-01-06
**Version**: 1.0.0
