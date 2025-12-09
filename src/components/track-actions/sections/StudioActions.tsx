import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Layers, Scissors, Wand2, ImagePlus, FileAudio, Music2, Video, Loader2, CheckCircle2 } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, isActionDisabled, getActionLabel } from '@/lib/trackActionConditions';
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
  const showStemsSimple = isActionAvailable('stems_simple', track, state);
  const showStemsDetailed = isActionAvailable('stems_detailed', track, state);
  const showCover = isActionAvailable('generate_cover', track, state);
  const showWav = isActionAvailable('convert_wav', track, state);
  const showMidi = isActionAvailable('transcribe_midi', track, state);
  const showVideo = isActionAvailable('generate_video', track, state) || state.isVideoGenerating || state.hasVideo;

  const hasAnyStudioAction = showStudio || showStemsSimple || showStemsDetailed || showCover || showWav || showMidi || showVideo;
  if (!hasAnyStudioAction) return null;

  const getVideoIcon = () => {
    if (state.isVideoGenerating) return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    if (state.hasVideo) return <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />;
    return <Video className="w-4 h-4 mr-2" />;
  };

  if (variant === 'dropdown') {
    return (
      <>
        {/* Studio - shown directly if stems available */}
        {showStudio && (
          <DropdownMenuItem onClick={() => onAction('open_studio')}>
            <Layers className="w-4 h-4 mr-2" />
            Открыть в студии
            <span className="ml-auto text-xs text-muted-foreground">{state.stemCount} стемов</span>
          </DropdownMenuItem>
        )}

        {/* Processing submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Wand2 className="w-4 h-4 mr-2" />
            Обработка
            <ProBadge size="sm" className="ml-2" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
            {showStemsSimple && (
              <DropdownMenuItem onClick={() => onAction('stems_simple')} disabled={isProcessing}>
                <Scissors className="w-4 h-4 mr-2" />
                Стемы (простое)
              </DropdownMenuItem>
            )}
            {showStemsDetailed && (
              <DropdownMenuItem onClick={() => onAction('stems_detailed')} disabled={isProcessing}>
                <Wand2 className="w-4 h-4 mr-2" />
                Стемы (детальное)
              </DropdownMenuItem>
            )}
            {showCover && (
              <DropdownMenuItem onClick={() => onAction('generate_cover')} disabled={isProcessing}>
                <ImagePlus className="w-4 h-4 mr-2" />
                Обложка
              </DropdownMenuItem>
            )}
            {showWav && (
              <DropdownMenuItem onClick={() => onAction('convert_wav')} disabled={isProcessing}>
                <FileAudio className="w-4 h-4 mr-2" />
                WAV формат
              </DropdownMenuItem>
            )}
            {showMidi && (
              <DropdownMenuItem onClick={() => onAction('transcribe_midi')} disabled={isProcessing}>
                <Music2 className="w-4 h-4 mr-2" />
                MIDI файл
                <ProBadge size="sm" className="ml-auto" />
              </DropdownMenuItem>
            )}
            {showVideo && (
              <DropdownMenuItem 
                onClick={() => onAction('generate_video')} 
                disabled={isProcessing || isActionDisabled('generate_video', track, state, isProcessing || false)}
              >
                {getVideoIcon()}
                {getActionLabel('generate_video', track, state)}
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </>
    );
  }

  // Sheet variant
  return (
    <>
      {showStudio && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('open_studio')}
        >
          <Layers className="w-5 h-5" />
          <span>Открыть в студии</span>
          <span className="ml-auto text-xs text-muted-foreground">{state.stemCount} стемов</span>
        </Button>
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between gap-3 h-12"
          >
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5" />
              <span>Обработка</span>
              <ProBadge size="sm" />
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-1">
          {showStemsSimple && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={() => onAction('stems_simple')}
              disabled={isProcessing}
            >
              <Scissors className="w-4 h-4" />
              <span>Стемы (простое)</span>
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
              <span>Стемы (детальное)</span>
            </Button>
          )}
          {showCover && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={() => onAction('generate_cover')}
              disabled={isProcessing}
            >
              <ImagePlus className="w-4 h-4" />
              <span>Обложка</span>
            </Button>
          )}
          {showWav && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={() => onAction('convert_wav')}
              disabled={isProcessing}
            >
              <FileAudio className="w-4 h-4" />
              <span>WAV формат</span>
            </Button>
          )}
          {showMidi && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={() => onAction('transcribe_midi')}
              disabled={isProcessing}
            >
              <Music2 className="w-4 h-4" />
              <span>MIDI файл</span>
              <ProBadge size="sm" className="ml-auto" />
            </Button>
          )}
          {showVideo && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={() => onAction('generate_video')}
              disabled={isProcessing || isActionDisabled('generate_video', track, state, isProcessing || false)}
            >
              {state.isVideoGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : state.hasVideo ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              <span>{getActionLabel('generate_video', track, state)}</span>
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
