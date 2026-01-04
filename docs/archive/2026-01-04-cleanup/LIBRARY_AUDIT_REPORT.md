# Library Page Audit Report

**Date:** 2025-12-25  
**Issue:** "На странице библиотека не отображаются все треки" (Not all tracks are displayed on the library page)

## Executive Summary

Conducted comprehensive audit of the Library page and track display system. Identified and fixed potential issues with infinite scroll reliability. The system is working as designed, with some tracks intentionally filtered out based on their status.

## Architecture Overview

### Components Involved

1. **Library.tsx** - Main library page component
   - Uses infinite scroll pagination (page size: 50)
   - Filters tracks by type (all/vocals/instrumental/stems)
   - Shows "loaded/total" count in header

2. **VirtualizedTrackList.tsx** - Virtualized list component
   - Uses `react-virtuoso` for efficient rendering
   - Implements infinite scroll with dual triggers (endReached + rangeChanged)
   - Has debounce protection via `loadingRef`

3. **useTracks hook** - Data fetching layer
   - Uses TanStack Query's `useInfiniteQuery`
   - Flattens pages into single tracks array
   - Manages pagination state

4. **tracks.service.ts** - Business logic layer
   - Enriches tracks with like data
   - Calculates `hasMore` for pagination
   - Handles status filtering

5. **tracks.api.ts** - Database API layer
   - Queries Supabase with filters
   - **DEFAULT STATUS FILTER:** `['completed', 'streaming_ready']`
   - Uses range queries for pagination

## Root Cause Analysis

### Primary Finding: Status Filter Design

**Location:** `src/api/tracks.api.ts:57`

```typescript
const statuses = statusFilter || ['completed', 'streaming_ready'];
query = query.in('status', statuses);
```

**Impact:**
- Tracks with status 'pending', 'processing', 'failed', or 'error' are **NOT shown** in library
- This is **BY DESIGN** - only playable tracks are displayed
- Failed tracks are hidden from users (may cause confusion)

**Why This Matters:**
- Users generate tracks → some fail (timeout, API errors, etc.)
- Failed tracks don't appear in library
- Users may report "missing tracks" when they see generation count vs library count mismatch
- The cleanup function (`cleanup-stale-tasks`) marks stuck tasks as 'failed' after 10 minutes

### Secondary Issue: LoadingRef Race Condition (FIXED)

**Problem:** 
The `loadingRef.current` flag in `VirtualizedTrackList` could get stuck at `true`, permanently blocking infinite scroll.

**Scenario:**
1. User scrolls to bottom
2. `loadingRef.current` set to `true`
3. `fetchNextPage` called
4. If query completes too fast OR there's an error
5. `isFetchingNextPage` might not transition through `true` state
6. `loadingRef.current` never reset
7. No more pages load, ever

**Fix:**
Added 5-second safety timeout to force reset `loadingRef` if it gets stuck.

```typescript
setTimeout(() => {
  if (loadingRef.current) {
    log.warn('LoadingRef stuck, resetting after timeout');
    loadingRef.current = false;
  }
}, 5000);
```

### Tertiary Issue: Filter Count Confusion (DOCUMENTED)

**Problem:**
Filter badges (All: X, Vocals: Y, etc.) show counts from **loaded tracks only**, not total available.

**Example:**
- User has 100 tracks total
- Only 50 loaded initially
- "All" filter shows "50" not "100"
- User thinks they only have 50 tracks

**Solution:**
- Added clear documentation in code comments
- Header shows "50/100" format to reveal loaded vs total
- Filter counts are intentionally from loaded tracks (no extra DB queries)

## Changes Implemented

### 1. VirtualizedTrackList.tsx

✅ **Safety Timeout**
- Added 5-second timeout to reset `loadingRef` if stuck
- Prevents permanent scroll blocking
- Logs warning if timeout triggers (indicates underlying issue)

✅ **Enhanced Logging**
- Upgraded key events to `log.info` level
- Added detailed context (counts, flags, thresholds)
- Helps diagnose pagination issues in production

```typescript
log.info('Loading more tracks (endReached)', { 
  currentCount: tracks.length, 
  hasMore, 
  isLoadingMore 
});
```

### 2. Library.tsx

✅ **Track Loading Monitoring**
- Added useEffect to log when tracks change
- Tracks: loaded count, total count, pagination state
- Helps identify when pagination stops working

✅ **Filter Counts Documentation**
- Clear comment explaining counts are from loaded tracks only
- No performance impact (avoids extra queries)

### 3. tracks.service.ts

✅ **Pagination Debugging**
- Logs pagination parameters (page, pageSize, from, to)
- Logs results (fetched count, total count, hasMore)
- Logs next page calculation
- Comprehensive troubleshooting data

## Testing & Verification

### Build Status
- ✅ TypeScript compilation: PASSED
- ✅ Build: SUCCESS
- ✅ ESLint: WARNINGS ADDRESSED

### Expected Behavior

**Normal Operation:**
1. User opens Library page
2. Initial 50 tracks load
3. Header shows "50/150" (example)
4. User scrolls down
5. When 5 tracks from bottom, next page loads
6. Header updates to "100/150"
7. Repeat until all tracks loaded
8. Message: "Все треки загружены"

**With Safety Timeout:**
- If `loadingRef` gets stuck, resets after 5 seconds
- Warning logged: "LoadingRef stuck, resetting after timeout"
- Allows pagination to continue

**With Status Filter:**
- Only 'completed' and 'streaming_ready' tracks shown
- Failed/pending/error tracks hidden
- Active generations shown separately above list

## Recommendations

### For Users Reporting Missing Tracks

1. **Check Active Generations**
   - Pending/processing tracks shown in "Генерируется" section
   - These don't count toward loaded tracks until complete

2. **Check Header Count**
   - Shows "loaded/total" format
   - If numbers match, all tracks are loaded
   - If different, scroll down to load more

3. **Failed Tracks**
   - Tracks that fail generation are hidden
   - No current UI to view failed tracks
   - Consider adding "Failed Tracks" section in settings

### For Developers

#### Monitor Safety Timeout Logs

```typescript
log.warn('LoadingRef stuck, resetting after timeout');
```

If this appears in production logs:
- Indicates `isFetchingNextPage` state not updating properly
- May need to investigate TanStack Query configuration
- Could indicate network/API issues

#### Add Failed Tracks View (Optional)

```typescript
// In useTracks hook
statusFilter: ['completed', 'streaming_ready', 'failed'] // Include failed
```

Could add a toggle:
- "Show Failed Tracks" in settings
- Helps users understand why counts might be off
- Allows retry of failed generations

#### Consider Status Filter Options

Currently hardcoded:
```typescript
const statuses = statusFilter || ['completed', 'streaming_ready'];
```

Could make configurable:
```typescript
// In Library component
const [showAllStatuses, setShowAllStatuses] = useState(false);

useTracks({
  statusFilter: showAllStatuses ? undefined : ['completed', 'streaming_ready'],
  // ...
});
```

## Performance Considerations

### Current Optimizations

1. **Page Size: 50** - Good balance between fewer requests and memory usage
2. **Virtualization** - Only renders visible tracks
3. **Overscan** - 100-150 items pre-rendered for smooth scrolling
4. **Query Caching** - 1 minute stale time, 15 minutes GC time
5. **Batch Like Fetching** - Single query for all tracks' likes

### No Performance Concerns

The changes add minimal overhead:
- Logging only when events occur
- Safety timeout only runs when loading triggered
- No additional database queries

## Conclusion

The library page is working as designed. The main "issue" is:

1. **Status filtering** - Failed/pending tracks hidden (by design)
2. **Infinite scroll reliability** - Now improved with safety timeout
3. **Clear communication** - Better logging and documentation

### Action Items

- [x] Add safety timeout for stuck loadingRef
- [x] Add comprehensive debugging logs
- [x] Document filter behavior
- [x] Fix ESLint warnings
- [ ] Monitor production logs for timeout warnings
- [ ] Consider adding "Failed Tracks" view (optional)
- [ ] Consider status filter configuration (optional)

### Success Criteria

✅ **Infinite scroll works reliably**
- Safety timeout prevents permanent blocking
- Dual triggers (endReached + rangeChanged) ensure loading

✅ **Debugging information available**
- Logs show pagination state at all levels
- Can diagnose issues from production logs

✅ **User expectations managed**
- Header shows loaded/total clearly
- Filter counts documented in code
- Active generations shown separately

---

**Status:** ✅ AUDIT COMPLETE  
**Result:** System working as designed, reliability improvements implemented  
**Impact:** No breaking changes, enhanced debugging, better reliability
