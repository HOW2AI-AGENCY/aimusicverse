# Sprint 027: Architecture Cleanup - Initial Audit

**Date**: 2025-12-12  
**Status**: 🔍 IN PROGRESS  
**Sprint Goal**: Consolidate 91 → 60 files (-34%), <5% duplication, optimize Edge Functions

---

## 📊 Current State Analysis

### Stem Studio File Count

- **Total Files**: 92 TypeScript/TSX files
- **Target**: 60 files
- **To Remove**: 32 files (-35%)

### Code Duplication Analysis (jscpd)

**Overall Statistics**:

- Total clones detected: ~89 clones across codebase
- Most affected areas:
  1. Stem Studio components (20+ clones)
  2. Mobile components (15+ clones)
  3. Effects controls (10+ clones)
  4. Track actions/details (15+ clones)

**High Duplication Files** (>25% duplication):

1. `src/integrations/supabase/queries/public-content.ts` - 31.56% (83 lines, 832 tokens)
2. Various mobile stem studio files with 10-50% duplication

**Medium Duplication** (10-25%):

- Section editor components
- Mobile action tabs
- Effects controls

### Edge Functions Catalog

- **Total Functions**: 67 edge functions
- **Shared Utilities**: `_shared/` directory exists
- **Categories**:
  - Suno AI Integration: 19 functions
  - Audio Processing: 8 functions
  - AI Services: 7 functions
  - Telegram: 5 functions
  - Task Management: 4 functions
  - Health/Monitoring: 2 functions
  - Misc: 22 functions

---

## 🎯 Consolidation Opportunities

### 1. Stem Studio Consolidation (Priority 1)

#### Group A: Mobile Components (19 files → 8 files)

**Current Structure**:

```
mobile/
├── MobileActionsTab.tsx
├── MobileLyricsTab.tsx
├── MobilePlayerTab.tsx
├── MobileSectionsTab.tsx
├── MobileStemCard.tsx
├── MobileStemEffects.tsx
├── MobileStemMixer.tsx
├── SectionEditorMobile.tsx
├── SectionEditorMobileEnhanced.tsx (duplicate!)
├── StemActionsSheet.tsx
├── StemAnalysisSheet.tsx
├── StemStudioActionsTab.tsx (duplicate of MobileActionsTab!)
├── StemTranscriptionSheet.tsx
└── index.ts

mobile-optimized/
├── SettingsTabContent.tsx (duplicate of effects!)
├── StemsTabContent.tsx
└── index.ts

Direct mobile files:
├── MobileActionsBar.tsx
├── MobileMasterVolume.tsx
├── MobileSectionTimelineCompact.tsx
├── MobileStudioHeader.tsx
```

**Consolidation Plan**:

1. **Merge MobileActionsTab + StemStudioActionsTab** → Single MobileActionsTab
2. **Merge SectionEditorMobile + SectionEditorMobileEnhanced** → Single SectionEditor
3. **Merge SettingsTabContent into EffectsTabContent** (eliminate duplication)
4. **Consolidate mobile-optimized/ into mobile/** (eliminate directory)
5. **Extract shared mobile utilities** → hooks/useMobileStudio.ts

**Savings**: 19 → 8 files (-11 files)

#### Group B: Section Editor Components (7 files → 4 files)

**Current**:

```
section-editor/
├── SectionActions.tsx
├── SectionEditorHeader.tsx
├── SectionLyricsEditor.tsx
├── SectionPresets.tsx
├── SectionPromptInput.tsx
├── SectionValidation.tsx (heavily duplicated!)
└── index.ts
```

**Consolidation Plan**:

1. Extract validation logic to **hooks/useSectionValidation.ts**
2. Merge SectionActions + SectionPresets → SectionActionsPanel
3. Keep: SectionEditorHeader, SectionLyricsEditor, SectionPromptInput

**Savings**: 7 → 4 files (-3 files)

#### Group C: Effects Controls (4 files → 2 files)

**Current**:

```
effects/
├── CompressorControl.tsx (90% duplicate of ReverbControl)
├── EqualizerControl.tsx (self-duplicating!)
├── ReverbControl.tsx
└── StemEffectsPanel.tsx
```

**Consolidation Plan**:

1. Create **EffectControl.tsx** (generic component)
2. Pass effect type as prop (compressor, reverb, equalizer)
3. Extract effect types to constants

**Savings**: 4 → 2 files (-2 files)

#### Group D: Studio Variants (7 files → 3 files)

**Current**:

```
├── StemStudioContent.tsx
├── StemStudioContentOptimized.tsx (variant!)
├── StemStudioMobileOptimized.tsx (mobile variant!)
├── TrackStudioContent.tsx (duplicate!)
├── TrackStudioMobileLayout.tsx
├── TrackStudioMobileOptimized.tsx (duplicate!)
└── StudioLoadingStates.tsx
```

**Consolidation Plan**:

1. **Single StemStudioContent** with responsive design
2. **Single TrackStudioContent** with responsive design
3. Keep: StudioLoadingStates

**Savings**: 7 → 3 files (-4 files)

#### Group E: Duplicate Panels (6 files → 3 files)

**Current**:

```
├── QuickComparePanel.tsx
├── QuickCompareMobile.tsx (duplicate!)
├── StudioLyricsPanel.tsx
├── StudioLyricsPanelCompact.tsx (duplicate!)
├── panels/StemsMobilePanel.tsx
└── panels/StudioAnalysisPanel.tsx (duplicated logic)
```

**Consolidation Plan**:

1. Merge QuickComparePanel + QuickCompareMobile → Single responsive component
2. Merge StudioLyricsPanel + StudioLyricsPanelCompact → Single responsive component
3. Extract shared panel utilities

**Savings**: 6 → 3 files (-3 files)

### Total Stem Studio Consolidation

- **Before**: 92 files
- **After**: 60 files (estimated)
- **Removed**: 32 files (-35%)

---

## 🔧 Shared Utilities to Extract

### New Hooks (5 files to create)

1. `hooks/studio/useMobileStudio.ts` - Mobile detection, touch handlers
2. `hooks/studio/useSectionValidation.ts` - Validation logic extraction
3. `hooks/studio/useEffectControl.ts` - Generic effect control logic
4. `hooks/studio/useStudioPanels.ts` - Panel state management
5. `hooks/studio/useStudioResponsive.ts` - Responsive breakpoints

### New Components (3 generic components)

1. `components/stem-studio/shared/EffectControl.tsx` - Generic effect UI
2. `components/stem-studio/shared/ResponsivePanel.tsx` - Adaptive panel
3. `components/stem-studio/shared/MobileSheet.tsx` - Reusable bottom sheet

---

## 🌐 Edge Functions Analysis

### Duplication Patterns Found

1. **Error Handling**: 50+ functions have similar try-catch patterns
2. **Supabase Client**: 60+ functions create client individually
3. **CORS Headers**: Duplicated in 40+ functions
4. **Logging**: Inconsistent patterns across functions
5. **Response Format**: Not standardized

### Shared Utilities to Create (in `_shared/`)

1. **error-handler.ts** - Standard error responses
2. **supabase-client.ts** - Singleton client creator
3. **response-utils.ts** - Already exists, ensure usage
4. **logger.ts** - Structured logging utility
5. **validation.ts** - Request validation helpers

### Functions to Merge (Candidates)

- **suno-music-callback + suno-vocal-callback + suno-cover-callback** → Generic callback handler
- **suno-upload-cover + suno-upload-extend** → Generic upload handler
- **cleanup-orphaned-data + cleanup-stale-tasks** → Unified cleanup function

---

## 📈 Success Metrics (Baseline)

| Metric            | Current | Target | Status |
| ----------------- | ------- | ------ | ------ |
| Stem Studio files | 92      | 60     | 🟡     |
| Code duplication  | ~15-20% | <5%    | 🟡     |
| Edge Functions    | 67      | 55-60  | 🟡     |
| Shared utilities  | 3       | 8+     | 🟡     |
| ESLint warnings   | TBD     | 0      | 🟡     |
| Test coverage     | ~75%    | >80%   | 🟡     |

---

## 🚀 Implementation Plan

### Phase 1: Stem Studio (Days 1-3)

- [x] Day 1: Complete audit (this document)
- [x] Day 2: QuickCompare consolidation complete (2→1 files)
- [x] Day 2: Architecture analysis and revised strategy
- [ ] Day 3: Continue high-impact consolidations + cleanup

### Phase 2: Deduplication (Days 4-5)

- [ ] Day 4: Extract shared hooks & utilities
- [ ] Day 5: Refactor duplicated code

### Phase 3: Edge Functions (Days 6-8)

- [ ] Day 6: Create shared utilities
- [ ] Day 7: Refactor all functions to use utilities
- [ ] Day 8: Merge candidate functions

### Phase 4: Quality Gates (Days 9-10)

- [ ] Day 9: Setup pre-commit hooks, ESLint
- [ ] Day 10: Test coverage, documentation

---

## 📝 Notes

- All component merges must maintain existing functionality
- Mobile-first approach - responsive design over separate mobile files
- Update all imports after file moves
- Maintain test coverage during refactoring
- Document all breaking changes

---

## 🔄 Implementation Progress (Updated 2025-12-12)

### Day 2 Completed

- [x] **QuickCompare Consolidation** ✅
  - Merged `QuickComparePanel.tsx` + `QuickCompareMobile.tsx` → `QuickCompare.tsx`
  - Files reduced: 84 → 83 (-1 file)
  - Responsive design automatically adapts mobile/desktop
  - All imports updated, no regressions

### Day 2 Analysis Findings

- **TrackStudioContent vs StemStudioContent**: NOT duplicates (different use cases)
- **Lyrics Panels**: Complex consolidation (753 lines total), deferred
- **Section Editors**: Different UX patterns, needs careful planning
- **Dead code discovered**: ~10 unused component files identified

### Revised Strategy

**Focus on**:

1. Remove dead/unused code (quick wins)
2. Extract shared utilities to hooks
3. Responsive design over duplicate files
4. Quality over quantity in reductions

**Current Progress**: 1/23 files removed (4% of goal)

---

**Next Steps**:

1. Remove verified unused files
2. Extract mobile utilities
3. Document architectural decisions
