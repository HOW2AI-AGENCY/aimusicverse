# 📚 БАЗА ЗНАНИЙ ПРОЕКТА MusicVerse AI

> **Последнее обновление:** 2026-01-23 (UI/UX Sprints A-E Complete)  
> **Версия проекта:** 1.9.0 (Design System + Documentation)

---

## 🆕 НОВОЕ: Infrastructure Optimization (January 19, 2026)

### Фаза 1: Загрузка треков по жанрам ✅
**Проблема:** Секции по жанрам были пустые — загружалось только 20 треков с клиентской фильтрацией

**Решение:**
```typescript
// usePublicContent.ts — серверная фильтрация по computed_genre
const GENRE_QUERIES = [
  { key: 'hiphop', dbValues: ['hip-hop', 'hiphop', 'hip hop', 'rap'] },
  { key: 'pop', dbValues: ['pop', 'pop-music', 'electropop'] },
  // ...
];

// Параллельные запросы для каждого жанра
const [mainResult, ...genreResults] = await Promise.all([
  supabase.from("tracks").select(...).limit(30),
  ...GENRE_QUERIES.map(genre => 
    supabase.from("tracks").eq("computed_genre", genre.dbValues).limit(12)
  ),
]);
```

**Результат:** 100% секций отображаются (было ~10%)

### Фаза 2: Cover Image Thumbnails ✅
**Цель:** Pre-generate WebP thumbnails для ускорения загрузки (-60% bandwidth)

**Новая таблица:** `public.cover_thumbnails`
```sql
-- Хранит предгенерированные thumbnail URLs
CREATE TABLE public.cover_thumbnails (
  track_id UUID REFERENCES tracks(id),
  small_url TEXT,   -- 160px WebP
  medium_url TEXT,  -- 320px WebP
  large_url TEXT,   -- 640px WebP
  blurhash TEXT,
  dominant_color TEXT,
  status TEXT DEFAULT 'pending'
);
```

**Edge Function:** `supabase/functions/generate-thumbnails/index.ts`

**TODO:**
- [ ] Реализовать blurhash генерацию
- [ ] Добавить batch processing для существующих обложек
- [ ] Интегрировать pg_net для автоматического вызова Edge Function

**Фронтенд хелпер:**
```typescript
// src/lib/imageOptimization.ts
export function getTrackCoverUrl(
  coverUrl: string,
  size: 'small' | 'medium' | 'large',
  thumbnails?: ThumbnailUrls  // NEW: pre-generated thumbnails
): string;
```

### Фаза 3: Database Optimization ✅
**Новые индексы:**
```sql
-- Оптимизация публичных треков по жанрам
CREATE INDEX idx_tracks_public_genre_optimized 
  ON public.tracks(is_public, status, computed_genre);

-- Сортировка по свежести
CREATE INDEX idx_tracks_public_recent 
  ON public.tracks(created_at DESC);

-- Сортировка по популярности
CREATE INDEX idx_tracks_public_popular 
  ON public.tracks(play_count DESC NULLS LAST);
```

### Фаза 4: Modular Admin Panel ✅
**Архитектура:** Nested routes с lazy loading

```typescript
// App.tsx — вложенные роуты
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminOverview />} />
  <Route path="analytics" element={<AnalyticsDashboard />} />
  <Route path="economy" element={<AdminEconomy />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="tracks" element={<AdminTracks />} />
  // ...ещё 10+ sub-routes
</Route>
```

**Файлы:** `src/pages/admin/` (16 компонентов)

**Удалённые дубликаты:** `src/components/admin/pages/` — объединено с `src/pages/admin/`

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

## 🎯 Текущий фокус: Q1 2026 Plan

### UI/UX Optimization (Sprints A-E) ✅ COMPLETE
- ✅ Sprint A: Performance Foundation (dayjs, lazy recharts)
- ✅ Sprint B: Mobile UX (touch targets, safe areas)
- ✅ Sprint C: Design System (design tokens integration)
- ✅ Sprint D: User Journey (onboarding, empty states)
- ✅ Sprint E: Documentation Update

### Performance Optimization 📋 NEXT (Phase 6)
- 📋 Bundle size <150 KB vendor
- 📋 Service Worker implementation
- 📋 Image optimization (WebP, srcset)

### Specs Implementation 📋 PLANNED (Phase 7)
- 📋 Spec 032: Professional UI (22 requirements)
- 📋 Spec 031: Mobile Studio V2 (42 requirements)

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

## 🎨 Design System (January 2026)

### Design Tokens
Файл: `src/lib/design-tokens.ts`

**Tailwind Typography Classes:**
```typescript
import { typographyClass } from '@/lib/design-tokens';

<h1 className={typographyClass.heading.h1}>Заголовок</h1>
<p className={typographyClass.body.md}>Текст</p>
<span className={typographyClass.caption}>Дата</span>
```

**Spacing Classes:**
```typescript
import { spacingClass } from '@/lib/design-tokens';

<div className={spacingClass.card}>Карточка</div>
<section className={spacingClass.section}>Секция</section>
```

**Russian Text Handling:**
```typescript
import { textBalance } from '@/lib/design-tokens';

// Предотвращает переполнение русского текста
<p className={textBalance.ru}>Длинный русский текст</p>
```

**Touch Targets:**
```typescript
import { touchTargetClass } from '@/lib/design-tokens';

<button className={touchTargetClass.icon}>Icon</button>
<button className={touchTargetClass.button}>Button</button>
```

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

---

## 🆕 НОВОЕ: Sprints A-E Complete (January 23, 2026)

### Sprint A: Performance Foundation ✅
- Заменён `date-fns` на `dayjs` (`src/lib/date-utils.ts`)
- Lazy loading для `recharts` (`useRecharts` hook)
- DNS-prefetch/preconnect hints в `index.html`
- Vendor bundle target: <150 KB

### Sprint B: Mobile UX Improvements ✅
- Touch targets стандартизированы (≥44px)
- Русский текст overflow fixes
- Telegram safe area handling
- Haptic feedback patterns

### Sprint C: Design System Integration ✅
- Design tokens в `src/lib/design-tokens.ts`
- `typographyClass` — унифицированная типографика
- `spacingClass` — стандартные отступы
- `textBalance` — балансировка русского текста
- `touchTargetClass` — интерактивные элементы

### Sprint D: User Journey Optimization ✅
- `EmptyLibraryState` с design tokens
- `FirstTimeHeroCard` с "FREE" бейджами
- Упрощённые анимации для mobile (whileTap priority)

### Sprint E: Documentation ✅
- Обновлён PROJECT_STATUS.md
- Обновлён KNOWN_ISSUES.md
- Обновлён KNOWLEDGE_BASE.md
- Обновлён SPRINT-PROGRESS.md

---

*Обновлено: 2026-01-23*
