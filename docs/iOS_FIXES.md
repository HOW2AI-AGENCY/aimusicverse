# iOS/Telegram Mini App Fixes

This document describes all iOS-specific fixes implemented for the Telegram Mini App.

## Overview

iOS Safari and Telegram Mini Apps have several known issues that require specific workarounds. This document catalogs all fixes applied to ensure a smooth user experience on iOS devices.

---

## 1. Input Zoom Prevention

**Problem**: iOS Safari automatically zooms in on input fields with font-size < 16px when focused.

**Solution**:
- All input components use `text-base` (16px) on mobile
- Global CSS rule forces 16px font-size for all form inputs on iOS
- Added `touch-manipulation` to prevent double-tap zoom

**Files affected**:
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/select.tsx`
- `src/index.css`

---

## 2. Vertical Swipe Prevention

**Problem**: Vertical swipes on iOS can accidentally close the Telegram Mini App.

**Solution**:
- Call `tg.disableVerticalSwipes()` during initialization
- Set `overscroll-behavior: none` on html/body to prevent bounce effect

**Files affected**:
- `src/contexts/TelegramContext.tsx`
- `src/index.css`

---

## 3. Keyboard Height Tracking

**Problem**: iOS virtual keyboard overlaps content, hiding input fields.

**Solution**:
- Use `visualViewport` API to detect keyboard height
- Set `--keyboard-height` CSS variable dynamically
- Apply `scroll-padding-bottom` to html for proper scroll behavior
- Add `keyboard-open` class to body for additional styling control

**Files affected**:
- `src/main.tsx`
- `src/index.css`

---

## 4. Momentum Scrolling

**Problem**: Scroll areas feel sluggish on iOS without native momentum.

**Solution**:
- Apply `-webkit-overflow-scrolling: touch` to all scrollable areas
- Set `overscroll-behavior: contain` to prevent scroll chaining

**Files affected**:
- `src/components/ui/scroll-area.tsx`
- `src/index.css`

---

## 5. Touch Target Size

**Problem**: iOS requires minimum 44x44px touch targets for usability.

**Solution**:
- All interactive elements have `min-h-[44px]` minimum height
- Select and Input components enforce minimum touch target size

**Files affected**:
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/index.css`

---

## 6. Input Mode Optimization

**Problem**: iOS shows wrong keyboard type for number/email/tel inputs.

**Solution**:
- Dynamically set `inputMode` based on input `type`
- `number` → `decimal` keyboard
- `tel` → telephone keyboard
- `email` → email keyboard with @ symbol

**Files affected**:
- `src/components/ui/input.tsx`

---

## 7. Context Menu Prevention

**Problem**: Long press shows iOS context menu on interactive elements, disrupting UX.

**Solution**:
- Apply `-webkit-touch-callout: none` on buttons, links, and interactive elements
- Use `-webkit-user-select: none` to prevent text selection

**Files affected**:
- `src/index.css`

---

## 8. 100vh Height Issue

**Problem**: `100vh` on iOS includes the address bar, causing content overflow.

**Solution**:
- Use `-webkit-fill-available` as fallback for `100vh`
- Use CSS custom property `--vh` calculated from `window.innerHeight`

**Files affected**:
- `src/main.tsx`
- `src/index.css`

---

## 9. Backdrop Filter Support

**Problem**: `backdrop-filter` requires `-webkit-` prefix on iOS Safari.

**Solution**:
- Apply `-webkit-backdrop-filter` alongside `backdrop-filter`

**Files affected**:
- `src/index.css`

---

## Testing Checklist

When testing on iOS devices, verify:

- [ ] Input fields don't trigger page zoom on focus
- [ ] Scrolling feels smooth with momentum
- [ ] Keyboard doesn't hide input fields
- [ ] Swiping down doesn't close the Mini App
- [ ] Touch targets are easy to tap (44x44px minimum)
- [ ] Number inputs show decimal keyboard
- [ ] Long press doesn't show context menu on buttons
- [ ] Full-height layouts work correctly
- [ ] Blur effects render properly

---

## Debug Tools

To debug iOS issues:

1. Check boot log: `window.__getBootLog()`
2. Check keyboard height: `getComputedStyle(document.documentElement).getPropertyValue('--keyboard-height')`
3. Check safe area: `getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom')`

---

## References

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [iOS Safari CSS Support](https://caniuse.com/?compare=ios_saf+17.0)
- [Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API)
