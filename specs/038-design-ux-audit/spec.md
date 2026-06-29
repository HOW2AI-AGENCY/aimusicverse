# Spec 038: Комплексный аудит дизайна и UX — Спецификация доработок

**Инициирован:** 2026-06-29
**Статус:** 📋 Specification
**Связанные спринты:** Sprint 038
**Автор:** Claude (аудит 5 параллельных агентов)

---

## Оглавление

1. [Executive Summary](#1-executive-summary)
2. [Обнаруженные проблемы](#2-обнаруженные-проблемы)
3. [Спецификация улучшений](#3-спецификация-улучшений)
4. [User Journey Optimization](#4-user-journey-оптимизация)
5. [Система анимаций и микро-взаимодействий](#5-система-анимаций-и-микро-взаимодействий)
6. [Адаптивность и Responsive Design](#6-адаптивность-и-responsive-design)
7. [Design System Consistency](#7-design-system-консистентность)
8. [План реализации](#8-план-реализации)
9. [Критерии приёмки](#9-критерии-приёмки)

---

## 1. Executive Summary

Проведён полный аудит 1003+ компонентов, 16+ страниц, 330+ хуков, 246+ Edge Functions. MusicVerse AI — функционально богатое приложение в экосистеме Telegram Mini App с впечатляющим набором возможностей: генерация AI-музыки (Suno v5), студия стемов, AI-тексты, библиотека, плеер, сообщество.

**Ключевые цифры аудита:**

| Категория | Количество |
|-----------|-----------|
| Страниц | 16 |
| Компонентов (.tsx) | 1003 |
| UI-компонентов | 80+ |
| Хуков | 330 |
| Edge Functions | 246+ |
| Тестов | 341 |
| Storybook stories | 10+ |
| State machines (FSM) | 4 |
| Z-index слоёв | 12 семантических |

**Общий вердикт:** Приложение имеет мощную технологическую базу, но дизайн-система фрагментирована, пользовательские пути не оптимизированы, анимации избыточны на слабых устройствах, адаптивность непоследовательна.

---

## 2. Обнаруженные проблемы

### 2.1 Критические (Severity: HIGH)

#### H1. Фрагментированные Empty States
- **Проблема:** 3 разных компонента (`EmptyState.tsx`, `empty-state.tsx`, `unified-empty-state.tsx`) с разными API и стилями
- **Файлы:** `src/components/ui/empty-state.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/ui/unified-empty-state.tsx`
- **Влияние:** Разный UX на разных экранах; нарушение brand consistency

#### H2. Дублированные Loading States
- **Проблема:** 4+ варианта лоадеров (`LoadingSpinner.tsx`, `LoadingOverlay.tsx`, `Shimmer.tsx`, `ContentSkeleton.tsx`, `skeleton-loader.tsx`, `skeleton-components.tsx`, `skeleton.tsx`)
- **Влияние:** Пользователь видит разные паттерны загрузки; cognitive load

#### H3. Отсутствие Onboarding Flow для новых пользователей
- **Проблема:** 2 независимых onboarding-компонента (`Onboarding.tsx`, `OnboardingSlider.tsx`) без реальной интеграции в первый запуск
- **Влияние:** Новые пользователи не понимают возможности; высокий отток

#### H4. Player UX: разорванный опыт на мобильных
- **Проблема:** Mini-player, full-player, и queue — три разрозненных опыта. Переход между ними не плавный
- **Файлы:** `src/components/player/MiniPlayer.tsx`, `src/components/player/FullScreenPlayer.tsx`, `src/components/player/PlayerQueue.tsx`
- **Влияние:** Путаница навигации; пользователь теряет контекст

#### H5. Навигация: несоответствие Desktop ↔ Mobile
- **Проблема:** Desktop использует сайдбар (`DesktopLibrarySidebar.tsx`), мобильные — bottom tabs. Но переход не seamless: на планшетах (768-1024px) часто ломается layout
- **Влияние:** Планшетный UX сломан; hybrid-устройства страдают

### 2.2 Значительные (Severity: MEDIUM)

#### M1. Избыточные анимации на слабых устройствах
- **Проблема:** Framer Motion анимации не всегда проверяют `prefers-reduced-motion` или производительность устройства
- **Влияние:** Lag на low-end Android (основная аудитория Telegram)

#### M2. Непоследовательная тиографика
- **Проблема:** DM Sans и Space Grotesk используются непоследовательно. Где-то системный fallback, где-то нет
- **Влияние:** Визуальная несогласованность

#### M3. Z-index конфликты
- **Проблема:** 12 семантических слоёв определены (`docs/Z_INDEX_HIERARCHY.md`), но не все компоненты их соблюдают
- **Влияние:** Модальные окна перекрываются тостами, drawer уходит под контент

#### M4. Touch targets меньше 44px
- **Проблема:** Часть интерактивных элементов имеют размер <44px — нарушение WCAG 2.5.5 и рекомендаций Apple HIG
- **Влияние:** Miss-tap на мобильных; accessibility violation

#### M5. Неоптимизированные изображения
- **Проблема:** `LazyImage.tsx` есть, но не все места используют. Много где img без `loading="lazy"`, без srcset
- **Влияние:** Медленная загрузка на мобильных сетях

### 2.3 Косметические (Severity: LOW)

#### L1. Неиспользуемые импорты и dead code в UI
- **Проблема:** `tsconfig.strict.json` показывает 500+ ошибок (постепенно фиксится)
- **Влияние:** Bundle size

#### L2. Сторибук покрытие: 10 stories на 80+ UI-компонентов
- **Проблема:** Многие компоненты не задокументированы в Storybook
- **Влияние:** Разработчики не знают о существующих компонентах → дублирование

#### L3. Safari iOS специфичные баги
- **Проблема:** `100vh` не работает в Safari из-за bottom bar; используется `--vh` фикс, но не везде
- **Файлы:** Фикс в `src/index.css`, но не все компоненты используют

---

## 3. Спецификация улучшений

### 3.1 Унификация компонентов (Phase 1)

#### S1. Unified Empty State
**Спецификация:** Один компонент `<EmptyState>` с вариантами:

```tsx
interface EmptyStateProps {
  variant: "default" | "search" | "library" | "generations" | "projects" | "artists" | "playlists";
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: "primary" | "secondary" };
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";  // Для встраивания в card vs полноэкранный
  className?: string;
}
```

**Миграция:** Удалить `empty-state.tsx` и `unified-empty-state.tsx`. Переименовать текущий `EmptyState.tsx` в `EmptyStateLegacy.tsx`, заменить все usage (оценить: ~15-20 мест) на новый unified компонент.

#### S2. Unified Loading Pattern
**Спецификация:** Иерархия загрузки:

```
<SkeletonPage />          — Полностраничный skeleton (новые страницы)
  <ContentSkeleton />     — Секционный skeleton (карточки)
    <Shimmer />           — Inline shimmer (текст/аватар)
<LoadingSpinner />        — Центрированный спиннер (fallback)
<LoadingOverlay />        — Overlay с спиннером (блокирующие операции)
```

**Миграция:** Удалить `skeleton-loader.tsx`, `skeleton-components.tsx`, `skeleton.tsx` (дубликаты). Оставить `ContentSkeleton.tsx` как базовый.

#### S3. Unified Onboarding
**Спецификация:** Один flow:

1. **Splash** (существующий `UnifiedSplashScreen`) → 
2. **Welcome Card** (1 экран: логотип + слоган + CTA) →
3. **Feature Tour** (3 шага: Generate → Studio → Community, not 8) →
4. **Profile Setup** (аватар + имя) →
5. **Done** → Library

**Реализация:** Объединить `Onboarding.tsx` и `OnboardingSlider.tsx` в `OnboardingFlow.tsx`. Хранить state в localStorage. Показывать только при первом логине.

### 3.2 Player Experience Redesign (Phase 2)

**Спецификация:** Shared element transition между Mini Player и Full Player.

```
Mini Player (bottom bar)
  ↓ spring animation (shared layoutId)
Full Player (expandable sheet)
  ↓ swipe down to dismiss
Mini Player (bottom bar)
```

- Использовать `layoutId` из Framer Motion для shared element перехода
- Full Player — это `Sheet` (vaul) на мобильных, `Dialog` на desktop
- Queue — правая панель в Full Player (не отдельный экран)
- Waveform — общий для mini и full (масштабируется)

### 3.3 Navigation Consistency (Phase 2)

**Спецификация:** Адаптивная навигация:

| Breakpoint | Паттерн |
|-----------|---------|
| < 768px (mobile) | Bottom tabs (5 иконок: Home, Library, Studio, Generate, Profile) |
| 768-1024px (tablet) | Collapsible sidebar + bottom tabs |
| ≥ 1024px (desktop) | Fixed sidebar |

**Реализация:**
- Унифицировать `DesktopLibrarySidebar.tsx` и мобильную навигацию через один `NavigationShell`
- Использовать CSS Container Queries для планшетов (не media queries)
- Активный tab подсвечивается с анимированным индикатором

---

## 4. User Journey Оптимизация

### 4.1 Первый запуск (New User)

```
App Open → SplashScreen (800ms, GPU анимация)
  → Welcome Card ("Create music with AI")
    → Feature Tour (3 шага)
      → Profile Setup
        → Library (пустая, с Empty State)
          → CTA: "Create your first track" → Generate Form
```

**Ключевые метрики:**
- Time to First Track (TTFT): целевое < 2 минуты
- Onboarding completion rate: целевое > 80%
- Drop-off points: отслеживать через аналитику (Sentry + кастомные события)

### 4.2 Генерация трека (Core Flow)

```
Library → FAB "Generate" (плавающая кнопка)
  → Generate Form (компактный UI, Sprint 012)
    → Progress Tracker (реальное время, polling)
      → Generation Results Sheet
        → Play / Save to Library / Generate Stems
```

**Улучшения:**
- FAB (Floating Action Button) всегда доступен из любого экрана
- Progress Tracker показывает время ожидания (среднее 30-45 сек)
- Results Sheet — bottom sheet на мобильных, side panel на desktop
- После генерации — микро-анимация confetti для эмоциональной отдачи

### 4.3 Прослушивание (Engagement Flow)

```
Library → Tap Track → Mini Player (play)
  → Expand → Full Player
    → Like / Comment / Share (встроенный sharing)
    → Add to Playlist
    → Create Stems
```

**Улучшения:**
- Swipe gesture на Mini Player для переключения треков
- Haptic feedback при like/save (Telegram HapticFeedback API)
- Share sheet с preview-карточкой (OGP image трека)

### 4.4 Возврат пользователя (Retention Flow)

```
Push Notification / Telegram Message
  → Deep Link → Конкретный экран
    → Back navigation сохраняет контекст
```

**Улучшения:**
- Deep linking: `t.me/AIMusicVerseBot/app?startapp=track_123`
- История навигации сохраняется в sessionStorage
- "Continue where you left off" — последний открытый трек/проект

---

## 5. Система анимаций и микро-взаимодействий

### 5.1 Принципы

1. **Performance-first:** Проверять `prefers-reduced-motion` ДО анимации
2. **Duration tiers:** instant (0ms) → fast (100ms) → base (200ms) → slow (300ms) → spring (500ms)
3. **GPU-only:** Только `transform` и `opacity` для анимаций (избегать `height`, `width`, `top`, `left`)
4. **Stagger children:** Списки анимируются с stagger < 50ms на элемент
5. **Exit animations:** `AnimatePresence` для всех модальных окон и уведомлений

### 5.2 Animation Catalog (стандартизировать)

| Use Case | Variant | Duration | Easing |
|----------|---------|----------|--------|
| Page enter | `fadeSlideUp` | 200ms | ease-out |
| Page exit | `fadeOut` | 150ms | ease-in |
| Modal open | `scaleIn` + `fadeIn` | 200ms | spring(500,25) |
| Modal close | `scaleOut` + `fadeOut` | 150ms | ease-in |
| List item enter | `fadeSlideUp` + stagger(30ms) | 200ms | ease-out |
| Toast enter | `slideInFromRight` | 200ms | spring |
| Toast exit | `slideOutToRight` | 150ms | ease-in |
| Button hover | `scale(1.02)` | 100ms | ease |
| Button tap | `scale(0.97)` | 50ms | ease |
| Card hover | `y: -2px` + shadow | 200ms | ease |
| Skeleton loading | `shimmer` (CSS gradient) | ∞ | linear |
| Pull-to-refresh | `spring` (gesture-based) | gesture | spring |

### 5.3 Reduced Motion

Все компоненты должны оборачивать анимации в проверку:

```tsx
const prefersReduced = useReducedMotion();
const animate = prefersReduced ? {} : { opacity: 1, y: 0 };
```

### 5.4 Telegram-специфичные взаимодействия

- **MainButton:** Анимированное появление/скрытие при смене экрана (slideUp)
- **BackButton:** Всегда доступен на вложенных экранах (не только модальных)
- **HapticFeedback:** `impact("light")` при переключении табов, `impact("medium")` при like/save, `notification("success")` при завершении генерации
- **Viewport:** Отслеживать `viewportChanged` события для keyboard avoidance
- **SwipeBack:** Жест назад работает на всех экранах (не только модальных)

---

## 6. Адаптивность и Responsive Design

### 6.1 Breakpoint стратегия

```
xs:   375px   — Small phones (iPhone SE, older Android)
sm:   640px   — Large phones
md:   768px   — Tablets portrait
lg:   1024px  — Tablets landscape / Small desktop
xl:   1280px  — Desktop
2xl:  1536px  — Large desktop
3xl:  1920px  — P3 / Ultra-wide
4xl:  2560px  — 4K
```

**Приоритет:** Mobile-first с прогрессивным улучшением для desktop.

### 6.2 Контейнерные запросы (Container Queries)

Заменить медиа-запросы на container queries для переиспользуемых компонентов:

```css
.card-grid {
  container-type: inline-size;
}
@container (min-width: 400px) {
  .card { grid-template-columns: repeat(2, 1fr); }
}
@container (min-width: 600px) {
  .card { grid-template-columns: repeat(3, 1fr); }
}
```

### 6.3 Touch Targets (WCAG 2.5.5)

**Правило:** Все интерактивные элементы ≥ 44×44px (Apple HIG) / 48×48px (Material Design).

- Аудит: найти все элементы < 44px через `eslint-plugin-jsx-a11y` правило
- `TouchTarget` wrapper с `min-w-[44px] min-h-[44px]`
- `FloatingMainButton` уже 56px — OK
- `IconButton` должен быть минимум 44px

### 6.4 Safe Area (iOS notch)

- Использовать `env(safe-area-inset-*)` на всех экранах
- `SafeAreaTop`, `SafeAreaBottom` компоненты — применять глобально
- `--keyboard-height` CSS переменная для клавиатурного avoidance
- `.keyboard-open` класс на body для адаптации layout

### 6.5 Telegram Mini App специфика

- **Viewport:** Использовать `expand()` при старте для full-height
- **HeaderColor:** `setHeaderColor("bg_color")` для seamless интеграции
- **BottomBar:** Зарезервировать место под нативный таб-бар Telegram
- **SwipeBehavior:** Не блокировать нативный swipe-back Telegram (не перехватывать горизонтальные жесты на краях)

---

## 7. Design System Консистентность

### 7.1 Цветовая система

**Аудит:** HSL Custom Properties в `src/index.css` — правильный подход. Проблема в непоследовательном использовании.

**Исправления:**
- Запретить hex-литералы (`bg-[#ff0000]`) через ESLint правило (уже есть)
- Добавить `--accent` цвет (промежуточный между primary и secondary)
- Добавить `--surface-elevated` для карточек (на 1 уровень выше фона)
- Стандартизировать opacity токены: `--opacity-hover: 0.8`, `--opacity-disabled: 0.5`, `--opacity-overlay: 0.6`

### 7.2 Типографика

**Аудит:** DM Sans (body) + Space Grotesk (headings). Непоследовательное применение.

**Исправления:**
- Зафиксировать семантические классы в Tailwind:
  - `.text-display` — крупные заголовки (Space Grotesk, 2xl-4xl)
  - `.text-heading` — секционные заголовки (Space Grotesk, xl-2xl)
  - `.text-body` — основной текст (DM Sans, base)
  - `.text-caption` — подписи (DM Sans, sm)
  - `.text-overline` — overline/label (DM Sans, xs, uppercase, tracking-wider)
- Responsive типографика через `clamp()`:
  ```css
  .text-responsive-xl { font-size: clamp(1.5rem, 3vw, 2.5rem); }
  .text-responsive-base { font-size: clamp(0.875rem, 1.5vw, 1rem); }
  ```

### 7.3 Elevation / Глубина

**Спецификация:** Система elevation через тени и blur:

| Уровень | Тень | Использование |
|---------|------|---------------|
| 0 | none | Базовый контент |
| 1 | `0 1px 3px rgba(0,0,0,0.1)` | Карточки |
| 2 | `0 4px 12px rgba(0,0,0,0.12)` | App bar, FAB |
| 3 | `0 8px 24px rgba(0,0,0,0.16)` | Модальные окна, Sheets |
| 4 | `0 16px 48px rgba(0,0,0,0.2)` | Toast, Tooltip |

**Glassmorphism:** `backdrop-blur-md bg-background/80` для overlays.

### 7.4 Иконография

**Консистентность:** Использовать ТОЛЬКО `lucide-react` (через `@/lib/icons`). Никаких инлайн-SVG или emoji как иконок.

**Размеры иконок:**
- `16px` — inline (в тексте)
- `20px` — кнопки, чипсы
- `24px` — навигация, стандартные
- `32px` — крупные (герои, empty states)

---

## 8. План реализации

### Sprint 038-A: Foundation (5 дней, 15 SP)

| ID | Задача | SP | Зависимости |
|----|--------|-----|-------------|
| 038-01 | Unified EmptyState component | 3 | — |
| 038-02 | Unified Loading patterns (skeleton cleanup) | 3 | — |
| 038-03 | Unified Onboarding flow | 5 | — |
| 038-04 | Touch target audit & fix (≥44px) | 2 | — |
| 038-05 | Z-index audit & fix | 2 | — |

**Критерии:** Empty/loading/onboarding унифицированы. 0 touch targets <44px. 0 z-index конфликтов.

### Sprint 038-B: Navigation & Responsive (5 дней, 13 SP)

| ID | Задача | SP | Зависимости |
|----|--------|-----|-------------|
| 038-06 | Adaptive navigation shell (mobile/tablet/desktop) | 5 | 038-04 |
| 038-07 | Container queries migration (card grids) | 3 | — |
| 038-08 | Safe area global audit & fix | 2 | — |
| 038-09 | Safari 100vh fix audit | 1 | — |
| 038-10 | Responsive typography (clamp) | 2 | — |

**Критерии:** Навигация адаптивна на всех breakpoints. Container queries применены к 5+ компонентам. Safe area работает на всех экранах.

### Sprint 038-C: Animation & Polish (5 дней, 12 SP)

| ID | Задача | SP | Зависимости |
|----|--------|-----|-------------|
| 038-11 | Animation standards enforcement (duration tiers) | 3 | 038-05 |
| 038-12 | Reduced motion: audit & add to all components | 3 | — |
| 038-13 | Player shared element transition (mini → full) | 5 | — |
| 038-14 | Telegram haptics integration (key interactions) | 1 | — |

**Критерии:** Все анимации используют стандартные duration/easing. Reduced motion работает везде. Player transition плавный.

### Sprint 038-D: Visual Polish (5 дней, 14 SP)

| ID | Задача | SP | Зависимости |
|----|--------|-----|-------------|
| 038-15 | Typography consistency pass | 2 | — |
| 038-16 | Elevation system standardization | 2 | 038-05 |
| 038-17 | Color token audit & enforce | 3 | — |
| 038-18 | Icon consistency pass | 2 | — |
| 038-19 | Storybook: 20+ stories for UI components | 3 | — |
| 038-20 | LazyImage audit: ensure all images use it | 2 | — |

**Критерии:** Типографика консистентна. Elevation system работает. Все иконки через lucide. 30+ stories в Storybook.

---

## 9. Критерии приёмки

### 9.1 Функциональные

- [ ] Все 3 Empty State компонента заменены на 1 unified
- [ ] 4+ Skeleton компонента заменены на 2 (ContentSkeleton + Shimmer)
- [ ] Onboarding запускается при первом логине (3 шага, не 8)
- [ ] 100% touch targets ≥ 44px (проверено automated audit)
- [ ] 0 z-index конфликтов (модальные окна, тосты, drawer)
- [ ] Player transition mini→full плавный (shared element, < 300ms)
- [ ] Навигация адаптивна на mobile/tablet/desktop

### 9.2 Визуальные

- [ ] Типографика использует 5 семантических классов (display/heading/body/caption/overline)
- [ ] Цвета используют HSL custom properties (0 hex-литералов в className)
- [ ] Elevation соответствует 4-уровневой системе
- [ ] Все иконки — lucide через `@/lib/icons`
- [ ] Glassmorphism последователен (backdrop-blur-md bg-background/80)

### 9.3 Accessibility

- [ ] Все анимации проверяют prefers-reduced-motion
- [ ] Все интерактивные элементы ≥ 44px
- [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Focus visible на всех интерактивных элементах
- [ ] Screen reader: aria-label на иконках без текста

### 9.4 Performance

- [ ] Lighthouse Performance ≥ 80 (мобильные)
- [ ] FCP < 2.5s, LCP < 4s, TBT < 300ms
- [ ] Bundle size не увеличился > 5% от текущего (950KB gzip limit)
- [ ] Анимации используют GPU-ускоренные свойства (transform, opacity)

### 9.5 Документация

- [ ] Storybook: 30+ stories (было 10)
- [ ] DESIGN_TOKENS.md обновлён
- [ ] CLAUDE.md обновлён с правилами анимаций и touch targets
- [ ] CHANGELOG.md обновлён

---

<div align="center">

[← Sprint 037](../SPRINTS/SPRINT-037-PLAN.md) · [↑ К индексу](../DOCUMENTATION_INDEX.md) · [Sprint 038 Plan →](../SPRINTS/SPRINT-038-PLAN.md)

<sub>Создано: 29.06.2026 · Статус: 📋 Specification</sub>

</div>