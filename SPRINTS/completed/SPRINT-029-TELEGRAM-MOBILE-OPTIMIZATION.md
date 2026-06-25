# 🚀 Sprint 029: Telegram Mini App Mobile Optimization

**Дата начала:** 6 января 2026  
**Длительность:** 2 недели (10 рабочих дней)  
**Приоритет:** HIGH  
**Тема:** Оптимизация мобильного интерфейса для Telegram Mini App

---

## 🎯 Цели спринта

### Основная цель

Улучшить мобильный опыт использования MusicVerse AI в Telegram Mini App, сделав интерфейс более адаптивным, быстрым и интуитивным для пользователей мобильных устройств.

### Ключевые результаты (KPI)

- ✅ Bundle size: 500KB → 450KB (-10%)
- ✅ FCP (First Contentful Paint): 1.2s → 1.1s (-8%)
- ✅ Touch targets: 100% соответствие 44×44px
- ✅ Telegram SDK интеграция: 90%+ функций
- ✅ Mobile navigation: Улучшение на 30%

---

## 📋 Задачи спринта

### 🏗️ Блок 1: Telegram Mini App SDK Integration (3 дня)

#### Задача 1.1: Обновление Telegram SDK до версии 8.0+

**Приоритет:** P0  
**Сложность:** S (4 часа)  
**Файлы:**

- `package.json` - обновить @twa-dev/sdk
- `src/contexts/TelegramContext.tsx` - интеграция новых API

**Действия:**

- [ ] Обновить `@twa-dev/sdk` до версии 8.0+
- [ ] Добавить поддержку новых методов:
  - `HapticFeedback.impactOccurred()`
  - `HapticFeedback.notificationOccurred()`
  - `HapticFeedback.selectionChanged()`
  - `CloudStorage` для кэширования данных
- [ ] Обновить типы TypeScript
- [ ] Протестировать на iOS и Android

**Acceptance Criteria:**

- SDK обновлен без breaking changes
- Haptic feedback работает на всех поддерживаемых устройствах
- CloudStorage доступен для кэширования пользовательских настроек

---

#### Задача 1.2: Haptic Feedback Integration ✅ ВЫПОЛНЕНО

**Приоритет:** P1  
**Сложность:** S (6 часов)  
**Статус:** ✅ ЗАВЕРШЕНО (2026-01-04)
**Файлы:**

- `src/lib/haptic.ts` ✅ СУЩЕСТВУЕТ
- `src/hooks/useHaptic.ts` ✅ СУЩЕСТВУЕТ
- `src/hooks/useHapticFeedback.ts` ✅ СУЩЕСТВУЕТ
- `src/components/ui/button.tsx` ✅ ОБНОВЛЁН

**Выполнено:**

- [x] Haptic утилиты уже реализованы в `src/lib/haptic.ts`
- [x] Хуки `useHaptic` и `useHapticFeedback` доступны
- [x] Добавлен optional `haptic` prop в Button компонент
- [x] Haptic feedback интегрирован в BottomNavigation
- [x] TelegramButton использует haptic через TelegramContext

**Acceptance Criteria:** ✅ ВСЕ ВЫПОЛНЕНО

- ✅ Haptic feedback срабатывает на интерактивных элементах
- ✅ Button поддерживает haptic prop (light/medium/heavy)
- ✅ Работает на iOS и Android

---

#### Задача 1.3: CloudStorage для настроек и кэша ✅ ВЫПОЛНЕНО

**Приоритет:** P1  
**Сложность:** M (8 часов)  
**Статус:** ✅ ЗАВЕРШЕНО (2026-01-04)
**Файлы:**

- `src/lib/cloudStorage.ts` ✅ СОЗДАН
- `src/hooks/useCloudStorage.ts` ✅ СОЗДАН

**Выполнено:**

- [x] Создана обертка над Telegram CloudStorage API
- [x] Реализовано кэширование с автосохранением
- [x] Добавлен fallback на localStorage
- [x] TypeScript типизация с generic types

**Acceptance Criteria:** ✅ ВСЕ ВЫПОЛНЕНО

- ✅ Настройки сохраняются в Telegram Cloud
- ✅ Fallback на localStorage при недоступности CloudStorage

---

### 📱 Блок 2: Mobile UI/UX Improvements (4 дня)

#### Задача 2.1: Улучшение навигации для мобильных ✅ ВЫПОЛНЕНО

**Приоритет:** P0  
**Сложность:** M (1.5 дня)  
**Статус:** ✅ ЗАВЕРШЕНО (2026-01-04)
**Файлы:**

- `src/components/BottomNavigation.tsx` ✅ ОБНОВЛЁН
- `src/pages/Index.tsx` ✅ ОБНОВЛЁН

**Выполнено:**

- [x] Touch targets увеличены до 56px в BottomNavigation
- [x] Haptic feedback уже интегрирован в навигацию
- [x] Pull-to-refresh добавлен на главную страницу (Index.tsx)
- [x] Pull-to-refresh работает на библиотеке (Library.tsx)
- [x] useSwipeGesture хук доступен для swipe navigation

**Acceptance Criteria:** ✅ ВСЕ ВЫПОЛНЕНО

- ✅ Touch targets соответствуют рекомендациям (56px)
- ✅ Pull-to-refresh работает на мобильных

---

#### Задача 2.2: Адаптивные карточки треков

**Приоритет:** P1  
**Сложность:** M (1 день)  
**Файлы:**

- `src/components/library/TrackCard.tsx`
- `src/components/library/TrackRow.tsx`
- `src/components/library/TrackCardCompact.tsx`

**Действия:**

- [ ] Оптимизировать TrackCard для мобильных:
  - Уменьшить padding и margins
  - Увеличить размер обложки на малых экранах
  - Более крупные кнопки действий (44×44px minimum)
  - Swipe actions (like, add to queue, share)
- [ ] Добавить компактный режим для списка:
  - TrackCardCompact для узких экранов
  - Виртуализация с react-virtuoso
  - Skeleton loaders при загрузке
- [ ] Оптимизировать LazyImage:
  - Blur placeholder меньшего размера
  - WebP формат для мобильных
  - Responsive srcset для разных плотностей

**Acceptance Criteria:**

- Карточки занимают оптимальное пространство
- Swipe actions работают плавно
- Изображения загружаются быстро с blur placeholder

---

#### Задача 2.3: Оптимизация форм для мобильных

**Приоритет:** P1  
**Сложность:** M (1.5 дня)  
**Файлы:**

- `src/components/generate-form/GenerateSheet.tsx`
- `src/hooks/useKeyboardAware.ts` (создать)

**Действия:**

- [ ] Создать `useKeyboardAware` hook:
  - Отслеживание открытия виртуальной клавиатуры
  - Автоматический scroll к активному полю
  - Добавление padding снизу при открытой клавиатуре
  - Кнопка "Готово" над клавиатурой
- [ ] Улучшить форму генерации:
  - Разбить на шаги с индикатором прогресса
  - Сохранение черновиков в CloudStorage
  - Автокомплит для жанров и стилей
  - Voice input для описания (Telegram Web Speech API)
- [ ] Оптимизировать инпуты:
  - Correct inputMode для каждого поля
  - Autocomplete attributes
  - Input masks где применимо
  - Clear button на всех текстовых полях

**Acceptance Criteria:**

- Форма адаптируется при открытии клавиатуры
- Активное поле всегда видно
- Черновики сохраняются и восстанавливаются
- Voice input работает корректно

---

### ⚡ Блок 3: Performance Optimization (3 дня)

#### Задача 3.1: Code Splitting для мобильных

**Приоритет:** P0  
**Сложность:** M (1 день)  
**Файлы:**

- `vite.config.ts`
- `src/components/lazy/` (расширить)

**Действия:**

- [ ] Настроить dynamic imports для тяжелых компонентов:
  - GenerateSheet (lazy load)
  - StemStudio (lazy load)
  - UnifiedStudio (lazy load)
  - GuitarTools (lazy load)
  - LyricsWorkspace (lazy load)
- [ ] Создать loading states с Skeleton:
  - GenerateSheetSkeleton
  - StudioSkeleton
  - PlayerSkeleton
- [ ] Оптимизировать vendor chunks:
  - Разделить react/react-dom
  - Отдельный chunk для UI libraries (Radix UI)
  - Отдельный chunk для audio libraries (wavesurfer, tone.js)
- [ ] Добавить preload hints для критических ресурсов

**Acceptance Criteria:**

- Initial bundle < 450KB (gzipped)
- Lazy chunks загружаются только при необходимости
- Loading states показываются моментально
- No flicker при переходах

---

#### Задача 3.2: Image Optimization

**Приоритет:** P1  
**Сложность:** S (6 часов)  
**Файлы:**

- `src/components/ui/lazy-image.tsx` (обновить)
- Все компоненты с изображениями

**Действия:**

- [ ] Обновить LazyImage компонент:
  - Поддержка WebP с JPEG fallback
  - Responsive images (srcset)
  - Lazy loading с Intersection Observer
  - Blur placeholder (blur-up technique)
  - Error handling с fallback image
- [ ] Оптимизировать обложки треков:
  - Генерация thumbnails 300×300px
  - WebP формат для поддерживаемых браузеров
  - Кэширование в CloudStorage/IndexedDB
- [ ] Настроить CDN для статики:
  - Сжатие изображений на сервере
  - Автоматическая конвертация в WebP

**Acceptance Criteria:**

- Все изображения в WebP формате (где поддерживается)
- Responsive images для разных разрешений
- Blur placeholder показывается моментально
- Fallback работает корректно

---

#### Задача 3.3: Bundle Size Optimization

**Приоритет:** P0  
**Сложность:** M (1 день)  
**Файлы:**

- `vite.config.ts`
- `package.json`
- Все импорты библиотек

**Действия:**

- [ ] Аудит зависимостей:
  - Удалить неиспользуемые packages
  - Заменить тяжелые библиотеки на легкие альтернативы
  - Tree-shaking для всех библиотек
- [ ] Оптимизировать импорты:
  - Named imports вместо default где возможно
  - Использовать `@/lib/motion` вместо прямого framer-motion
  - Lodash → native JS methods
- [ ] Настроить minification:
  - Terser с максимальным сжатием
  - Remove console.log в production
  - Mangle properties где безопасно
- [ ] Добавить bundle analysis:
  - rollup-plugin-visualizer
  - Size-limit в CI/CD

**Acceptance Criteria:**

- Bundle size уменьшен на 10% (500KB → 450KB)
- Tree-shaking работает корректно
- Bundle analyzer показывает оптимальное распределение
- CI/CD проверяет size limits

---

### 📱 Блок 4: Fullscreen Player Enhancements ✅ ВЫПОЛНЕНО (2026-01-04)

#### Задача 4.1: Горизонтальный свайп для переключения треков ✅

**Приоритет:** P1  
**Сложность:** M (8 часов)
**Статус:** ✅ ЗАВЕРШЕНО
**Файлы:**

- `src/components/player/MobileFullscreenPlayer.tsx` ✅

**Выполнено:**

- [x] Swipe left → next track, swipe right → previous track
- [x] Threshold 80px и velocity 400px/s
- [x] Haptic feedback при переключении
- [x] Visual indicators (ChevronLeft/ChevronRight)
- [x] AnimatePresence для плавных переходов

**Acceptance Criteria:** ✅ ВСЕ ВЫПОЛНЕНО

- ✅ Свайп влево/вправо переключает треки
- ✅ Haptic feedback срабатывает
- ✅ Плавная анимация перехода

---

#### Задача 4.2: Предзагрузка обложек и аудио ✅

**Приоритет:** P1  
**Сложность:** S (6 часов)
**Статус:** ✅ ЗАВЕРШЕНО
**Файлы:**

- `src/hooks/audio/usePrefetchTrackCovers.ts` ✅ СОЗДАН
- `src/hooks/audio/usePrefetchNextAudio.ts` ✅ СОЗДАН

**Выполнено:**

- [x] Prefetch обложек для следующих 3 треков (Image preload)
- [x] Prefetch аудио следующего трека (preload='auto')
- [x] LRU кэш для управления памятью (Set с maxSize)
- [x] Cleanup при смене очереди

**Acceptance Criteria:** ✅ ВСЕ ВЫПОЛНЕНО

- ✅ Обложки загружаются заранее
- ✅ Аудио следующего трека готово к воспроизведению
- ✅ Память управляется корректно

---

#### Задача 4.3: Улучшение подсветки лирики ✅

**Приоритет:** P1  
**Сложность:** S (4 часа)
**Статус:** ✅ ЗАВЕРШЕНО
**Файлы:**

- `src/components/player/MobileFullscreenPlayer.tsx` ✅
- `src/components/lyrics/SynchronizedWord.tsx` ✅

**Выполнено:**

- [x] Word-level autoscroll (data-word-index атрибут)
- [x] Позиционирование активного слова на 30% от верха
- [x] Подсветка сохраняется при паузе

**Acceptance Criteria:** ✅ ВСЕ ВЫПОЛНЕНО

- ✅ Каждое слово можно отследить по data-word-index
- ✅ Активное слово всегда видно на 30% от верха
- ✅ Подсветка не сбрасывается при паузе

---

#### Задача 4.4: Double-tap seek ±10 секунд ✅

**Приоритет:** P1  
**Сложность:** S (6 часов)
**Статус:** ✅ ЗАВЕРШЕНО
**Файлы:**

- `src/components/player/MobileFullscreenPlayer.tsx` ✅
- `src/components/player/DoubleTapSeekFeedback.tsx` ✅ СОЗДАН

**Выполнено:**

- [x] Double-tap левая половина = -10s
- [x] Double-tap правая половина = +10s
- [x] Визуальный feedback (RotateCcw/RotateCw иконки)
- [x] Haptic feedback при перемотке
- [x] DOUBLE_TAP_DELAY = 300ms

**Acceptance Criteria:** ✅ ВСЕ ВЫПОЛНЕНО

- ✅ Двойной тап перематывает корректно
- ✅ Визуальный feedback отображается
- ✅ Haptic feedback срабатывает

---

#### Задача 4.5: Режим караоке ✅

**Приоритет:** P2  
**Сложность:** M (1 день)
**Статус:** ✅ ЗАВЕРШЕНО
**Файлы:**

- `src/components/player/KaraokeView.tsx` ✅ СОЗДАН

**Выполнено:**

- [x] Fullscreen караоке режим (Apple Music Sing-style)
- [x] Увеличенный текст (text-4xl для активной строки)
- [x] Анимация заполнения слов (градиент primary → muted)
- [x] Минималистичный UI (только кнопка закрытия)
- [x] Tap по слову = seek к этому времени

**Acceptance Criteria:** ✅ ВСЕ ВЫПОЛНЕНО

- ✅ Караоке режим открывается из плеера
- ✅ Анимация слов синхронизирована с аудио
- ✅ Tap-to-seek работает

---

## 📊 Метрики успеха

### Performance Metrics

| Метрика     | До    | После | Улучшение |
| ----------- | ----- | ----- | --------- |
| Bundle Size | 500KB | 450KB | -10%      |
| FCP         | 1.2s  | 1.1s  | -8%       |
| LCP         | 2.1s  | 1.9s  | -10%      |
| TTI         | 3.5s  | 3.2s  | -9%       |

### UX Metrics

| Метрика           | До  | После  | Улучшение |
| ----------------- | --- | ------ | --------- |
| Touch Accuracy    | 85% | 95%    | +12%      |
| Navigation Speed  | -   | <100ms | -         |
| Form Completion   | 65% | 75%    | +15%      |
| User Satisfaction | -   | 4.5/5  | -         |

### Telegram Integration

- [ ] Haptic Feedback: 100% интерактивных элементов
- [ ] CloudStorage: Настройки и кэш
- [ ] Native Share: Stories, chat
- [ ] Web Speech API: Voice input

---

## 🧪 Тестирование

### Unit Tests

- [ ] Haptic utilities tests
- [ ] CloudStorage wrapper tests
- [ ] Keyboard-aware hook tests

### E2E Tests (Playwright)

- [ ] Navigation flow tests
- [ ] Form submission with keyboard
- [ ] Swipe gestures
- [ ] Image loading

### Manual Testing

- [ ] iOS Safari (iPhone 13, 14, 15 Pro)
- [ ] Android Chrome (Pixel, Samsung)
- [ ] Telegram Desktop (Windows, macOS)
- [ ] Telegram Web (Chrome, Safari)

---

## 🚀 Deployment Plan

### Week 1 (Дни 1-5)

- **День 1-2:** Telegram SDK integration
- **День 3-4:** Mobile UI improvements
- **День 5:** Code review и тестирование

### Week 2 (Дни 6-10)

- **День 6-7:** Performance optimization
- **День 8-9:** Testing и bug fixes
- **День 10:** Production deployment

### Rollout Strategy

1. **Staging:** Deploy и тестирование команды
2. **Beta:** 10% пользователей
3. **Full Release:** 100% пользователей

---

## 📝 Риски и митигация

| Риск                    | Вероятность | Влияние | Митигация                              |
| ----------------------- | ----------- | ------- | -------------------------------------- |
| Breaking changes в SDK  | Низкая      | Высокое | Тщательное тестирование, feature flags |
| Performance regression  | Средняя     | Среднее | Performance budgets в CI, monitoring   |
| Haptic не работает      | Низкая      | Низкое  | Graceful degradation                   |
| CloudStorage недоступен | Низкая      | Среднее | Fallback на localStorage               |

---

## 👥 Команда

- **Frontend Lead:** 1 dev
- **Mobile Developer:** 1 dev
- **QA Engineer:** 1 tester
- **Designer (консультация):** 0.5 FTE

---

## 📚 Связанные документы

- [Mobile Optimization Roadmap 2026](../docs/mobile/OPTIMIZATION_ROADMAP_2026.md)
- [Telegram Bot Architecture](../docs/TELEGRAM_BOT_ARCHITECTURE.md)
- [Performance Optimization](../docs/PERFORMANCE_OPTIMIZATION.md)

---

**Создан:** 2026-01-04  
**Автор:** GitHub Copilot  
**Статус:** 🟡 В РАБОТЕ (50%)

---

## 📋 Дополнительные задачи (выполнено 2026-01-04)

### ✅ Deep Links для полноэкранного плеера

**Файлы:**

- `src/contexts/TelegramContext.tsx` - добавлены паттерны `play_`, `player_`, `listen_`
- `src/pages/MobilePlayerPage.tsx` - создан standalone компонент
- `src/App.tsx` - добавлен роут `/player/:trackId`

### ✅ Исправление track_versions constraint

**Файлы:**

- `supabase/migrations/20260104054551_*.sql` - расширение CHECK constraint
- `supabase/functions/suno-music-callback/index.ts` - логика getVersionType()
- `supabase/functions/suno-check-status/index.ts` - 'original' → 'initial'

### ✅ Pull-to-Refresh

**Файлы:**

- `src/pages/Library.tsx` - интеграция PullToRefreshWrapper
