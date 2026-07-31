# React Application Source

## Purpose

- Owns the client application: API adapters, hooks, stores, pages, providers, UI components, workers, and frontend types.

## Ownership

- Keep server state in TanStack Query hooks and direct backend access in API/service layers.
- Keep global UI/audio state in existing stores and providers.

## Local Contracts

- Track version UI must treat `track_versions` rows as the source of truth for selectable/generated variants; raw callback clips are only a fallback while rows are not yet available.
- Applying a generated replacement variant must update both `track_versions.is_primary` and `tracks.active_version_id` together.
- All version caches share the `["track-versions", trackId, ...scope]` prefix (`queryKeys.tracks.versionsScoped`); never introduce a sibling namespace like `track-versions-unified`. A `track_versions` realtime change invalidates `track-versions`, `version-count`, `master-version`, `track-counts`.
- Tracks with `tracks.custom_voice_id` render the custom-voice marker in `TrackTypeIcons`; voice cloning UI must state it clones timbre/style, not an exact voice copy.
- Switching the master version must invalidate every cache mirroring the tracks row (`tracks`, `tracks-infinite`, `user-tracks`, `public-tracks`, `source-track`, `timestamped-lyrics`) plus the version keys — otherwise cover/duration/badge/lyrics stay stale until a reload.
- Section replacement has exactly one window: `studio/editor/SectionEditorSheet` opened from `StudioShell`/`StudioShellDialogs`. Do not add parallel section editors or panels.
- Section replacement must freeze the original lyrics for the selected time range before editing, splice edited text into `fullLyrics`, and keep style instructions separate.
- Player volume must be clamped to `[0, 1]` before persistence or any `HTMLMediaElement.volume` assignment.
- Model badges must map `V5_5`/`chirp-fenix` to the V5.5 label; the `v5` fallback must be checked after `v55`.
- Stem separation from track actions must keep user feedback visible until the request is accepted, then open Studio with `useStemSeparationRealtime` progress mounted.
- Inline/compact version selectors must keep section-replacement variants out of the default card/player controls; detailed selectors may show them.
- Auth route guards must go through `hooks/useAuthGate` (or `ProtectedRoute`), which honours guest mode, dev/preview access, and `isTelegramAuthPending`. Never redirect to `/auth` on `!isAuthenticated` alone — the Telegram `initData` handshake resolves after `getSession()` and the redirect drops the session.
- `ProtectedRoute` passes the intended path as `state.from`; `/auth` restores it via `next` or `state.from` (same-origin relative paths only).


## Work Guidance

- Use existing shared hooks, UI primitives, logger, design tokens, and icon exports.
- Avoid creating additional audio elements; use the established audio player/preview abstractions.

## Verification

- Use focused UI/runtime verification for changed flows when practical; rely on existing build/test automation for broad checks.

## Child DOX Index

- Not yet split further.