# Sprint 019: Testing & Documentation Improvements (Week 2 План)

**Период**: 11-17 декабря 2025 (1 неделя)  
**Цель**: Увеличить test coverage и улучшить документацию  
**Приоритет**: P1 (High)  
**Основание**: [Comprehensive Audit 2025-12-03](../docs/COMPREHENSIVE_AUDIT_2025-12-03.md)  
**Предварительные условия**: Sprint 018 завершен

---

## 📊 Цели спринта

### Основные метрики

| Метрика | Текущее | Цель | Улучшение |
|---------|---------|------|-----------|
| Test Coverage | 60% | 75% | +25% |
| Lint errors | 150 | 100 | -33% |
| Documented APIs | 40% | 80% | +100% |
| E2E tests | 3 | 10 | +233% |

### Ожидаемые результаты
- ✅ Test coverage увеличен до 75%+
- ✅ E2E tests для критичных flows
- ✅ API documentation создана
- ✅ Troubleshooting guide обновлен
- ✅ Оставшиеся lint errors исправлены

---

## 📋 Задачи (10 задач, ~30 часов)

### 🧪 Testing Tasks (18 hours)

#### TASK-019-001: Tests для TelegramContext ⏱️ 4h
**Приоритет**: P1  
**Файл**: `tests/unit/TelegramContext.test.tsx` (создать)  
**Зависимости**: Нет

**Описание**: Написать comprehensive unit tests для TelegramContext

**Test Coverage**:
```typescript
describe('TelegramContext', () => {
  describe('Provider initialization', () => {
    test('should initialize with Telegram WebApp', () => {
      // Mock window.Telegram.WebApp
      // Render TelegramProvider
      // Assert webApp is set
    });

    test('should enable development mode on lovable domains', () => {
      // Mock window.location.hostname
      // Assert isDevelopmentMode = true
    });

    test('should create mock user in dev mode', () => {
      // Mock dev mode
      // Assert mock user created
    });
  });

  describe('WebApp methods', () => {
    test('showMainButton should set text and show button', () => {
      // Mock webApp.MainButton
      // Call showMainButton
      // Assert setText and show called
    });

    test('hapticFeedback should trigger correct feedback type', () => {
      // Mock webApp.HapticFeedback
      // Call hapticFeedback with each type
      // Assert correct method called
    });
  });

  describe('Authentication', () => {
    test('should authenticate with valid initData', async () => {
      // Mock telegramAuthService
      // Render with initData
      // Assert auth called
    });

    test('should show retry popup on auth failure', async () => {
      // Mock failed auth
      // Assert showPopup called
    });
  });

  describe('Deep linking', () => {
    test('should navigate to track on track_{id}', () => {
      // Mock start_param = track_123
      // Assert navigate called with /library?track=123
    });

    test('should navigate to project on project_{id}', () => {
      // Similar test for projects
    });
  });
});
```

**Критерии приемки**:
- [x] 20+ test cases
- [x] Mock WebApp API
- [x] Coverage > 80% для TelegramContext
- [x] Все тесты проходят

---

#### TASK-019-002: Tests для telegram-share Service ⏱️ 3h
**Приоритет**: P1  
**Файл**: `tests/unit/telegram-share.test.ts` (создать)  
**Зависимости**: Нет

**Описание**: Написать unit tests для TelegramShareService

**Test Coverage**:
```typescript
describe('TelegramShareService', () => {
  let service: TelegramShareService;
  
  beforeEach(() => {
    service = new TelegramShareService();
  });
  
  describe('getTrackDeepLink', () => {
    test('should generate correct deep link format', () => {
      const trackId = 'abc-123';
      const link = service.getTrackDeepLink(trackId);
      expect(link).toBe('https://t.me/AIMusicVerseBot/app?startapp=track_abc-123');
    });
  });
  
  describe('shareURL', () => {
    test('should use native shareURL when available', () => {
      const mockWebApp = { shareURL: jest.fn() };
      service['webApp'] = mockWebApp as any;
      
      const track = { id: 'track-1', title: 'Test Track' };
      const result = service.shareURL(track);
      
      expect(result).toBe(true);
      expect(mockWebApp.shareURL).toHaveBeenCalled();
    });
    
    test('should fallback to openTelegramLink', () => {
      // Test fallback chain
    });
    
    test('should use window.open as last resort', () => {
      // Test universal fallback
    });
  });
  
  describe('shareToStory', () => {
    test('should call shareToStory with correct params', () => {
      // Test story sharing
    });
    
    test('should return false if no cover_url', () => {
      const track = { id: '1', title: 'Track' };
      const result = service.shareToStory(track);
      expect(result).toBe(false);
    });
  });
  
  describe('downloadFile', () => {
    test('should use native downloadFile API', async () => {
      // Test native download
    });
    
    test('should fallback to browser download', async () => {
      // Test browser fallback
    });
  });
});
```

**Критерии приемки**:
- [x] 15+ test cases
- [x] All sharing methods tested
- [x] Fallback chains verified
- [x] Coverage > 90%

---

#### TASK-019-003: E2E Tests для Auth Flow ⏱️ 4h
**Приоритет**: P1  
**Файл**: `tests/e2e/telegram-auth.spec.ts` (создать)  
**Зависимости**: Нет

**Описание**: Написать E2E tests для authentication flow

**Test Scenarios**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Telegram Authentication', () => {
  test('should authenticate with valid initData', async ({ page }) => {
    // Mock Telegram WebApp
    await page.addInitScript(() => {
      (window as any).Telegram = {
        WebApp: {
          initData: 'valid_init_data_here',
          initDataUnsafe: {
            user: {
              id: 123456,
              first_name: 'Test',
              username: 'testuser',
            },
          },
          ready: () => {},
          expand: () => {},
        },
      };
    });
    
    await page.goto('/');
    
    // Should redirect to home after auth
    await expect(page).toHaveURL('/');
    
    // Should show user info
    await expect(page.getByText('Test')).toBeVisible();
  });

  test('should show error on invalid initData', async ({ page }) => {
    // Mock invalid data
    // Assert error shown
  });

  test('should auto-authenticate in development mode', async ({ page }) => {
    // Mock dev mode
    // Assert auto auth happens
  });

  test('should show onboarding for new users', async ({ page }) => {
    // Mock new user
    // Assert onboarding shown
  });
});

test.describe('Deep Linking', () => {
  test('should open track from deep link', async ({ page }) => {
    // Mock start_param
    // Assert navigation to track
  });

  test('should open project from deep link', async ({ page }) => {
    // Test project deep link
  });
});
```

**Критерии приемки**:
- [x] 10+ E2E scenarios
- [x] Auth flow covered
- [x] Deep linking tested
- [x] All tests pass

---

#### TASK-019-004: Tests для Audio Player Components ⏱️ 3h
**Приоритет**: P1  
**Файл**: `tests/unit/audio-player.test.tsx` (создать)  
**Зависимости**: Нет

**Описание**: Написать unit tests для audio player компонентов

**Components to test**:
- `CompactPlayer`
- `ExpandedPlayer`
- `ProgressBar`
- `VolumeControl`

**Test Coverage**:
```typescript
describe('Audio Player Components', () => {
  describe('CompactPlayer', () => {
    test('should render track info', () => {});
    test('should toggle play/pause', () => {});
    test('should update progress bar', () => {});
  });

  describe('ExpandedPlayer', () => {
    test('should show full track details', () => {});
    test('should handle next/previous', () => {});
    test('should show lyrics when available', () => {});
  });

  describe('ProgressBar', () => {
    test('should display current time', () => {});
    test('should allow seeking', () => {});
    test('should update on time change', () => {});
  });

  describe('VolumeControl', () => {
    test('should adjust volume', () => {});
    test('should mute/unmute', () => {});
    test('should persist volume', () => {});
  });
});
```

**Критерии приемки**:
- [x] 20+ test cases
- [x] All player components tested
- [x] User interactions covered
- [x] Coverage > 70%

---

#### TASK-019-005: Tests для Track Actions ⏱️ 2h
**Приоритет**: P2  
**Файл**: `tests/unit/track-actions.test.tsx` (создать)  
**Зависимости**: Нет

**Описание**: Написать tests для track actions (like, share, download, etc.)

**Критерии приемки**:
- [x] 10+ test cases
- [x] All actions tested
- [x] Error states covered
- [x] Coverage > 75%

---

#### TASK-019-006: Integration Tests для Edge Functions ⏱️ 2h
**Приоритет**: P2  
**Файл**: `tests/integration/edge-functions.test.ts` (создать)  
**Зависимости**: Нет

**Описание**: Написать integration tests для критичных edge functions

**Functions to test**:
- `telegram-auth`
- `telegram-bot` (webhook handling)
- `generate-music`

**Критерии приемки**:
- [x] 8+ integration tests
- [x] Mock Supabase responses
- [x] Error handling tested
- [x] All tests pass

---

### 📚 Documentation Tasks (8 hours)

#### TASK-019-007: API Documentation ⏱️ 4h
**Приоритет**: P1  
**Файл**: `docs/API_REFERENCE.md` (создать)  
**Зависимости**: Нет

**Описание**: Создать полную API документацию для Edge Functions

**Структура**:
```markdown
# API Reference

## Authentication

### POST /telegram-auth
Authenticates user via Telegram initData

**Request**:
```json
{
  "initData": "string"
}
```

**Response**:
```json
{
  "user": { ... },
  "session": { ... }
}
```

**Error Codes**:
- 400: Invalid initData
- 401: Authentication failed
- 500: Server error

## Music Generation

### POST /generate-music
...

## Track Management

### GET /tracks
...
```

**Критерии приемки**:
- [x] Все Edge Functions документированы
- [x] Request/Response examples
- [x] Error codes listed
- [x] OpenAPI schema (optional)

---

#### TASK-019-008: Troubleshooting Guide ⏱️ 2h
**Приоритет**: P1  
**Файл**: `docs/TROUBLESHOOTING.md` (создать)  
**Зависимости**: Нет

**Описание**: Создать руководство по решению частых проблем

**Секции**:
```markdown
# Troubleshooting Guide

## Authentication Issues
- InitData validation failed
- Session expired
- User not found

## Telegram Integration
- WebApp not loading
- Haptic feedback not working
- Deep links not opening

## Audio Player
- Track not playing
- Progress bar stuck
- Volume control not working

## Development
- Build errors
- Lint errors
- Test failures
```

**Критерии приемки**:
- [x] 20+ common issues documented
- [x] Solutions provided
- [x] Code examples included
- [x] Links to related docs

---

#### TASK-019-009: Update README with Testing Guide ⏱️ 1h
**Приоритет**: P2  
**Файл**: `README.md` (обновить)  
**Зависимости**: TASK-019-001 to TASK-019-006

**Описание**: Добавить секцию Testing в README

**Добавить**:
```markdown
## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# With coverage
npm test:coverage

# E2E tests
npm run test:e2e

# Specific test file
npm test path/to/test.ts
```

### Test Structure

- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests

### Writing Tests

See [Testing Guide](docs/TESTING_GUIDE.md) for best practices.
```

**Критерии приемки**:
- [x] Testing section added
- [x] Commands documented
- [x] Links to guides

---

### 🔧 Code Quality Tasks (4 hours)

#### TASK-019-010: Fix Remaining Lint Errors ⏱️ 4h
**Приоритет**: P1  
**Зависимости**: Sprint 018 completed

**Описание**: Исправить оставшиеся ~50 lint errors после Sprint 018

**Target areas**:
- Remaining TypeScript any (5 instances)
- Missing dependencies in useEffect
- Unused imports
- Formatting issues

**Критерии приемки**:
- [x] Lint errors < 100
- [x] No critical errors
- [x] Build succeeds
- [x] All tests pass

---

## 🧪 Тестирование

### Test Execution
```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# E2E tests
npm run test:e2e

# Specific suite
npm test -- TelegramContext
```

**Expected Coverage**:
- Overall: > 75%
- TelegramContext: > 80%
- telegram-share: > 90%
- Audio Player: > 70%

---

## 📊 Метрики успеха

| Метрика | До | После | Статус |
|---------|-----|-------|--------|
| Test Coverage | 60% | 75% | ✅ |
| Lint errors | 150 | <100 | ✅ |
| E2E tests | 3 | 10+ | ✅ |
| API docs | 0% | 80% | ✅ |
| Documented issues | 0 | 20+ | ✅ |

---

## 📅 График выполнения

### День 1-2 (11-12 декабря)
- [ ] TASK-019-001: TelegramContext tests
- [ ] TASK-019-002: telegram-share tests

### День 3-4 (13-14 декабря)
- [ ] TASK-019-003: E2E auth tests
- [ ] TASK-019-004: Audio player tests

### День 5-6 (15-16 декабря)
- [ ] TASK-019-005: Track actions tests
- [ ] TASK-019-006: Edge functions tests
- [ ] TASK-019-007: API documentation

### День 7 (17 декабря)
- [ ] TASK-019-008: Troubleshooting guide
- [ ] TASK-019-009: Update README
- [ ] TASK-019-010: Fix remaining lint
- [ ] Final validation

---

## 🎯 Definition of Done

Sprint считается завершенным когда:
- [x] Все 10 задач выполнены
- [x] Test coverage ≥ 75%
- [x] Lint errors < 100
- [x] E2E tests ≥ 10
- [x] API docs complete
- [x] Troubleshooting guide created
- [x] All tests pass
- [x] Code review пройден

---

## 📚 Связанные документы

- [Sprint 018: Code Quality](./SPRINT-018-CODE-QUALITY-IMPROVEMENTS.md)
- [Comprehensive Audit](../docs/COMPREHENSIVE_AUDIT_2025-12-03.md)
- [Testing Best Practices](../docs/TESTING_GUIDE.md) (to be created)

---

**Created**: 3 декабря 2025  
**Status**: ⏳ Waiting for Sprint 018  
**Priority**: P1 (High)
