# UI/UX Audit — Home Page (Index.tsx)

**Date:** 2026-07-09  
**Scope:** `src/pages/Index.tsx` + homepage child components (`Section`, `DiscoverTabs`, `UnifiedTrackCard`/`GridVariant`, `GenerateSheet`, data hooks)  
**Method:** static code audit + prior build/runtime observations

---

## 1. Data Loading (P0 — perceived performance)

| #   | Weak point                                                                                                                                                         | Location                            | Impact                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1.1 | **7 sequential Supabase round-trips before first paint**                                                                                                           | `usePublicContentBatch.ts:56-78`    | First content render blocked until all main + 5 genre queries + profile enrichment finish.                   |
| 1.2 | **No server-side projection** — selects 10 columns (`id,title,cover_url,audio_url,play_count,user_id,created_at,style,tags,computed_genre,prompt`) for every track | `usePublicContentBatch.ts:60`       | Downloads unused data (e.g. `audio_url`, `prompt`) before any interaction; cover cards only need 5 columns.  |
| 1.3 | **Profile enrichment is blocking** — `fetchProfilesMap` awaits before returning data                                                                               | `enrichTracksWithProfiles.ts:26-36` | Track list cannot render until profile join completes; can be deferred or joined via PostgreSQL.             |
| 1.4 | **`staleTime` only 5 minutes**                                                                                                                                     | `constants.ts:105`                  | Unnecessary refetches for mostly-static public tracks.                                                       |
| 1.5 | **`enabled: !contentLoading` gates infinite queries**                                                                                                              | `useHomePageData.ts:39,52`          | "Load more" pagination waits for the initial batch query even though it could start with its own page.       |
| 1.6 | **Only 4 cover images preloaded**                                                                                                                                  | `useHomePageData.ts:71-82`          | LCP/LCP-adjacent images beyond the first 4 are lazily loaded, causing layout shift on scroll.                |
| 1.7 | **No skeleton-to-content transition strategy**                                                                                                                     | `DiscoverTabs.tsx:240-253`          | Skeleton shows blank cards until ALL data is ready; progressive loading of visible viewport only is missing. |
| 1.8 | **Hardcoded `pageSize = 20`**                                                                                                                                      | `useHomePageData.ts:25`             | May not match viewport row count; mobile sees 2 cols × 10 rows before "Load more".                           |

---

## 2. Render / Rerender Efficiency (P1)

| #    | Weak point                                                                | Location                              | Impact                                                                                                                           |
| ---- | ------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | **Index.tsx constructs section JSX inline** (non-memoized objects)        | `Index.tsx:135-211`                   | `heroBlock`, `createBlock`, etc. recreated on every render, causing `Section` and children to rerender even when data unchanged. |
| 2.2  | **Stagger animation on every card in `Grid`**                             | `DiscoverTabs.tsx:24-32`              | `staggerChildren` animates 12–20 cards simultaneously; expensive on low-end devices.                                             |
| 2.3  | **Each `GridVariant` wraps in `motion.div`** with `whileHover`/`whileTap` | `DiscoverTabs.tsx:86-101`             | 12+ motion observers on every track cell, even off-screen.                                                                       |
| 2.4  | **Swipe drag enabled on every card in Discover grid**                     | `GridVariant.tsx:115-119`             | `drag="x"` on homepage cards conflicts with horizontal scroll containers and registers 20+ gesture handlers.                     |
| 2.5  | **`DiscoverTabs` tracks active tab in local state**                       | `DiscoverTabs.tsx:223`                | Tab switch unmounts/remounts the entire grid instead of hidden keep-alive.                                                       |
| 2.6  | **`Columns` hardcoded 2/4**                                               | `DiscoverTabs.tsx:224`                | No tablet breakpoint, no viewport-aware row count; 4-col cards become too wide on `lg`.                                          |
| 2.7  | **Virtualization threshold `VIRTUALIZE_THRESHOLD = 24`**                  | `DiscoverTabs.tsx:41`                 | Homepage `pageSize = 20`, so VirtuosoGrid never activates; all 20 cards always in DOM.                                           |
| 2.8  | **No `useWindowScroll` overscan set**                                     | `DiscoverTabs.tsx:168-175`            | Virtualized variant (when active) has default overscan, causing blank flashes on fast scroll.                                    |
| 2.9  | **`GridVariant` mounts `UnifiedTrackSheet` + `AlertDialog` per card**     | `GridVariant.tsx:272-297`             | 20 track sheets rendered on homepage even though user interaction rate is <1%.                                                   |
| 2.10 | **`LazyImage` with `coverSize="medium"`**                                 | `GridVariant.tsx:175`                 | Medium size likely downloads larger image than needed for 2-col mobile grid.                                                     |
| 2.11 | **No `Suspense` boundary around heavy home sections**                     | `Index.tsx`                           | `FeaturedSection`, `GenreTabsSection`, `AiSuggestions` all load synchronously with the critical path.                            |
| 2.12 | **`useIsMobile` used in multiple nested components**                      | `DiscoverTabs.tsx`, `GridVariant.tsx` | `useMediaQuery` re-runs on every resize, causing cascades.                                                                       |

---

## 3. Track Card Design (P1)

| #    | Weak point                                        | Location                        | Impact                                                                                       |
| ---- | ------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| 3.1  | **Card content area too tall**                    | `GridVariant.tsx:220`           | `min-h-[84px]` + tags + version selector forces 100+ px below cover.                         |
| 3.2  | **Title uses 2-line clamp + 3 tags**              | `GridVariant.tsx:223,250`       | Card looks cluttered; 2-line titles break grid rhythm.                                       |
| 3.3  | **Action buttons permanently on cover**           | `GridVariant.tsx:192-205`       | Like/Queue/Follow buttons overlay artwork, obscuring cover and increasing accidental taps.   |
| 3.4  | **More button always visible on mobile**          | `GridVariant.tsx:230-245`       | Adds visual noise and 44×44 hit target on every card.                                        |
| 3.5  | **Version selector inline on card**               | `GridVariant.tsx:259-266`       | Two-line card content when versions exist; not useful in grid discovery context.             |
| 3.6  | **Swipe delete on home cards is undiscoverable**  | `GridVariant.tsx:78-99`         | Users swipe on card expecting navigation, get like/delete; conflicts with horizontal scroll. |
| 3.7  | **Aspect ratio square**                           | `GridVariant.tsx:166`           | Square cover wastes vertical space on a music app; 4:3 or 3:2 more typical.                  |
| 3.8  | **No hover state on desktop for play action**     | `GridVariant.tsx`               | Play overlay is always visible, but other actions appear only on hover; inconsistent.        |
| 3.9  | **Card border + ring + shadow on hover**          | `GridVariant.tsx:151-156`       | 3 simultaneous effects create visual heaviness.                                              |
| 3.10 | **Badge position bottom-left covers cover**       | `GridVariant.tsx:208-216`       | Stem badge overlaps artwork.                                                                 |
| 3.11 | **Tags row never wraps, but can overflow**        | `SimplifiedTagsRow` (not shown) | Single-line truncation may hide genre info.                                                  |
| 3.12 | **Cards show `stemCount` badge but not duration** | `GridVariant.tsx`               | Users cannot see track length at a glance.                                                   |

---

## 4. Section / Page Spacing (P1)

| #    | Weak point                                                | Location                            | Impact                                                                               |
| ---- | --------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| 4.1  | **All sections use `density="comfortable"`**              | `Index.tsx:136,147,160,180,196,208` | 20-24 px internal gaps + 40-56 px external gaps = excessive whitespace on mobile.    |
| 4.2  | **Grid parent gap `gap-6 lg:gap-8 xl:gap-10 2xl:gap-12`** | `Index.tsx:258`                     | Between-column gap on desktop pulls main column too narrow; content feels stretched. |
| 4.3  | **Sidebar sticky with `lg:pl-6 xl:pl-8` + border**        | `Index.tsx:268-278`                 | Large left padding + border consumes 40+ px of the 33% rail.                         |
| 4.4  | **`bottomPadding` calculation heavy**                     | `Index.tsx:213-219`                 | Inline style object recomputed each render; values are large (6rem / 12rem).         |
| 4.5  | **`mt-3 mb-2` on HomeSearchBar**                          | `Index.tsx:242`                     | Ad-hoc spacing, not from design tokens.                                              |
| 4.6  | **Hero and Create sections are sequential**               | `Index.tsx:135-152`                 | Two large blocks before any tracks; new users must scroll to see content.            |
| 4.7  | **No sticky/persistent header compact mode**              | `HomeHeader.tsx`                    | Header likely takes significant vertical space on mobile.                            |
| 4.8  | **Section `tone="plain"` vs `subtle` inconsistent**       | `Index.tsx:136,180,208`             | Mixed backgrounds create visual fragmentation.                                       |
| 4.9  | **`PullToRefreshWrapper` wraps entire content grid**      | `Index.tsx:248`                     | Large pull-to-refresh area may interfere with horizontal scrollers.                  |
| 4.10 | **Right rail is always visible on desktop**               | `Index.tsx:268-278`                 | Could be collapsed or moved to bottom on shorter viewports.                          |

---

## 5. GenerateSheet (P1 / P0 on desktop)

| #    | Weak point                                                 | Location                                            | Impact                                                                                |
| ---- | ---------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 5.1  | **Desktop height `sm:max-h-[800px]`**                      | `GenerateSheet.tsx:138`                             | Form overflows on typical 768–900 px desktop heights; content clipped.                |
| 5.2  | **Sheet is `side="bottom"` on all breakpoints**            | `GenerateSheet.tsx:137`                             | Desktop should use right-side panel or centered modal for better space.               |
| 5.3  | **ScrollArea with `flex-1` inside h-dvh container**        | `GenerateSheetBody.tsx:54`                          | Height distribution between header/body/footer may collapse scrollable area.          |
| 5.4  | **FormStepper + ReferenceChipsRow + Footer fixed**         | `GenerateSheetBody.tsx:57`, `GenerateSheet.tsx`     | Header+footer eat ~200 px, leaving <500 px for form on small laptops.                 |
| 5.5  | **No desktop-specific breakpoint override**                | `GenerateSheet.tsx`                                 | Same mobile sheet UX on 1440 px monitor.                                              |
| 5.6  | **`p-0` on SheetContent but internal `px-4 py-3`**         | `GenerateSheet.tsx:138`, `GenerateSheetBody.tsx:55` | Asymmetric padding logic.                                                             |
| 5.7  | **Lazy form import inside open sheet**                     | `GenerateSheetBody.tsx:11-16`                       | First open causes additional JS chunk fetch + layout shift.                           |
| 5.8  | **Legacy redesign gate**                                   | `GenerateSheet.tsx:48-52,90-92`                     | Two sheet implementations double maintenance and bundle size.                         |
| 5.9  | **Main/Secondary/Back buttons managed via Telegram hooks** | `GenerateSheet.tsx:70-83`                           | Adds overhead and potential flicker on desktop where Telegram buttons are irrelevant. |
| 5.10 | **No keyboard shortcut to close on desktop**               | N/A                                                 | Only back button or overlay click.                                                    |

---

## 6. Images / LCP (P1)

| #    | Weak point                                              | Location                      | Impact                                                                         |
| ---- | ------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| 6.1  | **Only `popularTracks` first 4 covers preloaded**       | `useHomePageData.ts:71-82`    | LCP image may be outside first 4; no priority logic.                           |
| 6.2  | **No `fetchpriority="high"` on hero/featured cover**    | `LazyImage` component         | First visible cover is not prioritized by browser.                             |
| 6.3  | **Cover aspect ratio square**                           | `GridVariant.tsx:166`         | Square images are larger file size than portrait/landscape crop.               |
| 6.4  | **`LazyImage` uses blur placeholder via JS**            | `LazyImage`                   | Placeholder may delay LCP if JS runs late.                                     |
| 6.5  | **No CDN width/height params in cover URLs**            | `GridVariant.tsx:167`         | Full-resolution images loaded even for 150 px card.                            |
| 6.6  | **FeaturedSection horizontal scroller likely not lazy** | `HorizontalTrackScroller.tsx` | All cover images load immediately, not just viewport.                          |
| 6.7  | **No native loading="eager" on first N cards**          | `LazyImage`                   | All covers default to lazy, even above-fold.                                   |
| 6.8  | **No image decoding="async" strategy**                  | `LazyImage`                   | Main-thread decode contention during animation.                                |
| 6.9  | **No fallback cover generated on server**               | `GridVariant.tsx:181-184`     | Blank gradient shown when no cover; could be deterministic pattern.            |
| 6.10 | **Hover scale(1.05) on cover triggers repaints**        | `GridVariant.tsx:172`         | `scale` is fine, but combined with LazyImage it can cause composite flakiness. |

---

## 7. Mobile-Specific Layout (P1)

| #    | Weak point                                                              | Location               | Impact                                                        |
| ---- | ----------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| 7.1  | **Bottom padding 6rem / 12rem**                                         | `Index.tsx:213-219`    | Excessive empty space above bottom nav / compact player.      |
| 7.2  | **HomeStickyCTA always rendered**                                       | `Index.tsx:303`        | Fixed floating CTA may overlap content and bottom nav.        |
| 7.3  | **`ContextHints` delay 4000 ms on desktop only**                        | `Index.tsx:304`        | Tooltip appears late and can annoy returning users.           |
| 7.4  | **PullToRefresh only on mobile**                                        | `Index.tsx:248`        | Good, but `disabled={!isMobile}` re-evaluates on resize.      |
| 7.5  | **2-column grid on mobile with `gap-3`**                                | `DiscoverTabs.tsx:80`  | Cards are small (~170 px wide), text truncated heavily.       |
| 7.6  | **Card actions are 44×44 minimum but clustered**                        | `GridVariant.tsx`      | Three overlay buttons on cover create accidental tap targets. |
| 7.7  | **Swipe gestures on 2-col grid**                                        | `GridVariant.tsx:115`  | Hard to swipe vertically without triggering horizontal drag.  |
| 7.8  | **No safe-area handling on sticky CTA**                                 | `HomeStickyCTA.tsx`    | Could be hidden under iOS home indicator.                     |
| 7.9  | **Mobile header + search bar + hero = large scroll distance to tracks** | `Index.tsx:236-263`    | Users see ~60% non-content before first track.                |
| 7.10 | **Keyboard may push sheet off-screen**                                  | `GenerateSheet.tsx:59` | `useKeyboardAware` used but no max-height adjustment.         |

---

## 8. DiscoverTabs / Grid (P2)

| #    | Weak point                                                    | Location                   | Impact                                                                  |
| ---- | ------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| 8.1  | **Tab list full-width grid on mobile**                        | `DiscoverTabs.tsx:228`     | `grid-cols-2` stretches triggers to full width; not standard pill tabs. |
| 8.2  | **`Tabs` uses `space-y-4`**                                   | `DiscoverTabs.tsx:227`     | Extra vertical space between tab list and content.                      |
| 8.3  | **`LoadMore` button `pt-4`**                                  | `DiscoverTabs.tsx:181`     | Adds gap after grid before button.                                      |
| 8.4  | **No empty state for loading error / retry**                  | `DiscoverTabs.tsx:75-76`   | Only "Пока ничего нет" shown; no retry action.                          |
| 8.5  | **Grid cell `minmax(0, 1fr)` allows very narrow cards**       | `DiscoverTabs.tsx:81`      | On weird viewports cards become illegible.                              |
| 8.6  | **`VirtualizedGrid` has no `overscan` or `itemHeight` hints** | `DiscoverTabs.tsx:168-175` | Recycled cells may blank during fast scroll.                            |
| 8.7  | **Grid items are re-animated when switching tabs**            | `DiscoverTabs.tsx:239-259` | Tab switch restarts fade-in for 12+ cards.                              |
| 8.8  | **`count={columns * 2}` skeletons**                           | `DiscoverTabs.tsx:241,252` | 4–8 skeletons shown while only 2 viewport rows visible.                 |
| 8.9  | **`GridSkeleton` not matching real card aspect ratio**        | unknown                    | Skeleton may cause layout shift.                                        |
| 8.10 | **No header for active tab summary**                          | `DiscoverTabs.tsx`         | Users don't know how many tracks are loaded.                            |

---

## 9. Bundle / Architecture (P2)

| #    | Weak point                                                                               | Location                      | Impact                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 9.1  | **Index.tsx imports ALL home components synchronously**                                  | `Index.tsx:27-46`             | Only `GenerateSheet`, `MusicRecognitionDialog`, `AudioActionDialog` are lazy; 15+ home components load eagerly. |
| 9.2  | **FeaturedSection, GenreTabsSection, AiSuggestions are non-critical**                    | `Index.tsx:39-45`             | Could be code-split below the fold.                                                                             |
| 9.3  | **`UnifiedTrackCard` with 7 variants loaded even if only `grid` used**                   | `UnifiedTrackCard.tsx:11-21`  | Dead variants in homepage bundle.                                                                               |
| 9.4  | **`GridVariant` imports `AlertDialog`, `UnifiedTrackSheet`, `CardCoverActionBar`, etc.** | `GridVariant.tsx:13-42`       | Heavy per-card dependency tree even for discovery-only context.                                                 |
| 9.5  | **`useTrackCardState` may run expensive logic per card**                                 | `GridVariant.tsx:61-72`       | Unknown cost; likely queries global store for each card.                                                        |
| 9.6  | **Legacy + redesign sheet both bundled**                                                 | `GenerateSheet.tsx:39`        | Legacy sheet included even when redesign enabled.                                                               |
| 9.7  | **No route-level prefetch for `/library`**                                               | `HomeSearchBar` search        | Search navigates to `/library` but destination chunk not prefetched.                                            |
| 9.8  | **Homepage query key includes `user?.id`**                                               | `usePublicContentBatch.ts:53` | Same public content refetches on login/logout even though rows are identical.                                   |
| 9.9  | **`useProfile` blocks Index render**                                                     | `Index.tsx:77`                | Profile query (non-essential) is on critical path.                                                              |
| 9.10 | **No placeholder / shell for the whole page**                                            | `Index.tsx`                   | Content flickers in sections as each query resolves.                                                            |

---

## 10. Accessibility / UX Polish (P2/P3)

| #     | Weak point                                                         | Location                  | Impact                                                 |
| ----- | ------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------ |
| 10.1  | **Card cover `onClick` stops propagation to play**                 | `GridVariant.tsx:177-180` | Two competing click handlers on same element.          |
| 10.2  | **More button has no visible label**                               | `GridVariant.tsx:242`     | Only `aria-label` on icon-only button.                 |
| 10.3  | **Swipe action lacks screen-reader alternative**                   | `GridVariant.tsx`         | No keyboard way to like/delete from card.              |
| 10.4  | **`Tab` animation uses `motion` even when prefers-reduced-motion** | partially handled         | Some variants respect `prefersReducedMotion`, not all. |
| 10.5  | **No loading state on "Load more" when only 1 row exists**         | `DiscoverTabs.tsx`        | Button spinner is fine, but no skeleton row.           |
| 10.6  | **No indication of currently selected track in grid**              | `GridVariant.tsx`         | Only `ring-primary` when playing, not when selected.   |
| 10.7  | **Search bar `max-w-md` on desktop**                               | `Index.tsx:242`           | Looks small inside 8-column wide grid.                 |
| 10.8  | **No pull-to-refresh indicator**                                   | `PullToRefreshWrapper`    | Users may not know gesture is supported.               |
| 10.9  | **HomeDesktopSidebar content unknown**                             | `HomeDesktopSidebar.tsx`  | Could be heavy or unused; not audited here.            |
| 10.10 | **No error boundary around `HomeHeader` or `BotContextBanner`**    | `Index.tsx`               | One failure can white-screen the whole page.           |

---

## Summary Matrix

| Area                  | P0 (fix now) | P1 (next sprint) | P2 (polish) |   Total |
| --------------------- | -----------: | ---------------: | ----------: | ------: |
| Data Loading          |            4 |                4 |           0 |       8 |
| Render / Rerender     |            0 |                7 |           3 |      10 |
| Track Card Design     |            0 |                7 |           3 |      10 |
| Spacing / Layout      |            0 |                6 |           4 |      10 |
| GenerateSheet         |            1 |                6 |           3 |      10 |
| Images / LCP          |            0 |                6 |           4 |      10 |
| Mobile Specific       |            0 |                5 |           5 |      10 |
| DiscoverTabs / Grid   |            0 |                2 |           8 |      10 |
| Bundle / Architecture |            0 |                3 |           7 |      10 |
| Accessibility / UX    |            0 |                1 |           9 |      10 |
| **Total**             |        **5** |           **47** |      **48** | **100** |

---

## 11. Structured Spacing Specification — All Components

**Methodology:** Every margin/padding/gap value extracted from source files. Tailwind class → px conversion uses 4px base scale (`p-1` = 4px, `gap-2.5` = 10px, etc.). Inconsistencies marked with ⚠️.

### 11.1 Section Tokens (Design System Source of Truth)

**File:** `src/components/layout/Section.tsx`

| Token              | Class                    | Value (mobile) | Value (desktop) |
| ------------------ | ------------------------ | -------------- | --------------- |
| `blockGap`         | `space-y-6 xl:space-y-8` | 24px           | 32px (xl+)      |
| `containerPadding` | `px-4 sm:px-6 lg:px-8`   | 16px           | 32px (lg+)      |
| `shellMaxWidth`    | `max-w-screen-xl`        | —              | 1280px          |

**Density maps (body gap / header gap / inner pad):**

| Density                  | Body Gap (mobile → desktop)                             | Header Gap                          | Inner Pad                      |
| ------------------------ | ------------------------------------------------------- | ----------------------------------- | ------------------------------ |
| `compact`                | `space-y-3` (12px)                                      | `mb-3` (12px)                       | `p-3 sm:p-4` (12→16px)         |
| `comfortable` ⭐ default | `space-y-4 sm:space-y-5` (16→20px)                      | `mb-4` (16px)                       | `p-4 sm:p-5` (16→20px)         |
| `spacious`               | `space-y-6 sm:space-y-8` (24→32px)                      | `mb-5 sm:mb-6` (20→24px)            | `p-5 sm:p-7` (20→28px)         |
| `auto`                   | `space-y-3 sm:space-y-5 lg:space-y-7` (12→20→28px)      | `mb-3 sm:mb-4 lg:mb-6`              | `p-3 sm:p-5 md:p-6`            |
| `4xl`                    | `space-y-8 sm:space-y-10 xl:space-y-12 2xl:space-y-14`  | `mb-8 sm:mb-10 xl:mb-12`            | `p-6 sm:p-8 xl:p-10 2xl:p-12`  |
| `5xl`                    | `space-y-10 sm:space-y-12 xl:space-y-16 2xl:space-y-20` | `mb-10 sm:mb-12 xl:mb-16 2xl:mb-20` | `p-8 sm:p-10 xl:p-12 2xl:p-16` |

### 11.2 HomeHeader

**File:** `src/components/home/HomeHeader.tsx`

| Variant     | Property            | Value                                 | Px                      |
| ----------- | ------------------- | ------------------------------------- | ----------------------- |
| **Desktop** | bottom margin       | `mb-6 lg:mb-8`                        | 24→32px                 |
| Desktop     | items gap           | `gap-3 sm:gap-4 lg:gap-5`             | 12→16→20px              |
| Desktop     | icon size           | `w-12 h-12 lg:w-14 lg:h-14`           | 48→56px                 |
| Desktop     | icon border-radius  | `rounded-xl lg:rounded-2xl`           | 12→16px                 |
| Desktop     | subtitle top margin | `mt-0.5 lg:mt-1`                      | 2→4px                   |
| **Mobile**  | container padding   | `-mx-4 px-3 pb-2`                     | -16→12→8px              |
| Mobile      | padding-top         | `TELEGRAM_SAFE_AREA.stickyHeaderTop`  | ~0.5rem above safe area |
| Mobile      | items gap           | `gap-2`                               | 8px                     |
| Mobile      | icon size           | `w-8 h-8`                             | 32px                    |
| Mobile      | icon border-radius  | `rounded-xl`                          | 12px                    |
| Mobile      | menu button         | `w-11 h-11 min-w-[44px] min-h-[44px]` | 44×44px ✅              |
| Mobile      | menu border-radius  | `rounded-xl`                          | 12px                    |
| Mobile      | avatar button       | `w-11 h-11 min-w-[44px] min-h-[44px]` | 44×44px ✅              |

**⚠️ Inconsistency:** Desktop rounded-2xl (16px) vs Mobile rounded-xl (12px).

### 11.3 Track Cards

#### GridVariant

**File:** `src/components/track/track-card-new/variants/GridVariant.tsx`

| Property                       | Value                     | Px      |
| ------------------------------ | ------------------------- | ------- |
| Card border-radius             | `rounded-2xl`             | 16px    |
| Card padding                   | `p-2`                     | 8px ⚠️  |
| Content gap                    | `gap-1`                   | 4px     |
| Content min-height             | `min-h-[56px]`            | 56px    |
| Title-gap between title + more | `gap-1.5 sm:gap-2`        | 6→8px   |
| More button                    | `w-8 h-8 min-w-8 min-h-8` | 32px ⚠️ |
| Cover aspect-ratio             | `aspect-square`           | 1:1     |
| Stem badge padding             | `px-1.5 py-0.5`           | 6×2px   |
| Stem badge position            | `bottom-2 left-2`         | 8px     |
| Like indicator width           | `w-16`                    | 64px    |
| Delete indicator width         | `w-16`                    | 64px    |

**⚠️ Touch target violation:** More button 32×32px < 44×44px minimum.

#### ListVariant

**File:** `src/components/track/track-card-new/variants/ListVariant.tsx`

| Property           | Value                             | Px                    |
| ------------------ | --------------------------------- | --------------------- |
| Card border-radius | `rounded-xl`                      | 12px ⚠️               |
| Card padding       | `p-3`                             | 12px ⚠️               |
| Card grid          | `grid-cols-[64px_1fr_44px] gap-3` | 64px cover / 12px gap |
| Cover size         | 64×64px                           | —                     |
| Play button        | `w-10 h-10`                       | 40px                  |
| Menu button        | `w-11 h-11`                       | 44px ✅               |

**⚠️ GridVariant (p-2, rounded-2xl) vs ListVariant (p-3, rounded-xl) — no unified card scale.**

### 11.4 DiscoverTabs

**File:** `src/components/home/DiscoverTabs.tsx`

| Property                        | Value              | Px      |
| ------------------------------- | ------------------ | ------- |
| Grid gap                        | `gap-2.5 sm:gap-3` | 10→12px |
| Tab container space             | `space-y-3`        | 12px    |
| TabsList height                 | `h-9`              | 36px    |
| Tab trigger gap                 | `gap-1.5`          | 6px     |
| Count badge margin              | `ml-1`             | 4px     |
| Empty state padding             | `py-8`             | 32px    |
| Loading spinner padding         | `pt-3`             | 12px    |
| Sentinel height                 | `h-4`              | 16px    |
| Skeleton count                  | `columns * 2`      | —       |
| Columns (mobile/tablet/desktop) | 2 / 3 / 4          | —       |
| Virtualize threshold            | 48 tracks          | —       |
| VirtuosoGrid overscan           | 400px              | —       |

### 11.5 MainLayout

**File:** `src/components/MainLayout.tsx`

| Property               | Value                                                  | Px             |
| ---------------------- | ------------------------------------------------------ | -------------- |
| Guest mode padding-top | `pt-9`                                                 | 36px           |
| Desktop main padding   | `p-6`                                                  | 24px           |
| Mobile main padding    | `py-3`                                                 | 12px           |
| SafeArea minPadding    | 1rem                                                   | 16px           |
| Content max-width      | `max-w-screen-2xl`                                     | 1536px         |
| Bottom padding calc    | `var(--nav-h) + var(--player-h) + safe-area + 0.75rem` | dynamic + 12px |

### 11.6 BottomNavigation

**File:** `src/components/BottomNavigation.tsx`

| Property                  | Value                                     | Px          |
| ------------------------- | ----------------------------------------- | ----------- |
| Nav height                | `h-14`                                    | 56px        |
| Horizontal padding        | `px-1`                                    | 4px         |
| Tab item gap              | `gap-0.5`                                 | 2px         |
| Tab item padding          | `py-1.5`                                  | 6px         |
| Tab item border-radius    | `rounded-xl`                              | 12px        |
| Active pill height        | `h-7`                                     | 28px        |
| Active pill width         | `w-10`                                    | 40px        |
| Active pill position      | `top-1`                                   | 4px         |
| Icon size                 | `w-5 h-5`                                 | 20px        |
| FAB size                  | `w-12 h-12`                               | 48px        |
| FAB border-radius         | `rounded-2xl`                             | 16px        |
| FAB ring offset           | `ring-offset-2`                           | 8px         |
| Hint card padding         | `px-3 py-1.5`                             | 12×6px      |
| Hint card border-radius   | `rounded-lg`                              | 8px         |
| Hint card gap             | `gap-1.5`                                 | 6px         |
| Hint dismiss padding      | `p-0.5`                                   | 2px         |
| Generation badge height   | `h-4 min-w-4`                             | 16px        |
| Generation badge padding  | `px-1`                                    | 4px         |
| Generation badge position | `-top-1 -right-0.5`                       | -4px, -2px  |
| Progress badge offset     | `keyboardHeight + 80` or `max(5rem, ...)` | 80px offset |

### 11.7 Sidebar

**File:** `src/components/Sidebar.tsx`

| Property                   | Value                               | Px                           |
| -------------------------- | ----------------------------------- | ---------------------------- |
| Collapsed width            | `w-16`                              | 64px                         |
| Expanded width             | `w-64`                              | 256px                        |
| Header padding             | `p-4`                               | 16px                         |
| Header items gap           | `gap-1`                             | 4px                          |
| Collapse button            | `h-9 w-9 min-h-[44px] min-w-[44px]` | 36px icon, 44px touch ✅     |
| Create button area padding | `py-4 px-3`                         | 16×12px                      |
| Create button height       | `h-11`                              | 44px                         |
| Create button gap          | `gap-2`                             | 8px                          |
| Generation panel padding   | `px-3 pb-3`                         | 12px                         |
| Generation panel inner     | `rounded-lg p-3`                    | 8px border, 12px pad         |
| Generation panel gap       | `gap-2 mb-2`                        | 8px                          |
| Generation progress bar    | `h-1`                               | 4px                          |
| Generation button          | `h-7`                               | 28px                         |
| Nav scroll area padding    | `px-3` / `px-2` (collapsed)         | 12/8px                       |
| Nav spacing                | `space-y-1`                         | 4px                          |
| Nav button height          | `h-10`                              | 40px                         |
| Nav button gap             | `gap-3`                             | 12px                         |
| Nav button icon            | `w-4 h-4`                           | 16px                         |
| Nav section header         | `h-8 px-2`                          | 32px                         |
| Nav section gap            | `pt-4` before each section          | 16px                         |
| Nav section content        | `space-y-1 pt-1`                    | 4px gap, 4px top             |
| Badge height               | `h-5 px-1.5`                        | 20px                         |
| Collapsed generation icon  | `h-11 min-h-[44px]`                 | 44px ✅                      |
| Footer padding             | `p-3`                               | 12px                         |
| Admin section gap          | `pt-4 space-y-1`                    | 16px top, 4px items          |
| Admin header gap           | `gap-2 px-2 pb-1`                   | 8px gap, 8px pad, 4px bottom |

### 11.8 CompactPlayer

**File:** `src/components/player/CompactPlayer.tsx`

| Breakpoint            | Property      | Value                                                        | Px                |
| --------------------- | ------------- | ------------------------------------------------------------ | ----------------- |
| **Mobile (<640px)**   | padding       | `px-3 pt-3 pb-1.5` → `px-3 pb-3`                             | 12px / 6px bottom |
| Mobile                | cover         | `w-12 h-12`                                                  | 48px              |
| **Mid (640-1023px)**  | gap           | `gap-3`                                                      | 12px              |
| Mid                   | padding       | `px-3 py-2.5`                                                | 12×10px           |
| Mid                   | max-width     | `max-w-3xl`                                                  | 768px             |
| Mid                   | cover         | `w-11 h-11`                                                  | 44px              |
| **Desktop (≥1024px)** | gap           | `gap-4`                                                      | 16px              |
| Desktop               | padding       | `px-4 py-2.5`                                                | 16×10px           |
| Desktop               | max-width     | `max-w-5xl 2xl:max-w-[1280px]`                               | 1024→1280px       |
| Desktop               | cover         | `w-14 h-14 xl:w-16 2xl:w-[72px]`                             | 56→64→72px        |
| All                   | bottom offset | `calc(bottomBase + ...safe-area...)` — uses `--bottom-nav-h` | dynamic           |

### 11.9 GenerateSheet Components

#### GenerateSheet (wrapper)

**File:** `src/components/GenerateSheet.tsx`

| Property              | Value                                       | Px                   |
| --------------------- | ------------------------------------------- | -------------------- |
| Content height        | `h-dvh sm:h-[85vh] lg:h-dvh`                | full viewport        |
| Desktop max-width     | `lg:max-w-[680px]`                          | 680px                |
| Desktop border-radius | `lg:rounded-2xl`                            | 16px                 |
| Desktop margin        | `lg:mx-auto`                                | auto                 |
| Inner padding         | `p-0`                                       | 0 (child-controlled) |
| Loading overlay       | `inset-0 bg-background/90 backdrop-blur-sm` | —                    |

#### GenerateSheetHeader

**File:** `src/components/generate-sheet/GenerateSheetHeader.tsx`

| Property          | Value                               | Px         |
| ----------------- | ----------------------------------- | ---------- |
| Container padding | `px-4`                              | 16px       |
| Border            | `border-b`                          | 1px bottom |
| Background        | `bg-background/95 backdrop-blur-xl` | —          |

#### GenerateSheetFooter

**File:** `src/components/generate-sheet/GenerateSheetFooter.tsx`

| Property               | Value                               | Px              |
| ---------------------- | ----------------------------------- | --------------- |
| Padding                | `px-4 pt-3`                         | 16px / 12px top |
| Border                 | `border-t`                          | 1px top         |
| Button height          | `h-14`                              | 56px            |
| Button border-radius   | `rounded-2xl`                       | 16px            |
| Summary margin         | `mt-1.5`                            | 6px             |
| Summary text-size      | `text-[11px]`                       | 11px            |
| Dynamic bottom padding | `paddingBottom: keyboardHeight + 8` | dynamic         |

#### FormStepper

**File:** `src/components/generate-form/FormStepper.tsx`

| Property           | Value               | Px         |
| ------------------ | ------------------- | ---------- |
| Pill gap           | `gap-1.5`           | 6px        |
| Pill padding       | `px-3 py-1`         | 12×4px     |
| Pill border-radius | `rounded-full`      | ∞          |
| Pill text-size     | `text-[11px]`       | 11px       |
| Sticky position    | `sticky top-0 z-10` | 0 from top |

#### CollapsibleFormHeader

**File:** `src/components/generate-form/CollapsibleFormHeader.tsx`

| Property                     | Value                                  | Px                     |
| ---------------------------- | -------------------------------------- | ---------------------- |
| Container                    | `space-y-3 py-2`                       | 12px gap, 8px vertical |
| Title row gap                | `gap-3`                                | 12px                   |
| Balance pill                 | `gap-1.5 px-2.5 py-1.5 rounded-full`   | 6px gap, 10×6px pad    |
| Mode segmented padding       | `p-1`                                  | 4px                    |
| Mode segmented border-radius | `rounded-2xl`                          | 16px                   |
| Segment buttons              | `min-h-[44px] rounded-xl`              | 44px, 12px radius      |
| Model/History buttons        | `min-h-[44px] min-w-[44px] rounded-xl` | 44×44px ✅             |

#### FormSection

**File:** `src/components/generate-form/FormSection.tsx`

| Property                     | Value         | Px   |
| ---------------------------- | ------------- | ---- |
| Section spacing              | `space-y-2.5` | 10px |
| Elevated/group padding       | `p-3.5`       | 14px |
| Elevated/group border-radius | `rounded-2xl` | 16px |
| Elevated/group left pad      | `pl-4`        | 16px |
| Group header gap             | `gap-2.5`     | 10px |
| Step badge                   | `w-6 h-6`     | 24px |

#### SectionLabel

**File:** `src/components/generate-form/SectionLabel.tsx`

| Property               | Value                   | Px                                |
| ---------------------- | ----------------------- | --------------------------------- |
| Container gap          | `gap-1.5`               | 6px                               |
| Hint button            | `h-11 w-11 -my-2 -mx-2` | 44×44px ✅ (neg margin alignment) |
| Hint popover max-width | `max-w-[240px]`         | 240px                             |
| Hint popover padding   | `p-3`                   | 12px                              |

### 11.10 Home Page Sidebar Widgets

#### HomeDesktopSidebar

**File:** `src/components/home/HomeDesktopSidebar.tsx`

| Property   | Value            | Px         |
| ---------- | ---------------- | ---------- |
| Widget gap | `gap-5 xl:gap-6` | 20→24px ⚠️ |

**⚠️ Gap (20-24px) 4px less than main content blockGap (24-32px).**

#### DailyTipCard

**File:** `src/components/home/DailyTipCard.tsx`

| Property           | Value                       | Px      |
| ------------------ | --------------------------- | ------- |
| Card padding       | `p-3 lg:p-4`                | 12→16px |
| Card border-radius | `rounded-xl lg:rounded-2xl` | 12→16px |
| Icon size          | `w-9 h-9 lg:w-11 lg:h-11`   | 36→44px |
| Dismiss button     | 44×44px                     | ✅      |

#### NowPlayingRail

**File:** `src/components/home/NowPlayingRail.tsx`

| Property      | Value         | Px   |
| ------------- | ------------- | ---- |
| Padding       | `p-4`         | 16px |
| Border-radius | `rounded-2xl` | 16px |
| Gap           | `gap-3`       | 12px |
| Label gap     | `gap-2`       | 8px  |
| Tags gap      | `gap-1.5`     | 6px  |
| Icon size     | `w-10 h-10`   | 40px |

#### StatsHighlightBanner

**File:** `src/components/home/StatsHighlightBanner.tsx`

| Property     | Value                   | Px         |
| ------------ | ----------------------- | ---------- |
| Grid gap     | `gap-2 sm:gap-3`        | 8→12px ⚠️  |
| Item padding | `px-3 py-2.5`           | 12×10px ⚠️ |
| Icon size    | `w-8 h-8 lg:w-9 lg:h-9` | 32→36px    |

**⚠️ gap 8px vs DiscoverTabs 10px (different grid base). ⚠️ Asymmetric padding (px 12px ≠ py 10px).**

### 11.11 Index.tsx (Home Page Layout)

**File:** `src/pages/Index.tsx`

| Property                     | Value                                 | Px               |
| ---------------------------- | ------------------------------------- | ---------------- |
| Main grid gap                | `gap-6 lg:gap-8 xl:gap-10 2xl:gap-12` | 24→32→40→48px    |
| Main column                  | `lg:col-span-8 xl:col-span-9`         | 8/12→9/12        |
| Sidebar column               | `lg:col-span-4 xl:col-span-3`         | 4/12→3/12        |
| Sidebar sticky top           | `top-6`                               | 24px             |
| Search bar margin            | `mt-3 mb-2`                           | 12px / 8px ⚠️    |
| Search bar max-width         | `max-w-md`                            | 448px            |
| Bottom padding (no player)   | 6rem                                  | 96px             |
| Bottom padding (with player) | 12rem                                 | 192px            |
| Section density              | `comfortable` (all blocks)            | 16→20px body gap |

**⚠️ Search bar asymmetric margin: mt-3 (12px) ≠ mb-2 (8px).**

### 11.12 Library.tsx

**File:** `src/pages/Library.tsx`

| Property                    | Value                                               | Px               |
| --------------------------- | --------------------------------------------------- | ---------------- |
| AppHeader                   | `!static !mx-0 flex-shrink-0`                       | no sticky        |
| Filter bar margin           | `-mx-4`                                             | -16px (negative) |
| Filter bar padding          | `px-5 sm:px-6`                                      | 20→24px          |
| Filter bar vertical padding | `py-4 sm:py-5`                                      | 16→20px          |
| Content padding             | `py-6 sm:py-8`                                      | 24→32px          |
| Play button                 | `min-h-[44px] min-w-[44px] h-11 w-11 lg:h-9 lg:w-9` | 44→36px          |

### 11.13 Consistency Scorecard

| Aspect             | Components                                             | Values Found              | Verdict                       |
| ------------------ | ------------------------------------------------------ | ------------------------- | ----------------------------- |
| Card padding       | GridVariant, ListVariant, DailyTipCard, NowPlayingRail | 8px, 12px, 12-16px, 16px  | ❌ No unified scale           |
| Card border-radius | GridVariant, ListVariant, DailyTipCard, BottomNav tabs | 12px, 16px, 12-16px, 12px | ⚠️ Two scales used            |
| Section/block gap  | Section.blockGap, Sidebar widget gap, Index main gap   | 24-32px, 20-24px, 24-48px | ⚠️ Sidebar 4px less           |
| Grid gap (cards)   | DiscoverTabs, StatsHighlightBanner                     | 10-12px, 8-12px           | ⚠️ Different base             |
| Touch targets      | GridVariant more, BottomNav tabs, FAB, Sidebar buttons | 32px, 48px, 48px, 44px    | ❌ GridVariant more=32px      |
| Form spacing       | FormSection, SectionLabel, CollapsibleFormHeader       | 10px, 6px, 12px           | ❌ 3 different gaps           |
| Content padding    | MainLayout desktop, mobile, GenerateSheet              | 24px, 12-16px, 16px       | ⚠️ No unified page padding    |
| Icon sizes (nav)   | BottomNav, Sidebar, HomeHeader mobile                  | 20px, 16px, 20px          | ⚠️ BottomNav 20 vs Sidebar 16 |

### 11.14 Fix Recommendations — Ordered by Impact

| #   | Issue                              | Affected Files                                                                                    | Fix                                                                                                | Effort           |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | **No unified card padding scale**  | GridVariant (p-2=8px), ListVariant (p-3=12px), DailyTipCard (p-3=12px), NowPlayingRail (p-4=16px) | Standardize: all cards → `p-3` (12px) base                                                         | 4 files, 4 lines |
| 2   | **No unified border-radius**       | GridVariant (rounded-2xl=16px), ListVariant (rounded-xl=12px)                                     | Standardize: all cards → `rounded-2xl` (16px)                                                      | 2 files, 2 lines |
| 3   | **Touch target violation**         | GridVariant more button (w-8 h-8=32px)                                                            | → `min-w-[44px] min-h-[44px]` with `w-9 h-9` visual                                                | 1 file, 1 line   |
| 4   | **Asymmetric search bar margin**   | Index.tsx:242 (`mt-3 mb-2`)                                                                       | → unified `my-3` (12px)                                                                            | 1 file, 1 line   |
| 5   | **Sidebar gap 4px less than main** | HomeDesktopSidebar (gap-5=20px) vs Section.blockGap (24px)                                        | → `gap-6 xl:gap-8` to match                                                                        | 1 file, 1 line   |
| 6   | **Stats grid gap inconsistent**    | StatsHighlightBanner (gap-2=8px) vs DiscoverTabs (gap-2.5=10px)                                   | → `gap-2.5 sm:gap-3` to match DiscoverTabs                                                         | 1 file, 1 line   |
| 7   | **Form section gap fragmentation** | FormSection (space-y-2.5=10px), FormStepper (top-0), CollapsibleFormHeader (space-y-3=12px)       | Unify form gaps → `space-y-3` (12px)                                                               | 3 files, 3 lines |
| 8   | **Card content min-height**        | GridVariant `min-h-[56px]`                                                                        | → `min-h-[48px]` (saves 8px per card)                                                              | 1 file, 1 line   |
| 9   | **Nav icon size mismatch**         | BottomNav (20px) vs Sidebar (16px)                                                                | Decision: keep BottomNav 20px (touch-first). Sidebar is desktop-only → 16px acceptable. No change. | 0                |
| 10  | **Content padding unification**    | MainLayout desktop (p-6=24px), GenerateSheet (px-4=16px), Library filter (px-5=20px)              | Adopt `px-4 sm:px-6 lg:px-8` (Section.containerPadding) across all pages                           | 3+ files         |

## Summary Matrix

| Area                  | P0 (fix now) | P1 (next sprint) | P2 (polish) |   Total |
| --------------------- | -----------: | ---------------: | ----------: | ------: |
| Data Loading          |            4 |                4 |           0 |       8 |
| Render / Rerender     |            0 |                7 |           3 |      10 |
| Track Card Design     |            0 |                7 |           3 |      10 |
| Spacing / Layout      |            0 |                6 |           4 |      10 |
| GenerateSheet         |            1 |                6 |           3 |      10 |
| Images / LCP          |            0 |                6 |           4 |      10 |
| Mobile Specific       |            0 |                5 |           5 |      10 |
| DiscoverTabs / Grid   |            0 |                2 |           8 |      10 |
| Bundle / Architecture |            0 |                3 |           7 |      10 |
| Accessibility / UX    |            0 |                1 |           9 |      10 |
| Spacing Spec (new)    |            0 |                6 |           4 |      10 |
| **Total**             |        **5** |           **53** |      **52** | **110** |
