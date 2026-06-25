# 📁 Структура проекта MusicVerse AI

**Последнее обновление:** 2026-06-25  
**Версия:** 1.0.0

---

## 🗂️ Общий обзор

```
aimusicverse/
├── 📄 README.md                 # Главная точка входа
├── 📄 PROJECT_STATUS.md         # Текущий статус проекта
├── 📄 ROADMAP.md                # Дорожная карта
├── 📄 CHANGELOG.md              # История версий
├── 📄 CONTRIBUTING.md           # Руководство по контрибуции
├── 📄 CODE_OF_CONDUCT.md        # Кодекс поведения
├── 📄 SECURITY.md               # Политика безопасности
├── 📄 CLAUDE.md                 # Инструкции для Claude Code
├── 📄 DOCUMENTATION_INDEX.md    # Индекс документации
├── 📄 PROJECT_STRUCTURE.md      # Этот файл
│
├── 📂 src/                      # Исходный код приложения
│   ├── components/              # 1,124+ React компоненты
│   │   ├── ui/                  # shadcn/ui компоненты
│   │   ├── mobile/              # Мобильные компоненты (19)
│   │   ├── player/              # Аудио плеер
│   │   ├── generate/            # Генерация музыки
│   │   ├── library/             # Библиотека треков
│   │   └── studio/              # Unified Studio
│   │
│   ├── hooks/                   # 200+ кастомных хуков
│   │   ├── useTelegram.ts       # Telegram интеграция
│   │   ├── useAudioPlayer.ts    # Аудио плеер
│   │   └── ...
│   │
│   ├── services/                # Бизнес-логика (13 сервисов)
│   │   ├── audioService.ts      # Аудио операции
│   │   ├── generationService.ts # Генерация музыки
│   │   ├── telegramService.ts   # Telegram API
│   │   └── ...
│   │
│   ├── api/                     # Supabase API слой
│   │   ├── supabase.ts          # Клиент
│   │   ├── tracks.ts            # Треки
│   │   ├── users.ts             # Пользователи
│   │   └── ...
│   │
│   ├── stores/                  # Zustand хранилища (8)
│   │   ├── usePlayerStore.ts    # Плеер состояние
│   │   ├── useLibraryStore.ts   # Библиотека
│   │   └── ...
│   │
│   ├── pages/                   # Маршруты (40+)
│   │   ├── HomePage.tsx
│   │   ├── GeneratePage.tsx
│   │   ├── LibraryPage.tsx
│   │   ├── StudioPage.tsx
│   │   └── ...
│   │
│   ├── lib/                     # Утилиты (60+)
│   │   ├── utils.ts             # Общие утилиты
│   │   ├── constants.ts         # Константы
│   │   ├── validators.ts        # Валидаторы
│   │   └── ...
│   │
│   ├── types/                   # TypeScript типы
│   │   ├── track.ts
│   │   ├── user.ts
│   │   ├── generation.ts
│   │   └── ...
│   │
│   ├── contexts/                # React контексты (10)
│   │   ├── TelegramContext.tsx
│   │   ├── AudioContext.tsx
│   │   └── ...
│   │
│   ├── assets/                  # Статические файлы
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   └── styles/                  # Глобальные стили
│       └── globals.css
│
├── 📂 tests/                    # Тесты
│   ├── e2e/                     # 62+ Playwright тесты
│   │   ├── generate.spec.ts
│   │   ├── player.spec.ts
│   │   └── ...
│   ├── unit/                    # 27+ Jest тестов
│   │   ├── utils.test.ts
│   │   └── ...
│   └── integration/             # Интеграционные тесты
│
├── 📂 supabase/                 # Backend
│   ├── functions/               # 99+ Edge Functions
│   │   ├── generate-music/
│   │   ├── process-payment/
│   │   └── ...
│   ├── migrations/              # Миграции БД
│   ├── seed.sql                 # Начальные данные
│   └── config.toml              # Конфигурация
│
├── 📂 docs/                     # 100+ файлов документации
│   ├── INDEX.md                 # Главный индекс
│   ├── QUICK_START.md           # Быстрый старт
│   ├── ARCHITECTURE.md          # Архитектура
│   ├── ARCHITECTURE_DIAGRAMS.md # Диаграммы
│   ├── DATABASE.md              # Схема БД
│   ├── API.md                   # API документация
│   ├── TESTING_INFRASTRUCTURE.md # Тестирование
│   ├── QUALITY_GATES.md         # Стандарты качества
│   ├── DEVELOPMENT_WORKFLOW.md  # Рабочий процесс
│   ├── ONBOARDING.md            # Онбординг
│   ├── PLAYER_ARCHITECTURE.md   # Архитектура плеера
│   ├── STEM_STUDIO.md           # Студия
│   ├── TELEGRAM_BOT_ARCHITECTURE.md # Telegram бот
│   ├── SAFE_AREA_GUIDELINES.md  # Mobile guidelines
│   ├── PERFORMANCE_OPTIMIZATION.md # Производительность
│   ├── SECURITY_SUMMARY.md      # Безопасность
│   │
│   ├── architecture/            # Архитектурные диаграммы
│   ├── features/                # Описание фич
│   ├── guides/                  # Руководства
│   ├── mobile/                  # Mobile документация
│   ├── integrations/            # Интеграции
│   ├── templates/               # Шаблоны
│   └── images/                  # Изображения для доков
│
├── 📂 ADR/                      # Architecture Decision Records
│   ├── ADR-001-TECHNOLOGY-STACK-CHOICE.md
│   ├── ADR-002-Frontend-Architecture-And-Stack.md
│   ├── ADR-003-Performance-Optimization-Architecture.md
│   ├── ADR-004-Audio-Playback-Optimization.md
│   ├── ADR-004-Error-Handling-Architecture.md
│   ├── ADR-005-State-Machine-Architecture.md
│   ├── ADR-006-Type-Safe-Audio-Context.md
│   ├── ADR-011-UNIFIED-STUDIO-ARCHITECTURE.md
│   └── ADR-012-GENERATION-FORM-COMPACT-UI.md
│
├── 📂 specs/                    # Технические спецификации
│   ├── 001-mobile-ui-redesign/
│   ├── 031-mobile-studio-v2/
│   └── 032-professional-ui/
│
├── 📂 SPRINTS/                  # Документация спринтов
│   ├── README.md                # Обзор системы
│   ├── SPRINT-PROGRESS.md       # Текущий прогресс
│   ├── BACKLOG.md               # Продуктовый бэклог
│   ├── FUTURE_WORK_PLAN_2026.md # План на 2026
│   ├── IMPROVEMENT_PLAN_2026.md # Приоритеты улучшений
│   └── completed/               # 35+ завершённых спринтов
│
├── 📂 scripts/                  # Вспомогательные скрипты
│   ├── setup.sh
│   ├── deploy.sh
│   └── generate-docs.ts
│
├── 📂 public/                   # Публичные файлы
│   ├── index.html
│   ├── favicon.ico
│   └── robots.txt
│
├── 📂 graphify-out/             # Knowledge graph
│   ├── graph.json
│   ├── wiki/
│   └── GRAPH_REPORT.md
│
├── 📂 verification/             # Верификация
│
├── ⚙️ .env                      # Переменные окружения
├── ⚙️ .env.example              # Пример переменных
├── ⚙️ .gitignore                # Git ignore
├── ⚙️ .editorconfig             # Editor config
├── ⚙️ .prettierrc.json          # Prettier config
├── ⚙️ .prettierignore           # Prettier ignore
├── ⚙️ eslint.config.js          # ESLint config
├── ⚙️ tsconfig.json             # TypeScript config
├── ⚙️ vite.config.ts            # Vite config
├── ⚙️ tailwind.config.ts        # Tailwind config
├── ⚙️ postcss.config.js         # PostCSS config
├── ⚙️ jest.config.js            # Jest config
├── ⚙️ vitest.config.ts          # Vitest config
├── ⚙️ playwright.config.ts      # Playwright config
├── ⚙️ lighthouserc.json         # Lighthouse config
├── ⚙️ components.json           # shadcn/ui config
├── ⚙️ package.json              # Зависимости
├── ⚙️ package-lock.json         # Lock файл
├── ⚙️ bun.lock                  # Bun lock
├── ⚙️ bunfig.toml               # Bun config
├── ⚙️ babel.config.js           # Babel config
└── ⚙️ index.html                # Entry point
```

---

## 📊 Статистика проекта

| Метрика | Значение |
|---------|----------|
| **React компоненты** | 1,124+ |
| **TypeScript файлы** | 1,957+ |
| **Кастомные хуки** | 200+ |
| **Edge Functions** | 99+ |
| **Таблиц в БД** | 30+ |
| **E2E тесты** | 62+ |
| **Unit тесты** | 27+ |
| **Файлов документации** | 100+ |
| **Завершённых спринтов** | 35+ |
| **ADR записей** | 8 |

---

## 🎯 Ключевые директории

### `src/` — Исходный код
Основная директория приложения, содержащая все React компоненты, хуки, сервисы и утилиты.

**Важные поддиректории:**
- `components/` — UI компоненты (мобильные, плеер, генерация, студия)
- `hooks/` — Переиспользуемая логика
- `services/` — Бизнес-логика и API вызовы
- `stores/` — Глобальное состояние (Zustand)
- `pages/` — Маршруты приложения

### `docs/` — Документация
Полная документация проекта, включая архитектуру, API, руководства и справочники.

**Важные файлы:**
- `INDEX.md` — Главный индекс документации
- `ARCHITECTURE_DIAGRAMS.md` — Визуальные диаграммы
- `DEVELOPMENT_WORKFLOW.md` — Процесс разработки
- `TESTING_INFRASTRUCTURE.md` — Руководство по тестированию

### `supabase/` — Backend
Backend инфраструктура на Supabase.

**Важные поддиректории:**
- `functions/` — Serverless Edge Functions
- `migrations/` — Миграции базы данных

### `tests/` — Тесты
Полный набор тестов для обеспечения качества.

**Типы тестов:**
- `e2e/` — End-to-end тесты (Playwright)
- `unit/` — Unit тесты (Jest/Vitest)
- `integration/` — Интеграционные тесты

### `ADR/` — Architecture Decision Records
Записи архитектурных решений, объясняющих ключевые выборы в проекте.

### `SPRINTS/` — Управление спринтами
Документация по agile-разработке и трекинг прогресса.

---

## 🔗 Навигация по проекту

### Для новых разработчиков
1. [README.md](README.md) — Обзор проекта
2. [CONTRIBUTING.md](CONTRIBUTING.md) — Как контрибьютить
3. [docs/ONBOARDING.md](docs/ONBOARDING.md) — Онбординг
4. [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) — Рабочий процесс
5. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Архитектура

### Для разработчиков
1. [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) — Гайд разработчика
2. [docs/API.md](docs/API.md) — API документация
3. [docs/HOOKS_REFERENCE.md](docs/HOOKS_REFERENCE.md) — Справочник хуков
4. [ADR/](ADR/) — Архитектурные решения

### Для QA инженеров
1. [docs/TESTING_INFRASTRUCTURE.md](docs/TESTING_INFRASTRUCTURE.md) — Тестирование
2. [docs/QUALITY_GATES.md](docs/QUALITY_GATES.md) — Стандарты качества
3. [tests/](tests/) — Тестовые файлы

### Для мобильных разработчиков
1. [docs/SAFE_AREA_GUIDELINES.md](docs/SAFE_AREA_GUIDELINES.md) — Mobile guidelines
2. [docs/mobile/](docs/mobile/) — Mobile документация
3. [docs/MOBILE_COMPONENTS.md](docs/MOBILE_COMPONENTS.md) — Компоненты

---

## 📦 Зависимости

### Основные
- **React 19.2** — UI фреймворк
- **TypeScript 5.9** — Типизация
- **Vite 5.0** — Сборка
- **Tailwind 3.4** — Стили
- **shadcn/ui** — Компоненты

### State Management
- **Zustand** — Глобальное состояние
- **TanStack Query** — Серверное состояние

### Backend
- **Supabase** — BaaS
- **PostgreSQL** — База данных

### Тестирование
- **Jest** — Unit тесты
- **Playwright** — E2E тесты
- **Vitest** — Быстрые тесты

### Качество кода
- **ESLint** — Линтинг
- **Prettier** — Форматирование
- **TypeScript** — Статический анализ

---

## 🛠️ Конфигурационные файлы

| Файл | Назначение |
|------|-----------|
| `.prettierrc.json` | Настройки форматирования |
| `eslint.config.js` | Правила линтинга |
| `.editorconfig` | Стиль редактора |
| `tsconfig.json` | TypeScript конфигурация |
| `vite.config.ts` | Vite конфигурация |
| `tailwind.config.ts` | Tailwind конфигурация |
| `jest.config.js` | Jest конфигурация |
| `playwright.config.ts` | Playwright конфигурация |
| `lighthouserc.json` | Lighthouse бюджеты |

---

## 🚀 Быстрые команды

```bash
# Установка
npm install

# Разработка
npm run dev

# Тесты
npm test                    # Unit тесты
npm run test:e2e           # E2E тесты
npm run test:all           # Все тесты

# Качество кода
npm run lint               # ESLint
npm run format             # Prettier
npm run type-check         # TypeScript

# Сборка
npm run build              # Production build
npm run preview            # Preview build

# Деплой
npm run deploy             # Деплой
```

---

## 📝 Стандарты проекта

### Форматирование
- **Prettier** — автоматическое форматирование
- **2 пробела** — отступы
- **LF** — окончания строк
- **UTF-8** — кодировка

### Именование
- **Компоненты:** `PascalCase` (`MusicPlayer.tsx`)
- **Функции:** `camelCase` (`handlePlayback`)
- **Константы:** `UPPER_SNAKE_CASE` (`MAX_DURATION`)
- **Файлы утилит:** `camelCase.ts` (`formatDate.ts`)

### Git
- **Ветки:** `feature/`, `bugfix/`, `hotfix/`
- **Коммиты:** Conventional Commits
- **PR:** В ветку `develop`

---

## 🔒 Безопасность

### Что никогда не коммитить
- ❌ API ключи и токены
- ❌ Пароли и credentials
- ❌ `.env` файлы
- ❌ Личные данные

### Переменные окружения
- `.env` — локальные (не коммитить)
- `.env.example` — пример (коммитить)

---

## 📚 Дополнительные ресурсы

- [README.md](README.md) — Главная страница
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) — Полный индекс документации
- [CONTRIBUTING.md](CONTRIBUTING.md) — Руководство по контрибуции
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — Текущий статус
- [ROADMAP.md](ROADMAP.md) — Дорожная карта

---

<div align="center">

**Создано с ❤️ командой MusicVerse AI**

[🏠 Главная](README.md) • [📖 Документация](docs/INDEX.md) • [💬 Contributing](CONTRIBUTING.md)

*Последнее обновление: 2026-06-25*

</div>