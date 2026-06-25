# Design Tokens — Matrix

Phase 1 deliverable for the UI unification (`.lovable/plan.md`). One source of
truth for every visual primitive. Source files:

- `src/index.css` — HSL CSS variables (light + dark) and motion durations.
- `tailwind.config.ts` — Tailwind class aliases that read those variables.
- `src/lib/design-tokens.ts` — TS constants mirroring the CSS values.
- `src/lib/glass.ts` — composed glassmorphism presets.

## Color & surface

| Use                                | CSS variable               | Tailwind class            |
| ---------------------------------- | -------------------------- | ------------------------- |
| Page background                    | `--background`             | `bg-background`           |
| Default text                       | `--foreground`             | `text-foreground`         |
| Card/container surface 1           | `--surface-1`              | `bg-surface-1`            |
| Nested surface 2                   | `--surface-2`              | `bg-surface-2`            |
| Nested surface 3 (inputs, chips)   | `--surface-3`              | `bg-surface-3`            |
| Muted text                         | `--muted-foreground`       | `text-muted-foreground`   |
| Primary brand action               | `--primary`                | `bg-primary text-primary-foreground` |
| Destructive action                 | `--destructive`            | `bg-destructive text-destructive-foreground` |
| Border                             | `--border`                 | `border-border`           |
| Focus ring                         | `--ring-focus`             | `ring-[hsl(var(--ring-focus))]` |
| Overlay scrim (dialogs, sheets)    | `--overlay-scrim`          | `bg-scrim`                |

## State tokens

Pair the background with its `-foreground` for accessible text contrast.

| State    | BG class                | FG class                          |
| -------- | ----------------------- | --------------------------------- |
| Success  | `bg-state-success`      | `text-state-success-foreground`   |
| Warning  | `bg-state-warning`      | `text-state-warning-foreground`   |
| Danger   | `bg-state-danger`       | `text-state-danger-foreground`    |
| Info     | `bg-state-info`         | `text-state-info-foreground`      |

## Spacing & sizing

| Concept                    | Token                           |
| -------------------------- | ------------------------------- |
| 4px base grid              | `--space-1 … --space-16`        |
| Min touch target           | `min-h-touch min-w-touch` (44px) |
| Comfortable touch target   | `min-h-touch-lg` (48px)         |
| Large touch target         | `min-h-touch-xl` (56px)         |
| Section padding (Tailwind) | `spacingClass.page` / `.section` from `design-tokens.ts` |

## Motion

CSS aliases used by `src/lib/motion-presets.ts`:

| Token            | Value   | Use                                                    |
| ---------------- | ------- | ------------------------------------------------------ |
| `--motion-fast`  | 100ms   | Hover/press micro-interactions, focus rings            |
| `--motion-base`  | 200ms   | Default UI transitions (enter/exit, color, transform)  |
| `--motion-slow`  | 300ms   | Sheet/dialog open, route transitions                   |

Always import animation variants from `@/lib/motion-presets`:

```ts
import { presets, transitions, interactiveTap } from '@/lib/motion-presets';
```

## Z-index

Use the semantic scale from `src/constants/z-index.ts` and the mirrored CSS
variables (`--z-sticky-header`, `--z-bottom-nav`, `--z-player`, …). Never
hardcode `z-[999]`.

## Forbidden in `src/components` & `src/pages`

- `text-white`, `text-black`, `bg-white`, `bg-black`
- Arbitrary hex literals: `bg-[#…]`, `text-[#…]`, `border-[#…]`
- Direct imports of `framer-motion` (use `@/lib/motion`) and `lucide-react`
  (use `@/lib/icons`). Already blocked by ESLint `no-restricted-imports`.
- Custom toasts via `sonner` directly — use `@/lib/toast` (`notify.success` etc).
- Bespoke confirm dialogs — use `useConfirm()` from `@/hooks/useConfirm`.

## How to add a new token

1. Add the HSL CSS variable to **both** `:root` and `.dark` blocks in
   `src/index.css`. Light/dark parity is mandatory.
2. Expose it in `tailwind.config.ts` under `theme.extend.colors` (or the
   matching section).
3. If it has a JS use site, mirror the value in `src/lib/design-tokens.ts`.
4. Document it in this file under the right table.
5. Do **not** introduce a Tailwind utility that bypasses the variable
   (`bg-[#abc123]`) — it will be flagged by the Phase 10 ESLint rule.
