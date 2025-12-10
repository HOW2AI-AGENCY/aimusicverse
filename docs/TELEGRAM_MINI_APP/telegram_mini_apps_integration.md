# Advanced Telegram Mini Apps Integration Guide

> Concise practical summary of advanced Telegram Mini Apps and Bot API 9.0–9.2 capabilities for MusicVerse. Based on official Telegram specs and adapted to the React + Supabase stack.

## 1. Interaction architecture

- **Client (Mini App):** React 19 + TypeScript, initialized via `Telegram.WebApp`.
- **Bot:** Supabase Edge Functions handle webhooks, Stars payments, gifts, and prepared messages.
- **Telegram:** Provides signed `initData` and launches the Mini App container.

### Startup sequence
1. Telegram opens the Mini App with `initData`.
2. The client calls `/telegram-auth` (Edge Function) and validates the HMAC-SHA256 signature.
3. The backend creates/updates the profile, issues a JWT, and the client stores the session.
4. For user actions the Mini App calls Edge Functions that in turn call Bot API (`answerWebAppQuery`, `sendInvoice`, `sendGift`, etc.).

## 2. Key Bot API methods (9.0–9.2)

- **`answerWebAppQuery`** — send Mini App results back to chat/inline.
- **`sendInvoice`** (`currency: 'XTR'`) — Stars payments without `provider_token`.
- **`refundStarPayment`** — Stars refunds.
- **`sendGift`** — send a gift with text/formatting.
- **`postBusinessStory`** — publish business stories.
- **`savePreparedInlineMessage`** — prepared messages for quick reuse.

## 3. Telegram.WebApp API: main groups

### Window control
- `ready()`, `expand()`, `close()`, `viewportChanged` — fullscreen and viewport height handling.

### Buttons
- `MainButton` / `SecondaryButton` / `BackButton` / `SettingsButton` — text, progress, `mainButtonClicked`, `backButtonClicked`.

### Storage
- `CloudStorage` — synced key/value pairs.
- `DeviceStorage` — local storage (~5 MB).
- `SecureStorage` — encrypted storage (up to 10 items) for secrets/tokens.

### Sensors and device
- `Accelerometer`, `Gyroscope`, `DeviceOrientation`, `LocationManager` — start/stop, `refresh_rate`, `on('update', ...)`.

### Payments and gifts
- `openInvoice` / `sendInvoice` — Telegram Stars.
- `sendGift` — gifts with text and referral scenarios.

### Media and stories
- `shareToStory` / `openTelegramLink` — publish stories and share links.
- `downloadFile` — download media inside the Mini App.

## 4. Mini App ↔ Bot integration

- **Web App Query flow:** Mini App forms a payload → `answerWebAppQuery` → message in chat.
- **Prepared messages:** Mini App calls an Edge Function → `savePreparedInlineMessage` → user sends later.
- **Stars payments:** Mini App calls `/create-stars-invoice` → `sendInvoice` → `successful_payment` webhook → unlock content.
- **Gifts:** list via `getAvailableGifts`, send via `sendGift`, usable for referral campaigns.

## 5. Data storage examples

```ts
// Cloud (cross-device)
await Telegram.WebApp.CloudStorage.setItem('saved_music', JSON.stringify(track));

// Local cache
await Telegram.WebApp.DeviceStorage.setItem('last_track', track.id);

// SecureStorage (tokens)
await Telegram.WebApp.SecureStorage.saveKey('auth', 'refresh_token', refreshToken);
```

## 6. Example — music shop with Stars payments

1. User selects a plan in the Mini App (`/pricing`).
2. Client calls the `create-stars-invoice` Edge Function → `sendInvoice` with currency `XTR`.
3. Telegram shows the payment screen; after `successful_payment` the bot calls a Supabase RPC to activate the subscription.
4. The Mini App receives the updated subscription state via WebSocket/RT query.

## 7. Example — gift sending and stories

```ts
// Gift
await bot.sendGift(userId, giftId, {
  text: 'Congrats! 🎁',
  text_parse_mode: 'HTML',
});

// Story from Mini App
Telegram.WebApp.shareToStory(mediaUrl, {
  text: 'Check this out!',
  widget_link: { url: 'https://app.musicverse.ai', name: 'Open' },
});
```

## 8. Production checklist

- [ ] HTTPS enabled and correct `mini_app_url` set in BotFather.
- [ ] `initData` validated via HMAC on backend; signature TTL ≤ 24h.
- [ ] CSP allows `https://*.telegram.org` and Supabase domains.
- [ ] Stars payments: test payer, handle `successful_payment` and `refundStarPayment`.
- [ ] Gifts: UI for selection, error handling for `sendGift`.
- [ ] Stories: `shareToStory` verified on iOS/Android.
- [ ] Sensors: graceful degradation when permissions are missing.
