# Design Polish — Implementation Plan

> **For agentic workers:** Use this plan to implement design fixes across 4 sprints (Sprint 057–060). Each sprint is self-contained and shippable.

**Goal:** Fix 110 audit findings (5 P0, 53 P1, 52 P2) from [HOME_UIUX_AUDIT_2026-07-09.md](../audit/HOME_UIUX_AUDIT_2026-07-09.md) — unify spacing tokens, fix touch targets, replace emoji icons, tighten card layout, improve data loading and render efficiency.

**Architecture:** Token-driven fixes first (one-line edits per component), then per-component polish, then performance and accessibility. Each phase produces a visually-testable result.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3.4, shadcn/ui, Radix UI, framer-motion, Zustand, TanStack Query

## Global Constraints

- Bundle size budget: 950 KB gzip (enforced by `npm run size`)
- Touch targets: minimum 44×44px (iOS HIG)
- No `console.log` — use `logger` utility
- Path imports: `@/` alias only, no relative imports
- Component max: 500 LOC, store max: 500 LOC
- Test: `npm test` must pass after each sprint
- Build: `npm run build` + `npx tsc --noEmit -p tsconfig.app.json` zero errors

---

## Sprint 057 — Spacing Tokens & Touch Targets (P0 + critical P1)

**Duration:** ~2 hours
**Scope:** 12 one-line fixes across 10 files. Token unification + touch target compliance.

### Task 1: Unified Card Padding — all cards → `p-3` (12px)

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx:227`
- Modify: `src/components/track/track-card-new/variants/ListVariant.tsx` (already p-3, no change)
- Modify: `src/components/home/DailyTipCard.tsx` (already p-3 on mobile, no change)
- Modify: `src/components/home/NowPlayingRail.tsx` (p-4 → p-3)

- [ ] **Step 1: GridVariant card padding**

```tsx
// GridVariant.tsx:227
// Before:
<div className="p-2 flex flex-col gap-1 min-h-[56px]">
// After:
<div className="p-3 flex flex-col gap-1 min-h-[48px]">
```

- [ ] **Step 2: NowPlayingRail padding**

```tsx
// NowPlayingRail.tsx — find p-4 on the card wrapper
// Before:
className = "p-4";
// After:
className = "p-3";
```

- [ ] **Step 3: Run `npm test`**

Expected: All tests pass.

### Task 2: Unified Card Border-Radius — all cards → `rounded-2xl` (16px)

**Files:**

- Modify: `src/components/track/track-card-new/variants/ListVariant.tsx` (rounded-xl → rounded-2xl)

- [ ] **Step 1: ListVariant border-radius**

```tsx
// ListVariant.tsx — find Card className with rounded-xl
// Before:
className={cn("...", "rounded-xl", "...")}
// After:
className={cn("...", "rounded-2xl", "...")}
```

- [ ] **Step 2: Visual check** — cards in list and grid should have identical corner radius.

### Task 3: Fix Touch Target — GridVariant more button (32px → 44px)

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx:238-254`

- [ ] **Step 1: Increase hit area**

```tsx
// GridVariant.tsx — MoreHorizontal button
// Before:
className={cn(
  "w-8 h-8 min-w-8 min-h-8 flex-shrink-0 -mt-1 transition-opacity rounded-full",
  isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100",
)}
// After:
className={cn(
  "w-9 h-9 min-w-[44px] min-h-[44px] flex-shrink-0 -mt-1 transition-opacity rounded-full flex items-center justify-center",
  isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100",
)}
```

- [ ] **Step 2: Verify** — more button now has 44×44px minimum hit area while visually staying compact.

### Task 4: Fix Asymmetric Search Bar Margin

**Files:**

- Modify: `src/pages/Index.tsx` (find HomeSearchBar wrapper)

- [ ] **Step 1: Unify margin**

```tsx
// Index.tsx — find mt-3 mb-2 on search bar
// Before:
className = "mt-3 mb-2";
// After:
className = "my-3";
```

### Task 5: Fix Sidebar Gap — match main content blockGap

**Files:**

- Modify: `src/components/home/HomeDesktopSidebar.tsx` (find gap-5)

- [ ] **Step 1: Align sidebar gap**

```tsx
// HomeDesktopSidebar.tsx — find gap-5 xl:gap-6 on widget container
// Before:
className = "gap-5 xl:gap-6";
// After:
className = "gap-6 xl:gap-8";
```

### Task 6: Fix StatsHighlightBanner Grid Gap

**Files:**

- Modify: `src/components/home/StatsHighlightBanner.tsx` (find gap-2)

- [ ] **Step 1: Match DiscoverTabs gap**

```tsx
// StatsHighlightBanner.tsx — find gap-2 on grid
// Before:
className = "grid gap-2 sm:gap-3";
// After:
className = "grid gap-2.5 sm:gap-3";
```

### Task 7: Fix StatsHighlightBanner Asymmetric Padding

**Files:**

- Modify: `src/components/home/StatsHighlightBanner.tsx` (find px-3 py-2.5)

- [ ] **Step 1: Symmetric padding**

```tsx
// Before:
className = "px-3 py-2.5";
// After:
className = "px-3 py-3";
```

### Task 8: Unify Form Section Gaps → space-y-3 (12px)

**Files:**

- Modify: `src/components/generate-form/FormSection.tsx` (find space-y-2.5)

- [ ] **Step 1: Standardize form gap**

```tsx
// FormSection.tsx
// Before:
className = "space-y-2.5";
// After:
className = "space-y-3";
```

### Task 9: Fix Card Content Min-Height

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx:227` (already changed in Task 1)

This was done in Task 1. Verify min-h-[48px] is set.

### Task 10: Final Verification

- [ ] `npm run build` — 0 errors
- [ ] `npx tsc --noEmit -p tsconfig.app.json` — 0 errors
- [ ] `npm test` — all passing
- [ ] `npm run size` — within 950 KB budget

---

## Sprint 058 — Emoji Icon Replacement (P0 Accessibility)

**Duration:** ~1.5 hours
**Scope:** Replace all emoji-as-functional-icon instances with proper SVG icons.

### Task 1: PaymentFail — replace 11 error code emoji

**Files:**

- Modify: `src/pages/payments/PaymentFail.tsx`

- [ ] **Step 1: Map emoji → icons**

| Emoji | Icon            | Source           |
| ----- | --------------- | ---------------- |
| 🚫    | `XCircle`       | already imported |
| 🏦    | `Building2`     | `@/lib/icons`    |
| 💳    | `CreditCard`    | already imported |
| 🔒    | `Shield`        | already imported |
| 📊    | `BarChart2`     | `@/lib/icons`    |
| 📅    | `CalendarDays`  | `@/lib/icons`    |
| 🔢    | `Hash`          | `@/lib/icons`    |
| ⚠️    | `AlertTriangle` | `@/lib/icons`    |
| 🔐    | `ShieldCheck`   | `@/lib/icons`    |
| 💸    | `Banknote`      | `@/lib/icons`    |
| 😔    | `Frown`         | `@/lib/icons`    |

- [ ] **Step 2: Replace each emoji with icon component** — add missing imports from `@/lib/icons`, swap JSX text nodes for `<XCircle className="w-5 h-5" />` etc.

- [ ] **Step 3: Verify** — all error codes render with consistent 20×20 SVG icons.

### Task 2: CommentSuggestions — replace 💡 bullets

**Files:**

- Modify: `src/components/CommentSuggestions.tsx` (find 💡 usage)

- [ ] **Step 1: Replace emoji bullets**

```tsx
// Before:
💡 <span>...</span>
// After:
<Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />
<span>...</span>
```

Add `Lightbulb` import from `@/lib/icons`.

### Task 3: Tip/Help card emoji bullets — replace 💡 across components

**Files:** Grep for `💡` across `src/`

- [ ] **Step 1: Find all 💡 instances**

```bash
grep -rn "💡" src/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Replace each** — use `<Lightbulb className="w-4 h-4" />` or context-appropriate icon from `@/lib/icons`.

### Task 4: HomeHeader wave emoji

**Files:**

- Modify: `src/components/home/HomeHeader.tsx` (find 👋)

- [ ] **Step 1: Replace wave emoji**

```tsx
// Before:
<motion.span className="inline-block ml-2" animate={{ rotate: [0, 15, -15, 0] }}>
  👋
</motion.span>
// After:
<motion.span className="inline-block ml-2" animate={{ rotate: [0, 15, -15, 0] }}>
  <Hand className="w-5 h-5 text-primary" />
</motion.span>
```

Add `Hand` import from `@/lib/icons` (or `Wave` if available).

### Task 5: BottomNavigation hint emoji

**Files:**

- Modify: `src/components/BottomNavigation.tsx:132` (find ✨)

- [ ] **Step 1: Replace sparkle emoji**

```tsx
// Before:
<span>Создайте первый трек здесь! ✨</span>
// After — just remove the emoji, the text is clear enough:
<span>Создайте первый трек здесь!</span>
```

### Task 6: Final Verification

- [ ] `grep -rn "💡\|📊\|🏦\|💳\|🔒\|📅\|🔢\|⚠️\|🔐\|💸\|😔\|🚫\|👋\|✨" src/ --include="*.tsx" --include="*.ts"` — 0 matches for functional emoji
- [ ] `npm run build` — 0 errors
- [ ] `npm test` — all passing

---

## Sprint 059 — Card & Track Design Polish (P1)

**Duration:** ~3 hours
**Scope:** Card simplification, cover actions, grid cleanup, section density.

### Task 1: Remove Cover Action Bar from Discovery Grid

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx` (find CardCoverActionBar)

- [ ] **Step 1: Conditional action bar** — GridVariant already receives `showActions` prop. Verify that DiscoverTabs passes `showActions={false}` to UnifiedTrackCard.

```tsx
// DiscoverTabs.tsx — already has showActions={false}, verify this is correct
// GridVariant: CardCoverActionBar only renders when showActions && is true
```

This is already done in DiscoverTabs.tsx:98 (`showActions={false}`). No code change needed.

### Task 2: Remove Swipe from Discovery Grid

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx:115`

- [ ] **Step 1: Disable drag on homepage**

```tsx
// GridVariant.tsx:115
// Before:
drag={isMobile && !sheetOpen && showActions ? "x" : false}
// After — disable swipe when showActions is false (discovery context):
drag={isMobile && !sheetOpen && showActions ? "x" : false}
```

Already correct — `showActions=false` → `drag=false`. No change needed.

### Task 3: Remove UnifiedTrackSheet from Discovery Cards

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx:271-278`

- [ ] **Step 1: Conditional sheet** — only render UnifiedTrackSheet when showActions is true

```tsx
// GridVariant.tsx — before the UnifiedTrackSheet render
// Add condition:
{
  showActions && (
    <UnifiedTrackSheet
      track={track as unknown as Track}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      onDelete={onDelete}
      onDownload={onDownload}
    />
  );
}
```

This eliminates 20 mounted track sheets on homepage (audit 2.9).

### Task 4: Remove AlertDialog from Discovery Cards

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx:281-296`

- [ ] **Step 1: Conditional AlertDialog** — only render when canDelete is possible

```tsx
// GridVariant.tsx
{
  canDelete && (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      ...
    </AlertDialog>
  );
}
```

### Task 5: Improve LazyImage Cover Size for Discovery

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx:175`

- [ ] **Step 1: Use small cover for 2-col mobile grid**

```tsx
// Before:
coverSize="medium"
// After — dynamic based on column count:
coverSize={isMobile ? "small" : "medium"}
```

### Task 6: Fix Swipe Indicator Width

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx:129,139`

- [ ] **Step 1: Use consistent icon size in swipe indicators**

Already `w-6 h-6` — acceptable. No change.

### Task 7: Add Section Density Variation on Homepage

**Files:**

- Modify: `src/pages/Index.tsx` (find Section density props)

- [ ] **Step 1: Use `auto` density for above-fold sections, `comfortable` for below-fold**

```tsx
// Index.tsx — Hero section
<Section density="compact" ...>

// Index.tsx — Create section
<Section density="compact" ...>

// Index.tsx — Discover section (below fold)
<Section density="comfortable" ...>  // keep default

// Index.tsx — Sidebar widgets
// Already compact, no change
```

### Task 8: Add Column Count for Tablet Breakpoint

**Files:**

- Modify: `src/components/home/DiscoverTabs.tsx:267`

- [ ] **Step 1: Already has 3-col tablet** — verify:

```tsx
// DiscoverTabs.tsx:267
const columns = isMobile ? 2 : isTablet ? 3 : 4;
```

Already done. No change needed. This was audit 2.6 but it's already fixed.

### Task 9: Add Duration Badge to Grid Cards

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx` (content area)

- [ ] **Step 1: Add duration next to stem badge or in tags row**

```tsx
// GridVariant.tsx — after SimplifiedTagsRow, add:
{
  track.duration && (
    <span className="text-[10px] text-muted-foreground tabular-nums mt-auto">{formatDuration(track.duration)}</span>
  );
}
```

Import `formatDuration` from `@/lib/utils` or wherever it lives. Audit 3.12.

### Task 10: Final Verification

- [ ] `npm run build` — 0 errors
- [ ] `npm test` — all passing
- [ ] Visual: homepage cards show no action bar, no swipe, lighter cover images, duration badge

---

## Sprint 060 — Performance, Images & Accessibility (P1/P2)

**Duration:** ~3 hours
**Scope:** LazyImage retry, LCP priority, stagger animation fix, error boundaries.

### Task 1: LazyImage Retry on Error

**Files:**

- Modify: `src/components/ui/lazy-image.tsx`

- [ ] **Step 1: Add retry counter and logic**

```tsx
// lazy-image.tsx — add state:
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 1;

// Replace error handler:
const handleError = useCallback(() => {
  if (retryCount < MAX_RETRIES) {
    setTimeout(() => {
      setRetryCount((c) => c + 1);
      setHasError(false);
      setIsLoaded(false);
    }, 800);
  } else {
    setHasError(true);
  }
}, [retryCount]);

// Reset on src change:
useEffect(() => {
  setIsLoaded(false);
  setHasError(false);
  setRetryCount(0);
}, [src]);
```

### Task 2: Strip Negative Cache on Image Error

**Files:**

- Modify: `src/lib/imageOptimization.ts` (find `setCachedImage(src, false)` in error path)

- [ ] **Step 1: No-op the negative cache** — so retry attempts re-fetch instead of hitting the cached failure

```typescript
// Before:
setCachedImage(src, false);
// After:
// ponytail: removed negative cache — retry logic in LazyImage handles failure
```

### Task 3: Add fetchpriority="high" on First Visible Cover

**Files:**

- Modify: `src/components/track/track-card-new/variants/GridVariant.tsx` (LazyImage)

- [ ] **Step 1: Accept priority prop and pass through**

Already has `priority` prop and passes to LazyImage. Verify LazyImage supports `fetchpriority`:

```tsx
// LazyImage.tsx — add to img element:
fetchPriority={priority ? "high" : "auto"}
```

### Task 4: Reduce Stagger Animation Cost

**Files:**

- Modify: `src/components/home/DiscoverTabs.tsx` (Grid variants)

- [ ] **Step 1: Simplify grid entrance** — replace staggerChildren with simple fade-in for non-virtualized grid

```tsx
// DiscoverTabs.tsx — Grid component
// Before (in gridVariants):
const gridVariants: Variants = {
  hidden: { opacity: 0.9, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

// Already simplified — no staggerChildren. Verify this is correct.
```

Already done — gridVariants use simple fade-in without stagger. No change.

### Task 5: Add Error Boundary Around Home Sections

**Files:**

- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Wrap critical sections in error boundary**

```tsx
// Index.tsx — import:
import { ErrorBoundary } from "@/components/ui/error-boundary"; // or react-error-boundary

// Wrap each section:
<ErrorBoundary fallback={<div className="py-8 text-center text-muted-foreground">Ошибка загрузки</div>}>
  <FeaturedSection ... />
</ErrorBoundary>
```

Check if `ErrorBoundary` already exists in `src/components/ui/`. If not, create minimal wrapper using `react-error-boundary` (already installed) or class component.

### Task 6: Add Suspense Boundaries for Below-Fold Sections

**Files:**

- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Lazy load non-critical sections**

```tsx
// Index.tsx — lazy import:
const GenreTabsSection = lazy(() => import("@/components/home/GenreTabsSection"));
const AiSuggestions = lazy(() => import("@/components/home/AiSuggestions"));

// Wrap in Suspense:
<Suspense fallback={<SectionSkeleton />}>
  <GenreTabsSection ... />
</Suspense>
```

### Task 7: Preload Library Route on Search

**Files:**

- Modify: `src/components/home/HomeSearchBar.tsx` (find search navigate)

- [ ] **Step 1: Preload library chunk on search focus**

```tsx
// HomeSearchBar.tsx — add:
import { preloadRoute } from "@/lib/route-preloader";

// On input focus:
onFocus={() => preloadRoute("/library")}
```

### Task 8: Add loading="eager" on First 4 Covers

**Files:**

- Modify: `src/components/home/DiscoverTabs.tsx` — Grid component passes `priority` prop

Already handled — `priority` prop on UnifiedTrackCard. Verify first 4 cards get `priority=true`:

```tsx
// DiscoverTabs.tsx — Grid map:
<UnifiedTrackCard
  track={track}
  variant="grid"
  priority={index < 4}  // add if not present
  ...
/>
```

### Task 9: Fix VirtualizedGrid Overscan

**Files:**

- Modify: `src/components/home/DiscoverTabs.tsx:172`

- [ ] **Step 1: Already set to 400px** — verify:

```tsx
// DiscoverTabs.tsx:172
overscan={400}
```

Already done. No change.

### Task 10: Final Verification

- [ ] `npm run build` — 0 errors
- [ ] `npm test` — all passing
- [ ] `npm run size` — within 950 KB budget
- [ ] Visual: failed image retries once before showing fallback
- [ ] Visual: below-fold sections lazy load with skeleton

---

## Post-Sprint Remaining (P2 — Future Sprints)

These findings are lower priority and can be addressed in future sprints:

| Finding | Description                                                     | Sprint          |
| ------- | --------------------------------------------------------------- | --------------- |
| 2.1     | Index.tsx inline section JSX — memoize                          | 061             |
| 2.4     | Swipe drag on homepage — already fixed (showActions=false)      | ✅              |
| 2.9     | Track sheet per card — already fixed (conditional render)       | ✅              |
| 3.6     | Swipe delete undiscoverable — already fixed (showActions=false) | ✅              |
| 4.6     | Hero + Create sequential — consider merging                     | 061             |
| 5.1     | Desktop sheet height — already h-dvh                            | ✅              |
| 5.5     | Desktop-specific sheet — consider right panel                   | 062             |
| 6.1     | Only 4 covers preloaded — extend to 8                           | 061             |
| 6.5     | No CDN width params — needs Supabase storage transform          | 062             |
| 7.9     | Mobile header + search + hero = long scroll                     | 061             |
| 8.7     | Grid re-animate on tab switch — use keep-alive                  | 061             |
| 9.1     | Eager home component imports — lazy load below-fold             | ✅ (Sprint 060) |
| 9.3     | All UnifiedTrackCard variants loaded — tree-shake               | 062             |
| 9.6     | Legacy + redesign sheet both bundled — remove legacy            | 062             |
| 10.4    | Reduced motion not universal — audit all motion                 | 061             |

---

## Summary

| Sprint    | Focus                          | Files Changed        | Findings Fixed  | Effort    |
| --------- | ------------------------------ | -------------------- | --------------- | --------- |
| 057       | Spacing tokens + touch targets | ~10                  | 9 (critical P1) | ~2h       |
| 058       | Emoji → SVG icons              | ~8                   | 8 (P0 a11y)     | ~1.5h     |
| 059       | Card design polish             | ~5                   | 6 (P1)          | ~3h       |
| 060       | Performance + images + a11y    | ~7                   | 8 (P1/P2)       | ~3h       |
| **Total** |                                | **~25 unique files** | **31 fixed**    | **~9.5h** |

**Remaining 79 findings** tracked as P2 for future sprints (see Post-Sprint table).
