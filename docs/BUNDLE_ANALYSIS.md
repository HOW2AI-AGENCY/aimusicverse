# 📦 Bundle Analysis — MusicVerse AI

<div align="center">

**Дата**: 2026-06-25  
**Статус**: 🟢 Build successful  
**Build time**: 52.83s  
**Modules**: 6,435 transformed

</div>

---

## 📊 Total Bundle Size

| Метрика | Raw | Gzip | Brotli |
|---------|-----|------|--------|
| **Total** | ~6.1 MB | ~1.8 MB | ~1.4 MB |
| **CSS** | 341 KB | 46 KB | 33 KB |
| **JS** | ~5.8 MB | ~1.75 MB | ~1.37 MB |

---

## 🏗️ Chunk Analysis (Top 20 by size)

### ⚠️ Problematic Chunks (>500KB)

| # | Chunk | Raw | Gzip | Critical? |
|---|-------|-----|------|-----------|
| 1 | `vendor-osmd` | **1,214 KB** | 309 KB | 🔴 Always lazy loaded |
| 2 | `vendor-other` | **1,002 KB** | 320 KB | 🔴 Needs splitting |
| 3 | `vendor-charts` | **491 KB** | 122 KB | 🟡 Recharts heavy |
| 4 | `feature-generation-form` | **389 KB** | 111 KB | 🟡 Needs review |
| 5 | `feature-studio-unified` | **355 KB** | 102 KB | 🟡 Large feature |
| 6 | `page-admin` | **350 KB** | 80 KB | 🟡 Admin dashboard |

### ✅ Acceptable Chunks

| Chunk | Raw | Gzip | Notes |
|-------|-----|------|-------|
| `vendor-react` | 249 KB | 80 KB | ✅ React + Router + Zustand |
| `vendor-tone` | 261 KB | 58 KB | ✅ Core audio lib |
| `vendor-supabase` | 202 KB | 50 KB | ✅ Supabase client |
| `vendor-radix` | 197 KB | 54 KB | ✅ UI components |
| `vendor-dnd` | 127 KB | 39 KB | ✅ DnD libraries |
| `feature-lyrics-wizard` | 210 KB | 52 KB | ✅ Lyrics editor |
| `feature-stem-studio` | 136 KB | 39 KB | ✅ Stem processing |
| `vendor-framer` | 33 KB | 11 KB | ✅ Small, optimized |

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

| Оптимизация | Impact | Effort |
|-------------|--------|--------|
| **Lazy import dla lamejs** | -100KB raw | Low |
| **Lazy import dla canvas-confetti** | -20KB raw | Low |
| **Lazy import dla qrcode** | -30KB raw | Low |
| **Split vendor-other** by usage frequency | -300KB raw | Medium |

### Priority P2 (Important)

| Оптимизация | Impact | Effort |
|-------------|--------|--------|
| **Replace recharts** with chart.js | -300KB raw | High |
| **Code-split feature-generation-form** | -200KB raw | Medium |
| **Remove unused deps** (npm audit) | -50KB raw | Low |

### Priority P3 (Nice to have)

| Оптимизация | Impact | Effort |
|-------------|--------|--------|
| **Tree-shake framer-motion** better | -10KB | Low |
| **Remove `lovable-tagger` in prod** | -10KB | Low |

---

## 🚀 Expected Results After All Optimizations

| Chunk | Current (gzip) | Target (gzip) |
|-------|---------------|---------------|
| vendor-other | 320 KB | **200 KB** |
| feature-generation-form | 111 KB | **80 KB** |
| vendor-charts | 122 KB | **50 KB** |
| vendor-osmd | 309 KB | **309 KB** (lazy) |
| **Total JS** | **~1.8 MB** | **~1.4 MB** |
| **Initial load** | **~150 KB** | **~120 KB** |

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