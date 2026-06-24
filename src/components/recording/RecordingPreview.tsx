/**
 * RecordingPreview - Playback preview of recorded audio
 */

import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecordingPreviewProps {
  audioUrl: string | null;
  audioBlob: Blob | null;
  duration: number;
  waveformData?: number[];
  onReset?: () => void;
  onDownload?: () => void;
  className?: string;
  showDownload?: boolean;
}

export const RecordingPreview = memo(function RecordingPreview({
  audioUrl,
  audioBlob,
  duration,
  waveformData = [],
  onReset,
  onDownload,
  className,
  showDownload = true,
}: RecordingPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);

  // Handle audio element
  useEffect(() => {
    if (!audioUrl) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleDownload = useCallback(() => {
    if (!audioBlob) return;
    
    if (onDownload) {
      onDownload();
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [audioBlob, onDownload]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  if (!audioUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border bg-card p-4',
        className
      )}
    >
      {/* Waveform with progress */}
      {waveformData.length > 0 && (
        <div className="relative mb-3 h-12 overflow-hidden rounded bg-muted/50">
          <div className="absolute inset-0 flex items-center justify-center gap-px">
            {waveformData.map((value, i) => {
              const barProgress = (i / waveformData.length) * 100;
              const isPassed = barProgress <= progress;
              return (
                <div
                  key={i}
                  className={cn(
                    'w-1 rounded-full transition-colors',
                    isPassed ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                  style={{ height: `${Math.max(4, value * 40)}px` }}
                />
              );
            })}
          </div>
          {/* Progress overlay */}
          <div 
            className="absolute top-0 left-0 h-full bg-primary/10 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayback}
            className="h-10 w-10 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <span className="text-sm text-muted-foreground font-mono min-w-[80px]">
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showDownload && audioBlob && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-9 w-9"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {onReset && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="h-9 w-9"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default RecordingPreview;
