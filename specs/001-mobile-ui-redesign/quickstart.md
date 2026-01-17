# Quickstart: Mobile-First Minimalist UI Redesign

**Feature**: Mobile-First Minimalist UI Redesign
**Branch**: `001-mobile-ui-redesign`
**Date**: 2026-01-17

## Overview

This quickstart guide helps developers understand the redesigned UI system and begin implementing the mobile-first minimalist design changes.

---

## Design System Summary

### Spacing (8px Grid)

| Tailwind Class | Pixels | Use Case |
|----------------|--------|----------|
| `gap-2` | 8px | Small elements, icon-label spacing |
| `gap-4` | 16px | Default spacing between related items |
| `gap-6` | 24px | Section spacing |
| `gap-8` | 32px | Major section breaks |
| `gap-12` | 48px | Screen-level spacing |

### Typography

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| H1 | `text-2xl` (24px) | `font-semibold` (600) | Page titles |
| H2 | `text-xl` (20px) | `font-semibold` (600) | Section headers |
| H3 | `text-base` (16px) | `font-medium` (500) | Subsection headers |
| Body | `text-sm` (14px) | `font-normal` (400) | Default text |
| Caption | `text-xs` (12px) | `font-normal` (400) | Metadata |

### Colors (Semantic)

| Purpose | CSS Variable | Tailwind |
|---------|--------------|---------|
| Generate (Creation) | `--generate` | `bg-generate` |
| Library (Tracks) | `--library` | `bg-library` |
| Projects (Studio) | `--projects` | `bg-projects` |
| Community (Social) | `--community` | `bg-community` |

### Border Radius

| Element | Class | Pixels |
|---------|-------|--------|
| Default | `rounded-lg` | 8px |
| Large cards | `rounded-xl` | 12px |
| Small elements | `rounded-md` | 6px |
| Buttons | `rounded-full` | Pill |

### Touch Targets

| Element | Min Height |
|---------|------------|
| Buttons | 44px |
| List items | 44px |
| Tabs | 48px |
| FAB | 56px |

---

## Component Quick Reference

### 1. MobileHeaderBar

Standard page header for all screens.

```tsx
import { MobileHeaderBar } from '@/components/mobile/MobileHeaderBar';

<MobileHeaderBar
  title="Page Title"
  subtitle="Optional subtitle"
  showBackButton={true}
  actions={[
    { icon: Search, onPress: () => {} },
    { icon: MoreVertical, onPress: () => {} }
  ]}
/>
```

**Props**:
- `title`: Page title (required)
- `subtitle`: Optional subtitle
- `showBackButton`: Show back button (default: auto-detect)
- `actions`: Array of action buttons (max 2)

---

### 2. UnifiedTrackCard

Single track card component for all list/grid views.

```tsx
import { UnifiedTrackCard } from '@/components/shared/UnifiedTrackCard';

<UnifiedTrackCard
  variant="list" // 'minimal' | 'list' | 'grid'
  track={track}
  isPlaying={currentTrackId === track.id}
  onPlay={() => playTrack(track.id)}
  onPress={() => openTrackDetail(track.id)}
  onLike={() => likeTrack(track.id)}
/>
```

**Variants**:
- `minimal`: Title + style + duration + play button (72-80px height)
- `list`: Adds metadata (plays, likes, date)
- `grid`: Square aspect ratio with cover art

---

### 3. MobileBottomSheet

Bottom sheet for forms, menus, detail views.

```tsx
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

<MobileBottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  snapPoints={[0.25, 0.5, 0.9]}
  initialSnap={0.5}
>
  <SheetContent />
</MobileBottomSheet>
```

**Usage patterns**:
- Forms (generation, playlist creation)
- Menus (track actions, settings)
- Filters (library sorting, genre selection)
- Detail views (track info, artist profile)

---

### 4. BottomNavigation

Bottom navigation with 4 tabs + FAB.

```tsx
import { BottomNavigation } from '@/components/BottomNavigation';

<BottomNavigation
  activeTab="home"
  onTabChange={(tab) => navigate(tab)}
  badgeCounts={{ more: 3 }}
/>
```

**Tabs**: home, library, projects, more

---

### 5. GenerateForm

Simplified generation form with collapsible advanced options.

```tsx
import { GenerateForm } from '@/components/generate-form/GenerateForm';

<GenerateForm
  mode="simple" // 'simple' | 'advanced'
  initialValues={{ prompt: '', styleId: '' }}
  onSubmit={handleSubmit}
  isSubmitting={isPending}
/>
```

**Simple mode**: Prompt input + Style selector
**Advanced mode**: + Lyrics, reference audio, custom tags

---

## Common Patterns

### Pattern 1: Page with Header + Content + Bottom Nav

```tsx
export function MyPage() {
  return (
    <PageLayout>
      <MobileHeaderBar
        title="My Page"
        showBackButton
      />
      <ScrollView className="pb-safe-bottom">
        {/* Page content */}
      </ScrollView>
      <BottomNavigation activeTab="my-page" />
    </PageLayout>
  );
}
```

### Pattern 2: List with Pull-to-Refresh

```tsx
import { VirtualizedTrackList } from '@/components/library/VirtualizedTrackList';

<VirtualizedTrackList
  tracks={tracks}
  isLoading={isLoading}
  onRefresh={refetch}
  onEndReached={loadMore}
  hasMore={hasMore}
  renderTrack={(track) => (
    <UnifiedTrackCard
      variant="list"
      track={track}
      onPlay={() => playTrack(track.id)}
    />
  )}
/>
```

### Pattern 3: Bottom Sheet Form

```tsx
const [isOpen, setIsOpen] = useState(false);

<>
  <Button onPress={() => setIsOpen(true)}>Open Form</Button>

  <MobileBottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
    <GenerateForm
      mode="simple"
      onSubmit={handleSubmit}
    />
  </MobileBottomSheet>
</>
```

### Pattern 4: Loading Skeleton

```tsx
import { TrackCardSkeleton } from '@/components/mobile/MobileSkeletons';

{isLoading ? (
  <div className="space-y-4">
    <TrackCardSkeleton />
    <TrackCardSkeleton />
    <TrackCardSkeleton />
  </div>
) : (
  <TrackList tracks={tracks} />
)}
```

---

## State Management Quick Reference

### Player State (Zustand)

```tsx
import { usePlayerStore } from '@/hooks/audio/usePlayerState';

const { currentTrack, isPlaying, play, pause } = usePlayerStore();

// Play a track
play(track);

// Pause playback
pause();

// Check if track is playing
const isActive = currentTrack?.id === track.id && isPlaying;
```

### Studio State (Zustand)

```tsx
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';

const { project, activeTab, setActiveTab } = useUnifiedStudioStore();

// Switch studio tab
setActiveTab('mixer');
```

### Server State (TanStack Query)

```tsx
import { useTracks } from '@/hooks/useTracks';

const { data, isLoading, error, refetch } = useTracks({
  userId: user?.id,
  limit: 20,
});

// Optimistic update
const likeMutation = useLikeTrack();
likeMutation.mutate(trackId);
```

---

## Testing Checklist

Before submitting PRs for UI redesign:

### Visual
- [ ] All headings use correct size (24px/20px/16px)
- [ ] Spacing follows 8px grid (8/16/24/32/48px)
- [ ] Border radius consistent (8-12px)
- [ ] Touch targets minimum 44px

### Functional
- [ ] All buttons provide visual feedback
- [ ] Haptic feedback on interactions
- [ ] Navigation transitions smooth (200-300ms)
- [ ] Loading states use skeletons
- [ ] Empty states have CTAs

### Mobile
- [ ] Safe areas respected (notch/island)
- [ ] Keyboard avoiding works in forms
- [ ] Swipe gestures work properly
- [ ] Landscape layout acceptable

### Performance
- [ ] `npm run size` passes (bundle < 950KB)
- [ ] No console errors
- [ ] 60 FPS animations
- [ ] Lazy loading works

---

## File Structure

```
src/
├── components/
│   ├── shared/               # NEW: Unified shared components
│   │   └── UnifiedTrackCard.tsx
│   ├── mobile/               # Mobile-specific components
│   │   ├── MobileHeaderBar.tsx
│   │   ├── MobileBottomSheet.tsx
│   │   └── MobileSkeletons.tsx
│   ├── home/                 # Redesigned home components
│   │   ├── HomeQuickCreate.tsx
│   │   ├── FeaturedSection.tsx
│   │   └── RecentPlaysSection.tsx
│   ├── library/              # Redesigned library components
│   │   └── VirtualizedTrackList.tsx
│   ├── generate-form/        # Redesigned form components
│   │   └── GenerateForm.tsx
│   ├── player/               # Redesigned player components
│   │   ├── CompactPlayer.tsx
│   │   └── MobileFullscreenPlayer.tsx
│   └── studio/unified/       # Redesigned studio components
│       └── MobileStudioTabs.tsx
├── hooks/
│   ├── useTracks.ts          # Existing: Track data fetching
│   ├── usePlayerState.ts     # Existing: Player state
│   └── useGenerateForm.ts    # Existing: Form state
├── stores/
│   ├── playerStore.ts        # Existing: Player state
│   └── useUnifiedStudioStore.ts  # Existing: Studio state
└── pages/
    ├── Index.tsx             # Redesign: Home page
    ├── LibraryPage.tsx       # Redesign: Library page
    └── StudioV2Page.tsx      # Redesign: Studio page
```

---

## Key Changes Summary

### Components to Create
- `UnifiedTrackCard` - Consolidates 10+ variants
- `HomeQuickCreate` - Simplified quick create section
- `FeaturedSection` - Max 6 tracks, horizontal scroll
- `RecentPlaysSection` - Last 5 tracks

### Components to Update
- `BottomNavigation` - Reduce from 5 to 4 tabs
- `GenerateForm` - Add collapsible advanced section
- `MobileHeaderBar` - Standardize usage
- `MobileBottomSheet` - Use for studio tabs

### Components to Deprecate
- `InlineVersionToggle` - Replace with UnifiedVersionSelector
- `VersionSwitcher` - Replace with UnifiedVersionSelector
- Old track card variants (mark `@deprecated`)

---

## Getting Started

1. **Read the spec**: [spec.md](./spec.md)
2. **Review research**: [research.md](./research.md)
3. **Check data model**: [data-model.md](./data-model.md)
4. **Verify API contracts**: [contracts/api-contracts.md](./contracts/api-contracts.md)

5. **Start with priority items**:
   - P1: Streamlined Mobile Home
   - P1: Simplified Navigation System
   - P2: Minimalist Track Cards

6. **Run tests**:
   ```bash
   npm run size      # Check bundle size
   npm run lint      # Lint code
   npm test          # Run tests
   ```

7. **Test on device**:
   - iOS Safari 15+
   - Chrome Android 100+
   - Telegram iOS/Android

---

## Resources

- [Constitution](../../../.specify/memory/constitution.md) - Project principles
- [CLAUDE.md](../../../CLAUDE.md) - Development guidance
- [Design System](../../../docs/DESIGN_SYSTEM.md) - Component patterns

---

## Questions?

Refer to the [plan.md](./plan.md) for detailed implementation guidance.
