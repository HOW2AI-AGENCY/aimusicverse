# 🚀 Telegram Integration - Quick Start Guide

Быстрый старт для начала работы над интеграцией Telegram функционала.

---

## 📋 Предварительные требования

### 1. Telegram Bot Token

```bash
# 1. Открыть @BotFather в Telegram
# 2. Отправить /newbot
# 3. Следовать инструкциям
# 4. Получить токен вида: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Сохранить токен:
export TELEGRAM_BOT_TOKEN="your_token_here"
```

### 2. Настроить Bot через BotFather

```bash
# Установить описание
/setdescription
@your_bot
Профессиональная AI-платформа для создания музыки в Telegram

# Установить команды
/setcommands
@your_bot

start - 🏠 Главное меню
generate - 🎵 Создать трек
library - 📚 Моя библиотека
projects - 💿 Мои проекты
buy - 💰 Купить кредиты
analytics - 📊 Статистика
help - ❓ Справка

# Включить inline mode
/setinline
@your_bot
Введите стиль музыки...

# Настроить Menu Button
/setmenubutton
@your_bot
# Выбрать "Configure menu button"
# Добавить Web App URL
```

### 3. Настроить Payments (опционально для Sprint 3)

```bash
# В @BotFather
/mybots
# Выбрать бота
# Payments → Add payment provider
# Выбрать провайдера (Stripe / YooKassa / etc.)
# Получить PAYMENT_PROVIDER_TOKEN
```

---

## 🔧 Setup - Sprint 1

### Шаг 1: Создать Edge Function для бота

```bash
cd supabase/functions

# Создать директорию
mkdir -p telegram-bot/commands
mkdir -p telegram-bot/handlers
mkdir -p telegram-bot/utils

# Создать основные файлы
touch telegram-bot/index.ts
touch telegram-bot/bot.ts
touch telegram-bot/config.ts
touch telegram-bot/types.ts
```

### Шаг 2: Установить Grammy (для Deno)

Создать или обновить `supabase/functions/import_map.json`:

```json
{
  "imports": {
    "grammy": "https://deno.land/x/grammy@v1.21.1/mod.ts",
    "grammy/": "https://deno.land/x/grammy@v1.21.1/"
  }
}
```

### Шаг 3: Базовый код бота

`supabase/functions/telegram-bot/bot.ts`:

```typescript
import { Bot } from "grammy";

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "");

// Базовая команда
bot.command("start", (ctx) => {
  ctx.reply("👋 Привет! Бот запущен!");
});

export { bot };
```

`supabase/functions/telegram-bot/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { webhookCallback } from "grammy";
import { bot } from "./bot.ts";

serve(webhookCallback(bot, "std/http"));
```

### Шаг 4: Deploy Edge Function

```bash
# Сначала установить secrets
supabase secrets set TELEGRAM_BOT_TOKEN=your_token_here

# Deploy функции
supabase functions deploy telegram-bot

# Получить URL
# https://your-project.supabase.co/functions/v1/telegram-bot
```

### Шаг 5: Настроить Webhook

Создать `supabase/functions/telegram-webhook-setup/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const WEBHOOK_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-bot`;

  // Установить webhook
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ["message", "callback_query", "inline_query"],
    }),
  });

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
```

```bash
# Deploy
supabase functions deploy telegram-webhook-setup

# Вызвать для настройки webhook
curl -X POST https://your-project.supabase.co/functions/v1/telegram-webhook-setup \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Шаг 6: Проверить работу

```bash
# 1. Открыть бота в Telegram
# 2. Отправить /start
# 3. Должно прийти "👋 Привет! Бот запущен!"

# Проверить webhook статус
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

---

## 📱 Frontend Setup - CloudStorage

### Шаг 1: Обновить типы

`src/types/telegram.d.ts`:

```typescript
interface CloudStorage {
  setItem(key: string, value: string, callback?: (error: Error | null, success: boolean) => void): void;
  getItem(key: string, callback: (error: Error | null, value: string) => void): void;
  getItems(keys: string[], callback: (error: Error | null, values: Record<string, string>) => void): void;
  removeItem(key: string, callback?: (error: Error | null, success: boolean) => void): void;
  removeItems(keys: string[], callback?: (error: Error | null, success: boolean) => void): void;
  getKeys(callback: (error: Error | null, keys: string[]) => void): void;
}

interface TelegramWebApp {
  // ... existing
  CloudStorage: CloudStorage;
  SettingsButton: {
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  SecondaryButton: {
    show(): void;
    hide(): void;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
}
```

### Шаг 2: Создать hook

`src/hooks/useTelegramStorage.tsx` - см. TASK-1.5 в Sprint Plan

### Шаг 3: Использовать в компонентах

```typescript
// src/pages/Settings.tsx
import { useTelegramStorage } from '@/hooks/useTelegramStorage';

export default function Settings() {
  const { preferences, updateGenerationSettings } = useTelegramStorage();

  return (
    <div>
      <h1>Настройки</h1>
      {/* UI для настроек */}
    </div>
  );
}
```

---

## 🗄️ Database Setup

### Создать миграцию для генерации задач

`supabase/migrations/[timestamp]_telegram_integration.sql`:

```sql
-- Таблица задач генерации
CREATE TABLE generation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  track_id UUID REFERENCES tracks(id),
  telegram_chat_id BIGINT,
  telegram_message_id BIGINT,
  error_message TEXT,
  source TEXT DEFAULT 'mini_app', -- 'mini_app', 'bot_command', 'voice_message', 'inline_mode'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  INDEX idx_generation_tasks_user_id (user_id),
  INDEX idx_generation_tasks_status (status),
  INDEX idx_generation_tasks_created_at (created_at)
);

-- RLS
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON generation_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON generation_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Триггер для отправки уведомления при завершении
CREATE OR REPLACE FUNCTION notify_generation_completed()
RETURNS TRIGGER AS $$
DECLARE
  user_telegram_id BIGINT;
  track_data RECORD;
BEGIN
  -- Получаем telegram_id
  SELECT telegram_id INTO user_telegram_id
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Если задача завершена и есть трек
  IF NEW.status = 'completed' AND NEW.track_id IS NOT NULL THEN
    SELECT title, audio_url, duration INTO track_data
    FROM tracks
    WHERE id = NEW.track_id;

    -- Вызываем Edge Function для отправки уведомления
    PERFORM
      net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-telegram-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'telegram_id', user_telegram_id,
          'track_id', NEW.track_id,
          'track_title', track_data.title,
          'audio_url', track_data.audio_url,
          'duration', track_data.duration
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_generation_completed
  AFTER UPDATE ON generation_tasks
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION notify_generation_completed();

-- Таблица для inline queries статистики
CREATE TABLE inline_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL,
  query TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_inline_queries_user_id (user_id)
);
```

```bash
# Применить миграцию
supabase db push
```

---

## 🧪 Testing Checklist

### Bot Testing

```bash
# 1. В Telegram найти бота по username
# 2. Отправить /start
# 3. Проверить ответ
# 4. Отправить /help
# 5. Проверить список команд
```

### Mini App Testing

```bash
# 1. Открыть Mini App через Menu Button
# 2. Проверить авторизацию
# 3. Проверить CloudStorage (изменить настройки)
# 4. Перезапустить Mini App
# 5. Проверить, что настройки сохранились
```

### Notifications Testing

```bash
# 1. Запустить генерацию через Mini App
# 2. Дождаться завершения
# 3. Проверить получение уведомления в Telegram
# 4. Проверить наличие аудиофайла
# 5. Проверить inline кнопки
```

---

## 📊 Progress Tracking

### После каждой задачи:

1. Обновить чеклист в `TELEGRAM_INTEGRATION_CHECKLIST.md`
2. Обновить статус в Sprint Plan
3. Commit changes
4. Push to repository

### Git Workflow

```bash
# Создать feature branch
git checkout -b feature/telegram-bot-core

# Работать над задачей
# ...

# Commit
git add .
git commit -m "feat: implement telegram bot core (TASK-1.1)"

# Push
git push origin feature/telegram-bot-core

# Create PR
# Review & Merge
```

---

## 🔍 Debugging

### Проверка логов Edge Functions

```bash
# Реал-тайм логи
supabase functions logs telegram-bot --follow

# Последние 100 строк
supabase functions logs telegram-bot --limit 100
```

### Проверка Webhook

```bash
# Получить информацию о webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Удалить webhook (для тестирования)
curl https://api.telegram.org/bot<TOKEN>/deleteWebhook

# Установить заново
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "YOUR_WEBHOOK_URL"}'
```

### Тестирование локально (через ngrok)

```bash
# 1. Установить ngrok
# 2. Запустить локальный сервер
deno run --allow-all supabase/functions/telegram-bot/index.ts

# 3. В другом терминале запустить ngrok
ngrok http 8000

# 4. Установить webhook на ngrok URL
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-ngrok-url.ngrok.io"}'
```

---

## 📚 Полезные ресурсы

### Документация

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Grammy Framework](https://grammy.dev/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Примеры кода

- См. `TELEGRAM_INTEGRATION_SPRINT.md` - детальные примеры
- См. `TELEGRAM_INTEGRATION.md` - OAuth flow
- См. `TELEGRAM_MINI_APP_INTEGRATION.md` - Mini App API

---

## ❓ FAQ

**Q: Webhook не работает, что делать?**

A:

1. Проверить `getWebhookInfo`
2. Проверить логи Edge Function
3. Проверить, что URL доступен (не localhost)
4. Проверить, что TELEGRAM_BOT_TOKEN правильный

**Q: CloudStorage не сохраняет данные?**

A:

1. Проверить, что Mini App открыт в Telegram (не в браузере)
2. Проверить версию `@twa-dev/sdk`
3. Добавить fallback на localStorage для тестирования

**Q: Уведомления не приходят?**

A:

1. Проверить таблицу `generation_tasks`
2. Проверить триггер `on_generation_completed`
3. Проверить логи Edge Function `send-telegram-notification`
4. Проверить, что `telegram_id` есть в профиле

---

## 🎯 Next Steps

1. ✅ Прочитать Quick Start Guide
2. ⏳ Настроить Telegram бота
3. ⏳ Deploy Edge Function
4. ⏳ Настроить webhook
5. ⏳ Протестировать базовые команды
6. ⏳ Перейти к TASK-1.1 в Sprint Plan

---

**Готовы начать?** Следуйте шагам выше и обращайтесь к детальным Sprint Plans для каждой задачи!

**Удачи!** 🚀
