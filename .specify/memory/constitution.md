<!--
SYNC IMPACT REPORT - Constitution Update

Version Change: 4.0.0 → 5.0.0
Rationale: MAJOR - Complete structural rewrite. Previous constitution
was a flat list of 16 technical principles. New version follows a
holistic governance document structure with mission, values,
governance, technical standards, code of conduct, and amendment
process. All technical principles from v4.0.0 are preserved and
reorganized into §4 Technical Standards subsections.

Structure Changes:
- §1 Преамбула (NEW) — Mission statement
- §2 Ключевые Принципы (NEW) — 5 core values
- §3 Управление и Принятие Решений (NEW) — Governance process
- §4 Технические Стандарты и Процессы (RESTRUCTURED)
  - §4.1 Spec-First Development (NEW — codifies spec-kit workflow)
  - §4.2 Работа с Кодом (REORGANIZED from principles IV, XVI)
  - §4.3 Архитектура (REORGANIZED from principles I-III, VIII, XV)
  - §4.4 State Management (REORGANIZED from principle V)
  - §4.5 Performance (REORGANIZED from principles II, X)
  - §4.6 Тестирование (REORGANIZED from principle XIV)
  - §4.7 Безопасность (REORGANIZED from principle VI)
  - §4.8 Accessibility & UX (REORGANIZED from principle VII)
  - §4.9 Track Versioning (REORGANIZED from Development Standards)
  - §4.10 Common Pitfalls (REORGANIZED from v4 Pitfalls section)
- §5 Кодекс Поведения (NEW)
- §6 Внесение изменений (REORGANIZED from Governance section)

Removed Sections:
- Flat principle numbering (I-XVI) replaced by hierarchical §4.x
- Separate "Development Standards" section merged into §4
- Separate "Governance" section merged into §3 + §6

Templates Requiring Updates:
✅ plan-template.md — Constitution Check references generic
   principles, compatible with new numbering
✅ spec-template.md — User story format unchanged, compatible
✅ tasks-template.md — Task organization unchanged, compatible
⚠ No command templates found in .specify/templates/commands/

Follow-up TODOs:
- None — all sections filled with concrete values
-->

# Конституция Проекта `aimusicverse`

_Версия 5.0.0 | Ратифицирована: 2026-01-05 | Последнее изменение: 2026-06-27_

## 1. Преамбула: Наша Миссия

Мы создаём **MusicVerse AI**, чтобы демократизировать создание
музыки, предоставляя артистам и энтузиастам интуитивно понятные
инструменты на базе ИИ для воплощения их творческих идей — прямо
в Telegram, без барьеров входа.

## 2. Ключевые Принципы

- **Творчество прежде всего (Creator-First):** Наши инструменты
  ДОЛЖНЫ расширять, а не ограничивать творческий потенциал
  пользователя. Каждое UX-решение оценивается через призму
  «помогает ли это автору создать музыку быстрее и лучше».

- **Качество по определению (Quality by Design):** Мы внедряем
  качество на каждом этапе — от спецификации до развёртывания.
  Автоматизация (size-limit, ESLint, Vitest, Playwright), строгая
  типизация (TypeScript strict, Zod) и архитектурные принципы —
  наши союзники.

- **Этика и Ответственность:** Мы ответственно подходим к
  использованию ИИ, обеспечивая прозрачность генерации (Suno AI
  v5), уважение к авторскому праву (блоклист артистов) и защиту
  пользовательских данных (RLS, шифрование).

- **Mobile-First, Telegram-Native:** MusicVerse AI — это Telegram
  Mini App, а не адаптивный веб-сайт. Каждый компонент ДОЛЖЕН
  быть спроектирован для портретного режима на мобильном устройстве
  (375×667px — 430×932px), с тактильной обратной связью и
  интеграцией Telegram SDK.

- **Итеративное Совершенство:** Мы движемся короткими спринтами,
  постоянно улучшая продукт на основе метрик (DAU, success rate,
  failure rate) и обратной связи пользователей. Spec-first подход
  обеспечивает осмысленность каждой итерации.

## 3. Управление и Принятие Решений

- **Владелец проекта:** HOW2AI (GitHub: HOW2AI-AGENCY)
- **Процесс внесения изменений:** Все изменения — от исправления
  ошибок до новых функций — проходят через Pull Request в GitHub.
- **Утверждение PR:** Для слияния ТРЕБУЕТСЯ:
  - Успешное прохождение CI-проверок (`npm run lint`, `npm test`,
    `npm run build`, `npm run size`)
  - TypeScript: 0 ошибок (`tsc --noEmit`)
  - Bundle size < 950 KB
  - Одобрение владельца проекта
- **Архитектурные решения:** Фиксируются в `ADR/` (Architecture
  Decision Records). Текущих ADR: 10+.
- **Спецификации:** Хранятся в `specs/` с полным покрытием
  ключевых фич. Текущих спецификаций: 8.

## 4. Технические Стандарты и Процессы

### 4.1. Процесс Разработки "Spec-First"

1. **Идея:** Новая функциональность начинается с обсуждения в
   Issues или спецификации.
2. **Спецификация:** Перед написанием кода создаётся `spec.md`
   через `/speckit.specify`, описывающий пользовательские истории,
   требования и acceptance criteria.
3. **Планирование:** `/speckit.plan` генерирует план реализации
   с Constitution Check, исследованием и моделью данных.
4. **Задачи:** `/speckit.tasks` декомпозирует план в конкретные
   задачи, организованные по user stories.
5. **Реализация:** Разработка ведётся в feature-ветке.

### 4.2. Работа с Кодом

**Стиль кода:**

- Prettier для автоформатирования, ESLint для статического анализа
- Код ДОЛЖЕН проходить `npm run lint` и `npm run format` без
  ошибок
- TypeScript strict mode — НИКАКИХ `any` типов
- Путь импортов: ВСЕГДА `@/` alias, НИКОГДА относительные пути
  (`../../`)
- className: ВСЕГДА через `cn()` из `@/lib/utils`

**Коммиты:** Conventional Commits (`feat:`, `fix:`, `docs:`,
`test:`, `refactor:`, `chore:`).

**Ветвление:**

- `main` — стабильная, готовая к релизу версия
- Feature-ветки для новых функций
- Отдельные PR для каждого спринта/фазы

**Размер файлов:**

- Компоненты ДОЛЖНЫ быть < 500 строк — разбивать на
  субкомпоненты
- Хуки ДОЛЖНЫ быть < 300 строк — разбивать на составные хуки
- Zustand stores ДОЛЖНЫ быть < 500 строк — разбивать на
  доменные слайсы

**Логирование:**

- НИКОГДА `console.log` — ВСЕГДА `logger` из `@/lib/logger`
- Logger интегрирован с Sentry, персистирует в sessionStorage
- Структурированное логирование с контекстом:
  `logger.info("Op done", { trackId })`

### 4.3. Архитектура

**Layered Data Flow (NON-NEGOTIABLE):**

```
API Layer → Service Layer → Hook Layer → Component Layer
```

- **API Layer** (`src/api/*.api.ts`): Прямые запросы Supabase,
  типобезопасные. Компоненты НИКОГДА не вызывают Supabase напрямую.
- **Service Layer** (`src/services/*.service.ts`): Бизнес-логика,
  трансформация данных. Не зависит от React.
- **Hook Layer** (`src/hooks/*.ts`): TanStack Query интеграция,
  управление React-состоянием. Не рендерит UI.
- **Component Layer** (`src/components/*.tsx`): Только UI
  презентация.
- **Store Layer** (`src/stores/*.ts`): Zustand глобальное
  состояние (17 stores).

**Single Audio Source (NON-NEGOTIABLE):**

- Всё приложение ДОЛЖНО использовать ОДИН `<audio>` элемент
  через `GlobalAudioProvider`
- НИКОГДА не создавать множественные `<audio>` — ВСЕГДА
  `usePlayerStore()` или `useGlobalAudioPlayer()`
- Audio element pooling для iOS Safari (лимит 10 элементов)

**Component Organization:**

- `src/components/ui/` — shadcn/ui базовые + кастомные
- `src/components/[feature]/` — feature-specific
- `src/components/shared/` — cross-feature (UnifiedVersionSelector)
- `src/components/mobile/` — mobile-specific
- `src/components/layout/` — layout компоненты

**Unified Component System:**

- MobileBottomSheet (vaul) на мобильных, Dialog на десктопе
- MobileHeaderBar для стандартизированных заголовков
- UnifiedVersionSelector — ЕДИНСТВЕННЫЙ компонент выбора версии
- LazyImage — для ВСЕХ изображений (blur placeholder + shimmer)
- VirtualizedTrackList — для списков > 50 элементов

**Telegram Mini App Integration:**

- @twa-dev/sdk 8.0 для нативных API
- MainButton для primary actions, BackButton для навигации
- HapticFeedback: light (клики), error, success, medium (свайпы)
- CloudStorage для пользовательских настроек
- Deep links: `t.me/AIMusicVerseBot/app?startapp=PARAM`
- BotContextBanner при навигации из бота

### 4.4. State Management

**Правильный инструмент для правильной задачи:**

| Тип состояния    | Инструмент            | Пример                        |
| ---------------- | --------------------- | ----------------------------- |
| Глобальный UI    | Zustand               | playerStore, studioStore      |
| Серверные данные | TanStack Query        | staleTime: 30s, gcTime: 10min |
| Формы            | React Hook Form + Zod | useGenerateDraft, auto-save   |
| Локальный UI     | useState/useReducer   | открытие модалки              |

- Оптимистичные обновления ОБЯЗАТЕЛЬНЫ для: likes, plays,
  version switches
- Batch-запросы: `usePublicContentOptimized` для homepage
- НИКОГДА Context API для глобального состояния — только Zustand
- НИКОГДА raw fetch/axios — только TanStack Query

### 4.5. Performance Budget (NON-NEGOTIABLE)

**HARD LIMIT:** Bundle size < 950 KB (enforced by size-limit).

- Route-level code splitting: React.lazy() для ВСЕХ страниц
- Framer Motion: ТОЛЬКО через `@/lib/motion` (tree-shaking)
- НИКОГДА полный import framer-motion
- Vendor chunks: vendor-react, vendor-framer, vendor-tone,
  vendor-wavesurfer, vendor-query, vendor-radix, vendor-icons,
  vendor-supabase, vendor-forms, vendor-charts
- Feature chunks: feature-studio, feature-lyrics,
  feature-generation
- Виртуализация: react-virtuoso для списков > 50 элементов
- Анимация: ТОЛЬКО transform, opacity, filter (GPU-accelerated)
- НИКОГДА анимация width, height, top, left, margin, padding
- `npm run size` ДОЛЖЕН проходить перед каждым коммитом

### 4.6. Тестирование

**Unit-тесты (Vitest 4.x):**

- Конфиг: `vitest.config.ts` (jsdom, globals, @/ mapping)
- Setup: `src/__tests__/vitest.setup.ts` — глобальные моки
  (Supabase, Audio, Telegram, matchMedia, ResizeObserver,
  IntersectionObserver, crypto.randomUUID, fetch)
- Тесты: `src/__tests__/**/*.test.{ts,tsx}` и
  `tests/unit/**/*.test.{ts,tsx}`
- Текущее покрытие: 320 тестов, 24 test suites

**Критические пути (MUST test):**

- Player store — playback, queue, shuffle, repeat, volume
- Auth context — provider/consumer, loading states
- Version switcher — fetch, switch, setPrimary, cache
- Generation draft — save, load, expiry, debounce, auto-save
- Generation result — show, close, clear, dedup, session flags

**E2E-тесты (Playwright 1.57):**

- Конфиг: `playwright.config.ts`
- Браузеры: Chrome, Firefox, Safari, Edge + Mobile (Pixel 5,
  iPhone 12)
- Ключевые сценарии: генерация, библиотека, плеер, версии

**CI:** Все тесты запускаются автоматически на каждый push и PR.

### 4.7. Безопасность

- RLS ОБЯЗАТЕЛЕН на всех таблицах с пользовательскими данными
- Публичный контент: `is_public` + `profiles.is_public`
- Секреты ТОЛЬКО в Edge Functions, НИКОГДА в frontend-коде
- Валидация: Zod (клиент) + Edge Functions (сервер)
- HTML-санитизация: DOMPurify для user-generated content
- Telegram initData: валидация через HMAC signature

### 4.8. Accessibility & UX

- Touch targets: 44-56px минимум (iOS HIG / Material Design)
- 8px между соседними интерактивными элементами
- Клавиатурная навигация для всех интерактивных элементов
- ARIA labels для icon-only кнопок и сложных виджетов
- Контраст: WCAG AA (4.5:1 текст, 3:1 UI)
- Анимации ДОЛЖНЫ учитывать prefers-reduced-motion
- Loading: skeleton loaders (НЕ спиннеры)
- Errors: описательные сообщения с retry-действиями

### 4.9. Track Versioning System (A/B)

Каждая генерация создаёт 2 версии (A/B):

- `tracks.active_version_id` (FK → track_versions)
- `track_versions`: `is_primary`, `version_label` ('A'/'B'),
  `clip_index` (0/1)
- Переключение ДОЛЖНО обновлять BOTH `is_primary` AND
  `active_version_id` атомарно
- Все изменения логируются в `track_change_log`

**Post-Generation Flow (NON-NEGOTIABLE):**

- GenerationResultSheet открывается автоматически после генерации
- Обе A/B версии показываются с play/pause
- `expectGenerationResult()` ДОЛЖЕН вызываться перед генерацией
- НИКОГДА redirect в library без показа результата

### 4.10. Common Pitfalls (MUST AVOID)

| #   | Pitfall                            | Rule                            |
| --- | ---------------------------------- | ------------------------------- |
| 1   | Multiple audio elements            | useGlobalAudioPlayer()          |
| 2   | Audio on iOS without pool          | audioElementPool                |
| 3   | Full framer-motion import          | @/lib/motion                    |
| 4   | Bundle > 950KB                     | npm run size                    |
| 5   | No lazy loading                    | React.lazy() для всех pages     |
| 6   | No LazyImage                       | Обязателен для всех изображений |
| 7   | Animate width/height               | transform: scale()              |
| 8   | Large lists without virtualization | react-virtuoso                  |
| 9   | Touch targets < 44px               | 44-56px минимум                 |
| 10  | Dialog on mobile                   | MobileBottomSheet (vaul)        |
| 11  | Duplicate version selectors        | UnifiedVersionSelector          |
| 12  | Components > 500 lines             | Разбивать                       |
| 13  | console.log                        | logger из @/lib/logger          |
| 14  | Relative imports                   | @/ alias                        |
| 15  | Context API for global state       | Zustand                         |
| 16  | Raw fetch/axios                    | TanStack Query                  |
| 17  | Skip Supabase mock in tests        | vitest.setup.ts                 |
| 18  | Jest                               | Vitest 4.x                      |
| 19  | Secrets in frontend                | Edge Functions only             |
| 20  | Skip GenerationResultSheet         | MUST show after generation      |

## 5. Кодекс Поведения (Code of Conduct)

Мы придерживаемся [Contributor Covenant](https://www.contributor-covenant.org/).
Мы стремимся создать свободную от притеснений среду для всех
участников, независимо от личных характеристик. Уважение,
конструктивная критика и поддержка — основа нашего сообщества.

## 6. Внесение изменений в Конституцию

Эта Конституция — живой документ.

**Процесс изменения:**

1. Предложение вносится через Pull Request с тегом
   `[CONSTITUTION]`
2. PR ДОЛЖЕН включать:
   - Версионный бамп (MAJOR для несовместимых изменений, MINOR
     для новых разделов, PATCH для уточнений)
   - Обновлённый Sync Impact Report (HTML-комментарий в начале
     файла)
   - План миграции, если шаблоны требуют обновления
3. Обсуждение и одобрение владельцем проекта
4. Верификация совместимости с шаблонами:
   - `plan-template.md` — Constitution Check
   - `spec-template.md` — требования
   - `tasks-template.md` — организация задач
5. Обновление `CLAUDE.md` при изменении принципов

**Compliance Verification:**

- Все PR ДОЛЖНЫ соответствовать Core Principles
- Performance: `npm run size` (pre-commit)
- Tests: `npm test` (pre-commit)
- Types: `tsc --noEmit`
- Unification: нет дублирующих компонентов

**Текущие метрики проекта (2026-06-27):**

| Метрика           | Значение     |
| ----------------- | ------------ |
| Файлов .ts/.tsx   | 1,756        |
| Компонентов       | 973          |
| Хуков             | 319          |
| Страниц           | 57           |
| Zustand stores    | 17           |
| Edge Functions    | 119          |
| DB Tables         | 113          |
| Unit Tests        | 320 (Vitest) |
| Test Suites       | 24           |
| Bundle Limit      | 950 KB       |
| TypeScript Errors | 0            |
