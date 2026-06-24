# План: «Всё время» в админ-аналитике + проверка Telegram-бота

## 1. Аналитика «За всё время»

**Проблема.** На `/admin/analytics` в селекторе периода доступны только `24 часа / 7 / 30 / 90 дней`. RPC-функции (`get_telemetry_stats`, `get_error_trends`, `get_generation_analytics`) принимают строку Postgres `interval`, поэтому опции «всё время» нет, и часть карточек выглядит пустой у новых установок без свежих событий.

**Что меняем (frontend-only, без правок RPC):**

- `src/components/admin/analytics/AnalyticsDashboard.tsx`
  - Расширить тип `TimePeriod` значением `'all'`.
  - Добавить `<SelectItem value="all">Всё время</SelectItem>` (после «90 дней»).
  - При передаче в хуки маппить `'all' → '100 years'` (валидный Postgres `interval`, фактически = «всё время»). Для `deeplinkTimeRange` использовать `'30d'` как fallback (компонент принимает только `24h|7d|30d`) и в подписи показывать «Всё время».
  - В `ComparisonPanel` / экспорт CSV пробрасывать читаемое название `"all_time"`.

- `src/components/admin/analytics/ComparisonPanel.tsx` (если завязан на `TimePeriod`) — расширить тип и скрыть блок «сравнение с предыдущим периодом» при `all`, т.к. сравнивать не с чем.

- Дополнительно убедиться, что `AdminOverview` (`StatGrid` с пользователями/треками/проектами) уже показывает all-time агрегаты через `useAdminStats` — править не нужно.

**Acceptance.** В селекторе появляется «Всё время»; графики/таблицы заполняются данными за весь период; экспорт CSV содержит `all_time` в имени файла; ошибок в консоли нет.

## 2. Интеграция с Telegram-ботом

**Текущее состояние.**
- В воркспейсе есть подключение **MUSICVERSE TG BOT** (connector `telegram`, gateway), но **оно не привязано к проекту** (`is linked to project: no`).
- 20+ edge-функций (`telegram-bot`, `send-telegram-notification`, `stars-webhook`, `suno-send-audio`, `bot-api`, …) читают **`TELEGRAM_BOT_TOKEN`** напрямую (не через gateway). То есть для текущего кода нужна не привязка коннектора, а наличие секрета `TELEGRAM_BOT_TOKEN`.

**Что делаем:**

1. **Привязать коннектор MUSICVERSE TG BOT к проекту** через `standard_connectors--connect` (connector_id: `telegram`). Это даст переменные `TELEGRAM_API_KEY` + `LOVABLE_API_KEY` для gateway-вызовов и снимет вопрос «настроена ли интеграция» на уровне Lovable.
2. **Проверить наличие секрета `TELEGRAM_BOT_TOKEN`** (`secrets--fetch_secrets`). Если его нет — запросить у пользователя через `secrets--add_secret` (нужен для всех уже задеплоенных функций бота).
3. **Проверить webhook бота**: вызвать через gateway `POST https://connector-gateway.lovable.dev/telegram/getWebhookInfo` и убедиться, что `url` указывает на `https://<project>.functions.supabase.co/telegram-webhook` и `pending_update_count` в норме. Если webhook не настроен / указывает не туда — выполнить `setWebhook` (есть готовая функция `telegram-webhook-setup`).
4. Сообщить пользователю итог: статус подключения, наличие токена, корректность webhook.

**Никаких новых таблиц, миграций и переписывания существующих функций бота не делаем** — только привязка коннектора, проверка секрета и webhook.

## Технические детали

```text
AnalyticsDashboard
  timePeriod: '24 hours' | '7 days' | '30 days' | '90 days' | 'all'
  ↓ map
  rpcPeriod = timePeriod === 'all' ? '100 years' : timePeriod
  ↓
  useTelemetryStats(rpcPeriod)
  useErrorTrends(rpcPeriod)
  useGenerationAnalytics(rpcPeriod === '100 years' ? '90 days' : rpcPeriod)
```

Telegram-проверка (sandbox, build mode):

```bash
curl -sS https://connector-gateway.lovable.dev/telegram/getWebhookInfo \
  -H "Authorization: Bearer $LOVABLE_API_KEY" \
  -H "X-Connection-Api-Key: $TELEGRAM_API_KEY" \
  -H 'Content-Type: application/json' -d '{}'
```

## Файлы

- edit: `src/components/admin/analytics/AnalyticsDashboard.tsx`
- edit (если нужно): `src/components/admin/analytics/ComparisonPanel.tsx`
- ops: `standard_connectors--connect` (telegram), `secrets--fetch_secrets`, gateway-вызов `getWebhookInfo`
