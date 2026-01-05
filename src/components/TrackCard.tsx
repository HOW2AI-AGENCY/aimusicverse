import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Heart, Mic, Volume2, Globe, Lock, MoreHorizontal, Layers, Music2, Trash2, User, Wand2, ListMusic } from 'lucide-react';
import type { Track } from '@/types/track';
import { useState, useEffect, memo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UnifiedTrackMenu, UnifiedTrackSheet } from './track-actions';
import { InlineVersionToggle } from './library/InlineVersionToggle';
import { TrackTypeIcons } from './library/TrackTypeIcons';
import { TrackStyleTags } from './library/TrackStyleTags';
import { ScrollableTagsRow } from './library/ScrollableTagsRow';
import { MarqueeTitle } from './library/MarqueeTitle';
import { SwipeableTrackItem } from './library/SwipeableTrackItem';
import { SwipeOnboardingTooltip } from './library/SwipeOnboardingTooltip';
import { LazyImage } from '@/components/ui/lazy-image';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTouchEvents, triggerHapticFeedback } from '@/lib/mobile-utils';
import { notify } from '@/lib/notifications';
import { motion, PanInfo } from '@/lib/motion';
import { hapticImpact, hapticNotification } from '@/lib/haptic';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useQueuePosition } from '@/hooks/audio/useQueuePosition';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrackCardProps {
  track: Track;
  onPlay?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onToggleLike?: () => void;
  onTagClick?: (tag: string) => void;
  isPlaying?: boolean;
  layout?: 'grid' | 'list';
  // Counts passed from parent to avoid individual subscriptions
  versionCount?: number;
  stemCount?: number;
  // MIDI/PDF/GP5 status passed from parent
  hasMidi?: boolean;
  hasPdf?: boolean;
  hasGp5?: boolean;
  // For swipe onboarding tooltip
  isFirstSwipeableItem?: boolean;
}

export const TrackCard = memo(({
  track,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  onTagClick,
  isPlaying,
  layout = 'grid',
  versionCount: propVersionCount,
  stemCount: propStemCount,
  hasMidi: propHasMidi,
  hasPdf: propHasPdf,
  hasGp5: propHasGp5,
  isFirstSwipeableItem = false,
}: TrackCardProps) => {
  const [localVersionCount, setLocalVersionCount] = useState<number>(0);
  const [localStemCount, setLocalStemCount] = useState<number>(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const isMobile = useIsMobile();
  const { addToQueue } = usePlayerStore();
  const { isInQueue, position, isCurrentTrack, isNextTrack } = useQueuePosition(track.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Direct studio access handler
  const handleOpenStudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('medium');
    navigate(`/studio-v2/track/${track.id}`);
  };

  // Use prop counts if provided (from Library with useTrackCounts hook)
  // Otherwise fetch individually (for standalone usage)
  const versionCount = propVersionCount ?? localVersionCount;
  const stemCount = propStemCount ?? localStemCount;

  // Only fetch counts locally if not provided via props
  useEffect(() => {
    // Skip if counts are provided via props
    if (propVersionCount !== undefined && propStemCount !== undefined) return;

    const fetchCounts = async () => {
      const { count: vCount } = await supabase
        .from('track_versions')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);
      setLocalVersionCount(vCount || 0);

      const { count: sCount } = await supabase
        .from('track_stems')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);
      setLocalStemCount(sCount || 0);
    };
    fetchCounts();
    
    // Only subscribe if no props provided
    if (propVersionCount === undefined || propStemCount === undefined) {
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
            // Stem added - refresh counts
            fetchCounts();
            // Use centralized notification with deduplication
            notify.stemReady(track.title || undefined);
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
            // Version added - refresh counts
            fetchCounts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(stemsChannel);
        supabase.removeChannel(versionsChannel);
      };
    }
  }, [track.id, propVersionCount, propStemCount]);

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
      target.closest('[data-radix-collection-item]') ||
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('[data-menu-trigger]')
    ) {
      return;
    }
    
    // On mobile, open sheet. On desktop grid, also open sheet for details
    if (isMobile) {
      triggerHapticFeedback('light');
    }
    setSheetOpen(true);
  };

  // Swipe gesture handlers for like/delete actions
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const offset = info.offset.x;
    
    setSwipeOffset(0); // Reset visual offset
    
    if (Math.abs(offset) >= threshold) {
      if (offset < -threshold) {
        // Swipe left: Like/Unlike
        hapticImpact('medium');
        onToggleLike?.();
        notify.trackLiked(!track.is_liked);
      } else if (offset > threshold) {
        // Swipe right: Delete (with confirmation)
        hapticImpact('heavy');
        setDeleteDialogOpen(true);
      }
    }
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setSwipeOffset(info.offset.x);
  };

  const handleDelete = () => {
    hapticNotification('success');
    onDelete?.();
    setDeleteDialogOpen(false);
    notify.trackDeleted();
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

  // Swipe action handlers
  const handleSwipeAddToQueue = () => {
    if (track.audio_url && track.status === 'completed') {
      addToQueue(track);
      notify.addedToQueue();
    }
  };

  const handleSwipeSwitchVersion = async () => {
    if (versionCount <= 1) return;
    
    // Fetch versions and switch to next one
    const { data: versions } = await supabase
      .from('track_versions')
      .select('id, version_label')
      .eq('track_id', track.id)
      .order('clip_index', { ascending: true });
    
    if (!versions || versions.length <= 1) return;
    
    const currentActiveId = track.active_version_id;
    const currentIndex = versions.findIndex(v => v.id === currentActiveId);
    const nextIndex = (currentIndex + 1) % versions.length;
    const nextVersion = versions[nextIndex];
    
    const { error } = await supabase
      .from('tracks')
      .update({ active_version_id: nextVersion.id })
      .eq('id', track.id);
    
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      notify.versionSwitched(nextVersion.version_label || 'A');
    }
  };

  if (layout === 'list') {
    const listContent = (
      <Card
        className={cn(
          "group grid grid-cols-[64px_1fr_44px] items-center gap-3 p-2.5 sm:p-3 transition-all touch-manipulation rounded-xl min-h-[80px]",
          // 🖥️ Desktop: hover эффект
          !isMobile && "hover:bg-muted/50",
          // 📱 Mobile: active состояние с subtle feedback
          isMobile && "active:bg-muted/70 active:scale-[0.99]"
        )}
        onClick={handleCardClick}
      >
        {/* Cover Image & Play Button - with Duration Badge */}
        <div className="relative w-[64px] h-[64px] flex-shrink-0 rounded-lg overflow-hidden shadow-sm" data-play-button>
          <LazyImage
            src={track.cover_url || ''}
            alt={track.title || 'Track cover'}
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            coverSize="small"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary/30">
                🎵
              </div>
            }
          />
          
          {/* Duration badge on cover - bottom right */}
          {track.duration_seconds && (
            <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-medium z-10">
              {Math.floor(track.duration_seconds / 60)}:{String(Math.floor(track.duration_seconds % 60)).padStart(2, '0')}
            </div>
          )}
          
          {/* Play overlay - always visible on mobile for clarity */}
          <div
            className={cn(
              "absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-all",
              !isMobile && !isPlaying && "opacity-0 group-hover:opacity-100",
              isMobile && !isPlaying && "bg-black/20",
              isPlaying && "opacity-100 bg-black/50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback('medium');
              onPlay?.();
            }}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-transform",
              isPlaying ? "bg-primary scale-100" : "bg-white/90 scale-90 group-hover:scale-100"
            )}>
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5 text-black/80" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

        {/* Track Info - 3 rows structure */}
        <div className="flex-1 min-w-0 py-0.5">
          {/* Row 1: Animated Title + Queue badge */}
          <div className="flex items-center gap-2">
            <MarqueeTitle title={track.title || 'Без названия'} />
            
            {/* Queue Position Indicator - desktop only */}
            {isInQueue && !isCurrentTrack && !isMobile && (
              <Badge 
                variant={isNextTrack ? "default" : "secondary"} 
                size="sm" 
                className={cn(
                  "flex-shrink-0 gap-0.5 px-1.5 text-[10px]",
                  isNextTrack && "bg-primary/20 text-primary border-primary/30"
                )}
                title="Позиция в очереди воспроизведения"
              >
                <ListMusic className="w-2.5 h-2.5" />
                {position}
              </Badge>
            )}
          </div>
          
          {/* Row 2: Icons only */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Model & Type Icons - compact */}
            <TrackTypeIcons track={track} compact showModel hasMidi={propHasMidi} hasPdf={propHasPdf} hasGp5={propHasGp5} />
          </div>
          
          {/* Row 3: Scrollable Tags */}
          <ScrollableTagsRow 
            style={track.style} 
            tags={track.tags}
            onClick={onTagClick}
            className="mt-0.5"
          />
        </div>

        {/* Actions Column - Version Toggle + Menu Button */}
        <div className="flex flex-col items-center justify-center gap-1">
          {/* Version Toggle - above menu button */}
          {versionCount > 1 && (
            <InlineVersionToggle
              trackId={track.id}
              activeVersionId={track.active_version_id}
              versionCount={versionCount}
              trackOwnerId={track.user_id}
              className="flex-shrink-0"
              compact={isMobile}
            />
          )}
          
          {/* Menu Button */}
          {isMobile ? (
            <Button
              size="icon"
              variant="ghost"
              className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-full touch-manipulation"
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerHapticFeedback('light');
                setSheetOpen(true); 
              }}
              aria-label={`Дополнительные действия для ${track.title}`}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant={isPlaying ? "default" : "ghost"}
                className={cn(
                  "w-9 h-9 rounded-full touch-manipulation transition-colors",
                  isPlaying && "bg-primary text-primary-foreground"
                )}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  triggerHapticFeedback('medium');
                  onPlay?.(); 
                }}
                aria-label={isPlaying ? `Пауза: ${track.title}` : `Воспроизвести: ${track.title}`}
                aria-pressed={isPlaying}
              >
                {isPlaying ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />}
              </Button>
              <UnifiedTrackMenu track={track} onDelete={onDelete} onDownload={onDownload} />
            </div>
          )}
        </div>
      </Card>
    );

    return (
      <>
        {isMobile ? (
          <SwipeOnboardingTooltip isFirstSwipeableItem={isFirstSwipeableItem}>
            <SwipeableTrackItem
              onAddToQueue={handleSwipeAddToQueue}
              onSwitchVersion={handleSwipeSwitchVersion}
              hasMultipleVersions={versionCount > 1}
            >
              {listContent}
            </SwipeableTrackItem>
          </SwipeOnboardingTooltip>
        ) : (
          listContent
        )}
        <UnifiedTrackSheet track={track} open={sheetOpen} onOpenChange={setSheetOpen} onDelete={onDelete} onDownload={onDownload} />
      </>
    );
  }


  return (
    <>
      <motion.div
        drag={isMobile && layout === 'grid' && !sheetOpen ? 'x' : false}
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
        className={cn(
          "group overflow-hidden cursor-pointer touch-manipulation transition-all duration-300 rounded-2xl border-transparent",
          // 🖥️ Desktop: hover эффекты
          !isMobile && "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1",
          // 📱 Mobile: active состояние вместо hover
          isMobile && "active:scale-[0.98] active:shadow-md",
          // ✨ Активный трек с подсветкой и анимированным градиентом
          isPlaying && "ring-2 ring-primary shadow-glow relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-primary/10 before:via-generate/10 before:to-primary/10 before:animate-pulse before:-z-10"
        )}
        onClick={handleCardClick}
        {...(isMobile && layout !== 'grid' ? touchHandlers : {})}
      >
        <div className="relative aspect-square overflow-hidden" data-play-button>
          <LazyImage
            src={track.cover_url || ''}
            alt={track.title || 'Track cover'}
            className={cn(
              "w-full h-full object-cover cursor-pointer transition-transform duration-500",
              // 🖥️ Desktop: масштабирование при hover
              !isMobile && "group-hover:scale-105",
              // 📱 Mobile: без hover-эффектов (лучше производительность)
            )}
            containerClassName="w-full h-full"
            coverSize="medium"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            fallback={
              <div
                className="w-full h-full bg-gradient-to-br from-primary/20 via-generate/10 to-primary/5 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.();
                }}
              >
                <div className="text-5xl font-bold text-primary/30">
                  {track.title?.charAt(0) || '♪'}
                </div>
              </div>
            }
          />

          {/* Play button overlay - адаптивное поведение для mobile/desktop */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
              "flex items-center justify-center transition-all duration-300",
              // 🖥️ Desktop: показываем при hover или воспроизведении
              !isMobile && "opacity-0 group-hover:opacity-100",
              // 📱 Mobile: всегда видимый градиент снизу (лучше UX)
              isMobile && "opacity-100",
              // ✨ При воспроизведении - всегда показываем
              isPlaying && "opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback('medium');
              onPlay?.();
            }}
          >
          <Button
            size="lg"
            className={cn(
              "rounded-full w-14 h-14 sm:w-12 sm:h-12 min-h-touch min-w-touch",
              "active:scale-90 transition-all duration-normal touch-manipulation shadow-lg",
              isPlaying 
                ? "bg-primary text-primary-foreground" 
                : "bg-white/95 text-black hover:bg-white hover:scale-105"
            )}
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback('medium');
              onPlay?.();
            }}
            disabled={!track.audio_url}
            aria-label={isPlaying ? `Пауза: ${track.title || 'трек'}` : `Воспроизвести: ${track.title || 'трек'}`}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Badges - Status and Type */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {isProcessing && (
            <Badge variant="warning" size="sm" className="animate-pulse">
              ⚙️ Обработка
            </Badge>
          )}
          
          {track.status && track.status !== 'completed' && !isProcessing && (
            <Badge
              variant={
                track.status === 'streaming_ready'
                  ? 'success'
                  : track.status === 'failed' || track.status === 'error'
                  ? 'destructive'
                  : 'muted'
              }
              size="sm"
            >
              {track.status === 'pending'
                ? 'В очереди'
                : track.status === 'processing'
                ? '⚡ Генерация'
                : track.status === 'streaming_ready'
                ? '🎵 Превью'
                : track.status === 'completed'
                ? 'Готов'
                : track.status === 'failed'
                ? 'Ошибка'
                : track.status}
            </Badge>
          )}
          
          {trackIcon && (
            <Badge variant="glass" size="sm" className="gap-1">
              {trackIcon}
              {!track.has_vocals ? 'Инстр.' : 'Вокал'}
            </Badge>
          )}
        </div>

        {/* Badges - Versions, Stems, and Queue Position */}
        <div className="absolute top-2 right-2 flex gap-1">
          {/* Queue Position Badge */}
          {isInQueue && !isCurrentTrack && (
            <Badge 
              variant={isNextTrack ? "default" : "glass"} 
              size="sm"
              className={cn(
                "gap-0.5",
                isNextTrack && "bg-primary text-primary-foreground"
              )}
            >
              <ListMusic className="w-3 h-3" />
              {position}
            </Badge>
          )}
          {versionCount > 1 && (
            <InlineVersionToggle
              trackId={track.id}
              activeVersionId={track.active_version_id}
              versionCount={versionCount}
              trackOwnerId={track.user_id}
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
              <TrackTypeIcons track={track} hasMidi={propHasMidi} hasPdf={propHasPdf} hasGp5={propHasGp5} />
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
              <div 
                data-menu-trigger
                onClick={(e) => e.stopPropagation()}
              >
                <UnifiedTrackMenu track={track} onDelete={onDelete} onDownload={onDownload} />
              </div>
            )}
        </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
             {track.artist_name && (
                <>
                  <Badge variant="outline" className="gap-1 px-2 py-0.5">
                    <User className="w-3 h-3" />
                    {track.artist_name}
                  </Badge>
                </>
            )}
            {!track.artist_name && (
              <span className="truncate">
                {track.style || track.tags?.split(',').slice(0, 2).join(', ') || 'Без стиля'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
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
              
              {/* Direct Studio Access Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenStudio}
                    className="h-11 min-h-[44px] px-2 touch-manipulation active:scale-95 transition-transform"
                  >
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Открыть в Studio</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4" />
              <span>{track.play_count || 0}</span>
          </div>
        </div>
      </div>
    </Card>
    
    </motion.div>
    
    <UnifiedTrackSheet
      track={track}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      onDelete={onDelete}
      onDownload={onDownload}
    />
    
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
});
