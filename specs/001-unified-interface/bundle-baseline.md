# Bundle Size Baseline Report
**Date:** 2026-01-05  
**Build:** Production  
**Commit:** Sprint 0 - T001

## Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Total Bundle Size (gzipped)** | 1,748 KB | 950 KB | ❌ **OVER by 798 KB (+84.0%)** |
| **Total Bundle Size (uncompressed)** | ~5,400 KB | ~2,850 KB | ❌ **OVER by ~2,550 KB** |
| **Number of JS Chunks** | 87 | - | ✅ |
| **Largest Chunk** | vendor-other (574 KB gzipped) | <200 KB | ❌ |

## Top 10 Largest Chunks (Gzipped)

| Size | File | Priority |
|------|------|----------|
| 574 KB | vendor-other-CjHqWAmG.js.gz | 🔴 **P0 - Critical** |
| 136 KB | feature-generate-Bb_fgaPY.js.gz | 🟡 **P1 - High** |
| 78 KB | vendor-charts-BulfvIjy.js.gz | 🟡 **P1 - High** |
| 75 KB | vendor-react-CT2oymjs.js.gz | ✅ Acceptable |
| 57 KB | index-B3xN51xf.js.gz | ✅ Acceptable |
| 57 KB | vendor-tone-LaUbSRV9.js.gz | 🟡 **P1 - High** |
| 54 KB | vendor-radix-Dv4OqG8J.js.gz | ✅ Acceptable |
| 51 KB | UnifiedStudioPage-BwNx5hCU.js.gz | ✅ Acceptable |
| 45 KB | page-admin-DD1-DLAQ.js.gz | 🟢 **P2 - Medium** |
| 38 KB | vendor-supabase-DIteV7RG.js.gz | ✅ Acceptable |

## Critical Issues

### 1. 🔴 vendor-other.js (574 KB - 32.8% of total)
**Problem:** Massive catch-all vendor chunk containing multiple libraries.

**Likely Contents:**
- Zod validation
- React Hook Form
- Various utility libraries
- Potentially duplicate code

**Action Items:**
- [ ] T007: Analyze with bundle visualizer (stats.html)
- [ ] Split into focused chunks (vendor-forms, vendor-validation, vendor-utils)
- [ ] Check for duplicate dependencies
- [ ] Move to dynamic imports where possible

**Estimated Savings:** 150-200 KB

### 2. 🟡 feature-generate.js (136 KB - 7.8% of total)
**Problem:** Large generation form bundle loaded on homepage.

**Action Items:**
- [ ] Lazy load GenerateSheet component
- [ ] Split form sections into separate chunks
- [ ] Move Zod schemas to separate file
- [ ] Consider code splitting by form step

**Estimated Savings:** 40-60 KB

### 3. 🟡 vendor-tone.js (57 KB - 3.3% of total)
**Problem:** Tone.js loaded even when not using MIDI/Studio features.

**Action Items:**
- [ ] T007: Implement lazy loading for Tone.js
- [ ] Only load when entering Stem Studio or MIDI features
- [ ] Create toneLoader.ts wrapper

**Estimated Savings:** 50-57 KB (for non-studio users)

### 4. 🟡 vendor-charts.js (78 KB - 4.5% of total)
**Problem:** Charts library loaded on initial load.

**Action Items:**
- [ ] Lazy load charts only on Analytics/Admin pages
- [ ] Consider lighter alternative (recharts → visx)
- [ ] Tree-shake unused chart types

**Estimated Savings:** 30-50 KB

## Optimization Strategy

### Phase 1: Quick Wins (Target: -250 KB)
1. Lazy load Tone.js (T007) → -57 KB
2. Lazy load Charts → -78 KB
3. Lazy load GenerateSheet → -50 KB
4. Code splitting improvements → -65 KB

### Phase 2: Vendor Splitting (Target: -300 KB)
1. Split vendor-other into focused chunks → -150 KB
2. Analyze and remove duplicate dependencies → -80 KB
3. Tree-shake unused exports → -70 KB

### Phase 3: Feature Optimization (Target: -248 KB)
1. Lazy load heavy page components → -100 KB
2. Optimize UnifiedStudioPage → -50 KB
3. Optimize Library page → -50 KB
4. Route-level code splitting → -48 KB

## Bundle Analysis Tools

### Run Analysis
```bash
npm run build
open dist/stats.html  # Bundle visualizer
```

### Check Bundle Size
```bash
./.specify/scripts/check-bundle-size.sh
```

### Monitor Size Changes
```bash
# Before changes
npm run build && ./.specify/scripts/check-bundle-size.sh > before.txt

# After changes
npm run build && ./.specify/scripts/check-bundle-size.sh > after.txt

# Compare
diff before.txt after.txt
```

## Next Steps

1. ✅ **T001: Baseline established** - This document
2. ✅ **T002: Monitoring script created** - check-bundle-size.sh
3. 🔄 **T007: Optimize Tone.js lazy loading** - Sprint 0 next task
4. 🔄 **Continue with Sprint 1 optimizations** - See tasks.md

## Success Criteria

- [ ] Total bundle size < 950 KB (gzipped)
- [ ] No single chunk > 200 KB
- [ ] Critical path chunks < 500 KB total
- [ ] Lighthouse Performance Score > 85
- [ ] Initial load time < 3s on 3G

## References

- Bundle size limit enforced in: `.specify/scripts/check-bundle-size.sh`
- Vite config: `vite.config.ts`
- Task list: `specs/001-unified-interface/tasks.md`
- Constitution: `.specify/memory/constitution.md` (Performance Budget section)
