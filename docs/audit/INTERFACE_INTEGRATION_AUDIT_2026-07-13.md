# Аудит интерфейса и интеграции сторонних сервисов

**Дата:** 2026-07-13
**Ветка:** `claude/interface-integration-audit-jw5cmp`
**Область:** UI/интерфейс (`src/`) + интеграции внешних сервисов (`supabase/functions/`, `src/integrations/`, `src/services/`)
**Метод:** статический анализ кода, инвентаризация секретов, чтение критичных путей (auth, webhooks, callbacks), количественные метрики.

---

## 1. Резюме (Executive Summary)

Платформа — зрелый Telegram Mini App с очень широкой интеграционной поверхностью: **136 edge-функций**, **9+ внешних API** (Suno, Lovable AI Gateway, Replicate, Klangio, AudD, Fal.ai, Tinkoff, Telegram, Sentry) и **74 страницы / 1039 компонентов** на фронтенде.

**Общая оценка: 7.2 / 10.** Фундамент сильный: секреты нигде не утекают в клиент, платёжные вебхуки сделаны образцово (верификация подписи + идемпотентность + атомарные RPC), архитектура фронтенда качественная (вложенные error boundaries, lazy-loading, realtime-доставка результатов). Однако есть **3 находки высокого приоритета** — все в зоне «публичные edge-функции без аутентификации» и приватность телеметрии, — которые следует закрыть до масштабирования.

| Приоритет      | Кол-во | Суть                                                                                                              |
| -------------- | :----: | ----------------------------------------------------------------------------------------------------------------- |
| 🔴 High (P0)   |   3    | Открытые edge-функции (отправка сообщений, callbacks генерации), незамаскированный Session Replay                 |
| 🟠 Medium (P1) |   5    | i18n не используется, рассинхрон имён секрета вебхука, fail-open верификация, in-memory rate-limit, wildcard CORS |
| 🟡 Low (P2)    |   6    | Размер файлов, `as any`-касты, non-constant-time сравнения, hardcoded DSN, hex-цвета, «password-rotation» auth    |

---

## 2. Легенда серьёзности

- 🔴 **High** — эксплуатируемый риск безопасности/приватности или блокер для роста; закрыть в приоритете.
- 🟠 **Medium** — заметный технический/продуктовый риск; запланировать в ближайший спринт.
- 🟡 **Low** — качество кода / гигиена / расхождение с документацией.
- ✅ **Strength** — сделано хорошо, сохранить как эталон.

---

## 3. Часть A — Интеграция сторонних сервисов

### 3.1. Инвентаризация сервисов

| Сервис                 | Назначение                                   | Секрет (env)                                            | Хранится |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------- | :------: |
| **Suno AI**            | Генерация музыки/вокала/кавера/стемов/MIDI   | `SUNO_API_KEY`, `SUNO_WEBHOOK_SECRET`                   |  server  |
| **Lovable AI Gateway** | LLM-задачи (текст, обложки, анализ)          | `LOVABLE_API_KEY`                                       |  server  |
| **Replicate**          | Апскейл, watermark, MIDI, анализ, стемы, STT | `REPLICATE_API_KEY`                                     |  server  |
| **Klangio**            | MIDI-транскрипция                            | `KLANGIO_API_KEY`                                       |  server  |
| **AudD**               | Распознавание музыки                         | `AUDD_API_KEY`                                          |  server  |
| **Fal.ai**             | Анализ аудио                                 | `FAL_API_KEY`                                           |  server  |
| **Tinkoff**            | Платежи/подписки (RU)                        | `TINKOFF_TERMINAL_KEY`, `TINKOFF_SECRET_KEY`            |  server  |
| **Telegram**           | Bot API, Mini App, Stars, вебхуки            | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET(_TOKEN)` |  server  |
| **Supabase**           | БД / Auth / Storage / Edge                   | `SERVICE_ROLE_KEY` (server), `PUBLISHABLE_KEY` (client) |  mixed   |
| **Sentry**             | Мониторинг ошибок                            | `VITE_SENTRY_DSN` (публичный по дизайну)                |  client  |

✅ **Управление секретами — сильная сторона.** Все ключи читаются только через `Deno.env.get()` на сервере. В клиентском коде (`src/`) экспонируются лишь безопасные публичные значения: `VITE_SUPABASE_URL`, publishable/anon-ключ, `VITE_SUPABASE_PROJECT_ID`, `VITE_SENTRY_DSN`. Хардкод-секретов (`sk-…`, AWS-ключи, приватные ключи, `service_role`) в `src/` **не найдено**.

---

### 3.2. 🔴 HIGH-1 — Открытый эндпоинт отправки сообщений (`send-telegram-notification`)

**Файл:** `supabase/functions/send-telegram-notification/index.ts` + `supabase/config.toml:21-22` (`verify_jwt = false`)

Функция принимает `chat_id`/`chatId` **прямо из тела запроса** и отправляет сообщение через официального бота, при этом:

- `verify_jwt = false` (JWT не проверяется);
- в обработчике **нет** проверки `isServiceRoleToken`, authorization-заголовка или иного guard (grep по `isServiceRoleToken|authorize|SERVICE_ROLE|authHeader` — пусто);
- единственная валидация — `chatId > 0` (`index.ts:75`).

**Сценарий атаки:** злоумышленник вызывает публичный URL функции с произвольным `chat_id` и `message` → пользователю приходит фишинговое сообщение **от имени доверенного бота MusicVerse**. Радиус ограничен правилом Telegram «бот пишет только тем, кто его запустил», но это фактически вся база; `chat_id` часто равен Telegram user id, который не является секретом.

**Рекомендация:** сделать функцию internal-only — требовать service-role токен через `authorize(req)`/`isServiceRoleToken(req)` из `_shared/auth.ts` (паттерн уже есть в кодовой базе) и вызывать её только из других edge-функций. Клиентские вызовы убрать.

---

### 3.3. 🔴 HIGH-2 — Callbacks генерации без верификации подписи

**Файлы:** `supabase/functions/suno-music-callback/index.ts` (1319 LOC, `config.toml:36-37` → `verify_jwt=false`), аналогично `suno-wav-callback`, `suno-cover-callback`, `suno-vocal-callback`, `lyrics-callback`.

Основной callback генерации музыки:

- публичный (`verify_jwt=false`);
- **не проверяет никакой HMAC/подписи** — читает `SUPABASE_URL` и `SERVICE_ROLE_KEY`, но не `SUNO_WEBHOOK_SECRET` (`index.ts:114-115`);
- доверяет `taskId` из тела и пишет в БД URL аудио/обложек, заголовки, статусы, задействует логику стоимости (`getGenerationCost`).

**Контраст:** voice-callbacks (`suno-voice-generate-callback/index.ts:7-26`) **проверяют** HMAC-подпись (`X-Suno-Signature`) секретом `SUNO_WEBHOOK_SECRET`. То есть паттерн верификации в проекте уже реализован — но не применён к основному пути.

**Сценарий:** утечка `taskId` (логи, прокси, сеть) → подделка callback'а с чужими/вредоносными URL, подмена состояния трека. Rate-limit 15/час (`_shared/rate-limiter.ts`) ограничивает объём, но не аутентифицирует источник.

**Рекомендация:** применить HMAC-верификацию Suno ко **всем** `*-callback`-функциям (единый helper), fail-**closed**. Как минимум — сверять секретный path-token в URL callback'а.

---

### 3.4. ✅ Платежи (Tinkoff + Telegram Stars) — эталон

**Tinkoff** (`tinkoff-webhook/index.ts`):

- ✅ верификация токена `verifyTinkoffToken` (SHA-256, `_shared/tinkoff.ts:168`);
- ✅ идемпотентность (`status === "completed"` → выход, `:63`);
- ✅ начисление через атомарный RPC `process_gateway_payment`;
- ✅ корректная обработка подписок/возвратов/отмен.

**Telegram Stars** (`stars-webhook/index.ts`):

- ✅ **fail-closed** проверка подписи: если `TELEGRAM_WEBHOOK_SECRET_TOKEN` не задан — запрос отклоняется (`:74-78`);
- ✅ проверка заголовка `x-telegram-bot-api-secret-token`;
- ✅ идемпотентность по `telegram_payment_charge_id` (`:236-252`);
- ✅ валидация суммы на pre-checkout (`query.total_amount !== product.stars_price`, `:151`) — защита от подмены цены;
- ✅ атомарный RPC `process_stars_payment` с `FOR UPDATE`-локом;
- ✅ таймаут-защита 28s (`:367`).

Это лучший по качеству модуль в интеграционном слое. Использовать как референс для остальных вебхуков.

---

### 3.5. ✅ Telegram-аутентификация Mini App

**Файл:** `supabase/functions/telegram-auth/index.ts`

- ✅ корректный официальный алгоритм валидации `initData`: `HMAC_SHA256(botToken, "WebAppData")` → HMAC data-check-string (`:84-88`);
- ✅ проверка возраста `auth_date` (24 ч, `:103`);
- ✅ структурированные коды ошибок.

**🟡 Замечания (Low):**

- Сравнение хэшей `calculatedHash !== receivedHash` — **не constant-time** (тайминг-атака, низкий риск для HMAC).
- Аутентификация через «ротацию пароля»: на каждый вход генерируется `crypto.randomUUID()` и вызывается `updateUserById({password})` (`:248-250`) — рабочий, но хрупкий обход Supabase Auth; при одновременных входах возможна гонка.
- `decodeURIComponent(initData)` целиком с последующим `split("=")` — потенциально ломается на значениях с `=`/`&` (например, `photo_url` с query-строкой). Латентная хрупкость.

---

### 3.6. ✅ Устойчивость асинхронной генерации

Паттерн реализован грамотно: фронтенд → edge-функция → Suno (async) → callback пишет в БД → **Supabase Realtime** уведомляет клиент.

- ✅ экспоненциальный backoff при загрузке артефактов (`suno-music-callback/index.ts:75` `fetchWithRetry`, 2s/4s/8s);
- ✅ фоновая устойчивость: `cleanup-stale-tasks`, `sync-stale-tasks`, `retry-failed-tasks`, `generation-failure-alert`;
- ✅ доставка результата: 20+ хуков на `postgres_changes` (`useGenerationResult.ts`, `useGenerationRealtime.tsx`, `useStemSeparationRealtime.ts` и др.);
- 178 точек `functions.invoke` — сильная зависимость от edge-слоя (учитывать при code-review).

---

### 3.7. 🟠 MEDIUM — прочие находки интеграций

| #   | Находка                                                                                                                                                        | Файл                                                              | Риск                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| M-1 | **Рассинхрон имён секрета вебхука**: `TELEGRAM_WEBHOOK_SECRET` (`telegram-webhook-setup`, `telegram-bot`) vs `TELEGRAM_WEBHOOK_SECRET_TOKEN` (`stars-webhook`) | `stars-webhook/index.ts:74`, `telegram-webhook-setup/index.ts:62` | Конфиг-хазард → «тихий» отказ проверки/платежей                            |
| M-2 | **Fail-open верификация** voice-callback: при отсутствии `SUNO_WEBHOOK_SECRET` возвращается `true` (принять)                                                   | `suno-voice-generate-callback/index.ts:8-11`                      | Отключение проверки при пустом env                                         |
| M-3 | **In-memory rate-limiter**: per-isolate `Map`, неэффективен в распределённом serverless                                                                        | `_shared/rate-limiter.ts:21`                                      | Реальный лимит не соблюдается между инстансами (задокументировано автором) |
| M-4 | **Wildcard CORS** `Access-Control-Allow-Origin: *` во всех функциях, включая пользовательские                                                                  | `_shared/cors.ts:4` и inline                                      | Для Bearer-эндпоинтов приемлемо, но стоит ограничить origin Mini App       |
| M-5 | 30 функций с `verify_jwt=false` (`config.toml`)                                                                                                                | `supabase/config.toml`                                            | Каждую public-функцию проверить на внутренний guard (см. HIGH-1/2)         |

---

## 4. Часть B — Интерфейс

### 4.1. ✅ Архитектура и обработка ошибок

- ✅ `App.tsx`: **вложенные ErrorBoundary** (глобальный `ErrorBoundaryWrapper` + `ErrorBoundary`, плюс per-route на критичных `Index`/`Library`), слои провайдеров `CoreProviders`/`FeatureProviders`/`UIProviders`, `Suspense` со скелетоном, `PageTransition`;
- ✅ повсеместный `lazyWithRetry` — маршрутный code-splitting;
- ✅ `ErrorBoundary.tsx`: логирование в `logger` + `logError` (Sentry) + boot-log в `sessionStorage`, действия восстановления (reload/home), dev-детали ошибки, упоминание бота для поддержки;
- ✅ хорошая база a11y: **498** атрибутов `aria-*`, 82 `role=`, 93 `alt=` в компонентах.

---

### 4.2. 🔴 HIGH-3 — Sentry Session Replay пишет незамаскированные данные

**Файл:** `src/lib/sentry.ts:35-52`

```
sendDefaultPii: true,
Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
```

Session Replay записывает **весь текст без маскирования** и медиа, плюс `sendDefaultPii: true` (IP и пр.). Для приложения с текстами песен, e-mail пользователей и **платёжными экранами** это значит, что персональные данные и содержимое форм попадают в Sentry в открытом виде. `setUserContext` дополнительно отправляет `email` (`:465-468`). Риск приватности/GDPR.

**Рекомендация:** `maskAllText: true` (или `maskAllInputs`/`block` на платёжных и профильных экранах), `blockAllMedia: true`, пересмотреть `sendDefaultPii`. Снизить `replaysSessionSampleRate` вне отладки.

🟡 Дополнительно: **hardcoded production DSN** как fallback (`sentry.ts:16-18`) — dev-сборки и форки шлют ошибки в прод-проект Sentry, если `VITE_SENTRY_DSN` не переопределён.

---

### 4.3. 🟠 MEDIUM — i18next установлен, но не используется

**Данные:** только **6** файлов используют `useTranslation`/`t()`, при этом **816** файлов компонентов содержат хардкод-строки на кириллице. Словари малы: `ru.json` ~249 строк, `en.json` ~274 строки — покрывают лишь малую долю UI (74 страницы / 1039 компонентов).

Инфраструктура (`i18next`, `react-i18next`, `i18next-browser-languagedetector`, `src/i18n/index.ts`) настроена, но **обходится** прямым хардкодом русского текста. Следствие — смешанный язык UX (напр., бонус за регистрацию по-русски в `telegram-auth`, подтверждение оплаты по-английски в `stars-webhook`) и блокер для англоязычного рынка/инвесторов (README ориентирован в т.ч. на них).

**Рекомендация:** зафиксировать i18n как политику (ESLint-правило против literal-JSX-строк в новых файлах), инкрементально мигрировать топ-страницы, наполнить `en.json`.

---

### 4.4. 🟡 LOW — качество кода и расхождения с документацией

| #   | Находка                              | Данные                                                                  | Комментарий                                                                                                                                            |
| --- | ------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L-1 | Файлы > 500 LOC                      | **80** файлов (excl. generated)                                         | Нарушает собственную конвенцию «≤500 строк»; при этом **0** файлов >800 LOC — как и заявлено в CLAUDE.md ✅                                            |
| L-2 | `as any` / `<any>`-касты             | ~**117** вхождений                                                      | Официальный `count-any` = **0 в рамках бюджета 50** ✅ (скрипт считает только явные аннотации `: any`); касты его обходят и ослабляют типобезопасность |
| L-3 | Non-constant-time сравнения секретов | `tinkoff.ts:177`, `auth.ts:141`, `stars-webhook:86`, `telegram-auth:88` | Тайминг-риск низкий, но дёшево исправить                                                                                                               |
| L-4 | Hardcoded hex-цвета в компонентах    | **54**                                                                  | Есть дизайн-токены (`styles/colors.css`, `design-colors.ts`) — перевести на токены                                                                     |
| L-5 | `console.*` вместо `logger`          | 34 вызова в 15 файлах                                                   | Нарушение конвенции логирования (часть — намеренный boot-log в `main.tsx`)                                                                             |
| L-6 | Tech-debt маркеры                    | 38 (`TODO/FIXME/@ts-ignore`), 138 `eslint-disable`                      | Умеренно для кодовой базы такого размера                                                                                                               |

---

## 5. Приоритизированный план действий

### P0 — до масштабирования (безопасность/приватность)

1. **HIGH-1:** закрыть `send-telegram-notification` service-role guard'ом (`authorize`/`isServiceRoleToken`).
2. **HIGH-2:** ввести HMAC-верификацию для `suno-music-callback` и всех `*-callback` (fail-closed).
3. **HIGH-3:** включить маскирование Sentry Replay (`maskAllText`/`blockAllMedia`), пересмотреть `sendDefaultPii`, убрать hardcoded DSN.

### P1 — ближайший спринт

4. Свести имена секрета вебхука к одному (`TELEGRAM_WEBHOOK_SECRET_TOKEN`) и задокументировать (M-1).
5. Сделать верификацию voice-callback fail-closed (M-2).
6. Заменить in-memory rate-limit на БД/Upstash для критичных функций (M-3).
7. Ограничить CORS origin'ом Mini App для пользовательских функций (M-4).
8. Аудит всех `verify_jwt=false`-функций на внутренний guard (M-5).
9. Зафиксировать политику i18n + мигрировать топ-экраны (§4.3).

### P2 — гигиена

10. Декомпозиция 80 файлов >500 LOC; удаление `as any`-кастов; constant-time сравнения; перевод hex → токены; `console.*` → `logger`.

---

## 6. Что сделано хорошо (сохранить как эталон)

- 🔒 Нулевая утечка секретов в клиент; чёткое разделение server/client env.
- 💳 Платёжные вебхуки: подпись + идемпотентность + атомарные RPC + валидация цены + fail-closed (Stars).
- 🤖 Корректный официальный HMAC-алгоритм валидации Telegram `initData`.
- ♻️ Устойчивость: backoff-ретраи, фоновая очистка/ретрай зависших задач, алерты, realtime-доставка результатов.
- 🧱 Надёжные вложенные error boundaries и богатая таксономия Sentry-capture (audio/studio/payment/generation).
- ⚡ Массовый lazy-loading/code-splitting; хорошая база a11y.

---

## 7. Методология и ограничения

- **Метод:** статический анализ (Read/Grep/Glob), инвентаризация `Deno.env.get`/`import.meta.env`, чтение критичных путей (auth, webhooks, callbacks, платежи), количественные метрики по `src/` и `supabase/functions/`.
- **Не выполнялось:** динамическое тестирование, реальные запросы к внешним API, ревью RLS-политик БД, проверка развёрнутых значений env (напр., действительно ли `TELEGRAM_WEBHOOK_SECRET` == `TELEGRAM_WEBHOOK_SECRET_TOKEN` в проде — это нужно проверить в дашборде Supabase).
- **Ограничение инструментов:** CLI `graphify` в среде недоступен (`command not found`), несмотря на наличие `graphify-out/graph.json`; навигация выполнена стандартными файловыми инструментами.
- **Проверяемость:** все находки снабжены ссылками `файл:строка`.

---

_Отчёт подготовлен в рамках задачи аудита интерфейса и интеграций. Числовые метрики верифицированы на дату аудита; при рефакторинге пересчитать._
