## Goal
Show `renders` and `externalSyncs` for `LyricsVisualEditorCompact` live in a small dev-only overlay, so you can verify in the browser that mode switches / template apply / typing don't trigger extra re-renders.

## Approach
Lightweight floating chip in the bottom-right corner, only mounted when `import.meta.env.DEV` is true. Reads from the existing `window.__lyricsEditorMetrics` (already written on every render of the editor) via a `requestAnimationFrame` poll while visible. Zero impact on production bundle (tree-shaken behind the DEV guard).

## What gets built

1. **`src/components/dev/LyricsEditorMetricsOverlay.tsx`** (new)
   - Fixed-position chip: `bottom-4 right-4`, `z-index: notifications` token, small monospace font, glass background.
   - Shows three counters: `renders`, `externalSyncs`, and a derived `Δsync/render` ratio (should stay 0 during typing).
   - Tracks deltas since last frame so you visually see when a sync fires (flash amber for 400ms).
   - Collapse / expand toggle. Persists collapsed state in `localStorage` (`lv:metrics:collapsed`).
   - Reset button (zeros the counters on `window.__lyricsEditorMetrics`).
   - Keyboard shortcut `Ctrl/Cmd+Shift+M` toggles visibility. Visibility itself persisted in localStorage so it survives reloads.

2. **`src/components/generate-form/LyricsVisualEditorCompact.tsx`** (small extension)
   - Expose a `reset()` helper on `window.__lyricsEditorMetrics` so the overlay button can zero counters without reaching into internals.
   - Add a per-render timestamp (`lastRenderAt`) so the overlay can show "renders/sec" if useful.

3. **Mount point**
   - Render the overlay once from `src/App.tsx` (or whichever top-level layout is closest — will confirm during build) inside a `{import.meta.env.DEV && <LyricsEditorMetricsOverlay />}` guard so it never ships to production.

## Out of scope
- Profiling other components — this is scoped to the lyrics editor metrics we already collect.
- React Profiler API integration. We can add later if you want flame data; the chip just surfaces the counters that already exist.

## Technical notes
- The overlay polls via `rAF` only while expanded; collapsed state polls 1×/sec to keep numbers fresh without CPU cost.
- Uses existing design tokens / `glass` utility from `src/lib/glass.ts`; no hardcoded colors.
- No new dependencies.
