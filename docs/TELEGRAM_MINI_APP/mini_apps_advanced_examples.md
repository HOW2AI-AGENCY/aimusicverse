# Telegram Mini Apps Advanced Examples (Bot API 9.0–9.2)

> Practical scenarios covering new capabilities: Device/Secure Storage, sensors, fullscreen mode, Stars/gifts, and Stories.

## 1. Краткий обзор обновлений

- **DeviceStorage (~5 MB):** локальный кэш без сети.
- **SecureStorage (10 элементов):** шифрованные пары ключ/значение для токенов.
- **Sensors:** `Accelerometer`, `Gyroscope`, `DeviceOrientation`, `LocationManager`.
- **UI:** `expand()`, портретный fullscreen, управление клавиатурой, добавление на главный экран (iOS).
- **Payments & Gifts:** Stars (`sendInvoice`, `refundStarPayment`), `sendGift`.
- **Stories:** `shareToStory`, `postBusinessStory`.

## 2. Практические сценарии

### 2.1 Фитнес-трекер (акселерометр + GPS)
```ts
Telegram.WebApp.Accelerometer.start({ refresh_rate: 100 });
Telegram.WebApp.Accelerometer.on('update', (a) => {
  const steps = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2) > 2.5;
  if (steps) stepCounter.increment();
});
Telegram.WebApp.LocationManager.getLocation((loc) => saveRoute(loc));
```

### 2.2 Менеджер секретов (SecureStorage)
```ts
await Telegram.WebApp.SecureStorage.saveKey('auth', 'token', secret);
const token = await Telegram.WebApp.SecureStorage.getKey('auth', 'token');
```

### 2.3 Реферальная система с подарками
```ts
const gifts = await bot.getAvailableGifts();
await bot.sendGift(refUserId, gifts[0].id, { text: 'Thanks for the referral! 🎁' });
```

### 2.4 Бизнес-истории с интерактивными зонами
```ts
await bot.postBusinessStory({
  business_connection_id,
  content: { photo: { photo: fileId } },
  areas: [{ position: {...}, type: { type: 'link', url: deepLink } }],
});
```

### 2.5 Подписки через Stars
```ts
await bot.sendInvoice(userId, {
  title: 'Premium',
  currency: 'XTR',
  prices: [{ label: '1 Month', amount: 100 }],
});
```

## 3. Лучшие практики

- **Производительность:** отписывайтесь от сенсоров при `componentWillUnmount`, используйте `refresh_rate` ≥ 50–100 мс.
- **Хранилища:** чувствительные данные — только в `SecureStorage`; кэш — в `DeviceStorage`; синхронные настройки — в `CloudStorage`.
- **Платежи:** логируйте `successful_payment` и `refundStarPayment`; храните charge_id.
- **Ошибки:** показывайте `MainButton.showProgress()` на сетевых действиях, ловите `web_app_data_send` тайм-ауты.
- **Грейсфул деградация:** при отсутствии разрешений сенсоров/гео скрывайте функции и уведомляйте пользователя.
