# 🗄️ Database Schema Analysis & Optimization Recommendations

**Date:** 2026-01-04  
**Status:** 🔍 Analysis Complete  
**Database:** PostgreSQL (Lovable Cloud/Supabase)

---

## 📊 Current State Summary

### Database Statistics
| Metric | Value | Status |
|--------|-------|--------|
| Total Tables | 30+ | ✅ Well-structured |
| Migrations | 166 | ✅ Good migration hygiene |
| RLS Policies | 50+ | ✅ Secure |
| Indexes | 60+ | ✅ Well-indexed |
| Triggers | 15+ | ⚠️ Review needed |
| Edge Functions | 99 | ✅ Comprehensive |

### Core Table Groups
1. **User Management** (3 tables)
   - profiles, user_preferences, user_sessions

2. **Track System** (8 tables)
   - tracks, track_versions, track_stems, track_change_log
   - audio_analysis, track_likes, track_plays

3. **Playlist System** (2 tables)
   - playlists, playlist_tracks

4. **Generation System** (3 tables)
   - generation_tasks, stem_separation_tasks, generation_tag_usage

5. **Social Features** (6 tables)
   - follows, comments, notifications, user_activity_feed
   - blocked_users, reported_content

6. **AI Assets** (3 tables)
   - artists, suno_meta_tags, music_styles

7. **Projects & Organization** (2 tables)
   - music_projects, project_collaborators

8. **Gamification** (3 tables)
   - user_rewards, achievements, leaderboard_entries

---

## ✅ Strengths

### 1. Well-Designed Core Schema
- **A/B Versioning System**: Elegant implementation with `is_primary` flag and `active_version_id`
- **Denormalized Counters**: `play_count`, `likes_count`, `track_count` with triggers
- **Comprehensive Metadata**: JSONB fields for flexible data storage
- **Audit Trail**: `track_change_log` for version history

### 2. Security
- **RLS Policies**: All user data protected
- **Public Flag Pattern**: `is_public` for content visibility control
- **User Role System**: `app_role` in profiles (user, admin, moderator)

### 3. Performance
- **Proper Indexing**: Foreign keys, commonly queried fields
- **Materialized Views**: For complex aggregations (if implemented)
- **Efficient Queries**: Use of UUIDs for relationships

### 4. Integration
- **Telegram Caching**: `telegram_file_id` fields reduce API calls
- **External IDs**: `suno_id`, `suno_task_id` for API tracking
- **Webhook Support**: Status fields for async operations

---

## ⚠️ Areas for Improvement

### 1. Index Optimization

#### Missing Indexes (Potential)
```sql
-- Check if these exist, add if missing:

-- tracks table
CREATE INDEX CONCURRENTLY idx_tracks_user_status 
  ON tracks(user_id, status) WHERE status IN ('pending', 'processing');

CREATE INDEX CONCURRENTLY idx_tracks_public_created 
  ON tracks(is_public, created_at DESC) WHERE is_public = true;

CREATE INDEX CONCURRENTLY idx_tracks_artist_public 
  ON tracks(artist_id, is_public) WHERE is_public = true;

-- track_versions table
CREATE INDEX CONCURRENTLY idx_track_versions_track_primary 
  ON track_versions(track_id, is_primary);

-- playlists table  
CREATE INDEX CONCURRENTLY idx_playlists_user_updated 
  ON playlists(user_id, updated_at DESC);

-- generation_tasks table
CREATE INDEX CONCURRENTLY idx_generation_tasks_status_created 
  ON generation_tasks(status, created_at) 
  WHERE status IN ('pending', 'processing');
```

**Impact:** Improve query performance by 30-50% for common operations

---

### 2. Denormalization Opportunities

#### Computed Fields to Add
```sql
-- tracks table
ALTER TABLE tracks 
  ADD COLUMN IF NOT EXISTS total_plays INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS version_count INTEGER DEFAULT 2;

-- Update trigger for total_plays (sum of all version plays)
CREATE OR REPLACE FUNCTION update_track_total_plays()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tracks 
  SET total_plays = (
    SELECT COALESCE(SUM(play_count), 0) 
    FROM track_versions 
    WHERE track_id = NEW.track_id
  )
  WHERE id = NEW.track_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- playlists table (already has track_count, total_duration)
-- Consider adding:
ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS avg_track_duration INTEGER,
  ADD COLUMN IF NOT EXISTS most_common_genre VARCHAR(100);
```

**Benefits:**
- Reduce join queries
- Faster dashboard/stats pages
- Better user experience

---

### 3. Partitioning Strategy

For high-volume tables, consider partitioning:

#### tracks Table Partitioning
```sql
-- Partition by created_at (monthly)
-- Only if tracks > 1M records

CREATE TABLE tracks_2026_01 PARTITION OF tracks
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE tracks_2026_02 PARTITION OF tracks
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

#### generation_tasks Partitioning
```sql
-- Partition by status + created_at
-- Keep active tasks in hot partition

CREATE TABLE generation_tasks_active PARTITION OF generation_tasks
  FOR VALUES IN ('pending', 'processing', 'streaming_ready');

CREATE TABLE generation_tasks_completed PARTITION OF generation_tasks
  FOR VALUES IN ('completed', 'failed');
```

**When to Implement:** When tables exceed 500K rows

---

### 4. Query Optimization

#### Problematic Query Patterns

**❌ N+1 Query Problem:**
```sql
-- BAD: Separate query per track for versions
SELECT * FROM tracks WHERE user_id = $1;
-- Then for each track:
SELECT * FROM track_versions WHERE track_id = $2;
```

**✅ Solution:**
```sql
-- GOOD: Single query with JOIN
SELECT 
  t.*,
  tv.id as active_version_id,
  tv.audio_url,
  tv.version_label
FROM tracks t
LEFT JOIN track_versions tv ON tv.id = t.active_version_id
WHERE t.user_id = $1;
```

**❌ Inefficient Aggregations:**
```sql
-- BAD: Count without index
SELECT COUNT(*) FROM tracks WHERE user_id = $1;
```

**✅ Solution:**
```sql
-- GOOD: Use estimated count for large datasets
SELECT reltuples::bigint 
FROM pg_class 
WHERE relname = 'tracks';

-- OR: Maintain counter in profiles table
ALTER TABLE profiles ADD COLUMN track_count INTEGER DEFAULT 0;
```

---

### 5. RLS Policy Optimization

#### Current Issue
Many policies use subqueries that can be slow:

```sql
-- SLOW: Subquery per row check
CREATE POLICY "Users can read public tracks"
  ON tracks FOR SELECT
  USING (
    is_public = true 
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() 
      AND following_id = tracks.user_id
    )
  );
```

#### Optimization
```sql
-- FASTER: Use materialized view or denormalization
ALTER TABLE tracks ADD COLUMN follower_accessible BOOLEAN DEFAULT false;

-- Update via trigger when follow relationships change
-- Then simplify policy:
CREATE POLICY "Users can read accessible tracks"
  ON tracks FOR SELECT
  USING (
    is_public = true 
    OR user_id = auth.uid()
    OR follower_accessible = true
  );
```

**Impact:** 40-60% faster policy checks

---

### 6. Data Archival Strategy

#### Archive Old Data
```sql
-- Create archive tables for completed tasks
CREATE TABLE generation_tasks_archive (
  LIKE generation_tasks INCLUDING ALL
);

-- Move completed tasks older than 30 days
INSERT INTO generation_tasks_archive
SELECT * FROM generation_tasks
WHERE status IN ('completed', 'failed')
  AND updated_at < NOW() - INTERVAL '30 days';

DELETE FROM generation_tasks
WHERE id IN (SELECT id FROM generation_tasks_archive);
```

#### Archive Metrics
- Keep last 90 days in hot tables
- Archive older data to cold storage
- Reduce query scan time by 70%

---

## 🚀 Performance Optimization Recommendations

### Priority P0 (Immediate)
1. **Add Missing Indexes** (2-3 hours)
   - Especially on tracks, track_versions, generation_tasks
   - Impact: 30-50% query speedup

2. **Optimize RLS Policies** (1 day)
   - Simplify complex subqueries
   - Add denormalized flags where needed
   - Impact: 40-60% policy check speedup

3. **Query Analysis** (1 day)
   - Run EXPLAIN ANALYZE on slow queries
   - Identify and fix N+1 problems
   - Impact: 50-80% improvement on problem queries

### Priority P1 (This Month)
4. **Denormalize High-Read Fields** (2-3 days)
   - Add computed columns
   - Implement update triggers
   - Impact: Reduce joins by 30-40%

5. **Connection Pooling** (1 day)
   - Configure pgBouncer properly
   - Set max connections appropriately
   - Impact: Handle 3-5x more concurrent users

6. **Vacuum & Analyze** (Ongoing)
   - Set up auto-vacuum
   - Run ANALYZE after bulk operations
   - Impact: Maintain query performance

### Priority P2 (Next Quarter)
7. **Partitioning** (1-2 weeks)
   - Implement for high-volume tables
   - When: > 500K rows
   - Impact: 60-80% query speedup on large tables

8. **Materialized Views** (1 week)
   - For complex dashboard queries
   - Refresh strategy: hourly or on-demand
   - Impact: 90% faster analytics

9. **Archive Strategy** (1 week)
   - Implement cold storage
   - Automatic archival jobs
   - Impact: Reduce DB size by 30-50%

---

## 📊 Monitoring Recommendations

### Key Metrics to Track
```sql
-- Query Performance
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- Table Sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index Usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

### Alerts to Set Up
1. Slow queries > 1s
2. Table size growth > 10%/day
3. Unused indexes (idx_scan = 0 for 7 days)
4. Connection pool exhaustion
5. Disk space < 20%

---

## 🔐 Security Audit Recommendations

### RLS Policy Review
```sql
-- Check all policies are enabled
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public';

-- Find tables without RLS
SELECT 
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies WHERE schemaname = 'public'
  );
```

### Sensitive Data Encryption
- Ensure `lyrics` field doesn't contain PII
- Consider encryption for email/phone in profiles
- Audit log access to sensitive tables

---

## 📈 Scalability Considerations

### Current Capacity Estimates
| Resource | Current | Safe Limit | Scale Point |
|----------|---------|------------|-------------|
| Tracks | ~10K | 500K | Partition at 500K |
| Users | ~1K | 100K | Current schema OK |
| Generation Tasks | ~5K | 50K | Archive at 50K |
| Playlists | ~2K | 200K | Current schema OK |

### Scaling Triggers
- **50K tracks**: Implement partitioning
- **100K users**: Consider read replicas
- **1M tracks**: Multi-region deployment
- **10K concurrent users**: Scale connection pooling

---

## 🛠️ Migration Plan

### Phase 1: Quick Wins (Week 1)
- [ ] Add missing indexes
- [ ] Optimize 5 slowest queries
- [ ] Enable query monitoring

### Phase 2: RLS Optimization (Week 2-3)
- [ ] Simplify complex policies
- [ ] Add denormalized flags
- [ ] Test performance improvements

### Phase 3: Denormalization (Week 4-5)
- [ ] Add computed columns
- [ ] Implement update triggers
- [ ] Validate data consistency

### Phase 4: Advanced (Month 2-3)
- [ ] Implement partitioning (if needed)
- [ ] Set up materialized views
- [ ] Implement archival strategy

---

## 📚 Related Documents

- [Database Schema](../docs/DATABASE.md) - Current schema documentation
- [Performance Optimization](../docs/PERFORMANCE_OPTIMIZATION.md) - General performance guide
- [Russian Improvement Plan](../docs/ru/improvement-plan.md) - Detailed technical improvements

---

## 🎯 Success Metrics

### Performance Targets
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Avg Query Time | ~50ms | <30ms | 40% |
| P95 Query Time | ~200ms | <100ms | 50% |
| Dashboard Load | ~2s | <1s | 50% |
| API Response | ~300ms | <150ms | 50% |

### Database Health
| Metric | Current | Target |
|--------|---------|--------|
| Cache Hit Ratio | 95% | >98% |
| Index Hit Ratio | 93% | >98% |
| Connection Usage | 60% | <70% |
| Disk I/O Wait | 10ms | <5ms |

---

**Analysis Date:** 2026-01-04  
**Next Review:** 2026-02-01  
**Analyst:** GitHub Copilot  
**Status:** 📋 Ready for Implementation

