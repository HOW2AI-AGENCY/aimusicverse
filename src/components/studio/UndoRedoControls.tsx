/**
 * Undo/Redo Controls Component
 * 
 * Visual controls for undo/redo operations in the studio.
 * Shows history position indicator.
 */

import { memo } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUndoRedo } from '@/hooks/studio/useUndoRedo';
import { cn } from '@/lib/utils';

interface UndoRedoControlsProps {
  className?: string;
  showHistoryIndicator?: boolean;
}

export const UndoRedoControls = memo(({
  className,
  showHistoryIndicator = true,
}: UndoRedoControlsProps) => {
  const { undo, redo, canUndo, canRedo, historyLength, historyIndex } = useUndoRedo();
  
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Отменить ({modKey}+Z)</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Повторить ({modKey}+Shift+Z)</p>
          </TooltipContent>
        </Tooltip>
        
        {showHistoryIndicator && historyLength > 1 && (
          <span className="text-xs text-muted-foreground tabular-nums ml-1">
            {historyIndex + 1}/{historyLength}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
});

UndoRedoControls.displayName = 'UndoRedoControls';
