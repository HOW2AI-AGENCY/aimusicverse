import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SectionCompareProps {
  originalUrl: string;
  replacedUrl: string;
  sectionStart: number;
  sectionEnd: number;
  originalLabel?: string;
  replacedLabel?: string;
}

export function SectionComparePanel({
  originalUrl,
  replacedUrl,
  sectionStart,
  sectionEnd,
  originalLabel = 'Оригинал',
  replacedLabel = 'Новая версия',
}: SectionCompareProps) {
  const [activeVersion, setActiveVersion] = useState<'original' | 'replaced'>('original');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  
  const originalRef = useRef<HTMLAudioElement | null>(null);
  const replacedRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const duration = sectionEnd - sectionStart;
  const activeAudio = activeVersion === 'original' ? originalRef.current : replacedRef.current;

  useEffect(() => {
    const origAudio = new Audio(originalUrl);
    const replAudio = new Audio(replacedUrl);
    
    origAudio.volume = volume;
    replAudio.volume = volume;
    
    originalRef.current = origAudio;
    replacedRef.current = replAudio;

    return () => {
      origAudio.pause();
      replAudio.pause();
    };
  }, [originalUrl, replacedUrl, volume]);

  useEffect(() => {
    if (originalRef.current) originalRef.current.volume = volume;
    if (replacedRef.current) replacedRef.current.volume = volume;
  }, [volume]);

  const updateProgress = useCallback(() => {
    if (activeAudio) {
      const progress = activeAudio.currentTime - sectionStart;
      setCurrentTime(Math.max(0, Math.min(progress, duration)));

      if (activeAudio.currentTime >= sectionEnd) {
        activeAudio.pause();
        activeAudio.currentTime = sectionStart;
        setIsPlaying(false);
        setCurrentTime(0);
      } else if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [activeAudio, sectionStart, sectionEnd, duration, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);

  const togglePlay = async () => {
    if (!activeAudio) return;

    if (isPlaying) {
      activeAudio.pause();
      setIsPlaying(false);
    } else {
      activeAudio.currentTime = sectionStart + currentTime;
      await activeAudio.play();
      setIsPlaying(true);
    }
  };

  const switchVersion = (version: 'original' | 'replaced') => {
    if (version === activeVersion) return;

    // Stop current audio
    if (activeAudio) {
      activeAudio.pause();
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveVersion(version);
  };

  const restart = () => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = sectionStart;
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border rounded-lg p-4 bg-card/50 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">A/B Сравнение секций</h4>
        <Badge variant="outline" className="text-xs">
          {formatTime(sectionStart)} - {formatTime(sectionEnd)}
        </Badge>
      </div>

      {/* Version Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeVersion === 'original' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchVersion('original')}
          className={cn(
            'flex-1 transition-all',
            activeVersion === 'original' && 'ring-2 ring-primary/50'
          )}
        >
          <span className="text-lg mr-2">A</span>
          {originalLabel}
        </Button>
        <Button
          variant={activeVersion === 'replaced' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchVersion('replaced')}
          className={cn(
            'flex-1 transition-all',
            activeVersion === 'replaced' && 'ring-2 ring-primary/50'
          )}
        >
          <span className="text-lg mr-2">B</span>
          {replacedLabel}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration}
          step={0.1}
          onValueChange={(v) => {
            setCurrentTime(v[0]);
            if (activeAudio) {
              activeAudio.currentTime = sectionStart + v[0];
            }
          }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={restart}
          className="h-9 w-9"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={togglePlay}
          className="h-10 w-10"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        <div className="flex items-center gap-2 flex-1">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => setVolume(v[0])}
            className="flex-1 max-w-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
