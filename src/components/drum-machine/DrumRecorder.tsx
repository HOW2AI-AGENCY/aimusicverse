import React, { memo, useRef, useState, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Circle, Square, Download, Trash2, AudioLines, Upload } from 'lucide-react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';

interface DrumRecorderProps {
  recordingState: 'idle' | 'recording' | 'recorded';
  recordedAudioUrl: string | null;
  recordedAudioBlob: Blob | null;
  isPlaying: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  onClearRecording: () => void;
  onUseAsReference?: (blob: Blob) => void;
  className?: string;
}

export const DrumRecorder = memo(function DrumRecorder({
  recordingState,
  recordedAudioUrl,
  recordedAudioBlob,
  isPlaying,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  onUseAsReference,
  className
}: DrumRecorderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const sourceId = useId();
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Register for studio audio coordination
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      registerStudioAudio(sourceId, () => {
        audio.pause();
      });
    }
    return () => unregisterStudioAudio(sourceId);
  }, [sourceId]);

  // Pause if global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [globalIsPlaying, isPlaying]);

  // Recording timer
  useEffect(() => {
    if (recordingState === 'recording') {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 100);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 100);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs}`;
  };

  const handleDownload = () => {
    if (!recordedAudioUrl) return;
    const a = document.createElement('a');
    a.href = recordedAudioUrl;
    a.download = `drum-recording-${Date.now()}.webm`;
    a.click();
  };

  const handleUseAsReference = () => {
    if (recordedAudioBlob && onUseAsReference) {
      onUseAsReference(recordedAudioBlob);
    }
  };

  return (
    <div className={cn('flex items-center gap-2 p-2 bg-muted/50 rounded-lg', className)}>
      {/* Record controls */}
      <div className="flex items-center gap-1.5">
        {recordingState === 'idle' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onStartRecording}
            disabled={!isPlaying}
            className="h-8 gap-1.5"
            title={!isPlaying ? 'Запустите воспроизведение для записи' : 'Начать запись'}
          >
            <Circle className="w-3.5 h-3.5 fill-destructive text-destructive" />
            <span className="text-xs">REC</span>
          </Button>
        )}

        {recordingState === 'recording' && (
          <>
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopRecording}
              className="h-8 gap-1.5 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs">Стоп</span>
            </Button>
            <div className="flex items-center gap-1.5 px-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs font-mono tabular-nums text-destructive">
                {formatTime(recordingTime)}
              </span>
            </div>
          </>
        )}

        {recordingState === 'recorded' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onStartRecording}
              disabled={!isPlaying}
              className="h-8 gap-1.5"
            >
              <Circle className="w-3.5 h-3.5 fill-destructive text-destructive" />
              <span className="text-xs">REC</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearRecording}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* Playback & export */}
      {recordingState === 'recorded' && recordedAudioUrl && (
        <div className="flex items-center gap-2 flex-1">
          <audio
            ref={audioRef}
            src={recordedAudioUrl}
            controls
            className="h-8 flex-1 max-w-[200px]"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-xs hidden sm:inline">WAV</span>
          </Button>

          {onUseAsReference && recordedAudioBlob && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUseAsReference}
              className="h-8 gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="text-xs hidden sm:inline">Референс</span>
            </Button>
          )}
        </div>
      )}

      {/* Idle state hint */}
      {recordingState === 'idle' && !isPlaying && (
        <span className="text-[10px] text-muted-foreground">
          Запустите воспроизведение для записи
        </span>
      )}
    </div>
  );
});
