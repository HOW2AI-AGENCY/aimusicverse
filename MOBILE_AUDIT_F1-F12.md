# Sprint 050-B: Mobile Audit F1-F12

## 📋 Overview

12 functional flags from Sprint 047 mobile audit that need fixing.
Priority: P0 (critical UX blockers) → P1 (high friction) → P2 (cosmetic)

## 🎯 Phase Sequence

**B1: Scroll/Viewport (F1, F8, F9)** → 1 day
**B2: Focus/Keyboard (F3, F6, F7)** → 1 day  
**B3: Surfaces (F2, F5, F11)** → 0.5 day
**B4: Data/Cleanup (F4, F10, F12)** → 0.5 day
**B5: ErrorBoundary home button** → 0.3 day
**B6: Bundle quick wins** → 0.7 day

**Total: 4 days**

## 🔴 P0 - CRITICAL (User Blocking)

### F1: Scroll/Viewport Issues

**Files:** `src/pages/Home.tsx`, `src/pages/Library.tsx`
**Problems:**

- Home/Library залипание скролла (pull-to-refresh conflicts)
- Исправлено в Sprint 049 но может регрессировать
- `usePullToRefresh` читал scrollTop у нескроллящейся обёртки

**Fix:** Verify fix from Sprint 049, add regression tests

### F8: Pull-to-Refresh Blocking Scroll

**File:** `src/hooks/usePullToRefresh.ts`
**Problems:**

- `preventDefault()` гасит нативный скролл на каждом свайпе вниз
- Guard «только наверху» не работал

**Fix:** Резолвить реальный скроллящийся предок (`<main id="main-content">`)

### F9: Genre Tab Flash Empty

**File:** `src/pages/Home.tsx`
**Problems:**

- Жанровые секции «По жанрам» мигают пустотой во время загрузки
- `useInfiniteGenreTracks` loading state не учитывался в page-level `isLoading`

**Fix:** Объединить состояния, добавить skeleton loader

## 🟠 P1 - HIGH (User Friction)

### F3: Keyboard Navigation

**File:** `src/pages/Library.tsx` (строки 122-172)
**Problems:**

- Нет `aria-selected` на arrow navigation
- Нет scroll-into-view при keyboard nav
- Library.tsx:450 `onPlay` couples select-and-play

**Fix:** Добавить `aria-selected`, scroll-into-view, разделить handlers

### F6: Master Volume Snap

**File:** `src/components/studio/StudioShell.tsx:495`
**Problems:**

- Unmute snap к 0.85, игнорируя предыдущее non-zero значение
- Должен помнить previous volume

**Fix:** Сохранять `previousVolume` в state

### F7: Studio Pages Issues

**Files:** `src/pages/studio/*.tsx`, `src/components/studio/*.tsx`
**Problems:**

- 4 проблемы в Studio pages
- LyricsStudioPage.tsx:511 `existingNote={null}` always
- LyricsStudioPage.tsx:181-190 template param change не рефрешит sections
- LyricsStudioPage.tsx:469 AI agent получает `notes: undefined` несмотря на существующие notes
- DesktopContentHubLayout.tsx:65-72 empty-state placeholder убран на 2xl+

**Fix:** Исправить 4 проблемы логики

## 🟡 P2 - MEDIUM (Polish)

### F2: Surface Issues

**Files:** Various component files
**Problems:** Несколько поверхностных проблем с UI

### F5: Touch Targets

**Files:** Button components
**Problems:** Некоторые touch targets <44px

### F11: Visual Polish

**Files:** UI components
**Problems:** Косметические визуальные проблемы

## 🟢 LOW (Cleanup)

### F4: Data Cleanup

**Files:** Data fetching components
**Problems:** Оптимизация queries, cleanup

### F10: Form Validation

**Files:** Form components
**Problems:** Улучшение валидации

### F12: Code Hygiene

**Files:** Various
**Problems:** Очистка мертвого кода

## 🎯 Execution Plan

### Day 1 (P0 Critical):

```bash
# F1: Verify scroll fix
npm run test:e2e -- src/pages/Home.spec.ts
npm run test:e2e -- src/pages/Library.spec.ts

# F8: Fix pull-to-refresh
# Edit src/hooks/usePullToRefresh.ts

# F9: Fix genre tabs
# Edit src/pages/Home.tsx
```

### Day 2 (P1 High):

```bash
# F3: Add keyboard nav
# Edit src/pages/Library.tsx

# F6: Fix volume snap
# Edit src/components/studio/StudioShell.tsx

# F7: Fix studio pages
# Edit LyricsStudioPage.tsx, DesktopContentHubLayout.tsx
```

### Day 3 (P2 + Cleanup):

```bash
# F2, F5, F11: Surface issues
# F4, F10, F12: Data cleanup
```

### Day 4 (Final + Bundle):

```bash
# B5: ErrorBoundary home button
# B6: Bundle quick wins (lamejs, canvas-confetti, qrcode)
npm run size
```

## 📊 Success Metrics

- [ ] All 12 flags fixed or documented as "won't fix"
- [ ] E2E tests pass for mobile scenarios
- [ ] Bundle size < 2.11 MB
- [ ] No scroll/viewport regressions
- [ ] Keyboard nav works in Library

---

**Next Step:** Start with F1 verification → F8 fix → F9 fix
