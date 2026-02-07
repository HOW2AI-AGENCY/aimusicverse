
# План доработки дизайна интерфейса MusicVerse AI

## Резюме анализа

Проведён аудит дизайн-системы, выявлены ключевые области для улучшения:

- **Дизайн-система (Spec 032)** — реализована на 85%, требуется унификация применения
- **Компоненты UI** — 90+ компонентов, но применение glassmorphism и стилей неоднородно
- **Десктоп оптимизация** — недавно реализована, но есть пробелы в визуальном polish
- **Анимации и микро-взаимодействия** — базовые реализованы, но не везде применяются
- **Доступность (A11y)** — WCAG AA частично соблюдается, требуется аудит

---

## 1. ОБЛАСТЬ: Консистентность применения дизайн-токенов

### Проблема
Дизайн-токены определены в `src/lib/design-tokens.ts` и `src/styles/`, но применяются неравномерно:
- Некоторые компоненты используют inline значения (`text-sm`, `p-4`) вместо токенов
- glassmorphism применяется по-разному: `glass-card`, `bg-card/80`, `backdrop-blur-xl` и т.д.
- Тени (elevation) определены, но редко используются систематически

### Решение
| Задача | Описание |
|--------|----------|
| 1.1 | Аудит использования токенов в 15 ключевых страницах |
| 1.2 | Создать `StyleLint` правила для проверки использования дизайн-токенов |
| 1.3 | Унифицировать glassmorphism через `src/lib/glass.ts` (заменить inline стили) |
| 1.4 | Применить `elevationStyles` к всем карточкам (`shadow-elevation-1..5`) |

### Файлы
- Редактировать: `src/components/analytics/*.tsx`, `src/components/home/*.tsx`
- Использовать: `src/lib/glass.ts`, `src/styles/style-utils.ts`

---

## 2. ОБЛАСТЬ: Визуальный polish и микро-анимации

### Проблема
- Hover/press эффекты реализованы в `src/lib/interactions.ts`, но применяются не везде
- Transitions иногда отсутствуют или имеют разную длительность
- Иконки не всегда анимируются при взаимодействии

### Решение
| Задача | Описание |
|--------|----------|
| 2.1 | Применить `hoverLift`, `pressScale` ко всем интерактивным элементам |
| 2.2 | Унифицировать durations: fast (150ms), normal (200ms), slow (300ms) |
| 2.3 | Добавить `AnimatedIcon` компонент для hover-анимаций иконок |
| 2.4 | Реализовать stagger-анимации для списков (`AnimatedList` из `ux-components.ts`) |

### Файлы
- Создать: `src/components/ui/AnimatedIcon.tsx` (расширенная версия)
- Редактировать: `src/components/track/`, `src/components/playlist/`

---

## 3. ОБЛАСТЬ: Темизация и цветовая схема

### Проблема
- Light mode менее проработан чем dark mode
- Некоторые цвета жёстко закодированы: `bg-black/40`, `text-white/70`
- Градиенты определены, но не везде согласованы с темой

### Решение
| Задача | Описание |
|--------|----------|
| 3.1 | Аудит цветов в light mode: контраст, читаемость |
| 3.2 | Заменить hardcoded colors на CSS переменные (`--muted-foreground`) |
| 3.3 | Создать `theme-aware` gradient utilities |
| 3.4 | Улучшить preview в ThemeToggle с демонстрацией цветов |

### Файлы
- Редактировать: `src/index.css` (light theme variables)
- Редактировать: `src/components/theme/ThemeToggle.tsx`

---

## 4. ОБЛАСТЬ: Типографика и читаемость

### Проблема
- Заголовки используют разные стили: `text-xl font-semibold`, `text-lg font-bold`
- Русский текст иногда переполняет контейнеры
- Line-height и letter-spacing не везде оптимальны

### Решение
| Задача | Описание |
|--------|----------|
| 4.1 | Заменить inline typography на классы из `src/styles/typography.css` |
| 4.2 | Применить `text-ru` к русскоязычным блокам (balance, hyphens) |
| 4.3 | Создать компонент `<Heading level={1..5}>` для консистентности |
| 4.4 | Аудит line-clamp и truncation применения |

### Файлы
- Создать: `src/components/ui/Heading.tsx`
- Редактировать: page headers во всех `src/pages/*.tsx`

---

## 5. ОБЛАСТЬ: Скелетоны и состояния загрузки

### Проблема
- Скелетоны есть, но не всегда соответствуют финальному контенту
- Shimmer эффект не везде применяется одинаково
- Empty states визуально разнородны

### Решение
| Задача | Описание |
|--------|----------|
| 5.1 | Унифицировать скелетоны через `src/components/ui/skeleton/` |
| 5.2 | Применить shimmer эффект (`animate-shimmer`) ко всем скелетонам |
| 5.3 | Стандартизировать Empty States через `UnifiedEmptyState` |
| 5.4 | Добавить skeleton matching: высота = финальный контент |

### Файлы
- Редактировать: `src/components/ui/skeleton/`, `src/components/ui/unified-empty-state.tsx`

---

## 6. ОБЛАСТЬ: Улучшение карточек

### Проблема
- `RefinedCard` существует, но не везде используется
- Hover states карточек отличаются: некоторые с `ring`, некоторые с `border`
- Selected states не всегда очевидны

### Решение
| Задача | Описание |
|--------|----------|
| 6.1 | Заменить базовые `Card` на `RefinedCard` в ключевых местах |
| 6.2 | Унифицировать hover: `ring-1 ring-primary/20` + `scale-[1.01]` |
| 6.3 | Унифицировать selected: `ring-2 ring-primary ring-offset-2` |
| 6.4 | Добавить `glow` эффект для featured/premium карточек |

### Файлы
- Редактировать: `src/components/home/*.tsx`, `src/components/analytics/*.tsx`

---

## 7. ОБЛАСТЬ: Мобильный UX polish

### Проблема
- Haptic feedback не везде срабатывает
- Swipe gestures иногда конфликтуют с scroll
- Bottom sheets не всегда имеют drag indicator

### Решение
| Задача | Описание |
|--------|----------|
| 7.1 | Аудит haptic triggers: все кнопки, переключатели, tabs |
| 7.2 | Добавить drag indicator ко всем `Sheet`/`Drawer` |
| 7.3 | Оптимизировать pull-to-refresh анимацию |
| 7.4 | Улучшить safe area padding для iOS notch/Dynamic Island |

### Файлы
- Редактировать: `src/components/ui/sheet.tsx`, `src/components/ui/drawer.tsx`

---

## 8. ОБЛАСТЬ: Focus states и A11y

### Проблема
- Focus ring не везде виден (особенно на тёмных элементах)
- Skip-to-content существует, но редко используется
- ARIA labels не везде полные

### Решение
| Задача | Описание |
|--------|----------|
| 8.1 | Применить `focus-ring` из `src/styles/focus.css` ко всем интерактивным |
| 8.2 | Добавить `aria-label` к иконкам без текста |
| 8.3 | Реализовать keyboard navigation для всех custom components |
| 8.4 | Тестировать с VoiceOver/TalkBack |

### Файлы
- Редактировать: `src/components/ui/button.tsx`, `src/components/player/*.tsx`

---

## 9. ОБЛАСТЬ: Десктоп визуальные улучшения

### Проблема
- Master-detail layouts реализованы, но визуально простоваты
- Sidebar не имеет hover highlights для активного пункта
- Tooltips на десктопе не везде есть

### Решение
| Задача | Описание |
|--------|----------|
| 9.1 | Добавить subtle background к selected sidebar item |
| 9.2 | Улучшить detail panel: добавить header с breadcrumbs |
| 9.3 | Применить tooltips к icon-only buttons |
| 9.4 | Добавить keyboard shortcut hints в меню |

### Файлы
- Редактировать: `src/components/Sidebar.tsx`, `src/components/layout/desktop/*.tsx`

---

## Приоритизация

| Приоритет | Область | Влияние | Сложность |
|-----------|---------|---------|-----------|
| P0 | 1. Консистентность токенов | Высокое | Средняя |
| P0 | 6. Улучшение карточек | Высокое | Низкая |
| P1 | 2. Микро-анимации | Среднее | Средняя |
| P1 | 4. Типографика | Среднее | Низкая |
| P1 | 7. Мобильный UX | Высокое | Средняя |
| P2 | 3. Темизация | Среднее | Средняя |
| P2 | 5. Скелетоны | Среднее | Низкая |
| P2 | 8. Focus/A11y | Высокое | Средняя |
| P3 | 9. Десктоп polish | Среднее | Низкая |

---

## Метрики успеха

- **Консистентность**: 95% компонентов используют дизайн-токены
- **WCAG AA**: 100% текста соответствует контрасту 4.5:1
- **Touch targets**: 100% ≥44px на мобильных
- **Анимации**: 60fps на mid-range устройствах
- **Bundle impact**: <5KB дополнительно

---

## Технические заметки

### Ключевые файлы дизайн-системы
```
src/lib/
├── design-system.ts      # Центральный экспорт
├── design-tokens.ts      # Числовые значения и утилиты
├── design-colors.ts      # Семантические цвета
├── glass.ts              # Glassmorphism presets
├── interactions.ts       # Hover/press эффекты
└── contrast-utils.ts     # WCAG проверки

src/styles/
├── typography.css        # Типографика
├── animations.css        # Keyframes
├── focus.css             # Focus states
├── touch-targets.css     # Touch targets
└── style-utils.ts        # CSS class generators
```

### Паттерн применения
```typescript
// Вместо inline стилей
<Card className="bg-card/80 backdrop-blur-xl border border-border/50">

// Использовать дизайн-систему
import { glass } from '@/lib/glass';
<Card className={glass.card}>
```

---

## Ожидаемый результат

После выполнения плана:
1. Единообразный визуальный стиль по всему приложению
2. Профессиональный polish с микро-анимациями
3. Улучшенная читаемость и типографика
4. Полная WCAG AA совместимость
5. Оптимизированный мобильный и десктопный UX
