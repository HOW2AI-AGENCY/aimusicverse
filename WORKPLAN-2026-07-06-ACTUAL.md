# План работ — 06.07.2026 (Актуальный)

**Дата:** 6 июля 2026  
**Статус:** 99.5% complete, 1497 passing unit tests (0 failures)  
**Фокус:** Декомпозиция god-файлов + стабилизация CI

---

## 🎯 Текущее состояние (верифицировано)

### Метрики

| Метрика        | Значение                      | Цель    | Статус   |
| -------------- | ----------------------------- | ------- | -------- |
| Unit тесты     | 1497 passing                  | 1500+   | 🟢 99.8% |
| Test files     | 123 passed                    | 125     | 🟢 98.4% |
| Failures       | 0                             | 0       | ✅       |
| Files >700 LOC | 4 (excluding types/drum-kits) | 0       | 🟡       |
| Bundle eager   | 508 KB gzip                   | ≤950 KB | ✅       |
| `any` в prod   | 0                             | 0       | ✅       |

### Файлы для декомпозиции (>700 LOC, исключая auto-generated)

| Файл                            | LOC | Приоритет | Статус |
| ------------------------------- | --- | --------- | ------ |
| `UnifiedNotesViewer.tsx`        | 760 | P1        | 🔄     |
| `LyricsVisualEditorCompact.tsx` | 706 | P1        | 🔄     |
| `IntegratedStemTracks.tsx`      | 705 | P1        | 🔄     |
| `design-colors.ts`              | 680 | P2        | 📋     |
| `presets.api.ts`                | 668 | P2        | 📋     |
| `PublicProfilePage.tsx`         | 664 | P2        | 📋     |

**Примечание:** `supabase/types.ts` (6984 LOC) и `drum-kits.ts` (1427 LOC) — auto-generated/data файлы, не требуют декомпозиции.

---

## 📋 План работ

### Phase 1: Декомпозиция God-файлов (3-5 дней)

#### T1.1: UnifiedNotesViewer.tsx (760 LOC → 3 файла)

**Целевая архитектура:**

```
UnifiedNotesViewer/
├── index.tsx          (~200 LOC) — основной компонент
├── NotesList.tsx      (~250 LOC) — список заметок
├── NoteEditor.tsx     (~200 LOC) — редактирование
└── NotesHeader.tsx    (~110 LOC) — заголовок + фильтры
```

#### T1.2: LyricsVisualEditorCompact.tsx (706 LOC → 3 файла)

**Целевая архитектура:**

```
LyricsVisualEditorCompact/
├── index.tsx              (~200 LOC) — основной компонент
├── EditorToolbar.tsx      (~200 LOC) — панель инструментов
├── TimelineView.tsx       (~200 LOC) — таймлайн
└── helpers.ts             (~106 LOC) — утилиты
```

#### T1.3: IntegratedStemTracks.tsx (705 LOC → 3 файла)

**Целевая архитектура:**

```
IntegratedStemTracks/
├── index.tsx              (~200 LOC) — основной компонент
├── StemPlayer.tsx         (~200 LOC) — плеер
├── StemControls.tsx       (~200 LOC) — управление
└── StemVisualizer.tsx     (~105 LOC) — визуализация
```

---

### Phase 2: Sprint 056 Phase C-D (2-3 дня)

| Задача | Описание                        | Статус |
| ------ | ------------------------------- | ------ |
| C1     | Проверить stories в Storybook   | 📋     |
| C2     | Responsive examples             | 📋     |
| C3     | A11y docs                       | 📋     |
| C4     | Interaction examples            | 📋     |
| D1     | COMPONENTS.md                   | 📋     |
| D2     | Thin orchestrator pattern guide | 📋     |
| D3     | Migration guide                 | 📋     |
| D4     | CHANGELOG обновление            | 📋     |

---

### Phase 3: CI/CD стабилизация (1-2 дня)

| Задача | Описание                                             | Блокер |
| ------ | ---------------------------------------------------- | ------ |
| 050-A1 | Восстановить `@rollup/rollup-win32-x64-msvc` для E2E | —      |
| 050-A4 | Включить branch protection enforcement               | —      |
| CI-fix | Проверить npm test на Windows (cross-env)            | —      |

---

### Phase 4: Документация (1-2 дня, параллельно)

| Задача                     | Описание                         |
| -------------------------- | -------------------------------- |
| Обновить PROJECT_STATUS.md | Текущий спринт: 057, тесты: 1497 |
| Обновить ROADMAP.md        | Gantt chart на Q3 2026           |
| Sprint ретроспективы       | 053, 054, 055, 056               |
| README.md                  | Текущий фокус                    |

---

## 📅 Timeline

```
Week 1 (July 6-12):
  Mon-Tue: Декомпозиция UnifiedNotesViewer + LyricsVisualEditorCompact
  Wed: Декомпозиция IntegratedStemTracks
  Thu-Fri: Sprint 056 Phase C-D (Storybook)

Week 2 (July 13-19):
  Mon-Tue: CI/CD stabilization (E2E + branch protection)
  Wed-Thu: Документация + ретроспективы
  Fri: Review + planning Sprint 057
```

---

## 🎯 Success Metrics (на 2026-07-19)

| Метрика           | Сейчас       | Цель          |
| ----------------- | ------------ | ------------- |
| Unit тесты        | 1497         | 1500+         |
| Files >700 LOC    | 4            | 0             |
| Sprint 056        | Phase A-B ✅ | Phase C-D ✅  |
| E2E               | Blocked      | 48/48 passing |
| Branch protection | Phase 1      | Phase 2       |

---

## 🚀 Следующие спринты (после закрытия текущих)

- **Sprint 057** — Collaboration features (realtime sessions)
- **Sprint 058** — Marketplace MVP (beats / loops)
- **Sprint 059** — A/B testing framework
- **Sprint 060** — Multi-language UI (EN/RU start)

---

**Последнее обновление:** 2026-07-06  
**Ответственный:** Claude Code Agent  
**Next review:** 2026-07-13
