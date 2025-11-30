# 🚀 Telegram Integration Sprint Plan

**Проект:** MusicVerse AI - Максимальная интеграция Telegram
**Дата создания:** 2025-11-29
**Команда:** Full-stack разработка
**Длительность:** 4 спринта по 1 неделе

---

## 📊 Обзор Спринтов

| Спринт | Фокус | Story Points | Приоритет |
|--------|-------|--------------|-----------|
| **Sprint 1** | Telegram Bot Core + Notifications | 21 | 🔴 Critical |
| **Sprint 2** | Mini App Advanced Features | 18 | 🟡 High |
| **Sprint 3** | Bot-App Integration + Payments | 24 | 🟡 High |
| **Sprint 4** | Advanced Features + Polish | 15 | 🟢 Medium |

**Общий объем:** 78 Story Points
**Команда:** 2-3 разработчика
**Velocity:** ~20 SP/неделя

---

# 🎯 SPRINT 1: Telegram Bot Core + Notifications
**Цель:** Создать функциональный Telegram бот с базовыми командами и системой уведомлений

**Длительность:** 5 рабочих дней
**Story Points:** 21

---

## 📋 Задачи Sprint 1

### TASK-1.1: Настройка инфраструктуры Telegram бота
**Priority:** 🔴 Critical
**Story Points:** 5
**Assignee:** Backend Developer
**Labels:** `backend`, `telegram-bot`, `infrastructure`

#### Описание
Настроить базовую инфраструктуру для Telegram бота на Supabase Edge Functions.

#### Acceptance Criteria
- [ ] Создана Edge Function `telegram-bot`
- [ ] Настроен webhook для получения обновлений от Telegram
- [ ] Добавлена библиотека Grammy/Telegraf
- [ ] Бот отвечает на команду `/start`
- [ ] Настроены environment variables (TELEGRAM_BOT_TOKEN)
- [ ] Webhook успешно принимает сообщения

#### Технические требования

**1. Создать структуру проекта:**
```bash
supabase/functions/
├── telegram-bot/
│   ├── index.ts              # Main handler
│   ├── bot.ts                # Bot instance
│   ├── types.ts              # TypeScript types
│   └── config.ts             # Configuration
└── telegram-webhook-setup/
    └── index.ts              # Webhook setup function
```

**2. Установить зависимости:**
```typescript
// import_map.json или package.json для Deno
{
  "imports": {
    "grammy": "https://deno.land/x/grammy@v1.21.1/mod.ts",
    "grammy/types": "https://deno.land/x/grammy@v1.21.1/types.ts"
  }
}
```

**3. Базовая структура бота:**
```typescript
// supabase/functions/telegram-bot/bot.ts
import { Bot } from "grammy";

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "");

// Health check
bot.command("start", (ctx) => ctx.reply("Bot is running!"));

export { bot };
```

**4. Webhook handler:**
```typescript
// supabase/functions/telegram-bot/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { webhookCallback } from "grammy";
import { bot } from "./bot.ts";

serve(webhookCallback(bot, "std/http"));
```

**5. Setup webhook:**
```typescript
// supabase/functions/telegram-webhook-setup/index.ts
const WEBHOOK_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-bot`;

const response = await fetch(
  `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: WEBHOOK_URL }),
  }
);
```

#### Testing
```bash
# 1. Deploy function
supabase functions deploy telegram-bot

# 2. Set secrets
supabase secrets set TELEGRAM_BOT_TOKEN=your_token_here

# 3. Setup webhook
supabase functions invoke telegram-webhook-setup

# 4. Test with Telegram
# Отправить /start боту в Telegram
```

#### Definition of Done
- ✅ Бот отвечает на команды в Telegram
- ✅ Webhook работает без ошибок
- ✅ Логи показывают успешную обработку сообщений
- ✅ Code review пройден
- ✅ Документация обновлена

---

### TASK-1.2: Реализация основных команд бота
**Priority:** 🔴 Critical
**Story Points:** 5
**Assignee:** Backend Developer
**Labels:** `backend`, `telegram-bot`, `features`

#### Описание
Реализовать основные команды для взаимодействия с ботом.

#### Acceptance Criteria
- [ ] `/start` - приветствие с кнопкой "Открыть Mini App"
- [ ] `/help` - справка по командам
- [ ] `/generate <prompt>` - быстрая генерация музыки
- [ ] `/library` - показать последние 5 треков
- [ ] `/projects` - показать проекты пользователя
- [ ] `/app` - deep link в Mini App
- [ ] Все команды логируются в БД

#### Технические требования

**Структура:**
```bash
supabase/functions/telegram-bot/
├── commands/
│   ├── start.ts
│   ├── help.ts
│   ├── generate.ts
│   ├── library.ts
│   ├── projects.ts
│   └── app.ts
└── keyboards/
    └── main-menu.ts
```

**Код команд:**

```typescript
// commands/start.ts
import { InlineKeyboard } from "grammy";
import { CommandContext } from "grammy";

export async function startCommand(ctx: CommandContext) {
  const keyboard = new InlineKeyboard()
    .webApp("🎵 Открыть MusicVerse", process.env.MINI_APP_URL!)
    .row()
    .text("❓ Помощь", "help")
    .text("⚙️ Настройки", "settings");

  await ctx.reply(
    `🎵 <b>Добро пожаловать в MusicVerse AI!</b>

Создавайте музыку с помощью искусственного интеллекта прямо в Telegram.

<b>Возможности:</b>
• 🎹 Генерация треков по описанию
• 💿 Управление проектами и альбомами
• 🎨 174+ мета-тегов для контроля
• 🌍 75+ языков вокала

Нажмите кнопку ниже, чтобы начать!`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  );
}

// commands/help.ts
export async function helpCommand(ctx: CommandContext) {
  await ctx.reply(
    `📖 <b>Доступные команды:</b>

/start - Главное меню
/generate <текст> - Создать трек
/library - Моя библиотека
/projects - Мои проекты
/app - Открыть приложение
/help - Эта справка

<b>Примеры генерации:</b>
/generate ambient electronic peaceful
/generate upbeat rock guitar solo`,
    { parse_mode: "HTML" }
  );
}

// commands/generate.ts
import { supabase } from "../config.ts";

export async function generateCommand(ctx: CommandContext) {
  const prompt = ctx.match; // Текст после команды

  if (!prompt) {
    return ctx.reply("❌ Укажите описание трека после команды.\n\nПример:\n/generate ambient peaceful music");
  }

  // Получить user_id из БД по telegram_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("telegram_id", ctx.from.id)
    .single();

  if (!profile) {
    return ctx.reply(
      "❌ Сначала авторизуйтесь в Mini App!",
      {
        reply_markup: new InlineKeyboard()
          .webApp("🔐 Войти", process.env.MINI_APP_URL!)
      }
    );
  }

  // Отправить в очередь генерации
  const { data: task } = await supabase
    .from("generation_tasks")
    .insert({
      user_id: profile.user_id,
      prompt: prompt,
      status: "pending",
      telegram_chat_id: ctx.chat.id,
      telegram_message_id: ctx.message?.message_id,
    })
    .select()
    .single();

  await ctx.reply(
    `⏳ Генерация началась!\n\n📝 Промпт: "${prompt}"\n\nВы получите уведомление, когда трек будет готов.`
  );
}

// commands/library.ts
export async function libraryCommand(ctx: CommandContext) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("telegram_id", ctx.from.id)
    .single();

  if (!profile) {
    return ctx.reply("❌ Сначала авторизуйтесь в Mini App!");
  }

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, created_at, audio_url")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!tracks || tracks.length === 0) {
    return ctx.reply(
      "📚 Ваша библиотека пуста.\n\nИспользуйте /generate для создания первого трека!"
    );
  }

  let message = "🎵 <b>Ваши последние треки:</b>\n\n";
  const keyboard = new InlineKeyboard();

  tracks.forEach((track, index) => {
    message += `${index + 1}. ${track.title}\n`;
    keyboard.text(`▶️ ${index + 1}`, `play_${track.id}`);
    if ((index + 1) % 3 === 0) keyboard.row();
  });

  keyboard.row().webApp("📱 Открыть все треки", `${process.env.MINI_APP_URL}/library`);

  await ctx.reply(message, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
```

**Регистрация команд:**
```typescript
// bot.ts
import { Bot } from "grammy";
import { startCommand } from "./commands/start.ts";
import { helpCommand } from "./commands/help.ts";
import { generateCommand } from "./commands/generate.ts";
import { libraryCommand } from "./commands/library.ts";

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN")!);

bot.command("start", startCommand);
bot.command("help", helpCommand);
bot.command("generate", generateCommand);
bot.command("library", libraryCommand);
// ... другие команды

export { bot };
```

#### Testing
```bash
# В Telegram отправить:
/start
/help
/generate ambient electronic music
/library
/projects
/app
```

#### Definition of Done
- ✅ Все команды работают
- ✅ Inline клавиатуры отображаются
- ✅ Deep links открывают Mini App
- ✅ Ошибки обрабатываются gracefully
- ✅ Тесты написаны и проходят
- ✅ Code review пройден

---

### TASK-1.3: Система уведомлений о генерации
**Priority:** 🔴 Critical
**Story Points:** 5
**Assignee:** Backend Developer
**Labels:** `backend`, `telegram-bot`, `notifications`

#### Описание
Реализовать систему отправки уведомлений через бота при завершении генерации треков.

#### Acceptance Criteria
- [ ] Уведомление отправляется при завершении генерации
- [ ] Сообщение содержит информацию о треке
- [ ] Прикрепляется аудиофайл
- [ ] Inline кнопки: "Открыть в App", "Поделиться"
- [ ] Уведомления отправляются через Edge Function
- [ ] Обработка ошибок и retry логика

#### Технические требования

**1. Создать таблицу для задач генерации:**
```sql
-- supabase/migrations/[timestamp]_create_generation_tasks.sql
CREATE TABLE generation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  track_id UUID REFERENCES tracks(id),
  telegram_chat_id BIGINT,
  telegram_message_id BIGINT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  INDEX idx_generation_tasks_user_id (user_id),
  INDEX idx_generation_tasks_status (status)
);

-- RLS
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON generation_tasks FOR SELECT
  USING (auth.uid() = user_id);
```

**2. Edge Function для отправки уведомлений:**
```typescript
// supabase/functions/send-telegram-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface NotificationPayload {
  telegram_id: number;
  track_id: string;
  track_title: string;
  audio_url: string;
  duration: number;
}

serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json();

    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const MINI_APP_URL = Deno.env.get("MINI_APP_URL")!;

    // Формируем сообщение
    const caption = `✅ <b>Трек готов!</b>

🎵 ${payload.track_title}
⏱️ Длительность: ${Math.floor(payload.duration / 60)}:${(payload.duration % 60).toString().padStart(2, '0')}

Создано с помощью MusicVerse AI`;

    // Inline клавиатура
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "📱 Открыть в приложении",
            web_app: { url: `${MINI_APP_URL}/library?track=${payload.track_id}` }
          }
        ],
        [
          { text: "🔄 Создать ремикс", callback_data: `remix_${payload.track_id}` },
          { text: "💾 В проект", callback_data: `add_to_project_${payload.track_id}` }
        ],
        [
          { text: "🔗 Поделиться", switch_inline_query: `track_${payload.track_id}` }
        ]
      ]
    };

    // Отправляем аудиофайл
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: payload.telegram_id,
          audio: payload.audio_url,
          caption: caption,
          parse_mode: "HTML",
          reply_markup: keyboard,
        }),
      }
    );

    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return new Response(
      JSON.stringify({ success: true, message_id: result.result.message_id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**3. Триггер на завершение генерации:**
```sql
-- Функция для отправки уведомления
CREATE OR REPLACE FUNCTION notify_track_completed()
RETURNS TRIGGER AS $$
DECLARE
  user_telegram_id BIGINT;
  track_data RECORD;
BEGIN
  -- Получаем telegram_id пользователя
  SELECT telegram_id INTO user_telegram_id
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Получаем данные трека
  SELECT title, audio_url, duration INTO track_data
  FROM tracks
  WHERE id = NEW.id;

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
        'track_id', NEW.id,
        'track_title', track_data.title,
        'audio_url', track_data.audio_url,
        'duration', track_data.duration
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на INSERT в таблицу tracks
CREATE TRIGGER on_track_created
  AFTER INSERT ON tracks
  FOR EACH ROW
  WHEN (NEW.audio_url IS NOT NULL)
  EXECUTE FUNCTION notify_track_completed();
```

**4. Обработка callback queries:**
```typescript
// telegram-bot/callbacks/track-actions.ts
import { CallbackQueryContext } from "grammy";
import { supabase } from "../config.ts";

export async function handleTrackCallback(ctx: CallbackQueryContext) {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("remix_")) {
    const trackId = data.replace("remix_", "");
    await ctx.answerCallbackQuery({
      text: "🔄 Генерация ремикса начата!",
      show_alert: false,
    });

    // Запустить генерацию ремикса
    // ... логика

  } else if (data.startsWith("add_to_project_")) {
    const trackId = data.replace("add_to_project_", "");

    // Показать список проектов
    const { data: projects } = await supabase
      .from("music_projects")
      .select("id, title")
      .eq("user_id", /* ... */);

    // Показать inline клавиатуру с проектами
    // ...
  }
}

// Регистрация в bot.ts
bot.on("callback_query:data", handleTrackCallback);
```

#### Testing
```bash
# 1. Создать генерацию через Mini App
# 2. Дождаться завершения
# 3. Проверить получение уведомления в Telegram
# 4. Проверить inline кнопки
# 5. Проверить воспроизведение аудио
```

#### Definition of Done
- ✅ Уведомления приходят при завершении генерации
- ✅ Аудиофайл прикрепляется корректно
- ✅ Inline кнопки работают
- ✅ Обработка ошибок реализована
- ✅ Retry логика для failed notifications
- ✅ Тесты написаны
- ✅ Code review пройден

---

### TASK-1.4: Bot Menu Button и Deep Linking
**Priority:** 🟡 High
**Story Points:** 3
**Assignee:** Backend Developer
**Labels:** `backend`, `telegram-bot`, `integration`

#### Описание
Настроить Bot Menu Button для быстрого доступа к Mini App и реализовать deep linking.

#### Acceptance Criteria
- [ ] Menu Button настроена и отображается
- [ ] Deep links открывают конкретные страницы Mini App
- [ ] Параметры передаются корректно
- [ ] Tracking deep link кликов в аналитике

#### Технические требования

**1. Настройка Menu Button:**
```typescript
// supabase/functions/telegram-webhook-setup/index.ts
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const MINI_APP_URL = Deno.env.get("MINI_APP_URL")!;

// Установить Menu Button для всех пользователей
await fetch(
  `https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      menu_button: {
        type: "web_app",
        text: "🎵 MusicVerse",
        web_app: {
          url: MINI_APP_URL,
        },
      },
    }),
  }
);

// Установить команды бота (для автокомплита)
await fetch(
  `https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "start", description: "🏠 Главное меню" },
        { command: "generate", description: "🎵 Создать трек" },
        { command: "library", description: "📚 Моя библиотека" },
        { command: "projects", description: "💿 Мои проекты" },
        { command: "app", description: "📱 Открыть приложение" },
        { command: "help", description: "❓ Справка" },
      ],
    }),
  }
);
```

**2. Deep Linking схема:**

| Deep Link | Назначение |
|-----------|-----------|
| `?startapp=generate` | Открыть страницу генерации |
| `?startapp=generate_ambient` | Генерация с предзаполненным стилем |
| `?startapp=track_<id>` | Открыть конкретный трек |
| `?startapp=project_<id>` | Открыть проект |
| `?startapp=library` | Открыть библиотеку |
| `?startapp=profile` | Открыть профиль |

**3. Frontend обработка deep links:**
```typescript
// src/hooks/useDeepLink.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';

export const useDeepLink = () => {
  const navigate = useNavigate();
  const { webApp } = useTelegram();

  useEffect(() => {
    if (!webApp) return;

    const startParam = webApp.initDataUnsafe?.start_param;

    if (!startParam) return;

    // Парсинг deep link параметра
    if (startParam === 'generate') {
      navigate('/generate');
    } else if (startParam.startsWith('generate_')) {
      const style = startParam.replace('generate_', '');
      navigate(`/generate?style=${style}`);
    } else if (startParam.startsWith('track_')) {
      const trackId = startParam.replace('track_', '');
      navigate(`/library?track=${trackId}`);
    } else if (startParam.startsWith('project_')) {
      const projectId = startParam.replace('project_', '');
      navigate(`/projects/${projectId}`);
    } else if (startParam === 'library') {
      navigate('/library');
    } else if (startParam === 'profile') {
      navigate('/profile');
    }

    // Логирование для аналитики
    console.log('Deep link opened:', startParam);

    // Отправить событие в аналитику
    // trackEvent('deep_link_open', { param: startParam });
  }, [webApp, navigate]);
};
```

**4. Использование в App.tsx:**
```typescript
// src/App.tsx
import { useDeepLink } from '@/hooks/useDeepLink';

function App() {
  useDeepLink(); // Обрабатывает deep links при запуске

  return (
    <Router>
      {/* ... routes */}
    </Router>
  );
}
```

**5. Создание deep links в боте:**
```typescript
// telegram-bot/utils/deep-links.ts
export function createDeepLink(param: string): string {
  const botUsername = Deno.env.get("BOT_USERNAME")!;
  return `https://t.me/${botUsername}/app?startapp=${param}`;
}

// Использование в командах
import { createDeepLink } from "../utils/deep-links.ts";

// В команде /library
const keyboard = new InlineKeyboard()
  .url("📱 Открыть библиотеку", createDeepLink("library"))
  .row()
  .url("🎵 Создать трек", createDeepLink("generate"));
```

#### Testing
```bash
# 1. Проверить Menu Button в Telegram
# 2. Нажать на Menu Button - должен открыться Mini App
# 3. Отправить /library в боте
# 4. Нажать кнопку "Открыть библиотеку"
# 5. Проверить, что открылась страница /library в Mini App
# 6. Протестировать все deep link варианты
```

#### Definition of Done
- ✅ Menu Button отображается в Telegram
- ✅ Deep links работают корректно
- ✅ Параметры передаются в Mini App
- ✅ Навигация в Mini App работает
- ✅ Аналитика логирует deep link клики
- ✅ Документация обновлена
- ✅ Code review пройден

---

### TASK-1.5: CloudStorage для синхронизации настроек
**Priority:** 🟡 High
**Story Points:** 3
**Assignee:** Frontend Developer
**Labels:** `frontend`, `telegram-sdk`, `storage`

#### Описание
Интегрировать CloudStorage API для синхронизации пользовательских настроек между устройствами.

#### Acceptance Criteria
- [ ] Hook `useTelegramStorage` создан
- [ ] Сохранение настроек в CloudStorage
- [ ] Загрузка настроек при старте
- [ ] Синхронизация между устройствами работает
- [ ] Fallback на localStorage если CloudStorage недоступен
- [ ] Типизация TypeScript

#### Технические требования

**1. Расширить типы Telegram SDK:**
```typescript
// src/types/telegram.d.ts
interface CloudStorage {
  setItem(key: string, value: string, callback?: (error: Error | null, success: boolean) => void): void;
  getItem(key: string, callback: (error: Error | null, value: string) => void): void;
  getItems(keys: string[], callback: (error: Error | null, values: Record<string, string>) => void): void;
  removeItem(key: string, callback?: (error: Error | null, success: boolean) => void): void;
  removeItems(keys: string[], callback?: (error: Error | null, success: boolean) => void): void;
  getKeys(callback: (error: Error | null, keys: string[]) => void): void;
}

interface TelegramWebApp {
  // ... existing properties
  CloudStorage: CloudStorage;
}
```

**2. Hook для работы с CloudStorage:**
```typescript
// src/hooks/useTelegramStorage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';

interface UserPreferences {
  favoriteStyles: string[];
  defaultTags: string[];
  generationSettings: {
    model: string;
    instrumental: boolean;
  };
  recentPrompts: string[];
  theme: 'light' | 'dark' | 'auto';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteStyles: [],
  defaultTags: [],
  generationSettings: {
    model: 'chirp-crow',
    instrumental: false,
  },
  recentPrompts: [],
  theme: 'auto',
};

export const useTelegramStorage = () => {
  const { webApp, isDevelopmentMode } = useTelegram();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Проверка доступности CloudStorage
  const isCloudStorageAvailable = useCallback(() => {
    return !isDevelopmentMode && webApp?.CloudStorage;
  }, [webApp, isDevelopmentMode]);

  // Загрузка настроек
  const loadPreferences = useCallback(async () => {
    setIsLoading(true);

    try {
      if (isCloudStorageAvailable()) {
        // Загрузка из Telegram CloudStorage
        webApp!.CloudStorage.getItem('user_preferences', (error, value) => {
          if (error) {
            console.error('CloudStorage error:', error);
            // Fallback на localStorage
            loadFromLocalStorage();
          } else if (value) {
            try {
              const parsed = JSON.parse(value);
              setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
            } catch (e) {
              console.error('Parse error:', e);
              setPreferences(DEFAULT_PREFERENCES);
            }
          } else {
            setPreferences(DEFAULT_PREFERENCES);
          }
          setIsLoading(false);
        });
      } else {
        // Development mode или CloudStorage недоступен
        loadFromLocalStorage();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Load preferences error:', error);
      setIsLoading(false);
    }
  }, [isCloudStorageAvailable, webApp]);

  // Fallback на localStorage
  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('user_preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (e) {
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
  };

  // Сохранение настроек
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    const serialized = JSON.stringify(updated);

    if (isCloudStorageAvailable()) {
      // Сохранение в Telegram CloudStorage
      webApp!.CloudStorage.setItem('user_preferences', serialized, (error, success) => {
        if (error) {
          console.error('CloudStorage save error:', error);
          // Fallback на localStorage
          localStorage.setItem('user_preferences', serialized);
        } else {
          console.log('Preferences saved to CloudStorage');
        }
      });
    } else {
      // Development mode
      localStorage.setItem('user_preferences', serialized);
    }
  }, [preferences, isCloudStorageAvailable, webApp]);

  // Добавить в избранное
  const addFavoriteStyle = useCallback((style: string) => {
    if (!preferences.favoriteStyles.includes(style)) {
      savePreferences({
        favoriteStyles: [...preferences.favoriteStyles, style],
      });
    }
  }, [preferences, savePreferences]);

  // Удалить из избранного
  const removeFavoriteStyle = useCallback((style: string) => {
    savePreferences({
      favoriteStyles: preferences.favoriteStyles.filter(s => s !== style),
    });
  }, [preferences, savePreferences]);

  // Добавить промпт в историю
  const addRecentPrompt = useCallback((prompt: string) => {
    const recent = [prompt, ...preferences.recentPrompts.filter(p => p !== prompt)].slice(0, 10);
    savePreferences({ recentPrompts: recent });
  }, [preferences, savePreferences]);

  // Обновить настройки генерации
  const updateGenerationSettings = useCallback((settings: Partial<UserPreferences['generationSettings']>) => {
    savePreferences({
      generationSettings: { ...preferences.generationSettings, ...settings },
    });
  }, [preferences, savePreferences]);

  // Загрузка при монтировании
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    savePreferences,
    addFavoriteStyle,
    removeFavoriteStyle,
    addRecentPrompt,
    updateGenerationSettings,
    isCloudStorageAvailable: isCloudStorageAvailable(),
  };
};
```

**3. Использование в компонентах:**
```typescript
// src/pages/Generate.tsx
import { useTelegramStorage } from '@/hooks/useTelegramStorage';

export default function Generate() {
  const {
    preferences,
    isLoading,
    addRecentPrompt,
    updateGenerationSettings,
  } = useTelegramStorage();

  const handleGenerate = async (prompt: string) => {
    // Сохранить в историю
    addRecentPrompt(prompt);

    // Генерация с настройками из CloudStorage
    const result = await generateMusic({
      prompt,
      model: preferences.generationSettings.model,
      instrumental: preferences.generationSettings.instrumental,
    });
  };

  return (
    <div>
      {/* UI */}
      <RecentPrompts prompts={preferences.recentPrompts} />
    </div>
  );
}
```

**4. Компонент настроек:**
```typescript
// src/components/SettingsPanel.tsx
import { useTelegramStorage } from '@/hooks/useTelegramStorage';
import { Badge } from '@/components/ui/badge';

export function SettingsPanel() {
  const { preferences, updateGenerationSettings, isCloudStorageAvailable } = useTelegramStorage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3>Настройки генерации</h3>
        {isCloudStorageAvailable && (
          <Badge variant="secondary">☁️ Синхронизировано</Badge>
        )}
      </div>

      <div>
        <label>Модель по умолчанию</label>
        <select
          value={preferences.generationSettings.model}
          onChange={(e) => updateGenerationSettings({ model: e.target.value })}
        >
          <option value="chirp-crow">chirp-crow (v5)</option>
          <option value="chirp-bluejay">chirp-bluejay (v4.5+)</option>
        </select>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={preferences.generationSettings.instrumental}
            onChange={(e) => updateGenerationSettings({ instrumental: e.target.checked })}
          />
          Инструментальная музыка
        </label>
      </div>
    </div>
  );
}
```

#### Testing
```bash
# 1. Открыть Mini App на устройстве 1
# 2. Изменить настройки генерации
# 3. Добавить стиль в избранное
# 4. Открыть Mini App на устройстве 2
# 5. Проверить, что настройки синхронизировались
# 6. Изменить настройки на устройстве 2
# 7. Обновить на устройстве 1 - проверить синхронизацию
```

#### Definition of Done
- ✅ CloudStorage API интегрирован
- ✅ Настройки сохраняются и загружаются
- ✅ Синхронизация между устройствами работает
- ✅ Fallback на localStorage реализован
- ✅ TypeScript типы добавлены
- ✅ Компоненты используют hook
- ✅ Тесты написаны
- ✅ Code review пройден

---

## 📊 Sprint 1 Review Checklist

После завершения Sprint 1 проверить:

- [ ] Бот отвечает на все команды
- [ ] Webhook стабильно работает
- [ ] Уведомления приходят при завершении генерации
- [ ] Menu Button отображается
- [ ] Deep links открывают нужные страницы
- [ ] CloudStorage синхронизирует настройки
- [ ] Документация обновлена
- [ ] Все тесты проходят
- [ ] Code review всех задач завершен
- [ ] Deploy на production выполнен

---

# 🎯 SPRINT 2: Mini App Advanced Features
**Цель:** Расширить функционал Mini App продвинутыми возможностями Telegram SDK

**Длительность:** 5 рабочих дней
**Story Points:** 18

---

## 📋 Задачи Sprint 2

### TASK-2.1: ShareToStory Integration
**Priority:** 🟡 High
**Story Points:** 3
**Assignee:** Frontend Developer
**Labels:** `frontend`, `telegram-sdk`, `sharing`

#### Описание
Реализовать функцию публикации треков в Telegram Stories.

#### Acceptance Criteria
- [ ] Кнопка "Поделиться в Stories" на карточках треков
- [ ] Генерация красивого превью для сторис
- [ ] Виджет-ссылка ведет в Mini App
- [ ] Работает на iOS и Android
- [ ] Обработка ошибок

#### Технические требования

**1. Расширить типы:**
```typescript
// src/types/telegram.d.ts
interface StoryShareParams {
  media_url: string;
  text?: string;
  widget_link?: {
    url: string;
    name?: string;
  };
}

interface TelegramWebApp {
  // ... existing
  shareToStoryMedia?: (params: StoryShareParams, callback?: (success: boolean) => void) => void;
}
```

**2. Hook для шаринга:**
```typescript
// src/hooks/useTelegramShare.tsx
import { useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';

interface ShareToStoryParams {
  trackId: string;
  title: string;
  coverImageUrl?: string;
  audioUrl: string;
}

export const useTelegramShare = () => {
  const { webApp } = useTelegram();

  const isStoryShareAvailable = useCallback(() => {
    return webApp?.shareToStoryMedia !== undefined;
  }, [webApp]);

  const shareToStory = useCallback(async ({ trackId, title, coverImageUrl, audioUrl }: ShareToStoryParams) => {
    if (!isStoryShareAvailable()) {
      toast.error('Публикация в Stories недоступна');
      return false;
    }

    try {
      // Создаем превью для сторис (можно использовать обложку трека)
      const mediaUrl = coverImageUrl || generateDefaultCover(title);

      const params = {
        media_url: mediaUrl,
        text: `🎵 ${title}\n\nСоздано с MusicVerse AI`,
        widget_link: {
          url: `https://t.me/musicverse_bot/app?startapp=track_${trackId}`,
          name: 'Слушать трек',
        },
      };

      return new Promise<boolean>((resolve) => {
        webApp!.shareToStoryMedia!(params, (success) => {
          if (success) {
            toast.success('Трек опубликован в Stories!');
            // Логирование
            trackEvent('share_to_story', { track_id: trackId });
            resolve(true);
          } else {
            toast.error('Не удалось опубликовать в Stories');
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Share to story error:', error);
      toast.error('Ошибка при публикации');
      return false;
    }
  }, [isStoryShareAvailable, webApp]);

  return {
    shareToStory,
    isStoryShareAvailable: isStoryShareAvailable(),
  };
};

// Генерация дефолтной обложки
function generateDefaultCover(title: string): string {
  // Используем сервис для генерации превью
  // Например, можно использовать canvas API или внешний сервис
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(title)}&backgroundColor=gradient`;
}
```

**3. Компонент кнопки:**
```typescript
// src/components/ShareToStoryButton.tsx
import { Button } from '@/components/ui/button';
import { useTelegramShare } from '@/hooks/useTelegramShare';
import { Share2 } from 'lucide-react';

interface ShareToStoryButtonProps {
  trackId: string;
  title: string;
  coverImageUrl?: string;
  audioUrl: string;
}

export function ShareToStoryButton({ trackId, title, coverImageUrl, audioUrl }: ShareToStoryButtonProps) {
  const { shareToStory, isStoryShareAvailable } = useTelegramShare();

  if (!isStoryShareAvailable) {
    return null; // Не показываем кнопку если функция недоступна
  }

  const handleShare = async () => {
    await shareToStory({ trackId, title, coverImageUrl, audioUrl });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="w-4 h-4" />
      В Stories
    </Button>
  );
}
```

**4. Использование в TrackCard:**
```typescript
// src/components/TrackCard.tsx
import { ShareToStoryButton } from '@/components/ShareToStoryButton';

export function TrackCard({ track }: { track: Track }) {
  return (
    <div className="track-card">
      {/* ... other content */}

      <div className="flex gap-2">
        <Button>Воспроизвести</Button>
        <ShareToStoryButton
          trackId={track.id}
          title={track.title}
          coverImageUrl={track.cover_image_url}
          audioUrl={track.audio_url}
        />
      </div>
    </div>
  );
}
```

#### Testing
```bash
# 1. Открыть Mini App в Telegram (iOS или Android)
# 2. Открыть трек из библиотеки
# 3. Нажать кнопку "В Stories"
# 4. Проверить, что открылся редактор Stories
# 5. Проверить превью
# 6. Опубликовать
# 7. Проверить, что виджет-ссылка работает
```

#### Definition of Done
- ✅ Кнопка отображается на карточках треков
- ✅ Публикация в Stories работает
- ✅ Превью генерируется корректно
- ✅ Виджет-ссылка открывает Mini App
- ✅ Аналитика логирует шаринг
- ✅ Тесты написаны
- ✅ Code review пройден

---

### TASK-2.2: SettingsButton и SecondaryButton
**Priority:** 🟡 High
**Story Points:** 2
**Assignee:** Frontend Developer
**Labels:** `frontend`, `telegram-sdk`, `ui`

#### Описание
Добавить SettingsButton в header и SecondaryButton для дополнительных действий.

#### Acceptance Criteria
- [ ] SettingsButton отображается в header
- [ ] Клик открывает страницу настроек
- [ ] SecondaryButton показывается контекстно
- [ ] Кнопки работают на всех платформах
- [ ] Состояние кнопок управляется из компонентов

#### Технические требования

**1. Расширить TelegramContext:**
```typescript
// src/contexts/TelegramContext.tsx

interface TelegramContextType {
  // ... existing
  showSettingsButton: () => void;
  hideSettingsButton: () => void;
  showSecondaryButton: (text: string, onClick: () => void) => void;
  hideSecondaryButton: () => void;
}

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  // ... existing state

  const showSettingsButton = useCallback(() => {
    if (webApp?.SettingsButton) {
      webApp.SettingsButton.show();
    }
  }, [webApp]);

  const hideSettingsButton = useCallback(() => {
    if (webApp?.SettingsButton) {
      webApp.SettingsButton.hide();
    }
  }, [webApp]);

  const showSecondaryButton = useCallback((text: string, onClick: () => void) => {
    if (webApp?.SecondaryButton) {
      webApp.SecondaryButton.setText(text);
      webApp.SecondaryButton.onClick(onClick);
      webApp.SecondaryButton.show();
    }
  }, [webApp]);

  const hideSecondaryButton = useCallback(() => {
    if (webApp?.SecondaryButton) {
      webApp.SecondaryButton.hide();
      webApp.SecondaryButton.offClick(() => {});
    }
  }, [webApp]);

  return (
    <TelegramContext.Provider
      value={{
        // ... existing
        showSettingsButton,
        hideSettingsButton,
        showSecondaryButton,
        hideSecondaryButton,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};
```

**2. Глобальная настройка SettingsButton:**
```typescript
// src/App.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';

function App() {
  const navigate = useNavigate();
  const { webApp, showSettingsButton } = useTelegram();

  useEffect(() => {
    if (!webApp?.SettingsButton) return;

    // Показать кнопку настроек
    showSettingsButton();

    // Обработчик клика
    const handleSettingsClick = () => {
      navigate('/settings');
    };

    webApp.SettingsButton.onClick(handleSettingsClick);

    return () => {
      webApp.SettingsButton.offClick(handleSettingsClick);
    };
  }, [webApp, showSettingsButton, navigate]);

  return (
    <Router>
      {/* routes */}
    </Router>
  );
}
```

**3. Контекстное использование SecondaryButton:**
```typescript
// src/pages/Generate.tsx
import { useEffect, useState } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';

export default function Generate() {
  const { showSecondaryButton, hideSecondaryButton } = useTelegram();
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    // Показываем кнопку "Сохранить шаблон" если есть промпт
    if (currentPrompt.trim()) {
      showSecondaryButton('💾 Сохранить шаблон', () => {
        savePromptTemplate(currentPrompt);
      });
    } else {
      hideSecondaryButton();
    }

    return () => {
      hideSecondaryButton();
    };
  }, [currentPrompt, showSecondaryButton, hideSecondaryButton]);

  const savePromptTemplate = (prompt: string) => {
    // Логика сохранения шаблона
    toast.success('Шаблон сохранен!');
  };

  return (
    <div>
      <textarea
        value={currentPrompt}
        onChange={(e) => setCurrentPrompt(e.target.value)}
        placeholder="Опишите музыку..."
      />
    </div>
  );
}
```

**4. Разные контексты для SecondaryButton:**
```typescript
// src/pages/Library.tsx - "Выбрать все"
useEffect(() => {
  if (selectionMode) {
    showSecondaryButton('✓ Выбрать все', selectAllTracks);
  } else {
    hideSecondaryButton();
  }
}, [selectionMode]);

// src/pages/ProjectDetail.tsx - "Экспорт проекта"
useEffect(() => {
  showSecondaryButton('📤 Экспорт', exportProject);
  return () => hideSecondaryButton();
}, []);

// src/pages/Profile.tsx - "Выйти"
useEffect(() => {
  showSecondaryButton('🚪 Выйти', logout);
  return () => hideSecondaryButton();
}, []);
```

#### Testing
```bash
# 1. Открыть Mini App
# 2. Проверить, что в header есть кнопка настроек (⚙️)
# 3. Нажать на кнопку настроек - должна открыться /settings
# 4. Перейти на страницу генерации
# 5. Ввести промпт
# 6. Проверить появление кнопки "Сохранить шаблон"
# 7. Нажать - проверить сохранение
# 8. Перейти на другую страницу
# 9. Проверить смену текста SecondaryButton
```

#### Definition of Done
- ✅ SettingsButton отображается и работает
- ✅ SecondaryButton показывается контекстно
- ✅ Кнопки работают на iOS/Android
- ✅ Состояние управляется правильно
- ✅ Cleanup в useEffect реализован
- ✅ Тесты написаны
- ✅ Code review пройден

---

### TASK-2.3: QR Scanner для коллабораций
**Priority:** 🟢 Medium
**Story Points:** 3
**Assignee:** Frontend Developer
**Labels:** `frontend`, `telegram-sdk`, `collaboration`

#### Описание
Реализовать сканирование QR кодов для быстрого добавления коллабораторов в проекты.

#### Acceptance Criteria
- [ ] Кнопка "Сканировать QR" в разделе коллабораций
- [ ] QR Scanner открывается корректно
- [ ] Сканирование работает на iOS/Android
- [ ] Добавление коллаборатора после сканирования
- [ ] Генерация собственного QR кода профиля
- [ ] Обработка ошибок

#### Технические требования

**1. Расширить типы:**
```typescript
// src/types/telegram.d.ts
interface QrTextReceived {
  data: string;
}

interface TelegramWebApp {
  // ... existing
  showScanQrPopup?: (params: { text?: string }, callback?: (data: string | null) => void) => void;
  closeScanQrPopup?: () => void;
}
```

**2. Hook для QR Scanner:**
```typescript
// src/hooks/useQRScanner.tsx
import { useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';

export const useQRScanner = () => {
  const { webApp } = useTelegram();

  const isQRScannerAvailable = useCallback(() => {
    return webApp?.showScanQrPopup !== undefined;
  }, [webApp]);

  const scanQR = useCallback(async (text?: string): Promise<string | null> => {
    if (!isQRScannerAvailable()) {
      toast.error('QR сканер недоступен');
      return null;
    }

    return new Promise((resolve) => {
      try {
        webApp!.showScanQrPopup!(
          { text: text || 'Отсканируйте QR код' },
          (data) => {
            if (data) {
              resolve(data);
            } else {
              // Пользователь закрыл сканер
              resolve(null);
            }
          }
        );
      } catch (error) {
        console.error('QR scan error:', error);
        toast.error('Ошибка сканирования');
        resolve(null);
      }
    });
  }, [isQRScannerAvailable, webApp]);

  const closeScanner = useCallback(() => {
    if (webApp?.closeScanQrPopup) {
      webApp.closeScanQrPopup();
    }
  }, [webApp]);

  return {
    scanQR,
    closeScanner,
    isQRScannerAvailable: isQRScannerAvailable(),
  };
};
```

**3. Генерация QR кода профиля:**
```typescript
// src/components/ProfileQRCode.tsx
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

export function ProfileQRCode() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Генерируем ссылку для QR кода
  const qrData = `musicverse://user/${user?.id}`;

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Мой QR код
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <div className="flex flex-col items-center gap-4 p-4">
            <h3 className="text-lg font-semibold">Мой профиль</h3>
            <QRCodeSVG
              value={qrData}
              size={256}
              level="H"
              includeMargin
            />
            <p className="text-sm text-muted-foreground text-center">
              Отсканируйте этот код, чтобы добавить меня в коллабораторы
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**4. Страница коллабораций:**
```typescript
// src/pages/Collaborations.tsx
import { useState } from 'react';
import { useQRScanner } from '@/hooks/useQRScanner';
import { Button } from '@/components/ui/button';
import { ProfileQRCode } from '@/components/ProfileQRCode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Collaborations() {
  const { scanQR, isQRScannerAvailable } = useQRScanner();
  const [isScanning, setIsScanning] = useState(false);

  const handleScanCollaborator = async () => {
    setIsScanning(true);

    try {
      const data = await scanQR('Отсканируйте QR код коллеги');

      if (!data) {
        // Пользователь отменил сканирование
        return;
      }

      // Парсим данные QR кода
      if (data.startsWith('musicverse://user/')) {
        const userId = data.replace('musicverse://user/', '');

        // Получаем профиль пользователя
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error || !profile) {
          toast.error('Пользователь не найден');
          return;
        }

        // Добавляем в коллабораторы
        await addCollaborator(profile);
        toast.success(`${profile.first_name} добавлен в коллабораторы!`);
      } else {
        toast.error('Неверный QR код');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Ошибка сканирования');
    } finally {
      setIsScanning(false);
    }
  };

  const addCollaborator = async (profile: any) => {
    // Логика добавления коллаборатора
    // Например, в таблицу collaborators
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Коллаборации</h1>

      <div className="space-y-4">
        <ProfileQRCode />

        {isQRScannerAvailable && (
          <Button
            onClick={handleScanCollaborator}
            disabled={isScanning}
            className="w-full"
          >
            {isScanning ? 'Сканирование...' : '📷 Сканировать QR код'}
          </Button>
        )}
      </div>

      {/* Список коллабораторов */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Мои коллабораторы</h2>
        {/* ... список */}
      </div>
    </div>
  );
}
```

**5. Добавить зависимость:**
```json
// package.json
{
  "dependencies": {
    "qrcode.react": "^3.1.0"
  }
}
```

#### Testing
```bash
# 1. Открыть страницу Collaborations
# 2. Нажать "Мой QR код" - проверить отображение
# 3. Нажать "Сканировать QR код"
# 4. Проверить открытие сканера
# 5. Отсканировать QR код другого пользователя
# 6. Проверить добавление в коллабораторы
# 7. Проверить обработку ошибок (неверный QR)
```

#### Definition of Done
- ✅ QR Scanner работает
- ✅ Генерация собственного QR кода
- ✅ Добавление коллабораторов работает
- ✅ Обработка ошибок реализована
- ✅ UI/UX отполирован
- ✅ Тесты написаны
- ✅ Code review пройден

---

### TASK-2.4: Biometric Authentication
**Priority:** 🟢 Medium
**Story Points:** 3
**Assignee:** Frontend Developer
**Labels:** `frontend`, `telegram-sdk`, `security`

#### Описание
Добавить биометрическую аутентификацию для защиты премиум функций.

#### Acceptance Criteria
- [ ] Проверка доступности биометрии
- [ ] Запрос биометрической аутентификации
- [ ] Защита премиум функций (AI обложки, экспорт проектов)
- [ ] Настройка включения/выключения биометрии
- [ ] Fallback на пароль если биометрия недоступна
- [ ] Работает на iOS/Android

#### Технические требования

**1. Типы:**
```typescript
// src/types/telegram.d.ts
interface BiometricManager {
  isInited: boolean;
  isBiometricAvailable: boolean;
  biometricType: 'finger' | 'face' | 'unknown';
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  isBiometricTokenSaved: boolean;
  deviceId: string;

  init(callback?: () => void): void;
  requestAccess(params: { reason?: string }, callback?: (granted: boolean) => void): void;
  authenticate(params: { reason?: string }, callback?: (success: boolean, token?: string) => void): void;
  updateBiometricToken(token: string, callback?: (success: boolean) => void): void;
  openSettings(): void;
}

interface TelegramWebApp {
  // ... existing
  BiometricManager: BiometricManager;
}
```

**2. Hook для биометрии:**
```typescript
// src/hooks/useBiometric.tsx
import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';

export const useBiometric = () => {
  const { webApp } = useTelegram();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [biometricType, setBiometricType] = useState<'finger' | 'face' | 'unknown'>('unknown');

  useEffect(() => {
    if (!webApp?.BiometricManager) return;

    const manager = webApp.BiometricManager;

    // Инициализация
    if (!manager.isInited) {
      manager.init(() => {
        setIsInitialized(true);
        setIsAvailable(manager.isBiometricAvailable);
        setBiometricType(manager.biometricType);
      });
    } else {
      setIsInitialized(true);
      setIsAvailable(manager.isBiometricAvailable);
      setBiometricType(manager.biometricType);
    }
  }, [webApp]);

  const requestAccess = useCallback(async (reason?: string): Promise<boolean> => {
    if (!webApp?.BiometricManager || !isAvailable) {
      return false;
    }

    return new Promise((resolve) => {
      webApp.BiometricManager.requestAccess(
        { reason: reason || 'Требуется доступ к биометрии' },
        (granted) => {
          if (granted) {
            toast.success('Доступ к биометрии предоставлен');
          } else {
            toast.error('Доступ к биометрии отклонен');
          }
          resolve(granted);
        }
      );
    });
  }, [webApp, isAvailable]);

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!webApp?.BiometricManager || !isAvailable) {
      toast.error('Биометрия недоступна');
      return false;
    }

    const manager = webApp.BiometricManager;

    // Проверяем, есть ли доступ
    if (!manager.isAccessGranted) {
      const granted = await requestAccess(reason);
      if (!granted) return false;
    }

    return new Promise((resolve) => {
      manager.authenticate(
        { reason: reason || 'Подтвердите действие' },
        (success, token) => {
          if (success) {
            toast.success('Аутентификация успешна');
            resolve(true);
          } else {
            toast.error('Аутентификация не прошла');
            resolve(false);
          }
        }
      );
    });
  }, [webApp, isAvailable, requestAccess]);

  const openSettings = useCallback(() => {
    if (webApp?.BiometricManager) {
      webApp.BiometricManager.openSettings();
    }
  }, [webApp]);

  return {
    isAvailable,
    isInitialized,
    biometricType,
    authenticate,
    requestAccess,
    openSettings,
  };
};
```

**3. Компонент для защиты функций:**
```typescript
// src/components/BiometricProtected.tsx
import { ReactNode } from 'react';
import { useBiometric } from '@/hooks/useBiometric';
import { Button } from '@/components/ui/button';
import { Lock, Fingerprint } from 'lucide-react';

interface BiometricProtectedProps {
  children: ReactNode;
  reason?: string;
  fallback?: ReactNode;
  onAuthenticated?: () => void;
}

export function BiometricProtected({
  children,
  reason,
  fallback,
  onAuthenticated,
}: BiometricProtectedProps) {
  const { isAvailable, biometricType, authenticate } = useBiometric();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticate = async () => {
    const success = await authenticate(reason);
    if (success) {
      setIsAuthenticated(true);
      onAuthenticated?.();
    }
  };

  if (!isAvailable) {
    // Биометрия недоступна - показываем fallback или контент
    return <>{fallback || children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <Lock className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Требуется аутентификация</h3>
        <p className="text-sm text-muted-foreground text-center">
          {reason || 'Эта функция защищена биометрией'}
        </p>
        <Button onClick={handleAuthenticate} className="gap-2">
          <Fingerprint className="w-4 h-4" />
          Подтвердить {biometricType === 'face' ? 'Face ID' : 'Touch ID'}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
```

**4. Использование:**
```typescript
// src/pages/GenerateCoverImage.tsx
import { BiometricProtected } from '@/components/BiometricProtected';

export default function GenerateCoverImage() {
  return (
    <BiometricProtected
      reason="Подтвердите доступ к AI-генерации обложек"
      fallback={<PremiumFeatureLockedMessage />}
      onAuthenticated={() => {
        console.log('User authenticated for cover generation');
      }}
    >
      <CoverImageGenerator />
    </BiometricProtected>
  );
}

// src/pages/ExportProject.tsx
export default function ExportProject({ projectId }: { projectId: string }) {
  const { authenticate } = useBiometric();

  const handleExport = async () => {
    const authenticated = await authenticate('Подтвердите экспорт проекта');

    if (authenticated) {
      // Выполнить экспорт
      await exportProjectToFile(projectId);
    }
  };

  return (
    <Button onClick={handleExport}>
      Экспортировать проект
    </Button>
  );
}
```

**5. Настройки биометрии:**
```typescript
// src/components/BiometricSettings.tsx
import { useBiometric } from '@/hooks/useBiometric';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export function BiometricSettings() {
  const { isAvailable, biometricType, requestAccess, openSettings } = useBiometric();
  const [enabled, setEnabled] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const granted = await requestAccess('Включить биометрическую защиту');
      setEnabled(granted);
    } else {
      setEnabled(false);
    }
  };

  if (!isAvailable) {
    return (
      <div className="text-sm text-muted-foreground">
        Биометрия недоступна на этом устройстве
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Биометрическая защита</h4>
          <p className="text-sm text-muted-foreground">
            Защита премиум функций с помощью {biometricType === 'face' ? 'Face ID' : 'Touch ID'}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <Button variant="outline" size="sm" onClick={openSettings}>
          Настройки биометрии
        </Button>
      )}
    </div>
  );
}
```

#### Testing
```bash
# 1. Открыть настройки
# 2. Включить биометрическую защиту
# 3. Предоставить доступ
# 4. Перейти к генерации AI обложки
# 5. Проверить запрос биометрии
# 6. Подтвердить Touch ID / Face ID
# 7. Проверить доступ к функции
# 8. Выключить биометрию
# 9. Проверить, что запрос не появляется
```

#### Definition of Done
- ✅ Биометрия инициализируется
- ✅ Запрос доступа работает
- ✅ Аутентификация работает
- ✅ Премиум функции защищены
- ✅ Настройки биометрии реализованы
- ✅ Fallback для недоступной биометрии
- ✅ Тесты написаны
- ✅ Code review пройден

---

*(Продолжение следует в следующих спринтах...)*

---

## 📊 Общая статистика

**Sprint 1:** 21 SP (Telegram Bot Core + Notifications)
**Sprint 2:** 18 SP (Mini App Advanced Features)
**Sprint 3:** 24 SP (Bot-App Integration + Payments) - TBD
**Sprint 4:** 15 SP (Advanced Features + Polish) - TBD

**Итого:** 78 Story Points

---

## 🎯 Следующие шаги

1. Review и одобрение плана спринта
2. Создание задач в системе трекинга (Jira/Linear/GitHub Projects)
3. Назначение задач разработчикам
4. Kick-off meeting для Sprint 1
5. Ежедневные stand-ups
6. Sprint review по окончанию Sprint 1

---

**Создано:** 2025-11-29
**Автор:** Claude Code
**Версия:** 1.0
