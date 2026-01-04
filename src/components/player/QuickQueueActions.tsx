/**
 * Quick Queue Actions Component
 * 
 * Provides quick actions for adding tracks to queue:
 * - Play Next (adds track after current)
 * - Add to Queue (adds track to end)
 * - Play Now (replaces queue)
 * 
 * With haptic feedback and toast notifications
 */

import { Play, ListPlus, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { usePlaybackQueue } from '@/hooks/audio/usePlaybackQueue';
import type { Track } from '@/types/track';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickQueueActionsProps {
  track: Track;
  variant?: 'icon' | 'button' | 'dropdown';
  className?: string;
  iconClassName?: string;
  showLabels?: boolean;
}

export function QuickQueueActions({
  track,
  variant = 'dropdown',
  className,
  iconClassName,
  showLabels = false,
}: QuickQueueActionsProps) {
  const { addTrack, playNext } = usePlaybackQueue();

  /**
   * Play track now (replace queue)
   */
  const handlePlayNow = () => {
    hapticImpact('medium');
    addTrack(track, true);
    toast.success('Воспроизведение', {
      description: `${track.title}`,
    });
  };

  /**
   * Add track to play next (after current track)
   */
  const handlePlayNext = () => {
    hapticImpact('light');
    playNext(track);
    toast.success('Добавлено в очередь', {
      description: `Играет следующим: ${track.title}`,
    });
  };

  /**
   * Add track to end of queue
   */
  const handleAddToQueue = () => {
    hapticImpact('light');
    addTrack(track, false);
    toast.success('Добавлено в очередь', {
      description: `${track.title}`,
    });
  };

  // Icon buttons variant
  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayNow}
          className={cn('h-9 w-9', iconClassName)}
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleAddToQueue}
          className={cn('h-9 w-9', iconClassName)}
        >
          <ListPlus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Regular buttons variant
  if (variant === 'button') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button
          variant="default"
          onClick={handlePlayNow}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          Играть сейчас
        </Button>
        <Button
          variant="outline"
          onClick={handlePlayNext}
          className="w-full"
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Играть следующим
        </Button>
        <Button
          variant="ghost"
          onClick={handleAddToQueue}
          className="w-full"
        >
          <ListPlus className="h-4 w-4 mr-2" />
          В конец очереди
        </Button>
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={className}
        >
          <ListPlus className="h-4 w-4 mr-2" />
          {showLabels && 'В очередь'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handlePlayNow}>
          <Play className="h-4 w-4 mr-2" />
          <span>Играть сейчас</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePlayNext}>
          <PlayCircle className="h-4 w-4 mr-2" />
          <span>Играть следующим</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToQueue}>
          <ListPlus className="h-4 w-4 mr-2" />
          <span>В конец очереди</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
