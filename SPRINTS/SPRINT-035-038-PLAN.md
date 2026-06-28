# План спринтов 035–038 (Q3–Q4 2026)

**Дата составления:** 2026-06-28
**Основа:** Комплексный аудит кодовой базы + результаты спринтов 033–034
**Статус:** Утверждён

---

## Текущее состояние проекта (после аудита)

| Метрика               | Значение     | Цель    | Статус |
| --------------------- | ------------ | ------- | ------ |
| Спринт                | 034 завершён | —       | ✅     |
| Общий прогресс        | 92%          | 95%+    | 🔄     |
| Health Score          | 98/100       | ≥95     | ✅     |
| Компоненты            | 987          | —       | ✅     |
| Хуки                  | 347          | —       | ✅     |
| Edge Functions        | 130          | —       | ✅     |
| Бандл (gzip)          | 918 КБ       | ≤950 КБ | ✅     |
| Unit-тестов           | 91 файл      | 200+    | ❌     |
| Покрытие тестами      | ~9.2%        | ≥40%    | ❌     |
| E2E-спецификации      | 47           | 47 pass | ❌     |
| Файлов >500 строк     | 30+          | 0       | ❌     |
| Использований `any`   | 484          | <50     | ❌     |
| `console.log` в проде | 4            | 0       | ❌     |
| Неиспользуемых dep    | 11           | 0       | ❌     |
| Нарушений слоёв       | 4 компонента | 0       | ❌     |

### Выявленные проблемы (приоритет)

| Приоритет   | Проблема                                            | Спринт  |
| ----------- | --------------------------------------------------- | ------- |
| 🔴 Critical | Размер бандла не верифицируется в CI                | 035     |
| 🔴 Critical | 9.2% покрытие тестами для production-приложения     | 035-036 |
| 🟠 High     | 30+ файлов >500 строк (макс. 1,218 строк)           | 036     |
| 🟠 High     | 484 использования `any` при strict mode             | 036     |
| 🟠 High     | Компоненты импортируют напрямую из `api/` слоя      | 036     |
| 🟠 High     | `console.log` в продакшн-коде (4 вхождения)         | 035     |
| 🟡 Medium   | 11 неиспользуемых зависимостей                      | 037     |
| 🟡 Medium   | E2E тесты не запускаются в CI                       | 035     |
| 🟢 Low      | `dangerouslySetInnerHTML` без DOMPurify (chart.tsx) | 037     |

---

## Sprint 035: CI-качество + E2E стабилизация

**Период:** Неделя 1–2 (Q3 2026)
**Цель:** Зелёный CI, верификация бандла, стабильные E2E тесты
**Effort:** ~10 дней
**Статус:** ⏳ ЗАПЛАНИРОВАН

### Фаза 1: CI pipeline и быстрые фиксы (3 дня)

| #      | Задача                                                               | Приоритет | Effort | Файлы                                                                                                      |
| ------ | -------------------------------------------------------------------- | --------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| 035-01 | Верифицировать размер бандла в CI (`npm run build` + `npm run size`) | P0        | 0.5d   | `.github/workflows/ci.yml`, `package.json`                                                                 |
| 035-02 | Заменить `console.log` на `logger` (4 вхождения)                     | P0        | 0.5d   | `src/main.tsx`, `src/contexts/telegram/useTelegramInit.ts`, `src/components/studio/UnifiedNotesViewer.tsx` |
| 035-03 | Починить smoke test (app boot, basic navigation)                     | P0        | 0.5d   | `tests/e2e/smoke.app-boots.spec.ts`                                                                        |
| 035-04 | Починить Playwright CI pipeline (GitHub Actions)                     | P0        | 1d     | `.github/workflows/e2e.yml`, `playwright.config.ts`                                                        |
| 035-05 | Санитизировать `dangerouslySetInnerHTML` в chart.tsx                 | P2        | 0.5d   | `src/components/ui/chart.tsx:70`                                                                           |

### Фаза 2: E2E стабилизация (4 дня)

| #      | Задача                                                  | Приоритет | Effort | Файлы                                                        |
| ------ | ------------------------------------------------------- | --------- | ------ | ------------------------------------------------------------ |
| 035-06 | Починить homepage + navigation тесты                    | P0        | 1d     | `tests/e2e/homepage.spec.ts`, `tests/e2e/navigation.spec.ts` |
| 035-07 | Починить player тесты (compact, fullscreen, a11y)       | P0        | 1d     | `tests/e2e/player.*.spec.ts`                                 |
| 035-08 | Починить library тесты                                  | P1        | 0.5d   | `tests/e2e/library.spec.ts`                                  |
| 035-09 | Починить generation тесты (dialog, mobile taps, portal) | P1        | 1d     | `tests/e2e/generation.*.spec.ts`                             |
| 035-10 | Edge Function unit тесты (Vitest)                       | P2        | 0.5d   | `tests/unit/functions/`                                      |

### Фаза 3: Экспорт (3 дня)

| #      | Задача                                                 | Приоритет | Effort | Файлы                                                                   |
| ------ | ------------------------------------------------------ | --------- | ------ | ----------------------------------------------------------------------- |
| 035-11 | Универсальный export service (скачивание WAV/MP3/FLAC) | P0        | 1d     | `src/services/export.service.ts`, `supabase/functions/audio-export/`    |
| 035-12 | UI экспорта (формат, качество, метаданные)             | P1        | 1d     | `src/components/export/ExportDialog.tsx`, `src/hooks/useAudioExport.ts` |
| 035-13 | Spotify-ready metadata (ID3 tags, cover art)           | P2        | 1d     | `supabase/functions/audio-metadata/`                                    |

### Критерии успеха Sprint 035

- [ ] `npm run build` + `npm run size` проходят в CI на каждый PR
- [ ] 0 `console.log` в продакшн-коде (кроме debug/)
- [ ] E2E smoke test стабильно зелёный в CI
- [ ] ≥20 E2E тестов проходят стабильно
- [ ] Export WAV/MP3 работает для любого трека
- [ ] CI pipeline с Playwright настроен и работает

---

## Sprint 036: Рефакторинг + Type Safety

**Период:** Неделя 3–4 (Q3 2026)
**Цель:** Разбить гигантские файлы, починить типизацию, устранить архитектурные нарушения
**Effort:** ~10 дней
**Статус:** ⏳ ЗАПЛАНИРОВАН

### Фаза 1: Рефакторинг файлов >800 строк — Phase 9B (4 дня)

| #      | Задача                                                                                                  | Приоритет | Effort | Целевой файл (строк)                        |
| ------ | ------------------------------------------------------------------------------------------------------- | --------- | ------ | ------------------------------------------- |
| 036-01 | Разбить `useGenerateForm.ts` (1,218 строк) → useGenerateValidation, useGenerateSubmit, useGenerateState | P0        | 1.5d   | `src/hooks/generation/useGenerateForm.ts`   |
| 036-02 | Разбить `LyricsStudio.tsx` (1,087 строк) → LyricsEditor, LyricsToolbar, LyricsPreview                   | P0        | 1d     | `src/pages/LyricsStudio.tsx`                |
| 036-03 | Разбить `GlobalAudioProvider.tsx` (982 строки) → hooks/state/queue                                      | P0        | 1d     | `src/components/GlobalAudioProvider.tsx`    |
| 036-04 | Разбить `MobileFullscreenPlayer.tsx` (837) + `AudioActionDialog.tsx` (797)                              | P1        | 0.5d   | `src/components/player/`, `src/components/` |

### Фаза 2: Type Safety — устранение `any` (3 дня)

| #      | Задача                                                                                 | Приоритет | Effort | Файлы                                                  |
| ------ | -------------------------------------------------------------------------------------- | --------- | ------ | ------------------------------------------------------ |
| 036-05 | Добавить `audio_url_hd`, `audio_quality` в тип `Track` + извлечь `isHDAudio()` утилиту | P0        | 0.5d   | `src/integrations/supabase/types.ts`, `src/lib/audio/` |
| 036-06 | Типизировать generate-form компоненты (убрать `as any` для recording, preset)          | P0        | 1d     | `src/components/generate-form/`                        |
| 036-07 | Типизировать track-actions компоненты (QualityActions, UnifiedTrackSheet, etc.)        | P1        | 0.5d   | `src/components/track-actions/`                        |
| 036-08 | Типизировать admin компоненты (chart formatters, API responses)                        | P2        | 1d     | `src/pages/admin/`                                     |

### Фаза 3: Архитектурные исправления (3 дня)

| #      | Задача                                                                              | Приоритет | Effort | Файлы                              |
| ------ | ----------------------------------------------------------------------------------- | --------- | ------ | ---------------------------------- |
| 036-09 | Переместить прямые API-импорты в хуки (RenameTrackDialog, AudioUpscaleButton, etc.) | P0        | 1d     | 4 компонента → 4 новых хука        |
| 036-10 | Консолидация Lyrics-экосистемы (30+ файлов из 6 директорий)                         | P1        | 1d     | `src/components/lyrics/`           |
| 036-11 | Разбить `usePromptDJEnhanced.ts` (1,070 строк)                                      | P1        | 0.5d   | `src/hooks/usePromptDJEnhanced.ts` |
| 036-12 | Разбить прочие файлы >500 строк (presets.api.ts, VoiceCloneService, etc.)           | P2        | 0.5d   | ~10 файлов                         |

### Критерии успеха Sprint 036

- [ ] 0 файлов >800 строк в `src/`
- [ ] `any` использований: <100 (с 484)
- [ ] 0 компонентов с прямым импортом из `api/`
- [ ] Тип `Track` содержит HD audio поля
- [ ] TypeScript компиляция без ошибок после рефакторинга
- [ ] `isHDAudio()` утилита используется вместо дублированного паттерна

---

## Sprint 037: Тестовое покрытие + Infrastructure

**Период:** Неделя 5–6 (Q3 2026)
**Цель:** Довести покрытие тестами до 40%+, Service Worker, удалить мёртвые зависимости
**Effort:** ~10 дней
**Статус:** ⏳ ЗАПЛАНИРОВАН

### Фаза 1: Unit-тесты до 200+ файлов (5 дней)

| #      | Задача                                                                           | Приоритет | Effort | Файлы                                                |
| ------ | -------------------------------------------------------------------------------- | --------- | ------ | ---------------------------------------------------- |
| 037-01 | Тесты для generation hooks (useGenerateForm, usePromptValidation, useExperiment) | P0        | 1.5d   | `tests/unit/hooks/generation/`                       |
| 037-02 | Тесты для audio utilities (audioElementPool, audioCache, waveformGenerator)      | P0        | 1d     | `tests/unit/lib/audio/`                              |
| 037-03 | Тесты для player store + GlobalAudioProvider                                     | P0        | 1d     | `tests/unit/stores/playerStore.test.ts`              |
| 037-04 | Тесты для export service + A/B framework                                         | P1        | 0.5d   | `tests/unit/services/`, `tests/unit/lib/ab-testing/` |
| 037-05 | Property-based тесты для критических трансформаций (fast-check)                  | P2        | 1d     | `tests/unit/property/`                               |

### Фаза 2: Infrastructure & cleanup (3 дня)

| #      | Задача                                                        | Приоритет | Effort | Файлы                            |
| ------ | ------------------------------------------------------------- | --------- | ------ | -------------------------------- |
| 037-06 | Удалить 11 неиспользуемых зависимостей                        | P1        | 0.5d   | `package.json`                   |
| 037-07 | Удалить устаревшие конфиги (babel.config.js, jest.config.cjs) | P1        | 0.5d   | Корень проекта                   |
| 037-08 | Bundle audit с rollup-plugin-visualizer (`npm run analyze`)   | P1        | 1d     | `vite.config.ts`, `package.json` |
| 037-09 | Автоматизация `npm run size` в CI (блокирующий check)         | P0        | 1d     | `.github/workflows/ci.yml`       |

### Фаза 3: Service Worker + оффлайн (2 дня)

| #      | Задача                                                     | Приоритет | Effort | Файлы                                          |
| ------ | ---------------------------------------------------------- | --------- | ------ | ---------------------------------------------- |
| 037-10 | Базовый Service Worker с Workbox (cache-first для статики) | P1        | 1d     | `src/sw.ts`, `vite.config.ts` (VitePWA plugin) |
| 037-11 | Cache-first для аудио CDN (прослушанные треки оффлайн)     | P2        | 0.5d   | `src/sw.ts`                                    |
| 037-12 | Update notification UI ("Доступна новая версия")           | P2        | 0.5d   | `src/components/ui/UpdateNotification.tsx`     |

### Критерии успеха Sprint 037

- [ ] Unit-тестов: 200+ файлов (с 91)
- [ ] Покрытие: ≥30% (с ~9%)
- [ ] 0 неиспользуемых зависимостей
- [ ] `npm run analyze` доступен с tree-map визуализацией
- [ ] `npm run size` блокирует PR при превышении 950KB
- [ ] Service Worker кэширует статику + аудио CDN
- [ ] Устаревшие конфиги удалены

---

## Sprint 038: Developer Experience + Мониторинг

**Период:** Неделя 7–8 (Q4 2026)
**Цель:** TypeScript strict mode, Sentry Performance, Storybook, документация
**Effort:** ~10 дней
**Статус:** ⏳ ЗАПЛАНИРОВАН

### Фаза 1: TypeScript strict mode (3 дня)

| #      | Задача                                                              | Приоритет | Effort | Файлы               |
| ------ | ------------------------------------------------------------------- | --------- | ------ | ------------------- |
| 038-01 | Включить `noUnusedLocals` + `noUnusedParameters` + исправить ошибки | P0        | 1.5d   | `tsconfig.json`, \* |
| 038-02 | Включить `strictNullChecks` для `src/lib/` и `src/services/`        | P0        | 1d     | `tsconfig.json`     |
| 038-03 | ESLint plugin expansion — расширение кастомных правил               | P1        | 0.5d   | `eslint.config.js`  |

### Фаза 2: Мониторинг и observability (4 дня)

| #      | Задача                                               | Приоритет | Effort | Файлы                              |
| ------ | ---------------------------------------------------- | --------- | ------ | ---------------------------------- |
| 038-04 | Sentry Performance monitoring (transactions, traces) | P0        | 1.5d   | `src/lib/sentry.ts`, `src/App.tsx` |
| 038-05 | Telegram Mini App cold start оптимизация             | P1        | 1d     | `src/main.tsx`, `index.html`       |
| 038-06 | Lighthouse perf budget enforcement в CI              | P1        | 1d     | `.github/workflows/lighthouse.yml` |
| 038-07 | a11y regression тесты (axe-core в CI)                | P2        | 0.5d   | `.github/workflows/a11y.yml`       |

### Фаза 3: Storybook + Документация (3 дня)

| #      | Задача                                          | Приоритет | Effort | Файлы                                               |
| ------ | ----------------------------------------------- | --------- | ------ | --------------------------------------------------- |
| 038-08 | Storybook stories для 20+ shared/ui компонентов | P1        | 1.5d   | `src/components/ui/*.stories.*`                     |
| 038-09 | Верификация и обновление ARCHITECTURE_HUB.md    | P1        | 0.5d   | `ARCHITECTURE_HUB.md`                               |
| 038-10 | Документирование FSM state schema               | P2        | 0.5d   | `docs/STATE_MACHINES.md`                            |
| 038-11 | WCAG AA полный проход для Library + Studio      | P2        | 0.5d   | `src/components/library/`, `src/components/studio/` |

### Критерии успеха Sprint 038

- [ ] `noUnusedLocals` + `noUnusedParameters` включены без ошибок
- [ ] `strictNullChecks` для lib/ и services/
- [ ] Sentry Performance транзакции активны (sample rate >0)
- [ ] Lighthouse CI проходит на каждый PR (perf ≥90)
- [ ] 20+ Storybook stories для ui компонентов
- [ ] Cold start <3s на среднем устройстве

---

## Сводная таблица

| Спринт | Фокус                     | Задач | Effort | Ключевая метрика                      |
| ------ | ------------------------- | ----- | ------ | ------------------------------------- |
| 035    | CI-качество + E2E         | 13    | 10д    | Green CI + ≥20 E2E pass               |
| 036    | Рефакторинг + Type Safety | 12    | 10д    | 0 файлов >800 строк, `any` <100       |
| 037    | Тесты + Infrastructure    | 12    | 10д    | 200+ тестов, SW, 0 unused deps        |
| 038    | DX + Мониторинг           | 11    | 10д    | Strict TS, Sentry Perf, Storybook 20+ |

## Зависимости между спринтами

```
Sprint 035 (CI + E2E)
  ├── 035-01 build verification ──→ Sprint 037-09 (size в CI)
  ├── 035-04 Playwright CI ──→ Sprint 036 (валидация рефакторинга)
  └── 035-11 Export service ──→ Sprint 037-04 (тесты export)

Sprint 036 (Рефакторинг)
  ├── 036-01 useGenerateForm split ──→ Sprint 037-01 (тесты generation)
  ├── 036-03 GlobalAudioProvider split ──→ Sprint 037-03 (тесты player)
  └── 036-05 Track type fix ──→ Sprint 036-07 (track-actions typing)

Sprint 037 (Тесты + Infra)
  ├── 037-09 size в CI ──→ Sprint 038-06 (Lighthouse CI)
  └── 037-10 Service Worker ──→ Sprint 038 (offline monitoring)

Sprint 038 (DX + Мониторинг)
  └── Финальная стабилизация перед Q4 features
```

## Ожидаемое состояние после Sprint 038

| Метрика              | Текущее  | После 038 | Улучшение |
| -------------------- | -------- | --------- | --------- |
| Покрытие тестами     | ~9%      | ≥40%      | +31%      |
| Unit-тестов (файлов) | 91       | 200+      | +120%     |
| E2E pass rate        | 0%       | ≥80%      | +80%      |
| Файлов >500 строк    | 30+      | <5        | -85%      |
| Использований `any`  | 484      | <50       | -90%      |
| Unused dependencies  | 11       | 0         | -100%     |
| CI checks            | 2 (fail) | 5 (pass)  | green CI  |
| Общий прогресс       | 92%      | 96%       | +4%       |

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
