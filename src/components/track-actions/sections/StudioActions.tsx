import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Layers, Scissors, Wand2, Music2, FileMusic, RefreshCw } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { ProBadge } from '@/components/ui/pro-badge';
import { IconGridButton } from '../IconGridButton';

interface StudioActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function StudioActions({ track, state, onAction, variant, isProcessing }: StudioActionsProps) {
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

  // Sheet variant - Icon Grid Layout
  return (
    <div className="grid grid-cols-4 gap-1">
      {showStudio && (
        <IconGridButton
          icon={Layers}
          label="Студия"
          color="blue"
          badge={state.stemCount > 0 ? state.stemCount : undefined}
          onClick={() => onAction('open_studio')}
        />
      )}
      {showReplaceSection && (
        <IconGridButton
          icon={RefreshCw}
          label="Секция"
          sublabel="Замена"
          color="amber"
          onClick={() => onAction('replace_section')}
        />
      )}
      {showStemsSimple && (
        <IconGridButton
          icon={Scissors}
          label="2 стема"
          sublabel="Быстро"
          color="green"
          onClick={() => onAction('stems_simple')}
          disabled={isProcessing}
        />
      )}
      {showStemsDetailed && (
        <IconGridButton
          icon={Wand2}
          label="6+ стемов"
          sublabel="Детально"
          color="purple"
          onClick={() => onAction('stems_detailed')}
          disabled={isProcessing}
        />
      )}
      {showMidi && (
        <IconGridButton
          icon={Music2}
          label="MIDI"
          color="pink"
          onClick={() => onAction('transcribe_midi')}
        />
      )}
      {showNotes && (
        <IconGridButton
          icon={FileMusic}
          label="Ноты"
          color="orange"
          onClick={() => onAction('transcribe_notes')}
        />
      )}
    </div>
  );
}
