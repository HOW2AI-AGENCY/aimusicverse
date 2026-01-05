import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Download, FileAudio, FileMusic, Archive } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, getActionLabel } from '@/lib/trackActionConditions';
import { IconGridButton } from '../IconGridButton';

interface DownloadActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function DownloadActions({ track, state, onAction, variant, isProcessing }: DownloadActionsProps) {
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

  // Sheet variant - Icon Grid Layout
  return (
    <div className="grid grid-cols-4 gap-1">
      {showMp3 && (
        <IconGridButton
          icon={FileAudio}
          label="MP3"
          color="green"
          onClick={() => onAction('download_mp3')}
        />
      )}
      {showWav && (
        <IconGridButton
          icon={FileMusic}
          label="WAV"
          color="blue"
          onClick={() => onAction('download_wav')}
          disabled={isProcessing}
        />
      )}
      {showStems && (
        <IconGridButton
          icon={Archive}
          label="Стемы"
          badge={state.stemCount > 0 ? state.stemCount : undefined}
          color="purple"
          onClick={() => onAction('download_stems')}
        />
      )}
    </div>
  );
}
