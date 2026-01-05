import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Music2, Clock, Tag, FileText, Wand2, Heart, Play, Pause,
  User, Mic, Cpu, Share2, Headphones, Calendar, Globe, 
  Sparkles, ExternalLink, Copy, Check
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTelegram } from '@/contexts/TelegramContext';
import { LikeButton } from '@/components/ui/like-button';
import { TrackCommentsSection } from '@/components/track/TrackCommentsSection';
import { motion, AnimatePresence } from '@/lib/motion';
import { toast } from 'sonner';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import type { Track } from '@/types/track';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '@/lib/formatters';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';

interface PublicTrackDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: PublicTrackWithCreator;
}

export function PublicTrackDetailSheet({ open, onOpenChange, track }: PublicTrackDetailSheetProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { hapticFeedback } = useTelegram();
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Telegram BackButton integration
  useTelegramBackButton({
    visible: open && isMobile,
    onClick: () => onOpenChange(false),
  });

  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const trackForPlayer: Track = {
    ...track,
    is_liked: track.user_liked ?? false,
    likes_count: track.like_count ?? 0,
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/track/${track.id}`);
    setCopied(true);
    toast.success('Ссылка скопирована');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChange(false);
    navigate(`/profile/${track.user_id}`);
  };

  const formatDurationValue = (seconds: number | null) => {
    if (!seconds) return '—';
    return formatTime(seconds);
  };

  const formatModelName = (model: string | null) => {
    if (!model) return null;
    const modelLabels: Record<string, string> = {
      'V5': 'Suno V5',
      'V4_5ALL': 'Suno V4.5',
      'V4_5PLUS': 'Suno V4.5+',
      'V4': 'Suno V4',
      'V3_5': 'Suno V3.5',
    };
    return modelLabels[model] || model;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const platformCover = track.local_cover_url && track.local_cover_url.trim() !== '' ? track.local_cover_url : null;
  const sunoCover = track.cover_url && track.cover_url.trim() !== '' ? track.cover_url : null;
  const coverUrl = imageError ? (platformCover ? sunoCover : null) : (platformCover || sunoCover);

  const content = (
    <ScrollArea className="h-full max-h-[85vh]">
      <div className="space-y-6 pb-6">
        {/* Hero Section with Cover */}
        <div className="relative -mx-6 -mt-6 overflow-hidden">
          {/* Background Blur */}
          {coverUrl && (
            <div 
              className="absolute inset-0 scale-110 blur-3xl opacity-30"
              style={{ backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover' }}
            />
          )}
          
          <div className="relative px-6 pt-6 pb-4">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Cover */}
              <motion.div 
                className="relative flex-shrink-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={track.title || 'Track cover'}
                    className="w-48 h-48 sm:w-44 sm:h-44 rounded-2xl object-cover shadow-2xl ring-4 ring-background/50"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10 flex items-center justify-center shadow-2xl ring-4 ring-background/50">
                    <Music2 className="w-20 h-20 text-primary/40" />
                  </div>
                )}
                
                {/* Play Overlay */}
                <motion.button
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                  onClick={handlePlay}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    {isCurrentlyPlaying ? (
                      <Pause className="w-8 h-8 text-primary-foreground" />
                    ) : (
                      <Play className="w-8 h-8 text-primary-foreground ml-1" />
                    )}
                  </div>
                </motion.button>
              </motion.div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div>
                  <motion.h2 
                    className="text-2xl sm:text-3xl font-bold tracking-tight mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {track.title || 'Без названия'}
                  </motion.h2>
                  
                  <motion.div 
                    className="flex flex-wrap items-center justify-center sm:justify-start gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Globe className="w-3 h-3 mr-1" />
                      Публичный
                    </Badge>
                    {track.has_vocals === false && (
                      <Badge variant="secondary">
                        <Mic className="w-3 h-3 mr-1" />
                        Инструментал
                      </Badge>
                    )}
                    {track.suno_model && (
                      <Badge variant="outline">
                        <Cpu className="w-3 h-3 mr-1" />
                        {formatModelName(track.suno_model)}
                      </Badge>
                    )}
                  </motion.div>
                </div>

                {/* Creator */}
                {(track.creator_name || track.creator_username) && (
                  <motion.button
                    className="flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-accent/50 transition-colors"
                    onClick={handleCreatorClick}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                      {track.creator_photo_url ? (
                        <AvatarImage src={track.creator_photo_url} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(track.creator_name || track.creator_username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-semibold text-sm">
                        {track.creator_name || track.creator_username}
                      </p>
                      {track.creator_username && track.creator_name && (
                        <p className="text-xs text-muted-foreground">@{track.creator_username}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
                  </motion.button>
                )}

                {/* Action Buttons */}
                <motion.div 
                  className="flex items-center gap-2 justify-center sm:justify-start pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={handlePlay}
                    disabled={!track.audio_url}
                    className="gap-2 px-6"
                    size="lg"
                  >
                    {isCurrentlyPlaying ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Пауза
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Играть
                      </>
                    )}
                  </Button>
                  <LikeButton 
                    trackId={track.id} 
                    likesCount={track.like_count || 0}
                    initialLiked={track.user_liked}
                    showCount
                    size="lg"
                  />
                  <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-11 w-11"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 px-1">
          {[
            { icon: Clock, label: 'Длительность', value: formatDurationValue(track.duration_seconds), color: 'text-blue-500' },
            { icon: Headphones, label: 'Plays', value: track.play_count || 0, color: 'text-green-500' },
            { icon: Heart, label: 'Лайки', value: track.like_count || 0, color: 'text-red-500' },
            { icon: Calendar, label: 'Создан', value: track.created_at ? new Date(track.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '—', color: 'text-purple-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className="p-3 text-center bg-muted/30 border-0">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="font-bold text-sm">{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Style & Tags */}
        {(track.style || track.tags) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-semibold">Стиль и теги</h4>
              </div>

              {track.style && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1.5">Стиль:</p>
                  <Badge variant="default" className="px-3 py-1 text-sm">
                    {track.style}
                  </Badge>
                </div>
              )}

              {track.tags && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Теги:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {track.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="secondary" className="px-2 py-0.5 text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Prompt */}
        {track.prompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-4 border-0 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-amber-500" />
                </div>
                <h4 className="font-semibold">Промпт генерации</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {track.prompt}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Lyrics */}
        {track.lyrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-4 border-0 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-cyan-500" />
                </div>
                <h4 className="font-semibold">Текст песни</h4>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{track.lyrics}</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Technical Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-4 border-0 bg-muted/30">
            <h4 className="font-semibold mb-3">Параметры генерации</h4>
            <div className="grid grid-cols-2 gap-3">
              {track.suno_model && (
                <div className="p-2.5 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground">Модель</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    <p className="text-sm font-medium">{formatModelName(track.suno_model)}</p>
                  </div>
                </div>
              )}

              {track.generation_mode && (
                <div className="p-2.5 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground">Режим</p>
                  <p className="text-sm font-medium mt-0.5">
                    {track.generation_mode === 'custom' ? 'Кастомный' : 'Простой'}
                  </p>
                </div>
              )}

              {track.vocal_gender && (
                <div className="p-2.5 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground">Пол вокала</p>
                  <p className="text-sm font-medium mt-0.5 capitalize">{track.vocal_gender}</p>
                </div>
              )}

              {track.created_at && (
                <div className="p-2.5 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground">Дата создания</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(track.created_at)}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Comments */}
        <Separator className="my-2" />
        <TrackCommentsSection trackId={track.id} defaultExpanded={false} />
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl px-4 pt-4">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-6">
        {content}
      </DialogContent>
    </Dialog>
  );
}