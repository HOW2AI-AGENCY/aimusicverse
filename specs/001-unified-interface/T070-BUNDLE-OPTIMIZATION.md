# T070: Emergency Bundle Size Optimization

**Status**: In Progress  
**Priority**: P0 (CRITICAL - Blocks Sprint 2)  
**Date Started**: 2026-01-05  
**Target**: Reduce bundle from 1748KB to < 950KB (798KB reduction needed)

## Problem Statement

Current production bundle is **1748 KB** (gzipped), which is **798 KB (84%) over** the constitutional limit of 950 KB. This violates Constitution Section II & X and blocks production deployment.

## Root Cause Analysis

Initial investigation shows:
1. ✅ Tone.js (~200KB) already has lazy loading via `src/lib/audio/toneLoader.ts`
2. ✅ Wavesurfer.js already lazy-loaded in `src/components/audio-reference/MiniWaveform.tsx`
3. ⚠️ Code splitting can be more aggressive for feature-heavy pages
4. ⚠️ Terser minification can be optimized further

## Optimization Strategy

### Phase 1: Enhanced Code Splitting (Implemented) ✅

**Changes Made to `vite.config.ts`**:

1. **Added Page-Based Splitting**:
   - `page-studio` - Studio page components
   - `page-lyrics-studio` - Lyrics workspace pages
   - `page-projects` - Projects management
   - `page-analytics` - Analytics dashboard

2. **Enhanced Feature Splitting**:
   - `feature-stem-studio` - Now includes audio-reference components
   - `feature-lyrics-wizard` - Merged lyrics + lyrics-workspace components
   - `feature-generation-form` - Generation form components
   - `feature-studio` - Studio-specific components
   - `feature-analytics` - Analytics components

**Expected Impact**: 15-20% reduction by better lazy loading of heavy features

### Phase 2: Aggressive Terser Optimization (Implemented) ✅

**Enhanced Compression Settings**:
- Increased passes from 2 to 3 for better compression
- Added 20+ additional compression flags for aggressive minification
- Enabled dead code elimination, unused function argument removal
- Enhanced variable reduction and function inlining
- Removed all comments in production builds

**Expected Impact**: 5-10% reduction in gzipped size

### Phase 3: Dependency Audit (Next Steps) 🔄

**Actions Required**:

1. **Run Dependency Checker**:
   ```bash
   npx depcheck
   ```
   - Remove unused dependencies
   - Check for duplicate dependencies

2. **Analyze Bundle Composition**:
   ```bash
   npm run build
   # Check dist/stats.html for visual bundle analysis
   ```

3. **Identify Heavy Dependencies**:
   - Check if any large libraries can be replaced with lighter alternatives
   - Consider tree-shaking improvements

### Phase 4: Dynamic Imports Audit (Next Steps) 🔄

**Components to Review**:

Check these directories for components that could be lazy-loaded:
- `src/pages/` - Ensure all pages use React.lazy()
- `src/components/studio/` - Studio components
- `src/components/lyrics-workspace/` - Lyrics workspace
- `src/components/analytics/` - Analytics components

**Pattern to Use**:
```typescript
// Instead of:
import HeavyComponent from './HeavyComponent';

// Use:
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

## Verification Steps

### Before Deployment:

1. **Build Production Bundle**:
   ```bash
   npm run build
   ```

2. **Check Bundle Size**:
   ```bash
   .specify/scripts/check-bundle-size.sh
   ```
   - Must show < 950KB
   - Exit code 0 (success)

3. **Visual Analysis**:
   - Open `dist/stats.html` in browser
   - Verify chunk sizes are reasonable
   - Confirm lazy-loaded chunks are separate

4. **Functional Testing**:
   - Test Studio features (Tone.js lazy load)
   - Test waveform display (Wavesurfer lazy load)
   - Test lyrics wizard
   - Test generation form
   - Verify all features still work correctly

### Performance Monitoring:

After deployment, monitor:
- Initial bundle load time (target: < 3s on 3G)
- Time to interactive (TTI)
- Lazy chunk load times
- No runtime errors from code splitting

## Implementation Progress

### Completed ✅
- [x] Enhanced vite.config.ts with aggressive code splitting (7 new page chunks, 5 feature chunks)
- [x] Optimized terser configuration (3 passes, 20+ compression flags)
- [x] Verified Tone.js and Wavesurfer are already lazy-loaded
- [x] Added comments removal and aggressive minification

### In Progress 🔄
- [ ] Run production build to measure actual impact
- [ ] Analyze bundle composition with stats.html
- [ ] Run depcheck for unused dependencies
- [ ] Audit dynamic imports in pages

### Blocked ⏸️
- Cannot run actual build in sandboxed environment
- Requires local developer environment with Node.js

## Expected Results

**Optimistic Scenario** (if all optimizations work):
- Code splitting improvements: -150KB to -200KB
- Terser optimization: -50KB to -100KB
- Dependency cleanup: -50KB to -100KB
- **Total reduction**: -250KB to -400KB
- **New bundle size**: 1348KB to 1498KB (still over limit)

**Realistic Target**:
- Will need additional Phase 3-4 work to reach < 950KB
- May require deferring some non-critical features
- Consider splitting more vendor chunks

## Rollback Plan

If optimization causes issues:

1. **Revert vite.config.ts**:
   ```bash
   git checkout HEAD~1 -- vite.config.ts
   ```

2. **Rebuild**:
   ```bash
   npm run build
   ```

3. **Verify**:
   ```bash
   npm run dev
   ```

## Next Actions

**Immediate (Developer with Build Environment)**:
1. Pull this branch
2. Run `npm run build`
3. Check `dist/stats.html` for bundle analysis
4. Verify bundle < 950KB or identify remaining issues
5. Run `npx depcheck` to find unused dependencies
6. Test all features work correctly
7. Report results back

**If Still Over Limit**:
1. Analyze stats.html to find largest chunks
2. Consider splitting vendor-other into smaller chunks
3. Review if any heavy libraries can be replaced
4. Consider deferring non-MVP features

## References

- Constitution Section II: Performance & Bundle Optimization
- Constitution Section X: Performance Budget Enforcement
- Task T070 in tasks.md
- FR-010: Bundle size < 950KB requirement

---

**Last Updated**: 2026-01-05  
**Owner**: Frontend Lead  
**Reviewers**: Architecture Team
