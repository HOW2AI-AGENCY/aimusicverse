# 📝 Changelog

Все значимые изменения в проекте MusicVerse AI будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и этот проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

## [Unreleased]

### Добавлено - 2026-01-04 (Session 9 - UI Improvements)

- **Compact Generation Form Header**: Более компактный хедер формы генерации
  - Удалён логотип для экономии места
  - Уменьшены размеры: `min-h-[44px]` → `min-h-[36px]`
  - Убраны избыточные отступы
- **Mobile-friendly Hints**: Подсказки работают на touch-устройствах
  - Заменены `Tooltip` на `Popover` в `SectionLabel.tsx`
  - Подсказки открываются по клику на `?` иконку
- **Conditional Toolbar Buttons**: Кнопки Copy/Delete скрыты когда поле пустое
  - `FormFieldToolbar.tsx` — условный рендеринг вместо disabled
- **Compact Lyrics Visual Editor**: Упрощённый редактор лирики
  - Новый компонент `LyricsVisualEditorCompact.tsx`
  - Timeline из badges секций
  - Quick structure templates (Поп, Рок, Баллада)
  - Без drag-drop для простоты
- **Advanced Options Visibility**: Более заметная кнопка продвинутых настроек
  - Dashed border стиль
  - Удалён дублирующий Model Selector
- **ADR-012**: Документация решения по компактному UI

### Добавлено - 2026-01-04 (Sprint 029)

- **Telegram CloudStorage Integration**: Сохранение настроек в облаке Telegram
  - `cloudStorage` API wrapper с localStorage fallback
  - `useCloudStorage` React hook с tab synchronization
  - Type-safe generic interface для любых данных
  - Graceful degradation при недоступности CloudStorage
- **Haptic Feedback System**: Тактильная обратная связь для Telegram Mini App
  - `hapticImpact()` — 5 стилей (light, medium, heavy, rigid, soft)
  - `hapticNotification()` — 3 типа (error, success, warning)
  - `hapticSelectionChanged()` — для смены выбора
  - Интеграция в Button component (optional `haptic` prop)
  - Haptic в BottomNavigation при смене табов
- **Pull-to-Refresh**: Обновление контента жестом
  - `PullToRefreshWrapper` reusable component
  - Интеграция на Library странице
  - Интеграция на Index (homepage)
  - Touch-optimized для мобильных устройств
- **Deep Link Player**: Прямые ссылки на воспроизведение
  - `MobilePlayerPage` standalone component
  - Поддержка префиксов: `play_`, `player_`, `listen_`
  - Auto-playback при загрузке через deep link
  - React Query integration для загрузки данных
  - Telegram safe area awareness
- **Mobile Features**: Улучшения для мобильных устройств
  - Mobile karaoke features
  - Audio prefetching optimization
  - Touch targets увеличены до 56px в навигации
  - useKeyboardAware hook для адаптивных форм

### Исправлено - 2026-01-04

- **Database Fixes**: Исправления схемы и миграций
  - track_versions constraint: добавлены типы vocal_add, instrumental_add, cover
  - suno-music-callback: исправлена логика version_type
  - suno-check-status: изменен 'original' → 'initial'
- **UI Fixes (Session 9)**: Исправления формы генерации
  - Tooltips не работают на мобильных → Popover
  - Copy/Delete всегда видны → условное отображение
  - Громоздкий хедер → компактный дизайн

### Изменено - 2026-01-04

- **Documentation Cleanup**: Упорядочена структура репозитория
  - 12 файлов перемещены в архив docs/archive/2026-01-04-cleanup/
  - Обновлены PROJECT_STATUS.md, SPRINT_STATUS.md, README.md
  - Сокращено количество файлов в root: 42 → 30 (29% reduction)
  - Обновлен ARCHIVE.md с новой структурой
- **Updated Documentation**: Обновлена документация
  - UI_GENERATION_FORM_AUDIT_2025-12-13.md — статус реализации
  - KNOWN_ISSUES.md — новые исправления
  - GENERATION_SYSTEM.md — UI/UX секция
  - KNOWLEDGE_BASE.md — Session 9
  - SPRINT-030-UNIFIED-STUDIO-MOBILE.md — прогресс 55%

---

### Добавлено - 2025-12-26

- **AI Lyrics Agent Tools**: 10+ новых инструментов для работы с текстами
  - `continue` — продолжение текста в выбранном стиле (natural, dramatic, contrast, climax)
  - `structure` — перестроение текста по шаблону (verse-chorus, full-song, hip-hop)
  - `rhythm` — анализ слогов, ударений и ритмических паттернов
  - `style_convert` — конвертация в другой стиль/жанр/артиста
  - `paraphrase` — перефразирование с разными тонами (поэтичный, простой, агрессивный)
  - `hook_generator` — анализ хуков и генерация новых вариантов
  - `vocal_map` — карта вокальной продакшн по секциям
  - `translate` — адаптивный перевод с сохранением ритма и слогов
- **Новые result-компоненты**: HookResultCard, VocalMapResultCard, ParaphraseResultCard, TranslateResultCard
- **Расширен ai-lyrics-assistant edge function**: новые экшены для Phase 2 инструментов

### Добавлено - 2025-12-12

- **Comprehensive Project Audit**: Полный аудит состояния проекта
  - Build health: 100/100 (43.52s, оптимизировано)
  - Code quality: 95/100
  - Sprint progress: 98/100
  - Overall health score: 95/100
  - Документ: `AUDIT_RECENT_UPDATES_2025-12-12.md`
- **Telegram Stars Payment System**: Полная реализация с 210 задачами
  - Админ-панель со списком транзакций и функцией возврата средств
  - Интеграционные и unit-тесты для payment flows
  - Rate limiting и валидация запросов
  - Все edge functions готовы к production deployment
- **Sprint 013 Завершен**: Продвинутые аудио функции (73/75 задач)
  - Горячие клавиши для действий с треками (`useTrackKeyboardShortcuts`)
  - Диалог помощи по горячим клавишам
  - Lighthouse CI для мониторинга производительности
  - Music Lab Hub foundation
  - Верификация оптимизации размера бандлов

### Изменено - 2025-12-12

- Обновлен SPRINT_STATUS.md: 11 завершенных спринтов (44% completion rate)
- Sprint 013 помечен как COMPLETE (97% автоматизированных задач)
- Telegram Stars payment system готова к DEPLOYMENT
- Улучшена `create-stars-invoice` с JSON schema валидацией

### Исправлено - 2025-12-12

- Верифицирована оптимизация сборки (50KB main bundle с brotli)
- Подтверждено разделение кода для всех основных функций
- Настроены performance budgets в Lighthouse CI

### Безопасность - 2025-12-12

- Идентифицированы 2 moderate уязвимости (dev-only, non-blocking)
  - esbuild <=0.24.2 (development server only)
  - vite 0.11.0-6.1.6 (dependency of esbuild)
- Рекомендация: Обновить vite до 7.x в следующем major release

### Планируется

- Трёхрежимный плеер (compact/expanded/fullscreen)
- Система версионирования треков
- Управление очередью воспроизведения
- Swipe gestures с тактильной обратной связью
- Режим AI-ассистента для генерации

---

## [1.0.1] - 2025-12-09

### 🐛 Исправлено

#### Stem Studio Audio Synchronization

- **Исправлена синхронизация аудио** — использование среднего `currentTime` от всех аудио элементов
- **Drift detection** — автоматическая коррекция при расхождении >0.1s
- **Оптимизированная синхронизация** — коррекция только самого отставшего элемента (избегание audio glitches)
- **Улучшенный seek** — пауза во время перемотки для плавности
- **Async engine initialization** — правильная инициализация эффектов с `ENGINE_READY_DELAY`
- **Error handling** — обработка ошибок воспроизведения и автоматический reload
- **Memory leak fix** — очистка event listeners при unmount

#### Section Detection Accuracy

- **Levenshtein distance** — точный fuzzy matching вместо length ratio (70% threshold)
- **Multi-language support** — улучшенная поддержка русского и английского
- **Regex fix** — удален global flag для предотвращения state persistence
- **Boundary validation** — проверка на пересечение секций
- **Error handling** — try-catch wrapper с graceful fallback

#### Synchronized Lyrics Display

- **Точная синхронизация слов** — timing tolerance ±0.05s
- **Умный auto-scroll** — распознавание user scroll (5px threshold)
- **Resume delay** — 5s пауза перед возобновлением auto-scroll
- **Conditional scrolling** — scroll только если >50px от target
- **Line grouping** — улучшенная группировка строк (0.8s gap, 10-12 words)
- **Newline handling** — различение single vs double newlines
- **Empty word filtering** — пропуск пустых слов

### ⚡ Производительность

- **Single audio correction** — коррекция только одного элемента вместо всех
- **Conditional auto-scroll** — scroll только когда необходимо
- **Optimized drift detection** — проверка дрифта в requestAnimationFrame

### ♻️ Refactoring

- **Named constants** — все magic numbers заменены на именованные константы
  - `DRIFT_THRESHOLD = 0.1s`
  - `ENGINE_READY_DELAY = 100ms`
  - `FUZZY_MATCH_THRESHOLD = 0.7`
  - `USER_SCROLL_THRESHOLD = 5px`
  - `AUTO_SCROLL_RESUME_DELAY = 5000ms`
  - `AUTO_SCROLL_DISTANCE_THRESHOLD = 50px`
  - `WORD_TIMING_TOLERANCE = 0.05s`
  - `LINE_START_TOLERANCE = 0.1s`
  - `LINE_END_TOLERANCE = 0.3s`

### 📚 Документация

- **BUGFIX_SUMMARY.md** — подробная техническая документация исправлений
- **README.md** — обновлены описания функций Stem Studio и плеера
- **Code comments** — добавлены комментарии для сложной логики

### 🎯 Затронутые файлы

- `src/components/stem-studio/StemStudioContent.tsx` (104 lines)
- `src/hooks/useSectionDetection.ts` (47 lines)
- `src/components/lyrics/UnifiedLyricsView.tsx` (52 lines)
- `src/components/stem-studio/StudioLyricsPanel.tsx` (36 lines)

**Total: 239 lines изменено в 4 файлах**

---

## [1.0.0] - 2025-12-02

### 🎉 Первый стабильный релиз!

### ✨ Добавлено

#### Документация

- 📚 Создан CODE_OF_CONDUCT.md - кодекс поведения участников
- 🔐 Создан SECURITY.md - политика безопасности
- 📝 Создан CHANGELOG.md - история изменений
- 🎨 Обновлен README.md с улучшенным дизайном и навигацией
- 🖼️ Интегрирован баннер проекта в документацию
- 🏷️ Добавлены статусные бэджи и метрики качества

#### Основной функционал

- 🎵 Интеграция с Suno AI v5 (chirp-crow)
- 🎼 Поддержка 174+ мета-тегов для профессионального контроля
- 🎸 277+ музыкальных стилей и жанров
- 🌍 Поддержка 75+ языков для вокальной генерации
- 📱 Telegram Mini App с нативным UX
- 🤖 Telegram Bot для управления через команды
- 📊 Библиотека треков с поиском и фильтрацией
- 🎛️ Профессиональный аудио-плеер

#### Архитектура

- ⚛️ React 19 с TypeScript 5
- 🚀 Vite для быстрой сборки
- 💾 Supabase для backend и базы данных
- 🎨 Tailwind CSS + shadcn/ui компоненты
- 🔄 TanStack Query для управления данными
- 🧪 Jest + Testing Library для тестирования

#### Безопасность

- 🔐 Telegram OAuth аутентификация
- 🛡️ Row Level Security в Supabase
- 🔑 Безопасное хранение API ключей
- ✅ Input validation на клиенте и сервере
- 📝 Автоматический аудит зависимостей

### 🔧 Изменено

- Улучшена типизация TypeScript (удалены все `any` типы из компонентов)
- Оптимизированы React компоненты для производительности
- Обновлена структура документации для лучшей навигации

### 🐛 Исправлено

- Исправлено 25 ESLint ошибок в компонентах
- Устранены нарушения React Hooks правил
- Исправлена проблема с белым экраном при запуске
- Улучшена обработка ошибок аутентификации

### 🔒 Безопасность

- Обновлены зависимости с уязвимостями
- Внедрен CodeQL для статического анализа
- Добавлена политика безопасности

---

## [0.9.0] - 2025-11-30 - Sprint 7 Completion

### ✨ Добавлено

- 🎨 Улучшение качества frontend кода
- 📊 Метрики качества кода в README
- 🔍 Полный аудит компонентов
- 📝 Спецификация Mobile-First UI/UX

### 🔧 Изменено

- Исправлены все lint ошибки в компонентах (25 ошибок)
- Улучшена типизация всех React компонентов
- Обновлена документация спринтов

### ✅ Тестирование

- Build стабилизирован (7.52s)
- Все тесты проходят успешно
- Покрытие кода ~60%

---

## [0.8.0] - 2025-11-24 - Sprint 6 Completion

### 📋 Планирование

- Детальный аудит UI/UX интерфейса
- Создана спецификация с 6 пользовательскими сценариями
- План реализации на 5 недель (105 задач)
- Исследование mobile-first паттернов

### 📊 Документация

- UI_UX_AUDIT.md - полный аудит интерфейса
- UI_UX_IMPLEMENTATION_PLAN.md - план реализации
- Обновлены документы спринтов

---

## [0.7.0] - 2025-11-20 - Sprint 5 Completion

### 🔒 Production Hardening

- Улучшение обработки ошибок
- Оптимизация производительности
- Улучшение безопасности аутентификации
- Расширение тестового покрытия

### 📚 Документация

- ARCHITECTURE.md - архитектура системы
- DATABASE.md - структура базы данных
- TELEGRAM_BOT_ARCHITECTURE.md - архитектура бота

---

## [0.6.0] - 2025-11-15 - Sprint 4 Completion

### ⚡ Оптимизация

- Оптимизация ререндеров в ProtectedLayout
- Улучшение производительности компонентов
- Оптимизация bundle size
- Улучшение responsive дизайна

---

## [0.5.0] - 2025-11-10 - Sprint 3 Completion

### 🤖 Автоматизация

- Автоматическое создание Issues из TODO/FIXME комментариев
- CI/CD pipeline с GitHub Actions
- Автоматическое тестирование на PR
- Dependabot для обновления зависимостей

---

## [0.4.0] - 2025-11-05 - Sprint 2 Completion

### 🔍 Аудит и улучшения

- Полный аудит проекта
- Исправление ESLint ошибок
- Улучшение типизации TypeScript
- Синхронизация документации

### 📝 Документация

- PROJECT_AUDIT.md - отчет о аудите
- Обновлен SPRINT_MANAGEMENT.md
- Создан BACKLOG.md с задачами

---

## [0.3.0] - 2025-11-01 - Sprint 1 Completion

### 🚀 Первоначальная настройка

- Базовая структура проекта
- Настройка Vite + React
- Интеграция Supabase
- Базовая аутентификация через Telegram
- Настройка ESLint и Prettier
- Базовые компоненты UI

### 📱 Telegram Integration

- Telegram Mini App SDK
- Telegram Bot базовые команды
- Deep linking поддержка

---

## [0.2.0] - 2025-10-25

### ✨ Прототип

- Базовый генератор музыки
- Простая библиотека треков
- Прототип аудио-плеера

---

## [0.1.0] - 2025-10-15

### 🎬 Инициализация проекта

- Создание репозитория
- Базовая конфигурация
- README с описанием проекта
- License и первичная документация

---

## Типы изменений

- `Added` ✨ - новый функционал
- `Changed` 🔧 - изменения в существующем функционале
- `Deprecated` ⚠️ - функционал, который скоро будет удален
- `Removed` 🗑️ - удаленный функционал
- `Fixed` 🐛 - исправления багов
- `Security` 🔒 - изменения, связанные с безопасностью

---

<div align="center">

📝 **История изменений обновляется с каждым релизом**

[🏠 Вернуться на главную](README.md) • [🎯 Дорожная карта](ROADMAP.md) • [📋 Спринты](SPRINT_MANAGEMENT.md)

</div>
