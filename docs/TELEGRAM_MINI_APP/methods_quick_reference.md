# Telegram Mini Apps — quick methods reference

> Быстрая шпаргалка по основным API Telegram.WebApp и ключевым методам Bot API, использующимся в MusicVerse.

## 1. Окно и окружение

| Метод | Описание |
|-------|----------|
| `ready()` | Сигнал Telegram о готовности UI |
| `expand()` / `isExpanded` | Полноэкранный режим |
| `close()` | Закрыть Mini App |
| `viewportChanged` | Событие изменения высоты |
| `themeParams` | Текущая тема Telegram |

## 2. Кнопки

| Кнопка | Основные методы |
|--------|-----------------|
| `MainButton` | `setText()`, `show()`, `hide()`, `showProgress()`, `onClick()` |
| `SecondaryButton` | `setText()`, `show()`, `hide()` |
| `BackButton` | `show()`, `hide()`, `onClick()` |
| `SettingsButton` | `onClick()` |

## 3. Хранилища

| API | Использование |
|-----|---------------|
| `CloudStorage` | Кросс-девайс настройки и избранное |
| `DeviceStorage` | Локальный кэш (~5 MB) |
| `SecureStorage` | Шифрованные пары (до 10 элементов) |

## 4. Сенсоры и устройство

| API | Основные вызовы |
|-----|-----------------|
| `Accelerometer` | `start({ refresh_rate })`, `stop()`, `on('update')` |
| `Gyroscope` | `start()`, `stop()`, `on('update')` |
| `DeviceOrientation` | `start()`, `on('update')` |
| `LocationManager` | `getLocation(cb)`, `off()` |
| `BiometricManager` | `authenticate()` |

## 5. Хаптика и медиа

| API | Описание |
|-----|----------|
| `HapticFeedback` | `impactOccurred('light' | 'medium' | 'heavy')` |
| `shareToStory` | Публикация историй с link-widget |
| `downloadFile` | Загрузка файлов по `file_id` |

## 6. Платежи и подарки

| API | Описание |
|-----|----------|
| `sendInvoice` (Bot API) | Платёж Stars (`currency: 'XTR'`) |
| `refundStarPayment` | Возвраты Stars |
| `answerWebAppQuery` | Ответ из Mini App в чат/inline |
| `sendGift` | Отправка подарков с текстом |
| `savePreparedInlineMessage` | Подготовленные сообщения |
| `postBusinessStory` | Публикация бизнес-сторий |

## 7. События

| Событие | Когда срабатывает |
|---------|-------------------|
| `mainButtonClicked` | Пользователь нажал MainButton |
| `backButtonClicked` | Пользователь нажал BackButton |
| `themeChanged` | Смена темы Telegram |
| `viewportChanged` | Изменение высоты контейнера |
| `settingsButtonClicked` | Открыты настройки клиента |

## 8. Быстрый пример web_app_query

```ts
Telegram.WebApp.onEvent('mainButtonClicked', async () => {
  Telegram.WebApp.MainButton.showProgress();
  const result = await createTrack(); // вызов Edge Function
  await fetch('/api/answer-webapp', { method: 'POST', body: JSON.stringify(result) });
  Telegram.WebApp.MainButton.hideProgress();
});
```
