import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Heart, Share2, MoreVertical, Trash2, Plus, FileText, Info, Scissors, Music, Video, FileAudio, Globe, Lock } from 'lucide-react';
import { Track } from '@/hooks/useTracks';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { LyricsDialog } from './LyricsDialog';
import { TrackDetailDialog } from './TrackDetailDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [lyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleShare = async () => {
    if (navigator.share && track.audio_url) {
      try {
        await navigator.share({
          title: track.title || 'Трек',
          text: `Послушай ${track.title || 'этот трек'}`,
          url: track.audio_url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleRemix = async () => {
    if (!track.suno_id) {
      toast.error('Невозможно создать ремикс для этого трека');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-remix', {
        body: {
          audioId: track.suno_id,
          prompt: `Remix of ${track.prompt}`,
          style: track.style,
        },
      });

      if (error) throw error;

      toast.success('Ремикс начат! Трек появится в библиотеке после завершения');
    } catch (error: any) {
      console.error('Remix error:', error);
      toast.error(error.message || 'Ошибка создания ремикса');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeparateVocals = async (mode: 'simple' | 'detailed' = 'simple') => {
    if (!track.suno_task_id || !track.suno_id) {
      toast.error('Невозможно разделить вокал для этого трека');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-separate-vocals', {
        body: {
          taskId: track.suno_task_id,
          audioId: track.suno_id,
          mode,
        },
      });

      if (error) throw error;

      toast.success('Разделение началось! Стемы появятся после завершения');
    } catch (error: any) {
      console.error('Separation error:', error);
      toast.error(error.message || 'Ошибка разделения');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePublic = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ is_public: !track.is_public })
        .eq('id', track.id);

      if (error) throw error;

      toast.success(track.is_public ? 'Трек теперь приватный' : 'Трек теперь публичный');
      // Trigger refetch in parent
      window.location.reload();
    } catch (error: any) {
      console.error('Toggle public error:', error);
      toast.error('Ошибка изменения видимости');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all">
      <div className="relative aspect-square">
        {track.cover_url && !imageError ? (
          <img
            src={track.cover_url}
            alt={track.title || 'Track cover'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="text-4xl font-bold text-primary/20">
              {track.title?.charAt(0) || '♪'}
            </div>
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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

        {/* Status badge */}
        {track.status && track.status !== 'completed' && (
          <Badge
            variant={
              track.status === 'streaming_ready'
                ? 'default'
                : track.status === 'failed' || track.status === 'error'
                ? 'destructive'
                : 'secondary'
            }
            className="absolute top-2 left-2"
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
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">
          {track.title || 'Без названия'}
        </h3>

        {track.style && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
            {track.style}
          </p>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setDetailDialogOpen(true)}>
                  <Info className="w-4 h-4 mr-2" />
                  Детали трека
                </DropdownMenuItem>

                {track.audio_url && track.status === 'completed' && (
                  <>
                    <DropdownMenuSeparator />
                    
                    {(track.lyrics || (track.suno_task_id && track.suno_id)) && (
                      <DropdownMenuItem onClick={() => setLyricsDialogOpen(true)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Текст песни
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => setExtendDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Расширить трек
                    </DropdownMenuItem>

                    {track.suno_id && (
                      <DropdownMenuItem onClick={handleRemix} disabled={isProcessing}>
                        <Music className="w-4 h-4 mr-2" />
                        Создать ремикс
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {track.suno_task_id && track.suno_id && (
                      <>
                        <DropdownMenuItem onClick={() => handleSeparateVocals('simple')} disabled={isProcessing}>
                          <Scissors className="w-4 h-4 mr-2" />
                          Разделить на стемы (простой)
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleSeparateVocals('detailed')} disabled={isProcessing}>
                          <Scissors className="w-4 h-4 mr-2" />
                          Разделить на стемы (детально)
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={onDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Скачать MP3
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Поделиться
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleTogglePublic} disabled={isProcessing}>
                      {track.is_public ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Сделать приватным
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 mr-2" />
                          Сделать публичным
                        </>
                      )}
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ExtendTrackDialog
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        track={track}
      />

      <LyricsDialog
        open={lyricsDialogOpen}
        onOpenChange={setLyricsDialogOpen}
        track={track}
      />

      <TrackDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        track={track}
      />
    </Card>
  );
};
