/**
 * PlayerActionsBar - Unified action buttons for fullscreen player
 * 
 * Provides consistent actions: Like, Add to Playlist, Download, Share, Studio, More
 */

import { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ListPlus, 
  Download, 
  Share2, 
  Layers, 
  MoreHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTracks } from '@/hooks/useTracks';
import { useTrackActions } from '@/hooks/useTrackActions';
import { UnifiedTrackMenu } from '@/components/track-actions/UnifiedTrackMenu';
import { AddToPlaylistDialog } from '@/components/track/AddToPlaylistDialog';
import type { Track } from '@/types/track';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

interface PlayerActionsBarProps {
  track: Track;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showStudioButton?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { button: 'h-9 w-9', icon: 'h-4 w-4' },
  md: { button: 'h-11 w-11', icon: 'h-5 w-5' },
  lg: { button: 'h-12 w-12', icon: 'h-6 w-6' },
};

export const PlayerActionsBar = memo(function PlayerActionsBar({
  track,
  variant = 'horizontal',
  size = 'md',
  showLabels = false,
  showStudioButton = true,
  className,
}: PlayerActionsBarProps) {
  const navigate = useNavigate();
  const { toggleLike, downloadTrack } = useTracks();
  const { handleShare } = useTrackActions();
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  
  const config = sizeConfig[size];

  const handleLike = useCallback(() => {
    hapticImpact('light');
    toggleLike({ trackId: track.id, isLiked: track.is_liked ?? false });
  }, [track.id, track.is_liked, toggleLike]);

  const handleAddToPlaylist = useCallback(() => {
    hapticImpact('light');
    setPlaylistDialogOpen(true);
  }, []);

  const handleDownload = useCallback(() => {
    hapticImpact('light');
    const audioUrl = track.streaming_url || track.audio_url;
    if (audioUrl) {
      downloadTrack({ 
        trackId: track.id, 
        audioUrl, 
        coverUrl: track.cover_url || undefined 
      });
    }
  }, [track, downloadTrack]);

  const handleShareClick = useCallback(() => {
    hapticImpact('light');
    handleShare(track);
  }, [track, handleShare]);

  const handleOpenStudio = useCallback(() => {
    hapticImpact('light');
    navigate(`/studio-v2/track/${track.id}`);
  }, [track.id, navigate]);

  const isVertical = variant === 'vertical';
  const audioUrl = track.streaming_url || track.audio_url;

  const actions = [
    {
      id: 'like',
      icon: Heart,
      label: track.is_liked ? 'Unlike' : 'Like',
      onClick: handleLike,
      active: track.is_liked,
      activeClass: 'text-red-500',
      fill: track.is_liked,
    },
    {
      id: 'playlist',
      icon: ListPlus,
      label: 'Add to Playlist',
      onClick: handleAddToPlaylist,
    },
    {
      id: 'download',
      icon: Download,
      label: 'Download',
      onClick: handleDownload,
      disabled: !audioUrl,
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Share',
      onClick: handleShareClick,
    },
    ...(showStudioButton ? [{
      id: 'studio',
      icon: Layers,
      label: 'Open in Studio',
      onClick: handleOpenStudio,
    }] : []),
  ];

  return (
    <>
      <div 
        className={cn(
          'flex items-center',
          isVertical ? 'flex-col gap-2' : 'gap-1 md:gap-2',
          className
        )}
      >
        <TooltipProvider delayDuration={300}>
          {actions.map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    config.button,
                    'touch-manipulation rounded-full hover:bg-muted/50',
                    action.active && action.activeClass
                  )}
                  aria-label={action.label}
                >
                  <action.icon 
                    className={cn(
                      config.icon,
                      action.fill && 'fill-current'
                    )} 
                  />
                  {showLabels && (
                    <span className="sr-only md:not-sr-only md:ml-2 text-xs">
                      {action.label}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isVertical ? 'left' : 'bottom'}>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* More Actions - UnifiedTrackMenu */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <UnifiedTrackMenu track={track} />
              </div>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? 'left' : 'bottom'}>
              <p>More Actions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        track={track}
      />
    </>
  );
});

export default PlayerActionsBar;
