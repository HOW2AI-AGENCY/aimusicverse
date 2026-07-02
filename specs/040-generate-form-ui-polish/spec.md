# Spec 040: Доработка дизайна и разметки формы генерации

**Инициирован:** 2026-07-02
**Статус:** 📋 Specification
**Feature Branch:** `040-generate-form-ui-polish`
**Область:** `src/components/generate-form/*`, `src/components/GenerateSheet.tsx`, `src/components/dialog/*`
**Контекст:** Продолжение доработки после коммита `4ec3684` ("Улучшил форму генерации")

---

## Оглавление

1. [Executive Summary](#1-executive-summary)
2. [Обнаруженные проблемы](#2-обнаруженные-проблемы)
3. [Спецификация доработок](#3-спецификация-доработок)
4. [Изменения разметки (markup diff)](#4-изменения-разметки-markup-diff)
5. [План реализации](#5-план-реализации)
6. [Критерии приёмки](#6-критерии-приёмки)

---

## 1. Executive Summary

Форма генерации трека (`GenerateFormSimple.tsx`, `AdvancedSettings.tsx`, `GenerateFormActions.tsx`, `FormSection.tsx`) была недавно упрощена: убрана сворачиваемая секция типа трека, тулбар перенесён под `Textarea`, добавлен счётчик символов. Точечный аудит выявил 8 проблем — от нарушения собственного гайдлайна проекта по touch targets (44×44px) до слабой визуальной иерархии между блоками формы. Ниже — ТЗ на устранение этих проблем без затрагивания бизнес-логики (только вёрстка, стили, доступность).

**Не входит в объём:** изменение состава полей формы, интеграция с бэкендом, A/B-эксперименты (`useExperiment` остаётся как есть).

---

## 2. Обнаруженные проблемы

### 2.1 Критические (нарушение гайдлайнов проекта)

#### C1. Touch targets < 44px в тулбаре под Textarea
- **Файл:** `src/components/generate-form/GenerateFormSimple.tsx:181-209`
- **Проблема:** Кнопки Copy/Clear/Voice — `h-8 w-8` (32px), нарушение правила `CLAUDE.md` → "Touch Targets: Minimum 44×44px".
- **Риск:** промахи по кнопкам на маленьких экранах (iPhone SE 375px), accessibility violation (WCAG 2.5.5).

#### C2. Toggle "Тип трека" не читается как switch
- **Файл:** `src/components/generate-form/GenerateFormSimple.tsx:244-265`
- **Проблема:** `role="switch"` + `aria-checked`, но визуально — обычная pill-кнопка без "трека" переключателя (thumb/track). Семантика ARIA не подкреплена визуальным паттерном.
- **Риск:** пользователь не понимает, что состояние переключаемое, а не выбор из списка.

### 2.2 Значительные

#### M1. Отсутствие визуальной иерархии между секциями
- **Файл:** `GenerateFormSimple.tsx:108, 239, 272` (три `FormSection` подряд)
- **Проблема:** Description, Тип трека и Название визуально равнозначны (`FormSection` без `elevated`), хотя Description — основное поле ввода.

#### M2. Счётчик символов малозаметен в нейтральном состоянии
- **Файл:** `GenerateFormSimple.tsx:164-176`
- **Проблема:** `text-[11px] text-muted-foreground` всегда виден, но не привлекает внимание, когда это действительно важно (близко к лимиту).

#### M3. Двойной источник вертикального ритма
- **Файл:** `FormSection.tsx:25-28` (`FormDivider` = `h-1` spacer) + `GenerateFormSimple.tsx:105` (`space-y-3` на родителе)
- **Проблема:** отступы между секциями формируются одновременно родительским `space-y-3` и явным `<FormDivider />`, что затрудняет предсказуемую настройку ритма.

#### M4. Неравный акцент в `ActionChip` без обоснования
- **Файл:** `GenerateFormActions.tsx:69`
- **Проблема:** только чип "Голос" имеет `accent`, остальные три (Аудио, Персона, Проект) — нет. Явной причины приоритезации в коде/комментариях нет.

#### M5. Disabled AI Boost без объяснения причины
- **Файл:** `GenerateFormSimple.tsx:130-141`
- **Проблема:** кнопка гаснет (`opacity-40`) при пустом `description`, но нет `title`/aria-описания, почему.

### 2.3 Косметические

#### L1. Слайдеры в `AdvancedSettings` без содержательного контекста значений
- **Файл:** `AdvancedSettings.tsx:119-172`
- **Проблема:** проценты (`0-100%`) без примера эффекта на границах (0% vs 100%).

---

## 3. Спецификация доработок

### 3.1 [C1] Touch targets тулбара → 44px

**Было:**
```tsx
className="h-8 w-8 min-w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
```

**Должно быть:**
```tsx
className="h-11 w-11 min-w-11 p-0 text-muted-foreground hover:text-foreground rounded-lg"
```

Применить к трём кнопкам: Copy (`GenerateFormSimple.tsx:184-190`), Clear (`:191-200`), `VoiceInputButton` (`:203-209`, проп `className`).

**Компенсация плотности:** т.к. кнопки увеличатся с 32px до 44px, а их 3 в ряд, обернуть их в `flex items-center gap-1` (было `gap-0.5`) и снизить визуальный вес неактивных — оставить `variant="ghost"` без фона в состоянии покоя (уже так).

**Альтернатива для очень узких экранов (< 360px):** если после увеличения кнопки не помещаются в одну строку с счётчиком символов, схлопнуть Copy+Clear в `DropdownMenu` (уже используется в проекте) с иконкой `MoreVertical`, оставив только `VoiceInputButton` как отдельную кнопку 44px.

---

### 3.2 [C2] Явный визуальный switch для "Тип трека"

**Было:** pill-кнопка с иконкой (`GenerateFormSimple.tsx:244-265`), не читается как переключатель.

**Должно быть:** двухпозиционный сегмент-свитч (segmented control), как было до рефакторинга (`960652f`), но **без** коллапса/localStorage-persist (это было причиной прошлого упрощения — держим упрощённый DOM):

```tsx
<div
  className="relative grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-full border border-border/50"
  role="radiogroup"
  aria-label="Тип трека"
>
  <button
    type="button"
    role="radio"
    aria-checked={hasVocals}
    onClick={() => handleVocalsToggle(true)}
    className={cn(
      "relative z-10 flex items-center justify-center gap-1.5 h-9 rounded-full text-[13px] font-semibold transition-colors",
      hasVocals ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
    )}
  >
    <Mic className="w-4 h-4" aria-hidden="true" />
    Вокал
  </button>
  <button
    type="button"
    role="radio"
    aria-checked={!hasVocals}
    onClick={() => handleVocalsToggle(false)}
    className={cn(
      "relative z-10 flex items-center justify-center gap-1.5 h-9 rounded-full text-[13px] font-semibold transition-colors",
      !hasVocals ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
    )}
  >
    <Music2 className="w-4 h-4" aria-hidden="true" />
    Инструментал
  </button>
  {/* animated thumb */}
  <motion.div
    layout
    transition={{ type: "spring", stiffness: 400, damping: 32 }}
    className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-br from-primary to-primary/85 shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)]"
    style={{ left: hasVocals ? 4 : "calc(50% + 0px)" }}
    aria-hidden="true"
  />
</div>
```

**Роль ARIA:** `radiogroup`/`radio` вместо `switch` — точнее описывает "выбор одного из двух состояний" (в отличие от `switch`, который подразумевает on/off одной сущности). Убрать `role="switch"`/`aria-checked` с текущей кнопки.

---

### 3.3 [M1] Визуальная иерархия: Description как hero-блок

**Файл:** `GenerateFormSimple.tsx:108`

```tsx
<FormSection elevated>
  {/* ...существующее содержимое Description... */}
</FormSection>
```

`FormSection` уже поддерживает проп `elevated` (`FormSection.tsx:15,19`) — добавляет `p-3 rounded-xl` + `glass.subtle`. Просто включить его для секции Description, оставить `elevated=false` (по умолчанию) для "Тип трека" и "Название", чтобы визуально выделить основной ввод.

---

### 3.4 [M2] Счётчик символов — прогрессивная заметность

**Файл:** `GenerateFormSimple.tsx:164-176`

Правило: счётчик показывается приглушённым всегда, но получает fade-in подсветку и увеличенный `font-weight` только при приближении к лимиту:

```tsx
<span
  className={cn(
    "text-[11px] tabular-nums transition-all duration-200",
    overLimit
      ? "text-destructive font-bold"
      : description.length > 400
        ? "text-yellow-500 font-semibold"
        : "text-muted-foreground/70 font-medium",
  )}
>
  {description.length}/500
</span>
```

Изменение: `text-muted-foreground` → `text-muted-foreground/70` в нейтральном состоянии (снижает шум, когда неважно), `font-semibold`/`font-bold` только в предупреждающих состояниях (усиливает контраст, когда важно).

---

### 3.5 [M3] Единый источник вертикального ритма

**Решение:** оставить `FormDivider` как единственный явный разделитель, убрать `space-y-3` с корневого `motion.div`.

**Файл:** `GenerateFormSimple.tsx:105`
```diff
- className="space-y-3 w-full max-w-full min-w-0 overflow-x-hidden"
+ className="w-full max-w-full min-w-0 overflow-x-hidden"
```

Внутри каждого `FormSection` уже используется `space-y-2`/`space-y-2.5` — это локальный ритм полей внутри секции, он не конфликтует. Между секциями теперь единственный источник — `<FormDivider />`.

**Файл:** `FormSection.tsx:25-28` — увеличить `FormDivider` до `h-4` (16px, шаг сетки 4px из `CLAUDE.md`), т.к. без родительского `space-y-3` текущий `h-1` (4px) будет визуально слишком плотным:
```diff
- return <div className={cn("h-1", className)} aria-hidden />;
+ return <div className={cn("h-4", className)} aria-hidden />;
```

---

### 3.6 [M4] `ActionChip` — убрать необоснованный акцент

**Файл:** `GenerateFormActions.tsx:69`

```diff
- <ActionChip icon={MicVocal} label="Голос" onClick={() => log("voice", onOpenVoiceClone)} ariaLabel="Клонировать голос" accent />
+ <ActionChip icon={MicVocal} label="Голос" onClick={() => log("voice", onOpenVoiceClone)} ariaLabel="Клонировать голос" />
```

Все 4 чипа (Аудио/Голос/Персона/Проект) становятся визуально равноценными до тех пор, пока продуктовая аналитика не покажет, какой источник действительно используется чаще — тогда акцент возвращается осознанно с комментарием, ссылающимся на данные.

---

### 3.7 [M5] AI Boost — объяснение disabled-состояния

**Файл:** `GenerateFormSimple.tsx:126-141`

```diff
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={handleBoostStyle}
    disabled={boostLoading || !description}
    className="h-9 px-2.5 gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all disabled:opacity-40"
-   aria-label="Улучшить описание с помощью AI"
+   aria-label="Улучшить описание с помощью AI"
+   title={!description ? "Введите описание, чтобы использовать AI Boost" : undefined}
  >
```

`title` даёт нативный browser tooltip на desktop-hover и читается screen reader'ом как доп. описание — минимальное изменение без нового компонента.

---

### 3.8 [L1] Слайдеры `AdvancedSettings` — подписи границ

**Файл:** `AdvancedSettings.tsx:119-149` (Влияние стиля, Креативность)

Добавить `min`/`max` подписи под слайдером:

```tsx
<Slider value={styleWeight} onValueChange={onStyleWeightChange} min={0} max={1} step={0.05} />
<div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
  <span>Слабее</span>
  <span>Точнее описанию</span>
</div>
```

Аналогично для "Креативность": `Предсказуемо` ↔ `Экспериментально`.

---

## 4. Изменения разметки (markup diff)

Сводка структурных изменений DOM (без учёта Tailwind-классов, см. п.3):

| Компонент | Было | Стало |
|---|---|---|
| `GenerateFormSimple` root | `space-y-3` управляет ритмом секций | ритм только через `<FormDivider />` |
| Description `FormSection` | обычная секция | `elevated` (фон + padding) |
| Тип трека | одиночная pill-кнопка `role="switch"` | `radiogroup` с двумя `role="radio"` + анимированный thumb |
| Тулбар (Copy/Clear/Voice) | 3× `h-8 w-8` (32px) | 3× `h-11 w-11` (44px), опционально Copy+Clear → `DropdownMenu` на < 360px |
| `FormDivider` | `h-1` (4px) | `h-4` (16px) |
| `ActionChip` "Голос" | `accent` (выделен) | без `accent` (равнозначен остальным) |

Никакие пропсы компонентов наружу (`GenerateFormSimpleProps`, `AdvancedSettingsProps`, `GenerateFormActionsProps`) не меняются — это чисто внутренняя вёрстка/стили, обратная совместимость с `GenerateSheet.tsx` сохраняется.

---

## 5. План реализации

| ID | Задача | Приоритет | Файлы | Оценка |
|----|--------|-----------|-------|--------|
| 040-01 | Touch targets тулбара → 44px | P0 | `GenerateFormSimple.tsx` | 0.5 SP |
| 040-02 | Segmented control для "Тип трека" | P0 | `GenerateFormSimple.tsx` | 1.5 SP |
| 040-03 | `elevated` для Description секции | P1 | `GenerateFormSimple.tsx` | 0.5 SP |
| 040-04 | Прогрессивная заметность счётчика | P1 | `GenerateFormSimple.tsx` | 0.5 SP |
| 040-05 | Единый вертикальный ритм (`FormDivider` h-4) | P1 | `GenerateFormSimple.tsx`, `FormSection.tsx` | 0.5 SP |
| 040-06 | Убрать `accent` у чипа "Голос" | P2 | `GenerateFormActions.tsx` | 0.25 SP |
| 040-07 | `title` для disabled AI Boost | P2 | `GenerateFormSimple.tsx` | 0.25 SP |
| 040-08 | Подписи границ слайдеров | P2 | `AdvancedSettings.tsx` | 0.5 SP |

**Итого:** ~4.5 SP, укладывается в 1 день разработки + ревью.

**Порядок выполнения:** 040-01 и 040-02 сначала (нарушения гайдлайнов, P0), затем 040-03..040-05 (иерархия/ритм, взаимозависимы — делать вместе, т.к. оба трогают `FormDivider`), затем косметика 040-06..040-08 независимо.

---

## 6. Критерии приёмки

### Функциональные
- [ ] Все интерактивные элементы тулбара под Textarea ≥ 44×44px (проверено вручную на 375px viewport)
- [ ] Toggle "Тип трека" использует `role="radiogroup"`/`role="radio"`, визуально читается как переключатель (анимированный thumb)
- [ ] Секция Description визуально выделена (`elevated`) относительно "Тип трека"/"Название"
- [ ] Между секциями формы единственный источник отступа — `FormDivider`, родительский `space-y-*` убран
- [ ] Все 4 `ActionChip` в `GenerateFormActions` визуально равнозначны (без `accent`)
- [ ] AI Boost в disabled-состоянии имеет `title` с объяснением причины

### Визуальные / доступность
- [ ] Не сломан `aria-invalid`/`aria-describedby` на `Textarea` и `Input` (без регрессий a11y)
- [ ] Focus-visible кольцо сохраняется на новом segmented control
- [ ] Цветовой контраст счётчика символов в нейтральном состоянии ≥ 3:1 (не ниже текущего)
- [ ] Layout не ломается на 375px (iPhone SE) и 1280px (desktop) — визуальная проверка в браузере

### Регрессии
- [ ] `npm run lint` проходит без новых ошибок
- [ ] `npm test` — существующие unit-тесты формы генерации (если есть) не падают
- [ ] `npm run size` — бандл не вырос (только CSS/JSX правки, без новых зависимостей)
- [ ] Ручная проверка полного flow: ввод описания → AI Boost → выбор типа трека → сабмит формы

---

<div align="center">

[← Sprint 039](../039-architecture-refactor/) · [↑ К индексу](../../DOCUMENTATION_INDEX.md)

<sub>Создано: 02.07.2026 · Статус: 📋 Specification</sub>

</div>
