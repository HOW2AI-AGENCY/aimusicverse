# Data Model: UI Improvement System

**Feature Branch**: `001-ui-improvements`
**Created**: 2026-01-24
**Purpose**: Define data structures and entities for UI system components

---

## Overview

This document defines the TypeScript interfaces and data structures for the UI Improvement System. These are NOT database entities - they are UI component props and internal state structures.

---

## 1. Component Entities

### 1.1 TouchTarget

**Purpose:** Wrapper component ensuring minimum touch target size

```typescript
interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Minimum touch target size */
  size?: 'min' | 'comfortable' | 'large';
  /** Child content to wrap */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/** Size variants in pixels */
type TouchTargetSize = {
  min: 44;      // iOS HIG minimum
  comfortable: 48;  // Material Design
  large: 56;    // Large touch targets
};
```

**Usage Example:**
```typescript
<TouchTarget size="min">
  <Button>Click Me</Button>
</TouchTarget>
```

---

### 1.2 SafeArea

**Purpose:** Component for handling device safe areas (notch, home indicator)

```typescript
interface SafeAreaProps {
  /** Child content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Apply top safe area (notch/Dynamic Island) */
  top?: boolean;
  /** Apply bottom safe area (home indicator) */
  bottom?: boolean;
  /** Apply left safe area (curved edges) */
  left?: boolean;
  /** Apply right safe area (curved edges) */
  right?: boolean;
}

/** Computed safe area values */
interface SafeAreaInsets {
  top: string;    // CSS value for top inset
  bottom: string; // CSS value for bottom inset
  left: string;   // CSS value for left inset
  right: string;  // CSS value for right inset
}
```

**Usage Example:**
```typescript
<SafeArea top bottom>
  <MobileHeaderBar>Title</MobileHeaderBar>
</SafeArea>
```

---

### 1.3 ResponsiveContainer

**Purpose:** Conditional rendering based on screen size

```typescript
interface ResponsiveContainerProps {
  /** Content to show on mobile (<640px) */
  mobile: React.ReactNode;
  /** Content to show on desktop (>=640px) */
  desktop: React.ReactNode;
  /** Additional class names */
  className?: string;
}

interface DesktopProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileProps {
  children: React.ReactNode;
  className?: string;
}
```

**Usage Example:**
```typescript
<ResponsiveContainer
  mobile={<MobileBottomNav />}
  desktop={<SidebarNav />}
/>
```

---

### 1.4 Skeleton

**Purpose:** Loading placeholder with shimmer animation

```typescript
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Fixed width */
  width?: string | number;
  /** Fixed height */
  height?: string | number;
}

/** Preset skeleton components */
interface TrackCardSkeletonProps {
  className?: string;
}

interface ListSkeletonProps {
  /** Number of skeleton items to render */
  count?: number;
  className?: string;
}
```

---

### 1.5 VirtualizedList

**Purpose:** Performance-optimized list rendering

```typescript
interface VirtualizedListProps<T> {
  /** Data items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Estimated item height in pixels */
  estimateSize?: () => number;
  /** Number of items to render outside viewport */
  overscan?: number;
  /** Additional class names */
  className?: string;
}

/** Virtual item metadata */
interface VirtualItem {
  /** Unique key for the item */
  key: string;
  /** Item index in the list */
  index: number;
  /** Computed start position */
  start: number;
  /** Computed end position */
  end: number;
  /** Actual size after measurement */
  size: number;
}
```

---

## 2. Gesture System Entities

### 2.1 GestureHandler

**Purpose:** Gesture registration and priority configuration

```typescript
/** Supported gesture types */
type GestureType =
  | 'tap'           // Single tap (default)
  | 'double-tap'    // Double tap (300ms window)
  | 'swipe'         // Four-directional swipe
  | 'drag'          // Continuous drag
  | 'long-press';   // Long press (500ms)

/** Gesture handler configuration */
interface GestureHandler {
  /** Gesture type identifier */
  type: GestureType;
  /** Priority (higher = executed first) */
  priority: number;
  /** Handler callback */
  handler: (event: GestureEvent, info?: PanInfo) => void;
  /** Activation thresholds */
  threshold?: {
    /** Minimum distance in pixels */
    distance?: number;
    /** Minimum velocity in px/s */
    velocity?: number;
    /** Minimum duration in ms */
    duration?: number;
  };
}

/** Gesture event data */
type GestureEvent = MouseEvent | TouchEvent | PointerEvent;

/** Pan info from framer-motion */
interface PanInfo {
  /** Current offset from start */
  offset: { x: number; y: number };
  /** Current velocity */
  velocity: { x: number; y: number };
  /** Gesture direction */
  direction: [number, number];
}

/** Gesture priority constants */
const GESTURE_PRIORITIES = {
  DOUBLE_TAP: 10,
  SWIPE: 5,
  DRAG: 2,
  TAP: 1,
} as const;
```

---

### 2.2 GestureManager

**Purpose:** Centralized gesture conflict resolution

```typescript
class GestureManager {
  /** Registered gesture handlers */
  private handlers: Map<string, GestureHandler>;

  /** Last tap state for double-tap detection */
  private lastTap: {
    time: number;
    x: number;
    y: number;
  };

  /** Currently active gesture */
  private activeGesture: GestureType | null;

  /** Register a new gesture handler */
  register(id: string, handler: GestureHandler): void;

  /** Unregister a gesture handler */
  unregister(id: string): void;

  /** Handle tap events (single/double) */
  handleTap(event: GestureEvent): void;

  /** Handle swipe events */
  handleSwipe(event: GestureEvent, info: PanInfo): void;

  /** Handle drag events */
  handleDrag(event: GestureEvent, info: PanInfo): void;

  /** Reset active gesture state */
  reset(): void;
}

/** Singleton instance */
export const gestureManager = new GestureManager();
```

---

### 2.3 useGestures Hook

**Purpose:** React hook for gesture handling

```typescript
interface UseGesturesParams {
  /** Tap handler */
  onTap?: (e: GestureEvent) => void;
  /** Double-tap handler */
  onDoubleTap?: (e: GestureEvent) => void;
  /** Swipe left handler */
  onSwipeLeft?: (e: GestureEvent, info: PanInfo) => void;
  /** Swipe right handler */
  onSwipeRight?: (e: GestureEvent, info: PanInfo) => void;
  /** Swipe up handler */
  onSwipeUp?: (e: GestureEvent, info: PanInfo) => void;
  /** Swipe down handler */
  onSwipeDown?: (e: GestureEvent, info: PanInfo) => void;
  /** Drag handler */
  onDrag?: (e: GestureEvent, info: PanInfo) => void;
  /** Swipe distance threshold (default 80px) */
  swipeThreshold?: number;
  /** Swipe velocity threshold (default 400px/s) */
  swipeVelocity?: number;
}

interface UseGesturesReturn {
  /** Framer Motion compatible handlers */
  gestureHandlers: {
    onTap?: (e: GestureEvent) => void;
    onDragEnd?: (e: any, info: any) => void;
  };
}
```

**Usage Example:**
```typescript
const { gestureHandlers } = useGestures({
  onSwipeLeft: () => console.log('swiped left'),
  onDoubleTap: () => console.log('double tapped'),
});
```

---

## 3. Design System Entities

### 3.1 Color Tokens

**Purpose:** Centralized color management

```typescript
/** Color token constants */
const colorTokens = {
  // Semantic colors
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',

  // Section colors
  generate: 'hsl(var(--generate))',
  library: 'hsl(var(--library))',
  projects: 'hsl(var(--projects))',
  community: 'hsl(var(--community))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',

  // Utility colors
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
} as const;

/** Color token type */
type ColorToken = keyof typeof colorTokens;

/** Opacity utility function */
function withOpacity(token: string, opacity: number): string {
  return token.replace(')', ` / ${opacity})`).replace('hsl', 'hsla');
}

/** Gradient utility function */
function gradient(from: string, to: string, deg?: number): string;
```

---

### 3.2 Z-Index Scale

**Purpose:** Semantic z-index management

```typescript
/** Z-index semantic names */
const zIndex = {
  base: 'z-base',
  raised: 'z-raised',
  sticky: 'z-sticky',
  floating: 'z-floating',
  overlay: 'z-overlay',
  navigation: 'z-navigation',
  player: 'z-player',
  contextual: 'z-contextual',
  dialog: 'z-dialog',
  fullscreen: 'z-fullscreen',
  system: 'z-system',
  dropdown: 'z-dropdown',
} as const;

/** Z-index numeric values */
const zIndexValues = {
  base: 0,
  raised: 10,
  sticky: 20,
  floating: 30,
  overlay: 40,
  navigation: 50,
  player: 60,
  contextual: 70,
  dialog: 80,
  fullscreen: 90,
  system: 100,
  dropdown: 200,
} as const;

/** Z-index type */
type ZIndex = keyof typeof zIndex;
```

---

## 4. Form System Entities

### 4.1 Field Component

**Purpose:** Form field wrapper with label, error, description

```typescript
interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Field label */
  label?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Helper description */
  description?: string;
  /** Field content (input, select, etc.) */
  children: React.ReactNode;
}

/** Form field context */
interface FieldContext {
  /** Field ID for label association */
  id: string;
  /** Error state */
  error?: string;
  /** Required state */
  required?: boolean;
}
```

**Usage Example:**
```typescript
<Field label="Track Name" required error="Name is required">
  <Input placeholder="Enter track name" />
</Field>
```

---

## 5. Animation Entities

### 5.1 Motion Presets

**Purpose:** Reusable animation variants

```typescript
/** Transition presets */
interface TransitionPreset {
  type: 'spring' | 'tween' | 'keyframes';
  bounce?: number;
  duration?: number;
  ease?: string | number[];
}

/** Variant definition */
type Variants = {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: TransitionPreset;
};

/** Mobile slide-up animation */
export const mobileSlideUp: Variants;

/** Mobile fade-in animation */
export const mobileFadeIn: Variants;

/** Card enter animation */
export const cardEnter: Variants;

/** List container stagger */
export const listContainer: Variants;

/** List item animation */
export const listItem: Variants;
```

---

## 6. Refactored Component Structures

### 6.1 StudioShell (After Split)

**Before:** 1835 lines (single file)

**After:**
```
src/components/studio/unified/StudioShell/
├── StudioShell.tsx                 # ~200 lines (main wrapper)
├── StudioShellHeader.tsx           # ~150 lines (header)
├── StudioShellSidebar.tsx          # ~100 lines (desktop nav)
├── StudioShellMobileNav.tsx        # ~100 lines (mobile nav)
├── StudioShellContent.tsx          # ~100 lines (content wrapper)
├── StudioShellTransportBar.tsx     # ~200 lines (transport controls)
├── StudioDialogs.tsx               # ~300 lines (all dialogs)
└── index.ts                        # exports
```

**Total:** ~1150 lines (but distributed in focused files)

---

### 6.2 UnifiedStudioContent (After Split)

**Before:** 1477 lines (single file)

**After:**
```
src/components/studio/unified/content/
├── UnifiedStudioContent.tsx         # ~150 lines (main wrapper)
├── StudioAudioManager.tsx           # ~200 lines (audio state)
├── StudioMixerControls.tsx          # ~300 lines (mixer UI)
├── StudioSectionEditor.tsx          # ~300 lines (section editing)
├── StudioPlaybackControls.tsx       # ~200 lines (playback UI)
├── StudioTimeline.tsx               # ~250 lines (timeline)
└── index.ts
```

**Total:** ~1400 lines (distributed in focused files)

---

### 6.3 QuickCompare (After Split)

**Before:** 1046 lines (single file)

**After:**
```
src/components/stem-studio/
├── QuickCompare.tsx                 # ~200 lines (main component)
├── QuickCompareLogic.tsx            # ~300 lines (comparison logic)
├── QuickCompareWaveform.tsx         # ~200 lines (waveform display)
├── QuickCompareControls.tsx         # ~150 lines (playback controls)
└── useQuickCompare.ts               # ~200 lines (custom hook)
```

**Total:** ~1050 lines (distributed in focused files)

---

## 7. Store Structure Recommendations

### 7.1 useUnifiedStudioStore Split

**Current:** 1361 lines (exceeds 500 line limit)

**Recommended Split:**

```
src/stores/studio/
├── useTrackStore.ts        # ~300 lines (track state)
├── useMixingStore.ts       # ~250 lines (mixing state)
├── useTimelineStore.ts     # ~300 lines (timeline state)
├── useStudioSettings.ts    # ~200 lines (settings)
└── index.ts                # ~311 lines (combiner)
```

**Note:** This is NOT in current plan.md - ADDITIONAL RECOMMENDATION

---

## Summary

| Entity | Type | Purpose |
|--------|------|---------|
| TouchTarget | Component | Minimum touch target wrapper |
| SafeArea | Component | Device safe area handling |
| ResponsiveContainer | Component | Conditional mobile/desktop rendering |
| Skeleton | Component | Loading placeholder |
| VirtualizedList | Component | Performance-optimized list |
| GestureHandler | Interface | Gesture configuration |
| GestureManager | Class | Centralized gesture management |
| useGestures | Hook | React gesture integration |
| colorTokens | Constant | Centralized color values |
| zIndex | Constant | Semantic z-index scale |
| Field | Component | Form field wrapper |

---

**Status**: Data model complete, ready for implementation
