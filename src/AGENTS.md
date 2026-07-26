# React Application Source

## Purpose

- Owns the client application: API adapters, hooks, stores, pages, providers, UI components, workers, and frontend types.

## Ownership

- Keep server state in TanStack Query hooks and direct backend access in API/service layers.
- Keep global UI/audio state in existing stores and providers.

## Local Contracts

- Track version UI must treat `track_versions` rows as the source of truth for selectable/generated variants; raw callback clips are only a fallback while rows are not yet available.
- Applying a generated replacement variant must update both `track_versions.is_primary` and `tracks.active_version_id` together.
- Any `track_versions` realtime change must invalidate every version cache key (`track-versions`, `track-versions-unified`, `version-count`, `master-version`, `track-counts`); missing a key leaves selectors stuck on one version.
- Tracks with `tracks.custom_voice_id` render the custom-voice marker in `TrackTypeIcons`; voice cloning UI must state it clones timbre/style, not an exact voice copy.
- Switching the master version must invalidate every cache mirroring the tracks row (`tracks`, `tracks-infinite`, `user-tracks`, `public-tracks`, `source-track`, `timestamped-lyrics`) plus the version keys — otherwise cover/duration/badge/lyrics stay stale until a reload.
- Section replacement has exactly one window: `studio/editor/SectionEditorSheet` opened from `StudioShell`/`StudioShellDialogs`. Do not add parallel section editors or panels.
- Model badges must map `V5_5`/`chirp-fenix` to the V5.5 label; the `v5` fallback must be checked after `v55`.


## Work Guidance

- Use existing shared hooks, UI primitives, logger, design tokens, and icon exports.
- Avoid creating additional audio elements; use the established audio player/preview abstractions.

## Verification

- Use focused UI/runtime verification for changed flows when practical; rely on existing build/test automation for broad checks.

## Child DOX Index

- Not yet split further.