# 🤖 Telegram Bot Architecture (MusicVerse)

## Версия: 2.0 (Native App Interface)

## 📋 Оглавление
- [Обзор](#обзор)
- [Технический стек](#технический-стек)
- [Архитектура](#архитектура)
- [Интерфейсы данных](#интерфейсы-данных)
- [User Flow](#user-flow)
- [Реализация](#реализация)
- [Deployment](#deployment)

---

## Обзор

MusicVerse Bot - это Telegram-бот с **реактивным интерфейсом в стиле Native App**. Вместо отправки множества сообщений, бот обновляет **одно активное сообщение** с медиа-контентом (изображения, обложки треков) и inline-кнопками.

### Ключевые особенности:
- ✅ **SPA-подобный UX** внутри чата (без спама сообщениями)
- ✅ **Реактивное обновление**: `editMessageMedia` для смены картинок
- ✅ **Deep Linking**: `t.me/bot?start=track_123`
- ✅ **Seamless Auth**: интеграция с Mini App через `initData`
- ✅ **Native Audio Player**: отправка аудио с метаданными

---

## Технический стек

### Runtime & Framework
```json
{
  "runtime": "Node.js 20+",
  "framework": "grammY 1.x",
  "language": "TypeScript 5.x",
  "database": "Supabase (PostgreSQL)",
  "deployment": "Docker + Supabase Edge Functions"
}
```

### Основные зависимости
```typescript
// package.json (extract)
{
  "grammy": "^1.19.0",           // Core framework
  "@grammyjs/menu": "^1.2.1",    // Interactive menus
  "@grammyjs/runner": "^2.0.3",  // High-load support
  "@supabase/supabase-js": "^2.x"
}
```

---

## Архитектура

### Структура проекта
```
supabase/functions/telegram-bot/
├── bot/
│   ├── handlers/          # Обработчики команд и callback-ов
│   │   ├── navigation.ts  # Навигация между экранами
│   │   ├── media.ts       # Отправка аудио/stems
│   │   ├── projects.ts    # Экран проектов
│   │   └── library.ts     # Экран библиотеки (плеер)
│   ├── menus/             # Конструкторы клавиатур
│   │   ├── main-menu.ts   # Главное меню
│   │   ├── player.ts      # Плеер (controls)
│   │   └── share-menu.ts  # Меню шаринга
│   └── middleware/        # Middleware
│       ├── auth.ts        # Авторизация через Supabase
│       └── session.ts     # State management
├── core/
│   ├── services/          # API к бэкенду
│   │   ├── music.ts       # Работа с треками
│   │   ├── suno.ts        # Suno API
│   │   └── storage.ts     # Supabase Storage
│   └── types/             # TypeScript интерфейсы
│       └── bot.ts         # BotContext, Track, Project
├── utils/                 # Хелперы
│   ├── formatting.ts      # Форматирование текста
│   └── pagination.ts      # Пагинация списков
└── index.ts               # Точка входа (Webhook handler)
```

### Паттерн "Single Message UI"

**Проблема**: Telegram боты часто спамят сообщениями при навигации.

**Решение**: Использование `editMessageMedia` для обновления контента:

```typescript
// ❌ Старый подход (спам)
await ctx.reply("Трек 1");
await ctx.reply("Трек 2");
await ctx.reply("Трек 3");

// ✅ Новый подход (обновление)
await ctx.editMessageMedia({
  type: "photo",
  media: track.coverUrl,
  caption: `🎧 ${track.title}`
}, { reply_markup: playerControls });
```

---

## Интерфейсы данных

### Типы TypeScript

```typescript
// core/types/bot.ts

import { Context, SessionFlavor } from "grammy";

/** Трек в системе */
export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;          // В секундах
  coverUrl: string;          // URL обложки (для медиа)
  audioUrl: string;          // URL mp3/wav файла
  localAudioUrl?: string;    // Supabase Storage URL
  fileId?: string;           // Telegram file_id (кэш)
  tags: string[];            // ["Pop", "Electronic"]
  status: 'pending' | 'completed' | 'failed';
}

/** Проект (альбом/плейлист) */
export interface Project {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracksCount: number;
  createdAt: string;
}

/** Состояние сессии бота */
export interface SessionData {
  currentTrackIndex: number;   // Текущий трек в библиотеке
  currentProjectIndex: number; // Текущий проект
  lastMessageId?: number;      // ID активного сообщения
  view: 'main' | 'library' | 'projects' | 'settings';
}

/** Расширенный контекст бота */
export type BotContext = Context & SessionFlavor<SessionData>;
```

---

## User Flow

### 1. Главное меню (`/start`)

```
┌─────────────────────────────┐
│  🎵 MusicVerse AI Platform  │
│  [Баннер изображение]       │
│                             │
│  Создавайте музыку с ИИ     │
├─────────────────────────────┤
│  [🚀 OPEN STUDIO]           │ ← WebApp
│  [🎹 Проекты] [🎧 Библиотека]│
│  [ℹ️ О нас] [⚙️ Настройки]   │
└─────────────────────────────┘
```

**Реализация**:
```typescript
bot.command("start", async (ctx) => {
  await ctx.replyWithPhoto(BANNER_URL, {
    caption: "🎵 <b>MusicVerse AI</b>\n\nВыберите раздел:",
    parse_mode: "HTML",
    reply_markup: MainMenu
  });
});
```

---

### 2. Экран "Библиотека" (Плеер)

```
┌─────────────────────────────┐
│  [Обложка трека]            │ ← Dynamic image
│                             │
│  🎧 Sunset Dreams           │
│  👤 AI Artist               │
│  🏷 #Pop #Chill             │
│  💿 Трек 1 из 5             │
├─────────────────────────────┤
│  [⏮️] [ ▶️ PLAY ] [⏭️]      │
│  [❤️ Like] [⬇️] [✂️ Stems]  │
│  [🔙 Назад]                 │
└─────────────────────────────┘
```

**Навигация**:
- `⏮️` / `⏭️` → Смена трека (пагинация)
- `▶️ PLAY` → Отправка аудио файла
- `✂️ Stems` → Запрос на разделение на стемы

**Реализация**:
```typescript
// Обновление трека при навигации
async function renderTrack(ctx: BotContext, index: number) {
  const tracks = await musicService.getTracks(ctx.from!.id);
  const track = tracks[index];

  await ctx.editMessageMedia({
    type: "photo",
    media: track.coverUrl,
    caption: formatTrackInfo(track, index, tracks.length)
  }, { 
    reply_markup: PlayerControls(track.id, index, tracks.length) 
  });
}
```

---

### 3. Экран "Проекты"

```
┌─────────────────────────────┐
│  [Обложка альбома]          │
│                             │
│  📁 My Summer EP            │
│  5 треков • 15 минут        │
│  Создан: 12.12.2024         │
├─────────────────────────────┤
│  [⬅️] [Проект 1/3] [➡️]     │
│  [📂 Открыть в Studio]      │
│  [🔙 Назад]                 │
└─────────────────────────────┘
```

---

## Реализация

### 1. Главное меню (menus/main-menu.ts)

```typescript
import { InlineKeyboard } from "grammy";

const WEB_APP_URL = "https://music.how2ai.agency";

export const createMainMenuKeyboard = () => {
  return new InlineKeyboard()
    .webApp("🚀 OPEN STUDIO", { url: WEB_APP_URL }).row()
    .text("🎹 Проекты", "nav_projects")
    .text("🎧 Библиотека", "nav_library").row()
    .text("ℹ️ О платформе", "nav_about")
    .text("⚙️ Настройки", "nav_settings");
};

export const createPlayerControls = (
  trackId: string, 
  page: number, 
  total: number
) => {
  const prev = page > 0 ? page - 1 : total - 1;
  const next = page < total - 1 ? page + 1 : 0;

  return new InlineKeyboard()
    .text("⏮️", `lib_page_${prev}`)
    .text("▶️ PLAY", `play_${trackId}`)
    .text("⏭️", `lib_page_${next}`).row()
    .text("❤️", `like_${trackId}`)
    .text("⬇️ Файл", `dl_${trackId}`)
    .text("✂️ Stems", `stems_${trackId}`).row()
    .text("🔙 В меню", "nav_main");
};
```

---

### 2. Навигация (handlers/navigation.ts)

```typescript
import { Composer } from "grammy";
import { BotContext } from "../../core/types/bot";
import { musicService } from "../../core/services/music";

export const navigationHandler = new Composer<BotContext>();

// Переход в библиотеку
navigationHandler.callbackQuery("nav_library", async (ctx) => {
  ctx.session.view = 'library';
  ctx.session.currentTrackIndex = 0;
  await renderTrack(ctx, 0);
  await ctx.answerCallbackQuery();
});

// Пагинация треков
navigationHandler.callbackQuery(/lib_page_(\d+)/, async (ctx) => {
  const page = parseInt(ctx.match![1]);
  ctx.session.currentTrackIndex = page;
  await renderTrack(ctx, page);
  await ctx.answerCallbackQuery();
});

// Возврат в главное меню
navigationHandler.callbackQuery("nav_main", async (ctx) => {
  ctx.session.view = 'main';
  
  await ctx.editMessageMedia({
    type: "photo",
    media: MAIN_BANNER_URL,
    caption: "🏠 <b>Главное меню</b>\nВыберите раздел:",
    parse_mode: "HTML"
  }, { reply_markup: createMainMenuKeyboard() });
  
  await ctx.answerCallbackQuery();
});

// Helper: Рендер карточки трека
async function renderTrack(ctx: BotContext, index: number) {
  const userId = ctx.from!.id.toString();
  const tracks = await musicService.getUserTracks(userId);
  
  if (!tracks.length) {
    await ctx.answerCallbackQuery("❌ У вас нет треков");
    return;
  }

  const track = tracks[index];
  const caption = formatTrackCaption(track, index, tracks.length);

  try {
    await ctx.editMessageMedia({
      type: "photo",
      media: track.coverUrl,
      caption,
      parse_mode: "HTML"
    }, { 
      reply_markup: createPlayerControls(track.id, index, tracks.length) 
    });
  } catch (error) {
    console.error("Failed to update track:", error);
    await ctx.answerCallbackQuery("⚠️ Ошибка обновления");
  }
}

function formatTrackCaption(track: Track, index: number, total: number): string {
  return `🎧 <b>${escapeHtml(track.title)}</b>\n` +
         `👤 ${escapeHtml(track.artist)}\n` +
         `🏷 <i>${track.tags.map(t => '#' + t).join(' ')}</i>\n\n` +
         `💿 Трек ${index + 1} из ${total}`;
}
```

---

### 3. Медиа-обработчик (handlers/media.ts)

```typescript
import { Composer } from "grammy";
import { BotContext } from "../../core/types/bot";
import { musicService } from "../../core/services/music";
import { InputFile } from "grammy";

export const mediaHandler = new Composer<BotContext>();

// Воспроизведение трека
mediaHandler.callbackQuery(/play_(.+)/, async (ctx) => {
  const trackId = ctx.match![1];
  
  await ctx.answerCallbackQuery("🚀 Загружаем трек...");
  
  const track = await musicService.getTrackById(trackId);
  
  if (!track.audioUrl && !track.localAudioUrl) {
    await ctx.reply("❌ Трек недоступен");
    return;
  }

  const audioUrl = track.localAudioUrl || track.audioUrl;

  // Отправляем аудио с метаданными
  await ctx.replyWithAudio(audioUrl, {
    title: track.title,
    performer: track.artist,
    thumbnail: track.coverUrl,
    caption: `▶️ <b>${escapeHtml(track.title)}</b>\n` +
             `🎵 Длительность: ${formatDuration(track.duration)}`,
    parse_mode: "HTML"
  });
});

// Скачивание трека
mediaHandler.callbackQuery(/dl_(.+)/, async (ctx) => {
  const trackId = ctx.match![1];
  const track = await musicService.getTrackById(trackId);
  
  await ctx.answerCallbackQuery("📥 Скачиваем...");
  
  // Отправляем как документ (файл)
  await ctx.replyWithDocument(track.audioUrl, {
    caption: `📥 ${track.title}.mp3`,
    file_name: `${sanitizeFilename(track.title)}.mp3`
  });
});

// Запрос на stems
mediaHandler.callbackQuery(/stems_(.+)/, async (ctx) => {
  const trackId = ctx.match![1];
  
  await ctx.answerCallbackQuery("✂️ Задача создана!");
  
  // Создаем задачу в БД
  await musicService.createStemsTask(trackId, ctx.from!.id);
  
  await ctx.reply(
    "⏳ <b>Генерация стемов началась</b>\n\n" +
    "Мы пришлем уведомление, когда файлы будут готовы.\n" +
    "Обычно это занимает 2-5 минут.",
    { parse_mode: "HTML" }
  );
});

// Лайк трека
mediaHandler.callbackQuery(/like_(.+)/, async (ctx) => {
  const trackId = ctx.match![1];
  const userId = ctx.from!.id.toString();
  
  const isLiked = await musicService.toggleLike(trackId, userId);
  
  await ctx.answerCallbackQuery(
    isLiked ? "❤️ Добавлено в избранное" : "💔 Удалено из избранного"
  );
});
```

---

### 4. Deep Linking

```typescript
// index.ts
bot.command("start", async (ctx) => {
  const payload = ctx.match; // "track_123abc" или ""
  
  // Deep link на конкретный трек
  if (payload && payload.startsWith("track_")) {
    const trackId = payload.replace("track_", "");
    return await showTrackById(ctx, trackId);
  }

  // Deep link на проект
  if (payload && payload.startsWith("project_")) {
    const projectId = payload.replace("project_", "");
    return await showProjectById(ctx, projectId);
  }

  // Обычный старт -> Главное меню
  await ctx.replyWithPhoto(MAIN_BANNER_URL, {
    caption: "🎵 <b>Добро пожаловать в MusicVerse</b>\n\n" +
             "Создавайте музыку с помощью ИИ прямо в Telegram!",
    parse_mode: "HTML",
    reply_markup: createMainMenuKeyboard()
  });
});

async function showTrackById(ctx: BotContext, trackId: string) {
  const track = await musicService.getTrackById(trackId);
  
  if (!track) {
    await ctx.reply("❌ Трек не найден");
    return;
  }

  await ctx.replyWithPhoto(track.coverUrl, {
    caption: formatTrackCaption(track, 0, 1),
    parse_mode: "HTML",
    reply_markup: createPlayerControls(track.id, 0, 1)
  });
}
```

---

### 5. Интеграция с Mini App

#### Frontend (React)

```typescript
// src/hooks/useTelegramAuth.ts
import { useEffect } from 'react';
import { authService } from '@/services/auth';

export const useTelegramAuth = () => {
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;
    
    if (initData) {
      // Отправляем на бэкенд для валидации
      authService.loginWithTelegram(initData)
        .then(token => {
          localStorage.setItem('auth_token', token);
        })
        .catch(err => {
          console.error('Telegram auth failed:', err);
        });
    }
  }, []);
};
```

#### Backend (Edge Function)

```typescript
// supabase/functions/telegram-auth/index.ts
import { createHmac } from 'crypto';

export async function validateTelegramAuth(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  // Сортируем параметры
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  
  // Проверяем подпись
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = createHmac('sha256', secret).update(sortedParams).digest('hex');
  
  if (hash !== calculatedHash) {
    throw new Error('Invalid auth signature');
  }
  
  return JSON.parse(params.get('user') || '{}');
}
```

---

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production

EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### Environment Variables

```bash
# .env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
MINI_APP_URL=https://music.how2ai.agency
WEBHOOK_URL=https://xxx.supabase.co/functions/v1/telegram-bot
```

### Webhook Setup

```typescript
// supabase/functions/telegram-webhook-setup/index.ts
const setWebhook = async () => {
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message', 'callback_query', 'inline_query']
      })
    }
  );
  
  return response.json();
};
```

---

## Лучшие практики

### 1. Обработка ошибок

```typescript
async function safeEditMedia(ctx: BotContext, media: InputMediaPhoto) {
  try {
    await ctx.editMessageMedia(media);
  } catch (error) {
    if (error.message.includes('message is not modified')) {
      // Игнорируем, если контент не изменился
      return;
    }
    
    // Fallback: отправляем новое сообщение
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: ctx.msg?.reply_markup
    });
  }
}
```

### 2. Экранирование HTML

```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

### 3. Логирование

```typescript
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  
  console.log(`[${ctx.from?.id}] ${ctx.updateType} - ${ms}ms`);
});
```

---

## Roadmap

### Phase 1: Core (✅ Completed)
- [x] Базовая навигация (main → library → projects)
- [x] Плеер с пагинацией
- [x] Отправка аудио файлов
- [x] Deep linking

### Phase 2: Advanced Features (🚧 In Progress)
- [ ] Inline mode (поиск треков в любом чате)
- [ ] Stems generation UI
- [ ] Share menu (stories, friends)
- [ ] Emoji status integration

### Phase 3: Optimization (📋 Planned)
- [ ] Redis для session storage
- [ ] CDN для media files
- [ ] Rate limiting
- [ ] Analytics dashboard

---

## Заключение

Данная архитектура обеспечивает:
- ✅ **UX на уровне нативного приложения** внутри Telegram
- ✅ **Минимальный спам** (одно сообщение-интерфейс)
- ✅ **Seamless интеграция** с Mini App
- ✅ **Масштабируемость** через grammY + Supabase

**Автор**: MusicVerse Team  
**Дата**: 2024  
**Версия**: 2.0
