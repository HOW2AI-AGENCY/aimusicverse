import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Info, Globe, Lock, Pencil } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { IconGridButton } from '../IconGridButton';

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

  if (!showDetails && !showTogglePublic) return null;

  if (variant === 'dropdown') {
    return (
      <>
        {showDetails && (
          <DropdownMenuItem onClick={() => onAction('details')}>
            <Info className="w-4 h-4 mr-2" />
            Детали трека
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

  // Sheet variant - Icon Grid Layout
  return (
    <div className="grid grid-cols-4 gap-1">
      {showDetails && (
        <IconGridButton
          icon={Info}
          label="Детали"
          color="sky"
          onClick={() => onAction('details')}
        />
      )}
      {showTogglePublic && (
        <IconGridButton
          icon={track.is_public ? Lock : Globe}
          label={track.is_public ? 'Приватный' : 'Публичный'}
          color={track.is_public ? 'orange' : 'green'}
          onClick={() => onAction('toggle_public')}
          disabled={isProcessing}
        />
      )}
    </div>
  );
}
