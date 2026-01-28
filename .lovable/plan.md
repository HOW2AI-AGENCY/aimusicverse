
# План дальнейших работ — MusicVerse AI

## Текущий статус проекта

**Готовность**: 99% — платформа готова к продакшену
**Все известные проблемы**: Решены (28 из 28)
**Активные спецификации**:
- Spec 031: Mobile Studio V2 (42 требования)
- Spec 032: Professional UI (22 требования)

---

## Фаза 1: Оптимизация производительности (1-2 недели)

### 1.1 Уменьшение размера бандла
**Приоритет**: P1 (Высокий)
**Текущее состояние**: vendor-other = 184 KB → Цель: <150 KB

**Задачи**:
- Lazy loading для `opensheetmusicdisplay` (экономия ~20 KB)
- Dynamic import для `wavesurfer.js` (экономия ~25 KB)
- Tree-shaking аудит для `lucide-react` (экономия ~5 KB)
- Разделение чанков по маршрутам

### 1.2 Service Worker
**Приоритет**: P2 (Средний)

**Задачи**:
- Реализация offline-first кэширования
- Предзагрузка критических ресурсов
- Стратегия stale-while-revalidate для API

### 1.3 Оптимизация изображений
**Приоритет**: P2 (Средний)

**Задачи**:
- Конвертация в WebP формат
- Responsive images с srcset
- Lazy loading для обложек треков

---

## Фаза 2: Spec 032 — Professional UI (2-3 недели)

### 2.1 Типографика и визуальная иерархия
**Приоритет**: P1 (Высокий)

**Задачи**:
- Унификация шрифтовых размеров (H1-H4, body, caption)
- Оптимизация line-height (1.5-1.7 для body)
- Консистентная шкала отступов (4/8/12/16/24/32 px)

### 2.2 Цветовая схема и градиенты
**Приоритет**: P1 (Высокий)

**Задачи**:
- Ревизия цветовой палитры для WCAG AA
- Рефайнинг градиентов (FAB, player, кнопки генерации)
- Проверка контрастности во всех состояниях

### 2.3 Анимации и микро-взаимодействия
**Приоритет**: P2 (Средний)

**Задачи**:
- Стандартизация timing functions (200-300ms)
- Haptic feedback для всех touch-элементов
- Skeleton loaders для всех loading-состояний

### 2.4 Карточки и компоненты
**Приоритет**: P2 (Средний)

**Задачи**:
- Унификация теней (elevation 1-3)
- Консистентный border-radius (8-16px)
- Hover/press состояния для интерактивных элементов

### 2.5 Доступность (Accessibility)
**Приоритет**: P1 (Высокий)

**Задачи**:
- ARIA labels для всех интерактивных элементов
- Проверка screen reader совместимости
- Поддержка reduced motion

---

## Фаза 3: Spec 031 — Mobile Studio V2 (3-4 недели)

### 3.1 Lyrics Studio Integration
**Приоритет**: P1 (Высокий)

**Задачи**:
- Интеграция панели лирики в StudioShell
- AI-ассистент для контекстных подсказок
- Section notes с привязкой к секциям трека
- История версий лирики

### 3.2 MusicLab Creative Workspace
**Приоритет**: P2 (Средний)

**Задачи**:
- Интеграция записи вокала в студию
- Подключение гитары с определением аккордов
- PromptDJ для PRO пользователей
- Real-time визуализация аудио

### 3.3 Advanced Stem Processing
**Приоритет**: P2 (Средний)

**Задачи**:
- Batch transcription для множества стемов
- Выбор режима разделения (none/simple/detailed)
- Progress indication для batch операций

### 3.4 Section Replacement History
**Приоритет**: P3 (Низкий)

**Задачи**:
- Хронологический список замен секций
- Preview и restore предыдущих версий
- Сравнение версий side-by-side

### 3.5 Keyboard Shortcuts
**Приоритет**: P3 (Низкий)

**Задачи**:
- Система шорткатов для desktop
- Диалог справки по шорткатам
- Кастомизация привязок

---

## Фаза 4: UX-улучшения (1-2 недели)

### 4.1 Улучшение Feature Tutorial Dialog
**Приоритет**: P2 (Средний)

**Задачи**:
- Добавление анимированных иллюстраций/GIF
- Интерактивные демо-элементы
- Tracking просмотров туториалов

### 4.2 Onboarding Flow
**Приоритет**: P2 (Средний)

**Задачи**:
- Персонализация на основе целей пользователя
- Progressive disclosure функций
- A/B тестирование onboarding вариантов

### 4.3 Empty States Enhancement
**Приоритет**: P3 (Низкий)

**Задачи**:
- Иллюстрации для пустых состояний
- Контекстные CTA
- Gamification hints

---

## Фаза 5: Аналитика и метрики (1 неделя)

### 5.1 Dashboard Analytics
**Приоритет**: P2 (Средний)

**Задачи**:
- User journey visualization
- Conversion funnel tracking
- Feature adoption metrics

### 5.2 A/B Testing Infrastructure
**Приоритет**: P3 (Низкий)

**Задачи**:
- Feature flags система
- Experiment assignment
- Statistical analysis tools

---

## Техническая часть

### Архитектурные решения

1. **Design Tokens System**
   - Централизованные токены в `src/lib/design-tokens.ts`
   - CSS variables для runtime theming
   - Tailwind plugin для type-safe классов

2. **Component Library Audit**
   - Инвентаризация всех 170+ компонентов
   - Выявление дубликатов и несогласованностей
   - Документация в Storybook (опционально)

3. **State Management Review**
   - Аудит Zustand stores
   - Оптимизация подписок
   - Memoization стратегии

### Ключевые файлы для модификации

| Фаза | Файлы |
|------|-------|
| 1.1 | `vite.config.ts`, lazy imports в pages |
| 2.1-2.2 | `src/lib/design-tokens.ts`, `tailwind.config.ts` |
| 2.3 | `src/lib/motion.ts`, компоненты |
| 3.1 | `src/components/studio/unified/LyricsPanel.tsx` |
| 3.2 | `src/components/studio/unified/StudioShell.tsx` |

---

## Timeline

```text
Неделя 1-2:  Фаза 1 (Производительность)
Неделя 3-5:  Фаза 2 (Professional UI)
Неделя 6-9:  Фаза 3 (Mobile Studio V2)
Неделя 10-11: Фаза 4 (UX)
Неделя 12:   Фаза 5 (Аналитика)
```

---

## Метрики успеха

| Метрика | Текущее | Цель |
|---------|---------|------|
| Bundle size | 184 KB | <150 KB |
| WCAG AA compliance | ~90% | 100% |
| Touch target compliance | ~95% | 100% |
| Animation 60fps | ~90% | 95%+ |
| User satisfaction (CSAT) | - | 8.5/10 |
| Feature adoption rate | - | +30% |

---

## Рекомендация

**Начать с Фазы 1** (оптимизация производительности), так как это:
1. Улучшит UX для всех пользователей сразу
2. Не требует дизайн-решений
3. Создаст основу для дальнейших улучшений
4. Быстро достижимые результаты (1-2 недели)

Затем перейти к **Фазе 2** (Spec 032: Professional UI) параллельно с **Фазой 3** (Spec 031: Mobile Studio V2), выполняя P1 задачи в первую очередь.
