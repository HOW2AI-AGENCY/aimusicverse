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
