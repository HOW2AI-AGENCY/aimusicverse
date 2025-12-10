# Telegram Mini Apps — quick methods reference

> Quick cheat sheet of core Telegram.WebApp APIs and key Bot API calls used in MusicVerse. See also the [integration guide](./telegram_mini_apps_integration.md) and [advanced examples](./mini_apps_advanced_examples.md).

## 1. Window & environment

| Method | Description |
|--------|-------------|
| `ready()` | Notify Telegram that the UI is ready |
| `expand()` / `isExpanded` | Enter fullscreen mode |
| `close()` | Close the Mini App |
| `viewportChanged` | Viewport height changed |
| `themeParams` | Current Telegram theme |

## 2. Buttons

| Button | Core methods |
|--------|--------------|
| `MainButton` | `setText()`, `show()`, `hide()`, `showProgress()`, `onClick()` |
| `SecondaryButton` | `setText()`, `show()`, `hide()` |
| `BackButton` | `show()`, `hide()`, `onClick()` |
| `SettingsButton` | `onClick()` |

## 3. Storage

| API | Usage |
|-----|-------|
| `CloudStorage` | Cross-device prefs and favorites |
| `DeviceStorage` | Local cache (~5 MB) |
| `SecureStorage` | Encrypted pairs (up to 10 items) |

## 4. Sensors & device

| API | Key calls |
|-----|-----------|
| `Accelerometer` | `start({ refresh_rate })`, `stop()`, `on('update')` |
| `Gyroscope` | `start()`, `stop()`, `on('update')` |
| `DeviceOrientation` | `start()`, `on('update')` |
| `LocationManager` | `getLocation(cb)`, `off()` |
| `BiometricManager` | `authenticate()` |

## 5. Haptics & media

| API | Description |
|-----|-------------|
| `HapticFeedback` | `impactOccurred('light' | 'medium' | 'heavy')` |
| `shareToStory` | Publish stories with link widget |
| `downloadFile` | Download files by `file_id` |

## 6. Payments & gifts

| API | Description |
|-----|-------------|
| `sendInvoice` (Bot API) | Stars payment (`currency: 'XTR'`) |
| `refundStarPayment` | Stars refunds |
| `answerWebAppQuery` | Reply from Mini App to chat/inline |
| `sendGift` | Send gifts with text |
| `savePreparedInlineMessage` | Prepared messages |
| `postBusinessStory` | Publish business stories |

## 7. Events

| Event | When it fires |
|-------|---------------|
| `mainButtonClicked` | User tapped MainButton |
| `backButtonClicked` | User tapped BackButton |
| `themeChanged` | Telegram theme changed |
| `viewportChanged` | Container height changed |
| `settingsButtonClicked` | Client settings opened |

## 8. Quick web_app_query example

```ts
Telegram.WebApp.onEvent('mainButtonClicked', async () => {
  Telegram.WebApp.MainButton.showProgress();
  const result = await createTrack(); // call Edge Function
  await fetch('/api/answer-webapp', { method: 'POST', body: JSON.stringify(result) });
  Telegram.WebApp.MainButton.hideProgress();
});
```
