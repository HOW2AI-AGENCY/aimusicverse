# ADR-012: Generation Form Compact UI

**Date:** 2026-01-04  
**Status:** Accepted  
**Context:** MusicVerse AI Generation Form  
**Decision Makers:** Development Team

---

## Context

Форма генерации музыки (`GenerateSheet`) занимала слишком много места и имела проблемы с UX на мобильных устройствах:

1. **Громоздкий хедер** — логотип и избыточные элементы
2. **Дублирование** — Model Selector присутствовал и в хедере, и в Advanced Options
3. **Подсказки не работали** — Tooltip не работают на touch-устройствах
4. **Copy/Delete всегда видны** — даже когда поле пустое
5. **Тяжёлый Lyrics Editor** — 733 строки с drag-drop и статистикой

---

## Decision

### 1. Компактный хедер без логотипа

**Файл:** `src/components/generate-form/CollapsibleFormHeader.tsx`

```tsx
// BEFORE
<div className="min-h-[44px] py-2 ...">
  {/* Logo */}
  <div className="flex items-center gap-1 flex-shrink-0">
    <img src="/logo.svg" className="w-5 h-5" />
  </div>
  ...
</div>

// AFTER
<div className="min-h-[36px] py-1 ...">
  {/* No logo - more space */}
  ...
</div>
```

**Размеры:**
- `min-h-[44px]` → `min-h-[36px]`
- `py-2` → `py-1`
- `h-7` → `h-6`
- `gap-1.5` → `gap-1`

### 2. Popover вместо Tooltip для подсказок

**Файл:** `src/components/generate-form/SectionLabel.tsx`

```tsx
// BEFORE
<Tooltip>
  <TooltipTrigger>
    <HelpCircle />
  </TooltipTrigger>
  <TooltipContent>{hint}</TooltipContent>
</Tooltip>

// AFTER
<Popover>
  <PopoverTrigger asChild>
    <button type="button">
      <HelpCircle />
    </button>
  </PopoverTrigger>
  <PopoverContent side="top" className="max-w-[220px]">
    {hint}
  </PopoverContent>
</Popover>
```

**Причина:** Tooltip требует hover, который недоступен на мобильных. Popover работает по клику.

### 3. Условное отображение Copy/Delete

**Файл:** `src/components/generate-form/FormFieldToolbar.tsx`

```tsx
// BEFORE
<ToolbarButton 
  icon={Copy} 
  onClick={handleCopy}
  disabled={isEmpty}
  className={isEmpty ? 'opacity-40' : ''}
/>

// AFTER
{!isEmpty && (
  <ToolbarButton icon={Copy} onClick={handleCopy} />
)}
```

### 4. Удаление дублирования Model Selector

**Файлы:**
- `src/components/generate-form/AdvancedSettings.tsx` — удалён Model Selector
- `src/components/generate-form/GenerateFormCustom.tsx` — убраны пропсы model/onModelChange

Модель выбирается только в хедере формы.

### 5. Компактный Lyrics Visual Editor

**Новый файл:** `src/components/generate-form/LyricsVisualEditorCompact.tsx`

Упрощённая версия без:
- Drag-and-drop
- Statistics panel
- Inline editing

С добавлением:
- Timeline из badges секций
- Quick structure templates (Поп, Рок, Баллада)
- Compact section cards

---

## Consequences

### Positive

- **+8px вертикального пространства** в хедере
- **Подсказки работают на всех устройствах**
- **Чище интерфейс** без неактивных кнопок
- **Нет путаницы** с выбором модели
- **Легче Lyrics Editor** (~200 строк vs 733)

### Negative

- Меньше визуального брендинга (нет логотипа)
- Потеря drag-drop для секций лирики (trade-off за простоту)

### Neutral

- Quick templates — новая функциональность

---

## Alternatives Considered

1. **Sticky header** — отвергнут из-за потери контента
2. **Tabs вместо секций** — слишком много перещёлкиваний
3. **Separate Model page** — усложняет workflow

---

## Implementation Notes

### Files Modified

| File | Change |
|------|--------|
| `SectionLabel.tsx` | Tooltip → Popover |
| `CollapsibleFormHeader.tsx` | Remove logo, reduce sizes |
| `FormFieldToolbar.tsx` | Conditional copy/delete |
| `AdvancedSettings.tsx` | Remove Model Selector |
| `GenerateFormCustom.tsx` | Remove model props |
| `LyricsSection.tsx` | Use compact editor |

### Files Created

| File | Purpose |
|------|---------|
| `LyricsVisualEditorCompact.tsx` | Simplified lyrics editor |

---

## Related

- [ADR-002: Frontend Architecture](./ADR-002-Frontend-Architecture-And-Stack.md)
- [UI Audit](../docs/UI_GENERATION_FORM_AUDIT_2025-12-13.md)
- [Known Issues](../docs/KNOWN_ISSUES.md)
