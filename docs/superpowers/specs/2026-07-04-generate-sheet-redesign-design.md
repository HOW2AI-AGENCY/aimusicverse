# Generate Sheet UX Redesign — Design Spec

**Date:** 2026-07-04
**Status:** Approved (brainstorming phase complete)
**Owner:** TBD
**Sprint scope:** ~3 weeks (3 sprints)
**Related docs:** [PROJECT_STATUS.md](../../../PROJECT_STATUS.md), [CLAUDE.md](../../../CLAUDE.md)

---

## 1. Problem Statement

The current music generation flow ([src/components/GenerateSheet.tsx](../../../src/components/GenerateSheet.tsx)) suffers from a combination of architectural and UX problems that hurt first-time user completion rate and code maintainability:

### Architectural problems
- **GenerateSheet.tsx is 512 lines** — God-component mixing Sheet UI, dialog state, Telegram buttons integration, draft save, validation, audio/project/artist references, haptic feedback, and analytics.
- **`useGenerateForm.ts` is 1023 lines** — the single biggest store hook in the codebase (one of 9 files >800 LOC flagged in Sprint 051).
- **`LyricsVisualEditor.tsx` is 812 lines** and `LyricsSectionAdvanced.tsx` is 359 lines — two files for one task ("input lyrics").
- **`LyricsChatAssistant.tsx` is 601 lines** — opens as a Dialog that obscures the underlying form context.
- **Dead code from Sprint 050**: `src/components/generate-form/wizard/` (10 files: `GenerationWizard.tsx`, `WizardProgress.tsx`, `steps/IdeaStep.tsx`, `LyricsStep.tsx`, `PreviewStep.tsx`, etc.) was removed from the user-facing flow but the files were never deleted.

### UX problems
1. **High cognitive load on first open** — users see 6+ fields, 3 sliders, a mode toggle (Simple/Custom), 4 reference selectors, and an "Advanced settings" collapsible all at once. No progressive disclosure.
2. **Disabled CTA gives no feedback** — when the user can't generate, the button is just grey. There's no way to learn *why*.
3. **Lyrics AI Assistant opens as a Dialog** that overlays the form, breaking context. The user's typed text is invisible while chatting.
4. **No drag-reorder for lyrics sections** — Verse/Chorus/Bridge can be added but not reordered. Users paste complete songs and have to delete and re-add.
5. **Generation cost is shown small in the footer** without explaining *why* the cost is X (model + reference + persona + lyrics length).
6. **AdvancedSettings uses one big Collapsible** with no visual grouping between vocal gender, sliders, and exclusions.
7. **Two visual references rows** — `GenerateFormActions` (audio/project/artist/voice-clone buttons) + `GenerateFormReferences` (chips showing what's selected) duplicate the same information.

### Goals

**Primary goal:** lower the entry barrier for new users — a first-time visitor should understand within 5 seconds what to do.

**Secondary goals:**
- Decompose `GenerateSheet.tsx` into single-responsibility units (address Sprint 051 tech debt).
- Reuse the same `useGenerateDraft` already shipped in Sprint 055 P0-3 (no regression on draft persistence).
- Stay within the 950 KB bundle limit (current eager JS on cold load: ~508 KB gzip).

**Non-goals:**
- No change to the actual generation backend or Suno API contract.
- No change to Telegram Mini App deep-links or `useTelegramMainButton` semantics.
- No change to the `simple` mode UX beyond header/footer alignment (custom mode is the primary redesign target).

---

## 2. Architecture

### 2.1 New file layout

```
src/components/GenerateSheet.tsx                              (~80 lines, thin orchestrator)
src/components/generate-sheet/
├── GenerateSheetHeader.tsx                                   (compact header: credits, mode, model, close)
├── GenerateSheetBody.tsx                                     (lazy simple/custom + Suspense)
├── GenerateSheetFooter.tsx                                   (CTA + draft + cost tooltip)
├── GenerateSheetDialogs.tsx                                  (project/artist/audio/voice/history dialogs)
├── ValidationReasonsSheet.tsx                                (bottom sheet of validation reasons)
└── ReferenceChipsRow.tsx                                     (consolidated: actions + chips)

src/components/generate-form/lyrics/                          (new folder, replaces scattered files)
├── LyricsSection.tsx                                         (~120 lines, section wrapper with toolbar)
├── LyricsVisualEditor.tsx                                    (~300 lines, pure section list editor)
├── LyricsSectionCard.tsx                                     (single section: type chip + content + drag handle)
├── LyricsSectionTemplates.ts                                 (in-memory templates)
├── useLyricsSections.ts                                      (parse / serialize / add / remove / reorder)
├── LyricsAssistantSheet.tsx                                  (assistant bottom sheet — replaces LyricsChatAssistant.tsx)
├── LyricsAssistantChat.tsx                                   (assistant chat body)
└── index.ts

src/components/generate-form/
└── AdvancedSettings.tsx                                      (rewritten: card-based, popover info)

src/hooks/generation/
├── useGenerateFormState.ts                                   (split from useGenerateForm.ts)
├── useGenerateFormActions.ts                                 (split from useGenerateForm.ts)
├── useGenerateFormValidation.ts                              (canGenerate + reasons[])
└── useGenerateSheetValidation.ts                             (consumer-facing wrapper)
```

### 2.2 Hook contracts

**`useGenerateSheetController(params)`** — single entry point for all GenerateSheet logic:

```typescript
interface UseGenerateSheetControllerParams {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProjectId?: string;
}

interface UseGenerateSheetControllerReturn {
  form: UseGenerateFormReturn;
  validation: { canGenerate: boolean; reasons: ValidationReason[]; hasWarnings: boolean };
  dialogs: {
    project: DialogState;
    artist: DialogState;
    audioAction: DialogState;
    voiceClone: DialogState;
    history: DialogState;
    lyricsAssistant: DialogState;
    styles: DialogState;
    closeConfirm: DialogState;
  };
  actions: {
    handleGenerate: () => void;
    handleSaveDraft: () => void;
    handleCloseRequest: () => void;
    handleClearDraft: () => void;
    handleProjectSelect: (id: string) => void;
    handleAdvancedToggle: (open: boolean) => void;
  };
  telegram: {
    mainButton: { visible: boolean; enabled: boolean; text: string };
    secondaryButton: { visible: boolean; enabled: boolean; text: string };
  };
  references: {
    selectedProjectId?: string;
    selectedArtistId?: string;
    selectedTrackId?: string;
    audioFile: File | null;
    customVoiceId?: string | null;
  };
}
```

**`useLyricsSections(text, onChange)`** — section model for lyrics:

```typescript
type SectionType =
  | 'verse' | 'chorus' | 'bridge' | 'pre-chorus'
  | 'intro' | 'outro' | 'hook' | 'custom';

interface LyricsSection {
  id: string;
  type: SectionType;
  label?: string;
  content: string;
}

interface UseLyricsSectionsReturn {
  sections: LyricsSection[];
  addSection: (type: SectionType, afterId?: string) => void;
  removeSection: (id: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  updateSection: (id: string, patch: Partial<LyricsSection>) => void;
  toPlainText: () => string;
  fromPlainText: (text: string) => void;
  applyTemplate: (templateId: string) => void;
  stats: { totalChars: number; totalLines: number; estimatedDurationSeconds: number };
}
```

**`useGenerateSheetValidation(form, balance, cost)`** — real-time validation:

```typescript
type ValidationField = 'title' | 'style' | 'lyrics' | 'credits' | 'model' | 'audioFile';
type ValidationSeverity = 'error' | 'warning';

interface ValidationReason {
  field: ValidationField;
  severity: ValidationSeverity;
  message: string;     // i18n key
  messageRu: string;   // fallback
  deepLink?: () => void;  // scroll-and-focus the offending field
}

interface UseGenerateSheetValidationReturn {
  canGenerate: boolean;
  reasons: ValidationReason[];
  hasWarnings: boolean;
}
```

### 2.3 Validation rules

| Field | Rule | Severity | Reason |
|-------|------|----------|--------|
| `title` | empty | warning | "Название не заполнено" |
| `title` | > 80 chars | warning | "Слишком длинное название" |
| `style` | empty | error | "Опишите стиль трека" |
| `style` | > 200 chars | warning | "Слишком длинное описание стиля" |
| `lyrics` | > 3000 chars | error | "Превышен лимит Suno API (3000 символов)" |
| `lyrics` | empty + `hasVocals=true` | warning | "Вокал включён, но текст пустой" |
| `lyrics` | has vocals but no sections | warning | "Текст не структурирован по секциям" |
| `credits` | < `generationCost` | error | "Недостаточно кредитов" |
| `audioFile` | selected but not uploaded | error | "Аудио не загружено" |
| `audioFile` | selected, uploaded, no `audioWeight` configured | warning | "Сила аудио не настроена" |

### 2.4 Component layering rules

- **Pure UI components** (GenerateSheetHeader/Footer/Body, LyricsSection, AdvancedSettings card) have zero state outside their props — fully unit-testable.
- **Logic hooks** (`useGenerateSheetController`, `useGenerateSheetValidation`, `useLyricsSections`) own state and side effects.
- **No cross-imports** between `generate-sheet/` and `generate-form/lyrics/` — they communicate through the controller hook.
- **Lazy boundary** stays at `GenerateSheetBody` — simple/custom chunks remain separate code splits.

---

## 3. UX: Layout & Information Architecture

### 3.1 Visual layout (custom mode, mobile)

```
┌─────────────────────────────────────────────────┐ ← Sheet (95dvh)
│ [💎42] [Simple|Custom] [Модель ▾]    [✕]       │ ← Header (1 строка, sticky)
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [+ Project] [+ Artist] [+ Audio] [+ Voice] │ │ ← Reference chips row (collapsible)
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Основное ──────────────────────────────────┐ │
│ │ [Название трека_______________]            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Стиль и вокал ─────────────────────────────┐ │
│ │ [Опишите звучание_____________________] 🎨 │ │
│ │ [✨ Усилить стиль]                         │ │
│ │ Вокал: [Любой] [Женский] [Мужской]         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Текст песни ──────────────────────────────┐ │
│ │ [🤖 AI-помощник] [📋 Шаблоны] [📊 stats]    │ │ ← Toolbar
│ │ ┌──────────────────────────────────────┐   │ │
│ │ │ ⋮⋮ [Verse ▼] [×]                     │   │ │ ← Section card
│ │ │ Строка 1 стиха                       │   │ │
│ │ │ Строка 2 стиха                       │   │ │
│ │ ├──────────────────────────────────────┤   │ │
│ │ │ ⋮⋮ [Chorus ▼] [×]                    │   │ │
│ │ │ Припев...                            │   │ │
│ │ ├──────────────────────────────────────┤   │ │
│ │ │ [+ Добавить секцию]                  │   │ │
│ │ └──────────────────────────────────────┘   │ │
│ └────────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Расширенные настройки ─────────────────────┐ │
│ │ ┌─ 🎚 Влияние стиля ──────── 60% ─┐      │ │
│ │ │ ▔▔▔▔▔▔○─────────────────      ℹ️  │      │ │
│ │ └──────────────────────────────────┘      │ │
│ │ ┌─ 🎲 Креативность ─────────── 70% ─┐      │ │
│ │ │ ▔▔▔▔▔▔▔○─────────────────     ℹ️  │      │ │
│ │ └──────────────────────────────────┘      │ │
│ │ ┌─ 🚫 Исключить ──────────────────────┐    │ │
│ │ │ [piano, drums_______________]      │    │ │
│ │ └─────────────────────────────────────┘    │ │
│ └────────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Приватность ───────────────────────────────┐ │
│ │ [🌐 Публичный] [🔒 Приватный]              │ │
│ └────────────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Черновик]  [✨ Сгенерировать · 💎8]            │ ← Footer (sticky)
└─────────────────────────────────────────────────┘
```

### 3.2 Reference chips consolidation

`GenerateFormActions` (4 buttons) and `GenerateFormReferences` (4 chips) become one row of chips. Empty slots show as outlined `+ Label` buttons; filled slots show as filled chips with `×` to remove:

```
Empty state:    [+ Project] [+ Artist] [+ Audio] [+ Voice]
Selected:       [📁 Summer EP ×] [+ Artist] [+ Audio] [+ Voice]
Many selected:  [📁 Summer EP ×] [🎤 Lady Gaga ×] [+ Audio] [+1 more ▾]
```

When chips overflow the available width (e.g., > 3 chips), collapse the rest into a `+ N more ▾` popover.

### 3.3 CTA states

| State | Button appearance | Tap behavior |
|-------|-------------------|--------------|
| **Valid** (no warnings, no errors) | Primary gradient, full opacity | Submit generation |
| **Valid + warnings** | Primary gradient + small ⚠️ badge "2 предупреждения" | Open `ValidationReasonsSheet` |
| **Errors** | Grey, disabled, slight `cursor-not-allowed` | Open `ValidationReasonsSheet` (errors only) |
| **Loading** | Spinner + "Создание…" | No-op |

Both warning and error states surface the **same** `ValidationReasonsSheet` — the sheet shows both warnings and errors together, with errors styled red and warnings yellow. The badge on the CTA shows the total count.

### 3.4 Cost tooltip

The CTA shows `💎 N` inline. Tapping the cost (or hovering on desktop) shows a small popover:

```
💎 8 кредитов за эту генерацию
   • Базовая стоимость: 5
   • Референс аудио: +2
   • Персона: +1
```

Source: `generationCostBreakdown` from `useGenerateForm` (already exists per Sprint 054).

### 3.5 Advanced default state

In **custom mode**: Advanced section is **open by default** but visually subdued (opacity-90, thinner border). Rationale: this is the advanced user's primary flow — they should see the controls without having to discover them.

In **simple mode**: Advanced is hidden entirely (current behavior).

---

## 4. Lyrics Input Flow

### 4.1 Section model

`useLyricsSections` parses the existing plain-text lyrics format (e.g., `"[Verse]\nLine 1\nLine 2\n[Chorus]\n..."`) into structured sections on first render and serializes back to plain text on submit. This preserves compatibility with Suno API which expects plain-text lyrics with bracket section markers.

**Section types** (constant enum):
- `verse`, `chorus`, `bridge`, `pre-chorus`, `intro`, `outro`, `hook`, `custom`

**Default section label mapping** (used in dropdown and rendered badge):
- `verse` → "Куплет"
- `chorus` → "Припев"
- `bridge` → "Бридж"
- `pre-chorus` → "Предприпев"
- `intro` → "Интро"
- `outro` → "Аутро"
- `hook` → "Хук"
- `custom` → "Своя"

### 4.2 Lyrics section card UI

```
┌──────────────────────────────────────────────┐
│ ⋮⋮ [Куплет ▼]  ⓘ                       [×] │  ← drag handle + type dropdown + delete
├──────────────────────────────────────────────┤
│ Строка 1 стиха                              │
│ Строка 2 стиха                              │  ← textarea, auto-grow
│ Строка 3 стиха                              │
└──────────────────────────────────────────────┘
```

- Drag handle `⋮⋮` is 44×44px (touch target), shows grab cursor.
- Type dropdown opens a popover with section type list (8 options) + custom label input.
- ⓘ shows section info ("Verse — основная часть песни, повторяется несколько раз").
- `×` removes the section after confirmation if content is non-empty.
- Textarea auto-grows up to 8 lines, then scrolls.
- Sections render with smooth `framer-motion` `layout` animation on reorder/add/remove.

### 4.3 Lyrics toolbar

```
┌──────────────────────────────────────────────────────────────┐
│ 🤖 [AI-помощник]  📋 [Шаблоны]  📊 [94 строки · ~3:12]      │
└──────────────────────────────────────────────────────────────┘
```

- **🤖 AI-помощник** → opens `LyricsAssistantSheet` (bottom sheet).
- **📋 Шаблоны** → opens popover with 4 templates: Pop Standard, Ballad, EDM, Custom.
- **📊 Stats** → passive label showing live stats: `sections.length` строк / `stats.totalLines` строк · `formatDuration(stats.estimatedDurationSeconds)`.

Duration estimation: `Math.round((totalChars / 12) / 60 * 60)` seconds (12 chars/sec ≈ typical sung Russian text; tuneable constant).

### 4.4 Templates (`LyricsSectionTemplates`)

In-memory constant array:

```typescript
export const LYRICS_TEMPLATES: Template[] = [
  {
    id: 'pop-standard',
    label: 'Pop Standard',
    sections: [
      { type: 'verse' }, { type: 'chorus' },
      { type: 'verse' }, { type: 'chorus' },
      { type: 'bridge' }, { type: 'chorus' },
    ],
  },
  {
    id: 'ballad',
    label: 'Ballad',
    sections: [
      { type: 'intro' }, { type: 'verse' }, { type: 'chorus' },
      { type: 'verse' }, { type: 'chorus' }, { type: 'outro' },
    ],
  },
  {
    id: 'edm',
    label: 'EDM',
    sections: [
      { type: 'intro' }, { type: 'verse' }, { type: 'chorus' },
      { type: 'verse' }, { type: 'chorus' }, { type: 'outro' },
    ],
  },
  {
    id: 'custom',
    label: 'Custom (пустая структура)',
    sections: [{ type: 'verse' }],
  },
];
```

When the user picks a template with existing content, show a confirmation dialog: "Заменить текущие секции на шаблон «Pop Standard»? Существующий текст будет потерян."

### 4.5 Drag-reorder

Use `@dnd-kit/core` + `@dnd-kit/sortable` (battle-tested, ~12 KB gzip total, accessibility-ready).

- Sortable strategy: `verticalListSortingStrategy`.
- Keyboard reordering: arrow up/down (built-in via `KeyboardSensor`).
- Touch sensor with 8px activation distance (avoids accidental drags while typing).
- Animations via `motion.div layout` — sections smoothly slide into their new positions.

### 4.6 Lyrics Assistant bottom sheet

Replaces `LyricsChatAssistant.tsx` (Dialog) with `LyricsAssistantSheet.tsx` (bottom sheet via `vaul`).

```
┌──────────────────────────────────────────────────────────┐
│ ←  🤖 AI-помощник                              [Готово] │ ← header
├──────────────────────────────────────────────────────────┤
│ ┌─ Ваш текущий текст (превью, тап для скрытия) ──────┐│
│ │ [Verse 1]                                           ││
│ │ Строка 1 стиха...                                  ││
│ │ Строка 2 стиха...                                  ││
│ │ ...ещё 3 секции                                    ││
│ └─────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Чат ──────────────────────────────────────────────┐ │
│ │ [AI]: Привет! О чём ваша песня?                    │ │
│ │ [You]: О потере близкого                            │ │
│ │ [AI]: Вот черновик припева...                       │ │
│ │ [📥 Применить к Verse 2] [📥 Создать новую]         │ │
│ └─────────────────────────────────────────────────────┘│
│                                                          │
│ [Что вы хотите дальше? _______________] [📤]            │ ← input
└──────────────────────────────────────────────────────────┘
```

Behavior:
- **Preview row** is collapsible (tap to hide/show).
- **📥 Применить к Verse 2** → writes AI suggestion into that specific section's textarea, sheet stays open for follow-up.
- **📥 Создать новую** → adds a new section with type `custom`, content = AI suggestion.
- **Готово** or swipe-down → sheet closes, focus returns to form, all suggestions already applied (no double-apply).
- Telegram MainButton is hidden while sheet is open (already current behavior).

---

## 5. Advanced Settings + Validation UX

### 5.1 Card-based AdvancedSettings

```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️  Расширенные настройки                              ▾   │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🎚  Влияние стиля                       60%         │    │
│  │ ▔▔▔▔▔▔○───────────────────                            │    │
│  │ ℹ️ Как сильно AI следует описанию стиля               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🎲  Креативность                        70%         │    │
│  │ ▔▔▔▔▔▔▔○──────────────────                            │    │
│  │ ℹ️ Насколько неожиданные решения допускаются          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🎤  Пол вокала                       [Любой ▾]      │    │
│  │ ℹ️ Женский/мужской вокал или авто-выбор              │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🎯  Сила персоны   [показан только если есть артист]  │    │
│  │ ▔▔○──────────────                                     │    │
│  │ ℹ️ Как точно копировать стиль выбранного артиста       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🚫  Исключить                                          │    │
│  │ [piano, drums, autotune_____________________]          │    │
│  │ ℹ️ Теги, которые AI будет избегать в генерации         │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

Each card is a `<fieldset>` for accessibility (one per parameter group). The ℹ️ icon opens a `Popover` (Radix) with a longer description. Sliders retain their current labels.

### 5.2 Validation behavior

**CTA tap (with reasons):**

1. Compute `reasons` reactively from form state.
2. If `canGenerate === true` and no warnings → submit immediately.
3. If `canGenerate === true` and warnings exist → submit immediately AND show a transient toast "Сгенерировано с предупреждениями" with a tap-to-view-reasons action (3 sec timeout).
4. If `canGenerate === false` → open `ValidationReasonsSheet` (always shows errors; warnings shown only if present and explanatory).

**ValidationReasonsSheet UI:**

```
┌──────────────────────────────────────────────┐
│  Чтобы сгенерировать трек                    │
├──────────────────────────────────────────────┤
│  ❌  Опишите стиль трека                     │
│      Например: «indie rock, energetic»       │
│      [Перейти к полю]                        │
│                                              │
│  ❌  Недостаточно кредитов                  │
│      Нужно: 8 · Доступно: 3                 │
│      [Купить кредиты]                        │
│                                              │
│  ⚠️  Название не заполнено                   │
│      Без названия сложнее найти трек         │
│                                              │
│                       [Закрыть]              │
└──────────────────────────────────────────────┘
```

- `[Перейти к полю]` calls `reason.deepLink()` — scrolls the field into view, focuses it, fires `hapticFeedback("light")`.
- `[Купить кредиты]` opens the existing credit purchase flow (TBD: link target).
- "Закрыть" is the dismiss action.

### 5.3 Visual feedback for fields with errors

When a field has an error reason, render it with a subtle red border (`border-destructive/60`) and an inline icon (⚠️) to the right. This is independent of the sheet — the field shows red while typing, and the sheet appears on CTA tap. Errors clear automatically when the field becomes valid.

---

## 6. Cleanup, Testing, Migration

### 6.1 Cleanup (delete dead code)

**Files to delete:**
- `src/components/generate-form/wizard/GenerationWizard.tsx`
- `src/components/generate-form/wizard/WizardProgress.tsx`
- `src/components/generate-form/wizard/index.ts`
- `src/components/generate-form/wizard/steps/IdeaStep.tsx`
- `src/components/generate-form/wizard/steps/IdeaStyleCombinedStep.tsx`
- `src/components/generate-form/wizard/steps/LyricsStep.tsx`
- `src/components/generate-form/wizard/steps/PreviewStep.tsx`
- `src/components/generate-form/wizard/steps/SettingsStep.tsx`
- `src/components/generate-form/wizard/steps/StyleSettingsStep.tsx`
- `src/components/generate-form/wizard/steps/StyleStep.tsx`
- `src/components/generate-form/wizard/steps/VocalsStep.tsx`
- `src/components/generate-form/wizard/steps/VocalsGenerateStep.tsx`
- `src/components/generate-form/wizard/steps/VocalsLyricsStep.tsx`

**Audit before deletion:** run `grep -r "from.*wizard/" src/` and verify zero callers. Confirm with `npm run build`.

**Audit candidate (delete OR keep):**

- `src/components/generate-form/lyrics-wizard/ConceptStep.tsx` — verify callers; if unused, delete.
- `src/components/generate-form/LyricsVisualEditorCompact.tsx` — compare to new `LyricsVisualEditor.tsx`; if duplicate, delete.

**Verify before deleting `LyricsVisualEditorCompact.tsx`:**

The file may be used in tests under `tests/unit/components/lyrics/LyricsVisualEditorCompact.templates.test.tsx` (per graphify query output). Audit all references first:

```bash
grep -rn "LyricsVisualEditorCompact" src/ tests/
```

If tests rely on the file, either: (a) port tests to `LyricsVisualEditor.tsx` and delete, or (b) keep `LyricsVisualEditorCompact.tsx` as a deprecated wrapper that calls into the new editor. Decision goes in the implementation plan.

### 6.2 Refactor: split `useGenerateForm.ts` (1023 lines)

Split into 3 hooks (no behavior change, same public API for backward compat):

1. **`useGenerateFormState.ts`** — state declarations, setters, derived getters (style, lyrics, title, mode, model, vocalGender, weight sliders, negativeTags, etc.).
2. **`useGenerateFormActions.ts`** — async actions: `handleGenerate`, `handleBoostStyle`, `saveDraft`, `clearDraft`, `resetForm`, `setAudioFile`, `setSelectedArtistId`, `setSelectedProjectId`.
3. **`useGenerateFormValidation.ts`** — `canGenerate`, `generationCost`, `generationCostBreakdown`, `userBalance`.

**Public API:** existing `useGenerateForm()` signature stays the same — it now internally calls the three split hooks and merges their returns. Existing 47 E2E specs and 292 unit tests pass without changes.

**Acceptance:** no file > 500 LOC after split.

### 6.3 Test plan

**Unit (Vitest):**

| File | Cases |
|------|-------|
| `useGenerateSheetValidation.test.ts` | All 10 validation rules, severity mapping, canGenerate state |
| `useLyricsSections.test.ts` | Parse plain text → sections, serialize back, add/remove/reorder, templates |
| `LyricsSectionTemplates.test.ts` | Template structure (sections count + types) |
| `useGenerateSheetController.test.ts` | Dialog state toggles, telegram buttons integration, draft save wiring |
| `useGenerateFormValidation.test.ts` | generationCost calculation, cost breakdown, canGenerate |
| `ValidationReasonsSheet.test.tsx` | Render reasons, deep-link callbacks, severity styling |
| `LyricsVisualEditor.test.tsx` | Add/remove/drag (simulate keyboard reorder) |
| `AdvancedSettings.test.tsx` | Card rendering, info popover, conditional audio weight |

**Storybook (target: 12 stories):**

- `GenerateSheet.stories.tsx`: Default / Simple mode / Custom mode / Loading / Disabled (5)
- `LyricsVisualEditor.stories.tsx`: Empty / Pop Template / Custom sections / Drag demo (4)
- `AdvancedSettings.stories.tsx`: Closed / With persona (2)
- `ValidationReasonsSheet.stories.tsx`: Errors only / Errors + Warnings (2)
- `LyricsAssistantSheet.stories.tsx`: Empty chat / With preview + suggestion (2)
- `ReferenceChipsRow.stories.tsx`: Empty / All selected / Overflow (3)
- **Total: 18 stories** (target was 12, padded up).

**E2E (Playwright):**

| Spec | Coverage |
|------|----------|
| `tests/e2e/generation-sheet-redesign.spec.ts` | Open → simple → toggle custom → add 2 sections → drag-reorder → valid → submit |
| `tests/e2e/generation-validation.spec.ts` | Disabled CTA → tap → bottom sheet → fill field → submit |
| `tests/e2e/lyrics-assistant-sheet.spec.ts` | Open assistant → chat → apply suggestion → close → see updated text |
| `tests/e2e/reference-chips.spec.ts` | Empty → select project + artist → remove → overflow → submit |

**Regression:** all existing 47 E2E specs + 292 unit tests must pass.

**Coverage targets:**
- `useGenerateSheetValidation`: 100% branch coverage (small hook, high payoff).
- `useLyricsSections`: 90% branch coverage.
- New components: ≥ 80% line coverage.

### 6.4 Migration: Strangler Fig Pattern

Three-phase rollout to avoid big-bang replacement and enable rollback.

**Phase 1 (Sprint 1, ~5 working days) — Foundation (parallel to existing):**
- Add new files: `generate-sheet/*`, `generate-form/lyrics/*`, hooks.
- Do **not** touch `GenerateSheet.tsx` or `useGenerateForm.ts` yet.
- Add unit + Storybook tests for new files.
- All tests pass; new components render in Storybook; nothing user-visible changes.

**Phase 2 (Sprint 2, ~5 working days) — Connect (behind feature flag):**
- Modify `GenerateSheet.tsx` to import new components behind `useFeatureFlag('generate-sheet-redesign')`.
- New layout is opt-in. Existing layout remains default.
- Verify no regression on existing E2E suite.
- Enable flag in dev/staging only.
- Manual QA on Telegram iOS + Android (Pixel 5 + iPhone 12).

**Phase 3 (Sprint 3, ~3-5 days) — Rollout:**
- A/B via feature flag with gradual rollout: 10% → 50% → 100% over 3-5 days.
- Monitor metrics (see §6.5).
- Auto-rollback if error rate > +5% vs baseline or completion rate drops > 10%.
- After 100%, delete the old component tree (`GenerateFormActions`, `GenerateFormReferences` standalone usage) and dead wizard/ files.

**Feature flag implementation:**

```typescript
// src/lib/feature-flags.ts (existing pattern)
export const GENERATE_SHEET_REDESIGN_ENABLED = {
  default: false,
  storageKey: 'ff.generate-sheet-redesign',
  environments: {
    dev: 1.0,
    staging: 1.0,
    prod: { start: 0.1, rampTo: 1.0, rampDays: 5 },
  },
};
```

**Rollback:** set flag env-var override to 0% in `Vercel` → instant rollback to old layout, no code revert needed.

### 6.5 Analytics & success metrics

**New events (fired via `useFeatureUsageTracking`):**

| Event | Properties |
|-------|------------|
| `form_section_collapse` | `{ section: 'lyrics' \| 'advanced' \| 'reference', open: boolean }` |
| `lyrics_section_add` | `{ type: SectionType, source: 'button' \| 'template' }` |
| `lyrics_section_remove` | `{ type: SectionType, hadContent: boolean }` |
| `lyrics_section_reorder` | `{ fromIndex: number, toIndex: number }` |
| `lyrics_template_apply` | `{ templateId: string, hadExisting: boolean }` |
| `validation_reasons_viewed` | `{ reasonCount: number, errorCount: number, warningCount: number }` |
| `validation_field_jump` | `{ field: ValidationField }` |
| `advanced_settings_used` | `{ param: 'styleWeight' \| 'weirdnessConstraint' \| 'audioWeight' \| 'vocalGender', value: number }` |
| `lyrics_assistant_apply_suggestion` | `{ target: 'existing' \| 'new' }` |
| `reference_chip_select` | `{ kind: 'project' \| 'artist' \| 'audio' \| 'voice' }` |
| `reference_chip_remove` | `{ kind, id }` |
| `generation_completed_time` | `{ seconds: number, hasWarnings: boolean }` |

**Target KPIs (after 14 days at 100% rollout):**

| KPI | Baseline | Target | Source |
|-----|----------|--------|--------|
| Completion rate (open → submit) | TBD (instrument in Phase 1) | +15% | `form_open` + `generation_submitted` events |
| Time-to-generate (first-time users) | TBD | -25% | `form_open` → `generation_completed_time` |
| Draft save rate | TBD | +30% | `form_save_draft` events |
| Lyrics abandonment rate | TBD | -40% | `form_open` with `mode='custom'` + `generation_submitted` with empty lyrics |
| Form error rate (post-submit failures) | TBD | -20% | `generation_failed` after validation reasons viewed |
| Bundle size | 508 KB gzip | < 540 KB gzip | `npm run size` |

If any KPI moves **against** the target by > 10% during rollout, auto-rollback.

### 6.6 Bundle impact

| Change | Size (gzip) |
|--------|-------------|
| `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | +12 KB |
| LyricsSectionTemplates (in-memory) | +2 KB |
| Validation hook + UI | +3 KB |
| Refactored AdvancedSettings (card-based) | +1 KB |
| Reduced code from dead wizard/ deletion | -8 KB |
| Net new | **+10 KB** |

Pre-rollout bundle: 508 KB gzip → post-rollout: ~518 KB gzip. Well within 950 KB limit.

---

## 7. Out of scope

The following items are **explicitly NOT** in this spec and should be considered for separate brainstorming later:

- Changing the Suno API request/response contract.
- Modifying the Telegram bot command handlers in `supabase/functions/telegram-bot/`.
- Adding new generation modes (mashup, persona, voice cloning already shipped in Sprint 052+).
- Mobile app (native iOS/Android) — out of scope for Telegram Mini App.
- A/B testing framework replacement — using existing `useFeatureFlag` hook.
- Localization beyond Russian — current `messageRu` field is a fallback; full i18n integration is a separate spec.

---

## 8. Open questions

None — all decisions made during brainstorming:

| Question | Decision |
|----------|----------|
| Scope | Full UX audit + redesign |
| Primary goal | Lower barrier for new users |
| Two modes (simple/custom) | Keep toggle |
| AI assistant pattern | Bottom sheet with preview row |
| Architecture | Decomposition + UX polish |
| Lyrics assistant | LyricsChatAssistant → LyricsAssistantSheet (bottom sheet via vaul) |
| Drag library | @dnd-kit/sortable |
| Advanced default state | Open in custom mode, subdued visually |
| Dead code | Delete wizard/ after Sprint 1 audit |

---

## 9. Acceptance criteria

The spec is considered implemented when **all** of the following are true:

1. ✅ `GenerateSheet.tsx` ≤ 200 LOC.
2. ✅ `useGenerateForm.ts` split into 3 files, each ≤ 500 LOC.
3. ✅ `wizard/` directory deleted from git history.
4. ✅ All 10 validation rules implemented and tested.
5. ✅ All 4 lyrics templates ship and apply correctly.
6. ✅ Drag-reorder works with both touch and keyboard.
7. ✅ `LyricsAssistantSheet` is a bottom sheet (not a dialog) with preview row.
8. ✅ `AdvancedSettings` is card-based with ℹ️ popovers.
9. ✅ Reference row consolidates actions + chips into one row.
10. ✅ 12+ Storybook stories exist for new components.
11. ✅ All 47 existing E2E specs + 292 unit tests pass.
12. ✅ New E2E specs (4 files) added and pass.
13. ✅ Bundle ≤ 540 KB gzip.
14. ✅ Feature flag rollout reaches 100% with no auto-rollback.
15. ✅ KPIs measured for 14 days; ≥ 3 of 5 hit target.
