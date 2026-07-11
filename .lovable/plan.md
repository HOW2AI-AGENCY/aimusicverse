
# План: MCP-расширение + аудит Telegram-интеграции

## Часть 1. Аудит Telegram-интеграции (без изменений кода)

Что уже есть в проекте (по факту сканирования):

- **Frontend TG-обвязка:** `src/contexts/telegram/` — 7 модулей, 1,53k LOC (Provider, DeepLinkHandler, hooks Init/Actions, mockWebApp, types).
- **Edge Functions TG (8 штук, ~4k LOC):** `telegram-bot`, `telegram-auth`, `telegram-webhook-setup`, `bot-api`, `send-telegram-notification` (1,1k LOC!), `queue/process/retry-telegram-notifications`, `tinkoff-create-bot-payment`.
- **152 файла** в `src/` импортируют `useTelegram`/`@twa-dev/sdk` или `TelegramContext`.
- **Таблицы в БД:** 13 `telegram_*` таблиц (bot_config, bot_logs, metrics, sessions, menu_items, menu_state, notification_queue, failed_notifications, rate_limits, voice_transcriptions, wizard_state, bot_metrics).

### Вердикт по «переходу на ванильное Lovable»

**Полный отказ от кастомного TG-бота не рекомендуется.** Причины:

1. **Аудитория проекта — Telegram-first.** Все флоу построены под Mini App: платежи через Telegram Stars, deep links, шаринг в Stories, native buttons. Уйти в чистый web — потерять весь дистрибуционный канал.
2. **Объём вложенного функционала:** 4k LOC edge-функций + 13 таблиц + очередь нотификаций с retry-логикой. Это не «легко переписать под встроенные Lovable-фичи» — у Lovable нет встроенного эквивалента (нет Stars-биллинга, TG-меню-редактора, notification queue).
3. **«Ванильное Lovable» = web-app.** Стандартный Lovable-паттерн — это Supabase Auth + edge functions. Он **уже используется под капотом**. TG-специфика (safe areas, MainButton, CloudStorage) — это тонкая надстройка, а не архитектурный анти-паттерн.

### Что реально стоит упростить (Sprint-worthy, не сейчас)

| Проблема | Что делать |
|---|---|
| `send-telegram-notification` 1,1k LOC — god-file | Декомпозировать по типам уведомлений (matches ADR-041 практике) |
| Дублирование `notification_queue` + `failed_notifications` + `retry` | Слить в один queue с полем `status`/`retry_count` |
| 13 `telegram_*` таблиц — часть overlap с `notifications`/`user_activity` | Аудит и мердж (`bot_logs` vs `telemetry_events`) |
| `useTelegramActions.ts` 531 LOC | Разбить по доменам (buttons / dialogs / sharing / storage) |
| Опубликовать **параллельно web-версию** на `music.how2ai.world` | Уже есть custom domain — просто заменить TG-only gates на graceful degrade (в основном `useTelegram()` возвращает mock, safe areas дают 0px) |

Веб-версия уже почти работает через `createMockWebApp`. Формально «двойная сборка» не нужна — один build, ветвление в рантайме.

**Итог:** оставить TG Mini App как основной канал, вложиться в web fallback (небольшие правки, не миграция), в отдельном спринте — рефактор god-file'ов и мердж таблиц. Никакой массовой миграции сейчас — риск сломать production ради архитектурной чистоты.

---

## Часть 2. Расширение MCP-сервера (реализация в build mode)

### Новые тулы

Все — авторизованные (OAuth issuer уже настроен). Каждый — отдельный файл в `src/lib/mcp/tools/`, реэкспорт в `src/lib/mcp/index.ts`.

#### A. Управление плейлистами (3 тула)

1. **`create_playlist`** — `{ name: string, description?: string, is_public?: boolean }` → INSERT в `playlists` с `user_id = ctx.getUserId()`, RLS-safe через bearer-forward.
2. **`add_track_to_playlist`** — `{ playlist_id, track_id }` → INSERT в `playlist_tracks` с проверкой владения плейлистом (RLS).
3. **`remove_track_from_playlist`** — `{ playlist_id, track_id }` → DELETE. `annotations.destructiveHint: true`.

#### B. Стемы и версии (3 тула, read-only)

4. **`get_track_stems`** — `{ track_id }` → SELECT из `track_stems` (vocals/drums/bass/other + URL). Проверка: трек либо публичный, либо принадлежит юзеру.
5. **`list_track_versions`** — `{ track_id }` → SELECT из `track_versions` (A/B, is_primary, version_label).
6. **`switch_active_version`** — `{ track_id, version_id }` → UPDATE `tracks.active_version_id` + `track_versions.is_primary` атомарно через RPC (использовать существующий паттерн из `useVersionSwitcher`). `destructiveHint: false, idempotentHint: true`.

#### C. Генерация треков (1 тул, с нюансами)

7. **`generate_track`** — самый сложный.
   - Input: `{ prompt: string, style?: string, is_instrumental?: boolean, model?: 'v4'|'v5' }`.
   - Проверки в handler: (a) `ctx.isAuthenticated()`, (b) баланс кредитов через `user_credits` (SELECT), (c) списание через RPC `secure_credit_update` (уже есть, соблюдает memory rule).
   - Инвокация: fetch на существующую edge-функцию `suno-music-generate` с `Authorization: Bearer ${ctx.getToken()}`.
   - Ответ: **не ждём завершения** (генерация асинхронная, 30–120s). Возвращаем `{ task_id, status: 'pending', poll_hint: 'Use get_generation_status with task_id' }` — соответствует правилу «MCP tool = синхронный request/response с timeout».
   - `annotations: { readOnlyHint: false, destructiveHint: false }` (тратит кредиты, но не удаляет данные).

8. **`get_generation_status`** — `{ task_id }` → SELECT из `generation_tasks` для polling'а.

### Обновление manifest

- `defineMcp.version`: `0.2.0` → `0.3.0`.
- Обновить `instructions` с описанием новых capabilities.
- Запустить `app_mcp_server--extract_mcp_manifest`.
- Задеплоить edge-функцию `mcp` через `supabase--deploy_edge_functions`.

### Безопасность

- Все тулы используют `getToken()` + bearer-forward — RLS работает как под юзерской сессией.
- `generate_track` **не принимает** `user_id` из input (memory rule: `isOwnTrack` validation).
- Никаких service-role ключей в MCP handler'ах.
- Не логируем токены.

## Технические детали

**Файлы к созданию:**
- `src/lib/mcp/tools/create-playlist.ts`
- `src/lib/mcp/tools/add-track-to-playlist.ts`
- `src/lib/mcp/tools/remove-track-from-playlist.ts`
- `src/lib/mcp/tools/get-track-stems.ts`
- `src/lib/mcp/tools/list-track-versions.ts`
- `src/lib/mcp/tools/switch-active-version.ts`
- `src/lib/mcp/tools/generate-track.ts`
- `src/lib/mcp/tools/get-generation-status.ts`

**Файлы к правке:**
- `src/lib/mcp/index.ts` — импорт + регистрация 8 новых тулов, bump version.

**Пост-действия:**
1. `app_mcp_server--extract_mcp_manifest` — валидация манифеста.
2. `supabase--deploy_edge_functions` с `function_names: ["mcp"]`.
3. Обновить `src/pages/Connect.tsx` — актуальный список capabilities.

**Что НЕ делаем в этом плане:**
- Никаких изменений в TG-коде (только аудит текстом).
- Никакой миграции на «ванильное Lovable».
- Никаких изменений схемы БД (все новые тулы работают с существующими таблицами).

## Проверка после реализации

- Изучить манифест `.lovable/mcp/manifest.json` — должно быть 15 тулов (7 старых + 8 новых).
- Проверить через `supabase--test_edge_functions` что `/functions/v1/mcp` отвечает 200 на `POST` с MCP `tools/list`.
- Открыть `/connect` в preview — актуальный список.
