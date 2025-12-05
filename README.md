<div align="center">

<img src="src/assets/logo.png" alt="MusicVerse AI Logo" width="180" height="180" />

# 🎵 MusicVerse AI

### AI-платформа для создания музыки в Telegram

<p align="center">
  <strong>Создавайте музыку с помощью искусственного интеллекта</strong><br>
  <em>Suno AI v5 • Telegram Mini App • A/B Versioning • Stem Separation • Playlists</em>
</p>

---

<a href="http://t.me/AIMusicVerseBot/app">
  <img src="https://img.shields.io/badge/🚀%20Открыть%20в%20Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Открыть в Telegram" />
</a>

---

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Telegram-Mini_App-26A5E4?style=flat-square&logo=telegram" alt="Telegram" />
  <img src="https://img.shields.io/badge/Lovable_Cloud-Backend-8B5CF6?style=flat-square" alt="Lovable Cloud" />
  <img src="https://img.shields.io/badge/Suno_AI-v5-e74c3c?style=flat-square" alt="Suno AI" />
</p>

</div>

---

## ✨ Возможности

### 🎹 Генерация музыки
- **Suno AI v5** — создание треков по текстовому описанию
- **A/B версии** — каждая генерация создаёт 2 варианта
- **Streaming preview** — предпрослушивание во время генерации
- **Custom режим** — полный контроль над lyrics и стилем
- **AI Lyrics Wizard** — 5-шаговый помощник для написания текстов
- **Авто-сохранение** — черновики формы сохраняются в localStorage

### 📚 Библиотека треков
- **Виртуализация** — плавная работа с 1000+ треков (react-virtuoso)
- **Lazy loading** — отложенная загрузка обложек с blur-эффектом
- **Grid/List режимы** — адаптивное отображение
- **Swipe-действия** — быстрые операции на мобильных
- **Inline версии** — переключение A/B прямо на карточке
- **Лайки** — оптимистичные обновления

### 🎧 Плеер
- **Глобальный аудио** — один источник звука для всего приложения
- **3 режима** — compact / expanded / fullscreen
- **Синхронизированные lyrics** — подсветка активной строки
- **Очередь воспроизведения** — Play Next, Add to Queue
- **Version playback** — режимы воспроизведения версий

### 📝 Плейлисты
- **CRUD операции** — создание, редактирование, удаление
- **Drag-drop** — перетаскивание треков
- **AI-обложки** — генерация обложек через Lovable AI
- **Auto-playlists** — автоматические плейлисты по жанрам
- **Deep links** — шаринг через Telegram

### 🎛️ Stem Studio
- **Разделение на стемы** — vocals, drums, bass, guitar, etc.
- **Микширование** — громкость, mute, solo для каждого стема
- **Скачивание** — MP3/WAV, ZIP-архив
- **Reference** — использование стема как референс для генерации

### 🤖 Telegram интеграция
- **Mini App SDK** — нативное приложение в Telegram
- **Bot commands** — /generate, /library, /status, /settings
- **Inline queries** — поиск и шаринг треков
- **Уведомления** — оповещения о готовности треков
- **Stories sharing** — публикация в Telegram Stories
- **Deep linking** — прямые ссылки на треки/плейлисты

### 👤 AI-артисты
- **Персоны** — создание AI-артистов
- **Портреты** — генерация аватаров через AI
- **Публичный каталог** — discovery артистов сообщества

---

## 🏗️ Архитектура

### Frontend
```
React 19 + TypeScript 5 + Vite
├── Tailwind CSS + shadcn/ui (стилизация)
├── TanStack Query (кэширование данных)
├── Zustand (глобальное состояние)
├── Framer Motion (анимации)
└── react-virtuoso (виртуализация списков)
```

### Backend (Lovable Cloud)
```
PostgreSQL + Edge Functions
├── Row Level Security (защита данных)
├── Realtime subscriptions (обновления)
├── Storage buckets (медиафайлы)
└── 40+ Edge Functions (бизнес-логика)
```

### Ключевые паттерны
- **Single Audio Source** — GlobalAudioProvider
- **Optimized Caching** — staleTime 30s, gcTime 10min
- **Batch Queries** — usePublicContentOptimized
- **Lazy Images** — LazyImage с blur placeholder

---

## 🚀 Быстрый старт

### Telegram Mini App
Откройте [@AIMusicVerseBot](http://t.me/AIMusicVerseBot) → нажмите "Открыть приложение"

### Локальная разработка
```bash
git clone https://github.com/HOW2AI-AGENCY/aimusicverse.git
cd aimusicverse
npm install
npm run dev
```

---

## 📊 Ключевые метрики

| Метрика | Значение |
|---------|----------|
| Мета-теги Suno | 174+ |
| Музыкальные стили | 277+ |
| Языки | 75+ |
| Edge Functions | 40+ |
| Таблиц в БД | 25+ |

---

## 📁 Структура проекта

```
├── src/
│   ├── components/      # React компоненты
│   │   ├── ui/         # shadcn/ui + кастомные
│   │   ├── player/     # Компоненты плеера
│   │   ├── library/    # Библиотека треков
│   │   ├── playlist/   # Плейлисты
│   │   └── ...
│   ├── hooks/          # 50+ кастомных хуков
│   ├── stores/         # Zustand stores
│   ├── pages/          # Страницы приложения
│   └── services/       # API сервисы
├── supabase/
│   └── functions/      # 40+ Edge Functions
├── docs/               # Документация
└── ADR/                # Architecture Decision Records
```

---

## 📖 Документация

- [Project Specification](docs/PROJECT_SPECIFICATION.md)
- [Database Schema](docs/DATABASE.md)
- [Suno API Integration](docs/SUNO_API.md)
- [Telegram Bot Architecture](docs/TELEGRAM_BOT_ARCHITECTURE.md)
- [Player Architecture](docs/PLAYER_ARCHITECTURE.md)
- [AI Agent Instructions](.github/copilot-instructions.md)

---

## 🔒 Безопасность

- RLS политики на всех таблицах
- Валидация Telegram initData через HMAC
- Секреты только в Edge Functions
- `is_public` флаги для контроля доступа

---

## 📞 Контакты

- **Telegram Bot:** [@AIMusicVerseBot](https://t.me/AIMusicVerseBot)
- **Mini App:** [Открыть](http://t.me/AIMusicVerseBot/app)

---

<div align="center">

**Сделано с ❤️ командой MusicVerse AI**

*Last Updated: 2025-12-05*

</div>
