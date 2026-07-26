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


## Work Guidance

- Use existing shared hooks, UI primitives, logger, design tokens, and icon exports.
- Avoid creating additional audio elements; use the established audio player/preview abstractions.

## Verification

- Use focused UI/runtime verification for changed flows when practical; rely on existing build/test automation for broad checks.

## Child DOX Index

- Not yet split further.