import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Layers, Scissors, Wand2, Music2, FileMusic, RefreshCw } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ProBadge } from '@/components/ui/pro-badge';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface StudioActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function StudioActions({ track, state, onAction, variant, isProcessing }: StudioActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const showStudio = isActionAvailable('open_studio', track, state);
  const showReplaceSection = isActionAvailable('replace_section', track, state);
  const showStemsSimple = isActionAvailable('stems_simple', track, state);
  const showStemsDetailed = isActionAvailable('stems_detailed', track, state);
  const showMidi = isActionAvailable('transcribe_midi', track, state);
  const showNotes = isActionAvailable('transcribe_notes', track, state);

  const hasAnyAction = showStudio || showReplaceSection || showStemsSimple || showStemsDetailed || showMidi || showNotes;
  if (!hasAnyAction) return null;

  if (variant === 'dropdown') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Layers className="w-4 h-4 mr-2" />
          Открыть в студии
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {showStudio && (
            <DropdownMenuItem onClick={() => onAction('open_studio')}>
              <Layers className="w-4 h-4 mr-2" />
              Открыть студию
              {state.stemCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">{state.stemCount} стемов</span>
              )}
            </DropdownMenuItem>
          )}
          {showReplaceSection && (
            <DropdownMenuItem onClick={() => onAction('replace_section')}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Замена секции
            </DropdownMenuItem>
          )}
          {showStemsSimple && (
            <DropdownMenuItem onClick={() => onAction('stems_simple')} disabled={isProcessing}>
              <Scissors className="w-4 h-4 mr-2" />
              Стемы (2 дорожки)
            </DropdownMenuItem>
          )}
          {showStemsDetailed && (
            <DropdownMenuItem onClick={() => onAction('stems_detailed')} disabled={isProcessing}>
              <Wand2 className="w-4 h-4 mr-2" />
              Стемы (6+ дорожек)
            </DropdownMenuItem>
          )}
          {showMidi && (
            <DropdownMenuItem onClick={() => onAction('transcribe_midi')}>
              <Music2 className="w-4 h-4 mr-2" />
              MIDI
              <ProBadge size="sm" className="ml-auto" />
            </DropdownMenuItem>
          )}
          {showNotes && (
            <DropdownMenuItem onClick={() => onAction('transcribe_notes')}>
              <FileMusic className="w-4 h-4 mr-2" />
              Ноты
              <ProBadge size="sm" className="ml-auto" />
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
            <Layers className="w-5 h-5" />
            <span>Открыть в студии</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {showStudio && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('open_studio')}
          >
            <Layers className="w-4 h-4" />
            <span>Открыть студию</span>
            {state.stemCount > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">{state.stemCount} стемов</span>
            )}
          </Button>
        )}
        {showReplaceSection && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('replace_section')}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Замена секции</span>
          </Button>
        )}
        {showStemsSimple && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('stems_simple')}
            disabled={isProcessing}
          >
            <Scissors className="w-4 h-4" />
            <span>Стемы (2 дорожки)</span>
          </Button>
        )}
        {showStemsDetailed && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('stems_detailed')}
            disabled={isProcessing}
          >
            <Wand2 className="w-4 h-4" />
            <span>Стемы (6+ дорожек)</span>
          </Button>
        )}
        {showMidi && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('transcribe_midi')}
          >
            <Music2 className="w-4 h-4" />
            <span>MIDI</span>
            <ProBadge size="sm" className="ml-auto" />
          </Button>
        )}
        {showNotes && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('transcribe_notes')}
          >
            <FileMusic className="w-4 h-4" />
            <span>Ноты</span>
            <ProBadge size="sm" className="ml-auto" />
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
