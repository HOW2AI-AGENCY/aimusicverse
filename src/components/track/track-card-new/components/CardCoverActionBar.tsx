/**
 * CardCoverActionBar - Layout atom for icon buttons placed on top of a cover image
 *
 * Purely presentational: positions its children in a row over a cover image.
 * Visibility (hover-only vs always-visible) is the caller's responsibility.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardCoverActionBarProps {
  position: "top" | "bottom";
  align?: "left" | "right" | "between";
  className?: string;
  children: ReactNode;
}

export function CardCoverActionBar({ position, align = "between", className, children }: CardCoverActionBarProps) {
  return (
    <div
      className={cn(
        "absolute left-2 right-2 flex items-center gap-1.5 z-10",
        position === "top" ? "top-2" : "bottom-2",
        align === "left" && "justify-start",
        align === "right" && "justify-end",
        align === "between" && "justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}
