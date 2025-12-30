/**
 * Queue Actions Section
 * 
 * Provides queue-related actions for track menus:
 * - Play Next (insert after current track)
 * - Add to Queue (add to end of queue)
 */

import { Play, PlayCircle, ListPlus, ListEnd } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { usePlaybackQueue } from '@/hooks/audio/usePlaybackQueue';
import type { Track } from '@/types/track';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

interface QueueActionsProps {
  track: Track;
  variant?: 'menu' | 'sheet';
  onAction?: () => void;
}

/**
 * Queue actions for DropdownMenu
 */
export function QueueActionsMenu({ track, onAction }: QueueActionsProps) {
  const { playNext, addTrack, queue } = usePlaybackQueue();

  const handlePlayNext = () => {
    hapticImpact('light');
    playNext(track);
    toast.success('Играет следующим', {
      description: track.title,
    });
    onAction?.();
  };

  const handleAddToQueue = () => {
    hapticImpact('light');
    addTrack(track, false);
    toast.success('Добавлено в очередь', {
      description: track.title,
    });
    onAction?.();
  };

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handlePlayNext}>
        <PlayCircle className="w-4 h-4 mr-2" />
        <span>Играть следующим</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleAddToQueue}>
        <ListEnd className="w-4 h-4 mr-2" />
        <span>Добавить в очередь</span>
        {queue.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            #{queue.length + 1}
          </span>
        )}
      </DropdownMenuItem>
    </>
  );
}

/**
 * Queue actions for Sheet/Bottom Sheet
 */
export function QueueActionsSheet({ track, onAction }: QueueActionsProps) {
  const { playNext, addTrack, queue } = usePlaybackQueue();

  const handlePlayNext = () => {
    hapticImpact('light');
    playNext(track);
    toast.success('Играет следующим', {
      description: track.title,
    });
    onAction?.();
  };

  const handleAddToQueue = () => {
    hapticImpact('light');
    addTrack(track, false);
    toast.success('Добавлено в очередь', {
      description: track.title,
    });
    onAction?.();
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-1 mb-2">
        Очередь
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start h-11 rounded-xl"
        onClick={handlePlayNext}
      >
        <PlayCircle className="w-4 h-4 mr-3" />
        Играть следующим
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start h-11 rounded-xl"
        onClick={handleAddToQueue}
      >
        <ListEnd className="w-4 h-4 mr-3" />
        <span className="flex-1 text-left">Добавить в очередь</span>
        {queue.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            #{queue.length + 1}
          </span>
        )}
      </Button>
    </div>
  );
}

/**
 * Unified export for both variants
 */
export function QueueActions({ track, variant = 'menu', onAction }: QueueActionsProps) {
  if (variant === 'sheet') {
    return <QueueActionsSheet track={track} onAction={onAction} />;
  }
  return <QueueActionsMenu track={track} onAction={onAction} />;
}
