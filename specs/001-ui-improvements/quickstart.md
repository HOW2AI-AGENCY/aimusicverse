# UI Improvement System - Quickstart Guide

**Feature Branch**: `001-ui-improvements`
**Purpose**: Developer onboarding for new UI patterns and components

---

## Overview

The UI Improvement System introduces new components and utilities to ensure consistent, accessible, and performant UI across MusicVerse AI. This guide helps developers adopt these patterns in their daily work.

---

## Quick Reference

| Pattern | When to Use | Import |
|---------|-------------|--------|
| `TouchTarget` | Any interactive element | `@/components/ui/touch-target` |
| `SafeArea` | Fixed headers/footers | `@/components/ui/safe-area` |
| `ResponsiveContainer` | Different mobile/desktop UI | `@/components/ui/responsive-container` |
| `Skeleton` | Loading states | `@/components/ui/skeleton` |
| `colorTokens` | Colors (no hardcoded values) | `@/lib/color-tokens` |
| `zIndex` | Layering (no hardcoded z-index) | `@/lib/z-index` |
| `useGestures` | Touch interactions | `@/hooks/use-gestures` |

---

## Component Usage Guide

### 1. TouchTarget - Ensuring Minimum Touch Size

**Problem:** Small buttons are hard to tap on mobile
**Solution:** Wrap with `TouchTarget` for guaranteed 44px minimum

```typescript
import { TouchTarget } from '@/components/ui/touch-target';

// BEFORE - Too small for touch
<button className="h-8 w-8">
  <Icon />
</button>

// AFTER - Proper touch target
<TouchTarget size="min">
  <button>
    <Icon />
  </button>
</TouchTarget>

// Size options: 'min' (44px), 'comfortable' (48px), 'large' (56px)
<TouchTarget size="large">
  <Button>Important Action</Button>
</TouchTarget>
```

---

### 2. SafeArea - Handling Notch and Home Indicator

**Problem:** Content hidden by notch or home indicator
**Solution:** Use `SafeArea` for automatic spacing

```typescript
import { SafeArea } from '@/components/ui/safe-area';

// Fixed header with notch clearance
<SafeArea top>
  <MobileHeaderBar title="My Page" />
</SafeArea>

// Fixed bottom navigation with home indicator clearance
<SafeArea bottom>
  <BottomNavigation />
</SafeArea>

// Both top and bottom
<SafeArea top bottom>
  <div className="fixed inset-0">
    {/* Content */}
  </div>
</SafeArea>
```

**Tailwind Classes:**
```css
.pt-safe-top  /* Top spacing for notch */
.pb-safe-bottom  /* Bottom spacing for home indicator */
```

---

### 3. ResponsiveContainer - Mobile vs Desktop UI

**Problem:** Need different layouts for mobile and desktop
**Solution:** Use `ResponsiveContainer` for conditional rendering

```typescript
import { ResponsiveContainer, Mobile, Desktop } from '@/components/ui/responsive-container';

// Method 1: Separate components
<ResponsiveContainer
  mobile={<MobileBottomNav />}
  desktop={<SidebarNav />}
/>

// Method 2: Shorthand components
<>
  <Mobile>
    <MobileBottomNav />
  </Mobile>
  <Desktop>
    <SidebarNav />
  </Desktop>
</>

// Example: Different player UI
<ResponsiveContainer
  mobile={<CompactPlayer />}
  desktop={<ExpandedPlayer />}
/>
```

---

### 4. Skeleton - Loading States

**Problem:** Users see empty space during loading
**Solution:** Use `Skeleton` for perceived performance

```typescript
import { Skeleton, TrackCardSkeleton, ListSkeleton } from '@/components/ui/skeleton';

// Custom skeleton
<Skeleton variant="rectangular" width={200} height={40} />

// Text skeleton
<Skeleton variant="text" width="70%" />

// Circular avatar skeleton
<Skeleton variant="circular" width={56} height={56} />

// Preset: Track card skeleton
{isLoading ? (
  <TrackCardSkeleton />
) : (
  <TrackCard track={track} />
)}

// Preset: List of skeletons
{isLoading ? (
  <ListSkeleton count={10} />
) : (
  <TrackList tracks={tracks} />
)}
```

---

### 5. Color Tokens - No More Hardcoded Colors

**Problem:** Inconsistent colors, hard to maintain themes
**Solution:** Use `colorTokens` for semantic color usage

```typescript
import { colorTokens, withOpacity, gradient, sectionGradient } from '@/lib/color-tokens';

// BEFORE - Hardcoded hex
<div style={{ backgroundColor: '#8b5cf6' }} />

// AFTER - Semantic token
<div style={{ backgroundColor: colorTokens.generate }} />

// With opacity
<div style={{ backgroundColor: withOpacity(colorTokens.primary, 0.5) }} />

// Gradients
<div style={{ background: gradient(colorTokens.primary, colorTokens.secondary) }} />

// Section-specific gradients
<div style={{ background: sectionGradient('generate') }} />

// Available tokens:
// - background, foreground, primary, secondary, accent, muted
// - generate, library, projects, community, success, warning
// - border, input, ring, destructive
```

**Tailwind Integration:**
```css
/* Use existing Tailwind classes */
bg-primary
text-muted-foreground
border-border
ring-ring

/* For custom values, use colorTokens */
style={{ backgroundColor: colorTokens.library }}
```

---

### 6. Z-Index Scale - No More Magic Numbers

**Problem:** Z-index wars, unpredictable layering
**Solution:** Use semantic `zIndex` scale

```typescript
import { zIndex, getZIndex } from '@/lib/z-index';

// BEFORE - Magic number
<div style={{ zIndex: 9999 }} />

// AFTER - Semantic
<div style={{ zIndex: zIndex.dialog }} />

// With Tailwind
<div className={getZIndex('dialog')} />
<div className="z-[80]" /> {/* Same thing */}

// Available levels (lowest to highest):
// base (0) → raised (10) → sticky (20) → floating (30)
// → overlay (40) → navigation (50) → player (60)
// → contextual (70) → dialog (80) → fullscreen (90)
// → system (100) → dropdown (200)
```

---

### 7. useGestures - Touch Interactions

**Problem:** Gesture conflicts, inconsistent behavior
**Solution:** Use `useGestures` hook with priority system

```typescript
import { useGestures } from '@/hooks/use-gestures';

function TrackCard({ track }) {
  const navigate = useNavigate();
  const { play } = useGlobalAudioPlayer();

  const { gestureHandlers } = useGestures({
    onTap: () => navigate(`/track/${track.id}`),
    onDoubleTap: () => play(track),
    onSwipeLeft: () => navigate(`/track/${track.id}/stems`),
    swipeThreshold: 80,
  });

  return (
    <motion.div
      {...gestureHandlers}
      whileTap={{ scale: 0.98 }}
    >
      <TrackCardView track={track} />
    </motion.div>
  );
}

// Priority system (handled automatically):
// 1. Double-tap (priority 10) - highest
// 2. Swipe (priority 5)
// 3. Drag (priority 2)
// 4. Tap (priority 1) - default
```

---

### 8. Field - Form System

**Problem:** Inconsistent form layouts, error handling
**Solution:** Use `Field` wrapper for consistency

```typescript
import { Field } from '@/components/ui/field';

function EditTrackForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <form>
      <Field
        label="Track Name"
        error={errors.name?.message}
        required
        description="Choose a descriptive name for your track"
      >
        <Input {...register('name')} placeholder="My Awesome Track" />
      </Field>

      <Field
        label="Description"
        error={errors.description?.message}
      >
        <Textarea {...register('description')} rows={3} />
      </Field>

      <Button type="submit">Save Changes</Button>
    </form>
  );
}
```

---

## Migration Checklist

### Migrating Existing Code

**Task 1: Replace Hardcoded Colors**
```bash
# Find all hardcoded colors
grep -r "#[0-9A-Fa-f]\{6\}" src/components/
grep -r "rgb(" src/components/

# Replace with colorTokens
# - Copy-paste color to identify section
# - Use appropriate token from colorTokens
```

**Task 2: Replace Hardcoded Z-Index**
```bash
# Find all z-index usages
grep -r "z-\[" src/components/
grep -r "zIndex:" src/components/

# Replace with semantic zIndex
```

**Task 3: Add Touch Targets**
```bash
# Find small interactive elements
grep -r "h-\[3[0-9]px\]" src/components/

# Wrap with TouchTarget
```

**Task 4: Add Safe Areas**
```bash
# Find fixed headers/footers
grep -r "fixed top-0" src/components/
grep -r "fixed bottom-0" src/components/

# Wrap with SafeArea
```

---

## Common Patterns

### Pattern 1: Page Layout

```typescript
import { SafeArea } from '@/components/ui/safe-area';
import { MobileHeaderBar } from '@/components/mobile/MobileHeaderBar';

function MyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SafeArea top>
        <MobileHeaderBar title="My Page" />
      </SafeArea>

      <main className="px-4 pb-safe-bottom">
        {/* Page content */}
      </main>
    </div>
  );
}
```

---

### Pattern 2: List with Skeleton

```typescript
import { ListSkeleton } from '@/components/ui/skeleton';
import { VirtualizedList } from '@/components/ui/virtualized-list';

function TrackListPage() {
  const { data, isLoading } = useTracks();

  if (isLoading) {
    return <ListSkeleton count={10} />;
  }

  return (
    <VirtualizedList
      items={data}
      renderItem={(track) => <TrackCard key={track.id} track={track} />}
    />
  );
}
```

---

### Pattern 3: Touch-Friendly Actions

```typescript
import { TouchTarget } from '@/components/ui/touch-target';

function ActionButtons() {
  return (
    <div className="flex gap-2">
      <TouchTarget size="min">
        <Button variant="ghost" size="icon">
          <PlayIcon />
        </Button>
      </TouchTarget>

      <TouchTarget size="min">
        <Button variant="ghost" size="icon">
          <PauseIcon />
        </Button>
      </TouchTarget>

      <TouchTarget size="min">
        <Button variant="ghost" size="icon">
          <MoreIcon />
        </Button>
      </TouchTarget>
    </div>
  );
}
```

---

## Testing Checklist

Before committing UI changes, verify:

### Mobile Testing
- [ ] Touch targets are at least 44px (measure with DevTools)
- [ ] Safe areas work on iPhone 14 Pro (Dynamic Island)
- [ ] Home indicator doesn't cover content
- [ ] Gestures work smoothly (no conflicts)
- [ ] Haptic feedback triggers on button taps

### Desktop Testing
- [ ] Responsive layouts work at 640px breakpoint
- [ ] Hover states work for mouse users
- [ ] Keyboard navigation works (Tab, Enter, Esc)

### Visual Testing
- [ ] Colors use semantic tokens (no hardcoded values)
- [ ] Z-index uses semantic scale (no magic numbers)
- [ ] Loading states show skeleton, not empty space
- [ ] Error messages are descriptive and actionable

---

## Bundle Size Impact

| New Component | Estimated Size |
|--------------|----------------|
| TouchTarget | ~1KB |
| SafeArea | ~1KB |
| ResponsiveContainer | ~1KB |
| Skeleton | ~2KB |
| GestureManager | ~3KB |
| colorTokens | ~1KB |
| zIndex | ~0.5KB |
| **Total** | **~10KB** |

**Impact:** Well within 950KB bundle limit. The utility-based design ensures tree-shaking removes unused code.

---

## Next Steps

1. **Phase 1 (Sprint 031):** Install dependencies, create base components
2. **Phase 2 (Sprint 032):** Migrate high-traffic components
3. **Phase 3 (Sprint 033):** Refactor oversized components
4. **Phase 4 (Sprint 034):** Validation and testing

See [tasks.md](./tasks.md) for detailed task breakdown.

---

## Getting Help

- **Documentation:** [CLAUDE.md](../../CLAUDE.md) - Project architecture and patterns
- **Constitution:** [constitution.md](../../.specify/memory/constitution.md) - Core principles
- **Design System:** Check existing `src/components/ui/` for shadcn/ui patterns
- **Questions:** Create issue in project repository

---

**Status**: Quickstart guide complete
**Last Updated**: 2026-01-24
