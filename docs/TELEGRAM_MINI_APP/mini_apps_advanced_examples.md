# Telegram Mini Apps Advanced Examples (Bot API 9.0–9.2)

> Practical scenarios covering new capabilities: Device/Secure Storage, sensors, fullscreen mode, Stars/gifts, and Stories.

## 1. Update highlights

- **DeviceStorage (~5 MB):** offline-friendly local cache.
- **SecureStorage (10 items):** encrypted key/value pairs for tokens.
- **Sensors:** `Accelerometer`, `Gyroscope`, `DeviceOrientation`, `LocationManager`.
- **UI:** `expand()`, portrait fullscreen, keyboard control, add-to-home (iOS).
- **Payments & Gifts:** Stars (`sendInvoice`, `refundStarPayment`), `sendGift`.
- **Stories:** `shareToStory`, `postBusinessStory`.

## 2. Practical scenarios

### 2.1 Fitness tracker (accelerometer + GPS)
```ts
Telegram.WebApp.Accelerometer.start({ refresh_rate: 100 });
Telegram.WebApp.Accelerometer.on('update', (a) => {
  const steps = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2) > 2.5;
  if (steps) stepCounter.increment();
});
Telegram.WebApp.LocationManager.getLocation((loc) => saveRoute(loc));
```

### 2.2 Secrets manager (SecureStorage)
```ts
await Telegram.WebApp.SecureStorage.saveKey('auth', 'token', secret);
const token = await Telegram.WebApp.SecureStorage.getKey('auth', 'token');
```

### 2.3 Referral gifts
```ts
const gifts = await bot.getAvailableGifts();
await bot.sendGift(refUserId, gifts[0].id, { text: 'Thanks for the referral! 🎁' });
```

### 2.4 Business stories with interactive areas
```ts
await bot.postBusinessStory({
  business_connection_id,
  content: { photo: { photo: fileId } },
  areas: [{ position: {...}, type: { type: 'link', url: deepLink } }],
});
```

### 2.5 Subscriptions via Stars
```ts
await bot.sendInvoice(userId, {
  title: 'Premium',
  currency: 'XTR',
  prices: [{ label: '1 Month', amount: 100 }],
});
```

## 3. Best practices

- **Performance:** unsubscribe from sensors on unmount; use `refresh_rate` ≥ 50–100 ms.
- **Storage:** secrets only in `SecureStorage`; cache in `DeviceStorage`; synced prefs in `CloudStorage`.
- **Payments:** log `successful_payment` and `refundStarPayment`; store `charge_id`.
- **Errors:** show `MainButton.showProgress()` for network actions; handle `web_app_data_send` timeouts.
- **Graceful degradation:** when permissions for sensors/GPS are missing, hide dependent features and notify users.
