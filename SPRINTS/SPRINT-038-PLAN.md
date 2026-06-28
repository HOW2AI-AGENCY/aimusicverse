# Sprint 038: Design System Unification & UX Optimization (Q3 2026)

**Длительность:** 20 дней (4 фазы по 5 дней)
**Спецификация:** [Spec 038 — Комплексный аудит дизайна и UX](../specs/038-design-ux-audit/spec.md)
**Цель:** Устранить фрагментацию дизайн-системы, оптимизировать user journeys, внедрить продвинутые анимации и адаптивность

---

## Сводка

| Фаза | Дни | Задач | SP | Бюджет |
|------|-----|-------|-----|--------|
| A: Foundation | 1-5 | 5 | 15 | ~40h |
| B: Navigation & Responsive | 6-10 | 5 | 13 | ~35h |
| C: Animation & Polish | 11-15 | 4 | 12 | ~32h |
| D: Visual Polish | 16-20 | 6 | 14 | ~38h |
| **Итого** | **20** | **20** | **54** | **~145h** |

---

## Pre-flight Checklist

- [x] Spec 038 утверждён (`specs/038-design-ux-audit/spec.md`)
- [x] Аудит завершён (5 параллельных агентов, 1003+ компонентов)
- [x] Sprint 037 закрыт
- [ ] Storybook запущен (`npm run storybook`)
- [ ] Lighthouse baseline снят
- [ ] Bundle analyzer доступен (`npm run analyze`)

---

## Фаза A: Foundation (Дни 1-5, 15 SP)

### Цель
Унифицировать базовые UI-паттерны: empty/loading/onboarding. Устранить критические accessibility-нарушения (touch targets, z-index).

### Задачи

| ID | Название | Статус | SP | Зависимости | Файлы |
|----|----------|--------|-----|-------------|-------|
| 038-01 | **Unified EmptyState component** | 🔴 OPEN | 3 | — | `src/components/ui/EmptyState.tsx` |
| 038-02 | **Unified Loading patterns** | 🔴 OPEN | 3 | — | `src/components/ui/ContentSkeleton.tsx` |
| 038-03 | **Unified Onboarding flow** | 🔴 OPEN | 5 | — | `src/pages/Onboarding.tsx` |
| 038-04 | **Touch target audit & fix** (≥44px) | 🔴 OPEN | 2 | — | `src/components/ui/touch-target.tsx` |
| 038-05 | **Z-index audit & fix** | 🔴 OPEN | 2 | — | `docs/Z_INDEX_HIERARCHY.md` |

### 038-01: Unified EmptyState

**Текущее состояние:** 3 компонента:
- `src/components/ui/EmptyState.tsx` — 6 вариантов (default, search, library, data, error, loading), использует `framer-motion`
- `src/components/ui/empty-state.tsx` — shadcn-style компонент с `icon`, `title`, `description`, `action`
- `src/components/ui/unified-empty-state.tsx` — обёртка над empty-state для консистентности

**Целевое состояние:** 1 компонент с вариантами:

```tsx
// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  variant: "default" | "search" | "library" | "generations" 
         | "projects" | "artists" | "playlists" | "error";
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: "primary" | "secondary" | "outline" };
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

**План миграции:**
1. ✅ Сохранить текущий `EmptyState.tsx` как основу (наиболее полный API)
2. Влить варианты из `empty-state.tsx` (action button, size prop)
3. Удалить `unified-empty-state.tsx` (это просто враппер)
4. Удалить `empty-state.tsx`
5. Обновить все импорты (оценить через grep: ~15-20 мест)
6. Написать EmptyState stories в Storybook (6+ вариантов)

**Критерии:**
- `grep -r "from.*empty-state" src/` → только 1 файл (`EmptyState.tsx`)
- 6+ Storybook stories для EmptyState
- Все существующие экраны показывают правильный empty state

### 038-02: Unified Loading Patterns

**Текущее состояние:** 7 файлов загрузки:
- `LoadingSpinner.tsx` — центрированный спиннер (оставить)
- `LoadingOverlay.tsx` — overlay с блюром (оставить)
- `ContentSkeleton.tsx` — секционный скелетон с вариантами (оставить как базовый)
- `Shimmer.tsx` — inline shimmer для текста/аватаров (оставить)
- `skeleton.tsx` — базовый скелетон (удалить, использовать ContentSkeleton)
- `skeleton-loader.tsx` — композитный лоадер (удалить)
- `skeleton-components.tsx` — набор скелетонов (удалить)

**Иерархия загрузки:**
```
<SkeletonPage />          — NEW: полностраничный скелетон
  <ContentSkeleton />     — секционный (варианты: card-list, table, detail)
    <Shimmer />           — inline (текст, аватар, кнопка)
<LoadingSpinner />        — fallback (центрированный)
<LoadingOverlay />        — блокирующие операции
```

**План:**
1. Создать `SkeletonPage.tsx` (page-level скелетон с header + контент)
2. Обновить `ContentSkeleton.tsx` → добавить варианты: `card-list`, `table`, `detail`, `profile`
3. Удалить `skeleton.tsx`, `skeleton-loader.tsx`, `skeleton-components.tsx`
4. Обновить импорты во всех компонентах

**Критерии:**
- `ls src/components/ui/skeleton*.tsx` → только `ContentSkeleton.tsx` (не в подпапке)
- `SkeletonPage` существует и используется в lazy-роутах
- 4+ Storybook stories для ContentSkeleton variants

### 038-03: Unified Onboarding Flow

**Текущее состояние:** 2 независимых компонента:
- `src/pages/Onboarding.tsx` — 8 шагов, feature tour
- `src/components/OnboardingSlider.tsx` — 5 шагов, другие стили

**Целевой flow (5 экранов):**
```
SplashScreen (800ms auto)
  → WelcomeCard (лого + слоган + "Get Started")
    → FeatureTour (3 шага: Generate → Studio → Community, swipeable)
      → ProfileSetup (аватар + имя, валидация)
        → Done → redirect → Library
```

**План:**
1. Создать `src/components/onboarding/OnboardingFlow.tsx` — стейт-машина
2. Перенести WelcomeCard, FeatureTour, ProfileSetup из существующих компонентов
3. Сохранить state в `localStorage` (`onboarding_completed: true`)
4. Интегрировать Telegram MainButton на каждом шаге
5. Удалить `Onboarding.tsx` (page) и `OnboardingSlider.tsx`
6. Добавить условие в роутер: если `!onboarding_completed` → показывать OnboardingFlow

**Критерии:**
- Новый пользователь видит onboarding при первом логине
- Существующий пользователь НЕ видит onboarding повторно
- Onboarding можно сбросить через Settings → "Reset onboarding"
- 5 экранов, не 8

### 038-04: Touch Target Audit

**Правило:** Все интерактивные элементы ≥ 44×44px (WCAG 2.5.5 AAA — 44px, Material Design — 48px).

**План:**
1. Добавить ESLint правило `jsx-a11y/interactive-supports-focus` и `jsx-a11y/click-events-have-key-events`
2. Пройти аудитом по ключевым компонентам: иконки-кнопки, чипсы, табы, close buttons
3. Добавить `TouchTarget` враппер (`min-w-[44px] min-h-[44px] flex items-center justify-center`)
4. Применить враппер к: `IconButton`, `CloseButton`, `TabButton`, `Chip`, `Checkbox`
5. Проверить через Chrome DevTools → Inspect → Computed → минимальный размер

**Критерии:**
- 0 элементов < 44×44px (проверено automated audit)
- `TouchTarget` компонент существует и используется

### 038-05: Z-Index Audit

**Текущая система** (`docs/Z_INDEX_HIERARCHY.md`):

| Слой | Z-Index | Компонент |
|------|---------|-----------|
| Base | 0 | Контент |
| Dropdown | 100 | DropdownMenu, Select |
| Sticky | 200 | Sticky header |
| Drawer | 300 | Sheet, Drawer |
| Modal | 400 | Dialog, AlertDialog |
| Popover | 500 | Popover, Tooltip |
| Toast | 600 | Sonner |
| DevOverlay | 99999 | Dev tools |

**План:**
1. Создать `src/lib/z-index.ts` с константами
2. Пройти grep по `z-` в className → заменить магические числа на константы/токены
3. Проверить визуально: модалки > drawer > sticky > контент
4. Тосты всегда поверх всего

**Критерии:**
- `grep -r "z-\[" src/` → 0 результатов (нет магических z-index)
- `grep -r "z-50\|z-40\|z-30" src/` → только в `z-index.ts` и документированных местах

---

## Фаза B: Navigation & Responsive (Дни 6-10, 13 SP)

### Задачи

| ID | Название | Статус | SP | Зависимости |
|----|----------|--------|-----|-------------|
| 038-06 | **Adaptive navigation shell** | 🔴 OPEN | 5 | 038-04 |
| 038-07 | **Container queries migration** | 🔴 OPEN | 3 | — |
| 038-08 | **Safe area global audit** | 🔴 OPEN | 2 | — |
| 038-09 | **Safari 100vh fix audit** | 🔴 OPEN | 1 | — |
| 038-10 | **Responsive typography (clamp)** | 🔴 OPEN | 2 | — |

### 038-06: Adaptive Navigation Shell

**Цель:** Единый `NavigationShell` компонент, адаптирующийся под breakpoint:

```
< 768px  → BottomTabBar (5 иконок)
768-1024 → CollapsibleSidebar + BottomTabBar
≥ 1024   → FixedSidebar
```

**План:**
1. Создать `src/components/navigation/NavigationShell.tsx`
2. Интегрировать существующие `DesktopLibrarySidebar` и мобильную навигацию
3. Использовать CSS Container Queries для определения layout
4. Анимировать переход между режимами (sidebar collapse → expand)
5. Active tab: анимированный индикатор (перемещается между табами)

**Критерии:**
- Навигация не ломается на 768-1024px
- Плавный переход между mobile/tablet/desktop
- Active tab визуально отличим

### 038-07: Container Queries

**План:**
1. Идентифицировать компоненты с `sm:`, `md:`, `lg:` grid-классами
2. Заменить медиа-запросы на container queries в 5+ компонентах:
   - CardGrid (треки, проекты, плейлисты)
   - ToolGrid (генерация, студия)
   - StatsGrid (дашборд)
3. Добавить `@container` в `tailwind.config.ts`

### 038-08, 038-09, 038-10: Safe Area + Safari + Typography

См. спецификацию — аудит и точечные правки.

---

## Фаза C: Animation & Polish (Дни 11-15, 12 SP)

### Задачи

| ID | Название | Статус | SP | Зависимости |
|----|----------|--------|-----|-------------|
| 038-11 | **Animation standards enforcement** | 🔴 OPEN | 3 | 038-05 |
| 038-12 | **Reduced motion audit** | 🔴 OPEN | 3 | — |
| 038-13 | **Player shared element transition** | 🔴 OPEN | 5 | — |
| 038-14 | **Telegram haptics integration** | 🔴 OPEN | 1 | — |

### 038-13: Player Shared Element Transition

**Спецификация:**
```
MiniPlayer (bottom bar, h-16)
  ↓ tap → spring animation
FullPlayer (expandable sheet, h-full)
  ↓ swipe down → dismiss
MiniPlayer
```

**Технический план:**
1. Использовать `layoutId` из Framer Motion для artwork (shared element)
2. FullPlayer — `Sheet` (vaul) на мобильных, `Dialog` на desktop
3. Queue — правая панель внутри FullPlayer
4. Waveform — `motion.div` с анимированной высотой

---

## Фаза D: Visual Polish (Дни 16-20, 14 SP)

### Задачи

| ID | Название | Статус | SP | Зависимости |
|----|----------|--------|-----|-------------|
| 038-15 | **Typography consistency pass** | 🔴 OPEN | 2 | — |
| 038-16 | **Elevation system standardization** | 🔴 OPEN | 2 | 038-05 |
| 038-17 | **Color token audit & enforce** | 🔴 OPEN | 3 | — |
| 038-18 | **Icon consistency pass** | 🔴 OPEN | 2 | — |
| 038-19 | **Storybook: 20+ stories** | 🔴 OPEN | 3 | — |
| 038-20 | **LazyImage audit** | 🔴 OPEN | 2 | — |

### 038-15: Typography

**Семантические классы (добавить в `src/index.css`):**
```css
.text-display   { font-family: 'Space Grotesk'; font-size: clamp(2rem, 5vw, 3.5rem); }
.text-heading   { font-family: 'Space Grotesk'; font-size: clamp(1.25rem, 3vw, 2rem); }
.text-body      { font-family: 'DM Sans'; font-size: 1rem; }
.text-caption   { font-family: 'DM Sans'; font-size: 0.875rem; }
.text-overline  { font-family: 'DM Sans'; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
```

### 038-16: Elevation System

**CSS-утилиты (добавить в `src/index.css`):**
```css
.elevation-0 { box-shadow: none; }
.elevation-1 { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.elevation-2 { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.elevation-3 { box-shadow: 0 8px 24px rgba(0,0,0,0.16); }
.elevation-4 { box-shadow: 0 16px 48px rgba(0,0,0,0.2); }
```

---

## Критерии успеха Sprint 038

### Phase A (Foundation)
- [ ] 3 EmptyState → 1 unified компонент, удалены дубликаты
- [ ] 7 Skeleton → 4 (SkeletonPage, ContentSkeleton, Shimmer, LoadingOverlay)
- [ ] Onboarding запускается при первом логине (3 шага)
- [ ] 100% touch targets ≥ 44px (проверено аудитом)
- [ ] 0 z-index конфликтов (магические числа удалены)

### Phase B (Navigation & Responsive)
- [ ] NavigationShell адаптивен на mobile (<768), tablet (768-1024), desktop (≥1024)
- [ ] 5+ компонентов используют container queries
- [ ] Safe area работает глобально (`env(safe-area-inset-*)`)
- [ ] `100vh` → `--vh` во всех компонентах
- [ ] Responsive typography (clamp) применена к заголовкам

### Phase C (Animation & Polish)
- [ ] Все анимации используют стандартные duration/easing (из `motion-presets.ts`)
- [ ] Reduced motion: `useReducedMotion()` во всех анимированных компонентах
- [ ] Player transition mini→full плавный (< 300ms, shared layoutId)
- [ ] Haptic feedback: like, save, tab switch, generation complete

### Phase D (Visual Polish)
- [ ] 5 семантических типографических классов
- [ ] Elevation system (4 уровня) + glassmorphism
- [ ] 0 hex-литералов в className (проверено ESLint)
- [ ] Все иконки через lucide → `@/lib/icons`
- [ ] 30+ Storybook stories (было 10)
- [ ] Все изображения через `LazyImage`

---

## Риски и митигации

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| EmptyState миграция сломает экраны | Средняя | Высокое | Сначала добавить новый API, заменить usage по одному, удалить старые в конце |
| Onboarding flow конфликтует с Telegram WebApp | Средняя | Высокое | Тестировать в реальном Telegram WebApp окружении |
| Container queries не поддерживаются старыми Safari | Низкая | Среднее | Добавить fallback media queries |
| Player shared element transition — сложно отладить | Высокая | Среднее | Выделить в отдельную задачу, тестировать на реальных устройствах |
| Touch target увеличение ломает layout | Средняя | Среднее | Использовать negative margin / padding technique |
| Z-index изменение создаст визуальные баги | Средняя | Высокое | Визуальный smoke-тест после каждого изменения |

---

## Зависимости между спринтами

```
Sprint 037 (завершён)
  └─→ Sprint 038-A (Foundation)
        └─→ Sprint 038-B (Navigation)
        └─→ Sprint 038-C (Animation) ← зависит от 038-05 (z-index)
              └─→ Sprint 038-D (Visual Polish)
```

---

## Definition of Done (общий для всех фаз)

- [ ] Код проходит `npm run check-all` (lint + format + typecheck + test)
- [ ] Все существующие тесты проходят (341+)
- [ ] Новые тесты для новых компонентов
- [ ] Storybook stories для всех новых/изменённых компонентов
- [ ] Визуально проверено в Chrome DevTools Mobile View (375px, 768px, 1024px, 1440px)
- [ ] CHANGELOG.md обновлён
- [ ] CLAUDE.md обновлён с новыми правилами

---

<div align="center">

[← Sprint 037](./SPRINT-037-PLAN.md) · [↑ К индексу](../DOCUMENTATION_INDEX.md) · [Spec 038 →](../specs/038-design-ux-audit/spec.md)

<sub>Создано: 29.06.2026 · Статус: 📋 Plan</sub>

</div>