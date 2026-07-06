# GenerateSheet Redesign — Design Review

**Date:** 2026-07-06
**Scope:** Sprint-056 `generate-sheet-redesign` (merged at `6e150b44`)
**Reviewer:** `/plan-design-review` (post-hoc critique of shipped UI)
**Overall rating:** **6/10** — strong shell and header, leaky body wiring and edge cases

## What was reviewed

Files in the redesign shell:

- `src/components/GenerateSheet.tsx` (orchestrator)
- `src/components/generate-sheet/GenerateSheetHeader.tsx`
- `src/components/generate-sheet/GenerateSheetBody.tsx`
- `src/components/generate-sheet/GenerateSheetFooter.tsx`
- `src/components/generate-sheet/GenerateSheetDialogs.tsx`
- `src/components/generate-sheet/ReferenceChipsRow.tsx`
- `src/components/generate-form/CollapsibleFormHeader.tsx`
- `ADR/ADR-012-GENERATION-FORM-COMPACT-UI.md`

No `DESIGN.md` exists in the repo. Flag that separately: all design decisions currently calibrate against nothing.

## Findings summary

| #   | Sev | Area                  | File:line                                          | One-line fix                                                                             |
| --- | --- | --------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| F1  | P1  | Functional regression | `GenerateSheetBody.tsx:71,103`                     | Wire `onOpenStyles={controller.actions.openStyles}` — the Styles button is a no-op today |
| F2  | P1  | Visible data bug      | `GenerateSheetBody.tsx:50-51`                      | Resolve chip labels from `projects`/`artists` lists (UUID shown today)                   |
| F3  | P2  | Misleading signal     | `GenerateSheet.tsx:183`                            | Drive `Progress` from real progress, or remove it (hardcoded `value={33}`)               |
| F4  | P2  | Edge case             | `GenerateSheet.tsx:141`                            | Treat `userBalance === undefined` as loading, not `0`                                    |
| F5  | P2  | Accessibility / touch | `ReferenceChipsRow.tsx:56,78`                      | `h-10` (40px) → `h-11` (44px) to meet project standard                                   |
| F6  | P2  | Invalid DOM / a11y    | `GenerateSheetFooter.tsx:76-85`                    | Move the cost `Popover` out of the primary `<Button>` (nested `<button>`)                |
| F7  | P2  | Interaction clarity   | `GenerateSheetFooter.tsx:57`                       | Signal that the dimmed CTA is tappable for an explanation                                |
| F8  | P2  | Accessibility / focus | `ReferenceChipsRow.tsx`, `GenerateSheetFooter.tsx` | Add `focus-visible:ring-*` styles                                                        |
| F9  | P3  | Legibility            | header/footer                                      | Raise `text-[10px]/[11px]` to `text-xs`; audit contrast                                  |
| F10 | P3  | Redundancy            | `GenerateSheet.tsx:152-185`                        | Pick one loading signal; drop the duplicate                                              |
| F11 | P2  | Interaction clarity   | `GenerateSheet.tsx` mode-forcing paths             | Surface the silent simple→custom switch                                                  |
| F12 | P2  | Empty state           | `GenerateSheetBody.tsx`                            | Wire `SmartPromptSuggestions` / `inspirationPrompts` into the blank simple form          |
| F13 | P3  | i18n                  | all strings                                        | Localize; at minimum fix the English "Voice clone" chip now                              |

## Detail and fix sketches

### F1 — Styles button is a dead link (P1, regression)

`GenerateSheetBody.tsx:71` and `:103` both pass `onOpenStyles={() => undefined}`. The form still renders the "Стили" action button (`FormFieldActions.tsx:185`, `GenerateFormSimple.tsx:118`) because the prop is truthy, but tapping it does nothing. The `StylePresetSelector` dialog (`GenerateSheetDialogs.tsx:277`) is rendered but can never open.

The legacy sheet wired this correctly: `GenerateSheet.legacy.tsx:380` `onOpenStyles={() => setStylesOpen(true)}`, and the controller already exposes `openStyles = useCallback(() => setStylesOpen(true), [])` at `useGenerateSheetController.ts:269`.

**Fix:** in `GenerateSheet.tsx`, pass the Body `onOpenStyles={controller.actions.openStyles}` (or inline `() => controller.dialogs.styles.setOpen(true)`); thread it through `GenerateSheetBody` to both `GenerateFormSimple` and `GenerateFormCustom`. Add a test asserting the dialog opens on click.

### F2 — Reference chips show raw UUIDs (P1, visible data bug)

`GenerateSheetBody.tsx:50-51`:

```ts
project: form.selectedProjectId ? { id: form.selectedProjectId, label: form.selectedProjectId } : undefined,
artist:  form.selectedArtistId  ? { id: form.selectedArtistId,  label: form.selectedArtistId  } : undefined,
```

`label` is the database ID. The chip (`ReferenceChipsRow.tsx:62`, `max-w-[140px] truncate`) shows a truncated UUID. The `projects`/`artists` lists are already in the orchestrator (`GenerateSheet.tsx:49-50`) and passed to `GenerateSheetDialogs`; the project title lookup already exists at `GenerateSheetDialogs.tsx:217`.

**Fix:** resolve labels in the orchestrator (or thread `projects`/`artists` into `GenerateSheetBody`) and pass `{ id, label: project.title }` / `{ id, label: artist.<displayName> }`. Audio (`form.audioFile.name`) is already correct. Voice ships the English string "Voice clone" — see F13.

### F3 — Fake progress bar (P2)

`GenerateSheet.tsx:183` `<Progress value={33} className="h-0.5" />` is static. A bar frozen at 33% for the whole generation reads as stalled.

**Fix:** drive it from real progress if the controller tracks it (`controller.form.<progressPct>`), or remove the bar and rely on the `GenerationLoadingState` overlay plus the Telegram main-button spinner. The team has done this correctly before: `docs/superpowers/plans/2026-07-02-generation-and-player-fixes.md:304` used `value={overallProgress}`.

### F4 — Balance flashes a false zero (P2)

`GenerateSheet.tsx:141` passes `balance: controller.form.userBalance ?? 0`. While the balance query loads, `CollapsibleFormHeader` computes `lowBalance = balance < cost` and renders the destructive (red) pill with "0 / 12".

**Fix:** pass the `undefined` through (`balance: controller.form.userBalance`) and have `CollapsibleFormHeader` render a skeleton/`…` when `balance === undefined`; apply `lowBalance` styling only for a known number below `cost`.

### F5 — Touch targets below the project's own 44px mandate (P2)

`ReferenceChipsRow.tsx:56,78` chips are `h-10` (40px). `CLAUDE.md` states 44px minimum (iOS HIG). The header nails this (`CollapsibleFormHeader.tsx:99,130,149,194` all `min-h-[44px]`); the body doesn't.

**Fix:** chip `h-10` → `h-11`. Cheap, one component.

### F6 — Nested `<button>` is invalid DOM (P2)

`GenerateSheetFooter.tsx:76-85`: the primary CTA is a `<Button>`, and inside it a `PopoverTrigger asChild` renders a `<button>`. HTML disallows button-in-button; browsers handle it inconsistently and the accessibility tree breaks.

**Fix:** move the cost breakdown out of the CTA. Render the cost as plain text on the CTA and put the breakdown `Popover` on a separate small trigger beside or below it.

### F7 — Dimmed CTA looks disabled but is active (P2)

`GenerateSheetFooter.tsx:57` applies `opacity-50` when `!canGenerate && !loading`, but `onClick={props.canGenerate ? props.onGenerate : props.onShowReasons}` still fires and opens `ValidationReasonsSheet`. The "tap the disabled-looking button to learn why" pattern is good — but with no hint, users won't try the tap.

**Fix:** add signaling — e.g., a small "ℹ почему нельзя?" subtitle/link beside the CTA, or change the label to indicate it is tappable. Keep the reasons sheet as the destination.

### F8 — Missing focus-visible styles (P2)

Chips, the credit trigger, and several controls have no explicit `focus-visible:` styling. `CLAUDE.md` mandates visible focus indicators. Radix/shadcn defaults are not consistently applied here.

**Fix:** add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` consistently across interactive elements in `ReferenceChipsRow` and `GenerateSheetFooter`.

### F9 — Sub-12px text (P3)

`text-[10px]`, `text-[11px]` (footer summary/credit), `text-[9px]` (model cost), `text-[8px]` ("NEW" badge) in the header. Small text on small phones is a legibility risk.

**Fix:** raise body-adjacent sizes to `text-xs` (12px); reserve `<10px` for truly secondary badges and verify WCAG AA contrast at those sizes.

### F10 — Triple loading signal (P3)

Full-screen `GenerationLoadingState` overlay (`GenerateSheet.tsx:152-170`) + thin `Progress` bar (`:181-185`) + Telegram main-button spinner. Three signals for one state.

**Fix:** pick a primary (the overlay) and the Telegram button; drop the thin bar (or make it real per F3 and drop the overlay's redundancy).

### F11 — Silent simple → custom mode switch (P2)

Adding a reference forces `setMode("custom")` in several places (`GenerateSheet.tsx:134,147,152,170`; `GenerateSheetDialogs.tsx:118-124,133-143`). The user's simple-mode description field is displaced with no notice that the whole form mode changed under them. Some paths call `notify.success`, the chip add itself does not explain the jump.

**Fix:** when a reference forces the mode switch, surface it — a toast or an inline "Переключились в Полный режим" notice.

### F12 — No first-run empty state (P2)

In simple mode with empty description/title/style, the user sees blank inputs. `SmartPromptSuggestions` and `inspirationPrompts.ts` (33 KB) exist but are not wired into `GenerateSheetBody`. Per the project's own design principle ("empty states are features"), the first-run state deserves intention.

**Fix:** render a compact prompt-starter row (a few `inspirationPrompts` chips, or `SmartPromptSuggestions`) inside the simple-mode body when `description` is empty.

### F13 — i18n gap (P3)

All UI strings are hardcoded Russian ("Сгенерировать", "Черновик", "кредитов", "Закрыть форму?", …). The app already supports `language: "ru" | "en"` at the project level (`GenerateSheetDialogs.tsx:213`). The voice chip label "Voice clone" is English inside an otherwise-Russian surface — an internal inconsistency regardless of the broader i18n story.

**Fix (minimum now):** localize "Voice clone" → "Голос" for consistency. **Fix (larger):** extract the surface's strings and provide ru/en parity as its own task.

## What is working (credit)

- `CollapsibleFormHeader` — symmetric two-row hierarchy, 44px targets throughout, `aria-pressed` on the mode segmented control, low-balance visual state, accessible labels. ADR-012's compact-UI decisions landed well.
- Reference-chips information architecture (add/remove project / artist / audio / voice) is a strong pattern; only the label data is broken (F2).
- Keyboard-aware footer with `--tg-safe-area-inset-bottom` + `env(safe-area-inset-bottom)`; `useScrollLock`; Telegram main/secondary/back-button wiring. Proper Telegram citizen.
- Tap-disabled CTA → `ValidationReasonsSheet` ("tell them why") is good UX once F7 signals it.
- Credit-cost popover with itemized breakdown — transparent.
- `accessibleTitle="Создание музыки"` on a sheet that hides its visible title — correct a11y move.
- Haptics wired across chips, mode switch, references.

## Recommended fix order

1. **P1 cluster (half-day):** F1 + F2. Both are regressions from legacy, both are small, both are user-visible. Ship together with a regression test for the Styles dialog and a snapshot/assertion that chip labels are human strings.
2. **One-liners (1 hour):** F3 (real progress or remove), F4 (loading balance), F5 (44px chips). Trivial, high trust-per-effort.
3. **a11y cluster (half-day):** F6 (de-nest button) + F7 (signal dimmed-but-tappable) + F8 (focus-visible). Group because they all touch `GenerateSheetFooter` / `ReferenceChipsRow`.
4. **Design intent (1-2 days):** F12 (empty state with `SmartPromptSuggestions`), F11 (mode-switch signaling), F10 (loading signal dedupe).
5. **Polish (optional, half-day):** F9 (text sizing/contrast pass).
6. **Separate epic:** F13 (full ru/en i18n) — its own sprint, not a tag-along.

## Out of scope for this review

- The legacy `GenerateSheet.legacy.tsx` fallback (feature flag off). It diverges from the redesign and should be removed when the flag rolls to 100%.
- Deep visual mockups of the recommended fixes (option B in the review scope gate). Re-open `/plan-design-review` or `/design-review` if you want the empty-state and chip-layout directions visualized before implementation.
