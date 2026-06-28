# План спринтов 034–036 (Q3 2026)

**Дата составления:** 2026-06-28
**Статус:** Утверждён
**Автор:** Product Team + AI Analysis

---

## Текущее состояние проекта

| Метрика                 | Значение     | Цель     | Статус |
| ----------------------- | ------------ | -------- | ------ |
| Спринт                  | 033 завершён | —        | ✅     |
| Прогресс                | 92%          | 95%+     | 🔄     |
| Health Score            | 98/100       | ≥95      | ✅     |
| Компоненты              | 940+         | —        | ✅     |
| Бандл (gzip)            | 918 КБ       | ≤950 КБ  | ✅     |
| Unit-тесты              | 362          | 500+     | 🔄     |
| E2E-спецификации        | 50+          | 50+ pass | ❌     |
| Generation failure rate | ~12%         | <8%      | ❌     |
| DAU                     | ~25          | 50+      | ❌     |
| Пользователи            | 574+         | 1000+    | 🔄     |

### Открытые проблемы

1. iOS Safari — пул аудио-элементов подходит к 9/10 в длинных сессиях
2. Suno API — 429 rate-limits в пиковые часы
3. Studio mobile — рывки превью section replacement на бюджетных Android

### Что уже готово для Sprint 034

- `useAutomaticRetry` хук — **полностью реализован, но НЕ интегрирован** в flow генерации
- `useExperiment` хук — A/B framework с вариантами, экспозицией, конверсией — **готов, но не используется**
- `suno-error-mapper.ts` — 30+ кодов ошибок, `isRetryableError()`, `getRetryDelay()` с exp. backoff
- 16 хуков в `src/hooks/generation/` (useGenerateForm, useFailedGenerations, useAudioProcessing и др.)
- `generationAnalytics.trackStart/trackComplete/trackError` — аналитика уже подключена
- Sentry интеграция (`@sentry/react` v10.31, `src/lib/sentry.ts`) — активна
- Feature flags с `rollout_percentage` — основа для A/B
- `generation_tasks` таблица с `status`, `error_message`, `expected_clips`, `received_clips`
- Backend `MODEL_FALLBACK_CHAIN` — автоматическая ротация моделей на сервере

### Технический долг (входит в Sprint 036)

- Топ-файлы >800 строк: `GlobalAudioProvider.tsx` (982), `SectionNotesPanel.tsx` (882), `IntegratedStemTracks.tsx` (875), `UnifiedNotesViewer.tsx` (854), `MobileFullscreenPlayer.tsx` (837), `AudioActionDialog.tsx` (797)
- `useUnifiedStudioStore` — уже разбит до 29 строк (Phase 9A завершена)
- E2E тесты написаны (47 spec), но 0% проходят в CI
- Есть базовый `public/audio-sw.js` — но без Workbox и полноценного кэширования

---

## Sprint 034: Надёжность генерации

**Период:** Неделя 1–2 (Q3 2026)
**Цель:** Снижение failure rate с 12% → <8%, улучшение UX ошибок генерации
**Effort:** ~10 дней

### Фаза 1: Мониторинг и метрики (3 дня)

| #      | Задача                                                                             | Приоритет | Effort | Файлы                                                                  |
| ------ | ---------------------------------------------------------------------------------- | --------- | ------ | ---------------------------------------------------------------------- |
| 034-01 | ✅ Dashboard метрик генерации (success rate, avg time, errors by type)             | P0        | 1d     | `src/pages/admin/GenerationMetrics.tsx`, `src/App.tsx`                 |
| 034-02 | ✅ Sentry breadcrumbs для полного flow генерации                                   | P0        | 0.5d   | `src/hooks/generation/useGenerateForm.ts`, `src/lib/sentry.ts`         |
| 034-03 | Алерты при failure rate >10% (Edge Function + Telegram Bot notification)           | P1        | 0.5d   | `supabase/functions/generation-alert/`                                 |
| 034-04 | ✅ Логирование параметров провалившихся генераций (prompt, style, model, duration) | P0        | 1d     | `src/hooks/generation/useGenerateForm.ts`, `src/api/generation.api.ts` |

### Фаза 2: Интеграция retry/fallback (4 дня)

| #      | Задача                                                                                  | Приоритет | Effort | Файлы                                                                                          |
| ------ | --------------------------------------------------------------------------------------- | --------- | ------ | ---------------------------------------------------------------------------------------------- |
| 034-05 | ✅ **Интегрировать** `useAutomaticRetry` в `handleGenerate()` (хук готов, нужен wiring) | P0        | 0.5d   | `src/hooks/generation/useGenerateForm.ts:594-993`                                              |
| 034-06 | ✅ Добавить `abort_reason`, `retry_count`, `failure_category` в `generation_tasks`      | P0        | 0.5d   | `supabase/migrations/20260628120000_generation_failure_tracking.sql`                           |
| 034-07 | ✅ Prompt pre-validation (длина, запрещённые слова, кодировка) перед отправкой          | P0        | 1d     | `src/lib/prompt-validator.ts`, `src/hooks/generation/usePromptValidation.ts`                   |
| 034-08 | ✅ Expose backend `MODEL_FALLBACK_CHAIN` в UI — показать пользователю fallback          | P1        | 1d     | Already in `src/constants/sunoModels.ts` (validateModel + toast warning)                       |
| 034-09 | ✅ Очередь генераций с rate-limit awareness (UI показ позиции в очереди)                | P1        | 1d     | `src/hooks/generation/useGenerationQueue.ts`, `src/components/generate-form/QueuePosition.tsx` |

### Фаза 3: A/B тесты и анализ (3 дня)

| #      | Задача                                                                                   | Приоритет | Effort | Файлы                                                                |
| ------ | ---------------------------------------------------------------------------------------- | --------- | ------ | -------------------------------------------------------------------- |
| 034-10 | ✅ **Активировать** `useExperiment` (хук готов) — первый эксперимент: prompt suggestions | P1        | 0.5d   | `src/lib/ab-testing/index.ts` (PROMPT_SUGGESTIONS status=running)    |
| 034-11 | A/B тест: 2-step vs 4-step generation wizard                                             | P2        | 0.5d   | `src/components/generate-form/`                                      |
| 034-12 | ✅ Анализ failure patterns (корреляция style/mood/duration с ошибками) — RPC функция     | P1        | 1d     | `supabase/migrations/20260628120000_generation_failure_tracking.sql` |
| 034-13 | Delivery tracking: мониторинг получения обоих clip-ов (A/B версии)                       | P2        | 1d     | `supabase/functions/suno-music-callback/`                            |

### Критерии успеха Sprint 034

- [ ] Generation failure rate: <8% (с 12%) — infrastructure ready, measuring
- [ ] Error recovery rate: >65% (с ~40%) — auto-retry integrated
- [x] Dashboard метрик генерации работает
- [ ] Алерты настроены и уведомляют в Telegram (034-03 pending)
- [x] A/B framework запущен с ≥1 экспериментом (PROMPT_SUGGESTIONS)

---

## Sprint 035: E2E тесты и интеграции

**Период:** Неделя 3–4 (Q3 2026)
**Цель:** Зелёный CI с E2E тестами + начало платформенных экспортов
**Effort:** ~10 дней

> **Примечание:** Изначально планировался как "Platform Integrations", но анализ показал, что 50+ E2E спецификаций написаны, но не проходят. Стабилизация E2E — приоритет, экспорт — secondary.

### Фаза 1: E2E стабилизация (5 дней)

| #      | Задача                                                  | Приоритет | Effort | Файлы                                                                                             |
| ------ | ------------------------------------------------------- | --------- | ------ | ------------------------------------------------------------------------------------------------- |
| 035-01 | Починить smoke test (app boot, basic navigation)        | P0        | 0.5d   | `tests/e2e/smoke.app-boots.spec.ts`                                                               |
| 035-02 | Починить homepage + navigation тесты                    | P0        | 1d     | `tests/e2e/homepage.spec.ts`, `tests/e2e/navigation.spec.ts`, `tests/e2e/home.navigation.spec.ts` |
| 035-03 | Починить player тесты (compact, fullscreen, a11y)       | P0        | 1d     | `tests/e2e/player.*.spec.ts`                                                                      |
| 035-04 | Починить library тесты                                  | P1        | 0.5d   | `tests/e2e/library.spec.ts`                                                                       |
| 035-05 | Починить generation тесты (dialog, mobile taps, portal) | P1        | 1d     | `tests/e2e/generation.*.spec.ts`                                                                  |
| 035-06 | Настроить Playwright CI pipeline (GitHub Actions)       | P0        | 1d     | `.github/workflows/e2e.yml`, `playwright.config.ts`                                               |

### Фаза 2: Платформенные экспорты (5 дней)

| #      | Задача                                                         | Приоритет | Effort | Файлы                                                                   |
| ------ | -------------------------------------------------------------- | --------- | ------ | ----------------------------------------------------------------------- |
| 035-07 | Универсальный export service (скачивание WAV/MP3/FLAC)         | P0        | 1d     | `src/services/export.service.ts`, `supabase/functions/audio-export/`    |
| 035-08 | UI экспорта (формат, качество, метаданные)                     | P1        | 1d     | `src/components/export/ExportDialog.tsx`, `src/hooks/useAudioExport.ts` |
| 035-09 | Spotify-ready metadata (ID3 tags, cover art, ISRC placeholder) | P2        | 1d     | `supabase/functions/audio-metadata/`                                    |
| 035-10 | YouTube-ready export (аудио + обложка → видео через FFmpeg)    | P2        | 1.5d   | `supabase/functions/video-export/`                                      |
| 035-11 | Share to Telegram Stories с аудио-превью                       | P1        | 0.5d   | `src/services/telegram-stories.ts`                                      |

### Критерии успеха Sprint 035

- [ ] E2E smoke test проходит в CI (green build)
- [ ] ≥20 E2E тестов проходят стабильно
- [ ] Export WAV/MP3 работает для любого трека
- [ ] Telegram Stories sharing с аудио работает
- [ ] CI pipeline с Playwright настроен

---

## Sprint 036: Качество, стабильность, рефакторинг

**Период:** Неделя 5–6 (Q3 2026)
**Цель:** Разбить гигантские файлы, добить unit-тесты до 500+, подготовить Service Worker
**Effort:** ~10 дней

### Фаза 1: Рефакторинг гигантских файлов — Phase 9B (4 дня)

| #      | Задача                                                                                 | Приоритет | Effort | Файлы                                       |
| ------ | -------------------------------------------------------------------------------------- | --------- | ------ | ------------------------------------------- |
| 036-01 | Разбить `GlobalAudioProvider.tsx` (982 строки) → hooks/state/queue                     | P0        | 1.5d   | `src/components/GlobalAudioProvider.tsx`    |
| 036-02 | Разбить `SectionNotesPanel.tsx` (882 строки) + `IntegratedStemTracks.tsx` (875 строк)  | P0        | 1d     | `src/components/studio/`                    |
| 036-03 | Разбить `MobileFullscreenPlayer.tsx` (837 строк) + `AudioActionDialog.tsx` (797 строк) | P1        | 1d     | `src/components/player/`, `src/components/` |
| 036-04 | Phase 9C: Консолидация Lyrics-экосистемы (30+ файлов из 6 директорий)                  | P2        | 0.5d   | `src/components/lyrics/`                    |

> **Примечание:** `useUnifiedStudioStore` уже разбит до 29 строк (Phase 9A завершена).

### Фаза 2: Тестовое покрытие до 500+ (3 дня)

| #      | Задача                                                                           | Приоритет | Effort | Файлы                                                                      |
| ------ | -------------------------------------------------------------------------------- | --------- | ------ | -------------------------------------------------------------------------- |
| 036-05 | Unit-тесты для generation hooks (useGenerateForm, usePromptValidation)           | P0        | 1d     | `tests/unit/hooks/useGenerateForm.test.ts`                                 |
| 036-06 | Unit-тесты для audio utilities (audioElementPool, audioCache, waveformGenerator) | P1        | 1d     | `tests/unit/lib/audio*.test.ts`                                            |
| 036-07 | Unit-тесты для export service + A/B framework                                    | P1        | 0.5d   | `tests/unit/services/export.test.ts`, `tests/unit/hooks/useABTest.test.ts` |
| 036-08 | Property-based тесты для критических трансформаций                               | P2        | 0.5d   | `tests/unit/lib/property-based.test.ts`                                    |

### Фаза 3: Service Worker и оффлайн (3 дня)

| #      | Задача                                                          | Приоритет | Effort | Файлы                                          |
| ------ | --------------------------------------------------------------- | --------- | ------ | ---------------------------------------------- |
| 036-09 | Базовый Service Worker с Workbox (cache-first для статики)      | P1        | 1d     | `src/sw.ts`, `vite.config.ts` (VitePWA plugin) |
| 036-10 | Cache-first для аудио CDN (прослушанные треки доступны оффлайн) | P1        | 1d     | `src/sw.ts`                                    |
| 036-11 | Network-first для API (генерация, библиотека)                   | P2        | 0.5d   | `src/sw.ts`                                    |
| 036-12 | Update notification UI ("Доступна новая версия")                | P2        | 0.5d   | `src/components/ui/UpdateNotification.tsx`     |

### Критерии успеха Sprint 036

- [ ] Нет файлов >800 строк в `src/components/`
- [ ] Unit-тестов: 500+ (с 362)
- [ ] Service Worker кэширует статику + аудио CDN
- [ ] Lyrics-экосистема консолидирована
- [ ] TypeScript компиляция без ошибок после рефакторинга

---

## Сводная таблица

| Спринт | Фокус                | Задач | Effort | Ключевая метрика                 |
| ------ | -------------------- | ----- | ------ | -------------------------------- |
| 034    | Надёжность генерации | 13    | 10д    | Failure rate 12% → <8%           |
| 035    | E2E + Экспорт        | 11    | 10д    | E2E green CI + export            |
| 036    | Качество + SW        | 12    | 10д    | 500+ тестов, 0 файлов >800 строк |

## Зависимости между спринтами

```
Sprint 034 (Generation Reliability)
  ├── 034-09 A/B framework ──→ Sprint 035 (A/B для экспорта)
  └── 034-01 Metrics dashboard ──→ Sprint 036 (мониторинг после рефакторинга)

Sprint 035 (E2E + Export)
  ├── 035-06 CI pipeline ──→ Sprint 036 (CI валидация рефакторинга)
  └── 035-07 Export service ──→ Sprint 036 (unit-тесты export)

Sprint 036 (Quality)
  └── финализирует Phase 9B из бэклога
```

## Риски и митигации

| Риск                                     | Вероятность | Влияние | Митигация                                               |
| ---------------------------------------- | ----------- | ------- | ------------------------------------------------------- |
| E2E тесты flaky из-за Suno API           | Высокая     | Средний | Мокать Suno API в тестах, тестировать UI flow           |
| Рефакторинг StudioShell ломает Studio    | Средняя     | Высокий | Сначала E2E тесты (Sprint 035), потом рефакторинг (036) |
| Bundle size после SW > 950KB             | Низкая      | Средний | SW в отдельном entry point, не влияет на main bundle    |
| Suno API rate limits блокируют A/B тесты | Средняя     | Средний | Кэширование результатов, тестирование в off-peak        |

---

**Следующий обзор:** После завершения Sprint 034
**Ответственный:** Product Team
