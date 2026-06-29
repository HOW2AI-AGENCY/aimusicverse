# UI/UX Audit & Fix Plan

Focused on the issues you listed. Each section = audit finding + fix.

## 1. App flicker on load / auth redirects
**Audit:** Root `Suspense` fallback and auth-gate render `null` or a spinner that swaps to layout → visible flash. `GlobalAudioProvider` also re-mounts on route change in some cases.
**Fix:**
- Add a stable `<AppBootSkeleton />` as Suspense fallback in `App.tsx` matching final layout (header + bottom-nav placeholders, same bg).
- In `AuthGate` / protected routes, render `<PageSkeleton />` instead of `null` while `authLoading`.
- Lock background color on `<html>`/`<body>` to `hsl(var(--background))` to avoid white flash before CSS hydrates.

## 2. Header alignment / safe-area regressions
**Audit:** Several pages use ad-hoc headers instead of `MobileHeaderBar`; some apply `padding-top` twice (layout + page), causing oversized headers on Telegram. Title alignment inconsistent (left vs center).
**Fix:**
- Sweep `src/pages/**` and replace custom headers with `UnifiedScreenLayout` + `MobileHeaderBar`.
- Remove duplicate safe-area padding from page-level wrappers; rely on `MainLayout`.
- Standardize: back button left, title centered, max 2 action icons right, 56px height.

## 3. Player timeline vs soundwave size mismatch
**Audit:** Compact player progress bar and `WavesurferPlayer` use different heights/paddings; soundwave container has `min-h-[64px]` while timeline is 4px causing visual offset.
**Fix:**
- Unify into a single `<PlayerProgress />` primitive: 32px row containing waveform (24px) + time labels below. Use it in compact, expanded and fullscreen.
- Align horizontal padding via `--player-gutter` token.

## 4. Cover images load slowly / pop-in
**Audit:** Covers fetched at full size from Supabase storage without transform; no preload for current track; `LazyImage` shimmer flashes even for cached items.
**Fix:**
- Use Supabase storage `?width=` transform: 96px (list), 320px (player compact), 800px (fullscreen).
- Add `<link rel="preload" as="image">` for current + next track cover via `usePrefetchTrackCovers` (already exists — extend `count` and include current).
- Cache decoded covers in memory map keyed by url; skip shimmer if already in cache.

## 5. Fullscreen player overload → redesign
**Audit:** `FullscreenPlayer` stacks cover, title, waveform, lyrics toggle, queue, 8+ action buttons, share row — too dense, no clear hierarchy.
**Fix (structural, not visual brief):**
- 3-zone layout: top (cover + meta), middle (waveform + transport), bottom (collapsible action drawer with secondary actions behind a "More" sheet).
- Reduce primary surface to: prev / play / next / like / lyrics. Move stems, share, version switcher, queue, download, edit into bottom sheet.
- Lyrics becomes an overlay panel, not a stacked section.
- (If you want full visual redesign with rendered options, I can run a design-directions pass on a screenshot in a follow-up.)

## 6. Home page spacing / asymmetry
**Audit:** Sections (`TrackPresetsRow`, `LyricsPresetsRow`, `ProjectPresetsCarousel`, quick actions) use mixed `px-4`, `px-6`, `gap-3`, `gap-6`. Carousels bleed right but have left padding → asymmetric.
**Fix:**
- Introduce `--page-gutter: 16px` token; all home sections use `px-[var(--page-gutter)]`.
- Carousels: negative-margin trick `-mx-[var(--page-gutter)] px-[var(--page-gutter)]` so first/last items align with section titles.
- Unify vertical rhythm: `space-y-6` between sections, `mb-3` between section title and content.

## 7. Verification
- `tsgo` + `vite build`.
- Playwright smoke on `/`, `/library`, `/projects`, `/player/:id` at 360×720 and 424×783: assert no `ErrorBoundary` fallback, no console errors, screenshot each.
- Visual diff against current screenshots for home and fullscreen player.

## Technical details
- Files touched: `src/App.tsx`, `src/components/MainLayout.tsx`, `src/components/AuthGate.tsx`, `src/components/player/{CompactPlayer,FullscreenPlayer,MobileFullscreenPlayer}.tsx`, new `src/components/player/PlayerProgress.tsx`, `src/components/ui/lazy-image.tsx`, `src/hooks/audio/usePrefetchTrackCovers.ts`, `src/components/home/*`, `src/pages/{Index,Library,Projects,Community,Profile}.tsx`, `src/styles/tokens.css` (new `--page-gutter`, `--player-gutter`).
- No backend / schema changes.
- No new dependencies.

## Out of scope (ask if you want included)
- Full visual redesign of fullscreen player (needs design-directions round).
- Dark/light theme token overhaul.
- Bottom navigation redesign.
