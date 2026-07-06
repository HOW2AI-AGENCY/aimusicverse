# GenerateSheet Migration Guide

**Sprint 056 — Component Decomposition**

## What Changed

GenerateSheet was refactored from a monolithic ~800 LOC component to a thin orchestrator pattern with specialized sub-components.

## For Consumers

### No Breaking Changes

The public API of GenerateSheet remains unchanged:

```tsx
<GenerateSheet value={lyrics} onChange={setLyrics} onAIGenerate={handleAI} />
```

### Internal Architecture

If you were importing internal components or hooks:

1. **`useGenerateFormState`** → Now split into:
   - `useGenerateSheetController` — state management
   - `useGenerateSheetValidation` — validation logic

2. **`GenerateSheet` internals** → Now composed of:
   - `GenerateSheetHeader` — balance, mode selector, model picker
   - `GenerateSheetBody` — prompt input, lyrics editor, references
   - `GenerateSheetFooter` — generate button, save draft, cost summary
   - `GenerateSheetDialogs` — all dialog components

### For Storybook

New stories available for each sub-component:

```tsx
import { GenerateSheet } from "@/components/generate-form/GenerateSheet";
import { AdvancedSettings } from "@/components/generate-form/AdvancedSettings";
import { ReferenceChipsRow } from "@/components/generate-form/ReferenceChipsRow";
```

## Testing

Each sub-component can now be tested in isolation:

```tsx
render(<GenerateSheetHeader {...mockProps} />);
render(<GenerateSheetBody {...mockProps} />);
```

## Related Documentation

- [Thin Orchestrator Pattern](./THIN-ORCHESTRATOR-PATTERN.md)
- [Component Architecture](./COMPONENTS.md)
- [Sprint 056 Plan](../SPRINTS/SPRINT-056-PLAN.md)
