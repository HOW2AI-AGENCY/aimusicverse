# 🤖 Telegram OAuth Integration Guide

## 🎯 OAuth Flow Architecture

MusicVerse реализует полноценный OAuth flow для безопасной аутентификации через Telegram Mini App с использованием Supabase Auth.

**Процесс аутентификации:**

1. **Клиент получает initData** → Telegram Web App SDK предоставляет подписанные данные
2. **Валидация на сервере** → Edge Function проверяет HMAC-SHA256 подпись
3. **Поиск/создание пользователя** → Автоматическая регистрация через Supabase Auth
4. **Генерация JWT токенов** → Access и refresh токены для клиента
5. **Сохранение сессии** → Клиент использует токены для всех запросов

## 🏗️ Компоненты системы

### Frontend Layer

#### TelegramContext (`src/contexts/TelegramContext.tsx`)
- Инициализация Telegram Web App SDK (`window.Telegram.WebApp`)
- Получение `initData` с подписанными данными пользователя
- UI методы: `showAlert`, `showConfirm`, `close`, `expand`, haptic feedback
- Автоопределение development mode (localhost, *.lovable.dev)
- Mock окружение для тестирования вне Telegram

```typescript
const { initData, user, isDevelopmentMode, showAlert } = useTelegram();
```

#### useAuth Hook (`src/hooks/useAuth.tsx`)
Централизованное управление аутентификацией с автоматическим выбором режима.

**Production Mode:**
```typescript
// OAuth flow через Edge Function
const { user, session } = await authenticateWithTelegram();
// Отправляет initData → Получает JWT токены → Сохраняет сессию
```

**Development Mode:**
```typescript
// Email/password для локальной разработки
// Автоматически создает тестового пользователя test@lovable.dev
// Mock Telegram данные: telegram_id, first_name, photo_url
```

**Возможности:**
- Управление состояния: `user`, `session`, `loading`, `isAuthenticated`
- Автоматическое обновление токенов через `autoRefreshToken`
- Сохранение сессии в `localStorage`
- Обработка auth state changes через `onAuthStateChange`
- Централизованная обработка ошибок с toast уведомлениями

### Backend Layer

#### telegram-auth Edge Function (`supabase/functions/telegram-auth/index.ts`)

Реализует полный OAuth flow с валидацией Telegram данных по [официальной спецификации](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).

**Этапы обработки:**

```typescript
// 1️⃣ Валидация initData от Telegram
async function validateTelegramData(initData: string, botToken: string) {
  // Парсинг URLSearchParams
  const urlParams = new URLSearchParams(initData);
  const receivedHash = urlParams.get('hash');
  
  // Удаление hash и signature (signature НЕ участвует в валидации Mini Apps)
  urlParams.delete('hash');
  urlParams.delete('signature');
  
  // Сортировка параметров по алфавиту
  const sortedKeys = Array.from(urlParams.keys()).sort();
  const dataCheckString = sortedKeys
    .map(key => `${key}=${urlParams.get(key)}`)
    .join('\n');
  
  // HMAC-SHA256 валидация
  // secret_key = HMAC-SHA256("WebAppData", bot_token)
  const secretKey = HMAC_SHA256("WebAppData");
  const tokenSignature = HMAC_SHA256(secretKey, botToken);
  
  // calculated_hash = HMAC-SHA256(token_signature, data_check_string)
  const calculatedHash = HMAC_SHA256(tokenSignature, dataCheckString);
  
  if (calculatedHash !== receivedHash) {
    throw new Error('Hash validation failed');
  }
  
  // Проверка timestamp (защита от replay атак, max 24 часа)
  const authDate = parseInt(urlParams.get('auth_date'));
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - authDate > 86400) {
    throw new Error('InitData too old');
  }
  
  // Возврат валидированных данных пользователя
  return JSON.parse(urlParams.get('user'));
}

// 2️⃣ Поиск существующего пользователя
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('user_id')
  .eq('telegram_id', telegramUser.id)
  .maybeSingle();

// 3️⃣ Создание или обновление пользователя
if (existingProfile) {
  // Обновление существующего пользователя
  const newPassword = crypto.randomUUID();
  await supabase.auth.admin.updateUserById(userId, { password: newPassword });
  await supabase.from('profiles').update({
    first_name: telegramUser.first_name,
    last_name: telegramUser.last_name,
    username: telegramUser.username,
    photo_url: telegramUser.photo_url,
  }).eq('user_id', userId);
} else {
  // Создание нового пользователя
  const { data: authData } = await supabase.auth.admin.createUser({
    email: `telegram_${telegramUser.id}@telegram.user`,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      telegram_id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
  });
  
  await supabase.from('profiles').insert({
    user_id: authData.user.id,
    telegram_id: telegramUser.id,
    first_name: telegramUser.first_name,
    last_name: telegramUser.last_name,
    username: telegramUser.username,
    language_code: telegramUser.language_code,
    photo_url: telegramUser.photo_url,
  });
}

// 4️⃣ Генерация JWT токенов через Supabase Auth
const { data: sessionData } = await supabase.auth.signInWithPassword({
  email: `telegram_${telegramUser.id}@telegram.user`,
  password, // Временный пароль для создания сессии
});

// 5️⃣ Возврат OAuth токенов клиенту
return {
  user: telegramUser,
  session: {
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  },
};
```

**Улучшенная диагностика:**
- ✅ Детальное логирование каждого шага валидации
- ✅ Эмоджи-индикаторы для быстрого поиска проблем (🔐, ✅, ❌)
- ✅ Вывод calculated vs received hash при несовпадении
- ✅ Информация о timestamp и возрасте initData
- ✅ Graceful error handling с информативными сообщениями

## 🔧 Setup Guide

### 1. Создание Telegram Bot через @BotFather

1. Откройте Telegram → Найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Укажите имя бота: **MusicVerse Bot**
4. Укажите username: **musicverse_bot** (должен заканчиваться на `_bot`)
5. **Сохраните Bot Token**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Настройка Mini App

1. Отправьте `/newapp` в @BotFather
2. Выберите созданного бота
3. Заполните информацию:
   - **Title**: MusicVerse
   - **Description**: AI-платформа для генерации музыки
   - **Photo**: Загрузите `public/icon.png` из проекта
   - **Web App URL**:
     - 🔧 Development: `https://[project-id].lovable.dev`
     - 🚀 Production: `https://yourdomain.com`
4. (Опционально) Настройте Menu Button: `/setmenubutton`

### 3. Добавление TELEGRAM_BOT_TOKEN в Lovable Cloud

**Через UI:**
1. Откройте чат Lovable
2. Запросите "View Backend" или нажмите кнопку в чате
3. Перейдите в **Secrets** раздел
4. Добавьте секрет:
   - **Name**: `TELEGRAM_BOT_TOKEN`
   - **Value**: Ваш токен от @BotFather
5. Секрет автоматически будет доступен в Edge Functions через `Deno.env.get('TELEGRAM_BOT_TOKEN')`

**Проверка:**
```typescript
// В Edge Function автоматически доступен
const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
console.log('Bot token configured:', !!botToken);
```

## 🔄 Режимы работы

### Development Mode 🔧

**Автоматическая активация на:**
- `*.lovable.dev` и `*.lovable.app`
- `localhost:*`
- При параметре `?dev=1` в URL

**Особенности:**
- ✅ Email/password аутентификация (`test@lovable.dev` / `testpassword123`)
- ✅ Mock Telegram окружение с тестовыми данными
- ✅ Автоматическое создание тестового пользователя при первом входе
- ✅ Все Telegram API вызовы логируются с префиксом `🔧`
- ✅ Не требуется настоящий Telegram Bot Token

**Mock данные:**
```typescript
const mockTelegramData = {
  telegram_id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'ru',
  photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
};
```

### Production Mode 🚀

**Активация:**
- Кастомные домены (не *.lovable.dev)
- Настоящее Telegram Mini App окружение

**Требования:**
- ✅ Реальный `TELEGRAM_BOT_TOKEN` в секретах
- ✅ Настроенный Mini App в @BotFather
- ✅ Открытие через Telegram клиент
- ✅ Валидный `initData` от Telegram Web App SDK

**Процесс:**
1. Пользователь открывает Mini App в Telegram
2. SDK генерирует подписанный `initData`
3. Клиент отправляет `initData` на Edge Function
4. Сервер валидирует подпись через `TELEGRAM_BOT_TOKEN`
5. Создается/обновляется пользователь в Supabase
6. Генерируются JWT токены
7. Токены возвращаются клиенту и сохраняются

## 🔐 Безопасность

### OAuth Token Flow
- ✅ **Никогда не храним пароли** - используем одноразовые UUID для генерации сессий
- ✅ **JWT токены с auto-refresh** - Supabase автоматически обновляет токены
- ✅ **HMAC-SHA256 валидация** - проверка подписи Telegram на сервере
- ✅ **Timestamp validation** - защита от replay атак (max 24 часа)
- ✅ **Service Role Key** - используется только на сервере, никогда на клиенте

### Валидация initData

**✅ Правильная реализация:**
```typescript
// 1. Удаляем hash и signature
urlParams.delete('hash');
urlParams.delete('signature'); // НЕ участвует в валидации Mini Apps!

// 2. Сортируем параметры по алфавиту
const sortedKeys = Array.from(urlParams.keys()).sort();

// 3. Создаем data_check_string
const dataCheckString = sortedKeys
  .map(key => `${key}=${urlParams.get(key)}`)
  .join('\n');

// 4. Вычисляем HMAC-SHA256
const secretKey = HMAC_SHA256('WebAppData');
const tokenSig = HMAC_SHA256(secretKey, botToken);
const calculatedHash = HMAC_SHA256(tokenSig, dataCheckString);

// 5. Сравниваем с полученным hash
if (calculatedHash !== receivedHash) {
  throw new Error('Invalid signature');
}

// 6. Проверяем timestamp
const authDate = parseInt(urlParams.get('auth_date'));
if (Date.now() / 1000 - authDate > 86400) {
  throw new Error('Expired initData');
}
```

**❌ Типичные ошибки:**
```typescript
// ❌ Включение signature в валидацию
// signature НЕ используется для Mini Apps, только hash!

// ❌ Декодирование значений дважды
const value = decodeURIComponent(urlParams.get(key));
// URLSearchParams уже декодирует, не нужно дополнительно!

// ❌ Игнорирование timestamp
// Всегда проверяйте auth_date для защиты от replay атак

// ❌ Доверие клиентским данным без проверки
// НИКОГДА не используйте initData без серверной валидации
```

### Row Level Security (RLS)

Все таблицы защищены RLS политиками на уровне Supabase:

```sql
-- Профили: пользователи видят только свой профиль
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Треки: пользователи управляют только своими треками
CREATE POLICY "Users can manage own tracks"
ON tracks FOR ALL
USING (auth.uid() = user_id);

-- Проекты: изоляция данных по пользователям
CREATE POLICY "Users can manage own projects"
ON music_projects FOR ALL
USING (auth.uid() = user_id);
```

## 🐛 Troubleshooting

### 1. "Hash validation failed" ❌

**Причина:** Несовпадение вычисленного и полученного hash

**Диагностика:**
```bash
# Проверьте логи Edge Function (автоматически в консоли)
🔐 Calculated hash: abc123...
🔐 Received hash:   xyz789...
```

**Решение:**
1. ✅ Убедитесь, что `TELEGRAM_BOT_TOKEN` установлен правильно в секретах
2. ✅ Проверьте, что используется актуальная версия Edge Function (автодеплой)
3. ✅ Убедитесь, что `signature` удаляется из параметров валидации
4. ✅ Проверьте, что параметры не декодируются дважды
5. ✅ Перезапустите Mini App в Telegram для получения свежего initData

### 2. "No initData available" ⚠️

**Причина:** Приложение открыто не через Telegram Mini App

**Решение:**
- 🔧 **Development**: Используется автоматически на localhost и *.lovable.dev
- 🚀 **Production**: Откройте приложение через Telegram:
  1. Найдите своего бота в Telegram
  2. Запустите бота командой `/start`
  3. Нажмите кнопку меню или откройте Mini App

### 3. "Invalid Telegram data" ❌

**Причина:** Поврежденный или устаревший initData

**Решение:**
1. Перезапустите Mini App в Telegram
2. Проверьте timestamp в логах:
   ```bash
   ✅ Timestamp validation passed - initData is fresh
   ```
3. Убедитесь, что URL в @BotFather совпадает с текущим доменом
4. Проверьте, что бот не заблокирован или удален

### 4. "Failed to create session" 💥

**Причина:** Проблема с Supabase Auth или профилем

**Решение:**
1. Проверьте логи Edge Function:
   ```bash
   ✅ Auth user created: [user_id]
   ✅ Profile created
   ✅ Session created for new user
   ```
2. Убедитесь, что таблица `profiles` существует
3. Проверьте RLS политики на таблице `profiles`
4. Откройте Backend (View Backend) → Auth → Users для проверки создания пользователя

### 5. "TELEGRAM_BOT_TOKEN not configured" ⚙️

**Причина:** Секрет не установлен в Lovable Cloud

**Решение:**
1. Откройте Backend через кнопку "View Backend"
2. Перейдите в раздел **Secrets**
3. Добавьте секрет `TELEGRAM_BOT_TOKEN` со значением от @BotFather
4. Дождитесь автоматического редеплоя Edge Functions (~30 сек)

### 6. Non-2xx response from Edge Function 🔴

**Причина:** Ошибка в Edge Function или окружении

**Диагностика:**
```bash
# Проверьте логи в режиме реального времени
🚀 Telegram Auth function invoked
📍 Method: POST
📍 URL: https://...
✅ Environment configured
📦 InitData received, length: 1234
```

**Решение:**
1. Проверьте Browser Console (F12) для полного текста ошибки
2. Проверьте Edge Function Logs в Backend → Functions → telegram-auth
3. Убедитесь, что все environment variables установлены:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`
4. Проверьте CORS headers в Edge Function

## Тестирование

### Локально (Development Mode)

```bash
# Запустите проект
npm run dev

# Откройте в браузере
# Development mode активируется автоматически
```

### В Telegram (Production Mode)

1. Опубликуйте приложение через Lovable
2. Настройте Mini App в @BotFather с URL вашего приложения
3. Откройте бота в Telegram
4. Запустите Mini App через меню бота

## Полезные команды

```bash
# Просмотр логов edge function
# В Lovable: Cloud → Functions → telegram-auth → Logs

# Проверка секретов
# В Lovable: Cloud → Settings → Secrets

# Деплой edge function (автоматический при изменениях)
# Изменения в supabase/functions/ автоматически деплоятся
```

## Ресурсы

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Validating initData](https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Поддержка

При возникновении проблем:
1. Проверьте логи edge function в Lovable Cloud
2. Проверьте browser console для frontend ошибок
3. Убедитесь, что TELEGRAM_BOT_TOKEN установлен корректно
4. Проверьте, что Mini App настроен в @BotFather

---

Последнее обновление: 2025-11-29
