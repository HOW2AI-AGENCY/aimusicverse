import { useState, useEffect, useRef } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Drawer, DrawerContent, DrawerHeader, DrawerTitle 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, Scissors, Download, Save, 
  RotateCcw, Volume2, VolumeX 
} from 'lucide-react';
import { TrimRegionSelector } from './TrimRegionSelector';
import { useTrimExport } from '@/hooks/useTrimExport';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TrimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    title?: string | null;
    audio_url?: string | null;
    duration_seconds?: number | null;
    style?: string | null;
    tags?: string | null;
  };
  onTrimComplete?: (newTrackId: string) => void;
}

export const TrimDialog = ({ open, onOpenChange, track, onTrimComplete }: TrimDialogProps) => {
  const isMobile = useIsMobile();
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [previewMode, setPreviewMode] = useState<'full' | 'region'>('region');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { trimAudio, saveAsNewTrack, downloadTrimmed, isExporting, progress } = useTrimExport();
  
  const duration = track.duration_seconds || 0;

  // Initialize audio
  useEffect(() => {
    if (!open || !track.audio_url) return;
    
    const audio = new Audio(track.audio_url);
    audioRef.current = audio;
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (region && previewMode === 'region') {
        audio.currentTime = region.start;
        setCurrentTime(region.start);
      }
    };
    
    const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      setCurrentTime(audioRef.current.currentTime);
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
      audio.src = '';
    };
  }, [open, track.audio_url]);

  // Check region bounds during playback
  useEffect(() => {
    if (!audioRef.current || !isPlaying || !region || previewMode !== 'region') return;
    
    const checkBounds = () => {
      if (audioRef.current && audioRef.current.currentTime >= region.end) {
        audioRef.current.pause();
        audioRef.current.currentTime = region.start;
        setCurrentTime(region.start);
        setIsPlaying(false);
      }
    };
    
    const interval = setInterval(checkBounds, 100);
    return () => clearInterval(interval);
  }, [isPlaying, region, previewMode]);

  // Update mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (region && previewMode === 'region') {
        audioRef.current.currentTime = region.start;
      }
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRegionChange = (start: number, end: number) => {
    if (end > start) {
      setRegion({ start, end });
    } else {
      setRegion(null);
    }
  };

  const handleReset = () => {
    setRegion(null);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    setIsPlaying(false);
  };

  const handleExport = async () => {
    if (!region || !track.audio_url) return;
    
    const result = await trimAudio({
      audioUrl: track.audio_url,
      startTime: region.start,
      endTime: region.end,
      trackId: track.id,
    });
    
    if (result) {
      downloadTrimmed(result, track.title || 'track');
      URL.revokeObjectURL(result.url);
    }
  };

  const handleSaveAsTrack = async () => {
    if (!region || !track.audio_url) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Необходима авторизация');
      return;
    }
    
    const result = await trimAudio({
      audioUrl: track.audio_url,
      startTime: region.start,
      endTime: region.end,
      trackId: track.id,
    });
    
    if (result) {
      const newTrackId = await saveAsNewTrack(result, track, user.id);
      URL.revokeObjectURL(result.url);
      if (newTrackId) {
        onTrimComplete?.(newTrackId);
        onOpenChange(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const content = (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground">
        Выделите регион для обрезки, перетаскивая мышью по таймлайну. 
        Используйте ручки для точной настройки.
      </div>

      {/* Trim Region Selector */}
      <TrimRegionSelector
        duration={duration}
        currentTime={currentTime}
        onRegionChange={handleRegionChange}
        onSeek={handleSeek}
      />

      {/* Region Info */}
      {region && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Начало:</span>{' '}
              <span className="font-mono">{formatTime(region.start)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Конец:</span>{' '}
              <span className="font-mono">{formatTime(region.end)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Длительность:</span>{' '}
              <span className="font-mono font-semibold">{formatTime(region.end - region.start)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMuted(!muted)}
          className="h-10 w-10"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="h-10 w-10"
          disabled={!region}
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        
        <Button
          size="lg"
          onClick={togglePlay}
          className="h-14 w-14 rounded-full"
          disabled={!track.audio_url}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('full')}
          >
            Весь трек
          </Button>
          <Button
            variant={previewMode === 'region' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('region')}
            disabled={!region}
          >
            Только выбранное
          </Button>
        </div>
      </div>

      {/* Export Progress */}
      {isExporting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Экспорт...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Action Buttons */}
      <div className={cn(
        "flex gap-3",
        isMobile ? "flex-col" : "justify-end"
      )}>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!region || isExporting}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Скачать WAV
        </Button>
        <Button
          onClick={handleSaveAsTrack}
          disabled={!region || isExporting}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Сохранить как новый трек
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Обрезка трека
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Обрезка: {track.title || 'Трек'}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
