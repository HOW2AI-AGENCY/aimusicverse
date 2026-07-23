```markdown
---
name: MusicVerse AI — Glass Aurora
description: AI-powered music creation platform
design_version: 2.0 (2026-07-24)
colors:
  primary: "hsl(155 40% 50%)"
  primary-foreground: "hsl(240 33% 10%)"
  accent: "hsl(255 92% 76%)"
  accent-foreground: "hsl(240 33% 10%)"
  success: "hsl(var(--success))"
  warning: "hsl(var(--warning))"
  error: "hsl(var(--destructive))"
  surface-1: "hsl(var(--surface))"
  surface-2: "hsl(var(--elevated))"
  surface-3: "hsl(var(--floating))"
typography:
  display:
    fontFamily: "Space Grotesk, DM Sans, system-ui, sans-serif"
    fontWeight: 700
    lineHeight: 1.2
  heading:
    fontFamily: "Space Grotesk, DM Sans, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontWeight: 400
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
---
```

# Design System: MusicVerse AI — Glass Aurora

## 1. Overview

**Creative North Star: «Glass Aurora»**

MusicVerse AI использует тёмную тему по умолчанию с эстетикой glassmorphism. Глубокий фон (`#1a1a2e`), приглушённый изумрудный primary (`hsl(155 40% 50%)`) и лавандовый accent (`hsl(255 92% 76%)`) создают профессиональную атмосферу музыкальной студии.

**Key Characteristics:**

- Тёмная тема по умолчанию
- Glassmorphism как основной визуальный язык
- Приглушённая изумрудно-лавандовая палитра
- Просторный, воздушный интерфейс
- Минимум визуального шума

---

## 2. Colors

### Core Palette

| Role       | Token           | HSL                                 |
| ---------- | --------------- | ----------------------------------- |
| Background | `--background`  | `240 33% 14%` (#1a1a2e)             |
| Surface    | `--surface`     | `218 45% 18%` (#16213e)             |
| Elevated   | `--elevated`    | `220 40% 24%`                       |
| Floating   | `--floating`    | `222 45% 13%`                       |
| Primary    | `--primary`     | `155 40% 50%` (desaturated emerald) |
| Accent     | `--accent`      | `255 92% 76%` (lavender)            |
| Success    | `--success`     | `155 40% 50%`                       |
| Warning    | `--warning`     | `38 90% 60%`                        |
| Danger     | `--destructive` | `0 72% 56%`                         |

### Section-specific accents

| Section   | Token         | HSL           |
| --------- | ------------- | ------------- |
| Generate  | `--generate`  | `155 40% 50%` |
| Library   | `--library`   | `255 92% 76%` |
| Projects  | `--projects`  | `262 55% 70%` |
| Community | `--community` | `199 70% 62%` |

### Mobile Synth Hero (`--synth-*` aliases)

На мобильных устройствах home hero использует более насыщенный palette. Это алиасы к основным токенам:

| Synth token            | Maps to               | HSL            |
| ---------------------- | --------------------- | -------------- |
| `--synth-primary`      | `--brand-violet`      | `252 100% 68%` |
| `--synth-primary-deep` | `--brand-violet-deep` | `251 53% 35%`  |
| `--synth-mint`         | `--mint`              | `161 78% 51%`  |
| `--synth-bg`           | `--background`        | `240 33% 10%`  |
| `--synth-surface`      | `--card`              | `218 50% 17%`  |
| `--synth-text`         | `--foreground`        | `220 30% 96%`  |
| `--synth-text-muted`   | `--muted-foreground`  | `220 12% 70%`  |

### Named Rules

**The One Voice Rule.** Primary accent (emerald) используется на ≤10% любого экрана. Его редкость — суть.

**The Glass Hierarchy Rule.** Glassmorphism применяется по трём уровням:

- `glass.nav` — sticky-хедеры (backdrop-blur-xl, bg/90)
- `glass.card` — карточки (backdrop-blur-xl, bg-card/80)
- `glass.overlay` — модалки/диалоги (backdrop-blur-2xl, bg/95)

---

## 3. Typography

**Display Font:** Space Grotesk (fallback: DM Sans, system-ui)
**Body Font:** DM Sans (fallback: system-ui, sans-serif)
**Mono Font:** JetBrains Mono (fallback: monospace)

### Scale

| Level     | Class             | Size (mobile) | Size (desktop) | Weight |
| --------- | ----------------- | ------------- | -------------- | ------ |
| Display 1 | `.text-display-1` | 2.5rem        | 3rem           | 700    |
| Display 2 | `.text-display-2` | 2rem          | 2.5rem         | 600    |
| H1        | `.text-h1`        | 1.5rem        | 2rem           | 600    |
| H2        | `.text-h2`        | 1.25rem       | 1.75rem        | 600    |
| H3        | `.text-h3`        | 1.125rem      | 1.5rem         | 500    |
| Body      | `.text-body`      | 0.875rem      | 1rem           | 400    |
| Caption   | `.text-caption`   | 0.8125rem     | —              | 400    |
| Label     | `.text-label`     | 0.6875rem     | —              | 600    |

### Named Rules

**The Line Length Rule.** Body text: ограничен 65ch через `.prose-focus`.

---

## 4. Elevation & Glass

Glassmorphism — основной механизм elevation. Тени используются только как акцент (hover/pressed).

### Glass Presets (`glass.ts`)

```
glass.light   → bg/60 + backdrop-blur-md  (chip, badge)
glass.medium  → bg/70 + backdrop-blur-lg  (tooltip, popover)
glass.heavy   → bg/80 + backdrop-blur-xl  (sidebar)
glass.card    → card/80 + backdrop-blur-xl (card — recommended)
glass.nav     → bg/90 + backdrop-blur-xl  (sticky header)
glass.overlay → bg/95 + backdrop-blur-2xl (modal, dialog)
```

### Shadow vocabulary (rare, purposeful)

- `--shadow-elevation-1` — subtle lift (cards at rest on desktop)
- `--shadow-elevation-2` — hover state
- `--shadow-elevation-3` — dropdown, popover
- `--shadow-elevation-4` — modal backdrop

### Named Rules

**The Flat-By-Default Rule.** Поверхности плоские в покое. Тени появляются только как ответ на состояние (hover, elevation, focus). На мобильных теней нет — только glassmorphism.

---

## 5. Components

### Cards

- **Стиль:** `glass.card` — backdrop-blur-xl с bg-card/80
- **Радиус:** 16px (`rounded-2xl`)
- **Паддинг:** `p-4 sm:p-5` (через `spacingClass.card`)
- **Hover:** `glass-card:hover` — лёгкий translateY(-2px) + glow-тень (только на устройствах с курсором)
- **Pressed:** `glass-card:active` — translateY(-1px) scale(0.995)

### Buttons

- **Primary:** Emerald background, dark foreground, rounded-xl
- **Hover:** Чуть темнее emerald
- **Focus:** ring-2 ring-primary ring-offset-2

### Inputs

- **Стиль:** bg-surface border-border, rounded-xl, px-4 py-3
- **Focus:** ring-2 ring-primary/60, border-primary/50

### Navigation

- **Desktop:** Collapsible sidebar (full на ≥1280px, icon-rail на 1024–1279px)
- **Mobile:** Bottom dock (`BottomNavigation`), 5 элементов + центральный FAB
- **Header:** `AppHeader` с glass.nav — sticky, backdrop-blur

---

## 6. Motion

- **Duration scale:** instant(0) → fast(100ms) → normal(200ms) → slow(300ms) → slower(400ms) → slowest(500ms)
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (default), `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like для hero)
- **Page transitions:** `<PageTransition variant="fade" duration={0.15}>`
- **Touch safety:** Все hover-эффекты обёрнуты в `@media (hover: hover)`
- **Reduced motion:** `useReducedMotion()` хук + `@media (prefers-reduced-motion)`

---

## 7. Do's and Don'ts

### Do:

- Использовать glassmorphism для elevation (не тени)
- Использовать Space Grotesk для заголовков, DM Sans для тела
- Использовать emerald primary на ≤10% экрана
- Использовать lavender accent для интерактивных акцентов
- Использовать responsive-адаптивную типографику (clamp / breakpoint-based)
- Использовать `Section` компонент для композиции страниц
- Использовать токены для всех цветов (никаких hardcoded hex)

### Don't:

- Не использовать hardcoded hex-цвета — только токены
- Не использовать более 3 уровней elevation на одном экране
- Не смешивать glassmorphism с тяжёлыми тенями на одном элементе
- Не использовать border-left >1px как coloured stripe
- Не использовать крошечный uppercase tracked eyebrow над каждой секцией
- Не использовать текст, выходящий за пределы контейнера

```

```
