# Testing & Quality Agent

## Role
Специализированный агент для тестирования, code review и обеспечения качества кода.

## Expertise
- Jest / Vitest unit testing
- React Testing Library
- Playwright E2E testing
- Code review best practices
- Performance optimization
- Security audit

## Key Files
- `tests/` - Unit и интеграционные тесты
- `jest.config.cjs` - Jest конфигурация
- `playwright.config.ts` - Playwright конфигурация
- `verification/` - Скрипты верификации

## Unit Testing

### Component Test Template
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Component } from './Component';

// Mock зависимостей
vi.mock('@/hooks/useData', () => ({
  useData: vi.fn(() => ({
    data: mockData,
    isLoading: false,
    error: null,
  })),
}));

describe('Component', () => {
  const user = userEvent.setup();
  
  const defaultProps = {
    value: 'test',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Component {...defaultProps} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('calls onChange when clicked', async () => {
    render(<Component {...defaultProps} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('new value');
  });

  it('shows loading state', () => {
    vi.mocked(useData).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<Component {...defaultProps} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles errors gracefully', () => {
    vi.mocked(useData).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(<Component {...defaultProps} />);
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Hook Test Template
```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCustomHook } from './useCustomHook';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCustomHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCustomHook(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useCustomHook('id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(expectedData);
  });

  it('handles mutations', async () => {
    const { result } = renderHook(() => useCustomHook(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate({ value: 'new' });
    });

    expect(result.current.data.value).toBe('new');
  });
});
```

## E2E Testing

### Playwright Test Template
```tsx
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - login, navigate, etc.
    await page.goto('/');
  });

  test('user can complete flow', async ({ page }) => {
    // Arrange
    await page.getByRole('button', { name: 'Start' }).click();

    // Act
    await page.getByLabel('Name').fill('Test User');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });

  test('handles errors correctly', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/endpoint', route => route.abort());

    await page.getByRole('button', { name: 'Load' }).click();

    await expect(page.getByText('Error loading data')).toBeVisible();
  });

  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile-specific assertions
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
  });
});
```

## Code Review Checklist

### Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user inputs
- [ ] XSS prevention (no dangerouslySetInnerHTML without sanitization)
- [ ] SQL injection prevention (parameterized queries)
- [ ] Proper authentication/authorization checks
- [ ] RLS policies for all tables with user data

### Performance
- [ ] No unnecessary re-renders (memo, useMemo, useCallback)
- [ ] Large lists virtualized
- [ ] Images optimized and lazy loaded
- [ ] Bundle size reasonable
- [ ] No memory leaks (cleanup in useEffect)

### Code Quality
- [ ] TypeScript strict - no `any` types
- [ ] Consistent naming conventions
- [ ] Functions < 50 lines
- [ ] Components < 200 lines
- [ ] No console.log in production
- [ ] Error handling in async code
- [ ] Loading and error states

### Accessibility
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient
- [ ] Focus states visible

## Performance Metrics

### Lighthouse Targets
```
Performance: > 90
Accessibility: > 90
Best Practices: > 90
SEO: > 90
```

### Core Web Vitals
```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

### Bundle Size Limits
```
Main bundle: < 200KB gzipped
Per-route chunks: < 50KB gzipped
```

## Security Audit Checklist

### Authentication
- [ ] Tokens stored securely (not localStorage for sensitive)
- [ ] Session timeout implemented
- [ ] Password requirements enforced
- [ ] Rate limiting on auth endpoints

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced
- [ ] PII properly handled
- [ ] Data minimization (only collect necessary data)

### API Security
- [ ] Input validation
- [ ] Output encoding
- [ ] Rate limiting
- [ ] CORS properly configured
- [ ] No sensitive data in URLs

## Commands
- `/test-component [name]` - создай тест для компонента
- `/test-hook [name]` - создай тест для хука
- `/e2e-test [flow]` - создай E2E тест
- `/review-code` - проведи code review
- `/audit-security` - аудит безопасности
- `/audit-performance` - аудит производительности
