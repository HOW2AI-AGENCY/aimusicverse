/**
 * ChordSheet
 * Bottom sheet displaying all chords with diagrams
 * Phase 3 - Guitar Chord Display
 */

import { memo, useCallback, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { 
  Guitar, X, Play, Clock, Download, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ChordDiagram } from '@/components/guitar/ChordDiagram';
import type { ChordData } from './ChordOverlay';

interface ChordSheetProps {
  open: boolean;
  onClose: () => void;
  trackName: string;
  chords: ChordData[];
  currentTime?: number;
  onSeekToChord?: (time: number) => void;
  onExport?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const ChordSheet = memo(function ChordSheet({
  open,
  onClose,
  trackName,
  chords,
  currentTime = 0,
  onSeekToChord,
  onExport,
}: ChordSheetProps) {
  const haptic = useHapticFeedback();

  // Telegram safe area padding
  const safeAreaBottom = `calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))`;

  // Get unique chords with counts
  const uniqueChords = useMemo(() => {
    const counts = new Map<string, number>();
    chords.forEach(c => {
      counts.set(c.chord, (counts.get(c.chord) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([chord, count]) => ({ chord, count }));
  }, [chords]);

  // Find current chord index
  const currentChordIndex = useMemo(() => {
    return chords.findIndex(c => currentTime >= c.start && currentTime < c.end);
  }, [chords, currentTime]);

  // Handle chord click
  const handleChordClick = useCallback((time: number) => {
    haptic.tap();
    onSeekToChord?.(time);
  }, [haptic, onSeekToChord]);

  // Handle close
  const handleClose = useCallback(() => {
    haptic.tap();
    onClose();
  }, [haptic, onClose]);

  // Handle export
  const handleExport = useCallback(() => {
    haptic.tap();
    onExport?.();
  }, [haptic, onExport]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] rounded-t-2xl p-0 flex flex-col"
        style={{ paddingBottom: safeAreaBottom }}
      >
        {/* Header */}
        <SheetHeader className="flex-shrink-0 px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Guitar className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <SheetTitle className="text-left text-base">
                  Аккорды
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {trackName} • {uniqueChords.length} уникальных
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-6">
            {/* Unique chords with diagrams */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Guitar className="w-4 h-4" />
                Диаграммы аккордов
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {uniqueChords.map(({ chord, count }) => (
                  <motion.div
                    key={chord}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <ChordDiagram chord={chord} size="sm" />
                    <Badge variant="secondary" className="mt-1 text-[10px] h-4">
                      ×{count}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Chord progression (timeline) */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Прогрессия по времени
              </h4>
              <div className="space-y-1">
                {chords.map((chord, index) => {
                  const isCurrent = index === currentChordIndex;
                  
                  return (
                    <motion.button
                      key={`${chord.chord}-${chord.start}-${index}`}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg",
                        "transition-colors text-left",
                        isCurrent 
                          ? "bg-primary/10 border border-primary/30" 
                          : "bg-card/50 hover:bg-card border border-transparent"
                      )}
                      onClick={() => handleChordClick(chord.start)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono w-10">
                          {formatTime(chord.start)}
                        </span>
                        <span className={cn(
                          "font-bold text-sm",
                          isCurrent && "text-primary"
                        )}>
                          {chord.chord}
                        </span>
                        {chord.confidence && chord.confidence < 0.7 && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            ~{Math.round(chord.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {((chord.end - chord.start)).toFixed(1)}s
                        </span>
                        {onSeekToChord && (
                          <Play className={cn(
                            "w-3 h-3",
                            isCurrent ? "text-primary" : "text-muted-foreground"
                          )} />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Quick chord summary */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">Последовательность</p>
              <p className="text-sm font-mono leading-relaxed">
                {chords.slice(0, 16).map(c => c.chord).join(' → ')}
                {chords.length > 16 && ' ...'}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});

export type { ChordSheetProps };
