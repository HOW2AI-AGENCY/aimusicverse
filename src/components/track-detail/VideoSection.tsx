import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Download, Maximize2, Send, Loader2, Video, AlertCircle, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useVideoGenerationStatus } from '@/hooks/useVideoGenerationStatus';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { Track } from '@/types/track';

interface VideoSectionProps {
  track: Track;
  onGenerateVideo?: () => void;
}

export function VideoSection({ track, onGenerateVideo }: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSendingToTelegram, setIsSendingToTelegram] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isGenerating, hasVideo, videoUrl, status, error } = useVideoGenerationStatus(track.id);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    triggerHapticFeedback('light');
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    triggerHapticFeedback('light');

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      logger.error('Fullscreen error', err);
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;
    triggerHapticFeedback('light');

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Видео скачивается');
    } catch (err) {
      logger.error('Download error', err);
      toast.error('Ошибка скачивания видео');
    }
  };

  const handleSendToTelegram = async () => {
    if (!videoUrl) return;
    triggerHapticFeedback('light');
    setIsSendingToTelegram(true);

    try {
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          type: 'video_share',
          trackId: track.id,
          videoUrl,
          title: track.title || 'Видео клип',
        },
      });

      if (error) throw error;
      toast.success('Видео отправлено в Telegram');
    } catch (err) {
      logger.error('Telegram send error', err);
      toast.error('Ошибка отправки в Telegram');
    } finally {
      setIsSendingToTelegram(false);
    }
  };

  // No video and not generating - show generate button
  if (!hasVideo && !isGenerating && status === 'idle') {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2 text-lg">
          <Video className="w-5 h-5 text-primary" />
          Видеоклип
        </h4>
        <div className="p-6 rounded-xl bg-muted/30 border border-border text-center">
          <Video className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Создайте музыкальный клип для вашего трека
          </p>
          <Button onClick={onGenerateVideo} className="gap-2">
            <Video className="w-4 h-4" />
            Создать видеоклип
          </Button>
        </div>
      </div>
    );
  }

  // Currently generating
  if (isGenerating) {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2 text-lg">
          <Video className="w-5 h-5 text-primary" />
          Видеоклип
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Создаётся
          </Badge>
        </h4>
        <div className="p-6 rounded-xl bg-muted/30 border border-primary/20 text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <Video className="absolute inset-0 m-auto w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Генерация видео может занять несколько минут...
          </p>
        </div>
      </div>
    );
  }

  // Failed generation
  if (status === 'failed') {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2 text-lg">
          <Video className="w-5 h-5 text-primary" />
          Видеоклип
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Ошибка
          </Badge>
        </h4>
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
          <p className="text-sm text-destructive mb-2">
            {error || 'Не удалось создать видеоклип'}
          </p>
          <Button onClick={onGenerateVideo} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  // Has video - show player
  return (
    <div className="space-y-3">
      <h4 className="font-semibold flex items-center gap-2 text-lg">
        <Video className="w-5 h-5 text-primary" />
        Видеоклип
        <Badge variant="default" className="bg-green-600">Готово</Badge>
      </h4>
      
      <div 
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-black"
      >
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          poster={track.cover_url || undefined}
          className="w-full aspect-video object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />
        
        {/* Overlay controls */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleFullscreen} className="gap-1.5">
          <Maximize2 className="w-4 h-4" />
          На весь экран
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
          <Download className="w-4 h-4" />
          Скачать
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSendToTelegram} 
          disabled={isSendingToTelegram}
          className="gap-1.5"
        >
          {isSendingToTelegram ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          В Telegram
        </Button>
      </div>
    </div>
  );
}
