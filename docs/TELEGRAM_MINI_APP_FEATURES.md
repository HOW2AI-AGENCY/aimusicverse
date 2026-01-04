# Telegram Mini App - Новые возможности 2024-2025

## Music on Profiles (Август 2025)

### Описание
Пользователи Telegram теперь могут добавлять музыку в свой профиль. Аудиофайлы из любого чата можно добавить одним нажатием в медиаплеере.

### Как это работает
1. Трек появляется в стильной панели под фото профиля
2. При добавлении треков автоматически создается плейлист
3. Добавление через кнопку "Add to Profile" в медиаплеере или через меню "Save to... > Profile"

### Потенциальная интеграция для MusicVerse
- Добавить кнопку "Добавить в профиль Telegram" в действия трека
- Использовать Telegram Bot API для отправки аудио, которое пользователь может добавить в профиль
- Интеграция с shareURL для шеринга треков

---

## Custom Emoji Status (для Premium)

### Описание
Premium пользователи могут устанавливать кастомные эмодзи как статус. Бот API поддерживает `setEmojiStatus` для изменения эмодзи-статуса.

### Bot API методы
```typescript
// Установка emoji статуса (только для premium пользователей, через бот с разрешениями)
setEmojiStatus(user_id, emoji_status_id)
```

### Ограничения
- Работает только для Premium пользователей
- Требует специальные разрешения бота

---

## Mini Apps 2.0 - Ключевые обновления

### Full-Screen Mode
```typescript
Telegram.WebApp.requestFullscreen()
Telegram.WebApp.exitFullscreen()
```

### Home Screen Shortcuts
```typescript
Telegram.WebApp.addToHomeScreen()
Telegram.WebApp.checkHomeScreenStatus() // 'unsupported' | 'added' | 'not_added'
```

### Orientation Lock
```typescript
Telegram.WebApp.lockOrientation() // Блокировка в текущей ориентации
```

### Accelerometer & Gyroscope
```typescript
Telegram.WebApp.Accelerometer.start()
Telegram.WebApp.Gyroscope.start()
Telegram.WebApp.DeviceOrientation.start()
```

### Location Access
```typescript
Telegram.WebApp.LocationManager.init()
Telegram.WebApp.LocationManager.getLocation()
```

### Media Access
```typescript
Telegram.WebApp.requestWriteAccess() // Запрос разрешения на отправку сообщений
Telegram.WebApp.downloadFile(url, filename) // Скачивание файлов
```

---

## Bot API 9.x Updates (2025)

### Checklists
- `sendChecklist` - отправка чек-листов
- `editMessageChecklist` - редактирование чек-листов

### Gifts System
- `upgradeGift` - апгрейд подарков
- `transferGift` - передача уникальных подарков
- Gift Marketplace интеграция

### Stories
- `postStory` - публикация сторис от имени бизнес-аккаунта
- `editStory` - редактирование сторис
- Story areas с интерактивными элементами

### Business Accounts
- Управление именем, bio, фото профиля бизнес-аккаунта
- Получение и передача Telegram Stars
- Direct Messages для каналов

---

## Рекомендации для MusicVerse

### Приоритетные интеграции
1. **Music Profile Integration** - добавить шеринг треков для добавления в профиль
2. **Home Screen Shortcut** - предложить пользователям добавить MusicVerse на домашний экран
3. **Full-screen Player** - использовать fullscreen API для плеера

### Возможные улучшения
1. Использовать accelerometer для жестов в плеере
2. Добавить location-based рекомендации (по региону)
3. Интегрировать Gifts для монетизации (подарки за генерации)

### Код интеграции добавления в профиль
Telegram пока не имеет прямого API для Mini Apps для добавления музыки в профиль. Текущий workaround:
1. Отправить аудио-файл в чат с ботом
2. Пользователь вручную добавляет трек в профиль через медиаплеер
3. Показать инструкции в UI

---

## Ссылки
- [Telegram Blog - Music on Profiles](https://telegram.org/blog/profile-music-gift-themes)
- [Bot API Changelog](https://core.telegram.org/bots/api-changelog)
- [Mini Apps Documentation](https://core.telegram.org/bots/webapps)
