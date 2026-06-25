# ✅ Чеклист немедленных улучшений MusicVerse AI

**Дата**: 3 декабря 2025  
**Цель**: Практический план действий с готовым кодом  
**Время**: 2 недели (80 часов)

---

## 🎯 Week 1: Code Quality (40 часов)

### День 1-2: Logger Utility (8 часов)

#### Задача: Заменить console.log централизованной системой логирования

**Шаг 1: Создать logger utility**

```bash
# Создать файл
touch src/lib/logger.ts
```

**Код для src/lib/logger.ts:**

```typescript
/**
 * Централизованная система логирования
 * - Development: выводит в console
 * - Production: отправляет в Sentry/другую систему
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (this.isDevelopment) {
      // Development: console output
      switch (level) {
        case "debug":
          console.debug(prefix, message, context);
          break;
        case "info":
          console.info(prefix, message, context);
          break;
        case "warn":
          console.warn(prefix, message, context);
          break;
        case "error":
          console.error(prefix, message, context);
          break;
      }
    } else {
      // Production: send to monitoring service
      // TODO: Integrate with Sentry or similar
      if (level === "error" || level === "warn") {
        // Only log warnings and errors in production
        this.sendToMonitoring(level, message, context);
      }
    }
  }

  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext) {
    // TODO: Implement Sentry or other monitoring
    // Example:
    // Sentry.captureMessage(message, {
    //   level: level === 'error' ? 'error' : 'warning',
    //   extra: context
    // });
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log("error", message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = new Logger();
```

**Шаг 2: Заменить console.log в критичных файлах**

```bash
# Найти все console.log
grep -r "console.log" src/ --include="*.tsx" --include="*.ts" | wc -l

# Примеры замены:
```

**Было:**

```typescript
console.log("🤖 Telegram WebApp обнаружен");
console.log("📱 Platform:", tg.platform);
```

**Стало:**

```typescript
import { logger } from "@/lib/logger";

logger.info("Telegram WebApp обнаружен");
logger.debug("Platform detected", { platform: tg.platform });
```

**Файлы для обновления (приоритет):**

- [ ] src/contexts/TelegramContext.tsx (20 console.log)
- [ ] src/hooks/useAuth.tsx (10 console.log)
- [ ] src/services/telegram-auth.ts (5 console.log)
- [ ] src/components/GlobalAudioProvider.tsx (8 console.log)

---

### День 3-4: Fix React Hooks Violations (16 часов)

#### Проблема 1: setState в useEffect

**Найдено в:**

- components/lyrics/UnifiedLyricsView.tsx
- components/player/ProgressBar.tsx
- components/player/VolumeControl.tsx
- components/suno/SectionBlock.tsx

**Было (❌ Плохо):**

```typescript
// components/player/ProgressBar.tsx
useEffect(() => {
  if (!isDragging) {
    setLocalTime(currentTime); // ❌ Causes cascading renders
  }
}, [currentTime, isDragging]);
```

**Стало (✅ Хорошо):**

```typescript
// Используем derived state вместо effect
const displayTime = isDragging ? localTime : currentTime;

// Или используем ref если нужен side effect
const timeRef = useRef(currentTime);
useEffect(() => {
  if (!isDragging) {
    timeRef.current = currentTime;
  }
}, [currentTime, isDragging]);
```

**Чеклист фиксов:**

- [ ] components/player/ProgressBar.tsx - использовать derived state
- [ ] components/player/VolumeControl.tsx - переместить в callback
- [ ] components/lyrics/UnifiedLyricsView.tsx - использовать ref
- [ ] components/suno/SectionBlock.tsx - убрать из effect

#### Проблема 2: Components created during render

**Найдено в:** components/player/VolumeControl.tsx:173

**Было (❌ Плохо):**

```typescript
const VolumeIcon = getVolumeIcon(); // ❌ Created every render

return (
  <Button>
    <VolumeIcon className={iconSizeClasses[size]} />
  </Button>
);
```

**Стало (✅ Хорошо):**

```typescript
// Вариант 1: useMemo
const VolumeIcon = useMemo(() => getVolumeIcon(), [volume, muted]);

// Вариант 2: Прямой рендер
return (
  <Button>
    {getVolumeIcon()}
  </Button>
);
```

---

### День 5: Fix TypeScript any Types (8 часов)

#### Найдено 15 instances в 5 файлах

**Файл: components/player/ExpandedPlayer.tsx:35**

**Было (❌ Плохо):**

```typescript
const handleChange = (value: any) => {
  onSeek(value[0]);
};
```

**Стало (✅ Хорошо):**

```typescript
const handleChange = (value: number[]) => {
  onSeek(value[0]);
};
```

**Файл: components/stem-studio/StemChannel.tsx:22**

**Было (❌ Плохо):**

```typescript
const handleVolumeChange = (value: any) => {
  onVolumeChange(value[0]);
};
```

**Стало (✅ Хорошо):**

```typescript
const handleVolumeChange = (value: number | number[]) => {
  const volume = Array.isArray(value) ? value[0] : value;
  onVolumeChange(volume);
};
```

**Чеклист TypeScript фиксов:**

- [ ] components/player/ExpandedPlayer.tsx
- [ ] components/stem-studio/StemChannel.tsx
- [ ] components/stem-studio/StemStudioContent.tsx
- [ ] (Найти остальные через: `grep -r "any" src/`)

---

## 🧪 Week 2: Testing (40 часов)

### День 1: Fix E2E Test Configuration (8 часов)

#### Проблема: Playwright tests в Jest

**Текущая ситуация:**

```typescript
// tests/e2e/storage.spec.ts
import { test, expect } from "@playwright/test"; // ❌ Не работает в Jest
```

**Решение: Раздельная конфигурация**

**Шаг 1: Обновить package.json**

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathIgnorePatterns=e2e",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

**Шаг 2: Обновить jest.config.cjs**

```javascript
module.exports = {
  // ... existing config
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/e2e/", // ← Добавить
  ],
};
```

**Шаг 3: Создать правильный playwright.config.ts**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### День 2-3: Write Unit Tests (16 часов)

#### Test 1: TelegramContext

**Файл: src/contexts/**tests**/TelegramContext.test.tsx**

```typescript
import { renderHook } from '@testing-library/react';
import { TelegramProvider, useTelegram } from '../TelegramContext';

describe('TelegramContext', () => {
  it('should provide telegram context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TelegramProvider>{children}</TelegramProvider>
    );

    const { result } = renderHook(() => useTelegram(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isInitialized).toBe(true);
  });

  it('should enable development mode on localhost', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TelegramProvider>{children}</TelegramProvider>
    );

    const { result } = renderHook(() => useTelegram(), { wrapper });

    // Localhost should trigger dev mode
    expect(result.current.isDevelopmentMode).toBe(true);
  });

  it('should provide mock WebApp in dev mode', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TelegramProvider>{children}</TelegramProvider>
    );

    const { result } = renderHook(() => useTelegram(), { wrapper });

    expect(result.current.webApp).toBeDefined();
    expect(result.current.webApp?.ready).toBeDefined();
  });
});
```

#### Test 2: useAuth hook

**Файл: src/hooks/**tests**/useAuth.test.tsx**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TelegramProvider } from '@/contexts/TelegramContext';
import { useAuth } from '../useAuth';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        {children}
      </TelegramProvider>
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  it('should start with loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should provide user after authentication', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // In dev mode, should have mock user
    expect(result.current.user).toBeDefined();
  });
});
```

**Чеклист unit tests:**

- [ ] TelegramContext tests (3 tests)
- [ ] useAuth tests (4 tests)
- [ ] telegram-auth service tests (5 tests)
- [ ] GlobalAudioProvider tests (4 tests)
- [ ] Key hooks tests (10+ tests)

---

### День 4-5: Integration Tests (16 часов)

#### Test: Auth Flow E2E

**Файл: tests/e2e/auth-flow.spec.ts**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should show auth page for unauthenticated users", async ({ page }) => {
    await page.goto("/");

    // Should redirect to /auth
    await expect(page).toHaveURL(/.*auth/);

    // Should show auth button
    const authButton = page.getByRole("button", { name: /войти/i });
    await expect(authButton).toBeVisible();
  });

  test("should authenticate and redirect to home", async ({ page }) => {
    await page.goto("/auth");

    // Click auth button
    const authButton = page.getByRole("button", { name: /войти/i });
    await authButton.click();

    // Should redirect to home after successful auth
    await expect(page).toHaveURL("/");

    // Should show bottom navigation
    const bottomNav = page.getByRole("navigation");
    await expect(bottomNav).toBeVisible();
  });
});
```

#### Test: Music Generation Flow

**Файл: tests/e2e/music-generation.spec.ts**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Music Generation", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto("/auth");
    await page.getByRole("button", { name: /войти/i }).click();
    await page.waitForURL("/");
  });

  test("should navigate to generate page", async ({ page }) => {
    // Click generate button in bottom nav
    await page.getByRole("link", { name: /генерация/i }).click();

    await expect(page).toHaveURL(/.*generate/);
  });

  test("should show generation form", async ({ page }) => {
    await page.goto("/generate");

    // Should show prompt input
    const promptInput = page.getByPlaceholder(/опишите музыку/i);
    await expect(promptInput).toBeVisible();

    // Should show generate button
    const generateButton = page.getByRole("button", { name: /создать/i });
    await expect(generateButton).toBeVisible();
  });

  test("should validate prompt input", async ({ page }) => {
    await page.goto("/generate");

    const generateButton = page.getByRole("button", { name: /создать/i });
    await generateButton.click();

    // Should show validation error
    await expect(page.getByText(/введите промт/i)).toBeVisible();
  });
});
```

**Чеклист integration tests:**

- [ ] Auth flow (3 tests)
- [ ] Music generation flow (4 tests)
- [ ] Track playback flow (5 tests)
- [ ] Navigation flow (3 tests)

---

## 📊 Progress Tracking

### Метрики Success:

**Стартовые значения:**

- Lint errors: 197
- console.log: 95+
- TypeScript any: 15
- Test coverage: 60%
- Passing tests: 2

**Целевые значения (после 2 недель):**

- Lint errors: < 50 (↓ 75%)
- console.log: 0 (↓ 100%)
- TypeScript any: < 5 (↓ 67%)
- Test coverage: 75% (↑ 15%)
- Passing tests: 30+ (↑ 1400%)

### Daily Checklist:

**Каждый день:**

- [ ] Commit progress
- [ ] Run lint: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Update этот документ
- [ ] Push changes

**Каждую неделю:**

- [ ] Code review
- [ ] Update metrics
- [ ] Retrospective
- [ ] Plan next week

---

## 🎯 Expected Outcomes

**После Week 1:**

- ✅ Clean codebase (no console.log)
- ✅ Better logging system
- ✅ Fewer lint errors (-75%)
- ✅ Improved TypeScript types

**После Week 2:**

- ✅ Test coverage 75%
- ✅ CI passing green
- ✅ E2E tests working
- ✅ Confidence in deploys

**Business Impact:**

- ✅ Faster debugging (logger)
- ✅ Fewer bugs (tests)
- ✅ Easier onboarding (clean code)
- ✅ Faster releases (CI green)

---

## 📞 Help & Resources

**Если застряли:**

1. Check existing tests в src/components/ErrorBoundary.test.tsx
2. Review TanStack Query docs для testing
3. Check Playwright docs для E2E
4. Ask team в Slack/Discord

**Useful commands:**

```bash
# Lint specific file
npm run lint src/contexts/TelegramContext.tsx

# Run specific test
npm test TelegramContext

# Test with coverage
npm run test:coverage

# E2E headed mode
npm run test:e2e:headed

# Format code
npm run format
```

---

**Дата**: 3 декабря 2025  
**Статус**: ✅ READY TO EXECUTE  
**Владелец**: Development Team

🚀 **Let's ship clean code!**
