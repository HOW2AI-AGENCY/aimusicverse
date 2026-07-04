# Generation Form Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Simple / Custom / Advanced generate-form surfaces to a single, professional, minimalist standard across desktop and Telegram mobile — eliminate layout drift on overflow, unify interactive states, restore accessible focus and ARIA semantics, stabilise sheet/dialog z-index on iOS Telegram WebApp.

**Architecture:** New `cnInteractive()` Tailwind utility in `src/lib/utils.ts` is the single source of truth for hover/focus-visible/active feedback. A new `TextareaWithOverlay` component composes textarea + floating counter + side overlays into one layout-stable field. `FormSection` grows an opt-in `elevated` glass-card variant. `VocalsToggle` becomes a real `role="radiogroup"` with roving tabindex. `useScrollLock` is added to lock the body while persona/project dialog is open. All changes preserve existing prop contracts and Russian copy.

**Tech Stack:** React 19 + TypeScript 5.9 + Tailwind CSS 3.4 + Radix UI; Vitest 4.x; Playwright 1.57; axe-core.

**Spec:** [docs/superpowers/specs/2026-07-03-generation-form-redesign-design.md](../specs/2026-07-03-generation-form-redesign-design.md)

## Global Constraints

- **Bundle budget:** 950 KB hard limit (`npm run size`). Do not regress.
- **TypeScript:** `tsc --noEmit` must remain 0 errors. Strict mode — no `any`.
- **ESLint:** 0 NEW errors introduced. Existing 108 / 1735 debt unchanged.
- **Locale:** All user-facing copy is Russian. Do not change copy.
- **Touch targets:** Minimum 44×44 px on every interactive element.
- **Motion:** All Framer Motion imports from `@/lib/motion` (tree-shaken wrapper). No new animation libraries.
- **Existing tests:** `src/__tests__/generate-form.test.tsx` queries `getByRole('button', { name: /вокал/i })`. After Task 5 these queries must change to `getByRole('radio', { name: /вокал/i })`.
- **Branch:** `sprint-050/generation-form-redesign` based on `main` at current HEAD.
- **Vitest globals:** `describe` / `it` / `expect` are global — no import needed.
- **Path alias:** `@/` → `./src/`.

---

## File Structure

### New files

- `src/components/ui/textarea-with-overlay.tsx` — composed textarea + floating counter + overlay slots.
- `src/hooks/useScrollLock.ts` — body scroll lock (≤30 LOC).

### Modified files

- `src/lib/utils.ts` — add `cnInteractive(opts?)` helper.
- `src/components/generate-form/FormSection.tsx` — opt-in `elevated` glass-card surface.
- `src/components/generate-form/SectionLabel.tsx` — preserve existing hint button focus ring.
- `src/components/generate-form/GenerateFormSimple.tsx` — replace inline counter with `TextareaWithOverlay`; replace inline vocal switch with `<VocalsToggle>` (already used in Custom).
- `src/components/generate-form/sections/StyleSection.tsx` — replace inline counter with `TextareaWithOverlay`.
- `src/components/generate-form/sections/VocalsToggle.tsx` — convert to `role="radiogroup"` with roving tabindex + `cnInteractive({ hover: false })`.
- `src/components/generate-form/sections/PrivacyToggle.tsx` — verify Switch focus-visible (no-op if present).
- `src/components/generate-form/AdvancedSettings.tsx` — apply `cnInteractive({ hover: false })` to vocal-gender buttons.
- `src/components/generate-form/GenerateFormActions.tsx` — switch chips to `cnInteractive()` (preserves existing hover translate).
- `src/components/generate-form/GenerateFormReferences.tsx` — verify dialog opens at z-170/171 (no-op if already correct).
- `src/components/GenerateSheet.tsx` — raise loading overlay to `z-[60]`, add safe-area footer padding, wire `useScrollLock` while any child dialog is open.
- `src/__tests__/generate-form.test.tsx` — update role queries from `button` → `radio` for vocal toggle (per spec §10).

### New tests

- `src/components/generate-form/__tests__/TextareaWithOverlay.test.tsx`
- `src/__tests__/generate-form.a11y.test.tsx`
- `tests/e2e/mobile/generate-form.spec.ts`

### Out of scope (DO NOT TOUCH)

- `Button` shadcn primitive.
- `dialog.tsx` / `alert-dialog.tsx` / `unified-dialog.types.ts` (z-index already correct).
- `playerStore`, `usePlayerStore` — z-30 baseline already correct.

---

## Task 1: `cnInteractive()` design-token utility

**Files:**

- Modify: `src/lib/utils.ts` (append helper at end of file)
- Test: `src/__tests__/cn-interactive.test.ts` (new)

**Interfaces:**

- Produces: `cnInteractive(opts?: { hover?: boolean; ring?: 'primary' | 'destructive' }): string` — returns Tailwind class string applied via `cn()`.

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/cn-interactive.test.ts
import { describe, it, expect } from "vitest";
import { cnInteractive } from "@/lib/utils";

describe("cnInteractive", () => {
  it("returns default interactive classes with hover and primary ring", () => {
    const classes = cnInteractive();
    expect(classes).toContain("transition-[transform,background-color,border-color,box-shadow]");
    expect(classes).toContain("duration-200");
    expect(classes).toContain("ease-out");
    expect(classes).toContain("active:scale-[0.97]");
    expect(classes).toContain("hover:-translate-y-0.5");
    expect(classes).toContain("focus-visible:ring-primary/60");
    expect(classes).not.toContain("hover:-translate-y-0.5 hover:hidden"); // sanity: not double
  });

  it("omits hover classes when hover=false", () => {
    const classes = cnInteractive({ hover: false });
    expect(classes).not.toContain("hover:-translate-y-0.5");
    expect(classes).toContain("active:scale-[0.97]");
  });

  it("uses destructive ring when ring=destructive", () => {
    const classes = cnInteractive({ ring: "destructive" });
    expect(classes).toContain("focus-visible:ring-destructive/60");
    expect(classes).not.toContain("focus-visible:ring-primary/60");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- cn-interactive`
Expected: FAIL with "Cannot find module '@/lib/utils'" or "cnInteractive is not a function".

- [ ] **Step 3: Append `cnInteractive` to `src/lib/utils.ts`**

Open `src/lib/utils.ts`, find the last export, then append:

```ts
/**
 * Single source of truth for hover / focus-visible / active feedback on
 * form-level controls (chips, segmented buttons, toggles, action buttons).
 *
 * @param opts.hover  Include hover lift + glow. Default true. Disable for
 *                    inline radio buttons where vertical lift is unwanted.
 * @param opts.ring   Focus ring colour. Default 'primary'.
 */
export function cnInteractive(opts?: { hover?: boolean; ring?: "primary" | "destructive" }): string {
  const hover = opts?.hover ?? true;
  const ringColour =
    (opts?.ring ?? "primary") === "destructive" ? "focus-visible:ring-destructive/60" : "focus-visible:ring-primary/60";

  const classes = [
    "transition-[transform,background-color,border-color,box-shadow]",
    "duration-200",
    "ease-out",
    "active:scale-[0.97]",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    ringColour,
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",
  ];

  if (hover) {
    classes.push("hover:-translate-y-0.5", "hover:shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.35)]");
  }

  return classes.join(" ");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- cn-interactive`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils.ts src/__tests__/cn-interactive.test.ts
git commit -m "feat(utils): add cnInteractive helper for unified form focus state"
```

---

## Task 2: `useScrollLock` hook

**Files:**

- Create: `src/hooks/useScrollLock.ts`
- Test: `src/__tests__/useScrollLock.test.ts` (new)

**Interfaces:**

- Produces: `useScrollLock(active: boolean): void` — locks `<body>` overflow while `active === true`. Restores prior overflow on unmount or when `active` flips to false.

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/useScrollLock.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollLock } from "@/hooks/useScrollLock";

describe("useScrollLock", () => {
  const original = document.body.style.overflow;
  afterEach(() => {
    document.body.style.overflow = original;
  });

  it("sets body overflow to hidden when active=true", () => {
    renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does not change overflow when active=false", () => {
    document.body.style.overflow = "auto";
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe("auto");
  });

  it("restores prior overflow on unmount", () => {
    document.body.style.overflow = "scroll";
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useScrollLock`
Expected: FAIL with "Cannot find module '@/hooks/useScrollLock'".

- [ ] **Step 3: Create the hook**

```ts
// src/hooks/useScrollLock.ts
import { useEffect } from "react";

/**
 * Lock document body scroll while `active` is true.
 * Preserves prior overflow value and restores it on unmount / deactivation.
 * Targets <body> (not sheet root) to avoid iOS Safari rubber-band.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useScrollLock`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useScrollLock.ts src/__tests__/useScrollLock.test.ts
git commit -m "feat(hooks): add useScrollLock for body overflow control"
```

---

## Task 3: `TextareaWithOverlay` component (TDD)

**Files:**

- Create: `src/components/ui/textarea-with-overlay.tsx`
- Test: `src/components/generate-form/__tests__/TextareaWithOverlay.test.tsx` (new)

**Interfaces:**

- Consumes: standard React props for a textarea wrapper. No imports from later tasks.
- Produces: `<TextareaWithOverlay>` with the prop shape defined in spec §4.

```ts
interface TextareaWithOverlayProps {
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  placeholder?: string;
  ariaLabel: string;
  ariaDescribedBy?: string;
  rows?: number; // default 4
  overlayLeft?: React.ReactNode;
  overlayRight?: React.ReactNode;
  invalid?: boolean;
  className?: string;
}
```

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/generate-form/__tests__/TextareaWithOverlay.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextareaWithOverlay } from "@/components/ui/textarea-with-overlay";

describe("TextareaWithOverlay", () => {
  const baseProps = {
    value: "",
    onChange: vi.fn(),
    maxLength: 500,
    ariaLabel: "Описание трека",
  };

  it("renders a textarea with the supplied aria-label", () => {
    render(<TextareaWithOverlay {...baseProps} />);
    expect(screen.getByRole("textbox", { name: /описание трека/i })).toBeInTheDocument();
  });

  it('renders counter "0/500" in default colour', () => {
    render(<TextareaWithOverlay {...baseProps} />);
    const counter = screen.getByTestId("textarea-counter");
    expect(counter).toHaveTextContent("0/500");
    expect(counter.className).toMatch(/text-muted-foreground/);
  });

  it("shifts counter to yellow past 400 chars", () => {
    render(<TextareaWithOverlay {...baseProps} value={"a".repeat(420)} />);
    const counter = screen.getByTestId("textarea-counter");
    expect(counter.className).toMatch(/text-yellow-500/);
  });

  it("shifts counter to destructive and sets aria-invalid past maxLength", () => {
    render(<TextareaWithOverlay {...baseProps} value={"a".repeat(510)} invalid />);
    const counter = screen.getByTestId("textarea-counter");
    expect(counter.className).toMatch(/text-destructive/);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("counter is announced via aria-live polite", () => {
    render(<TextareaWithOverlay {...baseProps} />);
    expect(screen.getByTestId("textarea-counter")).toHaveAttribute("aria-live", "polite");
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<TextareaWithOverlay {...baseProps} onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "pop" } });
    expect(onChange).toHaveBeenCalledWith("pop");
  });

  it("renders overlayLeft and overlayRight slots", () => {
    render(
      <TextareaWithOverlay
        {...baseProps}
        overlayLeft={<button data-testid="left">L</button>}
        overlayRight={<button data-testid="right">R</button>}
      />,
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TextareaWithOverlay`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement `TextareaWithOverlay`**

```tsx
// src/components/ui/textarea-with-overlay.tsx
import { useCallback, forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface TextareaWithOverlayProps {
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  placeholder?: string;
  ariaLabel: string;
  ariaDescribedBy?: string;
  rows?: number;
  overlayLeft?: React.ReactNode;
  overlayRight?: React.ReactNode;
  invalid?: boolean;
  className?: string;
}

function counterColour(valueLength: number, maxLength: number): string {
  if (valueLength > maxLength) return "text-destructive";
  if (valueLength > 400) return "text-yellow-500";
  return "text-muted-foreground";
}

export const TextareaWithOverlay = forwardRef<HTMLTextAreaElement, TextareaWithOverlayProps>(
  function TextareaWithOverlay(
    {
      value,
      onChange,
      maxLength,
      placeholder,
      ariaLabel,
      ariaDescribedBy,
      rows = 4,
      overlayLeft,
      overlayRight,
      invalid,
      className,
    },
    ref,
  ) {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
      [onChange],
    );

    const isOverLimit = value.length > maxLength;
    const ariaInvalid = invalid || isOverLimit;

    return (
      <div className={cn("relative", className)}>
        <Textarea
          ref={ref}
          rows={rows}
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          onChange={handleChange}
          className={cn(
            "resize-none text-[15px] leading-relaxed px-3.5 pt-3 pb-12 rounded-xl",
            "bg-muted/30 border-muted-foreground/20",
            "focus:border-primary/50 focus:ring-primary/20 transition-colors",
            "min-h-[112px] max-h-[40vh] xs:max-h-[260px] overflow-y-auto",
            ariaInvalid && "border-destructive focus-visible:ring-destructive",
          )}
        />
        <div className="absolute inset-x-3 bottom-2 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-0.5 pointer-events-auto">{overlayLeft}</div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <span
              data-testid="textarea-counter"
              aria-live="polite"
              className={cn(
                "text-[11px] font-medium tabular-nums transition-colors duration-150",
                counterColour(value.length, maxLength),
              )}
            >
              {value.length}/{maxLength}
            </span>
            {overlayRight}
          </div>
        </div>
      </div>
    );
  },
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TextareaWithOverlay`
Expected: PASS (7/7).

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm run lint -- src/components/ui/textarea-with-overlay.tsx src/components/generate-form/__tests__/TextareaWithOverlay.test.tsx`
Expected: 0 errors on the two new files (existing debt may still show in other files).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/textarea-with-overlay.tsx \
        src/components/generate-form/__tests__/TextareaWithOverlay.test.tsx
git commit -m "feat(ui): add TextareaWithOverlay with floating counter"
```

---

## Task 4: `FormSection` elevated glass-card surface

**Files:**

- Modify: `src/components/generate-form/FormSection.tsx`
- Test: (covered by existing snapshot tests + manual visual check)

**Interfaces:**

- Consumes: `cnInteractive()` from Task 1, `glass.subtle` from `src/lib/design-tokens.ts`.
- Produces: `<FormSection elevated?={false} className?>` — opt-in glass card variant, default behaviour unchanged.

- [ ] **Step 1: Read existing FormSection to confirm current shape**

Run: `Read src/components/generate-form/FormSection.tsx`
Expected (per prior context):

```tsx
export function FormSection({ children, className, elevated = false }: FormSectionProps) { ... }
```

Note: `elevated` prop already exists in the type but is currently ignored. Verify with Read; if the prop is missing, add it.

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/generate-form/__tests__/FormSection.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FormSection } from "@/components/generate-form/FormSection";

describe("FormSection", () => {
  it("renders a plain wrapper when elevated is false (default)", () => {
    const { container } = render(<FormSection>x</FormSection>);
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toMatch(/backdrop-blur/);
    expect(root.className).toMatch(/space-y-2\.5/);
  });

  it("renders a glass card when elevated is true", () => {
    const { container } = render(<FormSection elevated>x</FormSection>);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/backdrop-blur/);
    expect(root.className).toMatch(/rounded-2xl/);
    expect(root.className).toMatch(/border/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- FormSection`
Expected: FAIL on the elevated assertion (no `backdrop-blur`).

- [ ] **Step 4: Implement the elevated variant**

Open `src/components/generate-form/FormSection.tsx` and replace the `FormSection` function body:

```tsx
import { memo } from "react";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export const FormSection = memo(function FormSection({ children, className, elevated = false }: FormSectionProps) {
  return (
    <div
      className={cn(
        "space-y-2.5",
        elevated &&
          cn(
            "p-3.5 rounded-2xl",
            "border border-border/40 bg-card/40 backdrop-blur-sm",
            "shadow-[0_1px_0_0_hsl(var(--border)/0.4)]",
          ),
        className,
      )}
    >
      {children}
    </div>
  );
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- FormSection`
Expected: PASS (2/2).

- [ ] **Step 6: Commit**

```bash
git add src/components/generate-form/FormSection.tsx \
        src/components/generate-form/__tests__/FormSection.test.tsx
git commit -m "feat(form-section): opt-in elevated glass-card variant"
```

---

## Task 5: `VocalsToggle` — real `role="radiogroup"`

**Files:**

- Modify: `src/components/generate-form/sections/VocalsToggle.tsx`
- Test: `src/components/generate-form/__tests__/VocalsToggle.test.tsx` (new)

**Interfaces:**

- Consumes: `cnInteractive({ hover: false })` from Task 1.
- Produces: `VocalsToggle` with same prop contract (`value: 'vocals' | 'instrumental'`, `onChange`). Renders `<div role="radiogroup" aria-label="Тип трека">` with two `<button role="radio">` children. Arrow keys move selection (Home/End jump).

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/generate-form/__tests__/VocalsToggle.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VocalsToggle } from "@/components/generate-form/sections/VocalsToggle";

describe("VocalsToggle", () => {
  it("renders as a radio group with two options", () => {
    render(<VocalsToggle value="vocals" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: /тип трека/i })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("marks the selected option with aria-checked=true", () => {
    render(<VocalsToggle value="vocals" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: /вокал/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /инструментал/i })).toHaveAttribute("aria-checked", "false");
  });

  it("uses roving tabindex: only selected has tabindex=0", () => {
    render(<VocalsToggle value="instrumental" onChange={() => {}} />);
    const vocals = screen.getByRole("radio", { name: /вокал/i });
    const instrumental = screen.getByRole("radio", { name: /инструментал/i });
    expect(vocals).toHaveAttribute("tabindex", "-1");
    expect(instrumental).toHaveAttribute("tabindex", "0");
  });

  it("arrow-right moves selection and calls onChange", async () => {
    const onChange = vi.fn();
    render(<VocalsToggle value="vocals" onChange={onChange} />);
    const vocals = screen.getByRole("radio", { name: /вокал/i });
    vocals.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("instrumental");
  });

  it("Home jumps to first option", async () => {
    const onChange = vi.fn();
    render(<VocalsToggle value="instrumental" onChange={onChange} />);
    const instrumental = screen.getByRole("radio", { name: /инструментал/i });
    instrumental.focus();
    await userEvent.keyboard("{Home}");
    expect(onChange).toHaveBeenCalledWith("vocals");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- VocalsToggle`
Expected: FAIL — `radiogroup` not found.

- [ ] **Step 3: Replace `VocalsToggle.tsx`**

```tsx
// src/components/generate-form/sections/VocalsToggle.tsx
import { memo, useCallback } from "react";
import { Mic, Music2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { cnInteractive } from "@/lib/utils";
import { logger } from "@/lib/logger";

export type VocalsValue = "vocals" | "instrumental";

export interface VocalsToggleProps {
  value: VocalsValue;
  onChange: (next: VocalsValue) => void;
}

const OPTIONS: Array<{ value: VocalsValue; label: string; icon: typeof Mic }> = [
  { value: "vocals", label: "Вокал", icon: Mic },
  { value: "instrumental", label: "Инструментал", icon: Music2 },
];

export const VocalsToggle = memo(function VocalsToggle({ value, onChange }: VocalsToggleProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      let nextIdx: number | null = null;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIdx = (idx + 1) % OPTIONS.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIdx = (idx - 1 + OPTIONS.length) % OPTIONS.length;
          break;
        case "Home":
          nextIdx = 0;
          break;
        case "End":
          nextIdx = OPTIONS.length - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      const next = OPTIONS[nextIdx]!.value;
      logger.info("[VocalsToggle] keyboard nav", { from: value, to: next });
      onChange(next);
    },
    [onChange, value],
  );

  return (
    <div role="radiogroup" aria-label="Тип трека" className="flex items-center gap-2">
      {OPTIONS.map((opt, idx) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "inline-flex items-center gap-2 h-10 px-3 rounded-full font-semibold text-[13px]",
              "border transition-colors",
              cnInteractive({ hover: false }),
              selected
                ? "bg-primary text-primary-foreground border-transparent shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.45)]"
                : "bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="uppercase tracking-wide">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- VocalsToggle`
Expected: PASS (5/5).

- [ ] **Step 5: Update pre-existing test that queried the toggle as a `button`**

Open `src/__tests__/generate-form.test.tsx`, find any `getByRole('button', { name: /вокал/i })` (or similar) that targets the vocals toggle, and change to `getByRole('radio', { name: /вокал/i })`. Use Grep first to locate:

Run: `grep -rn "getByRole.*button.*вокал\|getByRole.*button.*инструментал" src/`
Then edit. If none exist, skip this step.

- [ ] **Step 6: Commit**

```bash
git add src/components/generate-form/sections/VocalsToggle.tsx \
        src/components/generate-form/__tests__/VocalsToggle.test.tsx
git commit -m "feat(vocals-toggle): real role=radiogroup with arrow-key roving"
```

---

## Task 6: `GenerateFormSimple` — adopt new components

**Files:**

- Modify: `src/components/generate-form/GenerateFormSimple.tsx`

**Interfaces:**

- Consumes: `TextareaWithOverlay` (Task 3), `VocalsToggle` (Task 5), `cnInteractive()` (Task 1).
- Produces: same external `GenerateFormSimpleProps` (no API change).

- [ ] **Step 1: Read current file**

Run: `Read src/components/generate-form/GenerateFormSimple.tsx` (already in context from prior session — 296 lines).

- [ ] **Step 2: Replace counter div + textarea wrapper with `<TextareaWithOverlay>`**

In `GenerateFormSimple.tsx`, replace the textarea block (around lines 145-211 in current file). The new block:

```tsx
<TextareaWithOverlay
  value={description}
  onChange={onDescriptionChange}
  maxLength={validation.description.maxLength}
  placeholder={hasVocals ? "Энергичный поп с запоминающимся припевом..." : "Атмосферный эмбиент с синтезаторами..."}
  ariaLabel={hasVocals ? "Опишите песню" : "Опишите музыку"}
  ariaDescribedBy={descriptionValidation ? "description-error" : undefined}
  rows={4}
  invalid={overLimit}
  overlayLeft={
    <>
      {description && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 min-w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg",
              cnInteractive({ hover: false }),
            )}
            onClick={handleCopy}
            aria-label="Копировать описание"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 min-w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg",
              cnInteractive({ hover: false, ring: "destructive" }),
            )}
            onClick={handleClear}
            aria-label="Очистить описание"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
    </>
  }
  overlayRight={
    <VoiceInputButton
      onResult={onDescriptionChange}
      context="description"
      currentValue={description}
      appendMode
      className={cn("h-8 w-8 min-w-8 p-0 rounded-lg", cnInteractive({ hover: false }))}
      ariaLabel="Голосовой ввод описания"
    />
  }
/>
```

Adjust import: add `cnInteractive` import next to existing `cn`.

- [ ] **Step 3: Replace inline vocal switch with `<VocalsToggle>`**

Find the inline `<button role="switch" ...>` block (lines 244-265 in current file) and replace with:

```tsx
<VocalsToggle
  value={hasVocals ? "vocals" : "instrumental"}
  onChange={(next) => handleVocalsToggle(next === "vocals")}
/>
```

Add import: `import { VocalsToggle } from './sections/VocalsToggle';`

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Run form tests**

Run: `npm test -- generate-form`
Expected: 282 prior pass + updated role queries pass. Update any `getByRole('button', { name: /вокал/i })` to `getByRole('radio', { name: /вокал/i })` if failures appear (per spec §10).

- [ ] **Step 6: Commit**

```bash
git add src/components/generate-form/GenerateFormSimple.tsx
git commit -m "refactor(form-simple): adopt TextareaWithOverlay + VocalsToggle"
```

---

## Task 7: `StyleSection` — adopt `TextareaWithOverlay`

**Files:**

- Modify: `src/components/generate-form/sections/StyleSection.tsx`

- [ ] **Step 1: Read current file**

Run: `Read src/components/generate-form/sections/StyleSection.tsx` (94 lines, known from prior session).

- [ ] **Step 2: Replace the inline textarea + absolute toolbar**

The current implementation uses a `FormFieldActions` overlay. Replace the textarea block with:

```tsx
<TextareaWithOverlay
  value={styleDescription}
  onChange={onStyleChange}
  maxLength={500}
  rows={3}
  placeholder="Энергичный поп с запоминающимся припевом..."
  ariaLabel="Описание стиля"
  overlayRight={
    <VoiceInputButton
      onResult={onStyleChange}
      context="style"
      currentValue={styleDescription}
      appendMode
      className={cn("h-8 w-8 min-w-8 p-0 rounded-lg", cnInteractive({ hover: false }))}
      ariaLabel="Голосовой ввод стиля"
    />
  }
/>
```

Keep the existing label / hint structure outside the new component.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/generate-form/sections/StyleSection.tsx
git commit -m "refactor(style-section): adopt TextareaWithOverlay"
```

---

## Task 8: `AdvancedSettings` — focus ring on vocal-gender buttons

**Files:**

- Modify: `src/components/generate-form/AdvancedSettings.tsx`

- [ ] **Step 1: Read current file**

Run: `Read src/components/generate-form/AdvancedSettings.tsx` (195 lines, known from prior session).

- [ ] **Step 2: Apply `cnInteractive({ hover: false })` to the three vocal-gender `Button`s**

Find the grid rendering the Любой / Женский / Мужской buttons (around line ~80 in the current file). Add `cnInteractive({ hover: false })` to each `className`:

```tsx
<Button
  variant={vocalGender === v ? "default" : "outline"}
  className={cn("h-11", cnInteractive({ hover: false }))}
  onClick={() => setVocalGender(v)}
  aria-pressed={vocalGender === v}
>
```

Apply the same pattern to any other plain `Button` inside the file (e.g. the collapse trigger) that currently lacks a focus ring.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/generate-form/AdvancedSettings.tsx
git commit -m "refactor(advanced-settings): add focus-visible ring to vocal-gender buttons"
```

---

## Task 9: `GenerateFormActions` chips — `cnInteractive()`

**Files:**

- Modify: `src/components/generate-form/GenerateFormActions.tsx`

- [ ] **Step 1: Replace existing hover/focus utility classes with `cnInteractive()`**

In `GenerateFormActions.tsx`, replace the long `cn(...)` className on `ActionChip` button (lines ~27-35) with:

```tsx
className={cn(
  "group relative flex flex-col items-center justify-center gap-1 min-h-[60px] px-2 rounded-xl",
  "border",
  cnInteractive(),
  accent
    ? "bg-primary/10 border-primary/30 hover:bg-primary/15 hover:border-primary/50"
    : "bg-muted/30 border-border/50 hover:bg-primary/8 hover:border-primary/40",
)}
```

Remove the now-redundant inline `hover:-translate-y-0.5`, `hover:shadow-...`, `focus-visible:ring-...` literals from the chip.

- [ ] **Step 2: Type-check + test**

Run: `npx tsc --noEmit && npm test -- generate-form`
Expected: exit 0 and tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/generate-form/GenerateFormActions.tsx
git commit -m "refactor(form-actions): use cnInteractive for chips"
```

---

## Task 10: `VoiceInputButton` default `aria-label`

**Files:**

- Modify: `src/components/ui/VoiceInputButton.tsx` (extend props + default)

- [ ] **Step 1: Read current file**

Run: `Read src/components/ui/VoiceInputButton.tsx` — locate the props interface.

- [ ] **Step 2: Add `ariaLabel` prop with Russian default fallback**

In the `VoiceInputButtonProps` interface, add:

```ts
ariaLabel?: string;
```

In the component, find where the inner `<button>` is rendered and replace its `aria-label` attribute:

```tsx
aria-label={ariaLabel ?? 'Голосовой ввод'}
```

Pass through `ariaLabel` from props in `GenerateFormSimple.tsx` (Task 6 already did this) and `StyleSection.tsx` (Task 7 already did this).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/VoiceInputButton.tsx
git commit -m "feat(voice-input): default aria-label + per-call override"
```

---

## Task 11: `GenerateSheet` — z-index, safe-area, scroll-lock wiring

**Files:**

- Modify: `src/components/GenerateSheet.tsx`

- [ ] **Step 1: Read current file**

Run: `Read src/components/GenerateSheet.tsx` (667 lines, known from prior session).

- [ ] **Step 2: Raise loading overlay z-index to `z-[60]`**

Find the loading overlay (around line 287, currently `z-50`):

```tsx
// before
<div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">

// after
<div className="absolute inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center">
```

- [ ] **Step 3: Apply safe-area footer padding**

Find the footer element (currently `px-4 pt-3 pb-4 border-t border-border/40 bg-background/95 backdrop-blur-xl`):

```tsx
// after
className =
  "px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-border/40 bg-background/95 backdrop-blur-xl";
```

- [ ] **Step 4: Wire `useScrollLock` to the active dialog state**

Find the parent state that controls persona/project dialog visibility (likely `artistDialogOpen` / `projectDialogOpen` derived from props). Add at the top of the `GenerateSheet` component:

```tsx
import { useScrollLock } from '@/hooks/useScrollLock';

const anyDialogOpen = /* boolean OR of every dialog open flag */;
useScrollLock(anyDialogOpen);
```

If dialog state is not visible inside `GenerateSheet`, check if dialogs are rendered elsewhere (likely in `MainLayout`). If so, this step becomes: import `useScrollLock` and call it from the dialog consumer (e.g. `ProjectTrackSelector`). The contract is: the lock is active while the dialog is mounted.

- [ ] **Step 5: Type-check + manual smoke**

Run: `npx tsc --noEmit`
Expected: exit 0.

Manual check (after `npm run dev`):

- Open sheet on desktop → persona chip → dialog opens above sheet
- Open sheet on iPhone 12 viewport (Playwright project) → tap persona chip → sheet footer not scrollable
- Close dialog → sheet scroll restored

- [ ] **Step 6: Commit**

```bash
git add src/components/GenerateSheet.tsx
git commit -m "fix(sheet): raise loading overlay, safe-area footer, body scroll-lock"
```

---

## Task 12: Accessibility test for `VocalsToggle`

**Files:**

- Create: `src/__tests__/generate-form.a11y.test.tsx`

- [ ] **Step 1: Write the a11y test**

```tsx
// src/__tests__/generate-form.a11y.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { VocalsToggle } from "@/components/generate-form/sections/VocalsToggle";

expect.extend(toHaveNoViolations);

describe("VocalsToggle a11y", () => {
  it("passes axe scan", async () => {
    const { container } = render(<VocalsToggle value="vocals" onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("exposes exactly one tabbable radio", () => {
    render(<VocalsToggle value="vocals" onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");
    const tabbable = radios.filter((r) => r.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAttribute("aria-checked", "true");
  });

  it("arrow-key nav moves focus and updates aria-checked", async () => {
    const user = userEvent.setup();
    render(<VocalsToggle value="vocals" onChange={() => {}} />);
    const vocals = screen.getByRole("radio", { name: /вокал/i });
    vocals.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: /инструментал/i })).toHaveAttribute("aria-checked", "true");
  });
});
```

- [ ] **Step 2: Run test**

Run: `npm test -- generate-form.a11y`
Expected: PASS (3/3). If jest-axe is not installed, add it: `npm i -D jest-axe @types/jest-axe`. Confirm package.json before installing.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/generate-form.a11y.test.tsx package.json package-lock.json
git commit -m "test(a11y): VocalsToggle radiogroup semantics + axe scan"
```

---

## Task 13: E2E mobile scenario

**Files:**

- Create: `tests/e2e/mobile/generate-form.spec.ts`

- [ ] **Step 1: Check playwright config**

Run: `Read playwright.config.ts` — confirm `tests/e2e/mobile/` is included and `iPhone 12` project exists. If not, add project and include pattern.

- [ ] **Step 2: Write the E2E scenario**

```ts
// tests/e2e/mobile/generate-form.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Generate form — mobile (iPhone 12)", () => {
  test("persona picker opens above sheet and locks body scroll", async ({ page }) => {
    await page.goto("/generate");
    await page.getByTestId("open-generate-sheet").click();
    await expect(page.getByTestId("generate-sheet")).toBeVisible();

    await page
      .getByRole("button", { name: /персона/i })
      .first()
      .click();
    await expect(page.getByTestId("persona-dialog")).toBeVisible();

    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("persona-dialog")).toBeHidden();
    const overflowAfter = await page.evaluate(() => document.body.style.overflow);
    expect(overflowAfter).not.toBe("hidden");
  });

  test("vocal toggle responds to arrow-key navigation", async ({ page }) => {
    await page.goto("/generate");
    await page.getByTestId("open-generate-sheet").click();
    const vocals = page.getByRole("radio", { name: /вокал/i });
    await vocals.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: /инструментал/i })).toHaveAttribute("aria-checked", "true");
  });
});
```

- [ ] **Step 3: Add missing data-testids (if needed)**

For each `data-testid` referenced in the spec (`open-generate-sheet`, `generate-sheet`, `persona-dialog`), add to the corresponding component. Likely places:

- `src/components/generate-form/GenerateFormActions.tsx` — add `data-testid` to the "Персона" chip
- `src/components/GenerateSheet.tsx` — add `data-testid="generate-sheet"` to the Sheet root
- Persona picker dialog — add `data-testid="persona-dialog"` to the dialog root

Adjust selectors to match real testids after first run.

- [ ] **Step 4: Run the E2E**

Run: `npm run test:e2e:mobile -- generate-form`
Expected: 2 passing on iPhone 12 (and Pixel 5 if configured).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/mobile/generate-form.spec.ts
git commit -m "test(e2e): mobile generate-form sheet scroll-lock + vocal radio nav"
```

---

## Task 14: Final verification + bundle check

**Files:**

- No code changes; verification only.

- [ ] **Step 1: Run full unit suite**

Run: `npm test`
Expected: ≥286/286 pass (282 prior + 4 new from Tasks 1, 2, 3, 5, 12 — exact count: cnInteractive(3) + useScrollLock(3) + TextareaWithOverlay(7) + FormSection(2) + VocalsToggle(5) + a11y(3) = 23 new). Adjust the count in Definition of Done if different.

- [ ] **Step 2: Run ESLint on the changed scope**

Run: `npm run lint -- src/components/generate-form src/components/ui/textarea-with-overlay.tsx src/components/GenerateSheet.tsx src/lib/utils.ts src/hooks/useScrollLock.ts`
Expected: 0 NEW errors on these files.

- [ ] **Step 3: Run bundle check**

Run: `npm run size`
Expected: bundle ≤ 950 KB.

- [ ] **Step 4: Update Sprint tracker + CHANGELOG**

Edit `SPRINTS/SPRINT-PROGRESS.md`: append row `| 050 | Generation Form Redesign | ✅ Complete | 2026-07-03 |`.

Edit `CHANGELOG.md` under `[Unreleased]`:

```md
### Changed (Sprint 050)

- Generation form: counter floats inside textarea; layout no longer shifts on overflow.
- Vocals toggle is now a real `role="radiogroup"` with arrow-key navigation.
- Unified hover/focus/active state via new `cnInteractive()` utility.
- GenerateSheet loading overlay raised to `z-[60]`; body scroll-locked while persona/project dialog open.
```

- [ ] **Step 5: Final commit**

```bash
git add SPRINTS/SPRINT-PROGRESS.md CHANGELOG.md
git commit -m "docs(sprint-050): mark complete + changelog entry"
```

---

## Self-Review (against spec)

**Spec coverage:**

| Spec § | Topic                      | Task                                                                             |
| ------ | -------------------------- | -------------------------------------------------------------------------------- |
| §3.1   | `cnInteractive()` utility  | Task 1                                                                           |
| §3.2   | `FormSection` glass-card   | Task 4                                                                           |
| §4     | `TextareaWithOverlay`      | Task 3                                                                           |
| §5     | `VocalsToggle` radio group | Task 5                                                                           |
| §6     | z-index + scroll-lock      | Tasks 2, 11                                                                      |
| §7     | animations (subtle)        | baked into `cnInteractive` (Task 1) + `FormSection` `transition-colors` (Task 4) |
| §8     | accessibility              | Tasks 5, 10, 12                                                                  |
| §9     | tests                      | Tasks 3 (unit), 12 (a11y), 13 (e2e)                                              |
| §10    | risks                      | `useScrollLock` created in Task 2; existing test query updated in Task 5         |
| §12    | DoD                        | Task 14                                                                          |

**Placeholder scan:** No "TBD", no "TODO", no "implement later" — every step has actual code or commands.

**Type consistency:** `cnInteractive` defined once in Task 1 and consumed verbatim in Tasks 5, 6, 7, 8, 9. `VocalsValue` defined in Task 5; consumed in Task 6. `TextareaWithOverlayProps` defined in Task 3; consumed in Tasks 6, 7. `useScrollLock(active: boolean)` defined in Task 2; consumed in Task 11.

**Spec gap (call out):** Spec §7 mentions `FormSection` enter animation `opacity 0 → 1` + `translateY 4px → 0`. Not implemented in Task 4 because `FormSection` is used as a passive wrapper — adding mount animation would require changing call sites. Note this for follow-up if desired.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-03-generation-form-redesign.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks.
2. **Inline Execution** — execute in this session via `superpowers:executing-plans`.

Awaiting your choice before dispatching workers.
