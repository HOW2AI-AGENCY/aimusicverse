import { useRef, useEffect, useState, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2 } from 'lucide-react';
import type { ChordData } from '@/hooks/useGuitarAnalysis';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';

interface WaveformWithChordsProps {
  audioUrl: string;
  chords: ChordData[];
  duration: number;
  className?: string;
}

export function WaveformWithChords({ 
  audioUrl, 
  chords, 
  duration,
  className 
}: WaveformWithChordsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate waveform data from audio
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
        const samples = 200;
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
        
        // Normalize
        const max = Math.max(...waveform);
        setWaveformData(waveform.map(v => v / max));
        audioContext.close();
      } catch {
        // Fallback: generate placeholder waveform
        // Fallback: generate placeholder waveform
        setWaveformData(Array(200).fill(0).map(() => Math.random() * 0.5 + 0.3));
      } finally {
        setIsLoading(false);
      }
    };

    if (audioUrl) {
      generateWaveform();
    }
  }, [audioUrl]);

  // Draw waveform with chords
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

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw chord regions
    const chordColors = [
      'rgba(147, 51, 234, 0.15)',  // purple
      'rgba(59, 130, 246, 0.15)',   // blue
      'rgba(16, 185, 129, 0.15)',   // green
      'rgba(245, 158, 11, 0.15)',   // amber
      'rgba(236, 72, 153, 0.15)',   // pink
    ];

    chords.forEach((chord, i) => {
      const startX = (chord.startTime / duration) * width;
      const endX = (chord.endTime / duration) * width;
      ctx.fillStyle = chordColors[i % chordColors.length];
      ctx.fillRect(startX, 0, endX - startX, height);
    });

    // Draw waveform bars
    waveformData.forEach((value, i) => {
      const x = i * barWidth;
      const barHeight = value * (height * 0.7);
      const y = (height - barHeight) / 2;
      const progress = i / waveformData.length;

      if (progress < playProgress) {
        ctx.fillStyle = 'hsl(var(--primary))';
      } else {
        ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.3)';
      }
      
      ctx.beginPath();
      ctx.roundRect(x + 1, y, Math.max(barWidth - 2, 1), barHeight, 1);
      ctx.fill();
    });

    // Draw playhead
    if (isPlaying || currentTime > 0) {
      const playheadX = playProgress * width;
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fillRect(playheadX - 1, 0, 2, height);
    }

  }, [waveformData, currentTime, duration, chords, isPlaying]);

  // Update current time during playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const time = progress * duration;
    
    audio.currentTime = time;
    setCurrentTime(time);
  };

  // Find current chord
  const currentChord = chords.find(
    c => currentTime >= c.startTime && currentTime < c.endTime
  );

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-3 mb-3">
        <Button
          size="icon"
          variant={isPlaying ? "secondary" : "default"}
          onClick={togglePlayback}
          className="h-10 w-10 rounded-full shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatTime(currentTime)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {formatTime(duration)}
            </span>
          </div>
        </div>

        {currentChord && (
          <Badge variant="default" className="text-sm font-mono">
            {currentChord.chord}
          </Badge>
        )}
      </div>

      <audio ref={audioRef} src={audioUrl} className="hidden" />

      <div className="relative">
        {isLoading ? (
          <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-20 cursor-pointer rounded-lg"
            onClick={handleCanvasClick}
          />
        )}
      </div>

      {/* Chord labels below waveform */}
      {chords.length > 0 && (
        <div className="relative h-6 mt-2">
          {chords.slice(0, 12).map((chord, i) => {
            const left = (chord.startTime / duration) * 100;
            const width = ((chord.endTime - chord.startTime) / duration) * 100;
            return (
              <div
                key={i}
                className="absolute text-xs text-center truncate px-0.5"
                style={{ 
                  left: `${left}%`, 
                  width: `${Math.max(width, 3)}%`,
                }}
              >
                <span className={cn(
                  "font-mono",
                  currentChord?.chord === chord.chord && "text-primary font-semibold"
                )}>
                  {chord.chord}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
