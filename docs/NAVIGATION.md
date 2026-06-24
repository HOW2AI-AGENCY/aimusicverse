# 🗺️ Путеводитель по проекту MusicVerse

Добро пожаловать в MusicVerse AI! Этот документ — ваша карта по репозиторию.

**Last Updated:** 2025-12-10

> 💡 **Новое:** Полная карта документации доступна в [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)  
> 🎯 **Текущий спринт:** Sprint 013 - Advanced Audio Features (🟢 In Progress)  
> 📊 **Статус проекта:** [PROJECT_STATUS](../PROJECT_STATUS.md)

---

## 📑 Содержание

- [🚀 Ключевые документы](#-ключевые-документы)
- [📊 Новое: Система документации](#-новое-система-документации)
- [🗂️ Карта документации](#️-карта-документации)
- [📂 Структура репозитория](#-структура-репозитория)
- [🎯 Навигация по задачам](#-навигация-по-задачам)
- [🔑 Ключевые компоненты](#-ключевые-компоненты)
- [🚦 Путь пользователя](#-путь-пользователя)
- [❓ Как...](#-как)

---

## 🗂️ Карта документации

```mermaid
graph TB
    A[README.md<br/>Начните здесь] --> B[NAVIGATION.md<br/>Вы здесь]
    
    A --> C[Quick Start]
    C --> D[ONBOARDING.md]
    C --> E[DEVELOPMENT_WORKFLOW.md]
    
    A --> F[Architecture]
    F --> G[docs/PROJECT_SPECIFICATION.md]
    F --> H[docs/DATABASE.md]
    F --> I[docs/PLAYER_ARCHITECTURE.md]
    F --> J[docs/TELEGRAM_BOT_ARCHITECTURE.md]
    F --> K[docs/SUNO_API.md]
    
    A --> L[Contributing]
    L --> M[CONTRIBUTING.md]
    L --> N[constitution.md]
    L --> O[CODE_OF_CONDUCT.md]
    
    A --> P[Project Management]
    P --> Q[SPRINTS/]
    P --> R[ROADMAP.md]
    P --> S[CHANGELOG.md]
    
    style A fill:#61DAFB,stroke:#333,stroke-width:4px
    style B fill:#FFD700,stroke:#333,stroke-width:4px
```

---

## 🚀 Ключевые документы

| Файл | Описание | Приоритет |
|------|----------|-----------|
| [**README.md**](../README.md) | **Начните отсюда.** Обзор проекта и возможностей | 🔴 Critical |
| [**DOCUMENTATION_INDEX.md**](../DOCUMENTATION_INDEX.md) | **Полная карта документации** | 🔴 Critical |
| [**ROADMAP.md**](../ROADMAP.md) | **Дорожная карта проекта** | 🔴 Critical |
| [**KNOWN_ISSUES.md**](./KNOWN_ISSUES.md) | **Известные проблемы** | 🟡 High |
| [**CONTRIBUTING.md**](../CONTRIBUTING.md) | Правила контрибуции | 🟡 High |
| [**DEVELOPMENT_WORKFLOW.md**](./DEVELOPMENT_WORKFLOW.md) | Рабочий процесс, GitFlow, стандарты | 🟡 High |
| [**ONBOARDING.md**](./ONBOARDING.md) | Настройка окружения для новых разработчиков | 🟡 High |
| [**CHANGELOG.md**](../CHANGELOG.md) | История изменений | 🟢 Medium |

---

## 📊 Новое: Система документации

### Главные индексы
1. **[DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)** - Полная карта всей документации
2. **[ROADMAP.md](../ROADMAP.md)** - Дорожная карта и планы развития
3. **[KNOWN_ISSUES.md](./KNOWN_ISSUES.md)** - Известные проблемы
4. **[MAINTENANCE.md](../MAINTENANCE.md)** - Руководство по обслуживанию

### Навигация
- **[INDEX.md](./INDEX.md)** - Индекс документации
- **[NAVIGATION_INDEX.md](./NAVIGATION_INDEX.md)** - Навигационный индекс

---

## 📂 Структура репозитория

```
/
├── 📄 Root Documentation (Обновлено 2025-12-10)
│   ├── README.md                          # Главная страница проекта
│   ├── DOCUMENTATION_INDEX.md             # 🆕 Полная карта документации
│   ├── SPRINT_STATUS.md                   # 🆕 Статус спринтов
│   ├── RECENT_IMPROVEMENTS.md             # 🆕 Улучшения декабря 2025
│   ├── REPOSITORY_AUDIT_2025-12-10.md     # 🆕 Аудит репозитория
│   ├── NAVIGATION.md                      # Этот файл
│   ├── CHANGELOG.md                       # История изменений
│   ├── CONTRIBUTING.md                    # Правила контрибуции
│   ├── DEVELOPMENT_WORKFLOW.md            # Рабочий процесс
│   ├── ONBOARDING.md                      # Онбординг
│   └── ...
│
├── src/                      # 🎯 Исходный код фронтенда
│   ├── components/           # React компоненты (150+)
│   │   ├── ui/              # Базовые UI (shadcn + custom)
│   │   ├── player/          # Плеер (Compact/Expanded/Fullscreen)
│   │   ├── library/         # Библиотека треков
│   │   ├── playlist/        # Плейлисты
│   │   ├── stem-studio/     # Stem Studio (модульная архитектура)
│   │   │   └── core/        # 🆕 Core components (4 new)
│   │   ├── generate-form/   # Форма генерации
│   │   │   └── lyrics-chat/ # AI Lyrics Assistant (модули)
│   │   ├── track-detail/    # Детали трека (Analysis, Versions)
│   │   ├── track-actions/   # Унифицированные меню действий
│   │   ├── professional/    # 🆕 Professional components (6 new)
│   │   ├── gamification/    # Награды, достижения, лидерборд
│   │   ├── admin/           # Admin Dashboard
│   │   ├── lazy/            # 🆕 Lazy-loaded heavy components
│   │   └── home/            # Секции главной страницы
│   │
│   ├── hooks/               # Кастомные хуки (60+)
│   │   ├── audio/           # 🆕 Аудио хуки (оптимизированы)
│   │   │   ├── useOptimizedAudioPlayer.ts
│   │   │   ├── useDebouncedAudioTime.ts
│   │   │   ├── usePlaybackPosition.ts    # 🆕
│   │   │   ├── useBufferMonitor.ts       # 🆕
│   │   │   ├── useQueueHistory.ts        # 🆕
│   │   │   └── useSmartQueue.ts          # 🆕
│   │   ├── studio/          # 🆕 Stem Studio хуки
│   │   │   ├── useStemAudioSync.ts       # 🆕
│   │   │   ├── useStemControls.ts        # 🆕
│   │   │   └── useStudioKeyboardShortcuts.ts  # 🆕
│   │   └── ...
│   │
│   ├── stores/              # Zustand stores
│   │   ├── playerStore.ts   # Состояние плеера
│   │   ├── queueStore.ts    # Очередь воспроизведения
│   │   └── planTrackStore.ts
│   │
│   ├── lib/                 # Утилиты
│   │   ├── audioCache.ts    # 🆕 IndexedDB audio caching
│   │   ├── motion.ts        # 🆕 Optimized framer-motion
│   │   ├── logger.ts        # Structured logging
│   │   └── ...
│   │
│   └── pages/               # Страницы приложения
│       ├── Index.tsx        # Главная (discovery)
│       ├── Library.tsx      # Библиотека
│       ├── ProfessionalStudio.tsx  # 🆕 Professional tools
│       └── ...
│
├── supabase/                # 🔧 Backend
│   └── functions/           # Edge Functions (45+)
│
├── docs/                    # 📚 Документация
│   ├── NAVIGATION_INDEX.md  # Индекс документации
│   ├── PROJECT_SPECIFICATION.md
│   ├── DATABASE.md
│   ├── PLAYER_ARCHITECTURE.md
│   ├── TELEGRAM_BOT_ARCHITECTURE.md
│   ├── archive/             # 📦 Архивы
│   │   └── 2025-12/         # 🆕 Аудиты декабря 2025 (20+ файлов)
│   └── ...
│
├── ADR/                     # 🏛️ Architectural Decision Records (3 ADRs)
│
├── SPRINTS/                 # 📋 Sprint management (ОБНОВЛЕНО)
│   ├── README.md            # 🆕 Обзор системы спринтов
│   ├── BACKLOG.md           # Бэклог продукта
│   ├── completed/           # 🆕 Завершённые спринты
│   │   ├── SPRINT-001-SETUP.md
│   │   ├── SPRINT-002-AUDIT-IMPROVEMENTS.md
│   │   ├── SPRINT-003-AUTOMATION.md
│   │   ├── SPRINT-004-OPTIMIZATION.md
│   │   ├── SPRINT-005-PRODUCTION-HARDENING.md
│   │   ├── SPRINT-006-UI-UX-IMPROVEMENTS.md
│   │   └── SPRINT-021-API-MODEL-UPDATE.md
│   ├── SPRINT-013-OUTLINE.md         # 🟢 Active
│   ├── SPRINT-008 to SPRINT-024/     # ⏳ Planned
│   └── ...
│
└── tests/                   # 🧪 Тесты
```

---

## 🎯 Навигация по задачам

### Frontend-разработка

| Задача | Где искать |
|--------|------------|
| UI компоненты | `src/components/ui/` |
| Дизайн-система | `tailwind.config.ts`, `src/index.css` |
| Плеер | `src/components/player/`, `src/hooks/usePlayerStore.ts` |
| Библиотека | `src/components/library/`, `src/pages/Library.tsx` |
| Плейлисты | `src/components/playlist/` |
| Генерация | `src/components/GenerateSheet.tsx`, `src/components/generate-form/` |
| AI Lyrics | `src/components/generate-form/lyrics-chat/` |
| Анализ аудио | `src/components/track-detail/TrackAnalysisTab.tsx` |
| Stem Studio | `src/components/stem-studio/` |
| Gamification | `src/components/gamification/` |
| Admin | `src/components/admin/` |

### Backend-разработка

| Задача | Где искать |
|--------|------------|
| Генерация музыки | `supabase/functions/suno-*` |
| Telegram бот | `supabase/functions/telegram-*` |
| AI ассистенты | `supabase/functions/ai-*` |
| Анализ аудио | `supabase/functions/analyze-*` |
| Схема БД | `supabase/migrations/` |

---

## 🔑 Ключевые компоненты

### Плеер
```
GlobalAudioProvider (src/components/GlobalAudioProvider.tsx)
├── CompactPlayer (src/components/CompactPlayer.tsx)
├── ExpandedPlayer (src/components/player/ExpandedPlayer.tsx)
└── MobileFullscreenPlayer (src/components/player/MobileFullscreenPlayer.tsx)
```

### Форма генерации (рефакторинг)
```
GenerateSheet.tsx (~250 строк)
├── hooks/useGenerateForm.ts (логика)
├── generate-form/GenerateFormSimple.tsx
├── generate-form/GenerateFormCustom.tsx
├── generate-form/GenerateFormHeader.tsx
├── generate-form/GenerateFormReferences.tsx
└── generate-form/GenerateFormActions.tsx
```

### AI Lyrics Assistant (рефакторинг)
```
LyricsChatAssistant.tsx (~200 строк)
└── lyrics-chat/
    ├── types.ts
    ├── constants.ts
    ├── useLyricsChat.ts (логика)
    ├── ChatComponents.tsx (GenreSelector, MoodSelector, etc.)
    └── index.ts
```

### Анализ аудио
```
TrackAnalysisTab.tsx
├── AnalysisQuickStats.tsx (BPM, Key, Genre cards)
├── EmotionalMap.tsx (arousal/valence)
├── BeatsVisualization.tsx
└── AdvancedMusicAnalytics.tsx
```

---

## 🚦 Путь пользователя

### User Journey Map

```mermaid
journey
    title Путь пользователя в MusicVerse AI
    section Знакомство
      Открывает Telegram бота: 5: User
      Запускает Mini App: 5: User
      Проходит онбординг: 4: User
    section Создание музыки
      Открывает форму генерации: 5: User
      Вводит prompt или использует AI Lyrics: 4: User, AI
      Ожидает генерацию: 3: User
      Получает уведомление: 5: User, Bot
    section Прослушивание
      Открывает библиотеку: 5: User
      Выбирает трек: 5: User
      Переключает версии A/B: 4: User
      Слушает в fullscreen: 5: User
    section Организация
      Создает плейлист: 4: User
      Добавляет треки: 5: User
      Делится через Telegram: 5: User, Bot
    section Продвинутое
      Разделяет на стемы: 4: User, AI
      Микширует стемы: 4: User
      Использует стем для генерации: 3: User, AI
```

### Навигация по приложению

```mermaid
graph LR
    A[Главная] --> B[Библиотека]
    A --> C[Создать]
    A --> D[Проекты]
    A --> E[Артисты]
    A --> F[Плейлисты]
    A --> G[Сообщество]
    A --> H[Профиль]
    
    B --> I[Детали трека]
    I --> J[Анализ аудио]
    I --> K[Версии A/B]
    I --> L[Stem Studio]
    
    C --> M[Simple Mode]
    C --> N[Custom Mode]
    N --> O[AI Lyrics Chat]
    
    D --> P[Plan Tracks]
    P --> C
    
    E --> Q[My Artists]
    E --> R[Community Artists]
    
    F --> S[My Playlists]
    F --> T[Auto Playlists]
    
    H --> U[Settings]
    H --> V[Achievements]
    H --> W[Leaderboard]
    
    style A fill:#61DAFB
    style C fill:#90EE90
    style I fill:#FFB6C1
```

---

## ❓ Как...

### ...добавить новую команду в бот?
1. Создайте handler в `supabase/functions/telegram-bot/handlers/`
2. Зарегистрируйте в `supabase/functions/telegram-bot/index.ts`
3. Добавьте документацию в `docs/TELEGRAM_BOT_ARCHITECTURE.md`

### ...внести изменения в базу данных?
1. Используйте Lovable migration tool (supabase--migration)
2. Миграции применяются автоматически после одобрения
3. Обновите `docs/DATABASE.md`

### ...создать новый экран?
1. Создайте страницу в `src/pages/`
2. Добавьте маршрут в `src/App.tsx`
3. При необходимости добавьте в навигацию (`BottomNavigation.tsx` или `NavigationMenuSheet.tsx`)

### ...добавить новый UI компонент?
1. Для базовых — `src/components/ui/`
2. Для feature-specific — соответствующая папка в `src/components/`
3. Используйте дизайн-токены из `tailwind.config.ts`

### ...рефакторить большой компонент?
1. Выделите типы в отдельный файл `types.ts`
2. Константы в `constants.ts`
3. Логику в кастомный хук `use*.ts`
4. UI подкомпоненты в отдельные файлы
5. Создайте `index.ts` для экспортов

---

## 📋 Чеклисты

### Перед PR
- [ ] Типы TypeScript корректны
- [ ] Нет console.log (используйте logger)
- [ ] Используются дизайн-токены (не прямые цвета)
- [ ] Компонент не превышает 300 строк
- [ ] Добавлена документация для новых функций

### После рефакторинга
- [ ] Функциональность сохранена
- [ ] Удалён мёртвый код
- [ ] Обновлена документация
- [ ] Проверены импорты во всех местах использования

---

## 🔄 Последние обновления (2025-12-10)

### Новая документация
- ✅ DOCUMENTATION_INDEX.md - Полная карта документации
- ✅ SPRINT_STATUS.md - Dashboard спринтов
- ✅ RECENT_IMPROVEMENTS.md - Сводка улучшений декабря
- ✅ REPOSITORY_AUDIT_2025-12-10.md - Аудит репозитория
- ✅ SPRINTS/README.md - Навигация по спринтам

### Архивирование
- ✅ 7 завершённых спринтов → SPRINTS/completed/
- ✅ 20+ аудитов декабря → docs/archive/2025-12/
- ✅ Упорядочена структура документации

### Улучшения навигации
- ✅ Обновлён README.md с текущим статусом
- ✅ Добавлены приоритеты документов
- ✅ Улучшена структура репозитория

---

*Этот документ — живой. Если вы заметили неточность, пожалуйста, обновите его.*

*Last Updated: 2025-12-10*
