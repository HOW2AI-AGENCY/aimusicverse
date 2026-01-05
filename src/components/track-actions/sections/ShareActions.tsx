import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Share2, Video, Send, Link, ListMusic, Folder, Loader2, CheckCircle2 } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, isActionDisabled, getActionLabel } from '@/lib/trackActionConditions';
import { IconGridButton } from '../IconGridButton';

interface ShareActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function ShareActions({ track, state, onAction, variant, isProcessing }: ShareActionsProps) {
  const showTelegram = isActionAvailable('send_telegram', track, state);
  const showCopyLink = isActionAvailable('copy_link', track, state);
  const showPlaylist = isActionAvailable('add_to_playlist', track, state);
  const showProject = isActionAvailable('add_to_project', track, state);

  const hasAnyAction = showTelegram || showCopyLink || showPlaylist || showProject;
  if (!hasAnyAction) return null;

  if (variant === 'dropdown') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Share2 className="w-4 h-4 mr-2" />
          Поделиться
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {showTelegram && (
            <DropdownMenuItem onClick={() => onAction('send_telegram')} disabled={isProcessing}>
              <Send className="w-4 h-4 mr-2" />
              Отправить в Telegram
            </DropdownMenuItem>
          )}
          {showCopyLink && (
            <DropdownMenuItem onClick={() => onAction('copy_link')}>
              <Link className="w-4 h-4 mr-2" />
              Скопировать ссылку
            </DropdownMenuItem>
          )}
          {showPlaylist && (
            <DropdownMenuItem onClick={() => onAction('add_to_playlist')}>
              <ListMusic className="w-4 h-4 mr-2" />
              В плейлист
            </DropdownMenuItem>
          )}
          {showProject && (
            <DropdownMenuItem onClick={() => onAction('add_to_project')}>
              <Folder className="w-4 h-4 mr-2" />
              В проект
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Sheet variant - Icon Grid Layout
  return (
    <div className="grid grid-cols-4 gap-1 mt-1">
      {showTelegram && (
        <IconGridButton
          icon={Send}
          label="Telegram"
          color="blue"
          onClick={() => onAction('send_telegram')}
          disabled={isProcessing}
        />
      )}
      {showCopyLink && (
        <IconGridButton
          icon={Link}
          label="Ссылка"
          color="muted"
          onClick={() => onAction('copy_link')}
        />
      )}
      {showPlaylist && (
        <IconGridButton
          icon={ListMusic}
          label="Плейлист"
          color="amber"
          onClick={() => onAction('add_to_playlist')}
        />
      )}
      {showProject && (
        <IconGridButton
          icon={Folder}
          label="Проект"
          color="green"
          onClick={() => onAction('add_to_project')}
        />
      )}
    </div>
  );
}
