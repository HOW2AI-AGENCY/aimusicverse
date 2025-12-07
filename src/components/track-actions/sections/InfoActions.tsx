import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Info, FileText, Globe, Lock } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';

interface InfoActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function InfoActions({ track, state, onAction, variant, isProcessing }: InfoActionsProps) {
  const showDetails = isActionAvailable('details', track, state);
  const showLyrics = isActionAvailable('lyrics', track, state);
  const showTogglePublic = track.audio_url && track.status === 'completed';

  if (!showDetails && !showLyrics && !showTogglePublic) return null;

  if (variant === 'dropdown') {
    return (
      <>
        {showDetails && (
          <DropdownMenuItem onClick={() => onAction('details')}>
            <Info className="w-4 h-4 mr-2" />
            Детали трека
          </DropdownMenuItem>
        )}
        {showLyrics && (
          <DropdownMenuItem onClick={() => onAction('lyrics')}>
            <FileText className="w-4 h-4 mr-2" />
            Текст песни
          </DropdownMenuItem>
        )}
        {showTogglePublic && (
          <DropdownMenuItem onClick={() => onAction('toggle_public')} disabled={isProcessing}>
            {track.is_public ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Сделать приватным
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Сделать публичным
              </>
            )}
          </DropdownMenuItem>
        )}
      </>
    );
  }

  // Sheet variant
  return (
    <>
      {showDetails && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('details')}
        >
          <Info className="w-5 h-5" />
          <span>Детали трека</span>
        </Button>
      )}
      {showLyrics && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('lyrics')}
        >
          <FileText className="w-5 h-5" />
          <span>Текст песни</span>
        </Button>
      )}
      {showTogglePublic && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('toggle_public')}
          disabled={isProcessing}
        >
          {track.is_public ? (
            <>
              <Lock className="w-5 h-5" />
              <span>Сделать приватным</span>
            </>
          ) : (
            <>
              <Globe className="w-5 h-5" />
              <span>Сделать публичным</span>
            </>
          )}
        </Button>
      )}
    </>
  );
}
