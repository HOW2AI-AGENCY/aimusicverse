/**
 * BeatGridVisualizer - Visual beat tracking overlay for guitar analysis
 * Shows beats, downbeats, and BPM from klang.io analysis
 * Mobile-optimized with touch-friendly interactions
 */

import { useRef, useEffect, useState, useId } from 'react';
import { motion } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Music, PlayCircle, PauseCircle, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BeatData } from '@/hooks/useGuitarAnalysis';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';

interface BeatGridVisualizerProps {
  beats: BeatData[];
  downbeats: number[];
  bpm: number;
  audioUrl?: string;
  duration: number;
  className?: string;
}

export function BeatGridVisualizer({
  beats,
  downbeats,
  bpm,
  audioUrl,
  duration,
  className,
}: BeatGridVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);
  const sourceId = useId();
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Register for studio audio coordination
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      registerStudioAudio(sourceId, () => {
        audio.pause();
        setIsPlaying(false);
      });
    }
    return () => unregisterStudioAudio(sourceId);
  }, [sourceId]);

  // Pause if global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [globalIsPlaying, isPlaying]);

  // Draw beat grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || beats.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const beatHeight = height * 0.6;
    const downbeatHeight = height * 0.9;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Grid background
    ctx.fillStyle = 'rgba(100, 100, 100, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Draw all beats
    beats.forEach((beat) => {
      const x = (beat.time / duration) * width;
      const isDownbeat = downbeats.some(db => Math.abs(db - beat.time) < 0.05);
      
      // Beat line
      ctx.strokeStyle = isDownbeat 
        ? 'rgba(239, 68, 68, 0.6)'  // red for downbeats
        : 'rgba(59, 130, 246, 0.4)'; // blue for regular beats
      ctx.lineWidth = isDownbeat ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, height - (isDownbeat ? downbeatHeight : beatHeight));
      ctx.lineTo(x, height);
      ctx.stroke();

      // Beat marker
      ctx.fillStyle = isDownbeat 
        ? 'rgba(239, 68, 68, 0.8)'
        : 'rgba(59, 130, 246, 0.6)';
      ctx.beginPath();
      ctx.arc(x, height - (isDownbeat ? downbeatHeight : beatHeight), isDownbeat ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Progress indicator
    if (currentTime > 0) {
      const progressX = (currentTime / duration) * width;
      
      // Progress line
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)'; // green
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Progress marker
      ctx.fillStyle = 'rgba(34, 197, 94, 1)';
      ctx.beginPath();
      ctx.arc(progressX, height / 2, 6, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(progressX, height / 2, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [beats, downbeats, duration, currentTime]);

  // Animation loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    };

    animationRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying]);

  // Handle audio events
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      pauseTrack();
      pauseAllStudioAudio(sourceId);
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekTime = (x / rect.width) * duration;
    
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Calculate time signature from beats
  const timeSignature = downbeats.length >= 2 && beats.length > 0
    ? `${Math.round(beats.filter(b => 
        b.time >= downbeats[0] && b.time < downbeats[1]
      ).length) || 4}/4`
    : '4/4';

  return (
    <Card className={cn("p-4 space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold">Ритм-сетка</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {bpm} BPM
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            {timeSignature}
          </Badge>
        </div>
      </div>

      {/* Canvas Visualizer */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleSeek}
          className="w-full h-24 rounded-md border border-border bg-muted/20 cursor-pointer touch-manipulation"
          style={{ touchAction: 'none' }}
        />
        
        {/* Overlay info */}
        {!isPlaying && currentTime === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
              Нажмите для воспроизведения
            </div>
          </motion.div>
        )}
      </div>

      {/* Audio Controls */}
      {audioUrl && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayPause}
              className="flex-none touch-manipulation"
            >
              {isPlaying ? (
                <PauseCircle className="w-4 h-4 mr-1" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-1" />
              )}
              {isPlaying ? 'Пауза' : 'Играть'}
            </Button>
            
            <div className="flex-1 text-xs text-muted-foreground font-mono tabular-nums">
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Music className="w-3 h-3" />
              {beats.length} битов
            </div>
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Сильные доли</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Биты</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Позиция</span>
        </div>
      </div>
    </Card>
  );
}
