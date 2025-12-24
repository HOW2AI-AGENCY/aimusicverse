/**
 * QuickStemsButton - Prominent CTA for stem separation
 * 
 * UX Improvement: Shows a visible button for stem separation
 * without requiring users to expand the studio actions collapsible
 */

import { Button } from '@/components/ui/button';
import { Scissors, Sparkles } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { cn } from '@/lib/utils';

interface QuickStemsButtonProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  isProcessing?: boolean;
  className?: string;
}

export function QuickStemsButton({
  track,
  state,
  onAction,
  isProcessing,
  className,
}: QuickStemsButtonProps) {
  const showStemsSimple = isActionAvailable('stems_simple', track, state);
  const showStemsDetailed = isActionAvailable('stems_detailed', track, state);
  
  // Don't show if no stem actions available
  if (!showStemsSimple && !showStemsDetailed) return null;
  
  // Already has stems - don't show prominent button
  if (state.stemCount > 0) return null;

  return (
    <div className={cn("p-3 rounded-lg bg-primary/5 border border-primary/20", className)}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Scissors className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Разделить на стемы</p>
          <p className="text-xs text-muted-foreground">
            Вокал, инструменты, бас, барабаны
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onAction(showStemsDetailed ? 'stems_detailed' : 'stems_simple')}
          disabled={isProcessing}
          className="shrink-0"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Открыть
        </Button>
      </div>
    </div>
  );
}
