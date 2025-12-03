<!--
=================================================================================
SYNC IMPACT REPORT
=================================================================================
Version change: 1.0.0 → 2.0.0 (MAJOR)
Date: 2025-12-02
Rationale: Complete reconstruction with expanded principles from 5 to 8, 
           comprehensive tech stack specification, enhanced quality gates,
           and detailed operational standards for MusicVerse AI platform.

Modified principles:
  - I. Тестирование (Test-First) → I. Качество кода и тестирование (expanded)
  - II. Безопасность и минимизация данных → II. Безопасность и защита данных (expanded)
  - III. Наблюдаемость и метрики → III. Наблюдаемость и мониторинг (expanded)
  - IV. Инкрементальная доставка → IV. Инкрементальная доставка (clarified)
  - V. Простота и документация → V. Архитектурная простота (expanded)

Added principles:
  - VI. Производительность и оптимизация (NEW)
  - VII. Мультиязычность и доступность (NEW)
  - VIII. Telegram-first подход и UX (NEW)

Added sections:
  - Detailed Technical Stack specification
  - Code Quality Standards (Prettier, ESLint, TypeScript)
  - Testing Requirements (Jest, React Testing Library, coverage targets)
  - CI/CD Pipeline requirements
  - Performance benchmarks and metrics
  - Accessibility standards (a11y, i18n)
  - Telegram integration patterns
  - Deployment and DevOps standards

Removed sections: none (all previous content retained and enhanced)

Templates requiring updates:
  ✅ .specify/templates/plan-template.md - already aligned with constitution
  ✅ .specify/templates/tasks-template.md - already aligned with constitution
  ⚠️  .specify/templates/spec-template.md - requires update to reflect new principles
  ⚠️  README.md - may need to reference updated constitution
  ⚠️  CONTRIBUTING.md - should cross-reference constitution principles

Follow-up TODOs:
  - Update spec-template.md to include checkboxes for principles VI-VIII
  - Consider adding automated constitution compliance checker script
  - Add constitution badge/reference to README
  - Review existing codebase for compliance with new principles
=================================================================================
-->

# MusicVerse AI - Конституция проекта

**Проект**: MusicVerse AI - Профессиональная AI-платформа для создания музыки  
**Назначение**: Telegram Mini App для генерации музыки с использованием Suno AI v5  
**Лицензия**: MIT  
**Репозиторий**: HOW2AI-AGENCY/aimusicverse

---

## Преамбула

Настоящая Конституция определяет основополагающие принципы, стандарты и требования к разработке платформы MusicVerse AI. Все участники проекта обязаны следовать этим принципам для обеспечения высокого качества кода, безопасности, производительности и удобства сопровождения.

MusicVerse AI является профессиональной платформой для создания музыки с использованием искусственного интеллекта, интегрированной в экосистему Telegram. Проект охватывает:

- Генерацию музыки через Suno AI v5 (chirp-crow) с поддержкой 174+ мета-тегов
- Управление 277+ музыкальными стилями и жанрами
- Мультиязычную поддержку (75+ языков)
- Профессиональные инструменты для музыкантов и создателей контента
- Глубокую интеграцию с Telegram Mini Apps и Bot API

---

## I. Основные принципы разработки

### Принцип 1: Качество кода и тестирование (Test-First Development)

**Правило**: Качество кода является приоритетом номер один. Тесты MUST быть написаны до или одновременно с реализацией для всех новых функций и критических исправлений.

**Обязательные требования**:
- **TDD (Test-Driven Development)**: Для P1 user stories и изменений в foundation-слое следовать циклу: написание теста → проверка падения теста → реализация → проверка прохождения теста
- **Тестовое покрытие**: Минимум 80% покрытия для нового кода (unit + integration тесты)
- **Типы тестов**:
  - Unit тесты: для утилит, хуков, чистых функций
  - Integration тесты: для компонентов с API, базой данных
  - Contract тесты: для всех API эндпоинтов
  - E2E тесты: для критических user journeys (опционально, но рекомендуется)
- **Инструменты тестирования**:
  - Jest + React Testing Library для фронтенда
  - @testing-library/jest-dom для DOM assertions
  - Покрытие проверяется через `npm test:coverage`
- **CI Gates**: PR не может быть замержен без прохождения всех тестов в CI

**Обоснование**: Тестирование предотвращает регрессии, ускоряет рефакторинг, служит документацией и повышает уверенность в изменениях.

---

### Принцип 2: Безопасность и защита данных (Security & Privacy by Design)

**Правило**: Безопасность и приватность пользователей встраиваются в архитектуру на всех уровнях. Минимизация сбора и хранения данных является обязательной.

**Обязательные требования**:
- **Секреты**: 
  - НЕ коммитить секреты, API ключи, токены в репозиторий (ни в коде, ни в .env файлах, ни в истории)
  - Использовать `.env.local` для локальной разработки (в .gitignore)
  - Использовать переменные окружения на продакшене (Supabase Secrets, GitHub Secrets)
  - При обнаружении секрета в истории - немедленная ротация и очистка истории
- **Аутентификация и авторизация**:
  - Telegram OAuth через валидацию `initData` с HMAC-SHA256
  - Row Level Security (RLS) в PostgreSQL для всех таблиц с пользовательскими данными
  - Никогда не доверять данным от клиента - валидация на сервере обязательна
- **Минимизация данных**:
  - Собирать только необходимые данные (Telegram ID, имя пользователя, настройки)
  - Не хранить чувствительные данные без необходимости
  - Документировать retention policy для каждого типа данных
  - Предоставлять возможность удаления аккаунта и всех данных
- **Защита API**:
  - Все внешние API (Suno, OpenAI) вызываются ТОЛЬКО через Edge Functions
  - Клиент никогда не получает прямой доступ к API ключам
  - Rate limiting и защита от DDoS
- **Защита от уязвимостей**:
  - Санитизация пользовательского ввода (XSS, SQL injection)
  - CORS политики для API
  - Content Security Policy (CSP) для фронтенда
  - Регулярный аудит зависимостей (npm audit, Snyk, Dependabot)

**Обоснование**: Безопасность и приватность - это не опции, а обязательство перед пользователями. Нарушения безопасности могут уничтожить доверие и репутацию проекта.

---

### Принцип 3: Наблюдаемость и мониторинг (Observability & Metrics)

**Правило**: Каждая функция MUST быть наблюдаемой: логи, метрики, трейсы. Проблемы должны обнаруживаться и диагностироваться быстро.

**Обязательные требования**:
- **Логирование**:
  - Структурированные логи в JSON формате
  - Уровни: ERROR, WARN, INFO, DEBUG
  - Обязательный контекст: timestamp, userId, requestId, action
  - Логировать все критические операции: генерация музыки, платежи, ошибки API
  - НЕ логировать чувствительные данные (токены, полные initData)
- **Метрики производительности**:
  - Время загрузки приложения (target: <2s на 4G)
  - Время ответа API (target: p95 <500ms)
  - Время генерации музыки (tracking Suno API latency)
  - Core Web Vitals (LCP, FID, CLS)
- **Мониторинг ошибок**:
  - Интеграция с Sentry для отслеживания ошибок в production
  - Категоризация ошибок: client-side, server-side, third-party API
  - Алерты на критические ошибки (rate >1%, downtime >5min)
- **Аналитика пользовательского поведения**:
  - Google Analytics или аналоги для отслеживания user flows
  - Conversion funnels: регистрация → первая генерация → retention
  - A/B тестирование для новых функций
- **Дашборды**:
  - Realtime метрики в Supabase Dashboard
  - Grafana/Prometheus для детальной аналитики (опционально)

**Обоснование**: "You can't improve what you can't measure". Наблюдаемость позволяет быстро диагностировать проблемы, оптимизировать производительность и принимать data-driven решения.

---

### Принцип 4: Инкрементальная доставка и семантическое версионирование

**Правило**: Изменения доставляются маленькими, безопасными, обратимыми инкрементами. Версионирование следует SemVer для предсказуемости.

**Обязательные требования**:
- **Семантическое версионирование (SemVer)**:
  - Формат: MAJOR.MINOR.PATCH (например, 2.1.3)
  - MAJOR: breaking changes (несовместимые изменения API, удаление функций)
  - MINOR: новые функции с обратной совместимостью
  - PATCH: багфиксы и мелкие улучшения
- **Размер изменений**:
  - Предпочитать маленькие PR (<500 строк кода)
  - Один PR = одна логическая задача/функция
  - Feature flags для больших функций (постепенный rollout)
- **Миграции**:
  - Breaking changes MUST включать migration guide
  - Database migrations тестируются на копии продакшен данных
  - Возможность rollback для всех deployment
- **Changelog**:
  - CHANGELOG.md обновляется при каждом MINOR/MAJOR релизе
  - Использовать Conventional Commits для автоматической генерации
  - Формат: Keep a Changelog (https://keepachangelog.com/)
- **Релизный процесс**:
  - Git tags для каждого релиза (v2.1.3)
  - GitHub Releases с описанием изменений
  - Автоматический deployment через CI/CD

**Обоснование**: Маленькие инкременты снижают риск, ускоряют feedback loop, упрощают code review и позволяют быстро откатывать проблемные изменения.

---

### Принцип 5: Архитектурная простота и явные контракты

**Правило**: Код и архитектура должны быть максимально простыми и понятными. Интерфейсы между компонентами должны быть явными и задокументированными.

**Обязательные требования**:
- **KISS (Keep It Simple, Stupid)**:
  - Выбирать самое простое решение, которое работает
  - Избегать преждевременной оптимизации и over-engineering
  - Рефакторить сложный код в понятный
- **Separation of Concerns**:
  - Четкое разделение: UI (components) / Business Logic (services) / Data (API)
  - Компоненты должны быть маленькими и переиспользуемыми
  - Один файл = одна ответственность
- **Явные контракты**:
  - TypeScript типы для всех функций, компонентов, API
  - JSON Schema или OpenAPI для API эндпоинтов
  - Документация контрактов в `/specs/[feature]/contracts/`
  - Примеры запросов/ответов для каждого API
- **DRY (Don't Repeat Yourself)**:
  - Переиспользовать код через functions, hooks, components
  - Создавать utility functions для повторяющейся логики
  - Но: предпочитать дублирование неправильной абстракции
- **Именование**:
  - Компоненты: PascalCase (e.g., MusicPlayer, GenerateForm)
  - Функции/переменные: camelCase (e.g., generateMusic, userData)
  - Константы: UPPER_SNAKE_CASE (e.g., MAX_PROMPT_LENGTH)
  - Типы/интерфейсы: PascalCase (e.g., Track, UserProfile)
  - Файлы: соответствуют названию экспорта (MusicPlayer.tsx, useTelegram.ts)

**Обоснование**: Простой код легче читать, поддерживать, тестировать и расширять. Явные контракты снижают когнитивную нагрузку и ускоряют интеграцию.

---

### Принцип 6: Производительность и оптимизация

**Правило**: Производительность является ключевым качественным атрибутом. Приложение MUST быть быстрым и отзывчивым на всех устройствах.

**Обязательные требования**:
- **Frontend Performance**:
  - Time to Interactive (TTI) < 3s на 4G сети
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - Cumulative Layout Shift (CLS) < 0.1
  - Frame rate: 60 FPS для анимаций и взаимодействий
- **Bundle Size**:
  - Общий размер бандла < 500 KB gzipped
  - Code splitting для маршрутов (lazy loading страниц)
  - Tree-shaking для неиспользуемого кода
  - Минификация и оптимизация в production build
- **Оптимизация изображений**:
  - WebP формат для всех изображений (с fallback на PNG/JPEG)
  - Responsive images (srcset) для разных экранов
  - Lazy loading для изображений вне viewport
  - Image compression (TinyPNG, ImageOptim)
- **Оптимизация запросов**:
  - React Query для кэширования API данных
  - Debouncing для поисковых запросов
  - Pagination для больших списков
  - Prefetching для предсказуемых навигаций
- **Database Performance**:
  - Индексы на часто запрашиваемых полях
  - Оптимизация SQL запросов (избегать N+1)
  - Connection pooling в Supabase
- **Мониторинг производительности**:
  - Lighthouse CI в GitHub Actions
  - Real User Monitoring (RUM) через GA или аналоги
  - Регулярные performance audits

**Обоснование**: Производительность напрямую влияет на UX, conversion rate и retention. Медленное приложение теряет пользователей.

---

### Принцип 7: Мультиязычность и доступность (i18n & a11y)

**Правило**: Приложение MUST быть доступным для всех пользователей, независимо от языка, региона или ограничений по здоровью.

**Обязательные требования**:
- **Интернационализация (i18n)**:
  - Поддержка 75+ языков для голосовой генерации
  - Интерфейс на русском и английском (минимум)
  - Использование i18n библиотеки (react-i18next или аналог)
  - Все UI тексты через translation keys (не хардкодить)
  - Определение языка через Telegram user settings
- **Локализация (l10n)**:
  - Правильное отображение дат и времени (date-fns)
  - Форматирование чисел и валют
  - Поддержка RTL языков (арабский, иврит) где применимо
- **Доступность (a11y)**:
  - Семантический HTML (правильные теги: header, nav, main, article)
  - ARIA атрибуты для интерактивных элементов
  - Keyboard navigation (все элементы доступны с клавиатуры)
  - Контрастность цветов (WCAG AA: 4.5:1 для текста)
  - Alt текст для всех изображений
  - Понятные label для форм
  - Focus indicators для интерактивных элементов
- **Тестирование доступности**:
  - @storybook/addon-a11y для проверки компонентов
  - axe DevTools для ручного аудита
  - Keyboard-only тестирование

**Обоснование**: Доступность и мультиязычность расширяют аудиторию, соответствуют законодательным требованиям и являются признаком качественного продукта.

---

### Принцип 8: Telegram-first подход и нативный UX

**Правило**: Приложение MUST ощущаться как нативная часть Telegram, а не как внешний веб-сайт. Интеграция с Telegram должна быть глубокой и seamless.

**Обязательные требования**:
- **Telegram Mini App SDK**:
  - Использование @twa-dev/sdk для всех Telegram-специфичных функций
  - Адаптация под Telegram темы (telegram.colorScheme, telegram.themeParams)
  - Haptic feedback для важных действий (кнопки, генерация)
  - Интеграция с Telegram Cloud Storage для синхронизации настроек
- **Telegram Bot интеграция**:
  - Deep linking: t.me/bot?start=track_123
  - Inline режим для быстрого поиска треков
  - Уведомления через бота о завершении генерации
  - Sharing в Telegram Stories и чаты
- **UX паттерны**:
  - Single Page Application (без перезагрузок страницы)
  - Мгновенная обратная связь (skeleton screens, optimistic updates)
  - Bottom navigation для основных разделов
  - Swipe gestures где уместно
  - Modal dialogs вместо alert()
- **Оффлайн support**:
  - Service Worker для кэширования статических ресурсов
  - Offline-first для просмотра библиотеки
  - Queue для синхронизации при восстановлении соединения
- **Адаптивность**:
  - Mobile-first дизайн (основная платформа - мобильные устройства)
  - Поддержка iOS, Android и Web версий Telegram
  - Responsive layout для разных размеров экранов
  - Touch-friendly элементы (минимум 44x44px для кнопок)

**Обоснование**: Telegram - это наша основная платформа. Пользователи должны ощущать приложение как естественную часть Telegram, а не как внешнее приложение.

---

## II. Технический стек и стандарты

### Языки и фреймворки

**Frontend**:
- **React 19.2.0+** - UI библиотека (функциональные компоненты, hooks)
- **TypeScript 5.9+** - строгая типизация (strict mode enabled)
- **Vite 5.0+** - build tool и dev server
- **React Router 7.9+** - маршрутизация

**Styling**:
- **Tailwind CSS 3.4+** - utility-first CSS framework
- **shadcn/ui** - доступные UI компоненты
- **Framer Motion 12+** - анимации (опционально)

**State Management**:
- **Zustand 5.0+** - глобальное состояние (настройки, пользователь)
- **TanStack Query 5.90+** - серверное состояние (кэширование, фетчинг)
- **React Hook Form 7.67+** - управление формами
- **Zod 4.1+** - валидация схем

**Backend**:
- **Lovable Cloud** - Backend-as-a-Service (основан на Supabase)
  - PostgreSQL 16 - реляционная база данных
  - Edge Functions - serverless функции на Deno (TypeScript)
  - Realtime - WebSocket subscriptions
  - Storage - файловое хранилище
  - Auth - аутентификация (Telegram OAuth)
  - **ВАЖНО**: При общении с пользователями использовать "Lovable Cloud", в коде - Supabase SDK
- **Telegram Bot API** - bot интеграция
- **Suno AI v5 API** - генерация музыки

### Соглашения о базе данных

**Важные имена таблиц и полей**:
- `track_versions.is_primary` - флаг основной версии (НЕ `is_master`)
- `track_change_log` - таблица истории изменений (НЕ `track_changelog`)
- `audio_analysis` - таблица AI-анализа (НЕ `track_analysis`)

**Автогенерируемые файлы (НЕ редактировать вручную)**:
- `src/integrations/supabase/client.ts` - клиент Supabase
- `src/integrations/supabase/types.ts` - типы из схемы БД
- `supabase/config.toml` - конфигурация проекта
- `.env` - переменные окружения

### Инструменты разработки

**Code Quality**:
- **Prettier 3.x** - форматирование кода
  - Config: `.prettierrc.json`
  - Settings: semi: true, trailingComma: "all", singleQuote: false, printWidth: 120, tabWidth: 2
  - Pre-commit hook через husky (рекомендуется)
- **ESLint 8.x** - линтер
  - Config: `eslint.config.js`
  - Plugins: typescript-eslint, react-hooks, react-refresh
  - Rules: рекомендуемые + проектные (no-unused-vars временно off)
- **TypeScript** - type checking
  - Strict mode включен
  - Path aliases: @/* → ./src/*

**Testing**:
- **Jest 30.x** - test runner
- **@testing-library/react 16.x** - React component testing
- **@testing-library/jest-dom 6.x** - DOM assertions
- **ts-jest** - TypeScript support для Jest
- **Coverage**: минимум 80% для нового кода

**Documentation**:
- **Storybook 8.1** - component development и документация
- **Addons**: a11y, docs, essentials, interactions
- **Markdown** - документация (README, specs, ADRs)

### Package Manager и Scripts

**Package Manager**: npm (npm-lock.json в репозитории)

**Доступные команды**:
```bash
npm run dev              # Development server (Vite)
npm run build            # Production build
npm run build:dev        # Development build (with source maps)
npm run preview          # Preview production build
npm test                 # Run tests
npm test:coverage        # Run tests with coverage report
npm run lint             # Lint code (ESLint)
npm run format           # Format code (Prettier)
npm run storybook        # Start Storybook dev server
npm run build-storybook  # Build Storybook static site
```

---

## III. Стандарты качества кода

### Форматирование кода

**Обязательные требования**:
- Весь код MUST быть отформатирован через Prettier перед коммитом
- Запуск: `npm run format` перед каждым commit
- Настройки в `.prettierrc.json` (не изменять без обсуждения)
- Исключения в `.prettierignore`: dist/, coverage/, node_modules/, .storybook/

### Линтинг

**Обязательные требования**:
- Все файлы MUST проходить ESLint без ошибок
- Запуск: `npm run lint` перед каждым PR
- Warnings допустимы, но должны быть обоснованы
- Отключение правил через `// eslint-disable-next-line` только с комментарием-обоснованием

### TypeScript

**Обязательные требования**:
- Strict mode включен (никогда не отключать)
- Все функции, компоненты, хуки имеют явные типы возвращаемых значений
- `any` использовать ТОЛЬКО с обоснованием в комментарии (лучше `unknown`)
- Предпочитать `interface` для объектов, `type` для unions/intersections
- Использовать generics для переиспользуемых типов
- Типы в отдельных файлах: `src/types/*.ts`

### Структура компонентов

**Обязательные требования**:
```typescript
// 1. Импорты (сгруппированы)
import { useState } from "react";           // External
import { Button } from "@/components/ui";   // Internal absolute
import { formatDate } from "./utils";       // Relative

// 2. Типы и интерфейсы
interface MusicPlayerProps {
  trackId: string;
  autoPlay?: boolean;
}

// 3. Компонент
export const MusicPlayer = ({ trackId, autoPlay = false }: MusicPlayerProps) => {
  // 3.1. Hooks (useState, useEffect, custom hooks)
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 3.2. Event handlers
  const handlePlay = () => setIsPlaying(true);
  
  // 3.3. Render
  return (
    <div>
      <Button onClick={handlePlay}>Play</Button>
    </div>
  );
};

// 4. Sub-components (если нужны и локальны)
// 5. Константы и utils (если локальны)
```

### Комментарии и документация

**Правила комментирования**:
- Комментарии на русском или английском (предпочтительно английский для кода)
- `// TODO:` - для функционала, который нужно добавить (CI создаст issue автоматически)
- `// FIXME:` - для проблем, которые нужно исправить (CI создаст issue автоматически)
- `// NOTE:` или `// ВАЖНО:` - для важных пояснений
- JSDoc комментарии для exported функций/типов (опционально, но рекомендуется)
- Объяснять "почему", а не "что" (код сам показывает "что")

---

## IV. Git Workflow и CI/CD

### Branching Strategy (GitFlow)

**Основные ветки**:
- `main` - production-ready код (только stable releases)
- `develop` - integration branch (latest development)

**Feature branches**:
- Формат: `feature/<id>-<short-description>` (e.g., `feature/123-audio-player`)
- Создаются от `develop`
- Мержатся обратно в `develop` через PR

**Bugfix branches**:
- Формат: `bugfix/<id>-<short-description>` (e.g., `bugfix/456-playback-fix`)
- Создаются от `develop`
- Мержатся обратно в `develop` через PR

**Hotfix branches**:
- Формат: `hotfix/<id>-<short-description>` (e.g., `hotfix/789-critical-security`)
- Создаются от `main`
- Мержатся в `main` И `develop`

### Commit Messages (Conventional Commits)

**Формат**: `<type>(<scope>): <subject>`

**Types**:
- `feat` - новая функциональность
- `fix` - исправление бага
- `docs` - изменения в документации
- `style` - форматирование, пропущенные точки с запятой (без изменения логики)
- `refactor` - рефакторинг без изменения функциональности
- `test` - добавление или исправление тестов
- `chore` - изменения в сборке, зависимостях, конфигурации
- `ci` - изменения в CI/CD
- `perf` - улучшение производительности

**Примеры**:
```
feat(auth): add Telegram OAuth integration
fix(player): resolve audio playback stuttering on iOS
docs(readme): update installation instructions
refactor(api): simplify music generation service
test(components): add tests for MusicPlayer component
chore(deps): update React to 19.2.0
```

### Pull Request Process

**Обязательные требования для PR**:
1. **Заголовок**: соответствует Conventional Commits
2. **Описание**: 
   - Что было сделано
   - Ссылка на задачу/issue (если есть)
   - Screenshots для UI изменений
3. **Checklist**: (скопировать из template)
   - [ ] Код отформатирован (npm run format)
   - [ ] Линтинг пройден (npm run lint)
   - [ ] Типы корректны (TypeScript без ошибок)
   - [ ] Тесты добавлены/обновлены (если применимо)
   - [ ] Тесты пройдены (npm test)
   - [ ] Документация обновлена (если применимо)
   - [ ] Соответствует принципам Конституции
4. **CI status**: все checks зелёные
5. **Code Review**: минимум 1 approve от владельца области

**Для критических изменений** (security, database schema, breaking API):
- Минимум 2 approving reviews
- Обязательный review от maintainer
- Deployment plan с rollback strategy

### CI/CD Pipeline

**Автоматические проверки на каждый PR**:
1. **Formatting check**: Prettier
2. **Linting**: ESLint
3. **Type checking**: TypeScript tsc
4. **Tests**: Jest (unit + integration)
5. **Build**: Vite build успешен
6. **Security**: npm audit (fail на HIGH/CRITICAL)
7. **TODO/FIXME scanner**: создание issues (не блокирует merge)

**Автоматический deployment**:
- `develop` → Staging environment (Vercel/Netlify preview)
- `main` → Production (после manual approval)

---

## V. Database и Backend Standards

### Database Design

**Обязательные требования**:
- **Row Level Security (RLS)**: включен для ВСЕХ таблиц с пользовательскими данными
- **Индексы**: на все внешние ключи и часто запрашиваемые поля
- **Миграции**: все изменения схемы через Supabase migrations (версионированы в Git)
- **Naming conventions**:
  - Таблицы: snake_case, множественное число (e.g., `music_tracks`, `user_profiles`)
  - Колонки: snake_case (e.g., `created_at`, `track_title`)
  - Первичные ключи: `id` (UUID)
  - Внешние ключи: `<table>_id` (e.g., `user_id`, `project_id`)

**Обязательные поля**:
- `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

### Edge Functions

**Обязательные требования**:
- **TypeScript**: все функции на TypeScript
- **Deno runtime**: использовать Deno-совместимые импорты
- **Error handling**: всегда возвращать структурированные ошибки
- **Валидация**: валидировать все входные данные
- **Rate limiting**: для всех публичных эндпоинтов
- **CORS**: правильная настройка для Mini App origin

**Структура ответа**:
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: { code: "ERROR_CODE", message: "User-friendly message" } }
```

---

## VI. Performance Benchmarks

**Обязательные метрики**:

| Метрика | Target | Critical Threshold |
|---------|--------|--------------------|
| Time to Interactive (TTI) | < 3s | < 5s |
| First Contentful Paint (FCP) | < 1.5s | < 3s |
| Largest Contentful Paint (LCP) | < 2.5s | < 4s |
| Cumulative Layout Shift (CLS) | < 0.1 | < 0.25 |
| API Response Time (p95) | < 500ms | < 1s |
| Bundle Size (gzipped) | < 500KB | < 1MB |
| Database Query Time (p95) | < 100ms | < 500ms |

**Мониторинг**: Lighthouse CI на каждый PR, падение PR если метрики хуже Critical Threshold

---

## VII. Governance и Compliance

### Конституция как руководящий документ

- Конституция имеет высший приоритет над любыми другими документами и практиками
- Все участники проекта обязаны знать и следовать Конституции
- При конфликте между Конституцией и другими документами - Конституция всегда главнее

### Процедура внесения изменений в Конституцию

1. **Инициирование**: любой участник может предложить изменение через PR
2. **Метка**: PR должен иметь label `constitution:amend`
3. **Описание**: обязательно включить:
   - Что меняется и почему
   - Обоснование (какую проблему решает)
   - Impact analysis (как затронет существующий код)
   - Migration plan (если требуется)
4. **Обсуждение**: минимум 7 дней для обсуждения (кроме экстренных hotfix)
5. **Approvals**: минимум 2 approving reviews от MAINTAINERS
6. **Version bump**: согласно SemVer (MAJOR/MINOR/PATCH)
7. **Sync Impact Report**: обязательно в начале файла
8. **Merge**: после всех approvals и обновления Sync Impact Report

### Версионирование Конституции

**SemVer правила**:
- **MAJOR (X.0.0)**: удаление принципа, несовместимые изменения в governance
- **MINOR (x.Y.0)**: добавление нового принципа, расширение разделов
- **PATCH (x.y.Z)**: опечатки, уточнения, форматирование

### Compliance проверки

**Обязательные проверки на каждый PR**:
- [ ] Код соответствует принципам Конституции (checklist в PR description)
- [ ] Тесты добавлены (если требуется по Принципу 1)
- [ ] Безопасность проверена (если затрагивает аутентификацию, данные, API)
- [ ] Документация обновлена (если изменены контракты, API)
- [ ] Performance не ухудшена (Lighthouse CI)

**Audit права**:
- MAINTAINERS могут инициировать полный Constitution compliance audit
- При обнаружении нарушений - обязательное исправление перед merge
- Систематические нарушения - основание для обсуждения с командой

### Ответственность

**Все участники**:
- Знать и следовать Конституции
- Проверять compliance перед созданием PR
- Уважать принципы в code review

**Maintainers**:
- Обеспечивать соблюдение Конституции
- Review изменений в Конституцию
- Инициировать audits при необходимости
- Обновлять Конституцию при изменении требований проекта

---

## VIII. Дополнительные материалы

### Связанные документы

- [README.md](../README.md) - обзор проекта
- [CONTRIBUTING.md](../CONTRIBUTING.md) - руководство для контрибьюторов
- [DEVELOPMENT_WORKFLOW.md](../DEVELOPMENT_WORKFLOW.md) - детальный workflow
- [PROJECT_SPECIFICATION.md](../docs/PROJECT_SPECIFICATION.md) - технические требования
- [DATABASE.md](../docs/DATABASE.md) - схема базы данных
- [TELEGRAM_BOT_ARCHITECTURE.md](../docs/TELEGRAM_BOT_ARCHITECTURE.md) - архитектура бота
- [ROADMAP.md](../ROADMAP.md) - планы развития

### Templates

- [plan-template.md](../.specify/templates/plan-template.md) - шаблон плана реализации
- [spec-template.md](../.specify/templates/spec-template.md) - шаблон спецификации фичи
- [tasks-template.md](../.specify/templates/tasks-template.md) - шаблон задач

---

## Метаданные

**Version**: 2.0.0  
**Ratified**: 2025-12-01  
**Last Amended**: 2025-12-02  
**Next Review**: 2026-03-02 (quarterly review recommended)

---

**Подпись**: Настоящая Конституция принята командой MusicVerse AI и вступает в силу с момента её размещения в основной ветке репозитория.
