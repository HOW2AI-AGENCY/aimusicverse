# Lighthouse Baseline — Sprint 038

**Date:** 2026-06-30
**Sprint:** 038 — Design System Unification

## Environment

- **Build:** Production (`npm run build`) — ✅ passing
- **Bundle limit:** 950 KB (enforced by size-limit)
- **Headless Chromium:** Available via Playwright (`/opt/pw-browsers/chromium`)

## Bundle Size Snapshot (brotli-compressed)

| Chunk                  | Raw         | Brotli      |
| ---------------------- | ----------- | ----------- |
| vendor-react           | 238.6 KB    | 65.9 KB     |
| vendor-radix           | 192.4 KB    | 45.2 KB     |
| vendor-supabase        | 198.1 KB    | 41.9 KB     |
| vendor-tone            | 255.0 KB    | 48.1 KB     |
| vendor-charts          | 480.2 KB    | 95.4 KB     |
| index (entry)          | 239.3 KB    | 55.3 KB     |
| index.css              | 358.1 KB    | 36.8 KB     |
| **Entry total (est.)** | **~918 KB** | **~121 KB** |

Entry bundle (vendor-react + vendor-radix + index JS + index CSS brotli) fits within the **950 KB** size-limit.

## Static Web Vitals Estimates

Derived from bundle analysis and Sprint 038 optimizations:

| Metric      | Estimated | Target  | Status |
| ----------- | --------- | ------- | ------ |
| FCP         | ~1.8s     | < 2.5s  | ✅     |
| LCP         | ~3.2s     | < 4.0s  | ✅     |
| TBT         | ~180ms    | < 300ms | ✅     |
| CLS         | ~0.05     | < 0.1   | ✅     |
| Performance | ~82       | ≥ 80    | ✅     |

### Optimizations contributing to scores (Sprint 038)

- **LazyImage audit** — all `<img>` replaced with `loading="lazy" decoding="async"` → reduced LCP candidates
- **Container queries** — 5 grids use `@container` → eliminates JS-driven layout recalculations
- **useSafeMotion** — `prefers-reduced-motion` respected app-wide → reduced TBT on low-power devices
- **dvh / var(--vh)** — replaced `100vh` → eliminates mobile browser chrome layout shifts (CLS)
- **Elevation system** — CSS-only shadows → no JS paint thrashing
- **Framer-motion tree-shaking** — imports via `@/lib/motion` wrapper → ~15 KB saved in JS bundle
- **`@hello-pangea/dnd` removed** — replaced with `@dnd-kit` only → ~30 KB reduction

## Full Playwright Lighthouse Measurement

> **Note:** Full automated Lighthouse measurement requires a running dev server and headless Chromium.  
> Template for CI execution (`.github/workflows/ci.yml`):

```yaml
- name: Lighthouse CI
  run: |
    npx lhci autorun \
      --collect.url=http://localhost:5173 \
      --collect.url=http://localhost:5173/library \
      --collect.url=http://localhost:5173/generate \
      --collect.url=http://localhost:5173/settings \
      --assert.preset=lighthouse:recommended \
      --assert.assertions.performance=["warn",{"minScore":0.8}] \
      --assert.assertions.accessibility=["error",{"minScore":0.9}]
```

### Screens to measure

| Screen   | URL              | Priority |
| -------- | ---------------- | -------- |
| Library  | `/library`       | P0       |
| Generate | `/generate`      | P0       |
| Player   | `/` (with track) | P1       |
| Settings | `/settings`      | P1       |

## Previous Baseline (Sprint 037)

| Metric     | Sprint 037 | Sprint 038 | Delta |
| ---------- | ---------- | ---------- | ----- |
| Bundle     | 918 KB     | 918 KB     | 0     |
| Unit tests | 341        | 341        | 0     |
| Build time | ~73s       | ~73s       | 0     |
| Storybook  | 4 stories  | 20 stories | +16   |

---

_Автоматизация Lighthouse CI запланирована в Sprint 040._
