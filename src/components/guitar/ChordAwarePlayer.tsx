import { useRef, useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { ChordData } from '@/hooks/useGuitarAnalysis';
import { ChordDiagramEnhanced } from './ChordDiagramEnhanced';

// Get actual CSS color value from CSS variable with proper comma syntax
const getCSSColor = (cssVar: string, fallback: string): string => {
  if (typeof window === 'undefined') return `hsl(${fallback})`;
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  const value = computed.getPropertyValue(cssVar).trim();
  if (!value) return `hsl(${fallback})`;
  const parts = value.split(/\s+/);
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
  }
  return `hsl(${value})`;
};

const toHsla = (hslColor: string, alpha: number): string => {
  const match = hslColor.match(/hsl\(([^)]+)\)/);
  if (match) {
    return `hsla(${match[1]}, ${alpha})`;
  }
  return hslColor;
};

interface ChordAwarePlayerProps {
  audioUrl: string;
  chords: ChordData[];
  duration: number;
  className?: string;
  onTimeUpdate?: (time: number) => void;
}

export function ChordAwarePlayer({
  audioUrl,
  chords,
  duration,
  className,
  onTimeUpdate,
}: ChordAwarePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tap, selectionChanged } = useHapticFeedback();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate waveform data
  useEffect(() => {
    const generateWaveform = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0);
        const samples = 150;
        const blockSize = Math.floor(channelData.length / samples);
        const waveform: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0);
          }
          waveform.push(sum / blockSize);
        }
        
        const max = Math.max(...waveform);
        setWaveformData(waveform.map(v => v / max));
        audioContext.close();
      } catch {
        setWaveformData(Array(150).fill(0).map(() => Math.random() * 0.5 + 0.3));
      } finally {
        setIsLoading(false);
      }
    };

    if (audioUrl) {
      generateWaveform();
    }
  }, [audioUrl]);

  // Draw waveform with chord regions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const playProgress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);

    // Draw chord regions
    const chordColors = [
      'hsla(270, 70%, 50%, 0.15)',
      'hsla(200, 70%, 50%, 0.15)',
      'hsla(150, 70%, 50%, 0.15)',
      'hsla(40, 70%, 50%, 0.15)',
      'hsla(330, 70%, 50%, 0.15)',
    ];

    chords.forEach((chord, i) => {
      const startX = (chord.startTime / duration) * width;
      const endX = (chord.endTime / duration) * width;
      ctx.fillStyle = chordColors[i % chordColors.length];
      ctx.fillRect(startX, 0, endX - startX, height);
    });

    // Draw waveform
    waveformData.forEach((value, i) => {
      const x = i * barWidth;
      const barHeight = value * (height * 0.8);
      const y = (height - barHeight) / 2;
      const progress = i / waveformData.length;

      const primaryColor = getCSSColor('--primary', '220, 90%, 56%');
      const mutedColor = getCSSColor('--muted-foreground', '220, 9%, 46%');
      
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      if (progress < playProgress) {
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, toHsla(primaryColor, 0.7));
      } else {
        gradient.addColorStop(0, toHsla(mutedColor, 0.4));
        gradient.addColorStop(1, toHsla(mutedColor, 0.2));
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x + 1, y, Math.max(barWidth - 2, 2), barHeight, 2);
      ctx.fill();
    });

    // Draw playhead with glow
    if (isPlaying || currentTime > 0) {
      const playheadX = playProgress * width;
      
      // Glow effect
      ctx.shadowColor = 'hsl(var(--primary))';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fillRect(playheadX - 1.5, 0, 3, height);
      ctx.shadowBlur = 0;
    }
  }, [waveformData, currentTime, duration, chords, isPlaying]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  const togglePlayback = useCallback(() => {
    tap();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, tap]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    selectionChanged();
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const time = progress * duration;
    
    audio.currentTime = time;
    setCurrentTime(time);
  }, [duration, selectionChanged]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    audio.volume = newVolume;
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    tap();
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume, tap]);

  const skipTime = useCallback((seconds: number) => {
    selectionChanged();
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  }, [duration, selectionChanged]);

  // Find current and next chord
  const currentChord = chords.find(c => currentTime >= c.startTime && currentTime < c.endTime);
  const currentChordIndex = chords.findIndex(c => currentTime >= c.startTime && currentTime < c.endTime);
  const nextChord = currentChordIndex >= 0 && currentChordIndex < chords.length - 1 
    ? chords[currentChordIndex + 1] 
    : null;

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <audio ref={audioRef} src={audioUrl} className="hidden" />

      {/* Current Chord Display */}
      <div className="flex items-center justify-center gap-6">
        <AnimatePresence mode="wait">
          {currentChord && (
            <motion.div
              key={currentChord.chord}
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="flex items-center gap-4"
            >
              <ChordDiagramEnhanced 
                chord={currentChord.chord} 
                size="lg" 
                isActive 
                animated
                showFingers
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {nextChord && (
          <div className="flex flex-col items-center opacity-50">
            <span className="text-xs text-muted-foreground mb-1">Следующий</span>
            <ChordDiagramEnhanced 
              chord={nextChord.chord} 
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Waveform */}
      <div className="relative">
        {isLoading ? (
          <div className="h-24 bg-muted/30 rounded-xl animate-pulse" />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-24 cursor-pointer rounded-xl"
            onClick={handleSeek}
          />
        )}
        
        {/* Time display */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs font-mono text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => skipTime(-10)}
            className="h-10 w-10 rounded-full"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            size="icon"
            variant={isPlaying ? "secondary" : "default"}
            onClick={togglePlayback}
            className="h-14 w-14 rounded-full shadow-lg"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => skipTime(10)}
            className="h-10 w-10 rounded-full"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-32">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="h-8 w-8"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.01}
            className="flex-1"
          />
        </div>
      </div>
    </Card>
  );
}
