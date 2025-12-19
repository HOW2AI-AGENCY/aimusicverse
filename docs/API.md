# Component API Reference

## Error Handling

### showErrorWithRecovery

Display error toast with recovery actions.

```typescript
function showErrorWithRecovery(error: AppError): void
```

**Example:**
```typescript
import { showErrorWithRecovery, NetworkError } from '@/lib/errors';

try {
  await fetchData();
} catch (e) {
  showErrorWithRecovery(toAppError(e));
}
```

---

## UI Components

### LoadingScreen

Full-screen or inline loading indicator.

```typescript
interface LoadingScreenProps {
  message?: string;
  progress?: number;
  variant?: 'fullscreen' | 'inline' | 'overlay';
}
```

**Example:**
```typescript
<LoadingScreen 
  message="Generating..." 
  progress={45} 
  variant="overlay" 
/>
```

---

### OptimizedImage

Performance-optimized image with lazy loading.

```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  onLoad?: () => void;
  onError?: () => void;
}
```

**Example:**
```typescript
<OptimizedImage
  src={track.coverUrl}
  alt={track.title}
  width={300}
  height={300}
  priority={isAboveFold}
/>
```

---

### OptimizedAvatar

Optimized avatar with fallback.

```typescript
interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: ReactNode;
}
```

**Example:**
```typescript
<OptimizedAvatar
  src={user.photoUrl}
  alt={user.displayName}
  size="lg"
/>
```

---

### TouchIconButton

Touch-friendly icon button (min 44x44px).

```typescript
interface TouchIconButtonProps {
  icon: ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
  disabled?: boolean;
  onClick?: () => void;
}
```

**Example:**
```typescript
<TouchIconButton
  icon={<Play className="h-5 w-5" />}
  label="Play track"
  size="md"
  variant="solid"
  onClick={handlePlay}
/>
```

---

### SwipeableCard

Card with swipe gestures for mobile.

```typescript
interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  threshold?: number;
}
```

**Example:**
```typescript
<SwipeableCard
  onSwipeLeft={() => deleteItem(id)}
  leftAction={<Trash className="h-5 w-5" />}
>
  <TrackItem track={track} />
</SwipeableCard>
```

---

## Hooks

### useStateMachine

Type-safe state machine hook.

```typescript
function useStateMachine<TState, TContext, TEvent>(
  config: StateConfig<TState, TContext>
): {
  state: TState;
  context: TContext;
  send: (event: TEvent, payload?: Partial<TContext>) => void;
  can: (event: TEvent) => boolean;
  reset: () => void;
}
```

---

### useErrorRecovery

Error handling with auto-retry.

```typescript
function useErrorRecovery(options?: {
  maxRetries?: number;
  retryDelay?: number;
}): {
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
  handleError: (error: unknown) => void;
  retry: (fn: () => Promise<void>) => Promise<void>;
  clear: () => void;
}
```

---

### useLazyImage

Lazy load images with intersection observer.

```typescript
function useLazyImage(
  src: string,
  options?: {
    placeholder?: string;
    rootMargin?: string;
  }
): {
  ref: (node: HTMLImageElement | null) => void;
  isLoaded: boolean;
  isError: boolean;
  currentSrc: string;
}
```

---

### useHaptics

Haptic feedback for mobile.

```typescript
function useHaptics(): {
  light: () => void;
  medium: () => void;
  heavy: () => void;
  success: () => void;
  error: () => void;
}
```

---

### useFocusTrap

Trap focus within container (for modals).

```typescript
function useFocusTrap(
  isActive: boolean
): {
  containerRef: RefObject<HTMLElement>;
  firstFocusableRef: RefObject<HTMLElement>;
}
```

---

### usePrefersReducedMotion

Detect user's motion preference.

```typescript
function usePrefersReducedMotion(): boolean
```

---

## Utility Functions

### debounce

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void
```

### throttle

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void
```

### memoizeWithLimit

LRU memoization with size limit.

```typescript
function memoizeWithLimit<T extends (...args: any[]) => any>(
  fn: T,
  maxSize?: number
): T
```

### retryWithBackoff

Retry async function with exponential backoff.

```typescript
function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  }
): Promise<T>
```

### triggerHaptic

Trigger device vibration.

```typescript
function triggerHaptic(
  type?: 'light' | 'medium' | 'heavy' | 'success' | 'error'
): void
```
