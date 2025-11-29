import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Heart, Share2, MoreVertical, Trash2 } from 'lucide-react';
import { Track } from '@/hooks/useTracks';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

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
              <DropdownMenuContent align="end">
                {track.audio_url && (
                  <>
                    <DropdownMenuItem onClick={onDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Скачать
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Поделиться
                    </DropdownMenuItem>
                  </>
                )}
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
    </Card>
  );
};
