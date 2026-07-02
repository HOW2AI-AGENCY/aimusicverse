import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
