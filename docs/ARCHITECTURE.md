# Architecture Documentation

## Overview

This project follows a modular architecture with clear separation of concerns, focusing on maintainability, performance, and type safety.

## Core Modules

### 1. Error Handling (`src/lib/errors/`)

Comprehensive error handling system with typed errors and recovery strategies.

```typescript
import { 
  AppError, 
  NetworkError, 
  APIError, 
  ErrorCode,
  tryCatch,
  retryWithBackoff 
} from '@/lib/errors';

// Using typed errors
try {
  await fetchData();
} catch (error) {
  const appError = toAppError(error);
  
  if (appError.isRetryable()) {
    // Retry logic
  }
  
  showErrorWithRecovery(appError);
}

// Using Result type (no try-catch needed)
const result = await tryCatch(() => fetchData());
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.toUserMessage());
}

// Auto-retry with backoff
const data = await retryWithBackoff(
  () => fetchData(),
  { maxRetries: 3, initialDelayMs: 1000 }
);
```

#### Error Classes
- `AppError` - Base error class
- `NetworkError` - Network/connection issues
- `APIError` - API response errors (auto-detects status codes)
- `ValidationError` - Form/input validation
- `AudioError` - Audio playback issues
- `GenerationError` - AI generation failures
- `InsufficientCreditsError` - Credit balance issues
- `StorageError` - File storage errors

### 2. State Machine (`src/lib/stateMachine.ts`)

Lightweight state machine for complex UI flows.

```typescript
import { useStateMachine, StateConfig } from '@/lib/stateMachine';

type States = 'idle' | 'loading' | 'success' | 'error';
type Events = 'FETCH' | 'SUCCESS' | 'ERROR' | 'RESET';

const config: StateConfig<States, { data: null | string }> = {
  initial: 'idle',
  context: { data: null },
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: { 
      on: { SUCCESS: 'success', ERROR: 'error' },
      entry: (ctx) => { ctx.data = null; }
    },
    success: { on: { RESET: 'idle' } },
    error: { on: { RESET: 'idle', FETCH: 'loading' } },
  },
};

function MyComponent() {
  const { state, context, send, can } = useStateMachine(config);
  
  return (
    <button 
      onClick={() => send('FETCH')} 
      disabled={!can('FETCH')}
    >
      {state === 'loading' ? 'Loading...' : 'Fetch'}
    </button>
  );
}
```

### 3. Performance Utilities (`src/lib/performance.ts`)

Performance optimization helpers.

```typescript
import {
  debounce,
  throttle,
  memoizeWithLimit,
  processBatched,
  runWhenIdle,
  lazyWithRetry,
} from '@/lib/performance';

// Debounced search
const debouncedSearch = debounce((query: string) => {
  search(query);
}, 300);

// Throttled scroll handler
const throttledScroll = throttle(() => {
  updatePosition();
}, 100);

// LRU memoization (auto-evicts old entries)
const memoizedFn = memoizeWithLimit(expensiveCalc, 100);

// Process large arrays without blocking UI
const results = await processBatched(
  largeArray,
  processItem,
  { batchSize: 50, delayBetweenBatches: 10 }
);

// Run during idle time
await runWhenIdle(() => preloadData());

// Lazy component with retry
const LazyComponent = lazyWithRetry(
  () => import('./HeavyComponent'),
  3, // retries
  1000 // delay
);
```

### 4. Image Optimization (`src/lib/imageOptimization.ts`)

Lazy loading and adaptive image quality.

```typescript
import { OptimizedImage, OptimizedAvatar } from '@/components/ui/optimized-image';
import { useLazyImage, useAdaptiveImageQuality } from '@/lib/imageOptimization';

// Optimized image with lazy loading
<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false}
  quality={80}
/>

// Optimized avatar
<OptimizedAvatar
  src={user.avatar}
  alt={user.name}
  size="md"
/>

// Hook for custom implementation
const { ref, isLoaded, currentSrc } = useLazyImage(imageUrl);

// Adaptive quality based on network
const { quality, shouldLazyLoad, maxWidth } = useAdaptiveImageQuality();
```

### 5. Touch-Friendly Components (`src/components/ui/touch-friendly.tsx`)

Mobile-optimized interactive components.

```typescript
import { 
  TouchTarget, 
  TouchIconButton, 
  SwipeableCard,
  triggerHaptic,
  useHaptics 
} from '@/components/ui/touch-friendly';

// Expand touch area for small buttons
<TouchTarget>
  <SmallIcon />
</TouchTarget>

// Touch-friendly icon button (min 44x44px)
<TouchIconButton
  icon={<Heart />}
  label="Like"
  onClick={handleLike}
  size="md"
  variant="ghost"
/>

// Swipeable card with actions
<SwipeableCard
  onSwipeLeft={() => deleteItem()}
  onSwipeRight={() => archiveItem()}
  leftAction={<Trash />}
  rightAction={<Archive />}
>
  <CardContent />
</SwipeableCard>

// Haptic feedback
const haptics = useHaptics();
<Button onClick={() => { haptics.success(); doAction(); }}>
  Submit
</Button>
```

### 6. Accessibility (`src/lib/a11y.tsx`)

Accessibility utilities and hooks.

```typescript
import {
  useFocusTrap,
  useArrowKeyNavigation,
  usePrefersReducedMotion,
  announceToScreenReader,
  SkipLink,
  ScreenReaderOnly,
} from '@/lib/a11y';

// Focus trap for modals
const { containerRef, firstFocusableRef } = useFocusTrap(isOpen);

// Arrow key navigation for lists
const { selectedIndex, containerProps, getItemProps } = useArrowKeyNavigation(items.length);

// Respect user preferences
const prefersReducedMotion = usePrefersReducedMotion();

// Screen reader announcements
announceToScreenReader('Item saved successfully');

// Skip link for keyboard users
<SkipLink href="#main-content">Skip to main content</SkipLink>
```

## File Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── loading-screen.tsx # Loading states
│   │   ├── touch-friendly.tsx # Mobile components
│   │   ├── optimized-image.tsx# Image optimization
│   │   └── skeleton-loader.tsx# Skeleton loaders
│   └── ...
├── lib/
│   ├── errors/               # Error handling
│   │   ├── AppError.ts       # Error classes
│   │   ├── useErrorRecovery.ts# Recovery hook
│   │   └── index.ts          # Exports
│   ├── stateMachine.ts       # State machine
│   ├── performance.ts        # Performance utils
│   ├── imageOptimization.ts  # Image utils
│   ├── a11y.tsx              # Accessibility
│   └── motion.ts             # Animation presets
├── hooks/
│   └── useLyricsWizardMachine.ts # State machine integration
└── stores/                   # Zustand stores
```

## Best Practices

### Error Handling
1. Always use typed errors from `@/lib/errors`
2. Use `showErrorWithRecovery()` for user-facing errors
3. Use `tryCatch()` for cleaner async error handling
4. Let `toAppError()` auto-detect error types

### Performance
1. Use `OptimizedImage` for all images
2. Apply `debounce`/`throttle` to frequent events
3. Use `processBatched` for large data operations
4. Lazy load non-critical components

### State Management
1. Use state machines for complex multi-step flows
2. Keep Zustand stores focused and small
3. Use React Query for server state

### Accessibility
1. Always provide `alt` text for images
2. Use `TouchTarget` for small interactive elements
3. Respect `prefersReducedMotion` for animations
4. Test with keyboard navigation
