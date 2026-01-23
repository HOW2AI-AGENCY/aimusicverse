

# План: Исправление UI компонентов + Улучшение генерации обложек + AI Agent UX

## 1. Проблемы с дизайном диалогов и панелей

### Выявленные проблемы
После анализа компонентов обнаружено:

| Компонент | Проблема |
|-----------|----------|
| `FeatureHint.tsx` | Кнопка закрытия `X` справа - ОК, но есть дублирование с кнопкой "Понятно" |
| `InteractiveTooltip.tsx` | Кнопка `X` вверху справа - корректно |
| `ModalDialog` (variants/modal.tsx) | Кнопка справа ✅, но отступы `p-4 sm:p-6` могут быть неконсистентны |
| `SheetDialog` (variants/sheet.tsx) | Использует `ChevronDown` вместо `X` - нестандартно |
| `MobileActionSheet.tsx` | Нет явной кнопки закрытия в заголовке |
| `MobileBottomSheet.tsx` | Только drag handle, нет кнопки X |

### Решение
Создать единый `DialogHeader` компонент:

```
src/components/dialog/DialogHeader.tsx
├── Кнопка X всегда СПРАВА (абсолютное позиционирование)
├── Touch target 44x44px
├── Консистентные отступы (px-4 py-3)
└── Опциональный subtitle
```

**Файлы для модификации:**
- `src/components/dialog/variants/sheet.tsx` - заменить ChevronDown на X справа
- `src/components/mobile/MobileBottomSheet.tsx` - добавить опциональную кнопку X
- `src/components/mobile/MobileActionSheet.tsx` - добавить кнопку X в заголовок
- `src/components/hints/FeatureHint.tsx` - убрать дублирующую кнопку "Понятно"

---

## 2. Улучшение промптов генерации обложек + MusicVerse брендинг

### Текущее состояние
`suno-generate-cover-image/index.ts` → `buildDynamicPrompt()` не включает брендинг MusicVerse.

### Решение

**A) Улучшение базового промпта:**
```typescript
// Добавить в buildDynamicPrompt()
const brandingElements = [
  'subtle "MV" logo watermark in corner',
  'MusicVerse aesthetic with modern gradients',
  'signature MusicVerse purple-blue color accent',
];
```

**B) Периодические подсказки промптов с MusicVerse:**
Создать новый компонент `CoverPromptSuggester`:

```
src/components/cover/CoverPromptSuggester.tsx
├── Показывает каждые 5-10 секунд новый промпт-подсказку
├── Включает "MusicVerse" брендинг в примерах
├── Пользователь может кликнуть для применения
└── Анимированная ротация с fade-in/out
```

**Примеры промптов с брендингом:**
- "MusicVerse album cover: futuristic cityscape with purple neon"
- "MusicVerse style: abstract sound waves in gradient blue-purple"
- "MusicVerse aesthetic: vinyl record floating in cosmic space"

---

## 3. Улучшение AI Agent интерфейса

### Текущая архитектура
```
MobileAIAgentPanel.tsx
├── 9 инструментов (Write, Analyze, Producer, Optimize, etc.)
├── useAITools hook
├── useWorkflowEngine
└── Голосовой ввод
```

### Выявленные UX проблемы

| Проблема | Решение |
|----------|---------|
| Много инструментов на одном экране | Группировка по категориям |
| Нет визуального прогресса workflow | Добавить stepper/progress |
| Результаты анализа сложно читать | Карточки с цветовым кодированием |
| Нет быстрых действий | Quick action chips |
| Переключение панелей неинтуитивно | Tab-based navigation |

### План улучшений

**Фаза 1: Реорганизация инструментов**
```
AI Agent Panel (новый дизайн)
├── [Tabs: Создание | Анализ | Оптимизация]
├── Создание: Write, Continue, Rhyme
├── Анализ: Analyze, Producer, Structure
├── Оптимизация: Optimize, StyleConvert, Translate
└── Quick Actions: chips с частыми действиями
```

**Фаза 2: Визуальные улучшения**
- Карточки результатов с иконками и цветами
- Progress stepper для многошаговых workflow
- Inline preview текста при hover
- Haptic feedback на всех действиях

**Фаза 3: UX оптимизация**
- Сохранение последнего использованного инструмента
- Контекстные подсказки (первое использование)
- Keyboard shortcuts для desktop
- Drag-to-reorder результатов

---

## 4. Файлы для создания/модификации

### Новые файлы
| Файл | Описание |
|------|----------|
| `src/components/dialog/DialogHeader.tsx` | Унифицированный заголовок |
| `src/components/cover/CoverPromptSuggester.tsx` | Ротатор промптов с брендингом |

### Модификации
| Файл | Изменения |
|------|-----------|
| `src/components/dialog/variants/sheet.tsx` | X справа вместо ChevronDown |
| `src/components/mobile/MobileBottomSheet.tsx` | Добавить кнопку X |
| `src/components/mobile/MobileActionSheet.tsx` | Кнопка X в заголовке |
| `src/components/hints/FeatureHint.tsx` | Убрать дубли, фикс отступов |
| `supabase/functions/suno-generate-cover-image/index.ts` | MusicVerse в промптах |
| `src/components/lyrics-workspace/ai-agent/MobileAIAgentPanel.tsx` | Tab-based UI |

---

## 5. Порядок реализации

```
Этап 1: Фикс UI (30 мин)
├── Создать DialogHeader
├── Обновить sheet.tsx, MobileBottomSheet, MobileActionSheet
└── Исправить FeatureHint

Этап 2: Cover Prompts (20 мин)
├── Обновить buildDynamicPrompt с MusicVerse
└── Создать CoverPromptSuggester

Этап 3: AI Agent UX (40 мин)
├── Редизайн MobileAIAgentPanel с tabs
├── Quick action chips
└── Улучшенные карточки результатов
```

