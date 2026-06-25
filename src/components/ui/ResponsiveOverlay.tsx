/**
 * ResponsiveOverlay — Phase 6 UI unification
 *
 * Thin wrapper around the existing `UnifiedDialog` that picks `modal` on
 * desktop and `sheet` on mobile. Use it for any new content overlay so callers
 * don't have to branch on viewport themselves.
 *
 * The underlying `UnifiedDialog` already routes between modal/sheet/alert
 * variants — this component just enforces the responsive default and gives the
 * audit map a single import path to migrate the legacy `*Dialog.tsx` files to.
 *
 * @example
 *   <ResponsiveOverlay
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Кавер версии"
 *     size="lg"
 *   >
 *     <CoverForm />
 *   </ResponsiveOverlay>
 */

import { useEffect, useState, type ReactNode } from "react";
import { UnifiedDialog } from "@/components/dialog";

interface ResponsiveOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Force a specific variant — by default we pick by viewport. */
  variant?: "auto" | "modal" | "sheet";
  /** Modal size on desktop. Ignored in sheet mode. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Snap points on mobile sheet. Defaults to `[0.5, 0.95]`. */
  snapPoints?: number[];
  children: ReactNode;
  className?: string;
}

const MOBILE_BREAKPOINT = 768;

function detectMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function ResponsiveOverlay({
  open,
  onOpenChange,
  title,
  description,
  variant = "auto",
  size = "md",
  snapPoints = [0.5, 0.95],
  children,
  className,
}: ResponsiveOverlayProps) {
  const [isMobile, setIsMobile] = useState(detectMobile);

  useEffect(() => {
    const handler = () => setIsMobile(detectMobile());
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);

  const useSheet = variant === "sheet" || (variant === "auto" && isMobile);

  if (useSheet) {
    return (
      <UnifiedDialog
        variant="sheet"
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        snapPoints={snapPoints}
        className={className}
      >
        {description ? <p className="text-sm text-muted-foreground mb-3 px-1">{description}</p> : null}
        {children}
      </UnifiedDialog>
    );
  }

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      className={className}
    >
      {children}
    </UnifiedDialog>
  );
}
