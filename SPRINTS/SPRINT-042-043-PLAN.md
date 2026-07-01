# Аудит проекта MusicVerse AI + План работ (Sprint 042–045)

**Дата:** 2026-07-01
**Аудитор:** codebase-analyzer (Claude)
**Предыдущий аудит:** 2026-06-28 (score 6.1/10)

---

## 📊 Executive Summary

| Метрика                           | 28.06.2026 | 01.07.2026              | Δ         |
| --------------------------------- | ---------- | ----------------------- | --------- |
| Общая оценка архитектуры          | 6.1 / 10   | **6.7/10**              | ▲ +0.6    |
| `any` в `src/`                    | 342        | **449**                 | ▲ +107 ⚠️ |
| Файлов > 500 LOC                  | 33         | **81**                  | ▲ +48 ⚠️  |
| Файлов > 800 LOC                  | 6          | **9**                   | ▲ +3 ⚠️   |
| `@ts-nocheck` blanket suppression | n/a        | **15**                  | baseline  |
| `console.log` (запрещены)         | n/a        | **36 / 16 файлов**      | baseline  |
| `JSON.parse(JSON.stringify())`    | n/a        | **16 / 5 файлов**       | baseline  |
| `new Audio()` вне пула            | n/a        | **28 / 26 файлов** ⚠️   | CRITICAL  |
| Компоненты импортируют supabase   | n/a        | **72 файла** ⚠️         | HIGH      |
| Touch targets < 44px              | n/a        | **391 / 207 файлов** ⚠️ | MEDIUM    |
| localStorage refs                 | n/a        | 464 / 101 файлов        | MEDIUM    |
| Barrel re-export `index.ts`       | n/a        | 113                     | LOW       |

### ✅ Что реально исправлено с прошлого аудита

- **Store decomposition** — `useUnifiedStudioStore` 1361 → 30-строчный shim + 6 slices <350 LOC каждый в `src/stores/studio/`
- **`GlobalAudioProvider`** — 625 → 80 LOC, оркестрирует 9 фокусных подхуков
- **Vite chunking** — есть документированные TDZ-обходы для опасных чанков
- **rules-of-hooks → error** в ESLint

### 🔴 Критические находки (новое)

1. **Множественные `<audio>` элементы** — 28 `new Audio()` вне `audioElementPool` в 26 файлах. Это регресс, ради которого изначально и создавался пул (iOS Safari крашится при >10 элементах).
2. **3 бага в `LyricsStudio.tsx`:** приоритет `??` ниже `+`, side-effect внутри `useMemo`, `navigate(-1)` в Telegram может закрыть Mini App.
3. **9 god-файлов > 800 LOC** без единого unit-теста.
4. **`any` вырос** — план Sprint 040 не остановил рост.

---

## 🎯 Сводный план работ (4 спринта)

| Sprint    | Название                            | Длительность | SP     | Цель                                                |
| --------- | ----------------------------------- | ------------ | ------ | --------------------------------------------------- |
| 042       | Page Decomposition + Audio Pooling  | 5 дней       | 18     | Декомпозиция god-pages + `usePreviewAudio()` hook   |
| 043       | Layer Compliance + Touch Targets    | 5 дней       | 16     | 72→0 Supabase-импортов в компонентах, touch 44px    |
| 044       | Type Safety Wave 2 + Result Pattern | 5 дней       | 14     | `any` 449 → <50, `Result<T,E>` для сервисов         |
| 045       | Hygiene + Documentation             | 3 дня        | 8      | console.log=0, structuredClone, @ts-nocheck=0, ADRs |
| **Итого** |                                     | **18 дней**  | **56** | Score **6.7 → 8.5/10**                              |

> Все эти спринты не отменяют запланированные Sprint 040/041 — это дополнительный трек для технического долга, обнаруженного аудитом 01.07.2026.

---

## 🔥 Sprint 042 — Page Decomposition + Audio Pooling (5 дней, 18 SP)

**Цель:** декомпозировать 3 самых опасных god-файла + закрыть регрессию с множественными `<audio>`.

### Задачи

| ID     | Задача                                                                              | SP  | Файл(ы)                                                          |
| ------ | ----------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------- |
| 042-01 | Декомпозиция `LyricsStudio.tsx` (1092 → <400 LOC)                                   | 4   | `src/pages/LyricsStudio.tsx` → `src/pages/lyrics-studio/*.tsx`   |
| 042-02 | Декомпозиция `ProjectDetail.tsx` (851 → <400 LOC)                                   | 3   | `src/pages/ProjectDetail.tsx` → `src/pages/project-detail/*.tsx` |
| 042-03 | Декомпозиция `usePromptDJEnhanced.ts` (1071 → <500 LOC)                             | 4   | → `src/hooks/prompt-dj/use*.ts`                                  |
| 042-04 | `usePreviewAudio()` hook + миграция 28 `new Audio()`                                | 3   | `src/hooks/audio/usePreviewAudio.ts` + 26 файлов                 |
| 042-05 | Фикс 3 багов в `LyricsStudio.tsx` (`??`+`+`, `useMemo`→`useEffect`, `navigate(-1)`) | 1   | `src/pages/LyricsStudio.tsx:310-319, 463, 413`                   |
| 042-06 | Smoke E2E после декомпозиции (`lyrics`, `project`, `prompt-dj`)                     | 2   | `tests/e2e/*`                                                    |
| 042-07 | `npm run size` + bundle report                                                      | 1   | CI                                                               |

### Definition of Done

- [ ] `LyricsStudio.tsx` < 400 LOC, нет `@ts-nocheck`, нет прямых импортов supabase
- [ ] `ProjectDetail.tsx` < 400 LOC
- [ ] `usePromptDJEnhanced.ts` < 500 LOC (разбит на ≥3 файла)
- [ ] `grep -rn "new Audio(" src/ --exclude-dir=audioElementPool --exclude-dir=usePreviewAudio` = 0
- [ ] Bundle ≤ 950 KB
- [ ] Все 3 бага закрыты unit-тестами

---

## 🛡 Sprint 043 — Layer Compliance + Touch Targets (5 дней, 16 SP)

**Цель:** устранить 72 layer violation (Supabase в компонентах) + mobile touch-target compliance.

### Задачи

| ID     | Задача                                                                                   | SP  |
| ------ | ---------------------------------------------------------------------------------------- | --- |
| 043-01 | Layer-violation cleanup pass #2: studio-tree (15 файлов)                                 | 3   |
| 043-02 | Layer-violation cleanup pass #2: lyrics-workspace + generate-form (15 файлов)            | 3   |
| 043-03 | Layer-violation cleanup pass #2: admin + telegram + остальное (42 файла)                 | 4   |
| 043-04 | ESLint rule `no-restricted-imports` для блокировки supabase в `components/`              | 1   |
| 043-05 | Touch-target ESLint rule + миграция 391 кнопок `h-7/h-8/h-6` → ≥44px через `TouchTarget` | 3   |
| 043-06 | Аудит mobile-флоу после правок (Pixel 5 + iPhone 12 в Playwright)                        | 2   |

### Definition of Done

- [ ] `grep -rln "@/integrations/supabase" src/components/` = 0 (admin может быть исключением)
- [ ] ESLint rule активна в CI
- [ ] `grep -rE "h-(6|7|8) w-(6|7|8)" src/components/ | wc -l` ≤ 20 (только декоративные)
- [ ] Mobile Playwright smoke зелёный

---

## 🧬 Sprint 044 — Type Safety Wave 2 + Result Pattern (5 дней, 14 SP)

**Цель:** устранить `any` 449 → <50, унифицировать error-handling.

### Задачи

| ID     | Задача                                                                                       | SP  |
| ------ | -------------------------------------------------------------------------------------------- | --- |
| 044-01 | `Result<T,E>` в `src/lib/result.ts` + 5 unit-тестов                                          | 1   |
| 044-02 | `any` в `src/hooks/**` (180) → <20                                                           | 4   |
| 044-03 | `any` в `src/stores/**` (80) → <10                                                           | 2   |
| 044-04 | `any` в `src/pages/**` (90) → <10                                                            | 2   |
| 044-05 | `any` в `src/components/**` остатки (90) → <10                                               | 2   |
| 044-06 | Конвертация `VoiceCloneService`, `AudioAnalysisService`, `ReferenceManager` на `Result<T,E>` | 2   |
| 044-07 | `@typescript-eslint/no-explicit-any: error` + whitelist <50                                  | 1   |

### Definition of Done

- [ ] `grep -rEn ": any|<any>|as any" src/ | wc -l` < 50
- [ ] `tsc --noEmit` = 0
- [ ] `Result<T,E>` используется в 3 крупных сервисах
- [ ] ESLint rule активна в CI

---

## 🧹 Sprint 045 — Hygiene + Documentation (3 дня, 8 SP)

**Цель:** привести конвенции и документацию к актуальному состоянию после 042–044.

### Задачи

| ID     | Задача                                                                                                | SP  |
| ------ | ----------------------------------------------------------------------------------------------------- | --- |
| 045-01 | `structuredClone()` вместо `JSON.parse(JSON.stringify())` во всех 5 файлах                            | 1   |
| 045-02 | Удаление `@ts-nocheck` из оставшихся 11 файлов                                                        | 2   |
| 045-03 | `console.log` → `logger.*` в 16 файлах (36 вызовов)                                                   | 1   |
| 045-04 | `localStorage` namespace manager (`src/lib/storage/namespaces.ts`) — для топ-20 файлов                | 2   |
| 045-05 | Обновить `CLAUDE.md` "Common Pitfalls" (3 новых бага + audio pool) + новый `docs/AUDIT-2026-07-01.md` | 1   |
| 045-06 | ADR-0005: "Page decomposition strategy" + ADR-0006: "Preview audio pattern"                           | 1   |

### Definition of Done

- [ ] `grep -rn "JSON.parse(JSON.stringify" src/` = 0
- [ ] `grep -rn "@ts-nocheck" src/` = 0
- [ ] `grep -rn "console.log" src/` = 0 (кроме `lib/debug/`)
- [ ] 2 новых ADR
- [ ] `CLAUDE.md` обновлён, `SPRINT-PROGRESS.md` обновлён

---

## 🚀 Quick Wins (можно делать ПАРАЛЛЕЛЬНО с любым спринтом)

| ID    | Задача                                                          | Время  | Файл                                                    |
| ----- | --------------------------------------------------------------- | ------ | ------------------------------------------------------- |
| QW-01 | Фикс приоритета `??` vs `+`                                     | 1 мин  | `src/pages/LyricsStudio.tsx:463`                        |
| QW-02 | `useMemo` со side-effect → `useEffect`                          | 5 мин  | `src/pages/LyricsStudio.tsx:310-319`                    |
| QW-03 | Заменить `JSON.parse(JSON.stringify)` на `structuredClone`      | 30 мин | 5 файлов                                                |
| QW-04 | Удалить дубликат `<audio>` в `NotificationContext.tsx:385, 482` | 30 мин | `src/contexts/NotificationContext.tsx`                  |
| QW-05 | `console.log` → `logger.*` в 5 API-файлах                       | 20 мин | `src/api/{midi,lyrics,recordings,presets,batch}.api.ts` |
| QW-06 | Убрать `@ts-nocheck` из 4 API-файлов                            | 2 ч    | `src/api/{batch,lyrics,presets,shortcuts}.api.ts`       |
| QW-07 | `npm run build` → зафиксировать актуальный bundle size          | 5 мин  | CI                                                      |

---

## 📋 Полный список god-файлов (>800 LOC) под декомпозицию

| LOC  | Файл                                                     | Sprint  |
| ---- | -------------------------------------------------------- | ------- |
| 1092 | `src/pages/LyricsStudio.tsx`                             | 042     |
| 1071 | `src/hooks/usePromptDJEnhanced.ts`                       | 042     |
| 903  | `src/lib/lyrics/LyricsParser.ts`                         | 042/044 |
| 872  | `src/components/studio/unified/IntegratedStemTracks.tsx` | 042     |
| 855  | `src/components/studio/UnifiedNotesViewer.tsx`           | 042/044 |
| 851  | `src/pages/ProjectDetail.tsx`                            | 042     |
| 844  | `src/lib/analytics/deeplink-tracker.ts`                  | 045     |
| 827  | `src/lib/errorHandling.ts`                               | 045     |
| 812  | `src/components/generate-form/LyricsVisualEditor.tsx`    | 042/043 |
| 796  | `src/components/generate-form/AudioActionDialog.tsx`     | 042     |
| 748  | `src/components/generate-form/PromptHistory.tsx`         | 043     |
| 747  | `src/api/presets.api.ts`                                 | 044     |
| 729  | `src/services/voice/VoiceCloneService.ts`                | 044     |
| 720  | `src/components/studio/unified/StudioShell.tsx`          | 043     |
| 720  | `src/components/audio-record/AudioRecordDialog.tsx`      | 043     |

---

## 📈 Ожидаемый результат после Sprint 042–045

| Метрика                           | 01.07.2026 | После 045  |
| --------------------------------- | ---------- | ---------- |
| Общая оценка архитектуры          | 6.7 / 10   | **8.5/10** |
| `any` в `src/`                    | 449        | **<50**    |
| Файлов > 500 LOC                  | 81         | **<15**    |
| Файлов > 800 LOC                  | 9          | **0**      |
| `@ts-nocheck` blanket suppression | 15         | **0**      |
| `console.log` (запрещены)         | 36         | **0**      |
| `JSON.parse(JSON.stringify())`    | 16         | **0**      |
| `new Audio()` вне пула            | 28         | **0**      |
| Компоненты импортируют supabase   | 72         | **0**      |
| Touch targets < 44px (критичные)  | 391        | **<20**    |

---

## 🔗 Связи с существующими спринтами

```
Sprint 037 (DX)            ✅ done
Sprint 038 (Design System) ✅ done
Sprint 039 (Refactor)      🟡 5/14 (нужно завершить 039-04..14)
Sprint 040 (Tests/Export)  📋 Q3
Sprint 040-Type (TS)       📋 Q3
Sprint 041 (UX)            📋 Q3
  ↓
Sprint 042 (Page decomp)   🆕 Q3 — настоящий план
Sprint 043 (Layers/Touch)  🆕 Q3
Sprint 044 (TS Wave 2)     🆕 Q3
Sprint 045 (Hygiene)       🆕 Q3
```

> Эти 4 спринта можно выполнять параллельно с 040/041 (разные файлы) или последовательно после 040.

---

## 📚 Ссылки

- [SPRINT-040-PLAN.md](SPRINT-040-PLAN.md) — Tests + Audio Export
- [SPRINT-040-TYPE-SAFETY-PLAN.md](SPRINT-040-TYPE-SAFETY-PLAN.md) — Type Safety + God Files (пересекается с 042/044)
- [SPRINT-041-PLAN.md](SPRINT-041-PLAN.md) — UX Features
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) — общий статус
- [docs/REPOSITORY_AUDIT_REPORT_2026-06-25.md](../docs/REPOSITORY_AUDIT_REPORT_2026-06-25.md) — предыдущий аудит

---

<sub>Создано: 2026-07-01 · Статус: 🆕 Plan</sub>
