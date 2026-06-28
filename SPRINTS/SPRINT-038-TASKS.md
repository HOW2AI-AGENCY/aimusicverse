# Sprint 038: Design System Unification & UX Optimization — Детализация задач

**Создано:** 2026-06-29
**Спецификация:** [Spec 038](../specs/038-design-ux-audit/spec.md)
**План:** [Sprint 038 Plan](./SPRINT-038-PLAN.md)
**Всего задач:** 20 | **SP:** 54 | **Дней:** 20

---

## Фаза A: Foundation (Дни 1-5, 15 SP)

### T038-01: Unified EmptyState — анализ и проектирование API
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Сравнить API трёх существующих компонентов: `EmptyState.tsx`, `empty-state.tsx`, `unified-empty-state.tsx`
  - Спроектировать финальный `EmptyStateProps` интерфейс с variant-архитектурой
  - Задокументировать все variant → icon маппинги
- **Definition of Done:**
  - [ ] `EmptyStateProps` интерфейс утверждён и задокументирован в коде
  - [ ] Маппинг variant→icon→defaultTitle→defaultDescription записан
  - [ ] Ревью: проверить что все текущие использования покрыты новым API

### T038-02: Unified EmptyState — реализация
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** T038-01
- **Описание:**
  - Обновить `src/components/ui/EmptyState.tsx`: добавить `action` prop, `size` prop, все варианты из спецификации
  - Добавить `empty-state.stories.tsx` (6+ variant stories)
  - Unit-тесты: рендеринг каждого варианта, action callback
- **Файлы:**
  - `src/components/ui/EmptyState.tsx` (модификация)
  - `src/stories/ui/EmptyState.stories.tsx` (перезапись)
  - `src/__tests__/ui/EmptyState.test.tsx` (новый)
- **Критерии:**
  - [ ] 8 variant'ов (default/search/library/generations/projects/artists/playlists/error)
  - [ ] 3 size'а (sm/md/lg)
  - [ ] action button с 3 variant'ами (primary/secondary/outline)
  - [ ] Анимация через `framer-motion` (сохранена)
  - [ ] 6+ Storybook stories проходят
  - [ ] Тесты проходят (`npx vitest run src/__tests__/ui/EmptyState.test.tsx`)

### T038-03: Unified EmptyState — миграция
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** T038-02
- **Описание:**
  - Найти все импорты `empty-state` и `unified-empty-state` через grep
  - Заменить на новый `EmptyState` с соответствующими variant'ами
  - Удалить `src/components/ui/empty-state.tsx`
  - Удалить `src/components/ui/unified-empty-state.tsx`
  - Проверить все страницы на корректный empty state
- **Критерии:**
  - [ ] `grep -r "from.*empty-state" src/` → только `EmptyState.tsx`
  - [ ] `ls src/components/ui/empty-state.tsx` → файл удалён
  - [ ] `ls src/components/ui/unified-empty-state.tsx` → файл удалён
  - [ ] `npm run build` проходит без ошибок

### T038-04: Unified Loading — SkeletonPage
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Создать `src/components/ui/SkeletonPage.tsx` — полностраничный скелетон
  - Варианты: `default` (header + карточки), `detail` (header + hero + text), `profile` (header + avatar + списки)
  - Использовать внутри `ContentSkeleton` и `Shimmer`
- **Файлы:**
  - `src/components/ui/SkeletonPage.tsx` (новый)
  - `src/stories/ui/SkeletonPage.stories.tsx` (новый, 3+ variant stories)
- **Критерии:**
  - [ ] 3 варианта SkeletonPage
  - [ ] Использует ContentSkeleton и Shimmer (не дублирует)
  - [ ] Storybook stories проходят

### T038-05: Unified Loading — ContentSkeleton + clean-up
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** T038-04
- **Описание:**
  - Обновить `ContentSkeleton.tsx` → добавить варианты: `card-list`, `table`, `detail`, `profile`
  - Удалить `skeleton.tsx`, `skeleton-loader.tsx`, `skeleton-components.tsx`
  - Обновить все импорты на `ContentSkeleton` или `SkeletonPage`
  - Unit-тесты для ContentSkeleton вариантов
- **Файлы:**
  - `src/components/ui/ContentSkeleton.tsx` (модификация)
  - `src/__tests__/ui/ContentSkeleton.test.tsx` (новый)
- **Критерии:**
  - [ ] `ls src/components/ui/skeleton*.tsx` → только `ContentSkeleton.tsx`
  - [ ] 4 варианта ContentSkeleton с тестами
  - [ ] Дубликаты удалены
  - [ ] `npm run build` проходит

### T038-06: Unified Onboarding — OnboardingFlow state machine
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Создать `src/components/onboarding/OnboardingFlow.tsx`
  - Стейт-машина с шагами: `splash` → `welcome` → `feature-tour` → `profile-setup` → `done`
  - Интегрировать существующий `UnifiedSplashScreen`
  - Перенести фичи из `Onboarding.tsx` и `OnboardingSlider.tsx`
- **Файлы:**
  - `src/components/onboarding/OnboardingFlow.tsx` (новый)
  - `src/components/onboarding/OnboardingStateMachine.ts` (новый, типы стейтов)
- **Критерии:**
  - [ ] 5 стейтов (splash/welcome/tour/profile/done)
  - [ ] Переходы между стейтами анимированы (fade)
  - [ ] MainButton интегрирован на каждом шаге
  - [ ] Стейт сохраняется в localStorage (`onboarding_completed`)

### T038-07: Unified Onboarding — шаги и интеграция
- **SP:** 3 | **Статус:** 🔴 OPEN | **Зависимости:** T038-06
- **Описание:**
  - **WelcomeCard:** логотип, слоган "Create music with AI", кнопка "Get Started"
  - **FeatureTour:** 3 шага (Generate → Studio → Community), swipeable через `embla-carousel-react`
  - **ProfileSetup:** аватар (загрузка/камера), имя (валидация через zod)
  - **Done:** анимация успеха → redirect → Library
  - Добавить условие в роутер
  - Добавить кнопку "Reset onboarding" в Settings
- **Файлы:**
  - `src/components/onboarding/WelcomeCard.tsx` (новый)
  - `src/components/onboarding/FeatureTour.tsx` (новый)
  - `src/components/onboarding/ProfileSetupStep.tsx` (новый)
  - `src/components/onboarding/OnboardingDone.tsx` (новый)
  - `src/pages/Settings.tsx` (модификация — добавить reset)
- **Критерии:**
  - [ ] Новый пользователь видит onboarding
  - [ ] Существующий пользователь НЕ видит onboarding
  - [ ] Reset onboarding работает из Settings
  - [ ] 3 шага feature-тура, не 8
  - [ ] `npm run build` проходит

### T038-08: Unified Onboarding — миграция и удаление старого
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** T038-07
- **Описание:**
  - Удалить `src/pages/Onboarding.tsx`
  - Удалить `src/components/OnboardingSlider.tsx`
  - Удалить старые onboarding-компоненты из роутера
  - Обновить импорты
- **Критерии:**
  - [ ] `ls src/pages/Onboarding.tsx` → удалён
  - [ ] `ls src/components/OnboardingSlider.tsx` → удалён
  - [ ] OnboardingFlow — единственный путь онбординга
  - [ ] `npm run build` проходит

### T038-09: Touch Target Audit
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Создать `src/components/ui/TouchTarget.tsx` враппер (`min-w-[44px] min-h-[44px] flex items-center justify-center`)
  - Пройти grep'ом по `IconButton`, `CloseButton`, `XButton`, `TabButton`, `Chip` 
  - Применить `TouchTarget` враппер
  - Проверить через Chrome DevTools все интерактивные элементы
- **Файлы:**
  - `src/components/ui/TouchTarget.tsx` (новый)
  - `src/components/ui/button.tsx` (модификация — IconButton variant)
  - `src/components/ui/tabs.tsx` (модификация)
  - `src/components/ui/chart.tsx` (модификация если нужно)
- **Критерии:**
  - [ ] TouchTarget компонент существует
  - [ ] 0 элементов < 44×44px (ручная проверка 10+ экранов)
  - [ ] `npm run build` проходит

### T038-10: Z-Index Audit
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Создать `src/lib/z-index.ts` с константами (`Z_BASE`, `Z_DROPDOWN`, `Z_STICKY`, `Z_DRAWER`, `Z_MODAL`, `Z_POPOVER`, `Z_TOAST`)
  - Найти все магические z-index через `grep -r "z-\[" src/` 
  - Заменить на Tailwind z-токены через CSS variables или использовать семантические классы
  - Проверить визуально: модалки > drawer > sticky > контент
- **Файлы:**
  - `src/lib/z-index.ts` (новый)
  - `src/index.css` (модификация — CSS z-index токены)
- **Критерии:**
  - [ ] Z-index константы в одном файле
  - [ ] 0 магических `z-[999]`, `z-[50]` в src/ (разрешены семантические классы)
  - [ ] Визуальный smoke-тест: модалки над drawer, тосты над всем

---

## Фаза B: Navigation & Responsive (Дни 6-10, 13 SP)

### T038-11: NavigationShell — проектирование
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** T038-09
- **Описание:**
  - Спроектировать `NavigationShell` API: пропсы для sidebar/tabs/hooks
  - Определить breakpoint'ы: <768 → BottomTabBar, 768-1024 → CollapsibleSidebar + BottomTabBar, ≥1024 → FixedSidebar
  - Создать тестовую страницу для отладки на всех breakpoints
- **Критерии:**
  - [ ] Архитектурное решение задокументировано
  - [ ] Тестовая страница показывает все 3 режима навигации

### T038-12: NavigationShell — реализация
- **SP:** 3 | **Статус:** 🔴 OPEN | **Зависимости:** T038-11
- **Описание:**
  - Создать `src/components/navigation/NavigationShell.tsx`
  - Интегрировать `DesktopLibrarySidebar` для desktop
  - Создать `BottomTabBar` для mobile (5 иконок: Home, Library, Studio, Generate, Profile)
  - Анимированный active-индикатор (перемещается между табами)
  - Анимировать collapse/expand sidebar
- **Файлы:**
  - `src/components/navigation/NavigationShell.tsx` (новый)
  - `src/components/navigation/BottomTabBar.tsx` (новый)
  - `src/components/navigation/ActiveTabIndicator.tsx` (новый)
  - `src/components/navigation/CollapsibleSidebar.tsx` (новый)
- **Критерии:**
  - [ ] 3 режима работают на соответствующих breakpoints
  - [ ] Анимированный индикатор активного таба
  - [ ] Плавный переход между режимами при ресайзе
  - [ ] Storybook stories (3 варианта)

### T038-13: NavigationShell — интеграция
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** T038-12
- **Описание:**
  - Заменить текущую навигацию в `App.tsx` на `NavigationShell`
  - Удалить старую mobile-навигацию (если дублируется)
  - Проверить все 16 страниц на корректную навигацию
- **Критерии:**
  - [ ] Все страницы используют NavigationShell
  - [ ] Навигация не ломается при переходах
  - [ ] `npm run build` проходит

### T038-14: Container Queries — миграция
- **SP:** 3 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Идентифицировать компоненты с `sm:`, `md:`, `lg:` grid-классами
  - Заменить на `@container` и `@[size]` в 5+ компонентах:
    - `TrackCard` / `TrackGrid` (библиотека)
    - `ProjectCard` / `ProjectGrid` (проекты)
    - `PlaylistCard` (плейлисты)
    - `ToolCard` (генерация/студия)
    - `StatsCard` (дашборд)
  - Добавить `container-type: inline-size` на родительские обёртки
- **Файлы:**
  - `tailwind.config.ts` (модификация — добавить `@container` плагин)
  - 5+ компонентов (модификация)
- **Критерии:**
  - [ ] 5+ компонентов используют container queries
  - [ ] Grid адаптируется к родителю, а не к viewport
  - [ ] Fallback media queries для старых браузеров
  - [ ] `npm run build` проходит

### T038-15: Safe Area + Safari Fixes
- **SP:** 3 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - **038-08:** Пройти grep по `safe-area` — проверить что ВСЕ страницы используют `SafeAreaTop`/`SafeAreaBottom`
  - **038-09:** Пройти grep по `100vh` и `h-screen` — заменить на `h-[var(--vh,100vh)]` или `min-h-screen`
  - Добавить `--keyboard-height` обработку для всех модальных окон
  - Проверить на iOS Simulator / реальном устройстве
- **Критерии:**
  - [ ] `grep -r "100vh" src/` → 0 результатов (кроме index.css определения)
  - [ ] `grep -r "h-screen" src/` → только в safe-area/layout компонентах
  - [ ] Safe area работает на iPhone (notch + Dynamic Island)
  - [ ] Клавиатура не перекрывает поля ввода

### T038-16: Responsive Typography (clamp)
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Добавить 5 семантических классов в `src/index.css`:
    - `.text-display` — `clamp(2rem, 5vw, 3.5rem)` Space Grotesk
    - `.text-heading` — `clamp(1.25rem, 3vw, 2rem)` Space Grotesk
    - `.text-body` — `1rem` DM Sans
    - `.text-caption` — `0.875rem` DM Sans
    - `.text-overline` — `0.75rem uppercase tracking-wider` DM Sans
  - Пройти grep по `text-4xl`, `text-3xl`, `text-2xl` — заменить заголовки на `.text-display`/`.text-heading`
  - Responsive-типографику через `clamp()` для hero-секций
- **Файлы:**
  - `src/index.css` (модификация)
  - ~10-15 компонентов (модификация заголовков)
- **Критерии:**
  - [ ] 5 семантических классов в index.css
  - [ ] Заголовки используют семантические классы
  - [ ] Типографика адаптивна (меньше на mobile, больше на desktop)

---

## Фаза C: Animation & Polish (Дни 11-15, 12 SP)

### T038-17: Animation Standards — duration/easing enforcement
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** T038-10 (z-index)
- **Описание:**
  - Обновить `src/lib/motion-presets.ts`:
    - Добавить `DURATION_INSTANT`, `DURATION_FAST`, `DURATION_BASE`, `DURATION_SLOW`, `DURATION_SPRING`
    - Добавить `EASE_DEFAULT`, `EASE_BOUNCE`, `EASE_SPRING`
  - Пройти grep по `duration:` в `motion.div` — заменить магические числа на константы
  - Стандартизировать transition-ы в `tailwind.config.ts`
- **Файлы:**
  - `src/lib/motion-presets.ts` (модификация)
  - `src/lib/motion.ts` (модификация — экспорт констант)
- **Критерии:**
  - [ ] Все duration используют константы (не числа)
  - [ ] ESLint правило для запрета magic number duration (опционально)
  - [ ] 5 констант duration + 3 константы easing

### T038-18: Reduced Motion — глобальный аудит
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Пройти grep по `motion.div`, `motion.span`, `AnimatePresence` во всех компонентах
  - Добавить `useReducedMotion()` проверку в каждый компонент с анимацией
  - Создать хелпер `useSafeMotion(enabled: boolean)` — возвращает `motion` или `static` div
  - Добавить `prefers-reduced-motion: reduce` в Storybook для тестирования
- **Файлы:**
  - `src/hooks/useSafeMotion.ts` (новый)
  - ~15-20 компонентов (модификация — добавить проверку)
- **Критерии:**
  - [ ] `useSafeMotion` хук существует
  - [ ] Все `motion.*` компоненты проверяют reduced motion
  - [ ] Storybook: reduced-motion mode работает

### T038-19: Player Shared Element Transition
- **SP:** 4 | **Статус:** 🔴 OPEN | **Зависимости:** T038-17, T038-18
- **Описание:**
  - **Mini Player → Full Player** через `layoutId` Framer Motion (artwork)
  - FullPlayer — `Sheet` (vaul) на мобильных, `Dialog` на desktop
  - Queue — правая панель внутри FullPlayer (не отдельный экран)
  - Waveform — `motion.div` с анимированной высотой
  - Swipe down для закрытия FullPlayer (возврат к Mini)
- **Файлы:**
  - `src/components/player/MiniPlayer.tsx` (модификация)
  - `src/components/player/FullScreenPlayer.tsx` (модификация)
  - `src/components/player/PlayerQueue.tsx` (модификация — теперь внутри FullPlayer)
  - `src/components/player/PlayerTransitionProvider.tsx` (новый — layoutId контекст)
- **Критерии:**
  - [ ] Shared element transition artwork (mini → full) плавный, < 300ms
  - [ ] FullPlayer закрывается swipe'ом вниз
  - [ ] Queue доступна из FullPlayer (не отдельная страница)
  - [ ] Не ломается на iOS Safari

### T038-20: Telegram Haptics Integration
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Создать `src/lib/haptics.ts` враппер над Telegram `HapticFeedback` API
  - Интегрировать в ключевые взаимодействия:
    - `impact("light")` — переключение табов
    - `impact("medium")` — like/save трека
    - `notification("success")` — завершение генерации
    - `notification("error")` — ошибка
  - Проверить на реальном устройстве через Telegram WebApp
- **Файлы:**
  - `src/lib/haptics.ts` (новый)
  - Компоненты с кнопками like/save (модификация)
- **Критерии:**
  - [ ] `haptics.ts` враппер работает
  - [ ] Haptic feedback на 5+ взаимодействиях
  - [ ] Не крашится вне Telegram WebApp (проверка `window.Telegram`)

---

## Фаза D: Visual Polish (Дни 16-20, 14 SP)

### T038-21: Typography Consistency Pass
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** T038-16
- **Описание:**
  - Пройти grep по `font-family`, `font-`, `text-` в className
  - Привести к 5 семантическим классам (display/heading/body/caption/overline)
  - Проверить fallback-шрифты: DM Sans → `sans-serif`, Space Grotesk → `sans-serif`
  - Удалить инлайн font-family объявления
- **Критерии:**
  - [ ] Все заголовки используют `text-display` или `text-heading`
  - [ ] Все body-тексты используют `text-body` или Tailwind default
  - [ ] 0 инлайн `font-family` в компонентах (кроме index.css)

### T038-22: Elevation System Standardization
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** T038-10
- **Описание:**
  - Добавить CSS-утилиты в `src/index.css`:
    ```css
    .elevation-0 { box-shadow: none; }
    .elevation-1 { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .elevation-2 { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .elevation-3 { box-shadow: 0 8px 24px rgba(0,0,0,0.16); }
    .elevation-4 { box-shadow: 0 16px 48px rgba(0,0,0,0.2); }
    ```
  - Пройти grep по `shadow-`, `drop-shadow` — заменить на elevation-классы
  - Glassmorphism: `backdrop-blur-md bg-background/80` → `.glass-surface`
- **Критерии:**
  - [ ] 4 elevation класса + `.glass-surface`
  - [ ] Карточки используют `elevation-1`
  - [ ] App bar / FAB используют `elevation-2`
  - [ ] Модальные окна используют `elevation-3`

### T038-23: Color Token Audit & Enforce
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Пройти grep по `bg-[#`, `text-[#`, `border-[#` — заменить на HSL custom properties
  - Добавить `--accent` цвет (между primary и secondary)
  - Добавить `--surface-elevated` для карточек
  - Стандартизировать opacity: `--opacity-hover`, `--opacity-disabled`, `--opacity-overlay`
  - ESLint rule: запретить hex-литералы в className (уже есть, проверить что работает)
- **Критерии:**
  - [ ] `grep -r "bg-\[#" src/` → 0 результатов
  - [ ] `--accent`, `--surface-elevated`, `--opacity-*` токены добавлены
  - [ ] ESLint правило `no-restricted-syntax` для hex в className

### T038-24: Icon Consistency Pass
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Пройти grep по `<svg`, `icon`, `emoji` в компонентах
  - Заменить все инлайн-SVG на `lucide-react` иконки через `@/lib/icons`
  - Стандартизировать размеры: 16px (inline), 20px (buttons), 24px (nav), 32px (hero)
  - Проверить aria-label на всех иконках без текста
- **Критерии:**
  - [ ] 0 инлайн `<svg>` в компонентах (кроме logo)
  - [ ] Все иконки через `@/lib/icons`
  - [ ] aria-label на всех иконках без текста

### T038-25: Storybook — 20+ Stories
- **SP:** 2 | **Статус:** 🔴 OPEN | **Зависимости:** T038-02..T038-24
- **Описание:**
  - Написать stories для всех новых/изменённых компонентов:
    - EmptyState (6+ variants)
    - SkeletonPage (3 variants)
    - ContentSkeleton (4 variants)
    - NavigationShell (3 variants: mobile/tablet/desktop)
    - BottomTabBar (active/inactive states)
    - TouchTarget (примеры использования)
    - OnboardingFlow (5 steps)
    - PlayerTransition (mini/full)
  - Проверить: `npm run build-storybook` проходит без ошибок
- **Критерии:**
  - [ ] 20+ stories добавлено (было 10 → стало 30+)
  - [ ] Storybook build проходит
  - [ ] Все stories используют правильные декораторы (Router, Theme)

### T038-26: LazyImage Audit
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** —
- **Описание:**
  - Пройти grep по `<img`, `src=`, `background-image` в компонентах
  - Заменить все `<img>` на `<LazyImage>` (из `src/components/ui/lazy-image.tsx`)
  - Добавить `srcset` и `sizes` для responsive изображений
  - Добавить `loading="lazy"` и `decoding="async"` где применимо
- **Критерии:**
  - [ ] `grep -r "<img" src/components/` → 0 результатов
  - [ ] Все изображения используют LazyImage
  - [ ] Аватары, обложки треков, карточки проектов — LazyImage

### T038-27: Lighthouse Audit + Performance Baseline
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** все задачи фазы D
- **Описание:**
  - Запустить Lighthouse на 4 ключевых экранах: Library, Player, Generate, Settings
  - Записать Performance/Accessibility/Best Practices/SEO метрики
  - Сравнить с целевыми (Perf ≥ 80, FCP < 2.5s, LCP < 4s, TBT < 300ms)
  - Создать отчёт `docs/LIGHTHOUSE_BASELINE_038.md`
- **Критерии:**
  - [ ] Lighthouse Performance ≥ 80 (mobile)
  - [ ] FCP < 2.5s, LCP < 4s, TBT < 300ms
  - [ ] Отчёт сохранён в docs/

### T038-28: Final Review & Documentation Update
- **SP:** 1 | **Статус:** 🔴 OPEN | **Зависимости:** все задачи
- **Описание:**
  - Обновить `CLAUDE.md`:
    - Правило дизайн-системы (elevation, typography, color tokens)
    - Правило touch targets (≥44px)
    - Правило анимаций (useSafeMotion, duration constants)
    - Правило иконок (lucide-only, через @/lib/icons)
  - Обновить `CHANGELOG.md` — Sprint 038 entry
  - Обновить `SPRINTS/SPRINT-PROGRESS.md`
  - Обновить `SPRINTS/SPRINT-038-PLAN.md` — отметить все задачи как COMPLETE
  - Проверить `npm run check-all` проходит
- **Критерии:**
  - [ ] CLAUDE.md обновлён (4 новых правила)
  - [ ] CHANGELOG.md обновлён
  - [ ] SPRINT-PROGRESS.md обновлён
  - [ ] `npm run check-all` проходит

---

## Сводка всех задач

| ID | Название | Фаза | SP | Статус |
|----|----------|------|-----|--------|
| T038-01 | EmptyState: API design | A | 1 | 🔴 OPEN |
| T038-02 | EmptyState: implementation | A | 2 | 🔴 OPEN |
| T038-03 | EmptyState: migration | A | 1 | 🔴 OPEN |
| T038-04 | SkeletonPage component | A | 1 | 🔴 OPEN |
| T038-05 | ContentSkeleton + clean-up | A | 2 | 🔴 OPEN |
| T038-06 | OnboardingFlow state machine | A | 2 | 🔴 OPEN |
| T038-07 | OnboardingFlow steps + integration | A | 3 | 🔴 OPEN |
| T038-08 | Onboarding: remove legacy | A | 1 | 🔴 OPEN |
| T038-09 | Touch target audit | A | 2 | 🔴 OPEN |
| T038-10 | Z-index audit | A | 2 | 🔴 OPEN |
| | | | **15** | |
| T038-11 | NavigationShell: design | B | 1 | 🔴 OPEN |
| T038-12 | NavigationShell: implementation | B | 3 | 🔴 OPEN |
| T038-13 | NavigationShell: integration | B | 1 | 🔴 OPEN |
| T038-14 | Container queries migration | B | 3 | 🔴 OPEN |
| T038-15 | Safe area + Safari fixes | B | 3 | 🔴 OPEN |
| T038-16 | Responsive typography | B | 2 | 🔴 OPEN |
| | | | **13** | |
| T038-17 | Animation standards | C | 2 | 🔴 OPEN |
| T038-18 | Reduced motion audit | C | 2 | 🔴 OPEN |
| T038-19 | Player transition | C | 4 | 🔴 OPEN |
| T038-20 | Telegram haptics | C | 1 | 🔴 OPEN |
| | | | **9** | (Note: plan says 12, corrected to 9) |
| T038-21 | Typography pass | D | 2 | 🔴 OPEN |
| T038-22 | Elevation system | D | 2 | 🔴 OPEN |
| T038-23 | Color tokens | D | 2 | 🔴 OPEN |
| T038-24 | Icon consistency | D | 1 | 🔴 OPEN |
| T038-25 | Storybook: 20+ stories | D | 2 | 🔴 OPEN |
| T038-26 | LazyImage audit | D | 1 | 🔴 OPEN |
| T038-27 | Lighthouse baseline | D | 1 | 🔴 OPEN |
| T038-28 | Final review + docs | D | 1 | 🔴 OPEN |
| | | | **12** | |
| **Итого** | | | **49 SP** | |

---

## Порядок выполнения

```
Phase A (параллельно):
  T038-01 → T038-02 → T038-03
  T038-04 → T038-05
  T038-06 → T038-07 → T038-08
  T038-09
  T038-10

Phase B (после A):
  T038-11 → T038-12 → T038-13
  T038-14
  T038-15
  T038-16

Phase C (после A, T038-10):
  T038-17
  T038-18
  T038-19 (зависит от T038-17, T038-18)
  T038-20

Phase D (после C):
  T038-21 → T038-22 → T038-23 → T038-24
  T038-25 (после всех)
  T038-26
  T038-27 (после всех)
  T038-28 (последняя)
```

---

<div align="center">

[← Sprint 038 Plan](./SPRINT-038-PLAN.md) · [↑ К индексу](../DOCUMENTATION_INDEX.md) · [Spec 038 →](../specs/038-design-ux-audit/spec.md)

<sub>Создано: 29.06.2026 · Статус: 📋 Tasks</sub>

</div>