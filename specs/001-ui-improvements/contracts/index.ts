# UI System Contracts

**Feature Branch**: `001-ui-improvements`
**Purpose**: TypeScript interfaces for new UI components and utilities

---

## TouchTarget Component

```typescript
// src/components/ui/touch-target.tsx
import { cn } from '@/lib/utils';

export interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'min' | 'comfortable' | 'large';
  children: React.ReactNode;
}

export const TouchTarget: React.FC<TouchTargetProps> = ({
  size = 'min',
  children,
  className,
  ...props
}) => {
  const sizeClasses = {
    min: 'min-h-[44px] min-w-[44px]',
    comfortable: 'min-h-[48px] min-w-[48px]',
    large: 'min-h-[56px] min-w-[56px]',
  };

  return (
    <div
      className={cn('inline-flex items-center justify-center', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  );
};
```

---

## SafeArea Component

```typescript
// src/components/ui/safe-area.tsx
import { cn } from '@/lib/utils';

export interface SafeAreaProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

export const SafeArea: React.FC<SafeAreaProps> = ({
  children,
  className,
  top = false,
  bottom = false,
  left = false,
  right = false,
}) => {
  const safeAreaClasses = cn(
    top && 'pt-safe-top',
    bottom && 'pb-safe-bottom',
    left && 'pl-safe-left',
    right && 'pr-safe-right',
    className
  );

  return (
    <div className={safeAreaClasses}>
      {children}
    </div>
  );
};
```

**Tailwind Config Required:**
```css
/* tailwind.config.js - Add to theme.extend */
safeAreaInset: {
  top: 'max(var(--tg-safe-area-inset-top), env(safe-area-inset-top), 0)',
  bottom: 'max(var(--tg-safe-area-inset-bottom), env(safe-area-inset-bottom), 0)',
  left: 'max(var(--tg-safe-area-inset-left), env(safe-area-inset-left), 0)',
  right: 'max(var(--tg-safe-area-inset-right), env(safe-area-inset-right), 0)',
}
```

---

## ResponsiveContainer Component

```typescript
// src/components/ui/responsive-container.tsx
import { cn } from '@/lib/utils';

export interface ResponsiveContainerProps {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  mobile,
  desktop,
  className,
}) => {
  return (
    <>
      {/* Mobile (< 640px) */}
      <div className={cn('sm:hidden', className)}>
        {mobile}
      </div>

      {/* Desktop (>= 640px) */}
      <div className={cn('hidden sm:block', className)}>
        {desktop}
      </div>
    </>
  );
};

// Shorthand components
export const Desktop: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('hidden sm:block', className)}>{children}</div>;

export const Mobile: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('sm:hidden', className)}>{children}</div>;
```

---

## Skeleton Component

```typescript
// src/components/ui/skeleton.tsx
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className,
  ...props
}) => {
  const variantClasses = {
    text: 'rounded h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-shimmer bg-muted/50',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
};

// Preset skeleton components
export const TrackCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center gap-3', className)}>
    <Skeleton variant="circular" width={56} height={56} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="70%" height={16} />
      <Skeleton variant="text" width="50%" height={14} />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <TrackCardSkeleton key={i} />
    ))}
  </div>
);
```

---

## GestureManager System

```typescript
// src/lib/gesture-manager.ts
import { PanInfo } from '@/lib/motion';

export type GestureType =
  | 'tap'
  | 'double-tap'
  | 'swipe'
  | 'drag'
  | 'long-press';

export interface GestureHandler {
  type: GestureType;
  priority: number;
  handler: (event: Event, info?: PanInfo) => void;
  threshold?: {
    distance?: number;
    velocity?: number;
    duration?: number;
  };
}

export const GESTURE_PRIORITIES = {
  DOUBLE_TAP: 10,
  SWIPE: 5,
  DRAG: 2,
  TAP: 1,
} as const;

export class GestureManager {
  private handlers = new Map<string, GestureHandler>();
  private lastTap: { time: number; x: number; y: number } | null = null;
  private activeGesture: GestureType | null = null;
  private gestureTimeout: NodeJS.Timeout | null = null;

  register(id: string, handler: GestureHandler): void {
    this.handlers.set(id, handler);
  }

  unregister(id: string): void {
    this.handlers.delete(id);
  }

  handleTap(event: MouseEvent | TouchEvent | PointerEvent): void {
    const now = Date.now();
    const point = this.getPoint(event);

    // Check for double-tap (300ms window)
    if (this.lastTap && now - this.lastTap.time < 300) {
      const distance = Math.hypot(point.x - this.lastTap.x, point.y - this.lastTap.y);
      if (distance < 50) {
        // Double-tap detected
        this.executeGesture('double-tap', event);
        this.lastTap = null;
        return;
      }
    }

    this.lastTap = { time: now, ...point };

    // Wait for double-tap window before executing single tap
    this.gestureTimeout = setTimeout(() => {
      if (this.lastTap && now - this.lastTap.time >= 300) {
        this.executeGesture('tap', event);
      }
    }, 300);
  }

  handleSwipe(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void {
    const swipeHandlers = Array.from(this.handlers.values())
      .filter(h => h.type === 'swipe')
      .sort((a, b) => b.priority - a.priority);

    for (const handler of swipeHandlers) {
      const threshold = handler.threshold?.distance ?? 80;
      const velocity = handler.threshold?.velocity ?? 400;

      // Check swipe distance or velocity
      const swipeDistance = Math.hypot(info.offset.x, info.offset.y);
      const swipeVelocity = Math.hypot(info.velocity.x, info.velocity.y);

      if (swipeDistance >= threshold || swipeVelocity >= velocity) {
        handler.handler(event, info);
        break;
      }
    }
  }

  handleDrag(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void {
    if (this.activeGesture && this.activeGesture !== 'drag') {
      return; // Higher priority gesture is active
    }

    this.activeGesture = 'drag';
    this.executeGesture('drag', event, info);
  }

  private executeGesture(
    type: GestureType,
    event: Event,
    info?: PanInfo
  ): void {
    const handlers = Array.from(this.handlers.values())
      .filter(h => h.type === type)
      .sort((a, b) => b.priority - a.priority);

    for (const handler of handlers) {
      handler.handler(event, info);
      if (type !== 'drag') {
        break; // Execute only highest priority for non-drag gestures
      }
    }
  }

  private getPoint(event: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } {
    if ('touches' in event) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
  }

  reset(): void {
    this.activeGesture = null;
    this.lastTap = null;
    if (this.gestureTimeout) {
      clearTimeout(this.gestureTimeout);
      this.gestureTimeout = null;
    }
  }
}

// Singleton instance
export const gestureManager = new GestureManager();
```

---

## useGestures Hook

```typescript
// src/hooks/use-gestures.ts
import { useCallback } from 'react';
import { GestureManager, GestureType, GestureHandler } from '@/lib/gesture-manager';

export interface UseGesturesParams {
  onTap?: (e: Event) => void;
  onDoubleTap?: (e: Event) => void;
  onSwipeLeft?: (e: Event, info: PanInfo) => void;
  onSwipeRight?: (e: Event, info: PanInfo) => void;
  onSwipeUp?: (e: Event, info: PanInfo) => void;
  onSwipeDown?: (e: Event, info: PanInfo) => void;
  onDrag?: (e: Event, info: PanInfo) => void;
  swipeThreshold?: number;
  swipeVelocity?: number;
}

export interface UseGesturesReturn {
  gestureHandlers: {
    onTap?: (e: Event) => void;
    onDragEnd?: (e: any, info: any) => void;
  };
  registerGesture: (id: string, handler: GestureHandler) => void;
  unregisterGesture: (id: string) => void;
}

export function useGestures(params: UseGesturesParams = {}): UseGesturesReturn {
  const {
    onTap,
    onDoubleTap,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onDrag,
    swipeThreshold = 80,
    swipeVelocity = 400,
  } = params;

  const handleTap = useCallback((e: Event) => {
    if (onTap) onTap(e);
  }, [onTap]);

  const handleDragEnd = useCallback((e: any, info: any) => {
    const handlers = gestureManager['handlers'];

    // Determine swipe direction
    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);

    if (absX > absY) {
      // Horizontal swipe
      if (info.offset.x > 0 && onSwipeRight) {
        onSwipeRight(e, info);
      } else if (info.offset.x < 0 && onSwipeLeft) {
        onSwipeLeft(e, info);
      }
    } else {
      // Vertical swipe
      if (info.offset.y > 0 && onSwipeDown) {
        onSwipeDown(e, info);
      } else if (info.offset.y < 0 && onSwipeUp) {
        onSwipeUp(e, info);
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const registerGesture = useCallback((id: string, handler: GestureHandler) => {
    gestureManager.register(id, handler);
  }, []);

  const unregisterGesture = useCallback((id: string) => {
    gestureManager.unregister(id);
  }, []);

  return {
    gestureHandlers: {
      onTap: handleTap,
      onDragEnd: handleDragEnd,
    },
    registerGesture,
    unregisterGesture,
  };
}
```

---

## Color Tokens Utility

```typescript
// src/lib/color-tokens.ts
/**
 * Centralized color token system for semantic color usage
 * Replaces hardcoded hex values throughout the codebase
 */

export const colorTokens = {
  // Base semantic colors
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',

  // Section colors (from tailwind.config.ts)
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
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',
} as const;

export type ColorToken = keyof typeof colorTokens;

/**
 * Add opacity to a color token
 * @example withOpacity(colorTokens.primary, 0.5) => "hsl(...) / 0.5"
 */
export function withOpacity(token: string, opacity: number): string {
  return token.replace(')', ` / ${opacity})`);
}

/**
 * Create a CSS gradient
 * @example gradient(colorTokens.primary, colorTokens.secondary) => "linear-gradient(...)"
 */
export function gradient(
  from: string,
  to: string,
  deg = 135
): string {
  return `linear-gradient(${deg}deg, ${from}, ${to})`;
}

/**
 * Get a section-specific gradient
 */
export function sectionGradient(section: 'generate' | 'library' | 'projects' | 'community'): string {
  const gradients = {
    generate: gradient(colorTokens.generate, '#8b5cf6'),
    library: gradient(colorTokens.library, '#06b6d4'),
    projects: gradient(colorTokens.projects, '#f59e0b'),
    community: gradient(colorTokens.community, '#10b981'),
  };
  return gradients[section];
}
```

---

## Z-Index Scale

```typescript
// src/lib/z-index.ts
/**
 * Semantic z-index scale for consistent layering
 * Replace hardcoded z-index values throughout the codebase
 */

export const zIndex = {
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

export type ZIndex = keyof typeof zIndex;

/**
 * Get z-index value for Tailwind class
 * @example getZIndex('dialog') => 'z-[80]'
 */
export function getZIndex(name: ZIndex): string {
  return `z-[${zIndex[name]}]`;
}
```

---

## Field Component (Form System)

```typescript
// src/components/ui/field.tsx
import { cn } from '@/lib/utils';
import { createContext, useContext } from 'react';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}

interface FieldContextValue {
  id: string;
  error?: string;
  required?: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldContext() {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error('Field components must be used within <Field>');
  }
  return context;
}

export const Field: React.FC<FieldProps> = ({
  label,
  error,
  required = false,
  description,
  children,
  className,
  ...props
}) => {
  const id = `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <FieldContext.Provider value={{ id, error, required }}>
      <div className={cn('space-y-1.5', className)} {...props}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        {children}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </FieldContext.Provider>
  );
};
```

---

## Summary Table

| File | Component/Utility | Purpose |
|------|------------------|---------|
| touch-target.tsx | TouchTarget | 44px minimum touch targets |
| safe-area.tsx | SafeArea | Notch/home indicator spacing |
| responsive-container.tsx | ResponsiveContainer, Desktop, Mobile | Conditional rendering |
| skeleton.tsx | Skeleton, TrackCardSkeleton, ListSkeleton | Loading placeholders |
| gesture-manager.ts | GestureManager | Centralized gesture handling |
| use-gestures.ts | useGestures | React hook for gestures |
| color-tokens.ts | colorTokens, withOpacity, gradient | Semantic color system |
| z-index.ts | zIndex, getZIndex | Semantic z-index scale |
| field.tsx | Field | Form field wrapper |

---

**Status**: Contracts complete, ready for implementation
