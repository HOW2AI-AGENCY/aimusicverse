# 📋 План закрытия всех открытых спринтов и задач (Q3-Q4 2026)

**Дата:** 2026-07-01
**Статус:** 🆕 Plan (закрытие бэклога)
**Контекст:** Аудит 2026-07-01 (score 6.7/10) выявил системный технический долг. Цель — довести оценку до 8.5/10 и закрыть все открытые спринты/задачи до конца 2026-Q4.

---

## 📊 Сводный статус открытых работ

| Категория                   | Задач   | SP       | Статус        |
| --------------------------- | ------- | -------- | ------------- |
| 🟡 Активные спринты         | 3       | ~36      | в работе      |
| ⚪ Запланированные спринты  | 6       | ~108     | ожидают       |
| ⚪ Phase 9 / 10C            | 5       | ~30      | запланированы |
| ⚪ E011 Product Development | ~14     | ~30      | Q3-Q4 2026    |
| ⚪ E008 Phase 9             | 4       | ~16      | частично      |
| **ИТОГО**                   | **~32** | **~220** |               |

**Оценка ресурсов:** ~44 рабочих дня = ~8-9 недель = ~2 месяца чистой разработки.

---

## 🎯 План по неделям (12 недель)

### Неделя 1 (2026-07-01 → 2026-07-07) — Sprint 042 завершение

**Цель:** закрыть Audio Pooling regression и большие god-файлы.

| День  | Задача                                                                                                              | SP  |
| ----- | ------------------------------------------------------------------------------------------------------------------- | --- |
| Пн-Вт | 042-01: Декомпозиция LyricsStudio.tsx (999 → <400 LOC, извлечь JSX-блоки в `lyrics-studio/`)                        | 3   |
| Ср-Чт | 042-03: Декомпозиция usePromptDJEnhanced.ts (882 → <500 LOC, custom hooks для generation + playback)                | 2   |
| Пт    | 042-04: Миграция 3-4 компонентов на usePreviewAudio (CloudAudioPicker LyricsView, SectionPreviewPlayer, TrimDialog) | 1   |
| Сб    | 042-06 + 042-07: smoke E2E + bundle report                                                                          | 1   |

**DoD недели:** LyricsStudio < 400 LOC, usePromptDJEnhanced < 500 LOC, ≥13/28 миграций, все sub-tasks ✅ в SPRINT-042-043-PLAN.

---

### Неделя 2 (2026-07-08 → 2026-07-14) — Sprint 043 Layer Compliance

**Цель:** устранить 72 layer violation (Supabase в компонентах).

| День  | Задача                                                                                   | SP  |
| ----- | ---------------------------------------------------------------------------------------- | --- |
| Пн-Вт | 043-01 + 043-02: Cleanup pass #2 (studio + lyrics-workspace + generate-form, ~30 файлов) | 3   |
| Ср-Чт | 043-03: Cleanup pass #2 (admin + telegram + остальное, ~42 файла)                        | 4   |
| Пт    | 043-04: ESLint rule `no-restricted-imports` для блокировки supabase в `components/`      | 1   |

**DoD недели:** `grep -rln "@/integrations/supabase" src/components/` = 0 (admin — исключение), ESLint rule активна в CI.

---

### Неделя 3 (2026-07-15 → 2026-07-21) — Sprint 043 Mobile Touch + 044 start

**Цель:** мобильная touch-target compliance + старт Type Safety.

| День  | Задача                                                                       | SP  |
| ----- | ---------------------------------------------------------------------------- | --- |
| Пн-Ср | 043-05: Touch-target ESLint rule + миграция 391 кнопок `h-7/h-8/h-6` → ≥44px | 3   |
| Чт    | 043-06: Playwright mobile smoke (Pixel 5 + iPhone 12)                        | 2   |
| Пт    | 044-01: `Result<T,E>` в `src/lib/result.ts` + 5 unit-тестов                  | 1   |

**DoD недели:** Touch targets ≥44px для всех кнопок, `Result<T,E>` тип готов с unit-тестами.

---

### Неделя 4 (2026-07-22 → 2026-07-28) — Sprint 044 Type Safety Wave 2

**Цель:** снизить `any` с 449 до <50.

| День  | Задача                                                 | SP  |
| ----- | ------------------------------------------------------ | --- |
| Пн-Вт | 044-02: `any` в `src/hooks/**` (180) → <20             | 4   |
| Ср    | 044-03: `any` в `src/stores/**` (80) → <10             | 2   |
| Чт    | 044-04: `any` в `src/pages/**` (90) → <10              | 2   |
| Пт    | 044-05: `any` в `src/components/**` остатки (90) → <10 | 2   |

**DoD недели:** `grep -rEn ": any|<any>|as any" src/ | wc -l` < 50, tsc зелёный.

---

### Неделя 5 (2026-07-29 → 2026-08-04) — Sprint 044 + 045 + Phase 10C

**Цель:** финализировать type safety, начать E2E тесты.

| День | Задача                                                                                       | SP  |
| ---- | -------------------------------------------------------------------------------------------- | --- |
| Пн   | 044-06: Конвертация VoiceCloneService, AudioAnalysisService, ReferenceManager на Result<T,E> | 2   |
| Вт   | 044-07: `@typescript-eslint/no-explicit-any: error` + whitelist <50                          | 1   |
| Ср   | 045-01: `structuredClone()` cleanup (если остались места)                                    | 1   |
| Чт   | 045-02 + 045-03: Удаление `@ts-nocheck` (11 файлов) + console.log cleanup (16 файлов)        | 3   |
| Пт   | Phase 10C старт: Playwright E2E тесты (ключевые сценарии: generation, navigation, плеер)     | 3   |

**DoD недели:** Sprint 044 завершён (`any` <50), Sprint 045 частично, 1-2 E2E теста зелёные.

---

### Неделя 6 (2026-08-05 → 2026-08-11) — Sprint 045 + 040 Фаза A

**Цель:** документация + старт unit-тестов API.

| День  | Задача                                                                     | SP  |
| ----- | -------------------------------------------------------------------------- | --- |
| Пн    | 045-04: `localStorage` namespace manager (`src/lib/storage/namespaces.ts`) | 2   |
| Вт    | 045-05 + 045-06: Обновить CLAUDE.md + ADR-0005/0006                        | 2   |
| Ср    | 040-01: Unit-тесты для `tracks.api.ts` + `generation.api.ts` (критические) | 5   |
| Чт-Пт | 040-02: Unit-тесты для оставшегося API (18 файлов)                         | 4   |

**DoD недели:** Sprint 045 завершён. Sprint 040 Фаза A: 25 → 60+ тестовых файлов.

---

### Неделя 7 (2026-08-12 → 2026-08-18) — Sprint 040 Фаза B (Audio Export)

**Цель:** реализовать WAV/MP3/FLAC экспорт.

| День  | Задача                                                                | SP  |
| ----- | --------------------------------------------------------------------- | --- |
| Пн-Ср | 040-06: ExportService (Edge Function audio-export + Frontend service) | 5   |
| Чт    | 040-07: ExportDialog UI компонент                                     | 3   |
| Пт    | 040-08: Интеграция в TrackActions menu                                | 2   |

**DoD недели:** Экспорт в WAV работает end-to-end для любого трека.

---

### Неделя 8 (2026-08-19 → 2026-08-25) — Sprint 040 Фаза B + C

**Цель:** завершить экспорт + Service Worker.

| День  | Задача                                                            | SP  |
| ----- | ----------------------------------------------------------------- | --- |
| Пн    | 040-09: Progress tracking + notifications для экспорта            | 2   |
| Вт    | 040-10: Unit + E2E тесты для экспорта                             | 1   |
| Ср-Чт | 040-11: Service Worker (Workbox, cache-first для статики + аудио) | 4   |
| Пт    | 040-12: Lighthouse CI budget enforcement                          | 2   |

**DoD недели:** Экспорт в MP3/FLAC работает. Service Worker регистрируется. Lighthouse CI активен.

---

### Неделя 9 (2026-08-26 → 2026-09-01) — Sprint 040 Фаза C + 041 UX Features

**Цель:** завершить инфраструктуру и начать UX features.

| День | Задача                                                              | SP  |
| ---- | ------------------------------------------------------------------- | --- |
| Пн   | 040-13: `structuredClone()` cleanup в оставшихся местах (если есть) | 1   |
| Вт   | 040-14: Единый QueryClient defaults (`staleTime`/`gcTime`)          | 1   |
| Ср   | 040-15: Финальный аудит Sprint 040                                  | 4   |
| Чт   | 041-01: IdeaStep AI suggestions (Lovable AI Gateway)                | 3   |
| Пт   | 041-02: LyricsStep генерация текста (continuation)                  | 3   |

**DoD недели:** Sprint 040 завершён. Sprint 041 стартовал.

---

### Неделя 10 (2026-09-02 → 2026-09-08) — Sprint 041 + Phase 9

**Цель:** завершить UX features + добить Phase 9.

| День  | Задача                                                        | SP  |
| ----- | ------------------------------------------------------------- | --- |
| Пн    | 041-03: LyricsView TTS через AI Gateway                       | 2   |
| Вт    | 041-04: useStudioAudioEngine (loop / export WAV / recording)  | 5   |
| Ср-Чт | 041-05: Documentation + onboarding tour (4 тултипа)           | 1   |
| Пт    | Phase 9B: Split Giant Files (33 файла >500 LOC → каждый <300) | 4   |

**DoD недели:** Sprint 041 завершён. Phase 9B 50% (LyricsParser, errorHandling уже на очереди).

---

### Неделя 11 (2026-09-09 → 2026-09-15) — Phase 9 + 039 finalization

**Цель:** закрыть старые Phase 9 + Sprint 039.

| День  | Задача                                                                       | SP  |
| ----- | ---------------------------------------------------------------------------- | --- |
| Пн-Вт | Phase 9B: продолжение (LyricsParser 903, errorHandling 827, StudioShell 720) | 6   |
| Ср    | Phase 9C: Lyrics Consolidation (30+ lyrics-компонентов из 6 директорий)      | 4   |
| Чт    | Phase 9D: Reorganize components/ui (90+ файлов)                              | 4   |
| Пт    | Sprint 039 final: 615 any → <50 (если не закрыт в Sprint 044), E2E CI        | 3   |

**DoD недели:** Phase 9B/C/D завершены. Sprint 039 закрыт.

---

### Неделя 12 (2026-09-16 → 2026-09-22) — Phase 9E + финальный аудит

**Цель:** закрыть Phase 9 и провести финальную верификацию.

| День | Задача                                                             | SP  |
| ---- | ------------------------------------------------------------------ | --- |
| Пн   | Phase 9E: Final Verification (tsc, build, size, tests)             | 2   |
| Вт   | Финальный архитектурный аудит (аналог 01.07.2026)                  | 2   |
| Ср   | Обновление всех документов (README, SPRINT-PROGRESS, ROADMAP, ADR) | 1   |
| Чт   | Подготовка к E011 Product Development спринтам                     | 1   |
| Пт   | Sprint review и retrospective                                      | 1   |

**DoD недели:** Phase 9 ✅. Score ≥ 8.5/10. Все открытые спринты закрыты (кроме E011).

---

## 📊 Целевые метрики после плана

| Метрика                           | Сейчас (01.07) | После плана      |
| --------------------------------- | -------------- | ---------------- |
| Общая оценка архитектуры          | **6.7/10**     | **8.5+/10**      |
| `any` в `src/`                    | 449            | **<50**          |
| Файлов > 500 LOC                  | 81             | **<15**          |
| Файлов > 800 LOC                  | 9              | **0**            |
| `@ts-nocheck` blanket suppression | 15             | **0**            |
| `console.log` (запрещены)         | 0              | **0** ✅         |
| `JSON.parse(JSON.stringify())`    | 0              | **0** ✅         |
| `new Audio()` вне пула            | 18             | **0**            |
| Компоненты импортируют supabase   | 72             | **0** (admin OK) |
| Touch targets < 44px              | 391            | **<20**          |
| Unit-тест файлов                  | 25             | **100+**         |
| E2E тесты зелёные                 | 0%             | **≥80%**         |
| Phase 9                           | 1/5 спринтов   | **5/5 ✅**       |
| Phase 10                          | 2/3 фаз        | **3/3 ✅**       |

---

## 🎯 Стратегия выполнения

### Параллельные треки (для нескольких разработчиков)

Если команда ≥3 человек, можно вести параллельно:

- **Трек A** (Frontend Lead): Sprint 042 (LyricsStudio decomposition + remaining migrations)
- **Трек B** (Backend/Types Lead): Sprint 043 (Layer cleanup) + 044 (Type Safety)
- **Трек C** (QA/Tools Lead): Sprint 040 (Tests) + Phase 10C (E2E)

### Приоритеты при ограниченном времени

**Tier 1 (MUST):** Sprint 042 завершение → Sprint 043 → Sprint 044 (технический долг)

**Tier 2 (HIGH):** Sprint 045 → Phase 9B/C/D (god-files) → Sprint 040 Фаза A (tests)

**Tier 3 (MEDIUM):** Sprint 040 Фаза B/C (export + SW) → Sprint 041 (UX features)

**Tier 4 (NICE):** Phase 9E + финальный аудит + Sprint 039 closure

---

## 📚 Связанные документы

- [SPRINT-PROGRESS.md](./SPRINT-PROGRESS.md) — текущий статус
- [SPRINT-042-043-PLAN.md](./SPRINT-042-043-PLAN.md) — Sprint 042-045 детальный план
- [SPRINT-040-PLAN.md](./SPRINT-040-PLAN.md) — Tests + Export
- [SPRINT-040-TYPE-SAFETY-PLAN.md](./SPRINT-040-TYPE-SAFETY-PLAN.md) — Type Safety
- [SPRINT-041-PLAN.md](./SPRINT-041-PLAN.md) — UX Features
- [BACKLOG.md](./BACKLOG.md) — полный бэклог
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) — общий статус

---

<sub>Создано: 2026-07-01 · Статус: 🆕 Закрытие бэклога · Целевая оценка: 8.5+/10</sub>
