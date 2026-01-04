# Inline Mode Enhancement - Testing Guide

**Date:** 2025-12-16  
**Status:** In Progress (T2.1)  
**Progress:** 50%

## Testing Checklist

### ✅ Phase 1: SQL Migration

**Prerequisites:**
```bash
# Apply migration to Supabase
psql -h [your-host] -U postgres -d postgres -f supabase/migrations/20251216_inline_mode_enhancement.sql
```

**Verification:**
```sql
-- 1. Check materialized view
SELECT COUNT(*) FROM trending_tracks;
SELECT * FROM trending_tracks LIMIT 5;

-- 2. Verify genre extraction
SELECT id, title, style, computed_genre 
FROM tracks 
WHERE computed_genre IS NOT NULL 
LIMIT 10;

-- 3. Verify mood extraction  
SELECT id, title, style, computed_mood
FROM tracks
WHERE computed_mood IS NOT NULL
LIMIT 10;

-- 4. Check full-text search
SELECT id, title
FROM tracks
WHERE search_vector @@ to_tsquery('russian', 'rock')
LIMIT 5;

-- 5. Verify indexes
\d+ tracks
\d+ trending_tracks
```

### ⏳ Phase 2: Integration Testing

**Test Categories:**

1. **MY Category** (User's tracks)
```
@AIMusicVerseBot my:
@AIMusicVerseBot my:rock
```
Expected: Only user's own tracks

2. **PUBLIC Category** (All public tracks)
```
@AIMusicVerseBot public:
@AIMusicVerseBot rock
@AIMusicVerseBot public:jazz
```
Expected: All public tracks, filtered by query

3. **TRENDING Category**
```
@AIMusicVerseBot trending:
@AIMusicVerseBot trending:electronic
```
Expected: Tracks from trending_tracks view, sorted by score

4. **NEW Category** (24 hours)
```
@AIMusicVerseBot new:
@AIMusicVerseBot new:pop
```
Expected: Tracks created in last 24 hours

5. **FEATURED Category**
```
@AIMusicVerseBot featured:
```
Expected: High-quality tracks (via get_featured_tracks RPC)

6. **GENRE Category**
```
@AIMusicVerseBot genre:rock
@AIMusicVerseBot genre:jazz
@AIMusicVerseBot genre:hip-hop
```
Expected: Tracks filtered by computed_genre

7. **MOOD Category**
```
@AIMusicVerseBot mood:happy
@AIMusicVerseBot mood:sad
@AIMusicVerseBot mood:chill
```
Expected: Tracks filtered by computed_mood

8. **POPULAR Category**
```
@AIMusicVerseBot popular
```
Expected: All-time popular tracks (quality_score DESC)

### ⏳ Phase 3: Edge Cases

**Empty States:**
- Empty query: `@AIMusicVerseBot`
  - Expected: Show category buttons
  
**Guest Users:**
- Not logged in
  - Expected: Show limited public content + login button

**Pagination:**
- Query with 50+ results
  - Expected: Scroll to load more (offset parameter)

**Special Characters:**
- `@AIMusicVerseBot "rock & roll"`
- `@AIMusicVerseBot электро`
  - Expected: Proper escaping, Russian support

### ⏳ Phase 4: Performance

**Metrics to Check:**
```sql
-- Query performance
EXPLAIN ANALYZE
SELECT * FROM tracks
WHERE is_public = true
  AND status = 'completed'
  AND computed_genre = 'rock'
ORDER BY created_at DESC
LIMIT 20;

-- Materialized view refresh time
SELECT refresh_trending_tracks();

-- Index usage
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname = 'tracks';
```

**Expected Performance:**
- Query execution: <100ms
- Materialized view refresh: <5s
- Index hit ratio: >95%

### ⏳ Phase 5: Analytics

**Tracking Verification:**
```sql
-- Check search history logging
SELECT 
  category,
  COUNT(*) as searches,
  AVG(results_count) as avg_results
FROM inline_search_history
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY category
ORDER BY searches DESC;

-- Top queries
SELECT 
  query,
  COUNT(*) as count
FROM inline_search_history
WHERE query != ''
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY query
ORDER BY count DESC
LIMIT 10;
```

## Manual Testing Script

```typescript
// Test inline query parser
import { parseInlineQuery } from './commands/inline-types.ts';

const testCases = [
  { input: '', expected: { category: 'public', searchQuery: '' } },
  { input: 'rock', expected: { category: 'public', searchQuery: 'rock' } },
  { input: 'my:jazz', expected: { category: 'my', searchQuery: 'jazz' } },
  { input: 'trending:', expected: { category: 'trending', searchQuery: '' } },
  { input: 'genre:pop', expected: { category: 'genre', filter: { genre: 'pop' } } },
  { input: 'mood:happy', expected: { category: 'mood', filter: { mood: 'happy' } } },
];

testCases.forEach(test => {
  const result = parseInlineQuery(test.input);
  console.log(`Input: "${test.input}"`, result);
  // Verify against expected
});
```

## Deployment Checklist

- [ ] Apply SQL migration to production
- [ ] Refresh trending_tracks materialized view
- [ ] Monitor error rates in first hour
- [ ] Check search history for usage patterns
- [ ] Verify cache hit rates
- [ ] Monitor API response times
- [ ] Check Telegram Bot API quota usage

## Rollback Plan

If issues occur:

1. **Revert handler:**
```typescript
// In index.ts, change back to:
import { handleInlineQuery } from './commands/inline.ts';
```

2. **Keep migration:**
   - Migration adds only new columns/tables
   - Old handler still works
   - Can fix and redeploy enhanced version

3. **Emergency:**
```sql
-- Disable computed columns temporarily
ALTER TABLE tracks DROP COLUMN IF EXISTS computed_genre CASCADE;
ALTER TABLE tracks DROP COLUMN IF EXISTS computed_mood CASCADE;
ALTER TABLE tracks DROP COLUMN IF EXISTS search_vector CASCADE;
```

## Success Metrics

**Week 1 Targets:**
- Inline queries: 50-100/day → 200-300/day (+150%)
- Public content usage: 0% → 60%
- Average results per query: 2-5 → 10-15 (+200%)
- User satisfaction: N/A → >4/5 stars

**Month 1 Targets:**
- Inline queries: 50-100/day → 300-500/day (+300%)
- Category distribution: 100% my → 40% my, 60% other
- Repeat usage: <10% → 30%

## Known Issues & Limitations

1. **Materialized View Refresh**
   - Currently manual (`refresh_trending_tracks()`)
   - TODO: Add to cron job (every 15 minutes)

2. **Genre/Mood Detection**
   - Keyword-based, not ML
   - Limited to predefined categories
   - TODO: Improve with AI classification

3. **Full-Text Search**
   - Russian language only
   - TODO: Add multi-language support

4. **Performance**
   - No query result caching yet
   - TODO: Add Redis/Supabase caching layer

## Next Steps

1. ✅ SQL migration created
2. ✅ TypeScript types implemented
3. ✅ Enhanced handler implemented
4. ✅ Integrated with main bot
5. ⏳ Apply migration to database
6. ⏳ Test all 8 categories
7. ⏳ Monitor and optimize
8. ⏳ Add empty state UI
9. ⏳ Complete documentation

---

**Status:** 50% Complete  
**Next:** Database migration and integration testing  
**ETA:** 2-3 days for full deployment
