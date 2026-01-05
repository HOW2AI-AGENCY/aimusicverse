# Unified Interface - Analysis Remediation Plan

**Date**: 2026-01-05  
**Analysis Source**: speckit-analyze comprehensive audit  
**Status**: Action Items Identified

## Executive Summary

**Quality Score**: 7.5/10  
**Risk Level**: MEDIUM-HIGH  
**Overall Status**: CONDITIONAL PROCEED - Fix critical issues before Sprint 2

### Key Findings
- ✅ **Strengths**: Strong foundation, comprehensive documentation, systematic approach
- 🚨 **Critical Issues**: 3 blockers requiring immediate action
- ⚠️ **High Priority**: 17 issues needing attention
- 📊 **Progress**: 29 tasks completed (not 32 as claimed in spec.md)

---

## CRITICAL ISSUES (Must Fix Before Proceeding)

### 🚨 Issue #1: Bundle Size Violation
**Status**: CRITICAL BLOCKER  
**Current**: 1748 KB (798 KB over 950 KB limit - 84% over budget)  
**Impact**: Violates constitution, blocks production deployment  
**Required**: < 950 KB gzipped

**Root Cause**: T007 (Tone.js lazy loading) marked complete but bundle still exceeds limit

**Action Plan**:
1. **Verify T007 Implementation** (1 hour)
   - Run production build: `npm run build`
   - Check if Tone.js is actually lazy-loaded: inspect dist/ chunks
   - Review toneLoader.ts implementation

2. **Create Emergency Task T070** (2-3 days)
   ```markdown
   T070 [CRITICAL] Emergency bundle size optimization
   - Acceptance: Production bundle < 950KB gzipped
   - Actions:
     - Audit all chunks using vite-bundle-visualizer
     - Lazy load Wavesurfer.js (~150KB)
     - Remove unused dependencies (check with depcheck)
     - Split feature chunks more aggressively
     - Consider deferring non-critical features
   - Verification: `npm run build && .specify/scripts/check-bundle-size.sh`
   - Priority: P0 (blocks Sprint 2)
   ```

3. **Add Pre-Sprint 2 Checkpoint**
   - Update plan.md: "Sprint 2 CANNOT start until bundle < 950KB"
   - Add daily monitoring: Track bundle size in PR descriptions

**Owner**: Frontend Lead  
**Deadline**: Before Sprint 2 starts (2-3 days)  
**Fallback**: If < 950KB impossible, request constitution amendment (requires maintainer approval)

---

### 🚨 Issue #2: T020 Blocker (Playlist Detail View Missing)
**Status**: CRITICAL BLOCKER  
**Current**: T020 blocked due to missing product feature  
**Impact**: Blocks Sprint 1 completion, affects Sprint 2 timeline

**Product Decision Required**: How should playlist track display work?

**Options**:

**Option A - Quick Fix (2 days)**
- Implement T020-ALT: Apply VirtualizedTrackList to playlist CARDS instead of track list
- Update T020 acceptance: "Playlists.tsx uses VirtuosoGrid for playlist cards (not tracks)"
- Pros: Unblocks Sprint 1, delivers immediate performance improvement
- Cons: Doesn't address long-term playlist detail view

**Option B - Full Implementation (3-5 days)**
- Build basic playlist detail view showing track list
- Apply VirtualizedTrackList to this new view
- Update routes to support `/playlists/:id` path
- Pros: Delivers complete feature
- Cons: Delays Sprint 1, adds scope creep

**Option C - Defer (0 days)**
- Mark T020 as DEFERRED in tasks.md
- Adjust Sprint 1 success criteria to exclude T020
- Document in retrospective
- Pros: Fastest path forward
- Cons: Incomplete Sprint 1, tech debt

**Recommendation**: **Option A** (T020-ALT) - Best balance of speed and value

**Owner**: Product Manager (decision), Frontend Dev (implementation)  
**Deadline**: Decision by end of week, implementation in Sprint 1 buffer

---

### 🚨 Issue #3: Task Completion Count Discrepancy
**Status**: HIGH  
**Claimed**: 32 tasks complete (spec.md line 349)  
**Actual**: 29 tasks complete (grep count from tasks.md)  
**Impact**: Status reporting inaccuracy, velocity calculations wrong

**Action Plan**:
1. **Audit Task Completion** (30 minutes)
   - Manual review of tasks.md checkboxes
   - Verify T028-T032 completion notes (some marked "No work needed")
   - Check if any tasks were split or combined

2. **Update Spec.md Status** (15 minutes)
   - Line 349: Change "32 tasks" to "29 tasks"
   - Add note: "T020 blocked, T015/T022 pending device testing"
   - Update percentage: "29/70 tasks (41% complete)"

3. **Add Sprint Velocity Tracking** (15 minutes)
   - Calculate: 29 tasks / ~7 days = 4.1 tasks/day
   - Add to spec.md: "Sprint 1: 14/17 tasks (82%), 2 days remaining"

**Owner**: Project Manager  
**Deadline**: Today (1 hour)

---

## HIGH PRIORITY ISSUES (Fix Within 1 Week)

### ⚠️ Issue #4: Missing FR-to-Task Mapping
**Impact**: Can't verify all 30 functional requirements are covered

**Action Plan**: Create mapping table in plan.md

See **FR-TO-TASK-MAPPING.md** (created alongside this file) for complete table.

**Owner**: Technical Lead  
**Timeline**: 2 hours  
**Benefit**: Identifies 3 critical gaps (FR-006, FR-021, FR-023)

---

### ⚠️ Issue #5: Accessibility Gaps (FR-021, FR-023)
**Impact**: WCAG AA compliance at risk, blocks SC-013 success criteria

**Missing Tasks**:

```markdown
T071 [P1] [US6] Audit and fix ARIA labels on icon-only buttons
- Acceptance: All icon-only buttons have aria-label or aria-labelledby
- Scope: TrackCard, PlaylistCard, MobileHeaderBar, Player controls
- Validation: Run axe-core DevTools, zero "button-name" violations
- Estimate: 3 hours
- Sprint: Sprint 3

T072 [P1] [US6] Implement focus trap in all modals
- Acceptance: Tab navigation stays within modal, Escape closes modal
- Scope: ResponsiveModal, MobileBottomSheet, MobileActionSheet
- Validation: Manual keyboard testing, no focus escape
- Estimate: 2 hours
- Sprint: Sprint 3
```

**Owner**: Accessibility Specialist  
**Timeline**: Add to tasks.md now, implement in Sprint 3

---

### ⚠️ Issue #6: Vague Testing Task Acceptance Criteria
**Impact**: Can't verify tests actually cover requirements

**Affected Tasks**: T015, T022, T035, T044, T061

**Action Plan**: Add specific test case checklists

**Example Fix for T015**:
```markdown
- [ ] T015 [US1] Test navigation on real devices (iPhone 14 Pro, Pixel 7)
  - **Acceptance**: All test cases pass on both devices
  - **Test Cases**:
    - ✅ Navigate Home→Library→Create→Projects→More→Home (full cycle)
    - ✅ Tap Create FAB, verify back button appears, tap back
    - ✅ Verify bottom nav highlights correct tab after navigation
    - ✅ On iPhone 14 Pro: Verify no content hidden behind notch/status bar
    - ✅ On Pixel 7: Verify safe areas respected with gesture navigation
    - ✅ All nav buttons trigger haptic feedback (feel vibration)
    - ✅ Navigation transitions smooth (<500ms), no flicker
  - **Estimate**: 2 hours
  - **Rollback**: N/A (testing only)
  - **Dependencies**: T011-T014
```

**Owner**: QA Lead  
**Timeline**: 1 hour to update all 5 testing tasks

---

### ⚠️ Issue #7: Priority System Confusion
**Impact**: Unclear task execution order

**Problem**: User Stories use P1/P2/P3, but tasks use P0/P1/P2/P3

**Action Plan**: Add legend to tasks.md

```markdown
## Priority Legend

**User Story Priority** (in spec.md):
- P1: Core functionality, must have for MVP
- P2: Power user features, important but not blocking
- P3: Polish and enhancements, nice to have

**Task Priority** (in tasks.md):
- P0: Critical blocker, must complete before sprint ends
- P1: High impact, should complete in current sprint
- P2: Medium impact, can defer to next sprint if needed
- P3: Low impact, cleanup and polish

**Note**: A P1 User Story may contain P0 tasks (critical path) and P2 tasks (nice-to-have).
```

**Owner**: Project Manager  
**Timeline**: 15 minutes

---

## MEDIUM PRIORITY ISSUES (Fix Within 2 Weeks)

### Issue #8: Spec.md Open Questions Incomplete
**Action**: Update spec.md line 397-409
```markdown
## Open Questions

**Q1: Playlist Detail View - When Implemented?**
- Status: BLOCKING T020
- Impact: Sprint 1 completion uncertain
- Decision Required: Product Manager
- Options: Build now (3-5 days), defer to Sprint 3, or implement T020-ALT workaround
- Deadline: End of week

**Q2: Bundle Size - Is Constitution Limit Negotiable?**
- Status: 798KB over limit
- Impact: Production deployment blocked
- Decision Required: Architecture Team
- Options: Optimize to <950KB (recommended), request limit increase to 1200KB (requires approval)
- Deadline: Before Sprint 2
```

**Timeline**: 10 minutes

---

### Issue #9: Edge Case Testing Not Planned
**Impact**: 8 edge cases in spec.md not covered by tasks

**Action**: Add task T067

```markdown
- [ ] T067 [US6] Test all edge cases from spec.md section
  - **Acceptance**: All 8 edge cases tested and documented
  - **Edge Cases**:
    1. Modal stacking (open modal from modal)
    2. Landscape orientation handling
    3. Network errors during generation
    4. Virtual keyboard covering forms
    5. Very long track titles (>100 chars)
    6. Empty library states
    7. Slow network (3G throttled)
    8. Offline mode
  - **Deliverable**: Edge case test report with screenshots
  - **Estimate**: 4 hours
  - **Sprint**: Sprint 5
  - **Priority**: P2
```

**Timeline**: Add now, execute in Sprint 5

---

### Issue #10: Constitution Violation Documentation
**Action**: Update constitution.md to reference ResponsiveModal

Add to constitution.md Section VIII:

```markdown
**Modal Pattern Hierarchy**:
1. MobileBottomSheet (mobile forms, 50%+ height)
2. MobileActionSheet (mobile menus, <50% height)
3. Dialog (desktop only, confirmations)
4. ResponsiveModal (auto-switches between Dialog/BottomSheet based on viewport)

**When to Use ResponsiveModal**:
- Settings/Profile edit forms
- Create playlist
- Filter/sort options
- Any form that needs both mobile and desktop support

**Note**: ResponsiveModal is NOT a new pattern - it's a convenience wrapper that automatically selects the correct pattern based on viewport size.
```

**Timeline**: 30 minutes

---

### Issue #11: Rollback Plan Standardization
**Action**: Add rollback template to tasks.md header

```markdown
## Rollback Plan Template

All tasks must include rollback plan in this format:

**Rollback**:
1. Set feature flag: `FEATURE_NAME_ENABLED=false` in `.env.local`
2. Restart dev server: `npm run dev`
3. Verify old behavior restored
4. If issues persist: `git revert <commit-sha>`
5. If multiple commits: `git revert <sha1> <sha2> <sha3>`

**Example**:
- Rollback: 1) Set UNIFIED_NAV_ENABLED=false, 2) Restart, 3) Verify bottom nav works, 4) If broken, git revert abc1234
```

**Timeline**: 1 hour to update all tasks

---

## Dependency Chain Fixes

### Issue #12: T022 Blocked by T020
**Problem**: T022 (performance testing) depends on T020, but T020 is blocked

**Fix**: Update T022 dependencies in tasks.md
```markdown
- [ ] T022 [US2] Performance test with Chrome DevTools on lists >500 items
  - **Acceptance**: Maintain 60 FPS during scrolling, memory usage <100MB increase
  - **Estimate**: 1.5 hours
  - **Rollback**: N/A (testing only)
  - **Dependencies**: T019, T021 (T020 optional - skip if still blocked)
  - **Scope**: Test Library and Community pages (skip Playlists if T020 not done)
```

---

### Issue #13: T065 Premature Without T053
**Problem**: T065 (remove deprecated components) depends on T053 (modal audit) which isn't started

**Fix**: Move T065 to after T053 in sprint order

Update tasks.md Sprint 5:
```markdown
- [ ] T053 [US6] Audit all Dialog usages for mobile appropriateness
  - ... (existing task)

- [ ] T065 [US6] Remove deprecated components after migration complete
  - **Dependencies**: T018 (✅ complete), T053 (⏸️ must complete first)
  - **Note**: CANNOT proceed until T053 confirms no more Dialog usages on mobile
```

---

## Quick Wins (Low Priority, Easy Fixes)

### Issue #14: Add User Story Short Codes to Spec.md
**Timeline**: 10 minutes

Update spec.md user story headings:
```markdown
### US1: Navigate Between Main Sections (Priority: P1)
### US2: Browse and Interact with Track Lists (Priority: P1)
### US3: Create Music with Generation Form (Priority: P1)
### US4: Manage Playlists and Projects (Priority: P2)
### US5: Work in Studio with Tabs and Mixer (Priority: P2)
### US6: Consistent Modal Patterns (Priority: P2)
### US7: Theme and High Contrast (Priority: P3)
### US8: Share Music to Telegram (Priority: P3)
```

---

### Issue #15: Standardize Terminology (Sprint vs Phase)
**Timeline**: 30 minutes

**Decision**: Use "Phase" for high-level, "Sprint" for implementation

- Phase 0: Research (research.md)
- Phase 1: Design (plan.md, data-model.md, quickstart.md)
- Phase 2: Implementation (tasks.md)
  - Sprint 0: Setup & Baseline
  - Sprint 1: Touch Targets & Lists
  - Sprint 2: Modal Migration
  - Sprint 3: Virtualization
  - Sprint 4: Header Unification
  - Sprint 5: Testing & Cleanup

Update all documents to use consistent terminology.

---

## Completion Checklist

### Week 1 (This Week)
- [ ] **CRITICAL**: Fix bundle size to <950KB (T070)
- [ ] **CRITICAL**: Resolve T020 blocker (product decision + implementation)
- [ ] **CRITICAL**: Update task completion count in spec.md (29 not 32)
- [ ] **HIGH**: Create FR-to-Task mapping table
- [ ] **HIGH**: Add T071-T072 accessibility tasks
- [ ] **HIGH**: Update testing task acceptance criteria
- [ ] **MEDIUM**: Add priority legend to tasks.md
- [ ] **MEDIUM**: Update spec.md open questions

### Week 2
- [ ] Complete Sprint 1 remaining tasks (T015, T022)
- [ ] Sprint 1 retrospective and velocity update
- [ ] Verify Sprint 1 success criteria met
- [ ] Start Sprint 2 with confidence

### Week 3+
- [ ] Continue Sprint 2-5 as planned
- [ ] Monitor bundle size after each PR
- [ ] Update migration tracker weekly
- [ ] Add edge case testing (T067)
- [ ] Implement accessibility tasks (T071-T072)

---

## Success Metrics

**Before Remediation**:
- Bundle: 1748KB (798KB over)
- Task Count: 29 (reported as 32)
- FR Coverage: 68%
- Blockers: 2 critical (bundle, T020)
- Quality Score: 7.5/10

**After Remediation Target**:
- Bundle: <950KB (goal met)
- Task Count: Accurate reporting
- FR Coverage: 90%+ (add missing tasks)
- Blockers: 0 critical
- Quality Score: 9.0/10

---

## Review Schedule

- **Daily**: Bundle size check in PR description
- **Weekly**: Migration tracker update
- **Sprint End**: Retrospective with velocity metrics
- **Phase 2 Complete**: Final quality audit

---

## Contact & Escalation

**Critical Issues**:
- Bundle Size: Frontend Lead
- Product Decisions (T020): Product Manager
- Architecture: Architecture Team

**Escalation Path**:
1. Daily standup (routine updates)
2. Slack/Teams (blocking issues)
3. Emergency meeting (critical blockers)

---

**Document Status**: Living Document  
**Last Updated**: 2026-01-05  
**Next Review**: After Week 1 remediation items complete
