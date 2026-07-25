# 🔍 Аудит проекта MusicVerse AI — 2026-07-25

**Ветка аудита:** `claude/project-audit-plan-5v6btp`
**Автор:** Claude Code · **Метод:** локальный прогон (`npm ci --legacy-peer-deps`), фактические команды, а не снимки бейджей.

> Все цифры ниже получены реальным запуском на коммите `ccf19d0` (`main`), а не взяты из `PROJECT_STATUS.md`.

---

## 1. TL;DR — вердикт

| Область       | Статус                | Комментарий                                                                                                                                                      |
| ------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI `main`** | 🔴 **КРАСНЫЙ**        | `quality-check.yml` — `failure` в **7+ прогонах подряд** (24 июля). Заявленное «health 99/100» не соответствует.                                                 |
| **Lockfile**  | 🔴 **удалён**         | `package-lock.json` удалён 24 июля (`e329633`); на `origin/main` нет ни одного lockfile → `npm ci` падает на install (первый шаг CI). **Истинная первопричина.** |
| TypeScript    | 🟢 0 ошибок           | `tsc --build` и `tsc -p tsconfig.app.json` — exit 0. Единственная зелёная метрика, совпавшая с докой.                                                            |
| Unit-тесты    | 🟢 1855 passed        | 174 файла, +4 skip, +31 todo. Доке заявлено 1810 — устаревший снимок (тестов стало больше).                                                                      |
| **Lint**      | 🔴 **23 ошибки**      | Следующий гейт после install: роняет job «quality». +1744 warning.                                                                                               |
| Сборка        | 🟢 успешна            | `vite build` — ✓ built in 1m 35s, 6776 модулей, без ошибок. Job «quality» всё равно красный из-за lint.                                                          |
| Безопасность  | 🟠 12 high            | `npm audit` = 12 high (0 critical/moderate/low). Доке заявлено «6: 1 high / 4 moderate / 1 low».                                                                 |
| Процесс       | 🔴 системная проблема | 40/40 последних коммитов — бот Lovable прямо в `main`, 27 из них — безликие «Changes» в обход lint-гейта.                                                        |

**Главный вывод:** проект технически здоров по типам, тестам и сборке, но `main` **красный уже неделю**, и планирующая документация (`PROJECT_STATUS.md`) рапортует зелёный статус, которого нет. Первопричина — **удалённый lockfile** (CI не может даже установить зависимости), за ним — **23 lint-ошибки**. Оба дефекта внесены в одной сессии Lovable коммитами «Changes» прямо в `main` мимо проверок — это и есть системный корень.

---

## 2. Метрики: заявлено vs фактически

| Метрика       | `PROJECT_STATUS.md`                         | Факт (2026-07-25)                  | Δ                     |
| ------------- | ------------------------------------------- | ---------------------------------- | --------------------- |
| CI `main`     | health 99/100                               | 🔴 failure ×7                      | ❌                    |
| Unit-тесты    | 1810 passing                                | 1855 passed / 4 skip / 31 todo     | ~                     |
| TypeScript    | 0 errors                                    | 0 errors                           | ✅                    |
| ESLint errors | (подразумевается 0)                         | **23 errors** + 1744 warn          | ❌                    |
| `any` budget  | 0/50                                        | **15 hard-errors** в `Library.tsx` | ❌                    |
| Уязвимости    | 6 (1h/4m/1l)                                | **12 high**                        | ❌                    |
| Components    | 1161                                        | 1048                               | стар.                 |
| Hooks         | 434                                         | 446                                | стар.                 |
| Services      | 37                                          | 62                                 | стар.                 |
| API           | 30                                          | 32                                 | стар.                 |
| Stores        | 24                                          | 25                                 | стар.                 |
| Vite          | «5.0» (CLAUDE.md) / «8» (STATUS Sprint 065) | `^6.4.3` (package.json)            | ❌ дрейф внутри доков |

---

## 3. Аудит последних правок

### 3.1. Синхронизация жанров (`ccf19d0` / `7a06d87`) — 🟡 сделано наполовину

**Что сделано (хорошо):** добавлен `CANONICAL_GENRE_IDS` + guard `assertGenreIdsMatch()` (throw в DEV, warn в prod) и регрессионный тест `genre-consistency.test.ts`. Guard подключён в трёх точках: UI-табы (`GENRES`), batch (`GENRE_QUERIES`), infinite-scroll (`GENRE_DB_VALUES`).

**Проблема (осталась):** guard сверяет **только идентификаторы** жанров, но не сами списки `dbValues`. А они реально расходятся между двумя источниками истины:

| Жанр   | `GENRE_QUERIES` (batch, `constants.ts`) | `GENRE_DB_VALUES` (infinite, `useInfiniteGenreTracks.ts`) | Расхождение                   |
| ------ | --------------------------------------- | --------------------------------------------------------- | ----------------------------- |
| hiphop | hiphop, hip-hop, rap, trap              | …, **drill**                                              | `drill` только в infinite     |
| pop    | pop, dance, electropop                  | …, **synth-pop**                                          | `synth-pop` только в infinite |
| folk   | folk, acoustic, country                 | …, **americana, bluegrass**                               | 2 значения только в infinite  |

**Последствие:** трек с `computed_genre = "drill"` появится в бесконечной ленте таба «hiphop», но **не** в batch-секции того же жанра на главной. Это ровно тот класс бага («жанр фетчится, но не отображается»), который правка декларировала закрыть — но для нетождественности `dbValues` он остаётся. **Правильный фикс:** один источник истины для маппинга `id → dbValues`, из которого выводятся обе структуры; guard расширить на сверку значений.

### 3.2. Коммиты «Changes» (Lovable, 24 июля) — 🔴 внесли красноту

Все три файла с lint-ошибками последний раз тронуты безликими коммитами «Changes» именно в последней сессии Lovable (24 июля):

- `src/pages/Library.tsx` (16:35) → 15× `no-explicit-any`
- `src/components/generate-form/PromptHistory.tsx` (15:42) → layer-boundary + restricted-imports
- `src/components/track/TrackGenerationStatusPanel.tsx` (11:37) → layer-boundary + restricted-imports

То есть **свежая работа и сломала lint-гейт**, но так как коммиты идут прямо в `main` мимо pre-commit хуков, ничто не заблокировало мерж.

---

## 4. Аудит проекта — находки по приоритетам

### 🔴 P0 — блокеры (main красный)

**P0-0. Lockfile удалён — `npm ci` падает на первом шаге CI (истинная первопричина).** В коммите `e329633` («Changes», 24 июля 14:31, сессия Lovable) `package-lock.json` удалён (`368030 → 0 bytes`). На `origin/main` **нет ни одного** lockfile (`package-lock.json` / `bun.lock` / `yarn.lock`). Шаг CI «Install dependencies» выполняет `npm ci --legacy-peer-deps`, а `npm ci` **жёстко требует lockfile и выходит с ошибкой без него**. → каждый прогон CI после 14:31 падает на install **до** lint/typecheck/тестов. Все 7 наблюдавшихся падений (17:55–18:47) — после этого коммита. `package.json` с тех пор не менялся.

> ✅ **Восстановлено в этой ветке:** `package-lock.json` (v3, 1221 пакет), синхронный с текущим `package.json`, добавлен в этот же коммит. Это чинит шаг install; ниже (P0-1) остаётся независимо.

**P0-1. 23 ESLint-ошибки роняют CI (следующий гейт после install).** Разбивка:

| Правило                                        | Кол-во | Файлы                                                                          |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| `@typescript-eslint/no-explicit-any`           | 15     | `src/pages/Library.tsx` (152-153, 445-452)                                     |
| `layer-boundary/no-supabase-from-in-component` | 6      | `PromptHistory.tsx` (216, 308), `TrackGenerationStatusPanel.tsx` (61,62,68,76) |
| `no-restricted-imports`                        | 2      | `PromptHistory.tsx:40`, `TrackGenerationStatusPanel.tsx:3`                     |

- **Library.tsx** — 15 `(t as any).status / .audio_url / .prompt / …`: тип элемента `filteredTracks` не покрывает поля in-flight генерации. Фикс — типизировать трек (union с полями генерации), а не кастить в `any`.
- **PromptHistory.tsx / TrackGenerationStatusPanel.tsx** — прямые `supabase.from(...)` в компонентах в обход слоя API→Service→Hooks. Фикс — вынести запросы в `*.api.ts` или хук (проект уже имеет `track_versions`/`generation_tasks` API-обёртки рядом).

**P0-2. Процесс: прямые коммиты Lovable в `main`.** 40/40 последних коммитов — `gpt-engineer-app[bot]`, 27 — «Changes». Branch protection, судя по истории, обходится ботом. Пока это не закрыто, любой P0-фикс краснеет заново на следующей сессии Lovable.

### 🟠 P1 — важное

- **P1-1. Дока рапортует ложный «зелёный».** `PROJECT_STATUS.md` (1362 строки истории спринтов) заявляет health 99/100 и «any 0/50» при красном main и 15 `any`. Нужен честный проход: статус, метрики (services 37→62 и т.д.), уязвимости 6→12, версия Vite.
- **P1-2. Незавершённый фикс жанров** (см. §3.1) — один источник истины + guard на `dbValues`.
- **P1-3. Безопасность: 12 high.** Основное — транзитивные dev-зависимости (`brace-expansion` DoS через eslint — фикс breaking; `react-router` CSRF в **RSC-режиме** — приложение SPA на Vite, не RSC, реальный риск низкий). `npm audit fix` (non-breaking) закрывает часть; breaking — оценить отдельно.

### 🟡 P2 — техдолг

- **P2-1. Edge Functions >800 LOC:** `klangio-analyze` 1084, `ai-lyrics-assistant/prompts` 1065, `telegram-bot/commands/audio-upload` 948, `analyze` 841. Не покрыто декомпозицией (в `src/` правило «>500 → split» соблюдается, в `supabase/functions/` — нет).
- **P2-2. 1744 lint-warning** (в основном `no-console`) — шумят и маскируют новые. Постепенно свести к нулю или в `--max-warnings`.
- **P2-3. `npm install` требует `--legacy-peer-deps`** (peer-конфликт storybook). Задокументировано, но остаётся DX-занозой.
- **P2-4. Крупные файлы фронта:** `PromptHistory.tsx` 821, `VoiceCloneService.ts` 766, `deeplink-tracker.ts` 756, `presets.api.ts` 746 — кандидаты на split.

---

## 5. План работы (приоритизированный)

### Спринт A — «Main Green» (P0, ~0.5–1 день)

0. **Восстановить `package-lock.json`** — без него `npm ci` в CI не запускается вообще. ✅ **Сделано в этой ветке** (`claude/project-audit-plan-5v6btp`): свежий lockfile v3 закоммичен. Смёржить в `main` первым делом.
1. **Типизировать `Library.tsx`** — убрать 15 `any` через корректный тип трека с полями генерации.
2. **Вынести Supabase-запросы** из `PromptHistory.tsx` и `TrackGenerationStatusPanel.tsx` в API/hook-слой (8 ошибок layer-boundary + restricted-imports).
3. Прогнать `npm run lint && npm run typecheck && npm test` → PR → зелёный `main`.
4. **Закрыть процесс:** включить branch protection так, чтобы Lovable-бот тоже проходил required checks; добавить проверку «lockfile присутствует» в CI (guard от повторного удаления). Без этого шага п.0–3 обнулятся на следующей сессии Lovable.

### Спринт B — «Правда в документах» (P1, ~0.5 дня)

5. Честный проход `PROJECT_STATUS.md`: реальные метрики, статус CI, уязвимости, версия Vite. Синхронизировать `CLAUDE.md` (Vite 6.4.3).
6. Завершить фикс жанров: единый `GENRE_MAP` → вывод `GENRE_QUERIES`/`GENRE_DB_VALUES`, guard на `dbValues`.
7. `npm audit fix` (non-breaking) + тикет на breaking-обновления.

### Спринт C — «Техдолг» (P2, фоново)

8. Декомпозиция Edge Functions >800 LOC (начать с `klangio-analyze`, `audio-upload`).
9. Свести lint-warnings (`no-console` → `logger`) и включить `--max-warnings` в CI.
10. Split крупных фронт-файлов (`PromptHistory.tsx` и др.).

---

## 6. Что проверено этим аудитом

```
npm ci --legacy-peer-deps        → ok (721 пакетов)
npm run typecheck  (tsc --build) → exit 0  ✅
npm run typecheck:app            → exit 0  ✅
npm test  (vitest run)           → 1855 passed / 4 skip / 31 todo  ✅
npm run build  (vite build)      → exit 0: ✓ built in 1m35s, 6776 модулей  ✅
npm run lint  (eslint .)         → exit 1: 23 errors, 1744 warnings  🔴
npm audit                        → 12 high  🟠
CI quality-check.yml @ main      → failure ×7 (gh actions)  🔴
```
