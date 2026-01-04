# Safe Area Guidelines

**Last Updated:** 2025-12-22  
**Status:** Official Style Guide  
**Applies To:** All UI components in MusicVerse AI

---

## 📋 Overview

This document defines the standard patterns for applying safe area insets in MusicVerse AI to avoid double padding and ensure consistent UI behavior across devices.

### What are Safe Areas?

Safe areas are the portions of the screen that are not obscured by device-specific UI elements:
- **iPhone Notch/Dynamic Island** - Top safe area
- **iPhone Home Indicator** - Bottom safe area  
- **Android Punch-hole cameras** - Top safe area
- **Telegram Mini App native buttons** - Top safe area (Back, Settings, Minimize)

---

## 🎯 Core Principle: Single Application

**Safe area insets MUST be applied ONLY at the TOP LEVEL of the visual hierarchy.**

### ✅ Correct Pattern

```tsx
// ✅ Page Header applies safe-area
<header className="pt-[max(calc(var(--tg-content-safe-area-inset-top)+0.5rem),calc(env(safe-area-inset-top)+0.5rem))]">
  <h1>Page Title</h1>
</header>

// ✅ Page content uses regular padding (NO safe-area)
<main className="pt-4">
  <Content />
</main>
```

### ❌ Incorrect Pattern

```tsx
// ❌ Header applies safe-area
<header className="pt-[var(--safe-area-top)]">
  <h1>Title</h1>
</header>

// ❌ Content ALSO applies safe-area (DOUBLE PADDING!)
<main className="pt-[var(--safe-area-top)]">
  <Content />
</main>
```

---

## 📐 Implementation Patterns

### Pattern 1: Sticky Headers

When using sticky headers, apply safe-area padding to the header only:

```tsx
function PageWithStickyHeader() {
  return (
    <>
      {/* ✅ Header with safe-area */}
      <header className="sticky top-0 pt-[max(env(safe-area-inset-top),1rem)]">
        <h1>MusicVerse AI</h1>
      </header>
      
      {/* ✅ Content without safe-area (header already handles it) */}
      <main className="p-4">
        <Content />
      </main>
    </>
  );
}
```

**Examples:**
- `src/components/home/HomeHeader.tsx`
- `src/components/layout/AppHeader.tsx`

---

### Pattern 2: Full-Screen Modals/Sheets

For full-screen modals, apply safe-area at the container level:

```tsx
function FullScreenModal() {
  return (
    <Sheet>
      <SheetContent className="h-[100dvh] flex flex-col">
        {/* ✅ Header with safe-area */}
        <SheetHeader style={{ 
          paddingTop: 'max(var(--tg-content-safe-area-inset-top), 1rem)' 
        }}>
          <SheetTitle>Modal Title</SheetTitle>
        </SheetHeader>
        
        {/* ✅ Content without safe-area */}
        <div className="flex-1 p-4">
          <Content />
        </div>
        
        {/* ✅ Footer with safe-area */}
        <SheetFooter style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}>
          <Button>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

**Examples:**
- `src/components/GenerateSheet.tsx`
- `src/components/generate-form/LyricsChatAssistant.tsx`

---

### Pattern 3: Fixed Bottom Navigation

For fixed bottom elements, apply safe-area padding to the element itself:

```tsx
function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <NavItems />
    </nav>
  );
}
```

**Examples:**
- `src/components/BottomNavigation.tsx`

---

### Pattern 4: Page Layout (MainLayout)

MainLayout intentionally does NOT apply top safe-area padding to allow page headers to handle it:

```tsx
// src/components/MainLayout.tsx
<main className={cn(
  'flex-1 flex flex-col overflow-y-auto',
  // ❌ NO top safe-area padding here
  // ✅ Individual page headers (HomeHeader, AppHeader) handle top safe-area
  'pb-[calc(4rem+env(safe-area-inset-bottom))]' // Bottom safe-area for navigation
)}>
  <div className="flex-1 px-4 py-3">
    <Outlet /> {/* Pages render here with their own headers */}
  </div>
</main>
```

---

## 📱 Platform-Specific Considerations

### iOS Telegram Mini App

Telegram Mini App provides its own safe area variables:
- `--tg-content-safe-area-inset-top`
- `--tg-content-safe-area-inset-bottom`
- `--tg-content-safe-area-inset-left`
- `--tg-content-safe-area-inset-right`

**Always use both Telegram AND standard safe-area with `max()`:**

```css
/* ✅ Correct: Use both with max() */
padding-top: max(
  calc(var(--tg-content-safe-area-inset-top) + 0.5rem),
  calc(env(safe-area-inset-top) + 0.5rem)
);

/* ❌ Incorrect: Only Telegram vars */
padding-top: var(--tg-content-safe-area-inset-top);

/* ❌ Incorrect: Only standard vars */
padding-top: env(safe-area-inset-top);
```

### Android

Android devices use standard `env(safe-area-inset-*)` values:

```css
padding-top: max(env(safe-area-inset-top), 1rem);
```

---

## 🔍 Audit Checklist

When reviewing or creating a component, verify:

- [ ] **Only ONE component** in the hierarchy applies top safe-area padding
- [ ] **Only ONE component** in the hierarchy applies bottom safe-area padding
- [ ] Safe-area is applied at the **highest level** (header/footer, not content)
- [ ] Both Telegram AND standard safe-area variables are used with `max()`
- [ ] Regular padding is used for child elements (no safe-area)
- [ ] Component follows one of the documented patterns

---

## 🧪 Testing Guidelines

### Visual Testing Checklist

Test on the following device types:

1. **iPhone with Notch** (12, 13, 14 series)
   - Verify no double padding at top
   - Verify content not hidden by notch
   
2. **iPhone with Dynamic Island** (14 Pro, 15 Pro)
   - Verify proper spacing around Dynamic Island
   - Verify no double padding at top

3. **iPhone SE** (no notch)
   - Verify reasonable padding (not excessive)
   
4. **Android with Punch-hole** (Pixel 7, Samsung S22)
   - Verify proper spacing around punch-hole
   
5. **Android without Punch-hole** (older devices)
   - Verify reasonable padding

### Browser DevTools Testing

```javascript
// Test safe-area in Chrome DevTools Console
document.documentElement.style.setProperty('--tg-content-safe-area-inset-top', '44px');
document.documentElement.style.setProperty('--tg-content-safe-area-inset-bottom', '34px');
```

---

## 📚 Examples in Codebase

### ✅ Good Examples

#### HomeHeader.tsx
```tsx
// Line 72: Correct safe-area application
<header className="pt-[max(calc(var(--tg-content-safe-area-inset-top,0px)+0.5rem),calc(env(safe-area-inset-top,0px)+0.5rem))]">
  {/* Header content */}
</header>
```

#### MainLayout.tsx
```tsx
// Line 128: Bottom safe-area only, no top (headers handle it)
<main className={cn(
  'flex-1',
  'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]'
)}>
  <Outlet />
</main>
```

#### GenerateSheet.tsx
```tsx
// Line 218: Header with safe-area
<div style={{ 
  paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))' 
}}>
  {/* Header */}
</div>

// Line 272: Content without safe-area
<ScrollArea className="flex-1">
  <div className="px-4 py-3">
    {/* Content */}
  </div>
</ScrollArea>

// Line 352: Footer with safe-area
<div style={{
  paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
}}>
  {/* Footer */}
</div>
```

---

## 🐛 Common Mistakes

### Mistake 1: Double Top Padding

```tsx
// ❌ BAD: Header has safe-area
<header className="pt-[env(safe-area-inset-top)]">...</header>

// ❌ BAD: Content ALSO has safe-area (double!)
<main className="pt-[env(safe-area-inset-top)]">...</main>
```

**Impact:** Excessive white space at top, content starts too far down.

**Fix:** Remove safe-area from content, keep only in header.

---

### Mistake 2: Forgetting Telegram Variables

```tsx
// ❌ BAD: Only standard safe-area
<header className="pt-[env(safe-area-inset-top)]">...</header>
```

**Impact:** Incorrect spacing in Telegram Mini App, native buttons overlap content.

**Fix:** Use both with `max()`:
```tsx
// ✅ GOOD
<header className="pt-[max(var(--tg-content-safe-area-inset-top),env(safe-area-inset-top))]">
```

---

### Mistake 3: Safe-Area on Non-Edge Elements

```tsx
// ❌ BAD: Card in middle of page has safe-area
<Card className="mt-[env(safe-area-inset-top)]">...</Card>
```

**Impact:** Incorrect spacing, card pushed down unnecessarily.

**Fix:** Use regular spacing:
```tsx
// ✅ GOOD
<Card className="mt-4">...</Card>
```

---

## 🔗 Related Documentation

- [Telegram Mini App UI Guidelines](./TELEGRAM_MINI_APP_UI_IMPROVEMENTS_2025-12.md)
- [iOS Fixes](./iOS_FIXES.md)
- [Mobile UI Audit](./MOBILE_UI_AUDIT_2025_12.md)
- [Sprint 028: UI/UX Optimization](../SPRINT_028_UI_UX_OPTIMIZATION.md)

---

## 📝 Changelog

### 2025-12-22
- **Created:** Initial safe area guidelines document
- **Sprint:** 028 - UI/UX Optimization (Task 5)
- **Author:** Copilot Agent
- **Status:** Official Style Guide

---

## 💡 Quick Reference

### CSS Variables Available

```css
/* Standard CSS safe-area */
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);

/* Telegram Mini App safe-area */
--tg-safe-area-inset-top: 0px;
--tg-safe-area-inset-bottom: 0px;
--tg-safe-area-inset-left: 0px;
--tg-safe-area-inset-right: 0px;

/* Telegram Content safe-area (includes native buttons) */
--tg-content-safe-area-inset-top: 0px;
--tg-content-safe-area-inset-bottom: 0px;
--tg-content-safe-area-inset-left: 0px;
--tg-content-safe-area-inset-right: 0px;
```

### TailwindCSS Utilities

```tsx
// Top safe-area
className="pt-[max(env(safe-area-inset-top),1rem)]"

// Bottom safe-area
className="pb-[max(env(safe-area-inset-bottom),1rem)]"

// Left/Right safe-area
className="px-[max(env(safe-area-inset-left),1rem)]"

// Telegram + Standard (recommended for top)
className="pt-[max(var(--tg-content-safe-area-inset-top),env(safe-area-inset-top))]"
```

---

**For questions or clarifications, refer to Sprint 028 documentation or consult the development team.**
