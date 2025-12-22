/**
 * LyricsHistoryBar - Compact undo/redo bar with history access
 */

import { useCallback, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { Undo2, Redo2, History, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useLyricsHistoryStore, LyricsHistoryEntry } from '@/stores/useLyricsHistoryStore';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

interface LyricsHistoryBarProps {
  onStateChange?: (entry: LyricsHistoryEntry) => void;
  onOpenVersions?: () => void;
  className?: string;
}

export function LyricsHistoryBar({ 
  onStateChange, 
  onOpenVersions,
  className 
}: LyricsHistoryBarProps) {
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    getHistoryLength, 
    getHistoryIndex 
  } = useLyricsHistoryStore();

  const handleUndo = useCallback(() => {
    if (!canUndo()) return;
    
    hapticImpact('light');
    const entry = undo();
    if (entry && onStateChange) {
      onStateChange(entry);
    }
  }, [undo, canUndo, onStateChange]);

  const handleRedo = useCallback(() => {
    if (!canRedo()) return;
    
    hapticImpact('light');
    const entry = redo();
    if (entry && onStateChange) {
      onStateChange(entry);
    }
  }, [redo, canRedo, onStateChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (modKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (modKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (modKey && e.key === 'h') {
        e.preventDefault();
        onOpenVersions?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, onOpenVersions]);

  const historyLength = getHistoryLength();
  const currentIndex = getHistoryIndex();

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-muted/50 border-t border-border/50',
          className
        )}
      >
        {/* Undo button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={!canUndo()}
              className="h-8 w-8"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Отменить (Ctrl+Z)
          </TooltipContent>
        </Tooltip>

        {/* Redo button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={!canRedo()}
              className="h-8 w-8"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Повторить (Ctrl+Shift+Z)
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="w-px h-5 bg-border/50" />

        {/* History counter */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{currentIndex + 1}/{historyLength}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Open versions panel */}
        {onOpenVersions && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  hapticImpact('light');
                  onOpenVersions();
                }}
                className="h-7 text-xs gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Версии
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              История версий (Ctrl+H)
            </TooltipContent>
          </Tooltip>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
