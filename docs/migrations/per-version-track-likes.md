# Per-Version Track Likes Migration

**Migrations:** `20260703120000` (archived) → `20260704014859` (applied)  
**Date:** 2026-07-03 → 2026-07-04  
**Status:** ✅ Complete (hotfix applied to production)

---

## Overview

This migration reworks track likes to be scoped per **track VERSION** instead of per track, allowing users to independently like different A/B versions of the same track.

---

## Problem Statement

**Before:** A like was keyed only by `(user_id, track_id)`. This meant:

- Liking version A and version B collapsed into a single row
- Switching active version silently carried the like over (or dropped it)
- No real per-version semantics

**After:** Each like is scoped to `(user_id, track_version_id)`:

- Users can independently like each version of a track
- Version switching preserves like state
- Per-version like counts in `track_versions.likes_count`

---

## Changes Made

### 1. Schema Changes

**`track_likes` table:**

- Added `track_version_id` UUID (FK to `track_versions.id`)
- Made `track_version_id` NOT NULL after backfill
- Changed unique constraint from `(user_id, track_id)` to `(user_id, track_version_id)`
- Added index `idx_track_likes_version` for performance

**`track_versions` table:**

- Added `likes_count` integer (denormalized counter per version)

### 2. Backfill Strategy

Existing likes were preserved using a cascading fallback:

```sql
UPDATE public.track_likes tl
SET track_version_id = COALESCE(
  (SELECT t.active_version_id FROM public.tracks t WHERE t.id = tl.track_id),
  (SELECT tv.id FROM public.track_versions tv WHERE tv.track_id = tl.track_id AND tv.is_primary = true LIMIT 1),
  (SELECT tv.id FROM public.track_versions tv WHERE tv.track_id = tl.track_id ORDER BY tv.created_at ASC LIMIT 1)
)
WHERE tl.track_version_id IS NULL;
```

**Fallback order:**

1. Track's `active_version_id` (current active version)
2. Primary version (`is_primary = true`)
3. Oldest version (legacy compatibility)

**Cleanup:** Likes on tracks with zero versions were dropped (orphaned/legacy rows).

### 3. Auto-Resolution Trigger

**Function:** `resolve_track_like_version()`  
**Trigger:** `trigger_resolve_track_like_version` (BEFORE INSERT)

**Purpose:** Existing insert call sites only send `{user_id, track_id}`. The trigger:

- Resolves `track_version_id` from the track's current active/primary version
- Derives `track_id` from `track_version_id` (consistency)
- Allows old code to work unchanged while scoping to versions

### 4. Counter Maintenance

**Function:** `update_track_likes_count()` (updated)

**Maintains three counters on like INSERT/DELETE:**

1. `tracks.likes_count` - Total likes across all versions
2. `track_versions.likes_count` - Per-version likes
3. `profiles.stats_likes_received` - User's received likes

---

## Migration Files

### Archived (Superseded)

- **`20260703120000_per_version_track_likes.sql`** - Sprint 49 original
  - 138 lines, comprehensive comments
  - **Status:** Archived (see `supabase/migrations/.archive/`)
  - **Reason:** Superseded by hotfix `20260704014859`

### Applied to Production ✅

- **`20260704014859_14c0baab...`** - Lovable hotfix
  - 115 lines (subset) + homepage genre index
  - **Status:** Applied to production 2026-07-04
  - **Includes:** All core per-version likes functionality

---

## Usage in Code

### TypeScript / React

```typescript
// Per-version like hook (canonical)
import { useLikeTrack } from "@/hooks/useLikeTrack";

const { like, unlike, isLiked } = useLikeTrack({
  trackId: "track-123",
  versionId: "version-abc", // 👈 Now required for per-version scoping
});

// Legacy call sites still work (auto-resolved via trigger)
const { like } = useLikeTrack({ trackId: "track-123" });
```

### Database Queries

```sql
-- Get likes for a specific version
SELECT COUNT(*) FROM track_likes
WHERE track_version_id = 'version-abc';

-- Get per-version like counts
SELECT tv.id, tv.likes_count, tv.version_label
FROM track_versions tv
WHERE tv.track_id = 'track-123'
ORDER BY tv.likes_count DESC;
```

---

## Verification

### Production Schema Check

```sql
-- Verify column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'track_likes'
AND column_name = 'track_version_id';

-- Verify unique constraint
SELECT conname FROM pg_constraint
WHERE conrelid = 'track_likes'::regclass
AND contype = 'u';

-- Verify trigger exists
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'track_likes'::regclass
AND tgisinternal = false;
```

### Expected Results

- ✅ `track_version_id` column: UUID, NOT NULL
- ✅ Unique constraint: `track_likes_user_version_key` on `(user_id, track_version_id)`
- ✅ Index: `idx_track_likes_version` exists
- ✅ Trigger: `trigger_resolve_track_like_version` exists
- ✅ Function: `resolve_track_like_version()` exists
- ✅ `track_versions.likes_count` column: integer, NOT NULL

---

## Rollback Plan

⚠️ **Not recommended** - this is a structural change with production data.

If rollback is absolutely necessary:

```sql
-- 1. Drop new objects
DROP TRIGGER IF EXISTS trigger_resolve_track_like_version ON track_likes;
DROP FUNCTION IF EXISTS public.resolve_track_like_version();

-- 2. Restore old unique constraint
ALTER TABLE track_likes DROP CONSTRAINT IF EXISTS track_likes_user_version_key;
ALTER TABLE track_likes ADD CONSTRAINT track_likes_user_id_key UNIQUE (user_id, track_id);

-- 3. Remove version scoping
ALTER TABLE track_likes ALTER COLUMN track_version_id DROP NOT NULL;
ALTER TABLE track_likes DROP COLUMN IF EXISTS track_version_id;

-- 4. Remove per-version counters
ALTER TABLE track_versions DROP COLUMN IF EXISTS likes_count;

-- ⚠️ WARNING: This loses all per-version like data and breaks version-specific like functionality
```

---

## Related Documentation

- [Migration Reconciliation Report](../../SPRINTS/MIGRATION_RECONCILIATION_REPORT.md)
- [Sprint 049 Mobile Audit](../../SPRINTS/SPRINT-049-PLAN.md)
- [PROJECT_STATUS.md](../../PROJECT_STATUS.md)

---

**Last Updated:** 2026-07-05  
**Migration Status:** Complete ✅  
**Production State:** Active
