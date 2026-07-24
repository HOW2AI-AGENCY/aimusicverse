<div align="center">

# 🧩 Component Architecture

**Основные компоненты MusicVerse AI и их архитектурные паттерны.**

<p>
  <a href="../DOCUMENTATION_INDEX.md">📚 Documentation Index</a> ·
  <a href="../ARCHITECTURE_HUB.md">🏗 Architecture Hub</a> ·
  <a href="PLAYER_ARCHITECTURE.md">🎵 Player Architecture</a>
</p>

</div>

---

## GenerateSheet Component Family

**Sprint 056 — Thin Orchestrator Pattern**

GenerateSheet представляет собой семейство компонентов following thin orchestrator pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    GenerateSheet                              │
│                    (Orchestrator)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   GenerateSheetHeader                  │  │
│  │  Balance · Mode · Model · History                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   GenerateSheetBody                    │  │
│  │  Prompt · Lyrics · References · Advanced              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   GenerateSheetFooter                 │  │
│  │  Generate · Save Draft · Cost Summary                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  GenerateSheetDialogs                 │  │
│  │  Project · Artist · Audio · Voice · History · Styles   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Single Responsibility** — Каждый компонент имеет одну четкую ответственность
2. **Composition over Inheritance** — Компоненты собираются из более мелких блоков
3. **Props-Driven Interface** — Все управление через props, минимальное внутреннее состояние
4. **Testability First** — Компоненты спроектированы для изолированного тестирования

---

## Storybook Documentation

**Sprint 056 — Complete Storybook Coverage**

Все редизайненные компоненты имеют интерактивную Storybook документацию с responsive/accessibility/interaction примерами.

### Storybook Files

- `GenerateSheet.stories.tsx` — 7 scenarios (default, modes, loading, responsive viewports)
- `AdvancedSettings.stories.tsx` — 6 scenarios (states, interaction examples)
- `LyricsAssistantSheet.stories.tsx` — 3 scenarios (chat states)
- `LyricsVisualEditor.stories.tsx` — 4 scenarios (editor states)
- `ReferenceChipsRow.stories.tsx` — 5 scenarios (reference combinations)
- `ValidationReasonsSheet.stories.tsx` — 6 scenarios (validation + accessibility)

**Run Storybook:** `npm run storybook` → `http://localhost:6006`

---

## Migration Guide

**Sprint 056 — GenerateSheet Redesign**

### Thin Orchestrator Pattern

GenerateSheet теперь тонкий оркестратор (~300 LOC vs ~800 LOC раньше):

**Key Changes:**

1. **No direct form props** — всё управляется через `useGenerateSheetController`
2. **Component splitting** — Header/Body/Footer/Dialogs отдельные компоненты
3. **Testability** — Каждый компонент тестируется изолированно
4. **Reusability** — Компоненты переиспользуются в других контекстах

**Before (Legacy):**

```typescript
<GenerateSheet
  open={open}
  mode="simple"
  prompt="pop song"
  onGenerate={handleGenerate}
/>
```

**After (New):**

```typescript
<GenerateSheet
  open={open}
  onOpenChange={setOpen}
  projectId={projectId} // optional
/>
```

---

## Related Documentation

- [ARCHITECTURE_HUB.md](../ARCHITECTURE_HUB.md) — System architecture
- [PLAYER_ARCHITECTURE.md](PLAYER_ARCHITECTURE.md) — Audio player
- [SPRINTS/SPRINT-056-PLAN.md](../SPRINTS/archived/SPRINT-056-PLAN.md) — Sprint plan

---

**Last Updated:** 2026-07-06 (Sprint 056 Phase D)
