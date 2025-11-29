# 🗺️ Навигация по проекту MusicVerse

## 📚 Быстрый доступ к документации

### Начало работы
- [README.md](README.md) - Главная страница проекта
- [Quickstart](TELEGRAM_INTEGRATION_QUICKSTART.md) - Быстрый старт для новых разработчиков

### Архитектура
- [Telegram Bot Architecture](docs/TELEGRAM_BOT_ARCHITECTURE.md) - Полная спецификация бота на grammY
- [Database Schema](docs/DATABASE.md) - Структура БД, таблицы, RLS policies
- [Suno API](docs/SUNO_API.md) - Интеграция с Suno для генерации музыки

### Telegram Integration
- [Integration Summary](TELEGRAM_INTEGRATION_SUMMARY.md) - Обзор интеграции
- [Features](TELEGRAM_BOT_FEATURES.md) - Список возможностей бота
- [Checklist](TELEGRAM_INTEGRATION_CHECKLIST.md) - Чек-лист реализации
- [Mini App Guide](TELEGRAM_MINI_APP_INTEGRATION.md) - Интеграция Mini App

### Спринты и задачи
- [Sprint 1-2](TELEGRAM_INTEGRATION_SPRINT.md) - Базовые функции (✅ Завершено)
- [Sprint 3-4](TELEGRAM_INTEGRATION_SPRINT_3_4.md) - Продвинутые функции (✅ Завершено)
- [Sprint 5-6](TELEGRAM_INTEGRATION_SPRINT_5_6.md) - Native App Interface (🚧 В работе)

---

## 📂 Структура проекта

```
musicverse/
│
├── 📄 README.md                          # Главная страница
├── 📄 NAVIGATION.md                      # Этот файл (навигация)
│
├── 📁 docs/                              # Техническая документация
│   ├── TELEGRAM_BOT_ARCHITECTURE.md      # 🤖 Архитектура бота (grammY)
│   ├── DATABASE.md                       # 🗄️ Схема БД
│   ├── SUNO_API.md                       # 🎵 Suno API
│   └── images/                           # Изображения для доков
│
├── 📁 src/                               # Frontend (React + TypeScript)
│   ├── components/                       # UI компоненты
│   │   ├── AudioPlayer.tsx               # Аудио плеер
│   │   ├── TrackCard.tsx                 # Карточка трека
│   │   ├── GenerationProgress.tsx        # Прогресс генерации
│   │   └── ...
│   ├── pages/                            # Страницы Mini App
│   │   ├── Library.tsx                   # Библиотека треков
│   │   ├── Projects.tsx                  # Проекты (альбомы)
│   │   ├── Generate.tsx                  # Генерация музыки
│   │   └── ...
│   ├── hooks/                            # Custom React hooks
│   │   ├── useTracks.tsx                 # Работа с треками
│   │   ├── useProjects.tsx               # Работа с проектами
│   │   └── ...
│   └── integrations/supabase/            # Supabase client
│       ├── client.ts                     # Supabase клиент (авто-генерация)
│       └── types.ts                      # DB типы (авто-генерация)
│
├── 📁 supabase/                          # Backend (Supabase)
│   ├── functions/                        # Edge Functions (Deno)
│   │   │
│   │   ├── telegram-bot/                 # 🤖 Telegram Bot (grammY)
│   │   │   ├── bot/
│   │   │   │   ├── handlers/             # Обработчики команд
│   │   │   │   │   ├── navigation.ts     # Навигация (main → library → projects)
│   │   │   │   │   ├── media.ts          # Отправка аудио/stems
│   │   │   │   │   ├── library.ts        # Библиотека + плеер
│   │   │   │   │   ├── projects.ts       # Проекты
│   │   │   │   │   └── share.ts          # Шаринг треков
│   │   │   │   ├── menus/                # Конструкторы клавиатур
│   │   │   │   │   ├── main-menu.ts      # Главное меню
│   │   │   │   │   ├── player.ts         # Плеер (controls)
│   │   │   │   │   └── share-menu.ts     # Меню шаринга
│   │   │   │   └── middleware/           # Middleware
│   │   │   │       ├── auth.ts           # Авторизация
│   │   │   │       └── session.ts        # State management
│   │   │   ├── core/
│   │   │   │   ├── services/             # API сервисы
│   │   │   │   │   ├── music.ts          # Работа с треками
│   │   │   │   │   ├── suno.ts           # Suno API
│   │   │   │   │   └── storage.ts        # Supabase Storage
│   │   │   │   └── types/                # TypeScript типы
│   │   │   │       └── bot.ts            # BotContext, Track, Project
│   │   │   ├── utils/                    # Хелперы
│   │   │   │   ├── formatting.ts         # Форматирование текста
│   │   │   │   └── pagination.ts         # Пагинация
│   │   │   └── index.ts                  # 🚀 Точка входа (Webhook)
│   │   │
│   │   ├── suno-music-generate/          # Генерация музыки (Suno)
│   │   ├── suno-check-status/            # Проверка статуса генерации
│   │   ├── cleanup-stale-tasks/          # Синхронизация зависших задач
│   │   ├── send-telegram-notification/   # Уведомления в Telegram
│   │   └── ...
│   │
│   ├── migrations/                       # SQL миграции
│   │   ├── 20240101_create_tracks.sql
│   │   └── ...
│   │
│   └── config.toml                       # Конфигурация Supabase
│
├── 📄 TELEGRAM_INTEGRATION.md            # Общий обзор интеграции
├── 📄 TELEGRAM_BOT_FEATURES.md           # Список возможностей бота
├── 📄 TELEGRAM_INTEGRATION_CHECKLIST.md  # Чек-лист реализации
├── 📄 TELEGRAM_INTEGRATION_QUICKSTART.md # Быстрый старт
├── 📄 TELEGRAM_INTEGRATION_SUMMARY.md    # Краткое резюме
├── 📄 TELEGRAM_MINI_APP_INTEGRATION.md   # Mini App интеграция
│
├── 📄 TELEGRAM_INTEGRATION_SPRINT.md     # Sprint 1-2 (✅ Done)
├── 📄 TELEGRAM_INTEGRATION_SPRINT_3_4.md # Sprint 3-4 (✅ Done)
├── 📄 TELEGRAM_INTEGRATION_SPRINT_5_6.md # Sprint 5-6 (🚧 In Progress)
│
├── 📄 package.json                       # Зависимости
├── 📄 tsconfig.json                      # TypeScript config
├── 📄 vite.config.ts                     # Vite config
└── 📄 tailwind.config.ts                 # TailwindCSS config
```

---

## 🎯 Быстрые ссылки по задачам

### Для Frontend разработчиков
- [React Components](src/components/) - UI компоненты
- [Pages](src/pages/) - Страницы Mini App
- [Hooks](src/hooks/) - Custom hooks
- [TailwindCSS Config](tailwind.config.ts) - Дизайн система

### Для Backend разработчиков
- [Edge Functions](supabase/functions/) - Serverless функции
- [Telegram Bot](supabase/functions/telegram-bot/) - Код бота
- [Database Migrations](supabase/migrations/) - SQL миграции
- [Database Schema](docs/DATABASE.md) - Документация БД

### Для DevOps
- [Supabase Config](supabase/config.toml) - Конфигурация
- [Deployment Guide](README.md#deployment) - Деплой
- [Environment Variables](README.md#настройка-окружения) - .env файлы

---

## 🔍 Поиск по функциям

### Генерация музыки
- **Frontend**: [src/pages/Generate.tsx](src/pages/Generate.tsx)
- **Backend**: [supabase/functions/suno-music-generate/](supabase/functions/suno-music-generate/)
- **Docs**: [docs/SUNO_API.md](docs/SUNO_API.md)

### Библиотека треков
- **Frontend**: [src/pages/Library.tsx](src/pages/Library.tsx)
- **Bot**: [supabase/functions/telegram-bot/bot/handlers/library.ts](supabase/functions/telegram-bot/commands/library.ts)
- **Docs**: [docs/TELEGRAM_BOT_ARCHITECTURE.md#экран-библиотека](docs/TELEGRAM_BOT_ARCHITECTURE.md)

### Проекты (Альбомы)
- **Frontend**: [src/pages/Projects.tsx](src/pages/Projects.tsx)
- **Bot**: [supabase/functions/telegram-bot/commands/projects.ts](supabase/functions/telegram-bot/commands/projects.ts)
- **Docs**: [docs/DATABASE.md#таблица-music_projects](docs/DATABASE.md)

### Telegram Bot
- **Main Handler**: [supabase/functions/telegram-bot/index.ts](supabase/functions/telegram-bot/index.ts)
- **Commands**: [supabase/functions/telegram-bot/commands/](supabase/functions/telegram-bot/commands/)
- **Docs**: [docs/TELEGRAM_BOT_ARCHITECTURE.md](docs/TELEGRAM_BOT_ARCHITECTURE.md)

### Stems (Разделение)
- **Backend**: [supabase/functions/suno-music-extend/](supabase/functions/suno-music-extend/)
- **Bot Handler**: [supabase/functions/telegram-bot/bot/handlers/media.ts](supabase/functions/telegram-bot/commands/share.ts)

---

## 📖 Гайды по сценариям

### Как добавить новую команду в бот?

1. Создайте handler:
```typescript
// supabase/functions/telegram-bot/bot/handlers/my-command.ts
export const myCommandHandler = new Composer<BotContext>();

myCommandHandler.command("mycommand", async (ctx) => {
  await ctx.reply("Hello!");
});
```

2. Зарегистрируйте в `index.ts`:
```typescript
import { myCommandHandler } from "./bot/handlers/my-command.ts";
bot.use(myCommandHandler);
```

3. Обновите документацию: [TELEGRAM_BOT_FEATURES.md](TELEGRAM_BOT_FEATURES.md)

---

### Как добавить новую таблицу в БД?

1. Создайте миграцию:
```bash
supabase migration new add_my_table
```

2. Напишите SQL в `supabase/migrations/`:
```sql
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Добавьте RLS policies
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON my_table FOR SELECT
  USING (auth.uid() = user_id);
```

3. Примените миграцию:
```bash
supabase db push
```

4. Обновите [docs/DATABASE.md](docs/DATABASE.md)

---

### Как добавить новый экран в Mini App?

1. Создайте компонент страницы:
```typescript
// src/pages/MyPage.tsx
export const MyPage = () => {
  return <div>My Page</div>;
};
```

2. Добавьте роут в `src/App.tsx`:
```typescript
<Route path="/my-page" element={<MyPage />} />
```

3. Добавьте навигацию в `src/components/BottomNavigation.tsx`

---

## 🐛 Debugging

### Логи Edge Functions
```bash
# Реальные логи
supabase functions logs telegram-bot --tail

# Локальная разработка
supabase functions serve telegram-bot
```

### Отладка Telegram Bot
```bash
# Установите ngrok для локального тестирования
ngrok http 54321

# Установите webhook на ngrok URL
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://xxx.ngrok.io/functions/v1/telegram-bot"
```

### Отладка БД
```bash
# Подключитесь к локальной БД
supabase db connect

# Или к продакшн БД
psql -h db.xxx.supabase.co -U postgres -d postgres
```

---

## 📝 Code Style

### TypeScript
- Строгий режим (`strict: true`)
- Explicit return types для функций
- Используйте `interface` для объектов, `type` для union types

### React
- Функциональные компоненты (no classes)
- Hooks first
- TypeScript для всех props

### Git Commits
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Пример: `feat(bot): add inline mode support`

---

## 🆘 Помощь

### Нашли баг?
1. Проверьте [Issues](https://github.com/your-org/musicverse/issues)
2. Создайте новый issue с лейблом `bug`
3. Приложите логи и скриншоты

### Нужна новая фича?
1. Создайте issue с лейблом `feature-request`
2. Опишите use case и ожидаемое поведение
3. Команда обсудит и добавит в roadmap

### Вопросы?
- **Telegram**: [@MusicVerseSupport](https://t.me/MusicVerseSupport)
- **Email**: support@musicverse.ai
- **Discord**: [discord.gg/musicverse](https://discord.gg/musicverse)

---

**Последнее обновление**: 2024  
**Автор**: MusicVerse Team
