import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Music2, Clock, Tag, FileText, Wand2, Heart, Play, Pause,
  User, Mic, Cpu, Share2, MessageSquare
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlayerStore } from '@/hooks/audio';
import { useTelegram } from '@/contexts/TelegramContext';
import { LikeButton } from '@/components/ui/like-button';
import { TrackCommentsSection } from '@/components/track/TrackCommentsSection';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';
import type { Track } from '@/hooks/useTracksOptimized';

interface PublicTrackDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: PublicTrackWithCreator;
}

export function PublicTrackDetailSheet({ open, onOpenChange, track }: PublicTrackDetailSheetProps) {
  const isMobile = useIsMobile();
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { hapticFeedback } = useTelegram();
  const [imageError, setImageError] = useState(false);

  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const trackForPlayer: Track = {
    ...track,
    is_liked: track.user_liked ?? false,
    likes_count: track.likes_count ?? 0,
  };

  const handlePlay = () => {
    hapticFeedback('light');
    if (isCurrentTrack) {
      if (isPlaying) {
        pauseTrack();
      } else {
        playTrack(trackForPlayer);
      }
    } else {
      playTrack(trackForPlayer);
    }
  };

  const handleShare = () => {
    hapticFeedback('light');
    if (navigator.share) {
      navigator.share({
        title: track.title || 'Трек',
        text: `Послушай "${track.title}" на MusicVerse`,
        url: `${window.location.origin}/track/${track.id}`,
      });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatModelName = (model: string | null) => {
    if (!model) return null;
    const modelLabels: Record<string, string> = {
      'V5': 'Suno V5',
      'V4_5ALL': 'Suno V4.5',
      'V4': 'Suno V4',
      'V3_5': 'Suno V3.5',
    };
    return modelLabels[model] || model;
  };

  const platformCover = track.local_cover_url && track.local_cover_url.trim() !== '' ? track.local_cover_url : null;
  const sunoCover = track.cover_url && track.cover_url.trim() !== '' ? track.cover_url : null;
  const coverUrl = imageError ? (platformCover ? sunoCover : null) : (platformCover || sunoCover);

  const content = (
    <ScrollArea className="h-full max-h-[80vh]">
      <div className="space-y-6 p-1">
        {/* Cover & Basic Info */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={track.title || 'Track cover'}
                className="w-48 h-48 sm:w-40 sm:h-40 rounded-xl object-cover shadow-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-48 h-48 sm:w-40 sm:h-40 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center shadow-lg">
                <Music2 className="w-16 h-16 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                {track.title || 'Без названия'}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge variant="default">Публичный</Badge>
                {track.has_vocals === false && (
                  <Badge variant="secondary">Инструментал</Badge>
                )}
              </div>
            </div>

            {/* Creator Info */}
            {(track.creator_name || track.creator_username || track.creator_photo_url) && (
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Avatar className="w-8 h-8">
                  {track.creator_photo_url ? (
                    <AvatarImage src={track.creator_photo_url} alt={track.creator_name || track.creator_username || ''} />
                  ) : null}
                  <AvatarFallback className="text-xs bg-muted">
                    {(track.creator_name || track.creator_username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {track.creator_name || track.creator_username || 'Пользователь'}
                  </p>
                  {track.creator_username && track.creator_name && (
                    <p className="text-xs text-muted-foreground">@{track.creator_username}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Button
                onClick={handlePlay}
                disabled={!track.audio_url}
                className="gap-2"
              >
                {isCurrentlyPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Пауза
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Играть
                  </>
                )}
              </Button>
              <LikeButton 
                trackId={track.id} 
                likesCount={track.likes_count || 0}
                showCount
              />
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
            <Clock className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Длительность</p>
            <p className="font-semibold text-sm">{formatDuration(track.duration_seconds)}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
            <Play className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Plays</p>
            <p className="font-semibold text-sm">{track.play_count || 0}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
            <Heart className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Лайки</p>
            <p className="font-semibold text-sm">{track.likes_count || 0}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
            <Mic className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Тип</p>
            <p className="font-semibold text-sm">{track.has_vocals ? 'Вокал' : 'Инстр.'}</p>
          </div>
        </div>

        {/* Style & Tags */}
        {(track.style || track.tags) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Стиль и теги
              </h4>

              {track.style && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Стиль:</p>
                  <Badge variant="outline" className="px-2 py-0.5">
                    {track.style}
                  </Badge>
                </div>
              )}

              {track.tags && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Теги:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {track.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="secondary" className="px-2 py-0.5 text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Prompt */}
        {track.prompt && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                Промпт генерации
              </h4>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{track.prompt}</p>
              </div>
            </div>
          </>
        )}

        {/* Lyrics */}
        {track.lyrics && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Текст песни
              </h4>
              <div className="p-3 rounded-lg bg-muted/50 border border-border max-h-60 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{track.lyrics}</p>
              </div>
            </div>
          </>
        )}

        {/* Technical Info */}
        <Separator />
        <div className="space-y-3">
          <h4 className="font-semibold">Параметры генерации</h4>
          <div className="grid grid-cols-2 gap-2">
            {track.suno_model && (
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Модель</p>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-primary" />
                  <p className="text-sm font-medium">{formatModelName(track.suno_model)}</p>
                </div>
              </div>
            )}

            {track.generation_mode && (
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Режим</p>
                <p className="text-sm">{track.generation_mode === 'custom' ? 'Кастомный' : 'Простой'}</p>
              </div>
            )}

            {track.vocal_gender && (
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Пол вокала</p>
                <p className="text-sm capitalize">{track.vocal_gender}</p>
              </div>
            )}

            {track.created_at && (
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="text-sm">{new Date(track.created_at).toLocaleDateString('ru-RU')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <Separator />
        <TrackCommentsSection trackId={track.id} defaultExpanded={false} />
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Music2 className="w-5 h-5 text-primary" />
              Детали трека
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            Детали трека
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
