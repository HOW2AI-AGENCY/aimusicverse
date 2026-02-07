
# План доработки и полировки MusicVerse AI

## Обзор проекта

MusicVerse AI — профессиональная платформа создания музыки на базе AI (Telegram Mini App), реализованная на React 19 + TypeScript + Tailwind CSS с бэкендом на Lovable Cloud (Supabase). Проект находится в продакшене с 100% завершённостью основного функционала.

**Текущее состояние:**
- 180+ React компонентов, 180+ кастомных хуков, 110+ Edge Functions
- 574 пользователей, 1666+ сгенерированных треков
- Полная интеграция с Telegram Mini App SDK 2.0 и Telegram Bot

---

## Часть 1: Дизайн и визуальная полировка

### 1.1 Завершение миграции на Design System

**Проблема:** Несмотря на миграцию overlay-colors, в проекте остаются разрозненные стили.

**Задачи:**
- Аудит оставшихся TODO/FIXME в коде (найдено 392 совпадения в 37 файлах)
- Унификация всех `bg-black/X` и `bg-white/X` на токены из `overlay-colors.ts`
- Приведение всех заголовков к использованию `<Heading />` компонента
- Замена ручных карточек на `<RefinedCard />` и `<InteractiveCard />`

### 1.2 Улучшение типографики для русского языка

**Проблема:** Русский текст на 15-30% длиннее английского, что вызывает проблемы с обрезкой.

**Задачи:**
- Применить `textBalance.ru` из design-tokens ко всем критичным элементам
- Добавить `hyphens: auto` для длинных заголовков
- Улучшить truncation логику с tooltip при hover/long-press
- Увеличить max-width для русскоязычных лейблов

### 1.3 Микро-анимации и визуальные эффекты

**Задачи:**
- Добавить `AnimatedIcon` для всех иконок в интерактивных элементах
- Применить `hoverLift` и `pressScale` из interactions.ts
- Улучшить loading states с shimmer эффектом
- Добавить skeleton-анимации точно соответствующие размерам контента (CLS prevention)

### 1.4 Glassmorphism консистентность

**Задачи:**
- Унифицировать blur-эффекты через `glass.ts` пресеты
- Проверить контраст текста на стеклянных поверхностях (WCAG AA)
- Добавить адаптивность стеклянных эффектов для light/dark тем

---

## Часть 2: Адаптивность и мобильная оптимизация

### 2.1 Safe Area улучшения

**Текущее состояние:** Стандартизирован паттерн `max(var(--tg-*), env(safe-area-inset-*))`.

**Задачи:**
- Аудит всех компонентов на корректность safe area padding
- Улучшить обработку клавиатуры в формах и чатах
- Добавить поддержку горизонтальных safe areas для устройств с notch

### 2.2 Touch Target оптимизация

**Требования:** Минимум 44x44px согласно iOS HIG.

**Задачи:**
- Применить `touchTargetClass` ко всем интерактивным элементам
- Увеличить кликабельные зоны для мелких кнопок
- Добавить visual feedback для touch событий

### 2.3 Responsive Layout улучшения

**Текущее состояние:** 297 компонентов используют responsive паттерны.

**Задачи:**
- Унифицировать использование `useIsMobile` хука
- Улучшить grid layouts для планшетов (768-1024px)
- Добавить специальные layouts для ultra-wide экранов

### 2.4 Плеер: полировка мобильной версии

**Компоненты:** CompactPlayer, MobileFullscreenPlayer, DesktopFullscreenPlayer.

**Задачи:**
- Улучшить swipe-gestures в compact player
- Добавить haptic feedback при seek
- Оптимизировать waveform rendering для низкопроизводительных устройств
- Добавить picture-in-picture режим

---

## Часть 3: Telegram Mini App интеграция

### 3.1 Telegram SDK полировка

**Текущее состояние:** SDK 2.0 полностью интегрирован.

**Задачи:**
- Добавить поддержку новых методов SDK 8.0+ (requestFullscreen, lockOrientation)
- Улучшить theme synchronization с Telegram themeParams
- Добавить Settings Button контекстные действия
- Улучшить MainButton интеграцию в формах

### 3.2 Deep Link расширения

**Текущие паттерны:** `track_`, `project_`, `generate_`, `play_`, `player_`.

**Задачи:**
- Добавить deep links для Lyrics Studio
- Добавить deep links для Stem Studio
- Добавить UTM-tracking для аналитики conversion

### 3.3 Telegram Bot улучшения

**Текущее состояние:** Полноценный бот с inline mode и 8 категориями.

**Задачи:**
- Добавить webhook signature verification (обнаружено отсутствие в production)
- Улучшить error messages в боте (русский язык)
- Добавить inline keyboard для быстрых действий
- Оптимизировать метрики и алерты

---

## Часть 4: Логирование и обработка ошибок

### 4.1 Error Handling улучшения

**Текущее состояние:** Централизованная система с `AppError`, `tryCatch`, Sentry.

**Задачи:**
- Добавить error recovery UI компоненты
- Улучшить user-friendly сообщения об ошибках
- Добавить offline-first error handling
- Улучшить retry логику с визуальным feedback

### 4.2 Logging консистентность

**Задачи:**
- Аудит всех `console.error`/`console.warn` на миграцию к `logger`
- Добавить structured logging context во все Edge Functions
- Улучшить performance timing для критичных операций

### 4.3 Sentry интеграция

**Задачи:**
- Добавить source maps для production debugging
- Настроить release tracking
- Добавить custom breadcrumbs для user journey
- Улучшить error grouping rules

---

## Часть 5: Производительность

### 5.1 Bundle Size оптимизация

**Текущее состояние:** vendor-other 184KB (цель: <150KB).

**Задачи:**
- Lazy loading для opensheetmusicdisplay (-20KB)
- Dynamic import для wavesurfer.js (-25KB)
- Tree-shaking audit для lucide-react (-5KB)
- Добавить Service Worker для caching

### 5.2 Rendering оптимизация

**Задачи:**
- Аудит re-renders с React DevTools Profiler
- Добавить `useMemo`/`useCallback` где необходимо
- Улучшить virtualization для длинных списков
- Оптимизировать animation frames

### 5.3 Network оптимизация

**Задачи:**
- Добавить request deduplication
- Улучшить prefetching стратегию
- Добавить stale-while-revalidate для статических данных

---

## Часть 6: Безопасность

### 6.1 RLS Policies аудит

**Обнаруженные проблемы:**
- WARN: RLS Policy Always True (overly permissive)
- WARN: Leaked Password Protection Disabled

**Задачи:**
- Аудит всех RLS policies на принцип least privilege
- Включить leaked password protection
- Добавить rate limiting на sensitive endpoints

### 6.2 API Security

**Задачи:**
- Добавить TELEGRAM_WEBHOOK_SECRET verification (критично для production)
- Аудит API keys exposure
- Добавить request validation в Edge Functions

---

## Часть 7: UX полировка

### 7.1 Empty States

**Задачи:**
- Добавить иллюстрации для всех empty states
- Улучшить CTA тексты
- Добавить onboarding hints

### 7.2 Loading States

**Задачи:**
- Унифицировать skeleton размеры с финальным контентом
- Добавить progressive loading для изображений
- Улучшить loading indicators для длинных операций

### 7.3 Error States

**Задачи:**
- Добавить retry buttons везде где возможно
- Улучшить error illustrations
- Добавить contextual help links

---

## Приоритизация

### P0: Критичные (1-2 дня)
1. Webhook signature verification для Telegram Bot
2. RLS policies аудит и исправление
3. Leaked password protection

### P1: Высокий приоритет (3-5 дней)
1. Touch targets унификация
2. Safe area полировка
3. Error handling UI components
4. Bundle size оптимизация

### P2: Средний приоритет (1-2 недели)
1. Design system миграция завершение
2. Микро-анимации
3. Responsive layouts для планшетов
4. Deep links расширение

### P3: Низкий приоритет (backlog)
1. Picture-in-picture режим
2. Ultra-wide экраны
3. Advanced analytics
4. A/B testing framework

---

## Технические детали

### Файлы для редактирования

**Дизайн система:**
- `src/lib/design-tokens.ts` — добавление новых токенов
- `src/lib/overlay-colors.ts` — расширение пресетов
- `src/styles/` — CSS улучшения

**Адаптивность:**
- `src/components/layout/SafeLayout.tsx` — safe area улучшения
- `src/components/BottomNavigation.tsx` — touch feedback
- `src/components/player/` — плеер полировка

**Telegram:**
- `src/contexts/telegram/` — SDK расширения
- `supabase/functions/telegram-bot/` — security и UX

**Безопасность:**
- Supabase RLS policies через миграции
- `supabase/functions/telegram-bot/index.ts` — webhook verification

### Метрики успеха

| Метрика | Текущее | Цель |
|---------|---------|------|
| Lighthouse Performance | ~85 | >90 |
| Bundle Size | 184KB | <150KB |
| Touch Target Compliance | ~90% | 100% |
| WCAG AA Compliance | ~95% | 100% |
| Generation Success Rate | 88% | >92% |
