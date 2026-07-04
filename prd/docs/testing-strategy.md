# Testing Strategy - MusicVerse AI

> **Complete Testing Documentation**
>
> **Framework:** Vitest (Unit) + Playwright (E2E)
> **Coverage Goal:** Critical paths covered
> **Test Environment:** CI/CD + Local development

---

## Table of Contents

- [Testing Overview](#testing-overview)
- [Unit Testing (Vitest)](#unit-testing-vitest)
- [E2E Testing (Playwright)](#e2e-testing-playwright)
- [Testing Pyramid](#testing-pyramid)
- [Critical User Flows](#critical-user-flows)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

---

## Testing Overview

### Testing Philosophy

**"Test critical paths, not 100% coverage"**

MusicVerse AI follows pragmatic testing approach:

- ✅ **Critical user paths** must have E2E tests
- ✅ **Complex business logic** must have unit tests
- ✅ **Audio system** must have integration tests
- ❌ UI components tested sparingly (shadcn/ui already tested)
- ❌ 100% coverage NOT a goal (expensive maintenance)

### Test Statistics

| Metric            | Current       | Target         | Notes                   |
| ----------------- | ------------- | -------------- | ----------------------- |
| **Unit Tests**    | 150+ tests    | Critical logic | Hooks, services, utils  |
| **E2E Tests**     | 80+ scenarios | Key user flows | Critical paths          |
| **Coverage**      | N/A           | Focus over %   | Critical files >80%     |
| **Test Duration** | ~5 min        | <10 min        | Full E2E suite          |
| **CI Time**       | ~8 min        | <15 min        | Including build + tests |

---

## Unit Testing (Vitest)

### Configuration

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/vitest.setup.ts"],
    include: ["src/__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/hooks/**/*.{ts,tsx}"],
      thresholds: {
        global: { branches: 0, functions: 0, lines: 0, statements: 0 },
      },
    },
    testTimeout: 10000,
  },
});
```

### Test Structure

```
src/__tests__/
├── vitest.setup.ts           # Test setup (mocks, globals)
├── hooks/                     # Hook tests
│   ├── useAuth.test.ts
│   ├── usePlayerState.test.ts
│   └── useLibraryData.test.ts
├── services/                  # Service layer tests
│   ├── generation.service.test.ts
│   ├── tracks.service.test.ts
│   └── credits.service.test.ts
├── lib/                       # Utility tests
│   ├── audioCache.test.ts
│   ├── utils.test.ts
│   └── logger.test.ts
└── utils/                     # Helper function tests
    ├── formatters.test.ts
    └── validators.test.ts
```

### Test Setup (vitest.setup.ts)

**Mocked Dependencies:**

- `matchMedia` (CSS media queries)
- `Telegram.WebApp` (Telegram SDK)
- `supabase` (Database client)
- `Audio` (HTMLAudioElement)
- `IntersectionObserver` (Lazy loading)
- `ResizeObserver` (Component sizing)

**Example Mock:**

```typescript
// Mock Telegram WebApp
global.Telegram = {
  WebApp: {
    ready: vi.fn(),
    expand: vi.fn(),
    hapticFeedback: vi.fn(),
    BackButton: { show: vi.fn(), hide: vi.fn() },
  },
};
```

### Critical Unit Tests

#### 1. useAuth Hook Test

```typescript
describe("useAuth", () => {
  it("should authenticate with Telegram", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.authenticateWithTelegram();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });

  it("should logout and clear session", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

#### 2. Generation Service Test

```typescript
describe("generation.service", () => {
  describe("getGenerationActivity", () => {
    it("should fetch generation logs and stats", async () => {
      const mockLogs = [{ id: "1", status: "completed" }];
      const mockStats = { total_generations: 100 };

      (generationApi.fetchGenerationLogs as vi.Mock).mockResolvedValue(mockLogs);
      (generationApi.fetchGenerationStats as vi.Mock).mockResolvedValue(mockStats);

      const result = await getGenerationActivity("24h");

      expect(result.logs).toEqual(mockLogs);
      expect(result.stats).toBeDefined();
    });
  });
});
```

#### 3. Audio Cache Test

```typescript
describe("audioCache", () => {
  it("should cache waveform data", async () => {
    const mockWaveform = [0.5, 0.7, 0.3, 0.8];
    const audioUrl = "https://example.com/track.mp3";

    await cacheWaveform(audioUrl, mockWaveform);
    const cached = await getWaveform(audioUrl);

    expect(cached).toEqual(mockWaveform);
  });

  it("should invalidate cache on update", async () => {
    await cacheWaveform(url, waveform1);
    await cacheWaveform(url, waveform2);
    const cached = await getWaveform(url);

    expect(cached).toEqual(waveform2);
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- useAuth.test.ts

# Watch mode (development)
npm test -- --watch
```

---

## E2E Testing (Playwright)

### Configuration

**File:** `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  ],
});
```

### Test Structure

```
tests/e2e/
├── auth/
│   ├── telegram-auth.spec.ts    # Telegram authentication flow
│   └── guest-mode.spec.ts       # Guest mode functionality
├── generation/
│   ├── basic-generation.spec.ts # Simple track generation
│   ├── custom-params.spec.ts   # Advanced generation options
│   └── generation-result.spec.ts # Result sheet interactions
├── library/
│   ├── browsing.spec.ts         # Library navigation
│   ├── filtering.spec.ts        # Search and filter
│   └── playback.spec.ts         # Track playback
├── studio/
│   ├── stem-separation.spec.ts  # Stem separation feature
│   ├── mixing.spec.ts           # Stem mixing interface
│   └── version-switch.spec.ts  # A/B version switching
├── player/
│   ├── compact-player.spec.ts  # Mini player interactions
│   ├── expanded-player.spec.ts # Expanded player controls
│   └── fullscreen-player.spec.ts # Mobile fullscreen player
├── payments/
│   ├── buy-credits.spec.ts     # Credit purchase flow
│   └── subscription.spec.ts   # Subscription management
└── mobile/
    ├── gestures.spec.ts        # Swipe, pull-to-refresh
    └── safe-areas.spec.ts     # Notch/island handling
```

### Critical E2E Tests

#### 1. Authentication Flow

```typescript
test("should authenticate user via Telegram", async ({ page }) => {
  await page.goto("/auth");

  // Simulate Telegram auth
  await page.click("button:has-text('Войти как Test User')");

  // Should redirect to home
  await expect(page).toHaveURL("/");

  // Should show user menu
  await expect(page.locator("text=Test User")).toBeVisible();
});
```

#### 2. Music Generation Flow

```typescript
test("should generate track and display results", async ({ page }) => {
  await page.goto("/");

  // Open generation form
  await page.click("button:has-text('Create Track')");

  // Fill form
  await page.fill("textarea[name='style']", "Upbeat pop song with catchy chorus");
  await page.click("button:has-text('Generate')");

  // Wait for generation result
  await expect(page.locator(".generation-result")).toBeVisible({ timeout: 120000 });

  // Should show 2 tracks
  const tracks = page.locator(".track-card");
  await expect(tracks).toHaveCount(2);
});
```

#### 3. Library Filtering

```typescript
test("should filter tracks by type and search", async ({ page }) => {
  await page.goto("/library");

  // Filter by vocals
  await page.click("button:has-text('Vocals')");

  // Should show only vocal tracks
  const tracks = page.locator(".track-card");
  const firstTrack = tracks.first();
  await expect(firstTrack).toContainText("Vocals");

  // Search by title
  await page.fill("input[placeholder*='Search']", "Summer");
  await page.waitForTimeout(500); // Debounce

  // Should show filtered results
  await expect(page.locator("text=Summer")).toBeVisible();
});
```

#### 4. Stem Separation

```typescript
test("should separate track into stems", async ({ page }) => {
  // Navigate to studio
  await page.goto("/studio-v2/track/test-track-id");

  // Click stem separation
  await page.click("button:has-text('Separate Stems')");

  // Wait for separation (can take 60+ seconds)
  await expect(page.locator(".stem-progress")).toBeVisible();
  await expect(page.locator(".stem-progress")).not.toBeVisible({ timeout: 90000 });

  // Should show 4 stems
  const stems = page.locator(".stem-control");
  await expect(stems).toHaveCount(4);
});
```

#### 5. Mobile Gestures

```typescript
test("should support pull-to-refresh on mobile", async ({ page, browserName }) => {
  // Only test on mobile browsers
  if (!browserName.includes("Mobile")) return;

  await page.goto("/library");

  // Pull down to refresh
  await page.locator("body").evaluate(async (el) => {
    // Simulate pull gesture
    const touch = await el.createTouchPoint(0, 0);
    await touch.move(0, 200);
    await touch.release();
  });

  // Should show refresh indicator
  await expect(page.locator(".refresh-indicator")).toBeVisible();
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific browser
npm run test:e2e:chromium

# Run mobile tests
npm run test:e2e:mobile

# Run with visible browser (debugging)
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui

# View HTML report
npm run test:e2e:report
```

---

## Testing Pyramid

```
                    /\
                   /E2E\
                  /------\
                 /        \
                / 80+     \
               / Scenarios \
              /____________\
             /              \
            /    Integration \
           /       Tests       \
          /____________________\
         /                      \
        /    150+ Unit Tests    \
       /    (Vitest)            \
      /__________________________\
     /                          \
    /   Component & Utils Tests \
   /____________________________\
```

**Distribution:**

- **E2E Tests:** 15% (Critical user flows only)
- **Integration Tests:** 25% (API, audio, state)
- **Unit Tests:** 60% (Business logic, utilities)

---

## Critical User Flows (E2E Coverage)

### Must-Have Flows (100% Coverage Required)

| Flow                 | Description                     | Test File                  | Priority |
| -------------------- | ------------------------------- | -------------------------- | -------- |
| **Authentication**   | Telegram login → Home           | `telegram-auth.spec.ts`    | P0       |
| **First Generation** | New user → Generate → Result    | `basic-generation.spec.ts` | P0       |
| **Track Playback**   | Library → Play → Global player  | `playback.spec.ts`         | P0       |
| **Stem Separation**  | Studio → Separate → Mix         | `stem-separation.spec.ts`  | P1       |
| **Payment Flow**     | Buy credits → Payment → Success | `buy-credits.spec.ts`      | P1       |
| **Mobile Gestures**  | Pull-to-refresh, Swipe actions  | `gestures.spec.ts`         | P1       |

### Should-Have Flows (80% Coverage Target)

| Flow                    | Test Coverage                 | Notes             |
| ----------------------- | ----------------------------- | ----------------- |
| **Version Switching**   | A/B version toggle            | Important for UX  |
| **Playlist Management** | Create → Add tracks → Share   | Social feature    |
| **Profile Editing**     | Edit → Save → Display         | User management   |
| **Search & Filter**     | Search → Filter → Sort        | Discovery feature |
| **Referral Program**    | Generate link → Share → Track | Growth feature    |

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run unit tests
      - Run E2E tests
      - Upload coverage reports
```

### Test Execution Order

1. **Lint check** (`npm run lint`) - Fast fail
2. **Type check** (`npm run typecheck`) - Type safety
3. **Unit tests** (`npm test`) - Business logic
4. **E2E tests** (`npm run test:e2e`) - Critical paths

### Failure Conditions

| Stage     | Condition         | Action                  |
| --------- | ----------------- | ----------------------- |
| **Lint**  | ESLint errors     | Fail build immediately  |
| **Types** | TypeScript errors | Fail build immediately  |
| **Unit**  | Test failures     | Show report, fail build |
| **E2E**   | Test failures     | Retry 2x, then fail     |

---

## Best Practices

### Unit Testing

**✅ DO:**

- Test business logic (services, hooks)
- Test edge cases and error handling
- Mock external dependencies (Telegram, Supabase)
- Keep tests fast (<100ms per test)
- Use descriptive test names

**❌ DON'T:**

- Test UI components extensively (shadcn/ui already tested)
- Test trivial getters/setters
- Mock everything (test real behavior)
- Aim for 100% coverage (expensive)

### E2E Testing

**✅ DO:**

- Test critical user journeys
- Test cross-browser compatibility
- Test mobile gestures and interactions
- Use realistic test data
- Make tests independent (can run in parallel)

**❌ DON'T:**

- Test every permutation
- Test UI details (colors, spacing)
- Test edge cases in E2E (use unit tests)
- Make tests dependent on order

### Mock Strategy

**What to Mock:**

- External APIs (Telegram, Suno AI)
- Database queries (Supabase)
- Time/Date (deterministic tests)
- Random values (predictable tests)

**What NOT to Mock:**

- Business logic
- Component interactions
- State management (Zustand)
- Form validation (Zod schemas)

---

## Performance Testing

### Load Testing Scenarios

| Scenario                   | Users | Duration | Metric            |
| -------------------------- | ----- | -------- | ----------------- |
| **Concurrent Generations** | 100   | 10 min   | Success rate >95% |
| **Library Browsing**       | 500   | 5 min    | Page load <2s     |
| **Audio Playback**         | 200   | 5 min    | Buffering <5%     |

### Performance Budgets

| Metric                  | Target | Measurement |
| ----------------------- | ------ | ----------- |
| **Bundle Size**         | 950 KB | size-limit  |
| **First Paint**         | <2s    | Lighthouse  |
| **Time to Interactive** | <3s    | Lighthouse  |
| **Generation API**      | <60s   | P95 latency |

---

## Test Data Management

### Fixtures

**Location:** `tests/fixtures/`

```typescript
// Mock user data
export const mockUser = {
  id: "user-uuid",
  telegram_id: 123456789,
  first_name: "Test",
  username: "testuser",
  is_public: true,
  credits: 100,
};

// Mock track data
export const mockTrack = {
  id: "track-uuid",
  title: "Test Track",
  style: "Pop",
  audio_url: "https://example.com/track.mp3",
  is_public: true,
};
```

### Database Seeding

**For E2E tests:** Use fresh database for each test run

```sql
-- Seed test data
TRUNCATE tracks, profiles, playlists CASCADE;
INSERT INTO profiles (id, user_id, telegram_id, first_name) VALUES
  ('test-user-1', 'user-1', 123, 'Test');
```

---

## Debugging Tests

### Unit Test Debugging

```bash
# Run with UI
npm test -- --ui

# Run with inspector
npm test -- --inspect-brk

# Run specific test with logs
npm test -- useAuth.test.ts --reporter=verbose
```

### E2E Test Debugging

```bash
# Run with visible browser
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui

# Run specific test file
npm run test:e2e generation/basic-generation.spec.ts
```

---

## Test Maintenance

### When Tests Fail

1. **Check if it's a real bug** (test exposed issue)
2. **Check if test is flaky** (timing issue, race condition)
3. **Check if code changed** (test needs update)
4. **Check if environment changed** (API, database)

### Flaky Test Handling

```typescript
// Retry flaky tests
test("should generate track", async ({ page }) => {
  // This test can be flaky due to API timing
  await page.goto("/");
  await page.click("button:has-text('Create Track')");

  // Use waitFor with timeout
  await expect(page.locator(".result")).toBeVisible({ timeout: 120000 });
});
```

---

## Coverage Strategy

### Critical Files Coverage Targets

| File/Directory                       | Target Coverage | Reason                  |
| ------------------------------------ | --------------- | ----------------------- |
| `src/services/generation.service.ts` | >90%            | Critical business logic |
| `src/hooks/useAuth.ts`               | >80%            | Authentication          |
| `src/hooks/useLibraryData.ts`        | >80%            | Library logic           |
| `src/lib/utils.ts`                   | >80%            | Utility functions       |
| `src/lib/logger.ts`                  | >80%            | Error handling          |

### Coverage Exclusions

- **UI Components:** shadcn/ui components (already tested)
- **Type definitions:** `.d.ts` files (no logic)
- **Configuration:** `*.config.ts` files (environment-specific)
- **Mock files:** `__mocks__/**` (test doubles)

---

## Accessibility Testing

### Axe-Core Integration

```typescript
import { axeCore, AxeResults } from "axe-core";

test("should be accessible", async ({ page }) => {
  await page.goto("/");

  // Run accessibility audit
  const results = await page.evaluate(() => axeCore(document.body));

  // Check for violations
  expect(results.violations).toHaveLength(0);
});
```

### WCAG 2.1 AA Compliance

**Tested Elements:**

- ✅ Color contrast ratios
- ✅ Touch target sizes (44×44px minimum)
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Focus indicators

---

## Monitoring

### Test Metrics Dashboard

**Tracked in CI:**

- Test execution time trends
- Flaky test rate
- Coverage trends
- Browser-specific failures

### Alerting

**When to Alert:**

- P0 test failure (immediate notification)
- Coverage drop >10% (weekly report)
- Flaky test rate >5% (weekly report)
- E2E suite >15min (performance investigation)

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-27  
**Frameworks:** Vitest 4.x, Playwright 1.57

---

_For the most current test suite, refer to `src/__tests__/` and `tests/e2e/` directories._
