/**
 * Keyboard Shortcuts Dialog
 * 
 * Displays a cheatsheet of available keyboard shortcuts
 * for the Stem Studio.
 */

import { memo } from 'react';
import { Keyboard, Command } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'playback' | 'navigation' | 'editing' | 'view';
}

const SHORTCUTS: ShortcutItem[] = [
  // Playback
  { keys: ['Space'], description: 'Воспроизвести / Пауза', category: 'playback' },
  { keys: ['Enter'], description: 'Воспроизвести с начала', category: 'playback' },
  { keys: ['M'], description: 'Заглушить мастер', category: 'playback' },
  { keys: ['L'], description: 'Включить/выключить лупинг', category: 'playback' },
  
  // Navigation
  { keys: ['←'], description: 'Назад на 5 секунд', category: 'navigation' },
  { keys: ['→'], description: 'Вперёд на 5 секунд', category: 'navigation' },
  { keys: ['Shift', '←'], description: 'Назад на 30 секунд', category: 'navigation' },
  { keys: ['Shift', '→'], description: 'Вперёд на 30 секунд', category: 'navigation' },
  { keys: ['Home'], description: 'Перейти в начало', category: 'navigation' },
  { keys: ['End'], description: 'Перейти в конец', category: 'navigation' },
  
  // Editing
  { keys: ['1-9'], description: 'Solo стем 1-9', category: 'editing' },
  { keys: ['Shift', '1-9'], description: 'Mute стем 1-9', category: 'editing' },
  { keys: ['0'], description: 'Сбросить все Solo', category: 'editing' },
  { keys: ['Ctrl', 'Z'], description: 'Отменить', category: 'editing' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Повторить', category: 'editing' },
  
  // View
  { keys: ['?'], description: 'Показать эту справку', category: 'view' },
  { keys: ['F'], description: 'Во весь экран', category: 'view' },
  { keys: ['Esc'], description: 'Закрыть диалог', category: 'view' },
];

const CATEGORY_LABELS: Record<string, string> = {
  playback: 'Воспроизведение',
  navigation: 'Навигация',
  editing: 'Редактирование',
  view: 'Вид',
};

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const KeyBadge = memo(({ keyName }: { keyName: string }) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  // Replace Ctrl with Cmd on Mac
  const displayKey = keyName === 'Ctrl' && isMac ? '⌘' : keyName;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "h-6 px-2 font-mono text-xs",
        "bg-muted/50 border-border/50",
        "min-w-[24px] justify-center"
      )}
    >
      {displayKey}
    </Badge>
  );
});

KeyBadge.displayName = 'KeyBadge';

const ShortcutRow = memo(({ shortcut }: { shortcut: ShortcutItem }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
    <div className="flex items-center gap-1">
      {shortcut.keys.map((key, idx) => (
        <span key={key} className="flex items-center gap-1">
          <KeyBadge keyName={key} />
          {idx < shortcut.keys.length - 1 && (
            <span className="text-xs text-muted-foreground">+</span>
          )}
        </span>
      ))}
    </div>
  </div>
));

ShortcutRow.displayName = 'ShortcutRow';

export const KeyboardShortcutsDialog = memo(({ 
  open, 
  onOpenChange, 
  trigger 
}: KeyboardShortcutsDialogProps) => {
  const categories = ['playback', 'navigation', 'editing', 'view'] as const;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Горячие клавиши
          </DialogTitle>
          <DialogDescription>
            Быстрый доступ к функциям студии с клавиатуры
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {categories.map((category, idx) => {
            const categoryShortcuts = SHORTCUTS.filter(s => s.category === category);
            if (categoryShortcuts.length === 0) return null;
            
            return (
              <div key={category}>
                {idx > 0 && <Separator className="mb-4" />}
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <span className="text-primary">•</span>
                  {CATEGORY_LABELS[category]}
                </h4>
                <div className="space-y-1">
                  {categoryShortcuts.map((shortcut) => (
                    <ShortcutRow key={shortcut.description} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <Command className="w-3 h-3" />
            Нажмите <KeyBadge keyName="?" /> чтобы открыть эту справку
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

KeyboardShortcutsDialog.displayName = 'KeyboardShortcutsDialog';
