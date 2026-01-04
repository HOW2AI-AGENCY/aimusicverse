/**
 * LyricsVersionDiff - Compare two versions of lyrics
 */

import { useMemo } from 'react';
import { motion } from '@/lib/motion';
import { ArrowRight, Clock, Sparkles, GitCompare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { LyricsVersion, changeTypeLabels, ChangeType } from '@/hooks/useLyricsVersioning';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, ru } from '@/lib/date-utils';

interface LyricsVersionDiffProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldVersion: LyricsVersion | null;
  newVersion: LyricsVersion | null;
}

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  lineNumber: number;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];
  
  // Simple line-by-line diff
  let oldIndex = 0;
  let newIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // Remaining new lines are additions
      result.push({
        type: 'added',
        content: newLines[newIndex],
        lineNumber: newIndex + 1,
      });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Remaining old lines are removals
      result.push({
        type: 'removed',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1,
      });
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines match
      result.push({
        type: 'unchanged',
        content: newLines[newIndex],
        lineNumber: newIndex + 1,
      });
      oldIndex++;
      newIndex++;
    } else {
      // Lines differ - show as removal then addition
      result.push({
        type: 'removed',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1,
      });
      result.push({
        type: 'added',
        content: newLines[newIndex],
        lineNumber: newIndex + 1,
      });
      oldIndex++;
      newIndex++;
    }
  }
  
  return result;
}

function DiffContent({
  oldVersion,
  newVersion,
}: {
  oldVersion: LyricsVersion | null;
  newVersion: LyricsVersion | null;
}) {
  const diffLines = useMemo(() => {
    if (!oldVersion || !newVersion) return [];
    return computeDiff(oldVersion.lyrics, newVersion.lyrics);
  }, [oldVersion, newVersion]);

  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length;
    const removed = diffLines.filter(l => l.type === 'removed').length;
    return { added, removed };
  }, [diffLines]);

  if (!oldVersion || !newVersion) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">
          Выберите версии для сравнения
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Version headers */}
      <div className="grid grid-cols-2 gap-2 p-4 border-b border-border/50">
        <Card className="p-3 bg-red-500/5 border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs border-red-500/50">
              v{oldVersion.version_number}
            </Badge>
            <span className="text-xs text-muted-foreground">Старая</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(oldVersion.created_at), {
              addSuffix: true,
              locale: ru,
            })}
          </p>
        </Card>
        
        <Card className="p-3 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs border-green-500/50">
              v{newVersion.version_number}
            </Badge>
            <span className="text-xs text-muted-foreground">Новая</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(newVersion.created_at), {
              addSuffix: true,
              locale: ru,
            })}
          </p>
        </Card>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 text-xs">
        <span className="text-green-500">+{stats.added} добавлено</span>
        <span className="text-red-500">-{stats.removed} удалено</span>
      </div>

      {/* Diff view */}
      <ScrollArea className="flex-1">
        <div className="p-4 font-mono text-sm">
          {diffLines.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: line.type === 'added' ? 10 : line.type === 'removed' ? -10 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.01 }}
              className={cn(
                'py-0.5 px-2 rounded-sm',
                line.type === 'added' && 'bg-green-500/10 text-green-700 dark:text-green-400',
                line.type === 'removed' && 'bg-red-500/10 text-red-700 dark:text-red-400 line-through opacity-70',
                line.type === 'unchanged' && 'text-muted-foreground'
              )}
            >
              <span className="select-none mr-3 opacity-50">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              {line.content || ' '}
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function LyricsVersionDiff(props: LyricsVersionDiffProps) {
  const isMobile = useIsMobile();
  const { open, onOpenChange, oldVersion, newVersion } = props;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Сравнение версий
            </DrawerTitle>
          </DrawerHeader>
          <DiffContent oldVersion={oldVersion} newVersion={newVersion} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Сравнение версий
          </SheetTitle>
        </SheetHeader>
        <DiffContent oldVersion={oldVersion} newVersion={newVersion} />
      </SheetContent>
    </Sheet>
  );
}
