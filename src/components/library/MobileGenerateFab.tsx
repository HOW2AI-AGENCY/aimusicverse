/**
 * MobileGenerateFab
 *
 * Floating Action Button that opens a bottom sheet with the full generation form.
 * Rendered at the Library page level (not inside flex layout) to avoid layout shift.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Plus, Sparkles, Loader2 } from "@/lib/icons";
import { useGenerateForm } from "@/hooks/generation/useGenerateForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProjects } from "@/hooks/useProjects";
import { useArtists } from "@/hooks/useArtists";
import { useTracks } from "@/hooks/useTracks";

export function MobileGenerateFab() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-xl shadow-primary/30"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[90dvh] p-0 rounded-t-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <span className="text-sm font-semibold">Создание трека</span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Готово
            </Button>
          </div>
          <div className="p-4 text-center text-sm text-muted-foreground">
            Форма генерации загружается...
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
