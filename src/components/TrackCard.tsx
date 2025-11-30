import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Heart, Music2, Mic, Volume2, Guitar, Drum, Piano, Globe, Lock, MoreHorizontal } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrackActionsMenu } from './TrackActionsMenu';
import { TrackActionsSheet } from './TrackActionsSheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrackCardProps {
  track: Track;
  onPlay?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onToggleLike?: () => void;
  isPlaying?: boolean;
}

export const TrackCard = ({
  track,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  isPlaying,
}: TrackCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [versionCount, setVersionCount] = useState<number>(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchVersionCount = async () => {
      const { count } = await supabase
        .from('track_versions')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);
      setVersionCount(count || 0);
    };
    fetchVersionCount();
    
    // Subscribe to track_stems for real-time updates
    const channel = supabase
      .channel(`track-stems-${track.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'track_stems',
          filter: `track_id=eq.${track.id}`,
        },
        (payload) => {
          console.log('Stem update:', payload);
          setIsProcessing(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
    // Don't trigger if clicking on buttons or the cover
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('[data-play-button]') ||
      target.closest('img')
    ) {
      return;
    }
    
    if (isMobile) {
      setSheetOpen(true);
    }
  };

  return (
    <>
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer"
        onClick={handleCardClick}
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

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
          >
          <Button
            size="lg"
            className="rounded-full w-16 h-16"
            onClick={onPlay}
            disabled={!track.audio_url}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
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

        {/* Version count badge */}
        {versionCount > 0 && (
          <Badge variant="secondary" className="absolute top-2 right-2">
            {versionCount} {versionCount === 1 ? 'версия' : versionCount < 5 ? 'версии' : 'версий'}
          </Badge>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-lg truncate flex-1">
            {track.title || 'Без названия'}
          </h3>
          {track.is_public ? (
            <Globe className="w-4 h-4 text-primary flex-shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {track.style && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
            {track.style}
          </p>
        )}

        {/* Tags */}
        {track.tags && (
          <div className="flex gap-1 mb-3 flex-wrap">
            {track.tags.split(',').slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={track.is_liked ? 'default' : 'ghost'}
              onClick={onToggleLike}
              className="h-8 w-8"
            >
              <Heart
                className={`w-4 h-4 ${track.is_liked ? 'fill-current' : ''}`}
              />
            </Button>
            {track.likes_count !== undefined && track.likes_count > 0 && (
              <span className="text-sm text-muted-foreground">
                {track.likes_count}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {track.play_count !== undefined && track.play_count > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Play className="w-3 h-3" />
                {track.play_count}
              </span>
            )}

            {isMobile ? (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetOpen(true);
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            ) : (
              <TrackActionsMenu
                track={track}
                onDelete={onDelete}
                onDownload={onDownload}
              />
            )}
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
  </>
  );
};
