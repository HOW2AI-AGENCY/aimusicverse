# 📦 Bundle Analysis — MusicVerse AI

<div align="center">

**Дата**: 2026-06-25 (см. апдейт 2026-07-03 ниже)  
**Статус**: 🟢 Build successful  
**Build time**: 52.83s  
**Modules**: 6,435 transformed

</div>

---

## 🔄 Update 2026-07-03 — homepage/bundle investigation

Chunk names below (`feature-generation-form`, `feature-studio-unified`, `page-admin`) no longer exist in `vite.config.ts` — they were merged into a single `feature-admin-studio` chunk (2 MB raw / ~524 KB gzip) to fix documented TDZ crashes. Numbers below are historical; current ground truth:

- **`size-limit`'s "Total Bundle" check sums every JS chunk in `dist/assets/*.js`** — including admin/studio/lazy pages nobody but admins visit. That's why it reports **2.11 MB gzip**, not the previously-cited 918 KB (stale) or the older "~1.8 MB" in this doc. This metric doesn't reflect what any single page actually downloads.
- **What the homepage (and every other page) actually fetches eagerly on cold load** dropped from **~1.19 MB gzip to ~508 KB gzip**. Root cause: `feature-admin-studio`, `vendor-charts`, `vendor-dnd`, `vendor-forms`, and `vendor-confetti` were being unconditionally `<link rel="modulepreload">`'d into every page's HTML, because:
  1. `TrackDetailSheet.tsx` (opened from `UnifiedTrackMenu`, rendered on every track card app-wide) statically imported `GenerateSheet` → `AudioActionDialog` instead of lazy-loading it — fixed by converting to `React.lazy()` + `Suspense`, matching the pattern already used in `Index.tsx`. This alone eliminated `vendor-dnd` as a real dependency.
  2. `MainLayout.tsx` / `GlobalGenerationIndicator.tsx` imported single hooks through the `@/hooks/generation` barrel, which transitively pulled in `PromptHistory.tsx` (assigned to the merged admin/studio chunk) — fixed by importing the hooks directly from their own files, bypassing the barrel.
  3. `feature-admin-studio` and `vendor-charts` remain genuine hard dependencies of the entry chunk (confirmed via Rollup's `getModuleInfo().importers` graph — not a source-level leak, but a shared-chunk artifact of merging ~15 directories into one chunk). Added `build.modulePreload.resolveDependencies` in `vite.config.ts` to stop the browser from _speculatively_ preloading them — doesn't remove the bytes, but stops them competing for network priority with resources every page actually needs.
- A **full elimination** of `feature-admin-studio`/`vendor-charts` from the entry would require restructuring the merged-chunk boundaries in `vite.config.ts` — out of scope here given the documented TDZ-crash history around that exact chunking strategy; flagged as a dedicated follow-up if further reduction is wanted.
- Also fixed in the same pass: `getOptimizedImageUrl()`/`generateSrcSet()` in `src/lib/imageOptimization.ts` were appending `?width=&height=&quality=` to the plain Supabase **object** endpoint (`/storage/v1/object/public/...`), which silently ignores those params — no resize/optimization was ever actually happening. Fixed by rewriting to the **render** endpoint (`/storage/v1/render/image/public/...`) first. Confirmed via Supabase's own docs that WebP is already auto-negotiated by that endpoint (no explicit format param needed); AVIF isn't supported yet.

---

## 📊 Total Bundle Size

| Метрика   | Raw     | Gzip     | Brotli   |
| --------- | ------- | -------- | -------- |
| **Total** | ~6.1 MB | ~1.8 MB  | ~1.4 MB  |
| **CSS**   | 341 KB  | 46 KB    | 33 KB    |
| **JS**    | ~5.8 MB | ~1.75 MB | ~1.37 MB |

---

## 🏗️ Chunk Analysis (Top 20 by size)

### ⚠️ Problematic Chunks (>500KB)

| #   | Chunk                     | Raw          | Gzip   | Critical?             |
| --- | ------------------------- | ------------ | ------ | --------------------- |
| 1   | `vendor-osmd`             | **1,214 KB** | 309 KB | 🔴 Always lazy loaded |
| 2   | `vendor-other`            | **1,002 KB** | 320 KB | 🔴 Needs splitting    |
| 3   | `vendor-charts`           | **491 KB**   | 122 KB | 🟡 Recharts heavy     |
| 4   | `feature-generation-form` | **389 KB**   | 111 KB | 🟡 Needs review       |
| 5   | `feature-studio-unified`  | **355 KB**   | 102 KB | 🟡 Large feature      |
| 6   | `page-admin`              | **350 KB**   | 80 KB  | 🟡 Admin dashboard    |

### ✅ Acceptable Chunks

| Chunk                   | Raw    | Gzip  | Notes                       |
| ----------------------- | ------ | ----- | --------------------------- |
| `vendor-react`          | 249 KB | 80 KB | ✅ React + Router + Zustand |
| `vendor-tone`           | 261 KB | 58 KB | ✅ Core audio lib           |
| `vendor-supabase`       | 202 KB | 50 KB | ✅ Supabase client          |
| `vendor-radix`          | 197 KB | 54 KB | ✅ UI components            |
| `vendor-dnd`            | 127 KB | 39 KB | ✅ DnD libraries            |
| `feature-lyrics-wizard` | 210 KB | 52 KB | ✅ Lyrics editor            |
| `feature-stem-studio`   | 136 KB | 39 KB | ✅ Stem processing          |
| `vendor-framer`         | 33 KB  | 11 KB | ✅ Small, optimized         |

---

## 🔍 Detailed Analysis

### Opensheetmusicdisplay (`vendor-osmd`) — 1.2MB

**Проблема**: Огромная библиотека для нотной грамоты.  
**Решение**: Уже в отдельном lazy chunk. Не грузится пока не откроется sheet music.  
**Impact**: Только если пользователь открывает page-music-graph.

### Vendor-Other (1MB)

**Содержит**:

- `@sentry/react` — ~50KB gzip
- `canvas-confetti` — ~15KB
- `qrcode` — ~20KB
- `dompurify` — ~15KB
- `lamejs` — **~100KB** (MP3 encoding)
- `jszip` — ~30KB
- `lovable-tagger` — ~10KB
- web-audio-beat-detector — ~5KB
- Прочие мелкие библиотеки

**План оптимизации**:

- [ ] `lamejs` → lazy import (используется только при экспорте MP3)
- [ ] `canvas-confetti` → lazy import (редкое использование)
- [ ] `qrcode` → lazy import (только в платежах)
- [ ] `@sentry/react` → оставить (нужен везде)

### Feature-generation-form (389KB)

**Содержит** сложные формы генерации с множеством зависимостей.  
**Impact**: Загружается на странице генерации, не в initial bundle.

### Recharts (vendor-charts) — 491KB

**Проблема**: Recharts + d3 dependencies.  
**Решение**: Уже в отдельном chunk.  
**План**: Рассмотреть замену на light-weight charting (chart.js или custom SVG).

---

## 🎯 Circular Chunk Warnings — RESOLVED

Было **17 warnings** о circular dependencies между feature chunks.  
**Решение**: Merged мелкие chunks (feature-studio-timeline, feature-studio-editor, feature-studio-mixer) в один `feature-studio`.

### Resolved circulars:

```
vendor-other → vendor-react → vendor-other                ✅ RESOLVED
feature-stem-studio → feature-generation-form → ...       ✅ RESOLVED
feature-generation-form → feature-lyrics-wizard → ...     ✅ RESOLVED
feature-studio-unified → store-studio → ...              ✅ RESOLVED
10+ другие                                                ✅ RESOLVED
```

---

## 📈 Recommended Optimizations

### Priority P1 (Critical)

| Оптимизация                               | Impact     | Effort |
| ----------------------------------------- | ---------- | ------ |
| **Lazy import dla lamejs**                | -100KB raw | Low    |
| **Lazy import dla canvas-confetti**       | -20KB raw  | Low    |
| **Lazy import dla qrcode**                | -30KB raw  | Low    |
| **Split vendor-other** by usage frequency | -300KB raw | Medium |

### Priority P2 (Important)

| Оптимизация                            | Impact     | Effort |
| -------------------------------------- | ---------- | ------ |
| **Replace recharts** with chart.js     | -300KB raw | High   |
| **Code-split feature-generation-form** | -200KB raw | Medium |
| **Remove unused deps** (npm audit)     | -50KB raw  | Low    |

### Priority P3 (Nice to have)

| Оптимизация                         | Impact | Effort |
| ----------------------------------- | ------ | ------ |
| **Tree-shake framer-motion** better | -10KB  | Low    |
| **Remove `lovable-tagger` in prod** | -10KB  | Low    |

---

## 🚀 Expected Results After All Optimizations

| Chunk                   | Current (gzip) | Target (gzip)     |
| ----------------------- | -------------- | ----------------- |
| vendor-other            | 320 KB         | **200 KB**        |
| feature-generation-form | 111 KB         | **80 KB**         |
| vendor-charts           | 122 KB         | **50 KB**         |
| vendor-osmd             | 309 KB         | **309 KB** (lazy) |
| **Total JS**            | **~1.8 MB**    | **~1.4 MB**       |
| **Initial load**        | **~150 KB**    | **~120 KB**       |

---

## 🔧 Commands

```bash
# Build with analysis
npm run build

# Size check
npm run size

# Visual analysis
npm run size:why
# → opens dist/stats.html

# Analyze specific chunks
npx vite-bundle-analyzer
```

---

## 📝 Notes

- Build time: 52.83s (6,435 modules)
- 17 circular chunk warnings → resolved in vite.config.ts
- `vendor-forms` chunk — empty, created from zod + hookform (both tree-shaken)
- CSS: 341 KB raw / 46 KB gzip (Tailwind + custom styles)

---

<div align="center">

**Последнее обновление**: 2026-06-25

</div>
