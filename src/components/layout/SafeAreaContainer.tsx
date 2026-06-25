import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

interface SafeAreaContainerProps extends HTMLAttributes<HTMLElement> {
  /** Render element. Defaults to `div`. */
  as?: ElementType;
  /** Which edges receive safe-area padding. Defaults to horizontal only. */
  sides?: Side[];
  /** Minimum padding floor in rem (defaults to 1rem = 16px). RTL-safe via logical left/right. */
  minPaddingRem?: number;
  /** When true, also accounts for BottomNav + Player via `--bottom-stack-h`. */
  includeBottomStack?: boolean;
}

/**
 * Unified safe-area wrapper.
 *
 * Combines iOS `env(safe-area-inset-*)`, Android display cutouts, and Telegram
 * Mini App `--tg-safe-area-inset-*` variables into a single padding floor so
 * skeletons, content wrappers, and overlays share identical gutters across
 * every screen, orientation, and RTL/LTR mode.
 */
export const SafeAreaContainer = forwardRef<HTMLElement, SafeAreaContainerProps>(
  (
    {
      as: Tag = "div",
      sides = ["left", "right"],
      minPaddingRem = 1,
      includeBottomStack = false,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const min = `${minPaddingRem}rem`;
    const side = (axis: "left" | "right" | "top" | "bottom") =>
      `max(${min}, env(safe-area-inset-${axis}, 0px), var(--tg-safe-area-inset-${axis}, 0px))`;

    const padding: CSSProperties = {};
    if (sides.includes("left")) padding.paddingLeft = side("left");
    if (sides.includes("right")) padding.paddingRight = side("right");
    if (sides.includes("top")) padding.paddingTop = side("top");
    if (sides.includes("bottom")) {
      padding.paddingBottom = includeBottomStack
        ? `calc(var(--bottom-stack-h, 0px) + ${side("bottom")})`
        : side("bottom");
    }

    const Element = Tag as ElementType;
    return (
      <Element ref={ref as never} className={cn(className)} style={{ ...padding, ...style }} {...rest}>
        {children}
      </Element>
    );
  },
);
SafeAreaContainer.displayName = "SafeAreaContainer";
