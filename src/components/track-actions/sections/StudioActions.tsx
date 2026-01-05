import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Layers, Scissors, Wand2, Music2, FileMusic, RefreshCw } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { ProBadge } from '@/components/ui/pro-badge';

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

  // Sheet variant - flat list with colored icons
  return (
    <div className="space-y-1">
      {showStudio && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-blue-500/10 group"
          onClick={() => onAction('open_studio')}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <span className="font-medium">Открыть студию</span>
          {state.stemCount > 0 && (
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {state.stemCount} стемов
            </span>
          )}
        </Button>
      )}
      {showReplaceSection && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-amber-500/10 group"
          onClick={() => onAction('replace_section')}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-medium">Замена секции</span>
        </Button>
      )}
      {showStemsSimple && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-green-500/10 group"
          onClick={() => onAction('stems_simple')}
          disabled={isProcessing}
        >
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <Scissors className="w-4 h-4 text-green-500" />
          </div>
          <span className="font-medium">Стемы (2 дорожки)</span>
          <span className="ml-auto text-xs text-muted-foreground">Быстро</span>
        </Button>
      )}
      {showStemsDetailed && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-purple-500/10 group"
          onClick={() => onAction('stems_detailed')}
          disabled={isProcessing}
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Wand2 className="w-4 h-4 text-purple-500" />
          </div>
          <span className="font-medium">Стемы (6+ дорожек)</span>
          <span className="ml-auto text-xs text-muted-foreground">Детально</span>
        </Button>
      )}
      {showMidi && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-pink-500/10 group"
          onClick={() => onAction('transcribe_midi')}
        >
          <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
            <Music2 className="w-4 h-4 text-pink-500" />
          </div>
          <span className="font-medium">MIDI</span>
          <ProBadge size="sm" className="ml-auto" />
        </Button>
      )}
      {showNotes && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-orange-500/10 group"
          onClick={() => onAction('transcribe_notes')}
        >
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
            <FileMusic className="w-4 h-4 text-orange-500" />
          </div>
          <span className="font-medium">Ноты</span>
          <ProBadge size="sm" className="ml-auto" />
        </Button>
      )}
    </div>
  );
}
