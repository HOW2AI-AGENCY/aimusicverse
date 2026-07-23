/**
 * MobileNavDrawer — Sprint 3.1
 *
 * Global mobile (portrait) drawer that exposes the full Sidebar navigation
 * via a left-side Sheet. Provides a floating hamburger trigger pinned to
 * the safe-area top-left, hidden on landscape (edge-rail) and desktop
 * (persistent sidebar).
 */

import { memo } from "react";
import { Menu } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/Sidebar";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileNavDrawer = memo(function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
  const isLandscape = useMediaQuery("(max-width: 1023px) and (orientation: landscape) and (max-height: 500px)");

  if (isLandscape) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Открыть меню"
          className="fixed left-2 z-navigation h-11 w-11 min-w-touch min-h-touch rounded-full bg-background/60 backdrop-blur-xl border border-border/40 shadow-lg active:scale-95 transition-transform"
          style={{
            top: "max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), 0.5rem)",
            left: "max(env(safe-area-inset-left, 0px), 0.5rem)",
          }}
        >
          <Menu className="h-5 w-5" strokeWidth={2.2} />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[86vw] max-w-[320px] p-0 border-r border-border/40 bg-background/95 backdrop-blur-2xl"
      >
        <VisuallyHidden asChild>
          <SheetTitle>Главное меню</SheetTitle>
        </VisuallyHidden>
        <div className="h-full overflow-hidden">
          <Sidebar collapsed={false} onCollapsedChange={() => {}} />
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default MobileNavDrawer;
