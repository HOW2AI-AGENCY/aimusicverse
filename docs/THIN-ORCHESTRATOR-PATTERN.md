# Thin Orchestrator Pattern

**GenerateSheet decomposition — Sprint 056**

## Overview

GenerateSheet uses a "thin orchestrator" pattern where the main component delegates responsibility to specialized sub-components. The orchestrator owns state management and event routing but delegates rendering to focused components.

## Architecture

```
GenerateSheet (orchestrator)
├── GenerateSheetHeader (balance, mode, model, history)
├── GenerateSheetBody (prompt, lyrics, references, advanced)
├── GenerateSheetFooter (generate, save draft, cost summary)
└── GenerateSheetDialogs (project, artist, audio, voice, history, styles)
```

## Benefits

1. **Single Responsibility** — each component has one clear job
2. **Composition over Inheritance** — components assembled from smaller blocks
3. **Props-Driven Interface** — all control through props, minimal internal state
4. **Improved Testability** — sub-components testable in isolation
5. **Reusability** — sub-components usable in other contexts

## Implementation

```tsx
// GenerateSheet — thin orchestrator
export function GenerateSheet({ value, onChange }: Props) {
  const controller = useGenerateSheetController(value, onChange);

  return (
    <Sheet>
      <GenerateSheetHeader {...controller.headerProps} />
      <GenerateSheetBody {...controller.bodyProps} />
      <GenerateSheetFooter {...controller.footerProps} />
      <GenerateSheetDialogs {...controller.dialogProps} />
    </Sheet>
  );
}
```

## Key Principles

- Orchestrator owns state via `useGenerateSheetController` hook
- Sub-components receive props, never reach into parent state
- Dialogs managed centrally but rendered by specialized components
- Validation logic extracted to `useGenerateSheetValidation` hook

## Related Files

- `src/components/generate-form/GenerateSheet.tsx` — orchestrator
- `src/hooks/useGenerateSheetController.ts` — state management
- `src/hooks/useGenerateSheetValidation.ts` — validation logic
- `docs/COMPONENTS.md` — component architecture overview
