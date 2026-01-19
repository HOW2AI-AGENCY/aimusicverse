# 📚 БАЗА ЗНАНИЙ ПРОЕКТА MusicVerse AI

> **Последнее обновление:** 2026-01-19 (Roadmap V4)  
> **Версия проекта:** 1.7.0 (UI & Toast Unification Complete)

---

## 🆕 НОВОЕ: UI Unification Complete (January 19, 2026)

### ResponsiveModal → UnifiedDialog Migration ✅
**Цель:** Единый компонент для всех модальных окон с Telegram Mini App оптимизацией

**Удалённые компоненты:**
- ❌ `src/components/ui/responsive-modal.tsx` — полностью заменён на UnifiedDialog

**Миграция:**
| Компонент | До | После |
|-----------|-----|-------|
| CreatePlaylistDialog | ResponsiveModal | UnifiedDialog variant="sheet" |
| LibraryFilterModal | ResponsiveModal | UnifiedDialog variant="sheet" |
| ComingSoonModal | ResponsiveModal | UnifiedDialog variant="modal" |
| CreateArtistFromTrackDialog | ResponsiveModal | UnifiedDialog variant="sheet" |

**Telegram Mini App оптимизации:**
- ✅ Safe area поддержка (`--tg-safe-area-inset-bottom`, `env(safe-area-inset-bottom)`)
- ✅ Haptic feedback при открытии/закрытии
- ✅ 44px минимальные touch targets
- ✅ iOS momentum scrolling
- ✅ Drag handle для bottom sheet

### Unified Reward Notification System ✅
**Цель:** Консолидировать 4 gamification компонента в 1

**Новые компоненты:**
```typescript
// Единое уведомление для всех наград
import { UnifiedRewardNotification } from '@/components/gamification/UnifiedRewardNotification';

// Глобальный провайдер контекста
import { RewardNotificationProvider, useRewardNotificationContext } from '@/contexts/RewardNotificationContext';

// Хук для показа уведомлений
const { showLevelUp, showAchievement, showCredits, showStreak, showWelcomeBonus, showSubscription } = useRewardNotificationContext();
```

**Удалённые компоненты (deprecated):**
- ❌ `LevelUpNotification.tsx` — заменён на UnifiedRewardNotification
- ❌ `AchievementUnlockNotification.tsx` — заменён на UnifiedRewardNotification
- ❌ `RewardCelebration.tsx` — заменён на UnifiedRewardNotification

**Использование:**
```tsx
// В любом компоненте
const { showCredits, showStreak, showAchievement } = useRewardNotificationContext();

// Показать награду за чекин
showCredits(50);

// Показать streak с бонусами
showStreak(7, { credits: 100, experience: 50 });

// Показать достижение
showAchievement('Первый трек', 'Создайте первый трек', '🎵', { credits: 20 });
```

### UnifiedDialog System ✅
**Цель:** Единый компонент для всех диалогов

```typescript
// Импорт
import { UnifiedDialog } from '@/components/dialog';

// Варианты
<UnifiedDialog variant="modal" ... />  // Desktop модальное окно
<UnifiedDialog variant="sheet" ... />  // Mobile bottom sheet
<UnifiedDialog variant="alert" ... />  // Confirmation dialog
```

### Toast/Notification System ✅
**Стандарт:** Только Sonner, Radix Toast удалён

```typescript
// Централизованный сервис с дедупликацией
import { notify } from '@/lib/notifications';

notify.success('Готово!');
notify.error('Ошибка');
notify.generationStarted('music');
notify.creditsLow(5);

// Для ошибок с recovery
import { displayError, showErrorWithRecovery } from '@/lib/errorReporting';
displayError(appError, { onRetry: () => retry() });
```

---

## 🆕 UI/UX Roadmap V3 (January 19, 2026)

### Phase 1: Failure Rate Reduction ✅
**Цель:** Снизить failure rate генерации с 16% до <8%

**Новые компоненты:**
```typescript
// Валидация имён артистов в промпте
import { PromptValidationAlert } from '@/components/generate-form/PromptValidationAlert';

// Предупреждение о балансе кредитов
import { CreditBalanceWarning } from '@/components/generate-form/CreditBalanceWarning';

// Библиотека замен артистов на жанры
import { findArtistReplacement, getGenreSuggestions } from '@/lib/artistReplacements';
```

### Phase 2: Engagement Increase ✅
```typescript
// Лайк одним тапом в карточках треков
import { QuickLikeButton } from '@/components/social/QuickLikeButton';
```

### Phase 3: Performance ✅
```typescript
import { TrackCardSkeleton } from '@/components/track/TrackCardSkeleton';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
```

---

## 🎯 Текущий фокус: Roadmap V4

### Priority 1: Критические улучшения (Week 1-2)
- ✅ Валидация промпта (PromptValidationAlert)
- ✅ Предупреждение о балансе (CreditBalanceWarning)
- ✅ QuickLikeButton
- ✅ Skeleton loaders
- ✅ Фильтр по статусу
- ✅ **Унификация Popup/Notification систем** ✨
- ✅ **ResponsiveModal → UnifiedDialog миграция** ✨ NEW
- 📋 Интеграция валидации в extend/cover
- 📋 Снижение Bounce Rate

### Priority 2-5
См. [docs/ROADMAP_V4.md](docs/ROADMAP_V4.md)

---

## 🏗️ Архитектура проекта

### Структура директорий

```
src/
├── components/           # 165+ React компонентов
│   ├── ui/               # Base UI (shadcn/ui)
│   ├── dialog/           # UnifiedDialog система
│   ├── player/           # Аудио плеер
│   ├── library/          # Библиотека треков
│   ├── generate-form/    # Форма генерации
│   ├── stem-studio/      # Разделение стемов
│   ├── lyrics/           # Работа с текстами
│   ├── admin/            # Админ панель
│   ├── track/            # Компоненты треков
│   ├── social/           # Социальные функции
│   └── gamification/     # Геймификация (UnifiedRewardNotification)
├── hooks/                # 100+ кастомных хуков
│   ├── audio/            # usePlayerState, useAudioTime
│   ├── generation/       # useGenerateForm
│   ├── studio/           # useStudioState
│   └── telegram/         # useTelegramMainButton
├── stores/               # Zustand stores
├── contexts/             # React Contexts (RewardNotificationContext)
├── services/             # Сервисы API
├── lib/                  # Утилиты
│   ├── errors/           # Типизированные ошибки
│   ├── audio/            # Аудио утилиты
│   └── artistReplacements.ts  # Замены артистов
├── types/                # TypeScript типы
└── pages/                # Страницы приложения
```

### Ключевые файлы

| Файл | Описание |
|------|----------|
| `src/integrations/supabase/client.ts` | Supabase клиент (**НЕ РЕДАКТИРОВАТЬ**) |
| `src/integrations/supabase/types.ts` | Типы БД (**НЕ РЕДАКТИРОВАТЬ**) |
| `src/lib/artistReplacements.ts` | Маппинг артистов на жанры |
| `src/components/generate-form/PromptValidationAlert.tsx` | Валидация промпта |
| `src/components/generate-form/CreditBalanceWarning.tsx` | Предупреждение о балансе |

---

## 🔧 Паттерны разработки

### Error Handling (ADR-004)

```typescript
import { AppError, tryCatch, retryWithBackoff } from '@/lib/errors';

const result = await tryCatch(() => fetchData());
if (!result.success) {
  showErrorWithRecovery(result.error);
  return;
}
```

### Уведомления

```typescript
import { notify } from '@/lib/notifications';

notify.success('Сохранено');
notify.error('Ошибка', { dedupe: true, dedupeKey: 'error-key' });
```

### Логирование

```typescript
import { logger } from '@/lib/logger';

logger.info('Action', { userId, action });
logger.error('Failed', error, { endpoint });
```

### Telegram Safe Area

```css
padding-top: calc(
  max(
    var(--tg-content-safe-area-inset-top, 0px) + 
    var(--tg-safe-area-inset-top, 0px) + 0.75rem,
    calc(env(safe-area-inset-top, 0px) + 0.75rem)
  )
);
```

---

## 📊 База данных

### Ключевые таблицы

| Таблица | Описание |
|---------|----------|
| `tracks` | Треки пользователей |
| `track_versions` | Версии треков (A/B) |
| `track_stems` | Стемы (vocals, drums, bass) |
| `profiles` | Профили пользователей |
| `user_credits` | Баланс и геймификация |
| `generation_tasks` | Задачи генерации |

### RLS паттерны

```sql
-- Пользователь может CRUD свои данные
CREATE POLICY "Users can CRUD own data"
ON public.table_name FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 🚨 Частые ошибки и решения

### 1. Аудио ошибки при старте
**Проблема:** "NotAllowedError" при восстановлении из localStorage  
**Решение:** Подавлять ошибки первые 2 секунды в GlobalAudioProvider

### 2. Telegram Safe Area
**Проблема:** Контент обрезается  
**Решение:** Использовать CSS переменные `--tg-*`

### 3. iOS Safari автозум
**Проблема:** Input fields вызывают zoom  
**Решение:** `text-base` font size, `touch-manipulation`

### 4. RLS блокирует запросы
**Проблема:** "violates row-level security policy"  
**Решение:** Проверить auth.uid() и политики

---

## 📱 iOS/iPhone Telegram Mini App

### Реализованные оптимизации

| Оптимизация | Файл | Описание |
|-------------|------|----------|
| Vertical Swipe Prevention | `useTelegramInit.ts` | `disableVerticalSwipes()` |
| Keyboard Height Tracking | `main.tsx` | `visualViewport` API |
| Input Zoom Prevention | `input.tsx` | `text-base` + `touch-manipulation` |
| Momentum Scrolling | `scroll-area.tsx` | `-webkit-overflow-scrolling: touch` |
| Touch Targets | `input.tsx`, `sheet.tsx` | `min-h-[44px]` |
| Safe Areas | `index.css` | CSS classes `.safe-top`, `.safe-bottom` |
| 100vh Fix | `main.tsx` | `--vh` variable |
| Context Menu Prevention | `index.css` | `-webkit-touch-callout: none` |
| Backdrop Filter | `index.css` | `-webkit-backdrop-filter` prefix |

### Полная документация: `docs/iOS_FIXES.md`

### Debug-команды
```javascript
window.__getBootLog()  // Лог инициализации
getComputedStyle(document.documentElement).getPropertyValue('--keyboard-height')
getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom')
```

---

## ✅ Чек-лист при разработке

1. **Проверить существующие компоненты** — возможно уже есть
2. **Использовать типизированные ошибки** — `@/lib/errors`
3. **Логирование через logger** — `@/lib/logger`
4. **Safe area для Telegram** — CSS переменные `--tg-*`
5. **RLS политики для новых таблиц**
6. **Lazy loading для тяжелых компонентов**
7. **Cleanup в useEffect** — особенно для подписок
8. **Touch targets минимум 44px** — для iOS
9. **text-base для inputs** — предотвращает iOS auto-zoom
10. **Тестировать на iOS** — см. `docs/iOS_FIXES.md`

---

## 📚 Документация

| Файл | Описание |
|------|----------|
| `PROJECT_STATUS.md` | Текущий статус |
| `docs/ROADMAP_V4.md` | Роадмап развития |
| `docs/iOS_FIXES.md` | iOS/iPhone оптимизации |
| `SPRINTS/SPRINT-PROGRESS.md` | Прогресс спринтов |
| `docs/KNOWN_ISSUES.md` | Известные проблемы |
| `docs/ARCHITECTURE.md` | Архитектура |
| `ADR/` | Архитектурные решения |

---

*Обновлено: 2026-01-19*
