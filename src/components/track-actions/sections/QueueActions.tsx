/**
 * Queue Actions Section
 * 
 * Provides queue-related actions for track menus:
 * - Play From Here (play this track and queue remaining)
 * - Play Next (insert after current track)
 * - Add to Queue (add to end of queue)
 */

import { Play, PlayCircle, ListEnd, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { usePlaybackQueue } from '@/hooks/audio/usePlaybackQueue';
import { useTrackInList } from '@/contexts/TrackListContext';
import type { Track } from '@/types/track';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

interface QueueActionsProps {
  track: Track;
  variant?: 'menu' | 'sheet';
  onAction?: () => void;
  /** List of tracks for "Play From Here" functionality (optional - uses context if not provided) */
  trackList?: Track[];
  /** Index of current track in the list (optional - uses context if not provided) */
  trackIndex?: number;
}

/**
 * Queue actions for DropdownMenu
 */
export function QueueActionsMenu({ 
  track, 
  onAction, 
  trackList: propTrackList, 
  trackIndex: propTrackIndex 
}: QueueActionsProps) {
  const { playNext, addTrack, queue, playFromIndex } = usePlaybackQueue();
  
  // Use context as fallback if props not provided
  const contextData = useTrackInList(track.id);
  const trackList = propTrackList ?? contextData.trackList;
  const trackIndex = propTrackIndex ?? contextData.trackIndex;

  const handlePlayFromHere = () => {
    if (!trackList || trackIndex === undefined || trackIndex < 0) return;
    
    hapticImpact('medium');
    playFromIndex(trackList, trackIndex);
    
    const remainingCount = trackList.length - trackIndex;
    toast.success('Воспроизведение', {
      description: `${track.title}${remainingCount > 1 ? ` и ещё ${remainingCount - 1}` : ''}`,
    });
    onAction?.();
  };

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

  const canPlayFromHere = trackList && trackIndex !== undefined && trackIndex >= 0;

  return (
    <>
      <DropdownMenuSeparator />
      {canPlayFromHere && (
        <DropdownMenuItem onClick={handlePlayFromHere}>
          <ListMusic className="w-4 h-4 mr-2" />
          <span>Играть отсюда</span>
          {trackList.length - trackIndex > 1 && (
            <span className="ml-auto text-xs text-muted-foreground">
              +{trackList.length - trackIndex - 1}
            </span>
          )}
        </DropdownMenuItem>
      )}
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
export function QueueActionsSheet({ 
  track, 
  onAction, 
  trackList: propTrackList, 
  trackIndex: propTrackIndex 
}: QueueActionsProps) {
  const { playNext, addTrack, queue, playFromIndex } = usePlaybackQueue();
  
  // Use context as fallback if props not provided
  const contextData = useTrackInList(track.id);
  const trackList = propTrackList ?? contextData.trackList;
  const trackIndex = propTrackIndex ?? contextData.trackIndex;

  const handlePlayFromHere = () => {
    if (!trackList || trackIndex === undefined || trackIndex < 0) return;
    
    hapticImpact('medium');
    playFromIndex(trackList, trackIndex);
    
    const remainingCount = trackList.length - trackIndex;
    toast.success('Воспроизведение', {
      description: `${track.title}${remainingCount > 1 ? ` и ещё ${remainingCount - 1}` : ''}`,
    });
    onAction?.();
  };

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

  const canPlayFromHere = trackList && trackIndex !== undefined && trackIndex >= 0;

  return (
    <div className="space-y-1.5">
      {canPlayFromHere && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-12 rounded-xl hover:bg-primary/10 group"
          onClick={handlePlayFromHere}
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
            <ListMusic className="w-4 h-4 text-primary" />
          </div>
          <span className="flex-1 text-left font-medium">Играть отсюда</span>
          {trackList.length - trackIndex > 1 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              +{trackList.length - trackIndex - 1}
            </span>
          )}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start h-12 rounded-xl hover:bg-blue-500/10 group"
        onClick={handlePlayNext}
      >
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-colors">
          <PlayCircle className="w-4 h-4 text-blue-500" />
        </div>
        <span className="font-medium">Играть следующим</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start h-12 rounded-xl hover:bg-green-500/10 group"
        onClick={handleAddToQueue}
      >
        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center mr-3 group-hover:bg-green-500/20 transition-colors">
          <ListEnd className="w-4 h-4 text-green-500" />
        </div>
        <span className="flex-1 text-left font-medium">Добавить в очередь</span>
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
export function QueueActions({ 
  track, 
  variant = 'menu', 
  onAction,
  trackList,
  trackIndex 
}: QueueActionsProps) {
  if (variant === 'sheet') {
    return (
      <QueueActionsSheet 
        track={track} 
        onAction={onAction} 
        trackList={trackList}
        trackIndex={trackIndex}
      />
    );
  }
  return (
    <QueueActionsMenu 
      track={track} 
      onAction={onAction} 
      trackList={trackList}
      trackIndex={trackIndex}
    />
  );
}
