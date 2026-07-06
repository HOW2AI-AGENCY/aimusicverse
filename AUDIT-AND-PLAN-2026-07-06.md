# Аудит прогресса и план работ — 06.07.2026

## I. Сводка аудита

### Здоровье кодовой базы

- **TypeScript:** компилируется чисто (1 ошибка в `lucide-react.d.ts` — сторонний пакет, не наш код)
- **Unit-тесты:** ~395 passing, цель 450+ (88%)
- **Bundle:** 508 KB gzip eager-load — значительно ниже лимита 950 KB
- **`any` в prod:** 0 нарушений (whitelist ~85 слотов для интероп-границ)
- **Файлов >1000 LOC:** 0 после декомпозиции Sprint 051
- **Файлов 700–837 LOC:** 6 штук (IntegratedStemTracks, LyricsVisualEditorCompact, errorHandling, UnifiedNotesViewer, LyricsVisualEditor, LyricsParser)
- **Known Issues:** 3 open (iOS Safari audio pool, Suno 429 rate-limits, Studio mobile stutter) + 2 watchlist

### Завершённые спринты (последние)

| Спринт        | Фокус                              | Статус                                     |
| ------------- | ---------------------------------- | ------------------------------------------ |
| 050           | Main Green + Mobile Audit F1–F12   | ✅ Phase A+B                               |
| 051 Phase A–C | Декомпозиция god-файлов            | ✅ studio.service 1137→4, studio.api 953→4 |
| 052           | Suno Mashup + Persona + Upload     | ✅ 10/10                                   |
| 053           | Suno SFX + MIDI + Boost            | ✅                                         |
| 054           | Suno Details Suite                 | ✅                                         |
| 055           | UX Critical Fixes (P0/P1)          | ✅ Phase A+B+C                             |
| 056 Phase A–B | GenerateSheet Redesign + Storybook | ✅                                         |

### Что в работе (открытые ветки)

- `test/sprint-051-*` — несколько тестовых веток для Sprint 051 (chord-data, color-tokens, date-utils, motion, accessibility)
- Sprint 051 T055: 395→450+ unit-тестов
- Sprint 056 Phase C–D: интеграция stories + документация

### Блокеры

1. **Sprint 050-A1:** E2E тесты не запускаются — отсутствует `@rollup/rollup-win32-x64-msvc`
2. **Sprint 050-A4 Phase 2:** Branch protection enforcement отключён
3. **npm test на Windows:** `NODE_OPTIONS=...` синтаксис не работает в PowerShell — нужен кросс-платформенный запуск

---

## II. План работ

### Приоритет 1: Закрыть Sprint 051 (Test Debt) — 2–3 дня

**Цель:** 395 → 450+ unit-тестов, 0 файлов >800 LOC

| Задача | Описание                                                                                                                                                            | Оценка  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| T055a  | Довести unit-тесты до 450+ (дозаписать тесты для API/Service слоёв)                                                                                                 | 1.5 дня |
| T055b  | Декомпозиция 6 оставшихся файлов 700–837 LOC (IntegratedStemTracks, errorHandling, UnifiedNotesViewer, LyricsVisualEditor, LyricsVisualEditorCompact, LyricsParser) | 1 день  |
| T056   | Верификация: 0 файлов >1000 LOC, все тесты зелёные                                                                                                                  | 0.5 дня |

### Приоритет 2: Закрыть Sprint 056 (GenerateSheet) — 1–2 дня

| Задача | Описание                                                                            | Оценка     |
| ------ | ----------------------------------------------------------------------------------- | ---------- |
| C1–C4  | Проверить stories в Storybook, responsive examples, a11y docs, interaction examples | 1 день     |
| D1–D4  | COMPONENTS.md, thin orchestrator pattern guide, migration guide, CHANGELOG          | 0.5–1 день |

### Приоритет 3: Разблокировать E2E и CI — 1 день

| Задача | Описание                                                          | Оценка  |
| ------ | ----------------------------------------------------------------- | ------- |
| 050-A1 | Восстановить `@rollup/rollup-win32-x64-msvc`, запустить E2E smoke | 0.5 дня |
| 050-A4 | Включить branch protection enforcement через GitHub API/UI        | 0.5 дня |
| CI fix | Исправить `npm test` для Windows (кросс-PLATFORM NODE_OPTIONS)    | 0.5 дня |

### Приоритет 4: Запланированные спринты (после закрытия текущих)

| Спринт      | Фокус                                                                                     | Приоритет |
| ----------- | ----------------------------------------------------------------------------------------- | --------- |
| Sprint 040  | Unit-тесты API/Service (20+18 файлов), Export WAV/MP3/FLAC, Service Worker, Lighthouse CI | Средний   |
| Sprint 057+ | Multi-language UI (EN/RU/ES/DE)                                                           | Q4 2026   |
| Sprint 058+ | Public Developer API, Webhooks                                                            | Q4 2026   |

### Приоритет 5: Техдолг и инфраструктура

- Миграция оставшихся legacy генераторов на `suno-music-generate`
- Full WCAG AA pass на Library + Studio
- Lighthouse perf budget enforcement в CI
- Wavesurfer 7.8 memory growth (watchlist)

---

## III. Рекомендации

1. **Сфокусироваться на закрытии Sprint 051 T055** — это последний крупный тестовый долг, блокирующий confidence для рефакторинга
2. **Разблокировать E2E (050-A1)** — без CI-green smoke тестов любые изменения рискованны
3. **Sprint 056 Phase C–D можно закрыть параллельно** — это документация, не код
4. **Не начинать Sprint 040** пока не закрыты 051 и 056 — слишком много WIP
5. **Исправить npm test для Windows** — текущий синтаксис `NODE_OPTIONS=... bash` не кросс-платформенный

---

## IV. Риски

| Риск                          | Вероятность | Влияние                               | Митигация                                   |
| ----------------------------- | ----------- | ------------------------------------- | ------------------------------------------- |
| E2E заблокирован из-за rollup | Высокое     | Блокирует CI                          | `npm install @rollup/rollup-win32-x64-msvc` |
| Тесты не проходят на Windows  | Среднее     | Блокирует локальную разработку        | Исправить scripts в package.json            |
| Sprint 051 T055 не закрыт     | Среднее     | Блокирует confidence для рефакторинга | Сфокусироваться на API/Service тестах       |
| Suno 429 rate-limits          | Низкое      | Degraded UX                           | Exponential backoff уже есть                |

---

_Создано: 2026-07-06, аудит-агент_
