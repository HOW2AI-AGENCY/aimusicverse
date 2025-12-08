# 🗂️ Visual Navigation Index

**Интерактивная карта документации MusicVerse AI**

---

## 📊 Диаграмма навигации по документам

```mermaid
mindmap
  root((MusicVerse AI))
    Getting Started
      README.md
      ONBOARDING.md
      QUICK_REFERENCE.md
      DEVELOPMENT_WORKFLOW.md
    Architecture
      ARCHITECTURE_DIAGRAMS.md
        System Design
        Data Flows
        Components
        Deployment
      DATABASE.md
        Schema
        ERD Diagrams
        RLS Policies
      PLAYER_ARCHITECTURE.md
      TELEGRAM_BOT_ARCHITECTURE.md
      SUNO_API.md
    Development
      NAVIGATION.md
      CONTRIBUTING.md
      constitution.md
      CODE_OF_CONDUCT.md
    Project Management
      ROADMAP.md
      CHANGELOG.md
      SPRINTS/
      PROJECT_MANAGEMENT.md
    Reference
      QUICK_REFERENCE.md
      CRITICAL_FILES.md
      SECURITY.md
```

---

## 🎯 По типу задачи

### 🚀 Хочу начать работу

```mermaid
flowchart LR
    A[Новый разработчик] --> B[README.md]
    B --> C[ONBOARDING.md]
    C --> D[DEVELOPMENT_WORKFLOW.md]
    D --> E[Готов к работе!]
    
    style A fill:#FFE4B5
    style E fill:#90EE90
```

**Документы:**
1. [README.md](../README.md) - Обзор проекта
2. [ONBOARDING.md](../ONBOARDING.md) - Настройка окружения
3. [DEVELOPMENT_WORKFLOW.md](../DEVELOPMENT_WORKFLOW.md) - Процесс разработки
4. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Быстрый справочник

### 🏗️ Хочу понять архитектуру

```mermaid
flowchart TB
    A[Изучить архитектуру] --> B{Что интересует?}
    
    B --> C[Общая картина]
    B --> D[База данных]
    B --> E[Компоненты]
    B --> F[Интеграции]
    
    C --> G[ARCHITECTURE_DIAGRAMS.md]
    D --> H[DATABASE.md]
    E --> I[NAVIGATION.md<br/>Component Section]
    F --> J[TELEGRAM_BOT_ARCHITECTURE.md<br/>SUNO_API.md]
    
    style A fill:#FFE4B5
    style G fill:#61DAFB
    style H fill:#336791
```

**Документы:**
1. [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) - Визуальные схемы
2. [DATABASE.md](./DATABASE.md) - Схема БД
3. [PLAYER_ARCHITECTURE.md](./PLAYER_ARCHITECTURE.md) - Плеер
4. [SECTION_REPLACEMENT.md](./SECTION_REPLACEMENT.md) - Замена секций
5. [TELEGRAM_BOT_ARCHITECTURE.md](./TELEGRAM_BOT_ARCHITECTURE.md) - Telegram бот
6. [SUNO_API.md](./SUNO_API.md) - Suno интеграция

### 💻 Хочу написать код

```mermaid
flowchart LR
    A[Написать код] --> B[QUICK_REFERENCE.md]
    B --> C{Что делать?}
    
    C --> D[Новая фича]
    C --> E[Исправить баг]
    C --> F[Новый компонент]
    
    D --> G[CONTRIBUTING.md]
    E --> H[Debugging section]
    F --> I[Component patterns]
    
    style A fill:#FFE4B5
    style B fill:#FFD700
```

**Документы:**
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Быстрые рецепты
2. [CONTRIBUTING.md](../CONTRIBUTING.md) - Гайд по контрибуции
3. [constitution.md](../constitution.md) - Стандарты кода
4. [NAVIGATION.md](../NAVIGATION.md) - Где что находится

### 📋 Хочу управлять проектом

```mermaid
flowchart TB
    A[Управление проектом] --> B[PROJECT_MANAGEMENT.md]
    B --> C[SPRINT_MANAGEMENT.md]
    C --> D[SPRINTS/]
    D --> E[ROADMAP.md]
    
    style A fill:#FFE4B5
    style D fill:#87CEEB
```

**Документы:**
1. [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) - Управление
2. [SPRINT_MANAGEMENT.md](../SPRINT_MANAGEMENT.md) - Спринты
3. [SPRINTS/](../SPRINTS/) - Задачи спринтов
4. [ROADMAP.md](../ROADMAP.md) - Дорожная карта
5. [CHANGELOG.md](../CHANGELOG.md) - История изменений

---

## 📚 По уровню детализации

### 🔍 Уровень 1: Обзор (5 минут чтения)

```mermaid
graph LR
    A[README.md] --> B[Обзор возможностей]
    A --> C[Ключевые метрики]
    A --> D[Быстрый старт]
    
    style A fill:#61DAFB
```

**Для кого:** Новички, менеджеры, инвесторы

### 🔎 Уровень 2: Архитектура (30 минут чтения)

```mermaid
graph TB
    A[ARCHITECTURE_DIAGRAMS.md] --> B[System Design]
    A --> C[Data Flows]
    A --> D[Components]
    
    E[DATABASE.md] --> F[Schema]
    E --> G[Relationships]
    
    style A fill:#9B59B6
    style E fill:#336791
```

**Для кого:** Архитекторы, тимлиды, senior разработчики

### 🔬 Уровень 3: Детали (несколько часов)

```mermaid
graph TB
    A[Специализированные документы]
    
    A --> B[PLAYER_ARCHITECTURE.md]
    A --> C[TELEGRAM_BOT_ARCHITECTURE.md]
    A --> D[SUNO_API.md]
    A --> E[Исходный код]
    
    style A fill:#e74c3c
```

**Для кого:** Разработчики, работающие с конкретными модулями

---

## 🎨 По технологии

### Frontend (React)

| Документ | Что внутри |
|----------|------------|
| [ARCHITECTURE_DIAGRAMS.md § Frontend](./ARCHITECTURE_DIAGRAMS.md#frontend-архитектура) | Component hierarchy, State management |
| [NAVIGATION.md § Components](../NAVIGATION.md#-ключевые-компоненты) | Component organization |
| [QUICK_REFERENCE.md § UI](./QUICK_REFERENCE.md#-стили-и-ui) | UI patterns, styles |

### Backend (PostgreSQL + Edge Functions)

| Документ | Что внутри |
|----------|------------|
| [DATABASE.md](./DATABASE.md) | Full schema, RLS, indexes |
| [ARCHITECTURE_DIAGRAMS.md § Backend](./ARCHITECTURE_DIAGRAMS.md#backend-архитектура) | Edge Functions, Database architecture |
| [QUICK_REFERENCE.md § Database](./QUICK_REFERENCE.md#-работа-с-данными) | Query patterns, optimization |

### Telegram Integration

| Документ | Что внутри |
|----------|------------|
| [TELEGRAM_BOT_ARCHITECTURE.md](./TELEGRAM_BOT_ARCHITECTURE.md) | Bot architecture, commands, webhooks |
| [ARCHITECTURE_DIAGRAMS.md § Telegram](./ARCHITECTURE_DIAGRAMS.md#общая-архитектура-системы) | Integration flows |

### AI Services (Suno, Gemini)

| Документ | Что внутри |
|----------|------------|
| [SUNO_API.md](./SUNO_API.md) | Music generation API |
| [ARCHITECTURE_DIAGRAMS.md § AI](./ARCHITECTURE_DIAGRAMS.md#потоки-данных) | AI integration flows |

---

## 🔗 Связанные документы

### Визуальная карта связей

```mermaid
graph TB
    README[README.md] --> ARCH[ARCHITECTURE_DIAGRAMS.md]
    README --> NAV[NAVIGATION.md]
    README --> QR[QUICK_REFERENCE.md]
    
    ARCH --> DB[DATABASE.md]
    ARCH --> PLAYER[PLAYER_ARCHITECTURE.md]
    ARCH --> TG[TELEGRAM_BOT_ARCHITECTURE.md]
    ARCH --> SUNO[SUNO_API.md]
    
    NAV --> QR
    NAV --> CONTRIB[CONTRIBUTING.md]
    
    QR --> CONST[constitution.md]
    QR --> DEV[DEVELOPMENT_WORKFLOW.md]
    
    CONTRIB --> CODE[CODE_OF_CONDUCT.md]
    
    style README fill:#61DAFB,stroke:#333,stroke-width:4px
    style ARCH fill:#9B59B6,stroke:#333,stroke-width:3px
    style DB fill:#336791,stroke:#333,stroke-width:2px
    style QR fill:#FFD700,stroke:#333,stroke-width:2px
```

---

## 📱 Быстрый доступ по функциям

### Генерация музыки

```
1. User Flow: ARCHITECTURE_DIAGRAMS.md § Music Generation Flow
2. Technical: SUNO_API.md
3. Database: DATABASE.md § tracks, track_versions
4. Components: NAVIGATION.md § GenerateSheet
```

### Плеер

```
1. Architecture: PLAYER_ARCHITECTURE.md
2. State: ARCHITECTURE_DIAGRAMS.md § Player State Machine
3. Components: NAVIGATION.md § Player Components
4. Quick Start: QUICK_REFERENCE.md § Audio Problems
```

### Плейлисты

```
1. Flow: ARCHITECTURE_DIAGRAMS.md § Playlist Creation Flow
2. Database: DATABASE.md § playlists, playlist_tracks
3. Components: NAVIGATION.md § Playlist Components
```

### Stem Studio

```
1. Architecture: ARCHITECTURE_DIAGRAMS.md § Stem Studio
2. Section Replacement: SECTION_REPLACEMENT.md
3. Database: DATABASE.md § track_stems, track_change_log
4. Components: NAVIGATION.md § Stem Studio
```

### Telegram бот

```
1. Architecture: TELEGRAM_BOT_ARCHITECTURE.md
2. Integration: ARCHITECTURE_DIAGRAMS.md § Telegram Integration
3. Commands: TELEGRAM_BOT_ARCHITECTURE.md § Commands
```

---

## 🆘 Решение проблем

### Не могу найти нужную информацию

1. Начните с [README.md](../README.md)
2. Используйте [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) для частых задач
3. Смотрите [NAVIGATION.md](../NAVIGATION.md) для навигации по коду
4. Проверьте [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) для визуализации

### Хочу понять как работает X

```mermaid
flowchart LR
    A[Найти в коде] --> B[grep или IDE search]
    B --> C[Смотреть импорты]
    C --> D[Читать типы]
    D --> E[Проверить тесты]
    E --> F[Понял! ✅]
    
    style A fill:#FFE4B5
    style F fill:#90EE90
```

**Инструменты:**
- `grep -r "functionName" src/`
- IDE: Go to Definition (F12)
- GitHub search
- Tests: `*.test.tsx` файлы

### Документация устарела

1. Создайте issue на GitHub
2. Или отправьте PR с исправлением
3. Укажите дату обновления в header

---

## 📊 Статистика документации

| Категория | Документов | Диаграмм | Строк кода в примерах |
|-----------|------------|----------|----------------------|
| Getting Started | 4 | 5 | ~200 |
| Architecture | 6 | 25+ | ~500 |
| Development | 5 | 8 | ~1000 |
| Reference | 3 | 3 | ~300 |
| **Всего** | **18+** | **40+** | **~2000** |

---

## 🎯 Рекомендуемый порядок изучения

### Для новых разработчиков

```mermaid
journey
    title Путь изучения документации
    section День 1
      README.md: 5: Разработчик
      ONBOARDING.md: 4: Разработчик
      Настройка окружения: 3: Разработчик
    section День 2-3
      NAVIGATION.md: 5: Разработчик
      QUICK_REFERENCE.md: 5: Разработчик
      Первый код: 4: Разработчик
    section Неделя 1
      ARCHITECTURE_DIAGRAMS.md: 4: Разработчик
      DATABASE.md: 3: Разработчик
      Понимание системы: 5: Разработчик
    section Месяц 1
      Специализированные документы: 5: Разработчик
      Глубокое понимание: 5: Разработчик
```

### Для архитекторов

1. [README.md](../README.md) - Обзор
2. [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) - Полная архитектура
3. [DATABASE.md](./DATABASE.md) - Схема данных
4. Специализированные документы по интересующим модулям

### Для менеджеров

1. [README.md](../README.md) - Возможности и метрики
2. [ROADMAP.md](../ROADMAP.md) - Планы развития
3. [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) - Процессы
4. [CHANGELOG.md](../CHANGELOG.md) - История

---

## 🔄 Обновление документации

Эта документация обновляется с каждым значительным изменением проекта.

**Последние обновления:**
- 2025-12-08: Добавлены визуальные диаграммы и навигация
- 2025-12-05: Обновлена схема БД
- 2025-12-03: Комплексный аудит

**Как внести изменения:**
1. Найдите соответствующий документ
2. Внесите изменения
3. Обновите дату в header
4. Создайте PR

---

**Поддерживается:** MusicVerse AI Team  
**Обратная связь:** [GitHub Issues](https://github.com/HOW2AI-AGENCY/aimusicverse/issues)
