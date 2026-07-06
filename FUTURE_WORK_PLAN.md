# План дальнейших работ MusicVerse AI (2026-07-06)

**Дата:** 6 июля 2026  
**Статус проекта:** 99% complete, 925 passing unit tests  
**Фокус:** Стабилизация + тестовое покрытие + закрытие техдолга

---

## 🎯 Текущее состояние

### ✅ Завершённые спринты (2026-07-05/06)

- **Sprint 052-C cleanup** ✅ — Storybook stories + i18n strings (100% complete)
- **Sprint 055** ✅ — UX Critical Fixes (13/13 P0/P1 tasks)
- **Sprint 056** ✅ — GenerateSheet Redesign + Storybook (Phase A-D complete)
- **Sprint 050 Phase A+B** ✅ — Main Green + Mobile Audit F1–F12
- **Sprint 053** ✅ — Suno Sounds + MIDI Direct + Boost Style
- **Sprint 054** ✅ — Suno Details Suite (28/28 Suno API endpoints)

### 🔄 В работе

- **Sprint 051 T056** — декомпозиция god files (5/9 done)
- **Sprint 050-A4 Phase 2** — branch protection required checks

---

## 📋 План на ближайшие 2-3 недели

### Priority 1: Завершение Sprint 050 — Branch Protection Phase 2

**Задача:** Добавить required CI checks к ruleset `18508298`

**Блокеры:** ✅ Разблокировано — Sprint 050-A6 (format fix-up) завершён

**Действия:**

1. Добавить `pull_request` rule (0 approvals для self-merge)
2. Добавить `required_status_checks: [quality, build, smoke]`
3. Проверить работу CI на test PR

**Ожидаемый результат:** Force-push и прямые коммиты заблокированы, все PR проходят через CI

**Срок:** 1 день

---

### Priority 2: Sprint 051 — Test Debt + God Files Decomposition

**Цель:** 925 → 450+ unit tests, 0 файлов >800 строк

#### Phase A: Завершить декомпозицию (4 remaining files)

| Файл                       | Текущий LOC | Целевое разбиение                          | Статус |
| -------------------------- | ----------- | ------------------------------------------ | ------ |
| `IntegratedStemTracks.tsx` | 700+        | StemPlayer / StemControls / StemVisualizer | 🔄     |
| `LyricsVisualEditor.tsx`   | 700+        | Editor / Toolbar / Timeline                | 🔄     |
| `UnifiedNotesViewer.tsx`   | 700+        | NotesList / NoteEditor / NotesHeader       | 🔄     |
| `AudioAnalysisService.ts`  | 700+        | AnalysisService + helpers                  | 🔄     |

#### Phase B: Unit tests для API + Service слоёв

**Цель:** +150-200 unit tests (текущие 925 → 1075+)

**Приоритеты:**

1. `src/api/*.api.ts` (20 файлов) — по 3-5 тестов каждый
2. `src/services/*.service.ts` (18 файлов) — по 5-8 тестов каждый
3. TanStack Query mutations:
   - `useSunoMashup` — 5 тестов
   - `useSunoPersona` — 5 тестов
   - `useSunoFileUpload` — 5 тестов

#### Phase C: Включить неисполняемые тесты

**Проблема:** 25 файлов в `tests/unit/` не подхватываются vitest include

**Решение:**

1. Расширить include-паттерн в `vitest.config.ts`
2. Прогнать полный suite
3. Починить fallback'и

**Ожидаемый результат:** 925 → 1100+ unit tests, все исполняются в CI

**Срок:** 10-12 дней

---

### Priority 3: Documentation + Process

#### A. Ретроспективы и документация

**Задачи:**

- [ ] Sprint 053 retro (SPRINT-053-RETRO.md)
- [ ] Sprint 054 retro (SPRINT-054-RETRO.md)
- [ ] Sprint 055 retro (SPRINT-055-RETRO.md)
- [ ] Sprint 056 retro (SPRINT-056-RETRO.md)
- [ ] Обновить PROJECT_STATUS.md (текущий спринт: 057)
- [ ] Обновить ROADMAP.md (Gantt chart)

#### B. GitHub Wiki / README обновление

**Задачи:**

- [ ] Обновить README.md (текущий фокус: Test Debt)
- [ ] Проверить все ссылки в docs/ (lychee check)
- [ ] Обновить CONTRIBUTING.md (branch rules, test requirements)

**Срок:** 2-3 дня (параллельно с Priority 2)

---

### Priority 4: Technical Debt Cleanup

#### A. Bundle optimization (follow-up)

**Текущее состояние:**

- Eager load: 508 KB gzip ✅
- Total bundle: 2.11 MB 🟡 (target: ≤1.8 MB)

**Действия:**

1. Пересмотреть границы `manualChunks` в `vite.config.ts`
2. Выявить oversized chunks
3. Применить более гранулярное разделение

**Ожидаемый результат:** 2.11 MB → ≤1.8 MB

**Срок:** 3-5 дней

#### B. E2E стабилизация

**Текущее состояние:** 48 specs, статус CI не подтверждён

**Действия:**

1. Запустить полный E2E run в GitHub Actions
2. Починить падающие тесты
3. Добавить missing tests для critical paths

**Ожидаемый результат:** 48/48 passing в CI

**Срок:** 2-3 дня

---

## 📅 Timeline (2-3 недели)

```
Week 1 (July 6-12):
  Mon-Tue: Branch protection Phase 2 (Priority 1)
  Wed-Fri: God files decomposition (Priority 2A)

Week 2 (July 13-19):
  Mon-Wed: Unit tests for API/Service layers (Priority 2B)
  Thu-Fri: Vitest include fix + E2E stabilization (Priority 2C + 4B)

Week 3 (July 20-26):
  Mon-Tue: Documentation & retrospectives (Priority 3)
  Wed-Fri: Bundle optimization (Priority 4A)
```

---

## 🎯 Success Metrics

| Метрика           | Сейчас      | Цель на 2026-07-26 |
| ----------------- | ----------- | ------------------ |
| Unit tests        | 925 passing | 1100+ passing      |
| Files >800 LOC    | 9           | 0                  |
| Branch protection | Phase 1 ✅  | Phase 2 ✅         |
| Total bundle      | 2.11 MB     | ≤1.8 MB            |
| E2E tests         | 48 specs    | 48/48 passing CI   |
| Any usages        | 0/50        | 0/0 ✅             |

---

## 🚀 После завершения (Q3 2026)

### Следующие спринты (планируются):

- **Sprint 057** — Collaboration features (realtime sessions)
- **Sprint 058** — Marketplace MVP (beats / loops)
- **Sprint 059** — A/B testing framework
- **Sprint 060** — Multi-language UI (EN/RU start)

### Long-term goals (Q4 2026):

- Public Developer API
- Webhooks for generations
- Plugin SDK (lyrics tools)
- React Native mobile apps

---

## 🔄 Непрерывное улучшение

### Еженедельные ритуалы:

1. **Понедельник:** Plan review → приоритизация задач
2. **Среда:** Progress check → корректировка плана
3. **Пятница:** Retro + metrics update

### Метрики для мониторинга:

- Unit test coverage (%)
- Bundle size (gzip)
- CI pass rate (%)
- Average PR merge time
- Sentry error rate

---

## 📝 Notes

- **Sprint 052-056 завершены** — отличная работа по стабилизации Suno API и UX
- **Test coverage выросло** — 292 → 925 unit tests за Sprint 051
- **Suno API coverage 100%** — 28/28 категорий реализовано
- **Type safety завершена** — 0/50 `any` budget
- **Layer compliance 100%** — 0 violations в components/stores

---

**Последнее обновление:** 2026-07-06  
**Ответственный:** Claude Code Agent  
**Next review:** 2026-07-13
