# Migration Reconciliation Report — Sprint 050-A3

**Date:** 2026-07-05  
**Status:** ⏳ In Progress  
**Priority:** 🟠 High (blocks deployment stability)

---

## 📋 Context

Two overlapping migrations for per-version track likes exist:

1. **`20260703120000_per_version_track_likes.sql`** (Sprint 049)
   - Original migration from Sprint 049 mobile audit
   - **Status:** In repository, NOT applied to prod
   - **Impact:** 138 lines, comprehensive per-version likes

2. **`20260704014859_14c0baab...`** (Lovable hotfix)
   - Hotfix pushed directly to main
   - **Status:** Applied to prod ✅
   - **Impact:** 115 lines (subset) + homepage genre index

---

## 🔍 Analysis

### Overlap Comparison

| Feature                              | Sprint 049 Migration | Lovable Hotfix | Overlap        |
| ------------------------------------ | -------------------- | -------------- | -------------- |
| `track_version_id` column            | ✅                   | ✅             | ✅             |
| Backfill existing likes              | ✅                   | ✅             | ✅             |
| NOT NULL constraint                  | ✅                   | ✅             | ✅             |
| Unique constraint (user, version)    | ✅                   | ✅             | ✅             |
| Index `idx_track_likes_version`      | ✅                   | ✅             | ✅             |
| Trigger `resolve_track_like_version` | ✅                   | ✅             | ✅             |
| `track_versions.likes_count`         | ✅                   | ✅             | ✅             |
| Backfill counts                      | ✅                   | ✅             | ✅             |
| Update trigger function              | ✅                   | ✅             | ✅             |
| **Homepage genre index**             | ❌                   | ✅             | ✅ (exclusive) |
| **Comprehensive comments**           | ✅                   | ❌             | ❌             |

### Key Differences

**Sprint 49 migration has:**

- Detailed comments explaining each step
- COMMENT ON COLUMN statements for documentation
- More descriptive migration structure

**Lovable hotfix has:**

- Homepage genre index (exclusive feature)
- More compact, production-ready format
- Already applied to prod

---

## ✅ Current State

### Production Database

- ✅ Lovable hotfix `20260704014859` is **APPLIED**
- ✅ All per-version likes functionality is **ACTIVE**
- ✅ Homepage genre index exists
- ❌ Sprint 49 migration `20260703120000` is **NOT applied** (would fail if run)

### Repository State

- ✅ Both migrations exist in `supabase/migrations/`
- ⚠️ Sprint 49 migration is now **stale** (changes already applied via hotfix)
- ⚠️ Running Sprint 49 migration would cause **errors** (duplicate objects)

---

## 🎯 Recommendations

### Option 1: Archive Sprint 49 Migration (Recommended) ✅

**Action:** Rename Sprint 49 migration to mark as archived:

```bash
mv supabase/migrations/20260703120000_per_version_track_likes.sql \
   supabase/migrations/.archive/20260703120000_per_version_track_likes.sql.obsolete
```

**Pros:**

- Prevents accidental re-application
- Keeps migration for historical reference
- Clear signal that hotfix superseded it

**Cons:**

- Loses detailed comments (can extract to docs)

### Option 2: Extract Comments to Documentation

**Action:** Create migration documentation before archiving:

```markdown
# docs/migrations/per-version-track-likes.md

## Per-Version Track Likes Migration (2026-07-03)

**Migrations:** `20260703120000` (archived) → `20260704014859` (applied)

### What Changed

- [Keep detailed comments from Sprint 49 migration]
```

### Option 3: Delete Sprint 49 Migration ❌

**Action:** Remove `20260703120000_per_version_track_likes.sql`

**Pros:**

- Eliminates confusion
- Single source of truth

**Cons:**

- Loses historical context
- Can't recover detailed comments

---

## 🔧 Implementation Plan (Recommended)

### Step 1: Extract Documentation

```bash
# Create migration docs directory
mkdir -p docs/migrations

# Extract comments from Sprint 49 migration
# (Manual extraction of key explanations)
```

### Step 2: Archive Stale Migration

```bash
# Archive Sprint 49 migration
mkdir -p supabase/migrations/.archive
mv supabase/migrations/20260703120000_per_version_track_likes.sql \
   supabase/migrations/.archive/
```

### Step 3: Document Applied Hotfix

```bash
# Create record of applied migration
echo "20260704014859 - Per-version track likes + homepage index (applied 2026-07-04)" \
  >> supabase/migrations/.applied-migrations.txt
```

### Step 4: Verify Production Schema

```bash
# Check current schema
supabase db remote:changes

# Verify objects exist
supabase db remote:table track_likes
supabase db remote:columns track_likes
supabase db remote:function resolve_track_like_version
```

---

## 📊 Migration Inventory

### Applied (✅)

| ID               | Date       | Description                          | Status     |
| ---------------- | ---------- | ------------------------------------ | ---------- |
| `20260704014859` | 2026-07-04 | Per-version likes + genre index      | ✅ Applied |
| `20260704015457` | 2026-07-04 | Fix trigger update_track_likes_count | ✅ Applied |
| `20260704015640` | 2026-07-04 | Security hardening RLS               | ✅ Applied |

### Not Applied (⏳)

| ID               | Date       | Description             | Status                 |
| ---------------- | ---------- | ----------------------- | ---------------------- |
| `20260703120000` | 2026-07-03 | Per-version track likes | ⚠️ Superseded          |
| `20260703130000` | 2026-07-03 | Homepage genre index    | ⚠️ Partially in hotfix |

### Archived (📦)

| ID               | Date       | Description             | Action            |
| ---------------- | ---------- | ----------------------- | ----------------- |
| `20260703120000` | 2026-07-03 | Per-version track likes | Move to .archive/ |

---

## 🚨 Risks

### High Risk ❌

- Running `20260703120000` on prod would **FAIL** (duplicate objects)
- Confusion about which migration is "correct"

### Medium Risk 🟠

- Loss of detailed comments from Sprint 49
- Future developers might try to apply stale migration

### Low Risk 🟢

- Hotfix is already applied and working
- Homepage genre index is present

---

## ✅ Definition of Done

- [ ] Sprint 49 migration archived to `.archive/`
- [ ] Documentation created for per-version likes
- [ ] Production schema verified against applied migrations
- [ ] Migration inventory updated
- [ ] Sprint 050-A3 marked complete

---

## 📝 Next Steps

1. Archive Sprint 49 migration
2. Extract comments to docs
3. Verify production schema
4. Update SPRINT-PROGRESS.md
5. Complete Sprint 050-A3

---

**Prepared by:** Claude Code  
**Sprint:** 050-A3  
**Date:** 2026-07-05
