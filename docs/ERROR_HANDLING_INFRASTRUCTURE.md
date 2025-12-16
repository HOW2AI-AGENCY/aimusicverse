# Error Handling Infrastructure

**Date:** 2025-12-16  
**Status:** ✅ Implemented (T1.4 - Phase 1)

## Overview

Implemented comprehensive error handling infrastructure with structured error types, retry logic, and improved ErrorBoundary component for better user experience and debugging.

## Components

### 1. Structured Error Types (`src/lib/errors.ts`)

**Base Class:** `AppError`
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public userMessage?: string,
    public metadata?: Record<string, unknown>
  )
}
```

**Specialized Error Types:**
- `ValidationError` - Form validation failures (400)
- `NetworkError` - Connection issues (503)
- `AuthError` - Authentication problems (401)
- `NotFoundError` - Resource not found (404)
- `PermissionError` - Insufficient permissions (403)
- `RateLimitError` - Too many requests (429)
- `ServiceUnavailableError` - Service down (503)

**Usage:**
```typescript
import { ValidationError, NetworkError } from '@/lib/errors';

// Throw structured error
if (!email) {
  throw new ValidationError('Email is required', 'email');
}

// Check error type
try {
  await fetchData();
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network error
  }
}
```

### 2. Retry Logic (`src/lib/retry.ts`)

**Retry with Exponential Backoff:**
```typescript
import { retryWithBackoff } from '@/lib/retry';

const data = await retryWithBackoff(
  async () => await fetchAPI('/endpoint'),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  }
);
```

**Retry Fetch Wrapper:**
```typescript
import { retryFetch } from '@/lib/retry';

// Automatically retries on 5xx errors and network failures
const response = await retryFetch('/api/tracks');
const data = await response.json();
```

**Options:**
- `maxRetries` - Maximum retry attempts (default: 3)
- `initialDelay` - Initial delay in ms (default: 1000)
- `maxDelay` - Maximum delay in ms (default: 10000)
- `backoffFactor` - Exponential multiplier (default: 2)
- `shouldRetry` - Custom retry condition
- `onRetry` - Callback before each retry

### 3. Enhanced ErrorBoundary (`src/components/ErrorBoundary.tsx`)

**Features:**
- ✅ Uses structured error types
- ✅ User-friendly error messages
- ✅ Error code display (dev mode)
- ✅ Custom fallback support
- ✅ Structured logging
- ✅ Reset functionality

**Usage:**
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Basic usage
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary
  fallback={(error, reset) => (
    <CustomErrorView error={error} onReset={reset} />
  )}
>
  <YourComponent />
</ErrorBoundary>
```

### 4. Utility Functions

**Get User-Friendly Message:**
```typescript
import { getUserErrorMessage } from '@/lib/errors';

try {
  await operation();
} catch (error) {
  const message = getUserErrorMessage(error);
  toast.error(message); // User-friendly Russian message
}
```

**Log Errors with Context:**
```typescript
import { logError } from '@/lib/errors';

try {
  await operation();
} catch (error) {
  logError(error, {
    userId: user.id,
    action: 'track_generation',
    trackId: track.id,
  });
}
```

**Debounce/Throttle:**
```typescript
import { debounce, throttle } from '@/lib/retry';

// Debounce search input
const handleSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

// Throttle scroll handler
const handleScroll = throttle(() => {
  updateScrollPosition();
}, 100);
```

## Integration Examples

### API Service with Retry
```typescript
// src/services/api.ts
import { retryFetch } from '@/lib/retry';
import { NetworkError, ServiceUnavailableError } from '@/lib/errors';

export async function fetchTracks(userId: string) {
  try {
    const response = await retryFetch(
      `/api/tracks?user_id=${userId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      },
      {
        maxRetries: 3,
        onRetry: (error, attempt, delay) => {
          console.log(`Retry ${attempt} after ${delay}ms:`, error);
        },
      }
    );
    
    return await response.json();
  } catch (error) {
    throw new ServiceUnavailableError('Track service');
  }
}
```

### Form Validation
```typescript
// src/components/forms/GenerateForm.tsx
import { ValidationError } from '@/lib/errors';
import { getUserErrorMessage } from '@/lib/errors';

function validateForm(data: FormData) {
  if (!data.prompt) {
    throw new ValidationError('Prompt is required', 'prompt');
  }
  
  if (data.prompt.length < 10) {
    throw new ValidationError('Prompt too short', 'prompt');
  }
}

function handleSubmit(data: FormData) {
  try {
    validateForm(data);
    await submitGeneration(data);
  } catch (error) {
    toast.error(getUserErrorMessage(error));
  }
}
```

### Component Error Handling
```typescript
// src/components/TrackPlayer.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NetworkError } from '@/lib/errors';

function TrackPlayer() {
  const loadTrack = async (id: string) => {
    try {
      const track = await fetchTrack(id);
      setTrack(track);
    } catch (error) {
      if (error instanceof NetworkError) {
        toast.error('Не удалось загрузить трек. Проверьте подключение.');
      } else {
        toast.error(getUserErrorMessage(error));
      }
    }
  };
  
  return <div>...</div>;
}

// Wrap with boundary
export default function TrackPlayerWithBoundary() {
  return (
    <ErrorBoundary>
      <TrackPlayer />
    </ErrorBoundary>
  );
}
```

## Error Message Mapping

The system automatically maps common errors to user-friendly Russian messages:

| Error Pattern | User Message |
|---------------|--------------|
| network, fetch | Проблема с подключением. Проверьте интернет. |
| timeout | Превышено время ожидания. Попробуйте ещё раз. |
| unauthorized, auth | Требуется авторизация. Пожалуйста, войдите снова. |
| not found | Запрашиваемый ресурс не найден. |
| rate limit | Слишком много запросов. Пожалуйста, подождите. |
| Default | Произошла ошибка. Попробуйте позже. |

## Best Practices

### 1. Use Specific Error Types
```typescript
// ❌ Bad
throw new Error('User not found');

// ✅ Good
throw new NotFoundError('User');
```

### 2. Provide Context in Metadata
```typescript
// ✅ Good
throw new AppError(
  'Generation failed',
  'GENERATION_ERROR',
  500,
  'Не удалось создать трек. Попробуйте изменить запрос.',
  {
    userId: user.id,
    prompt: prompt,
    model: 'suno-v5',
  }
);
```

### 3. Always Use Retry for Network Calls
```typescript
// ❌ Bad
const response = await fetch('/api/tracks');

// ✅ Good
const response = await retryFetch('/api/tracks');
```

### 4. Log Errors with Context
```typescript
// ✅ Good
try {
  await operation();
} catch (error) {
  logError(error, {
    component: 'TrackPlayer',
    action: 'load_track',
    trackId: id,
  });
  throw error; // Re-throw after logging
}
```

### 5. Wrap Components with ErrorBoundary
```typescript
// ✅ Good - wrap route components
<Route path="/library" element={
  <ErrorBoundary>
    <Library />
  </ErrorBoundary>
} />
```

## Testing

### Unit Tests
```typescript
import { ValidationError, getUserErrorMessage } from '@/lib/errors';

describe('Error Handling', () => {
  it('should create validation error', () => {
    const error = new ValidationError('Email required', 'email');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
  });

  it('should get user message', () => {
    const error = new ValidationError('Email required');
    const message = getUserErrorMessage(error);
    expect(message).toBe('Проверьте введённые данные');
  });
});
```

### Integration Tests
```typescript
import { retryWithBackoff } from '@/lib/retry';

describe('Retry Logic', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Failed');
      return 'Success';
    };

    const result = await retryWithBackoff(fn, { maxRetries: 3 });
    expect(result).toBe('Success');
    expect(attempts).toBe(3);
  });
});
```

## Future Enhancements

### Phase 3 (Priority P2)
- [ ] Integrate error tracking service (Sentry)
- [ ] Add error analytics dashboard
- [ ] Implement error rate alerts
- [ ] Add automatic error recovery suggestions

### Phase 4 (Priority P3)
- [ ] ML-based error prediction
- [ ] Context-aware error messages
- [ ] Error pattern analysis
- [ ] Automated bug reporting

## Migration Guide

### Updating Existing Code

**Before:**
```typescript
try {
  const response = await fetch('/api/tracks');
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
  toast.error('Something went wrong');
}
```

**After:**
```typescript
import { retryFetch } from '@/lib/retry';
import { getUserErrorMessage, logError } from '@/lib/errors';

try {
  const response = await retryFetch('/api/tracks');
  const data = await response.json();
} catch (error) {
  logError(error, { action: 'fetch_tracks' });
  toast.error(getUserErrorMessage(error));
}
```

## Summary

✅ **Implemented:**
- Structured error types (8 classes)
- Retry logic with exponential backoff
- Enhanced ErrorBoundary with user-friendly messages
- Utility functions for error handling
- Comprehensive documentation

✅ **Benefits:**
- Better error messages for users (Russian)
- Automatic retry for transient failures
- Improved debugging with error codes
- Consistent error handling across app
- Foundation for error tracking integration

✅ **Impact:**
- Improved user experience during errors
- Reduced support requests from unclear errors
- Better debugging and monitoring
- Resilient to network failures

---

**Status:** ✅ T1.4 Complete (3 SP)  
**Next:** Continue with Phase 1 remaining tasks or move to Phase 2
