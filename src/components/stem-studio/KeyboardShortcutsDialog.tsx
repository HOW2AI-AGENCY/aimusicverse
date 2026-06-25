/**
 * Keyboard Shortcuts Dialog Component
 *
 * Displays available keyboard shortcuts for Stem Studio.
 * Migrated to UnifiedDialog (Phase 6 - Dialog unification).
 */

import { memo, useState } from "react";
import { Keyboard } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UnifiedDialog } from "@/components/dialog";
import { KeyboardShortcut, formatShortcut } from "@/hooks/studio/useStudioKeyboardShortcuts";

interface KeyboardShortcutsDialogProps {
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsDialog = memo(({ shortcuts }: KeyboardShortcutsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 gap-1.5"
        title="Горячие клавиши"
        aria-label="Открыть список горячих клавиш"
        onClick={() => setOpen(true)}
      >
        <Keyboard className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Shortcuts</span>
      </Button>

      <UnifiedDialog
        variant="modal"
        open={open}
        onOpenChange={setOpen}
        title="Горячие клавиши"
        description="Используйте эти сочетания клавиш для быстрой работы в Stem Studio"
        size="md"
      >
        <ScrollArea className="max-h-[400px] pr-4">
          <ul className="space-y-3" aria-label="Список горячих клавиш">
            {shortcuts.map((shortcut, index) => (
              <li
                key={index}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-2.5 py-1 text-xs font-semibold rounded bg-muted border border-border">
                  {formatShortcut(shortcut)}
                </kbd>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </UnifiedDialog>
    </>
  );
});

KeyboardShortcutsDialog.displayName = "KeyboardShortcutsDialog";
