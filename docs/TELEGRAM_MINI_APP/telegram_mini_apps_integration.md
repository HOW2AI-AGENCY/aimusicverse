# Advanced Telegram Mini Apps Integration Guide

> Concise practical summary of advanced Telegram Mini Apps and Bot API 9.0–9.2 capabilities for MusicVerse. Based on official Telegram specs and adapted to the React + Supabase stack.

## 1. Архитектура взаимодействия

- **Клиент (Mini App):** React 19 + TypeScript, инициализация через `Telegram.WebApp`.
- **Бот:** Supabase Edge Functions отвечают за webhooks, платежи Stars, подарки и подготовленные сообщения.
- **Telegram:** Передаёт `initData` (подписанные данные пользователя) и запускает Mini App в веб-контейнере.

### Последовательность запуска
1. Telegram открывает Mini App с `initData`.
2. Клиент вызывает `/telegram-auth` (Edge Function), выполняется HMAC-SHA256 проверка подписи.
3. Бэкенд создаёт/обновляет профиль, выдаёт JWT, клиент сохраняет сессию.
4. Для действий пользователя Mini App вызывает Bot API через Edge Functions (answerWebAppQuery, sendInvoice, sendGift и др.).

## 2. Ключевые методы Bot API (9.0–9.2)

- **`answerWebAppQuery`** — отправка результата из Mini App обратно в чат/inline.
- **`sendInvoice`** (currency `XTR`) — платёж Stars без provider_token.
- **`refundStarPayment`** — возврат платежей Stars.
- **`sendGift`** — отправка подарка пользователю (включая текст/форматирование).
- **`postBusinessStory`** — публикация сториз для бизнес-аккаунта.
- **`savePreparedInlineMessage`** — подготовленные сообщения для быстрого re-send.

## 3. Telegram.WebApp API: основные группы

### Управление окном
- `ready()`, `expand()`, `close()`, `viewportChanged` — полноэкранный режим и отслеживание высоты.

### Кнопки
- `MainButton` / `SecondaryButton` / `BackButton` / `SettingsButton` — текст, прогресс, события `mainButtonClicked`, `backButtonClicked`.

### Хранилища
- `CloudStorage` — синхронизируемые ключи/значения.
- `DeviceStorage` — локальное хранилище (~5 MB).
- `SecureStorage` — шифрованное хранилище (до 10 элементов) для токенов/секретов.

### Сенсоры и устройства
- `Accelerometer`, `Gyroscope`, `DeviceOrientation`, `LocationManager` — старт/стоп, `refresh_rate`, обработка `on('update', ...)`.

### Платежи и подарки
- `openInvoice` / `sendInvoice` — Telegram Stars.
- `sendGift` — подарки с текстом и реферальными сценариями.

### Медиа и истории
- `shareToStory` / `openTelegramLink` — публикация историй и шаринг.
- `downloadFile` — загрузка медиа в Mini App.

## 4. Интеграция Mini App ↔ Bot

- **Web App Query Flow:** Mini App формирует payload → `answerWebAppQuery` → сообщение в чате.
- **Подготовленные сообщения:** Mini App вызывает Edge Function → `savePreparedInlineMessage` → пользователь отправляет заготовку позже.
- **Платежи Stars:** Mini App вызывает `/create-stars-invoice` → `sendInvoice` → `successful_payment` webhook → разблокировка контента.
- **Подарки:** список через `getAvailableGifts`, отправка через `sendGift`, можно использовать в реферальных кампаниях.

## 5. Сохранение данных: примеры

```ts
// Облако (кросс-девайс)
await Telegram.WebApp.CloudStorage.setItem('saved_music', JSON.stringify(track));

// Локальный кэш
await Telegram.WebApp.DeviceStorage.setItem('recent', {
  key: 'last_track',
  value: track.id,
});

// SecureStorage (токены)
await Telegram.WebApp.SecureStorage.saveKey('auth', 'refresh_token', refreshToken);
```

## 6. Пример: музыкальный магазин с оплатой Stars

1. Пользователь выбирает тариф в Mini App (`/pricing`).
2. Клиент вызывает Edge Function `create-stars-invoice` → `sendInvoice` с currency `XTR`.
3. Telegram показывает платёжный экран, после `successful_payment` бот вызывает Supabase RPC для активации подписки.
4. Mini App через WebSocket/RT query получает обновлённый статус подписки.

## 7. Пример: отправка подарка и сториз

```ts
// Подарок
await bot.sendGift(userId, giftId, {
  text: 'Congrats! 🎁',
  text_parse_mode: 'HTML',
});

// Story из Mini App
Telegram.WebApp.shareToStory(mediaUrl, {
  text: 'Check this out!',
  widget_link: { url: 'https://app.musicverse.ai', name: 'Open' },
});
```

## 8. Чек-лист продакшн-запуска

- [ ] Включён HTTPS и корректный `mini_app_url` в BotFather.
- [ ] `initData` валидируется HMAC на бэкенде; тайм-аут подписи ≤ 24 ч.
- [ ] CSP разрешает `https://*.telegram.org` и Supabase домены.
- [ ] Payments Stars: тестовый плательщик, обработка `successful_payment` и `refundStarPayment`.
- [ ] Подарки: UI выбора, обработка ошибок `sendGift`.
- [ ] Stories: `shareToStory` протестирован на iOS/Android.
- [ ] Сенсоры: graceful degradation при отсутствии разрешений.
