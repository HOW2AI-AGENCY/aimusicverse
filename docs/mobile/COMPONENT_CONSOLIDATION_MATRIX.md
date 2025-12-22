# 📊 Mobile Component Consolidation Matrix

**Date:** 22 декабря 2025  
**Purpose:** Track consolidation of 29+ mobile components → 15-18 components

---

## 🎯 Consolidation Goals

- **Reduce components:** 29+ → 15-18 (-40%)
- **Reduce duplication:** TBD → <5%
- **Increase reusability:** TBD → >70%
- **Maintain functionality:** 100%

---

## 📋 Component Inventory

### Category 1: Layout Components

| Current Component | Features | LOC | Usage | Action | New Component | Priority |
|-------------------|----------|-----|-------|--------|---------------|----------|
| `TrackStudioMobileLayout.tsx` | Studio layout, header, tabs | 450 | High | **Merge** | `MobileStudio.tsx` | P0 |
| `MobileStudioLayout.tsx` | Generic studio layout | 320 | Med | **Merge** | `MobileStudio.tsx` | P0 |
| | | | | | | |
| **Total:** 2 | | 770 | | → 1 | `-50%` | |

**Consolidation Plan:**
- Create unified `MobileStudio.tsx` component
- Support both `stem-studio` and generic `studio` modes
- Extract common layout logic
- Maintain backward compatibility via props

**Estimated Savings:** 350-400 LOC

---

### Category 2: Tab Components

| Current Component | Features | LOC | Usage | Action | New Component | Priority |
|-------------------|----------|-----|-------|--------|---------------|----------|
| `MobileActionsTab.tsx` | Actions tab | 180 | High | **Merge** | `MobileTabBar.tsx` | P0 |
| `MobileLyricsTab.tsx` | Lyrics tab | 210 | High | **Extract Content** | `MobileLyricsContent.tsx` | P0 |
| `MobilePlayerTab.tsx` | Player tab | 250 | High | **Extract Content** | `MobilePlayerContent.tsx` | P0 |
| `MobileSectionsTab.tsx` | Sections tab | 190 | High | **Extract Content** | `MobileSectionsContent.tsx` | P0 |
| `MobileEditTab.tsx` | Edit tab | 170 | Med | **Extract Content** | `MobileEditContent.tsx` | P1 |
| `MobileMainTab.tsx` | Main tab | 200 | Med | **Extract Content** | `MobileMainContent.tsx` | P1 |
| `StudioTabsMobile.tsx` | Tab container | 140 | Med | **Replace** | `MobileTabBar.tsx` | P1 |
| | | | | | | |
| **Total:** 7 | | 1340 | | → 2 | `-71%` | |

**Consolidation Plan:**

1. **Create `MobileTabBar.tsx`** - Universal tab component:
   ```typescript
   interface Tab {
     id: string;
     label: string;
     icon: LucideIcon;
     badge?: number;
     content: ReactNode;
   }
   
   <MobileTabBar 
     tabs={tabs}
     activeTab={activeTab}
     onTabChange={setActiveTab}
   />
   ```

2. **Extract tab contents** into separate components:
   - `MobileLyricsContent.tsx` - Pure lyrics display
   - `MobilePlayerContent.tsx` - Pure player UI
   - etc.

**Estimated Savings:** 800-900 LOC

---

### Category 3: Actions & Controls

| Current Component | Features | LOC | Usage | Action | New Component | Priority |
|-------------------|----------|-----|-------|--------|---------------|----------|
| `MobileActionsBar.tsx` | Floating action bar | 160 | High | **Keep + Refactor** | `MobileActionBar.tsx` | P0 |
| `MobileActionsContent.tsx` | Action list | 140 | Med | **Merge** | `MobileActionBar.tsx` | P1 |
| `MobileMasterVolume.tsx` | Volume control | 95 | High | **Keep** | `MobileMasterVolume.tsx` | P1 |
| | | | | | | |
| **Total:** 3 | | 395 | | → 2 | `-33%` | |

**Consolidation Plan:**
- Merge `MobileActionsBar` + `MobileActionsContent` → unified component
- Support both `floating` and `inline` modes via props
- Keep `MobileMasterVolume` as specialized component

**Estimated Savings:** 100-140 LOC

---

### Category 4: Header Components

| Current Component | Features | LOC | Usage | Action | New Component | Priority |
|-------------------|----------|-----|-------|--------|---------------|----------|
| `MobileStudioHeader.tsx` | Stem studio header | 180 | High | **Merge** | `MobileHeader.tsx` | P0 |
| | | | | | | |
| **Total:** 1 | | 180 | | → 1 | `0%` | |

**Consolidation Plan:**
- Refactor `MobileStudioHeader` → generic `MobileHeader`
- Support multiple modes: `studio`, `player`, `generic`
- Configurable actions, title, back button

**Estimated Savings:** 50-80 LOC (via simplification)

---

### Category 5: Player Components

| Current Component | Features | LOC | Usage | Action | New Component | Priority |
|-------------------|----------|-----|-------|--------|---------------|----------|
| `MobileFullscreenPlayer.tsx` | Fullscreen player | 480 | High | **Refactor** | `MobilePlayer.tsx` | P0 |
| | | | | | | |
| **Total:** 1 | | 480 | | → 1 | `0%` | |

**Consolidation Plan:**
- Refactor to use new layout primitives
- Extract controls to `MobilePlayerControls.tsx`
- Improve performance with React.memo

**Estimated Savings:** 100-150 LOC

---

### Category 6: Specialized Components

| Current Component | Features | LOC | Usage | Action | New Component | Priority |
|-------------------|----------|-----|-------|--------|---------------|----------|
| `MobileStemCard.tsx` | Stem card | 210 | High | **Keep** | `MobileStemCard.tsx` | P1 |
| `MobileStemMixer.tsx` | Stem mixer | 350 | High | **Keep** | `MobileStemMixer.tsx` | P1 |
| `MobileStemEffects.tsx` | Effects panel | 180 | Med | **Keep** | `MobileStemEffects.tsx` | P2 |
| `SectionEditorMobile.tsx` | Section editor | 420 | High | **Keep** | `SectionEditorMobile.tsx` | P1 |
| `MobileSectionTimelineCompact.tsx` | Compact timeline | 190 | Med | **Keep** | `MobileSectionTimeline.tsx` | P2 |
| `MobileVersionBadge.tsx` | Version badge | 75 | Med | **Keep** | `MobileVersionBadge.tsx` | P2 |
| `MobileAudioWarning.tsx` | Audio warning | 85 | Low | **Keep** | `MobileAudioWarning.tsx` | P3 |
| | | | | | | |
| **Total:** 7 | | 1510 | | → 7 | `0%` | |

**Consolidation Plan:**
- Keep specialized components (domain-specific)
- Refactor to use new primitives where applicable
- Improve with React.memo for performance

**Estimated Savings:** 200-300 LOC (via refactoring)

---

### Category 7: Panels

| Current Component | Features | LOC | Usage | Action | New Component | Priority |
|-------------------|----------|-----|-------|--------|---------------|----------|
| `StemsMobilePanel.tsx` | Stems panel | 280 | Med | **Keep** | `StemsMobilePanel.tsx` | P2 |
| | | | | | | |
| **Total:** 1 | | 280 | | → 1 | `0%` | |

**Consolidation Plan:**
- Keep as specialized panel
- Refactor to use new layout primitives

**Estimated Savings:** 50-80 LOC

---

### Category 8: Low Priority / Feature-Specific

| Current Component | Features | LOC | Usage | Action | New Component | Priority |
|-------------------|----------|-----|-------|--------|---------------|----------|
| `MidiExportPanelMobile.tsx` | MIDI export | 150 | Low | **Keep** | — | P3 |
| `ChordTimelineMobile.tsx` | Chord timeline | 220 | Low | **Keep** | — | P3 |
| `GuitarAnalysisReportMobile.tsx` | Guitar analysis | 180 | Low | **Keep** | — | P3 |
| `MobileGraphView.tsx` | Music graph | 200 | Low | **Keep** | — | P3 |
| `MobileNotesViewer.tsx` | Notes viewer | 130 | Low | **Keep** | — | P3 |
| `MobileTelegramBotSettings.tsx` | Bot settings | 110 | Very Low | **Keep** | — | P3 |
| | | | | | | |
| **Total:** 6 | | 990 | | → 6 | `0%` | |

**Consolidation Plan:**
- Keep feature-specific components (low priority)
- Consolidate only if usage increases
- Defer to future optimization phase

**Estimated Savings:** 0 LOC (defer)

---

## 📊 Summary Statistics

### Before Consolidation

```
Total Components:       29
Total LOC:              ~5,925
Categories:             8
High Usage:             15 components (52%)
Medium Usage:           9 components (31%)
Low Usage:              5 components (17%)
```

### After Consolidation (Projected)

```
Total Components:       18 (-38%)
Total LOC:              ~4,225 (-29%)
New Base Components:    +7
Eliminated:             -18
Kept:                   11
```

### LOC Savings Breakdown

| Category | Before | After | Savings | % |
|----------|--------|-------|---------|---|
| Layout | 770 | 350 | -420 | -55% |
| Tabs | 1340 | 450 | -890 | -66% |
| Actions | 395 | 250 | -145 | -37% |
| Headers | 180 | 130 | -50 | -28% |
| Player | 480 | 330 | -150 | -31% |
| Specialized | 1510 | 1310 | -200 | -13% |
| Panels | 280 | 230 | -50 | -18% |
| Low Priority | 990 | 990 | 0 | 0% |
| **New Base Components** | — | +185 | — | — |
| **Total** | **5,925** | **~4,225** | **-1,700** | **-29%** |

---

## 🎯 New Component Architecture

### Base Components (New) - 7 components

```
1. MobileLayout.tsx          (~100 LOC) - Base layout wrapper
2. MobileTabBar.tsx          (~85 LOC)  - Universal tabs
3. MobileHeader.tsx          (~80 LOC)  - Unified header
4. MobileSheet.tsx           (~70 LOC)  - Bottom sheet
5. MobileButton.tsx          (~60 LOC)  - Touch-optimized button
6. MobileCard.tsx            (~50 LOC)  - Mobile card
7. MobileSlider.tsx          (~40 LOC)  - Touch slider
```

### Consolidated Components - 11 components

```
Studio:
1. MobileStudio.tsx          (~350 LOC) - Unified studio (was 2)
2. MobileActionBar.tsx       (~250 LOC) - Actions (was 2)

Player:
3. MobilePlayer.tsx          (~330 LOC) - Refactored player

Specialized (Keep):
4. MobileStemCard.tsx        (~210 LOC)
5. MobileStemMixer.tsx       (~350 LOC)
6. MobileStemEffects.tsx     (~180 LOC)
7. SectionEditorMobile.tsx   (~420 LOC)
8. MobileSectionTimeline.tsx (~190 LOC)
9. MobileVersionBadge.tsx    (~75 LOC)
10. MobileMasterVolume.tsx   (~95 LOC)
11. StemsMobilePanel.tsx     (~280 LOC)
```

---

## 🗓️ Implementation Schedule

### Phase 1: Foundation (Week 1)

**Day 1-2: Audit**
- [x] Create this matrix
- [ ] Analyze dependencies with madge
- [ ] Measure code duplication with jscpd
- [ ] Document current patterns

**Day 3: Base Components**
- [ ] Create `MobileLayout.tsx`
- [ ] Create `MobileTabBar.tsx`
- [ ] Create `MobileHeader.tsx`
- [ ] Write tests

**Day 4-5: Primitives**
- [ ] Create `MobileSheet.tsx`
- [ ] Create `MobileButton.tsx`
- [ ] Create `MobileCard.tsx`
- [ ] Create `MobileSlider.tsx`
- [ ] Write tests

### Phase 2: Consolidation (Week 2)

**Day 1-2: Studio**
- [ ] Create `MobileStudio.tsx` (merge 2 components)
- [ ] Migrate `TrackStudioMobileLayout`
- [ ] Migrate `MobileStudioLayout`
- [ ] Update imports
- [ ] Test thoroughly

**Day 3: Tabs**
- [ ] Extract content from tab components
- [ ] Create content components
- [ ] Replace with `MobileTabBar`
- [ ] Update imports
- [ ] Test thoroughly

**Day 4: Actions**
- [ ] Merge `MobileActionsBar` + `MobileActionsContent`
- [ ] Create unified `MobileActionBar`
- [ ] Update imports
- [ ] Test thoroughly

**Day 5: Player & Testing**
- [ ] Refactor `MobileFullscreenPlayer`
- [ ] Extract `MobilePlayerControls`
- [ ] Full regression testing
- [ ] Fix bugs

### Phase 3: Polish & Cleanup (Week 3)

**Day 1-2: Refactoring**
- [ ] Refactor specialized components to use new primitives
- [ ] Apply React.memo optimizations
- [ ] Performance testing

**Day 3: Cleanup**
- [ ] Remove old components
- [ ] Clean up unused code
- [ ] Update documentation
- [ ] Final testing

---

## ✅ Success Criteria

**Code Metrics:**
- [ ] Components reduced from 29 → 18 (-38%)
- [ ] LOC reduced from ~5,925 → ~4,225 (-29%)
- [ ] Code duplication <5%
- [ ] Test coverage >80%

**Quality:**
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Build successful

**Functionality:**
- [ ] All features working
- [ ] No regressions
- [ ] Improved performance
- [ ] Better UX

---

## 📝 Migration Checklist

For each component being consolidated:

- [ ] Identify all usages (`grep -r "ComponentName" src/`)
- [ ] Create new component
- [ ] Write tests
- [ ] Migrate first usage
- [ ] Test thoroughly
- [ ] Migrate remaining usages
- [ ] Update documentation
- [ ] Remove old component
- [ ] Verify no broken imports

---

## 🔗 Related Documentation

- [MOBILE_INTERFACE_OPTIMIZATION_PLAN.md](../../MOBILE_INTERFACE_OPTIMIZATION_PLAN.md)
- [Component Architecture](./COMPONENT_ARCHITECTURE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Testing Strategy](./TESTING_STRATEGY.md)

---

**Status:** 🟡 In Progress  
**Last Updated:** 22 декабря 2025  
**Next Review:** After Phase 1 completion
