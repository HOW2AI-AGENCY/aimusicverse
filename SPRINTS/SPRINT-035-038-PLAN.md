# План спринтов 035–038 (Q3–Q4 2026)

**Дата составления:** 2026-06-28
**Обновлено:** 2026-06-28 (после всестороннего архитектурного аудита)
**Основа:** Архитектурный аудит (3 параллельных агента) + результаты спринтов 033–034
**Статус:** Утверждён v2

---

## Текущее состояние проекта (после архитектурного аудита)

| Метрика                    | Значение         | Цель      | Статус |
| -------------------------- | ---------------- | --------- | ------ |
| Спринт                     | 034 завершён     | —         | ✅     |
| Общий прогресс             | 93%              | 96%+      | 🔄     |
| Компоненты                 | 987              | —         | ✅     |
| Хуки                       | 347 (64K строк)  | —         | ✅     |
| Zustand Stores             | 12 + 8 sub       | —         | ✅     |
| API-файлов                 | 20 (5578 строк)  | —         | ✅     |
| Сервисов                   | 18 (~8200 строк) | —         | ✅     |
| Edge Functions             | 120              | —         | ✅     |
| Бандл (gzip)               | 918 КБ           | ≤950 КБ   | ✅     |
| Unit-тест файлов           | **7**            | 200+      | ❌     |
| E2E-спецификации           | 47               | 47 pass   | ❌     |
| Файлов >500 строк          | **33**           | <5        | ❌     |
| Использований `any`        | **342**          | <50       | ❌     |
| Дубликатов кода            | **6 пар**        | 0         | ❌     |
| Нарушений слоёв (Supabase) | **30+**          | 0         | ❌     |
| `rules-of-hooks`           | `"warn"`         | `"error"` | ❌     |
| DnD-библиотек              | 2                | 1         | ❌     |

### Выявленные проблемы (приоритет) — обновлено по результатам аудита

| Приоритет   | Проблема                                                     | Спринт |
| ----------- | ------------------------------------------------------------ | ------ |
| 🔴 Critical | 7 unit-тестов на 940+ компонентов (покрытие <1%)             | 037    |
| 🔴 Critical | 30+ компонентов вызывают `supabase.from()` напрямую          | 036    |
| 🔴 Critical | God-хуки: useGenerateForm (1218), usePromptDJEnhanced (1070) | 036    |
| 🔴 Critical | `react-hooks/rules-of-hooks: "warn"` — runtime-краши         | 035    |
| 🟠 High     | 6 пар дублированного кода (-1700 строк)                      | 035    |
| 🟠 High     | 342 использования `any` при strict mode                      | 036    |
| 🟠 High     | Нет query key factory для TanStack Query                     | 035    |
| 🟠 High     | Незащищённые payment-маршруты                                | 035    |
| 🟠 High     | PlaybackStore дублирован в 3 файлах                          | 035    |
| 🟡 Medium   | 2 DnD-библиотеки одновременно (-50KB бандла)                 | 037    |
| 🟡 Medium   | Несогласованные staleTime/gcTime в TanStack Query            | 038    |
| 🟡 Medium   | `JSON.parse/stringify` вместо `structuredClone()` (8 мест)   | 038    |
| 🟡 Medium   | Побочные эффекты (таймеры) в lyricsWizardStore               | 036    |
| 🟡 Medium   | Tailwind v3.4 + `@tailwindcss/postcss` v4.1.17 конфликт      | 038    |
| 🟢 Low      | Terser 3 passes (→ 2 для ускорения сборки)                   | 038    |

---

## Sprint 035: Стабилизация + Архитектурная чистка

**Период:** Неделя 1–2 (Q3 2026)
**Цель:** Устранить runtime-риски, удалить дубликаты, стабилизировать E2E
**Effort:** ~10 дней
**Статус:** ⏳ ЗАПЛАНИРОВАН

### Фаза 1: Критические runtime-фиксы (2 дня)

| #      | Задача                                      | Приоритет | Effort | Файлы                                                                                               |
| ------ | ------------------------------------------- | --------- | ------ | --------------------------------------------------------------------------------------------------- |
| 035-01 | ESLint: `rules-of-hooks` → `"error"`        | P0        | 0.5d   | `eslint.config.js:53`                                                                               |
| 035-02 | Защитить payment-маршруты ProtectedRoute    | P0        | 0.5d   | `src/App.tsx` (маршруты `/payment`, `/payment/buy`)                                                 |
| 035-03 | Консолидировать PlaybackStore (3 файла → 1) | P0        | 1d     | `stores/usePlaybackStore.ts`, `stores/studio/usePlaybackStore.ts`, `stores/slices/playbackSlice.ts` |

### Фаза 2: Удаление дубликатов (-1700 строк) (3 дня)

| #      | Задача                                              | Приоритет | Effort | Файлы                                                                           |
| ------ | --------------------------------------------------- | --------- | ------ | ------------------------------------------------------------------------------- |
| 035-04 | Удалить дубль `useMixExport` (381 + 396 строк)      | P0        | 0.5d   | `hooks/useMixExport.ts` + `hooks/studio/useMixExport.ts`                        |
| 035-05 | Удалить дубль `useOptimizedAudioPlayer` (395 + 325) | P0        | 0.5d   | `hooks/useOptimizedAudioPlayer.tsx` + `hooks/audio/useOptimizedAudioPlayer.tsx` |
| 035-06 | Консолидировать PromptDJ (3 файла: 374+1070+287)    | P1        | 1d     | `usePromptDJ.ts`, `usePromptDJEnhanced.ts`, `usePromptDJStore.ts`               |
| 035-07 | Создать query key factory `src/lib/queryKeys.ts`    | P1        | 1d     | Новый файл + рефакторинг хуков с TanStack Query                                 |

### Фаза 3: E2E стабилизация (3 дня)

| #      | Задача                                           | Приоритет | Effort | Файлы                                                                 |
| ------ | ------------------------------------------------ | --------- | ------ | --------------------------------------------------------------------- |
| 035-08 | Починить smoke test (app boot, basic navigation) | P0        | 0.5d   | `tests/e2e/smoke.app-boots.spec.ts`                                   |
| 035-09 | Починить Playwright CI pipeline                  | P0        | 1d     | `.github/workflows/ci.yml`, `playwright.config.ts`                    |
| 035-10 | Починить homepage + navigation + library тесты   | P1        | 1d     | `tests/e2e/homepage.spec.ts`, `navigation.spec.ts`, `library.spec.ts` |
| 035-11 | Починить player + generation тесты               | P1        | 0.5d   | `tests/e2e/player.*.spec.ts`, `generation.*.spec.ts`                  |

### Фаза 4: Быстрые фиксы (2 дня)

| #      | Задача                                               | Приоритет | Effort | Файлы                                            |
| ------ | ---------------------------------------------------- | --------- | ------ | ------------------------------------------------ |
| 035-12 | Верифицировать размер бандла в CI                    | P0        | 0.5d   | `.github/workflows/ci.yml`                       |
| 035-13 | Выбрать одну DnD-библиотеку, удалить вторую          | P2        | 1d     | `package.json`, компоненты с `@hello-pangea/dnd` |
| 035-14 | Удалить мёртвый `react-redux` из chunks конфигурации | P3        | 0.5d   | `vite.config.ts:163`                             |

### Критерии успеха Sprint 035

- [ ] `react-hooks/rules-of-hooks: "error"` — никаких runtime-крашей из-за нарушений хуков
- [ ] 0 дубликатов хуков (6 пар → 0)
- [ ] PlaybackStore — единственный источник правды
- [ ] Query key factory используется во всех TanStack Query хуках
- [ ] Payment-маршруты защищены ProtectedRoute
- [ ] ≥20 E2E тестов проходят стабильно в CI
- [ ] `npm run build` + `npm run size` проходят в CI

---

## Sprint 036: Рефакторинг слоёв + Type Safety

**Период:** Неделя 3–4 (Q3 2026)
**Цель:** Восстановить архитектурные слои, разбить god-хуки, типизировать API
**Effort:** ~10 дней
**Статус:** ⏳ ЗАПЛАНИРОВАН

### Фаза 1: Восстановление архитектурных слоёв (5 дней)

| #      | Задача                                                           | Приоритет | Effort | Файлы                                                                                                                                                                        |
| ------ | ---------------------------------------------------------------- | --------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 036-01 | Вынести прямые Supabase-вызовы из компонентов (30+ мест)         | P0        | 3d     | `UnifiedVersionSelector.tsx`, `EditableTrackTitle.tsx`, `GlobalGenerationIndicator.tsx`, `GenerationResultSheet.tsx`, `AudioActionDialog.tsx`, `ExtendTrackDialog.tsx` и др. |
| 036-02 | Создать `payments.api.ts` (Stars + Tinkoff)                      | P0        | 0.5d   | `src/api/payments.api.ts` (новый)                                                                                                                                            |
| 036-03 | Создать `notifications.api.ts`                                   | P1        | 0.5d   | `src/api/notifications.api.ts` (новый)                                                                                                                                       |
| 036-04 | Создать `voice.api.ts` (расширить voice-clone.api.ts)            | P1        | 0.5d   | `src/api/voice.api.ts`                                                                                                                                                       |
| 036-05 | Generic undo/redo middleware для Zustand (заменить 3 реализации) | P2        | 0.5d   | `src/stores/middleware/undoRedo.ts` (новый), рефакторинг 3 сторов                                                                                                            |

### Фаза 2: Разбить god-хуки и oversized-компоненты (3 дня)

| #      | Задача                                                                                                                                                                   | Приоритет | Effort | Целевой файл (строк)                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------ | ----------------------------------------- |
| 036-06 | Разбить `useGenerateForm.ts` (1218) → useGenerateValidation, useGenerateSubmit, useGenerateDraft, useGenerateState                                                       | P0        | 1d     | `src/hooks/generation/useGenerateForm.ts` |
| 036-07 | Разбить `GlobalAudioProvider.tsx` (982) → hooks/state/queue                                                                                                              | P0        | 1d     | `src/components/GlobalAudioProvider.tsx`  |
| 036-08 | Разбить 6 oversized-компонентов (>800 строк): SectionNotesPanel, IntegratedStemTracks, MobileFullscreenPlayer, AudioActionDialog, LyricsVisualEditor, UnifiedNotesViewer | P1        | 1d     | См. файлы в секции 1.1 аудита             |

### Фаза 3: Type Safety (2 дня)

| #      | Задача                                                         | Приоритет | Effort | Файлы                                     |
| ------ | -------------------------------------------------------------- | --------- | ------ | ----------------------------------------- |
| 036-09 | Типизировать `analysis.api.ts` (8+ полей `any`: beats, chords) | P0        | 0.5d   | `src/api/analysis.api.ts`                 |
| 036-10 | Типизировать `voice-clone.api.ts` (убрать `invoke<T = any>`)   | P0        | 0.5d   | `src/api/voice-clone.api.ts`              |
| 036-11 | Типизировать `lyrics.api.ts` (убрать `as any` касты)           | P1        | 0.5d   | `src/api/lyrics.api.ts`                   |
| 036-12 | Убрать побочные эффекты (таймеры) из lyricsWizardStore         | P2        | 0.5d   | `src/stores/lyricsWizardStore.ts:178-183` |

### Критерии успеха Sprint 036

- [ ] 0 компонентов с прямым вызовом `supabase.from()`
- [ ] Все домены имеют `*.api.ts` файл (payments, notifications, voice)
- [ ] 0 файлов >1000 строк (god-хуки разбиты)
- [ ] `any` использований: <100 (с 342)
- [ ] TypeScript компиляция без ошибок после рефакторинга
- [ ] Undo/redo — единый middleware, 3 стора используют его

---

## Sprint 037: Тестовое покрытие + Export

**Период:** Неделя 5–6 (Q3 2026)
**Цель:** Покрыть тестами критическую бизнес-логику, добавить экспорт аудио
**Effort:** ~10 дней
**Статус:** ⏳ ЗАПЛАНИРОВАН

### Фаза 1: Unit-тесты API и сервисов (4 дня)

| #      | Задача                                                                      | Приоритет | Effort | Файлы                            |
| ------ | --------------------------------------------------------------------------- | --------- | ------ | -------------------------------- |
| 037-01 | Тесты для 20 API-файлов (tracks, credits, generation, analysis и др.)       | P0        | 1.5d   | `tests/unit/api/`                |
| 037-02 | Тесты для 18 сервисов (credits, payment, tracks, studio и др.)              | P0        | 1.5d   | `tests/unit/services/`           |
| 037-03 | Тесты для audio utilities (audioElementPool, audioCache, waveformGenerator) | P0        | 0.5d   | `tests/unit/lib/audio/`          |
| 037-04 | Тесты для economy.ts (кредиты, курсы, стоимости операций)                   | P0        | 0.5d   | `tests/unit/lib/economy.test.ts` |

### Фаза 2: Тесты для рефакторенных хуков (3 дня)

| #      | Задача                                                          | Приоритет | Effort | Файлы                                           |
| ------ | --------------------------------------------------------------- | --------- | ------ | ----------------------------------------------- |
| 037-05 | Тесты для generation hooks (после рефакторинга в Sprint 036)    | P0        | 1d     | `tests/unit/hooks/generation/`                  |
| 037-06 | Тесты для player store + audio hooks                            | P0        | 1d     | `tests/unit/stores/`, `tests/unit/hooks/audio/` |
| 037-07 | Property-based тесты для критических трансформаций (fast-check) | P2        | 1d     | `tests/unit/property/`                          |

### Фаза 3: Export + Error handling (3 дня)

| #      | Задача                                                | Приоритет | Effort | Файлы                                                                |
| ------ | ----------------------------------------------------- | --------- | ------ | -------------------------------------------------------------------- |
| 037-08 | Универсальный export service (WAV/MP3/FLAC)           | P0        | 1d     | `src/services/export.service.ts`, `supabase/functions/audio-export/` |
| 037-09 | UI экспорта (формат, качество, метаданные)            | P1        | 1d     | `src/components/export/ExportDialog.tsx`                             |
| 037-10 | Унифицировать обработку ошибок в API (Result-паттерн) | P1        | 1d     | `src/api/*.api.ts` (20 файлов)                                       |

### Критерии успеха Sprint 037

- [ ] Unit-тестов: 50+ файлов (с 7)
- [ ] Покрытие API-слоя и сервисов: ≥60%
- [ ] Export WAV/MP3 работает для любого трека
- [ ] Единый паттерн обработки ошибок в API-слое

---

## Sprint 038: DX + Оптимизация + Мониторинг

**Период:** Неделя 7–8 (Q4 2026)
**Цель:** Оптимизация производительности, мониторинг, Storybook, cleanup
**Effort:** ~10 дней
**Статус:** ⏳ ЗАПЛАНИРОВАН

### Фаза 1: Оптимизация и cleanup (3 дня)

| #      | Задача                                                            | Приоритет | Effort | Файлы                                                 |
| ------ | ----------------------------------------------------------------- | --------- | ------ | ----------------------------------------------------- |
| 038-01 | `structuredClone()` вместо `JSON.parse/stringify` (8 мест)        | P2        | 0.5d   | `useMixerHistoryStore.ts`, `useLyricsHistoryStore.ts` |
| 038-02 | Согласовать staleTime/gcTime defaults через QueryClient           | P2        | 0.5d   | `src/App.tsx` (QueryClient config)                    |
| 038-03 | Разрешить конфликт Tailwind v3.4 + `@tailwindcss/postcss` v4.1.17 | P2        | 0.5d   | `package.json`, `postcss.config.*`                    |
| 038-04 | Terser: 3 passes → 2 (ускорение сборки ~15%)                      | P3        | 0.5d   | `vite.config.ts:94-141`                               |
| 038-05 | Удалить неиспользуемые зависимости + устаревшие конфиги           | P2        | 0.5d   | `package.json`, корень проекта                        |

### Фаза 2: Мониторинг и observability (4 дня)

| #      | Задача                                               | Приоритет | Effort | Файлы                              |
| ------ | ---------------------------------------------------- | --------- | ------ | ---------------------------------- |
| 038-06 | Sentry Performance monitoring (transactions, traces) | P0        | 1.5d   | `src/lib/sentry.ts`, `src/App.tsx` |
| 038-07 | Telegram Mini App cold start оптимизация             | P1        | 1d     | `src/main.tsx`, `index.html`       |
| 038-08 | Lighthouse perf budget enforcement в CI              | P1        | 1d     | `.github/workflows/lighthouse.yml` |
| 038-09 | Service Worker + оффлайн (cache-first для статики)   | P2        | 0.5d   | `src/sw.ts`, `vite.config.ts`      |

### Фаза 3: Storybook + Документация (3 дня)

| #      | Задача                                          | Приоритет | Effort | Файлы                                               |
| ------ | ----------------------------------------------- | --------- | ------ | --------------------------------------------------- |
| 038-10 | Storybook stories для 20+ shared/ui компонентов | P1        | 1.5d   | `src/components/ui/*.stories.*`                     |
| 038-11 | Верификация и обновление ARCHITECTURE_HUB.md    | P1        | 0.5d   | `ARCHITECTURE_HUB.md`                               |
| 038-12 | WCAG AA полный проход для Library + Studio      | P2        | 0.5d   | `src/components/library/`, `src/components/studio/` |
| 038-13 | a11y regression тесты (axe-core в CI)           | P2        | 0.5d   | `.github/workflows/a11y.yml`                        |

### Критерии успеха Sprint 038

- [ ] 0 мест с `JSON.parse(JSON.stringify)` для deep clone
- [ ] Единый staleTime/gcTime default в QueryClient
- [ ] Sentry Performance транзакции активны
- [ ] Lighthouse CI проходит на каждый PR (perf ≥90)
- [ ] 20+ Storybook stories
- [ ] Cold start <3s на среднем устройстве

---

## Сводная таблица

| Спринт | Фокус                         | Задач | Effort | Ключевая метрика                        |
| ------ | ----------------------------- | ----- | ------ | --------------------------------------- |
| 035    | Стабилизация + чистка         | 14    | 10д    | 0 дубликатов, rules-of-hooks error, E2E |
| 036    | Слои + god-хуки + Type Safety | 12    | 10д    | 0 прямых Supabase, `any` <100           |
| 037    | Тесты + Export                | 10    | 10д    | 50+ тестов, export WAV/MP3              |
| 038    | DX + Мониторинг + Оптимизация | 13    | 10д    | Sentry Perf, Storybook 20+, Lighthouse  |

## Зависимости между спринтами

```
Sprint 035 (Стабилизация)
  ├── 035-03 PlaybackStore ──→ Sprint 037-06 (тесты player store)
  ├── 035-06 PromptDJ consolidation ──→ Sprint 036 (не нужно разбивать)
  ├── 035-09 Playwright CI ──→ Sprint 036 (валидация рефакторинга)
  └── 035-12 build verification ──→ Sprint 038-08 (Lighthouse CI)

Sprint 036 (Рефакторинг)
  ├── 036-01 Supabase из компонентов ──→ Sprint 037-01 (тесты API)
  ├── 036-06 useGenerateForm split ──→ Sprint 037-05 (тесты generation)
  └── 036-07 GlobalAudioProvider split ──→ Sprint 037-06 (тесты player)

Sprint 037 (Тесты + Export)
  └── 037-10 Error handling ──→ Sprint 038 (мониторинг ошибок)

Sprint 038 (DX + Мониторинг)
  └── Финальная стабилизация перед Q4 features
```

## Ожидаемое состояние после Sprint 038

| Метрика              | Текущее  | После 038 | Улучшение   |
| -------------------- | -------- | --------- | ----------- |
| Unit-тестов (файлов) | **7**    | 50+       | +614%       |
| E2E pass rate        | 0%       | ≥80%      | +80%        |
| Файлов >1000 строк   | 2        | 0         | -100%       |
| Файлов >500 строк    | 33       | <10       | -70%        |
| Использований `any`  | 342      | <50       | -85%        |
| Дубликатов кода      | 6 пар    | 0         | -100%       |
| Нарушений слоёв      | 30+      | 0         | -100%       |
| `rules-of-hooks`     | `"warn"` | `"error"` | runtime fix |
| Query key factory    | нет      | есть      | type-safety |
| Общая оценка         | 6.1/10   | 8.4/10    | +38%        |

---

## Риски и митигации

| Риск                                    | Вероятность | Влияние | Митигация                                            |
| --------------------------------------- | ----------- | ------- | ---------------------------------------------------- |
| E2E тесты flaky из-за Suno API          | Высокая     | Средний | Мокать Suno API в тестах, тестировать UI flow        |
| Рефакторинг >1000 строк ломает features | Средняя     | Высокий | Сначала E2E тесты (035), потом рефакторинг (036)     |
| Strict TS сломает сборку                | Высокая     | Высокое | Инкрементальное включение по директориям             |
| Bundle size после SW > 950KB            | Низкая      | Средний | SW в отдельном entry point, не влияет на main bundle |
| Storybook конфликты с Vite 5            | Средняя     | Среднее | Проверить совместимость @storybook/react-vite        |

---

**Следующий обзор:** После завершения Sprint 035
**Ответственный:** Product Team
