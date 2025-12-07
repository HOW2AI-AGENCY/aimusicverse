import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Plus, Mic, Volume2, Music, Pencil } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, getActionLabel } from '@/lib/trackActionConditions';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface EditActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function EditActions({ track, state, onAction, variant, isProcessing }: EditActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const showExtend = isActionAvailable('extend', track, state);
  const showAddVocals = isActionAvailable('add_vocals', track, state);
  const showAddInstrumental = isActionAvailable('add_instrumental', track, state);
  const showRemix = isActionAvailable('remix', track, state);

  const hasAnyEditAction = showExtend || showAddVocals || showAddInstrumental || showRemix;
  if (!hasAnyEditAction) return null;

  if (variant === 'dropdown') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Pencil className="w-4 h-4 mr-2" />
          Редактировать
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {showExtend && (
            <DropdownMenuItem onClick={() => onAction('extend')}>
              <Plus className="w-4 h-4 mr-2" />
              Расширить
            </DropdownMenuItem>
          )}
          {showAddVocals && (
            <DropdownMenuItem onClick={() => onAction('add_vocals')}>
              <Mic className="w-4 h-4 mr-2" />
              Добавить вокал
            </DropdownMenuItem>
          )}
          {showAddInstrumental && (
            <DropdownMenuItem onClick={() => onAction('add_instrumental')}>
              <Volume2 className="w-4 h-4 mr-2" />
              {getActionLabel('add_instrumental', track, state)}
            </DropdownMenuItem>
          )}
          {showRemix && (
            <DropdownMenuItem onClick={() => onAction('remix')} disabled={isProcessing}>
              <Music className="w-4 h-4 mr-2" />
              Ремикс
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Sheet variant
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-3 h-12"
        >
          <div className="flex items-center gap-3">
            <Pencil className="w-5 h-5" />
            <span>Редактировать</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {showExtend && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('extend')}
          >
            <Plus className="w-4 h-4" />
            <span>Расширить</span>
          </Button>
        )}
        {showAddVocals && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('add_vocals')}
          >
            <Mic className="w-4 h-4" />
            <span>Добавить вокал</span>
          </Button>
        )}
        {showAddInstrumental && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('add_instrumental')}
          >
            <Volume2 className="w-4 h-4" />
            <span>{getActionLabel('add_instrumental', track, state)}</span>
          </Button>
        )}
        {showRemix && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('remix')}
            disabled={isProcessing}
          >
            <Music className="w-4 h-4" />
            <span>Ремикс</span>
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
