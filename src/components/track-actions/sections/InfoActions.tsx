import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Info, Globe, Lock, Pencil } from 'lucide-react';
import { Track } from '@/types/track';
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
  const showTogglePublic = isActionAvailable('toggle_public', track, state);
  const showRename = isActionAvailable('rename', track, state);

  if (!showDetails && !showTogglePublic && !showRename) return null;

  if (variant === 'dropdown') {
    return (
      <>
        {showDetails && (
          <DropdownMenuItem onClick={() => onAction('details')}>
            <Info className="w-4 h-4 mr-2" />
            Детали трека
          </DropdownMenuItem>
        )}
        {showRename && (
          <DropdownMenuItem onClick={() => onAction('rename')}>
            <Pencil className="w-4 h-4 mr-2" />
            Переименовать
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
                Опубликовать
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
          className="w-full justify-start gap-3 h-11"
          onClick={() => onAction('details')}
        >
          <Info className="w-4 h-4" />
          <span>Детали трека</span>
        </Button>
      )}
      {showRename && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11"
          onClick={() => onAction('rename')}
        >
          <Pencil className="w-4 h-4" />
          <span>Переименовать</span>
        </Button>
      )}
      {showTogglePublic && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11"
          onClick={() => onAction('toggle_public')}
          disabled={isProcessing}
        >
          {track.is_public ? (
            <>
              <Lock className="w-4 h-4" />
              <span>Сделать приватным</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span>Опубликовать</span>
            </>
          )}
        </Button>
      )}
    </>
  );
}
