# Implementation Plan: UI Improvement System

**Feature Branch**: `001-ui-improvements`
**Created**: 2025-01-24
**Status**: Draft
**Specification**: [spec.md](./spec.md)

---

## Overview

This plan defines the technical implementation approach for the UI Improvement System feature. It breaks down the work into 4 sprints with specific tasks, file structures, and dependencies.

---

## Sprint Planning

### Sprint 031-032: Critical Foundation (2 weeks)
**Focus**: Component refactoring and core utilities

### Sprint 032-033: Architecture Improvements (2 weeks)
**Focus**: Design tokens, z-index, responsive components

### Sprint 033-034: UX/UI Polish (2 weeks)
**Focus**: Gesture management, safe areas, loading states

### Sprint 034-035: Performance & Finalization (2 weeks)
**Focus**: Virtualization, optimization, testing

---

## Phase 1: Critical Foundation (Sprint 031-032)

### 1.1 Component Refactoring

#### Task 1.1.1: Split StudioShell.tsx (1835 lines)

**Target File**: `src/components/studio/unified/StudioShell.tsx`

**Create New Structure**:
```
src/components/studio/unified/StudioShell/
├── StudioShell.tsx                 # Main wrapper (~200 lines)
├── StudioShellHeader.tsx           # Header with title, actions (~150 lines)
├── StudioShellSidebar.tsx          # Desktop sidebar (~100 lines)
├── StudioShellMobileNav.tsx        # Mobile bottom navigation (~100 lines)
├── StudioShellContent.tsx          # Content area wrapper (~100 lines)
├── StudioShellTransportBar.tsx     # Transport controls (~200 lines)
├── StudioDialogs.tsx               # Dialog components (~300 lines)
└── index.ts                        # Exports
```

**Implementation Steps**:
1. Create `StudioShell/` directory
2. Extract header logic to `StudioShellHeader.tsx`
3. Extract sidebar to `StudioShellSidebar.tsx`
4. Extract mobile nav to `StudioShellMobileNav.tsx`
5. Extract transport to `StudioShellTransportBar.tsx`
6. Update `StudioShell.tsx` to compose subcomponents
7. Update imports across the codebase
8. Test all studio functionality

**Dependencies**:
- Existing `@/hooks/useMediaQuery`
- Existing `@/components/ui/*` components
- Existing studio state from `@/stores/unifiedStudioStore`

**Imports to Update**:
```typescript
// Before
import { StudioShell } from '@/components/studio/unified/StudioShell';

// After (internal imports unchanged, external may need update)
import { StudioShell } from '@/components/studio/unified/StudioShell';
// StudioShell/index.ts exports all subcomponents
```

---

#### Task 1.1.2: Split UnifiedStudioContent.tsx (1477 lines)

**Target File**: `src/components/studio/unified/UnifiedStudioContent.tsx`

**Create New Structure**:
```
src/components/studio/unified/content/
├── UnifiedStudioContent.tsx         # Main wrapper (~150 lines)
├── StudioAudioManager.tsx           # Audio state & logic (~200 lines)
├── StudioMixerControls.tsx          # Mixer UI (~300 lines)
├── StudioSectionEditor.tsx          # Section editing (~300 lines)
├── StudioPlaybackControls.tsx       # Playback UI (~200 lines)
├── StudioTimeline.tsx               # Timeline component (~250 lines)
└── index.ts
```

**Implementation Steps**:
1. Create `content/` directory
2. Extract audio state logic to `StudioAudioManager.tsx`
3. Extract mixer UI to `StudioMixerControls.tsx`
4. Extract section editing to `StudioSectionEditor.tsx`
5. Extract playback controls to `StudioPlaybackControls.tsx`
6. Extract timeline to `StudioTimeline.tsx`
7. Create main wrapper in `UnifiedStudioContent.tsx`
8. Wire up all subcomponents
9. Test functionality

**Dependencies**:
- `@/hooks/audio/usePlayerState`
- `@/hooks/audio/useGlobalAudioPlayer`
- `@/stores/useUnifiedStudioStore`

---

#### Task 1.1.3: Split QuickCompare.tsx (1046 lines)

**Target File**: `src/components/stem-studio/QuickCompare.tsx`

**Create New Structure**:
```
src/components/stem-studio/
├── QuickCompare.tsx                 # Main component (~200 lines)
├── QuickCompareLogic.ts             # Comparison logic (~300 lines)
├── QuickCompareWaveform.tsx         # Waveform display (~200 lines)
├── QuickCompareControls.tsx         # Playback controls (~150 lines)
└── useQuickCompare.ts               # Custom hook (~200 lines)
```

**Implementation Steps**:
1. Extract business logic to `useQuickCompare.ts` hook
2. Extract waveform display to `QuickCompareWaveform.tsx`
3. Extract controls to `QuickCompareControls.tsx`
4. Update main component to use hook and subcomponents
5. Test comparison functionality

**Dependencies**:
- `@/hooks/audio/useAudioTime`
- `@/lib/audioContextManager`

---

### 1.2 Touch Target Component

#### Task 1.2.1: Create TouchTarget Component

**New File**: `src/components/ui/touch-target.tsx`

```typescript
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'min' | 'comfortable' | 'large';
  children: React.ReactNode;
}

const sizeClasses = {
  min: 'min-h-[44px] min-w-[44px]',
  comfortable: 'min-h-[48px] min-w-[48px]',
  large: 'min-h-[56px] min-w-[56px]',
};

export const TouchTarget = forwardRef<HTMLDivElement, TouchTargetProps>(
  ({ className, size = 'min', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          sizeClasses[size],
          'touch-manipulation',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TouchTarget.displayName = 'TouchTarget';
```

**Update Files**:
- `src/components/ui/index.ts` - export TouchTarget
- `src/components/mobile/MobileHeaderBar.tsx:88` - use TouchTarget
- `src/components/player/CompactPlayer.tsx:201` - use TouchTarget

---

### 1.3 Animation Presets

#### Task 1.3.1: Extend Motion Presets

**Target File**: `src/lib/motion.ts`

**Add to File** (after existing exports):
```typescript
// Mobile-specific transitions
export const mobileSlideUp: import('framer-motion').Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: springTransition,
};

export const mobileFadeIn: import('framer-motion').Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: quickTransition,
};

// Card animations
export const cardEnter: import('framer-motion').Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
  transition: smoothTransition,
};

// List stagger animations
export const listContainer: import('framer-motion').Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const listItem: import('framer-motion').Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: smoothTransition,
};
```

---

## Phase 2: Architecture Improvements (Sprint 032-033)

### 2.1 Design Token System

#### Task 2.1.1: Create Color Token Utility

**New File**: `src/lib/color-tokens.ts`

```typescript
/**
 * Color token utilities for consistent theming
 * Replaces hardcoded color values
 */

export const colorTokens = {
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

// Helper functions for opacity variations
export function withOpacity(token: string, opacity: number): string {
  return token.replace(')', ` / ${opacity})`).replace('hsl', 'hsla');
}

// Gradient helpers
export function gradient(from: string, to: string, deg = 135): string {
  return `linear-gradient(${deg}deg, ${from}, ${to})`;
}
```

---

#### Task 2.1.2: Z-Index Utility

**New File**: `src/lib/z-index.ts`

```typescript
/**
 * Z-index scale constants
 * Aligned with Tailwind config
 */

export const zIndex = {
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

// Numeric values for inline styles
export const zIndexValues = {
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
```

**Update**: `tailwind.config.ts` - add missing z-index values:
```typescript
zIndex: {
  'sheet-backdrop': '80',
  'sheet-content': '81',
  'player-overlay': '61',
}
```

---

### 2.2 Responsive Components

#### Task 2.2.1: Create Responsive Wrapper

**New File**: `src/components/responsive/Responsive.tsx`

```typescript
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface ResponsiveProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Desktop-only content (shown on screens >= 640px)
 */
export function Desktop({ children, className }: ResponsiveProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  return isDesktop ? <div className={className}>{children}</div> : null;
}

/**
 * Mobile-only content (shown on screens < 640px)
 */
export function Mobile({ children, className }: ResponsiveProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  return isMobile ? <div className={className}>{children}</div> : null;
}

/**
 * Responsive container with different layouts
 */
export function ResponsiveContainer({
  mobile,
  desktop,
  className
}: {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  className?: string;
}) {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  return <div className={className}>{isDesktop ? desktop : mobile}</div>;
}
```

**New File**: `src/components/responsive/index.ts`

```typescript
export { Desktop, Mobile, ResponsiveContainer } from './Responsive';
```

---

### 2.3 Safe Area Component

#### Task 2.3.1: Create SafeArea Components

**New File**: `src/components/ui/safe-area.tsx`

```typescript
import { cn } from '@/lib/utils';
import { TELEGRAM_SAFE_AREA } from '@/constants/safe-area';

interface SafeAreaProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

export function SafeArea({
  children,
  className,
  top = false,
  bottom = false,
  left = false,
  right = false,
}: SafeAreaProps) {
  const style: React.CSSProperties = {};

  if (top) {
    style.paddingTop = TELEGRAM_SAFE_AREA.headerTop;
  }
  if (bottom) {
    style.paddingBottom = TELEGRAM_SAFE_AREA.bottomWithPadding;
  }
  if (left) {
    style.paddingLeft = 'max(1rem, var(--tg-safe-area-inset-left), env(safe-area-inset-left))';
  }
  if (right) {
    style.paddingRight = 'max(1rem, var(--tg-safe-area-inset-right), env(safe-area-inset-right))';
  }

  return (
    <div className={cn('safe-area-wrapper', className)} style={style}>
      {children}
    </div>
  );
}

// Preset variants
export function SafeAreaTop({ children, className }: Omit<SafeAreaProps, 'top'>) {
  return <SafeArea top className={className}>{children}</SafeArea>;
}

export function SafeAreaBottom({ children, className }: Omit<SafeAreaProps, 'bottom'>) {
  return <SafeArea bottom className={className}>{children}</SafeArea>;
}

export function SafeAreaVertical({ children, className }: Omit<SafeAreaProps, 'top' | 'bottom'>) {
  return <SafeArea top bottom className={className}>{children}</SafeArea>;
}
```

**Update**: `src/components/ui/index.ts` - export SafeArea components

---

## Phase 3: UX/UI Polish (Sprint 033-034)

### 3.1 Gesture Management

#### Task 3.1.1: Create Gesture Manager

**New File**: `src/lib/gesture-manager.ts`

```typescript
/**
 * Gesture priority system to prevent conflicts
 * Priority: double-tap > swipe > drag > tap
 */

import type { PanInfo } from '@/lib/motion';

export type GestureType = 'tap' | 'double-tap' | 'swipe' | 'drag' | 'long-press';

export interface GestureHandler {
  type: GestureType;
  priority: number;
  handler: (event: MouseEvent | TouchEvent | PointerEvent, info?: PanInfo) => void;
  threshold?: {
    distance?: number;
    velocity?: number;
    duration?: number;
  };
}

export class GestureManager {
  private handlers: Map<string, GestureHandler> = new Map();
  private lastTap: { time: number; x: number; y: number } = { time: 0, x: 0, y: 0 };
  private activeGesture: GestureType | null = null;

  register(id: string, handler: GestureHandler) {
    this.handlers.set(id, handler);
  }

  unregister(id: string) {
    this.handlers.delete(id);
  }

  handleTap(event: MouseEvent | TouchEvent | PointerEvent) {
    const now = Date.now();
    const x = 'touches' in event ? event.touches[0]?.clientX : (event as MouseEvent).clientX;
    const y = 'touches' in event ? event.touches[0]?.clientY : (event as MouseEvent).clientY;

    // Check for double-tap
    if (now - this.lastTap.time < 300) {
      this.executeGesture('double-tap', event);
      this.lastTap = { time: 0, x: 0, y: 0 };
      return;
    }

    this.lastTap = { time: now, x: x ?? 0, y: y ?? 0 };
    this.executeGesture('tap', event);
  }

  handleSwipe(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { velocity, offset } = info;

    // Check horizontal swipe
    if (Math.abs(offset.x) > 80 || Math.abs(velocity.x) > 400) {
      this.executeGesture('swipe', event, info);
    }
  }

  handleDrag(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (this.activeGesture && this.activeGesture !== 'drag') return;
    this.activeGesture = 'drag';
    this.executeGesture('drag', event, info);
  }

  private executeGesture(
    type: GestureType,
    event: MouseEvent | TouchEvent | PointerEvent,
    info?: PanInfo
  ) {
    // Sort by priority (higher first)
    const sortedHandlers = Array.from(this.handlers.values())
      .filter(h => h.type === type)
      .sort((a, b) => b.priority - a.priority);

    for (const handler of sortedHandlers) {
      if (this.checkThreshold(handler, info)) {
        handler.handler(event, info);
        this.activeGesture = type;
        break;
      }
    }
  }

  private checkThreshold(handler: GestureHandler, info?: PanInfo): boolean {
    if (!handler.threshold || !info) return true;

    const { threshold } = handler;
    const { velocity, offset } = info;

    if (threshold.distance && Math.abs(offset.x) < threshold.distance) return false;
    if (threshold.velocity && Math.abs(velocity.x) < threshold.velocity) return false;

    return true;
  }

  reset() {
    this.activeGesture = null;
  }
}

// Singleton instance
export const gestureManager = new GestureManager();
```

---

#### Task 3.1.2: Update useGestures Hook

**Target File**: `src/hooks/useGestures.ts`

**Replace Content** with:
```typescript
/**
 * Unified gesture hook with conflict prevention
 */

import { useCallback, useRef, useEffect } from 'react';
import { gestureManager, type GestureHandler } from '@/lib/gesture-manager';

export interface UseGesturesParams {
  onTap?: (e: MouseEvent | TouchEvent | PointerEvent) => void;
  onDoubleTap?: (e: MouseEvent | TouchEvent | PointerEvent) => void;
  onSwipeLeft?: (e: MouseEvent | TouchEvent | PointerEvent, info: import('framer-motion').PanInfo) => void;
  onSwipeRight?: (e: MouseEvent | TouchEvent | PointerEvent, info: import('framer-motion').PanInfo) => void;
  onSwipeUp?: (e: MouseEvent | TouchEvent | PointerEvent, info: import('framer-motion').PanInfo) => void;
  onSwipeDown?: (e: MouseEvent | TouchEvent | PointerEvent, info: import('framer-motion').PanInfo) => void;
  onDrag?: (e: MouseEvent | TouchEvent | PointerEvent, info: import('framer-motion').PanInfo) => void;
  swipeThreshold?: number;
  swipeVelocity?: number;
}

export function useGestures(params: UseGesturesParams) {
  const id = useRef(`gesture-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const { onTap, onDoubleTap, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDrag, swipeThreshold = 80, swipeVelocity = 400 } = params;

    // Register tap handler
    if (onTap) {
      gestureManager.register(`${id.current}-tap`, {
        type: 'tap',
        priority: 1,
        handler: onTap,
      });
    }

    // Register double-tap handler (higher priority)
    if (onDoubleTap) {
      gestureManager.register(`${id.current}-double-tap`, {
        type: 'double-tap',
        priority: 10,
        handler: onDoubleTap,
      });
    }

    // Register swipe handlers
    if (onSwipeLeft || onSwipeRight || onSwipeUp || onSwipeDown) {
      const swipeHandler: GestureHandler['handler'] = (e, info) => {
        if (!info) return;
        const { offset, velocity } = info;

        if (Math.abs(offset.x) > Math.abs(offset.y)) {
          // Horizontal swipe
          if (offset.x < 0 && onSwipeLeft) {
            onSwipeLeft(e, info as any);
          } else if (offset.x > 0 && onSwipeRight) {
            onSwipeRight(e, info as any);
          }
        } else {
          // Vertical swipe
          if (offset.y < 0 && onSwipeUp) {
            onSwipeUp(e, info as any);
          } else if (offset.y > 0 && onSwipeDown) {
            onSwipeDown(e, info as any);
          }
        }
      };

      gestureManager.register(`${id.current}-swipe`, {
        type: 'swipe',
        priority: 5,
        handler: swipeHandler,
        threshold: { distance: swipeThreshold, velocity: swipeVelocity },
      });
    }

    // Register drag handler
    if (onDrag) {
      gestureManager.register(`${id.current}-drag`, {
        type: 'drag',
        priority: 2,
        handler: onDrag,
      });
    }

    return () => {
      gestureManager.unregister(`${id.current}-tap`);
      gestureManager.unregister(`${id.current}-double-tap`);
      gestureManager.unregister(`${id.current}-swipe`);
      gestureManager.unregister(`${id.current}-drag`);
    };
  }, [params]);

  // Return compatible gesture handlers for framer-motion
  return {
    gestureHandlers: {
      onTap: params.onTap,
      onDragEnd: (e: any, info: any) => {
        gestureManager.handleSwipe(e, info);
        if (params.onDrag) params.onDrag(e, info);
      },
    },
  };
}
```

---

### 3.2 Form System

#### Task 3.2.1: Create Field Component

**New File**: `src/components/form/Field.tsx`

```typescript
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ className, label, error, required, description, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('field', 'mb-4', className)} {...props}>
      {label && (
        <label className="field-label block text-sm font-medium mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {description && (
        <p className="field-description text-xs text-muted-foreground mt-1">
          {description}
        </p>
      )}
      {error && (
        <p className="field-error text-xs text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

Field.displayName = 'Field';
```

**New File**: `src/components/form/index.ts`

```typescript
export { Field } from './Field';
export { Form, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
```

---

### 3.3 Loading States

#### Task 3.3.1: Create Skeleton Components

**New File**: `src/components/loading/Skeleton.tsx`

```typescript
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

// Preset skeletons
export function TrackCardSkeleton() {
  return (
    <div className="p-3 sm:p-4 rounded-xl border border-border/50">
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" width={48} height={48} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton variant="text" className="mb-2" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

**New File**: `src/components/loading/index.ts`

```typescript
export { Skeleton, TrackCardSkeleton, ListSkeleton } from './Skeleton';
```

---

## Phase 4: Performance & Testing (Sprint 034-035)

### 4.1 Virtualization

#### Task 4.1.1: Create Virtualized List Component

**New File**: `src/components/virtualized/VirtualizedList.tsx`

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: () => number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = () => 72, // Default track card height
  overscan = 5,
  className,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
  });

  return (
    <div ref={parentRef} className={cn('overflow-auto', className)}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**New File**: `src/components/virtualized/index.ts`

```typescript
export { VirtualizedList } from './VirtualizedList';
```

---

#### Task 4.1.2: Apply Virtualization to Library

**Target File**: `src/components/library/TrackLibrary.tsx`

**Update**: Replace static list rendering with `VirtualizedList`

**Dependencies**:
- `@tanstack/react-virtual` - add to package.json if not present

---

### 4.2 Testing

#### Task 4.2.1: Create Unit Tests

**New Files**:
```
src/lib/__tests__/
├── gesture-manager.test.ts
├── color-tokens.test.ts
└── z-index.test.ts

src/components/ui/__tests__/
├── touch-target.test.tsx
├── safe-area.test.tsx
└── skeleton.test.tsx

src/hooks/__tests__/
└── use-gestures.test.ts
```

#### Task 4.2.2: Integration Tests

**New File**: `tests/integration/gestures.integration.test.ts`

#### Task 4.2.3: Visual Regression Tests

**New File**: `tests/e2e/visual-regression/design-system.spec.ts`

---

## Task Summary

### Sprint 031-032 (8 tasks)

1. Split StudioShell.tsx (3 days)
2. Split UnifiedStudioContent.tsx (3 days)
3. Split QuickCompare.tsx (2 days)
4. Create TouchTarget component (1 day)
5. Update MobileHeaderBar (0.5 day)
6. Update CompactPlayer (0.5 day)
7. Extend motion presets (1 day)
8. Create useReducedMotion hook (0.5 day)

### Sprint 032-033 (10 tasks)

1. Create color token utility (1 day)
2. Migrate hardcoded colors (2 days)
3. Create z-index utility (1 day)
4. Fix z-index conflicts (2 days)
5. Create responsive components (2 days)
6. Create SafeArea components (1 day)
7. Apply SafeArea to mobile screens (1 day)
8. Update player z-index (0.5 day)
9. Update bottom sheet z-index (0.5 day)
10. Update gesture components (1 day)

### Sprint 033-034 (12 tasks)

1. Create gesture manager (2 days)
2. Update useGestures hook (1 day)
3. Fix gesture conflicts in player (2 days)
4. Fix gesture conflicts in lists (1 day)
5. Fix gesture conflicts in studio (2 days)
6. Create Field component (1 day)
7. Create Skeleton components (1 day)
8. Apply skeletons to library (1 day)
9. Apply skeletons to forms (0.5 day)
10. Test gesture priority system (1 day)
11. Test safe areas on devices (1 day)
12. Document gesture patterns (0.5 day)

### Sprint 034-035 (8 tasks)

1. Create VirtualizedList component (2 days)
2. Apply to TrackLibrary (2 days)
3. Apply to PlaylistView (1 day)
4. Update LazyImage (1 day)
5. Optimize animations (2 days)
6. Performance profiling (1 day)
7. Bundle size check (0.5 day)
8. Final testing and fixes (1 day)

---

## Dependencies

### Required Packages

Check if these are installed:
```json
{
  "@tanstack/react-virtual": "^3.0.0",
  "framer-motion": "^11.0.0"
}
```

### Internal Dependencies

All new utilities depend on:
- `@/lib/utils` - `cn()` utility
- `@/lib/motion` - animation presets
- `@/constants/safe-area.ts` - safe area formulas
- `@/lib/design-tokens.ts` - design tokens
- `@/hooks/useMediaQuery` - responsive detection

---

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── touch-target.tsx         # NEW
│   │   ├── safe-area.tsx            # NEW
│   │   └── index.ts                 # UPDATED
│   ├── responsive/
│   │   ├── Responsive.tsx           # NEW
│   │   └── index.ts                 # NEW
│   ├── form/
│   │   ├── Field.tsx                # NEW
│   │   └── index.ts                 # NEW
│   ├── loading/
│   │   ├── Skeleton.tsx             # NEW
│   │   └── index.ts                 # NEW
│   ├── virtualized/
│   │   ├── VirtualizedList.tsx      # NEW
│   │   └── index.ts                 # NEW
│   ├── studio/
│   │   └── unified/
│   │       ├── StudioShell/         # NEW DIRECTORY
│   │       │   ├── StudioShell.tsx
│   │       │   ├── StudioShellHeader.tsx
│   │       │   ├── StudioShellSidebar.tsx
│   │       │   ├── StudioShellMobileNav.tsx
│   │       │   ├── StudioShellContent.tsx
│   │       │   ├── StudioShellTransportBar.tsx
│   │       │   ├── StudioDialogs.tsx
│   │       │   └── index.ts
│   │       └── content/             # NEW DIRECTORY
│   │           ├── UnifiedStudioContent.tsx
│   │           ├── StudioAudioManager.tsx
│   │           ├── StudioMixerControls.tsx
│   │           ├── StudioSectionEditor.tsx
│   │           ├── StudioPlaybackControls.tsx
│   │           ├── StudioTimeline.tsx
│   │           └── index.ts
│   └── stem-studio/
│       ├── QuickCompare.tsx         # REFACTORED
│       ├── QuickCompareLogic.tsx    # NEW
│       ├── QuickCompareWaveform.tsx # NEW
│       ├── QuickCompareControls.tsx # NEW
│       └── useQuickCompare.ts       # NEW
├── hooks/
│   ├── useGestures.ts               # UPDATED
│   └── useReducedMotion.ts          # NEW
├── lib/
│   ├── color-tokens.ts              # NEW
│   ├── z-index.ts                   # NEW
│   ├── gesture-manager.ts           # NEW
│   └── motion.ts                    # EXTENDED
└── tests/
    ├── unit/
    │   ├── lib/
    │   │   ├── gesture-manager.test.ts
    │   │   ├── color-tokens.test.ts
    │   │   └── z-index.test.ts
    │   └── components/
    │       ├── ui/
    │       │   ├── touch-target.test.tsx
    │       │   └── safe-area.test.tsx
    │       └── loading/
    │           └── skeleton.test.tsx
    └── integration/
        └── gestures.integration.test.ts
```

---

## Import Paths

All new components use `@/` alias:

```typescript
// Touch targets
import { TouchTarget } from '@/components/ui/touch-target';

// Responsive
import { Desktop, Mobile, ResponsiveContainer } from '@/components/responsive';

// Safe areas
import { SafeArea, SafeAreaTop, SafeAreaBottom } from '@/components/ui/safe-area';

// Gestures
import { useGestures } from '@/hooks/useGestures';
import { gestureManager } from '@/lib/gesture-manager';

// Colors
import { colorTokens, withOpacity } from '@/lib/color-tokens';

// Z-index
import { zIndex, zIndexValues } from '@/lib/z-index';

// Loading
import { Skeleton, TrackCardSkeleton, ListSkeleton } from '@/components/loading';

// Forms
import { Field } from '@/components/form';

// Motion
import { mobileSlideUp, cardEnter, listContainer } from '@/lib/motion';
```

---

## Migration Checklist

For each component migration:

- [ ] Create new component file
- [ ] Add exports to index.ts
- [ ] Update imports in consuming files
- [ ] Test functionality
- [ ] Update TypeScript types if needed
- [ ] Add unit tests
- [ ] Update documentation

---

## Rollback Plan

If any migration fails:

1. Revert the specific file
2. Restore previous imports
3. Document the issue
4. Create a follow-up task

All changes are additive (new files) before modifying existing ones, ensuring safe rollback.
