/**
 * Keyboard Shortcuts Dialog Component
 * 
 * Displays available keyboard shortcuts for Stem Studio
 * Helps users discover and learn shortcuts
 */

import { memo } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KeyboardShortcut, formatShortcut } from '@/hooks/studio/useStudioKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsDialog = memo(({ shortcuts }: KeyboardShortcutsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5"
          title="Горячие клавиши"
        >
          <Keyboard className="w-4 h-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Горячие клавиши
          </DialogTitle>
          <DialogDescription>
            Используйте эти сочетания клавиш для быстрой работы в Stem Studio
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
                <kbd className="px-2.5 py-1 text-xs font-semibold rounded bg-muted border border-border">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});

KeyboardShortcutsDialog.displayName = 'KeyboardShortcutsDialog';
