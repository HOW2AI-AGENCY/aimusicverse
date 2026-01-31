/**
 * RecordingControls - Start/Stop/Pause controls for recording
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset?: () => void;
  showPauseButton?: boolean;
  showResetButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-16 w-16',
};

const iconSizes = {
  sm: 18,
  md: 24,
  lg: 28,
};

export const RecordingControls = memo(function RecordingControls({
  isRecording,
  isPaused,
  hasRecording,
  onStart,
  onStop,
  onPause,
  onResume,
  onReset,
  showPauseButton = true,
  showResetButton = true,
  size = 'md',
  className,
  disabled = false,
}: RecordingControlsProps) {
  const iconSize = iconSizes[size];

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <AnimatePresence mode="wait">
        {/* Reset button - show when has recording and not recording */}
        {showResetButton && hasRecording && !isRecording && onReset && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={onReset}
              className={cn(sizeClasses[size], 'rounded-full')}
              disabled={disabled}
            >
              <RotateCcw size={iconSize - 4} />
            </Button>
          </motion.div>
        )}

        {/* Pause/Resume button */}
        {showPauseButton && isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={isPaused ? onResume : onPause}
              className={cn(sizeClasses[size], 'rounded-full')}
              disabled={disabled}
            >
              {isPaused ? (
                <Play size={iconSize - 4} />
              ) : (
                <Pause size={iconSize - 4} />
              )}
            </Button>
          </motion.div>
        )}

        {/* Main record/stop button */}
        <motion.div
          key={isRecording ? 'stop' : 'record'}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Button
            size="icon"
            onClick={isRecording ? onStop : onStart}
            className={cn(
              sizeClasses[size],
              'rounded-full transition-all',
              isRecording 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'bg-primary hover:bg-primary/90'
            )}
            disabled={disabled}
          >
            {isRecording ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <Square size={iconSize - 6} className="fill-current" />
              </motion.div>
            ) : (
              <motion.div
                animate={hasRecording ? {} : { 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  repeat: hasRecording ? 0 : Infinity, 
                  duration: 2 
                }}
              >
                <Mic size={iconSize} />
              </motion.div>
            )}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

export default RecordingControls;
