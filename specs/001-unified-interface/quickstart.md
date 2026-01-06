# Unified Interface Developer Quick Start

**Version**: 1.0.0  
**Date**: 2026-01-05  
**For**: MusicVerse AI Unified Interface Implementation

## Overview

This guide provides practical patterns and code examples for implementing unified interface components across MusicVerse AI. All patterns enforce mobile-first design, 44-56px touch targets, and Telegram Mini App integration.

---

## Quick Reference

### When to Use Which Component

| Need | Mobile (<768px) | Desktop (≥768px) | Import |
|------|----------------|------------------|--------|
| **Page Header** | MobileHeaderBar | MobileHeaderBar | `@/components/mobile/MobileHeaderBar` |
| **Form Modal** | MobileBottomSheet | Dialog | `@/components/mobile/MobileBottomSheet`, `@/components/ui/dialog` |
| **Action Menu** | MobileActionSheet | DropdownMenu | `@/components/mobile/MobileActionSheet` |
| **Confirmation** | Dialog | Dialog | `@/components/ui/dialog` |
| **Large List (>50)** | VirtualizedTrackList | VirtualizedTrackList | `@/components/library/VirtualizedTrackList` |
| **Image** | LazyImage | LazyImage | `@/components/ui/lazy-image` |

---

## Pattern 1: Standard Page Layout

### Basic Page

```tsx
import { MobileHeaderBar } from '@/components/mobile/MobileHeaderBar';
import { VirtualizedTrackList } from '@/components/library/VirtualizedTrackList';
import { useTracks } from '@/hooks/useTracks';

export default function Library() {
  const { data: tracks, isLoading } = useTracks();

  return (
    <>
      <MobileHeaderBar 
        title="Library"
        actions={[
          {
            id: 'filter',
            icon: Filter,
            label: 'Filter tracks',
            onClick: () => setShowFilters(true),
          },
        ]}
      />
      
      <div className="flex-1 overflow-y-auto">
        <VirtualizedTrackList
          items={tracks}
          mode="grid"
          loading={isLoading}
          renderItem={(track) => <TrackCard track={track} />}
          keyExtractor={(track) => track.id}
        />
      </div>
    </>
  );
}
```

**Notes**:
- All pages are wrapped by MainLayout via `<Outlet/>` in App.tsx
- MobileHeaderBar automatically handles back button when not root page
- VirtualizedTrackList handles >50 items efficiently

### Page with Search

```tsx
import { useState } from 'react';
import { MobileHeaderBar } from '@/components/mobile/MobileHeaderBar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function Community() {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebouncedValue(searchValue, 300);
  
  return (
    <>
      <MobileHeaderBar
        title="Community"
        showSearch
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search public tracks..."
      />
      
      <div className="flex-1 overflow-y-auto">
        {/* Your content */}
      </div>
    </>
  );
}
```

---

## Pattern 2: Modal Patterns

### Form Modal (Mobile Bottom Sheet, Desktop Dialog)

```tsx
import { useState } from 'react';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function CreatePlaylistButton() {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const content = (
    <form onSubmit={handleSubmit}>
      <Input name="name" placeholder="Playlist name" className="min-h-11" />
      <Button type="submit" className="min-h-11 w-full">Create</Button>
    </form>
  );
  
  if (isMobile) {
    return (
      <MobileBottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Create Playlist"
        snapPoints={[0.5, 0.9]}
        swipeToDismiss
      >
        {content}
      </MobileBottomSheet>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
```

### Action Menu (Mobile Action Sheet, Desktop Dropdown)

```tsx
import { MobileActionSheet } from '@/components/mobile/MobileActionSheet';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Share, Download, Trash } from 'lucide-react';

export function TrackMenu({ track }: { track: Track }) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const actions = [
    {
      id: 'share',
      label: 'Share',
      icon: Share,
      onClick: () => handleShare(track),
    },
    {
      id: 'download',
      label: 'Download',
      icon: Download,
      onClick: () => handleDownload(track),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash,
      onClick: () => handleDelete(track),
      destructive: true,
    },
  ];
  
  if (isMobile) {
    return (
      <MobileActionSheet
        open={open}
        onOpenChange={setOpen}
        title={track.title}
        actions={actions}
      />
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-11 h-11">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {actions.map(action => (
          <DropdownMenuItem key={action.id} onClick={action.onClick}>
            <action.icon className="w-4 h-4 mr-2" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Pattern 3: Virtualized Lists

### Basic Virtualized Grid

```tsx
import { VirtualizedTrackList } from '@/components/library/VirtualizedTrackList';
import { TrackCard } from '@/components/track/TrackCard';

export function TrackGrid({ tracks }: { tracks: Track[] }) {
  return (
    <VirtualizedTrackList
      items={tracks}
      mode="grid"
      gridColumns="auto" // 2 on mobile, 3-6 on desktop
      renderItem={(track) => (
        <TrackCard 
          track={track}
          variant="compact"
          showVersionSwitcher
          onClick={() => handleTrackClick(track)}
        />
      )}
      keyExtractor={(track) => track.id}
    />
  );
}
```

### Virtualized List with Infinite Scroll

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { VirtualizedTrackList } from '@/components/library/VirtualizedTrackList';

export function InfiniteTrackList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['tracks'],
    queryFn: ({ pageParam = 0 }) => fetchTracks(pageParam),
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  });
  
  const tracks = data?.pages.flatMap(page => page.tracks) ?? [];
  
  return (
    <VirtualizedTrackList
      items={tracks}
      mode="list"
      loading={isLoading}
      renderItem={(track) => <TrackCard track={track} variant="minimal" />}
      keyExtractor={(track) => track.id}
      infiniteScroll={{
        hasNextPage: hasNextPage ?? false,
        isFetchingNextPage,
        fetchNextPage,
      }}
    />
  );
}
```

### Virtualized List with Pull-to-Refresh

```tsx
import { VirtualizedTrackList } from '@/components/library/VirtualizedTrackList';
import { useTracks } from '@/hooks/useTracks';

export function RefreshableTrackList() {
  const { data: tracks, isLoading, refetch } = useTracks();
  
  const handleRefresh = async () => {
    await refetch();
  };
  
  return (
    <VirtualizedTrackList
      items={tracks}
      mode="grid"
      loading={isLoading}
      renderItem={(track) => <TrackCard track={track} />}
      keyExtractor={(track) => track.id}
      pullToRefresh={{
        enabled: true,
        onRefresh: handleRefresh,
      }}
    />
  );
}
```

---

## Pattern 4: Touch Targets

### Touch Target Compliance

All interactive elements MUST meet minimum touch target sizes:

```tsx
// ✅ CORRECT: Button with 44px minimum
<Button className="min-w-11 min-h-11 px-4 py-2">
  Save
</Button>

// ✅ CORRECT: Icon button with 44x44px
<Button variant="ghost" size="icon" className="w-11 h-11">
  <Share className="w-5 h-5" />
</Button>

// ✅ CORRECT: Tab with 44px minimum
<TabsTrigger value="tracks" className="min-h-11 px-3">
  Tracks
</TabsTrigger>

// ✅ CORRECT: Chip with 40px height
<Badge className="min-w-11 h-10 px-3 cursor-pointer">
  Rock
</Badge>

// ❌ WRONG: Button too small
<Button className="w-8 h-8"> {/* 32px < 44px minimum */}
  Save
</Button>

// ❌ WRONG: Icon button too small
<Button variant="ghost" size="icon"> {/* Default 36px < 44px */}
  <Share />
</Button>
```

### Tailwind Touch Target Utilities

Add these to your Tailwind config for consistency:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      minHeight: {
        '11': '2.75rem', // 44px
        '12': '3rem',    // 48px
        '14': '3.5rem',  // 56px
      },
      minWidth: {
        '11': '2.75rem', // 44px
        '12': '3rem',    // 48px
        '14': '3.5rem',  // 56px
      },
    },
  },
};
```

---

## Pattern 5: Lazy Images

### Basic Lazy Image

```tsx
import { LazyImage } from '@/components/ui/lazy-image';

export function TrackCover({ track }: { track: Track }) {
  return (
    <LazyImage
      src={track.image_url}
      alt={track.title}
      width={512}
      height={512}
      blurHash={track.blurhash}
      fallbackSrc="/default-cover.webp"
      className="rounded-lg"
    />
  );
}
```

### Lazy Image with Loading State

```tsx
<LazyImage
  src={track.image_url}
  alt={track.title}
  width={512}
  height={512}
  showShimmer // Shows shimmer animation while loading
  onLoad={() => console.log('Image loaded')}
  onError={(error) => console.error('Image failed', error)}
/>
```

---

## Pattern 6: Forms with Auto-Save

### Form with Draft Persistence

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGenerateDraft } from '@/hooks/useGenerateDraft';

const formSchema = z.object({
  lyrics: z.string().min(10, 'Lyrics must be at least 10 characters'),
  style: z.string().min(1, 'Style is required'),
});

export function GenerateForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });
  
  // Auto-save to localStorage every 2 seconds
  useGenerateDraft(form, {
    formId: 'generate-music',
    expiryMinutes: 30,
  });
  
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="lyrics"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lyrics</FormLabel>
            <FormControl>
              <Textarea {...field} className="min-h-11" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <Button 
        type="submit" 
        className="min-h-11 w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Generating...' : 'Generate'}
      </Button>
    </Form>
  );
}
```

---

## Pattern 7: Telegram SDK Integration

### Haptic Feedback

```tsx
import { hapticFeedback } from '@/lib/telegram';

// Light impact (button clicks)
<Button onClick={() => {
  hapticFeedback.impactOccurred('light');
  handleClick();
}}>
  Save
</Button>

// Medium impact (swipe actions, drag)
<div onDragStart={() => hapticFeedback.impactOccurred('medium')}>
  Drag me
</div>

// Heavy impact (important actions)
<Button onClick={() => {
  hapticFeedback.impactOccurred('heavy');
  handleDelete();
}}>
  Delete
</Button>

// Success notification
hapticFeedback.notificationOccurred('success'); // Track generated

// Error notification
hapticFeedback.notificationOccurred('error'); // Generation failed
```

### Telegram MainButton

```tsx
import { useTelegramMainButton } from '@/hooks/useTelegramMainButton';

export function GeneratePage() {
  const [formValid, setFormValid] = useState(false);
  
  useTelegramMainButton({
    text: 'Generate Music',
    visible: true,
    enabled: formValid,
    onClick: handleGenerate,
    progress: generatingProgress, // 0-100 (shows loading bar)
  });
  
  return (
    <GenerateForm onValidChange={setFormValid} />
  );
}
```

### Telegram BackButton

```tsx
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';

export function TrackDetailPage() {
  useTelegramBackButton({
    visible: true,
    onClick: () => navigate(-1),
  });
  
  return <TrackDetail />;
}
```

---

## Pattern 8: Animations

### Framer Motion via @/lib/motion

**ALWAYS** import Framer Motion through the wrapper for tree-shaking:

```tsx
import { motion, AnimatePresence } from '@/lib/motion';

// ✅ CORRECT: Import from @/lib/motion
import { motion } from '@/lib/motion';

// ❌ WRONG: Direct import (no tree-shaking)
import { motion } from 'framer-motion';
```

### Common Animations

```tsx
// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>

// Slide up
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 20, opacity: 0 }}
/>

// Scale press
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.1 }}
>
  Click me
</motion.button>

// Respect prefers-reduced-motion
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: prefersReducedMotion ? 0 : 0.3,
  }}
/>
```

---

## Checklist: Implementing a New Screen

Use this checklist when creating or refactoring a screen:

- [ ] **Layout**: Uses MainLayout (via Outlet) + MobileHeaderBar
- [ ] **Header**: MobileHeaderBar with title, back button, max 2 actions
- [ ] **Touch Targets**: All interactive elements ≥44px (buttons, tabs, chips)
- [ ] **Modals**: MobileBottomSheet (mobile) / Dialog (desktop) for forms
- [ ] **Action Menus**: MobileActionSheet (mobile) / DropdownMenu (desktop)
- [ ] **Lists**: VirtualizedTrackList for >50 items
- [ ] **Images**: LazyImage with blur placeholder for all images
- [ ] **Forms**: React Hook Form + Zod validation + auto-save
- [ ] **Haptics**: Telegram hapticFeedback on button clicks
- [ ] **Animations**: Framer Motion via @/lib/motion (not direct import)
- [ ] **Accessibility**: ARIA labels on icon-only buttons
- [ ] **Loading**: Skeleton loaders (not spinners) for initial load
- [ ] **Empty State**: Clear empty state with CTA
- [ ] **Error State**: Descriptive error message with Retry button
- [ ] **Safe Areas**: Handles iOS notch/Dynamic Island automatically
- [ ] **Responsive**: Mobile-first, desktop enhancements where needed

---

## Common Mistakes to Avoid

### ❌ DON'T

```tsx
// ❌ Don't use Dialog on mobile for forms
<Dialog> {/* Should be MobileBottomSheet on mobile */}
  <form>...</form>
</Dialog>

// ❌ Don't use .map() for lists >50 items
{tracks.map(track => <TrackCard key={track.id} track={track} />)}

// ❌ Don't create multiple audio elements
<audio src={track.url} /> {/* Violates single audio source pattern */}

// ❌ Don't import Framer Motion directly
import { motion } from 'framer-motion'; {/* No tree-shaking */}

// ❌ Don't use small touch targets
<Button className="w-8 h-8">Save</Button> {/* 32px < 44px minimum */}

// ❌ Don't forget ARIA labels
<Button variant="ghost" size="icon"> {/* Missing aria-label */}
  <Share />
</Button>
```

### ✅ DO

```tsx
// ✅ Use responsive modal pattern
{isMobile ? (
  <MobileBottomSheet>{content}</MobileBottomSheet>
) : (
  <Dialog>{content}</Dialog>
)}

// ✅ Use VirtualizedTrackList for large lists
<VirtualizedTrackList items={tracks} mode="grid" />

// ✅ Use global audio player
const { play, pause } = useGlobalAudioPlayer();
play(track);

// ✅ Import Framer Motion via wrapper
import { motion } from '@/lib/motion';

// ✅ Use proper touch targets
<Button className="min-w-11 min-h-11">Save</Button>

// ✅ Add ARIA labels
<Button variant="ghost" size="icon" aria-label="Share track">
  <Share />
</Button>
```

---

## Performance Tips

1. **Lazy Load Heavy Components**: Use React.lazy() for pages and large components (>50KB)
2. **Virtualize Lists**: Always use VirtualizedTrackList for >50 items
3. **Optimize Images**: Use LazyImage with WebP format, 512×512px max
4. **Tree-Shake Dependencies**: Import Framer Motion via @/lib/motion
5. **Monitor Bundle Size**: Run `npm run size` before committing
6. **Use TanStack Query**: For server state with optimized caching (staleTime: 30s, gcTime: 10min)
7. **Debounce Search**: Use useDebouncedValue (300ms) for search inputs
8. **Memoize Callbacks**: Use useCallback for functions passed to VirtualizedTrackList

---

## Resources

- **Constitution**: `.specify/memory/constitution.md` - Core principles and rules
- **CLAUDE.md**: `CLAUDE.md` - AI agent development guidance
- **Component Contracts**: `specs/001-unified-interface/contracts/` - TypeScript interfaces
- **Data Models**: `specs/001-unified-interface/data-model.md` - Entity schemas
- **Research**: `specs/001-unified-interface/research.md` - Component audit findings

---

## Getting Help

1. Review this quickstart guide first
2. Check component contracts in `specs/001-unified-interface/contracts/`
3. Look at existing implementations (Library.tsx, Studio.tsx)
4. Ask in #unified-interface Slack channel
5. Tag @frontend-team for code reviews

---

**Last Updated**: 2026-01-05  
**Version**: 1.0.0
