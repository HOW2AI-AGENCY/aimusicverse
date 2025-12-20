import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { logger } from '@/lib/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

type WaveSurferCtor = typeof import('wavesurfer.js');
type WaveSurferInstance = any;
type RegionsPluginCtor = any;
type RegionsPluginInstance = any;

interface AudioTrimSelectorProps {
  audioUrl: string;
  maxDuration: number; // in seconds
  onRegionSelected: (start: number, end: number) => void;
  className?: string;
}

export const AudioTrimSelector = ({ 
  audioUrl, 
  maxDuration = 60, 
  onRegionSelected,
  className 
}: AudioTrimSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurferInstance | null>(null);
  const regionsRef = useRef<RegionsPluginInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [regionStart, setRegionStart] = useState(0);
  const [regionEnd, setRegionEnd] = useState(maxDuration);

  useEffect(() => {
    let mounted = true;

    const initWavesurfer = async () => {
      if (!mounted) return;

      if (!containerRef.current || !audioUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsReady(false);

      try {
        const mod: WaveSurferCtor = await import('wavesurfer.js');
        const WaveSurfer = (mod as any).default ?? (mod as any);

        const regionsMod = (await import('wavesurfer.js/dist/plugins/regions.js')) as any;
        const RegionsPlugin: RegionsPluginCtor = regionsMod.default ?? regionsMod;

        if (!mounted) return;

        const wavesurfer: WaveSurferInstance = WaveSurfer.create({
          container: containerRef.current,
          height: 80,
          waveColor: 'hsl(var(--muted-foreground) / 0.3)',
          progressColor: 'hsl(var(--primary))',
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          cursorWidth: 2,
          cursorColor: 'hsl(var(--primary))',
          normalize: true,
          backend: 'WebAudio',
          interact: true,
          hideScrollbar: true,
          fillParent: true,
        });

        // Initialize Regions plugin
        const regions: RegionsPluginInstance = wavesurfer.registerPlugin(RegionsPlugin.create());
        regionsRef.current = regions;

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
          if (!mounted) return;
          const audioDuration = wavesurfer.getDuration();
          setIsReady(true);
          setIsLoading(false);
          setDuration(audioDuration);

          // Create initial selection region (first maxDuration seconds)
          const initialEnd = Math.min(maxDuration, audioDuration);
          setRegionEnd(initialEnd);

          regions.addRegion({
            start: 0,
            end: initialEnd,
            color: 'hsla(var(--primary) / 0.2)',
            resize: true,
            drag: true,
          });

          // Notify parent of initial selection
          onRegionSelected(0, initialEnd);
        });

        wavesurfer.on('error', (err: unknown) => {
          logger.error('Waveform error', { error: err });
          if (mounted) {
            setIsLoading(false);
          }
        });

        wavesurfer.on('audioprocess', () => {
          if (mounted) {
            setCurrentTime(wavesurfer.getCurrentTime());
          }
        });

        wavesurfer.on('play', () => {
          if (mounted) setIsPlaying(true);
        });

        wavesurfer.on('pause', () => {
          if (mounted) setIsPlaying(false);
        });

        wavesurfer.on('finish', () => {
          if (mounted) setIsPlaying(false);
        });

        // Handle region updates
        regions.on('region-updated', (region: any) => {
          if (mounted) {
            const start = Math.max(0, region.start);
            let end = Math.min(duration, region.end);

            // Enforce max duration
            if (end - start > maxDuration) {
              end = start + maxDuration;
              region.setOptions({ start, end });
            }

            setRegionStart(start);
            setRegionEnd(end);
            onRegionSelected(start, end);
          }
        });

        wavesurfer.load(audioUrl);
      } catch (e) {
        logger.error('Failed to init WaveSurfer', e);
        if (mounted) setIsLoading(false);
      }
    };

    initWavesurfer();

    return () => {
      mounted = false;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, maxDuration, duration, onRegionSelected]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const playRegion = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setTime(regionStart);
      wavesurferRef.current.play();
      
      // Stop playback when region ends
      const checkTime = () => {
        if (wavesurferRef.current) {
          const time = wavesurferRef.current.getCurrentTime();
          if (time >= regionEnd) {
            wavesurferRef.current.pause();
          } else if (isPlaying) {
            requestAnimationFrame(checkTime);
          }
        }
      };
      requestAnimationFrame(checkTime);
    }
  };

  const regionDuration = regionEnd - regionStart;

  return (
    <div className={cn('space-y-3', className)}>
      <Alert>
        <Scissors className="h-4 w-4" />
        <AlertDescription>
          Выберите фрагмент длительностью до {Math.floor(maxDuration / 60)} мин {maxDuration % 60} сек для генерации. 
          Перетащите края выделенной области или передвиньте всю область целиком.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={togglePlayPause}
            disabled={!isReady}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={playRegion}
            disabled={!isReady}
            className="shrink-0"
          >
            <Play className="h-4 w-4 mr-2" />
            Воспроизвести выделенное
          </Button>
          
          <div className="flex-1 text-xs text-muted-foreground text-right tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <div ref={containerRef} className="w-full min-h-[80px]" />
        
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Выделено: <span className="font-medium text-foreground">{formatTime(regionStart)}</span>
            {' - '}
            <span className="font-medium text-foreground">{formatTime(regionEnd)}</span>
          </div>
          <div className={cn(
            "font-medium",
            regionDuration > maxDuration ? "text-destructive" : "text-green-500"
          )}>
            {formatTime(regionDuration)} / {formatTime(maxDuration)}
          </div>
        </div>
      </div>
    </div>
  );
};
