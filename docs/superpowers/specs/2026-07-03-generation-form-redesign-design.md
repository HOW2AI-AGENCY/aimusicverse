---
title: Generation Form Redesign — Glass, Focus, Mobile
date: 2026-07-03
status: approved
sprint: 050
files_touched: 11
---

# Generation Form Redesign

## 1. Goal

Bring the Simple / Custom / Advanced generate-form surfaces to a single, professional, minimalist standard across desktop and Telegram mobile. Eliminate layout drift on overflow, unify interactive states, restore accessible focus and ARIA semantics, and stabilise sheet/dialog z-index on iOS Telegram WebApp.

User-facing wins (no marketing copy change):

- Textarea + counter never push the form off-screen; counter floats inside the field.
- Keyboard users see a visible focus ring on every interactive element (chips, toggles, sliders, mic).
- Voice / Instrumental is a real radio group with arrow-key navigation.
- The persona / project panel opens on top of the sheet on mobile without scrolling the form below.

Out of scope: copy changes, new fields, AI-generation logic, telemetry schema changes.

## 2. Files Touched

| Path | Type |
|------|------|
| `src/components/generate-form/FormSection.tsx` | refactor — glass card surface |
| `src/components/generate-form/SectionLabel.tsx` | tweak — keep hint button focus ring |
| `src/components/generate-form/GenerateFormSimple.tsx` | use TextareaWithOverlay + new toggle group |
| `src/components/generate-form/sections/StyleSection.tsx` | use TextareaWithOverlay |
| `src/components/generate-form/sections/VocalsToggle.tsx` | ARIA radio group + focus ring |
| `src/components/generate-form/sections/PrivacyToggle.tsx` | verify focus-visible on Switch |
| `src/components/generate-form/AdvancedSettings.tsx` | focus ring on vocal-gender buttons |
| `src/components/generate-form/GenerateFormActions.tsx` | confirm chip interactive contract |
| `src/components/generate-form/GenerateFormReferences.tsx` | verify dialog z-index parity |
| `src/components/GenerateSheet.tsx` | loading overlay z-index + scroll-lock on mobile |
| `src/components/ui/textarea-with-overlay.tsx` | **new** — composed field |
| `src/lib/utils.ts` | add `cnInteractive()` helper |

11 files total (10 modified, 1 new). All changes preserve Russian copy and existing prop contracts.

## 3. Design Tokens

### 3.1 `interactive-press` utility (new)

Single source of truth for hover / focus-visible / active feedback on form-level controls (chips, segmented buttons, toggles, action buttons). Lives in `src/lib/utils.ts` as `cnInteractive(opts?)`. Returns a Tailwind class string that combines:

- `transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out`
- `active:scale-[0.97]`
- `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background`
- `hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.35)]`

`opts` allows opting out per modifier (`{ hover: false }` for inline radio buttons where vertical lift is unwanted; `{ ring: 'destructive' }` for the destructive clear-X button).

This is purely additive; existing `Button` component is untouched.

### 3.2 `FormSection` glass-card surface

Current implementation: `<div className="space-y-2.5" />` — invisible wrapper.

New: optional elevated glass card.

```
<FormSection elevated className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-3.5 shadow-[0_1px_0_0_hsl(var(--border)/0.4)]">
```

When `elevated` is `false` (default for the Simple form so the page stays airy), behaviour is identical to today. `elevated` is `true` for the Custom mode "Cards on glass" treatment — wrapping the description block and the vocal toggle block. Glass tokens already live in `src/lib/design-tokens.ts` (`glass.subtle`); the new wrapper uses those same tokens via `cn()` for consistency.

## 4. `TextareaWithOverlay` Component

New file: `src/components/ui/textarea-with-overlay.tsx`.

API:

```ts
interface TextareaWithOverlayProps {
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  placeholder?: string;
  ariaLabel: string;
  ariaDescribedBy?: string;
  rows?: number;          // default 4
  overlayLeft?: ReactNode; // e.g. copy / clear buttons
  overlayRight?: ReactNode;// e.g. voice input
  invalid?: boolean;
  className?: string;
}
```

Layout:

```
┌──────────────────────────────────────────────┐
│ <textarea>                  ╳ maxLength = 500 │
│                                              │
│                overlay-left | 0/500 | right │
└──────────────────────────────────────────────┘
```

Counter is positioned absolutely at `bottom-2 right-3`, font `tabular-nums text-[11px]`, colour shifts:

- `text-muted-foreground` default
- `text-yellow-500` when `value.length > 400`
- `text-destructive` when `value.length > maxLength` (paired with `aria-invalid` + 1px destructive ring)

The textarea itself grows with content (no rows cap on grow), `min-h-[112px]`, but caps via `max-h-[40vh]` (or `max-h-[260px]` on compact mobile). When the cap is reached, internal `overflow-y-auto` engages — the parent FormSection does not move.

This replaces:

- Counter rendered below the textarea in `GenerateFormSimple.tsx:165-176`
- The absolute-bottom toolbar in `sections/StyleSection.tsx`

Both call sites become `<TextareaWithOverlay ... overlayLeft={...} overlayRight={...} />`.

## 5. `VocalsToggle` — Real Radio Group

Current `sections/VocalsToggle.tsx` is two plain buttons with no semantics.

New behaviour:

- Wrap in `<div role="radiogroup" aria-label="Тип трека">`
- Each option is `<button role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1}>`
- Arrow keys (`←` `→` `↑` `↓`) move selection; `Home`/`End` jump to first/last
- `Space`/`Enter` activates (already works on `<button>`)
- Both buttons get `cnInteractive({ hover: false })` — flat segmented control, no vertical lift
- Selected option: `bg-primary text-primary-foreground border-primary shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.45)]`
- Unselected: `bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground`
- Focus ring identical across both modes via the shared utility

`VoiceInputButton` already gets an `aria-label` from its props; ensure default props on every call site pass a Russian label: `"Голосовой ввод описания"` (description), `"Голосовой ввод стиля"` (style). Component signature unchanged.

## 6. Mobile z-index & Scroll-Lock

Current observed: sheet `z-50` loading overlay can compete with `UnifiedDialog` `z-[170]/z-[171]` modals opened from inside the sheet (project / persona picker).

Hierarchy (high → low):

| Layer | z-index |
|-------|---------|
| GenerateSheet loading overlay | `z-[60]` (raised from `z-50`) |
| Persona / Project picker (`UnifiedDialog variant="modal"`) | `z-[170]/z-[171]` (already correct) |
| GenerateSheet content | `z-40` |
| Player | `z-30` |
| App background | base |

Rules:

- When the persona / project dialog opens from inside the sheet, the sheet body must not scroll. Use `useScrollLock` on the sheet's scroll container for the duration the dialog is open.
- The dialog owns focus; trap focus with the existing `UnifiedDialog` primitive.
- On Telegram iOS, `body-scroll-lock` must be used (the `body` element, not the sheet root), because iOS Safari rubber-bands the root. Implement via the existing `src/hooks/useScrollLock.ts` hook (verify exists; create if not).

Padding: sheet footer gets `pb-[max(env(safe-area-inset-bottom),16px)]`; modal dialog content gets matching safe-area inset top/bottom.

## 7. Animations

Subtle (per user choice, 150–200ms):

- Section mount: existing `motion.div` key simple/custom unchanged.
- Chip / toggle hover: `scale(1.02)` on hover, `scale(0.97)` on press — driven by `cnInteractive()`.
- Counter colour shift: `transition-colors duration-150`.
- Glass-card `elevated` FormSection: enter fade `opacity 0 → 1` + `translateY 4px → 0`, `duration-200`.

No new animation libraries. All motion goes through `@/lib/motion` (already tree-shaken).

## 8. Accessibility

| Element | Today | After |
|---------|-------|-------|
| Vocal toggle | button with text only | `role="radio"` group, `aria-checked`, arrow-key roving |
| Mic button | labelled by context prop | explicit `aria-label` defaulted in `VoiceInputButton` |
| Vocal-gender buttons (Advanced) | no focus ring | `cnInteractive({ hover: false })` |
| Persona / project chips | has focus ring | unchanged — verified |
| Counter | aria-live polite when crossing thresholds | added (`aria-live="polite"`) |

All targets keep 44×44px minimum touch size. Contrast ratios verified at WCAG AA on dark + light themes via `axe-core` in unit tests.

## 9. Testing

Three layers:

1. **Unit (Vitest)** — new file `src/components/generate-form/__tests__/TextareaWithOverlay.test.tsx` covering:
   - counter colour thresholds (default / yellow / destructive)
   - counter does not push layout (`getBoundingClientRect` of parent stable on grow)
   - internal scroll engages at `max-h`
   - `aria-invalid` toggles past `maxLength`

2. **A11y (axe-core)** — extend `src/__tests__/generate-form.a11y.test.tsx` with VocalsToggle assertions:
   - each option has `role="radio"` and correct `aria-checked`
   - roving tabindex: exactly one button has `tabindex="0"`
   - focus ring visible (computed style `outline-style === 'solid'` after `:focus-visible` simulation via `userEvent.tab`)

3. **E2E (Playwright, mobile)** — add one scenario under `tests/e2e/mobile/generate-form.spec.ts`:
   - open GenerateSheet on iPhone 12 viewport
   - tap persona chip → dialog opens above sheet
   - assert dialog is visible AND sheet footer is not scrollable (overflow = hidden)
   - close dialog → sheet scrolls again
   - vocal toggle: arrow-key navigation moves selection

## 10. Risks

- **Bundle size**: +1 small component (~80 LOC), +1 utility. Expected delta < 1 KB gzipped. Bundle budget 950 KB unchanged.
- **iOS Safari scroll-lock**: a `useScrollLock` hook (≤30 LOC, isolated to `src/hooks/useScrollLock.ts`) is added in this sprint if not already present; it sets `overscroll-behavior: contain` on the sheet root and toggles `body { overflow: hidden }` while a dialog is open.
- **Existing tests**: `GenerateFormSimple` is exercised in `src/__tests__/generate-form.test.tsx`. Update role queries from `getByRole('button', { name: /вокал/i })` to `getByRole('radio', { name: /вокал/i })`.

## 11. Rollout

Single PR. No feature flag — pure UI polish. Roll back by reverting the merge commit.

Branch: `sprint-050/generation-form-redesign`.
Base: `main` @ current HEAD.

## 12. Definition of Done

- `npm run lint` — 0 new errors (existing 108 ESLint debt unchanged).
- `npm test` — 282 prior tests + 4 new pass.
- `npm run test:e2e:mobile` — new scenario passes on iPhone 12 + Pixel 5.
- `npm run size` — bundle ≤ 950 KB.
- axe-core: 0 serious / critical violations on the generate form.
- Visual review against `design-tokens.ts` `glass.subtle` palette on light + dark.
- Manual: open sheet, toggle vocal, fill description past 500 chars, open persona picker — no layout shift, focus ring always visible.
