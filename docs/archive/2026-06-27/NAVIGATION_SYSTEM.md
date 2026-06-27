# 🗺️ Система навигации MusicVerse

## 🎯 Обзор

Этот документ описывает комплексную систему навигации для платформы MusicVerse AI, предназначенную для предоставления четких направлений для разработчиков, сопровождающих и пользователей.

## 📂 Навигация по структуре проекта

### Навигация по фронтенду

```
src/
├── 📁 pages/                    # Основные маршруты навигации
│   ├── Index.tsx               # Целевая страница
│   ├── Library.tsx             # Библиотека музыки пользователя
│   ├── Generate.tsx            # Интерфейс генерации музыки
│   ├── Projects.tsx            # Управление проектами
│   ├── Analytics.tsx           # Аналитика использования
│   └── Profile.tsx             # Профиль пользователя
└── 📁 components/               # Переиспользуемые компоненты
    ├── AudioPlayer.tsx         # Управление аудио воспроизведением
    ├── TrackCard.tsx           # Карточки для показа треков
    ├── GenerateForm.tsx        # Форма генерации
    └── Navigation/
        ├── BottomNav.tsx       # Мобильная навигация
        ├── TopNav.tsx           # Десктопная шапка
        └── Breadcrumbs.tsx      # Навигационные хлебные крошки
```

### Навигация по бэкэнду

```
supabase/functions/              # Безсерверные функции
├── telegram-bot/               # Основная функциональность бота
│   ├── handlers/               # Обработчики команд
│   ├── menus/                  # Создатели клавиатур
│   └── services/              # Бизнес-логика
├── suno-generate/              # Генерация музыки
├── suno-check-status/          # Отслеживание статуса
├── cleanup-stale-tasks/        # Обслуживание
└── telegram-webhook-setup/     # Настройка API
```

## 🚀 Навигация по разработке

### Быстрое руководство по старту

1. **[Настройка разработки](./ONBOARDING.md)** - Конфигурация окружения
2. **[Рабочий процесс](./DEVELOPMENT_WORKFLOW.md)** - GitFlow и стандарты
3. **[База данных](./DATABASE.md)** - Схема базы данных
4. **[Архитектура](./ARCHITECTURE.md)** - Архитектура системы
5. **[API документация](./API.md)** - Документация API

### Навигация на основе спринта

| Спринт       | Статус          | Ссылка навигации             | Фокус |
| ------------ | --------------- | ---------------------------- | ----- |
| **Спринт 1** | ✅ Завершён     | Ядро бота + уведомления      |
| **Спринт 2** | ✅ Завершён     | Расширенные функции          |
| **Спринт 3** | ✅ Завершён     | Интеграция бота и приложения |
| **Спринт 4** | 🟢 Активен      | Полировка и оптимизация      |
| **Спринт 5** | 📅 Запланирован | Корпоративные функции        |
| **Спринт 6** | 📅 Запланирован | Производительность           |

## 📚 Навигация по документации

### Документация для пользователей

| Категория              | Документ                                             | Описание                            |
| ---------------------- | ---------------------------------------------------- | ----------------------------------- |
| **Начало работы**      | [`ONBOARDING.md`](./ONBOARDING.md)                   | Полное руководство разработчика     |
| **Возможности**        | [`AI_LYRICS_ASSISTANT.md`](./AI_LYRICS_ASSISTANT.md) | Обзор доступных функций             |
| **Известные проблемы** | [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md)               | Распространённые проблемы и решения |
| **Частые вопросы**     | [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md)         | Гайд разработчика                   |

### Документация для разработчиков

| Категория             | Документ                             | Описание                          |
| --------------------- | ------------------------------------ | --------------------------------- |
| **Архитектура**       | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Обзор системной архитектуры       |
| **Справка по API**    | [`API.md`](API.md)                   | Полные спецификации API           |
| **Схема базы данных** | [`DATABASE.md`](DATABASE.md)         | Структура базы данных и отношения |
| **Мета-теги**         | [`META_TAGS.md`](META_TAGS.md)       | Все 174+ управляющих тегов        |
| **Стили музыки**      | [`STYLES.md`](STYLES.md)             | Полный каталог стилей             |

### Документация по интеграции

| Категория                    | Документ                                                         | Описание                     |
| ---------------------------- | ---------------------------------------------------------------- | ---------------------------- |
| **Telegram бот**             | [`TELEGRAM_BOT_ARCHITECTURE.md`](TELEGRAM_BOT_ARCHITECTURE.md)   | Настройка бота и команды     |
| **Мини-приложение Telegram** | [`TELEGRAM_MINI_APP_FEATURES.md`](TELEGRAM_MINI_APP_FEATURES.md) | Конфигурация мини-приложения |
| **Suno API**                 | [`SUNO_API.md`](SUNO_API.md)                                     | Интеграция Suno AI           |

## 🔍 Навигация по функциям

### Возможности генерации музыки

```typescript
// Быстрая генерация
generateSimple(prompt: string) → Track
// Улучшенная генерация
generateWithMetaTags({title, prompt, style, tags}) → Track
// Генерация лирики
generateLyrics(theme: string) → Lyrics
// Трансфер стиля
transferStyle(trackId: string, targetStyle: string) → NewTrack
```

### Возможности управления проектами

```typescript
// Создать проект
createProject({name, type, collaborators}) → Project
// Добавить треки в проект
addTracksToProject(projectId: string, trackIds: string[]) → Project
// Сгенерировать концепт проекта
generateProjectAI(projectType: string, parameters) → AIConcept
```

### Возможности коллаборации

```typescript
// Добавить соавтора
addCollaborator(projectId: string, userId: string) → Collaboration
// QR-код для коллаборации
generateCollaborationQR(projectId: string) → QRCode
// Сканировать QR-код
scanCollaborationQR(data: string) → CollaborationInvite
```

## 🌐 Навигация на разных языках

### Документация на конкретных языках

| Язык               | Документация                                                       | Поддержка API       |
| ------------------ | ------------------------------------------------------------------ | ------------------- |
| **🇺🇸 Английский**  | [`README.md`](../README.md)                                        | ✅ Основной         |
| **🇷🇺 Русский**     | [`TELEGRAM_BOT_USER_GUIDE_RU.md`](./TELEGRAM_BOT_USER_GUIDE_RU.md) | ✅ Полная поддержка |
| **🇪🇸 Испанский**   | [`LANGUAGES.md`](./LANGUAGES.md)                                   | ✅ Полная поддержка |
| **🇨🇳 Китайский**   | [`LANGUAGES.md`](./LANGUAGES.md)                                   | ✅ Полная поддержка |
| **🇫🇷 Французский** | [`LANGUAGES.md`](./LANGUAGES.md)                                   | ✅ Полная поддержка |

### Навигация смены языка

```bash
# Для русскоязычных пользователей
navigator("/ru/rukovodstvo", { язык: "ru" })

# Для испаноязычных пользователей
navigator("/es/guia", { язык: "es" })

# Для китайских пользователей
navigator("/zh/指南", { язык: "zh" })
```

## 🎯 Рабочий процесс спринта

### Навигация планирования спринта

1. **[Обзор бэклога](./PROJECT_MANAGEMENT.md)** - Обзор будущих функций
2. **[Оценка историй](./DEVELOPMENT_WORKFLOW.md)** - Оценка уровней усилий
3. **[Планирование спринта](./DEVELOPMENT_WORKFLOW.md#sprint-planning)** - Планирование будущего спринта
4. **[Дорожная карта](../ROADMAP.md)** - Дорожная карта развития

### Навигация выполнения спринта

1. **[Рабочий процесс](./DEVELOPMENT_WORKFLOW.md)** - Ежедневная синхронизация команды
2. **[Архитектура](./ARCHITECTURE.md)** - Текущая работа
3. **[Участие в проекте](../CONTRIBUTING.md)** - Рекомендации по процессу ревью
4. **[Оптимизация](./PERFORMANCE_OPTIMIZATION.md)** - Обеспечение качества

### Навигация обзора спринта

1. **[Проект MusicVerse](../DOCUMENTATION_INDEX.md)** - История изменений
2. **[Обновление документации](./INDEX.md)** - Обновление документов
3. **[Планирование следующего](../ROADMAP.md)** - Планирование продолжения

## 📊 Аналитика и мониторинг

### Аналитика использования

```typescript
// Отслеживание использования функций
trackFeatureUsage(feature: string, userId: string, parameters: any) -> Analytics
// Отслеживание воронки конверсии
trackConversion(path: string, events: string[]) -> FunnelAnalytics
// Мониторинг производительности
trackPerformanceMetrics(metrics: PerformanceData) -> Health
```

### Навигация отслеживания ошибок

```typescript
// Логировать и отслеживать ошибки
trackError(error: Error, context: any) -> ErrorReport
// Настройка A/B тестирования
setupABTest(testName: string, variants: Variant[]) -> ABTest
// Управление флагами функций
manageFeatureFlags(feature: string, userId: string) -> FeatureFlag
```

## 🔧 Утилиты разработчика

### Генерация кода

```bash
# Сгенерировать новый компонент
npm run generate:component Button --props=label,onClick

# Сгенерировать новый хук
npm run generate:hook useAnalytics --params=trackingCategory

# Сгенерировать новую страницу
npm run generate:page Analytics --path=/analytics
```

### Управление базой данных

```bash
# Создать новую миграцию
supabase migration new add_feature_table

# Применить миграции
supabase migration apply --local

# Сгенерировать типы из БД
supabase gen types typescript --local > src/types/supabase.ts
```

### Навигация тестирования

```bash
# Запустить все тесты
npm run test:e2e

# Тестировать конкретный компонент
npm run test:unit -- Button.test.tsx

# Сгенерировать отчёт о покрытии
npm run test:coverage
```

## 🚀 Навигация развертывания

### Настройка окружения

| Окружение         | Конфигурация                           | Руководство по развертыванию                           |
| ----------------- | -------------------------------------- | ------------------------------------------------------ |
| **Разработка**    | [`ONBOARDING.md`](./ONBOARDING.md)     | [`DEVELOPMENT_WORKFLOW.md`](./DEVELOPMENT_WORKFLOW.md) |
| **Промежуточное** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | [`API.md`](./API.md)                                   |
| **Продакшн**      | [`SECURITY.md`](../SECURITY.md)        | [`MAINTENANCE.md`](../MAINTENANCE.md)                  |

### Развертывание на платформу

```bash
# Развертывание в Lovable Cloud
npm run deploy:lovable

# Развертывание в Vercel
npm run deploy:vercel

# Развертывание в CloudFlare
npm run deploy:cloudflare
```

## 📋 Карты быстрого справочника

### Справочник местоположений файлов

| Компонент               | Путь к файлу                                      | Описание           |
| ----------------------- | ------------------------------------------------- | ------------------ |
| **Главное приложение**  | `src/App.tsx`                                     | Роутер приложения  |
| **Telegram бот**        | `supabase/functions/telegram-bot/index.ts`        | Входная точка бота |
| **Интеграция Suno**     | `supabase/functions/suno-music-generate/index.ts` | Генерация AI       |
| **Конфигурация БД**     | `supabase/config.toml`                            | Настройки Supabase |
| **Зависимости пакетов** | `package.json`                                    | Фронтенд пакеты    |

### Справочник общих команд

| Задача                    | Команда                                 | Описание                           |
| ------------------------- | --------------------------------------- | ---------------------------------- |
| **Запуск разработки**     | `npm run dev`                           | Локальный сервер по localhost:5173 |
| **Генерация типов**       | `supabase gen types typescript --local` | Генерация типов TypeScript         |
| **Статус Supabase**       | `supabase status --local`               | Проверка статуса Supabase          |
| **Развертывание функций** | `supabase functions deploy`             | Развертывание функций на краю      |

## 🆘 Поддержка и навигация устранения неисправностей

### Распространённые проблемы

| Проблема                      | Решение                        | Документация                                                           |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| **Бот не запускается**        | Проверить логи и токены        | [`TELEGRAM_BOT_ARCHITECTURE.md`](./TELEGRAM_BOT_ARCHITECTURE.md)       |
| **Подключение к базе данных** | Проверить учетные данные       | [`DATABASE.md`](./DATABASE.md)                                         |
| **Ошибки вебхуков**           | Отладить конфигурацию вебхуков | [`TELEGRAM_BOT_DEVELOPER_GUIDE.md`](./TELEGRAM_BOT_DEVELOPER_GUIDE.md) |
| **Ошибки TypeScript**         | Обновить сгенерированные типы  | [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md)                           |

### Получение помощи

1. **[Шаблоны проблем](https://github.com/yourusername/musicverse/issues)** - Докладывать об ошибках с использованием шаблонов
2. **[Обсуждения GitHub](https://github.com/yourusername/musicverse/discussions)** - Задавать вопросы и обсуждать
3. **[Сообщество Discord](https://discord.gg/musicverse)** - Общаться с сопровождающими
4. **[Stack Overflow](https://stackoverflow.com/questions/tagged/musicverse)** - Технические вопросы

---

## 🎯 Быстрый старт к навигации

### Для новых участников

1. Начните с [`README.md`](../README.md)
2. Ознакомьтесь с [`CONTRIBUTING.md`](../CONTRIBUTING.md)
3. Настройте [локальную разработку](#настройка-разработки)
4. Изучите [планирование спринта](#планирование-спринта)
5. Проверьте [ярлыки проблем](https://github.com/yourusername/musicverse/labels)

### Для опытных разработчиков

1. Перейдите к [`ARCHITECTURE.md`](ARCHITECTURE.md)
2. Ознакомьтесь с [спецификациями API](API.md)
3. Проверьте [процесс разработки](#процесс-разработки)
4. Присоединяйтесь к [рецензиям спринта](#рецензиям-спринта)

### Для сопровождающих

1. Мониторьте [доску спринта](#доска спринта)
2. Рецензируйте [ожидающие PR](https://github.com/yourusername/musicverse/pulls)
3. Проверьте [планирование релиза](https://github.com/yourusername/musicverse/milestones)
4. Обновите [документацию](#обновление-документации)

---

_Эта система навигации постоянно обновляется. Последнее обновление: Декабрь 2025 г._
