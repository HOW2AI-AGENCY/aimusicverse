import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Heart, Mic, Volume2, Globe, Lock, MoreHorizontal, Layers, Music2, Trash2 } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrackActionsMenu } from './TrackActionsMenu';
import { TrackActionsSheet } from './TrackActionsSheet';
import { VersionPicker } from './library/VersionPicker';
import { TrackTypeIcons } from './library/TrackTypeIcons';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTouchEvents, triggerHapticFeedback } from '@/lib/mobile-utils';
import { toast } from 'sonner';
import { motion, PanInfo } from 'framer-motion';
import { hapticImpact, hapticNotification } from '@/lib/haptic';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TrackCardProps {
  track: Track;
  onPlay?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onToggleLike?: () => void;
  isPlaying?: boolean;
  layout?: 'grid' | 'list';
}

export const TrackCard = ({
  track,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  isPlaying,
  layout = 'grid',
}: TrackCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [versionCount, setVersionCount] = useState<number>(0);
  const [stemCount, setStemCount] = useState<number>(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: versionCount } = await supabase
        .from('track_versions')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);
      setVersionCount(versionCount || 0);

      const { count: stemsCount } = await supabase
        .from('track_stems')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);
      setStemCount(stemsCount || 0);
    };
    fetchCounts();
    
    // Subscribe to track_stems for real-time updates
    const stemsChannel = supabase
      .channel(`track-stems-${track.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'track_stems',
          filter: `track_id=eq.${track.id}`,
        },
        (payload) => {
          console.log('✅ New stem added:', payload);
          fetchCounts();
          toast.success('Стемы готовы! 🎵');
          setIsProcessing(false);
        }
      )
      .subscribe();

    // Subscribe to track_versions for real-time updates
    const versionsChannel = supabase
      .channel(`track-versions-${track.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'track_versions',
          filter: `track_id=eq.${track.id}`,
        },
        (payload) => {
          console.log('✅ New version added:', payload);
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stemsChannel);
      supabase.removeChannel(versionsChannel);
    };
  }, [track.id]);

  // Determine track type icon
  const getTrackIcon = () => {
    if (!track.has_vocals) {
      return <Volume2 className="w-3 h-3" />;
    }
    // Check if it's a stem
    if (track.generation_mode === 'separate_vocals') {
      return <Mic className="w-3 h-3" />;
    }
    return null;
  };

  const trackIcon = getTrackIcon();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('[data-play-button]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[data-radix-collection-item]')
    ) {
      return;
    }
    
    // Open actions sheet on both mobile and desktop
    if (isMobile) {
      triggerHapticFeedback('light');
    }
    setSheetOpen(true);
  };

  // Swipe gesture handlers for like/delete actions
  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 50;
    const offset = info.offset.x;
    
    setSwipeOffset(0); // Reset visual offset
    
    if (Math.abs(offset) >= threshold) {
      if (offset < -threshold) {
        // Swipe left: Like/Unlike
        hapticImpact('medium');
        onToggleLike?.();
        toast.success(track.is_liked ? '💔 Удалено из избранного' : '❤️ Добавлено в избранное');
      } else if (offset > threshold) {
        // Swipe right: Delete (with confirmation)
        hapticImpact('heavy');
        setDeleteDialogOpen(true);
      }
    }
  };

  const handleDrag = (_event: any, info: PanInfo) => {
    setSwipeOffset(info.offset.x);
  };

  const handleDelete = () => {
    hapticNotification('success');
    onDelete?.();
    setDeleteDialogOpen(false);
    toast.success('Трек удален');
  };

  // Touch gesture handlers for mobile interactions
  const touchHandlers = useTouchEvents({
    onSwipeLeft: () => {
      if (isMobile && layout === 'grid') {
        triggerHapticFeedback('light');
        setSheetOpen(true);
      }
    },
    onSwipeRight: () => {
      if (isMobile && sheetOpen) {
        triggerHapticFeedback('light');
        setSheetOpen(false);
      }
    },
    onLongPress: () => {
      if (isMobile) {
        triggerHapticFeedback('medium');
        setSheetOpen(true);
      }
    },
    threshold: 50,
    longPressDelay: 500,
  });

  if (layout === 'list') {
    return (
      <>
        <Card
          className="group grid grid-cols-[auto,1fr,auto] items-center gap-3 p-2 sm:p-3 transition-all hover:bg-muted/50 active:bg-muted touch-manipulation rounded-lg"
          onClick={handleCardClick}
          {...(isMobile ? touchHandlers : {})}
        >
          {/* Cover Image & Play Button */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-md overflow-hidden" data-play-button>
            <img
              src={track.cover_url || ''}
              alt={track.title || 'Track cover'}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/128x128/1a1a1a/ffffff?text=🎵')}
            />
            <div
              className={cn(
                "absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer transition-opacity",
                isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHapticFeedback('medium');
                onPlay?.(); 
              }}
            >
              <Button size="icon" variant="ghost" className="w-10 h-10 rounded-full text-white touch-manipulation">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
            </div>
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm sm:text-base truncate">{track.title || 'Без названия'}</h3>
              {/* Version Badge - only show if more than 1 version */}
              {versionCount > 1 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium flex-shrink-0">
                  <Layers className="h-2.5 w-2.5 mr-0.5" />
                  {versionCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground truncate">
                {track.style || track.tags?.split(',').slice(0, 2).join(', ') || 'Без стиля'}
              </span>
              {/* Type Icons */}
              <TrackTypeIcons track={track} compact />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant={isPlaying ? "default" : "ghost"}
              className={cn(
                "w-10 h-10 rounded-full touch-manipulation transition-colors",
                isPlaying && "bg-primary text-primary-foreground"
              )}
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHapticFeedback('medium');
                onPlay?.(); 
              }}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            {isMobile ? (
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 touch-manipulation"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  triggerHapticFeedback('light');
                  setSheetOpen(true); 
                }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            ) : (
              <TrackActionsMenu track={track} onDelete={onDelete} onDownload={onDownload} />
            )}
          </div>
        </Card>
        <TrackActionsSheet track={track} open={sheetOpen} onOpenChange={setSheetOpen} onDelete={onDelete} onDownload={onDownload} />
      </>
    );
  }


  return (
    <>
      <motion.div
        drag={isMobile && layout === 'grid' ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative"
      >
        {/* Swipe action indicators */}
        {isMobile && layout === 'grid' && (
          <>
            {/* Left swipe indicator (Like) */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-16 bg-red-500/20 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeOffset < -20 ? 1 : 0 }}
            >
              <Heart className="w-6 h-6 text-red-500" />
            </motion.div>
            
            {/* Right swipe indicator (Delete) */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-16 bg-destructive/20 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeOffset > 20 ? 1 : 0 }}
            >
              <Trash2 className="w-6 h-6 text-destructive" />
            </motion.div>
          </>
        )}
        
      <Card 
        className="group overflow-hidden hover:shadow-lg hover:border-primary/30 active:scale-[0.98] active:shadow-md transition-all duration-200 cursor-pointer touch-manipulation"
        onClick={handleCardClick}
        {...(isMobile && layout !== 'grid' ? touchHandlers : {})}
      >
        <div className="relative aspect-square" data-play-button>
          {track.cover_url && !imageError ? (
            <img
              src={track.cover_url}
              alt={track.title || 'Track cover'}
              className="w-full h-full object-cover cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.();
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.();
              }}
            >
              <div className="text-4xl font-bold text-primary/20">
                {track.title?.charAt(0) || '♪'}
              </div>
            </div>
          )}

          {/* Play button overlay - larger touch target on mobile */}
          <div className="absolute inset-0 bg-black/40 opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback('medium');
              onPlay?.();
            }}
          >
          <Button
            size="lg"
            className="rounded-full w-16 h-16 sm:w-14 sm:h-14 min-h-[44px] min-w-[44px] active:scale-95 transition-transform touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback('medium');
              onPlay?.();
            }}
            disabled={!track.audio_url}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-5 sm:h-5" />
            ) : (
              <Play className="w-6 h-6 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isProcessing && (
            <Badge variant="secondary" className="animate-pulse">
              ⚙️ Обработка...
            </Badge>
          )}
          
          {track.status && track.status !== 'completed' && !isProcessing && (
            <Badge
              variant={
                track.status === 'streaming_ready'
                  ? 'default'
                  : track.status === 'failed' || track.status === 'error'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {track.status === 'pending'
                ? 'В очереди'
                : track.status === 'processing'
                ? '⚡ Генерация'
                : track.status === 'streaming_ready'
                ? '🎵 Готов к стримингу'
                : track.status === 'completed'
                ? 'Готов'
                : track.status === 'failed'
                ? 'Ошибка'
                : track.status}
            </Badge>
          )}
          
          {trackIcon && (
            <Badge variant="secondary" className="gap-1">
              {trackIcon}
              {!track.has_vocals ? 'Инстр.' : 'Вокал'}
            </Badge>
          )}
        </div>

        {/* Badges - Versions and Stems */}
        <div className="absolute top-2 right-2 flex gap-1">
          {versionCount > 1 && (
            <VersionPicker
              trackId={track.id}
              activeVersionId={(track as any).active_version_id}
              onVersionChange={(version) => {
                console.log('Version changed:', version.version_label);
              }}
            />
          )}
          {stemCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Layers className="w-3 h-3" />
              {stemCount}
            </Badge>
          )}
        </div>
      </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">{track.title || 'Без названия'}</h3>
              <TrackTypeIcons track={track} />
            </div>
            {isMobile ? (
              <Button
                size="icon"
                variant="ghost"
                className="-mr-2 flex-shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] touch-manipulation active:scale-95 transition-transform"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  triggerHapticFeedback('light');
                  setSheetOpen(true); 
                }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
          ) : (
              <TrackActionsMenu track={track} onDelete={onDelete} onDownload={onDownload} />
          )}
        </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
             {track.artist_name && (
                <>
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={track.artist_avatar_url || ''} />
                    <AvatarFallback>{track.artist_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{track.artist_name}</span>
                </>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Button
              variant={track.is_liked ? 'secondary' : 'ghost'}
              size="sm"
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHapticFeedback('light');
                onToggleLike?.(); 
              }}
              className="flex items-center gap-1.5 px-2 h-11 min-h-[44px] touch-manipulation active:scale-95 transition-transform"
            >
              <Heart className={cn("w-4 h-4", track.is_liked && "fill-primary text-primary")} />
              <span>{track.likes_count || 0}</span>
            </Button>
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4" />
              <span>{track.play_count || 0}</span>
          </div>
        </div>
      </div>
    </Card>

    <TrackActionsSheet
      track={track}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      onDelete={onDelete}
      onDownload={onDownload}
    />
    
    </motion.div>
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить трек?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить "{track.title || 'Без названия'}"? Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => hapticImpact('light')}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};
