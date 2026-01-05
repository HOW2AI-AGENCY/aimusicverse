import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Download, FileAudio, FileMusic, Archive } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, getActionLabel } from '@/lib/trackActionConditions';

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

  // Sheet variant - flat list for use inside ActionCategory
  return (
    <div className="space-y-1">
      {showMp3 && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-green-500/10 group"
          onClick={() => onAction('download_mp3')}
        >
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <FileAudio className="w-4 h-4 text-green-500" />
          </div>
          <span className="font-medium">MP3</span>
          <span className="ml-auto text-xs text-muted-foreground">Стандарт</span>
        </Button>
      )}
      {showWav && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-blue-500/10 group"
          onClick={() => onAction('download_wav')}
          disabled={isProcessing}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <FileMusic className="w-4 h-4 text-blue-500" />
          </div>
          <span className="font-medium">WAV</span>
          <span className="ml-auto text-xs text-muted-foreground">Без потерь</span>
        </Button>
      )}
      {showStems && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-purple-500/10 group"
          onClick={() => onAction('download_stems')}
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Archive className="w-4 h-4 text-purple-500" />
          </div>
          <span className="font-medium">{getActionLabel('download_stems', track, state)}</span>
        </Button>
      )}
    </div>
  );
}
