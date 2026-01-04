# Performance Monitoring Setup

**Date:** 2025-12-16  
**Status:** ✅ Implemented (T1.3 - Phase 1)

## Overview

Performance monitoring infrastructure has been set up to track bundle size, Lighthouse scores, and other key metrics automatically on every PR and push to main.

## Tools Configured

### 1. Lighthouse CI

**Location:** `.github/workflows/lighthouse-ci.yml`, `.github/workflows/performance.yml`  
**Configuration:** `lighthouserc.json`

**Performance Budgets (Updated):**
- **Performance Score:** ≥ 75% (warn)
- **FCP (First Contentful Paint):** ≤ 1.8s (error)
- **TTI (Time to Interactive):** ≤ 3.5s (error) ⬅️ **Phase 1 target**
- **Speed Index:** ≤ 3.0s (warn)
- **LCP (Largest Contentful Paint):** ≤ 2.5s (error)
- **TBT (Total Blocking Time):** ≤ 400ms (warn)
- **CLS (Cumulative Layout Shift):** ≤ 0.1 (error)
- **Total Byte Weight:** ≤ 850KB (warn)

**Runs:** 3 iterations per URL on mobile profile (375x812, 4G throttling)

### 2. Bundle Size Tracking

**Location:** `.github/workflows/performance.yml`  
**Tool:** size-limit

**Configuration:** `package.json`
```json
"size-limit": [
  {
    "name": "Total Bundle",
    "path": "dist/assets/*.js",
    "limit": "950 KB",
    "gzip": true
  },
  {
    "name": "Main Entry",
    "path": "dist/assets/index-*.js",
    "limit": "200 KB",
    "gzip": true
  }
]
```

**Phase Targets:**
- **Phase 1:** < 950 KB (current baseline: ~1.16 MB)
- **Phase 3:** < 800 KB (final target)

**Scripts:**
```bash
npm run size       # Check bundle size limits
npm run size:why   # Analyze what's in the bundle
```

### 3. Bundle Visualization

**Tool:** rollup-plugin-visualizer  
**Output:** `dist/stats.html` (uploaded as CI artifact)

View interactive bundle composition after build.

## How It Works

### On Pull Requests

1. **Lighthouse CI** runs automatically:
   - Builds the project
   - Runs Lighthouse on key pages
   - Comments on PR with results
   - Fails PR if budgets exceeded

2. **Bundle Analysis** runs:
   - Calculates total JS size
   - Runs size-limit checks
   - Warns if Phase 1 target (950KB) exceeded
   - Uploads bundle visualization

### Manual Checks

```bash
# Build and check size locally
npm run build
npm run size

# Analyze bundle composition
npm run size:why

# View visualization
open dist/stats.html
```

## Monitoring Dashboard

### Key Metrics to Track

| Metric | Current | Phase 1 Target | Phase 3 Target |
|--------|---------|----------------|----------------|
| Bundle Size | ~1.16 MB | <950 KB | <800 KB |
| TTI (4G) | ~4.5s | <3.5s | <3.5s |
| FCP | ~2.1s | <1.8s | <1.8s |
| LCP | ~3.8s | <2.5s | <2.5s |
| Lighthouse Score | TBD | >75 | >90 |

### Where to Find Metrics

1. **GitHub Actions:**
   - Go to Actions tab
   - Select "Performance Monitoring" workflow
   - View artifacts for bundle reports

2. **PR Comments:**
   - Lighthouse CI automatically comments with scores
   - Click "View Report" for detailed breakdown

3. **Local Development:**
   - Run `npm run build && npm run size`
   - Open `dist/stats.html` in browser

## Alert Thresholds

### Error (Fails CI)
- FCP > 1.8s
- TTI > 3.5s
- LCP > 2.5s
- CLS > 0.1
- Accessibility < 90%

### Warning (Doesn't fail CI)
- Performance score < 75%
- Speed Index > 3.0s
- TBT > 400ms
- Total bytes > 850KB
- Bundle > 950KB (Phase 1)

## Next Steps

### Phase 1 (Current)
- [x] Setup Lighthouse CI
- [x] Configure size-limit
- [x] Update performance budgets
- [ ] Begin bundle optimization (T1.2)

### Phase 3 (Future)
- [ ] Tighten budgets (800KB, >90 Lighthouse)
- [ ] Add custom metrics dashboard
- [ ] Setup alerting for regressions
- [ ] A/B test performance improvements

## Resources

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [size-limit Documentation](https://github.com/ai/size-limit)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Bundle Analyzer Guide](https://github.com/btd/rollup-plugin-visualizer)

## Troubleshooting

### Size limit exceeded

```bash
# Analyze what's taking space
npm run size:why

# View interactive visualization
npm run build
open dist/stats.html
```

### Lighthouse score dropped

1. Check PR comments for specific failures
2. Look at detailed Lighthouse report
3. Focus on FCP, TTI, LCP metrics
4. Review recent code changes

### Bundle analysis not working

```bash
# Ensure build completes
npm run build

# Check if stats.html generated
ls -lh dist/stats.html
```

---

**Status:** ✅ T1.3 Complete (7 SP)  
**Impact:** Foundation for tracking progress on T1.2 (bundle optimization) and T3.2 (performance optimization)  
**Next:** T1.2 - Bundle Size Phase 1 optimization
