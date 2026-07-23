# Перенос Edge Functions (135 функций)

## Что мигрируется

- **135 функций** в `supabase/functions/*/index.ts` (по одной директории на функцию).
- **25 shared-модулей** в `supabase/functions/_shared/` (cors, auth, suno-клиент, tinkoff-клиент, telegram-utils, rate-limiter, audit log, response-utils, sanitize-filename, ai-prompts, economy, voice, models, feature-access, api-logger).
- Конфигурация `verify_jwt` per-функция — в `supabase/config.toml`. Значения по умолчанию: `verify_jwt = true` для user-triggered, `false` для webhook-ов.
- Deno runtime, зависимости через `npm:` specifiers и `https://deno.land/std@*/*`.

## Куда переносить

### A. Supabase self-hosted (проще всего)

```bash
supabase link --project-ref NEW_REF
supabase functions deploy --all
```

Все функции задеплоятся с сохранением `verify_jwt` из `config.toml`. `_shared/` подхватывается автоматически.

**Секреты**: `supabase secrets set --env-file migration/env.functions` (см. `env.template`).

### B. Deno Deploy

Требует минимальных изменений:

1. `deno.json` в корне каждой функции (или один общий) с import map.
2. Замена `Deno.env.get("X")` работает как есть (Deno Deploy тоже читает env).
3. **Придётся отказаться от `supabase.auth.getUser()` через SDK** — Supabase Auth завязан на JWKS Supabase-проекта. Либо (а) продолжать использовать Supabase Auth и валидировать JWT через его JWKS-endpoint из Deno Deploy, либо (б) переехать на Clerk/etc и переписать auth-middleware.
4. Callbacks придётся регистрировать на новые URL (`*.deno.dev`).

### C. Cloudflare Workers

Значительная работа (~2 недели):

- `Deno.env.get("X")` → `env.X` во всех 135 функциях.
- `npm:` specifiers → wrangler compat-flags + `nodejs_compat`.
- Файловые операции (`Deno.readFile`) — недоступны, использовать Workers KV/R2.
- Deno-специфичные API из `_shared/` (например `crypto.subtle` — совместимо; `TextEncoder` — совместимо) — пройдёт с минимальными правками, но `Deno.serve` заменить на `export default { fetch }`.

## Требуемые секреты (заполнить в `env.template`)

```
SUNO_API_KEY
SUNO_WEBHOOK_SECRET
LOVABLE_API_KEY               # или замена: OPENAI_API_KEY / ANTHROPIC_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_USERNAME
TELEGRAM_APP_SHORT_NAME
TELEGRAM_BOT_MINIAPP_URL
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_WEBHOOK_SECRET_TOKEN
TELEGRAM_CHANNEL_USERNAME
TELEGRAM_NEWS_CHANNEL
TELEGRAM_SUPPORT_USERNAME
TINKOFF_TERMINAL_KEY
TINKOFF_SECRET_KEY
KLANGIO_API_KEY
REPLICATE_API_KEY
FAL_API_KEY
AUDD_API_KEY
CRON_SECRET
MINI_APP_URL
ENVIRONMENT                   # production / staging
```

**Автоматически провайдится Supabase-платформой** (не задавать вручную на Supabase, но задать явно на Deno Deploy/Workers):

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Функции с `verify_jwt = false` (публичные)

Все webhook и системные scheduled-функции — они первыми переезжают, так как их URL зашит у внешних провайдеров:

```
telegram-auth, telegram-bot, telegram-webhook-setup
suno-music-callback, suno-vocal-callback, suno-cover-callback,
suno-wav-callback, suno-video-callback, suno-voice-validate-callback,
suno-voice-generate-callback, lyrics-callback
tinkoff-webhook
send-telegram-notification, suno-send-audio
cleanup-stale-tasks, cleanup-orphaned-data, cleanup-old-data,
sync-stale-tasks, retry-failed-tasks, health-check, health-alert,
audit-log, process-audio-pipeline, create-notification,
generate-track-cover, separate-reference-stems, reward-action
```

**Действия после переезда** (обязательные):

1. Telegram Bot: `curl https://api.telegram.org/bot<TOKEN>/setWebhook -d url=NEW/functions/v1/telegram-bot -d secret_token=<TELEGRAM_WEBHOOK_SECRET>`
2. Suno API: обновить 7 callback URL в панели Suno на `https://NEW_HOST/functions/v1/suno-*-callback`
3. Tinkoff: обновить Notification URL на `https://NEW_HOST/functions/v1/tinkoff-webhook`
4. Планировщик (cron) для `cleanup-*`, `retry-*`, `health-*`, `stars-subscription-check`: настроить cron-задачи (Supabase Cron, GitHub Actions, cron-job.org).

## `_shared/supabase-client.ts`

Использует `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` для service-role клиента. Если БД остаётся на Supabase (self-hosted/managed) — только сменить env. Если БД становится «чистым» Postgres — переписать под `postgres.js` или `pg` и убрать всё, что специфично для Supabase (Realtime broadcast, Storage-хелперы, auth.admin).

## `_shared/telegram-utils.ts`

Читает `TELEGRAM_BOT_TOKEN` — переносится без изменений.

## `_shared/tinkoff.ts`

Читает `TINKOFF_TERMINAL_KEY` + `TINKOFF_SECRET_KEY`, генерирует подпись SHA-256 — переносится без изменений.

## `_shared/suno.ts`

Читает `SUNO_API_KEY`, `SUNO_WEBHOOK_SECRET`, все callback URL строятся от `SUPABASE_URL` — при переезде callback-хосты автоматически подхватываются из `SUPABASE_URL`, но у Suno в панели URL надо обновить руками.

## Тестирование после деплоя

Есть готовые auth-тесты в `supabase/functions/*/auth_test.ts` (см. `_shared/auth-test-utils.ts`). Запустить локально:

```bash
deno test --allow-net supabase/functions/ --filter auth
```

Плюс smoke-набор:

- `curl -X POST NEW/functions/v1/health-check` → 200
- `curl -X POST NEW/functions/v1/telegram-auth -d '{"initData":"..."}'` → session
- Триггернуть генерацию из UI → дождаться `suno-music-callback` → проверить, что трек появился в `tracks`.
