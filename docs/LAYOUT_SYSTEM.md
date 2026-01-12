# Layout System Documentation

## Overview

This document describes the unified layout system for MusicVerse AI, including z-index hierarchy, safe area handling, spacing, and positioning utilities.

## Z-Index System

### Hierarchy

| Level | Tailwind Class | Value | Usage |
|-------|----------------|-------|-------|
| 0 | `z-base` | 0 | Base content (default) |
| 10 | `z-raised` | 10 | Cards, panels, elevated surfaces |
| 20 | `z-sticky` | 20 | Sticky headers/footers |
| 30 | `z-floating` | 30 | Tooltips, popovers |
| 40 | `z-overlay` | 40 | Backdrops for modals |
| 50 | `z-navigation` | 50 | Bottom nav, sidebar |
| 60 | `z-player` | 60 | Compact/expanded player |
| 70 | `z-contextual` | 70 | Toasts, hints, notifications |
| 80 | `z-dialog` | 80 | Dialogs, sheets, modals |
| 90 | `z-fullscreen` | 90 | Fullscreen player, studio |
| 100 | `z-system` | 100 | System notifications, achievements |
| 200 | `z-dropdown` | 200 | Dropdown menus, select lists |

### Special Cases

- `z-sheet-backdrop`: 80 (sheet backdrop layer)
- `z-sheet-content`: 81 (sheet content layer, above backdrop)
- `z-player-overlay`: 61 (player overlay, above player)
- `z-toast`: 70 (toast notifications)
- `z-hint`: 70 (contextual hints)

### Usage

```tsx
// ✅ GOOD - Using semantic z-index classes
<nav className="z-navigation">...</nav>
<div className="z-dialog">...</div>

// ❌ BAD - Hardcoded z-index values
<nav className="z-50">...</nav>
<div className="z-[80]">...</div>
```

## Safe Area System

### What are Safe Areas?

Safe areas account for:
- iOS notch / Dynamic Island
- Android status bar
- iOS home indicator
- Telegram native buttons (MainButton, BackButton, SettingsButton)
- Device corners and rounded displays

### Constants

Located in `src/constants/safe-area.ts`:

```typescript
import { TELEGRAM_SAFE_AREA, SAFE_STYLES, getSafeAreaTop, getSafeAreaBottom } from '@/constants/safe-area';

// Usage in inline styles
<div style={SAFE_STYLES.headerTop} />

// Usage with custom padding
<div style={{ paddingTop: getSafeAreaTop(16) }} />
```

### CSS Utility Classes

```css
/* Top safe area */
.safe-top              /* Base safe area */
.safe-top-compact      /* + 0.5rem */
.safe-top-spacious     /* + 1rem */

/* Bottom safe area */
.safe-bottom           /* Base safe area */
.safe-bottom-nav       /* + 0.5rem for navigation */
.safe-bottom-sheet     /* + 1rem for sheets */

/* Combined */
.safe-vertical         /* Top + bottom */
.safe-all             /* All sides */
```

### Usage Examples

```tsx
// Using utility classes
<header className="safe-top-spacious">...</header>
<nav className="safe-bottom-nav">...</nav>

// Using inline styles with constants
<div style={SAFE_STYLES.playerTop}>...</div>

// Using custom values
<div style={{ paddingTop: getSafeAreaTop(24) }}>...</div>
```

## Spacing System

### Design Tokens

Based on 4px grid system:

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Tight spacing |
| `--spacing-sm` | 8px | Compact |
| `--spacing-md` | 12px | Comfortable |
| `--spacing-lg` | 16px | Standard |
| `--spacing-xl` | 24px | Relaxed |
| `--spacing-2xl` | 32px | Spacious |

### Touch Targets

Minimum sizes for interactive elements:

| Token | Value | Usage |
|-------|-------|-------|
| `--touch-target-min` | 44px | Minimum touch target |
| `--touch-target-comfortable` | 48px | Comfortable touch target |
| `--touch-target-large` | 56px | Large touch target |

### Usage

```tsx
// Using touch target classes
<button className="min-h-touch min-w-touch">...</button>

// Using spacing utilities
<div className="space-lg">...</div>
```

## Centering & Alignment

### Flex Centering

```css
.flex-center      /* center both x and y */
.flex-center-x    /* center horizontally */
.flex-center-y    /* center vertically */
```

### Absolute/Fixed Centering

```css
.absolute-center  /* position: absolute, centered */
.fixed-center     /* position: fixed, centered */
```

### Usage

```tsx
// Flex center
<div className="flex-center">
  <span>Centered content</span>
</div>

// Absolute center
<div className="relative">
  <div className="absolute-center">Centered</div>
</div>
```

## Positioning Utilities

### Fixed Positioning with Safe Areas

```css
.fixed-top        /* top: 0, left: 0, right: 0 */
.fixed-bottom     /* bottom: 0, left: 0, right: 0 */
.fixed-top-safe   /* top: safe area, left: 0, right: 0 */
.fixed-bottom-safe /* bottom: safe area, left: 0, right: 0 */
```

### Usage

```tsx
// Fixed header with safe area
<header className="fixed-top-safe">...</header>

// Fixed bottom navigation
<nav className="fixed-bottom-safe">...</nav>
```

## Best Practices

### 1. Always Use Semantic Classes

```tsx
// ✅ GOOD
<nav className="z-navigation safe-bottom-nav">...</nav>

// ❌ BAD
<nav className="z-50 pb-[max(1rem,env(safe-area-inset-bottom))]">...</nav>
```

### 2. Import Constants for Safe Areas

```tsx
// ✅ GOOD
import { SAFE_STYLES } from '@/constants/safe-area';
<div style={SAFE_STYLES.headerTop} />

// ❌ BAD
<div style={{ paddingTop: 'calc(max(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 0.75rem)' }} />
```

### 3. Use Tailwind Classes for Z-Index

```tsx
// ✅ GOOD
<div className="z-dialog">...</div>

// ❌ BAD
<div className="z-[80]">...</div>
<div style={{ zIndex: 80 }}>...</div>
```

### 4. Test on Real Devices

Safe areas behave differently on:
- iPhone with notch
- iPhone with Dynamic Island
- Android with status bar
- Telegram Mini App

Always test on actual devices!

## Migration Guide

### Converting Existing Code

**Before:**
```tsx
<div className="fixed z-50" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
```

**After:**
```tsx
<div className="fixed-bottom-safe z-navigation">
```

**Before:**
```tsx
<div className="z-[80]">...</div>
```

**After:**
```tsx
<div className="z-dialog">...</div>
```

**Before:**
```tsx
<div style={{
  paddingTop: 'calc(max(var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 12px)'
}}>
```

**After:**
```tsx
<div style={SAFE_STYLES.headerTop}>
// OR
<div className="safe-top-compact">
```

## TypeScript Types

```typescript
// Z-index types
import type { ZIndexKey } from '@/constants/z-index';

// Safe area types
import type { SafeAreaPosition, SafeAreaVariant } from '@/constants/safe-area';

// Usage
const zIndex: ZIndexKey = 'navigation';
const position: SafeAreaPosition = 'top';
const variant: SafeAreaVariant = 'spacious';
```

## Troubleshooting

### Elements Overlapping

1. Check z-index hierarchy using DevTools
2. Ensure semantic classes are used correctly
3. Verify parent elements don't create stacking contexts

### Safe Areas Not Working

1. Check Telegram WebApp is initialized
2. Verify CSS variables are set (`--tg-safe-area-inset-top`, etc.)
3. Test on real device (browser DevTools don't show safe areas)

### Centering Issues

1. Check parent element has height
2. Verify `flex` or `grid` is applied to parent
3. Use `flex-center` utility for consistent behavior

## Related Files

- `src/constants/z-index.ts` - Z-index constants and types
- `src/constants/safe-area.ts` - Safe area constants and utilities
- `src/index.css` - CSS utility classes
- `tailwind.config.ts` - Tailwind configuration

## Changelog

### 2026-01-12
- Created unified z-index system
- Added safe area utility classes
- Standardized spacing and positioning utilities
- Fixed z-index conflicts in components
- Migrated hardcoded values to semantic classes
