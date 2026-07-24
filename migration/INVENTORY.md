# Inventory — снимок текущей системы

Собрано `2026-07-23` через `supabase--read_query` (SELECT-only) и статический скан `supabase/functions/` + `src/`.

## Frontend

| Метрика                            | Значение                                 |
| ---------------------------------- | ---------------------------------------- |
| Стек                               | React 19.2 + TypeScript 5.9 + Vite 6.4.3 |
| Компонентов                        | ~1042                                    |
| Хуков                              | ~439                                     |
| Zustand-сторов                     | 23                                       |
| API-слоёв (`src/api/*`)            | 32                                       |
| Сервисов                           | 62                                       |
| Страниц                            | 71                                       |
| Bundle (gzip, eager)               | ~508 KB                                  |
| Точек входа в БД (`supabase.from`) | 33 модуля                                |
| Файлов с Realtime-подписками       | 26                                       |

**Клиент к БД**: `src/integrations/supabase/client.ts` (автогенерируется). Читает `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` из `.env`.

## База данных (Postgres)

| Категория                         | Количество                               |
| --------------------------------- | ---------------------------------------- |
| Таблицы (`public`)                | **105**                                  |
| RLS-политик                       | **279**                                  |
| Custom-функций (`public`)         | **115**                                  |
| Триггеров (public+auth)           | 0 (все триггеры служебные `pg_%`/`RI_%`) |
| Enum-типов                        | **9**                                    |
| Кастомных индексов                | **328**                                  |
| Sequences (кроме identity/serial) | 0                                        |

**Расширения**: `pg_stat_statements`, `pgcrypto`, `supabase_vault`, `uuid-ossp`.
Обязательные при развёртывании: `pgcrypto`, `uuid-ossp`. `supabase_vault` — только если используются Supabase Vault Secrets. `pg_stat_statements` — опционально (диагностика).

**Cron jobs (`pg_cron`)**: не используются.
**Vault secrets**: см. отдельный запрос перед миграцией (`SELECT name FROM vault.secrets`).

Ключевые таблицы (см. `<supabase-tables>` в CLAUDE.md для полного списка):

- Пользовательские: `profiles`, `user_roles`, `user_credits`, `user_notification_settings`, `user_onboarding`, `user_streaks`, `user_generation_stats`.
- Контент: `tracks`, `track_versions`, `track_stems`, `track_analytics`, `music_projects`, `project_tracks`, `playlists`, `artists`, `blog_posts`.
- Генерация: `generation_tasks`, `stem_separation_tasks`, `video_generation_tasks`, `audio_analysis`, `guitar_recordings`.
- Соц: `comments`, `track_likes`, `user_follows`, `notifications`.
- Платежи: `stars_transactions`, `payment_transactions`, `tinkoff_subscriptions`, `subscription_history`, `stars_products`, `promo_codes`.
- Telegram: `telegram_bot_config`, `telegram_menu_items`, `telegram_notification_queue`, `telegram_voice_transcriptions`, ~10 других.
- Инфра: `error_logs`, `performance_metrics`, `rum_metrics`, `health_alerts`, `content_audit_log`, `feature_flags`.

## Auth

| Показатель                   | Значение                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Пользователей в `auth.users` | **1077**                                                                                              |
| Провайдеры                   | `email`, `telegram` (через кастомный `telegram-auth` edge fn), Google (через `configure_social_auth`) |
| Основной путь входа          | Telegram Mini App (WebApp initData) → `supabase/functions/telegram-auth` создаёт session              |

## Storage

Всего: **13 бакетов**, **8481 объект**, **≈25.6 GB**.

| Bucket                                                                                                                      | Public | Objects | Size                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ------ | ------- | --------------------------------------------- |
| `project-assets`                                                                                                            | ✅     | 8203    | **25 GB** — обложки, обрезки, публичные аудио |
| `reference-audio`                                                                                                           | ❌     | 120     | 344 MB                                        |
| `avatars`                                                                                                                   | ✅     | 136     | 226 MB                                        |
| `audio`                                                                                                                     | ❌     | 19      | 8.2 MB                                        |
| `voice-sources`                                                                                                             | ❌     | 1       | 9 MB                                          |
| `project-banners`                                                                                                           | ✅     | 2       | 2.4 MB                                        |
| остальные (`audio-references`, `bot-assets`, `broadcast`, `midi`, `project-assets-private`, `stems`, `voice-verifications`) | mix    | 0       | пусты                                         |

## Edge Functions

**Всего**: 135 функций в `supabase/functions/` + 25 shared-модулей в `_shared/`.

Категории:

- **Suno API**: `suno-*` (~40 функций) — генерация, extend, cover, remix, стемы, MIDI, video, voice-clone, persona, callbacks.
- **Telegram**: `telegram-bot`, `telegram-auth`, `telegram-webhook-setup`, `bot-api`, `send-telegram-notification`, `queue-telegram-notification`, `process-telegram-queue`, `retry-telegram-notifications`, `stars-webhook`.
- **Платежи**: `tinkoff-create-payment`, `tinkoff-create-bot-payment`, `tinkoff-recurrent-charge`, `tinkoff-webhook`, `create-stars-invoice`, `stars-*` (admin, subscription).
- **AI-ассистенты**: `ai-blog-assistant`, `ai-lyrics-assistant`, `ai-lyrics-edit`, `generate-lyrics`, `correct-text`.
- **Аудио-анализ**: `analyze-audio`, `analyze-audio-flamingo`, `analyze-music-emotion`, `analyze-reference-audio`, `analyze-track-context`, `klangio-analyze`, `melody-to-tags`, `detect-beats`, `recognize-music`, `recognize-lyrics`, `transcribe-midi`, `transcribe-lyrics`, `speech-to-text`, `extract-lyrics-from-stem`.
- **Медиа-генерация**: `generate-cover-image`, `generate-artist-portrait`, `generate-playlist-cover`, `generate-blog-cover`, `generate-track-cover`, `generate-profile-image`, `generate-thumbnails`, `generate-image`, `stability-audio-cover`.
- **Replicate**: `replicate-*` (upscale, watermark, MIDI, music-analysis).
- **Обслуживание**: `cleanup-*`, `retry-*`, `health-*`, `audit-log`, `moderate-content`, `archive-old-activities`.

**Секреты, требуемые функциями** (сорт по имени):

```
AUDD_API_KEY                     — распознавание музыки
CRON_SECRET                      — защита периодических задач
ENVIRONMENT                      — 'production' / 'staging'
FAL_API_KEY                      — Fal.ai (image gen)
KLANGIO_API_KEY                  — Klangio MIDI transcription
LOVABLE_API_KEY                  — Lovable AI Gateway (chat, TTS, embeddings)
MINI_APP_URL                     — deep-link домен Mini App
REPLICATE_API_KEY                — Replicate.com
SUNO_API_KEY                     — Suno AI
SUNO_WEBHOOK_SECRET              — проверка callback от Suno
SUPABASE_ANON_KEY                — авто (провайдер)
SUPABASE_SERVICE_ROLE_KEY        — авто (провайдер)
SUPABASE_URL                     — авто (провайдер)
TELEGRAM_APP_SHORT_NAME          — короткое имя Mini App
TELEGRAM_BOT_MINIAPP_URL         — базовый URL Mini App
TELEGRAM_BOT_TOKEN               — токен бота (@BotFather)
TELEGRAM_BOT_USERNAME            — юзернейм бота
TELEGRAM_CHANNEL_USERNAME        — канал новостей
TELEGRAM_NEWS_CHANNEL            — резервное имя канала
TELEGRAM_SUPPORT_USERNAME        — юзернейм поддержки
TELEGRAM_WEBHOOK_SECRET          — проверка X-Telegram-Bot-Api-Secret-Token
TELEGRAM_WEBHOOK_SECRET_TOKEN    — альтернативное имя того же секрета
TINKOFF_SECRET_KEY               — приватный ключ Тинькофф-эквайринга
TINKOFF_TERMINAL_KEY             — публичный terminal key
VITE_SUPABASE_PUBLISHABLE_KEY    — auto (для внутренних вызовов)
VITE_SUPABASE_URL                — auto
```

Итого: **~19 пользовательских секретов** (без 3 авто-Supabase и 2 auto-VITE_*).

## Внешние webhook-эндпоинты (входящие)

Функции с `verify_jwt = false` (см. `supabase/config.toml`) — публичные, зарегистрированы у внешних провайдеров и потребуют обновления URL после миграции:

| Функция                                       | Внешний провайдер  | Действие после миграции                                                          |
| --------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| `telegram-auth`                               | Telegram WebApp    | обновить `MINI_APP_URL`                                                          |
| `telegram-bot`                                | Telegram Bot API   | `setWebhook` с новым URL + `secret_token`                                        |
| `telegram-webhook-setup`                      | внутренний         | вызвать один раз                                                                 |
| `suno-music-callback`                         | Suno               | обновить callback URL в панели Suno                                              |
| `suno-vocal-callback`                         | Suno               | ↑                                                                                |
| `suno-cover-callback`                         | Suno               | ↑                                                                                |
| `suno-wav-callback`                           | Suno               | ↑                                                                                |
| `suno-video-callback`                         | Suno               | ↑                                                                                |
| `suno-voice-validate-callback`                | Suno               | ↑                                                                                |
| `suno-voice-generate-callback`                | Suno               | ↑                                                                                |
| `lyrics-callback`                             | Suno               | ↑                                                                                |
| `tinkoff-webhook`                             | Тинькофф-эквайринг | обновить Notification URL в кабинете Тинькофф                                    |
| `stars-webhook`                               | Telegram Stars     | часть Bot API — обновится вместе с bot webhook                                   |
| `send-telegram-notification`                  | внутренний         | —                                                                                |
| `suno-send-audio`                             | внутренний         | —                                                                                |
| `retry-failed-tasks`, `cleanup-*`, `health-*` | scheduled          | требуют внешнего cron-планировщика (Supabase Cron, GitHub Actions, cron-job.org) |

## Client → Supabase точки контакта

- **Realtime подписки (`supabase.channel`)** — 26 файлов:
  `NotificationContext`, `useGenerationRealtime`, `useGenerationResult`, `useStemSeparationRealtime`, `useReplaceSectionRealtime`, `useExtendProgress`, `useAddVocalsProgress`, `useAddInstrumentalProgress`, `useReplaceSectionProgress`, `useProgressTracking`, `useVideoGenerationStatus`, `useTracks`, `useTrackCounts`, `useAchievementNotifications`, `useProjects`, `useProjectTracks`, `useCustomVoices`, `useVoiceCloneWizard`, `useProjectTrackSync`, `studio-realtime.api`, `studio-generation.api`, `batch.api`, `presets.api`, `analytics.api`, `generation.api`, `smart-alerts.service`.
- **Прямой БД-доступ** — в 33 модулях (top-10 по количеству вызовов): `studio-generation.api`(19), `useTrackActions`(10), `analytics.api`(10), `admin.api`(10), `AudioAnalysisService`(9), `useAdminUsers`(9), `useAdminModerationReports`(9), `projects.api`(9), `useEnhancedAnalytics`(8), `AuthContext`(8).
- **Auth**: `src/contexts/AuthContext.tsx` — использует `supabase.auth.getSession`, `onAuthStateChange`, `signOut`. Кастомный signup — через edge fn `telegram-auth`.
- **Storage**: `supabase.storage.from(bucket).upload/getPublicUrl/createSignedUrl` — используется в ~15 местах (загрузка аватаров, обложек, референсов, стемов).
