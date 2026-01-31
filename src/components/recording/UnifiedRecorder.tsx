/**
 * UnifiedRecorder - Main unified recording component
 * 
 * Replaces fragmented recording UIs across the app with a single,
 * reusable, and feature-complete recording interface.
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedRecording, RecordingMode } from '@/hooks/audio/useUnifiedRecording';
import { RecordingVisualizer } from './RecordingVisualizer';
import { RecordingControls } from './RecordingControls';
import { RecordingTypeSelector } from './RecordingTypeSelector';
import { RecordingPreview } from './RecordingPreview';

export interface UnifiedRecorderProps {
  /** Recording mode preset */
  mode?: RecordingMode;
  /** Allow user to change mode */
  showModeSelector?: boolean;
  /** Maximum recording duration in seconds (0 = unlimited) */
  maxDuration?: number;
  /** Show pause/resume button */
  showPauseButton?: boolean;
  /** Visualizer variant */
  visualizerVariant?: 'bars' | 'waveform' | 'combined';
  /** Show preview after recording */
  showPreview?: boolean;
  /** Show download button in preview */
  showDownload?: boolean;
  /** Callback when recording completes */
  onRecordingComplete?: (blob: Blob, duration: number) => void | Promise<void>;
  /** Callback when recording starts */
  onRecordingStart?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Additional class names */
  className?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Control size */
  size?: 'sm' | 'md' | 'lg';
}

export const UnifiedRecorder = memo(function UnifiedRecorder({
  mode: initialMode = 'general',
  showModeSelector = true,
  maxDuration = 0,
  showPauseButton = true,
  visualizerVariant = 'bars',
  showPreview = true,
  showDownload = true,
  onRecordingComplete,
  onRecordingStart,
  onError,
  className,
  compact = false,
  size = 'md',
}: UnifiedRecorderProps) {
  const [mode, setMode] = useState<RecordingMode>(initialMode);

  const {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    waveformData,
    audioBlob,
    audioUrl,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useUnifiedRecording({
    mode,
    maxDuration,
    onRecordingStart,
    onRecordingStop: onRecordingComplete,
    onError,
  });

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleModeChange = useCallback((newMode: RecordingMode) => {
    if (!isRecording) {
      setMode(newMode);
    }
  }, [isRecording]);

  if (!isSupported) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center gap-2 p-6 text-center',
        className
      )}>
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Запись аудио не поддерживается в этом браузере
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          hasRecording={!!audioBlob}
          onStart={startRecording}
          onStop={stopRecording}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onReset={resetRecording}
          showPauseButton={showPauseButton}
          showResetButton={false}
          size="sm"
        />
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-primary"
                  animate={{ 
                    height: Math.max(4, (audioLevel / 100) * 20 * (0.5 + Math.random() * 0.5))
                  }}
                  transition={{ duration: 0.05 }}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {formatDuration(duration)}
            </span>
          </div>
        )}

        {audioBlob && !isRecording && (
          <span className="text-xs text-muted-foreground">
            Записано {formatDuration(duration)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Mode Selector */}
      {showModeSelector && !isRecording && !audioBlob && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <RecordingTypeSelector
            value={mode}
            onChange={handleModeChange}
            disabled={isRecording}
            size={size === 'lg' ? 'md' : 'sm'}
          />
        </motion.div>
      )}

      {/* Visualizer */}
      <AnimatePresence mode="wait">
        {(isRecording || audioLevel > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center"
          >
            <RecordingVisualizer
              audioLevel={audioLevel}
              waveformData={waveformData}
              isRecording={isRecording}
              isPaused={isPaused}
              variant={visualizerVariant}
              height={size === 'lg' ? 80 : size === 'md' ? 64 : 48}
              barCount={size === 'lg' ? 24 : 16}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duration Display */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={cn(
              'font-mono tabular-nums',
              size === 'lg' ? 'text-2xl' : 'text-lg',
              isPaused ? 'text-muted-foreground' : 'text-foreground'
            )}>
              {formatDuration(duration)}
            </span>
            {maxDuration > 0 && (
              <span className="text-sm text-muted-foreground">
                / {formatDuration(maxDuration)}
              </span>
            )}
            {isPaused && (
              <span className="text-sm text-yellow-500 font-medium">
                (пауза)
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <RecordingControls
        isRecording={isRecording}
        isPaused={isPaused}
        hasRecording={!!audioBlob}
        onStart={startRecording}
        onStop={stopRecording}
        onPause={pauseRecording}
        onResume={resumeRecording}
        onReset={resetRecording}
        showPauseButton={showPauseButton}
        size={size}
      />

      {/* Preview */}
      {showPreview && audioBlob && !isRecording && (
        <RecordingPreview
          audioUrl={audioUrl}
          audioBlob={audioBlob}
          duration={duration}
          waveformData={waveformData}
          onReset={resetRecording}
          showDownload={showDownload}
        />
      )}
    </div>
  );
});

export default UnifiedRecorder;
