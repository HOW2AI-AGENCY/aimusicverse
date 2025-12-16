import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Download, FileAudio, FileMusic, Archive } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, getActionLabel } from '@/lib/trackActionConditions';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DownloadActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function DownloadActions({ track, state, onAction, variant, isProcessing }: DownloadActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const showMp3 = isActionAvailable('download_mp3', track, state);
  const showWav = isActionAvailable('download_wav', track, state);
  const showStems = isActionAvailable('download_stems', track, state);

  if (!showMp3 && !showWav && !showStems) return null;

  if (variant === 'dropdown') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Download className="w-4 h-4 mr-2" />
          Скачать
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {showMp3 && (
            <DropdownMenuItem onClick={() => onAction('download_mp3')}>
              <FileAudio className="w-4 h-4 mr-2" />
              MP3
            </DropdownMenuItem>
          )}
          {showWav && (
            <DropdownMenuItem onClick={() => onAction('download_wav')} disabled={isProcessing}>
              <FileMusic className="w-4 h-4 mr-2" />
              WAV
            </DropdownMenuItem>
          )}
          {showStems && (
            <DropdownMenuItem onClick={() => onAction('download_stems')}>
              <Archive className="w-4 h-4 mr-2" />
              {getActionLabel('download_stems', track, state)}
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
            <Download className="w-5 h-5" />
            <span>Скачать</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {showMp3 && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('download_mp3')}
          >
            <FileAudio className="w-4 h-4" />
            <span>MP3</span>
          </Button>
        )}
        {showWav && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('download_wav')}
            disabled={isProcessing}
          >
            <FileMusic className="w-4 h-4" />
            <span>WAV</span>
          </Button>
        )}
        {showStems && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('download_stems')}
          >
            <Archive className="w-4 h-4" />
            <span>{getActionLabel('download_stems', track, state)}</span>
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
