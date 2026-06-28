# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Debugging Information

- **Boot logs**: Stored in `sessionStorage` key `musicverse_boot_log`; exposed via `window.__BOOT_LOG` and `window.__getBootLog()`
- **AbortError silenced**: Global `unhandledrejection` and `error` handlers filter `AbortError` (DOMException name: `'AbortError'`) — they are intentionally muted
- **iOS keyboard**: Tracked via `visualViewport` API; sets `--keyboard-height` CSS var and toggles `keyboard-open` class when height > 150px; defined in `src/main.tsx`
- **Viewport height**: Dynamic `--vh` CSS var set on resize events via `setViewportHeight()` in `src/main.tsx`
- **Audio Service Worker**: Registered at `/audio-sw.js` on window `load` event
- **Graphify knowledge graph**: Run `graphify update .` after code changes; output in `graphify-out/`
