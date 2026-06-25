/**
 * Interaction utilities for premium feel
 * Phase 5 Professional UI (Spec 032)
 *
 * Provides consistent interaction patterns and animations.
 */

import { cn } from "@/lib/utils";

/**
 * Press/tap interaction states
 */
export const press = {
  // Light press - subtle feedback
  light: "active:scale-[0.98] transition-transform duration-100",

  // Medium press - noticeable feedback
  medium: "active:scale-[0.96] transition-transform duration-100",

  // Heavy press - strong feedback
  heavy: "active:scale-[0.94] transition-transform duration-100",

  // Bounce - spring-like feedback
  bounce: "active:scale-[0.95] hover:scale-[1.02] transition-transform duration-150",
};

/**
 * Hover lift effects
 */
export const hoverLift = {
  // Subtle lift
  sm: "hover:-translate-y-0.5 transition-transform duration-200",

  // Medium lift
  md: "hover:-translate-y-1 transition-transform duration-200",

  // Large lift with shadow
  lg: cn("hover:-translate-y-1.5", "hover:shadow-lg hover:shadow-black/10", "transition-all duration-200"),
};

/**
 * Focus ring styles for accessibility
 */
export const focusRing = {
  default: cn(
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-primary/50",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ),

  inset: cn(
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-primary/50",
    "focus-visible:ring-inset",
  ),

  subtle: cn("focus-visible:outline-none", "focus-visible:ring-1 focus-visible:ring-primary/30"),
};

/**
 * Interactive card states
 */
export const interactiveCard = cn(
  "cursor-pointer",
  press.light,
  hoverLift.sm,
  focusRing.default,
  "transition-all duration-200",
);

/**
 * Interactive button states
 */
export const interactiveButton = cn(press.medium, focusRing.default, "transition-all duration-150");

/**
 * Interactive list item states
 */
export const interactiveListItem = cn(
  "cursor-pointer",
  "hover:bg-muted/50",
  press.light,
  focusRing.subtle,
  "transition-all duration-150",
);

/**
 * Disabled state overlay
 */
export const disabledState = cn("opacity-50 cursor-not-allowed pointer-events-none", "select-none");

/**
 * Loading state styles
 */
export const loadingState = {
  pulse: "animate-pulse",
  skeleton: cn(
    "bg-muted animate-pulse rounded",
    "bg-gradient-to-r from-muted via-muted/70 to-muted",
    "bg-[length:200%_100%] animate-shimmer",
  ),
  spinner: "animate-spin",
};

/**
 * Selection states for multi-select UIs
 */
export const selectionState = {
  unselected: "opacity-100",
  selected: cn("ring-2 ring-primary ring-offset-2 ring-offset-background", "bg-primary/5"),
  hover: "hover:ring-1 hover:ring-primary/30",
};

/**
 * Touch manipulation class for mobile
 */
export const touchOptimized = cn("touch-manipulation", "select-none", "-webkit-tap-highlight-color: transparent");

/**
 * Minimum touch target size (44x44px)
 */
export const touchTarget = "min-h-[44px] min-w-[44px]";

/**
 * Create interactive element with all best practices
 */
export function createInteractive(config: {
  type: "button" | "card" | "listItem";
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
}) {
  const { type, disabled, loading, selected } = config;

  const base = {
    button: interactiveButton,
    card: interactiveCard,
    listItem: interactiveListItem,
  }[type];

  return cn(base, disabled && disabledState, loading && loadingState.pulse, selected && selectionState.selected);
}

export default {
  press,
  hoverLift,
  focusRing,
  interactiveCard,
  interactiveButton,
  interactiveListItem,
  disabledState,
  loadingState,
  selectionState,
  touchOptimized,
  touchTarget,
  createInteractive,
};
