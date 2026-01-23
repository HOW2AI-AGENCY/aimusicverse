
# План улучшения интерфейса и пользовательского опыта

## Обзор текущего состояния

### Аналитика (16-23 января 2026)
- **800 посетителей** со средней сессией 7.3 мин
- **Bounce rate снизился с 82% до 17%** за неделю — отличный прогресс
- **43% мобильных пользователей** — критически важно для Telegram Mini App
- **Топ-5 страниц**: Главная (12%), Библиотека (4.4%), Авторизация (2%), Проекты (1.8%), Генерация (1.7%)

### Текущие проблемы
1. **Bundle size >150KB** (цель) — текущий vendor-other ~184KB
2. **Несогласованность визуальных стилей** между компонентами
3. **Русский текст не помещается** на некоторых мобильных экранах
4. **Z-index проблемы с бейджами** — частично исправлено
5. **Тяжёлые анимации** на слабых устройствах

---

## Фаза 1: Критические оптимизации производительности

### 1.1 Bundle Size Reduction (Приоритет: ВЫСОКИЙ)

**Текущее состояние:**
- vendor-other: 184.28 KB (цель: <150 KB)
- Уже проделано: dayjs вместо date-fns, lazy loading

**Действия:**
```
1. Анализ bundle с помощью rollup-plugin-visualizer
2. Lazy loading для тяжёлых компонентов:
   - Recharts → динамический импорт только на странице Analytics
   - opensheetmusicdisplay → только в MIDI viewer
   - wavesurfer.js → только при открытии полноэкранного плеера
3. Tree-shaking проверка:
   - Убедиться что @/lib/motion импортирует только нужное
   - Проверить lucide-react на tree-shaking
4. Код-сплитинг по роутам (уже частично сделано)
```

**Файлы для изменения:**
- `vite.config.ts` — добавить chunk splitting
- `src/lib/lazy-charts.ts` — создать lazy wrapper для Recharts
- Компоненты с тяжёлыми зависимостями

### 1.2 Критические CSS оптимизации

**Действия:**
```
1. Удалить неиспользуемые CSS классы
2. Оптимизировать @font-face загрузку (уже в process)
3. Purge unused Tailwind classes в production
4. Critical CSS инлайнинг для FCP
```

**Файлы:**
- `tailwind.config.ts` — safelist только нужных классов
- `index.html` — проверить preload/prefetch

---

## Фаза 2: Mobile-First UX Improvements

### 2.1 Адаптивный текст для русского языка (Приоритет: ВЫСОКИЙ)

**Проблема:** Русский текст длиннее английского на 15-30%, что ломает макеты.

**Решение:**
```css
/* Уже добавлено, но нужно расширить применение */
.text-balance { text-wrap: balance; }
.break-words-safe { 
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
```

**Компоненты для обновления:**
- `src/components/home/QuickStartCards.tsx` — уменьшить описания
- `src/components/gamification/GamificationBar.tsx` — responsive text
- `src/components/generate-form/` — все лейблы форм
- `src/components/BottomNavigation.tsx` — навигационные лейблы

### 2.2 Улучшение Touch Targets

**Стандарт:** Минимум 44x44px для всех интерактивных элементов

**Проверка и исправление:**
```
1. Все кнопки в плеере: ✓ (уже 44px)
2. Навигационные элементы: ✓ (min-h-touch)
3. Карточки треков — проверить actions
4. Формы — увеличить tap targets для inputs
5. Модальные окна — кнопки закрытия
```

**Файлы для аудита:**
- `src/components/track/track-card-new/variants/*.tsx`
- `src/components/generate-form/*.tsx`
- `src/components/player/*.tsx`

### 2.3 Telegram Safe Area Integration

**Текущее состояние:** Хорошая реализация в `src/constants/safe-area.ts`

**Улучшения:**
```
1. Проверить все Drawer/Sheet компоненты на safe-area
2. Убедиться что клавиатура не перекрывает inputs (iOS)
3. Проверить Bottom Navigation на всех iPhone моделях
4. Добавить env(safe-area-inset-*) fallbacks везде
```

---

## Фаза 3: Visual Design System Improvements

### 3.1 Typography System (Приоритет: СРЕДНИЙ)

**Текущие проблемы:**
- Несогласованные размеры шрифтов между компонентами
- Разный line-height в разных местах

**Решение — Создать Design Tokens:**
```typescript
// src/lib/design-tokens.ts
export const typography = {
  heading: {
    h1: 'text-2xl sm:text-3xl font-bold leading-tight',
    h2: 'text-xl sm:text-2xl font-semibold leading-snug',
    h3: 'text-lg sm:text-xl font-semibold leading-snug',
    h4: 'text-base sm:text-lg font-medium leading-normal',
  },
  body: {
    lg: 'text-base sm:text-lg leading-relaxed',
    md: 'text-sm sm:text-base leading-relaxed',
    sm: 'text-xs sm:text-sm leading-normal',
    xs: 'text-[11px] sm:text-xs leading-normal',
  },
  label: 'text-xs sm:text-sm font-medium text-muted-foreground',
  caption: 'text-[10px] sm:text-[11px] text-muted-foreground',
};
```

### 3.2 Spacing System (Приоритет: СРЕДНИЙ)

**Стандартизация:**
```typescript
export const spacing = {
  section: 'mb-4 sm:mb-6',      // Между секциями
  card: 'p-3 sm:p-4',           // Внутри карточек
  gap: 'gap-2 sm:gap-3',        // Между элементами
  inline: 'gap-1.5 sm:gap-2',   // Между inline элементами
};
```

### 3.3 Animation Performance (Приоритет: НИЗКИЙ)

**Уже улучшено:**
- Убраны infinite анимации с GamificationBar
- Упрощены hover эффекты в EnhancedVariant

**Дополнительно:**
```
1. Использовать CSS transitions вместо motion где возможно
2. Добавить will-change: transform для анимируемых элементов
3. Проверить prefersReducedMotion везде
4. Упростить анимации на мобильных (сократить duration)
```

---

## Фаза 4: User Journey Optimization

### 4.1 Onboarding Flow (Приоритет: ВЫСОКИЙ)

**Текущее состояние:**
- `QuickStartOverlay` для новых пользователей
- `WelcomeBonusPopup` для приветственного бонуса
- `NewUserProgress` для отслеживания прогресса

**Улучшения:**
```
1. Сократить QuickStartOverlay до 2 экранов (сейчас 3)
2. Добавить skip-to-create кнопку на первом экране
3. Показывать FirstTimeHeroCard с более чётким CTA
4. Улучшить пустые состояния в Library с CTA
```

### 4.2 First-Time User Experience

**Метрики цели:**
- Время до первого трека: <60 секунд
- Конверсия новых → генерация: >50%

**Действия:**
```
1. Auto-focus на поле ввода в GenerateSheet
2. Предзаполнение genre presets для быстрого старта
3. Показать примеры промптов в placeholder
4. Упростить форму генерации для новых пользователей
```

### 4.3 Return User Experience

**Действия:**
```
1. ContinueDraftCard уже реализован — проверить видимость
2. Показывать последний созданный трек prominent
3. Quick actions для "Создать похожий" трек
4. Streak reminder в header если streak активен
```

---

## Фаза 5: Component Architecture Cleanup

### 5.1 Унификация компонентов

**Track Card Variants:**
Сейчас 6 вариантов в UnifiedTrackCard — это правильно, но проверить:
```
1. Консистентность стилей между вариантами
2. Единый API для всех вариантов
3. Оптимизация ре-рендеров с memo
```

### 5.2 Dialog/Sheet System

**Текущее состояние:** UnifiedDialog уже реализован

**Проверить:**
```
1. Все модалы используют UnifiedDialog
2. Все sheet используют правильные safe-areas
3. Haptic feedback на open/close
```

### 5.3 Skeleton/Loading States

**Создать единый barrel export:**
```typescript
// src/components/ui/skeletons/index.ts
export { TrackCardSkeleton, TrackRowSkeleton } from './TrackListSkeleton';
export { HeroSkeleton } from './TrackListSkeleton';
export { MobileListSkeleton, MobileGridSkeleton } from '@/components/mobile/MobileSkeletons';
```

---

## Фаза 6: Documentation & Code Quality

### 6.1 Обновление документации

**Файлы для обновления:**
```
1. PROJECT_STATUS.md — добавить UI improvements
2. KNOWN_ISSUES.md — обновить статусы
3. docs/ARCHITECTURE.md — добавить Design System section
4. KNOWLEDGE_BASE.md — добавить UI patterns
```

### 6.2 Component Documentation

**Добавить JSDoc к ключевым компонентам:**
```typescript
/**
 * UnifiedTrackCard - Single unified track card with 7 variants
 * @param variant - 'grid' | 'list' | 'compact' | 'minimal' | 'professional' | 'enhanced'
 * @example
 * 
 */
```

---

## План реализации по спринтам

### Sprint A: Performance Critical (2-3 дня)
- [ ] Bundle analysis и optimization
- [ ] Lazy loading тяжёлых компонентов
- [ ] CSS optimization

### Sprint B: Mobile UX (2-3 дня)
- [ ] Адаптивный текст для русского
- [ ] Touch targets аудит
- [ ] Telegram safe area проверка

### Sprint C: Design System (2-3 дня)
- [ ] Design tokens файл
- [ ] Typography унификация
- [ ] Spacing стандартизация

### Sprint D: User Journey (1-2 дня)
- [ ] Onboarding improvements
- [ ] Empty states улучшение
- [ ] Return user experience

### Sprint E: Documentation (1 день)
- [ ] Обновление документации
- [ ] JSDoc для компонентов
- [ ] README update

---

## Метрики успеха

| Метрика | Текущее | Цель |
|---------|---------|------|
| Bundle size (vendor) | 184 KB | <150 KB |
| Bounce rate | 53% | <40% |
| Time to First Track | ? | <60 сек |
| Mobile touch targets | ~90% | 100% |
| Typography consistency | ~70% | 95% |
| WCAG AA compliance | ~85% | 95% |

---

## Технические детали реализации

### Lazy Loading Pattern
```typescript
// src/lib/lazy-charts.ts
import { lazy } from 'react';

export const LazyRecharts = lazy(() => 
  import('recharts').then(m => ({ 
    default: m.ResponsiveContainer 
  }))
);

export const LazyAreaChart = lazy(() => 
  import('recharts').then(m => ({ 
    default: m.AreaChart 
  }))
);
```

### Design Tokens Implementation
```typescript
// src/lib/design-tokens.ts
export const tokens = {
  colors: {
    generate: 'hsl(var(--generate))',
    library: 'hsl(var(--library))',
    projects: 'hsl(var(--projects))',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  animation: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
};
```

### Safe Area Validation
```typescript
// Проверка что все компоненты используют TELEGRAM_SAFE_AREA
// Файлы для аудита:
// - src/components/GenerateSheet.tsx ✓
// - src/components/MainLayout.tsx ✓
// - src/components/BottomNavigation.tsx ✓
// - src/components/player/MobileFullscreenPlayer.tsx ✓
// - src/components/home/HomeHeader.tsx ✓
```

---

## Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Breaking changes в UI | Средняя | Постепенные изменения, тестирование на preview |
| Регрессия производительности | Низкая | Lighthouse тесты после каждого изменения |
| Несовместимость с iOS Safari | Средняя | Тестирование на реальных устройствах |
| Увеличение bundle size | Низкая | Мониторинг размера при каждом PR |
