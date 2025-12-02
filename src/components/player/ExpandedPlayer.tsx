import { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChevronDown, List, Heart } from 'lucide-react';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { QueueSheet } from './QueueSheet';
import { useTracks } from '@/hooks/useTracksOptimized';
import { cn } from '@/lib/utils';

interface ExpandedPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMaximize: () => void;
}

export function ExpandedPlayer({ open, onOpenChange, onMaximize }: ExpandedPlayerProps) {
  const { activeTrack } = usePlayerStore();
  const { toggleLike } = useTracks();
  const [queueOpen, setQueueOpen] = useState(false);

  const {
    isPlaying,
    currentTime,
    duration,
    buffered,
    seek,
  } = useAudioPlayer({
    trackId: activeTrack?.id || '',
    streamingUrl: activeTrack?.streaming_url,
    localAudioUrl: activeTrack?.local_audio_url,
    audioUrl: activeTrack?.audio_url,
  });

  if (!activeTrack) return null;

  const handleLike = () => {
    if (!activeTrack) return;
    toggleLike({
      trackId: activeTrack.id,
      isLiked: activeTrack.is_liked || false,
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[40vh] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 touch-manipulation"
              aria-label="Close"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQueueOpen(true)}
                className="h-10 w-10 touch-manipulation"
                aria-label="Queue"
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Cover Art */}
          <div className="flex justify-center mb-6">
            <button
              onClick={onMaximize}
              className="relative group cursor-pointer"
              aria-label="Expand to fullscreen"
            >
              <img
                src={activeTrack.cover_url || '/placeholder-cover.png'}
                alt={activeTrack.title || 'Track cover'}
                className="w-32 h-32 rounded-lg shadow-lg object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
            </button>
          </div>

          {/* Track Info */}
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg line-clamp-1">
              {activeTrack.title || 'Untitled Track'}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {activeTrack.style || 'Unknown Style'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              buffered={buffered}
              onSeek={seek}
            />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={cn(
                'h-10 w-10 touch-manipulation',
                activeTrack.is_liked && 'text-red-500'
              )}
              aria-label={activeTrack.is_liked ? 'Unlike' : 'Like'}
            >
              <Heart className="h-5 w-5" fill={activeTrack.is_liked ? 'currentColor' : 'none'} />
            </Button>

            <div className="flex-1 max-w-md">
              <PlaybackControls size="medium" />
            </div>

            <div className="w-10" /> {/* Spacer for symmetry */}
          </div>
        </SheetContent>
      </Sheet>

      {/* Queue Sheet */}
      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
    </>
  );
}
