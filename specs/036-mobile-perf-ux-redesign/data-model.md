# Data Model: Mobile Performance & UX Redesign

**Feature**: 036-mobile-perf-ux-redesign
**Date**: 2026-06-28

## Entities

### DesignToken

Centralized visual style definitions consumed by CSS and TypeScript.

**Attributes**:
- `colors` — brand, neutral, semantic (success/warning/error), surface, text
- `typography` — font sizes (12/14/16/20/24/32px), weights (400/500/600/700), line heights (1.2/1.4/1.6)
- `spacing` — 8px grid scale (4/8/12/16/20/24/32/40/48/64px)
- `radii` — border radii (4/8/12/16/9999px)
- `shadows` — elevation levels (sm/md/lg)
- `transitions` — duration presets (fast: 100ms, normal: 200ms, slow: 300ms)
- `breakpoints` — xs: 375, sm: 640, md: 768, lg: 1024, xl: 1280

**Storage**: CSS custom properties in `src/styles/tokens.css`, TypeScript exports in `src/lib/design-tokens.ts`

**Relationships**: Consumed by all components via Tailwind utilities and direct CSS var references.

---

### GestureConfig

Per-user gesture preferences.

**Attributes**:
- `swipeEnabled` (boolean, default: true) — horizontal swipe for track navigation
- `swipeSensitivity` (number, 0.5–2.0, default: 1.0) — gesture trigger threshold
- `longPressEnabled` (boolean, default: true) — long press for context menu
- `longPressDuration` (number, 300–800ms, default: 500ms) — hold time threshold
- `doubleTapEnabled` (boolean, default: true) — double tap for like
- `pullToRefreshEnabled` (boolean, default: true)
- `hapticEnabled` (boolean, default: true) — haptic feedback on gestures
- `hapticIntensity` ('light' | 'medium' | 'heavy', default: 'medium')

**Storage**: Zustand store → localStorage key `gesture-config` → Telegram CloudStorage key `gestures`

**Validation (Zod)**:
- `swipeSensitivity`: z.number().min(0.5).max(2.0)
- `longPressDuration`: z.number().min(300).max(800)
- `hapticIntensity`: z.enum(['light', 'medium', 'heavy'])

---

### UserPreferences

User-facing customization settings.

**Attributes**:
- `theme` ('light' | 'dark' | 'auto', default: 'auto') — color scheme
- `textSize` ('small' | 'medium' | 'large', default: 'medium') — scales all text proportionally
- `reducedMotion` (boolean, default: false) — overrides OS-level setting if user wants more control
- `audioQuality` ('low' | 'medium' | 'high', default: 'high')
- `notificationsEnabled` (boolean, default: true)
- `compactCards` (boolean, default: false) — smaller track cards in library

**Storage**: Zustand store → localStorage key `user-preferences` → Telegram CloudStorage key `prefs`

**State transitions**:
- `theme`: switching applies CSS class immediately (<200ms), persists async
- `textSize`: switching updates CSS custom property `--text-scale`, re-renders text elements
- `reducedMotion`: toggles motion globally via `@/lib/motion` wrapper

**Relationships**: GestureConfig is a sibling entity — both stored in `usePreferencesStore` under separate slices.

---

### PerformanceBudget

CI-enforced performance constraints.

**Attributes**:
- `bundleSizeLimit` (number, bytes) — 950KB hard, 880KB target
- `ttiTarget` (number, ms) — 2000ms
- `fpsMinimum` (number) — 55
- `transitionMaxMs` (number) — 300
- `componentMaxLines` (number) — 300
- `hookMaxLines` (number) — 300

**Storage**: `size-limit` config in `package.json`, Lighthouse CI config, custom ESLint rules

**Validation**: Enforced in CI pipeline — build fails if budget exceeded.

## Entity Relationships

```
UserPreferences (1:1 per user)
├── GestureConfig (1:1, embedded slice)
└── theme → DesignToken.colors (runtime CSS var switching)

DesignToken (singleton)
├── consumed by → all Components (via CSS custom properties)
└── consumed by → Tailwind config (via theme.extend)

PerformanceBudget (singleton, CI-only)
└── validates → bundle output, Lighthouse scores
```

## No New Database Tables

This feature operates entirely client-side. No Supabase schema changes needed:
- Preferences stored in localStorage + Telegram CloudStorage
- Design tokens are build-time constants
- Performance budgets are CI configuration
