/**
 * Reference Audio Player for Admin Panel
 * Allows admins to listen to the reference audio used for track generation
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Volume2, VolumeX, 
  Download, Upload, Music, Clock
} from 'lucide-react';
import { formatDuration } from '@/lib/player-utils';
import { cn } from '@/lib/utils';

interface ReferenceAudioPlayerProps {
  audioUrl: string;
  generationMode?: string | null;
  className?: string;
  compact?: boolean;
}

export function ReferenceAudioPlayer({ 
  audioUrl, 
  generationMode,
  className,
  compact = false 
}: ReferenceAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
      setError(null);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError('Не удалось загрузить аудио');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      setError('Ошибка воспроизведения');
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `reference-audio-${Date.now()}.mp3`;
    link.click();
  };

  const getModeLabel = (mode: string | null | undefined) => {
    switch (mode) {
      case 'cover': return 'Кавер';
      case 'extend': return 'Расширение';
      case 'stems': return 'Стемы';
      case 'add_vocals': return 'Добавить вокал';
      default: return mode || 'Референс';
    }
  };

  const getModeColor = (mode: string | null | undefined) => {
    switch (mode) {
      case 'cover': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'extend': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'stems': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'add_vocals': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (error) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive",
        className
      )}>
        <Music className="h-4 w-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={togglePlay}
          disabled={!isLoaded}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 ml-0.5" />
          )}
        </Button>
        
        <div className="flex-1 min-w-0">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={!isLoaded}
          />
        </div>
        
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
        
        {generationMode && (
          <Badge variant="outline" className={cn("text-xs", getModeColor(generationMode))}>
            {getModeLabel(generationMode)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Header with mode badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Upload className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium">Референсное аудио</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(duration)}
            </div>
          </div>
        </div>
        
        {generationMode && (
          <Badge variant="outline" className={getModeColor(generationMode)}>
            {getModeLabel(generationMode)}
          </Badge>
        )}
      </div>

      {/* Player controls */}
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-full"
          onClick={togglePlay}
          disabled={!isLoaded}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <div className="flex-1 space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!isLoaded}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>

      {/* Volume and download */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Скачать
        </Button>
      </div>
    </div>
  );
}

export default ReferenceAudioPlayer;
