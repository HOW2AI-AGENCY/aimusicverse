# 🎨 Sprint 030: Unified Studio Mobile Integration

**Дата начала:** 20 января 2026  
**Длительность:** 2 недели (10 рабочих дней)  
**Приоритет:** HIGH  
**Тема:** Унификация студийного интерфейса с фокусом на мобильный UX

---

## 🎯 Цели спринта

### Основная цель
**ТРЕБОВАНИЕ: Интерфейс студии в одном окне (Single Window Studio Interface)**

Объединить две параллельные студии (UnifiedStudioContent и StudioShell) в **единое окно** с мобильно-оптимизированным интерфейсом, улучшенной навигацией и полной функциональностью.

**Критические требования:**
- ✅ Все функции студии доступны в одном окне без переключения между экранами
- ✅ Единый компонент для desktop и mobile (адаптивный дизайн)
- ✅ Табы для переключения между функциями внутри одного окна
- ✅ Нет дублирования кода между UnifiedStudioContent и StudioShell

### Ключевые результаты (KPI)
- ✅ **Один интерфейс студии (Single Window)** - все функции в одном окне
- ✅ Сокращение дублирования кода на 40% (UnifiedStudioContent + StudioShell → UnifiedStudioMobile)
- ✅ Улучшение UX на мобильных на 35%
- ✅ Поддержка всех функций в обоих режимах (track/project)
- ✅ Touch-оптимизированные контролы 100%
- ✅ Единая кодовая база без параллельных реализаций

---

## ⭐ КРИТИЧЕСКОЕ ТРЕБОВАНИЕ: Интерфейс Студии в Одном Окне

### Текущая Проблема
На данный момент существуют **ДВА параллельных интерфейса студии:**
1. `UnifiedStudioContent.tsx` (~800 строк)
2. `StudioShell.tsx` (~900 строк)

**Проблемы:**
- 40% дублирования кода
- Разная логика в двух местах
- Сложность поддержки
- Запутывает пользователей
- Разный UX на разных страницах

### Требуемое Решение
**ОДИН компонент, ОДНО окно, ВСЕ функции:**

```
UnifiedStudioMobile (новый)
├── Единая кодовая база
├── Адаптивный дизайн (desktop + mobile)
├── Табы для функций (внутри одного окна):
│   ├── Player - воспроизведение
│   ├── Sections - замена секций
│   ├── Vocals - добавление вокала
│   ├── Stems - разделение на стемы
│   ├── MIDI - транскрипция
│   ├── Mixer - эффекты и микширование
│   └── Actions - дополнительные действия
└── Никаких navigation между экранами

❌ УДАЛИТЬ:
- UnifiedStudioContent.tsx
- StudioShell.tsx
```

### Преимущества Единого Окна
1. ✅ Пользователь видит все возможности сразу
2. ✅ Быстрое переключение между функциями (табы)
3. ✅ Нет потери контекста при переходах
4. ✅ Меньше кода = меньше багов
5. ✅ Единая точка для обновлений и фиксов

---

## 📋 Задачи спринта

### 🏗️ Блок 1: Unified Studio Architecture (4 дня)

#### Задача 1.1: Создание UnifiedStudioMobile компонента ⭐ КРИТИЧЕСКАЯ
**Приоритет:** P0  
**Сложность:** L (2 дня)  
**Требование:** **Интерфейс студии в одном окне**

**Файлы:**
- `src/components/studio/unified/UnifiedStudioMobile.tsx` (создать)
- `src/hooks/useUnifiedStudio.ts` (создать)
- `src/components/studio/unified/UnifiedStudioContent.tsx` (заменить/объединить)
- `src/components/studio/unified/StudioShell.tsx` (заменить/объединить)

**Действия:**
- [ ] Создать **единый** главный компонент `UnifiedStudioMobile`:
  ```typescript
  interface UnifiedStudioMobileProps {
    mode: 'track' | 'project';
    trackId?: string;
    projectId?: string;
  }
  ```
- [ ] **Реализовать единое окно с табами** (все функции в одном интерфейсе):
  - **Player Tab:** Воспроизведение и базовые контролы
  - **Sections Tab:** Замена секций трека
  - **Vocals Tab:** Добавление/удаление вокала
  - **Stems Tab:** Разделение и микширование
  - **MIDI Tab:** Транскрипция и экспорт
  - **Mixer Tab:** Эффекты и обработка
  - **Actions Tab:** Дополнительные действия
- [ ] Динамическая загрузка табов (lazy loading)
- [ ] Состояние сохраняется при переключении табов
- [ ] Telegram safe area support

**Acceptance Criteria:**
- ✅ **Один компонент для всего:** UnifiedStudioMobile заменяет оба старых
- ✅ **Одно окно:** Все функции доступны через табы без navigation
- ✅ Desktop и mobile используют один и тот же компонент (responsive)
- ✅ State сохраняется при переключении табов
- ✅ Старые компоненты (UnifiedStudioContent, StudioShell) удалены
- ✅ Все импорты в проекте обновлены
- ✅ Нет breaking changes для пользователей

---

#### Задача 1.2: Унификация store и state management
**Приоритет:** P0  
**Сложность:** M (1 день)  
**Файлы:**
- `src/stores/useUnifiedStudioStore.ts` (обновить)
- `src/hooks/useStudioState.ts` (создать)

**Действия:**
- [ ] Объединить логику из двух студий в один store:
  - Управление треками (добавление, удаление, редактирование)
  - Воспроизведение (play, pause, seek, volume)
  - История изменений (undo/redo)
  - Pending задачи (генерация, транскрипция)
  - Версионирование (A/B switching)
- [ ] Создать универсальный hook `useStudioState`:
  - Автоматическое определение режима (track/project)
  - Селективная подписка на изменения
  - Мемоизация селекторов
  - TypeScript строгая типизация
- [ ] Оптимизация ре-рендеров:
  - Разбить store на модули
  - Использовать shallow equality
  - Implement selector memoization

**Acceptance Criteria:**
- Store работает для обоих режимов
- Нет лишних ре-рендеров
- История работает корректно
- TypeScript типы строгие

---

#### Задача 1.3: Миграция существующих компонентов ⭐ КРИТИЧЕСКАЯ
**Приоритет:** P0  
**Сложность:** M (1 день)  
**Требование:** **Удалить дублирование, оставить один интерфейс**

**Файлы:**
- `src/components/studio/unified/UnifiedStudioContent.tsx` (объединить в UnifiedStudioMobile)
- `src/components/studio/unified/StudioShell.tsx` (объединить в UnifiedStudioMobile)
- `src/pages/StudioPage.tsx` (обновить импорты)
- `src/pages/ProjectStudio.tsx` (обновить импорты)

**Действия:**
- [ ] **Объединить логику из UnifiedStudioContent и StudioShell:**
  - Взять лучшее из обоих компонентов
  - Создать единую state machine
  - Удалить дублирующийся код (~40%)
  
- [ ] **Desktop и mobile используют один компонент:**
  - Адаптивный layout (не разные компоненты)
  - Медиа-запросы для изменения UI
  - Сохранение state при resize
  
- [ ] **Обновить все роуты:**
  - `/studio/:trackId` → UnifiedStudioMobile (mode='track')
  - `/project-studio/:projectId` → UnifiedStudioMobile (mode='project')
  
- [ ] **Удалить старые компоненты:**
  - Deprecate UnifiedStudioContent.tsx
  - Deprecate StudioShell.tsx
  - Обновить все импорты в проекте

**Acceptance Criteria:**
- Desktop версия работает без изменений
- Mobile версия использует новый компонент
- Переключение между режимами плавное
- Состояние сохраняется

---

### 📱 Блок 2: Mobile Tabs Implementation (4 дня)

#### Задача 2.1: Player Tab - мобильный плеер ✅ UPDATED
**Приоритет:** P0  
**Сложность:** M (1 день)  
**Файлы:**
- `src/components/studio/unified/MobilePlayerContent.tsx` ✅ (обновлен)

**Выполнено:**
- [x] Touch controls увеличены до 56×56px minimum
- [x] Haptic feedback интегрирован на все кнопки
- [x] Play/Pause/Skip/Volume с haptic
- [x] Share button с haptic

**Существует:**
- [x] Waveform с возможностью seek (touch drag)
- [x] Volume slider оптимизирован для touch
- [x] Play/Pause с анимацией
- [x] Информация о треке отображается

**Acceptance Criteria:**
- ✅ Все контролы touch-friendly (56px minimum)
- ✅ Waveform работает плавно
- ✅ Haptic feedback на всех действиях

---

#### Задача 2.2: Sections Tab - замена секций
**Приоритет:** P0  
**Сложность:** M (1 день)  
**Файлы:**
- `src/components/studio/unified/mobile/MobileSectionsTab.tsx` (обновить)

**Действия:**
- [ ] Визуализация секций:
  - Timeline с разметкой секций
  - Swipe для навигации между секциями
  - Tap для выбора секции
  - Long-press для контекстного меню
- [ ] Замена секций:
  - Form для ввода нового текста
  - Продолжение от выбранной секции
  - Preview перед применением
  - A/B comparison slider
- [ ] Управление секциями:
  - Add section
  - Delete section
  - Reorder sections (drag-drop)
  - Copy/Paste section

**Acceptance Criteria:**
- Timeline интерактивный и плавный
- Замена секций работает корректно
- A/B comparison удобен на мобильных
- Drag-drop работает с touch

---

#### Задача 2.3: Stems Tab - микширование ✅ UPDATED
**Приоритет:** P1  
**Сложность:** M (1 день)  
**Файлы:**
- `src/components/studio/unified/MobileMixerContent.tsx` ✅ (обновлен)

**Выполнено:**
- [x] Touch controls увеличены до 44×44px minimum для Mute/Solo
- [x] Haptic feedback интегрирован на кнопки
- [x] Compact cards для каждого стема
- [x] Volume slider (vertical orientation)
- [x] Solo/Mute buttons с haptic

**Существует:**
- [x] Master volume control
- [x] Horizontal scroll для каналов

**Acceptance Criteria:**
- ✅ Стемы отображаются компактно
- ✅ Sliders работают плавно с touch
- ✅ Solo/Mute мгновенно с haptic

---

#### Задача 2.4: Actions Tab - дополнительные функции
**Приоритет:** P1  
**Сложность:** S (4 часа)  
**Файлы:**
- `src/components/studio/unified/mobile/MobileActionsTab.tsx` (обновить)

**Действия:**
- [ ] Быстрые действия:
  - Share (Telegram, Stories, link)
  - Download (MP3, WAV, FLAC)
  - Add to playlist
  - Set as ringtone (если поддерживается)
- [ ] Расширенные функции:
  - Extend track
  - Create remix
  - Generate variations
  - Export to DAW
- [ ] Метаданные:
  - Edit title, artist
  - Add tags
  - Set genre
  - Change visibility (public/private)

**Acceptance Criteria:**
- Все действия доступны и работают
- Share работает с Telegram API
- Download форматы корректные
- Метаданные сохраняются

---

### ⚡ Блок 3: UX & Performance (2 дня)

#### Задача 3.1: Gesture Navigation ✅ DONE
**Приоритет:** P1  
**Сложность:** M (1 день)  
**Файлы:**
- `src/hooks/useSwipeNavigation.ts` ✅ (создан)
- `src/components/studio/unified/MobileStudioLayout.tsx` ✅ (обновлен)

**Выполнено:**
- [x] Создан `useSwipeNavigation` hook:
  - Swipe влево/вправо для переключения табов
  - Haptic feedback на все жесты
  - Configurable threshold и maxTime
- [x] Интеграция жестов:
  - Tab navigation с swipe
  - Haptic feedback синхронизирован

**Acceptance Criteria:**
- ✅ Swipe navigation работает плавно
- ✅ Жесты не конфликтуют друг с другом
- ✅ Haptic feedback синхронизирован

---

#### Задача 3.2: Performance Optimization ✅ PARTIALLY DONE
**Приоритет:** P0  
**Сложность:** M (1 день)  
**Файлы:**
- `src/hooks/useStudioPerformance.ts` ✅ (создан)

**Выполнено:**
- [x] Создан `useStudioPerformance` hook:
  - Render time tracking
  - Memory usage monitoring
  - Average render time calculation
- [x] Создан `useThrottledCallback` utility
- [x] Создан `useCustomDeferredValue` utility

**TODO:**
- [ ] React.memo для всех компонентов (частично)
- [ ] Виртуализация списков (react-virtuoso)
- [ ] Audio buffer pooling (существует в bufferPool.ts)
- [ ] Waveform caching (существует в waveformCache.ts)

**Acceptance Criteria:**
- ✅ Performance metrics доступны
- ⏳ 60 FPS на всех экранах (тестировать)
- ⏳ Memory usage < 150MB (мониторится)
- ⏳ Tab switching < 100ms (улучшено)

---

## 📊 Метрики успеха

### Code Quality
| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Дублирование кода | 40% | 24% | -40% |
| Lines of code | 4500 | 3200 | -29% |
| Component count | 35 | 22 | -37% |
| Store complexity | High | Medium | ✓ |

### Performance
| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Studio load time | 2.5s | 1.8s | -28% |
| Tab switching | 200ms | 80ms | -60% |
| Audio playback lag | 100ms | 30ms | -70% |
| Memory usage | 180MB | 140MB | -22% |

### UX
| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| User satisfaction | 3.8/5 | 4.5/5 | +18% |
| Task completion | 70% | 85% | +21% |
| Time to complete | 3min | 2min | -33% |
| Error rate | 12% | 5% | -58% |

---

## 🧪 Тестирование

### Unit Tests
- [ ] Store actions и reducers
- [ ] Hooks логика
- [ ] Utility functions

### Integration Tests
- [ ] Tab navigation
- [ ] Audio playback в разных режимах
- [ ] State persistence
- [ ] Gesture handling

### E2E Tests
- [ ] Complete workflow (track mode)
- [ ] Complete workflow (project mode)
- [ ] Cross-device sync
- [ ] Error scenarios

### Manual Testing
- [ ] iOS Safari (всех поддерживаемых версий)
- [ ] Android Chrome
- [ ] Telegram Desktop
- [ ] Edge cases

---

## 🚀 Deployment Plan

### Week 1 (Дни 1-5)
- **День 1-2:** Architecture и store
- **День 3-4:** Player и Sections tabs
- **День 5:** Code review

### Week 2 (Дни 6-10)
- **День 6-7:** Stems и Actions tabs
- **День 8:** Gestures и performance
- **День 9:** Testing
- **День 10:** Deploy

### Rollout Strategy
1. **Feature Flag:** Новый интерфейс за флагом
2. **Beta:** 20% пользователей с флагом
3. **Feedback:** Сбор отзывов неделю
4. **Full Release:** 100% если метрики ОК

---

## 📝 Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Сложность рефакторинга | Средняя | Высокое | Поэтапный подход, тесты |
| Performance issues | Средняя | Высокое | Мониторинг, оптимизация |
| User confusion | Низкая | Среднее | Onboarding, tooltips |
| Audio glitches | Средняя | Высокое | Extensive testing, fallbacks |

---

## 👥 Команда

- **Frontend Lead:** 1 dev
- **Audio Engineer:** 0.5 FTE
- **Mobile Developer:** 1 dev
- **QA Engineer:** 1 tester

---

## 📚 Связанные документы

- [UNIFIED_STUDIO_ANALYSIS_AND_PLAN.md](../UNIFIED_STUDIO_ANALYSIS_AND_PLAN.md)
- [Mobile Optimization Roadmap](../docs/mobile/OPTIMIZATION_ROADMAP_2026.md)
- [Audio Architecture](../docs/AUDIO_ARCHITECTURE_DIAGRAM.md)

---

**Создан:** 2026-01-04  
**Обновлён:** 2026-01-04 (Session 7 - Planning)  
**Автор:** GitHub Copilot  
**Статус:** 🟢 In Progress (Phase 1-2: 45%, Phase 3: Planning)

---

## 📊 Прогресс выполнения

### Phase 1: Core Mobile UX (Jan 4, 2026) ✅
- [x] `useSwipeNavigation` hook создан
- [x] `useStudioPerformance` hook создан
- [x] Swipe navigation интегрирован в MobileStudioLayout
- [x] Touch targets увеличены до 56px в MobilePlayerContent
- [x] Touch targets увеличены до 44px в MobileMixerContent (Mute/Solo)
- [x] Haptic feedback интегрирован в studio buttons

### Phase 2: Admin & Notifications (Jan 4, 2026 - Session 6) ✅
- [x] Centralized Notification System (`src/lib/notifications.ts`)
  - notify.success/error/warning/info functions
  - Deduplication с dedupeKey и dedupeTimeout
- [x] Миграция toast → notify (15+ компонентов)
  - useCredits, useGuestAccess, NotificationContext
  - useTelegramIntegration, ShareSheet, GenerateSheet
  - Settings, useNotificationSettings
- [x] Admin Panel Enhancements
  - GenerationStatsPanel с агрегированной статистикой
  - Новый таб "Generation Stats" в AdminDashboard
- [x] User Settings Improvements
  - UserStatsSection с персональной статистикой
  - Новый таб "Statistics" в Settings
- [x] Mobile Layout Optimization
  - EnhancedAnalyticsPanel компактные карточки
  - GenerationStatsPanel адаптивные гриды
  - UserStatsSection responsive дизайн

### Phase 3: Mobile Tabs (In Progress - 50%)
- [x] Player Tab с haptic и touch controls
- [x] Stems Tab с compact cards
- [ ] Sections Tab - замена секций (Next Priority)
- [ ] Actions Tab - дополнительные функции (Next Priority)

### Phase 4: Architecture & State (Planned - Week 2)
- [ ] UnifiedStudioMobile компонент
- [ ] useUnifiedStudio hook
- [ ] Store унификация
- [ ] Component migration

### Phase 5: Testing & Finalization (Planned - Week 2)
- [ ] E2E tests
- [ ] Performance validation (60 FPS target)
- [ ] Documentation
- [ ] Production deployment

### Next Actions (Week of Jan 4-10, 2026)
1. **Priority 1**: Complete Sections Tab implementation
2. **Priority 2**: Implement Actions Tab
3. **Priority 3**: Start UnifiedStudioMobile component architecture
4. **Priority 4**: Begin store unification planning

