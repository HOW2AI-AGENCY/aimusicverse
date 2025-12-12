/**
 * Keyboard Shortcuts Help Dialog
 * 
 * Displays all available keyboard shortcuts for track and player actions.
 * 
 * @author MusicVerse AI
 * @task T066 - Add keyboard shortcuts for track actions
 */

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Keyboard } from 'lucide-react';
import { 
  defaultTrackShortcuts, 
  formatTrackShortcut,
  TrackShortcut,
} from '@/hooks/useTrackKeyboardShortcuts';
import { cn } from '@/lib/utils';

interface ShortcutsHelpDialogProps {
  /** Trigger element (optional - uses default button if not provided) */
  trigger?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Group shortcuts by category for organized display
 */
const categoryLabels: Record<string, string> = {
  playback: 'Воспроизведение',
  library: 'Библиотека',
  queue: 'Очередь',
  other: 'Другое',
};

const categoryOrder = ['playback', 'library', 'queue', 'other'];

export function ShortcutsHelpDialog({ 
  trigger,
  className,
}: ShortcutsHelpDialogProps) {
  // Group shortcuts by category
  const groupedShortcuts = Object.entries(defaultTrackShortcuts).reduce(
    (acc, [id, shortcut]) => {
      const category = shortcut.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ id, ...shortcut });
      return acc;
    },
    {} as Record<string, Array<TrackShortcut & { id: string }>>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
            <Keyboard className="w-4 h-4" />
            Горячие клавиши
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Горячие клавиши
          </DialogTitle>
          <DialogDescription>
            Используйте клавиатуру для быстрого управления
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {categoryOrder.map(category => {
              const shortcuts = groupedShortcuts[category];
              if (!shortcuts?.length) return null;

              return (
                <div key={category}>
                  <h4 className="text-sm font-semibold mb-3 text-primary">
                    {categoryLabels[category]}
                  </h4>
                  <div className="space-y-2">
                    {shortcuts.map(shortcut => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                      >
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                          {formatTrackShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Некоторые сочетания работают только при выбранном треке
        </p>
      </DialogContent>
    </Dialog>
  );
}
