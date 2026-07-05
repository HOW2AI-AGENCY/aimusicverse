# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Architectural Constraints

- **Provider chain (strict order)**: `ErrorBoundaryWrapper > ErrorBoundary > CoreProviders > FeatureProviders > BrowserRouter > UIProviders > NavigationProvider` — defined in [`src/App.tsx`](../../src/App.tsx)
- **Lazy loading tiers**: `lazyWithRetry` from `@/lib/performance` for critical pages; standard `lazy()` for secondary; `/* webpackChunkName */` for admin/heavy pages
- **Studio V2 outside MainLayout**: Studio routes bypass bottom nav entirely — they render outside `ProtectedRoute` + `MainLayout`
- **Unauthenticated routes**: Payment routes (`/stars/*`, `/premium`) and Studio V2 are accessible without auth wrapper
- **Boot sequence** ([`src/main.tsx`](../../src/main.tsx)): bootLog init → global error handlers (AbortError filtering) → viewport CSS vars → Sentry/Telemetry init → React root render → Audio SW registration on `load`
- **Code-splitting by feature**: Each major feature area (admin, studio, payments, library, community) is a separate code-split chunk
- **Track versioning**: A/B system with version comparisons — see CLAUDE.md for details
- **Audio architecture**: Track-State Machine hybrid approach — Tone.js (WebAudio) + Wavesurfer.js for waveform
