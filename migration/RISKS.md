# Риски и Supabase-специфика

## 1. Auth-слой — самая сложная часть переноса

`auth.users` содержит **1077 пользователей**. Пароли хранятся как bcrypt-хэши в `encrypted_password`. Их можно перенести **только на другой Supabase (Auth v2)** — bcrypt-хэши бинарно совместимы. При миграции на Clerk/Auth.js/Firebase хэши **не переносятся**: придётся или (а) заставить всех сбросить пароль, или (б) хранить старые хэши в отдельной колонке и валидировать на первом входе (custom credentials provider).

**Telegram-аутентификация** идёт через кастомный edge fn `telegram-auth`, который валидирует `initData` от Telegram WebApp и создаёт сессию через `supabase.auth.admin.createUser` + magic-link/token. Если уходим не на Supabase — нужен эквивалент через Clerk (custom auth flow) или Auth.js (credentials provider).

`auth.identities` **обязательно** переносить вместе с `auth.users`, иначе session refresh и recovery ломаются.

## 2. RLS-политики (279 штук) — тонкая связка с `auth.uid()` и `auth.jwt()`

Все политики опираются на функции:
- `auth.uid()` — id текущего пользователя из JWT.
- `auth.jwt()` — весь payload.
- `public.has_role(uid, 'admin')` — проверка ролей (security definer, читает `public.user_roles`).

**Если уходим с Supabase**, нужен PostgREST-совместимый слой JWT-инъекции роли, ИЛИ полный перевод авторизации в приложение (drop RLS, все проверки в API-слое). Второй вариант — большая работа: ~279 политик → ~279 middleware-проверок.

## 3. Realtime — 26 файлов клиента зависят от Postgres Changes

Supabase Realtime = отдельный сервис на `postgres_changes`/replication slot. Аналоги:
- **Supabase self-hosted** — работает из коробки.
- **Neon/RDS + свой websocket-сервер** (Soketi, Ably, Pusher) — потребует переписать все `.channel()` вызовы.
- **Polling** — деградация UX, не рекомендую.

Каналы, которые нельзя терять:
- Прогресс генерации (Suno callbacks → `generation_tasks` → Realtime → UI).
- Уведомления (`notifications` → toast/badge).
- Стемы, replace-section, extend, add-vocals — все progress-хуки.

## 4. Storage — 25.6 GB, из них 25 GB публичных обложек

- `project-assets` (25 GB, public) — публичные URL зашиты в `tracks.cover_url`, `music_projects.cover_url`, JSONB-поля в `audio_analysis`, `guitar_recordings`, `voice_events` и т.д.
- **Каждый URL после переезда изменит хост**. Нужно:
  1. Переименовать хост в URL всех text/jsonb колонок (`REPLACE(col, 'ygmvthybdrqymfsqifmj.supabase.co', 'NEW_HOST')`).
  2. Или хранить только `bucket/path` и склеивать URL на клиенте (правильно, но потребует изменений в API-слое).
- **Приватные бакеты** (`reference-audio`, `voice-sources`, `audio`, `stems`) — signed URLs имеют TTL, генерируются на клиенте — просто пересоздадутся после смены Supabase.

## 5. Edge Functions — 135 функций на Deno

**Куда переносим:**
- Supabase self-hosted — деплой без изменений (`supabase functions deploy --all`).
- **Deno Deploy** — совместимо, но CORS/auth-шеринг с `_shared/` требует `deno.json` с import map (сейчас функции используют `npm:` specifiers). Стоимость: платно после 100k req/day.
- **Cloudflare Workers** — потребует переписывания на Web Standard runtime (fetch API есть, но `Deno.env.get` → `env.VAR`, npm-спецификсы — через wrangler compat). ~2 недели работы.

**Специфика `_shared/supabase-client.ts`**: создаёт клиент с `SUPABASE_URL` + `SERVICE_ROLE_KEY`. Если БД на другой инфре, `service_role` заменяется на прямой Postgres-connection-string (`postgres.js` / `pg`), а Supabase-клиент становится не нужен — переписать `_shared/` в первую очередь.

## 6. Внешние webhooks — обязательное действие после переезда

| Провайдер | Что менять | Где менять |
|-----------|-----------|-----------|
| Telegram Bot | Webhook URL + `secret_token` | `setWebhook` API |
| Suno | 7 callback URL (music, vocal, cover, wav, video, voice-validate, voice-generate, lyrics) | Панель Suno API |
| Tinkoff | Notification URL | Кабинет Тинькофф |
| Telegram Stars | Автоматически через Bot webhook | — |

**Стратегия**: сначала поднять новый бэкенд с публичными URL, потом одновременно переключить все webhook и переустановить `MINI_APP_URL`/`TELEGRAM_BOT_MINIAPP_URL`.

## 7. Vault Secrets — не выгружаются

`supabase_vault` расширение установлено, но значения секретов через `SELECT * FROM vault.secrets` **не возвращаются** (только имена). Все секреты вводятся заново на новой инфре. Скрипт для инвентаризации имён — в [`edge-functions.md`](./edge-functions.md).

## 8. Cron-задачи

`pg_cron` **не включён**. Периодические задачи (`cleanup-old-data`, `retry-failed-tasks`, `health-check`, `cleanup-stale-tasks`, `archive-old-activities`, `stars-subscription-check`) сейчас выполняются либо через Supabase Cron UI (managed), либо через внешний планировщик — **проверить у пользователя**. После переезда планировать через:
- Supabase Scheduled Functions (self-hosted).
- GitHub Actions cron.
- `cron-job.org` / EasyCron.
- Свой worker.

## 9. Клиент — минимальная связка

`src/integrations/supabase/client.ts` жёстко использует `@supabase/supabase-js` и переменные `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`. Абстракции над клиентом нет.

- **Уход на другой Supabase**: только сменить `.env` — код не трогать.
- **Уход с Supabase**: переписать 33 API-модуля + 26 Realtime-хуков + `AuthContext` + Storage-вызовы. Оценка: 2–3 недели fullstack-работы.

## 10. Downtime и стратегия

Абсолютный минимум простоя:
1. Настроить новую инфру и запустить полный dry-run миграции на тестовой БД.
2. Заморозить продакшн (readonly в UI).
3. Дельта-дамп + импорт (не полный дамп — только новое от последнего snapshot).
4. Переключить DNS/URL и webhook.
5. Разморозить.

Реалистичный downtime при 25 GB storage + 1077 пользователей: **1–3 часа**.
