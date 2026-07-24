## Контекст (что подтверждено чтением)

- `PROJECT_STATUS.md`: последняя сессия — Sprint 065 (Generate v2 + Home Redesign). Метрики: TS 0 err, 1810 unit-тестов, eager bundle 508 KB gzip, `any`-бюджет 0/50.
- Открытые долги, зафиксированные документами:
  - **Sprint 066 — Dependency Health**: `npm install` падает `ERESOLVE` (vite@8 ↔ `@storybook/react-vite@8.6.18` требует vite ≤6). Обход `--legacy-peer-deps`. Также рассинхрон версий в `CLAUDE.md` (заявлен Vite 5).
  - **Sprint 068 — Edge Fn Decomposition**: ≥10 функций >800 LOC. Фактически подтверждено: `klangio-analyze` 1084, `generate-track-cover` 1015, `process-audio-pipeline` 822, `suno-music-generate` 759, `sync-stale-tasks` 681, `project-ai` 666, `mcp` 645, `send-telegram-notification` 594.
  - **Sprint 069 — Bundle + Perf budgets**: запланирован, не начат.
- Свежие правки (этот тред): Sentry-scope с активным треком в `ErrorBoundary`/`ErrorBoundaryWrapper`/`main.tsx`, lazy `UnifiedTrackSheet`, скрипт `release:preflight`. Их надо валидировать в бою.
- 6 зависимостей с уязвимостями (1 high, 4 moderate, 1 low) по бейджу `PROJECT_STATUS.md` — не закрыты.

Планируемые ниже пункты — новая работа; текущее состояние по каждому долгу указано выше на основании прочитанных документов и `wc -l` по `supabase/functions/`.

## План работ (6 шагов, каждый шиппится отдельно)

### 1. Валидация недавних правок Sentry + lazy sheet
- Прогнать `npm run typecheck` и `npm test -- src/lib/errorContext src/components/ErrorBoundary`.
- Ручной smoke: кинуть тестовое исключение из `/library` при активном треке → убедиться, что в `sessionStorage.musicverse_boot_log` и в Sentry-событии есть `route`, `activeTrackId`, `activeVersionId`.
- Проверить в build-логе, что `UnifiedTrackSheet.tsx` уехал в отдельный чанк (`vite build` → `dist/assets/…UnifiedTrackSheet-*.js`).
- Если чанк слипся с library — вынести в `manualChunks`.

### 2. Sprint 066 — Dependency Health (unblock `npm install`)
- Обновить `@storybook/react-vite` до линии, поддерживающей vite@8 (актуально `^9`), либо, если ломает stories, откатить vite на `^6` (быстрее). Решение выбрать после `npm view @storybook/react-vite versions --json`.
- Прогнать `npm audit` → зафиксировать 6 CVE, обновить только те deps, что не требуют мажорных миграций; остальное — issue.
- Синхронизировать `CLAUDE.md` (Vite 8, а не 5) и `AGENTS.md`.
- Definition of done: `npm ci` без `--legacy-peer-deps`, `npm audit --production` = 0 high.

### 3. Sprint 068 — Edge Function Decomposition (первый заход, 4 из 10)
Разбить только самые крупные, где риск регрессии минимален (нет платежей):
- `klangio-analyze/index.ts` (1084) → `handlers/{upload,poll,persist}.ts` + `lib/{klangio-client,mapping}.ts`.
- `generate-track-cover/index.ts` (1015) → `handlers/{generate,upscale,upload}.ts` + `lib/prompt.ts`.
- `process-audio-pipeline/index.ts` (822) → шаги пайплайна в отдельные модули с общим `context.ts`.
- `suno-music-generate/index.ts` (759) → выделить `lib/payload-mapper.ts` (camelCase/snake_case) и `handlers/{start,callback-wire}.ts`.
Для каждой: сохранить точку входа `index.ts` < 200 LOC, тесты в `supabase/functions/<name>/__tests__/`. `process-audio-pipeline` и `suno-music-generate` — с smoke-тестом через `supabase--test_edge_functions`.

Оставшиеся 4 функции (`sync-stale-tasks`, `project-ai`, `mcp`, `send-telegram-notification`) — во второй заход отдельным PR.

### 4. Sprint 069 — Bundle + Perf budgets
- Установить `size-limit` порог 950 KB (уже используется) на **gzip eager** + новый порог 200 KB на `library` route-chunk.
- Прогнать `vite build --report`, собрать топ-10 модулей по весу, вынести в issue `perf-budget-followups`.
- Добавить `npm run size:library` (size-limit конфиг для конкретного чанка).
- Включить `size` шаг в `.github/workflows/quality-check.yml`.

### 5. N+1 second pass — фактические подтверждения
- Добавить в dev-режиме счётчик Supabase-запросов на маршрут через `supabase.channel`-обвязку в `src/integrations/supabase/client.ts` (только `import.meta.env.DEV`), логировать в `logger.debug` c маршрутом.
- Пройти сценарии: cold `/library`, открыть `UnifiedTrackSheet`, переключить версию, лайкнуть трек. Зафиксировать реальные числа запросов в `docs/perf/library-queries.md` (после чего убрать инструментирование или спрятать за флагом).

### 6. Release preflight
- Проверить, что `npm run release:preflight` проходит локально (lint → typecheck → test → build → `test:smoke:chromium`).
- Добавить step `release:preflight` в отдельный workflow `release-preflight.yml`, триггер `workflow_dispatch` + `push` в `release/*`.
- Обновить `CHANGELOG.md` и `PROJECT_STATUS.md` (сессия 2026-07-24, Sprint 066/068/069 частично закрыты).

## Технические детали

- Sentry-контекст трека уже пишется через `getErrorScope()` (`src/lib/errorContext.ts`) — новые edge-функции не задевает; менять контракт не нужно.
- `LazyUnifiedTrackSheet` рендерит `null` при `open=false`, поэтому чанк не грузится до первого клика по «⋯» — при декомпозиции edge-функций фронтовые импорты не трогаем.
- Для edge-декомпозиции строгий инвариант: `supabase/config.toml` не редактируем, только добавляем файлы внутри существующих папок функций — деплой конфига остаётся прежним.
- Все новые модули edge-функций импортируются относительными путями (`./lib/...`), т.к. edge-runtime не резолвит `@/`.

## Что НЕ делаем в этом плане

- Не трогаем платёжные функции (Tinkoff/Stars) и telegram-bot — отдельный релизный цикл.
- Не начинаем Q3-эпики (Realtime co-editing, Marketplace) — сначала закрываем tech-debt.
- Не переписываем Storybook stories, только чиним peer-конфликт.

## Порядок мержа

1 → 2 → 6 (unblock CI и релизный прогон), затем 3 → 4 → 5 параллельными PR.
