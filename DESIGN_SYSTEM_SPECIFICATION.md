# 🎨 MusicVerse AI Design System Specification

**Version:** 2.0  
**Date:** 2026-01-04  
**Status:** Living Document

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Colors](#colors)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Animations & Transitions](#animations--transitions)
8. [Mobile-Specific](#mobile-specific)
9. [Accessibility](#accessibility)
10. [Implementation](#implementation)

---

## Overview

MusicVerse AI Design System — это комплексная система дизайна для создания консистентного, доступного и производительного пользовательского интерфейса Telegram Mini App.

### Goals

- **Consistency**: Единый визуальный язык across all components
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Performance**: Optimized animations, lazy loading
- **Mobile-First**: Touch-optimized, Telegram native feel
- **Developer Experience**: Easy to use, well-documented

### Tech Stack Integration

```typescript
// Built on:
- Tailwind CSS 3.4 (utility-first)
- shadcn/ui (component primitives)
- Radix UI (accessible primitives)
- Framer Motion (animations)
- Telegram Mini App SDK 8.0 (theming)
```

---

## Design Principles

### 1. Mobile-First

> Design for mobile, enhance for desktop

- Touch targets: 44-56px minimum
- One-handed operation friendly
- Responsive from 320px to 2560px
- Portrait orientation primary

### 2. Content-First

> Content before chrome

- Clear hierarchy
- Generous whitespace
- Readable typography
- Progressive disclosure

### 3. Performance

> Fast by default

- Lazy loading images
- Code splitting
- Optimized animations
- Minimal bundle size

### 4. Accessibility

> Usable by everyone

- Keyboard navigable
- Screen reader friendly
- WCAG 2.1 AA minimum
- High contrast support

### 5. Telegram Native

> Feels like Telegram

- Respects system theme
- Native sharing integration
- Haptic feedback
- Platform conventions

---

## Colors

### Color Philosophy

MusicVerse AI uses a **dynamic theming system** that adapts to Telegram's theme (light/dark) while maintaining brand identity.

### Primary Palette

```typescript
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Brand primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
};
```

**Usage:**
- Primary actions (Generate, Play, Save)
- Active states
- Progress indicators
- Brand moments

### Semantic Colors

```typescript
export const semantic = {
  success: {
    light: '#10b981',
    dark: '#34d399',
    contrast: '#ffffff',
  },
  error: {
    light: '#ef4444',
    dark: '#f87171',
    contrast: '#ffffff',
  },
  warning: {
    light: '#f59e0b',
    dark: '#fbbf24',
    contrast: '#000000',
  },
  info: {
    light: '#3b82f6',
    dark: '#60a5fa',
    contrast: '#ffffff',
  },
};
```

**Usage:**
- Success: Track generation complete, saved
- Error: Failed operations, validation
- Warning: Warnings, rate limits
- Info: Tips, announcements

### Telegram Theme Integration

```typescript
export const telegramTheme = {
  // CSS Variables от Telegram
  bg: 'var(--tg-theme-bg-color)',
  secondaryBg: 'var(--tg-theme-secondary-bg-color)',
  text: 'var(--tg-theme-text-color)',
  hint: 'var(--tg-theme-hint-color)',
  link: 'var(--tg-theme-link-color)',
  button: 'var(--tg-theme-button-color)',
  buttonText: 'var(--tg-theme-button-text-color)',
  
  // With fallbacks
  bgFallback: '#ffffff',
  textFallback: '#000000',
};
```

### Neutral Scale (WCAG AA Compliant)

```typescript
export const gray = {
  50: '#f9fafb',   // Lightest background
  100: '#f3f4f6',  // Light background
  200: '#e5e7eb',  // Borders
  300: '#d1d5db',  // Dividers
  400: '#9ca3af',  // Disabled text
  500: '#6b7280',  // Secondary text (4.5:1 on white)
  600: '#4b5563',  // Primary text
  700: '#374151',  // Headings
  800: '#1f2937',  // Dark text
  900: '#111827',  // Darkest text
  950: '#030712',  // Black
};
```

### Color Contrast Ratios

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| gray-900 on white | 16.1:1 | AAA |
| gray-700 on white | 11.5:1 | AAA |
| gray-600 on white | 8.3:1 | AAA |
| gray-500 on white | 4.6:1 | AA |
| primary-600 on white | 5.7:1 | AA |
| error-light on white | 4.5:1 | AA |

### Usage Guidelines

#### Do's ✅
- Use semantic colors for their purpose (success = green)
- Respect Telegram theme variables
- Ensure 4.5:1 contrast minimum for text
- Test in both light and dark modes

#### Don'ts ❌
- Don't use colors for meaning alone (add icons/text)
- Don't hard-code theme colors
- Don't use low-contrast combinations
- Don't override Telegram's primary colors

---

## Typography

### Font Families

```typescript
export const fontFamily = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(', '),
  
  mono: [
    '"JetBrains Mono"',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Courier New"',
    'monospace',
  ].join(', '),
};
```

**Inter**: Primary typeface (variable font)
- Excellent readability at small sizes
- Wide language support
- Optimized for screens

### Type Scale

```typescript
export const fontSize = {
  xs: ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
  sm: ['14px', { lineHeight: '20px', letterSpacing: '0em' }],
  base: ['16px', { lineHeight: '24px', letterSpacing: '0em' }],
  lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
  xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
  '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
  '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
  '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.03em' }],
  '5xl': ['48px', { lineHeight: '48px', letterSpacing: '-0.03em' }],
};
```

### Font Weights

```typescript
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};
```

**Usage:**
- normal: Body text
- medium: Secondary headings, labels
- semibold: Primary headings
- bold: Hero text, CTAs
- extrabold: Display text (sparingly)

### Text Styles

```typescript
export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  
  // Body
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: '24px',
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: '20px',
  },
  
  // Special
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    color: gray[500],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    letterSpacing: '0.01em',
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
  },
};
```

### Responsive Typography

```typescript
// Mobile (< 640px): Base scale
// Tablet (640-1024px): +1 step
// Desktop (> 1024px): +2 steps

export const responsiveText = {
  hero: 'text-3xl md:text-4xl lg:text-5xl',
  h1: 'text-2xl md:text-3xl lg:text-4xl',
  h2: 'text-xl md:text-2xl lg:text-3xl',
  h3: 'text-lg md:text-xl lg:text-2xl',
  body: 'text-base md:text-lg',
};
```

---

## Spacing & Layout

### Spacing Scale (8-point grid)

```typescript
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '2px',   // 0.125rem
  1: '4px',     // 0.25rem
  1.5: '6px',   // 0.375rem
  2: '8px',     // 0.5rem
  2.5: '10px',  // 0.625rem
  3: '12px',    // 0.75rem
  3.5: '14px',  // 0.875rem
  4: '16px',    // 1rem - BASE
  5: '20px',    // 1.25rem
  6: '24px',    // 1.5rem
  7: '28px',    // 1.75rem
  8: '32px',    // 2rem
  9: '36px',    // 2.25rem
  10: '40px',   // 2.5rem
  11: '44px',   // 2.75rem
  12: '48px',   // 3rem
  14: '56px',   // 3.5rem
  16: '64px',   // 4rem
  20: '80px',   // 5rem
  24: '96px',   // 6rem
};
```

**Philosophy:**
- Base unit: 4px (0.25rem)
- Most spacing: multiples of 8px
- Fine-tuning: 4px increments
- Touch targets: 44-56px

### Layout Grid

```typescript
export const grid = {
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
  },
  gutter: {
    mobile: spacing[4],   // 16px
    tablet: spacing[6],   // 24px
    desktop: spacing[8],  // 32px
  },
  margin: {
    mobile: spacing[4],   // 16px
    tablet: spacing[8],   // 32px
    desktop: spacing[16], // 64px
  },
};
```

### Breakpoints

```typescript
export const breakpoints = {
  xs: '320px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
  xl: '1280px',  // Large desktops
  '2xl': '1536px', // Extra large
};
```

### Container Widths

```typescript
export const container = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
};
```

### Z-Index Scale

```typescript
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};
```

---

## Components

### Touch Targets

**Principle:** All interactive elements must be easy to tap.

```typescript
export const touchTarget = {
  // Absolute minimums (iOS HIG)
  minimum: '44px',
  
  // Recommended
  recommended: '56px',
  
  // Dense (list items, toolbars)
  dense: '40px',
  
  // Icon-only buttons
  icon: '48px',
  
  // FAB (Floating Action Button)
  fab: '56px',
};
```

**Implementation:**
```tsx
// Bad ❌
<button className="p-1">
  <Icon size={16} />
</button>

// Good ✅
<button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon size={20} />
</button>
```

### Button Variants

#### Primary Button
```tsx
<Button variant="primary" size="default">
  Generate Track
</Button>

// Styles:
{
  backgroundColor: primary-600,
  color: white,
  padding: '12px 24px',
  borderRadius: '8px',
  minHeight: '44px',
  fontSize: '16px',
  fontWeight: 600,
}
```

#### Secondary Button
```tsx
<Button variant="secondary">
  Cancel
</Button>

// Styles:
{
  backgroundColor: gray-100,
  color: gray-900,
  border: '1px solid' gray-200,
  // Same size as primary
}
```

#### Ghost Button
```tsx
<Button variant="ghost">
  Learn More
</Button>

// Styles:
{
  backgroundColor: 'transparent',
  color: primary-600,
  // Hover: gray-100 bg
}
```

#### Icon Button
```tsx
<IconButton aria-label="Play track">
  <PlayIcon />
</IconButton>

// Styles:
{
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
```

### Cards

#### Track Card
```tsx
<TrackCard
  track={track}
  variant="grid" // or "list"
  onPlay={handlePlay}
  onLike={handleLike}
/>

// Anatomy:
- Cover image (lazy loaded)
- Title (truncated 2 lines)
- Artist name (1 line)
- Actions (play, like, menu)
- Version badge (if multiple)
- Duration
```

**Spacing:**
```typescript
{
  padding: spacing[4],        // 16px
  gap: spacing[3],            // 12px
  coverSize: {
    grid: '160px',
    list: '64px',
  },
  borderRadius: spacing[3],   // 12px
}
```

### Forms

#### Text Input
```tsx
<Input
  label="Track Title"
  placeholder="Enter track title"
  required
/>

// Anatomy:
- Label (optional)
- Input field
- Helper text (optional)
- Error message (validation)
```

**Styles:**
```typescript
{
  height: '44px',
  padding: '0 16px',
  fontSize: '16px', // Prevent iOS zoom
  borderRadius: '8px',
  border: '1px solid' gray-300,
  
  // Focus
  focusRing: '2px solid' primary-500,
  
  // Error
  errorBorder: '2px solid' error-light,
}
```

#### Textarea
```tsx
<Textarea
  label="Lyrics"
  rows={6}
  maxLength={3000}
/>

// Same styles as Input
// + character counter
```

#### Select
```tsx
<Select
  label="Genre"
  options={genres}
  value={selectedGenre}
  onChange={setSelectedGenre}
/>

// Native select on mobile
// Custom dropdown on desktop
```

### Dialogs & Sheets

#### Modal Dialog (Desktop)
```tsx
<Dialog open={isOpen} onClose={onClose}>
  <DialogHeader>
    <DialogTitle>Track Details</DialogTitle>
  </DialogHeader>
  <DialogContent>
    {/* Content */}
  </DialogContent>
  <DialogFooter>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={onSave}>Save</Button>
  </DialogFooter>
</Dialog>

// Styles:
{
  maxWidth: '600px',
  borderRadius: spacing[4], // 16px
  padding: spacing[6],      // 24px
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
}
```

#### Bottom Sheet (Mobile)
```tsx
<Sheet open={isOpen} onClose={onClose}>
  <SheetHeader>
    <SheetTitle>Actions</SheetTitle>
  </SheetHeader>
  <SheetContent>
    {/* Actions list */}
  </SheetContent>
</Sheet>

// Telegram safe-area aware
// Swipe to dismiss
```

---

## Animations & Transitions

### Principles

1. **Purposeful:** Every animation has a reason
2. **Fast:** < 300ms for most transitions
3. **Smooth:** 60 FPS minimum
4. **Subtle:** Don't distract from content

### Duration Scale

```typescript
export const duration = {
  instant: '0ms',
  fast: '150ms',     // Hover, focus
  normal: '250ms',   // Default
  slow: '350ms',     // Page transitions
  slower: '500ms',   // Complex animations
};
```

### Easing Functions

```typescript
export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  
  // Custom
  smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};
```

### Framer Motion Presets

```typescript
export const motionPresets = {
  // Fade
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25 },
  },
  
  // Slide up
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  
  // Scale
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2 },
  },
  
  // Spring
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  },
};
```

### Common Animations

#### Button Hover
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
  Click me
</motion.button>
```

#### Card Hover
```tsx
<motion.div
  whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
  transition={{ duration: 0.2 }}
>
  {/* Card content */}
</motion.div>
```

#### Page Transition
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.25 }}
  >
    {/* Page content */}
  </motion.div>
</AnimatePresence>
```

#### Loading Skeleton
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>

// CSS:
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Performance Guidelines

**Do's ✅**
- Use `transform` and `opacity` for animations (GPU accelerated)
- Set `will-change` for complex animations
- Use `layoutId` for shared element transitions
- Debounce scroll animations

**Don'ts ❌**
- Don't animate `width`, `height`, `top`, `left` (causes reflow)
- Don't use heavy animations on low-end devices
- Don't chain too many animations
- Don't forget `AnimatePresence` for exit animations

---

## Mobile-Specific

### Touch Gestures

```typescript
export const gestures = {
  // Tap
  tap: {
    maxDistance: 10, // px
    maxDuration: 250, // ms
  },
  
  // Long press
  longPress: {
    duration: 500, // ms
  },
  
  // Swipe
  swipe: {
    threshold: 80, // px
    velocity: 0.3, // px/ms
  },
  
  // Pinch
  pinch: {
    threshold: 0.1, // scale diff
  },
};
```

### Haptic Feedback

```typescript
export const haptic = {
  // Light impact (UI interactions)
  light: () => TelegramWebApp.HapticFeedback.impactOccurred('light'),
  
  // Medium impact (button press)
  medium: () => TelegramWebApp.HapticFeedback.impactOccurred('medium'),
  
  // Heavy impact (success action)
  heavy: () => TelegramWebApp.HapticFeedback.impactOccurred('heavy'),
  
  // Success notification
  success: () => TelegramWebApp.HapticFeedback.notificationOccurred('success'),
  
  // Error notification
  error: () => TelegramWebApp.HapticFeedback.notificationOccurred('error'),
  
  // Warning notification
  warning: () => TelegramWebApp.HapticFeedback.notificationOccurred('warning'),
  
  // Selection changed
  selection: () => TelegramWebApp.HapticFeedback.selectionChanged(),
};
```

**Usage:**
```tsx
<Button
  onClick={() => {
    haptic.medium();
    onGenerate();
  }}
>
  Generate
</Button>
```

### Safe Areas

```typescript
export const safeArea = {
  top: 'env(safe-area-inset-top)',
  right: 'env(safe-area-inset-right)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
};

// Tailwind utilities:
// pt-safe-top, pb-safe-bottom, etc.
```

### Orientation Lock

```typescript
// Portrait only for Telegram Mini App
window.screen.orientation.lock?.('portrait');
```

---

## Accessibility

### WCAG 2.1 Compliance

#### Level AA (Minimum)

**1.4.3 Contrast (Minimum)**
- Text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

**2.1.1 Keyboard**
- All functionality keyboard accessible
- No keyboard trap

**2.4.7 Focus Visible**
- Focus indicator visible
- 2px outline minimum

**4.1.2 Name, Role, Value**
- ARIA labels on all interactive elements
- Semantic HTML

#### Implementation

```tsx
// Good ✅
<button
  aria-label="Play track"
  onClick={onPlay}
>
  <PlayIcon aria-hidden="true" />
</button>

// Bad ❌
<div onClick={onPlay}>
  <PlayIcon />
</div>
```

### Keyboard Navigation

```typescript
export const keyboardShortcuts = {
  // Player
  'Space': 'Play/Pause',
  'ArrowLeft': 'Seek -10s',
  'ArrowRight': 'Seek +10s',
  'ArrowUp': 'Volume up',
  'ArrowDown': 'Volume down',
  'M': 'Mute',
  'F': 'Fullscreen',
  
  // Navigation
  'Escape': 'Close modal/Go back',
  'Tab': 'Next element',
  'Shift+Tab': 'Previous element',
  
  // Actions
  'L': 'Like',
  'S': 'Share',
  'D': 'Download',
};
```

### Screen Reader Support

```tsx
// Live regions
<div role="status" aria-live="polite">
  Track generated successfully
</div>

// Hidden text
<span className="sr-only">
  Play {trackTitle}
</span>

// ARIA labels
<nav aria-label="Main navigation">
  {/* Nav items */}
</nav>
```

### Focus Management

```tsx
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen, onClose }) {
  const modalRef = useFocusTrap(isOpen);
  
  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  );
}
```

---

## Implementation

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors,
      fontFamily,
      fontSize,
      spacing,
      animation,
      keyframes,
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
```

### CSS Variables

```css
/* global.css */
:root {
  /* Colors */
  --color-primary: 59 130 246; /* rgb(59, 130, 246) */
  --color-success: 16 185 129;
  --color-error: 239 68 68;
  
  /* Spacing */
  --spacing-base: 1rem; /* 16px */
  
  /* Typography */
  --font-sans: Inter, system-ui, sans-serif;
  
  /* Animations */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  
  /* Telegram theme */
  --tg-theme-bg-color: #ffffff;
  --tg-theme-text-color: #000000;
}

[data-theme="dark"] {
  --tg-theme-bg-color: #212121;
  --tg-theme-text-color: #ffffff;
}
```

### Design Tokens Export

```typescript
// design-tokens.ts
export const designTokens = {
  colors,
  typography,
  spacing,
  animations,
  breakpoints,
  shadows,
};

// For style-dictionary or Figma sync
export default designTokens;
```

### Component Library Structure

```
src/components/ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── select.tsx
├── dialog.tsx
├── sheet.tsx
├── toast.tsx
├── skeleton.tsx
└── ...

// Each component:
- Accessibility built-in
- Mobile-optimized
- Documented (Storybook)
- Tested (Jest + Playwright)
```

### Storybook Setup

```typescript
// .storybook/preview.tsx
import { themes } from '@storybook/theming';

export const parameters = {
  backgrounds: {
    default: 'light',
    values: [
      { name: 'light', value: '#ffffff' },
      { name: 'dark', value: '#212121' },
    ],
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: { width: '375px', height: '667px' },
      },
      tablet: {
        name: 'Tablet',
        styles: { width: '768px', height: '1024px' },
      },
    },
  },
};
```

---

## Resources

### Internal
- [UX/UI Improvement Plan](./UX_UI_IMPROVEMENT_PLAN_2026.md)
- [Component Documentation](./docs/COMPONENTS.md)
- [Accessibility Guide](./docs/ACCESSIBILITY.md)

### External
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://radix-ui.com)
- [Framer Motion](https://framer.com/motion)
- [Telegram Mini App](https://core.telegram.org/bots/webapps)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Living Document**  
This specification will evolve with the project. All changes should be documented and communicated to the team.

**Last Updated:** 2026-01-04
