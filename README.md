<div align="center">

<img src="src/assets/logo.png" alt="MusicVerse AI Logo" width="180" height="180" />

# 🎵 MusicVerse AI

### AI-платформа для создания музыки в Telegram

<p align="center">
  <strong>Создавайте музыку с помощью искусственного интеллекта</strong><br>
  <em>Suno AI v5 • Telegram Mini App • A/B Versioning • Stem Studio • AI Artists</em>
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
  <img src="https://img.shields.io/badge/Sprint-023-green?style=flat-square" alt="Current Sprint" />
</p>

</div>

---

## 📑 Содержание

- [✨ Возможности](#-возможности)
- [🏗️ Архитектура](#️-архитектура)
- [📊 Системная архитектура](#-системная-архитектура)
- [🔄 Поток данных](#-поток-данных)
- [🎯 Архитектура компонентов](#-архитектура-компонентов)
- [🚀 Быстрый старт](#-быстрый-старт)
- [📊 Ключевые метрики](#-ключевые-метрики)
- [📁 Структура проекта](#-структура-проекта)
- [📖 Документация](#-документация)
- [🔒 Безопасность](#-безопасность)
- [🛠️ Недавние улучшения](#️-недавние-улучшения)

> 💡 **Навигация:** См. [NAVIGATION_INDEX.md](docs/NAVIGATION_INDEX.md) для интерактивной карты всей документации
> 
> 📚 **Ключевая документация:**
> - [AI Lyrics Assistant](docs/AI_LYRICS_ASSISTANT.md) - Чат-интерфейс для написания текстов
> - [Stem Studio](docs/STEM_STUDIO.md) - Работа со стемами и MIDI
> - [Generation System](docs/GENERATION_SYSTEM.md) - Система генерации музыки
> - [TG Mini App Fixes](docs/TELEGRAM_MINI_APP_CRITICAL_FIXES.md) - Критические исправления
> - [Known Issues](docs/KNOWN_ISSUES.md) - Известные проблемы

---

## ✨ Возможности

### 🎹 Генерация музыки
- **Suno AI v5** — создание треков по текстовому описанию
- **A/B версии** — каждая генерация создаёт 2 варианта
- **Streaming preview** — предпрослушивание во время генерации
- **Custom режим** — полный контроль над lyrics и стилем
- **AI Lyrics Chat** — чат-ассистент для написания текстов
- **Голосовой ввод** — диктовка описания через Whisper API
- **Авто-сохранение** — черновики формы сохраняются 30 минут

### 📚 Библиотека треков
- **Виртуализация** — плавная работа с 1000+ треков (react-virtuoso)
- **Lazy loading** — отложенная загрузка обложек с blur-эффектом
- **Grid/List режимы** — адаптивное отображение
- **Swipe-действия** — быстрые операции на мобильных
- **Inline версии** — переключение A/B прямо на карточке
- **Лайки** — оптимистичные обновления с denormalized счётчиками

### 🎧 Плеер
- **Глобальный аудио** — один источник звука для всего приложения
- **3 режима** — compact / expanded / fullscreen
- **📜 Синхронизированные lyrics** — подсветка активной строки с точностью ±0.05s
- **🎯 Умный авто-скролл** — распознавание user scroll с 5s resume delay
- **Очередь воспроизведения** — Play Next, Add to Queue, Shuffle
- **Audio Visualizer** — визуализация частот в реальном времени
- **Version playback** — режимы воспроизведения версий

### 📝 Плейлисты
- **CRUD операции** — создание, редактирование, удаление
- **Drag-drop** — перетаскивание треков для сортировки
- **AI-обложки** — генерация обложек через Lovable AI
- **Auto-playlists** — автоматические плейлисты по жанрам
- **Deep links** — шаринг через Telegram

### 🎛️ Stem Studio
- **Разделение на стемы** — vocals, drums, bass, guitar и др.
- **Микширование** — громкость, mute, solo для каждого стема
- **🔄 Синхронное воспроизведение** — точная синхронизация всех стемов с drift detection (0.1s)
- **Waveform** — визуализация волновой формы (wavesurfer.js)
- **MIDI транскрипция** — сохранение в Supabase Storage
- **Reference генерация** — использование стема для нового трека
- **🆕 Замена секций** — перегенерация отдельных фрагментов трека
- **🎯 Автоопределение секций** — Levenshtein distance для точного матчинга (RU/EN)
- **A/B сравнение** — сравнение оригинала и замены в реальном времени
- **История замен** — просмотр всех версий секций

### 🎨 AI Аудио Анализ
- **BPM detection** — определение темпа
- **Key signature** — определение тональности
- **Genre/Mood** — классификация жанра и настроения
- **Emotional map** — arousal/valence визуализация
- **Structure analysis** — анализ структуры трека

### 🤖 Telegram интеграция
- **Mini App SDK 2.0** — нативное приложение в Telegram
- **Bot commands** — /generate, /cover, /extend, /library
- **Inline queries** — поиск и шаринг треков
- **Уведомления** — оповещения о готовности треков
- **Stories sharing** — публикация в Telegram Stories
- **Deep linking** — прямые ссылки на треки/плейлисты/студию

### 👤 AI-артисты
- **Персоны** — создание AI-артистов с bio и стилем
- **Портреты** — генерация аватаров через Gemini
- **Публичный каталог** — discovery артистов сообщества
- **Мои артисты / Сообщество** — табы на странице Artists

### 🎮 Gamification
- **Daily check-in** — ежедневные награды
- **Streaks** — отслеживание серий
- **Уровни** — прогрессия с опытом
- **Achievements** — достижения с наградами
- **Leaderboard** — 5 категорий рейтинга
- **Credits** — внутренняя валюта

### 👨‍💼 Admin Dashboard
- **Overview** — статистика пользователей/треков
- **Bot Metrics** — мониторинг Telegram бота
- **User Management** — управление ролями
- **Broadcast** — рассылка уведомлений
- **Blog** — AI-ассистент для статей

---

## 📊 Системная архитектура

### Общая схема системы

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Telegram Mini App<br/>React 19 + TypeScript]
        B[State Management<br/>Zustand + TanStack Query]
        C[UI Components<br/>shadcn/ui + Tailwind]
    end
    
    subgraph "Backend Layer - Lovable Cloud"
        D[PostgreSQL Database<br/>30+ Tables with RLS]
        E[Edge Functions<br/>45+ Serverless Functions]
        F[Storage<br/>Audio Files & Covers]
    end
    
    subgraph "External Services"
        G[Suno AI v5<br/>Music Generation]
        H[Telegram API<br/>Bot & Notifications]
        I[Gemini AI<br/>Artist Portraits]
    end
    
    A --> B
    B --> C
    A <--> E
    E <--> D
    E <--> F
    E <--> G
    E <--> H
    E <--> I
    
    style A fill:#61DAFB
    style D fill:#336791
    style G fill:#e74c3c
    style H fill:#26A5E4
```

### Архитектура базы данных

```mermaid
erDiagram
    users ||--o{ tracks : creates
    users ||--o{ playlists : owns
    users ||--o{ artists : creates
    
    tracks ||--o{ track_versions : "has versions"
    tracks ||--|| audio_analysis : "has analysis"
    tracks ||--o{ track_stems : "has stems"
    tracks ||--o{ track_likes : "receives"
    tracks }o--|| artists : "by artist"
    tracks }o--o| music_projects : "belongs to"
    
    playlists ||--o{ playlist_tracks : contains
    playlist_tracks }o--|| tracks : references
    
    track_versions ||--o{ track_change_log : "has changelog"
    
    generation_tasks ||--|| tracks : generates
    stem_separation_tasks ||--|| track_stems : creates
    
    users {
        uuid id PK
        text telegram_id
        text username
        boolean is_public
    }
    
    tracks {
        uuid id PK
        uuid user_id FK
        uuid active_version_id FK
        text title
        text prompt
        boolean is_public
        boolean has_stems
        int play_count
    }
    
    track_versions {
        uuid id PK
        uuid track_id FK
        text version_label
        boolean is_primary
        text audio_url
    }
    
    playlists {
        uuid id PK
        uuid user_id FK
        text title
        int track_count
        int total_duration
    }
```

---

## 🔄 Поток данных

### Процесс генерации музыки

```mermaid
sequenceDiagram
    actor User
    participant TG as Telegram
    participant App as MusicVerse App
    participant Edge as Edge Functions
    participant DB as PostgreSQL
    participant Suno as Suno AI v5
    
    User->>TG: Открывает Mini App
    TG->>App: initData + auth
    App->>Edge: Validate auth
    Edge->>DB: Get/Create user
    DB-->>App: User profile
    
    User->>App: Заполняет форму генерации
    App->>App: Auto-save draft (localStorage)
    User->>App: Отправить генерацию
    
    App->>Edge: POST /suno-music-generate
    Edge->>DB: Create generation_task
    Edge->>Suno: Start generation
    Suno-->>Edge: Task ID
    Edge-->>App: Task created
    
    loop Streaming Progress
        Suno-->>Edge: Streaming URL ready
        Edge->>DB: Update streaming_url
        DB-->>App: Realtime update
        App->>User: Show streaming preview
    end
    
    Suno->>Edge: Webhook: Generation complete
    Edge->>DB: Create track + 2 versions
    Edge->>TG: Send notification
    TG->>User: "Ваш трек готов!"
    
    User->>App: Открывает трек
    App->>DB: Increment play_count
    App->>User: Начать воспроизведение
```

### Система версионирования (A/B)

```mermaid
graph LR
    A[Generation Request] --> B[Suno AI]
    B --> C[Clip 0 - Version A]
    B --> D[Clip 1 - Version B]
    
    C --> E[track_versions<br/>is_primary = true]
    D --> F[track_versions<br/>is_primary = false]
    
    E --> G[tracks.active_version_id<br/>points to Version A]
    
    style C fill:#90EE90
    style D fill:#FFB6C1
    style E fill:#90EE90
    style F fill:#FFB6C1
```

---

## 🎯 Архитектура компонентов

### Frontend структура

```mermaid
graph TB
    subgraph "App Shell"
        A[App.tsx<br/>Router + Layout]
        B[GlobalAudioProvider<br/>Single Audio Element]
        C[TelegramContext<br/>Mini App SDK]
    end
    
    subgraph "Pages"
        D[Index - Homepage]
        E[Library - Track List]
        F[Artists - AI Personas]
        G[Projects - Organization]
        H[Playlists - Collections]
    end
    
    subgraph "Core Features"
        I[Player<br/>Compact/Expanded/Fullscreen]
        J[GenerateSheet<br/>Music Creation Form]
        K[Stem Studio<br/>Stem Separation & Mix]
        L[Track Actions<br/>Unified Menus]
    end
    
    subgraph "State Management"
        M[playerStore<br/>Zustand]
        N[TanStack Query<br/>Server State Cache]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    
    D --> I
    E --> I
    E --> J
    E --> K
    E --> L
    
    I --> M
    J --> N
    K --> N
    L --> N
    
    style A fill:#61DAFB
    style M fill:#764ABC
    style N fill:#FF4154
```

### Архитектура плеера

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: User clicks play
    Loading --> Playing: Audio ready
    Playing --> Paused: User pauses
    Paused --> Playing: User resumes
    Playing --> Loading: Change track
    Playing --> Idle: Track ends
    Paused --> Idle: User stops
    
    state Playing {
        [*] --> Compact
        Compact --> Expanded: User expands
        Expanded --> Fullscreen: User taps fullscreen
        Fullscreen --> Expanded: User exits
        Expanded --> Compact: User minimizes
    }
```

---

## 🏗️ Архитектура

### Frontend
```
React 19 + TypeScript 5 + Vite
├── Tailwind CSS + shadcn/ui (дизайн-система)
├── TanStack Query (кэширование данных)
├── Zustand (глобальное состояние)
├── Framer Motion (оптимизированные анимации через @/lib/motion)
├── react-virtuoso (виртуализация списков)
└── wavesurfer.js (аудио визуализация)
```

### Backend (Lovable Cloud)
```
PostgreSQL + Edge Functions
├── Row Level Security (защита данных)
├── Realtime subscriptions (обновления)
├── Storage buckets (медиафайлы)
└── 59 Edge Functions (бизнес-логика)
```

### Ключевые паттерны
- **Single Audio Source** — GlobalAudioProvider
- **Optimized Caching** — staleTime 30s, gcTime 10min
- **Batch Queries** — usePublicContentOptimized
- **Lazy Images** — LazyImage с blur placeholder
- **Denormalized Counters** — likes_count с триггерами
- **Modular Components** — разбиение на подкомпоненты и хуки
- **Lazy Loading** — `src/components/lazy/` для тяжёлых компонентов
- **Optimized Motion** — `@/lib/motion` для tree-shaking framer-motion

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
| Edge Functions | 45+ |
| Таблиц в БД | 30+ |
| React компонентов | 150+ |
| Кастомных хуков | 60+ |

---

## 📁 Структура проекта

```
├── src/
│   ├── components/           # React компоненты
│   │   ├── ui/              # shadcn/ui + GlowButton, GlassCard и др.
│   │   ├── player/          # CompactPlayer, ExpandedPlayer, MobileFullscreen
│   │   ├── library/         # TrackCard, TrackRow, filters
│   │   ├── playlist/        # Playlist management
│   │   ├── stem-studio/     # Stem mixing и waveforms
│   │   ├── generate-form/   # GenerateSheet modules
│   │   │   └── lyrics-chat/ # LyricsChatAssistant (refactored)
│   │   ├── track-detail/    # TrackAnalysisTab, VersionsTab
│   │   ├── track-actions/   # Unified action menus
│   │   ├── gamification/    # Rewards, Leaderboard, Achievements
│   │   ├── admin/           # AdminDashboard tabs
│   │   └── home/            # Homepage sections
│   ├── hooks/               # 60+ кастомных хуков
│   │   ├── usePlayerStore   # Zustand player state
│   │   ├── useTracksInfinite# Infinite scroll tracks
│   │   ├── useLyricsChat    # Lyrics assistant logic
│   │   └── ...
│   ├── stores/              # Zustand stores
│   │   ├── playerStore      # Audio playback state
│   │   ├── queueStore       # Track queue
│   │   └── planTrackStore   # Project track context
│   ├── pages/               # Страницы приложения
│   │   ├── Index.tsx        # Homepage with discovery
│   │   ├── Library.tsx      # Track library
│   │   ├── Artists.tsx      # My Artists + Community tabs
│   │   ├── Projects.tsx     # Music projects
│   │   └── ...
│   └── lib/                 # Utilities
│       └── logger.ts        # Structured logging
├── supabase/
│   └── functions/           # 45+ Edge Functions
│       ├── suno-*/          # Music generation
│       ├── ai-*/            # AI assistants
│       ├── telegram-*/      # Bot handlers
│       └── analyze-*/       # Audio analysis
├── docs/                    # Документация
└── ADR/                     # Architecture Decision Records
```

---

## 📖 Документация

| Документ | Описание |
|----------|----------|
| [NAVIGATION.md](NAVIGATION.md) | 🗺️ Путеводитель по репозиторию |
| [docs/ARCHITECTURE_DIAGRAMS.md](docs/ARCHITECTURE_DIAGRAMS.md) | 🏗️ **Визуальные диаграммы архитектуры** |
| [docs/PROJECT_SPECIFICATION.md](docs/PROJECT_SPECIFICATION.md) | 📋 Спецификация проекта |
| [docs/DATABASE.md](docs/DATABASE.md) | 🗄️ Схема базы данных с ERD |
| [docs/SUNO_API.md](docs/SUNO_API.md) | 🎵 Интеграция Suno API |
| [docs/SECTION_REPLACEMENT.md](docs/SECTION_REPLACEMENT.md) | 🎛️ **Замена секций в Stem Studio** |
| [docs/TELEGRAM_BOT_ARCHITECTURE.md](docs/TELEGRAM_BOT_ARCHITECTURE.md) | 🤖 Архитектура бота |
| [docs/PLAYER_ARCHITECTURE.md](docs/PLAYER_ARCHITECTURE.md) | 🎧 Архитектура плеера |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 🤝 Правила контрибуции |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | 🔄 Рабочий процесс |

---

## 🔒 Безопасность

- RLS политики на всех таблицах
- Валидация Telegram initData через HMAC
- Секреты только в Edge Functions
- DOMPurify для санитизации HTML
- `is_public` флаги для контроля доступа
- Logger utility вместо console.log

---

## 🛠️ Недавние улучшения

### Sprint 022: Bundle Optimization 🔄
- Улучшен tree-shaking (target: esnext, terser passes: 2)
- Создан `@/lib/motion` для оптимизации framer-motion
- Lazy loading тяжёлых компонентов (`src/components/lazy/`)
- Разделение date-fns на core/locale chunks
- Bundle analyzer: `dist/stats.html`

### Phase 1: Критические исправления ✅
- Исправлена ошибка аудио при пустом src
- Объединены страницы Artists и Actors
- Унифицирован онбординг (OnboardingOverlay)
- Упрощены HeroQuickActions (4 основных)

### Phase 2: Рефакторинг ✅
- GenerateSheet разбит на модули (1178→250 строк)
- Создан хук useGenerateForm
- LyricsChatAssistant модуляризирован (833→200 строк)
- Добавлена кнопка "Продолжить диалог"

### Phase 3: AI Features ✅
- AnalysisQuickStats — визуализация BPM/Key/Genre
- Collapsible детальный анализ
- Улучшенный UI анализа аудио

---

## 📞 Контакты

- **Telegram Bot:** [@AIMusicVerseBot](https://t.me/AIMusicVerseBot)
- **Mini App:** [Открыть](http://t.me/AIMusicVerseBot/app)

---

<div align="center">

**Сделано с ❤️ командой MusicVerse AI**

*Last Updated: 2025-12-09*

</div>
