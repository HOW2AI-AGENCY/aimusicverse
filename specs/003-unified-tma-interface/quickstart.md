# Quickstart: Unified Telegram Mini App Interface Components

**Feature**: 003-unified-tma-interface
**Last Updated**: 2026-01-05
**For**: Developers implementing or migrating to unified components

This guide provides practical examples, migration patterns, and best practices for using the unified component library.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Component Usage Examples](#component-usage-examples)
3. [Migration Guide](#migration-guide)
4. [Storybook Stories](#storybook-stories)
5. [Accessibility Checklist](#accessibility-checklist)
6. [Performance Best Practices](#performance-best-practices)
7. [Common Pitfalls](#common-pitfalls)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

No installation needed - unified components are part of the main codebase in `src/components/unified-tma/`.

### Basic Import Pattern

```tsx
// ✅ Correct: Use named imports from centralized index
import { UnifiedButton, UnifiedBottomSheet, UnifiedSkeleton } from '@/components/unified-tma';

// ❌ Incorrect: Direct file imports (harder to tree-shake)
import { UnifiedButton } from '@/components/unified-tma/core/UnifiedButton';
```

### Project Structure

```
src/components/unified-tma/
├── core/           # Buttons, sheets, panels, modals
├── feedback/       # Skeletons, spinners, errors, toasts
├── layout/         # Page layouts, grids, stacks, safe areas
├── studio/         # Studio-specific panel components
├── primitives/     # Low-level wrappers (TouchTarget, MotionWrapper)
└── index.ts        # Centralized exports ⭐
```

---

## Component Usage Examples

### UnifiedButton

All button interactions with touch optimization and haptic feedback.

```tsx
import { UnifiedButton } from '@/components/unified-tma';

// Primary action button
<UnifiedButton variant="primary" size="lg" haptic>
  Generate Track
</UnifiedButton>

// Destructive action with loading state
<UnifiedButton
  variant="destructive"
  loading={isDeleting}
  disabled={!canDelete}
  onPress={handleDelete}
>
  Delete Track
</UnifiedButton>

// Icon-only button (still 44×44px touch target)
<UnifiedButton variant="ghost" size="icon" haptic>
  <CloseIcon className="h-5 w-5" />
</UnifiedButton>

// Button with icon + text
<UnifiedButton variant="secondary" icon={<ShareIcon />} iconPosition="left">
  Share
</UnifiedButton>
```

**Props**:
- `variant`: `primary` | `secondary` | `ghost` | `destructive` (default: `primary`)
- `size`: `sm` | `md` | `lg` | `icon` (default: `md`)
- `haptic`: `boolean` (default: `true` for primary/destructive, `false` for ghost)
- `loading`: `boolean` - Shows spinner inside button
- `disabled`: `boolean`
- `icon`: `ReactNode` - Icon element
- `iconPosition`: `left` | `right` | `only` (default: `left`)
- `onPress`: `() => void` - Click handler (use this instead of `onClick`)

---

### UnifiedBottomSheet

Mobile-optimized bottom sheet with drag gestures and snap points.

```tsx
import { UnifiedBottomSheet } from '@/components/unified-tma';
import { useState } from 'react';

function TrackActionsSheet() {
  const [open, setOpen] = useState(false);
  const [snapPoint, setSnapPoint] = useState(0.5); // 50% viewport height

  return (
    <UnifiedBottomSheet
      open={open}
      onOpenChange={setOpen}
      snapPoints={[0.5, 0.9]} // 50% and 90% heights
      currentSnapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
      showHandle
      dismissible
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Track Actions</h3>
        <UnifiedButton variant="secondary" className="w-full mb-2">
          Add to Playlist
        </UnifiedButton>
        <UnifiedButton variant="secondary" className="w-full mb-2">
          Share
        </UnifiedButton>
        <UnifiedButton variant="destructive" className="w-full">
          Delete
        </UnifiedButton>
      </div>
    </UnifiedBottomSheet>
  );
}
```

**Props**:
- `open`: `boolean` - Controlled open state
- `onOpenChange`: `(open: boolean) => void` - Open state change handler
- `snapPoints`: `number[]` - Array of snap point percentages (default: `[0.5, 0.9]`)
- `currentSnapPoint`: `number` - Current snap point
- `onSnapPointChange`: `(point: number) => void` - Snap point change handler
- `showHandle`: `boolean` - Show drag handle (default: `true`)
- `dismissible`: `boolean` - Allow swipe-to-dismiss (default: `true`)
- `backdrop`: `boolean` - Show backdrop overlay (default: `true`)

---

### UnifiedPanel (Composition API)

Flexible panel for Studio and complex UI.

```tsx
import {
  UnifiedPanel,
  StudioPanelHeader,
  StudioPanelContent,
  StudioPanelFooter,
} from '@/components/unified-tma';

function MixerPanel({ onClose }) {
  return (
    <UnifiedPanel>
      <StudioPanelHeader
        title="Mixer"
        onClose={onClose}
        actions={
          <UnifiedButton variant="ghost" size="icon">
            <SettingsIcon />
          </UnifiedButton>
        }
      />
      <StudioPanelContent scrollable persistState panelId="mixer-panel">
        {/* Mixer controls */}
        <StemVolumeSlider stem="vocals" />
        <StemVolumeSlider stem="drums" />
        <StemVolumeSlider stem="bass" />
      </StudioPanelContent>
      <StudioPanelFooter>
        <UnifiedButton variant="primary" className="flex-1">
          Save Mix
        </UnifiedButton>
        <UnifiedButton variant="secondary" className="flex-1">
          Reset
        </UnifiedButton>
      </StudioPanelFooter>
    </UnifiedPanel>
  );
}
```

**StudioPanelHeader Props**:
- `title`: `string` - Panel title
- `onClose`: `() => void` - Close button handler
- `actions`: `ReactNode` - Optional action buttons (right side)

**StudioPanelContent Props**:
- `scrollable`: `boolean` - Enable scroll container (default: `true`)
- `persistState`: `boolean` - Save/restore scroll position (default: `false`)
- `panelId`: `string` - Unique ID for state persistence (required if `persistState`)

**StudioPanelFooter Props**:
- Standard div, use Tailwind for layout (e.g., `flex gap-2`)

---

### UnifiedSkeleton

Loading state placeholders with shimmer animation.

```tsx
import { UnifiedSkeleton } from '@/components/unified-tma';

// Text skeleton (multiple lines)
<UnifiedSkeleton variant="text" lines={3} />

// Card skeleton
<UnifiedSkeleton variant="card" className="h-48" />

// List skeleton (5 items)
<UnifiedSkeleton variant="list" count={5} />

// Custom skeleton
<UnifiedSkeleton className="h-12 w-full rounded-lg" />
```

**Props**:
- `variant`: `text` | `card` | `list` | `custom` (default: `custom`)
- `lines`: `number` - Number of text lines (only for `text` variant)
- `count`: `number` - Number of list items (only for `list` variant)
- `animated`: `boolean` - Show shimmer animation (default: `true`)
- `className`: `string` - Additional Tailwind classes

---

### UnifiedErrorState

Standardized error messages with retry actions.

```tsx
import { UnifiedErrorState } from '@/components/unified-tma';

// Network error
<UnifiedErrorState
  type="offline"
  title="No Internet Connection"
  message="Check your connection and try again"
  retryable
  onRetry={handleRetry}
/>

// API error (500)
<UnifiedErrorState
  type="500"
  title="Something went wrong"
  message="We're working on fixing this. Please try again later."
  actions={
    <UnifiedButton variant="secondary" onPress={handleContactSupport}>
      Contact Support
    </UnifiedButton>
  }
/>

// 404 Not Found
<UnifiedErrorState
  type="404"
  title="Track not found"
  message="This track may have been deleted or made private."
  actions={
    <UnifiedButton variant="primary" onPress={handleGoBack}>
      Go Back
    </UnifiedButton>
  }
/>
```

**Props**:
- `type`: `offline` | `404` | `500` | `generic` - Error type (determines illustration)
- `title`: `string` - Error title
- `message`: `string` - Error description
- `retryable`: `boolean` - Show retry button (default: `false`)
- `onRetry`: `() => void` - Retry handler
- `actions`: `ReactNode` - Custom action buttons (replaces retry button)

---

### UnifiedSafeArea

Automatic safe area handling for Telegram.

```tsx
import { UnifiedSafeArea } from '@/components/unified-tma';

// Padding mode (default)
<UnifiedSafeArea>
  <div className="flex flex-col">
    {/* Content automatically has safe area padding */}
  </div>
</UnifiedSafeArea>

// Margin mode (for backgrounds that extend to edge)
<UnifiedSafeArea mode="margin">
  <div className="bg-gradient-to-b from-purple-500 to-pink-500">
    {/* Background extends to edges, content has margin */}
  </div>
</UnifiedSafeArea>

// Selective safe areas (only bottom for floating button)
<UnifiedSafeArea bottom>
  <UnifiedButton variant="primary" className="w-full">
    Generate
  </UnifiedButton>
</UnifiedSafeArea>
```

**Props**:
- `mode`: `padding` | `margin` (default: `padding`)
- `top`: `boolean` - Apply top safe area (default: `true`)
- `bottom`: `boolean` - Apply bottom safe area (default: `true`)
- `left`: `boolean` - Apply left safe area (default: `true`)
- `right`: `boolean` - Apply right safe area (default: `true`)

---

### UnifiedGrid (Responsive Grid)

Auto-responsive grid with container queries.

```tsx
import { UnifiedGrid } from '@/components/unified-tma';

// Auto-responsive (1 col mobile, 2 cols tablet, 3 cols desktop)
<UnifiedGrid>
  {tracks.map((track) => (
    <TrackCard key={track.id} track={track} />
  ))}
</UnifiedGrid>

// Custom breakpoints
<UnifiedGrid cols={{ xs: 1, sm: 2, md: 4, lg: 6 }} gap="loose">
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</UnifiedGrid>

// Fixed columns (no responsive behavior)
<UnifiedGrid cols={3} gap="tight">
  {/* ... */}
</UnifiedGrid>
```

**Props**:
- `cols`: `number | { xs?, sm?, md?, lg?, xl? }` - Column count (default: `{ xs: 1, sm: 2, md: 3 }`)
- `gap`: `tight` | `normal` | `loose` | `number` (default: `normal`, maps to Tailwind gap classes)
- `align`: `start` | `center` | `end` | `stretch` (default: `stretch`)

---

### MotionWrapper (Standardized Animations)

Consistent animations with prefers-reduced-motion support.

```tsx
import { MotionWrapper } from '@/components/unified-tma/primitives';

// Fade in
<MotionWrapper preset="fade" duration="normal">
  <div>Content fades in</div>
</MotionWrapper>

// Slide up (common for modals)
<MotionWrapper preset="slide-up" duration="fast">
  <Modal>Modal slides up from bottom</Modal>
</MotionWrapper>

// Scale (common for popups)
<MotionWrapper preset="scale" duration="slow">
  <Tooltip>Tooltip scales in</Tooltip>
</MotionWrapper>

// Disabled (no animation, instant)
<MotionWrapper preset="fade" disabled={reducedMotion}>
  <div>Respects user preference</div>
</MotionWrapper>
```

**Props**:
- `preset`: `fade` | `slide-up` | `slide-down` | `slide-left` | `slide-right` | `scale` (default: `fade`)
- `duration`: `fast` (150ms) | `normal` (300ms) | `slow` (500ms) (default: `normal`)
- `disabled`: `boolean` - Disable animation (default: `false`)

---

## Migration Guide

### Migrating from Existing Components

#### Example 1: Button Migration

**Before** (direct button.tsx usage):
```tsx
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/haptic';

<Button
  className="bg-primary text-primary-foreground"
  onClick={() => {
    triggerHaptic('light');
    handleClick();
  }}
>
  Click Me
</Button>
```

**After** (unified button):
```tsx
import { UnifiedButton } from '@/components/unified-tma';

<UnifiedButton variant="primary" haptic onPress={handleClick}>
  Click Me
</UnifiedButton>
```

**Changes**:
- ✅ Haptic feedback built-in (no manual `triggerHaptic`)
- ✅ Touch target enforced (minimum 44×44px)
- ✅ Consistent variant system
- ✅ Use `onPress` instead of `onClick` (semantic for mobile)

---

#### Example 2: Bottom Sheet Migration

**Before** (MobileBottomSheet.tsx):
```tsx
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

<MobileBottomSheet
  isOpen={open}
  onClose={() => setOpen(false)}
  height={400}
  snapToHeight={0.9}
>
  <div className="p-4">{content}</div>
</MobileBottomSheet>
```

**After** (UnifiedBottomSheet):
```tsx
import { UnifiedBottomSheet } from '@/components/unified-tma';

<UnifiedBottomSheet
  open={open}
  onOpenChange={setOpen}
  snapPoints={[0.5, 0.9]}
  currentSnapPoint={0.9}
>
  <div className="p-4">{content}</div>
</UnifiedBottomSheet>
```

**Changes**:
- ✅ Consistent API with other modals (`open`/`onOpenChange`)
- ✅ Standard snap points ([0.5, 0.9] default)
- ✅ Controlled snap point state
- ✅ Safe area handling built-in

---

#### Example 3: Skeleton Migration

**Before** (custom skeleton):
```tsx
<div className="space-y-3">
  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
</div>
```

**After** (UnifiedSkeleton):
```tsx
import { UnifiedSkeleton } from '@/components/unified-tma';

<UnifiedSkeleton variant="text" lines={3} />
```

**Changes**:
- ✅ Shimmer animation (more polished than pulse)
- ✅ ARIA attributes (`role="status"`, `aria-busy="true"`)
- ✅ Consistent styling across app
- ✅ Respects `prefers-reduced-motion`

---

#### Example 4: Studio Panel Migration

**Before** (custom panel):
```tsx
<div className="fixed inset-0 bg-background z-50">
  <div className="flex items-center justify-between px-4 py-3 border-b">
    <h2 className="text-lg font-semibold">Mixer</h2>
    <button onClick={onClose}>Close</button>
  </div>
  <div className="flex-1 overflow-y-auto p-4">
    {/* Content */}
  </div>
  <div className="flex gap-2 p-4 border-t">
    <Button>Save</Button>
    <Button>Cancel</Button>
  </div>
</div>
```

**After** (UnifiedPanel):
```tsx
import {
  UnifiedPanel,
  StudioPanelHeader,
  StudioPanelContent,
  StudioPanelFooter,
} from '@/components/unified-tma';

<UnifiedPanel>
  <StudioPanelHeader title="Mixer" onClose={onClose} />
  <StudioPanelContent scrollable persistState panelId="mixer">
    {/* Content */}
  </StudioPanelContent>
  <StudioPanelFooter>
    <UnifiedButton variant="primary">Save</UnifiedButton>
    <UnifiedButton variant="secondary">Cancel</UnifiedButton>
  </StudioPanelFooter>
</UnifiedPanel>
```

**Changes**:
- ✅ Standard 56px header height
- ✅ Safe area handling (bottom footer)
- ✅ Scroll position persistence
- ✅ Consistent close button (top-right, 44×44px)

---

### Migration Checklist

When migrating a component, verify:

- [ ] Touch targets are ≥44×44px (use TouchTarget wrapper if needed)
- [ ] Haptic feedback works (test on iOS device if possible)
- [ ] Safe areas respected (test on iPhone with notch)
- [ ] Loading states use UnifiedSkeleton (not custom spinners)
- [ ] Error states use UnifiedErrorState (consistent messaging)
- [ ] Animations use MotionWrapper (not direct framer-motion)
- [ ] Spacing uses design tokens (not hardcoded px values)
- [ ] Component is responsive (test at 375px, 640px, 1024px widths)
- [ ] Accessibility attributes present (ARIA labels, roles)
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Dark mode styling correct (test both themes)
- [ ] Bundle size impact measured (`npm run size` before/after)

---

## Storybook Stories

### Creating Stories for Unified Components

Place stories in `.storybook/stories/unified-tma/[component-name].stories.tsx`.

**Example: UnifiedButton.stories.tsx**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedButton } from '@/components/unified-tma';
import { ShareIcon, TrashIcon, PlusIcon } from 'lucide-react';

const meta = {
  title: 'Unified TMA/Core/UnifiedButton',
  component: UnifiedButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    haptic: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof UnifiedButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Generate Track',
    haptic: true,
  },
};

// Variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <UnifiedButton variant="primary">Primary Button</UnifiedButton>
      <UnifiedButton variant="secondary">Secondary Button</UnifiedButton>
      <UnifiedButton variant="ghost">Ghost Button</UnifiedButton>
      <UnifiedButton variant="destructive">Destructive Button</UnifiedButton>
    </div>
  ),
};

// Sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <UnifiedButton size="sm">Small</UnifiedButton>
      <UnifiedButton size="md">Medium</UnifiedButton>
      <UnifiedButton size="lg">Large</UnifiedButton>
    </div>
  ),
};

// Icon variations
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <UnifiedButton icon={<PlusIcon />} iconPosition="left">
        Add to Playlist
      </UnifiedButton>
      <UnifiedButton icon={<ShareIcon />} iconPosition="right">
        Share
      </UnifiedButton>
      <UnifiedButton variant="ghost" size="icon">
        <TrashIcon className="h-5 w-5" />
      </UnifiedButton>
    </div>
  ),
};

// Loading state
export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Generating...',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
};
```

**Run Storybook**: `npm run storybook`

---

## Accessibility Checklist

When building or migrating components, ensure:

### Keyboard Navigation
- [ ] All interactive elements focusable with Tab
- [ ] Focus order is logical (matches visual order)
- [ ] Focus indicators visible (outline or ring)
- [ ] Escape key closes modals/sheets
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate lists/grids (if applicable)

### Screen Readers
- [ ] All buttons have accessible labels (`aria-label` or text content)
- [ ] Images have alt text (or `aria-hidden` if decorative)
- [ ] Form inputs have associated labels
- [ ] Error messages announced (`aria-live="assertive"`)
- [ ] Loading states announced (`role="status"`, `aria-busy`)
- [ ] Modals have `role="dialog"`, `aria-modal="true"`
- [ ] Focus trapped in modals (Tab doesn't escape)

### Color & Contrast
- [ ] Text contrast ≥4.5:1 for normal text
- [ ] UI component contrast ≥3:1
- [ ] Interactive elements distinguishable without color alone
- [ ] Dark mode styling correct (test both themes)

### Touch Targets
- [ ] All tap targets ≥44×44px (iOS HIG standard)
- [ ] Adjacent targets have ≥8px spacing
- [ ] Swipe gestures have visual feedback
- [ ] Long-press shows preview/tooltip (if applicable)

### Motion & Animation
- [ ] Respects `prefers-reduced-motion` (disable non-essential animations)
- [ ] Animations ≤300ms (mobile attention span)
- [ ] No auto-playing animations >5 seconds (WCAG guideline)

### Testing Tools
- **Automated**: Run `axe-core` in Jest tests
- **Manual**: Test with screen reader (VoiceOver on iOS, TalkBack on Android)
- **Visual**: Use Chrome DevTools accessibility inspector

---

## Performance Best Practices

### Bundle Size

- ✅ Import from `@/components/unified-tma` (tree-shaking enabled)
- ✅ Use dynamic imports for large variants (error illustrations)
- ✅ Lazy load modals (loaded on demand, not initial bundle)
- ❌ Don't import entire framer-motion (use `@/lib/motion` or `MotionWrapper`)

**Example: Lazy Modal Content**
```tsx
import { lazy, Suspense } from 'react';
const MixerPanelContent = lazy(() => import('./MixerPanelContent'));

<UnifiedPanel>
  <StudioPanelHeader title="Mixer" onClose={onClose} />
  <Suspense fallback={<UnifiedSkeleton variant="list" count={5} />}>
    <MixerPanelContent />
  </Suspense>
</UnifiedPanel>
```

---

### Rendering Performance

- ✅ Use `UnifiedSkeleton` for loading states (instant render)
- ✅ Virtualize long lists (react-virtuoso)
- ✅ Memoize expensive components (`React.memo`)
- ✅ Use `usePanelState` for scroll persistence (prevents re-renders)
- ❌ Don't render all bottom sheet content upfront (lazy load)

**Example: Virtualized Grid with Skeleton**
```tsx
import { Virtuoso } from 'react-virtuoso';
import { UnifiedSkeleton } from '@/components/unified-tma';

function LibraryGrid() {
  const { data: tracks, isLoading } = useTracks();

  if (isLoading) {
    return <UnifiedSkeleton variant="list" count={10} />;
  }

  return (
    <Virtuoso
      data={tracks}
      itemContent={(index, track) => <TrackCard track={track} />}
      style={{ height: '100vh' }}
    />
  );
}
```

---

### Animation Performance

- ✅ Use GPU-accelerated properties (`transform`, `opacity`)
- ✅ Use `MotionWrapper` (optimized presets)
- ✅ Disable animations for reduced motion users
- ❌ Don't animate `width`, `height`, `top`, `left` (causes layout thrash)

**Good Animation** (GPU-accelerated):
```tsx
<MotionWrapper preset="slide-up">
  {/* Uses transform: translateY (GPU) */}
</MotionWrapper>
```

**Bad Animation** (CPU-heavy):
```tsx
<motion.div animate={{ height: open ? 200 : 0 }}>
  {/* Causes layout recalculation on every frame */}
</motion.div>
```

---

## Common Pitfalls

### 1. Forgetting Safe Areas

**Problem**: Content hidden behind notch or home indicator.

❌ **Wrong**:
```tsx
<div className="fixed bottom-0 left-0 right-0 p-4">
  <UnifiedButton>Submit</UnifiedButton>
</div>
```

✅ **Correct**:
```tsx
<UnifiedSafeArea bottom>
  <div className="fixed bottom-0 left-0 right-0 p-4">
    <UnifiedButton>Submit</UnifiedButton>
  </div>
</UnifiedSafeArea>
```

---

### 2. Not Using TouchTarget for Small Elements

**Problem**: Tap targets <44×44px are hard to tap on mobile.

❌ **Wrong**:
```tsx
<button className="p-1">
  <CloseIcon className="h-4 w-4" />
</button>
```

✅ **Correct**:
```tsx
import { TouchTarget } from '@/components/unified-tma/primitives';

<TouchTarget minSize={44} haptic>
  <CloseIcon className="h-4 w-4" />
</TouchTarget>
```

---

### 3. Hardcoding Animation Timings

**Problem**: Inconsistent animation durations across app.

❌ **Wrong**:
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.25 }} // Hardcoded
>
  {children}
</motion.div>
```

✅ **Correct**:
```tsx
<MotionWrapper preset="fade" duration="fast">
  {children}
</MotionWrapper>
```

---

### 4. Not Persisting Panel State

**Problem**: Users lose scroll position when navigating away.

❌ **Wrong**:
```tsx
<StudioPanelContent scrollable>
  {/* Scroll position lost on unmount */}
</StudioPanelContent>
```

✅ **Correct**:
```tsx
<StudioPanelContent scrollable persistState panelId="mixer-panel">
  {/* Scroll position saved to sessionStorage */}
</StudioPanelContent>
```

---

### 5. Importing framer-motion Directly

**Problem**: Increases bundle size (418+ files import directly).

❌ **Wrong**:
```tsx
import { motion } from 'framer-motion';
```

✅ **Correct**:
```tsx
import { MotionWrapper } from '@/components/unified-tma/primitives';
// or
import { motion } from '@/lib/motion'; // Tree-shaken import
```

---

## Troubleshooting

### Component Not Rendering

**Symptom**: Component doesn't appear on screen.

**Checks**:
1. Is it inside a safe area container? (content may be clipped)
2. Is the parent `overflow: hidden`? (panel may be hidden)
3. Is it behind a modal backdrop? (z-index conflict)
4. Check React DevTools: Is component mounted?

---

### Haptic Feedback Not Working

**Symptom**: No haptic response on button tap.

**Checks**:
1. Test on real iOS device (doesn't work in simulator)
2. Check Telegram settings: Haptics enabled?
3. Check component prop: `haptic={true}`
4. Check browser console: `window.Telegram.WebApp.HapticFeedback` available?

---

### Scroll Position Not Persisting

**Symptom**: Panel scroll resets on navigation.

**Checks**:
1. Is `persistState={true}` set on `StudioPanelContent`?
2. Is `panelId` unique? (duplicate IDs overwrite state)
3. Check sessionStorage: `sessionStorage.getItem('panel-state-mixer')` should have JSON
4. Is sessionStorage quota exceeded? (max 5 MB)

---

### Bottom Sheet Snap Points Not Working

**Symptom**: Sheet doesn't snap to expected heights.

**Checks**:
1. Are snap points between 0.1 and 1.0? (percentages, not pixels)
2. Is `currentSnapPoint` controlled? (need state + `onSnapPointChange`)
3. Check viewport height: `window.innerHeight` correct?
4. Are there conflicting CSS `height` styles?

---

### Bundle Size Exceeded

**Symptom**: `npm run size` fails with "Bundle size exceeded".

**Checks**:
1. Run `npm run size:why` to analyze bundle composition
2. Check for direct framer-motion imports: `grep -r "from 'framer-motion'" src/`
3. Are error illustrations lazy loaded? (should be dynamic imports)
4. Are modals lazy loaded? (large components should be lazy)

---

### Accessibility Score Low

**Symptom**: Lighthouse accessibility score <95.

**Checks**:
1. Run axe-core: `npm run test:a11y` (if configured)
2. Check color contrast: Use browser DevTools > Accessibility panel
3. Check ARIA attributes: All interactive elements have labels?
4. Check keyboard navigation: Can you Tab through all elements?
5. Check focus indicators: Visible outline/ring on focus?

---

## Getting Help

- **Documentation**: Read [plan.md](plan.md) for architecture details
- **Examples**: Browse `.storybook/stories/unified-tma/` for all component variants
- **Codebase**: Reference existing components in `src/components/ui/` (button.tsx, sheet.tsx, dialog.tsx)
- **Issues**: Check GitHub Issues for known problems or create a new issue

---

**Last Updated**: 2026-01-05 | **Version**: 1.0.0 | **Maintainer**: Engineering Team
