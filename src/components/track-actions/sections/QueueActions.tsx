import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Play, ListPlus, Video } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { Badge } from '@/components/ui/badge';

interface QueueActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
}

export function QueueActions({ track, state, onAction, variant }: QueueActionsProps) {
  const showPlayNext = isActionAvailable('play_next', track, state);
  const showAddToQueue = isActionAvailable('add_to_queue', track, state);
  const showWatchVideo = isActionAvailable('watch_video', track, state);

  if (!showPlayNext && !showAddToQueue && !showWatchVideo) return null;

  if (variant === 'dropdown') {
    return (
      <>
        {showAddToQueue && (
          <DropdownMenuItem onClick={() => onAction('add_to_queue')}>
            <ListPlus className="w-4 h-4 mr-2" />
            Добавить в очередь
          </DropdownMenuItem>
        )}
        {showPlayNext && (
          <DropdownMenuItem onClick={() => onAction('play_next')}>
            <Play className="w-4 h-4 mr-2" />
            Воспроизвести следующим
          </DropdownMenuItem>
        )}
        {showWatchVideo && (
          <DropdownMenuItem onClick={() => onAction('watch_video')}>
            <Video className="w-4 h-4 mr-2 text-green-500" />
            Смотреть видео
          </DropdownMenuItem>
        )}
      </>
    );
  }

  // Sheet variant
  return (
    <>
      {showAddToQueue && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('add_to_queue')}
        >
          <ListPlus className="w-5 h-5" />
          <span>Добавить в очередь</span>
        </Button>
      )}
      {showPlayNext && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('play_next')}
        >
          <Play className="w-5 h-5" />
          <span>Воспроизвести следующим</span>
        </Button>
      )}
      {showWatchVideo && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('watch_video')}
        >
          <Video className="w-5 h-5 text-green-500" />
          <span>Смотреть видео</span>
          <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-600">
            Готово
          </Badge>
        </Button>
      )}
    </>
  );
}
