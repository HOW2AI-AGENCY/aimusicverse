# Sprint 050 Mobile Audit F1-F12 - Current Status

## ✅ ALREADY FIXED (Sprint 049)

### F1: Scroll/Viewport Issues ✅

**Status:** FIXED in Sprint 049
**Evidence:** `usePullToRefresh.ts` lines 71-81 - `getScrollParent()` function resolves real scroll parent
**Commit:** Reference in docs/sprints/SPRINT-049-RETRO.md

### F8: Pull-to-Refresh Blocking Scroll ✅

**Status:** FIXED in Sprint 049
**Evidence:** `usePullToRefresh.ts` line 97 - reads scrollParent.scrollTop instead of container.scrollTop
**Fix:** Guard "only when scrolled to top" now works correctly

### F9: Genre Tab Flash Empty ✅

**Status:** FIXED in Sprint 049  
**Evidence:** `GenreTabsSection.tsx` line 239 - proper loading state handling
**Code:** `isLoading={isLoading || (genre.id === activeGenre && isActiveGenreLoading)}`
**Fix:** Active genre loading state now properly accounted for

## 🔴 REMAINING ISSUES

### P1 - HIGH PRIORITY

#### F3: Keyboard Navigation (Library.tsx:122-172)

**Status:** NOT FIXED
**Problems:**

- No `aria-selected` on arrow navigation
- No scroll-into-view on keyboard selection
- Library.tsx:450 `onPlay` couples select-and-play

**File:** `src/pages/Library.tsx`  
**Estimate:** 0.5 day

#### F6: Master Volume Snap (StudioShell.tsx:495)

**Status:** NOT FIXED
**Problem:** Unmute snaps to 0.85, ignores previous non-zero value  
**File:** `src/components/studio/StudioShell.tsx:495`
**Estimate:** 0.3 day

#### F7: Studio Pages (4 issues)

**Status:** NOT FIXED  
**Files:**

- `src/pages/studio/LyricsStudioPage.tsx` (lines 511, 181-190, 469)
- `src/components/layout/DesktopContentHubLayout.tsx` (lines 65-72)

**Problems:**

1. `existingNote={null}` always (overwrites previous notes)
2. Template param change doesn't refresh sections
3. AI agent gets `notes: undefined` despite existing notes
4. Empty-state placeholder removed on 2xl+ screens

**Estimate:** 0.5 day

### P2 - MEDIUM PRIORITY

#### F2: Surface Issues

**Status:** NEEDS INVESTIGATION
**Various UI surface polish issues**
**Estimate:** 0.3 day

#### F5: Touch Targets

**Status:** NEEDS INVESTIGATION
**Some touch targets <44px**
**Estimate:** 0.3 day

#### F11: Visual Polish

**Status:** NEEDS INVESTIGATION  
**Cosmetic visual issues**
**Estimate:** 0.2 day

### LOW PRIORITY

#### F4: Data Cleanup

**Status:** NEEDS INVESTIGATION
**Query optimization, cleanup**
**Estimate:** 0.3 day

#### F10: Form Validation

**Status:** NEEDS INVESTIGATION
**Form validation improvements**  
**Estimate:** 0.2 day

#### F12: Code Hygiene

**Status:** NEEDS INVESTIGATION
**Dead code cleanup**
**Estimate:** 0.2 day

## 📊 SUMMARY

| Phase    | Flags         | Status     | Work Remaining |
| -------- | ------------- | ---------- | -------------- |
| B1 (P0)  | F1, F8, F9    | ✅ FIXED   | 0 days         |
| B2 (P1)  | F3, F6, F7    | 🔴 TODO    | 1.3 days       |
| B3 (P2)  | F2, F5, F11   | 🟡 TODO    | 0.8 days       |
| B4 (Low) | F4, F10, F12  | 🟢 TODO    | 0.7 days       |
| B5       | ErrorBoundary | ⏳ Pending | 0.3 days       |
| B6       | Bundle wins   | ⏳ Pending | 0.7 days       |

**Total Remaining Work:** ~3.8 days (down from original 4 days)

## 🎯 RECOMMENDED APPROACH

### Option A: Complete All (Recommended)

- **Time:** 4-5 days total
- **Value:** Clean UX, zero known mobile issues
- **Risk:** Low (most fixes are straightforward)

### Option B: P1 Only (MVP)

- **Time:** 1.5 days
- **Value:** Fix critical user friction
- **Risk:** Very low (targeted fixes)
- **Scope:** F3, F6, F7 only

### Option C: Document & Defer

- **Time:** 0.5 days
- **Value:** Clear documentation for future
- **Risk:** None (just documentation)
- **Scope:** Document all remaining flags as technical debt

## 🔍 NEXT STEPS

1. **Verify F1/F8/F9 fixes** work correctly (smoke test)
2. **Choose approach** (A/B/C) based on timeline
3. **Execute fixes** starting with P1 (F3, F6, F7)
4. **E2E coverage** for mobile scenarios
5. **Update docs** (SPRINT-PROGRESS.md, PROJECT_STATUS.md)

---

**Status Update:** 3/12 flags already fixed (25% complete)  
**Critical Issues:** 3 remaining (F3, F6, F7)  
**Recommended:** Option B (P1 only) for Sprint 050 closure
