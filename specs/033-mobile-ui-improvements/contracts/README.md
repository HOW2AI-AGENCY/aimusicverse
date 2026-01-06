# API Contracts

**Feature**: 033-mobile-ui-improvements
**Date**: 2026-01-06

## Note

This feature does not require any new API contracts. All functionality is client-side UI improvements using existing data from Supabase.

## Existing APIs Used

### Supabase Queries (Already Implemented)

- **Tracks**: `SELECT * FROM tracks`
- **Track Versions**: `SELECT * FROM track_versions WHERE track_id = ?`
- **Playlists**: `SELECT * FROM playlists WHERE user_id = ?`
- **Active Generations**: Realtime subscription to `generations` table

### No New Endpoints

All new functionality (queue, notifications, gestures, accessibility) uses existing data and client-side storage (localStorage).

## Storage Schemas

See [data-model.md](../data-model.md) for localStorage schema definitions.

