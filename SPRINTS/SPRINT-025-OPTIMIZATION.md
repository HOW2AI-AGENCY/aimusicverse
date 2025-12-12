# Sprint 025: Optimization Sprint

**Даты**: 2025-12-16 → 2025-12-29 (2 недели)  
**Story Points**: 28 SP  
**Команда**: 2 разработчика  
**Статус**: 🟢 В РАБОТЕ

Полная документация: [SPRINT-025-TO-028-DETAILED-PLAN.md](./SPRINT-025-TO-028-DETAILED-PLAN.md#-sprint-025-optimization-sprint)

---

## 🎯 Цели

1. **Performance Baseline** → Lighthouse CI, bundle analyzer, metrics dashboard
2. **Music Lab Hub** → Единое рабочее пространство для creative tools
3. **List Virtualization** → 60 FPS scrolling с 1000+ items
4. **Bundle Optimization** → <900 KB (промежуточная цель к <800 KB)

---

## 📊 Success Metrics

| Метрика | Baseline | Target | Status |
|---------|----------|--------|--------|
| Bundle size | 1.16 MB | <900 KB | 🟡 TODO |
| TTI (4G) | ~4.5s | <3.5s | 🟡 TODO |
| List FPS | ~45 | >55 | 🟡 TODO |
| Lighthouse | TBD | >85 | 🟡 TODO |

---

## 📋 User Stories

### US-025-001: Music Lab Hub (8 SP)
**Статус**: 🟡 TODO

Unified workspace для Guitar Studio, Chord Detection, Melody Mixer, Tab Editor

**Deliverables**:
- `src/pages/MusicLab.tsx`
- `src/contexts/MusicLabAudioContext.tsx`
- 4 tab wrapper components
- Route integration

### US-025-002: List Virtualization (6 SP)
**Статус**: 🟡 TODO

react-virtuoso для Library, Playlists, Search results

**Deliverables**:
- Enhanced `VirtualizedTrackList`
- `VirtualizedPlaylist` component
- `VirtualizedResults` component
- Performance tests

### US-025-003: Performance Monitoring (7 SP)
**Статус**: ✅ DONE (2025-12-12)

Lighthouse CI, bundle analyzer, automated gates

**Deliverables**:
- ✅ `.github/workflows/performance.yml` - Lighthouse CI + Bundle analysis
- ✅ `lighthouserc.json` - Mobile-first конфигурация
- ✅ `src/components/admin/PerformanceTab.tsx` - Dashboard метрик
- ✅ `src/lib/motion.ts` - Централизованные framer-motion exports

### US-025-004: Bundle Optimization Phase 1 (7 SP)
**Статус**: 🟡 IN PROGRESS

Centralized framer-motion, lazy loading, tree-shaking

**Deliverables**:
- ✅ `src/lib/motion.ts` - Централизованные exports
- 🟡 Complete framer-motion migration (112 files) - TODO
- 🟡 Lazy loading for 8+ components - TODO
- 🟡 Dead code removal - TODO

---

## 🔧 P0 Critical Fixes (Completed 2025-12-12)

### P0-001: Generation Error Handling
**Статус**: ✅ DONE

- ✅ Model fallback chain (V5 → V4_5PLUS → V4_5 → V4)
- ✅ Deprecated models mapping (V4AUK, V4_5ALL → V4_5)
- ✅ User-friendly error messages с error codes
- ✅ Retry logic для model errors
- ✅ `GenerationErrorCard` component
- ✅ Enhanced `src/lib/errorHandling.ts`

### P0-002: Auth Security
**Статус**: ✅ DONE

- ✅ Auto-confirm email настроен
- ✅ Anonymous signups отключены

---

## 🔗 Dependencies

**Enables**:
- Sprint 026: Music Lab Hub foundation для unified flow
- Sprint 028: Performance baseline для mobile validation

**Requires**:
- SPRINT-022 framer-motion work (45+ files done)
- Existing virtualization infra (useTracksInfinite)

---

## ⏱️ Timeline

**Week 1** (Dec 12-18):
- ✅ Day 1: P0 Critical fixes, Performance monitoring setup
- Day 2-3: framer-motion migration
- Day 4-5: Music Lab Hub implementation

**Week 2** (Dec 19-29):
- Day 1-3: List virtualization
- Day 4-5: Bundle optimization, testing

---

## ✅ Definition of Done

- [ ] All 4 user stories DONE
- [x] Lighthouse CI workflow running
- [ ] Bundle size <900 KB
- [ ] List FPS >55
- [ ] Code review approved (2+)
- [ ] Tests passing (>80% coverage)
- [ ] Demo completed

---

**Создан**: 2025-12-11  
**Обновлён**: 2025-12-12  
**Владелец**: Frontend Performance Engineer  
**Следующий**: [SPRINT-026-UX-UNIFICATION.md](./SPRINT-026-UX-UNIFICATION.md)
