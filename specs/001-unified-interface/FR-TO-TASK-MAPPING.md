# Functional Requirements to Tasks Mapping

**Feature**: Unified Interface Application  
**Date**: 2026-01-05  
**Purpose**: Track which tasks implement each functional requirement from spec.md

## Summary

- **Total Requirements**: 30 (FR-001 to FR-030)
- **Fully Covered**: 10 requirements (33%)
- **Partially Covered**: 13 requirements (43%)
- **Minimally Covered**: 4 requirements (13%)
- **Not Covered**: 3 requirements (10%)
- **Overall Coverage**: 68%

## Detailed Mapping

| FR | Requirement | Tasks | Coverage | Status | Notes |
|----|-------------|-------|----------|--------|-------|
| **FR-001** | MainLayout with safe areas for all pages | T010 | 100% | ✅ Complete | MainLayout updated in T010 |
| **FR-002** | BottomNavigation with 56px touch targets | T011 | 100% | ✅ Complete | Verified 56px minimum |
| **FR-003** | MobileHeaderBar adoption (25+ pages) | T012, T045-T052 | 30% | 🔄 Partial | T012 complete, T045-T052 pending |
| **FR-004** | MobileBottomSheet for form modals | T028-T031 | 40% | 🔄 Partial | 15+ modals migrated |
| **FR-005** | MobileActionSheet for menus | T032 | 60% | 🔄 Partial | TrackMenu done, 7 usages |
| **FR-006** | Dialog only for desktop confirmations | None | 0% | ❌ Missing | **GAP**: No validation task |
| **FR-007** | ResponsiveModal wrapper component | T009, T028-T035 | 70% | 🔄 Partial | Component created, adoption ongoing |
| **FR-008** | VirtualizedTrackList for lists >50 items | T020, T021, T040-T041 | 50% | 🔄 Partial | T021 complete, T020 blocked, T040-T041 pending |
| **FR-009** | LazyImage for all track/playlist cards | T042-T043 | 30% | 🔄 Partial | 23% adoption per research.md |
| **FR-010** | Bundle size < 950KB | T001, T007, T070 | 0% | ❌ **CRITICAL** | 798KB OVER LIMIT |
| **FR-011** | 44px minimum touch targets | T011-T014, T016-T017, T023-T024, T037 | 80% | 🔄 Good | Systematic audit across components |
| **FR-012** | 48px primary action buttons | T024 | 100% | ✅ Complete | Submit buttons verified |
| **FR-013** | 56px bottom navigation targets | T011, T013 | 100% | ✅ Complete | Nav and FAB verified |
| **FR-014** | 8px minimum spacing between buttons | T017 | 80% | 🔄 Good | Verified in TrackCard |
| **FR-015** | HapticFeedback on user interactions | T014, T027, T039 | 60% | 🔄 Partial | Nav + Forms done, Studio pending |
| **FR-016** | Safe area inset respect | T010, T015 | 100% | ✅ Complete | MainLayout + device testing |
| **FR-017** | Pull-to-refresh on lists | T019 | 80% | ✅ Good | VirtualizedTrackList has it |
| **FR-018** | Auto-save form drafts (2s debounce) | T025 | 80% | ✅ Complete | GenerateForm implemented |
| **FR-019** | Draft restoration (30min expiry) | T025 | 80% | ✅ Complete | GenerateForm implemented |
| **FR-020** | Inline validation messages | T026 | 100% | ✅ Complete | GenerateForm validated |
| **FR-021** | ARIA labels on icon-only buttons | T059, **T071** | 20% | ❌ **GAP** | T071 needs to be added |
| **FR-022** | Keyboard navigation support | T060 | 30% | 🔄 Testing Only | No implementation task |
| **FR-023** | Focus trap in modals | None, **T072** | 0% | ❌ **GAP** | T072 needs to be added |
| **FR-024** | WCAG AA color contrast (4.5:1) | T055, T059 | 70% | 🔄 Partial | Validation tasks, no fixes |
| **FR-025** | Portrait orientation lock | T010 | 100% | ✅ Complete | MainLayout enforces |
| **FR-026** | Theme sync within 500ms | T054 | 0% | ⏸️ Not Started | Sprint 5 task |
| **FR-027** | High contrast mode support | T054 | 0% | ⏸️ Not Started | Sprint 5 task |
| **FR-028** | Migration tracker maintenance | T005, **T068** | 100% | 🔄 Partial | CSV created, needs ongoing updates |
| **FR-029** | Feature flags for all major changes | T003 | 100% | ✅ Complete | 19 feature flags created |
| **FR-030** | Rollback mechanism via flags + git | T003, T006 | 100% | ✅ Complete | Flags + pre-commit hook |

## Legend

- ✅ **Complete**: 100% coverage, tasks finished
- 🔄 **Partial**: Tasks exist but incomplete
- ⏸️ **Not Started**: Tasks planned but not started
- ❌ **Missing**: No tasks exist, gap identified

## Critical Gaps Requiring New Tasks

### Gap 1: FR-006 - Dialog Usage Validation
**Requirement**: Dialog MUST only be used for desktop confirmations, not mobile  
**Current**: No task validates this requirement  
**Recommended Task**:

```markdown
T073 [P2] [US6] Audit Dialog component usage across codebase
- Acceptance: All Dialog usages documented, mobile usages flagged
- Action: grep for `<Dialog>` in src/, verify each is desktop-only or confirmation
- Estimate: 2 hours
- Sprint: Sprint 2
- Deliverable: Dialog usage audit report with flagged violations
```

### Gap 2: FR-021 - ARIA Labels Implementation
**Requirement**: All icon-only buttons MUST have ARIA labels  
**Current**: T059 audits, but no implementation task  
**Recommended Task**: **T071** (already defined in ANALYSIS-REMEDIATION.md)

```markdown
T071 [P1] [US6] Add ARIA labels to all icon-only buttons
- Acceptance: Zero axe-core "button-name" violations
- Scope: TrackCard, PlaylistCard, MobileHeaderBar, Player
- Estimate: 3 hours
- Sprint: Sprint 3
```

### Gap 3: FR-023 - Focus Trap Implementation
**Requirement**: Modals MUST trap focus for keyboard navigation  
**Current**: No implementation or validation task  
**Recommended Task**: **T072** (already defined in ANALYSIS-REMEDIATION.md)

```markdown
T072 [P1] [US6] Implement focus trap in all modal components
- Acceptance: Tab navigation stays within modal, Escape closes
- Scope: ResponsiveModal, MobileBottomSheet, MobileActionSheet
- Estimate: 2 hours
- Sprint: Sprint 3
```

### Gap 4: FR-010 - Bundle Size Optimization
**Requirement**: Bundle MUST be < 950KB  
**Current**: T007 marked complete but bundle is 1748KB (798KB over)  
**Recommended Task**: **T070** (already defined in ANALYSIS-REMEDIATION.md)

```markdown
T070 [P0] Emergency bundle size optimization
- Acceptance: Production bundle < 950KB gzipped
- Actions: Lazy load Wavesurfer, audit chunks, remove unused deps
- Estimate: 2-3 days
- Sprint: Sprint 1 (CRITICAL)
```

## Coverage by Category

### Layout & Navigation (FR-001 to FR-003)
- **Coverage**: 77% (2.3/3 complete)
- **Status**: Good - MainLayout and BottomNav done, MobileHeaderBar 30% adopted
- **Action**: Continue T045-T052 (header adoption)

### Modal Patterns (FR-004 to FR-007)
- **Coverage**: 43% (1.7/4 complete)
- **Status**: Partial - Core components exist, adoption ongoing
- **Action**: Complete Sprint 2 modal migration, add T073 for Dialog audit

### Performance (FR-008 to FR-010)
- **Coverage**: 27% (0.8/3 complete)
- **Status**: **CRITICAL** - Bundle size blocker
- **Action**: T070 URGENT, T020 unblock, T042-T043 lazy images

### Touch Targets (FR-011 to FR-014)
- **Coverage**: 95% (3.8/4 complete)
- **Status**: Excellent - Systematic audit across all components
- **Action**: Continue with T037 (mixer controls)

### User Experience (FR-015 to FR-020)
- **Coverage**: 80% (4.8/6 complete)
- **Status**: Good - Core patterns implemented
- **Action**: Extend haptic feedback (T039), validate pull-to-refresh on all lists

### Accessibility (FR-021 to FR-024)
- **Coverage**: 30% (1.2/4 complete)
- **Status**: **GAP** - Missing ARIA and focus trap
- **Action**: Add T071, T072, T073 immediately

### Mobile & Platform (FR-025 to FR-027)
- **Coverage**: 33% (1/3 complete)
- **Status**: Portrait lock done, themes deferred to Sprint 5
- **Action**: Continue as planned (low priority)

### Process & Tooling (FR-028 to FR-030)
- **Coverage**: 100% (3/3 complete)
- **Status**: Excellent - Infrastructure solid
- **Action**: Add T068 for ongoing tracker updates

## Sprint-by-Sprint FR Coverage

### Sprint 0 (Setup) - FRs Addressed: 6
- FR-010 (Bundle baseline) - T001 ✅
- FR-028 (Migration tracker) - T005 ✅
- FR-029 (Feature flags) - T003 ✅
- FR-030 (Rollback mechanism) - T003, T006 ✅
- FR-001 (MainLayout) - T010 ✅
- FR-025 (Portrait lock) - T010 ✅

### Sprint 1 (Touch & Lists) - FRs Addressed: 10
- FR-002 (BottomNav touch) - T011 ✅
- FR-003 (MobileHeaderBar) - T012 ✅
- FR-011 (44px touch min) - T011-T014, T016-T017 ✅
- FR-012 (48px primary) - T024 ✅
- FR-013 (56px nav) - T011, T013 ✅
- FR-014 (8px spacing) - T017 ✅
- FR-015 (Haptic feedback) - T014 🔄
- FR-016 (Safe areas) - T015 🔄
- FR-008 (VirtualizedTrackList) - T020 ❌, T021 ✅
- FR-017 (Pull-to-refresh) - T019 ✅

**Sprint 1 Status**: 8/10 FRs complete (80%)

### Sprint 2 (Modals & Forms) - FRs Addressed: 7
- FR-004 (MobileBottomSheet) - T028-T031 ✅
- FR-005 (MobileActionSheet) - T032 ✅, T033 🔄
- FR-006 (Dialog validation) - **T073 Missing** ❌
- FR-007 (ResponsiveModal) - T009 ✅, T028-T035 🔄
- FR-018 (Auto-save) - T025 ✅
- FR-019 (Draft restore) - T025 ✅
- FR-020 (Inline validation) - T026 ✅

**Sprint 2 Status**: 6/7 FRs complete or in progress (86% when T073 added)

### Sprint 3 (Virtualization & Images) - FRs Addressed: 4
- FR-008 (VirtualizedTrackList expansion) - T040-T041 🔄
- FR-009 (LazyImage) - T042-T043 🔄
- FR-021 (ARIA labels) - **T071 Missing** ❌
- FR-023 (Focus trap) - **T072 Missing** ❌

**Sprint 3 Status**: 2/4 FRs in progress (50% when T071-T072 added)

### Sprint 4 (Headers) - FRs Addressed: 1
- FR-003 (MobileHeaderBar expansion) - T045-T052 🔄

**Sprint 4 Status**: 0/1 complete (0%, not started)

### Sprint 5 (Testing & Themes) - FRs Addressed: 5
- FR-022 (Keyboard nav) - T060 🔄
- FR-024 (WCAG contrast) - T055, T059 🔄
- FR-026 (Theme sync) - T054 🔄
- FR-027 (High contrast) - T054 🔄
- FR-015 (Haptic feedback expansion) - T039 🔄

**Sprint 5 Status**: 0/5 complete (0%, not started)

## Recommendations

### Immediate Actions (This Week)
1. ✅ **Add T070** (bundle optimization) - CRITICAL blocker
2. ✅ **Add T071** (ARIA labels) - accessibility gap
3. ✅ **Add T072** (focus trap) - accessibility gap
4. ✅ **Add T073** (Dialog audit) - validation gap
5. ✅ **Add T068** (tracker updates) - process improvement

### Sprint Planning Adjustments
1. **Sprint 1**: Add T070 as P0 blocker
2. **Sprint 2**: Insert T073 after T053
3. **Sprint 3**: Insert T071-T072 before T054

### Success Criteria Updates
Update spec.md Success Criteria SC-013 to reference T071-T072:
```markdown
SC-013: Zero WCAG AA violations (verified by T059, T071, T072)
```

## Tracking Process

### How to Use This Mapping
1. **During Sprint Planning**: Check which FRs are addressed by sprint tasks
2. **During Implementation**: Mark task status → auto-updates FR coverage
3. **During Review**: Verify all sprint FRs have ✅ complete tasks
4. **At Phase End**: Ensure all 30 FRs show 100% coverage

### Update Frequency
- **After Each Task Completion**: Update task status in mapping
- **End of Each Sprint**: Calculate sprint FR coverage percentage
- **End of Phase 2**: Final verification that all 30 FRs are met

### Coverage Calculation
```
Coverage % = (Fully Covered + 0.5 * Partially Covered) / Total Requirements * 100
Current: (10 + 0.5 * 13) / 30 * 100 = 68%
Target: 100%
```

## Version History

- **v1.0** (2026-01-05): Initial mapping from speckit-analyze audit
- **Next**: Update after T070-T073 added and Sprint 1 complete

---

**Maintained By**: Technical Lead  
**Review Schedule**: End of each sprint  
**Source of Truth**: This file + tasks.md checkbox status
