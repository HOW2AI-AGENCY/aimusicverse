# Аудит и подготовка к миграции инфраструктуры

## Что уже известно о проекте
- **Frontend**: React 19 + Vite 6 + TypeScript, ~1042 компонента, ~439 хуков, 23 Zustand-стора, bundle ~508 KB gzip.
- **Backend**: Lovable Cloud (Supabase managed) — Postgres + Auth + Storage + Edge Functions (Deno).
- **Edge Functions**: 100+ функций в `supabase/functions/` (Suno API, Telegram bot, платежи Tinkoff, аналитика).
- **БД**: 100+ таблиц с RLS, кастомными функциями, триггерами, enums.
- **Интеграции**: Telegram Mini App SDK, Suno AI, Tinkoff Payments, Klangio, Replicate.
- **Клиент к БД**: жёстко зашитые `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` в `.env` + `src/integrations/supabase/client.ts` (автогенерируемый).

## Цель
Провести полный аудит зависимостей от Lovable Cloud и подготовить артефакты, необходимые для переноса на: (а) собственный Supabase self-hosted, либо (б) другой Postgres + Auth-провайдер (например Neon + Clerk/Auth.js) с сохранением функциональности.

## План работ

### Фаза 1 — Инвентаризация (только чтение, без изменений)
1. **Схема БД**: собрать полный дамп схемы через SQL — таблицы, колонки, FK, enums, sequences, custom indexes, RLS policies, функции (`pg_get_functiondef`), триггеры, extensions (`pg_extension`), cron jobs (`cron.job`), vault secrets (только имена).
2. **Auth**: собрать список пользователей (`auth.users`, `auth.identities` — count и структура), выявить используемые провайдеры (email/password, Google, Telegram).
3. **Storage**: перечислить бакеты (public/private), объём, типы файлов.
4. **Edge Functions**: инвентаризация всех функций в `supabase/functions/`, зависимостей (`Deno.env.get(...)`), CORS, verify_jwt из `supabase/config.toml`, shared-кода в `_shared/`.
5. **Секреты**: список требуемых env для функций (SUNO_API_KEY, TELEGRAM_BOT_TOKEN, TINKOFF_*, KLANGIO_*, REPLICATE_*, RESEND_*, LOVABLE_API_KEY и т.д.).
6. **Клиентские точки контакта**: скан `src/` на `supabase.from`, `supabase.functions.invoke`, `supabase.storage`, `supabase.auth`, `.channel` (Realtime), `import.meta.env.VITE_SUPABASE_*`.

### Фаза 2 — Артефакты миграции
Создать в репозитории `migration/` каталог с:
- `migration/README.md` — обзор процесса.
- `migration/schema.sql` — единый идемпотентный дамп схемы (extensions → enums → tables → sequences+setval → functions → triggers → indexes → RLS policies → GRANTs).
- `migration/data-export.md` — инструкции по экспорту данных (COPY per-table, порядок с учётом FK).
- `migration/auth-export.md` — как перенести `auth.users` (с bcrypt-хэшами `encrypted_password`) и `auth.identities`.
- `migration/storage-export.md` — стратегия переноса бакетов (rclone / signed URLs для private).
- `migration/edge-functions.md` — список функций, их зависимости, verify_jwt, required secrets, план деплоя на новую платформу (Supabase self-hosted / Deno Deploy / Cloudflare Workers).
- `migration/env.template` — шаблон `.env` для нового окружения (frontend + backend).
- `migration/client-abstraction.md` — план абстрагирования Supabase-клиента (см. Фаза 3).

### Фаза 3 — Абстракция клиента (подготовка кода, без смены провайдера)
Не переписываем API-слой, но снижаем связанность:
1. Ввести `src/config/backend.ts` — единая точка получения URL/ключей (сейчас читаются в 3+ местах).
2. Проверить, что все запросы идут через `src/api/*` (layer boundary уже enforced ESLint-правилом `no-restricted-syntax` для прямых `supabase.from`).
3. Задокументировать все Realtime-каналы и триггеры БД, от которых зависит UI — они самые «липкие» к Supabase.
4. Отметить edge-функции с `verify_jwt = false` (публичные webhooks — Tinkoff, Suno callbacks, Telegram) — они первыми переезжают и их URL надо будет обновить у внешних сервисов.

### Фаза 4 — Отчёт-риски
`migration/RISKS.md` со списком:
- Supabase-специфичные фичи: RLS, `auth.uid()`, `auth.jwt()`, security definer функции, `pg_net`, Storage RLS.
- Внешние webhooks (Suno callbacks, Tinkoff, Telegram) — требуют обновления URL на стороне провайдеров.
- Cron jobs (`pg_cron`) — если есть, переносятся вручную.
- Vault secrets — значения нельзя выгрузить, вводить заново.
- Telegram Bot — webhook URL надо переустановить (`setWebhook`).

## Что НЕ делаем в этом заходе
- Не создаём новый Supabase-проект и не запускаем перенос данных — это отдельный этап после утверждения плана и выбора целевой платформы.
- Не меняем работающий код клиента (только добавляем документацию и опционально `src/config/backend.ts`).
- Не трогаем `.env`, `client.ts`, `types.ts`, `config.toml` — они автогенерируемые.

## Технические детали

**Целевые платформы (нужно выбрать одну до Фазы 2):**
- **A. Supabase self-hosted** (Docker/Kubernetes) — минимум изменений в коде, полная совместимость RLS/Auth/Storage/Edge Functions.
- **B. Managed Supabase (собственный аккаунт)** — то же, что A, но у Supabase Inc.; проще всего.
- **C. Разделённый стек**: Postgres (Neon/Railway/RDS) + Auth (Clerk/Auth.js) + Object Storage (S3/R2) + Functions (Deno Deploy/Cloudflare Workers) — максимальная свобода, но требует переписывания auth-слоя и Storage-API.

**Инструменты для дампа схемы**: используем `supabase--read_query` (только SELECT) для инвентаризации без изменений БД. Для реального переноса — `pg_dump --schema-only` + `pg_dump --data-only` через собственный доступ к Postgres на новой инфре.

## Открытые вопросы к пользователю
1. **Куда мигрируем?** Вариант A / B / C выше — от этого зависит объём переписывания кода.
2. **Данные пользователей**: переносим всех пользователей и их треки, или только схему для чистого запуска?
3. **Storage-файлы**: сколько примерно ГБ занимает (обложки, аудио)? Важно для оценки времени переноса.
4. **Downtime**: допустим ли, или нужна zero-downtime миграция с двойной записью?

## Результат
После утверждения — репозиторий получит каталог `migration/` со всеми артефактами, готовыми к запуску переноса, и код будет минимально подготовлен (единая точка конфига бэкенда). Сам перенос — отдельный спринт после ответов на 4 вопроса выше.
